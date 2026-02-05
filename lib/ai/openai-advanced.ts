// Cliente OpenAI Avancado para PREPARAMED
// Suporta: o4-mini (rapido/economico), gpt-5.2 (raciocinio avancado), gpt-4o (vision)
// Implementa: streaming, vision, reasoning_effort, structured outputs

import OpenAI from 'openai'
import { ChatResponse, MensagemIA, PlanoIA } from './types'
import { SYSTEM_PROMPT_PREMIUM, SYSTEM_PROMPT_RESIDENCIA } from './prompts'

// ==========================================
// CONFIGURACAO DO CLIENTE
// ==========================================

let _openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!_openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }
    _openaiClient = new OpenAI({ apiKey })
  }
  return _openaiClient
}

// ==========================================
// MODELOS OPENAI DISPONIVEIS
// ==========================================

export const OPENAI_MODELS = {
  // Modelo rapido e economico - ideal para tarefas simples
  o4Mini: 'o4-mini',

  // Modelo com raciocinio avancado - ideal para tarefas complexas
  gpt52: 'gpt-5.2',

  // Modelo multimodal - ideal para vision
  gpt4o: 'gpt-4o',

  // Modelo para embeddings
  embedding: 'text-embedding-3-small'
} as const

// ==========================================
// PRECOS POR MODELO (USD por 1M tokens)
// ==========================================

export const OPENAI_PRICING = {
  'o4-mini': {
    input: 1.10,
    output: 4.40,
    cached_input: 0.275 // 75% desconto
  },
  'gpt-5.2': {
    input: 2.50,
    output: 10.00,
    cached_input: 0.625, // 75% desconto
    reasoning: 15.00 // tokens de raciocinio
  },
  'gpt-4o': {
    input: 2.50,
    output: 10.00,
    cached_input: 1.25
  }
} as const

// ==========================================
// TIPOS
// ==========================================

export type OpenAIModelType = keyof typeof OPENAI_MODELS
export type ReasoningEffort = 'low' | 'medium' | 'high'

export interface OpenAIStreamOptions {
  plano: PlanoIA
  model?: string
  maxTokens?: number
  temperature?: number
  reasoningEffort?: ReasoningEffort
  useVision?: boolean
  imageBase64?: string
  imageMediaType?: string
}

export interface OpenAIStreamChunk {
  type: 'text' | 'reasoning' | 'done' | 'error'
  content?: string
  reasoning?: string
  tokens?: {
    input: number
    output: number
    reasoning?: number
    cached_input?: number
  }
  error?: string
}

// ==========================================
// FUNCAO PRINCIPAL - STREAMING COM O4-MINI
// ==========================================

export async function* streamWithO4Mini(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  options: OpenAIStreamOptions
): AsyncGenerator<OpenAIStreamChunk> {
  const openai = getOpenAIClient()

  // Usar tipagem correta para streaming
  const stream = await openai.chat.completions.create({
    model: OPENAI_MODELS.o4Mini,
    max_completion_tokens: options.maxTokens || 8192,
    stream: true as const,
    stream_options: { include_usage: true },
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ]
  })

  let fullResponse = ''
  let tokensInput = 0
  let tokensOutput = 0

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      fullResponse += content
      yield { type: 'text', content }
    }

    // Capturar usage do ultimo chunk
    if (chunk.usage) {
      tokensInput = chunk.usage.prompt_tokens || 0
      tokensOutput = chunk.usage.completion_tokens || 0
    }
  }

  yield {
    type: 'done',
    tokens: {
      input: tokensInput,
      output: tokensOutput
    }
  }
}

// ==========================================
// STREAMING COM GPT-5.2 (REASONING AVANCADO)
// ==========================================

