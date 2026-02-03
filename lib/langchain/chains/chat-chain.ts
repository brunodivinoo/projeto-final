// LangChain - Chat Chain Principal
// Chain para conversas gerais e explicacoes

import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { ConversationMemory } from '../memory/conversation-memory'
import { Intention } from '../agents/intent-classifier'

// ==========================================
// TIPOS
// ==========================================

export interface ChatChainInput {
  message: string
  systemPrompt: string
  memory?: ConversationMemory
  intention?: Intention
  provider?: 'claude' | 'gemini' | 'openai'
  model?: string
  temperature?: number
  maxTokens?: number
  streaming?: boolean
  onToken?: (token: string) => void
}

export interface ChatChainOutput {
  response: string
  tokens: { input: number; output: number }
  provider: string
  model: string
}

// ==========================================
// FUNCAO PRINCIPAL
// ==========================================

export async function runChatChain(input: ChatChainInput): Promise<ChatChainOutput> {
  const {
    message,
    systemPrompt,
    memory,
    intention,
    provider = 'claude',
    model: modelOverride,
    temperature = 0.7,
    maxTokens = 4096,
    streaming = false,
    onToken
  } = input

  // Selecionar modelo
  let llm
  let modelName: string

  switch (provider) {
    case 'claude':
      modelName = modelOverride || 'claude-sonnet-4-20250514'
      llm = new ChatAnthropic({
        modelName,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
        temperature,
        maxTokens,
        streaming
      })
      break

    case 'openai':
      modelName = modelOverride || 'gpt-4o'
      llm = new ChatOpenAI({
        modelName,
        openAIApiKey: process.env.OPENAI_API_KEY!,
        temperature,
        maxTokens,
        streaming
      })
      break

    case 'gemini':
    default:
      modelName = modelOverride || 'gemini-2.0-flash'
      llm = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: process.env.GEMINI_API_KEY!,
        temperature,
        maxOutputTokens: maxTokens,
        streaming
      })
  }

  // Construir mensagens
  const messages = []

  // System prompt
  let fullSystemPrompt = systemPrompt

  // Adicionar instrucoes baseadas na intencao
  if (intention) {
    fullSystemPrompt += `\n\n## INTENCAO DETECTADA: ${intention.primaryIntent}\n`
    fullSystemPrompt += `Complexidade: ${intention.complexity}\n`
    if (intention.topic) fullSystemPrompt += `Topico: ${intention.topic}\n`
    if (intention.specialty) fullSystemPrompt += `Especialidade: ${intention.specialty}\n`
  }

  messages.push(new SystemMessage(fullSystemPrompt))

  // Adicionar contexto da memoria
  if (memory) {
    const langChainMessages = memory.getLangChainMessages()
    messages.push(...langChainMessages)
  }

  // Mensagem atual
  messages.push(new HumanMessage(message))

  // Executar
  let response = ''
  let tokensInput = 0
  let tokensOutput = 0

  if (streaming && onToken) {
    // Streaming
    const stream = await llm.stream(messages)

    for await (const chunk of stream) {
      const content = typeof chunk.content === 'string'
        ? chunk.content
        : ''
      response += content
      onToken(content)
    }

    // Estimar tokens (LangChain nao retorna no streaming)
    tokensInput = Math.ceil(messages.reduce((acc, m) => acc + String(m.content).length, 0) / 4)
    tokensOutput = Math.ceil(response.length / 4)

  } else {
    // Sem streaming
    const result = await llm.invoke(messages)
    response = typeof result.content === 'string'
      ? result.content
      : JSON.stringify(result.content)

    // Tentar obter tokens se disponivel
    const usage = (result as unknown as { usage_metadata?: { input_tokens: number; output_tokens: number } }).usage_metadata
    if (usage) {
      tokensInput = usage.input_tokens
      tokensOutput = usage.output_tokens
    } else {
      tokensInput = Math.ceil(messages.reduce((acc, m) => acc + String(m.content).length, 0) / 4)
      tokensOutput = Math.ceil(response.length / 4)
    }
  }

  // Adicionar resposta a memoria
  if (memory) {
    await memory.addMessage('user', message, { intent: intention?.primaryIntent })
    await memory.addMessage('assistant', response)
  }

  return {
    response,
    tokens: { input: tokensInput, output: tokensOutput },
    provider,
    model: modelName
  }
}

// ==========================================
// CHAIN COM FALLBACK AUTOMATICO
// ==========================================

export async function runChatChainWithFallback(input: ChatChainInput): Promise<ChatChainOutput> {
  const providers: Array<'claude' | 'gemini' | 'openai'> = ['claude', 'gemini', 'openai']
  let lastError: Error | null = null

  for (const provider of providers) {
    try {
      console.log(`[ChatChain] Tentando com ${provider}...`)
      return await runChatChain({ ...input, provider })
    } catch (error) {
      console.error(`[ChatChain] Falha com ${provider}:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      // Se for erro de rate limit ou overload, tentar proximo
      const errorStr = String(error).toLowerCase()
      if (
        errorStr.includes('overload') ||
        errorStr.includes('rate_limit') ||
        errorStr.includes('529') ||
        errorStr.includes('503')
      ) {
        continue
      }

      // Se for outro tipo de erro, parar
      throw error
    }
  }

  throw lastError || new Error('Todos os providers falharam')
}

// ==========================================
// EXPORT
// ==========================================

export default {
  runChatChain,
  runChatChainWithFallback
}
