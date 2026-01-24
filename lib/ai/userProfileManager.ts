/**
 * User Profile Manager - Inspirado na Meta AI
 *
 * Gerencia o perfil do usuário para personalização de respostas:
 * - Nível de conhecimento (iniciante, intermediário, avançado)
 * - Preferências de estudo (visual, textual, prático)
 * - Histórico de interações
 * - Áreas de interesse/dificuldade
 */

export type NivelConhecimento = 'iniciante' | 'intermediario' | 'avancado'
export type PreferenciaEstudo = 'visual' | 'textual' | 'pratico' | 'misto'
export type AreaMedica =
  | 'anatomia' | 'fisiologia' | 'bioquimica' | 'farmacologia'
  | 'patologia' | 'clinica_medica' | 'cirurgia' | 'pediatria'
  | 'ginecologia' | 'psiquiatria' | 'cardiologia' | 'neurologia'
  | 'oncologia' | 'dermatologia' | 'oftalmologia' | 'ortopedia'
  | 'infectologia' | 'nefrologia' | 'pneumologia' | 'gastroenterologia'
  | 'endocrinologia' | 'hematologia' | 'reumatologia' | 'geriatria'
  | 'medicina_preventiva' | 'saude_publica' | 'etica_medica'
  | 'geral'

export interface PerfilUsuario {
  userId: string
  nivelConhecimento: NivelConhecimento
  preferenciaEstudo: PreferenciaEstudo
  areasInteresse: AreaMedica[]
  areasDificuldade: AreaMedica[]
  tempoEstudoMedio: number // minutos por sessão
  prefereExemplos: boolean
  prefereImagens: boolean
  prefereQuestoes: boolean
  prefereResumos: boolean
  idioma: 'pt-BR' | 'pt-PT' | 'en'
  // Histórico condensado
  topicosEstudados: Map<string, number> // tópico -> frequência
  errosComuns: Map<string, string[]> // área -> tipos de erro
  ultimaAtualizacao: Date
}

export interface AnalisePerfilContexto {
  nivelSugerido: NivelConhecimento
  formatoRecomendado: PreferenciaEstudo
  incluirImagens: boolean
  incluirExemplos: boolean
  incluirQuestoes: boolean
  complexidadeVocabulario: 'simples' | 'tecnico' | 'misto'
  tamanhoRespostaIdeal: 'curta' | 'media' | 'longa'
  areasRelacionadas: AreaMedica[]
  recomendacoes: string[]
}

// Palavras que indicam nível de conhecimento
const INDICADORES_NIVEL = {
  iniciante: [
    'o que é', 'o que são', 'qual é', 'como funciona', 'me explique',
    'para iniciante', 'basico', 'básico', 'simples', 'resumido',
    'não entendo', 'nao entendo', 'primeira vez', 'começando',
    'fundamentos', 'introdução', 'introduçao', 'conceito de',
    'definição', 'definiçao', 'significado'
  ],
  intermediario: [
    'mecanismo', 'processo', 'relação entre', 'comparar', 'diferença entre',
    'quando usar', 'indicação', 'contraindicação', 'efeitos',
    'fisiopatologia', 'classificação', 'tipos de', 'causas de',
    'diagnóstico', 'tratamento', 'prognóstico'
  ],
  avancado: [
    'fisiopatologia molecular', 'receptores', 'vias de sinalização',
    'mecanismo molecular', 'estudos clínicos', 'meta-análise',
    'guidelines', 'consenso', 'controversia', 'off-label',
    'interações medicamentosas complexas', 'casos raros',
    'diagnóstico diferencial avançado', 'biomarcadores'
  ]
}

// Palavras que indicam preferência de estudo
const INDICADORES_PREFERENCIA = {
  visual: [
    'mostre', 'imagem', 'figura', 'diagrama', 'esquema', 'ilustração',
    'desenho', 'visualizar', 'gráfico', 'tabela', 'mapa mental',
    'fluxograma', 'anatomia', 'atlas'
  ],
  textual: [
    'explique', 'descreva', 'detalhe', 'texto', 'leitura',
    'artigo', 'resumo escrito', 'definição'
  ],
  pratico: [
    'caso clínico', 'exemplo prático', 'como fazer', 'passo a passo',
    'exercício', 'questão', 'simulado', 'prova', 'residência',
    'aplicar', 'na prática', 'conduta'
  ]
}

