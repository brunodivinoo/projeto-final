// Cache Semântico para PREPARAMED
// Evita chamadas repetidas à LLM para perguntas similares
// Implementação em memória (sem necessidade de tabela no Supabase)

interface CacheEntry {
  perguntaNormalizada: string
  resposta: string
  fontes: string[]
  criadoEm: number
  acessos: number
}

// Cache em memória com TTL
const cache = new Map<string, CacheEntry>()

// Configurações
const MAX_ENTRIES = 500
const TTL_MS = 30 * 60 * 1000 // 30 minutos
const SIMILARITY_THRESHOLD = 0.85

/**
 * Normaliza texto para comparação
 * Remove acentos, pontuação, stopwords e converte para minúsculas
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ')        // Remove pontuação
    .replace(/\s+/g, ' ')            // Normaliza espaços
    .trim()
}

/**
 * Extrai palavras-chave médicas relevantes
 */
function extrairPalavrasChave(texto: string): Set<string> {
  const normalizado = normalizar(texto)
  const palavras = normalizado.split(' ')

  // Stopwords em português
  const stopwords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da',
    'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com',
    'sem', 'sob', 'sobre', 'entre', 'que', 'qual', 'quais', 'como', 'quando',
    'onde', 'porque', 'e', 'ou', 'mas', 'se', 'nao', 'sim', 'mais', 'menos',
    'muito', 'pouco', 'todo', 'toda', 'cada', 'esse', 'essa', 'este', 'esta',
    'aquele', 'aquela', 'meu', 'seu', 'nosso', 'voce', 'ele', 'ela', 'nos',
    'me', 'te', 'lhe', 'ser', 'estar', 'ter', 'haver', 'fazer', 'poder',
    'dever', 'ir', 'vir', 'dar', 'falar', 'dizer', 'ver', 'saber',
    'explique', 'explica', 'fale', 'conte', 'descreva', 'cite', 'liste',
  ])

  return new Set(
    palavras.filter(p => p.length > 2 && !stopwords.has(p))
  )
}

/**
 * Calcula similaridade entre dois conjuntos de palavras (Jaccard)
 */
function calcularSimilaridade(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0

  let intersecao = 0
  for (const palavra of set1) {
    if (set2.has(palavra)) intersecao++
  }

  const uniao = set1.size + set2.size - intersecao
  return uniao > 0 ? intersecao / uniao : 0
}

/**
 * Gera chave de cache baseada nas palavras-chave ordenadas
 */
function gerarChave(palavrasChave: Set<string>): string {
  return Array.from(palavrasChave).sort().join('|')
}

/**
 * Limpa entradas expiradas do cache
 */
function limparExpirados(): void {
  const agora = Date.now()
  for (const [chave, entrada] of cache) {
    if (agora - entrada.criadoEm > TTL_MS) {
      cache.delete(chave)
    }
  }

  // Se ainda excede o limite, remover os menos acessados
  if (cache.size > MAX_ENTRIES) {
    const entradas = Array.from(cache.entries())
      .sort((a, b) => a[1].acessos - b[1].acessos)

    const remover = entradas.slice(0, cache.size - MAX_ENTRIES)
    for (const [chave] of remover) {
      cache.delete(chave)
    }
  }
}

/**
 * Busca no cache semântico por pergunta similar
 * Retorna a resposta cacheada se similaridade > threshold
 */
export function buscarCacheSemantico(pergunta: string): {
  encontrado: boolean
  resposta?: string
  fontes?: string[]
  similaridade?: number
} {
  const palavrasChave = extrairPalavrasChave(pergunta)
  if (palavrasChave.size < 2) return { encontrado: false }

  let melhorMatch: CacheEntry | null = null
  let melhorSimilaridade = 0

  for (const [, entrada] of cache) {
    const palavrasCacheadas = extrairPalavrasChave(entrada.perguntaNormalizada)
    const sim = calcularSimilaridade(palavrasChave, palavrasCacheadas)

    if (sim > melhorSimilaridade && sim >= SIMILARITY_THRESHOLD) {
      melhorSimilaridade = sim
      melhorMatch = entrada
    }
  }

  if (melhorMatch) {
    melhorMatch.acessos++
    console.log(`[CacheSemântico] HIT! Similaridade: ${(melhorSimilaridade * 100).toFixed(1)}%`)
    return {
      encontrado: true,
      resposta: melhorMatch.resposta,
      fontes: melhorMatch.fontes,
      similaridade: melhorSimilaridade,
    }
  }

  return { encontrado: false }
}

/**
 * Salva resposta no cache semântico
 */
export function salvarCacheSemantico(
  pergunta: string,
  resposta: string,
  fontes: string[] = []
): void {
  // Limpar expirados periodicamente
  if (cache.size > MAX_ENTRIES * 0.8) {
    limparExpirados()
  }

  const palavrasChave = extrairPalavrasChave(pergunta)
  if (palavrasChave.size < 2) return // Não cachear perguntas muito curtas

  const chave = gerarChave(palavrasChave)

  cache.set(chave, {
    perguntaNormalizada: pergunta,
    resposta,
    fontes,
    criadoEm: Date.now(),
    acessos: 1,
  })

  console.log(`[CacheSemântico] SAVE: "${pergunta.slice(0, 60)}..." (${cache.size} entries)`)
}

/**
 * Estatísticas do cache
 */
export function estatisticasCache(): {
  totalEntradas: number
  memoriaEstimadaKB: number
} {
  let totalBytes = 0
  for (const [, entrada] of cache) {
    totalBytes += entrada.perguntaNormalizada.length + entrada.resposta.length
  }

  return {
    totalEntradas: cache.size,
    memoriaEstimadaKB: Math.round(totalBytes / 1024),
  }
}
