// Configurações do Sistema de IA do PREPARAMED

import { PlanoIA, LIMITES_IA, LimitesPlanoIA } from './types'

// Modelos disponíveis
export const MODELOS = {
  claude: {
    opus: 'claude-opus-4-5-20251101',
    sonnet: 'claude-sonnet-4-20250514',
    haiku: 'claude-haiku-4-5-20251001'
  },
  gemini: {
    flash: 'gemini-2.0-flash',
    pro: 'gemini-1.5-pro',
    image: 'gemini-2.0-flash-exp' // para geração de imagens
  },
  openai: {
    o4Mini: 'o4-mini',         // Rapido e economico - tarefas simples
    gpt52: 'gpt-5.2',          // Raciocinio avancado - tarefas complexas
    gpt4o: 'gpt-4o',           // Multimodal - vision
    embedding: 'text-embedding-3-small'
  }
}

// Mapeamento de modelo para provider
export const MODELO_PROVIDER_MAP: Record<string, 'claude' | 'openai' | 'gemini'> = {
  'claude-opus-4-5-20251101': 'claude',
  'claude-sonnet-4-20250514': 'claude',
  'claude-haiku-4-5-20251001': 'claude',
  'o4-mini': 'openai',
  'gpt-5.2': 'openai',
  'gpt-4o': 'openai',
  'gemini-2.0-flash': 'gemini',
  'gemini-1.5-pro': 'gemini'
}

// Selecionar modelo baseado no plano
// Todos usam Sonnet 4.5 - excelente qualidade com custo 5x menor que Opus
export function getModeloParaPlano(plano: PlanoIA): string {
  switch (plano) {
    case 'residencia':
      return MODELOS.claude.sonnet // Sonnet 4.5 - muito capaz e econômico
    case 'premium':
      return MODELOS.claude.sonnet
    default:
      return MODELOS.claude.sonnet
  }
}

// Obter limites do plano
export function getLimitesPlano(plano: PlanoIA): LimitesPlanoIA {
  return LIMITES_IA[plano]
}

// Verificar se pode usar funcionalidade
export function podeUsarFuncionalidade(
  plano: PlanoIA,
  funcionalidade: keyof LimitesPlanoIA
): boolean {
  const limites = getLimitesPlano(plano)
  const valor = limites[funcionalidade]

  if (typeof valor === 'boolean') {
    return valor
  }
  if (typeof valor === 'number') {
    return valor !== 0
  }
  return true
}

// Verificar limite de uso
export function verificarLimiteUso(
  plano: PlanoIA,
  tipo: 'chats_mes' | 'resumos_mes' | 'flashcards_mes' | 'imagens_mes',
  usado: number
): { permitido: boolean; limite: number; restante: number } {
  const limites = getLimitesPlano(plano)
  const limite = limites[tipo]

  // -1 significa ilimitado
  if (limite === -1) {
    return { permitido: true, limite: -1, restante: -1 }
  }

  const restante = Math.max(0, limite - usado)
  return {
    permitido: usado < limite,
    limite,
    restante
  }
}

// Headers para API Anthropic
export function getAnthropicHeaders() {
  return {
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  }
}

// Betas disponíveis para Claude
export const CLAUDE_BETAS = {
  context_1m: 'context-1m-2025-08-07',
  extended_thinking: 'interleaved-thinking-2025-05-14',
  files_api: 'files-api-2025-04-14',
  web_search: 'web-search-2025-03-05',
  tool_streaming: 'fine-grained-tool-streaming-2025-05-14',
  skills: 'skills-2025-10-02'
}

// Configurações de cache
export const CACHE_CONFIG = {
  premium: {
    type: 'ephemeral' as const,
    ttl: 300 // 5 minutos
  },
  residencia: {
    type: 'ephemeral' as const,
    ttl: 3600 // 1 hora
  }
}

// Domínios permitidos para Web Search médico
export const DOMINIOS_MEDICOS = [
  'pubmed.ncbi.nlm.nih.gov',
  'uptodate.com',
  'medscape.com',
  'scielo.br',
  'who.int',
  'cdc.gov',
  'mayoclinic.org',
  'msdmanuals.com',
  'nejm.org',
  'thelancet.com',
  'bmj.com',
  'jama.com'
]

// Calcular custo estimado
export function calcularCusto(
  modelo: string,
  tokensInput: number,
  tokensOutput: number,
  cacheRead: number = 0,
  cacheWrite: number = 0,
  webSearches: number = 0,
  tokensReasoning: number = 0
): number {
  let custoBase = 0

  if (modelo.includes('opus')) {
    custoBase =
      (tokensInput / 1_000_000) * 5 +
      (tokensOutput / 1_000_000) * 25 +
      (cacheWrite / 1_000_000) * 6.25 +
      (cacheRead / 1_000_000) * 0.50
  } else if (modelo.includes('sonnet')) {
    custoBase =
      (tokensInput / 1_000_000) * 3 +
      (tokensOutput / 1_000_000) * 15 +
      (cacheWrite / 1_000_000) * 3.75 +
      (cacheRead / 1_000_000) * 0.30
  } else if (modelo.includes('gemini')) {
    custoBase =
      (tokensInput / 1_000_000) * 0.075 +
      (tokensOutput / 1_000_000) * 0.30
  } else if (modelo === 'o4-mini') {
    // o4-mini: input $1.10, output $4.40, cached $0.275
    custoBase =
      ((tokensInput - cacheRead) / 1_000_000) * 1.10 +
      (tokensOutput / 1_000_000) * 4.40 +
      (cacheRead / 1_000_000) * 0.275
  } else if (modelo === 'gpt-5.2') {
    // gpt-5.2: input $2.50, output $10.00, cached $0.625, reasoning $15.00
    custoBase =
      ((tokensInput - cacheRead) / 1_000_000) * 2.50 +
      (tokensOutput / 1_000_000) * 10.00 +
      (cacheRead / 1_000_000) * 0.625 +
      (tokensReasoning / 1_000_000) * 15.00
  } else if (modelo === 'gpt-4o') {
    // gpt-4o: input $2.50, output $10.00, cached $1.25
    custoBase =
      ((tokensInput - cacheRead) / 1_000_000) * 2.50 +
      (tokensOutput / 1_000_000) * 10.00 +
      (cacheRead / 1_000_000) * 1.25
  }

  // Adicionar custo de web search
  custoBase += webSearches * 0.01

  return custoBase
}

// Converter USD para BRL (taxa aproximada)
export function usdToBrl(usd: number): number {
  const taxa = 5.0 // ajustar conforme necessário
  return usd * taxa
}
