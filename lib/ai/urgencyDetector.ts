/**
 * Urgency Detector - Inspirado na Meta AI
 *
 * Detecta urgência/prioridade na mensagem do usuário:
 * - Urgência temporal (prova amanhã, prazo)
 * - Urgência emocional (frustração, desespero)
 * - Complexidade da dúvida
 * - Necessidade de resposta rápida vs detalhada
 */

export type NivelUrgencia = 'baixa' | 'media' | 'alta' | 'critica'
export type TipoUrgencia = 'temporal' | 'emocional' | 'academica' | 'nenhuma'

export interface AnaliseUrgencia {
  nivel: NivelUrgencia
  tipo: TipoUrgencia
  score: number // 0-1
  indicadores: string[]
  recomendacoes: {
    prioridadeResposta: 'imediata' | 'normal' | 'quando_possivel'
    tamanhoResposta: 'direto_ao_ponto' | 'equilibrado' | 'detalhado'
    incluirResumo: boolean
    incluirProximosPassos: boolean
    tomResposta: 'calmo_e_organizado' | 'motivacional' | 'neutro'
  }
  mensagemEmpatia?: string
}

// Indicadores de urgência temporal
const INDICADORES_TEMPORAIS = {
  critica: [
    'agora', 'urgente', 'socorro', 'emergência', 'emergencia',
    'prova hoje', 'exame hoje', 'teste hoje', 'avaliação hoje',
    'daqui a pouco', 'em minutos', 'começando agora', 'vai começar'
  ],
  alta: [
    'amanhã', 'amanha', 'prova amanhã', 'amanha cedo',
    'pouco tempo', 'prazo curto', 'preciso rápido', 'preciso rapido',
    'urgentemente', 'o mais rápido', 'o mais rapido',
    'prova essa semana', 'exame essa semana',
    'não tenho muito tempo', 'nao tenho muito tempo'
  ],
  media: [
    'essa semana', 'semana que vem', 'próxima semana', 'proxima semana',
    'em breve', 'logo', 'nos próximos dias', 'nos proximos dias',
    'prova em breve', 'tenho prova'
  ]
}

// Indicadores de urgência emocional
const INDICADORES_EMOCIONAIS = {
  critica: [
    'desesperado', 'desesperada', 'não aguento mais', 'nao aguento mais',
    'vou desistir', 'não consigo', 'nao consigo', 'chorando',
    'muito nervoso', 'muito nervosa', 'entrando em pânico',
    'entrando em panico', 'pânico', 'panico', 'ansiedade extrema'
  ],
  alta: [
    'frustrado', 'frustrada', 'estressado', 'estressada',
    'preocupado', 'preocupada', 'ansioso', 'ansiosa',
    'não entendo nada', 'nao entendo nada', 'muito difícil',
    'muito dificil', 'perdido', 'perdida', 'confuso', 'confusa',
    'não sei por onde começar', 'nao sei por onde comecar'
  ],
  media: [
    'dificuldade', 'problema', 'dúvida', 'duvida',
    'não estou conseguindo', 'nao estou conseguindo',
    'preciso de ajuda', 'me ajuda', 'help'
  ]
}

// Indicadores de urgência acadêmica
const INDICADORES_ACADEMICOS = {
  critica: [
    'residência médica', 'residencia medica', 'prova de residência',
    'prova de residencia', 'revalida', 'segunda fase',
    'última chance', 'ultima chance', 'reprovando', 'dp'
  ],
  alta: [
    'prova final', 'exame final', 'tcc', 'monografia',
    'apresentação', 'apresentacao', 'seminário', 'seminario',
    'trabalho valendo nota', 'vale muitos pontos',
    'precisando da nota', 'recuperação', 'recuperacao'
  ],
  media: [
    'prova', 'exame', 'teste', 'avaliação', 'avaliacao',
    'simulado', 'questões', 'questoes', 'exercícios', 'exercicios',
    'revisão', 'revisao', 'estudar'
  ]
}

