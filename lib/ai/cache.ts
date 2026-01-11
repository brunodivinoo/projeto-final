// Sistema de Cache para IA do PREPARAMED

import { PlanoIA } from './types'
import { CACHE_CONFIG } from './config'

// Cache em memória para contextos frequentes
const memoryCache = new Map<string, { data: unknown; expiry: number }>()

// ==========================================
// CACHE DE CONTEXTO DE CONVERSA
// ==========================================

export interface CacheEntry {
  key: string
  data: unknown
  ttl: number
  createdAt: number
}

// Gerar chave de cache para conversa
export function gerarChaveCache(userId: string, conversaId: string): string {
  return `conv:${userId}:${conversaId}`
}

// Gerar chave de cache para system prompt
export function gerarChaveSystemPrompt(plano: PlanoIA): string {
  return `system:${plano}`
}

// Salvar no cache
export function salvarCache(key: string, data: unknown, ttlSeconds: number): void {
  const expiry = Date.now() + (ttlSeconds * 1000)
  memoryCache.set(key, { data, expiry })
}

// Buscar do cache
export function buscarCache<T>(key: string): T | null {
  const entry = memoryCache.get(key)

  if (!entry) {
    return null
  }

  // Verificar se expirou
  if (Date.now() > entry.expiry) {
    memoryCache.delete(key)
    return null
  }

  return entry.data as T
}

// Limpar cache
export function limparCache(key?: string): void {
  if (key) {
    memoryCache.delete(key)
  } else {
    memoryCache.clear()
  }
}

// Limpar cache expirado
export function limparCacheExpirado(): number {
  let removidos = 0
  const agora = Date.now()

  for (const [key, entry] of memoryCache.entries()) {
    if (agora > entry.expiry) {
      memoryCache.delete(key)
      removidos++
    }
  }

  return removidos
}

// ==========================================
// CONFIGURAÇÃO DE CACHE POR PLANO
// ==========================================

export function getCacheConfig(plano: PlanoIA) {
  if (plano === 'residencia') {
    return CACHE_CONFIG.residencia
  }
  return CACHE_CONFIG.premium
}

// Criar bloco de cache para Anthropic
export function criarBlocoCache(texto: string, plano: PlanoIA) {
  const config = getCacheConfig(plano)

  return {
    type: 'text' as const,
    text: texto,
    cache_control: {
      type: config.type,
      ttl: config.ttl
    }
  }
}

// ==========================================
// ESTATÍSTICAS DE CACHE
// ==========================================

export function getEstatisticasCache() {
  let ativos = 0
  let expirados = 0
  const agora = Date.now()

  for (const entry of memoryCache.values()) {
    if (agora > entry.expiry) {
      expirados++
    } else {
      ativos++
    }
  }

  return {
    total: memoryCache.size,
    ativos,
    expirados,
    memoria_estimada_kb: Math.round(
      JSON.stringify([...memoryCache.values()]).length / 1024
    )
  }
}

// ==========================================
// BATCH PROCESSING
// ==========================================

interface BatchItem<T, R> {
  id: string
  input: T
  resolve: (result: R) => void
  reject: (error: Error) => void
}

export class BatchProcessor<T, R> {
  private queue: BatchItem<T, R>[] = []
  private processing = false
  private batchSize: number
  private delayMs: number
  private processor: (items: T[]) => Promise<R[]>
  private timeout: NodeJS.Timeout | null = null

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    options: { batchSize?: number; delayMs?: number } = {}
  ) {
    this.processor = processor
    this.batchSize = options.batchSize || 10
    this.delayMs = options.delayMs || 100
  }

  async add(id: string, input: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, input, resolve, reject })
      this.scheduleProcessing()
    })
  }

  private scheduleProcessing(): void {
    if (this.timeout) return

    this.timeout = setTimeout(() => {
      this.timeout = null
      this.processQueue()
    }, this.delayMs)
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    // Pegar batch
    const batch = this.queue.splice(0, this.batchSize)
    const inputs = batch.map(item => item.input)

    try {
      const results = await this.processor(inputs)

      batch.forEach((item, index) => {
        if (results[index] !== undefined) {
          item.resolve(results[index])
        } else {
          item.reject(new Error('Resultado não encontrado'))
        }
      })
    } catch (error) {
      batch.forEach(item => {
        item.reject(error instanceof Error ? error : new Error(String(error)))
      })
    }

    this.processing = false

    // Processar próximo batch se houver
    if (this.queue.length > 0) {
      this.processQueue()
    }
  }
}

// ==========================================
// DEBOUNCE E THROTTLE PARA API CALLS
// ==========================================

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), waitMs)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limitMs)
    }
  }
}

// ==========================================
// RATE LIMITING
// ==========================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimits = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = rateLimits.get(key)

  if (!entry || now > entry.resetAt) {
    // Nova janela
    rateLimits.set(key, {
      count: 1,
      resetAt: now + (windowSeconds * 1000)
    })
    return { allowed: true, remaining: limit - 1, resetIn: windowSeconds }
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetAt - now) / 1000)
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetIn: Math.ceil((entry.resetAt - now) / 1000)
  }
}

// Limpar rate limits expirados
export function limparRateLimitsExpirados(): number {
  let removidos = 0
  const now = Date.now()

  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetAt) {
      rateLimits.delete(key)
      removidos++
    }
  }

  return removidos
}

// ==========================================
// INICIALIZAÇÃO PERIÓDICA
// ==========================================

// Limpar cache e rate limits a cada 5 minutos
setInterval(() => {
  limparCacheExpirado()
  limparRateLimitsExpirados()
}, 5 * 60 * 1000)
