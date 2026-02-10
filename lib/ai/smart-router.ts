// Smart Router - Roteador Inteligente de Modelos de IA
// Agora 100% Claude Haiku - simplificado para economia e qualidade

import { PlanoIA, ReasoningEffort, MensagemIA } from './types'
import { MODELOS, MODELO_PROVIDER_MAP } from './config'
import { analisarComplexidade, ComplexityAnalysis } from './complexity-detector'
import { streamWithFallback, StreamChunk, MultiProviderOptions } from './multi-provider'

// ==========================================
// TIPOS
// ==========================================

export interface SmartRouterOptions {
  plano: PlanoIA
  mensagem: string
  historico?: MensagemIA[]
  temImagem?: boolean
  temPdf?: boolean
  imagemBase64?: string
  imagemMediaType?: string
  useWebSearch?: boolean
  useExtendedThinking?: boolean
  thinkingBudget?: number
  forceModel?: string
  contextoComprimido?: boolean
  onModelSelected?: (model: string, analysis: ComplexityAnalysis) => void
}

export interface SmartRouterResult {
  modelo: string
  provider: 'claude' | 'openai' | 'gemini'
  analysis: ComplexityAnalysis
  reasoningEffort?: ReasoningEffort
  custoEstimado: number
}

export type SmartStreamChunk = StreamChunk

// ==========================================
// FUNCAO PRINCIPAL - SELECIONAR MODELO
// ==========================================

export function selecionarModelo(options: SmartRouterOptions): SmartRouterResult {
  const {
    plano,
    mensagem,
    historico = [],
    temImagem = false,
    temPdf = false,
    forceModel
  } = options

  // Se modelo foi forcado, usar ele
  if (forceModel) {
    const provider = MODELO_PROVIDER_MAP[forceModel] || 'claude'
    return {
      modelo: forceModel,
      provider,
      analysis: {
        nivel: 'moderada',
        score: 50,
        fatores: ['Modelo forcado pelo usuario'],
        modeloRecomendado: 'claude-haiku' as 'o4-mini' | 'gpt-5.2' | 'claude-opus',
        motivo: 'Modelo especificado manualmente'
      },
      custoEstimado: 0
    }
  }

  // Analisar complexidade da mensagem
  const analysis = analisarComplexidade(mensagem, {
    historicoMensagens: historico.length,
    temImagem,
    temPdf,
    plano: plano === 'gratuito' ? 'premium' : plano
  })

  // TUDO vai para Claude Haiku - qualidade superior ao GPT, custo baixo
  return {
    modelo: MODELOS.claude.haiku,
    provider: 'claude' as const,
    analysis: {
      ...analysis,
      motivo: 'Claude Haiku - qualidade superior com custo otimizado'
    },
    custoEstimado: estimarCusto(MODELOS.claude.haiku, 2000)
  }
}

// ==========================================
// STREAMING INTELIGENTE
// ==========================================

export async function* streamInteligente(
  options: SmartRouterOptions
): AsyncGenerator<SmartStreamChunk> {
  const {
    plano,
    mensagem,
    historico = [],
    onModelSelected
  } = options

  // Selecionar modelo (sempre Haiku agora)
  const routerResult = selecionarModelo(options)
  const { modelo, analysis } = routerResult

  // Callback para informar modelo selecionado
  onModelSelected?.(modelo, analysis)

  console.log(`[SmartRouter] Modelo: ${modelo} (claude)`)
  console.log(`[SmartRouter] Complexidade: ${analysis.nivel} (score: ${analysis.score})`)

  // Preparar mensagens
  const messages = historico
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  messages.push({ role: 'user', content: mensagem })

  // Usar multi-provider (Claude -> Gemini fallback)
  const fallbackOptions: MultiProviderOptions = {
    plano: plano === 'gratuito' ? 'premium' : plano,
    useWebSearch: false,
    useExtendedThinking: false,
    maxTokens: 16384
  }

  yield* streamWithFallback(messages, fallbackOptions)
}

