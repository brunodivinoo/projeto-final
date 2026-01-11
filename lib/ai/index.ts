// Exportações centralizadas do módulo de IA

// Tipos
export * from './types'

// Configurações
export * from './config'

// Prompts
export * from './prompts'

// Clientes
export * from './anthropic'
export * from './gemini'

// Tools
export * from './tools'

// Cache e Otimizações
export * from './cache'

// ==========================================
// FUNÇÕES UNIFICADAS PARA API ROUTES
// ==========================================

import { PlanoIA, MensagemIA, ChatResponse, LIMITES_IA } from './types'
import { chatComClaudeStream, chatComClaude, analisarImagemComClaude, analisarPDFComClaude } from './anthropic'
import { chatComGeminiStream, chatComGemini, analisarImagemComGemini, gerarImagemComGemini } from './gemini'
import { supabase } from '@/lib/supabase'

// ==========================================
// VERIFICAR E INCREMENTAR USO
// ==========================================

export async function verificarLimiteIA(
  userId: string,
  plano: PlanoIA,
  tipo: 'chats' | 'resumos' | 'flashcards' | 'imagens' | 'web_search' | 'pdfs' | 'vision'
): Promise<{ permitido: boolean; usado: number; limite: number }> {
  const limites = LIMITES_IA[plano]
  const mesAtual = new Date().toISOString().slice(0, 7)

  // Buscar ou criar registro de uso
  let { data: uso } = await supabase
    .from('uso_ia_med')
    .select('*')
    .eq('user_id', userId)
    .eq('mes_referencia', mesAtual)
    .single()

  if (!uso) {
    const { data: novoUso } = await supabase
      .from('uso_ia_med')
      .insert({
        user_id: userId,
        mes_referencia: mesAtual
      })
      .select()
      .single()
    uso = novoUso
  }

  // Mapear tipo para campo
  const campoMap: Record<string, { campo: string; limite: keyof typeof limites }> = {
    chats: { campo: 'chats_usados', limite: 'chats_mes' },
    resumos: { campo: 'resumos_usados', limite: 'resumos_mes' },
    flashcards: { campo: 'flashcards_usados', limite: 'flashcards_mes' },
    imagens: { campo: 'imagens_geradas', limite: 'imagens_mes' },
    web_search: { campo: 'web_searches', limite: 'web_search' as keyof typeof limites },
    pdfs: { campo: 'pdfs_analisados', limite: 'pdf_support' as keyof typeof limites },
    vision: { campo: 'imagens_analisadas', limite: 'vision' as keyof typeof limites }
  }

  const config = campoMap[tipo]
  if (!config) {
    return { permitido: false, usado: 0, limite: 0 }
  }

  const usado = uso?.[config.campo] || 0
  const limiteValor = limites[config.limite]

  // Para booleanos (funcionalidades que são sim/não)
  if (typeof limiteValor === 'boolean') {
    return { permitido: limiteValor, usado, limite: limiteValor ? -1 : 0 }
  }

  // Para números (-1 = ilimitado)
  if (limiteValor === -1) {
    return { permitido: true, usado, limite: -1 }
  }

  return {
    permitido: usado < limiteValor,
    usado,
    limite: limiteValor as number
  }
}

export async function incrementarUsoIA(
  userId: string,
  tipo: 'chats' | 'resumos' | 'flashcards' | 'imagens' | 'web_search' | 'pdfs' | 'vision',
  quantidade: number = 1,
  tokensInput: number = 0,
  tokensOutput: number = 0,
  custo: number = 0
): Promise<void> {
  const mesAtual = new Date().toISOString().slice(0, 7)

  const campoMap: Record<string, string> = {
    chats: 'chats_usados',
    resumos: 'resumos_usados',
    flashcards: 'flashcards_usados',
    imagens: 'imagens_geradas',
    web_search: 'web_searches',
    pdfs: 'pdfs_analisados',
    vision: 'imagens_analisadas'
  }

  const campo = campoMap[tipo]
  if (!campo) return

  // Buscar uso atual
  const { data: uso } = await supabase
    .from('uso_ia_med')
    .select('*')
    .eq('user_id', userId)
    .eq('mes_referencia', mesAtual)
    .single()

  if (uso) {
    // Atualizar existente
    await supabase
      .from('uso_ia_med')
      .update({
        [campo]: (uso[campo] || 0) + quantidade,
        tokens_input: (uso.tokens_input || 0) + tokensInput,
        tokens_output: (uso.tokens_output || 0) + tokensOutput,
        custo_estimado: (uso.custo_estimado || 0) + custo
      })
      .eq('id', uso.id)
  } else {
    // Criar novo
    await supabase
      .from('uso_ia_med')
      .insert({
        user_id: userId,
        mes_referencia: mesAtual,
        [campo]: quantidade,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        custo_estimado: custo
      })
  }
}

