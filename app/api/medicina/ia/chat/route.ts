// API Route - Chat IA PREPARAMED com Streaming

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  PlanoIA,
  LIMITES_IA,
  verificarLimiteIA,
  incrementarUsoIA,
  calcularCusto
} from '@/lib/ai'
import { SYSTEM_PROMPT_PREMIUM, SYSTEM_PROMPT_RESIDENCIA } from '@/lib/ai/prompts'
import { MODELOS, DOMINIOS_MEDICOS } from '@/lib/ai/config'
import { PREPARAMED_TOOLS, executarTool } from '@/lib/ai/tools'

// Formatar resposta de tool para exibição
function formatToolResponse(toolName: string, data: unknown): string {
  const resultado = data as Record<string, unknown>

  switch (toolName) {
    case 'buscar_questoes': {
      const questoes = resultado.questoes as Array<Record<string, unknown>>
      if (!questoes || questoes.length === 0) {
        return '\n\n📚 Não encontrei questões com esses critérios. Tente outros filtros.\n'
      }
      let texto = `\n\n📚 **Encontrei ${questoes.length} questões:**\n\n`
      questoes.forEach((q, i) => {
        texto += `**${i + 1}.** ${String(q.enunciado).substring(0, 200)}...\n`
        texto += `   📌 Banca: ${(q.banca as Record<string, string>)?.nome || 'N/A'} | Ano: ${q.ano || 'N/A'}\n\n`
      })
      return texto
    }

    case 'calcular_imc': {
      return `\n\n📊 **Cálculo de IMC:**
- Peso: ${resultado.peso_kg} kg
- Altura: ${resultado.altura_m} m
- **IMC: ${resultado.imc}**
- Classificação: **${resultado.classificacao}**
- ${resultado.recomendacao}\n`
    }

    case 'criar_plano_estudos': {
      const plano = resultado as Record<string, unknown>
      return `\n\n📅 **Plano de Estudos para ${plano.prova_alvo}:**
- Dias até a prova: ${plano.dias_ate_prova}
- Horas/dia: ${plano.horas_por_dia}
- ${(plano.sugestoes as Record<string, unknown>)?.foco_principal}
- Simulados: ${(plano.sugestoes as Record<string, unknown>)?.simulados}\n`
    }

    case 'explicar_questao': {
      const questao = resultado.questao as Record<string, unknown>
      if (!questao) {
        return '\n\n❌ Questão não encontrada.\n'
      }
      return `\n\n📝 **Questão encontrada:**\n${questao.enunciado}\n\n**Explicação:** ${questao.explicacao || 'Explicação não disponível'}\n`
    }

    default:
      return `\n\n✅ Ferramenta ${toolName} executada com sucesso.\n`
  }
}

