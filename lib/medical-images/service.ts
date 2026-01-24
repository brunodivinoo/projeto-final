// Serviço de Busca de Imagens Médicas - Serper.dev
// ============================================
// ESTRATÉGIA DE BUSCA:
// - Serper.dev API (busca no Google Images via API)
// - Filtra para sites médicos brasileiros confiáveis
// - Cache de resultados por 24 horas
// ============================================

const SERPER_API_KEY = process.env.SERPER_API_KEY || ''

// Domínios confiáveis para imagens médicas brasileiras
const DOMINIOS_CONFIAVEIS = [
  'brasilescola.uol.com.br',
  'mundoeducacao.uol.com.br',
  'todamateria.com.br',
  'infoescola.com',
  'biologianet.com',
  'anatomiaemfoco.com.br',
  'kenhub.com',
  'sanarmed.com',
  'msdmanuals.com',
  'scielo.br',
  'gov.br',
  'fiocruz.br',
  'usp.br',
  'unicamp.br',
  'ufrj.br',
  'ufmg.br',
  'wikipedia.org',
  'medicinanet.com.br',
  'minhavida.com.br',
  'drauziovarella.uol.com.br'
]

// Domínios a EVITAR (não confiáveis)
const DOMINIOS_BLOQUEADOS = [
  'pinterest.com',
  'pinterest.com.br',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'tiktok.com',
  'aliexpress.com',
  'mercadolivre.com.br',
  'shopee.com',
  'amazon.com',
  'shutterstock.com',
  'gettyimages.com',
  'istockphoto.com',
  'dreamstime.com',
  'freepik.com'
]

export interface MedicalImage {
  id: string
  url: string
  thumbUrl: string
  title: string
  caption: string
  source: 'serper' | 'google' | 'wikimedia' | 'atlas' | 'wikipedia_pt' | 'openi'
  sourceUrl: string
  sourceName?: string
  modality?: string
  license: string
}

export interface SearchResult {
  images: MedicalImage[]
  total: number
  cached: boolean
  source: string
  queryUsed: string
  originalQuery: string
  suggestions?: string[]
}

// ==========================================
// CACHE
// ==========================================
const memoryCache = new Map<string, { data: MedicalImage[]; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 horas

function getCacheKey(query: string): string {
  return `med-img:${query.toLowerCase().replace(/\s+/g, '_')}`
}

function getFromCache(key: string): MedicalImage[] | null {
  const cached = memoryCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  memoryCache.delete(key)
  return null
}

function setCache(key: string, data: MedicalImage[]): void {
  if (memoryCache.size > 100) {
    const firstKey = memoryCache.keys().next().value
    if (firstKey) memoryCache.delete(firstKey)
  }
  memoryCache.set(key, { data, timestamp: Date.now() })
}

// ==========================================
// SERPER.DEV - BUSCA PRINCIPAL
// ==========================================

interface SerperImage {
  imageUrl?: string
  title?: string
  source?: string
  domain?: string
  link?: string
}

interface SerperResponse {
  images?: SerperImage[]
}

async function searchSerperImages(query: string, limit: number = 8): Promise<MedicalImage[]> {
  if (!SERPER_API_KEY) {
    console.log('[Serper] API Key não configurada')
    return []
  }

  try {
    console.log(`[Serper] Buscando imagens para: "${query}"`)

    const response = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `${query} anatomia medicina`,
        gl: 'br',
        hl: 'pt-br',
        num: limit * 3
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Serper] Erro HTTP:', response.status, errorText)
      return []
    }

    const data: SerperResponse = await response.json()

    if (!data.images || data.images.length === 0) {
      console.log('[Serper] Nenhuma imagem encontrada')
      return []
    }

    console.log(`[Serper] Recebidas ${data.images.length} imagens brutas`)

    interface ImagemComConfiavel extends MedicalImage {
      confiavel: boolean
    }

    const images: MedicalImage[] = data.images
      .filter((img: SerperImage) => {
        if (!img.imageUrl) return false
        const dominio = img.domain?.toLowerCase() || ''
        const bloqueado = DOMINIOS_BLOQUEADOS.some(d => dominio.includes(d))
        return !bloqueado
      })
      .map((img: SerperImage, index: number): ImagemComConfiavel => {
        const dominio = img.domain?.toLowerCase() || ''
        const ehConfiavel = DOMINIOS_CONFIAVEIS.some(d => dominio.includes(d))

        let siteName = dominio
          .replace('www.', '')
          .replace('.com.br', '')
          .replace('.com', '')
          .replace('.org', '')
          .replace('.br', '')
          .split('.')[0]
        siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1)

        return {
          id: `serper-${index}-${Date.now()}`,
          url: img.imageUrl || '',
          thumbUrl: img.imageUrl || '',
          title: img.title || 'Imagem médica',
          caption: img.title || '',
          source: 'serper' as const,
          sourceUrl: img.link || img.imageUrl || '',
          sourceName: siteName,
          modality: 'Medical',
          license: `Fonte: ${img.domain || 'desconhecida'}`,
          confiavel: ehConfiavel
        }
      })
      .sort((a: ImagemComConfiavel, b: ImagemComConfiavel) => (b.confiavel ? 1 : 0) - (a.confiavel ? 1 : 0))
      .slice(0, limit)
      .map(({ confiavel, ...rest }: ImagemComConfiavel) => rest)

    console.log(`[Serper] Retornando ${images.length} imagens válidas`)
    return images

  } catch (error) {
    console.error('[Serper] Erro de execução:', error)
    return []
  }
}