// ==========================================
// FUNÇÕES UNIFICADAS DE CHAT
// ==========================================

export async function chatUnificado(
  userId: string,
  plano: PlanoIA,
  mensagens: MensagemIA[],
  options: {
    useWebSearch?: boolean
    useExtendedThinking?: boolean
    thinkingBudget?: number
  } = {}
): Promise<ChatResponse> {
  // Verificar limite
  const { permitido } = await verificarLimiteIA(userId, plano, 'chats')
  if (!permitido && plano !== 'residencia') {
    throw new Error('Limite de mensagens atingido para este mês')
  }

  // Escolher modelo baseado no plano
  if (plano === 'residencia') {
    return await chatComClaude(mensagens, options)
  } else {
    return await chatComGemini(mensagens)
  }
}

export async function chatUnificadoStream(
  userId: string,
  plano: PlanoIA,
  mensagens: MensagemIA[],
  options: {
    useWebSearch?: boolean
    useExtendedThinking?: boolean
    thinkingBudget?: number
  } = {}
) {
  // Verificar limite
  const { permitido } = await verificarLimiteIA(userId, plano, 'chats')
  if (!permitido && plano !== 'residencia') {
    throw new Error('Limite de mensagens atingido para este mês')
  }

  // Escolher modelo baseado no plano
  if (plano === 'residencia') {
    return await chatComClaudeStream(mensagens, { ...options, plano })
  } else {
    return await chatComGeminiStream(mensagens)
  }
}

// ==========================================
// ANÁLISE DE IMAGENS UNIFICADA
// ==========================================

export async function analisarImagemUnificado(
  userId: string,
  plano: PlanoIA,
  imageBase64: string,
  mediaType: string,
  pergunta: string
): Promise<ChatResponse> {
  // Verificar se plano permite
  if (plano !== 'residencia') {
    throw new Error('Análise de imagens disponível apenas no plano Residência')
  }

  const { permitido } = await verificarLimiteIA(userId, plano, 'vision')
  if (!permitido) {
    throw new Error('Limite de análises de imagem atingido')
  }

  return await analisarImagemComClaude(
    imageBase64,
    mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
    pergunta
  )
}

// ==========================================
// ANÁLISE DE PDF UNIFICADA
// ==========================================

export async function analisarPDFUnificado(
  userId: string,
  plano: PlanoIA,
  pdfBase64: string,
  pergunta: string
): Promise<ChatResponse> {
  if (plano !== 'residencia') {
    throw new Error('Análise de PDFs disponível apenas no plano Residência')
  }

  const { permitido } = await verificarLimiteIA(userId, plano, 'pdfs')
  if (!permitido) {
    throw new Error('Limite de análises de PDF atingido')
  }

  return await analisarPDFComClaude(pdfBase64, pergunta)
}

// ==========================================
// GERAÇÃO DE IMAGENS
// ==========================================

export async function gerarImagemUnificado(
  userId: string,
  plano: PlanoIA,
  prompt: string
): Promise<string | null> {
  if (plano !== 'residencia') {
    throw new Error('Geração de imagens disponível apenas no plano Residência')
  }

  const { permitido } = await verificarLimiteIA(userId, plano, 'imagens')
  if (!permitido) {
    throw new Error('Limite de geração de imagens atingido')
  }

  const resultado = await gerarImagemComGemini(prompt)

  if (resultado) {
    await incrementarUsoIA(userId, 'imagens')
  }

  return resultado
}
