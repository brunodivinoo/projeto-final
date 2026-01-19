import OpenAI from 'openai'

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ============================================
// TIPOS
// ============================================

export type ImageQuality = 'low' | 'medium' | 'high'
export type ImageSize = '1024x1024' | '1024x1536' | '1536x1024'
export type ImageStyle = 'vivid' | 'natural'

export interface GenerateImageOptions {
  prompt: string
  model?: string
  quality?: ImageQuality
  size?: ImageSize
  style?: ImageStyle
  n?: number
}

export interface GeneratedImage {
  url?: string
  base64?: string
  revisedPrompt: string
  estimatedCost: number
}

// ============================================
// TABELA DE CUSTOS (GPT Image / DALL-E 3)
// ============================================

const COSTS: Record<ImageQuality, Record<ImageSize, number>> = {
  low: {
    '1024x1024': 0.011,
    '1024x1536': 0.016,
    '1536x1024': 0.016,
  },
  medium: {
    '1024x1024': 0.042,
    '1024x1536': 0.063,
    '1536x1024': 0.063,
  },
  high: {
    '1024x1024': 0.167,
    '1024x1536': 0.250,
    '1536x1024': 0.250,
  },
}

// ============================================
// CLASSE DE ERRO CUSTOMIZADA
// ============================================

export class GPTImageError extends Error {
  code?: string
  status?: number

  constructor(message: string, code?: string, status?: number) {
    super(message)
    this.name = 'GPTImageError'
    this.code = code
    this.status = status
  }
}

// ============================================
// FUNÇÃO PRINCIPAL DE GERAÇÃO
// ============================================

/**
 * Gera uma imagem médica usando GPT Image / DALL-E 3
 */
export async function generateMedicalImage(
  options: GenerateImageOptions
): Promise<GeneratedImage> {
  const {
    prompt,
    model = 'dall-e-3', // DALL-E 3 é o mais recente disponível
    quality = 'hd',
    size = '1024x1024',
    style = 'natural',
    n = 1,
  } = options

  try {
    console.log('[GPT Image] Gerando imagem médica...')
    console.log('[GPT Image] Prompt:', prompt.substring(0, 200) + '...')

    const response = await openai.images.generate({
      model,
      prompt,
      size,
      quality: quality === 'high' ? 'hd' : 'standard',
      style,
      n,
    })

    if (!response.data || response.data.length === 0) {
      throw new GPTImageError('Nenhuma imagem foi gerada')
    }

    const imageData = response.data[0]

    console.log('[GPT Image] Imagem gerada com sucesso!')

    // Mapear quality para cálculo de custo
    const costQuality: ImageQuality = quality === 'high' ? 'high' : quality === 'low' ? 'low' : 'medium'

    return {
      url: imageData.url,
      revisedPrompt: imageData.revised_prompt || prompt,
      estimatedCost: COSTS[costQuality][size] * n,
    }
  } catch (error: unknown) {
    console.error('[GPT Image] Erro na geração:', error)

    const err = error as { message?: string; code?: string; status?: number }
    throw new GPTImageError(
      err.message || 'Erro desconhecido na geração de imagem',
      err.code,
      err.status
    )
  }
}

// ============================================
// PROMPTS MÉDICOS OTIMIZADOS
// ============================================

export interface MedicalImagePromptParams {
  structure: string
  type: 'anatomy' | 'histology' | 'radiology' | 'pathology' | 'diagram'
  annotations?: string[]
  view?: string
  additionalDetails?: string
}

/**
 * Gera um prompt otimizado para imagens médicas
 */
