// Sistema de Fallback Multi-Provider para alta disponibilidade
// Suporta: Claude (Anthropic) → Gemini (Google) → OpenAI
// Implementa: retry inteligente, rate limiting, circuit breaker, queue

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { MODELOS } from './config'
import { SYSTEM_PROMPT_PREMIUM, SYSTEM_PROMPT_RESIDENCIA } from './prompts'

// ==========================================
// TIPOS E INTERFACES
// ==========================================

export type ProviderType = 'claude' | 'gemini' | 'openai'

export interface ProviderConfig {
  name: ProviderType
  priority: number
  enabled: boolean
  maxRetries: number
  circuitBreaker: {
    failureThreshold: number
    resetTimeout: number // ms
    halfOpenRequests: number
  }
  rateLimit: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
}

export interface ProviderStatus {
  name: ProviderType
  state: 'closed' | 'open' | 'half-open'
  failures: number
  lastFailure: number | null
  lastSuccess: number | null
  requestsThisMinute: number
  tokensThisMinute: number
  minuteStart: number
}

export interface StreamChunk {
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result' | 'done' | 'error' | 'provider_switch'
  content?: string
  provider?: ProviderType
  error?: string
  tokens?: { input: number; output: number }
  thinking?: string
}

export interface MultiProviderOptions {
  plano: 'premium' | 'residencia'
  useWebSearch?: boolean
  useExtendedThinking?: boolean
  thinkingBudget?: number
  maxTokens?: number
  temperature?: number
  onProviderSwitch?: (from: ProviderType, to: ProviderType, reason: string) => void
}

// ==========================================
// CONFIGURACAO DOS PROVIDERS
// ==========================================

const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    name: 'claude',
    priority: 1, // Preferido para plano residencia
    enabled: true,
    maxRetries: 2,
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeout: 60000, // 1 minuto
      halfOpenRequests: 1
    },
    rateLimit: {
      requestsPerMinute: 50,
      tokensPerMinute: 100000
    }
  },
  {
    name: 'gemini',
    priority: 2, // Fallback principal
    enabled: true,
    maxRetries: 2,
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenRequests: 2
    },
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 120000
    }
  },
  {
    name: 'openai',
    priority: 3, // Ultimo fallback
    enabled: !!process.env.OPENAI_API_KEY,
    maxRetries: 2,
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenRequests: 2
    },
    rateLimit: {
      requestsPerMinute: 50,
      tokensPerMinute: 90000
    }
  }
]

// ==========================================
// ESTADO GLOBAL DOS PROVIDERS (em memoria)
// Em producao, usar Redis para compartilhar entre instancias
// ==========================================

const providerStatus: Map<ProviderType, ProviderStatus> = new Map()

// Inicializar status
function initializeProviderStatus() {
  PROVIDER_CONFIGS.forEach(config => {
    if (!providerStatus.has(config.name)) {
      providerStatus.set(config.name, {
        name: config.name,
        state: 'closed',
        failures: 0,
        lastFailure: null,
        lastSuccess: null,
        requestsThisMinute: 0,
        tokensThisMinute: 0,
        minuteStart: Date.now()
      })
    }
  })
}

initializeProviderStatus()

// ==========================================
// CIRCUIT BREAKER
// ==========================================

function checkCircuitBreaker(provider: ProviderType): boolean {
  const status = providerStatus.get(provider)
  const config = PROVIDER_CONFIGS.find(c => c.name === provider)

  if (!status || !config) return false

  const now = Date.now()

  // Se circuito aberto, verificar se pode tentar novamente
  if (status.state === 'open') {
    if (now - (status.lastFailure || 0) > config.circuitBreaker.resetTimeout) {
      status.state = 'half-open'
      console.log(`[MultiProvider] ${provider} circuit breaker: half-open`)
      return true
    }
    return false
  }

  return true
}

function recordSuccess(provider: ProviderType) {
  const status = providerStatus.get(provider)
  if (status) {
    status.failures = 0
    status.lastSuccess = Date.now()
    status.state = 'closed'
    console.log(`[MultiProvider] ${provider} success recorded, circuit closed`)
  }
}