// Padrões de contexto que reduzem urgência
const REDUCAO_URGENCIA = [
  'curiosidade', 'por curiosidade', 'queria saber',
  'quando puder', 'sem pressa', 'calma', 'tranquilo',
  'só para entender', 'so para entender', 'apenas',
  'interesse', 'pesquisa', 'aprofundar'
]

/**
 * Detecta o nível de urgência da mensagem
 */
export function detectarUrgencia(mensagem: string): AnaliseUrgencia {
  const msgLower = mensagem.toLowerCase()
  const indicadoresEncontrados: string[] = []

  let scoreTemporal = 0
  let scoreEmocional = 0
  let scoreAcademico = 0

  // Verificar indicadores temporais
  for (const termo of INDICADORES_TEMPORAIS.critica) {
    if (msgLower.includes(termo)) {
      scoreTemporal = Math.max(scoreTemporal, 1.0)
      indicadoresEncontrados.push(`temporal: ${termo}`)
    }
  }
  for (const termo of INDICADORES_TEMPORAIS.alta) {
    if (msgLower.includes(termo)) {
      scoreTemporal = Math.max(scoreTemporal, 0.75)
      indicadoresEncontrados.push(`temporal: ${termo}`)
    }
  }
  for (const termo of INDICADORES_TEMPORAIS.media) {
    if (msgLower.includes(termo)) {
      scoreTemporal = Math.max(scoreTemporal, 0.5)
      indicadoresEncontrados.push(`temporal: ${termo}`)
    }
  }

  // Verificar indicadores emocionais
  for (const termo of INDICADORES_EMOCIONAIS.critica) {
    if (msgLower.includes(termo)) {
      scoreEmocional = Math.max(scoreEmocional, 1.0)
      indicadoresEncontrados.push(`emocional: ${termo}`)
    }
  }
  for (const termo of INDICADORES_EMOCIONAIS.alta) {
    if (msgLower.includes(termo)) {
      scoreEmocional = Math.max(scoreEmocional, 0.75)
      indicadoresEncontrados.push(`emocional: ${termo}`)
    }
  }
  for (const termo of INDICADORES_EMOCIONAIS.media) {
    if (msgLower.includes(termo)) {
      scoreEmocional = Math.max(scoreEmocional, 0.5)
      indicadoresEncontrados.push(`emocional: ${termo}`)
    }
  }

  // Verificar indicadores acadêmicos
  for (const termo of INDICADORES_ACADEMICOS.critica) {
    if (msgLower.includes(termo)) {
      scoreAcademico = Math.max(scoreAcademico, 1.0)
      indicadoresEncontrados.push(`acadêmico: ${termo}`)
    }
  }
  for (const termo of INDICADORES_ACADEMICOS.alta) {
    if (msgLower.includes(termo)) {
      scoreAcademico = Math.max(scoreAcademico, 0.75)
      indicadoresEncontrados.push(`acadêmico: ${termo}`)
    }
  }
  for (const termo of INDICADORES_ACADEMICOS.media) {
    if (msgLower.includes(termo)) {
      scoreAcademico = Math.max(scoreAcademico, 0.5)
      indicadoresEncontrados.push(`acadêmico: ${termo}`)
    }
  }

  // Verificar redutores de urgência
  let reducao = 0
  for (const termo of REDUCAO_URGENCIA) {
    if (msgLower.includes(termo)) {
      reducao = 0.3
      break
    }
  }

  // Calcular score final
  const scores = [scoreTemporal, scoreEmocional, scoreAcademico]
  const maxScore = Math.max(...scores)
  const scoreFinal = Math.max(0, maxScore - reducao)

  // Determinar tipo principal de urgência
  let tipo: TipoUrgencia = 'nenhuma'
  if (maxScore > 0) {
    if (scoreTemporal === maxScore) tipo = 'temporal'
    else if (scoreEmocional === maxScore) tipo = 'emocional'
    else if (scoreAcademico === maxScore) tipo = 'academica'
  }

  // Determinar nível de urgência
  let nivel: NivelUrgencia = 'baixa'
  if (scoreFinal >= 0.9) nivel = 'critica'
  else if (scoreFinal >= 0.65) nivel = 'alta'
  else if (scoreFinal >= 0.4) nivel = 'media'

  // Gerar recomendações
  const recomendacoes = gerarRecomendacoes(nivel, tipo, scoreEmocional > 0.5)

  // Gerar mensagem de empatia se necessário
  const mensagemEmpatia = gerarMensagemEmpatia(nivel, tipo, scoreEmocional)

  return {
    nivel,
    tipo,
    score: scoreFinal,
    indicadores: indicadoresEncontrados,
    recomendacoes,
    mensagemEmpatia
  }
}

