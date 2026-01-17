// Tipos TypeScript para o Sistema de IA do PREPARAMED

export type PlanoIA = 'gratuito' | 'premium' | 'residencia'
export type ModeloIA = 'gemini' | 'claude'
export type RoleMessage = 'user' | 'assistant' | 'system'

// Limites por plano
export interface LimitesPlanoIA {
  chats_mes: number // -1 = ilimitado
  resumos_mes: number
  flashcards_mes: number
  imagens_mes: number
  web_search: boolean
  vision: boolean
  pdf_support: boolean
  extended_thinking: boolean
  max_tokens_resposta: number
  modelo: ModeloIA
  context_window: number
  prompt_cache_ttl: number // em segundos
}

// LIMITES ATUALIZADOS - Janeiro 2026
// FREE: R$0 (só trial 4h) | PREMIUM: R$60 (Sonnet) | RESIDÊNCIA: R$150 (Opus)
export const LIMITES_IA: Record<PlanoIA, LimitesPlanoIA> = {
  gratuito: {
    chats_mes: 0, // Apenas no trial de 4h
    resumos_mes: 0,
    flashcards_mes: 0,
    imagens_mes: 0,
    web_search: false,
    vision: false,
    pdf_support: false,
    extended_thinking: false,
    max_tokens_resposta: 0,
    modelo: 'gemini',
    context_window: 0,
    prompt_cache_ttl: 0
  },
  premium: {
    chats_mes: 100, // Sonnet 4
    resumos_mes: 10,
    flashcards_mes: 120, // 30/semana
    imagens_mes: 0,
    web_search: false,
    vision: false,
    pdf_support: false,
    extended_thinking: false,
    max_tokens_resposta: 8192,
    modelo: 'claude', // Sonnet
    context_window: 200000,
    prompt_cache_ttl: 300
  },
  residencia: {
    chats_mes: -1, // Opus - ilimitado
    resumos_mes: -1,
    flashcards_mes: -1,
    imagens_mes: -1,
    web_search: true,
    vision: true,
    pdf_support: true,
    extended_thinking: true,
    max_tokens_resposta: 16384,
    modelo: 'claude', // Opus
    context_window: 1000000,
    prompt_cache_ttl: 3600
  }
}

// Tipos para mensagens
export interface MensagemIA {
  id?: string
  role: RoleMessage
  content: string
  tokens?: number
  has_image?: boolean
  has_pdf?: boolean
  image_url?: string
  pdf_url?: string
  created_at?: string
}

export interface ConversaIA {
  id: string
  user_id: string
  titulo: string
  modelo: ModeloIA
  tokens_usados: number
  mensagens?: MensagemIA[]
  created_at: string
  updated_at: string
}

// Tipos para uso
export interface UsoIA {
  id: string
  user_id: string
  mes_referencia: string
  chats_usados: number
  resumos_usados: number
  flashcards_usados: number
  imagens_geradas: number
  tokens_input: number
  tokens_output: number
  custo_estimado: number
  web_searches: number
  pdfs_analisados: number
  imagens_analisadas: number
}

// Tipos para resumos
export interface ResumoIA {
  id: string
  user_id: string
  titulo: string
  tema: string
  conteudo: string
  formato: 'markdown' | 'html' | 'plain'
  tokens_usados: number
  created_at: string
}

// Tipos para flashcards
export interface FlashcardIA {
  id: string
  user_id: string
  tema: string
  frente: string
  verso: string
  dificuldade: 'facil' | 'medio' | 'dificil'
  tags: string[]
  revisoes: number
  proxima_revisao?: string
  created_at: string
}

// Tipos para documentos gerados
export interface DocumentoIA {
  id: string
  user_id: string
  tipo: 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'imagem'
  titulo: string
  conteudo?: string
  arquivo_url?: string
  formato?: string
  tamanho_bytes?: number
  created_at: string
}

// Tipos para requisições de chat
export interface ChatRequest {
  mensagem: string
  conversa_id?: string
  imagem_base64?: string
  pdf_base64?: string
  use_web_search?: boolean
  use_extended_thinking?: boolean
  thinking_budget?: number
}

export interface ChatResponse {
  resposta: string
  conversa_id: string
  tokens_usados: {
    input: number
    output: number
    cache_read?: number
    cache_write?: number
  }
  thinking?: string // raciocínio interno (Extended Thinking)
  citations?: Citation[]
  search_results?: SearchResult[]
}

export interface Citation {
  document_title: string
  cited_text: string
  start_index: number
  end_index: number
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

// Tipos para geração de conteúdo
export interface ResumoRequest {
  tema: string
  nivel_detalhe: 'basico' | 'intermediario' | 'avancado'
  incluir_referencias?: boolean
}

export interface FlashcardsRequest {
  tema: string
  quantidade: number
  dificuldade?: 'facil' | 'medio' | 'dificil' | 'misto'
}

export interface ImagemRequest {
  prompt: string
  estilo: 'anatomico' | 'fluxograma' | 'diagrama' | 'educativo'
}

// Tipos para tools customizadas
export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
}

// Preços por modelo (USD por 1M tokens)
export const PRECOS_MODELO = {
  'claude-opus-4-5': {
    input: 5,
    output: 25,
    cache_write: 6.25,
    cache_read: 0.50
  },
  'claude-sonnet-4-5': {
    input: 3,
    output: 15,
    cache_write: 3.75,
    cache_read: 0.30
  },
  'gemini-flash': {
    input: 0.075, // aproximado
    output: 0.30,
    cache_write: 0,
    cache_read: 0
  }
}

// Custo Web Search
export const CUSTO_WEB_SEARCH = 0.01 // USD por busca
