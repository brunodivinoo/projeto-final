// Serviço de Busca de Imagens Médicas Reais
// Fonte principal: OpenI (NIH) - API gratuita sem autenticação
// Fallback: Wikimedia Commons
// Sistema inteligente de busca com tradução e termos alternativos

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
  queryUsed: string // Mostra qual termo encontrou resultados
  originalQuery: string
  suggestions?: string[] // Sugestões quando não encontrar
}

// ==========================================
// DICIONÁRIO DE TRADUÇÃO MÉDICA PT → EN
// ==========================================
const MEDICAL_DICTIONARY: Record<string, string> = {
  // Órgãos e Anatomia
  'coração': 'heart',
  'pulmão': 'lung',
  'pulmões': 'lungs',
  'fígado': 'liver',
  'rim': 'kidney',
  'rins': 'kidneys',
  'cérebro': 'brain',
  'estômago': 'stomach',
  'intestino': 'intestine',
  'osso': 'bone',
  'ossos': 'bones',
  'músculo': 'muscle',
  'pele': 'skin',
  'olho': 'eye',
  'ouvido': 'ear',
  'coluna': 'spine',
  'tórax': 'chest thorax',
  'abdome': 'abdomen',
  'abdômen': 'abdomen',
  'crânio': 'skull cranium',
  'pelve': 'pelvis',
  'artéria': 'artery',
  'veia': 'vein',
  'sangue': 'blood',
  'linfonodo': 'lymph node',
  'tireoide': 'thyroid',
  'pâncreas': 'pancreas',
  'baço': 'spleen',
  'vesícula': 'gallbladder',
  'bexiga': 'bladder',
  'próstata': 'prostate',
  'útero': 'uterus',
  'ovário': 'ovary',
  'mama': 'breast',
  'joelho': 'knee',
  'tornozelo': 'ankle',
  'ombro': 'shoulder',
  'cotovelo': 'elbow',
  'punho': 'wrist',
  'mão': 'hand',
  'pé': 'foot',

  // Exames de Imagem
  'raio-x': 'x-ray xray radiograph',
  'raio x': 'x-ray xray radiograph',
  'radiografia': 'x-ray radiograph',
  'tomografia': 'ct scan computed tomography',
  'ressonância': 'mri magnetic resonance',
  'ressonância magnética': 'mri magnetic resonance imaging',
  'ultrassom': 'ultrasound sonography',
  'ultrassonografia': 'ultrasound sonography',
  'ecografia': 'ultrasound ecography',
  'ecocardiograma': 'echocardiogram',
  'mamografia': 'mammography mammogram',
  'endoscopia': 'endoscopy',
  'colonoscopia': 'colonoscopy',
  'angiografia': 'angiography',
  'cintilografia': 'scintigraphy',
  'pet scan': 'pet scan positron emission',
  'densitometria': 'bone densitometry dexa',

  // Doenças Comuns
  'pneumonia': 'pneumonia lung infection',
  'tuberculose': 'tuberculosis tb',
  'infarto': 'myocardial infarction heart attack',
  'avc': 'stroke cerebrovascular accident',
  'derrame': 'stroke hemorrhage',
  'câncer': 'cancer carcinoma tumor',
  'tumor': 'tumor neoplasm mass',
  'fratura': 'fracture bone break',
  'artrose': 'osteoarthritis arthrosis',
  'artrite': 'arthritis',
  'diabetes': 'diabetes mellitus',
  'hipertensão': 'hypertension high blood pressure',
  'cirrose': 'cirrhosis liver',
  'hepatite': 'hepatitis liver',
  'pancreatite': 'pancreatitis',
  'apendicite': 'appendicitis',
  'colecistite': 'cholecystitis gallbladder',
  'diverticulite': 'diverticulitis',
  'hérnia': 'hernia',
  'embolia': 'embolism',
  'trombose': 'thrombosis',
  'aneurisma': 'aneurysm',
  'edema': 'edema swelling',
  'efusão': 'effusion',
  'derrame pleural': 'pleural effusion',
  'atelectasia': 'atelectasis lung collapse',
  'consolidação': 'consolidation',
  'nódulo': 'nodule',
  'massa': 'mass lesion',
  'lesão': 'lesion',
  'abscesso': 'abscess',
  'cisto': 'cyst',
  'pólipo': 'polyp',
  'úlcera': 'ulcer',
  'gastrite': 'gastritis',
  'esofagite': 'esophagitis',
  'colite': 'colitis',
  'enterite': 'enteritis',
  'meningite': 'meningitis',
  'encefalite': 'encephalitis',
  'esclerose': 'sclerosis',
  'fibrose': 'fibrosis',
  'necrose': 'necrosis',
  'isquemia': 'ischemia',
  'hemorragia': 'hemorrhage bleeding',
  'infecção': 'infection',
  'inflamação': 'inflammation',
  'metástase': 'metastasis',
  'melanoma': 'melanoma skin cancer',
  'carcinoma': 'carcinoma',
  'adenocarcinoma': 'adenocarcinoma',
  'linfoma': 'lymphoma',
  'leucemia': 'leukemia',
  'osteomielite': 'osteomyelitis bone infection',
  'osteoporose': 'osteoporosis',
  'escoliose': 'scoliosis',
  'lordose': 'lordosis',
  'cifose': 'kyphosis',
  'hérnia de disco': 'disc herniation',
  'espondilose': 'spondylosis',
  'estenose': 'stenosis',

  // Histologia e Patologia
  'histologia': 'histology histopathology microscopy',
  'biópsia': 'biopsy',
  'lâmina': 'slide microscopy',
  'corte histológico': 'histological section',
  'coloração': 'staining',
  'hematoxilina': 'hematoxylin eosin HE stain',
  'imuno-histoquímica': 'immunohistochemistry IHC',
  'citologia': 'cytology',
  'anatomia patológica': 'pathology gross specimen',

  // Dermatologia
  'psoríase': 'psoriasis',
  'eczema': 'eczema dermatitis',
  'dermatite': 'dermatitis',
  'urticária': 'urticaria hives',
  'acne': 'acne',
  'herpes': 'herpes',
  'verruga': 'wart verruca',
  'nevo': 'nevus mole',
  'queimadura': 'burn',
  'eritema': 'erythema',
  'petéquia': 'petechiae',
  'púrpura': 'purpura',
  'vitiligo': 'vitiligo',

  // Cardiologia
  'eletrocardiograma': 'ecg ekg electrocardiogram',
  'ecg': 'ecg ekg electrocardiogram',
  'arritmia': 'arrhythmia',
  'fibrilação': 'fibrillation',
  'taquicardia': 'tachycardia',
  'bradicardia': 'bradycardia',
  'sopro': 'murmur heart',
  'valvulopatia': 'valvular disease',
  'cardiomiopatia': 'cardiomyopathy',
  'pericardite': 'pericarditis',
  'endocardite': 'endocarditis',
  'insuficiência cardíaca': 'heart failure',

  // Termos Gerais
  'normal': 'normal',
  'anormal': 'abnormal pathological',
  'bilateral': 'bilateral',
  'unilateral': 'unilateral',
  'agudo': 'acute',
  'crônico': 'chronic',
  'benigno': 'benign',
  'maligno': 'malignant',
  'difuso': 'diffuse',
  'focal': 'focal',
  'localizado': 'localized',
  'sistêmico': 'systemic',
}

