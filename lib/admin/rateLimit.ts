// lib/admin/rateLimit.ts
// Controle de rate limit para API da Anthropic

class AnthropicRateLimiter {
  private lastRequest: number = 0
  private minInterval: number = 3000 // 3 segundos entre requests
  private retryAfter: number = 0
  private requestCount: number = 0
  private windowStart: number = Date.now()
  private maxRequestsPerMinute: number = 20

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()

    // Reset contador se passou 1 minuto
    if (now - this.windowStart > 60000) {
      this.requestCount = 0
      this.windowStart = now
    }

    // Se atingiu limite por minuto, esperar
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = 60000 - (now - this.windowStart)
      if (waitTime > 0) {
        console.log(`[RateLimit] Limite por minuto atingido, aguardando ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        this.requestCount = 0
        this.windowStart = Date.now()
      }
    }

    // Se ainda está no período de retry-after
    if (this.retryAfter > now) {
      const waitTime = this.retryAfter - now
      console.log(`[RateLimit] Aguardando retry-after: ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    // Garantir intervalo mínimo entre requests
    const elapsed = now - this.lastRequest
    if (elapsed < this.minInterval) {
      const waitTime = this.minInterval - elapsed
      console.log(`[RateLimit] Aguardando intervalo mínimo: ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequest = Date.now()
    this.requestCount++
  }

  setRetryAfter(seconds: number): void {
    this.retryAfter = Date.now() + (seconds * 1000)
    console.log(`[RateLimit] Retry-after definido para ${seconds}s`)
  }

  // Reset completo
  reset(): void {
    this.lastRequest = 0
    this.retryAfter = 0
    this.requestCount = 0
    this.windowStart = Date.now()
  }

  // Obter status atual
  getStatus(): {
    requestsNaJanela: number
    tempoDesdeUltimo: number
    retryAfterAtivo: boolean
    tempoRestanteRetry: number
  } {
    const now = Date.now()
    return {
      requestsNaJanela: this.requestCount,
      tempoDesdeUltimo: now - this.lastRequest,
      retryAfterAtivo: this.retryAfter > now,
      tempoRestanteRetry: Math.max(0, this.retryAfter - now)
    }
  }
}

// Singleton para uso global
export const rateLimiter = new AnthropicRateLimiter()

// Helper para executar com retry automático
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  onRetry?: (tentativa: number, erro: Error) => void
): Promise<T> {
  let lastError: Error | null = null

  for (let tentativa = 1; tentativa <= maxRetries; tentativa++) {
    try {
      await rateLimiter.waitIfNeeded()
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Verificar se é erro de rate limit
      if (lastError.message.includes('429') || lastError.message.includes('rate limit')) {
        rateLimiter.setRetryAfter(60) // Esperar 1 minuto
      }

      if (tentativa < maxRetries) {
        onRetry?.(tentativa, lastError)
        // Espera exponencial
        const delay = Math.min(1000 * Math.pow(2, tentativa), 30000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Falha após todas as tentativas')
}

// Delay customizado
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
