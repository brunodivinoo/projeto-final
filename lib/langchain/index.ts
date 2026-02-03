// LangChain - Exportacoes principais
// Sistema de orquestracao para o PREPARA MED

// ==========================================
// AGENTS
// ==========================================
export {
  classifyIntent,
  getIntentInstructions,
  IntentionSchema,
  type Intention,
  type ClassifierOptions
} from './agents/intent-classifier'

// ==========================================
// CHAINS
// ==========================================
export {
  runChatChain,
  runChatChainWithFallback,
  type ChatChainInput,
  type ChatChainOutput
} from './chains/chat-chain'

export {
  runQuestoesChain,
  runQuestoesChainWithValidation,
  formatQuestoesParaExibicao,
  QuestaoSchema,
  QuestoesOutputSchema,
  type Questao,
  type QuestoesOutput,
  type QuestoesChainInput
} from './chains/questoes-chain'

export {
  runFlashcardsChain,
  exportToAnkiFormat,
  formatFlashcardsParaExibicao,
  FlashcardSchema,
  FlashcardsOutputSchema,
  type Flashcard,
  type FlashcardsOutput,
  type FlashcardsChainInput
} from './chains/flashcards-chain'

export {
  runResumoChain,
  formatResumoParaExibicao,
  ResumoSchema,
  type Resumo,
  type ResumoChainInput
} from './chains/resumo-chain'

// ==========================================
// MEMORY
// ==========================================
export {
  ConversationMemory,
  createConversationMemory,
  type MessageEntry,
  type ConversationSummary,
  type EntityInfo,
  type MemoryConfig
} from './memory/conversation-memory'

// ==========================================
// TOOLS
// ==========================================
export {
  SerperMedicalSearchTool,
  searchMedicalWeb,
  type SerperResult,
  type SerperSearchOutput
} from './tools/serper-tool'

export {
  BuscarQuestoesTool,
  BuscarFlashcardsTool,
  EstatisticasUsuarioTool,
  type QuestaoResult,
  type SearchOptions
} from './tools/database-tool'

// ==========================================
// ORCHESTRATOR - Funcao principal
// ==========================================

import { classifyIntent, getIntentInstructions, type Intention } from './agents/intent-classifier'
import { runChatChainWithFallback } from './chains/chat-chain'
import { runQuestoesChainWithValidation, formatQuestoesParaExibicao } from './chains/questoes-chain'
import { runFlashcardsChain, formatFlashcardsParaExibicao } from './chains/flashcards-chain'
import { runResumoChain, formatResumoParaExibicao } from './chains/resumo-chain'
import { ConversationMemory, createConversationMemory } from './memory/conversation-memory'

export interface OrchestratorInput {
  message: string
  systemPrompt: string
  userId?: string
  conversaId?: string
  hasImage?: boolean
  previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>
  preferredProvider?: 'claude' | 'gemini' | 'openai'
  onToken?: (token: string) => void
}

export interface OrchestratorOutput {
  response: string
  intention: Intention
  tokens: { input: number; output: number }
  provider: string
  artifacts?: {
    type: 'questoes' | 'flashcards' | 'resumo'
    data: unknown
  }
}

/**
 * Orquestrador principal do LangChain
 * Classifica intencao e roteia para a chain apropriada
 */
export async function orchestrate(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const {
    message,
    systemPrompt,
    hasImage = false,
    previousMessages,
    preferredProvider = 'claude',
    onToken
  } = input

  // 1. Classificar intencao
  const intention = await classifyIntent(message, {
    hasImage,
    previousContext: previousMessages?.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')
  })

  console.log(`[Orchestrator] Intencao detectada: ${intention.primaryIntent} (${intention.confidence})`)

  // 2. Preparar memoria
  const memory = createConversationMemory()
  if (previousMessages) {
    memory.loadHistory(previousMessages)
  }

  // 3. Rotear para chain apropriada
  let response: string
  let tokens = { input: 0, output: 0 }
  let provider = preferredProvider
  let artifacts: OrchestratorOutput['artifacts']

  switch (intention.primaryIntent) {
    case 'gerar_questoes': {
      // Extrair quantidade e tema
      const match = message.match(/(\d+)\s*quest/i)
      const quantidade = match ? parseInt(match[1]) : 5
      const tema = intention.topic || message.replace(/gere?|crie?|\d+|quest(oes|ao)?/gi, '').trim()

      const result = await runQuestoesChainWithValidation({
        tema: tema || 'medicina geral',
        quantidade,
        provider: preferredProvider === 'openai' ? 'gemini' : preferredProvider as 'claude' | 'gemini'
      })

      response = formatQuestoesParaExibicao(result)
      artifacts = { type: 'questoes', data: result }
      tokens = { input: 500, output: response.length / 4 }
      break
    }

    case 'gerar_flashcards': {
      const match = message.match(/(\d+)\s*flash/i)
      const quantidade = match ? parseInt(match[1]) : 10
      const tema = intention.topic || message.replace(/gere?|crie?|\d+|flash\s*cards?/gi, '').trim()

      const result = await runFlashcardsChain({
        tema: tema || 'medicina geral',
        quantidade,
        provider: 'gemini'
      })

      response = formatFlashcardsParaExibicao(result)
      artifacts = { type: 'flashcards', data: result }
      tokens = { input: 300, output: response.length / 4 }
      break
    }

    case 'resumir_conteudo': {
      const tema = intention.topic || message.replace(/resum(e|a|o|ir)?|sintetiz(e|a)?/gi, '').trim()

      const result = await runResumoChain({
        tema: tema || 'conceito medico',
        provider: preferredProvider === 'openai' ? 'claude' : preferredProvider as 'claude' | 'gemini'
      })

      response = formatResumoParaExibicao(result)
      artifacts = { type: 'resumo', data: result }
      tokens = { input: 400, output: response.length / 4 }
      break
    }

    default: {
      // Chat padrao com fallback
      const enhancedSystemPrompt = systemPrompt + '\n' + getIntentInstructions(intention)

      const result = await runChatChainWithFallback({
        message,
        systemPrompt: enhancedSystemPrompt,
        memory,
        intention,
        provider: preferredProvider,
        streaming: !!onToken,
        onToken
      })

      response = result.response
      tokens = result.tokens
      provider = result.provider as 'claude' | 'gemini' | 'openai'
    }
  }

  return {
    response,
    intention,
    tokens,
    provider,
    artifacts
  }
}

// Export default
export default {
  orchestrate,
  classifyIntent,
  runChatChainWithFallback,
  runQuestoesChainWithValidation,
  runFlashcardsChain,
  runResumoChain,
  createConversationMemory
}
