// API Route - Geração de Resumos IA PREPARAMED

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PlanoIA, verificarLimiteIA, incrementarUsoIA, calcularCusto } from '@/lib/ai'
import { PROMPT_GERAR_RESUMO, SYSTEM_PROMPT_PREMIUM, SYSTEM_PROMPT_RESIDENCIA } from '@/lib/ai/prompts'
import { MODELOS } from '@/lib/ai/config'
import { TOOL_GERAR_RESUMO } from '@/lib/ai/tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ==========================================
// POST - Gerar Resumo
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, tema, nivel_detalhe = 'intermediario', incluir_referencias = true } = body

    if (!user_id || !tema) {
      return NextResponse.json(
        { error: 'user_id e tema são obrigatórios' },
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

    // Verificar se plano permite
    if (plano === 'gratuito') {
      return NextResponse.json(
        { error: 'Geração de resumos não disponível no plano gratuito' },
        { status: 403 }
      )
    }

    // Verificar limite
    const { permitido, usado, limite } = await verificarLimiteIA(user_id, plano, 'resumos')
    if (!permitido) {
      return NextResponse.json(
        {
          error: `Limite de resumos atingido (${usado}/${limite})`,
          usado,
          limite
        },
        { status: 429 }
      )
    }

    // Construir prompt
    const promptCompleto = `${PROMPT_GERAR_RESUMO}

TEMA: ${tema}
NÍVEL DE DETALHE: ${nivel_detalhe}
${incluir_referencias ? 'Inclua referências bibliográficas e fontes recomendadas.' : ''}

Gere o resumo completo em formato Markdown.`

    let resumoConteudo: string
    let tokensInput = 0
    let tokensOutput = 0

    if (plano === 'residencia') {
      // CLAUDE - Usar structured output para resumo mais organizado
      const response = await anthropic.messages.create({
        model: MODELOS.claude.opus,
        max_tokens: 8192,
        system: SYSTEM_PROMPT_RESIDENCIA,
        tools: [TOOL_GERAR_RESUMO],
        tool_choice: { type: 'tool', name: 'gerar_resumo' },
        messages: [{ role: 'user', content: promptCompleto }]
      })

      tokensInput = response.usage.input_tokens
      tokensOutput = response.usage.output_tokens

      // Extrair resultado estruturado
      const toolUse = response.content.find(b => b.type === 'tool_use')

      if (toolUse && toolUse.type === 'tool_use') {
        const resultado = toolUse.input as {
          titulo: string
          topicos: Array<{ subtitulo: string; conteudo: string; pontos_chave?: string[] }>
          referencias?: string[]
        }

        // Converter para Markdown
        resumoConteudo = `# ${resultado.titulo}\n\n`

        for (const topico of resultado.topicos) {
          resumoConteudo += `## ${topico.subtitulo}\n\n`
          resumoConteudo += `${topico.conteudo}\n\n`

          if (topico.pontos_chave && topico.pontos_chave.length > 0) {
            resumoConteudo += `**Pontos-chave:**\n`
            for (const ponto of topico.pontos_chave) {
              resumoConteudo += `- ${ponto}\n`
            }
            resumoConteudo += '\n'
          }
        }

        if (resultado.referencias && resultado.referencias.length > 0) {
          resumoConteudo += `## Referências\n\n`
          for (const ref of resultado.referencias) {
            resumoConteudo += `- ${ref}\n`
          }
        }
      } else {
        // Fallback para texto direto
        const textBlock = response.content.find(b => b.type === 'text')
        resumoConteudo = textBlock && textBlock.type === 'text' ? textBlock.text : 'Erro ao gerar resumo'
      }
    } else {
      // GEMINI - Gerar resumo em Markdown
      const model = genAI.getGenerativeModel({
        model: MODELOS.gemini.flash,
        systemInstruction: SYSTEM_PROMPT_PREMIUM
      })

      const result = await model.generateContent(promptCompleto)
      resumoConteudo = result.response.text()

      // Estimar tokens
      tokensInput = Math.ceil(promptCompleto.length / 4)
      tokensOutput = Math.ceil(resumoConteudo.length / 4)
    }

    // Salvar resumo no banco
    const { data: resumo, error: saveError } = await supabase
      .from('resumos_ia_med')
      .insert({
        user_id,
        titulo: `Resumo: ${tema}`,
        tema,
        conteudo: resumoConteudo,
        formato: 'markdown',
        tokens_usados: tokensInput + tokensOutput
      })
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar resumo:', saveError)
    }

    // Incrementar uso
    const custo = calcularCusto(
      plano === 'residencia' ? MODELOS.claude.opus : 'gemini-flash',
      tokensInput,
      tokensOutput
    )
    await incrementarUsoIA(user_id, 'resumos', 1, tokensInput, tokensOutput, custo)

    return NextResponse.json({
      success: true,
      resumo: {
        id: resumo?.id,
        titulo: `Resumo: ${tema}`,
        conteudo: resumoConteudo,
        tokens: tokensInput + tokensOutput
      }
    })
  } catch (error) {
    console.error('Erro ao gerar resumo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// ==========================================
// GET - Listar Resumos do Usuário
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const resumo_id = searchParams.get('resumo_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (resumo_id) {
      // Buscar resumo específico
      const { data: resumo } = await supabase
        .from('resumos_ia_med')
        .select('*')
        .eq('id', resumo_id)
        .eq('user_id', user_id)
        .single()

      return NextResponse.json({ resumo })
    }

    // Listar todos os resumos
    const { data: resumos } = await supabase
      .from('resumos_ia_med')
      .select('id, titulo, tema, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ resumos })
  } catch (error) {
    console.error('Erro ao buscar resumos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ==========================================
// DELETE - Excluir Resumo
// ==========================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resumo_id = searchParams.get('resumo_id')
    const user_id = searchParams.get('user_id')

    if (!resumo_id || !user_id) {
      return NextResponse.json(
        { error: 'resumo_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    await supabase
      .from('resumos_ia_med')
      .delete()
      .eq('id', resumo_id)
      .eq('user_id', user_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar resumo:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