// ==========================================
// TERMOS ALTERNATIVOS / SINÔNIMOS
// ==========================================
const ALTERNATIVE_TERMS: Record<string, string[]> = {
  'pneumonia': ['pneumonia consolidation', 'lung infection infiltrate', 'lobar pneumonia'],
  'tuberculose': ['tuberculosis tb', 'pulmonary tb cavitation', 'tuberculous'],
  'infarto': ['myocardial infarction', 'heart attack ami', 'cardiac infarction'],
  'avc': ['stroke brain', 'cerebral infarction', 'intracranial hemorrhage'],
  'fratura': ['fracture bone', 'broken bone', 'bone fracture xray'],
  'tumor': ['tumor mass', 'neoplasm', 'malignancy cancer'],
  'câncer de pulmão': ['lung cancer', 'pulmonary carcinoma', 'lung tumor mass'],
  'câncer de mama': ['breast cancer', 'mammary carcinoma', 'breast tumor'],
  'hérnia de disco': ['disc herniation', 'herniated disc mri', 'lumbar disc'],
  'apendicite': ['appendicitis ct', 'acute appendicitis', 'appendix inflammation'],
  'colecistite': ['cholecystitis', 'gallbladder inflammation', 'acute cholecystitis ultrasound'],
  'pancreatite': ['pancreatitis ct', 'acute pancreatitis', 'pancreas inflammation'],
  'cirrose': ['liver cirrhosis', 'hepatic cirrhosis', 'cirrhotic liver'],
  'derrame pleural': ['pleural effusion', 'pleural fluid', 'chest xray effusion'],
  'edema pulmonar': ['pulmonary edema', 'lung edema', 'cardiogenic edema'],
  'embolia pulmonar': ['pulmonary embolism ct', 'pe ct angiography', 'lung embolism'],
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
// TRADUÇÃO INTELIGENTE
// ==========================================

/**
 * Traduz termos médicos de português para inglês
 * Usa o dicionário e também detecta padrões
 */
function translateToEnglish(query: string): string {
  let translated = query.toLowerCase()

  // Substituir termos conhecidos do dicionário
  for (const [pt, en] of Object.entries(MEDICAL_DICTIONARY)) {
    const regex = new RegExp(`\\b${pt}\\b`, 'gi')
    translated = translated.replace(regex, en.split(' ')[0]) // Usa primeiro termo
  }

  // Se não mudou nada, provavelmente já está em inglês ou é termo desconhecido
  return translated
}

/**
 * Gera variações de busca para aumentar chances de encontrar
 */
function generateSearchVariations(query: string): string[] {
  const variations: string[] = []
  const lowerQuery = query.toLowerCase()

  // 1. Query original traduzida
  const translated = translateToEnglish(query)
  variations.push(translated)

  // 2. Verificar se tem termo alternativo específico
  for (const [key, alts] of Object.entries(ALTERNATIVE_TERMS)) {
    if (lowerQuery.includes(key) || translated.includes(key)) {
      variations.push(...alts)
    }
  }

  // 3. Adicionar modificadores comuns se for termo de imagem
  if (!translated.includes('xray') && !translated.includes('ct') && !translated.includes('mri')) {
    // Tentar adicionar modalidade comum
    variations.push(`${translated} xray`)
    variations.push(`${translated} ct scan`)
    variations.push(`${translated} mri`)
  }

  // 4. Versão mais genérica (remover adjetivos específicos)
  const genericTerms = translated
    .replace(/\b(agudo|crônico|grave|leve|moderado|severo|bilateral|unilateral)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (genericTerms !== translated) {
    variations.push(genericTerms)
  }

  // 5. Apenas substantivos principais
  const mainTerms = translated.split(' ').slice(0, 2).join(' ')
  if (mainTerms !== translated && mainTerms.length > 3) {
    variations.push(mainTerms)
  }

  // Remover duplicatas e strings vazias
  return [...new Set(variations.filter(v => v.trim().length > 2))]
}

/**
 * Gera sugestões de busca quando não encontra resultados
 */
function generateSuggestions(query: string): string[] {
  const suggestions: string[] = []
  const translated = translateToEnglish(query)

  // Sugerir termos relacionados do dicionário
  for (const [pt, en] of Object.entries(MEDICAL_DICTIONARY)) {
    if (translated.includes(en.split(' ')[0]) || pt.includes(query.toLowerCase().split(' ')[0])) {
      suggestions.push(`Tente: "${en.split(' ')[0]}"`)
    }
  }

  // Sugestões genéricas
  if (suggestions.length === 0) {
    suggestions.push('Tente usar termos em inglês')
    suggestions.push('Use termos mais genéricos')
    suggestions.push('Adicione a modalidade (xray, ct, mri)')
  }

  return suggestions.slice(0, 3)
}

// ==========================================
// DETECÇÃO DE MODALIDADE
// ==========================================
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
  if (text.includes('ecg') || text.includes('ekg') || text.includes('electrocardiogram')) return 'ECG'
  if (text.includes('mammogra')) return 'Mammography'
  if (text.includes('angiogra')) return 'Angiography'

  return 'Medical'
}

// ==========================================
// BUSCA NO OPENI
// ==========================================
interface OpenIResponse {
  total: number
  list: OpenIItem[]
}

async function searchOpenI(query: string, limit: number = 10): Promise<MedicalImage[]> {
  try {
    // Usar a API do OpenI com parâmetros otimizados
    // it=xg busca apenas imagens de raio-X/gráficos (mais confiáveis)
    const response = await fetch(
      `https://openi.nlm.nih.gov/api/search?query=${encodeURIComponent(query)}&m=1&n=${limit * 2}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PreparaMed/1.0 (Medical Education App)'
        },
        signal: AbortSignal.timeout(15000),
        cache: 'no-store' // Evitar cache do browser que pode causar CORS
      }
    )

    if (!response.ok) {
      console.error(`OpenI API error: ${response.status}`)
      throw new Error(`OpenI API error: ${response.status}`)
    }

    const data: OpenIResponse = await response.json()

    if (!data.list || data.list.length === 0) {
      return []
    }

    const validImages = data.list
      .filter(item => item.imgLarge || item.imgThumb) // Filtrar itens sem imagens
      .slice(0, limit)
      .map((item) => {
        // Construir URLs corretas - OpenI usa caminhos relativos
        const baseUrl = 'https://openi.nlm.nih.gov'

        // Tratar os caminhos de imagem
        let imgLarge = item.imgLarge || ''
        let imgThumb = item.imgThumb || ''

        // Garantir que o caminho começa com /
        if (imgLarge && !imgLarge.startsWith('http')) {
          imgLarge = imgLarge.startsWith('/') ? `${baseUrl}${imgLarge}` : `${baseUrl}/${imgLarge}`
        }
        if (imgThumb && !imgThumb.startsWith('http')) {
          imgThumb = imgThumb.startsWith('/') ? `${baseUrl}${imgThumb}` : `${baseUrl}/${imgThumb}`
        }

        // Fallback: usar imagem grande se thumb não existir
        if (!imgThumb) imgThumb = imgLarge
        if (!imgLarge) imgLarge = imgThumb

        return {
          id: item.uid || `openi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: imgLarge,
          thumbUrl: imgThumb,
          title: item.title || 'Medical Image',
          caption: item.image?.caption || '',
          source: 'openi' as const,
          sourceUrl: item.pmc_url || `https://www.ncbi.nlm.nih.gov/pmc/articles/${item.uid}`,
          modality: detectModality(item),
          license: 'Open Access (PubMed Central)'
        }
      })
      .filter(img => img.url && img.url.length > 10) // Filtrar imagens sem URL válida

    return validImages
  } catch (error) {
    console.error('OpenI search error:', error)
    return []
  }
}

