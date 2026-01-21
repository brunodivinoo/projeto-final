// API Route - Chat IA PREPARAMED com Streaming

import { NextRequest, NextResponse } from 'next/server'

// Configuração de runtime para permitir execução mais longa
// Imagem (25s) + Questões em lote (60s+) = precisa de pelo menos 90s
export const dynamic = 'force-dynamic'
export const maxDuration = 120 // 120 segundos (máximo do Vercel Pro para Serverless)
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
import { uploadImageToStorage, isBase64Image } from '@/lib/storage'

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

    case 'gerar_imagem_medica': {
      if (!resultado.imagem_url) {
        return '\n\n❌ Não foi possível gerar a imagem solicitada.\n'
      }
      // NÃO incluir a URL base64 no texto - a imagem será renderizada via tool_result no frontend
      // Apenas retornar uma confirmação de que a imagem foi gerada
      return `\n\n🖼️ **Imagem Gerada: ${resultado.estrutura || 'Ilustração Médica'}**\n\n*Imagem gerada com DALL-E 3 para fins educacionais.*\n`
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
      modo = 'chat', // Modo de chat: chat, caso_clinico, tutor, questoes
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
          modelo: plano === 'residencia' ? 'claude' : 'gemini',
          modo: modo // Salvar modo da conversa
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

  // Preparar mensagens - limitar histórico para evitar erro de tokens
  // Limite: últimas 20 mensagens para evitar exceder 200k tokens
  const MAX_HISTORICO = 20
  const historicoLimitado = historico.slice(-MAX_HISTORICO)

  // Limpar imagens base64 de mensagens antigas (manter só nas últimas 2)
  const messages: Anthropic.MessageParam[] = historicoLimitado.map((m, index) => {
    // Se é uma das últimas 2 mensagens, manter conteúdo original
    if (index >= historicoLimitado.length - 2) {
      return {
        role: m.role,
        content: m.content
      }
    }

    // Para mensagens antigas, remover imagens base64 para economizar tokens
    if (typeof m.content === 'string') {
      // Remover base64 de imagens inline no texto
      const contentLimpo = m.content.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[imagem removida do histórico]')
      return {
        role: m.role,
        content: contentLimpo
      }
    }

    // Se content é array (multi-modal), filtrar imagens
    if (Array.isArray(m.content)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentArray = m.content as any[]
      const contentFiltrado = contentArray.filter((block) => {
        // Manter apenas blocos de texto, remover imagens
        return block.type === 'text'
      })
      return {
        role: m.role,
        content: contentFiltrado.length > 0 ? contentFiltrado : '[conteúdo de imagem removido do histórico]'
      }
    }

    return {
      role: m.role,
      content: m.content
    }
  })

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

  // Selecionar modelo baseado no plano
  // Premium = Sonnet (mais barato), Residência = Opus (mais capaz)
  const modeloSelecionado = params.plano === 'residencia' ? MODELOS.claude.opus : MODELOS.claude.sonnet
  const systemPrompt = params.plano === 'residencia' ? SYSTEM_PROMPT_RESIDENCIA : SYSTEM_PROMPT_PREMIUM

  // IMPORTANTE: Extended Thinking NÃO é compatível com tool_use no agentic loop
  // Quando tools são usadas, precisamos desabilitar thinking para evitar o erro:
  // "Expected `thinking` or `redacted_thinking`, but found `tool_use`"
  // Isso porque a API exige que mensagens assistant comecem com thinking blocks
  // quando thinking está habilitado, mas nosso agentic loop não preserva esses blocos
  const hasTools = tools.length > 0
  const canUseExtendedThinking = use_extended_thinking && !hasTools

  if (use_extended_thinking && hasTools) {
    console.log('[Chat API] Extended Thinking desabilitado - incompatível com tools no agentic loop')
  }

  // Configurar parâmetros
  // max_tokens aumentado para evitar cortes em respostas longas
  // Claude Opus suporta até 32k output, Sonnet até 16k
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // max_tokens reduzido para evitar timeout do Vercel (120s)
  // Se a resposta for cortada, a auto-continuação vai pedir mais
  const streamParams: any = {
    model: modeloSelecionado,
    max_tokens: canUseExtendedThinking ? 16000 : 8000,
    system: systemPrompt,
    messages,
    stream: true,
    tools: hasTools ? tools : undefined
  }

  if (canUseExtendedThinking) {
    streamParams.thinking = {
      type: 'enabled',
      budget_tokens: thinking_budget
    }
  }

  // Criar encoder para streaming
  const encoder = new TextEncoder()

  // Stream response com agentic loop para múltiplas tools
  const readableStream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''
      let thinking = ''
      let tokensInput = 0
      let tokensOutput = 0
      const currentMessages = [...messages]
      let iterationCount = 0
      let continuationCount = 0 // Contador de continuações por max_tokens
      const MAX_ITERATIONS = 10 // Limite de iterações (tools + continuações)
      const MAX_CONTINUATIONS = 3 // Limite de continuações automáticas por max_tokens

      // Heartbeat para manter conexão viva (a cada 25s)
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          // Controller já fechado, ignorar
        }
      }, 25000)

      try {
        // Agentic loop - continua até o Claude terminar ou atingir limite
        while (iterationCount < MAX_ITERATIONS) {
          iterationCount++
          console.log(`[Chat API] Iteração ${iterationCount}/${MAX_ITERATIONS} (continuações: ${continuationCount}/${MAX_CONTINUATIONS})`)

          // Criar stream para esta iteração
          const currentStreamParams = {
            ...streamParams,
            messages: currentMessages
          }
          const stream = await anthropic.messages.stream(currentStreamParams)

          const toolCallsThisIteration: Array<{ id: string; name: string; input: Record<string, unknown>; result: unknown }> = []
          let currentToolCall: { id: string; name: string; input: string } | null = null
          const assistantContent: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }> = []
          let stopReason = ''

          for await (const event of stream) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const evt = event as any

            if (evt.type === 'content_block_start') {
              if (evt.content_block?.type === 'tool_use') {
                currentToolCall = { id: evt.content_block.id, name: evt.content_block.name, input: '' }
              } else if (evt.content_block?.type === 'text') {
                // Início de bloco de texto
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
            } else if (evt.type === 'content_block_stop') {
              if (currentToolCall) {
                // Tool call completa, processar
                try {
                  const toolInput = JSON.parse(currentToolCall.input || '{}')

                  // Executar tool
                  console.log('[Chat API] Executando tool:', currentToolCall.name)

                  const toolResult = await executarTool(currentToolCall.name, toolInput, user_id)

                  console.log('[Chat API] Tool result success:', toolResult.success)
                  if (toolResult.error) {
                    console.error('[Chat API] Tool error:', toolResult.error)
                  }

                  // Se for imagem gerada, fazer upload para storage permanente
                  let processedResult = toolResult.data
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const toolData = toolResult.data as Record<string, any> | undefined
                  if (currentToolCall.name === 'gerar_imagem_medica' && toolData?.imagem_url) {
                    const imageUrl = toolData.imagem_url as string
                    if (isBase64Image(imageUrl)) {
                      console.log('[Chat API] Fazendo upload da imagem para storage...')
                      const storageUrl = await uploadImageToStorage(imageUrl, user_id, conversa_id)
                      if (storageUrl) {
                        console.log('[Chat API] Imagem salva no storage:', storageUrl)
                        processedResult = {
                          ...toolData,
                          imagem_url: storageUrl,
                          imagem_base64: imageUrl // Manter base64 para exibição imediata
                        }
                      } else {
                        console.error('[Chat API] Falha ao salvar imagem no storage')
                      }
                    }
                  }

                  // Enviar resultado da tool como evento para o frontend
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                      type: 'tool_result',
                      tool_name: currentToolCall.name,
                      result: processedResult,
                      error: toolResult.error
                    })}\n\n`)
                  )

                  // Adicionar resposta textual formatada
                  if (toolResult.success && toolResult.data) {
                    const toolResponseText = formatToolResponse(currentToolCall.name, toolResult.data)
                    fullResponse += toolResponseText
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'text', content: toolResponseText })}\n\n`)
                    )
                  }

                  // Guardar para o próximo loop
                  toolCallsThisIteration.push({
                    id: currentToolCall.id,
                    name: currentToolCall.name,
                    input: toolInput,
                    result: toolResult.data || { error: toolResult.error }
                  })

                  // Adicionar ao content do assistant
                  assistantContent.push({
                    type: 'tool_use',
                    id: currentToolCall.id,
                    name: currentToolCall.name,
                    input: toolInput
                  })
                } catch (parseError) {
                  console.error('[Chat API] Erro ao processar tool call:', parseError)
                }
                currentToolCall = null
              }
            } else if (evt.type === 'message_delta') {
              if (evt.usage) {
                tokensOutput += evt.usage.output_tokens || 0
              }
              if (evt.delta?.stop_reason) {
                stopReason = evt.delta.stop_reason
              }
            } else if (evt.type === 'message_start') {
              if (evt.message?.usage) {
                tokensInput += evt.message.usage.input_tokens
              }
            }
          }

          // IMPORTANTE: Verificar max_tokens PRIMEIRO, antes de verificar end_turn
          // Se a resposta foi cortada por max_tokens, CONTINUAR automaticamente
          if (stopReason === 'max_tokens') {
            continuationCount++
            console.log(`[Chat API] Resposta cortada por max_tokens (continuação ${continuationCount}/${MAX_CONTINUATIONS})`)

            // Se atingiu limite de continuações, parar
            if (continuationCount > MAX_CONTINUATIONS) {
              console.log('[Chat API] Limite de continuações atingido')
              const endMsg = '\n\n---\n*[Resposta muito longa. Pergunte sobre um tópico mais específico para continuar.]*'
              fullResponse += endMsg
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', content: endMsg })}\n\n`)
              )
              break
            }

            console.log(`[Chat API] Continuando automaticamente de onde parou...`)

            // Adicionar mensagem parcial do assistant e pedir para continuar
            currentMessages.push({
              role: 'assistant',
              content: fullResponse
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)

            currentMessages.push({
              role: 'user',
              content: 'Continue exatamente de onde parou, sem repetir o que já foi dito. Mantenha a formatação e o contexto.'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)

            // Continuar para próxima iteração (vai chamar a API novamente)
            continue
          }

          // Se não houve tool calls ou o stop_reason é end_turn, terminamos
          if (toolCallsThisIteration.length === 0 || stopReason === 'end_turn') {
            console.log('[Chat API] Finalizando - stop_reason:', stopReason, 'tools:', toolCallsThisIteration.length)
            break
          }

          // Preparar mensagens para próxima iteração (continuar após tool use)
          console.log('[Chat API] Continuando após tool use...')

          // Adicionar resposta do assistant com tool_use
          currentMessages.push({
            role: 'assistant',
            content: assistantContent.length > 0 ? assistantContent : [{ type: 'text', text: fullResponse }]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)

          // Adicionar resultados das tools (com tratamento especial para imagens)
          const toolResults = toolCallsThisIteration.map(tc => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let resultContent: any = tc.result

            // Se for imagem, não passar o base64 de volta (muito grande)
            // Passar apenas confirmação de que foi gerada
            if (tc.name === 'gerar_imagem_medica' && resultContent?.imagem_url) {
              resultContent = {
                success: true,
                estrutura: resultContent.estrutura,
                descricao: resultContent.descricao,
                tipo: resultContent.tipo,
                mensagem: `Imagem de "${resultContent.estrutura}" gerada com sucesso e já exibida ao usuário.`
              }
            }

            return {
              type: 'tool_result',
              tool_use_id: tc.id,
              content: JSON.stringify(resultContent)
            }
          })

          currentMessages.push({
            role: 'user',
            content: toolResults
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)

          console.log('[Chat API] Mensagens atualizadas, iniciando próxima iteração...')
        }

        console.log('[Chat API] Agentic loop finalizado após', iterationCount, 'iterações')

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
        const custo = calcularCusto(modeloSelecionado, tokensInput, tokensOutput)
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

        clearInterval(heartbeatInterval)
        controller.close()
      } catch (error) {
        clearInterval(heartbeatInterval)
        console.error('Erro no stream Claude:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

        // Verificar tipo de erro para dar resposta adequada
        const isOverloaded = errorMessage.includes('overloaded') || errorMessage.includes('529')
        const isRateLimit = errorMessage.includes('rate_limit') || errorMessage.includes('429')
        const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')

        let fallbackMessage = ''

        if (fullResponse && fullResponse.length > 100) {
          // Se já tem conteúdo substancial, apenas avisar que pode estar incompleto
          fallbackMessage = '\n\n---\n*Resposta pode estar incompleta. Se precisar de mais detalhes, pergunte novamente.*'
        } else if (isOverloaded || isRateLimit) {
          // Se API está sobrecarregada, dar mensagem amigável
          fallbackMessage = 'Desculpe, estou com alta demanda no momento. Por favor, tente novamente em alguns segundos. Sua pergunta foi salva e você pode reformulá-la se preferir.'
        } else if (isTimeout) {
          fallbackMessage = 'A resposta está demorando mais que o esperado. Por favor, tente fazer uma pergunta mais específica ou divida em partes menores.'
        } else {
          fallbackMessage = 'Desculpe, tive uma instabilidade técnica. Por favor, tente novamente ou reformule sua pergunta de forma diferente.'
        }

        // Se já tem resposta parcial, adicionar aviso
        if (fullResponse && fullResponse.length > 0) {
          fullResponse += fallbackMessage
          console.log('[Chat API] Salvando resposta parcial após erro, tamanho:', fullResponse.length)
          try {
            await supabase
              .from('mensagens_ia_med')
              .insert({
                conversa_id,
                role: 'assistant',
                content: fullResponse,
                tokens: tokensInput + tokensOutput
              })

            // Enviar o conteúdo parcial que já foi gerado
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: fallbackMessage })}\n\n`)
            )
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'done',
                conversa_id,
                tokens: { input: tokensInput, output: tokensOutput },
                partial: true
              })}\n\n`)
            )
          } catch (saveError) {
            console.error('[Chat API] Erro ao salvar resposta parcial:', saveError)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: fallbackMessage })}\n\n`)
            )
          }
        } else {
          // Sem resposta parcial, salvar mensagem de fallback
          try {
            await supabase
              .from('mensagens_ia_med')
              .insert({
                conversa_id,
                role: 'assistant',
                content: fallbackMessage,
                tokens: 0
              })

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: fallbackMessage })}\n\n`)
            )
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'done',
                conversa_id,
                tokens: { input: 0, output: 0 },
                error: true
              })}\n\n`)
            )
          } catch (saveError) {
            console.error('[Chat API] Erro ao salvar fallback:', saveError)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: fallbackMessage })}\n\n`)
            )
          }
        }

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
    const modo = searchParams.get('modo') // Filtrar por modo (chat, caso_clinico, tutor, questoes)

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (conversa_id) {
      // Buscar conversa específica com mensagens
      const { data: conversa, error: convError } = await supabase
        .from('conversas_ia_med')
        .select('*')
        .eq('id', conversa_id)
        .eq('user_id', user_id)
        .single()

      console.log('[Chat API GET] Buscando conversa:', conversa_id)
      console.log('[Chat API GET] Conversa encontrada:', !!conversa, 'erro:', convError?.message)

      if (!conversa) {
        return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
      }

      const { data: mensagens, error: msgError } = await supabase
        .from('mensagens_ia_med')
        .select('*')
        .eq('conversa_id', conversa_id)
        .order('created_at', { ascending: true })

      console.log('[Chat API GET] Mensagens encontradas:', mensagens?.length || 0, 'erro:', msgError?.message)

      return NextResponse.json({ conversa, mensagens })
    }

    // Listar conversas do usuário (filtradas por modo se especificado)
    let query = supabase
      .from('conversas_ia_med')
      .select('*')
      .eq('user_id', user_id)
      .order('updated_at', { ascending: false })
      .limit(50)

    // Aplicar filtro de modo se especificado
    if (modo) {
      query = query.eq('modo', modo)
    }

    const { data: conversas } = await query

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
