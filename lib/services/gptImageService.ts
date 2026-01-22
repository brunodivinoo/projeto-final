import OpenAI from 'openai'

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Flag para debug
const DEBUG_IMAGE_GENERATION = true

// ============================================
// DETECÇÃO AUTOMÁTICA DE VISTA APROPRIADA
// Garante que estruturas internas sejam mostradas com corte
// ============================================

interface VistaConfig {
  vistaDefault: string
  palavrasQueExigemCorte: string[]
  descricaoCorte: string
}

const ESTRUTURAS_COM_CORTE_OBRIGATORIO: Record<string, VistaConfig> = {
  'coração': {
    vistaDefault: 'Corte frontal/coronal do coração ABERTO mostrando interior',
    palavrasQueExigemCorte: ['câmara', 'camara', 'interno', 'interior', 'septo', 'valva', 'átrio', 'atrio', 'ventrículo', 'ventriculo', '4 câmaras', '4 camaras', 'quatro câmaras'],
    descricaoCorte: 'CORTE FRONTAL (coronal) do coração humano ABERTO, mostrando INTERIOR com as 4 câmaras cardíacas visíveis (átrio direito, átrio esquerdo, ventrículo direito, ventrículo esquerdo), septo interventricular, valvas cardíacas. Como se o coração fosse cortado ao meio verticalmente para revelar todas as estruturas internas.'
  },
  'rim': {
    vistaDefault: 'Corte coronal do rim mostrando interior',
    palavrasQueExigemCorte: ['córtex', 'cortex', 'medula', 'pirâmide', 'piramide', 'cálice', 'calice', 'pelve', 'interno', 'néfron', 'nefron'],
    descricaoCorte: 'CORTE CORONAL (frontal) do rim ABERTO, mostrando INTERIOR com córtex renal externo, medula com pirâmides renais, papilas, cálices menores e maiores, pelve renal e início do ureter.'
  },
  'olho': {
    vistaDefault: 'Corte sagital do olho mostrando interior',
    palavrasQueExigemCorte: ['retina', 'cristalino', 'vítreo', 'vitreo', 'córnea', 'cornea', 'interno', 'câmara', 'camara', 'fóvea', 'fovea'],
    descricaoCorte: 'CORTE SAGITAL (horizontal) do olho humano ABERTO, mostrando INTERIOR com córnea, íris, cristalino, humor vítreo, retina, disco óptico, fóvea, esclera.'
  },
  'útero': {
    vistaDefault: 'Corte coronal do útero mostrando interior',
    palavrasQueExigemCorte: ['endométrio', 'endometrio', 'miométrio', 'miometrio', 'cavidade', 'interno', 'camada'],
    descricaoCorte: 'CORTE CORONAL do útero ABERTO, mostrando INTERIOR com endométrio, miométrio, cavidade uterina, colo do útero.'
  },
  'encéfalo': {
    vistaDefault: 'Corte sagital mediano do encéfalo',
    palavrasQueExigemCorte: ['corpo caloso', 'tálamo', 'talamo', 'hipotálamo', 'hipotalamo', 'ventrículo', 'ventriculo', 'interno', 'substância', 'substancia'],
    descricaoCorte: 'CORTE SAGITAL MEDIANO do encéfalo, mostrando corpo caloso, tálamo, hipotálamo, tronco encefálico, cerebelo, ventrículos.'
  },
  'cérebro': {
    vistaDefault: 'Corte sagital mediano do cérebro',
    palavrasQueExigemCorte: ['corpo caloso', 'ventrículo', 'ventriculo', 'substância branca', 'substancia branca', 'interno'],
    descricaoCorte: 'CORTE SAGITAL MEDIANO do cérebro, mostrando hemisférios, corpo caloso, ventrículos laterais, substância branca e cinzenta.'
  }
}

/**
 * Detecta automaticamente a vista apropriada baseado na estrutura e palavras-chave
 * GARANTE que estruturas internas sejam mostradas com CORTE quando necessário
 */