// ==========================================
// FUNCOES AUXILIARES PARA TAREFAS ESPECIFICAS
// ==========================================

/**
 * Chat simples - usa Claude Haiku
 */
export async function* chatSimples(
  mensagem: string,
  historico: MensagemIA[] = [],
  plano: PlanoIA = 'premium'
): AsyncGenerator<StreamChunk> {
  const messages = historico
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  messages.push({ role: 'user', content: mensagem })

  yield* streamWithFallback(messages, {
    plano: plano === 'gratuito' ? 'premium' : plano,
    useWebSearch: false,
    maxTokens: 8192
  })
}

/**
 * Chat complexo - usa Claude Haiku
 */
export async function* chatComplexo(
  mensagem: string,
  historico: MensagemIA[] = [],
  plano: PlanoIA = 'residencia'
): AsyncGenerator<StreamChunk> {
  const messages = historico
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  messages.push({ role: 'user', content: mensagem })

  yield* streamWithFallback(messages, {
    plano: plano === 'gratuito' ? 'premium' : plano,
    useWebSearch: false,
    maxTokens: 16384
  })
}

/**
 * Chat com pesquisa web - usa Claude Haiku
 */
export async function* chatComPesquisa(
  mensagem: string,
  historico: MensagemIA[] = [],
  plano: PlanoIA = 'residencia'
): AsyncGenerator<StreamChunk> {
  const messages = historico
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  messages.push({ role: 'user', content: mensagem })

  yield* streamWithFallback(messages, {
    plano: plano === 'gratuito' ? 'premium' : plano,
    useWebSearch: true,
    maxTokens: 16384
  })
}

// ==========================================
// ESTIMATIVA DE CUSTO
// ==========================================

function estimarCusto(modelo: string, tokensEstimados: number): number {
  const precos: Record<string, { input: number; output: number }> = {
    'claude-haiku-4-5-20251001': { input: 0.80 / 1_000_000, output: 4.00 / 1_000_000 },
    'claude-sonnet-4-20250514': { input: 3.00 / 1_000_000, output: 15.00 / 1_000_000 },
    'claude-opus-4-5-20251101': { input: 5.00 / 1_000_000, output: 25.00 / 1_000_000 },
    'gemini-2.0-flash': { input: 0.075 / 1_000_000, output: 0.30 / 1_000_000 }
  }

  const preco = precos[modelo] || precos['claude-haiku-4-5-20251001']
  return (tokensEstimados * preco.input) + (tokensEstimados * preco.output)
}

// ==========================================
// FUNCAO PARA OBTER STATS DE ROTEAMENTO
// ==========================================

export interface RoutingStats {
  totalRequests: number
  byModel: Record<string, number>
  byComplexity: Record<string, number>
  custoTotal: number
  economiaVsOpus: number
}

// Cache em memoria para stats (em producao usar Redis)
const routingStats: RoutingStats = {
  totalRequests: 0,
  byModel: {},
  byComplexity: {},
  custoTotal: 0,
  economiaVsOpus: 0
}

export function registrarRoteamento(
  modelo: string,
  complexidade: string,
  custo: number
) {
  routingStats.totalRequests++
  routingStats.byModel[modelo] = (routingStats.byModel[modelo] || 0) + 1
  routingStats.byComplexity[complexidade] = (routingStats.byComplexity[complexidade] || 0) + 1
  routingStats.custoTotal += custo

  // Calcular economia vs usar Opus para tudo
  const custoOpus = custo * (25 / 4.0) // aproximacao Haiku vs Opus
  routingStats.economiaVsOpus += (custoOpus - custo)
}

export function getRoutingStats(): RoutingStats {
  return { ...routingStats }
}

export function resetRoutingStats() {
  routingStats.totalRequests = 0
  routingStats.byModel = {}
  routingStats.byComplexity = {}
  routingStats.custoTotal = 0
  routingStats.economiaVsOpus = 0
}

// ==========================================
// EXPORTS
// ==========================================

export default streamInteligente
