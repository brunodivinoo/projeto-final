// Smart Router - Roteador Inteligente de Modelos de IA
// Analisa a complexidade da tarefa e roteia para o modelo mais adequado
// Prioriza economia mantendo qualidade

import { PlanoIA, ReasoningEffort, MensagemIA } from './types'
import { MODELOS, MODELO_PROVIDER_MAP } from './config'
import { analisarComplexidade, ComplexityAnalysis, TarefaIA, getModeloPorTarefa } from './complexity-detector'
import {
  streamWithO4Mini,
  streamWithGPT52,
  streamWithGPT4oVision,
  OpenAIStreamChunk,
  OpenAIStreamOptions,
  chatWithOpenAI,
  chatWithStructuredOutput
} from './openai-advanced'
import { streamWithFallback, StreamChunk, MultiProviderOptions } from './multi-provider'
import { SYSTEM_PROMPT_PREMIUM, SYSTEM_PROMPT_RESIDENCIA } from './prompts'

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
  forceModel?: string // Forcar modelo especifico
  onModelSelected?: (model: string, analysis: ComplexityAnalysis) => void
}

export interface SmartRouterResult {
  modelo: string
  provider: 'claude' | 'openai' | 'gemini'
  analysis: ComplexityAnalysis
  reasoningEffort?: ReasoningEffort
  custoEstimado: number
}

