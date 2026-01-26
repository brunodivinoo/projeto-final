/**
 * Sistema de Multiplas Fontes de Imagens Medicas
 *
 * Integra com APIs confiaveis para obter imagens medicas diversificadas:
 * - Open-i NLM (National Library of Medicine) - 3.7M imagens
 * - Wikimedia Commons - Imagens medicas CC
 * - PubMed Central - Artigos com imagens
 */

import axios from 'axios'

export interface MedicalImage {
  url: string
  thumbnail?: string
  title: string
  source: string
  sourceUrl: string
  license: string
  attribution: string
  relevance: number
}

export interface ImageSearchResult {
  images: MedicalImage[]
  totalFound: number
  sources: string[]
}

// Configuracao das fontes
const IMAGE_SOURCES = {
  OPENI: {
    name: 'Open-i NLM',
    baseUrl: 'https://openi.nlm.nih.gov/api/search',
    enabled: true,
    priority: 1,
  },
  WIKIPEDIA: {
    name: 'Wikimedia Commons',
    baseUrl: 'https://commons.wikimedia.org/w/api.php',
    enabled: true,
    priority: 2,
  },
  PMC: {
    name: 'PubMed Central',
    baseUrl: 'https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi',
    enabled: true,
    priority: 3,
  }
}

// Cache simples em memoria para evitar requisicoes repetidas
const imageCache = new Map<string, { images: MedicalImage[]; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 30 // 30 minutos

/**
 * Buscar imagens no Open-i (National Library of Medicine)
 * Esta e a fonte mais confiavel para imagens medicas
 */
async function searchOpenI(query: string, limit: number = 5): Promise<MedicalImage[]> {
  try {
    const response = await axios.get(IMAGE_SOURCES.OPENI.baseUrl, {
      params: {
        query: query,
        m: limit,
        it: 'xg', // Imagens medicas
      },
      timeout: 10000,
    })

    if (!response.data?.list) return []

    return response.data.list.map((item: {
      imgLarge?: string
      imgThumb?: string
      title?: string
      uid?: string
      license?: string
      pmcid?: string
    }, index: number) => ({
      url: item.imgLarge || item.imgThumb || '',
      thumbnail: item.imgThumb,
      title: item.title || query,
      source: 'Open-i NLM',
      sourceUrl: `https://openi.nlm.nih.gov/detailedresult?img=${item.uid}`,
      license: item.license || 'Open Access',
      attribution: `Fonte: Open-i, National Library of Medicine. ${item.pmcid || ''}`,
      relevance: 1 - (index * 0.1),
    }))
  } catch (error) {
    console.error('[Open-i] Erro na busca:', error)
    return []
  }
}

/**
 * Buscar imagens no Wikimedia Commons
 * Boa fonte para diagramas anatomicos e ilustracoes
 */
async function searchWikimedia(query: string, limit: number = 5): Promise<MedicalImage[]> {
  try {
    const response = await axios.get(IMAGE_SOURCES.WIKIPEDIA.baseUrl, {
      params: {
        action: 'query',
        format: 'json',
        generator: 'search',
        gsrsearch: `${query} anatomy medical`,
        gsrlimit: limit,
        prop: 'imageinfo',
        iiprop: 'url|extmetadata',
        gsrnamespace: 6, // File namespace
        origin: '*',
      },
      timeout: 10000,
    })

    const pages = response.data?.query?.pages
    if (!pages) return []

    return Object.values(pages)
      .filter((page: unknown) => {
        const p = page as { imageinfo?: Array<{ url?: string }> }
        return p.imageinfo?.[0]?.url
      })
      .map((page: unknown, index: number) => {
        const p = page as {
          title?: string
          imageinfo?: Array<{
            url?: string
            thumburl?: string
            extmetadata?: {
              LicenseShortName?: { value?: string }
              Artist?: { value?: string }
            }
          }>
        }
        const info = p.imageinfo?.[0]
        const meta = info?.extmetadata || {}
        return {
          url: info?.url || '',
          thumbnail: info?.thumburl || info?.url || '',
          title: p.title?.replace('File:', '') || query,
          source: 'Wikimedia Commons',
          sourceUrl: `https://commons.wikimedia.org/wiki/${p.title}`,
          license: meta.LicenseShortName?.value || 'CC',
          attribution: `Fonte: Wikimedia Commons. ${meta.Artist?.value || ''}`,
          relevance: 0.8 - (index * 0.1),
        }
      })
  } catch (error) {
    console.error('[Wikimedia] Erro na busca:', error)
    return []
  }
}

/**
 * Buscar em multiplas fontes e combinar resultados
 */
export async function searchMedicalImages(
  query: string,
  options: {
    limit?: number
    sources?: string[]
    shuffleResults?: boolean
  } = {}
): Promise<ImageSearchResult> {
  const { limit = 10, shuffleResults = true } = options

  // Verificar cache
  const cacheKey = `${query}-${limit}`
  const cached = imageCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[ImageSearch] Usando cache para:', query)
    return {
      images: cached.images,
      totalFound: cached.images.length,
      sources: [...new Set(cached.images.map(img => img.source))]
    }
  }

  // Buscar em paralelo em todas as fontes
  const [openiResults, wikimediaResults] = await Promise.all([
    searchOpenI(query, Math.ceil(limit / 2)),
    searchWikimedia(query, Math.ceil(limit / 2)),
  ])

  // Combinar resultados
  let allImages = [...openiResults, ...wikimediaResults]

  // Filtrar imagens invalidas
  allImages = allImages.filter(img =>
    img.url &&
    img.url.startsWith('http') &&
    !img.url.includes('placeholder')
  )

  // Embaralhar se solicitado (para variedade)
  if (shuffleResults) {
    allImages = allImages.sort(() => Math.random() - 0.5)
  } else {
    // Ordenar por relevancia
    allImages = allImages.sort((a, b) => b.relevance - a.relevance)
  }

  // Limitar resultados
  const images = allImages.slice(0, limit)

  // Identificar fontes utilizadas
  const sources = [...new Set(images.map(img => img.source))]

  // Salvar no cache
  imageCache.set(cacheKey, { images, timestamp: Date.now() })

  return {
    images,
    totalFound: allImages.length,
    sources,
  }
}