export async function* streamWithGPT52(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  options: OpenAIStreamOptions
): AsyncGenerator<OpenAIStreamChunk> {
  const openai = getOpenAIClient()

  // GPT-5.2 suporta reasoning_effort para controlar profundidade do raciocinio
  const reasoningEffort = options.reasoningEffort || 'medium'

  // Criar stream com tipagem correta
  const stream = await openai.chat.completions.create({
    model: OPENAI_MODELS.gpt52,
    max_completion_tokens: options.maxTokens || 16384,
    stream: true as const,
    stream_options: { include_usage: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reasoning_effort: reasoningEffort as any,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ]
  })

  let fullResponse = ''
  let reasoningContent = ''
  let tokensInput = 0
  let tokensOutput = 0
  let tokensReasoning = 0

  for await (const chunk of stream) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delta = chunk.choices[0]?.delta as any

    // Texto normal
    if (delta?.content) {
      fullResponse += delta.content
      yield { type: 'text', content: delta.content }
    }

    // Tokens de raciocinio (se disponivel no modelo)
    if (delta?.reasoning) {
      reasoningContent += delta.reasoning
      yield { type: 'reasoning', reasoning: delta.reasoning }
    }

    // Capturar usage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usage = chunk.usage as any
    if (usage) {
      tokensInput = usage.prompt_tokens || 0
      tokensOutput = usage.completion_tokens || 0
      tokensReasoning = usage.reasoning_tokens || 0
    }
  }

  yield {
    type: 'done',
    tokens: {
      input: tokensInput,
      output: tokensOutput,
      reasoning: tokensReasoning
    }
  }
}

// ==========================================
// STREAMING COM GPT-4O (VISION)
// ==========================================

export async function* streamWithGPT4oVision(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  imageBase64: string,
  imageMediaType: string,
  options: OpenAIStreamOptions
): AsyncGenerator<OpenAIStreamChunk> {
  const openai = getOpenAIClient()

  // Construir mensagens com imagem
  const lastMessage = messages[messages.length - 1]
  const previousMessages = messages.slice(0, -1)

  const stream = await openai.chat.completions.create({
    model: OPENAI_MODELS.gpt4o,
    max_tokens: options.maxTokens || 8192,
    stream: true as const,
    stream_options: { include_usage: true },
    messages: [
      { role: 'system', content: systemPrompt },
      ...previousMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${imageMediaType};base64,${imageBase64}`,
              detail: 'high'
            }
          },
          {
            type: 'text',
            text: lastMessage.content
          }
        ]
      }
    ]
  })

  let fullResponse = ''
  let tokensInput = 0
  let tokensOutput = 0

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      fullResponse += content
      yield { type: 'text', content }
    }

    if (chunk.usage) {
      tokensInput = chunk.usage.prompt_tokens || 0
      tokensOutput = chunk.usage.completion_tokens || 0
    }
  }

  yield {
    type: 'done',
    tokens: {
      input: tokensInput,
      output: tokensOutput
    }
  }
}

// ==========================================
// CHAT SEM STREAMING (para processamento interno)
// ==========================================

export async function chatWithOpenAI(
  mensagens: MensagemIA[],
  options: {
    model?: string
    reasoningEffort?: ReasoningEffort
    maxTokens?: number
    plano?: PlanoIA
  } = {}
): Promise<ChatResponse> {
  const openai = getOpenAIClient()

  const {
    model = OPENAI_MODELS.o4Mini,
    reasoningEffort = 'medium',
    maxTokens = 8192,
    plano = 'premium'
  } = options

  const systemPrompt = plano === 'residencia'
    ? SYSTEM_PROMPT_RESIDENCIA
    : SYSTEM_PROMPT_PREMIUM

  const messages = mensagens
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestParams: any = {
    model,
    max_completion_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ]
  }

  // Adicionar reasoning_effort para gpt-5.2
  if (model === OPENAI_MODELS.gpt52) {
    requestParams.reasoning_effort = reasoningEffort
  }

  const response = await openai.chat.completions.create(requestParams)

  const resposta = response.choices[0]?.message?.content || ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usage = response.usage as any

  return {
    resposta,
    conversa_id: '',
    tokens_usados: {
      input: usage?.prompt_tokens || 0,
      output: usage?.completion_tokens || 0
    }
  }
}

// ==========================================
// ANALISE DE IMAGEM COM VISION
// ==========================================

export async function analisarImagemComOpenAI(
  imageBase64: string,
  mediaType: string,
  pergunta: string,
  plano: PlanoIA = 'premium'
): Promise<ChatResponse> {
  const openai = getOpenAIClient()

  const systemPrompt = plano === 'residencia'
    ? SYSTEM_PROMPT_RESIDENCIA
    : SYSTEM_PROMPT_PREMIUM

  const response = await openai.chat.completions.create({
    model: OPENAI_MODELS.gpt4o,
    max_tokens: 8192,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mediaType};base64,${imageBase64}`,
              detail: 'high'
            }
          },
          {
            type: 'text',
            text: pergunta
          }
        ]
      }
    ]
  })

  return {
    resposta: response.choices[0]?.message?.content || '',
    conversa_id: '',
    tokens_usados: {
      input: response.usage?.prompt_tokens || 0,
      output: response.usage?.completion_tokens || 0
    }
  }
}

