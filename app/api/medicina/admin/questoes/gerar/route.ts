import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/admin/auth'
import { buildPromptQuestao, extrairJsonDaResposta, validarQuestaoGerada } from '@/lib/admin/questaoPrompts'
import { delay } from '@/lib/admin/rateLimit'

// Usar service role para operações admin
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// Intervalo entre questões (3 segundos)
const DELAY_ENTRE_QUESTOES = 3000

interface AssuntoInput {
  id: string
  nome: string
  sub_assuntos?: Array<{ id: string; nome: string }>
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      user_id,
      disciplina_id,
      disciplina_nome,
      assuntos,
      periodos,
      quantidade_por_assunto,
      tipo_questao
    } = body as {
      user_id: string
      disciplina_id: string
      disciplina_nome: string
      assuntos: AssuntoInput[]
      periodos: number[]
      quantidade_por_assunto: number
      tipo_questao: 'multipla_escolha' | 'caso_clinico'
    }

    // Verificar se usuário é admin
    const { data: profile } = await supabase
      .from('profiles_med')
      .select('email')
      .eq('id', user_id)
      .single()

    if (!profile || !isAdmin(profile.email)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Criar stream para logs em tempo real
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendLog = (type: string, data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
          )
        }

        let totalGeradas = 0
        let totalErros = 0
        const totalEstimado = assuntos.length * periodos.length * quantidade_por_assunto

        sendLog('inicio', {
          message: 'Iniciando geração de questões',
          total_estimado: totalEstimado
        })

        // Iterar por cada combinação
        for (const assunto of assuntos) {
          for (const periodo of periodos) {
            for (let i = 0; i < quantidade_por_assunto; i++) {
              // Aguardar rate limit
              if (totalGeradas > 0) {
                await delay(DELAY_ENTRE_QUESTOES)
              }

              const subAssunto = assunto.sub_assuntos?.[i % (assunto.sub_assuntos?.length || 1)]

              sendLog('gerando', {
                disciplina: disciplina_nome,
                assunto: assunto.nome,
                sub_assunto: subAssunto?.nome || null,
                periodo,
                numero: totalGeradas + 1
              })

              try {
                const inicioGeracao = Date.now()

                // Gerar questão com Claude
                const prompt = buildPromptQuestao({
                  disciplina: disciplina_nome,
                  assunto: assunto.nome,
                  subAssunto: subAssunto?.nome,
                  periodo,
                  tipoQuestao: tipo_questao
                })

                const response = await anthropic.messages.create({
                  model: 'claude-sonnet-4-20250514',
                  max_tokens: 4000,
                  messages: [{ role: 'user', content: prompt }]
                })

                const content = response.content[0]
                if (content.type !== 'text') {
                  throw new Error('Resposta inválida da IA')
                }

                // Extrair JSON da resposta
                const questaoData = extrairJsonDaResposta(content.text)
                if (!questaoData) {
                  throw new Error('JSON não encontrado na resposta')
                }

                // Validar questão
                const validacao = validarQuestaoGerada(questaoData)
                if (!validacao.valida) {
                  throw new Error(`Questão inválida: ${validacao.erros.join(', ')}`)
                }

                const tempoGeracao = Date.now() - inicioGeracao

                // Salvar questão no banco
                const { data: questaoSalva, error: errQuestao } = await supabase
                  .from('questoes_med')
                  .insert({
                    disciplina_id,
                    assunto_id: assunto.id,
                    subassunto_id: subAssunto?.id || null,
                    enunciado: questaoData.enunciado,
                    alternativas: questaoData.alternativas,
                    gabarito: questaoData.resposta_correta,
                    explicacao: questaoData.gabarito_comentado,
                    periodo_dificuldade: periodo,
                    fonte_principal: questaoData.fontes_consultadas?.[0]?.titulo || null,
                    referencia_abnt: questaoData.referencia_abnt,
                    palavras_chave: questaoData.palavras_chave,
                    gerado_por_ia: true,
                    modelo_ia: 'claude-sonnet-4-20250514',
                    revisado: false,
                    created_by: user_id,
                    ativo: true
                  })
                  .select()
                  .single()

                if (errQuestao) {
                  throw errQuestao
                }

                // Log de sucesso no banco
                await supabase
                  .from('admin_geracao_logs_med')
                  .insert({
                    questao_id: questaoSalva.id,
                    disciplina_id,
                    assunto_id: assunto.id,
                    periodo,
                    status: 'sucesso',
                    tokens_usados: response.usage.input_tokens + response.usage.output_tokens,
                    tempo_geracao_ms: tempoGeracao
                  })

                totalGeradas++

                sendLog('sucesso', {
                  questao_id: questaoSalva.id,
                  enunciado_preview: questaoData.enunciado.substring(0, 100) + '...',
                  tempo_ms: tempoGeracao,
                  tokens: response.usage.input_tokens + response.usage.output_tokens,
                  total_geradas: totalGeradas
                })

              } catch (error) {
                totalErros++
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

                // Log de erro no banco
                await supabase
                  .from('admin_geracao_logs_med')
                  .insert({
                    disciplina_id,
                    assunto_id: assunto.id,
                    periodo,
                    status: 'erro',
                    erro_mensagem: errorMessage
                  })

                sendLog('erro', {
                  assunto: assunto.nome,
                  periodo,
                  erro: errorMessage,
                  total_erros: totalErros
                })

                // Se muitos erros seguidos, pausar mais
                if (totalErros > 5) {
                  sendLog('aviso', { message: 'Muitos erros, aguardando 10 segundos...' })
                  await delay(10000)
                }
              }
            }
          }
        }

        sendLog('concluido', {
          total_geradas: totalGeradas,
          total_erros: totalErros,
          message: `Geração concluída! ${totalGeradas} questões criadas, ${totalErros} erros.`
        })

        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Erro na geração:', error)
    return NextResponse.json(
      { error: 'Erro ao iniciar geração' },
      { status: 500 }
    )
  }
}