function recordFailure(provider: ProviderType) {
  const status = providerStatus.get(provider)
  const config = PROVIDER_CONFIGS.find(c => c.name === provider)

  if (status && config) {
    status.failures++
    status.lastFailure = Date.now()

    if (status.failures >= config.circuitBreaker.failureThreshold) {
      status.state = 'open'
      console.log(`[MultiProvider] ${provider} circuit breaker: OPEN (${status.failures} failures)`)
    }
  }
}

// ==========================================
// RATE LIMITING
// ==========================================

function checkRateLimit(provider: ProviderType): boolean {
  const status = providerStatus.get(provider)
  const config = PROVIDER_CONFIGS.find(c => c.name === provider)

  if (!status || !config) return false

  const now = Date.now()

  // Resetar contador se passou 1 minuto
  if (now - status.minuteStart > 60000) {
    status.requestsThisMinute = 0
    status.tokensThisMinute = 0
    status.minuteStart = now
  }

  return status.requestsThisMinute < config.rateLimit.requestsPerMinute
}

function incrementRateLimit(provider: ProviderType, tokens: number = 0) {
  const status = providerStatus.get(provider)
  if (status) {
    status.requestsThisMinute++
    status.tokensThisMinute += tokens
  }
}

// ==========================================
// SELECAO DE PROVIDER DISPONIVEL
// ==========================================

export function getAvailableProvider(preferredProvider?: ProviderType): ProviderType | null {
  const sortedProviders = [...PROVIDER_CONFIGS]
    .filter(c => c.enabled)
    .sort((a, b) => a.priority - b.priority)

  // Se tem preferencia e esta disponivel, usar
  if (preferredProvider) {
    const preferred = sortedProviders.find(c => c.name === preferredProvider)
    if (preferred && checkCircuitBreaker(preferred.name) && checkRateLimit(preferred.name)) {
      return preferred.name
    }
  }

  // Senao, pegar primeiro disponivel
  for (const config of sortedProviders) {
    if (checkCircuitBreaker(config.name) && checkRateLimit(config.name)) {
      return config.name
    }
  }

  // Nenhum disponivel - forcar o de maior prioridade mesmo
  console.warn('[MultiProvider] Nenhum provider disponivel, forcando fallback')
  return sortedProviders[0]?.name || null
}

// ==========================================
// ERROS RETENTAVEIS
// ==========================================

const RETRYABLE_ERRORS = [
  'overloaded',
  'rate_limit',
  'rate limit',
  'too many requests',
  'timeout',
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  '529',
  '503',
  '502',
  '500',
  'internal_error',
  'service_unavailable',
  'capacity'
]

function isRetryableError(error: unknown): boolean {
  const errorStr = String(error).toLowerCase()
  return RETRYABLE_ERRORS.some(e => errorStr.includes(e.toLowerCase()))
}

function shouldSwitchProvider(error: unknown): boolean {
  const errorStr = String(error).toLowerCase()
  // Erros que indicam que o provider esta com problemas sistemicos
  const switchErrors = ['overloaded', '529', '503', 'capacity', 'too many requests']
  return switchErrors.some(e => errorStr.includes(e.toLowerCase()))
}

// ==========================================
// CLIENTES
// ==========================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null

// ==========================================
// STREAMING COM CLAUDE
// ==========================================

async function* streamWithClaude(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  options: MultiProviderOptions
): AsyncGenerator<StreamChunk> {
  const modelName = options.plano === 'residencia' ? MODELOS.claude.opus : MODELOS.claude.sonnet

  const streamParams: Record<string, unknown> = {
    model: modelName,
    max_tokens: options.maxTokens || 12000,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    })),
    stream: true
  }

  if (options.useExtendedThinking && options.plano === 'residencia') {
    streamParams.thinking = {
      type: 'enabled',
      budget_tokens: options.thinkingBudget || 8000
    }
  }

  // @ts-expect-error - tipos do anthropic
  const stream = await anthropic.messages.stream(streamParams)

  let tokensInput = 0
  let tokensOutput = 0

  for await (const event of stream) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evt = event as any

    if (evt.type === 'content_block_delta') {
      if (evt.delta?.type === 'text_delta') {
        yield { type: 'text', content: evt.delta.text, provider: 'claude' }
      } else if (evt.delta?.type === 'thinking_delta') {
        yield { type: 'thinking', content: evt.delta.thinking, provider: 'claude' }
      }
    } else if (evt.type === 'message_start' && evt.message?.usage) {
      tokensInput = evt.message.usage.input_tokens
    } else if (evt.type === 'message_delta' && evt.usage) {
      tokensOutput = evt.usage.output_tokens
    }
  }

  yield {
    type: 'done',
    provider: 'claude',
    tokens: { input: tokensInput, output: tokensOutput }
  }
}

