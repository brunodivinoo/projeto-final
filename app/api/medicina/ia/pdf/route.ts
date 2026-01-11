// API Route - Análise de PDFs PREPARAMED

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { PlanoIA, verificarLimiteIA, incrementarUsoIA, calcularCusto } from '@/lib/ai'
import { PROMPT_ANALISAR_PDF, SYSTEM_PROMPT_RESIDENCIA } from '@/lib/ai/prompts'
import { MODELOS } from '@/lib/ai/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// ==========================================
// POST - Analisar PDF
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      pdf_base64,
      pergunta,
      tipo_documento,
      conversa_id
    } = body

    if (!user_id || !pdf_base64) {
      return NextResponse.json(
        { error: 'user_id e pdf_base64 são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar plano do usuário
    const { data: profile } = await supabase
      .from('profiles_med')
      .select('plano')
      .eq('id', user_id)
      .single()

    const plano = (profile?.plano || 'gratuito') as PlanoIA

    // Verificar se plano permite PDF
    if (plano !== 'residencia') {
      return NextResponse.json(
        { error: 'Análise de PDFs disponível apenas no plano Residência' },
        { status: 403 }
      )
    }

    // Verificar limite
    const { permitido, usado, limite } = await verificarLimiteIA(user_id, plano, 'pdfs')
    if (!permitido) {
      return NextResponse.json(
        {
          error: `Limite de análises de PDF atingido (${usado}/${limite})`,
          usado,
          limite
        },
        { status: 429 }
      )
    }

    // Construir prompt específico para o tipo de documento
    let promptFinal = PROMPT_ANALISAR_PDF

    if (tipo_documento) {
      const tiposDocumento: Record<string, string> = {
        artigo_cientifico: `Analise este artigo científico médico:
1. IDENTIFICAÇÃO: Título, autores, revista, ano de publicação
2. OBJETIVO: Qual a pergunta de pesquisa ou objetivo principal?
3. METODOLOGIA: Tipo de estudo, população, intervenções, desfechos
4. RESULTADOS: Principais achados com dados numéricos relevantes
5. LIMITAÇÕES: Vieses e limitações metodológicas identificadas
6. CONCLUSÃO: Conclusões dos autores
7. RELEVÂNCIA CLÍNICA: Aplicabilidade prática dos achados
8. NÍVEL DE EVIDÊNCIA: Classificação do nível de evidência`,

        diretriz_clinica: `Analise esta diretriz clínica:
1. SOCIEDADE/INSTITUIÇÃO: Quem publicou esta diretriz?
2. TEMA: Qual condição ou procedimento é abordado?
3. POPULAÇÃO-ALVO: Para quais pacientes se aplica?
4. RECOMENDAÇÕES PRINCIPAIS: Liste as principais recomendações com nível de evidência
5. ALGORITMO: Se houver algoritmo de decisão, descreva-o
6. MEDICAMENTOS: Doses e esquemas terapêuticos recomendados
7. CONTRAINDICAÇÕES: Situações onde não se aplica
8. ATUALIZAÇÃO: Data da última atualização e próxima revisão`,

        caso_clinico: `Analise este caso clínico:
1. HISTÓRIA: Resumo da apresentação clínica
2. EXAME FÍSICO: Achados relevantes
3. EXAMES COMPLEMENTARES: Resultados laboratoriais e de imagem
4. DIAGNÓSTICOS DIFERENCIAIS: Liste e justifique
5. DIAGNÓSTICO FINAL: Qual o diagnóstico mais provável?
6. FISIOPATOLOGIA: Explique a fisiopatologia da condição
7. TRATAMENTO: Abordagem terapêutica adequada
8. PROGNÓSTICO: Expectativa de evolução`,

        prova_residencia: `Analise esta prova de residência médica:
1. INSTITUIÇÃO: Qual instituição aplicou a prova?
2. ANO: Ano da prova
3. TEMAS MAIS COBRADOS: Liste os principais temas por frequência
4. NÍVEL DE DIFICULDADE: Avaliação geral da dificuldade
5. QUESTÕES COMENTADAS: Comente as questões mais relevantes
6. DICAS DE ESTUDO: O que priorizar para esta instituição?
7. PADRÃO DE QUESTÕES: Estilo das questões (diretas, casos clínicos, etc.)
8. BIBLIOGRAFIA SUGERIDA: Fontes recomendadas para estudo`,

        bula_medicamento: `Analise esta bula de medicamento:
1. MEDICAMENTO: Nome comercial e princípio ativo
2. CLASSE: Classe farmacológica
3. MECANISMO DE AÇÃO: Como o medicamento funciona
4. INDICAÇÕES: Para que é indicado
5. POSOLOGIA: Doses recomendadas por indicação
6. CONTRAINDICAÇÕES: Quando não usar
7. INTERAÇÕES: Interações medicamentosas importantes
8. EFEITOS ADVERSOS: Principais efeitos colaterais
9. GESTAÇÃO/LACTAÇÃO: Segurança em gestantes e lactantes
10. AJUSTE DE DOSE: Ajustes em insuficiência renal/hepática`,

        exame_laboratorial: `Analise este laudo de exame laboratorial:
1. IDENTIFICAÇÃO: Dados do paciente (se disponíveis)
2. EXAMES REALIZADOS: Liste todos os exames
3. VALORES ALTERADOS: Destaque resultados fora da referência
4. INTERPRETAÇÃO: Significado clínico das alterações
5. CORRELAÇÕES: Relações entre os achados
6. HIPÓTESES: Possíveis causas das alterações
7. EXAMES ADICIONAIS: Sugestões de investigação complementar
8. URGÊNCIA: Há achados que demandam ação imediata?`
      }

      if (tiposDocumento[tipo_documento]) {
        promptFinal = tiposDocumento[tipo_documento]
      }
    }

    // Adicionar pergunta do usuário se houver
    const promptCompleto = pergunta
      ? `${promptFinal}\n\nPERGUNTA ESPECÍFICA DO USUÁRIO: ${pergunta}`
      : promptFinal

    // Chamar Claude com PDF
    const response = await anthropic.messages.create({
      model: MODELOS.claude.opus,
      max_tokens: 8192,
      system: SYSTEM_PROMPT_RESIDENCIA,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdf_base64
            }
          },
          {
            type: 'text',
            text: promptCompleto
          }
        ]
      }]
    })

    // Extrair resposta
    let analise = ''
    for (const block of response.content) {
      if (block.type === 'text') {
        analise += block.text
      }
    }

    const tokensInput = response.usage.input_tokens
    const tokensOutput = response.usage.output_tokens

    // Se houver conversa_id, salvar como mensagem
    if (conversa_id) {
      // Salvar mensagem do usuário
      await supabase
        .from('mensagens_ia_med')
        .insert({
          conversa_id,
          role: 'user',
          content: pergunta || 'Analise este PDF',
          has_pdf: true
        })

      // Salvar resposta
      await supabase
        .from('mensagens_ia_med')
        .insert({
          conversa_id,
          role: 'assistant',
          content: analise,
          tokens: tokensInput + tokensOutput
        })

      // Atualizar conversa
      await supabase
        .from('conversas_ia_med')
        .update({
          tokens_usados: tokensInput + tokensOutput,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversa_id)
    }

    // Incrementar uso
    const custo = calcularCusto(MODELOS.claude.opus, tokensInput, tokensOutput)
    await incrementarUsoIA(user_id, 'pdfs', 1, tokensInput, tokensOutput, custo)

    return NextResponse.json({
      success: true,
      analise,
      tipo_documento: tipo_documento || 'geral',
      tokens: {
        input: tokensInput,
        output: tokensOutput,
        total: tokensInput + tokensOutput
      },
      conversa_id
    })
  } catch (error) {
    console.error('Erro ao analisar PDF:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