/**
 * Gera recomendações baseadas na urgência
 */
function gerarRecomendacoes(
  nivel: NivelUrgencia,
  tipo: TipoUrgencia,
  temComponenteEmocional: boolean
): AnaliseUrgencia['recomendacoes'] {
  const recomendacoes: AnaliseUrgencia['recomendacoes'] = {
    prioridadeResposta: 'normal',
    tamanhoResposta: 'equilibrado',
    incluirResumo: false,
    incluirProximosPassos: false,
    tomResposta: 'neutro'
  }

  // Ajustar baseado no nível
  switch (nivel) {
    case 'critica':
      recomendacoes.prioridadeResposta = 'imediata'
      recomendacoes.tamanhoResposta = 'direto_ao_ponto'
      recomendacoes.incluirResumo = true
      recomendacoes.incluirProximosPassos = true
      break
    case 'alta':
      recomendacoes.prioridadeResposta = 'imediata'
      recomendacoes.tamanhoResposta = 'equilibrado'
      recomendacoes.incluirResumo = true
      recomendacoes.incluirProximosPassos = true
      break
    case 'media':
      recomendacoes.prioridadeResposta = 'normal'
      recomendacoes.tamanhoResposta = 'equilibrado'
      recomendacoes.incluirProximosPassos = true
      break
    default:
      recomendacoes.prioridadeResposta = 'quando_possivel'
      recomendacoes.tamanhoResposta = 'detalhado'
  }

  // Ajustar tom baseado no componente emocional
  if (temComponenteEmocional) {
    recomendacoes.tomResposta = 'calmo_e_organizado'
    if (nivel === 'critica' || nivel === 'alta') {
      recomendacoes.tomResposta = 'motivacional'
    }
  }

  return recomendacoes
}

/**
 * Gera mensagem de empatia para situações de alta urgência emocional
 */
function gerarMensagemEmpatia(
  nivel: NivelUrgencia,
  tipo: TipoUrgencia,
  scoreEmocional: number
): string | undefined {
  // Só gerar mensagem de empatia se houver componente emocional significativo
  if (scoreEmocional < 0.5) return undefined

  const mensagens = {
    critica: [
      'Entendo que esse é um momento difícil, mas vamos resolver isso juntos. Respira fundo.',
      'Sei que a pressão está grande, mas você consegue! Vou te ajudar passo a passo.',
      'Calma, vamos organizar as ideias. Uma coisa de cada vez. 💪'
    ],
    alta: [
      'Entendo sua preocupação. Vou te ajudar a organizar o estudo.',
      'Fique tranquilo(a), vamos simplificar isso para você.',
      'É normal sentir essa pressão. Vamos focar no que é mais importante.'
    ],
    media: [
      'Vou te ajudar a entender isso de forma clara.',
      'Vamos descomplicar esse assunto juntos.'
    ]
  }

  const lista = mensagens[nivel === 'critica' ? 'critica' : nivel === 'alta' ? 'alta' : 'media']
  return lista[Math.floor(Math.random() * lista.length)]
}

/**
 * Gera instruções para o prompt do sistema baseado na urgência
 */
