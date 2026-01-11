// Cliente Anthropic (Claude) para PREPARAMED

import Anthropic from '@anthropic-ai/sdk'
import { MODELOS, CLAUDE_BETAS, DOMINIOS_MEDICOS, CACHE_CONFIG } from './config'
import { MensagemIA, ChatResponse, PlanoIA } from './types'
import { SYSTEM_PROMPT_RESIDENCIA } from './prompts'

// Inicializar cliente
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// Tipos para mensagens Claude
interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string | ClaudeContent[]
}

interface ClaudeContent {
  type: 'text' | 'image' | 'document' | 'tool_use' | 'tool_result'
  text?: string
  source?: {
    type: 'base64' | 'url'
    media_type?: string
    data?: string
    url?: string
  }
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string
}

// ==========================================
// CHAT BÁSICO COM STREAMING
// ==========================================

export async function chatComClaudeStream(
  mensagens: MensagemIA[],
  options: {
    useWebSearch?: boolean
    useExtendedThinking?: boolean
    thinkingBudget?: number
    useCache?: boolean
    plano?: PlanoIA
  } = {}
) {
  const {
    useWebSearch = false,
    useExtendedThinking = false,
    thinkingBudget = 8000,
    useCache = true,
    plano = 'residencia'
  } = options

  // Converter mensagens para formato Claude
  const claudeMessages: ClaudeMessage[] = mensagens
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  // Configurar tools se web search estiver habilitado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = []
  if (useWebSearch) {
    tools.push({
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 5,
      allowed_domains: DOMINIOS_MEDICOS
    })
  }

  // Configurar system prompt com cache
  const systemConfig = useCache
    ? [{
        type: 'text' as const,
        text: SYSTEM_PROMPT_RESIDENCIA,
        cache_control: {
          type: 'ephemeral' as const,
          ttl: plano === 'residencia' ? CACHE_CONFIG.residencia.ttl : CACHE_CONFIG.premium.ttl
        }
      }]
    : SYSTEM_PROMPT_RESIDENCIA

  // Configurar betas necessárias
  const betas: string[] = []
  if (useExtendedThinking) {
    betas.push(CLAUDE_BETAS.extended_thinking)
  }

  // Criar stream
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const streamParams: any = {
    model: MODELOS.claude.opus,
    max_tokens: useExtendedThinking ? 16000 : 4096,
    system: systemConfig,
    messages: claudeMessages,
    stream: true
  }

  // Adicionar tools se houver
  if (tools.length > 0) {
    streamParams.tools = tools
  }

  // Adicionar extended thinking se habilitado
  if (useExtendedThinking) {
    streamParams.thinking = {
      type: 'enabled',
      budget_tokens: thinkingBudget
    }
  }

  const stream = await anthropic.messages.stream(streamParams)

  return stream
}

// ==========================================
// CHAT SEM STREAMING (para processamento interno)
// ==========================================

export async function chatComClaude(
  mensagens: MensagemIA[],
  options: {
    useWebSearch?: boolean
    useExtendedThinking?: boolean
    thinkingBudget?: number
  } = {}
): Promise<ChatResponse> {
  const {
    useWebSearch = false,
    useExtendedThinking = false,
    thinkingBudget = 8000
  } = options

  const claudeMessages: ClaudeMessage[] = mensagens
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = []
  if (useWebSearch) {
    tools.push({
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 5,
      allowed_domains: DOMINIOS_MEDICOS
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    model: MODELOS.claude.opus,
    max_tokens: useExtendedThinking ? 16000 : 4096,
    system: SYSTEM_PROMPT_RESIDENCIA,
    messages: claudeMessages
  }

  if (tools.length > 0) {
    params.tools = tools
  }

  if (useExtendedThinking) {
    params.thinking = {
      type: 'enabled',
      budget_tokens: thinkingBudget
    }
  }

  const response = await anthropic.messages.create(params)

  // Extrair resposta
  let resposta = ''
  let thinking = ''

  for (const block of response.content) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blk = block as any
    if (blk.type === 'text') {
      resposta += blk.text
    } else if (blk.type === 'thinking') {
      thinking = blk.thinking
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usage = response.usage as any

  return {
    resposta,
    conversa_id: '', // será preenchido pela API route
    tokens_usados: {
      input: usage.input_tokens,
      output: usage.output_tokens,
      cache_read: usage.cache_read_input_tokens || 0,
      cache_write: usage.cache_creation_input_tokens || 0
    },
    thinking
  }
}

// ==========================================
// ANÁLISE DE IMAGEM (Vision)
// ==========================================

export async function analisarImagemComClaude(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
  pergunta: string
): Promise<ChatResponse> {
  const response = await anthropic.messages.create({
    model: MODELOS.claude.opus,
    max_tokens: 4096,
    system: SYSTEM_PROMPT_RESIDENCIA,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: imageBase64
          }
        },
        {
          type: 'text',
          text: pergunta
        }
      ]
    }]
  })

  let resposta = ''
  for (const block of response.content) {
    if (block.type === 'text') {
      resposta += block.text
    }
  }

  return {
    resposta,
    conversa_id: '',
    tokens_usados: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens
    }
  }
}

// ==========================================
// ANÁLISE DE PDF
// ==========================================

export async function analisarPDFComClaude(
  pdfBase64: string,
  pergunta: string
): Promise<ChatResponse> {
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
            data: pdfBase64
          }
        } as Anthropic.DocumentBlockParam,
        {
          type: 'text',
          text: pergunta
        }
      ]
    }]
  })

  let resposta = ''
  for (const block of response.content) {
    if (block.type === 'text') {
      resposta += block.text
    }
  }

  return {
    resposta,
    conversa_id: '',
    tokens_usados: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens
    }
  }
}

// ==========================================
// GERAÇÃO ESTRUTURADA (Flashcards, Resumos)
// ==========================================

export async function gerarConteudoEstruturado<T>(
  prompt: string,
  schema: Anthropic.Tool,
  systemPrompt?: string
): Promise<T | null> {
  const response = await anthropic.messages.create({
    model: MODELOS.claude.opus,
    max_tokens: 8192,
    system: systemPrompt || SYSTEM_PROMPT_RESIDENCIA,
    tools: [schema],
    tool_choice: { type: 'tool', name: schema.name },
    messages: [{
      role: 'user',
      content: prompt
    }]
  })

  // Extrair resultado da tool
  const toolUse = response.content.find(block => block.type === 'tool_use')
  if (toolUse && toolUse.type === 'tool_use') {
    return toolUse.input as T
  }

  return null
}

// ==========================================
// CONTAR TOKENS
// ==========================================

export async function contarTokens(
  mensagens: MensagemIA[],
  systemPrompt?: string
): Promise<number> {
  const claudeMessages = mensagens
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  const count = await anthropic.messages.countTokens({
    model: MODELOS.claude.opus,
    system: systemPrompt || SYSTEM_PROMPT_RESIDENCIA,
    messages: claudeMessages
  })

  return count.input_tokens
}

// Export do cliente para uso direto se necessário
export { anthropic }