// Mapeamento de palavras-chave para áreas médicas
const PALAVRAS_AREAS: Record<string, AreaMedica[]> = {
  'coração': ['cardiologia', 'anatomia', 'fisiologia'],
  'coracao': ['cardiologia', 'anatomia', 'fisiologia'],
  'cardíaco': ['cardiologia'],
  'cardiaco': ['cardiologia'],
  'ecg': ['cardiologia'],
  'eletrocardiograma': ['cardiologia'],
  'arritmia': ['cardiologia'],
  'infarto': ['cardiologia', 'clinica_medica'],

  'cérebro': ['neurologia', 'anatomia'],
  'cerebro': ['neurologia', 'anatomia'],
  'neurônio': ['neurologia', 'fisiologia'],
  'neuronio': ['neurologia', 'fisiologia'],
  'avc': ['neurologia'],
  'epilepsia': ['neurologia'],
  'alzheimer': ['neurologia', 'geriatria'],
  'parkinson': ['neurologia'],

  'pulmão': ['pneumologia', 'anatomia'],
  'pulmao': ['pneumologia', 'anatomia'],
  'respiratório': ['pneumologia', 'fisiologia'],
  'respiratorio': ['pneumologia', 'fisiologia'],
  'asma': ['pneumologia'],
  'dpoc': ['pneumologia'],
  'pneumonia': ['pneumologia', 'infectologia'],

  'rim': ['nefrologia', 'anatomia'],
  'renal': ['nefrologia'],
  'diálise': ['nefrologia'],
  'dialise': ['nefrologia'],
  'glomerulonefrite': ['nefrologia'],

  'fígado': ['gastroenterologia', 'anatomia'],
  'figado': ['gastroenterologia', 'anatomia'],
  'hepatite': ['gastroenterologia', 'infectologia'],
  'cirrose': ['gastroenterologia'],
  'estômago': ['gastroenterologia'],
  'estomago': ['gastroenterologia'],
  'intestino': ['gastroenterologia', 'anatomia'],

  'osso': ['ortopedia', 'anatomia'],
  'fratura': ['ortopedia'],
  'articulação': ['ortopedia', 'reumatologia'],
  'articulacao': ['ortopedia', 'reumatologia'],
  'músculo': ['anatomia', 'fisiologia'],
  'musculo': ['anatomia', 'fisiologia'],

  'pele': ['dermatologia', 'anatomia'],
  'dermatite': ['dermatologia'],
  'eczema': ['dermatologia'],
  'psoríase': ['dermatologia'],
  'psoriase': ['dermatologia'],

  'olho': ['oftalmologia', 'anatomia'],
  'visão': ['oftalmologia'],
  'visao': ['oftalmologia'],
  'catarata': ['oftalmologia'],
  'glaucoma': ['oftalmologia'],

  'criança': ['pediatria'],
  'crianca': ['pediatria'],
  'neonato': ['pediatria'],
  'recém-nascido': ['pediatria'],
  'recem-nascido': ['pediatria'],
  'pediatria': ['pediatria'],

  'gravidez': ['ginecologia'],
  'gestação': ['ginecologia'],
  'gestacao': ['ginecologia'],
  'parto': ['ginecologia'],
  'útero': ['ginecologia', 'anatomia'],
  'utero': ['ginecologia', 'anatomia'],
  'ovário': ['ginecologia', 'anatomia'],
  'ovario': ['ginecologia', 'anatomia'],

  'idoso': ['geriatria'],
  'envelhecimento': ['geriatria'],
  'demência': ['geriatria', 'neurologia'],
  'demencia': ['geriatria', 'neurologia'],

  'câncer': ['oncologia'],
  'cancer': ['oncologia'],
  'tumor': ['oncologia', 'patologia'],
  'neoplasia': ['oncologia', 'patologia'],
  'quimioterapia': ['oncologia'],
  'radioterapia': ['oncologia'],

  'infecção': ['infectologia'],
  'infeccao': ['infectologia'],
  'bactéria': ['infectologia'],
  'bacteria': ['infectologia'],
  'vírus': ['infectologia'],
  'virus': ['infectologia'],
  'antibiótico': ['infectologia', 'farmacologia'],
  'antibiotico': ['infectologia', 'farmacologia'],

  'sangue': ['hematologia', 'fisiologia'],
  'anemia': ['hematologia'],
  'leucemia': ['hematologia', 'oncologia'],
  'coagulação': ['hematologia'],
  'coagulacao': ['hematologia'],

  'hormônio': ['endocrinologia', 'fisiologia'],
  'hormonio': ['endocrinologia', 'fisiologia'],
  'diabetes': ['endocrinologia'],
  'tireoide': ['endocrinologia'],
  'insulina': ['endocrinologia', 'farmacologia'],

  'depressão': ['psiquiatria'],
  'depressao': ['psiquiatria'],
  'ansiedade': ['psiquiatria'],
  'esquizofrenia': ['psiquiatria'],
  'bipolar': ['psiquiatria'],

  'cirurgia': ['cirurgia'],
  'operação': ['cirurgia'],
  'operacao': ['cirurgia'],
  'laparoscopia': ['cirurgia'],

  'medicamento': ['farmacologia'],
  'fármaco': ['farmacologia'],
  'farmaco': ['farmacologia'],
  'dose': ['farmacologia'],
  'farmacocinética': ['farmacologia'],
  'farmacocinetica': ['farmacologia'],
  'farmacodinâmica': ['farmacologia'],
  'farmacodinamica': ['farmacologia'],

  'célula': ['fisiologia', 'bioquimica'],
  'celula': ['fisiologia', 'bioquimica'],
  'tecido': ['anatomia', 'patologia'],
  'histologia': ['anatomia', 'patologia'],

  'proteína': ['bioquimica'],
  'proteina': ['bioquimica'],
  'enzima': ['bioquimica'],
  'metabolismo': ['bioquimica', 'fisiologia'],
  'atp': ['bioquimica'],
  'dna': ['bioquimica'],
  'rna': ['bioquimica'],

  'ética': ['etica_medica'],
  'etica': ['etica_medica'],
  'bioética': ['etica_medica'],
  'bioetica': ['etica_medica'],
  'consentimento': ['etica_medica'],

  'epidemiologia': ['saude_publica', 'medicina_preventiva'],
  'vacinação': ['medicina_preventiva', 'infectologia'],
  'vacinacao': ['medicina_preventiva', 'infectologia'],
  'prevenção': ['medicina_preventiva'],
  'prevencao': ['medicina_preventiva'],
  'sus': ['saude_publica'],
}

