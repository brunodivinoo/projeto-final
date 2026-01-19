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
 * Configurado para MÁXIMO REALISMO em imagens médicas
 */
export async function generateMedicalImage(
  options: GenerateImageOptions
): Promise<GeneratedImage> {
  const {
    prompt,
    model = 'dall-e-3', // DALL-E 3 é o mais recente disponível
    quality = 'high', // Usar HD por padrão para máximo realismo
    size = '1024x1024',
    style = 'natural', // Natural é melhor para imagens médicas realistas
    n = 1,
  } = options

  // Adicionar instruções de realismo ao prompt
  const enhancedPrompt = `${prompt}

INSTRUÇÕES DE REALISMO (CRÍTICO):
- Gere uma imagem FOTORREALISTA de alta resolução
- Texturas detalhadas e naturais dos tecidos
- Iluminação profissional de estúdio/laboratório
- Sombras suaves e naturais
- Cores fiéis à realidade anatômica
- Qualidade de fotografia profissional médica
- EVITAR aspecto de ilustração cartoon ou simplificada
- EVITAR erros anatômicos ou proporções incorretas`

  try {
    console.log('[GPT Image] Gerando imagem médica REALISTA...')
    console.log('[GPT Image] Prompt:', prompt.substring(0, 200) + '...')

    const response = await openai.images.generate({
      model,
      prompt: enhancedPrompt,
      size,
      quality: 'hd', // SEMPRE usar HD para máxima qualidade
      style: 'natural', // Natural para realismo médico
      n,
    })

    if (!response.data || response.data.length === 0) {
      throw new GPTImageError('Nenhuma imagem foi gerada')
    }

    const imageData = response.data[0]

    console.log('[GPT Image] Imagem gerada com sucesso!')

    // Sempre HD para imagens médicas = custo high
    return {
      url: imageData.url,
      revisedPrompt: imageData.revised_prompt || prompt,
      estimatedCost: COSTS['high'][size] * n, // HD = high cost
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
 * Gera um prompt otimizado para imagens médicas em PORTUGUÊS BRASILEIRO
 * com marcações anatômicas precisas e cientificamente corretas
 */
export function buildMedicalImagePrompt(params: MedicalImagePromptParams): string {
  const { structure, type, annotations = [], view, additionalDetails } = params

  const annotationText = annotations.length > 0
    ? `\n\nESTRUTURAS QUE DEVEM SER IDENTIFICADAS COM LINHAS DE REFERÊNCIA:\n${annotations.map((a, i) => `${i + 1}. "${a}"`).join('\n')}`
    : ''

  // Instruções globais para todas as imagens médicas
  const globalInstructions = `
INSTRUÇÕES CRÍTICAS DE IDIOMA E PRECISÃO:
1. TODOS os textos, legendas e anotações DEVEM estar em PORTUGUÊS BRASILEIRO CORRETO
2. NÃO usar inglês em nenhuma parte da imagem
3. As marcações devem apontar EXATAMENTE para a estrutura correta anatomicamente
4. Cada linha de referência deve conectar o nome da estrutura à sua localização PRECISA
5. NÃO incluir palavras inventadas ou com erros ortográficos
6. Usar terminologia anatômica oficial em português (Nomina Anatomica)

FORMATO DAS LEGENDAS:
- Fonte clara, legível, sem serifa (tipo Arial ou Helvetica)
- Tamanho adequado para leitura
- Linhas de referência finas e precisas em preto
- Cada legenda aponta DIRETAMENTE para a estrutura identificada
`

  const templates: Record<string, string> = {
    anatomy: `
Crie uma ilustração anatômica educacional de ALTA QUALIDADE para atlas médico brasileiro.

ESTRUTURA PRINCIPAL: ${structure}
${view ? `VISTA/CORTE: ${view}` : 'VISTA: Vista anterior (padrão)'}
ESTILO VISUAL: Ilustração científica profissional similar aos atlas Sobotta ou Netter

${globalInstructions}

CARACTERÍSTICAS OBRIGATÓRIAS DA IMAGEM:
- Fundo BRANCO LIMPO sem elementos de distração
- Cores anatomicamente precisas e realistas:
  * Músculos: vermelho/marrom rosado
  * Ossos: branco/bege
  * Artérias: vermelho vivo
  * Veias: azul escuro
  * Nervos: amarelo
  * Órgãos: cores naturais específicas de cada um
- Proporções anatomicamente CORRETAS baseadas em anatomia humana real
- Iluminação suave e uniforme para visualização clara
- Bordas bem definidas entre estruturas diferentes
${annotationText}

NOMES CORRETOS EM PORTUGUÊS PARA ESTRUTURAS COMUNS:
- Testículo (NÃO "testicle" ou "testes")
- Epidídimo (NÃO "epididymis")
- Próstata (NÃO "prostate")
- Vesícula seminal (NÃO "seminal vesicle")
- Ducto deferente (NÃO "vas deferens")
- Uretra (igual em português)
- Bexiga (NÃO "bladder")
- Pênis (NÃO "penis" em inglês)

${additionalDetails ? `DETALHES ADICIONAIS SOLICITADOS: ${additionalDetails}` : ''}

QUALIDADE FINAL: Nível de atlas de anatomia médica profissional para faculdade de medicina brasileira.
    `.trim(),

    histology: `
Crie uma fotomicrografia histológica de ALTA QUALIDADE para estudo médico brasileiro.

TECIDO/ESTRUTURA: ${structure}
COLORAÇÃO: H&E (hematoxilina e eosina) - padrão
AUMENTO: 400x (campo de alta potência)

${globalInstructions}

CARACTERÍSTICAS OBRIGATÓRIAS:
- Imagem nítida em TODO o campo visual
- Núcleos celulares: roxo/azul escuro (hematoxilina)
- Citoplasma: rosa/eosinofílico (eosina)
- Matriz extracelular: tons de rosa pálido
- Colágeno: rosa brilhante
- Músculo: rosa escuro/magenta
- Iluminação de microscópio óptico (campo claro)
${annotationText}

LEGENDAS EM PORTUGUÊS:
- Célula (NÃO "cell")
- Núcleo (NÃO "nucleus")
- Citoplasma (igual)
- Membrana plasmática (NÃO "cell membrane")
- Tecido conjuntivo (NÃO "connective tissue")
- Fibras colágenas (NÃO "collagen fibers")

${additionalDetails ? `DETALHES ADICIONAIS: ${additionalDetails}` : ''}

QUALIDADE: Imagem de atlas de histologia (padrão Junqueira ou Ross) para estudantes brasileiros.
    `.trim(),

    radiology: `
Crie uma imagem radiológica educacional de ALTA QUALIDADE para estudo médico brasileiro.

REGIÃO ANATÔMICA: ${structure}
MODALIDADE: ${view || 'Radiografia simples (Raio-X) em incidência AP'}

${globalInstructions}

CARACTERÍSTICAS TÉCNICAS OBRIGATÓRIAS:
- Escala de cinza radiológica padrão
- Ossos: BRANCO (radiopaco)
- Ar/gás: PRETO (radiotransparente)
- Tecidos moles: tons de CINZA
- Contraste adequado para visualização diagnóstica
- Bordas anatômicas bem definidas
- Fundo PRETO (como lightbox/negatoscópio)
${annotationText}

LEGENDAS EM PORTUGUÊS:
- Clavícula (NÃO "clavicle")
- Costela (NÃO "rib")
- Vértebra (NÃO "vertebra" em inglês)
- Coração (silhueta cardíaca)
- Pulmão (NÃO "lung")
- Diafragma (igual)
- Hilo pulmonar (NÃO "hilum")

${additionalDetails ? `ACHADOS A DEMONSTRAR: ${additionalDetails}` : ''}

QUALIDADE: Imagem radiológica padrão hospitalar brasileiro para ensino médico.
    `.trim(),

    pathology: `
Crie uma imagem de patologia (macro ou microscópica) de ALTA QUALIDADE para estudo médico brasileiro.

ESTRUTURA/LESÃO: ${structure}
TIPO DE IMAGEM: ${view || 'Macroscopia (peça cirúrgica ou necropsia)'}

${globalInstructions}

CARACTERÍSTICAS OBRIGATÓRIAS:
- Cores realistas do tecido patológico
- Lesões claramente visíveis e identificáveis
- Contraste entre tecido normal e alterado
- Se macroscopia: régua ou escala de referência
- Se microscopia: aumento especificado
${annotationText}

TERMINOLOGIA EM PORTUGUÊS:
- Necrose (NÃO "necrosis")
- Inflamação (NÃO "inflammation")
- Tumor/neoplasia (NÃO "tumor" em inglês)
- Edema (igual)
- Hemorragia (NÃO "hemorrhage")
- Fibrose (NÃO "fibrosis")

${additionalDetails ? `ACHADOS PATOLÓGICOS A DEMONSTRAR: ${additionalDetails}` : ''}

QUALIDADE: Imagem de atlas de patologia (padrão Robbins) para estudantes brasileiros.
    `.trim(),

    diagram: `
Crie um diagrama médico educacional esquemático de ALTA QUALIDADE em PORTUGUÊS BRASILEIRO.

TEMA/PROCESSO: ${structure}
ESTILO: Diagrama didático, colorido, claro e profissional

${globalInstructions}

CARACTERÍSTICAS OBRIGATÓRIAS DO DIAGRAMA:
- Fundo BRANCO ou gradiente suave (azul claro para cinza)
- Cores vibrantes mas profissionais e consistentes
- Setas indicando direção/fluxo dos processos
- Caixas/formas geométricas organizadas logicamente
- Hierarquia visual clara (do mais importante ao menos importante)
- Espaçamento adequado entre elementos
- TODO texto em PORTUGUÊS BRASILEIRO
${annotationText}

ELEMENTOS TEXTUAIS:
- Títulos em negrito
- Subtítulos destacados
- Texto explicativo legível
- Abreviações apenas se universalmente conhecidas

${additionalDetails ? `ELEMENTOS ESPECÍFICOS A INCLUIR: ${additionalDetails}` : ''}

QUALIDADE: Diagrama de livro didático médico brasileiro de alta qualidade.
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
