/**
 * Base de Conhecimento Medico
 *
 * Contem conhecimento medico estruturado para melhorar
 * as respostas da IA em topicos especificos de medicina.
 *
 * MELHORIA: Adiciona contexto medico especializado
 */

// Sistemas do corpo humano com informacoes estruturadas
export const MEDICAL_KNOWLEDGE = {
  'sistema_digestorio': {
    nome: 'Sistema Digestorio',
    aliases: ['sistema digestivo', 'aparelho digestivo', 'trato gastrointestinal', 'TGI'],
    orgaos: ['boca', 'esofago', 'estomago', 'intestino delgado', 'intestino grosso', 'figado', 'pancreas', 'vesicula biliar'],
    funcoes: ['digestao', 'absorcao de nutrientes', 'eliminacao de residuos'],
    patologias_comuns: [
      'DRGE (Doenca do Refluxo Gastroesofagico)',
      'Ulcera peptica',
      'Doenca celiaca',
      'Doenca inflamatoria intestinal',
      'Sindrome do intestino irritavel',
      'Cancer colorretal',
      'Hepatite',
      'Cirrose',
      'Pancreatite'
    ],
    exames: ['Endoscopia', 'Colonoscopia', 'Ultrassom abdominal', 'Tomografia', 'Exames laboratoriais (TGO, TGP, bilirrubinas)'],
    keywords: ['digestao', 'estomago', 'intestino', 'figado', 'pancreas', 'vesicula', 'esofago', 'gastrite', 'ulcera', 'refluxo']
  },

  'sistema_cardiovascular': {
    nome: 'Sistema Cardiovascular',
    aliases: ['sistema circulatorio', 'aparelho cardiovascular'],
    orgaos: ['coracao', 'arterias', 'veias', 'capilares'],
    funcoes: ['circulacao sanguinea', 'transporte de oxigenio', 'transporte de nutrientes'],
    patologias_comuns: [
      'Infarto agudo do miocardio',
      'Insuficiencia cardiaca',
      'Hipertensao arterial',
      'Arritmias cardiacas',
      'Doenca arterial coronariana',
      'Valvopatias',
      'Cardiomiopatias',
      'Endocardite'
    ],
    exames: ['ECG', 'Ecocardiograma', 'Cateterismo', 'Teste ergometrico', 'Holter', 'MAPA'],
    keywords: ['coracao', 'cardiaco', 'infarto', 'arritmia', 'pressao', 'hipertensao', 'coronaria', 'valva']
  },

  'sistema_respiratorio': {
    nome: 'Sistema Respiratorio',
    aliases: ['aparelho respiratorio', 'vias aereas'],
    orgaos: ['nariz', 'faringe', 'laringe', 'traqueia', 'bronquios', 'pulmoes', 'alveolos'],
    funcoes: ['ventilacao', 'troca gasosa', 'regulacao do pH'],
    patologias_comuns: [
      'Pneumonia',
      'Asma',
      'DPOC',
      'Tuberculose',
      'Cancer de pulmao',
      'Embolia pulmonar',
      'Fibrose pulmonar',
      'COVID-19'
    ],
    exames: ['Raio-X de torax', 'Tomografia de torax', 'Espirometria', 'Gasometria arterial', 'Broncoscopia'],
    keywords: ['pulmao', 'respiracao', 'pneumonia', 'asma', 'DPOC', 'tosse', 'dispneia', 'bronquio']
  },

  'sistema_nervoso': {
    nome: 'Sistema Nervoso',
    aliases: ['sistema neural', 'SNC', 'SNP'],
    orgaos: ['cerebro', 'cerebelo', 'tronco encefalico', 'medula espinhal', 'nervos perifericos'],
    funcoes: ['controle motor', 'sensibilidade', 'cognicao', 'regulacao autonoma'],
    patologias_comuns: [
      'AVC (Acidente Vascular Cerebral)',
      'Epilepsia',
      'Doenca de Parkinson',
      'Doenca de Alzheimer',
      'Esclerose multipla',
      'Meningite',
      'Enxaqueca',
      'Neuropatias perifericas'
    ],
    exames: ['Tomografia de cranio', 'Ressonancia magnetica', 'Eletroencefalograma', 'Liquor', 'Eletroneuromiografia'],
    keywords: ['cerebro', 'neurologico', 'AVC', 'epilepsia', 'convulsao', 'demencia', 'Parkinson', 'Alzheimer']
  },

  'sistema_endocrino': {
    nome: 'Sistema Endocrino',
    aliases: ['sistema hormonal', 'glandulas endocrinas'],
    orgaos: ['hipofise', 'tireoide', 'paratireoides', 'suprarrenais', 'pancreas endocrino', 'gonadas'],
    funcoes: ['regulacao hormonal', 'metabolismo', 'crescimento', 'reproducao'],
    patologias_comuns: [
      'Diabetes mellitus',
      'Hipotireoidismo',
      'Hipertireoidismo',
      'Sindrome de Cushing',
      'Doenca de Addison',
      'Obesidade',
      'Sindrome metabolica',
      'Osteoporose'
    ],
    exames: ['TSH', 'T3', 'T4', 'Glicemia', 'Hemoglobina glicada', 'Cortisol', 'Densitometria ossea'],
    keywords: ['diabetes', 'tireoide', 'hormonio', 'insulina', 'glicose', 'metabolismo', 'obesidade']
  },

  'sistema_renal': {
    nome: 'Sistema Renal/Urinario',
    aliases: ['sistema urinario', 'aparelho urinario'],
    orgaos: ['rins', 'ureteres', 'bexiga', 'uretra'],
    funcoes: ['filtracao sanguinea', 'regulacao hidroeletrolitica', 'excrecao de metabolitos'],
    patologias_comuns: [
      'Insuficiencia renal aguda',
      'Doenca renal cronica',
      'Infeccao urinaria',
      'Litiase renal (calculos)',
      'Glomerulonefrites',
      'Sindrome nefrotica',
      'Pielonefrite'
    ],
    exames: ['Creatinina', 'Ureia', 'EAS (Exame de urina)', 'Urocultura', 'Ultrassom renal', 'Clearance de creatinina'],
    keywords: ['rim', 'renal', 'urina', 'creatinina', 'dialise', 'calculo', 'infeccao urinaria']
  },

  'sistema_musculoesqueletico': {
    nome: 'Sistema Musculoesqueletico',
    aliases: ['sistema locomotor', 'aparelho locomotor'],
    orgaos: ['ossos', 'musculos', 'articulacoes', 'tendoes', 'ligamentos'],
    funcoes: ['sustentacao', 'movimento', 'protecao de orgaos', 'producao de celulas sanguineas'],
    patologias_comuns: [
      'Osteoartrite',
      'Artrite reumatoide',
      'Osteoporose',
      'Fraturas',
      'Lombalgia',
      'Fibromialgia',
      'Gota',
      'Tendinites'
    ],
    exames: ['Raio-X', 'Ressonancia magnetica', 'Densitometria ossea', 'Fator reumatoide', 'Acido urico'],
    keywords: ['osso', 'musculo', 'articulacao', 'fratura', 'artrite', 'coluna', 'joelho', 'dor']
  },

  'sistema_imunologico': {
    nome: 'Sistema Imunologico',
    aliases: ['sistema imune', 'defesa do organismo'],
    orgaos: ['medula ossea', 'timo', 'linfonodos', 'baco', 'amigdalas'],
    funcoes: ['defesa contra patogenos', 'vigilancia imunologica', 'memoria imunologica'],
    patologias_comuns: [
      'HIV/AIDS',
      'Lupus eritematoso sistemico',
      'Artrite reumatoide',
      'Alergias',
      'Imunodeficiencias',
      'Doencas autoimunes',
      'Rejeicao de transplantes'
    ],
    exames: ['Hemograma completo', 'Imunoglobulinas', 'CD4/CD8', 'FAN', 'Complemento'],
    keywords: ['imunidade', 'alergia', 'autoimune', 'lupus', 'HIV', 'anticorpo', 'linfocito']
  }
} as const