// Traducoes de termos medicos para ingles (busca mais eficiente)
const MEDICAL_TRANSLATIONS: Record<string, string> = {
  'sistema digestivo': 'digestive system anatomy',
  'sistema cardiovascular': 'cardiovascular system heart anatomy',
  'sistema respiratorio': 'respiratory system lungs anatomy',
  'sistema respiratório': 'respiratory system lungs anatomy',
  'sistema nervoso': 'nervous system brain anatomy',
  'sistema urinario': 'urinary system kidney anatomy',
  'sistema urinário': 'urinary system kidney anatomy',
  'sistema reprodutor': 'reproductive system anatomy',
  'sistema endocrino': 'endocrine system glands anatomy',
  'sistema endócrino': 'endocrine system glands anatomy',
  'sistema muscular': 'muscular system anatomy',
  'sistema esqueletico': 'skeletal system bones anatomy',
  'sistema esquelético': 'skeletal system bones anatomy',
  'sistema linfatico': 'lymphatic system anatomy',
  'sistema linfático': 'lymphatic system anatomy',
  'coracao': 'heart cardiac anatomy',
  'coração': 'heart cardiac anatomy',
  'pulmao': 'lung pulmonary anatomy',
  'pulmão': 'lung pulmonary anatomy',
  'figado': 'liver hepatic anatomy',
  'fígado': 'liver hepatic anatomy',
  'rim': 'kidney renal anatomy',
  'rins': 'kidney renal anatomy',
  'estomago': 'stomach gastric anatomy',
  'estômago': 'stomach gastric anatomy',
  'intestino': 'intestine bowel anatomy',
  'cerebro': 'brain cerebral anatomy',
  'cérebro': 'brain cerebral anatomy',
  'medula espinhal': 'spinal cord anatomy',
  'coluna vertebral': 'spine vertebral column anatomy',
  'pancreas': 'pancreas anatomy',
  'pâncreas': 'pancreas anatomy',
  'tireoide': 'thyroid gland anatomy',
  'tireóide': 'thyroid gland anatomy',
  'baco': 'spleen anatomy',
  'baço': 'spleen anatomy',
  'vesicula biliar': 'gallbladder anatomy',
  'vesícula biliar': 'gallbladder anatomy',
  'infarto': 'myocardial infarction heart attack',
  'avc': 'stroke cerebrovascular accident',
  'acidente vascular cerebral': 'stroke cerebrovascular accident',
  'pneumonia': 'pneumonia lung infection',
  'diabetes': 'diabetes mellitus',
  'hipertensao': 'hypertension blood pressure',
  'hipertensão': 'hypertension blood pressure',
  'cancer': 'cancer oncology',
  'câncer': 'cancer oncology',
  'tumor': 'tumor neoplasm',
  'fratura': 'fracture bone',
  'artrose': 'osteoarthritis joint',
  'artrite': 'arthritis inflammation joint',
}

/**
 * Traduzir termos medicos para ingles para busca mais eficiente
 */
export function translateMedicalTerm(term: string): string {
  const lowerTerm = term.toLowerCase()

  // Verificar traducao direta
  for (const [pt, en] of Object.entries(MEDICAL_TRANSLATIONS)) {
    if (lowerTerm.includes(pt)) {
      return en
    }
  }

  // Retornar termo original + "medical anatomy" se nao encontrar
  return `${term} medical anatomy`
}

/**
 * Funcao principal para usar no chat - busca imagens relevantes para um topico
 */
export async function getRelevantMedicalImages(
  topic: string,
  userId: string,
  options: { maxImages?: number } = {}
): Promise<MedicalImage[]> {
  const { maxImages = 5 } = options

  // Traduzir termo para busca
  const searchTerm = translateMedicalTerm(topic)

  console.log(`[MedicalImages] Buscando imagens para: "${topic}" -> "${searchTerm}"`)

  // Buscar imagens
  const result = await searchMedicalImages(searchTerm, {
    limit: maxImages,
    shuffleResults: true, // Variar resultados
  })

  console.log(`[MedicalImages] Encontradas ${result.images.length} imagens de ${result.sources.join(', ')}`)

  return result.images
}

/**
 * Formatar imagens para exibicao no chat
 */
export function formatImagesForChat(images: MedicalImage[]): string {
  if (images.length === 0) {
    return 'Nao foram encontradas imagens de referencia para este topico.'
  }

  const formatted = images.map((img, i) =>
    `${i + 1}. **${img.title}**\n   ![${img.title}](${img.url})\n   _${img.attribution}_`
  ).join('\n\n')

  return `**Imagens de Referencia:**\n\n${formatted}`
}

/**
 * Limpar cache de imagens
 */
export function clearImageCache(): void {
  imageCache.clear()
  console.log('[MedicalImages] Cache limpo')
}