// ==========================================
// FUNÇÃO PRINCIPAL - BUSCA INTELIGENTE
// ==========================================

export async function searchMedicalImages(
  query: string,
  options: { limit?: number; useCache?: boolean } = {}
): Promise<SearchResult> {
  const { limit = 8, useCache = true } = options
  const originalQuery = query

  // Verificar cache
  if (useCache) {
    const cacheKey = getCacheKey(query)
    const cached = getFromCache(cacheKey)
    if (cached && cached.length > 0) {
      return {
        images: cached.slice(0, limit),
        total: cached.length,
        cached: true,
        source: 'cache',
        queryUsed: query,
        originalQuery
      }
    }
  }

  let images: MedicalImage[] = []
  let queryUsed = originalQuery
  let source = 'none'

  // Buscar com Serper.dev
  if (SERPER_API_KEY) {
    console.log('[ImageSearch] Buscando Serper.dev:', originalQuery)
    images = await searchSerperImages(originalQuery, limit)
    if (images.length > 0) {
      queryUsed = originalQuery
      source = 'serper'
      console.log(`[ImageSearch] ✓ Encontradas ${images.length} imagens do Serper`)
    } else {
      console.log('[ImageSearch] Serper não retornou resultados')
    }
  } else {
    console.log('[ImageSearch] ⚠️ Serper API não configurada!')
  }

  // Limitar ao número solicitado
  images = images.slice(0, limit)

  // Salvar no cache se encontrou resultados
  if (images.length > 0) {
    setCache(getCacheKey(queryUsed), images)
  }

  // Gerar sugestões se não encontrou nada
  const suggestions = images.length === 0 ? generateSuggestions(query) : undefined

  return {
    images,
    total: images.length,
    cached: false,
    source,
    queryUsed,
    originalQuery,
    suggestions
  }
}

function generateSuggestions(query: string): string[] {
  return [
    'Use termos em português como "coração", "pulmão", "histologia"',
    'Adicione "anatomia" ou "medicina" ao termo',
    'Tente termos mais específicos ou mais genéricos'
  ]
}

// Limpar cache (útil para testes)
export function clearImageCache(): void {
  memoryCache.clear()
}
