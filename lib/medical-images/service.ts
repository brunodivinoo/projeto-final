// Serviço de Busca de Imagens Médicas Reais
// Fonte principal: OpenI (NIH) - API gratuita sem autenticação
// Fallback: Wikimedia Commons

export interface MedicalImage {
  id: string
  url: string
  thumbUrl: string
  title: string
  caption: string
  source: 'openi' | 'wikimedia'
  sourceUrl: string
  modality?: string
  license: string
}

export interface SearchResult {
  images: MedicalImage[]
  total: number
  cached: boolean
  source: string
}

// Cache em memória simples (MVP)
// TODO: Migrar para Vercel KV quando atingir ~20 usuários
// Ver: Medicina/ESCALABILIDADE-E-PLANOS.md
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
  memoryCache.delete(key) // Limpar cache expirado
  return null
}

function setCache(key: string, data: MedicalImage[]): void {
  // Limitar tamanho do cache em memória (máx 100 queries)
  if (memoryCache.size > 100) {
    const firstKey = memoryCache.keys().next().value
    if (firstKey) memoryCache.delete(firstKey)
  }
  memoryCache.set(key, { data, timestamp: Date.now() })
}

// Detectar modalidade da imagem baseado no caption/título
function detectModality(item: OpenIItem): string {
  const text = `${item.title || ''} ${item.image?.caption || ''}`.toLowerCase()

  if (text.includes('x-ray') || text.includes('radiograph') || text.includes('xray')) return 'X-Ray'
  if (text.includes('ct') || text.includes('computed tomography') || text.includes('tomograph')) return 'CT'
  if (text.includes('mri') || text.includes('magnetic resonance')) return 'MRI'
  if (text.includes('ultrasound') || text.includes('echo') || text.includes('sonograph')) return 'Ultrasound'
  if (text.includes('histolog') || text.includes('microscop') || text.includes('patholog')) return 'Histology'
  if (text.includes('pet') || text.includes('positron')) return 'PET'
  if (text.includes('dermato') || text.includes('skin')) return 'Dermatology'
  if (text.includes('endoscop')) return 'Endoscopy'

  return 'Medical'
}

// Interface para resposta do OpenI
interface OpenIItem {
  uid: string
  title: string
  imgThumb: string
  imgLarge: string
  pmc_url: string
  image?: {
    caption?: string
  }
}

interface OpenIResponse {
  total: number
  list: OpenIItem[]
}

// Busca no OpenI (NIH)
async function searchOpenI(query: string, limit: number = 10): Promise<MedicalImage[]> {
  try {
    const response = await fetch(
      `https://openi.nlm.nih.gov/api/search?query=${encodeURIComponent(query)}&m=1&n=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        // Timeout de 10 segundos
        signal: AbortSignal.timeout(10000)
      }
    )

    if (!response.ok) {
      throw new Error(`OpenI API error: ${response.status}`)
    }

    const data: OpenIResponse = await response.json()

    if (!data.list || data.list.length === 0) {
      return []
    }

    return data.list.map((item) => ({
      id: item.uid,
      url: `https://openi.nlm.nih.gov${item.imgLarge}`,
      thumbUrl: `https://openi.nlm.nih.gov${item.imgThumb}`,
      title: item.title || 'Medical Image',
      caption: item.image?.caption || '',
      source: 'openi' as const,
      sourceUrl: item.pmc_url || `https://www.ncbi.nlm.nih.gov/pmc/articles/${item.uid}`,
      modality: detectModality(item),
      license: 'Open Access (PubMed Central)'
    }))
  } catch (error) {
    console.error('OpenI search error:', error)
    return []
  }
}

// Interface para resposta do Wikimedia
interface WikimediaSearchItem {
  title: string
  pageid: number
}

interface WikimediaImageInfo {
  url: string
  extmetadata?: {
    ImageDescription?: { value: string }
    License?: { value: string }
  }
}

interface WikimediaPage {
  pageid: number
  title: string
  imageinfo?: WikimediaImageInfo[]
}

// Busca no Wikimedia Commons (fallback)
async function searchWikimedia(query: string, limit: number = 10): Promise<MedicalImage[]> {
  try {
    // Buscar arquivos
    const searchResponse = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' medical')}&srnamespace=6&format=json&srlimit=${limit}&origin=*`,
      { signal: AbortSignal.timeout(10000) }
    )

    if (!searchResponse.ok) {
      throw new Error(`Wikimedia search error: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()
    const items: WikimediaSearchItem[] = searchData.query?.search || []

    if (items.length === 0) return []

    // Pegar URLs das imagens
    const titles = items.map((item) => item.title).join('|')
    const infoResponse = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`,
      { signal: AbortSignal.timeout(10000) }
    )

    if (!infoResponse.ok) {
      throw new Error(`Wikimedia info error: ${infoResponse.status}`)
    }

    const infoData = await infoResponse.json()
    const pages: WikimediaPage[] = Object.values(infoData.query?.pages || {})

    return pages
      .filter((page) => page.imageinfo?.[0]?.url)
      .map((page) => {
        const info = page.imageinfo![0]
        const fileName = page.title.replace('File:', '').replace(/_/g, ' ')

        return {
          id: `wiki-${page.pageid}`,
          url: info.url,
          thumbUrl: info.url, // Wikimedia já retorna URL direta
          title: fileName,
          caption: info.extmetadata?.ImageDescription?.value || '',
          source: 'wikimedia' as const,
          sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
          modality: 'Medical',
          license: info.extmetadata?.License?.value || 'Creative Commons'
        }
      })
  } catch (error) {
    console.error('Wikimedia search error:', error)
    return []
  }
}

// Função principal de busca com cache e fallback
export async function searchMedicalImages(
  query: string,
  options: { limit?: number; useCache?: boolean } = {}
): Promise<SearchResult> {
  const { limit = 6, useCache = true } = options
  const cacheKey = getCacheKey(query)

  // Verificar cache primeiro
  if (useCache) {
    const cached = getFromCache(cacheKey)
    if (cached) {
      return {
        images: cached.slice(0, limit),
        total: cached.length,
        cached: true,
        source: 'cache'
      }
    }
  }

  // Tentar OpenI primeiro (melhor qualidade médica)
  let images = await searchOpenI(query, limit)
  let source = 'openi'

  // Se não encontrou no OpenI, tentar Wikimedia
  if (images.length === 0) {
    images = await searchWikimedia(query, limit)
    source = 'wikimedia'
  }

  // Salvar no cache se encontrou resultados
  if (images.length > 0) {
    setCache(cacheKey, images)
  }

  return {
    images,
    total: images.length,
    cached: false,
    source: images.length > 0 ? source : 'none'
  }
}

// Limpar cache (útil para testes)
export function clearImageCache(): void {
  memoryCache.clear()
}
