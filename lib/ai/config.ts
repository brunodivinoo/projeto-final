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
  }
}

// Selecionar modelo baseado no plano
export function getModeloParaPlano(plano: PlanoIA): string {
  switch (plano) {
    case 'residencia':
      return MODELOS.claude.opus
    case 'premium':
      return MODELOS.gemini.flash
    default:
      return MODELOS.gemini.flash
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
  webSearches: number = 0
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