// Clientes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ==========================================
// POST - Enviar Mensagem com Streaming
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      mensagem,
      conversa_id,
      imagem_base64,
      imagem_tipo,
      pdf_base64,
      use_web_search,
      use_extended_thinking,
      thinking_budget
    } = body

    if (!user_id || !mensagem) {
      return NextResponse.json(
        { error: 'user_id e mensagem são obrigatórios' },
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

    // Verificar se plano permite IA (gratuito agora tem 10 chats grátis)
    const limites = LIMITES_IA[plano]
    if (limites.chats_mes === 0) {
      return NextResponse.json(
        { error: 'Plano gratuito não tem acesso à IA. Faça upgrade para Premium ou Residência.' },
        { status: 403 }
      )
    }

    // Verificar limite de chats
    const { permitido, usado, limite } = await verificarLimiteIA(user_id, plano, 'chats')
    if (!permitido) {
      return NextResponse.json(
        {
          error: `Limite de mensagens atingido (${usado}/${limite}). Aguarde o próximo mês ou faça upgrade.`,
          usado,
          limite
        },
        { status: 429 }
      )
    }

    // Verificar funcionalidades específicas por plano
    if (imagem_base64 && !limites.vision) {
      return NextResponse.json(
        { error: 'Análise de imagens disponível apenas no plano Residência' },
        { status: 403 }
      )
    }

    if (pdf_base64 && !limites.pdf_support) {
      return NextResponse.json(
        { error: 'Análise de PDFs disponível apenas no plano Residência' },
        { status: 403 }
      )
    }

    if (use_web_search && !limites.web_search) {
      return NextResponse.json(
        { error: 'Busca na web disponível apenas no plano Residência' },
        { status: 403 }
      )
    }

    if (use_extended_thinking && !limites.extended_thinking) {
      return NextResponse.json(
        { error: 'Extended Thinking disponível apenas no plano Residência' },
        { status: 403 }
      )
    }

    // Buscar ou criar conversa
    let conversaAtual = conversa_id

    if (!conversaAtual) {
      // Criar nova conversa
      const { data: novaConversa, error: convError } = await supabase
        .from('conversas_ia_med')
        .insert({
          user_id,
          titulo: mensagem.substring(0, 50) + (mensagem.length > 50 ? '...' : ''),
          modelo: plano === 'residencia' ? 'claude' : 'gemini'
        })
        .select()
        .single()

      if (convError) {
        console.error('Erro ao criar conversa:', convError)
        return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 })
      }

      conversaAtual = novaConversa.id
    }

    // Buscar mensagens anteriores da conversa
    const { data: mensagensAnteriores } = await supabase
      .from('mensagens_ia_med')
      .select('role, content')
      .eq('conversa_id', conversaAtual)
      .order('created_at', { ascending: true })

    // Salvar mensagem do usuário
    await supabase
      .from('mensagens_ia_med')
      .insert({
        conversa_id: conversaAtual,
        role: 'user',
        content: mensagem,
        has_image: !!imagem_base64,
        has_pdf: !!pdf_base64
      })

    // Preparar histórico
    const historico = mensagensAnteriores?.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })) || []

    // Escolher modelo e fazer streaming
    // Premium = Sonnet | Residência = Opus (ambos Claude)
    return await streamClaude({
      historico,
      mensagem,
      conversa_id: conversaAtual,
      user_id,
      plano, // Passar plano para escolher modelo
      imagem_base64,
      imagem_tipo,
      pdf_base64,
      use_web_search,
      use_extended_thinking,
      thinking_budget
    })
  } catch (error) {
    console.error('Erro na API de chat:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ==========================================
// STREAMING COM CLAUDE
// ==========================================

interface StreamClaudeParams {
  historico: Array<{ role: 'user' | 'assistant'; content: string }>
  mensagem: string
  conversa_id: string
  user_id: string
  plano?: string
  imagem_base64?: string
  imagem_tipo?: string
  pdf_base64?: string
  use_web_search?: boolean
  use_extended_thinking?: boolean
  thinking_budget?: number
}

async function streamClaude(params: StreamClaudeParams) {
  const {
    historico,
    mensagem,
    conversa_id,
    user_id,
    imagem_base64,
    imagem_tipo,
    pdf_base64,
    use_web_search,
    use_extended_thinking,
    thinking_budget = 8000
  } = params

  // Preparar mensagens
  const messages: Anthropic.MessageParam[] = historico.map(m => ({
    role: m.role,
    content: m.content
  }))

  // Preparar conteúdo da mensagem atual
  const userContent: Anthropic.ContentBlockParam[] = []

  // Adicionar imagem se houver
  if (imagem_base64 && imagem_tipo) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: imagem_tipo as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: imagem_base64
      }
    })
  }

  // Adicionar PDF se houver
  if (pdf_base64) {
    userContent.push({
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: pdf_base64
      }
    } as Anthropic.DocumentBlockParam)
  }

  // Adicionar texto
  userContent.push({
    type: 'text',
    text: mensagem
  })

  messages.push({
    role: 'user',
    content: userContent
  })

  // Configurar tools - criar array separado para evitar problemas de tipo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [...PREPARAMED_TOOLS]
  if (use_web_search) {
    tools.push({
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 5,
      allowed_domains: DOMINIOS_MEDICOS
    })
  }

  // Configurar parâmetros
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const streamParams: any = {
    model: MODELOS.claude.opus,
    max_tokens: use_extended_thinking ? 16000 : 8192,
    system: SYSTEM_PROMPT_RESIDENCIA,
    messages,
    stream: true,
    tools: tools.length > 0 ? tools : undefined
  }

  if (use_extended_thinking) {
    streamParams.thinking = {
      type: 'enabled',
      budget_tokens: thinking_budget
    }
  }

  // Criar stream
  const stream = await anthropic.messages.stream(streamParams)

  // Criar encoder para streaming
  const encoder = new TextEncoder()

  // Stream response
  const readableStream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''
      let thinking = ''
      let tokensInput = 0
      let tokensOutput = 0
      const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = []
      let currentToolCall: { id: string; name: string; input: string } | null = null

      try {
        for await (const event of stream) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const evt = event as any

          if (evt.type === 'content_block_start') {
            if (evt.content_block?.type === 'tool_use') {
              currentToolCall = { id: evt.content_block.id, name: evt.content_block.name, input: '' }
            }
          } else if (evt.type === 'content_block_delta') {
            if (evt.delta.type === 'text_delta') {
              const text = evt.delta.text
              fullResponse += text

              // Enviar chunk
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
              )
            } else if (evt.delta.type === 'thinking_delta') {
              thinking += evt.delta.thinking || ''
            } else if (evt.delta.type === 'input_json_delta' && currentToolCall) {
              currentToolCall.input += evt.delta.partial_json || ''
            }
          } else if (evt.type === 'content_block_stop' && currentToolCall) {
            // Tool call completa, processar
            try {
              const toolInput = JSON.parse(currentToolCall.input || '{}')
              toolCalls.push({
                id: currentToolCall.id,
                name: currentToolCall.name,
                input: toolInput
              })

              // Executar tool
              const toolResult = await executarTool(currentToolCall.name, toolInput, user_id)

              // Enviar resultado da tool como evento
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'tool_result',
                  tool_name: currentToolCall.name,
                  result: toolResult.data
                })}\n\n`)
              )

              // Adicionar resposta textual baseada no resultado
              if (toolResult.success && toolResult.data) {
                const toolResponseText = formatToolResponse(currentToolCall.name, toolResult.data)
                fullResponse += toolResponseText
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'text', content: toolResponseText })}\n\n`)
                )
              }
            } catch (parseError) {
              console.error('Erro ao processar tool call:', parseError)
            }
            currentToolCall = null
          } else if (evt.type === 'message_delta') {
            if (evt.usage) {
              tokensOutput = evt.usage.output_tokens || 0
            }
          } else if (evt.type === 'message_start') {
            if (evt.message?.usage) {
              tokensInput = evt.message.usage.input_tokens
            }
          }
        }

        // Salvar resposta no banco
        await supabase
          .from('mensagens_ia_med')
          .insert({
            conversa_id,
            role: 'assistant',
            content: fullResponse,
            tokens: tokensInput + tokensOutput
          })

        // Atualizar tokens da conversa
        await supabase
          .from('conversas_ia_med')
          .update({
            tokens_usados: tokensInput + tokensOutput,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversa_id)

        // Incrementar uso
        const custo = calcularCusto(MODELOS.claude.opus, tokensInput, tokensOutput)
        await incrementarUsoIA(user_id, 'chats', 1, tokensInput, tokensOutput, custo)

        // Enviar metadados finais
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            conversa_id,
            tokens: { input: tokensInput, output: tokensOutput },
            thinking: thinking || undefined
          })}\n\n`)
        )

        controller.close()
      } catch (error) {
        console.error('Erro no stream Claude:', error)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Erro no processamento' })}\n\n`)
        )
        controller.close()
      }
    }
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