/**
 * Cria um perfil padrão para novo usuário
 */
export function criarPerfilPadrao(userId: string): PerfilUsuario {
  return {
    userId,
    nivelConhecimento: 'intermediario',
    preferenciaEstudo: 'misto',
    areasInteresse: [],
    areasDificuldade: [],
    tempoEstudoMedio: 30,
    prefereExemplos: true,
    prefereImagens: true,
    prefereQuestoes: true,
    prefereResumos: true,
    idioma: 'pt-BR',
    topicosEstudados: new Map(),
    errosComuns: new Map(),
    ultimaAtualizacao: new Date()
  }
}

/**
 * Detecta o nível de conhecimento baseado na mensagem
 */
export function detectarNivelConhecimento(mensagem: string): NivelConhecimento {
  const msgLower = mensagem.toLowerCase()

  // Contar indicadores de cada nível
  let scoreIniciante = 0
  let scoreIntermediario = 0
  let scoreAvancado = 0

  for (const termo of INDICADORES_NIVEL.iniciante) {
    if (msgLower.includes(termo)) scoreIniciante += 2
  }

  for (const termo of INDICADORES_NIVEL.intermediario) {
    if (msgLower.includes(termo)) scoreIntermediario += 2
  }

  for (const termo of INDICADORES_NIVEL.avancado) {
    if (msgLower.includes(termo)) scoreAvancado += 3 // Peso maior para termos avançados
  }

  // Determinar nível baseado nos scores
  if (scoreAvancado > scoreIntermediario && scoreAvancado > scoreIniciante) {
    return 'avancado'
  } else if (scoreIniciante > scoreIntermediario) {
    return 'iniciante'
  }

  return 'intermediario'
}