export function buildMedicalImagePrompt(params: MedicalImagePromptParams): string {
  const { structure, type, annotations = [], view, additionalDetails } = params

  const annotationText = annotations.length > 0
    ? `\n\nANOTAÇÕES OBRIGATÓRIAS (incluir com linhas de referência numeradas):\n${annotations.map((a, i) => `${i + 1}. "${a}"`).join('\n')}`
    : ''

  const templates: Record<string, string> = {
    anatomy: `
Ilustração anatômica educacional de alta qualidade para atlas médico.

ESTRUTURA: ${structure}
${view ? `VISTA: ${view}` : 'VISTA: anterior/principal'}
ESTILO: Diagrama científico profissional no estilo Netter/Sobotta
FUNDO: Branco limpo, sem distrações

DETALHES TÉCNICOS:
- Linhas precisas e definidas
- Cores anatomicamente corretas e realistas
- Diferenciação clara entre tecidos (muscular, ósseo, vascular, nervoso)
- Proporções anatomicamente corretas
- Iluminação suave e uniforme
${annotationText}

LEGENDAS: Em português brasileiro, fonte Arial legível, linhas de referência finas em preto
QUALIDADE: Nível de atlas de anatomia médica profissional
${additionalDetails ? `\nDETALHES ADICIONAIS: ${additionalDetails}` : ''}
    `.trim(),

    histology: `
Fotomicrografia histológica de alta qualidade para estudo médico.

TECIDO: ${structure}
COLORAÇÃO: H&E (hematoxilina e eosina)
AUMENTO: 400x
FOCO: Nítido em toda a imagem

CARACTERÍSTICAS VISUAIS:
- Núcleos celulares bem definidos (roxo/azul escuro)
- Citoplasma claramente visível (rosa)
- Matriz extracelular distinguível
- Iluminação de microscópio padrão (campo claro)
${annotationText}

ESTILO: Fotomicrografia real de alta resolução
QUALIDADE: Imagem de atlas de histologia (Junqueira/Ross)
${additionalDetails ? `\nDETALHES ADICIONAIS: ${additionalDetails}` : ''}
    `.trim(),

    radiology: `
Imagem radiológica educacional de alta qualidade.

REGIÃO: ${structure}
TIPO: ${view || 'Raio-X AP (anteroposterior)'}
TÉCNICA: Escala de cinza padrão radiológico

CARACTERÍSTICAS:
- Ossos aparecem em branco/cinza claro
- Tecidos moles em tons de cinza
- Ar/gás em preto
- Bordas bem definidas
- Contraste otimizado para visualização
${annotationText}

FUNDO: Preto (como lightbox radiológico)
QUALIDADE: Imagem diagnóstica padrão hospitalar
${additionalDetails ? `\nDETALHES ADICIONAIS: ${additionalDetails}` : ''}
    `.trim(),

    pathology: `
Imagem de patologia macroscópica ou microscópica para estudo médico.

ESTRUTURA/LESÃO: ${structure}
TIPO: ${view || 'Macroscopia'}

CARACTERÍSTICAS:
- Detalhes patológicos claramente visíveis
- Cores realistas do tecido
- Achados principais destacados
- Escala de referência se aplicável
${annotationText}

ESTILO: Imagem de atlas de patologia (Robbins)
QUALIDADE: Qualidade de livro didático médico
${additionalDetails ? `\nDETALHES ADICIONAIS: ${additionalDetails}` : ''}
    `.trim(),

    diagram: `
Diagrama médico educacional esquemático.

TEMA: ${structure}
ESTILO: Diagrama didático colorido e claro

CARACTERÍSTICAS:
- Cores vibrantes mas profissionais
- Setas e linhas de fluxo claras
- Texto legível em português
- Layout organizado e fácil de entender
- Fundo branco ou gradiente suave
${annotationText}

QUALIDADE: Diagrama de livro didático médico
${additionalDetails ? `\nDETALHES ADICIONAIS: ${additionalDetails}` : ''}
    `.trim(),
  }

  return templates[type] || templates.anatomy
}

// ============================================
// FUNÇÃO DE ALTO NÍVEL PARA O APP
// ============================================

export interface GenerateMedicalImageRequest {
  // O que gerar
  structure: string
  type: 'anatomy' | 'histology' | 'radiology' | 'pathology' | 'diagram'

  // Opcionais
  annotations?: string[]
  view?: string
  additionalDetails?: string
  quality?: 'low' | 'medium' | 'high'
  size?: ImageSize
}

/**
 * Função principal para gerar imagens médicas no PREPARA MED
 */