export type SmartStreamChunk = StreamChunk | OpenAIStreamChunk

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
    useWebSearch = false,
    forceModel
  } = options

  // Se modelo foi forcado, usar ele
  if (forceModel) {
    const provider = MODELO_PROVIDER_MAP[forceModel] || 'openai'
    return {
      modelo: forceModel,
      provider,
      analysis: {
        nivel: 'moderada',
        score: 50,
        fatores: ['Modelo forcado pelo usuario'],
        modeloRecomendado: forceModel as 'o4-mini' | 'gpt-5.2' | 'claude-opus',
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

  // Se precisa de web search e e plano residencia, usar Claude Opus
  if (useWebSearch && plano === 'residencia') {
    return {
      modelo: MODELOS.claude.opus,
      provider: 'claude',
      analysis: {
        ...analysis,
        modeloRecomendado: 'claude-opus',
        motivo: 'Web Search requer Claude Opus'
      },
      custoEstimado: estimarCusto(MODELOS.claude.opus, 2000)
    }
  }

  // Mapear modelo recomendado para modelo real
  let modelo: string
  let provider: 'claude' | 'openai' | 'gemini'
  let reasoningEffort: ReasoningEffort | undefined

  switch (analysis.modeloRecomendado) {
    case 'o4-mini':
      modelo = MODELOS.openai.o4Mini
      provider = 'openai'
      reasoningEffort = analysis.reasoningEffort || 'low'
      break

    case 'gpt-5.2':
      modelo = MODELOS.openai.gpt52
      provider = 'openai'
      reasoningEffort = analysis.reasoningEffort || 'medium'
      break

    case 'claude-opus':
      modelo = MODELOS.claude.opus
      provider = 'claude'
      break

    default:
      // Default para o4-mini (mais economico)
      modelo = MODELOS.openai.o4Mini
      provider = 'openai'
      reasoningEffort = 'low'
  }

  // Override para vision - usar gpt-4o
  if (temImagem && provider === 'openai') {
    modelo = MODELOS.openai.gpt4o
  }

  return {
    modelo,
    provider,
    analysis,
    reasoningEffort,
    custoEstimado: estimarCusto(modelo, 2000)
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
    temImagem = false,
    imagemBase64,
    imagemMediaType,
    useWebSearch = false,
    useExtendedThinking = false,
    thinkingBudget = 8000,
    onModelSelected
  } = options

  // Selecionar modelo
  const routerResult = selecionarModelo(options)
  const { modelo, provider, analysis, reasoningEffort } = routerResult

  // Callback para informar modelo selecionado
  onModelSelected?.(modelo, analysis)

  console.log(`[SmartRouter] Modelo selecionado: ${modelo} (${provider})`)
  console.log(`[SmartRouter] Complexidade: ${analysis.nivel} (score: ${analysis.score})`)
  console.log(`[SmartRouter] Motivo: ${analysis.motivo}`)

  // Preparar mensagens
  const messages = historico
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  // Adicionar mensagem atual
  messages.push({ role: 'user', content: mensagem })

  // Selecionar system prompt com detecção de primeira mensagem
  let systemPrompt = plano === 'residencia'
    ? SYSTEM_PROMPT_RESIDENCIA
    : SYSTEM_PROMPT_PREMIUM

  // Primeira mensagem: injetar instrução de resposta rica
  if (historico.length === 0) {
    systemPrompt += `\n\nATENÇÃO: Esta é a PRIMEIRA MENSAGEM do usuário neste chat novo. Siga a regra de PRIMEIRA MENSAGEM: resposta rica com texto detalhado, 1 fluxograma Mermaid, 2-3 questões em formato \`\`\`questao JSON, referências. Máximo 1-2 imagens sem repetição.`
  }

  // Rotear para provider correto
  if (provider === 'openai') {
    const openaiOptions: OpenAIStreamOptions = {
      plano,
      model: modelo,
      reasoningEffort,
      maxTokens: plano === 'residencia' ? 16384 : 8192
    }

    // Streaming com imagem
    if (temImagem && imagemBase64 && imagemMediaType) {
      yield* streamWithGPT4oVision(
        messages,
        systemPrompt,
        imagemBase64,
        imagemMediaType,
        openaiOptions
      )
      return
    }

    // Streaming com gpt-5.2 (raciocinio avancado)
    if (modelo === MODELOS.openai.gpt52) {
      yield* streamWithGPT52(messages, systemPrompt, openaiOptions)
      return
    }

    // Streaming com o4-mini (rapido e economico)
    yield* streamWithO4Mini(messages, systemPrompt, openaiOptions)
    return
  }

  // Fallback para Claude (web search, extended thinking, etc)
  if (provider === 'claude') {
    const claudeOptions: MultiProviderOptions = {
      plano: plano === 'gratuito' ? 'premium' : plano,
      useWebSearch,
      useExtendedThinking,
      thinkingBudget,
      maxTokens: plano === 'residencia' ? 16384 : 8192
    }

    yield* streamWithFallback(messages, claudeOptions)
    return
  }

  // Fallback final - Gemini
  const geminiOptions: MultiProviderOptions = {
    plano: plano === 'gratuito' ? 'premium' : plano,
    maxTokens: 8192
  }

  yield* streamWithFallback(messages, geminiOptions)
}

// ==========================================
// FUNCOES AUXILIARES PARA TAREFAS ESPECIFICAS
// ==========================================

/**
 * Chat simples - usa o4-mini para economia
 */
export async function* chatSimples(
  mensagem: string,
  historico: MensagemIA[] = [],
  plano: PlanoIA = 'premium'
): AsyncGenerator<OpenAIStreamChunk> {
  const systemPrompt = plano === 'residencia'
    ? SYSTEM_PROMPT_RESIDENCIA
    : SYSTEM_PROMPT_PREMIUM

  const messages = historico
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  messages.push({ role: 'user', content: mensagem })

  yield* streamWithO4Mini(messages, systemPrompt, {
    plano,
    reasoningEffort: 'low',
    maxTokens: 4096
  })
}

/**
 * Chat complexo - usa gpt-5.2 para raciocinio
 */
export async function* chatComplexo(
  mensagem: string,
  historico: MensagemIA[] = [],
  plano: PlanoIA = 'residencia'
): AsyncGenerator<OpenAIStreamChunk> {
  const systemPrompt = plano === 'residencia'
    ? SYSTEM_PROMPT_RESIDENCIA
    : SYSTEM_PROMPT_PREMIUM

  const messages = historico
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  messages.push({ role: 'user', content: mensagem })

  yield* streamWithGPT52(messages, systemPrompt, {
    plano,
    reasoningEffort: 'high',
    maxTokens: 16384
  })
}

/**
 * Chat com pesquisa web - usa Claude Opus
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

/**
 * Chat com resposta estruturada (citacoes)
 */
export async function chatEstruturado(
  mensagem: string,
  historico: MensagemIA[] = [],
  plano: PlanoIA = 'residencia'
) {
  const mensagens: MensagemIA[] = [
    ...historico,
    { role: 'user', content: mensagem }
  ]

  return chatWithStructuredOutput(mensagens, { plano })
}

// ==========================================
// ESTIMATIVA DE CUSTO
// ==========================================

function estimarCusto(modelo: string, tokensEstimados: number): number {
  const precos: Record<string, { input: number; output: number }> = {
    'o4-mini': { input: 1.10 / 1_000_000, output: 4.40 / 1_000_000 },
    'gpt-5.2': { input: 2.50 / 1_000_000, output: 10.00 / 1_000_000 },
    'gpt-4o': { input: 2.50 / 1_000_000, output: 10.00 / 1_000_000 },
    'claude-opus-4-5-20251101': { input: 5.00 / 1_000_000, output: 25.00 / 1_000_000 },
    'claude-sonnet-4-20250514': { input: 3.00 / 1_000_000, output: 15.00 / 1_000_000 }
  }

  const preco = precos[modelo] || precos['o4-mini']
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
  const custoOpus = custo * (25 / 4.4) // aproximacao
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