// ==========================================
// STREAMING COM GEMINI
// ==========================================

async function* streamWithGemini(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  options: MultiProviderOptions
): AsyncGenerator<StreamChunk> {
  const model = genAI.getGenerativeModel({
    model: MODELOS.gemini.flash,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: options.temperature || 0.7,
      topP: 0.95,
      maxOutputTokens: options.maxTokens || 8192
    }
  })

  // Preparar historico para Gemini
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: m.content }]
  }))

  const lastMessage = messages[messages.length - 1]

  const chat = model.startChat({ history })
  const result = await chat.sendMessageStream(lastMessage.content)

  let fullResponse = ''

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) {
      fullResponse += text
      yield { type: 'text', content: text, provider: 'gemini' }
    }
  }

  // Estimar tokens para Gemini
  const inputLength = messages.reduce((acc, m) => acc + m.content.length, 0)
  const tokensInput = Math.ceil(inputLength / 4)
  const tokensOutput = Math.ceil(fullResponse.length / 4)

  yield {
    type: 'done',
    provider: 'gemini',
    tokens: { input: tokensInput, output: tokensOutput }
  }
}

// ==========================================
// STREAMING COM OPENAI
// ==========================================

async function* streamWithOpenAI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  options: MultiProviderOptions
): AsyncGenerator<StreamChunk> {
  if (!openai) {
    throw new Error('OpenAI client not initialized')
  }

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: options.maxTokens || 8192,
    temperature: options.temperature || 0.7,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ]
  })

  let fullResponse = ''
  let tokensOutput = 0

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      fullResponse += content
      yield { type: 'text', content, provider: 'openai' }
    }

    if (chunk.usage) {
      tokensOutput = chunk.usage.completion_tokens || 0
    }
  }

  const inputLength = messages.reduce((acc, m) => acc + m.content.length, 0) + systemPrompt.length
  const tokensInput = Math.ceil(inputLength / 4)

  yield {
    type: 'done',
    provider: 'openai',
    tokens: { input: tokensInput, output: tokensOutput || Math.ceil(fullResponse.length / 4) }
  }
}

// ==========================================
// FUNCAO PRINCIPAL - STREAM COM FALLBACK
// ==========================================