function detectarVistaApropriada(estrutura: string, detalhesAdicionais?: string, vistaFornecida?: string): string {
  // Se já foi fornecida uma vista específica de corte, usar ela
  if (vistaFornecida) {
    const vistaLower = vistaFornecida.toLowerCase()
    if (vistaLower.includes('corte') || vistaLower.includes('sagital') || vistaLower.includes('coronal') || vistaLower.includes('transversal') || vistaLower.includes('interno')) {
      return vistaFornecida
    }
  }

  const estruturaLower = estrutura.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const detalhesLower = (detalhesAdicionais || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const textoCompleto = `${estruturaLower} ${detalhesLower}`

  // Verificar cada estrutura que pode precisar de corte
  for (const [nomeEstrutura, config] of Object.entries(ESTRUTURAS_COM_CORTE_OBRIGATORIO)) {
    const nomeNormalizado = nomeEstrutura.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    
    if (estruturaLower.includes(nomeNormalizado)) {
      // Verificar se alguma palavra-chave exige corte
      const precisaCorte = config.palavrasQueExigemCorte.some(palavra => {
        const palavraNormalizada = palavra.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return textoCompleto.includes(palavraNormalizada)
      })

      if (precisaCorte) {
        console.log(`[GPT Image] Detectado: "${estrutura}" com palavras que exigem CORTE INTERNO`)
        console.log(`[GPT Image] Vista forçada: ${config.descricaoCorte.substring(0, 80)}...`)
        return config.descricaoCorte
      }
    }
  }

  // Palavras genéricas que SEMPRE indicam necessidade de corte
  const palavrasGenericasCorte = ['interno', 'interior', 'corte', 'secção', 'seccao', 'transversal', 'sagital', 'coronal', 'aberto']
  const precisaCorteGenerico = palavrasGenericasCorte.some(p => textoCompleto.includes(p))
  
  if (precisaCorteGenerico) {
    console.log(`[GPT Image] Palavras genéricas de corte detectadas`)
    return `Corte anatômico mostrando estruturas INTERNAS de ${estrutura}`
  }

  // Vista padrão se nenhum corte for necessário
  return vistaFornecida || 'Vista anterior anatômica'
}

// ============================================
// BASE DE CONHECIMENTO ANATÔMICO - VERSÃO COMPACTA
// Cada entrada tem máximo ~800 caracteres para caber no prompt final
// Limite do DALL-E 3: 4000 caracteres
// ============================================

interface AnatomicalKnowledgeCompact {
  anatomy: string      // Descrição essencial
  mustShow: string[]   // Estruturas obrigatórias
  avoid: string        // Erros críticos a evitar
}

const ANATOMICAL_KNOWLEDGE_COMPACT: Record<string, AnatomicalKnowledgeCompact> = {

  // CARDIOVASCULAR
  'coração': {
    anatomy: `4 câmaras: AD (recebe cavas), AE (recebe pulmonares), VD (parede fina, ejeta p/ tronco pulmonar), VE (parede ESPESSA, ejeta p/ aorta). Valvas: tricúspide (AD-VD), mitral (AE-VE), pulmonar, aórtica. Septo interventricular. Pericárdio envolve.`,
    mustShow: ['4 câmaras', 'VE parede mais espessa que VD', 'septo', 'valvas', 'aorta do VE', 'tronco pulmonar do VD'],
    avoid: 'NÃO inverter espessura das paredes (VE é MAIS grosso). NÃO trocar origem da aorta e tronco pulmonar.'
  },

  'circulação coronariana': {
    anatomy: `Coronária D: sulco AV direito, irriga VD e parede inferior. Coronária E divide em: Descendente Anterior (sulco IV anterior, parede anterior VE) e Circunflexa (sulco AV esquerdo, parede lateral). Veias drenam p/ seio coronário → AD.`,
    mustShow: ['coronária D à direita', 'DA no sulco IV anterior', 'Cx à esquerda', 'seio coronário posterior'],
    avoid: 'NÃO inverter coronárias D e E. DA e Cx são ramos da ESQUERDA.'
  },

  // RESPIRATÓRIO
  'pulmões': {
    anatomy: `Direito: 3 lobos (superior, médio, inferior), mais curto/largo. Esquerdo: 2 lobos + incisura cardíaca, mais longo/estreito. Fissuras: oblíqua (ambos) e horizontal (só direito). Hilo: brônquio, artéria pulmonar, 2 veias.`,
    mustShow: ['3 lobos à direita', '2 lobos à esquerda', 'incisura cardíaca esquerda', 'fissuras'],
    avoid: 'NÃO colocar 3 lobos no esquerdo. NÃO esquecer incisura cardíaca.'
  },

  'pulmão': {
    anatomy: `Direito: 3 lobos (superior, médio, inferior), mais curto/largo. Esquerdo: 2 lobos + incisura cardíaca, mais longo/estreito. Fissuras: oblíqua (ambos) e horizontal (só direito). Hilo: brônquio, artéria pulmonar, 2 veias.`,
    mustShow: ['3 lobos à direita', '2 lobos à esquerda', 'incisura cardíaca esquerda', 'fissuras'],
    avoid: 'NÃO colocar 3 lobos no esquerdo. NÃO esquecer incisura cardíaca.'
  },

  'árvore brônquica': {
    anatomy: `Traqueia (anéis em C) bifurca na carina T4-T5. Brônquio D: mais curto, largo, VERTICAL (aspiração comum aqui). Brônquio E: mais longo, estreito, HORIZONTAL. Divisões: lobares → segmentares → bronquíolos → alvéolos.`,
    mustShow: ['traqueia com anéis', 'carina', 'brônquio D vertical', 'brônquio E horizontal'],
    avoid: 'NÃO fazer brônquios simétricos. D é mais VERTICAL.'
  },

  // DIGESTÓRIO
  'fígado': {
    anatomy: `Maior glândula. Lobos: D (5/6), E (menor), quadrado (inferior, entre vesícula e lig. redondo), caudado (posterior, entre VCI e lig. venoso). Faces: diafragmática (superior) e visceral (inferior com porta hepatis). Veias hepáticas → VCI.`,
    mustShow: ['4 lobos', 'vesícula biliar', 'porta hepatis', 'veias hepáticas'],
    avoid: 'NÃO esquecer lobos caudado e quadrado. NÃO confundir faces.'
  },

  'histologia do fígado': {
    anatomy: `Lóbulos HEXAGONAIS. Veia central no CENTRO. Tríades portais nos 6 vértices (veia porta + artéria hepática + ducto biliar). Hepatócitos POLIGONAIS em cordões radiados do centro. Sinusóides entre cordões. Sangue: periferia→centro. Bile: centro→periferia.`,
    mustShow: ['lóbulos hexagonais', 'veia central no centro', 'tríades nos vértices', 'hepatócitos poligonais em cordões'],
    avoid: 'NÃO fazer hepatócitos alongados (são POLIGONAIS). NÃO confundir com músculo.'
  },

  // REPRODUTOR MASCULINO
  'sistema reprodutor masculino': {
    anatomy: `EXTERNOS: Testículos no ESCROTO (fora da pelve!), epidídimo posterior ao testículo, pênis (2 corpos cavernosos + 1 esponjoso). INTERNOS: Ducto deferente sobe pelo canal inguinal, vesículas seminais POSTERIOR-INFERIOR à bexiga, próstata INFERIOR à bexiga envolvendo uretra.`,
    mustShow: ['testículos NO ESCROTO (externos)', 'epidídimo posterior', 'próstata abaixo da bexiga', 'vesículas seminais atrás da bexiga'],
    avoid: 'NUNCA colocar testículos dentro da pelve. Próstata é INFERIOR, vesículas são POSTERIORES à bexiga.'
  },

  // REPRODUTOR FEMININO
  'sistema reprodutor feminino': {
    anatomy: `Ovários LATERAIS ao útero (fossas ováricas). Tubas uterinas com fímbrias (captam óvulo) → ampola → istmo → útero. Útero piriforme: fundo, corpo, colo. Entre bexiga (anterior) e reto (posterior). Vagina abaixo do colo. Ligamentos: largo, redondo, uterossacro.`,
    mustShow: ['ovários laterais', 'tubas com fímbrias', 'útero (fundo-corpo-colo)', 'bexiga anterior', 'reto posterior'],
    avoid: 'NÃO desenhar útero simétrico triangular. NÃO esquecer fímbrias. Ovários são LATERAIS.'
  },

  // URINÁRIO
  'rim': {
    anatomy: `Retroperitoneal, forma de feijão. D mais baixo (fígado). EXTERNO: polos, hilo medial. INTERNO (corte coronal): córtex EXTERNO (glomérulos) → medula com pirâmides (base p/ córtex, ápice=papila p/ cálice) → cálices menores/maiores → pelve → ureter.`,
    mustShow: ['córtex externo', 'pirâmides medulares', 'papilas', 'cálices', 'pelve', 'hilo'],
    avoid: 'NÃO confundir córtex com medula. Córtex é EXTERNO.'
  },

  'néfron': {
    anatomy: `Unidade funcional. Corpúsculo renal no córtex: glomérulo + cápsula de Bowman. TCP com borda em escova (córtex). Alça de Henle desce na medula (ramos fino e espesso). TCD sem borda em escova (córtex). Ducto coletor desce pela medula.`,
    mustShow: ['glomérulo', 'cápsula de Bowman', 'TCP com microvilosidades', 'alça de Henle na medula', 'TCD', 'ducto coletor'],
    avoid: 'NÃO esquecer borda em escova do TCP. Ducto coletor na MEDULA.'
  },

  // NERVOSO
  'encéfalo': {
    anatomy: `Cérebro: 2 hemisférios com giros/sulcos, unidos pelo corpo caloso. Lobos: frontal, parietal, temporal, occipital. Sulcos principais: central, lateral. Diencéfalo: tálamo, hipotálamo. Tronco: mesencéfalo, ponte, bulbo. Cerebelo: posterior ao tronco, com folia.`,
    mustShow: ['hemisférios cerebrais', 'corpo caloso', 'lobos', 'tronco encefálico', 'cerebelo'],
    avoid: 'NÃO esquecer cerebelo. NÃO simplificar demais os giros.'
  },

  'cérebro': {
    anatomy: `Cérebro: 2 hemisférios com giros/sulcos, unidos pelo corpo caloso. Lobos: frontal (anterior), parietal (superior), temporal (lateral inferior), occipital (posterior). Sulcos: central (Rolando), lateral (Sylvius). Giro pré-central=motor, pós-central=sensitivo.`,
    mustShow: ['hemisférios', '4 lobos', 'sulco central', 'fissura lateral', 'giros pré e pós-central'],
    avoid: 'NÃO confundir posições dos lobos. Frontal é ANTERIOR, Occipital é POSTERIOR.'
  },

  'medula espinhal': {
    anatomy: `Do forame magno até L1-L2. Intumescências cervical e lombar. Cone medular → cauda equina abaixo. Corte transversal: substância cinzenta central em H (cornos anterior=motor, posterior=sensitivo), branca periférica. Raiz posterior tem gânglio.`,
    mustShow: ['termina em L1-L2', 'cone medular', 'cauda equina', 'H cinzento central', 'gânglio na raiz posterior'],
    avoid: 'NÃO estender até sacro. Gânglio só na raiz POSTERIOR.'
  },

  // MUSCULOESQUELÉTICO
  'coluna vertebral': {
    anatomy: `33 vértebras: 7C, 12T, 5L, 5S (fundidas), 4Co (fundidas). Curvaturas: lordose cervical/lombar (convexa anterior), cifose torácica/sacral (côncava anterior). Vértebra: corpo anterior, arco posterior, processos espinhosos/transversos/articulares.`,
    mustShow: ['regiões C-T-L-S-Co', 'curvaturas alternadas', 'corpo e arco vertebral', 'discos intervertebrais'],
    avoid: 'NÃO fazer todas vértebras iguais. NÃO esquecer curvaturas.'
  },

  'membro superior esqueleto': {
    anatomy: `Cintura: clavícula + escápula. Braço: úmero. Antebraço: ulna (MEDIAL, olécrano) + rádio (LATERAL). Mão: 8 carpos, 5 metacarpos, falanges (2 no polegar, 3 nos demais).`,
    mustShow: ['clavícula-escápula', 'úmero', 'ulna medial', 'rádio lateral', 'carpo-metacarpo-falanges'],
    avoid: 'NÃO inverter ulna e rádio. Ulna é MEDIAL (lado mindinho).'
  },

  'membro inferior esqueleto': {
    anatomy: `Cintura pélvica: ílio+ísquio+púbis (acetábulo). Coxa: fêmur. Joelho: patela. Perna: tíbia (MEDIAL, suporta peso) + fíbula (LATERAL). Pé: 7 tarsos (tálus, calcâneo), 5 metatarsos, falanges.`,
    mustShow: ['pelve com acetábulo', 'fêmur', 'patela', 'tíbia medial', 'fíbula lateral', 'tarso-metatarso-falanges'],
    avoid: 'NÃO inverter tíbia e fíbula. Tíbia é MEDIAL e suporta peso.'
  },

  // HISTOLOGIA BÁSICA
  'tecido epitelial': {
    anatomy: `Células justapostas sobre membrana basal. Simples (1 camada) ou estratificado (várias). Formas: pavimentoso, cúbico, colunar. Pseudoestratificado: todos tocam a basal mas parecem várias camadas.`,
    mustShow: ['membrana basal', 'células em camadas', 'núcleos característicos'],
    avoid: 'NÃO confundir pseudoestratificado com estratificado verdadeiro.'
  },

  'tecido conjuntivo': {
    anatomy: `Células dispersas em matriz extracelular abundante. Fibroblastos produzem fibras (colágenas rosa, elásticas, reticulares). Tipos: frouxo, denso modelado/não modelado, adiposo, cartilaginoso, ósseo.`,
    mustShow: ['fibroblastos', 'fibras colágenas', 'matriz extracelular'],
    avoid: 'NÃO confundir frouxo com denso. NÃO esquecer matriz.'
  },

  'tecido muscular estriado esquelético': {
    anatomy: `Fibras longas, cilíndricas, multinucleadas. Núcleos PERIFÉRICOS. Estriações transversais (bandas A escuras, I claras, linhas Z). Sarcômero: Z a Z. Controle voluntário.`,
    mustShow: ['fibras longas paralelas', 'estriações', 'núcleos PERIFÉRICOS'],
    avoid: 'NÃO colocar núcleos centrais (são PERIFÉRICOS no esquelético).'
  },

  'tecido muscular cardíaco': {
    anatomy: `Fibras ramificadas. 1-2 núcleos CENTRAIS. Estriações presentes. DISCOS INTERCALARES entre células (junções especializadas). Controle involuntário.`,
    mustShow: ['fibras ramificadas', 'núcleos centrais', 'discos intercalares', 'estriações'],
    avoid: 'NÃO esquecer discos intercalares (diferencial do cardíaco).'
  },

  'tecido muscular liso': {
    anatomy: `Células fusiformes. 1 núcleo CENTRAL alongado. SEM ESTRIAÇÕES. Controle involuntário. Localização: vísceras, vasos, útero.`,
    mustShow: ['células fusiformes', 'núcleo central', 'sem estriações'],
    avoid: 'NÃO colocar estriações (músculo liso NÃO tem).'
  },

  'tecido nervoso': {
    anatomy: `Neurônios: corpo celular (núcleo grande, corpúsculos de Nissl), dendritos (múltiplos, receptores), axônio (único, efetor). Glia: astrócitos, oligodendrócitos, micróglia, Schwann.`,
    mustShow: ['corpo celular', 'corpúsculos de Nissl', 'dendritos', 'axônio', 'células da glia'],
    avoid: 'NÃO confundir neurônios com glia. Glia é menor e mais numerosa.'
  },

  'tecido ósseo': {
    anatomy: `Osso compacto: sistemas de Havers (ósteons) com canal central, lamelas concêntricas, lacunas com osteócitos, canalículos. Células: osteoblastos (formam), osteócitos (mantêm), osteoclastos (reabsorvem).`,
    mustShow: ['sistemas de Havers', 'canal central', 'lamelas concêntricas', 'lacunas', 'osteócitos'],
    avoid: 'Lamelas são CONCÊNTRICAS ao canal. Osteócitos nas LACUNAS.'
  },

  'tecido cartilaginoso': {
    anatomy: `Condrócitos em lacunas dentro de matriz. Grupos isógenos = divisão recente. Tipos: hialina (articulações), elástica (orelha), fibrosa (discos). Pericôndrio na superfície (exceto articular).`,
    mustShow: ['condrócitos em lacunas', 'grupos isógenos', 'matriz', 'pericôndrio'],
    avoid: 'Condrócitos em LACUNAS. Matriz é AVASCULAR.'
  },

  'sangue': {
    anatomy: `Hemácias: discos bicôncavos, ANUCLEADAS, rosa. Leucócitos: neutrófilos (núcleo multilobulado), linfócitos (núcleo grande redondo), monócitos, eosinófilos, basófilos. Plaquetas: fragmentos pequenos.`,
    mustShow: ['hemácias anucleadas', 'neutrófilos multilobulados', 'linfócitos', 'plaquetas'],
    avoid: 'Hemácias são ANUCLEADAS. Neutrófilos têm núcleo MULTILOBULADO.'
  },

  // OLHO E OUVIDO
  'olho': {
    anatomy: `Túnicas: fibrosa (esclera+córnea), vascular/úvea (coroide+corpo ciliar+íris), nervosa (retina). Meios refrativos: córnea, humor aquoso, cristalino, vítreo. Câmaras: anterior (córnea-íris), posterior (íris-cristalino). Retina: disco óptico (ponto cego), fóvea (mácula).`,
    mustShow: ['3 túnicas', 'cristalino', 'câmaras', 'disco óptico', 'fóvea'],
    avoid: 'NÃO confundir câmaras anterior e posterior.'
  },

  'ouvido': {
    anatomy: `Externo: pavilhão, meato, tímpano. Médio: ossículos (martelo-bigorna-estribo), tuba auditiva. Interno: vestíbulo, 3 canais semicirculares perpendiculares, cóclea (2.5 voltas em espiral com órgão de Corti).`,
    mustShow: ['3 partes', 'ossículos em sequência', '3 canais semicirculares perpendiculares', 'cóclea espiral'],
    avoid: 'NÃO simplificar cóclea. NÃO esquecer canais semicirculares perpendiculares.'
  },

  'pele': {
    anatomy: `Epiderme: estratos basal→espinhoso→granuloso→(lúcido)→córneo. Derme: papilar (frouxo) e reticular (denso). Anexos: folículos pilosos, glândulas sebáceas (abrem no folículo), sudoríparas.`,
    mustShow: ['estratos epidérmicos em ordem', 'derme papilar e reticular', 'folículos', 'glândulas'],
    avoid: 'Estrato lúcido só em pele ESPESSA. Sebáceas abrem no FOLÍCULO.'
  }
}

// ============================================
// BASE DE CONHECIMENTO ANATÔMICO - VERSÃO DETALHADA
// Usado para consultas e referências mais completas
// ============================================

interface AnatomicalKnowledge {
  description: string
  keyStructures: string[]
  correctView: string
  commonMistakes: string[]
}

const ANATOMICAL_KNOWLEDGE: Record<string, AnatomicalKnowledge> = {

  // ========================================
  // SISTEMA RESPIRATÓRIO
  // ========================================

  'pulmões': {
    description: `
PULMÃO DIREITO (3 lobos):
- Lobo superior: acima da fissura horizontal
- Lobo médio: entre fissuras horizontal e oblíqua
- Lobo inferior: abaixo da fissura oblíqua
- Mais curto (diafragma elevado pelo fígado) e mais largo

PULMÃO ESQUERDO (2 lobos):
- Lobo superior: inclui língula (equivalente ao lobo médio)
- Lobo inferior: abaixo da fissura oblíqua
- Incisura cardíaca: depressão para o coração
- Mais longo e mais estreito

HILO PULMONAR (conteúdo):
- Brônquio principal
- Artéria pulmonar
- 2 veias pulmonares (superior e inferior)
- Vasos brônquicos, linfonodos, nervos

SEGMENTOS BRONCOPULMONARES: 10 no direito, 8-10 no esquerdo
    `,
    keyStructures: ['pulmão direito com 3 lobos', 'pulmão esquerdo com 2 lobos e incisura cardíaca', 'fissuras horizontal e oblíqua à direita', 'fissura oblíqua à esquerda', 'hilo pulmonar com brônquio, artéria e veias'],
    correctView: 'Direito: 3 lobos, mais curto/largo | Esquerdo: 2 lobos, incisura cardíaca, mais longo/estreito',
    commonMistakes: ['NÃO colocar 3 lobos no pulmão esquerdo. NÃO esquecer a incisura cardíaca à esquerda.']
  },

  'pulmão': {
    description: `
PULMÃO DIREITO (3 lobos):
- Lobo superior: acima da fissura horizontal
- Lobo médio: entre fissuras horizontal e oblíqua
- Lobo inferior: abaixo da fissura oblíqua
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

  'árvore brônquica': {
    description: `
TRAQUEIA:
- 10-12cm de comprimento, 2cm de diâmetro
- Anéis cartilaginosos em "C" (abertos posteriormente)
- Bifurca na carina (T4-T5)

BRÔNQUIOS PRINCIPAIS:
- Direito: mais curto, mais largo, mais vertical (aspiração mais comum)
- Esquerdo: mais longo, mais estreito, mais horizontal

DIVISÕES:
- Brônquios lobares: 3 à direita, 2 à esquerda
- Brônquios segmentares: 10 à direita, 8-10 à esquerda
- Bronquíolos: perdem cartilagem
- Bronquíolos terminais → respiratórios → ductos alveolares → alvéolos
    `,
    keyStructures: ['traqueia com anéis cartilaginosos', 'carina traqueal', 'brônquio principal direito (mais vertical)', 'brônquio principal esquerdo (mais horizontal)', 'ramificações progressivas'],
    correctView: 'Traqueia → carina → brônquios principais → lobares → segmentares → bronquíolos',
    commonMistakes: ['NÃO fazer brônquio direito e esquerdo simétricos. Direito é mais vertical.']
  },

  // ========================================
  // SISTEMA DIGESTÓRIO
  // ========================================

  'fígado': {
    description: `
Maior glândula do corpo, 1.5kg, quadrante superior direito.

LOBOS (anatomia de superfície):
- Lobo direito: maior (5/6 do órgão)
- Lobo esquerdo: menor, cruza a linha média
- Lobo quadrado: entre vesícula biliar e ligamento redondo (inferior)
- Lobo caudado: entre VCI e ligamento venoso (posterior)

FACES:
- Diafragmática: convexa, lisa, sob o diafragma
- Visceral: côncava, com impressões de órgãos adjacentes

LIGAMENTOS:
- Falciforme: conecta ao diafragma e parede abdominal anterior
- Redondo: vestígio da veia umbilical (borda livre do falciforme)
- Coronário: reflexão peritoneal superior
- Triangulares: extremidades do coronário

PEDÍCULO HEPÁTICO (porta hepatis):
- Veia porta (posterior)
- Artéria hepática própria (anterior esquerda)
- Ducto hepático comum (anterior direita)

DRENAGEM VENOSA: Veias hepáticas → VCI
    `,
    keyStructures: ['lobo direito (maior)', 'lobo esquerdo', 'lobo quadrado inferior', 'lobo caudado posterior', 'vesícula biliar na face visceral', 'porta hepatis com tríade portal', 'veias hepáticas drenando para VCI'],
    correctView: 'Face diafragmática superior/anterior | Face visceral inferior/posterior | Porta hepatis no centro da face visceral',
    commonMistakes: ['NÃO esquecer os 4 lobos. NÃO inverter posição do lobo caudado e quadrado.']
  },

  'histologia do fígado': {
    description: `
LÓBULO HEPÁTICO CLÁSSICO:
- Forma HEXAGONAL (6 lados)
- Veia central (centrolobular) no centro
- Tríades portais nos cantos (6 tríades por lóbulo)

TRÍADE PORTAL:
- Ramo da veia porta
- Ramo da artéria hepática
- Ducto biliar
- Envoltos em tecido conjuntivo

HEPATÓCITOS:
- Células POLIGONAIS grandes (20-30 μm)
- Núcleo redondo central, às vezes binucleados
- Citoplasma eosinofílico (rosa) abundante
- Organizados em CORDÕES/PLACAS radiando do centro

SINUSÓIDES HEPÁTICOS:
- Capilares fenestrados entre cordões de hepatócitos
- Contêm células de Kupffer (macrófagos)
- Sangue flui da periferia → centro (centrípeto)

ESPAÇO DE DISSE: entre sinusóides e hepatócitos (células estreladas)

BILE: flui do centro → periferia (centrífugo) - oposto ao sangue
    `,
    keyStructures: ['lóbulos hexagonais', 'veia central no centro do lóbulo', 'tríades portais nos vértices', 'cordões de hepatócitos radiados', 'sinusóides entre os cordões', 'hepatócitos poligonais com núcleo central'],
    correctView: 'Tríades portais na periferia → sinusóides → veia central | Sangue: periferia→centro | Bile: centro→periferia',
    commonMistakes: ['NÃO mostrar hepatócitos alongados (devem ser POLIGONAIS). NÃO esquecer padrão HEXAGONAL dos lóbulos. NÃO confundir com músculo estriado.']
  },

  // ========================================
  // SISTEMA REPRODUTOR MASCULINO
  // ========================================

  'sistema reprodutor masculino': {
    description: `
ÓRGÃOS EXTERNOS:

ESCROTO:
- Bolsa cutânea dividida em 2 compartimentos
- Localização: EXTERNA à cavidade pélvica
- Função: manter testículos 2-3°C abaixo da temperatura corporal

TESTÍCULOS (2):
- Gônadas masculinas, formato ovoide (4-5cm)
- Localização: DENTRO DO ESCROTO (não na pelve!)
- Envolvidos pela túnica albugínea
- Túbulos seminíferos: produção de espermatozoides
- Células de Leydig: produção de testosterona

EPIDÍDIMO:
- Estrutura em forma de vírgula/crescente
- Localização: face POSTERIOR de cada testículo
- Partes: cabeça (superior), corpo, cauda (inferior)
- Função: maturação e armazenamento de espermatozoides

PÊNIS:
- Corpos cavernosos (2): dorsais, tecido erétil principal
- Corpo esponjoso (1): ventral, contém uretra
- Glande: expansão distal do corpo esponjoso
- Prepúcio: pele que cobre a glande

ÓRGÃOS INTERNOS:

DUCTO DEFERENTE:
- Tubo muscular de parede espessa
- Trajeto: epidídimo → canal inguinal → cavidade pélvica → posterior à bexiga
- Ampola: dilatação terminal antes de juntar com vesícula seminal

VESÍCULAS SEMINAIS (2):
- Glândulas em forma de saco tortuoso (5cm)
- Localização: POSTERIOR e INFERIOR à bexiga
- Une-se ao ducto deferente → ducto ejaculatório
- Produz 70% do líquido seminal (frutose)

DUCTOS EJACULATÓRIOS (2):
- Formados pela união: ducto deferente + vesícula seminal
- Atravessam a próstata
- Abrem na uretra prostática

PRÓSTATA:
- Glândula única em forma de castanha (3-4cm)
- Localização: INFERIOR à bexiga, envolvendo a uretra prostática
- Zonas: periférica (70%), central, transicional
- Produz 30% do líquido seminal (PSA, fosfatase ácida)

GLÂNDULAS BULBOURETRAIS (de Cowper):
- Par de glândulas pequenas (ervilha)
- Localização: diafragma urogenital
- Secretam muco pré-ejaculatório

URETRA MASCULINA (18-20cm):
- Prostática: atravessa próstata (3cm)
- Membranosa: atravessa diafragma urogenital (1cm)
- Esponjosa: dentro do corpo esponjoso (15cm)
    `,
    keyStructures: ['testículos DENTRO do escroto (externos)', 'epidídimo posterior ao testículo', 'ducto deferente subindo pelo canal inguinal', 'vesículas seminais posterior-inferior à bexiga', 'próstata inferior à bexiga envolvendo uretra', 'corpos cavernosos e esponjoso do pênis'],
    correctView: 'Testículos (escroto) → epidídimo → ducto deferente (sobe) → vesículas seminais + próstata (pelve) → uretra (atravessa próstata e pênis)',
    commonMistakes: ['NUNCA colocar testículos dentro da pelve - estão NO ESCROTO (externo). NÃO inverter vesículas seminais e próstata. Próstata é INFERIOR à bexiga, vesículas são POSTERIORES.']
  },

  // ========================================
  // SISTEMA REPRODUTOR FEMININO
  // ========================================

  'sistema reprodutor feminino': {
    description: `
ÓRGÃOS INTERNOS:

OVÁRIOS (2):
- Gônadas femininas, formato amendoado (3-4cm)
- Localização: fossas ováricas, laterais ao útero
- Fixação: ligamento suspensor, ligamento próprio do ovário, mesovário
- Superfície: irregular nas mulheres adultas (cicatrizes ovulatórias)

TUBAS UTERINAS (2) - Trompas de Falópio:
- Comprimento: 10-12cm
- Partes (lateral → medial):
  * Infundíbulo: extremidade aberta com fímbrias
  * Ampola: parte mais larga, local comum de fertilização
  * Istmo: porção estreita
  * Parte uterina: atravessa parede do útero
- Fímbrias: projeções digitiformes que capturam o óvulo

ÚTERO:
- Órgão muscular piriforme (7-8cm)
- Localização: pelve, entre bexiga (anterior) e reto (posterior)
- Partes:
  * Fundo: acima da entrada das tubas
  * Corpo: porção principal
  * Istmo: estreitamento
  * Colo/Cérvix: porção inferior, projeta-se na vagina
- Camadas:
  * Endométrio: mucosa interna (descama na menstruação)
  * Miométrio: muscular espessa
  * Perimétrio: serosa externa
- Posição normal: antevertido e antefletido

VAGINA:
- Canal fibromuscular (7-10cm)
- Estende-se do colo do útero ao vestíbulo
- Fórnices: recessos ao redor do colo (anterior, posterior, laterais)
- Fórnix posterior: mais profundo, relacionado ao fundo de saco de Douglas

LIGAMENTOS:
- Largo: prega peritoneal bilateral
- Redondo: do útero ao lábio maior (atravessa canal inguinal)
- Uterossacro: do colo ao sacro
- Cardinal/Transverso: suporte lateral do colo

ÓRGÃOS EXTERNOS (VULVA):
- Monte púbico
- Lábios maiores e menores
- Clitóris
- Vestíbulo: contém óstios uretral e vaginal
- Glândulas vestibulares maiores (de Bartholin)
    `,
    keyStructures: ['ovários laterais ao útero', 'tubas uterinas conectando ovários ao útero', 'fímbrias nas extremidades das tubas', 'útero com fundo corpo e colo', 'vagina inferior ao útero', 'bexiga anterior ao útero', 'reto posterior ao útero'],
    correctView: 'Ovários (lateral) → Tubas (fímbrias capturam óvulo) → Útero (fundo-corpo-colo) → Vagina | Bexiga anterior | Reto posterior',
    commonMistakes: ['NÃO desenhar útero muito grande ou simétrico como um triângulo perfeito. NÃO esquecer as fímbrias. NÃO colocar ovários muito próximos do útero.']
  },

  // ========================================
  // SISTEMA URINÁRIO
  // ========================================

  'rim': {
    description: `
Órgãos pareados, retroperitoneais, formato de feijão (11x6x3cm).

ANATOMIA EXTERNA:
- Polo superior: mais medial, relacionado à suprarrenal
- Polo inferior: mais lateral
- Face anterior: convexa
- Face posterior: plana, contra parede posterior
- Hilo renal: face medial, entrada de vasos e ureter

RELAÇÕES:
- Rim direito: mais baixo (fígado), T12-L3
- Rim esquerdo: mais alto, T11-L2

ANATOMIA INTERNA (corte coronal):
- CÓRTEX: zona externa, mais clara
  * Contém glomérulos e túbulos contorcidos
  * Colunas renais: extensões entre pirâmides
- MEDULA: zona interna, mais escura
  * 8-18 pirâmides renais (estriadas)
  * Base voltada para o córtex
  * Ápice (papila) voltado para o seio renal
- PELVE RENAL: cavidade que coleta urina
  * Cálices menores: recebem papilas
  * Cálices maiores: união de cálices menores
  * Pelve: união de cálices maiores → ureter

VASCULARIZAÇÃO:
- Artéria renal: ramo da aorta
- Segmentares → Interlobares → Arqueadas → Interlobulares → Aferentes
- Veia renal: drena para VCI
    `,
    keyStructures: ['córtex renal externo', 'medula com pirâmides', 'papilas renais', 'cálices menores e maiores', 'pelve renal', 'hilo com artéria veia e ureter', 'cápsula fibrosa'],
    correctView: 'Córtex (externo) → Pirâmides medulares → Papilas → Cálices → Pelve → Ureter',
    commonMistakes: ['NÃO confundir córtex com medula. Córtex é EXTERNO. NÃO esquecer as pirâmides.']
  },

  'néfron': {
    description: `
Unidade funcional do rim. ~1 milhão por rim.

COMPONENTES:

CORPÚSCULO RENAL (no córtex):
- Glomérulo: novelo de capilares fenestrados
- Cápsula de Bowman: envolve o glomérulo
  * Folheto parietal: epitélio simples pavimentoso
  * Folheto visceral: podócitos
- Polo vascular: entrada/saída de arteríolas
- Polo urinário: início do túbulo contorcido proximal

TÚBULO CONTORCIDO PROXIMAL (no córtex):
- Epitélio cúbico com borda em escova (microvilosidades)
- Reabsorve 65% do filtrado

ALÇA DE HENLE (na medula):
- Ramo descendente fino: permeável à água
- Ramo ascendente fino: impermeável à água
- Ramo ascendente espesso: reabsorção ativa de Na+

TÚBULO CONTORCIDO DISTAL (no córtex):
- Epitélio cúbico SEM borda em escova
- Mácula densa: contato com arteríola aferente

DUCTO COLETOR (na medula):
- Epitélio cúbico a colunar
- Células principais: reabsorção de água (ADH)
- Células intercaladas: secreção de H+
- Vários néfrons drenam para cada ducto
    `,
    keyStructures: ['glomérulo com capilares', 'cápsula de Bowman', 'túbulo contorcido proximal com borda em escova', 'alça de Henle (ramos descendente e ascendente)', 'túbulo contorcido distal', 'ducto coletor', 'arteríolas aferente e eferente'],
    correctView: 'Corpúsculo (córtex) → TCP (córtex) → Alça de Henle (mergulha na medula) → TCD (córtex) → Ducto coletor (desce pela medula)',
    commonMistakes: ['NÃO esquecer a borda em escova do TCP. NÃO mostrar ducto coletor no córtex.']
  },

  // ========================================
  // SISTEMA NERVOSO
  // ========================================

  'encéfalo': {
    description: `
DIVISÕES PRINCIPAIS:

CÉREBRO (telencéfalo):
- 2 hemisférios separados pela fissura longitudinal
- Unidos pelo corpo caloso
- Superfície: giros e sulcos
- Lobos: frontal, parietal, temporal, occipital, ínsula
- Sulcos principais: central (Rolando), lateral (Sylvius), parieto-occipital

DIENCÉFALO:
- Tálamo: relay sensorial, núcleos em forma de ovo
- Hipotálamo: inferior ao tálamo, controle autonômico
- Epitálamo: inclui glândula pineal
- Subtálamo: motor

TRONCO ENCEFÁLICO:
- Mesencéfalo: pedúnculos cerebrais, colículos
- Ponte: protuberância anterior, conecta hemisférios cerebelares
- Bulbo (medula oblonga): pirâmides, olivas

CEREBELO:
- 2 hemisférios + vermis central
- Folia: pregas transversais características
- Pedúnculos cerebelares: superior, médio, inferior
- Funções: coordenação motora, equilíbrio

VENTRÍCULOS:
- Laterais (2): nos hemisférios cerebrais
- Terceiro: no diencéfalo
- Aqueduto cerebral: no mesencéfalo
- Quarto: entre tronco e cerebelo
    `,
    keyStructures: ['hemisférios cerebrais com giros e sulcos', 'corpo caloso conectando hemisférios', 'lobos frontal parietal temporal occipital', 'tronco encefálico (mesencéfalo ponte bulbo)', 'cerebelo posterior ao tronco', 'diencéfalo (tálamo hipotálamo)'],
    correctView: 'Cérebro (superior) → Diencéfalo (central) → Tronco (inferior) | Cerebelo posterior ao tronco',
    commonMistakes: ['NÃO esquecer o cerebelo. NÃO confundir ponte com bulbo. NÃO simplificar demais os giros.']
  },

  'cérebro': {
    description: `
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

  'medula espinhal': {
    description: `
Estrutura cilíndrica, 42-45cm, do forame magno até L1-L2.

ANATOMIA EXTERNA:
- Intumescências: cervical (C4-T1) e lombar (L2-S3) - membros
- Cone medular: extremidade inferior afilada
- Cauda equina: raízes nervosas abaixo do cone
- Filum terminale: fio de pia-máter até o cóccix

SULCOS:
- Fissura mediana anterior: profunda, anterior
- Sulco mediano posterior: raso, posterior
- Sulcos laterais: saída/entrada de raízes

RAÍZES:
- Anterior (ventral): motora, eferente
- Posterior (dorsal): sensitiva, aferente, com gânglio

ANATOMIA INTERNA (corte transversal):
- Substância cinzenta central em forma de "H" ou borboleta:
  * Corno anterior: neurônios motores
  * Corno posterior: neurônios sensitivos
  * Corno lateral (T1-L2): neurônios simpáticos
- Substância branca periférica:
  * Funículos anterior, lateral, posterior
  * Tratos ascendentes (sensitivos) e descendentes (motores)
- Canal central: vestígio do tubo neural

MENINGES:
- Dura-máter: externa, forma saco dural até S2
- Aracnoide: intermediária, avascular
- Pia-máter: interna, adere à medula
- Espaço subaracnóideo: contém LCR
    `,
    keyStructures: ['intumescências cervical e lombar', 'cone medular em L1-L2', 'cauda equina abaixo do cone', 'substância cinzenta central em H', 'substância branca periférica', 'raízes anterior (motora) e posterior (sensitiva)', 'gânglio da raiz posterior'],
    correctView: 'Medula dentro do canal vertebral | Cinzenta central, branca periférica | Raiz posterior com gânglio, raiz anterior sem gânglio',
    commonMistakes: ['NÃO estender medula até sacro (termina em L1-L2). NÃO esquecer o gânglio na raiz posterior.']
  },

  // ========================================
  // SISTEMA MUSCULOESQUELÉTICO
  // ========================================

  'coluna vertebral': {
    description: `
33 vértebras: 7 cervicais, 12 torácicas, 5 lombares, 5 sacrais (fundidas), 4 coccígeas (fundidas).

CURVATURAS:
- Cervical: lordose (convexa anterior) - secundária
- Torácica: cifose (côncava anterior) - primária
- Lombar: lordose - secundária
- Sacral: cifose - primária

VÉRTEBRA TÍPICA:
- Corpo: anterior, suporta peso
- Arco vertebral: posterior, protege medula
  * Pedículos: conectam corpo ao arco
  * Lâminas: completam o arco posteriormente
- Processos:
  * Espinhoso: posterior, palpável
  * Transversos (2): laterais
  * Articulares (4): superior e inferior, cada lado
- Forame vertebral: canal para medula
- Forames intervertebrais: saída dos nervos espinhais

CARACTERÍSTICAS REGIONAIS:
- Cervicais: forame transverso (artéria vertebral), processo espinhoso bífido
- C1 (Atlas): sem corpo, articula com occipital
- C2 (Áxis): processo odontoide (dente)
- Torácicas: fóveas costais para articulação com costelas
- Lombares: maiores corpos, processos robustos

DISCOS INTERVERTEBRAIS:
- Núcleo pulposo: centro gelatinoso
- Anel fibroso: periferia fibrocartilaginosa
    `,
    keyStructures: ['regiões cervical torácica lombar sacral coccígea', 'curvaturas lordóticas e cifóticas', 'corpo vertebral anterior', 'arco vertebral posterior', 'processos espinhosos e transversos', 'discos intervertebrais', 'forames vertebral e intervertebral'],
    correctView: 'Cervical (7) → Torácica (12) → Lombar (5) → Sacro → Cóccix | Lordose cervical e lombar, cifose torácica e sacral',
    commonMistakes: ['NÃO esquecer as curvaturas. NÃO fazer todas as vértebras iguais.']
  },

  'membro superior esqueleto': {
    description: `
CINTURA ESCAPULAR:
- Clavícula: osso em "S", conecta esterno à escápula
- Escápula: triangular, posterior
  * Espinha da escápula → acrômio
  * Processo coracoide: anterior
  * Cavidade glenoide: articula com úmero

BRAÇO:
- Úmero: osso longo
  * Cabeça: esférica, articula com glenoide
  * Tubérculos maior e menor
  * Sulco intertubercular (bicipital)
  * Diáfise com tuberosidade deltoidea
  * Epicôndilos medial e lateral (cotovelo)
  * Tróclea e capítulo (articulação com ulna e rádio)

ANTEBRAÇO:
- Ulna: medial, maior proximalmente
  * Olécrano: ponta do cotovelo
  * Processo coronoide
  * Incisura troclear: articula com tróclea
- Rádio: lateral, maior distalmente
  * Cabeça: articula com capítulo
  * Tuberosidade radial: inserção do bíceps
  * Processo estiloide: lateral no punho

MÃO:
- Carpo (8 ossos): escafoide, semilunar, piramidal, pisiforme, trapézio, trapezoide, capitato, hamato
- Metacarpos (5): I a V, lateral para medial
- Falanges: 2 no polegar, 3 nos demais (proximal, média, distal)
    `,
    keyStructures: ['clavícula e escápula (cintura)', 'úmero no braço', 'ulna (medial) e rádio (lateral) no antebraço', 'ossos do carpo', 'metacarpos I-V', 'falanges'],
    correctView: 'Clavícula-Escápula → Úmero → Ulna+Rádio → Carpo → Metacarpos → Falanges | Ulna medial, Rádio lateral',
    commonMistakes: ['NÃO inverter ulna e rádio. Ulna é MEDIAL (lado do mindinho). NÃO esquecer que polegar tem só 2 falanges.']
  },

  'membro inferior esqueleto': {
    description: `
CINTURA PÉLVICA:
- Osso do quadril (3 fundidos): ílio, ísquio, púbis
  * Acetábulo: cavidade para cabeça do fêmur
  * Forame obturado: maior forame do corpo
- Sacro: posterior, entre os ossos do quadril
- Sínfise púbica: articulação anterior

COXA:
- Fêmur: maior osso do corpo
  * Cabeça: esférica, fóvea para ligamento
  * Colo: conecta cabeça à diáfise (ângulo ~125°)
  * Trocânteres maior e menor
  * Diáfise com linha áspera posterior
  * Côndilos medial e lateral (joelho)
  * Epicôndilos
  * Fossa intercondilar posterior

JOELHO:
- Patela: maior osso sesamoide, no tendão do quadríceps

PERNA:
- Tíbia: medial, suporta peso
  * Platô tibial com côndilos
  * Tuberosidade tibial: inserção do ligamento patelar
  * Maléolo medial: proeminência no tornozelo
- Fíbula: lateral, não suporta peso
  * Cabeça: proximal
  * Maléolo lateral: tornozelo

PÉ:
- Tarso (7): tálus, calcâneo, navicular, cubóide, cuneiformes (3)
- Metatarsos (5): I a V
- Falanges: 2 no hálux, 3 nos demais
- Arcos: longitudinais (medial e lateral), transverso
    `,
    keyStructures: ['osso do quadril com acetábulo', 'fêmur na coxa', 'patela no joelho', 'tíbia (medial) e fíbula (lateral) na perna', 'ossos do tarso', 'metatarsos I-V', 'falanges'],
    correctView: 'Pelve → Fêmur → Patela+Tíbia+Fíbula → Tarso → Metatarsos → Falanges | Tíbia medial, Fíbula lateral',
    commonMistakes: ['NÃO inverter tíbia e fíbula. Tíbia é MEDIAL e suporta peso. NÃO esquecer os maléolos.']
  },

  // ========================================
  // HISTOLOGIA GERAL
  // ========================================

  'tecido epitelial': {
    description: `
Tecido de revestimento e glandular. Células justapostas, pouca matriz extracelular.

CLASSIFICAÇÃO POR CAMADAS:
- Simples: uma camada de células
- Estratificado: múltiplas camadas
- Pseudoestratificado: parece estratificado, mas todos tocam a membrana basal

CLASSIFICAÇÃO POR FORMA (camada superficial):
- Pavimentoso: células achatadas, núcleo central achatado
- Cúbico: células quadradas, núcleo central esférico
- Colunar/Cilíndrico: células altas, núcleo oval basal
- De transição (urotélio): células em cúpula que mudam de forma

TIPOS COMUNS E LOCALIZAÇÃO:
- Simples pavimentoso: endotélio, alvéolos
- Simples cúbico: túbulos renais, ductos glandulares
- Simples colunar: estômago, intestino (com microvilosidades)
- Pseudoestratificado colunar ciliado: vias aéreas
- Estratificado pavimentoso não queratinizado: esôfago, vagina
- Estratificado pavimentoso queratinizado: pele (epiderme)
- Transição (urotélio): bexiga, ureteres

ESPECIALIZAÇÕES:
- Microvilosidades: aumentam absorção
- Cílios: movimentam muco/partículas
- Estereocílios: epidídimo (longos, imóveis)
- Queratina: proteção mecânica
    `,
    keyStructures: ['membrana basal', 'células com formas características', 'núcleos em posições típicas', 'especializações apicais quando presentes'],
    correctView: 'Células apoiadas na membrana basal | Simples: 1 camada | Estratificado: várias camadas | Núcleos basais em células colunares',
    commonMistakes: ['NÃO confundir pseudoestratificado com estratificado verdadeiro. NÃO esquecer a membrana basal.']
  },

  'tecido conjuntivo': {
    description: `
Tecido de suporte e preenchimento. Células separadas por matriz extracelular abundante.

COMPONENTES:
- CÉLULAS:
  * Fibroblastos: produzem fibras e matriz
  * Macrófagos: fagocitose
  * Mastócitos: histamina, heparina (grânulos metacromáticos)
  * Plasmócitos: anticorpos
  * Adipócitos: armazenam gordura

- FIBRAS:
  * Colágenas: grossas, rosa em H&E, resistentes à tração
  * Elásticas: finas, ramificadas, amarelas (coloração especial)
  * Reticulares: finas, formam redes, coram com prata

- SUBSTÂNCIA FUNDAMENTAL: gel de proteoglicanos e glicoproteínas

TIPOS:
- Frouxo (areolar): muita substância fundamental, pouca fibra
- Denso não modelado: fibras em várias direções (derme)
- Denso modelado: fibras paralelas (tendões, ligamentos)
- Adiposo: unilocular (branco) ou multilocular (marrom)
- Reticular: arcabouço de órgãos hematopoiéticos
- Cartilaginoso: hialino, elástico, fibroso
- Ósseo: compacto e esponjoso
    `,
    keyStructures: ['fibroblastos fusiformes', 'fibras colágenas rosa', 'matriz extracelular', 'outros tipos celulares quando presentes'],
    correctView: 'Células dispersas na matriz | Fibras orientadas conforme tipo | Substância fundamental entre elementos',
    commonMistakes: ['NÃO confundir tecido frouxo com denso. NÃO esquecer a matriz extracelular.']
  },

  'tecido muscular': {
    description: `
Tecido especializado em contração.

MÚSCULO ESTRIADO ESQUELÉTICO:
- Células: fibras muito longas, multinucleadas, cilíndricas
- Núcleos: periféricos, múltiplos
- Estriações: bandas A (escuras), I (claras), Z (linhas)
- Controle: voluntário
- Localização: músculos do esqueleto

MÚSCULO ESTRIADO CARDÍACO:
- Células: fibras ramificadas, 1-2 núcleos centrais
- Discos intercalares: junções especializadas entre células
- Estriações: presentes, similares ao esquelético
- Controle: involuntário
- Localização: coração

MÚSCULO LISO:
- Células: fusiformes, um núcleo central alongado
- Estriações: AUSENTES
- Controle: involuntário
- Localização: vísceras, vasos, útero

SARCÔMERO (unidade contrátil):
- Linha Z a linha Z
- Filamentos finos (actina): da linha Z
- Filamentos grossos (miosina): banda A central
- Banda H: só miosina
- Linha M: centro da banda A
    `,
    keyStructures: ['fibras com estriações (esquelético e cardíaco)', 'núcleos periféricos (esquelético) ou centrais (cardíaco, liso)', 'discos intercalares (cardíaco)', 'células fusiformes sem estriação (liso)'],
    correctView: 'Esquelético: fibras paralelas longas | Cardíaco: fibras ramificadas com discos intercalares | Liso: células fusiformes em feixes',
    commonMistakes: ['NÃO colocar núcleos centrais no músculo esquelético (são periféricos). NÃO colocar estriações no músculo liso.']
  },

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

  'tecido nervoso': {
    description: `
Tecido especializado em comunicação elétrica.

NEURÔNIOS:
- Corpo celular (soma/pericário):
  * Núcleo grande, nucléolo evidente
  * Corpúsculos de Nissl: RER (basofílico)
- Dendritos: prolongamentos receptores, múltiplos, ramificados
- Axônio: prolongamento efetor, único, pode ser mielinizado

CLASSIFICAÇÃO DOS NEURÔNIOS:
- Multipolar: vários dendritos, 1 axônio (mais comum)
- Bipolar: 1 dendrito, 1 axônio (retina, ouvido interno)
- Pseudounipolar: prolongamento único que se bifurca (gânglios sensitivos)

CÉLULAS DA GLIA (neuróglia):
- SNC:
  * Astrócitos: suporte, barreira hematoencefálica
  * Oligodendrócitos: mielina do SNC
  * Micróglia: macrófagos residentes
  * Células ependimárias: revestem ventrículos
- SNP:
  * Células de Schwann: mielina do SNP
  * Células satélites: suporte nos gânglios

MIELINA:
- Bainha isolante que acelera condução
- Nódulos de Ranvier: interrupções na bainha
    `,
    keyStructures: ['corpo celular com núcleo grande', 'corpúsculos de Nissl (basofílicos)', 'dendritos múltiplos', 'axônio único', 'células da glia menores'],
    correctView: 'Corpo celular → Dendritos (aferentes) | Corpo celular → Axônio (eferente)',
    commonMistakes: ['NÃO esquecer os corpúsculos de Nissl. NÃO confundir neurônios com células da glia (glia é menor e mais numerosa).']
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
  },

  // ========================================
  // SISTEMAS ADICIONAIS - OLHO E OUVIDO
  // ========================================

  'olho': {
    description: `
TÚNICAS (camadas da parede):

FIBROSA (externa):
- Esclera: branca, posterior 5/6, proteção
- Córnea: transparente, anterior 1/6, refração

VASCULAR/ÚVEA (média):
- Coroide: vascularizada, nutrição
- Corpo ciliar: músculo ciliar + processos ciliares
  * Produz humor aquoso
  * Acomodação do cristalino
- Íris: anterior, colorida, com pupila central
  * Músculo esfíncter: miose (parassimpático)
  * Músculo dilatador: midríase (simpático)

NERVOSA (interna):
- Retina: 10 camadas, fotorreceptores
  * Cones: visão colorida, mácula
  * Bastonetes: visão noturna, periferia
  * Fóvea: centro da mácula, só cones
  * Disco óptico: saída do nervo óptico (ponto cego)

MEIOS REFRATIVOS:
- Córnea: maior poder de refração (fixo)
- Humor aquoso: entre córnea e cristalino
- Cristalino: lente biconvexa, acomodação (variável)
- Humor vítreo: posterior ao cristalino, mantém forma

CÂMARAS:
- Anterior: entre córnea e íris
- Posterior: entre íris e cristalino
- Vítrea: posterior ao cristalino
    `,
    keyStructures: ['esclera e córnea (túnica fibrosa)', 'coroide corpo ciliar e íris (úvea)', 'retina com disco óptico e fóvea', 'cristalino', 'câmaras anterior e posterior', 'humor vítreo'],
    correctView: 'Córnea anterior → Íris com pupila → Cristalino → Vítreo → Retina → Esclera | Disco óptico nasal, Fóvea temporal',
    commonMistakes: ['NÃO confundir câmara anterior com posterior. NÃO esquecer o corpo ciliar.']
  },

  'ouvido': {
    description: `
OUVIDO EXTERNO:
- Pavilhão auricular (orelha): cartilagem elástica
- Meato acústico externo: ~2.5cm até tímpano
- Membrana timpânica: separa externo do médio

OUVIDO MÉDIO:
- Cavidade timpânica: no osso temporal
- Ossículos (3): martelo → bigorna → estribo
  * Martelo: fixo ao tímpano
  * Estribo: fixo à janela oval
- Tuba auditiva (Eustáquio): comunica com nasofaringe
- Janela oval: recebe base do estribo
- Janela redonda: membranosa, alivia pressão

OUVIDO INTERNO (labirinto):
- Labirinto ósseo (cheio de perilinfa):
  * Vestíbulo: contém utrículo e sáculo
  * Canais semicirculares (3): perpendiculares entre si
  * Cóclea: 2.5 voltas em espiral
- Labirinto membranoso (cheio de endolinfa):
  * Ducto coclear: contém órgão de Corti (audição)
  * Utrículo e sáculo: equilíbrio estático (máculas)
  * Ductos semicirculares: equilíbrio dinâmico (cristas ampulares)

CÓCLEA (corte transversal):
- Escala vestibular: superior, perilinfa
- Ducto coclear: médio, endolinfa, órgão de Corti
- Escala timpânica: inferior, perilinfa
    `,
    keyStructures: ['pavilhão auricular e meato externo', 'membrana timpânica', 'ossículos (martelo bigorna estribo)', 'cóclea em espiral', 'canais semicirculares perpendiculares', 'vestíbulo'],
    correctView: 'Externo (pavilhão → meato) → Médio (tímpano → ossículos → janelas) → Interno (vestíbulo + canais + cóclea)',
    commonMistakes: ['NÃO esquecer os 3 canais semicirculares em planos perpendiculares. NÃO simplificar a espiral da cóclea.']
  },

  'pele': {
    description: `
EPIDERME (epitélio estratificado pavimentoso queratinizado):
- Estrato basal/germinativo: células-tronco, mitoses
- Estrato espinhoso: queratinócitos unidos por desmossomos
- Estrato granuloso: grânulos de querato-hialina
- Estrato lúcido: só em pele espessa (palmas, plantas)
- Estrato córneo: células mortas cheias de queratina

Células especiais:
- Melanócitos: produzem melanina, no estrato basal
- Células de Langerhans: apresentação de antígeno, no espinhoso
- Células de Merkel: mecanorreceptores, no basal

DERME (tecido conjuntivo):
- Papilar: superficial, tecido frouxo, papilas dérmicas
- Reticular: profunda, tecido denso não modelado

Anexos:
- Folículos pilosos: invaginações epidérmicas
- Glândulas sebáceas: holocrinas, associadas aos folículos
- Glândulas sudoríparas écrinas: merócrinas, toda pele
- Glândulas sudoríparas apócrinas: axila, genitais

HIPODERME (não é parte da pele):
- Tecido adiposo
- Fáscia superficial
    `,
    keyStructures: ['estratos da epiderme (basal espinhoso granuloso córneo)', 'derme papilar e reticular', 'folículos pilosos', 'glândulas sebáceas', 'glândulas sudoríparas'],
    correctView: 'Epiderme (estratos em ordem) → Derme (papilar depois reticular) → Hipoderme',
    commonMistakes: ['NÃO colocar estrato lúcido em pele fina. NÃO esquecer que glândulas sebáceas se abrem no folículo piloso.']
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
 * IMPORTANTE: URLs do DALL-E expiram em ~1 hora
 *
 * Timeout reduzido para 15s para não bloquear muito o fluxo do chat
 */
async function convertImageToBase64(imageUrl: string): Promise<string> {
  if (DEBUG_IMAGE_GENERATION) {
    console.log('[GPT Image] Iniciando conversão para base64...')
    console.log('[GPT Image] URL da imagem:', imageUrl.substring(0, 100) + '...')
  }

  try {
    // Adicionar timeout curto para não bloquear o chat
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout (reduzido)

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PREPARAMED/1.0)'
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Falha ao baixar imagem: HTTP ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()

    if (DEBUG_IMAGE_GENERATION) {
      console.log('[GPT Image] Imagem baixada, tamanho:', arrayBuffer.byteLength, 'bytes')
    }

    if (arrayBuffer.byteLength === 0) {
      throw new Error('Imagem baixada está vazia')
    }

    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const mimeType = response.headers.get('content-type') || 'image/png'
    const dataUrl = `data:${mimeType};base64,${base64}`

    if (DEBUG_IMAGE_GENERATION) {
      console.log('[GPT Image] Conversão concluída! Base64 length:', base64.length)
    }

    return dataUrl
  } catch (error) {
    console.error('[GPT Image] Erro ao converter para base64:', error)
    // Re-throw com mensagem mais clara
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout ao baixar imagem do DALL-E (15s)')
      }
      throw error
    }
    throw new Error('Erro desconhecido na conversão para base64')
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

  if (DEBUG_IMAGE_GENERATION) {
    console.log('[GPT Image] ============================================')
    console.log('[GPT Image] INICIANDO GERAÇÃO DE IMAGEM MÉDICA')
    console.log('[GPT Image] Model:', model)
    console.log('[GPT Image] Quality:', quality)
    console.log('[GPT Image] Size:', size)
    console.log('[GPT Image] ============================================')
  }

  // Verificar se a API key está configurada
  if (!process.env.OPENAI_API_KEY) {
    console.error('[GPT Image] ERRO CRÍTICO: OPENAI_API_KEY não está configurada!')
    throw new GPTImageError('Chave da API OpenAI não configurada', 'NO_API_KEY', 500)
  }

  // Extrair estrutura do prompt para buscar conhecimento anatômico
  const structureMatch = prompt.match(/(?:estrutura|tecido|órgão|sistema)[:\s]+([^\n]+)/i)
    || prompt.match(/Estrutura anatômica:\s*([^\n]+)/i)
    || prompt.match(/Tecido\/Estrutura:\s*([^\n]+)/i)
    || prompt.match(/^([^\n]{10,100})/i)
  const structure = structureMatch ? structureMatch[1].trim() : prompt.substring(0, 100)

  // Buscar conhecimento anatômico específico
  const anatomicalKnowledge = getAnatomicalKnowledge(structure)

  if (DEBUG_IMAGE_GENERATION) {
    console.log('[GPT Image] Estrutura detectada:', structure.substring(0, 50))
    console.log('[GPT Image] Conhecimento anatômico:', anatomicalKnowledge ? 'ENCONTRADO' : 'não encontrado')
  }

  // Instruções de qualidade (compactas para economizar caracteres)
  const qualityInstructions = `
ESTILO: Ilustração médica profissional tipo Atlas Netter/Sobotta. Cores anatômicas corretas (artérias=vermelho, veias=azul, nervos=amarelo). Fundo neutro.
PROIBIDO: Texto, legendas, números, letras, setas com texto, watermarks. Anatomia 100% correta.`

  // Construir prompt base (limitar para caber no limite de 4000 chars do DALL-E)
  // Prioridade: prompt original > conhecimento anatômico resumido > instruções
  const MAX_PROMPT_LENGTH = 3800 // Margem de segurança

  let enhancedPrompt = prompt

  // Adicionar conhecimento anatômico se couber (versão resumida)
  if (anatomicalKnowledge) {
    // Extrair apenas as partes mais importantes do conhecimento
    const knowledgeLines = anatomicalKnowledge.split('\n').filter(line => line.trim())
    const keyStructuresLine = knowledgeLines.find(l => l.includes('ESTRUTURAS QUE DEVEM APARECER'))
    const mistakesLine = knowledgeLines.find(l => l.includes('ERROS COMUNS'))

    let compactKnowledge = ''
    if (keyStructuresLine) {
      compactKnowledge += keyStructuresLine.substring(0, 500) + '\n'
    }
    if (mistakesLine) {
      compactKnowledge += mistakesLine.substring(0, 300)
    }

    if (enhancedPrompt.length + compactKnowledge.length + qualityInstructions.length < MAX_PROMPT_LENGTH) {
      enhancedPrompt += '\n\n' + compactKnowledge
    }
  }

  // Adicionar instruções de qualidade se couber
  if (enhancedPrompt.length + qualityInstructions.length < MAX_PROMPT_LENGTH) {
    enhancedPrompt += '\n' + qualityInstructions
  }

  // Garantir que não exceda o limite
  if (enhancedPrompt.length > MAX_PROMPT_LENGTH) {
    enhancedPrompt = enhancedPrompt.substring(0, MAX_PROMPT_LENGTH)
    console.log('[GPT Image] Prompt truncado para', MAX_PROMPT_LENGTH, 'caracteres')
  }

  console.log('[GPT Image] Tamanho final do prompt:', enhancedPrompt.length, 'caracteres')

  try {
    console.log('[GPT Image] Chamando API OpenAI DALL-E 3...')

    const response = await openai.images.generate({
      model,
      prompt: enhancedPrompt,
      size,
      quality: 'hd',
      style: 'natural',
      n,
    })

    if (DEBUG_IMAGE_GENERATION) {
      console.log('[GPT Image] Resposta da API recebida!')
      console.log('[GPT Image] Data length:', response.data?.length || 0)
    }

    if (!response.data || response.data.length === 0) {
      throw new GPTImageError('Nenhuma imagem foi gerada pela API')
    }

    const imageData = response.data[0]
    const temporaryUrl = imageData.url

    if (!temporaryUrl) {
      throw new GPTImageError('URL da imagem não retornada pela API')
    }

    console.log('[GPT Image] URL temporária recebida:', temporaryUrl.substring(0, 80) + '...')
    console.log('[GPT Image] Convertendo para base64 permanente...')

    // IMPORTANTE: Converter para base64 para armazenamento permanente
    // URLs do DALL-E expiram em ~1 hora
    let permanentUrl = temporaryUrl
    let conversionFailed = false

    try {
      permanentUrl = await convertImageToBase64(temporaryUrl)
      console.log('[GPT Image] ✅ Convertido para base64 com sucesso!')
    } catch (conversionError) {
      console.error('[GPT Image] ⚠️ Falha na conversão base64:', conversionError)
      console.log('[GPT Image] Usando URL temporária como fallback (expira em ~1 hora)')
      conversionFailed = true
      // Mantém temporaryUrl como fallback
    }

    const result: GeneratedImage = {
      url: permanentUrl,
      base64: permanentUrl?.startsWith('data:') ? permanentUrl : undefined,
      revisedPrompt: imageData.revised_prompt || prompt,
      estimatedCost: COSTS['high'][size] * n,
    }

    if (DEBUG_IMAGE_GENERATION) {
      console.log('[GPT Image] ============================================')
      console.log('[GPT Image] GERAÇÃO CONCLUÍDA COM SUCESSO!')
      console.log('[GPT Image] URL type:', permanentUrl?.startsWith('data:') ? 'base64' : 'URL temporária')
      console.log('[GPT Image] Conversion failed:', conversionFailed)
      console.log('[GPT Image] Custo estimado: $', result.estimatedCost)
      console.log('[GPT Image] ============================================')
    }

    return result
  } catch (error: unknown) {
    console.error('[GPT Image] ============================================')
    console.error('[GPT Image] ERRO NA GERAÇÃO DE IMAGEM')
    console.error('[GPT Image] Error:', error)
    console.error('[GPT Image] ============================================')

    // Tratamento específico de erros da OpenAI
    if (error instanceof OpenAI.APIError) {
      console.error('[GPT Image] OpenAI API Error - Status:', error.status)
      console.error('[GPT Image] OpenAI API Error - Message:', error.message)
      console.error('[GPT Image] OpenAI API Error - Code:', error.code)

      if (error.status === 400) {
        // Verificar se é erro de prompt muito longo
        if (error.code === 'string_above_max_length' || error.message?.includes('too long')) {
          throw new GPTImageError(
            'Prompt muito longo. Tente uma descrição mais curta.',
            'PROMPT_TOO_LONG',
            400
          )
        }
        throw new GPTImageError(
          'Prompt rejeitado pela API (pode conter conteúdo não permitido)',
          error.code || 'CONTENT_POLICY',
          400
        )
      }
      if (error.status === 401) {
        throw new GPTImageError('Chave da API OpenAI inválida', 'INVALID_API_KEY', 401)
      }
      if (error.status === 429) {
        throw new GPTImageError('Limite de requisições excedido, tente novamente em alguns segundos', 'RATE_LIMIT', 429)
      }
      if (error.status === 500 || error.status === 503) {
        throw new GPTImageError('Serviço da OpenAI temporariamente indisponível', 'SERVICE_UNAVAILABLE', error.status)
      }

      throw new GPTImageError(error.message, error.code || 'OPENAI_ERROR', error.status)
    }

    // Erro genérico
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
 * Gera um prompt COMPACTO para imagens médicas
 * Limite do DALL-E 3: 4000 caracteres
 * Mantemos prompts com ~1500-2000 chars para deixar margem
 */
export function buildMedicalImagePrompt(params: MedicalImagePromptParams): string {
  const { structure, type, view, additionalDetails } = params

  // Buscar apenas estruturas-chave e erros a evitar (versão compacta)
  const knowledge = getAnatomicalKnowledge(structure)
  let keyInfo = ''
  if (knowledge) {
    const lines = knowledge.split('\n')
    const structuresLine = lines.find(l => l.includes('ESTRUTURAS QUE DEVEM APARECER'))
    const mistakesLine = lines.find(l => l.includes('ERROS COMUNS'))
    if (structuresLine) keyInfo += structuresLine.substring(0, 300) + '\n'
    if (mistakesLine) keyInfo += mistakesLine.substring(0, 200)
  }

  // IMPORTANTE: Reforçar múltiplas vezes a proibição de texto para DALL-E respeitar
  const noTextRules = `REGRA ABSOLUTA: A imagem NÃO PODE conter NENHUM texto, letra, número, palavra, legenda, rótulo, anotação, seta com texto, watermark ou qualquer forma de escrita. A imagem deve ser PURAMENTE VISUAL, como uma fotografia real ou ilustração de atlas médico SEM legendas. Se incluir qualquer texto, a imagem será rejeitada.`

  const templates: Record<string, string> = {
    anatomy: `Fotografia hiper-realista de alta resolução mostrando: ${structure}
${view ? `Vista: ${view}` : 'Vista anterior'}
${keyInfo}
Qualidade: Como fotografia de atlas anatômico real (Netter, Sobotta, Gray's Anatomy). FOTORREALISMO EXTREMO - deve parecer uma fotografia real de dissecção ou modelo anatômico 3D de alta fidelidade. Cores anatômicas precisas e realistas. Iluminação de estúdio profissional, fundo preto ou gradiente neutro escuro.
${additionalDetails ? additionalDetails.substring(0, 150) : ''}
${noTextRules}`.trim(),

    histology: `Fotomicrografia histológica REAL de ${structure}
Coloração H&E padrão, aumento 400x, microscopia óptica de alta qualidade.
${keyInfo}
Qualidade: Deve parecer uma foto REAL tirada de microscópio óptico. Núcleos em roxo/azul escuro (hematoxilina), citoplasma em rosa/eosinófilo (eosina). Foco cristalino, iluminação Köhler perfeita, como em livro de histologia (Junqueira, Ross).
${additionalDetails ? additionalDetails.substring(0, 150) : ''}
${noTextRules}`.trim(),

    radiology: `Imagem radiológica diagnóstica real: ${structure}
${view || 'Radiografia PA'}
${keyInfo}
Qualidade: Deve parecer um exame de imagem REAL. Escala de cinza com contraste diagnóstico ideal. Ossos=branco brilhante, ar=preto, partes moles=tons de cinza. Qualidade de radiografia digital moderna.
${additionalDetails ? additionalDetails.substring(0, 150) : ''}
${noTextRules}`.trim(),

    pathology: `Fotografia macroscópica de peça anatômica real: ${structure}
${view || 'Vista macroscópica'}
${keyInfo}
Qualidade: Fotografia profissional de patologia como em Robbins ou atlas de patologia. Cores naturais realistas do tecido, iluminação de estúdio, fundo neutro (azul cirúrgico ou preto).
${additionalDetails ? additionalDetails.substring(0, 150) : ''}
${noTextRules}`.trim(),

    diagram: `Ilustração médica educacional de alta qualidade: ${structure}
${keyInfo}
Qualidade: Estilo de ilustração científica moderna, cores vibrantes mas anatomicamente precisas. Design clean e profissional como em livros médicos contemporâneos. Pode usar setas simples para indicar fluxo, mas SEM NENHUM TEXTO nas setas.
${additionalDetails ? additionalDetails.substring(0, 150) : ''}
${noTextRules}`.trim()
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

/**
 * Gera prompt para imagem de questão educacional
 *
 * @param structure - Estrutura/região anatômica da questão
 * @param imageType - Tipo de imagem (anatomy, histology, radiology)
 * @param alternatives - Array com as 4-5 alternativas
 * @param correctAnswer - Resposta correta (para garantir que NÃO seja destacada)
 * @param questionContext - Contexto adicional da questão
 */
function buildQuestionImagePrompt(
  structure: string,
  imageType: 'anatomy' | 'histology' | 'radiology',
  alternatives: string[],
  correctAnswer: string,
  questionContext?: string
): string {

  // Buscar conhecimento anatômico na versão compacta
  const normalizedStructure = structure.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  let knowledge: typeof ANATOMICAL_KNOWLEDGE_COMPACT[string] | undefined
  for (const [key, value] of Object.entries(ANATOMICAL_KNOWLEDGE_COMPACT)) {
    const normalizedKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (normalizedStructure.includes(normalizedKey) || normalizedKey.includes(normalizedStructure)) {
      knowledge = value
      break
    }
  }

  const anatomySection = knowledge
    ? `
ANATOMIA DE REFERÊNCIA (para precisão, NÃO para destaque):
${knowledge.anatomy}

TODAS estas estruturas devem aparecer COM IGUAL VISIBILIDADE:
${knowledge.mustShow.join(', ')}

⚠️ ERROS A EVITAR: ${knowledge.avoid}
`
    : ''

  // Templates por tipo
  const baseTemplates: Record<string, string> = {

    anatomy: `
ILUSTRAÇÃO ANATÔMICA PARA QUESTÃO DE PROVA

Região/Estrutura: ${structure}
${questionContext ? `Contexto: ${questionContext}` : ''}

${anatomySection}

=== ESTILO VISUAL ===
- Estilo atlas médico profissional (Netter/Sobotta)
- Cores anatômicas padronizadas e UNIFORMES
- Iluminação HOMOGÊNEA em toda a imagem
- Todas as estruturas com MESMO nível de detalhamento
- Fundo neutro (branco ou cinza claro)

=== CORES PADRÃO (aplicar UNIFORMEMENTE) ===
- Artérias: vermelho
- Veias: azul
- Nervos: amarelo
- Músculos: vermelho-rosado
- Ossos: bege/marfim
- Órgãos: tons naturais sem destaque

`,

    histology: `
FOTOMICROGRAFIA HISTOLÓGICA PARA QUESTÃO DE PROVA

Tecido/Estrutura: ${structure}
Coloração: H&E (Hematoxilina e Eosina)
Aumento: adequado para visualizar todas as estruturas relevantes

${anatomySection}

=== CARACTERÍSTICAS TÉCNICAS ===
- Coloração H&E padrão (núcleos roxos, citoplasma rosa)
- Campo microscópico COMPLETO mostrando contexto
- Foco UNIFORME em todo o campo
- TODAS as estruturas celulares com mesma nitidez
- Sem áreas destacadas ou em evidência

`,

    radiology: `
IMAGEM RADIOLÓGICA PARA QUESTÃO DE PROVA

Região: ${structure}
Modalidade: Radiografia convencional / TC / RM (conforme mais adequado)

${anatomySection}

=== CARACTERÍSTICAS TÉCNICAS ===
- Contraste UNIFORME em toda a imagem
- Densidade/intensidade padrão para cada tecido
- Sem realce ou destaque em estruturas específicas
- Qualidade diagnóstica padrão

`
  }

  // Seção de SEGURANÇA (anti-spoiler)
  const securitySection = `
=== 🔒 INSTRUÇÕES DE SEGURANÇA - QUESTÃO EDUCACIONAL ===

⚠️ REGRA PRINCIPAL: Esta imagem será usada em PROVA.
A imagem NÃO PODE revelar ou sugerir a resposta correta.

ALTERNATIVAS DA QUESTÃO (TODAS devem ter IGUAL visibilidade):
${alternatives.map((alt, i) => `${String.fromCharCode(65 + i)}) ${alt}`).join('\n')}

🚫 PROIBIÇÕES ABSOLUTAS:

1. DESTAQUE VISUAL:
   - NÃO usar cor diferente para nenhuma estrutura específica
   - NÃO usar brilho, sombra ou efeito em uma estrutura
   - NÃO usar linhas mais grossas ou finas para diferenciar
   - NÃO posicionar uma estrutura mais centralizada que outras

2. INDICADORES:
   - NÃO usar setas, círculos ou marcadores
   - NÃO usar numeração ou letras
   - NÃO usar qualquer forma de anotação
   - NÃO usar zoom ou ampliação em área específica

3. COMPOSIÇÃO:
   - NÃO enquadrar favorecendo uma estrutura
   - NÃO usar iluminação direcionada
   - NÃO criar contraste artificial
   - NÃO omitir estruturas para facilitar identificação

✅ REQUISITOS OBRIGATÓRIOS:

1. EQUILÍBRIO VISUAL:
   - TODAS as alternativas visíveis com IGUAL clareza
   - Composição CENTRALIZADA mostrando contexto completo
   - Iluminação DIFUSA e homogênea
   - Mesmo nível de detalhe para todas as estruturas

2. NEUTRALIDADE:
   - Imagem deve parecer de ATLAS ou LIVRO-TEXTO
   - Sem ênfase editorial ou didática direcionada
   - Estudante deve usar CONHECIMENTO PRÉVIO para responder

=== ⚠️ VERIFICAÇÃO FINAL ===
A resposta correta é: "${correctAnswer}"
Esta estrutura NÃO pode ter destaque visual diferente das outras.

`

  // Instruções finais
  const finalInstructions = `
=== RESULTADO ESPERADO ===
✓ Anatomicamente CORRETA
✓ Visualmente NEUTRA (sem favorecer nenhuma alternativa)
✓ Educacionalmente JUSTA (requer conhecimento para responder)
✓ Tecnicamente PROFISSIONAL (qualidade de atlas médico)

PROIBIDO ABSOLUTAMENTE:
✗ Qualquer texto, legenda, número ou letra
✗ Qualquer indicador visual da resposta correta
`

  // Montar prompt final
  let prompt = baseTemplates[imageType] || baseTemplates.anatomy
  prompt += securitySection
  prompt += finalInstructions

  // Verificar tamanho (limite DALL-E 3: 4000 chars)
  if (prompt.length > 3800) {
    // Versão compacta se exceder
    prompt = buildQuestionImagePromptCompact(
      structure,
      imageType,
      alternatives,
      correctAnswer
    )
  }

  return prompt.trim()
}

/**
 * Versão COMPACTA do prompt de questões (< 4000 chars)
 */
function buildQuestionImagePromptCompact(
  structure: string,
  imageType: string,
  alternatives: string[],
  correctAnswer: string
): string {

  const normalizedStructure = structure.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  let knowledge: typeof ANATOMICAL_KNOWLEDGE_COMPACT[string] | undefined
  for (const [key, value] of Object.entries(ANATOMICAL_KNOWLEDGE_COMPACT)) {
    const normalizedKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (normalizedStructure.includes(normalizedKey) || normalizedKey.includes(normalizedStructure)) {
      knowledge = value
      break
    }
  }

  const anatomyRef = knowledge?.anatomy?.substring(0, 300) || ''

  return `
IMAGEM PARA QUESTÃO DE PROVA - ${structure.toUpperCase()}
Tipo: ${imageType}

${anatomyRef ? `ANATOMIA: ${anatomyRef}` : ''}

=== REGRAS DE SEGURANÇA (OBRIGATÓRIO) ===

Esta é uma QUESTÃO DE PROVA. A imagem NÃO pode revelar a resposta.

ALTERNATIVAS (todas com IGUAL visibilidade):
${alternatives.map((alt, i) => `${String.fromCharCode(65 + i)}) ${alt}`).join('\n')}

🚫 PROIBIDO:
- Destacar, colorir diferente ou enfatizar qualquer estrutura
- Usar setas, marcadores, zoom ou enquadramento favorecendo algo
- Qualquer texto, legenda, número ou letra

✅ OBRIGATÓRIO:
- TODAS as estruturas com MESMO destaque visual
- Iluminação e cores UNIFORMES
- Composição NEUTRA mostrando contexto completo
- Estilo de atlas médico profissional

⚠️ VERIFICAÇÃO: "${correctAnswer}" NÃO pode ter destaque visual.

Resultado: Imagem anatomicamente correta + visualmente neutra + sem spoiler.
  `.trim()
}

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
    quality = 'medium',
    size = '1024x1024',
    alternativas = [],
    respostaCorreta = '',
  } = request

  // Mapear tipo de imagem para os tipos suportados pelo novo prompt
  const tipoMapeado: 'anatomy' | 'histology' | 'radiology' =
    tipoImagem === 'pathology' || tipoImagem === 'diagram'
      ? 'anatomy'
      : tipoImagem as 'anatomy' | 'histology' | 'radiology'

  // Usar a nova função de prompt para questões (com anti-spoiler)
  const promptSeguro = buildQuestionImagePrompt(
    estruturaVisual,
    tipoMapeado,
    alternativas,
    respostaCorreta,
    `Questão de ${disciplina} sobre ${assunto}`
  )

  console.log('[GPT Image] Gerando imagem SEGURA para questão...')
  console.log('[GPT Image] Estrutura:', estruturaVisual)
  console.log('[GPT Image] Tipo:', tipoImagem)
  console.log('[GPT Image] Alternativas:', alternativas.length)
  console.log('[GPT Image] Prompt length:', promptSeguro.length, 'chars')

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
