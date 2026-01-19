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
 * Configurado para ULTRA-REALISMO MÁXIMO e SEM TEXTO
 *
 * IMPORTANTE: DALL-E 3 é péssimo em gerar texto correto.
 * Geramos imagens 100% visuais e limpas. Anotações/legendas
 * devem ser adicionadas via frontend (CSS overlay) quando necessário.
 */
export async function generateMedicalImage(
  options: GenerateImageOptions
): Promise<GeneratedImage> {
  const {
    prompt,
    model = 'dall-e-3',
    quality = 'high',
    size = '1024x1024',
    style = 'natural',
    n = 1,
  } = options

  // INSTRUÇÕES CRÍTICAS PARA ULTRA-REALISMO SEM TEXTO
  const enhancedPrompt = `${prompt}

=== INSTRUÇÕES ABSOLUTAS - LEIA COM MÁXIMA ATENÇÃO ===

🚫 PROIBIÇÕES ABSOLUTAS (NUNCA INCLUIR):
- ZERO texto, palavras, letras, números ou símbolos escritos
- ZERO legendas, rótulos, etiquetas ou anotações
- ZERO setas com nomes ou linhas de referência com texto
- ZERO marcadores alfabéticos ou numéricos
- ZERO qualquer forma de escrita em QUALQUER idioma
- ZERO watermarks, logos ou assinaturas

📸 REQUISITOS DE ULTRA-REALISMO:
1. FOTOGRAFIA REAL de alta resolução (8K, 16K quality)
2. Deve parecer uma foto REAL tirada por câmera profissional
3. Iluminação de estúdio fotográfico médico/científico profissional
4. Profundidade de campo natural com bokeh suave quando apropriado
5. Texturas HIPER-DETALHADAS:
   - Poros visíveis na pele
   - Fibras musculares individuais
   - Vasos sanguíneos e capilares visíveis
   - Textura real de tecidos biológicos
6. Cores anatomicamente EXATAS e naturais:
   - Músculos: vermelho-rosado com variações naturais
   - Ossos: branco-bege com textura porosa visível
   - Artérias: vermelho vivo com brilho úmido
   - Veias: azul-arroxeado escuro
   - Nervos: amarelo-pálido
   - Gordura: amarelo-creme
7. Brilho úmido natural dos tecidos vivos
8. Reflexos de luz realistas em superfícies molhadas
9. ZERO aspecto de ilustração, desenho, cartoon ou CG
10. Qualidade de atlas anatômico fotográfico (Sobotta foto-realista)

A imagem deve ser INDISTINGUÍVEL de uma fotografia médica real.
ABSOLUTAMENTE NENHUM TEXTO OU ESCRITA DE QUALQUER TIPO.`

  try {
    console.log('[GPT Image] Gerando imagem médica FOTORREALISTA sem texto...')
    console.log('[GPT Image] Prompt:', prompt.substring(0, 200) + '...')

    const response = await openai.images.generate({
      model,
      prompt: enhancedPrompt,
      size,
      quality: 'hd',
      style: 'natural',
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
 * Gera um prompt otimizado para imagens médicas ULTRA-REALISTAS SEM TEXTO
 *
 * DALL-E 3 é péssimo em gerar texto, então geramos imagens 100% visuais.
 * Anotações/legendas são adicionadas via CSS/HTML no frontend quando necessário.
 */
export function buildMedicalImagePrompt(params: MedicalImagePromptParams): string {
  const { structure, type, view, additionalDetails } = params

  const templates: Record<string, string> = {
    anatomy: `
FOTOGRAFIA MÉDICA ULTRA-REALISTA DE ALTA RESOLUÇÃO

Estrutura anatômica: ${structure}
${view ? `Vista/Perspectiva: ${view}` : 'Vista: anterior, bem iluminada'}

ESTILO VISUAL ABSOLUTO:
Esta deve parecer uma FOTOGRAFIA REAL de:
- Dissecção cadavérica de laboratório de anatomia de universidade de medicina
- OU modelo anatômico 3D de silicone hiper-realista de última geração
- Qualidade visual de Atlas Sobotta ou Grant's em versão FOTOGRÁFICA

DETALHAMENTO TÉCNICO OBRIGATÓRIO:
• Resolução: equivalente a 8K, detalhes microscópicos visíveis
• Músculos: vermelho-rosado com fibras individuais visíveis, fascias brilhantes
• Ossos: branco-bege com trabeculado e periósteo visível, textura porosa natural
• Artérias: vermelho vivo com brilho úmido, parede arterial com textura
• Veias: azul-arroxeado escuro, paredes mais finas que artérias
• Nervos: amarelo-pálido, fibras nervosas visíveis
• Gordura: amarelo-creme, textura lobulada natural
• Cartilagem: branco-azulado translúcido
• Tendões: branco nacarado com fibras paralelas brilhantes
• Líquidos corporais: reflexos naturais de umidade nos tecidos

ILUMINAÇÃO:
• Luz de estúdio fotográfico médico profissional
• Iluminação suave e difusa, sem sombras duras
• Temperatura de cor neutra (5500K)
• Reflexos naturais em superfícies úmidas

COMPOSIÇÃO:
• Fundo neutro (branco, cinza claro ou gradiente médico)
• Estrutura centralizada e bem enquadrada
• Profundidade de campo adequada com foco nítido na estrutura principal

PROIBIDO: Qualquer texto, legenda, seta com nome, número, letra ou anotação.

${additionalDetails ? `FOCO ESPECIAL: ${additionalDetails}` : ''}
    `.trim(),

    histology: `
FOTOMICROGRAFIA HISTOLÓGICA REAL DE LABORATÓRIO

Tecido/Estrutura: ${structure}

TÉCNICA DE COLORAÇÃO: H&E (Hematoxilina e Eosina) - padrão ouro

ESPECIFICAÇÕES TÉCNICAS:
• Aumento: 400x (campo de alta potência / HPF)
• Microscópio: Óptico de campo claro de alta qualidade
• Foco: Nítido em todo o campo visual
• Iluminação: Köhler perfeita, uniforme

CARACTERÍSTICAS VISUAIS OBRIGATÓRIAS:
• Núcleos: roxo/azul escuro intenso (basofílico - hematoxilina)
  - Cromatina visível, nucléolos quando presentes
  - Formato característico do tipo celular
• Citoplasma: rosa/eosinofílico (eosina)
  - Variações de intensidade conforme conteúdo proteico
  - Organelas não visíveis (limite de resolução)
• Membranas celulares: delimitação clara entre células
• Matriz extracelular: rosa pálido a médio
• Fibras colágenas: rosa intenso, onduladas
• Eritrócitos: rosa-alaranjado brilhante, sem núcleo
• Músculo: rosa com estriações visíveis (se esquelético)

QUALIDADE:
• Fotomicrografia REAL de lâmina histológica
• Parece foto tirada em microscópio de universidade
• Artefatos mínimos de fixação/coloração

PROIBIDO: Texto, escala, régua, números, letras ou qualquer anotação.

${additionalDetails ? `FOCO ESPECIAL: ${additionalDetails}` : ''}
    `.trim(),

    radiology: `
IMAGEM RADIOLÓGICA REAL DE QUALIDADE DIAGNÓSTICA

Estrutura/Região: ${structure}
Modalidade: ${view || 'Radiografia convencional (Raio-X) - incidência AP'}

CARACTERÍSTICAS TÉCNICAS OBRIGATÓRIAS:
• Escala de cinza radiológica padrão
• Ossos/calcificações: BRANCOS (hiperdensos/radiopacos)
• Ar/gás: PRETO (hipodensos/radiotransparentes)
• Tecidos moles: tons de CINZA intermediário
• Gordura: cinza escuro (menos denso que músculo)
• Músculo: cinza médio
• Contraste adequado para visualização diagnóstica

QUALIDADE DE IMAGEM:
• Parece exame REAL de hospital/clínica radiológica
• Resolução diagnóstica (detalhes finos visíveis)
• Exposição adequada (não queimado nem subexposto)
• Fundo preto (como visualizado em negatoscópio/monitor PACS)

PARA TOMOGRAFIA (CT):
• Janela adequada (óssea, pulmonar, partes moles)
• Corte axial típico

PARA RESSONÂNCIA (RM/MRI):
• Sequência T1 ou T2 conforme apropriado
• Contraste característico de cada sequência

PROIBIDO: Texto, lateralidade (D/E), dados do paciente, marcadores, números.

${additionalDetails ? `ACHADOS A DEMONSTRAR: ${additionalDetails}` : ''}
    `.trim(),

    pathology: `
FOTOGRAFIA DE PATOLOGIA DE ALTA RESOLUÇÃO

Espécime: ${structure}
Tipo: ${view || 'Macroscopia - peça cirúrgica/autópsia'}

PARA MACROSCOPIA:
• Fotografia REAL de peça anatômica patológica
• Iluminação de laboratório de patologia profissional
• Fundo neutro (azul cirúrgico, branco ou verde)
• Cores naturais do tecido (fresco ou fixado em formol)
• Lesões claramente visíveis e bem demonstradas
• Textura real do tecido patológico

PARA MICROSCOPIA (se aplicável):
• Mesmas características de histologia
• Ênfase nas alterações patológicas

CARACTERÍSTICAS DAS LESÕES:
• Tumores: massas com bordas definidas ou infiltrativas
• Necrose: áreas amareladas ou acinzentadas
• Hemorragia: áreas vermelho-escuras ou marrons
• Fibrose: áreas esbranquiçadas e firmes
• Inflamação: áreas avermelhadas e edemaciadas

QUALIDADE:
• Fotografia real de laboratório de patologia
• Parece documentação de caso médico real
• Detalhes macroscópicos claramente visíveis

PROIBIDO: Texto, régua, etiquetas, números ou qualquer anotação.

${additionalDetails ? `ACHADOS PATOLÓGICOS: ${additionalDetails}` : ''}
    `.trim(),

    diagram: `
DIAGRAMA MÉDICO EDUCACIONAL - VISUAL PURO

Tema: ${structure}

ESTILO VISUAL:
• Diagrama científico limpo e profissional
• Cores vibrantes mas harmônicas
• Design moderno de material educacional médico

ELEMENTOS PERMITIDOS:
• Setas indicando fluxo/direção (SEM texto)
• Formas geométricas organizadas
• Gradientes de cor para indicar intensidade/concentração
• Linhas de conexão entre elementos
• Ícones representativos (sem letras)

COMPOSIÇÃO:
• Fundo branco ou gradiente suave
• Layout organizado e intuitivo
• Hierarquia visual clara
• Espaçamento adequado entre elementos

CORES SUGERIDAS:
• Artérias/sangue oxigenado: vermelho
• Veias/sangue desoxigenado: azul
• Nervos: amarelo
• Órgãos: cores anatômicas realistas
• Processos: gradientes indicando direção

PROIBIDO: Qualquer texto, palavra, letra, número ou legenda.
Anotações serão adicionadas posteriormente via software.

${additionalDetails ? `ELEMENTOS ESPECÍFICOS: ${additionalDetails}` : ''}
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

// ============================================
// GERAÇÃO DE IMAGEM SEGURA PARA QUESTÕES
// (Não revela a resposta correta)
// ============================================

export interface QuestionImageRequest {
  // Contexto da questão
  disciplina: string
  assunto: string
  enunciado: string

  // O que mostrar na imagem (descrição genérica, NÃO a resposta)
  estruturaVisual: string
  tipoImagem: 'anatomy' | 'histology' | 'radiology' | 'pathology' | 'diagram'

  // Opcionais
  view?: string
  quality?: ImageQuality
  size?: ImageSize

  // IMPORTANTE: Alternativas para garantir que a imagem não revele a resposta
  alternativas?: string[]
  respostaCorreta?: string
}

/**
 * Gera uma imagem para questões de forma SEGURA
 *
 * REGRAS DE SEGURANÇA:
 * 1. A imagem NÃO deve revelar qual é a resposta correta
 * 2. A imagem deve mostrar a estrutura/contexto de forma NEUTRA
 * 3. Se a questão pergunta "qual estrutura é X?", a imagem mostra
 *    a região geral, não destaca a resposta
 * 4. O aluno deve precisar de CONHECIMENTO para responder, não apenas olhar
 *
 * Exemplo:
 * - Questão: "Qual músculo é responsável pela flexão do antebraço?"
 * - ERRADO: Gerar imagem com bíceps destacado/colorido diferente
 * - CERTO: Gerar imagem do braço mostrando vários músculos de forma igual
 */
export async function generateQuestionImage(
  request: QuestionImageRequest
): Promise<GeneratedImage> {
  const {
    disciplina,
    assunto,
    estruturaVisual,
    tipoImagem,
    view,
    quality = 'medium',
    size = '1024x1024',
    alternativas,
    respostaCorreta,
  } = request

  // Construir prompt SEGURO que não revela a resposta
  let promptSeguro = ''

  // Instruções de segurança para NÃO revelar resposta
  const instrucaoSeguranca = `
=== INSTRUÇÕES DE SEGURANÇA PARA QUESTÃO EDUCACIONAL ===
Esta imagem será usada em uma QUESTÃO DE PROVA.
A imagem NÃO DEVE revelar qual é a resposta correta.

REGRAS ABSOLUTAS:
1. NÃO destacar, colorir diferente, ou dar ênfase a nenhuma estrutura específica
2. Todas as estruturas devem aparecer com IGUAL destaque visual
3. NÃO usar setas, marcadores ou indicadores que apontem para a resposta
4. A imagem deve mostrar o CONTEXTO GERAL, não a resposta
5. O aluno deve precisar de CONHECIMENTO PRÉVIO para identificar a resposta

${alternativas && alternativas.length > 0 ? `
ALTERNATIVAS DA QUESTÃO (todas devem ter visibilidade IGUAL):
${alternativas.map((alt, i) => `- ${String.fromCharCode(65 + i)}) ${alt}`).join('\n')}

NENHUMA dessas alternativas deve ser visualmente destacada ou diferenciada.
` : ''}

${respostaCorreta ? `
ATENÇÃO: A resposta correta é "${respostaCorreta}" - esta estrutura NÃO deve
ter NENHUM destaque visual diferente das outras opções.
` : ''}
`

  // Construir prompt base conforme tipo
  const promptBase = buildMedicalImagePrompt({
    structure: estruturaVisual,
    type: tipoImagem,
    view,
    additionalDetails: `
Contexto: Questão de ${disciplina} sobre ${assunto}.
${instrucaoSeguranca}
    `.trim(),
  })

  promptSeguro = promptBase

  console.log('[GPT Image] Gerando imagem SEGURA para questão...')
  console.log('[GPT Image] Estrutura:', estruturaVisual)
  console.log('[GPT Image] Tipo:', tipoImagem)

  return generateMedicalImage({
    prompt: promptSeguro,
    quality,
    size,
    style: 'natural',
  })
}

/**
 * Extrai descrição segura para imagem a partir do enunciado
 * Remove menções diretas à resposta
 */
export function extrairDescricaoSeguraParaImagem(
  enunciado: string,
  disciplina: string,
  assunto: string
): string {
  // Termos que indicam que a questão quer que o aluno IDENTIFIQUE algo
  const termosIdentificacao = [
    'qual', 'que estrutura', 'que órgão', 'que músculo', 'que nervo',
    'que artéria', 'que veia', 'identifique', 'aponte', 'indique',
    'nome da estrutura', 'qual é o nome',
  ]

  const enunciadoLower = enunciado.toLowerCase()
  const ehQuestaoIdentificacao = termosIdentificacao.some(t => enunciadoLower.includes(t))

  if (ehQuestaoIdentificacao) {
    // Para questões de identificação, mostrar a REGIÃO GERAL
    // sem destacar a estrutura específica
    return `Região anatômica relacionada a ${assunto} - visão geral com múltiplas estruturas visíveis de forma igual, sem destaques`
  }

  // Para outros tipos de questão, usar o assunto como base
  return `${assunto} - ${disciplina} - visão educacional geral`
}
