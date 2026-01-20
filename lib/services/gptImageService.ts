import OpenAI from 'openai'

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ============================================
// BASE DE CONHECIMENTO ANATÔMICO
// Descrições precisas para garantir imagens corretas
// ============================================

interface AnatomicalKnowledge {
  description: string
  keyStructures: string[]
  correctView: string
  commonMistakes: string[]
}

const ANATOMICAL_KNOWLEDGE: Record<string, AnatomicalKnowledge> = {
  // ==================== SISTEMA REPRODUTOR ====================

  'sistema reprodutor masculino': {
    description: `
ANATOMIA CORRETA DO SISTEMA REPRODUTOR MASCULINO (Vista Sagital Mediana):

POSICIONAMENTO ESPACIAL OBRIGATÓRIO:
- ESCROTO: bolsa externa, pendendo ABAIXO e ANTERIOR ao períneo
- TESTÍCULOS (2): dentro do escroto, formato ovoide, ~4cm comprimento
- EPIDÍDIMO: estrutura em forma de C, na face POSTERIOR de cada testículo
- DUCTO DEFERENTE: tubo fino que SOBE do epidídimo, atravessa canal inguinal
- BEXIGA: estrutura central na pelve, acima da próstata
- VESÍCULAS SEMINAIS: 2 bolsas, POSTERIOR e INFERIOR à bexiga, ~5cm
- PRÓSTATA: glândula em forma de castanha, ABAIXO da bexiga, envolvendo a uretra
- URETRA: tubo que atravessa próstata → pênis
- PÊNIS: anterior, com corpos cavernosos (2, dorsais) e corpo esponjoso (1, ventral)

RELAÇÕES ANATÔMICAS CRÍTICAS:
- Testículos ficam FORA da cavidade pélvica (no escroto externo)
- Próstata fica ABAIXO da bexiga, não ao lado
- Vesículas seminais ficam ATRÁS da bexiga
- O ducto deferente faz uma curva ao redor do ureter
    `,
    keyStructures: ['escroto externo', 'testículos no escroto', 'epidídimo posterior', 'ducto deferente ascendente', 'vesículas seminais posteriores à bexiga', 'próstata abaixo da bexiga', 'uretra prostática'],
    correctView: 'Corte sagital mediano da pelve masculina, mostrando escroto externamente',
    commonMistakes: ['NÃO colocar testículos dentro da pelve', 'NÃO colocar próstata acima da bexiga', 'NÃO esquecer o escroto externo']
  },

  'sistema reprodutor feminino': {
    description: `
ANATOMIA CORRETA DO SISTEMA REPRODUTOR FEMININO (Vista Anterior/Coronal):

POSICIONAMENTO ESPACIAL OBRIGATÓRIO:
- ÚTERO: órgão central em forma de pera invertida, ~7cm comprimento
  - Fundo uterino: parte superior arredondada
  - Corpo uterino: parte principal
  - Colo uterino (cérvix): parte inferior cilíndrica
- TUBAS UTERINAS (2): tubos de ~10cm, saem lateralmente do fundo uterino
  - Porção intramural → istmo → ampola → infundíbulo com fímbrias
  - Fímbrias: projeções digitiformes na extremidade, abraçando o ovário
- OVÁRIOS (2): estruturas ovoides de ~3cm, laterais ao útero
  - Conectados ao útero pelo ligamento útero-ovárico
  - Posicionados ABAIXO das tubas, não ao lado
- VAGINA: canal que conecta colo uterino ao exterior
- LIGAMENTO LARGO: membrana que sustenta útero e anexos

RELAÇÕES ANATÔMICAS CRÍTICAS:
- Tubas uterinas se curvam SOBRE os ovários (não saem retas)
- Fímbrias "abraçam" os ovários para captar óvulos
- Útero tem formato de PERA INVERTIDA, não de triângulo
    `,
    keyStructures: ['útero piriforme central', 'tubas uterinas curvadas', 'fímbrias sobre ovários', 'ovários laterais inferiores', 'ligamento largo'],
    correctView: 'Vista anterior/coronal do sistema reprodutor feminino isolado',
    commonMistakes: ['NÃO fazer útero triangular', 'NÃO fazer tubas retas horizontais', 'NÃO esquecer as fímbrias']
  },

  // ==================== SISTEMA CARDIOVASCULAR ====================

  'coração': {
    description: `
ANATOMIA CORRETA DO CORAÇÃO (Vista Anterior ou Corte Coronal):

CÂMARAS (posicionamento real, não esquemático):
- ÁTRIO DIREITO: superior direito, recebe veias cavas
- ÁTRIO ESQUERDO: superior esquerdo, posterior, recebe veias pulmonares
- VENTRÍCULO DIREITO: inferior direito, parede mais fina (~3mm)
- VENTRÍCULO ESQUERDO: inferior esquerdo, parede mais espessa (~12mm)

GRANDES VASOS:
- AORTA: sai do ventrículo esquerdo, curva para a esquerda (arco aórtico)
- TRONCO PULMONAR: sai do ventrículo direito, bifurca em artérias pulmonares
- VEIAS CAVAS: superior e inferior, chegam no átrio direito
- VEIAS PULMONARES (4): chegam no átrio esquerdo

VÁLVULAS:
- Tricúspide: entre átrio e ventrículo direitos
- Mitral (bicúspide): entre átrio e ventrículo esquerdos
- Pulmonar: saída do ventrículo direito
- Aórtica: saída do ventrículo esquerdo

IMPORTANTE: O coração está levemente rotacionado - ventrículo esquerdo é mais posterior
    `,
    keyStructures: ['4 câmaras', 'septo interventricular', 'aorta curvada', 'artérias coronárias', 'válvulas cardíacas'],
    correctView: 'Vista anterior do coração ou corte coronal/frontal',
    commonMistakes: ['NÃO fazer câmaras do mesmo tamanho', 'NÃO esquecer diferença de espessura das paredes', 'Ventrículo esquerdo tem parede MAIS GROSSA']
  },

  // ==================== FÍGADO ====================

  'fígado': {
    description: `
ANATOMIA CORRETA DO FÍGADO:

MACROSCÓPICA (Vista Anterior):
- Maior glândula do corpo, ~1.5kg
- LOBO DIREITO: maior, ocupa hipocôndrio direito
- LOBO ESQUERDO: menor, cruza linha média
- LOBO CAUDADO: posterior, visível na face visceral
- LOBO QUADRADO: inferior, entre vesícula biliar e ligamento falciforme
- LIGAMENTO FALCIFORME: divide lobos direito e esquerdo anteriormente
- VESÍCULA BILIAR: na face inferior, entre lobos direito e quadrado

HISTOLOGIA DO FÍGADO (H&E, 400x):
- LÓBULOS HEPÁTICOS: estruturas hexagonais
- VEIA CENTROLOBULAR: no centro de cada lóbulo
- HEPATÓCITOS: células POLIGONAIS em cordões/placas radiantes
- SINUSOIDES: capilares entre os cordões de hepatócitos
- ESPAÇO PORTA (tríade portal): na periferia dos lóbulos
  - Ramo da artéria hepática
  - Ramo da veia porta
  - Ducto biliar
- CÉLULAS DE KUPFFER: macrófagos nos sinusoides
    `,
    keyStructures: ['lóbulos hexagonais', 'veia centrolobular', 'cordões de hepatócitos poligonais', 'sinusoides', 'espaço porta com tríade'],
    correctView: 'Corte histológico mostrando lóbulos hepáticos com veia central e espaços porta',
    commonMistakes: ['NÃO confundir com músculo', 'Hepatócitos são POLIGONAIS não alongados', 'Lóbulos são HEXAGONAIS']
  },

  // ==================== SISTEMA RESPIRATÓRIO ====================

  'pulmão': {
    description: `
ANATOMIA CORRETA DOS PULMÕES:

PULMÃO DIREITO (3 lobos):
- Lobo superior
- Lobo médio
- Lobo inferior
- Separados por fissuras horizontal e oblíqua

PULMÃO ESQUERDO (2 lobos):
- Lobo superior (com língula)
- Lobo inferior
- Separados por fissura oblíqua
- Incisura cardíaca: impressão do coração

ESTRUTURAS:
- Brônquios principais → lobares → segmentares → bronquíolos → alvéolos
- Hilo pulmonar: entrada de brônquio, artéria e veias pulmonares
- Pleura: visceral (aderida ao pulmão) e parietal (na parede torácica)
    `,
    keyStructures: ['3 lobos direito', '2 lobos esquerdo', 'incisura cardíaca', 'hilo pulmonar', 'árvore brônquica'],
    correctView: 'Vista anterior de ambos os pulmões ou corte coronal',
    commonMistakes: ['NÃO fazer pulmões simétricos', 'Direito tem 3 lobos, esquerdo tem 2', 'Esquerdo tem incisura cardíaca']
  },

  // ==================== RIM ====================

  'rim': {
    description: `
ANATOMIA CORRETA DO RIM (Corte Coronal/Frontal):

ESTRUTURA EXTERNA:
- Formato de feijão, ~11cm x 6cm x 3cm
- Polo superior e inferior
- Face convexa (lateral) e côncava (medial com hilo)
- Cápsula fibrosa envolvendo

ESTRUTURA INTERNA (corte coronal):
- CÓRTEX RENAL: camada EXTERNA, mais clara, contém glomérulos
- MEDULA RENAL: INTERNA, mais escura, com pirâmides renais
- PIRÂMIDES RENAIS: 8-18 estruturas triangulares, base voltada para córtex, ápice para dentro
- PAPILA RENAL: ápice da pirâmide, drena para cálice menor
- COLUNAS RENAIS (de Bertin): extensões do córtex entre pirâmides
- CÁLICES MENORES: recebem urina das papilas
- CÁLICES MAIORES: união de cálices menores
- PELVE RENAL: estrutura em funil, une cálices maiores → ureter
- HILO RENAL: onde entram/saem artéria, veia e pelve renal
    `,
    keyStructures: ['córtex externo claro', 'medula interna escura', 'pirâmides triangulares apontando para dentro', 'cálices', 'pelve renal', 'hilo'],
    correctView: 'Corte coronal/frontal do rim mostrando córtex, medula e sistema coletor',
    commonMistakes: ['NÃO inverter córtex e medula', 'Córtex é EXTERNO e mais claro', 'Pirâmides apontam para DENTRO (para pelve)']
  },

  // ==================== CÉREBRO ====================

  'cérebro': {
    description: `
ANATOMIA CORRETA DO CÉREBRO:

VISTA LATERAL:
- LOBO FRONTAL: anterior, até sulco central (de Rolando)
- LOBO PARIETAL: superior posterior, entre sulcos central e parieto-occipital
- LOBO TEMPORAL: inferior lateral, abaixo da fissura lateral (de Sylvius)
- LOBO OCCIPITAL: posterior
- CEREBELO: inferior posterior
- TRONCO ENCEFÁLICO: mesencéfalo, ponte, bulbo

SULCOS IMPORTANTES:
- Sulco central (Rolando): separa frontal de parietal
- Fissura lateral (Sylvius): separa temporal dos demais
- Sulco parieto-occipital: separa parietal de occipital

GIROS IMPORTANTES:
- Giro pré-central: motor primário (anterior ao sulco central)
- Giro pós-central: sensitivo primário (posterior ao sulco central)
    `,
    keyStructures: ['4 lobos cerebrais', 'sulco central', 'fissura lateral', 'giros pré e pós-central', 'cerebelo', 'tronco encefálico'],
    correctView: 'Vista lateral do hemisfério cerebral esquerdo',
    commonMistakes: ['NÃO confundir posições dos lobos', 'Frontal é ANTERIOR', 'Occipital é POSTERIOR']
  },

  // ==================== HISTOLOGIA ====================

  'tecido muscular estriado esquelético': {
    description: `
HISTOLOGIA DO MÚSCULO ESTRIADO ESQUELÉTICO (H&E, 400x):

CARACTERÍSTICAS OBRIGATÓRIAS:
- Fibras CILÍNDRICAS longas e PARALELAS
- MÚLTIPLOS NÚCLEOS na PERIFERIA da fibra (não no centro!)
- ESTRIAÇÕES TRANSVERSAIS visíveis (bandas A escuras e I claras)
- Endomísio: tecido conjuntivo entre fibras individuais
- Perimísio: ao redor de fascículos
- Epimísio: ao redor do músculo todo
    `,
    keyStructures: ['fibras paralelas cilíndricas', 'núcleos periféricos múltiplos', 'estriações transversais claras'],
    correctView: 'Corte longitudinal mostrando fibras paralelas com estriações',
    commonMistakes: ['Núcleos são PERIFÉRICOS, não centrais', 'Fibras são PARALELAS', 'Estriações são TRANSVERSAIS']
  },

  'tecido muscular cardíaco': {
    description: `
HISTOLOGIA DO MÚSCULO CARDÍACO (H&E, 400x):

CARACTERÍSTICAS OBRIGATÓRIAS:
- Fibras RAMIFICADAS (não paralelas como esquelético!)
- NÚCLEO CENTRAL único (ou dois) em cada célula
- DISCOS INTERCALARES: linhas escuras transversais entre células (junções especializadas)
- Estriações transversais presentes mas menos evidentes que no esquelético
- Células mais CURTAS que músculo esquelético
    `,
    keyStructures: ['fibras ramificadas', 'núcleo central único', 'discos intercalares escuros'],
    correctView: 'Corte longitudinal mostrando ramificações e discos intercalares',
    commonMistakes: ['Cardíaco tem núcleo CENTRAL (esquelético tem periférico)', 'Cardíaco é RAMIFICADO (esquelético é paralelo)', 'Discos intercalares são exclusivos do cardíaco']
  },

  'tecido muscular liso': {
    description: `
HISTOLOGIA DO MÚSCULO LISO (H&E, 400x):

CARACTERÍSTICAS OBRIGATÓRIAS:
- Células FUSIFORMES (formato de fuso/charuto)
- NÚCLEO CENTRAL único, alongado, acompanha formato da célula
- SEM estriações (por isso "liso")
- Células dispostas em feixes, frequentemente em camadas perpendiculares
- Encontrado em vísceras, vasos sanguíneos, útero
    `,
    keyStructures: ['células fusiformes', 'núcleo central alongado', 'ausência de estriações'],
    correctView: 'Corte longitudinal e transversal mostrando células fusiformes',
    commonMistakes: ['Liso NÃO tem estriações', 'Núcleo é CENTRAL e ALONGADO', 'Células são FUSIFORMES não cilíndricas']
  },

  'tecido epitelial': {
    description: `
HISTOLOGIA DE EPITÉLIOS (H&E):

TIPOS PRINCIPAIS:
- Simples pavimentoso: células achatadas, uma camada (endotélio, alvéolos)
- Simples cúbico: células cúbicas, uma camada (túbulos renais)
- Simples cilíndrico/colunar: células colunares, uma camada (intestino)
- Estratificado pavimentoso: múltiplas camadas, superfície achatada (pele, esôfago)
- Pseudoestratificado: parece múltiplas camadas mas TODAS tocam a membrana basal (vias aéreas)
- De transição (urotélio): células em guarda-chuva (bexiga)

CARACTERÍSTICAS GERAIS:
- Células justapostas com pouco espaço entre elas
- Membrana basal na base
- AVASCULAR (sem vasos sanguíneos no epitélio)
- Polaridade: superfície apical vs basal
    `,
    keyStructures: ['células organizadas justapostas', 'membrana basal', 'polaridade celular'],
    correctView: 'Corte perpendicular à superfície epitelial',
    commonMistakes: ['Epitélio é AVASCULAR', 'Todas células do pseudoestratificado tocam a membrana basal', 'Identificar corretamente número de camadas']
  },

  'tecido conjuntivo': {
    description: `
HISTOLOGIA DO TECIDO CONJUNTIVO (H&E):

COMPONENTES:
- CÉLULAS: fibroblastos (principais), macrófagos, mastócitos, plasmócitos
- FIBRAS: colágenas (rosa, onduladas), elásticas, reticulares
- SUBSTÂNCIA FUNDAMENTAL: matriz extracelular amorfa

TIPOS:
- Frouxo: muitas células, poucas fibras, muito espaço
- Denso não modelado: muitas fibras colágenas em várias direções (derme)
- Denso modelado: fibras paralelas em uma direção (tendões, ligamentos)

FIBROBLASTOS: células fusiformes com núcleo oval, produzem fibras e matriz
    `,
    keyStructures: ['fibroblastos fusiformes', 'fibras colágenas rosa onduladas', 'substância fundamental'],
    correctView: 'Corte mostrando células esparsas entre fibras e matriz',
    commonMistakes: ['Conjuntivo tem MUITA matriz extracelular', 'Fibroblastos são fusiformes com núcleo oval', 'Fibras colágenas são ROSA e ONDULADAS']
  },

  'tecido ósseo': {
    description: `
HISTOLOGIA DO TECIDO ÓSSEO (H&E ou técnica especial):

OSSO COMPACTO (CORTICAL):
- SISTEMAS DE HAVERS (ósteons): unidades cilíndricas
- CANAL DE HAVERS: central, contém vasos e nervos
- LAMELAS: camadas concêntricas ao redor do canal
- LACUNAS: espaços onde ficam os osteócitos
- CANALÍCULOS: canalículos que conectam lacunas
- CANAIS DE VOLKMANN: conectam sistemas de Havers entre si

CÉLULAS:
- Osteoblastos: formam osso, na superfície
- Osteócitos: osteoblastos aprisionados nas lacunas
- Osteoclastos: células gigantes multinucleadas, reabsorvem osso
    `,
    keyStructures: ['sistemas de Havers concêntricos', 'canal de Havers central', 'lamelas concêntricas', 'lacunas com osteócitos', 'canalículos'],
    correctView: 'Corte transversal de osso compacto mostrando sistemas de Havers',
    commonMistakes: ['Lamelas são CONCÊNTRICAS ao redor do canal', 'Osteócitos ficam nas LACUNAS', 'Canal de Havers é CENTRAL no ósteon']
  },

  'tecido cartilaginoso': {
    description: `
HISTOLOGIA DO TECIDO CARTILAGINOSO (H&E):

TIPOS:
- HIALINA: mais comum (articulações, vias aéreas, costelas)
  - Matriz homogênea, azulada/rosa clara
  - Condrócitos em lacunas, frequentemente em grupos isógenos
  - Pericôndrio na superfície (exceto articular)

- ELÁSTICA: pavilhão auricular, epiglote
  - Similar à hialina + fibras elásticas na matriz

- FIBROSA: discos intervertebrais, meniscos
  - Muito colágeno tipo I na matriz
  - Condrócitos em fileiras entre fibras

CÉLULAS: Condrócitos em lacunas, frequentemente em grupos (grupos isógenos)
    `,
    keyStructures: ['condrócitos em lacunas', 'grupos isógenos', 'matriz cartilaginosa', 'pericôndrio'],
    correctView: 'Corte mostrando condrócitos em lacunas dentro da matriz',
    commonMistakes: ['Condrócitos ficam em LACUNAS', 'Grupos isógenos = divisão recente', 'Matriz é AVASCULAR']
  },

  'tecido nervoso': {
    description: `
HISTOLOGIA DO TECIDO NERVOSO (H&E ou técnicas especiais):

NEURÔNIOS:
- CORPO CELULAR (pericário): contém núcleo grande com nucléolo evidente
- DENDRITOS: prolongamentos curtos, ramificados, recebem estímulos
- AXÔNIO: prolongamento único, longo, transmite impulso
- SUBSTÂNCIA DE NISSL: grumos basofílicos no citoplasma (RER)

CÉLULAS DA GLIA:
- Astrócitos: suporte, barreira hematoencefálica
- Oligodendrócitos: mielina no SNC
- Células de Schwann: mielina no SNP
- Micróglia: defesa

SUBSTÂNCIA CINZENTA: corpos celulares dos neurônios
SUBSTÂNCIA BRANCA: axônios mielinizados
    `,
    keyStructures: ['neurônios com núcleo grande', 'substância de Nissl', 'axônios', 'células da glia'],
    correctView: 'Corte de medula espinhal ou córtex cerebral',
    commonMistakes: ['Neurônios têm núcleo GRANDE com NUCLÉOLO evidente', 'Substância de Nissl é basofílica (roxa)', 'Substância cinzenta = corpos celulares']
  },

  'sangue': {
    description: `
HISTOLOGIA DO SANGUE (Esfregaço, coloração Giemsa ou Wright):

HEMÁCIAS (eritrócitos):
- Discos bicôncavos, ANUCLEADOS em mamíferos
- Rosa/alaranjado (eosinofílicas)
- ~7μm de diâmetro

LEUCÓCITOS:
- NEUTRÓFILOS: núcleo multilobulado (3-5 lobos), grânulos finos
- EOSINÓFILOS: núcleo bilobulado, grânulos grandes alaranjados
- BASÓFILOS: núcleo em S, grânulos grandes azul-escuros
- LINFÓCITOS: núcleo grande e redondo, pouco citoplasma
- MONÓCITOS: maiores, núcleo em ferradura, citoplasma azul-acinzentado

PLAQUETAS: fragmentos celulares pequenos, anucleados
    `,
    keyStructures: ['hemácias anucleadas rosa', 'neutrófilos multilobulados', 'linfócitos com núcleo grande redondo', 'plaquetas pequenas'],
    correctView: 'Esfregaço sanguíneo com células dispersas',
    commonMistakes: ['Hemácias são ANUCLEADAS', 'Neutrófilos têm núcleo MULTILOBULADO', 'Linfócitos têm POUCO citoplasma']
  }
}

