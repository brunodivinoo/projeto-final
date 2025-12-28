import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

// POST - Gerar UMA questão da fila
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, simulado_id } = body

    if (!user_id || !simulado_id) {
      return NextResponse.json({ error: 'user_id e simulado_id são obrigatórios' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API de IA não configurada' }, { status: 500 })
    }

    // Buscar próximo item pendente da fila
    const { data: proximoItem, error: itemError } = await supabase
      .from('simulado_ia_fila')
      .select('*')
      .eq('simulado_id', simulado_id)
      .eq('user_id', user_id)
      .eq('status', 'pendente')
      .order('ordem', { ascending: true })
      .limit(1)
      .single()

    if (itemError || !proximoItem) {
      // Verificar se já concluiu
      const { count: pendentes } = await supabase
        .from('simulado_ia_fila')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', simulado_id)
        .eq('status', 'pendente')

      const { count: total } = await supabase
        .from('simulado_ia_fila')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', simulado_id)

      const { count: geradas } = await supabase
        .from('simulado_ia_fila')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', simulado_id)
        .eq('status', 'concluido')

      if (pendentes === 0) {
        // Atualizar status do simulado para pendente (pronto para iniciar)
        await supabase
          .from('simulados')
          .update({ status: 'pendente' })
          .eq('id', simulado_id)

        return NextResponse.json({
          concluido: true,
          total: total || 0,
          geradas: geradas || 0,
          message: 'Todas as questões foram geradas com sucesso!'
        })
      }

      return NextResponse.json({
        concluido: false,
        erro: true,
        message: 'Nenhum item pendente encontrado'
      })
    }

    // Marcar item como processando
    await supabase
      .from('simulado_ia_fila')
      .update({ status: 'processando' })
      .eq('id', proximoItem.id)

    // Gerar questão com Gemini
    const questao = await gerarQuestaoComGemini({
      disciplina: proximoItem.disciplina,
      assunto: proximoItem.assunto || '',
      subassunto: proximoItem.subassunto || '',
      banca: proximoItem.banca,
      modalidade: proximoItem.modalidade,
      dificuldade: proximoItem.dificuldade
    })

    if (!questao) {
      // Marcar como erro
      await supabase
        .from('simulado_ia_fila')
        .update({
          status: 'erro',
          erro_msg: 'Falha ao gerar questão com IA',
          processed_at: new Date().toISOString()
        })
        .eq('id', proximoItem.id)

      // Buscar contadores atualizados
      const { count: total } = await supabase
        .from('simulado_ia_fila')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', simulado_id)

      const { count: geradas } = await supabase
        .from('simulado_ia_fila')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', simulado_id)
        .eq('status', 'concluido')

      const { count: erros } = await supabase
        .from('simulado_ia_fila')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', simulado_id)
        .eq('status', 'erro')

      return NextResponse.json({
        concluido: false,
        erro: true,
        item_erro: proximoItem.ordem,
        total: total || 0,
        geradas: geradas || 0,
        erros: erros || 0,
        message: 'Erro ao gerar questão, tentando próxima...'
      })
    }

    // Inserir questão no banco
    const { data: questaoInserida, error: questaoError } = await supabase
      .from('questoes')
      .insert({
        enunciado: questao.enunciado,
        alternativas: questao.alternativas || null,
        resposta_correta: questao.resposta_correta,
        explicacao: questao.explicacao,
        disciplina: proximoItem.disciplina,
        assunto: proximoItem.assunto || null,
        subassunto: proximoItem.subassunto || null,
        banca: proximoItem.banca,
        dificuldade: proximoItem.dificuldade,
        modalidade: proximoItem.modalidade,
        fonte: 'ia',
        ano: new Date().getFullYear(),
        ativo: true
      })
      .select('id')
      .single()

    if (questaoError || !questaoInserida) {
      console.error('[GERAR QUESTAO IA] Erro ao inserir questão:', questaoError)

      await supabase
        .from('simulado_ia_fila')
        .update({
          status: 'erro',
          erro_msg: 'Erro ao salvar questão no banco',
          processed_at: new Date().toISOString()
        })
        .eq('id', proximoItem.id)

      return NextResponse.json({
        concluido: false,
        erro: true,
        message: 'Erro ao salvar questão'
      })
    }

    // Vincular questão ao simulado
    await supabase
      .from('simulado_questoes')
      .insert({
        simulado_id,
        questao_id: questaoInserida.id,
        ordem: proximoItem.ordem
      })

    // Atualizar item da fila como concluído
    await supabase
      .from('simulado_ia_fila')
      .update({
        status: 'concluido',
        questao_id: questaoInserida.id,
        processed_at: new Date().toISOString()
      })
      .eq('id', proximoItem.id)

    // Buscar contadores atualizados
    const { count: total } = await supabase
      .from('simulado_ia_fila')
      .select('*', { count: 'exact', head: true })
      .eq('simulado_id', simulado_id)

    const { count: geradas } = await supabase
      .from('simulado_ia_fila')
      .select('*', { count: 'exact', head: true })
      .eq('simulado_id', simulado_id)
      .eq('status', 'concluido')

    const { count: pendentes } = await supabase
      .from('simulado_ia_fila')
      .select('*', { count: 'exact', head: true })
      .eq('simulado_id', simulado_id)
      .eq('status', 'pendente')

    // Verificar se concluiu todas
    const concluido = pendentes === 0
    if (concluido) {
      await supabase
        .from('simulados')
        .update({ status: 'pendente' })
        .eq('id', simulado_id)

      // Registrar atividade de conclusão
      await supabase
        .from('historico_atividades')
        .insert({
          user_id,
          tipo: 'simulado_ia_concluido',
          descricao: `Simulado com IA gerado com sucesso`,
          detalhes: {
            simulado_id,
            total_questoes: geradas
          }
        })
    }

    return NextResponse.json({
      concluido,
      total: total || 0,
      geradas: geradas || 0,
      pendentes: pendentes || 0,
      item_atual: {
        ordem: proximoItem.ordem,
        disciplina: proximoItem.disciplina,
        assunto: proximoItem.assunto
      },
      message: concluido ? 'Simulado gerado com sucesso!' : `Questão ${geradas}/${total} gerada`
    })

  } catch (error) {
    console.error('[GERAR QUESTAO IA] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

async function gerarQuestaoComGemini(config: {
  disciplina: string
  assunto: string
  subassunto: string
  banca: string
  modalidade: string
  dificuldade: string
}): Promise<{
  enunciado: string
  alternativas?: Record<string, string>
  resposta_correta: string
  explicacao: string
} | null> {
  const MAX_TENTATIVAS = 3
  const isMultipla = config.modalidade === 'multipla_escolha'

  const prompt = isMultipla
    ? `Você é um especialista em elaborar questões de concursos públicos brasileiros.

CONFIGURAÇÃO:
- Disciplina: ${config.disciplina}
- Assunto: ${config.assunto || 'Geral'}
- Subassunto: ${config.subassunto || 'Geral'}
- Estilo da Banca: ${config.banca}
- Dificuldade: ${config.dificuldade}
- Modalidade: Múltipla Escolha (5 alternativas: A, B, C, D, E)

INSTRUÇÕES:
1. Crie UMA questão ORIGINAL no estilo da banca ${config.banca}
2. A questão deve ser de dificuldade ${config.dificuldade}
3. Inclua 5 alternativas (A a E), sendo apenas UMA correta
4. Elabore um comentário detalhado explicando o gabarito
5. A questão deve ser tecnicamente precisa e atualizada

FORMATO DE RESPOSTA (JSON):
{
  "enunciado": "texto completo do enunciado da questão",
  "alternativa_a": "texto da alternativa A",
  "alternativa_b": "texto da alternativa B",
  "alternativa_c": "texto da alternativa C",
  "alternativa_d": "texto da alternativa D",
  "alternativa_e": "texto da alternativa E",
  "gabarito": "A",
  "comentario": "explicação detalhada do gabarito, justificando por que a alternativa correta está certa e as demais estão erradas"
}

Retorne APENAS o JSON, sem markdown ou explicações.`
    : `Você é um especialista em elaborar questões de concursos públicos brasileiros.

CONFIGURAÇÃO:
- Disciplina: ${config.disciplina}
- Assunto: ${config.assunto || 'Geral'}
- Subassunto: ${config.subassunto || 'Geral'}
- Estilo da Banca: ${config.banca}
- Dificuldade: ${config.dificuldade}
- Modalidade: Certo ou Errado

INSTRUÇÕES:
1. Crie UMA questão ORIGINAL no estilo CESPE/CEBRASPE (Certo ou Errado)
2. A questão deve ser uma afirmação que pode ser julgada como CERTA ou ERRADA
3. A questão deve ser de dificuldade ${config.dificuldade}
4. Elabore um comentário detalhado explicando o gabarito

FORMATO DE RESPOSTA (JSON):
{
  "enunciado": "afirmação para julgar como certa ou errada",
  "gabarito": "C",
  "comentario": "explicação detalhada do gabarito"
}

REGRAS:
- gabarito deve ser "C" para CERTO ou "E" para ERRADO
- A afirmação deve ser clara e objetiva

Retorne APENAS o JSON, sem markdown ou explicações.`

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 2048
            }
          })
        }
      )

      if (!response.ok) {
        console.error(`[GERAR QUESTAO IA] Erro Gemini (tentativa ${tentativa}):`, response.status)
        if (tentativa < MAX_TENTATIVAS) {
          await delay(1000 * tentativa)
          continue
        }
        return null
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      // Parse JSON
      let questao
      try {
        questao = JSON.parse(text.trim())
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          questao = JSON.parse(jsonMatch[0])
        }
      }

      if (questao && questao.enunciado && questao.gabarito) {
        if (isMultipla) {
          return {
            enunciado: questao.enunciado,
            alternativas: {
              A: questao.alternativa_a,
              B: questao.alternativa_b,
              C: questao.alternativa_c,
              D: questao.alternativa_d,
              E: questao.alternativa_e
            },
            resposta_correta: questao.gabarito,
            explicacao: questao.comentario || ''
          }
        } else {
          return {
            enunciado: questao.enunciado,
            resposta_correta: questao.gabarito,
            explicacao: questao.comentario || ''
          }
        }
      }

      if (tentativa < MAX_TENTATIVAS) {
        await delay(500)
      }

    } catch (err) {
      console.error(`[GERAR QUESTAO IA] Erro (tentativa ${tentativa}):`, err)
      if (tentativa < MAX_TENTATIVAS) {
        await delay(1000 * tentativa)
      }
    }
  }

  return null
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