// Tipo para sistema medico
export type MedicalSystem = keyof typeof MEDICAL_KNOWLEDGE

/**
 * Detecta qual sistema medico esta sendo perguntado
 */
export function detectMedicalSystem(query: string): MedicalSystem | null {
  const queryLower = query.toLowerCase()

  for (const [systemKey, system] of Object.entries(MEDICAL_KNOWLEDGE)) {
    // Verificar nome
    if (queryLower.includes(system.nome.toLowerCase())) {
      return systemKey as MedicalSystem
    }

    // Verificar aliases
    for (const alias of system.aliases) {
      if (queryLower.includes(alias.toLowerCase())) {
        return systemKey as MedicalSystem
      }
    }

    // Verificar keywords (precisa de pelo menos 2 matches)
    const keywordMatches = system.keywords.filter(kw =>
      queryLower.includes(kw.toLowerCase())
    )
    if (keywordMatches.length >= 2) {
      return systemKey as MedicalSystem
    }
  }

  return null
}

/**
 * Retorna conhecimento estruturado sobre um sistema
 */
export function getMedicalKnowledge(system: MedicalSystem) {
  return MEDICAL_KNOWLEDGE[system]
}

/**
 * Gera contexto adicional para a IA baseado na query
 */
export function generateMedicalContext(query: string): string {
  const system = detectMedicalSystem(query)

  if (!system) {
    return ''
  }

  const knowledge = MEDICAL_KNOWLEDGE[system]

  return `
[CONTEXTO MEDICO ESPECIALIZADO - ${knowledge.nome}]

ORGAOS ENVOLVIDOS:
${knowledge.orgaos.join(', ')}

FUNCOES PRINCIPAIS:
${knowledge.funcoes.join('; ')}

PATOLOGIAS COMUNS:
${knowledge.patologias_comuns.slice(0, 5).join(', ')}

EXAMES RELEVANTES:
${knowledge.exames.join(', ')}

Use este conhecimento para enriquecer sua resposta com informacoes medicas precisas e atualizadas.
`
}

/**
 * Sugere topicos relacionados baseado na query
 */
export function suggestRelatedTopics(query: string): string[] {
  const system = detectMedicalSystem(query)

  if (!system) {
    return []
  }

  const knowledge = MEDICAL_KNOWLEDGE[system]

  return [
    ...knowledge.patologias_comuns.slice(0, 3),
    ...knowledge.exames.slice(0, 2)
  ]
}