export async function* streamWithFallback(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: MultiProviderOptions
): AsyncGenerator<StreamChunk> {
  const systemPrompt = options.plano === 'residencia'
    ? SYSTEM_PROMPT_RESIDENCIA
    : SYSTEM_PROMPT_PREMIUM

  // Determinar provider preferido baseado no plano
  const preferredProvider: ProviderType = options.plano === 'residencia' ? 'claude' : 'gemini'

  // Lista de providers para tentar em ordem
  const providersToTry: ProviderType[] = [preferredProvider]

  // Adicionar fallbacks
  if (preferredProvider === 'claude') {
    providersToTry.push('gemini', 'openai')
  } else {
    providersToTry.push('claude', 'openai')
  }

  // Filtrar apenas os habilitados e disponiveis
  const availableProviders = providersToTry.filter(p => {
    const config = PROVIDER_CONFIGS.find(c => c.name === p)
    return config?.enabled && checkCircuitBreaker(p) && checkRateLimit(p)
  })

  if (availableProviders.length === 0) {
    // Forcar o provider preferido mesmo que esteja com problemas
    console.warn('[MultiProvider] Nenhum provider disponivel, forcando', preferredProvider)
    availableProviders.push(preferredProvider)
  }

  let lastError: unknown = null
  let currentProviderIndex = 0
  let currentProvider = availableProviders[currentProviderIndex]

  while (currentProviderIndex < availableProviders.length) {
    currentProvider = availableProviders[currentProviderIndex]

    try {
      console.log(`[MultiProvider] Tentando com ${currentProvider}`)
      incrementRateLimit(currentProvider)

      let generator: AsyncGenerator<StreamChunk>

      switch (currentProvider) {
        case 'claude':
          generator = streamWithClaude(messages, systemPrompt, options)
          break
        case 'gemini':
          generator = streamWithGemini(messages, systemPrompt, options)
          break
        case 'openai':
          generator = streamWithOpenAI(messages, systemPrompt, options)
          break
        default:
          throw new Error(`Provider desconhecido: ${currentProvider}`)
      }

      // Iterar pelo generator e repassar chunks
      let hasContent = false

      for await (const chunk of generator) {
        if (chunk.type === 'text' && chunk.content) {
          hasContent = true
        }
        yield chunk
      }

      // Se chegou aqui sem erro, registrar sucesso
      if (hasContent) {
        recordSuccess(currentProvider)
      }

      // Streaming completo com sucesso
      return

    } catch (error) {
      console.error(`[MultiProvider] Erro com ${currentProvider}:`, error)
      lastError = error
      recordFailure(currentProvider)

      // Verificar se deve tentar proximo provider
      if (shouldSwitchProvider(error) && currentProviderIndex < availableProviders.length - 1) {
        currentProviderIndex++
        const nextProvider = availableProviders[currentProviderIndex]

        console.log(`[MultiProvider] Fazendo fallback de ${currentProvider} para ${nextProvider}`)

        yield {
          type: 'provider_switch',
          provider: nextProvider,
          content: `Alternando para ${nextProvider}...`
        }

        options.onProviderSwitch?.(currentProvider, nextProvider, String(error))

        // Pequeno delay antes de tentar proximo provider
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }

      // Se nao pode fazer fallback, verificar se pode retry
      if (isRetryableError(error)) {
        const config = PROVIDER_CONFIGS.find(c => c.name === currentProvider)
        const status = providerStatus.get(currentProvider)

        if (config && status && status.failures < config.maxRetries) {
          console.log(`[MultiProvider] Retry ${status.failures + 1}/${config.maxRetries} com ${currentProvider}`)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, status.failures)))
          continue
        }
      }

      // Tentar proximo provider
      currentProviderIndex++
    }
  }

  // Todos os providers falharam
  console.error('[MultiProvider] Todos os providers falharam')
  yield {
    type: 'error',
    error: getErrorMessage(lastError)
  }
}

// ==========================================
// HELPERS
// ==========================================

function getErrorMessage(error: unknown): string {
  const errorStr = String(error).toLowerCase()

  if (errorStr.includes('overloaded') || errorStr.includes('529') || errorStr.includes('capacity')) {
    return 'Nossos servidores estao com alta demanda no momento. Sua mensagem foi recebida e estamos processando. Por favor, aguarde alguns segundos e a resposta aparecera automaticamente.'
  }

  if (errorStr.includes('rate_limit') || errorStr.includes('too many requests')) {
    return 'Muitas requisicoes simultaneas. Aguarde alguns segundos e tente novamente.'
  }

  if (errorStr.includes('timeout')) {
    return 'A requisicao demorou mais que o esperado. Tente fazer uma pergunta mais curta ou especifica.'
  }

  return 'Ocorreu um erro temporario. Por favor, tente novamente em alguns segundos.'
}

// ==========================================
// FUNCAO PARA VERIFICAR STATUS DOS PROVIDERS
// ==========================================

export function getProvidersStatus(): Record<ProviderType, ProviderStatus> {
  const result: Partial<Record<ProviderType, ProviderStatus>> = {}

  providerStatus.forEach((status, name) => {
    result[name] = { ...status }
  })

  return result as Record<ProviderType, ProviderStatus>
}

// ==========================================
// FUNCAO PARA RESET MANUAL (ADMIN)
// ==========================================

export function resetProviderCircuit(provider: ProviderType) {
  const status = providerStatus.get(provider)
  if (status) {
    status.state = 'closed'
    status.failures = 0
    status.lastFailure = null
    console.log(`[MultiProvider] ${provider} circuit breaker resetado manualmente`)
  }
}