export function gerarInstrucoesUrgencia(analise: AnaliseUrgencia): string {
  const instrucoes: string[] = []

  // Cabeçalho de urgência
  const emojiUrgencia = {
    critica: '🚨',
    alta: '⚠️',
    media: '📌',
    baixa: '📝'
  }

  instrucoes.push(`${emojiUrgencia[analise.nivel]} URGÊNCIA: ${analise.nivel.toUpperCase()}`)

  if (analise.tipo !== 'nenhuma') {
    instrucoes.push(`Tipo: ${analise.tipo}`)
  }

  instrucoes.push('')

  // Instruções de formato
  switch (analise.recomendacoes.tamanhoResposta) {
    case 'direto_ao_ponto':
      instrucoes.push('📏 FORMATO: Direto ao ponto')
      instrucoes.push('- Comece com o mais importante')
      instrucoes.push('- Evite introduções longas')
      instrucoes.push('- Use bullet points')
      instrucoes.push('- Destaque conceitos-chave em negrito')
      break
    case 'equilibrado':
      instrucoes.push('📏 FORMATO: Equilibrado')
      instrucoes.push('- Explicação clara e organizada')
      instrucoes.push('- Não seja muito extenso')
      break
    default:
      instrucoes.push('📏 FORMATO: Pode detalhar')
  }

  // Instruções de tom
  if (analise.recomendacoes.tomResposta === 'motivacional') {
    instrucoes.push('')
    instrucoes.push('💪 TOM: Motivacional e encorajador')
    instrucoes.push('- Seja empático')
    instrucoes.push('- Transmita confiança')
    instrucoes.push('- Divida em etapas gerenciáveis')
  } else if (analise.recomendacoes.tomResposta === 'calmo_e_organizado') {
    instrucoes.push('')
    instrucoes.push('🧘 TOM: Calmo e organizado')
    instrucoes.push('- Estruture bem a resposta')
    instrucoes.push('- Reduza a ansiedade com organização')
  }

  // Elementos obrigatórios
  const elementos: string[] = []
  if (analise.recomendacoes.incluirResumo) {
    elementos.push('resumo inicial (TL;DR)')
  }
  if (analise.recomendacoes.incluirProximosPassos) {
    elementos.push('próximos passos práticos')
  }

  if (elementos.length > 0) {
    instrucoes.push('')
    instrucoes.push(`✅ INCLUIR OBRIGATORIAMENTE: ${elementos.join(', ')}`)
  }

  return instrucoes.join('\n')
}

/**
 * Verifica se deve enviar uma resposta rápida primeiro
 */
export function deveEnviarRespostaRapida(analise: AnaliseUrgencia): boolean {
  return analise.nivel === 'critica' || analise.nivel === 'alta'
}

/**
 * Gera resposta rápida inicial para urgência alta
 */
export function gerarRespostaRapidaInicial(analise: AnaliseUrgencia): string | null {
  if (!deveEnviarRespostaRapida(analise)) return null

  let resposta = ''

  // Adicionar mensagem de empatia se houver
  if (analise.mensagemEmpatia) {
    resposta += analise.mensagemEmpatia + '\n\n'
  }

  // Indicar que está processando
  if (analise.nivel === 'critica') {
    resposta += '⏱️ **Processando sua dúvida...**\n'
    resposta += 'Vou te dar uma resposta objetiva em instantes.'
  } else {
    resposta += '📚 **Analisando seu tema...**\n'
    resposta += 'Preparando uma explicação organizada para você.'
  }

  return resposta
}

/**
 * Prioriza elementos da resposta baseado na urgência
 */
export function priorizarElementosResposta(
  analise: AnaliseUrgencia
): string[] {
  // Ordem de prioridade dos elementos na resposta
  if (analise.nivel === 'critica') {
    return [
      'resposta_direta',      // Responder a pergunta primeiro
      'conceitos_chave',      // Conceitos mais importantes
      'resumo_rapido',        // TL;DR
      'proximos_passos',      // O que fazer agora
      'detalhes_adicionais'   // Se sobrar tempo
    ]
  } else if (analise.nivel === 'alta') {
    return [
      'resposta_direta',
      'explicacao_organizada',
      'conceitos_chave',
      'exemplos_praticos',
      'proximos_passos'
    ]
  } else if (analise.nivel === 'media') {
    return [
      'introducao_breve',
      'explicacao_completa',
      'exemplos',
      'pontos_importantes',
      'referencias'
    ]
  }

  // Baixa urgência - pode ser mais detalhado
  return [
    'contexto',
    'explicacao_detalhada',
    'exemplos_variados',
    'aprofundamento',
    'curiosidades',
    'referencias_completas'
  ]
}