/**
 * Detecta a preferência de estudo baseado na mensagem
 */
export function detectarPreferenciaEstudo(mensagem: string): PreferenciaEstudo {
  const msgLower = mensagem.toLowerCase()

  let scoreVisual = 0
  let scoreTextual = 0
  let scorePratico = 0

  for (const termo of INDICADORES_PREFERENCIA.visual) {
    if (msgLower.includes(termo)) scoreVisual += 2
  }

  for (const termo of INDICADORES_PREFERENCIA.textual) {
    if (msgLower.includes(termo)) scoreTextual += 2
  }

  for (const termo of INDICADORES_PREFERENCIA.pratico) {
    if (msgLower.includes(termo)) scorePratico += 2
  }

  // Se múltiplas preferências detectadas, retornar 'misto'
  const scores = [scoreVisual, scoreTextual, scorePratico]
  const maxScore = Math.max(...scores)
  const countMax = scores.filter(s => s === maxScore && s > 0).length

  if (countMax > 1 || maxScore === 0) return 'misto'

  if (scoreVisual === maxScore) return 'visual'
  if (scorePratico === maxScore) return 'pratico'
  return 'textual'
}

/**
 * Detecta áreas médicas mencionadas na mensagem
 */
export function detectarAreasMedicas(mensagem: string): AreaMedica[] {
  const msgLower = mensagem.toLowerCase()
  const areasEncontradas = new Set<AreaMedica>()

  for (const [palavra, areas] of Object.entries(PALAVRAS_AREAS)) {
    if (msgLower.includes(palavra)) {
      areas.forEach(area => areasEncontradas.add(area))
    }
  }

  // Se não encontrou nenhuma área específica, marcar como geral
  if (areasEncontradas.size === 0) {
    areasEncontradas.add('geral')
  }

  return Array.from(areasEncontradas)
}

/**
 * Analisa o contexto do perfil para personalização da resposta
 */
