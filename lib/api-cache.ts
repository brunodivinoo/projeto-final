import { NextResponse } from 'next/server'

/**
 * Adiciona headers de cache a uma resposta API
 *
 * Estrategias:
 * - 'public-short': Dados publicos, cache 1 min (disciplinas, filtros)
 * - 'public-long': Dados publicos raramente alterados, cache 5 min
 * - 'private-short': Dados do usuario, cache 30s (uso, estatisticas)
 * - 'private-medium': Dados do usuario, cache 2 min (sugestoes, categorias)
 * - 'no-cache': Sem cache (mutations, dados em tempo real)
 */
type CacheStrategy = 'public-short' | 'public-long' | 'private-short' | 'private-medium' | 'no-cache'

const CACHE_HEADERS: Record<CacheStrategy, string> = {
  'public-short': 'public, s-maxage=60, stale-while-revalidate=120',
  'public-long': 'public, s-maxage=300, stale-while-revalidate=600',
  'private-short': 'private, max-age=30, stale-while-revalidate=60',
  'private-medium': 'private, max-age=120, stale-while-revalidate=240',
  'no-cache': 'no-cache, no-store, must-revalidate',
}

export function cachedResponse<T>(
  data: T,
  strategy: CacheStrategy = 'private-short',
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status })
  response.headers.set('Cache-Control', CACHE_HEADERS[strategy])
  return response
}