export async function generatePreparaMedImage(
  request: GenerateMedicalImageRequest
): Promise<GeneratedImage> {
  const {
    structure,
    type,
    annotations,
    view,
    additionalDetails,
    quality = 'medium',
    size = '1024x1024',
  } = request

  // Construir prompt otimizado
  const prompt = buildMedicalImagePrompt({
    structure,
    type,
    annotations,
    view,
    additionalDetails,
  })

  // Gerar imagem
  return generateMedicalImage({
    prompt,
    quality,
    size,
    style: 'natural',
  })
}

// ============================================
// DETECÇÃO DE REQUISIÇÃO DE IMAGEM
// ============================================

export interface ImageRequestDetection {
  isImageRequest: boolean
  structure?: string
  type?: 'anatomy' | 'histology' | 'radiology' | 'pathology' | 'diagram'
  annotations?: string[]
}

/**
 * Detecta se uma mensagem do usuário está pedindo uma imagem médica
 */
export function detectImageRequest(message: string): ImageRequestDetection {
  const lowerMessage = message.toLowerCase()

  // Palavras-chave que indicam pedido de imagem
  const imageKeywords = [
    'mostre', 'mostra', 'imagem', 'figura', 'ilustração', 'ilustre',
    'desenhe', 'desenha', 'visualize', 'diagrama', 'foto', 'gere uma imagem',
    'raio-x', 'radiografia', 'tomografia', 'ressonância', 'histologia',
    'lâmina', 'microscopia', 'atlas', 'netter', 'sobotta',
  ]

  const hasImageKeyword = imageKeywords.some(k => lowerMessage.includes(k))

  if (!hasImageKeyword) {
    return { isImageRequest: false }
  }

  // Detectar estrutura mencionada
  const structures: Record<string, string> = {
    'coração': 'coração',
    'coracao': 'coração',
    'pulmão': 'pulmão',
    'pulmao': 'pulmão',
    'rim': 'rim',
    'rins': 'rins',
    'fígado': 'fígado',
    'figado': 'fígado',
    'cérebro': 'cérebro',
    'cerebro': 'cérebro',
    'estômago': 'estômago',
    'estomago': 'estômago',
    'intestino': 'intestino',
    'osso': 'osso',
    'músculo': 'músculo',
    'musculo': 'músculo',
    'artéria': 'artéria',
    'arteria': 'artéria',
    'veia': 'veia',
    'nervo': 'nervo',
    'coluna': 'coluna vertebral',
    'crânio': 'crânio',
    'cranio': 'crânio',
    'tórax': 'tórax',
    'torax': 'tórax',
    'abdome': 'abdome',
    'pelve': 'pelve',
  }

  let foundStructure: string | undefined
  for (const [key, value] of Object.entries(structures)) {
    if (lowerMessage.includes(key)) {
      foundStructure = value
      break
    }
  }

  // Detectar tipo de imagem
  let type: 'anatomy' | 'histology' | 'radiology' | 'pathology' | 'diagram' = 'anatomy'

  if (lowerMessage.includes('raio') || lowerMessage.includes('rx') || lowerMessage.includes('radiografia')) {
    type = 'radiology'
  } else if (lowerMessage.includes('ressonância') || lowerMessage.includes('rm') || lowerMessage.includes('mri')) {
    type = 'radiology'
  } else if (lowerMessage.includes('tomografia') || lowerMessage.includes('tc') || lowerMessage.includes('ct')) {
    type = 'radiology'
  } else if (lowerMessage.includes('microscóp') || lowerMessage.includes('histolog') || lowerMessage.includes('lâmina')) {
    type = 'histology'
  } else if (lowerMessage.includes('patolog') || lowerMessage.includes('lesão') || lowerMessage.includes('tumor')) {
    type = 'pathology'
  } else if (lowerMessage.includes('diagrama') || lowerMessage.includes('esquema') || lowerMessage.includes('fluxo')) {
    type = 'diagram'
  }

  return {
    isImageRequest: true,
    structure: foundStructure,
    type,
  }
}