export function analisarPerfilParaContexto(
  perfil: PerfilUsuario,
  mensagemAtual: string
): AnalisePerfilContexto {
  // Detectar contexto da mensagem atual
  const nivelMensagem = detectarNivelConhecimento(mensagemAtual)
  const preferenciaMensagem = detectarPreferenciaEstudo(mensagemAtual)
  const areasMensagem = detectarAreasMedicas(mensagemAtual)

  // Combinar com perfil existente (priorizar mensagem atual)
  const nivelFinal = nivelMensagem !== 'intermediario' ? nivelMensagem : perfil.nivelConhecimento
  const preferenciaFinal = preferenciaMensagem !== 'misto' ? preferenciaMensagem : perfil.preferenciaEstudo

  // Determinar se deve incluir elementos
  const incluirImagens = perfil.prefereImagens ||
    preferenciaMensagem === 'visual' ||
    mensagemAtual.toLowerCase().includes('imagem') ||
    mensagemAtual.toLowerCase().includes('anatomia')

  const incluirExemplos = perfil.prefereExemplos ||
    preferenciaMensagem === 'pratico' ||
    nivelFinal === 'iniciante'

  const incluirQuestoes = perfil.prefereQuestoes ||
    mensagemAtual.toLowerCase().includes('questão') ||
    mensagemAtual.toLowerCase().includes('questao') ||
    mensagemAtual.toLowerCase().includes('prova')

  // Determinar complexidade do vocabulário
  let complexidadeVocabulario: 'simples' | 'tecnico' | 'misto' = 'misto'
  if (nivelFinal === 'iniciante') {
    complexidadeVocabulario = 'simples'
  } else if (nivelFinal === 'avancado') {
    complexidadeVocabulario = 'tecnico'
  }

  // Determinar tamanho ideal da resposta
  let tamanhoRespostaIdeal: 'curta' | 'media' | 'longa' = 'media'
  if (mensagemAtual.toLowerCase().includes('resumo') ||
      mensagemAtual.toLowerCase().includes('breve')) {
    tamanhoRespostaIdeal = 'curta'
  } else if (mensagemAtual.toLowerCase().includes('detalhado') ||
             mensagemAtual.toLowerCase().includes('completo') ||
             nivelFinal === 'avancado') {
    tamanhoRespostaIdeal = 'longa'
  }

  // Gerar recomendações
  const recomendacoes: string[] = []

  if (nivelFinal === 'iniciante') {
    recomendacoes.push('Use linguagem acessível e evite jargões')
    recomendacoes.push('Forneça analogias do dia-a-dia')
  } else if (nivelFinal === 'avancado') {
    recomendacoes.push('Use terminologia técnica precisa')
    recomendacoes.push('Cite mecanismos moleculares quando relevante')
  }

  if (incluirImagens) {
    recomendacoes.push('Inclua imagens ilustrativas')
  }

  if (incluirExemplos) {
    recomendacoes.push('Forneça exemplos práticos/casos clínicos')
  }

  // Áreas relacionadas baseadas no histórico
  const areasRelacionadas = areasMensagem.filter(area =>
    perfil.areasInteresse.includes(area) ||
    perfil.areasDificuldade.includes(area)
  )

  return {
    nivelSugerido: nivelFinal,
    formatoRecomendado: preferenciaFinal,
    incluirImagens,
    incluirExemplos,
    incluirQuestoes,
    complexidadeVocabulario,
    tamanhoRespostaIdeal,
    areasRelacionadas: areasRelacionadas.length > 0 ? areasRelacionadas : areasMensagem,
    recomendacoes
  }
}

/**
 * Atualiza o perfil baseado na interação
 */
export function atualizarPerfilComInteracao(
  perfil: PerfilUsuario,
  mensagem: string,
  topico?: string
): PerfilUsuario {
  const novosPerfil = { ...perfil }

  // Atualizar áreas de interesse
  const areasMensagem = detectarAreasMedicas(mensagem)
  for (const area of areasMensagem) {
    if (!novosPerfil.areasInteresse.includes(area) && area !== 'geral') {
      novosPerfil.areasInteresse.push(area)
      // Manter apenas as 10 mais recentes
      if (novosPerfil.areasInteresse.length > 10) {
        novosPerfil.areasInteresse.shift()
      }
    }
  }

  // Atualizar tópicos estudados
  if (topico) {
    const freq = novosPerfil.topicosEstudados.get(topico) || 0
    novosPerfil.topicosEstudados.set(topico, freq + 1)
  }

  // Atualizar timestamp
  novosPerfil.ultimaAtualizacao = new Date()

  return novosPerfil
}

/**
 * Gera instruções personalizadas para o prompt do sistema
 */