/**
 * Busca conhecimento anatômico relevante para uma estrutura
 */
function getAnatomicalKnowledge(structure: string): string {
  const normalizedStructure = structure.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos

  // Busca direta
  for (const [key, knowledge] of Object.entries(ANATOMICAL_KNOWLEDGE)) {
    const normalizedKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (normalizedStructure === normalizedKey || normalizedStructure.includes(normalizedKey) || normalizedKey.includes(normalizedStructure)) {
      return `
=== REFERÊNCIA ANATÔMICA OBRIGATÓRIA (SIGA EXATAMENTE) ===
${knowledge.description}

ESTRUTURAS QUE DEVEM APARECER: ${knowledge.keyStructures.join(', ')}

VISTA CORRETA: ${knowledge.correctView}

⚠️ ERROS COMUNS A EVITAR: ${knowledge.commonMistakes.join('; ')}
      `.trim()
    }
  }

  // Busca por palavras-chave
  const keywords = normalizedStructure.split(' ').filter(k => k.length > 3)
  for (const keyword of keywords) {
    for (const [key, knowledge] of Object.entries(ANATOMICAL_KNOWLEDGE)) {
      const normalizedKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (normalizedKey.includes(keyword)) {
        return `
=== REFERÊNCIA ANATÔMICA RELACIONADA ===
${knowledge.description}

ESTRUTURAS-CHAVE: ${knowledge.keyStructures.join(', ')}

VISTA RECOMENDADA: ${knowledge.correctView}
        `.trim()
      }
    }
  }

  return ''
}