// ==========================================
// STRUCTURED OUTPUTS PARA CITACOES
// ==========================================

export interface CitationStructured {
  titulo: string
  fonte: string
  texto_citado: string
  relevancia: 'alta' | 'media' | 'baixa'
}

export interface StructuredResponse {
  resposta: string
  citacoes: CitationStructured[]
  confianca: number
  fontes_utilizadas: string[]
}

export async function chatWithStructuredOutput(
  mensagens: MensagemIA[],
  options: {
    model?: string
    plano?: PlanoIA
  } = {}
): Promise<StructuredResponse> {
  const openai = getOpenAIClient()

  const {
    model = OPENAI_MODELS.gpt52,
    plano = 'residencia'
  } = options

  const systemPrompt = plano === 'residencia'
    ? SYSTEM_PROMPT_RESIDENCIA
    : SYSTEM_PROMPT_PREMIUM

  const messages = mensagens
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  // Schema para structured output
  const schema = {
    type: 'object' as const,
    properties: {
      resposta: {
        type: 'string' as const,
        description: 'A resposta completa para a pergunta do usuario'
      },
      citacoes: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            titulo: { type: 'string' as const },
            fonte: { type: 'string' as const },
            texto_citado: { type: 'string' as const },
            relevancia: { type: 'string' as const, enum: ['alta', 'media', 'baixa'] }
          },
          required: ['titulo', 'fonte', 'texto_citado', 'relevancia']
        }
      },
      confianca: {
        type: 'number' as const,
        description: 'Nivel de confianca na resposta de 0 a 100'
      },
      fontes_utilizadas: {
        type: 'array' as const,
        items: { type: 'string' as const }
      }
    },
    required: ['resposta', 'citacoes', 'confianca', 'fontes_utilizadas']
  }

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `${systemPrompt}\n\nIMPORTANTE: Sempre inclua citacoes das fontes medicas que voce usar na resposta. Cite livros, artigos, guidelines oficiais. Formate as citacoes em portugues brasileiro.`
      },
      ...messages
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'resposta_medica',
        strict: true,
        schema
      }
    }
  })

  const content = response.choices[0]?.message?.content || '{}'

  try {
    return JSON.parse(content) as StructuredResponse
  } catch {
    return {
      resposta: content,
      citacoes: [],
      confianca: 50,
      fontes_utilizadas: []
    }
  }
}

// ==========================================
// GERACAO DE FLASHCARDS COM O4-MINI
// ==========================================

export interface FlashcardGenerated {
  frente: string
  verso: string
  dificuldade: 'facil' | 'medio' | 'dificil'
  tags: string[]
  explicacao?: string
}

export async function gerarFlashcardsComOpenAI(
  tema: string,
  quantidade: number,
  contexto?: string
): Promise<FlashcardGenerated[]> {
  const openai = getOpenAIClient()

  const schema = {
    type: 'object' as const,
    properties: {
      flashcards: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            frente: { type: 'string' as const },
            verso: { type: 'string' as const },
            dificuldade: { type: 'string' as const, enum: ['facil', 'medio', 'dificil'] },
            tags: { type: 'array' as const, items: { type: 'string' as const } },
            explicacao: { type: 'string' as const }
          },
          required: ['frente', 'verso', 'dificuldade', 'tags']
        }
      }
    },
    required: ['flashcards']
  }

  const prompt = contexto
    ? `Com base no seguinte contexto:\n${contexto}\n\nGere ${quantidade} flashcards sobre: ${tema}`
    : `Gere ${quantidade} flashcards educativos de medicina sobre: ${tema}`

  const response = await openai.chat.completions.create({
    model: OPENAI_MODELS.o4Mini,
    messages: [
      {
        role: 'system',
        content: 'Voce e um especialista em educacao medica. Crie flashcards claros, precisos e pedagogicos para estudantes de medicina. Use terminologia medica correta mas acessivel. Sempre em portugues brasileiro.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'flashcards',
        strict: true,
        schema
      }
    }
  })

  const content = response.choices[0]?.message?.content || '{"flashcards":[]}'

  try {
    const parsed = JSON.parse(content)
    return parsed.flashcards as FlashcardGenerated[]
  } catch {
    return []
  }
}