export function gerarInstrucoesPersonalizadas(analise: AnalisePerfilContexto): string {
  const instrucoes: string[] = []

  // Nível de conhecimento
  switch (analise.nivelSugerido) {
    case 'iniciante':
      instrucoes.push('🎓 NÍVEL: Estudante iniciante')
      instrucoes.push('- Use linguagem clara e acessível')
      instrucoes.push('- Explique termos técnicos quando usar')
      instrucoes.push('- Forneça analogias simples')
      instrucoes.push('- Estruture a resposta do básico ao específico')
      break
    case 'intermediario':
      instrucoes.push('🎓 NÍVEL: Estudante intermediário')
      instrucoes.push('- Balance termos técnicos com explicações')
      instrucoes.push('- Relacione com conhecimentos prévios')
      instrucoes.push('- Inclua detalhes clínicos relevantes')
      break
    case 'avancado':
      instrucoes.push('🎓 NÍVEL: Estudante avançado/Profissional')
      instrucoes.push('- Use terminologia técnica precisa')
      instrucoes.push('- Cite mecanismos fisiopatológicos')
      instrucoes.push('- Mencione evidências científicas quando relevante')
      instrucoes.push('- Inclua nuances e exceções importantes')
      break
  }

  // Formato de resposta
  instrucoes.push('')
  switch (analise.formatoRecomendado) {
    case 'visual':
      instrucoes.push('📊 FORMATO: Visual')
      instrucoes.push('- Priorize imagens e diagramas')
      instrucoes.push('- Use tabelas para comparações')
      instrucoes.push('- Inclua esquemas quando possível')
      break
    case 'pratico':
      instrucoes.push('🏥 FORMATO: Prático')
      instrucoes.push('- Inclua casos clínicos ilustrativos')
      instrucoes.push('- Forneça aplicações práticas')
      instrucoes.push('- Relate com situações reais')
      break
    case 'textual':
      instrucoes.push('📝 FORMATO: Textual')
      instrucoes.push('- Explicações detalhadas por escrito')
      instrucoes.push('- Organize em tópicos claros')
      break
    default:
      instrucoes.push('📚 FORMATO: Misto')
      instrucoes.push('- Combine texto, imagens e exemplos')
  }

  // Tamanho
  instrucoes.push('')
  switch (analise.tamanhoRespostaIdeal) {
    case 'curta':
      instrucoes.push('📏 TAMANHO: Conciso (resumo)')
      break
    case 'longa':
      instrucoes.push('📏 TAMANHO: Detalhado (completo)')
      break
    default:
      instrucoes.push('📏 TAMANHO: Moderado')
  }

  // Elementos adicionais
  const elementos: string[] = []
  if (analise.incluirImagens) elementos.push('imagens')
  if (analise.incluirExemplos) elementos.push('exemplos')
  if (analise.incluirQuestoes) elementos.push('questões de fixação')

  if (elementos.length > 0) {
    instrucoes.push('')
    instrucoes.push(`✅ INCLUIR: ${elementos.join(', ')}`)
  }

  return instrucoes.join('\n')
}

/**
 * Serializa perfil para armazenamento (converte Maps para objetos)
 */
export function serializarPerfil(perfil: PerfilUsuario): Record<string, unknown> {
  return {
    ...perfil,
    topicosEstudados: Object.fromEntries(perfil.topicosEstudados),
    errosComuns: Object.fromEntries(
      Array.from(perfil.errosComuns.entries()).map(([k, v]) => [k, v])
    ),
    ultimaAtualizacao: perfil.ultimaAtualizacao.toISOString()
  }
}

/**
 * Deserializa perfil do armazenamento
 */
export function deserializarPerfil(data: Record<string, unknown>): PerfilUsuario {
  return {
    userId: data.userId as string,
    nivelConhecimento: data.nivelConhecimento as NivelConhecimento,
    preferenciaEstudo: data.preferenciaEstudo as PreferenciaEstudo,
    areasInteresse: data.areasInteresse as AreaMedica[],
    areasDificuldade: data.areasDificuldade as AreaMedica[],
    tempoEstudoMedio: data.tempoEstudoMedio as number,
    prefereExemplos: data.prefereExemplos as boolean,
    prefereImagens: data.prefereImagens as boolean,
    prefereQuestoes: data.prefereQuestoes as boolean,
    prefereResumos: data.prefereResumos as boolean,
    idioma: data.idioma as 'pt-BR' | 'pt-PT' | 'en',
    topicosEstudados: new Map(Object.entries(data.topicosEstudados as Record<string, number>)),
    errosComuns: new Map(Object.entries(data.errosComuns as Record<string, string[]>)),
    ultimaAtualizacao: new Date(data.ultimaAtualizacao as string)
  }
}