// ==========================================
// STREAMING COM GEMINI
// ==========================================

interface StreamGeminiParams {
  historico: Array<{ role: 'user' | 'assistant'; content: string }>
  mensagem: string
  conversa_id: string
  user_id: string
  imagem_base64?: string
  imagem_tipo?: string
}

async function streamGemini(params: StreamGeminiParams) {
  const { historico, mensagem, conversa_id, user_id, imagem_base64, imagem_tipo } = params

  const model = genAI.getGenerativeModel({
    model: MODELOS.gemini.flash,
    systemInstruction: SYSTEM_PROMPT_PREMIUM,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192  // Aumentado para evitar cortes em respostas longas
    }
  })

  // Preparar histórico
  const history = historico.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  // Preparar conteúdo da mensagem
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (imagem_base64 && imagem_tipo) {
    parts.push({
      inlineData: {
        mimeType: imagem_tipo,
        data: imagem_base64
      }
    })
  }

  parts.push({ text: mensagem })

  // Criar chat e enviar com stream
  const chat = model.startChat({ history })
  const result = await chat.sendMessageStream(parts)

  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''

      try {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            fullResponse += text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
            )
          }
        }

        // Estimar tokens
        const tokensInput = Math.ceil(mensagem.length / 4) + historico.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0)
        const tokensOutput = Math.ceil(fullResponse.length / 4)

        // Salvar resposta
        await supabase
          .from('mensagens_ia_med')
          .insert({
            conversa_id,
            role: 'assistant',
            content: fullResponse,
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

        // Incrementar uso
        const custo = calcularCusto('gemini-flash', tokensInput, tokensOutput)
        await incrementarUsoIA(user_id, 'chats', 1, tokensInput, tokensOutput, custo)

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            conversa_id,
            tokens: { input: tokensInput, output: tokensOutput }
          })}\n\n`)
        )

        controller.close()
      } catch (error) {
        console.error('Erro no stream Gemini:', error)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Erro no processamento' })}\n\n`)
        )
        controller.close()
      }
    }
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

// ==========================================
// GET - Listar Conversas
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const conversa_id = searchParams.get('conversa_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (conversa_id) {
      // Buscar conversa específica com mensagens
      const { data: conversa } = await supabase
        .from('conversas_ia_med')
        .select('*')
        .eq('id', conversa_id)
        .eq('user_id', user_id)
        .single()

      if (!conversa) {
        return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
      }

      const { data: mensagens } = await supabase
        .from('mensagens_ia_med')
        .select('*')
        .eq('conversa_id', conversa_id)
        .order('created_at', { ascending: true })

      return NextResponse.json({ conversa, mensagens })
    }

    // Listar todas as conversas do usuário
    const { data: conversas } = await supabase
      .from('conversas_ia_med')
      .select('*')
      .eq('user_id', user_id)
      .order('updated_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ conversas })
  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ==========================================
// DELETE - Excluir Conversa
// ==========================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversa_id = searchParams.get('conversa_id')
    const user_id = searchParams.get('user_id')

    if (!conversa_id || !user_id) {
      return NextResponse.json(
        { error: 'conversa_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se conversa pertence ao usuário
    const { data: conversa } = await supabase
      .from('conversas_ia_med')
      .select('id')
      .eq('id', conversa_id)
      .eq('user_id', user_id)
      .single()

    if (!conversa) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    // Deletar (cascade vai deletar mensagens)
    await supabase
      .from('conversas_ia_med')
      .delete()
      .eq('id', conversa_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar conversa:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