// ==========================================
// GERACAO DE QUESTOES COM GPT-5.2
// ==========================================

export interface QuestaoGenerated {
  enunciado: string
  alternativas: Array<{
    letra: string
    texto: string
    correta: boolean
  }>
  explicacao: string
  tema: string
  subtema: string
  dificuldade: 'facil' | 'medio' | 'dificil'
  fonte?: string
}

export async function gerarQuestoesComOpenAI(
  tema: string,
  quantidade: number,
  estiloProva: string = 'ENARE',
  contexto?: string
): Promise<QuestaoGenerated[]> {
  const openai = getOpenAIClient()

  const schema = {
    type: 'object' as const,
    properties: {
      questoes: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            enunciado: { type: 'string' as const },
            alternativas: {
              type: 'array' as const,
              items: {
                type: 'object' as const,
                properties: {
                  letra: { type: 'string' as const },
                  texto: { type: 'string' as const },
                  correta: { type: 'boolean' as const }
                },
                required: ['letra', 'texto', 'correta']
              }
            },
            explicacao: { type: 'string' as const },
            tema: { type: 'string' as const },
            subtema: { type: 'string' as const },
            dificuldade: { type: 'string' as const, enum: ['facil', 'medio', 'dificil'] },
            fonte: { type: 'string' as const }
          },
          required: ['enunciado', 'alternativas', 'explicacao', 'tema', 'subtema', 'dificuldade']
        }
      }
    },
    required: ['questoes']
  }

  const prompt = contexto
    ? `Com base no seguinte contexto:\n${contexto}\n\nGere ${quantidade} questoes no estilo ${estiloProva} sobre: ${tema}`
    : `Gere ${quantidade} questoes de multipla escolha no estilo da prova ${estiloProva} sobre: ${tema}`

  const response = await openai.chat.completions.create({
    model: OPENAI_MODELS.gpt52,
    reasoning_effort: 'high',
    messages: [
      {
        role: 'system',
        content: `Voce e um especialista em elaboracao de questoes para provas de residencia medica no Brasil (${estiloProva}, ENARE, USP, UNIFESP).

Regras para elaboracao:
1. Cada questao deve ter 5 alternativas (A, B, C, D, E) com apenas UMA correta
2. Use casos clinicos realistas e detalhados
3. Inclua dados de exame fisico, laboratoriais e de imagem quando relevante
4. A explicacao deve ser didatica e citar fontes medicas (Harrison, Cecil, UpToDate, etc)
5. Varie a dificuldade conforme solicitado
6. Use terminologia medica precisa em portugues brasileiro
7. As alternativas incorretas devem ser plausíveis mas claramente distinguiveis`
      },
      { role: 'user', content: prompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'questoes',
        strict: true,
        schema
      }
    }
  })

  const content = response.choices[0]?.message?.content || '{"questoes":[]}'

  try {
    const parsed = JSON.parse(content)
    return parsed.questoes as QuestaoGenerated[]
  } catch {
    return []
  }
}

// ==========================================
// CALCULAR CUSTO
// ==========================================

export function calcularCustoOpenAI(
  model: string,
  tokensInput: number,
  tokensOutput: number,
  tokensReasoning: number = 0,
  tokensCached: number = 0
): number {
  const pricing = OPENAI_PRICING[model as keyof typeof OPENAI_PRICING]
  if (!pricing) return 0

  let custo = 0

  // Input tokens (descontando cached)
  const tokensInputNormal = Math.max(0, tokensInput - tokensCached)
  custo += (tokensInputNormal / 1_000_000) * pricing.input
  custo += (tokensCached / 1_000_000) * pricing.cached_input

  // Output tokens
  custo += (tokensOutput / 1_000_000) * pricing.output

  // Reasoning tokens (se aplicavel)
  if ('reasoning' in pricing && tokensReasoning > 0) {
    custo += (tokensReasoning / 1_000_000) * pricing.reasoning
  }

  return custo
}

// ==========================================
// EXPORTS
// ==========================================

export { getOpenAIClient }