/**
 * Converte URL de imagem temporária para base64 permanente
 */
async function convertImageToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Falha ao baixar imagem: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const mimeType = response.headers.get('content-type') || 'image/png'
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('[GPT Image] Erro ao converter para base64:', error)
    throw error
  }
}

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
 *
 * MELHORIAS:
 * 1. Usa base de conhecimento anatômico para garantir precisão
 * 2. Converte para base64 para armazenamento permanente (URLs do DALL-E expiram)
 * 3. Instruções claras para não incluir texto
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

  // Extrair estrutura do prompt para buscar conhecimento anatômico
  const structureMatch = prompt.match(/(?:estrutura|tecido|órgão|sistema)[:\s]+([^\n]+)/i)
    || prompt.match(/^([^\n]{10,100})/i)
  const structure = structureMatch ? structureMatch[1].trim() : prompt.substring(0, 100)

  // Buscar conhecimento anatômico específico
  const anatomicalKnowledge = getAnatomicalKnowledge(structure)

  // Construir prompt com conhecimento anatômico
  const enhancedPrompt = `${prompt}

${anatomicalKnowledge ? `
${anatomicalKnowledge}
` : ''}

=== INSTRUÇÕES CRÍTICAS DE QUALIDADE ===

🎯 PRECISÃO ANATÔMICA (PRIORIDADE MÁXIMA):
- A anatomia DEVE estar 100% CORRETA segundo literatura médica
- Posições relativas das estruturas devem ser EXATAS
- Proporções devem ser REALISTAS
- NÃO invente estruturas - mostre apenas o que existe anatomicamente
- Siga EXATAMENTE as referências anatômicas fornecidas acima

📸 ESTILO VISUAL:
- Ilustração médica profissional estilo Atlas Netter/Sobotta
- OU fotografia médica de alta qualidade (dissecção/modelo)
- Cores anatomicamente corretas e padronizadas:
  • Artérias: vermelho vivo
  • Veias: azul escuro
  • Nervos: amarelo
  • Músculos: vermelho-rosado
  • Ossos: bege/marfim
- Iluminação uniforme e profissional
- Fundo neutro (branco ou gradiente suave)

🚫 PROIBIÇÕES ABSOLUTAS:
- ZERO texto, legendas, números ou letras
- ZERO setas, linhas ou marcadores com texto
- ZERO watermarks ou logos
- ZERO estruturas anatomicamente incorretas ou inventadas
- ZERO estilo cartoon ou simplificado demais

A imagem deve ser EDUCACIONALMENTE PRECISA e adequada para estudo médico universitário.`

  try {
    console.log('[GPT Image] Gerando imagem médica com precisão anatômica...')
    console.log('[GPT Image] Estrutura detectada:', structure.substring(0, 50))
    console.log('[GPT Image] Conhecimento anatômico:', anatomicalKnowledge ? 'ENCONTRADO' : 'não encontrado')

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
    const temporaryUrl = imageData.url

    console.log('[GPT Image] Imagem gerada, convertendo para base64 permanente...')

    // IMPORTANTE: Converter para base64 para armazenamento permanente
    // URLs do DALL-E expiram em ~1 hora
    let permanentUrl = temporaryUrl
    try {
      if (temporaryUrl) {
        permanentUrl = await convertImageToBase64(temporaryUrl)
        console.log('[GPT Image] Convertido para base64 com sucesso!')
      }
    } catch (conversionError) {
      console.error('[GPT Image] Falha na conversão base64, usando URL temporária:', conversionError)
      // Fallback para URL temporária se a conversão falhar
    }

    return {
      url: permanentUrl,
      base64: permanentUrl?.startsWith('data:') ? permanentUrl : undefined,
      revisedPrompt: imageData.revised_prompt || prompt,
      estimatedCost: COSTS['high'][size] * n,
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

  // IMPORTANTE: Buscar conhecimento anatômico específico para garantir precisão
  const anatomicalKnowledge = getAnatomicalKnowledge(structure)

  const templates: Record<string, string> = {
    anatomy: `
ILUSTRAÇÃO ANATÔMICA MÉDICA DE ALTA PRECISÃO

Estrutura anatômica: ${structure}
${view ? `Vista/Perspectiva: ${view}` : 'Vista: anterior, bem iluminada'}

${anatomicalKnowledge}

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

${anatomicalKnowledge}

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