// ==========================================
// BUSCA NO WIKIMEDIA
// ==========================================
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

async function searchWikimedia(query: string, limit: number = 10): Promise<MedicalImage[]> {
  try {
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
          thumbUrl: info.url,
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

// ==========================================
// FUNÇÃO PRINCIPAL - BUSCA INTELIGENTE
// ==========================================

/**
 * Busca imagens médicas com sistema inteligente:
 * 1. Traduz automaticamente PT → EN
 * 2. Tenta múltiplas variações do termo
 * 3. Fallback progressivo (específico → genérico)
 * 4. Cache de resultados
 * 5. Retorna sugestões quando não encontra
 */
export async function searchMedicalImages(
  query: string,
  options: { limit?: number; useCache?: boolean } = {}
): Promise<SearchResult> {
  const { limit = 6, useCache = true } = options
  const originalQuery = query

  // Gerar variações de busca
  const searchVariations = generateSearchVariations(query)

  // Verificar cache para cada variação
  if (useCache) {
    for (const variation of searchVariations) {
      const cacheKey = getCacheKey(variation)
      const cached = getFromCache(cacheKey)
      if (cached && cached.length > 0) {
        return {
          images: cached.slice(0, limit),
          total: cached.length,
          cached: true,
          source: 'cache',
          queryUsed: variation,
          originalQuery
        }
      }
    }
  }

  // Tentar cada variação até encontrar resultados
  let images: MedicalImage[] = []
  let queryUsed = searchVariations[0]
  let source = 'none'

  for (const variation of searchVariations) {
    // Tentar OpenI primeiro
    images = await searchOpenI(variation, limit)
    if (images.length > 0) {
      queryUsed = variation
      source = 'openi'
      break
    }

    // Tentar Wikimedia como fallback
    images = await searchWikimedia(variation, limit)
    if (images.length > 0) {
      queryUsed = variation
      source = 'wikimedia'
      break
    }
  }

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

// Limpar cache (útil para testes)
export function clearImageCache(): void {
  memoryCache.clear()
}

// Exportar função de tradução para uso externo
export { translateToEnglish, generateSearchVariations }
