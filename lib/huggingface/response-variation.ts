/**
 * Sistema de Variabilidade de Respostas
 *
 * Implementa tecnicas para evitar respostas repetitivas e adicionar
 * variacao natural nas explicacoes da IA medica.
 */

import crypto from 'crypto'

// Configuracoes de variabilidade por tipo de resposta
export const VARIATION_CONFIG = {
  // Para respostas educacionais, queremos consistencia com pequenas variacoes
  educational: {
    temperature: 0.7,
    top_p: 0.9,
    top_k: 50,
    repetition_penalty: 1.1,
  },
  // Para geracao de questoes, mais criatividade
  questions: {
    temperature: 0.85,
    top_p: 0.95,
    top_k: 100,
    repetition_penalty: 1.2,
  },
  // Para casos clinicos, mais diversidade
  clinical_cases: {
    temperature: 0.9,
    top_p: 0.95,
    top_k: 100,
    repetition_penalty: 1.15,
  },
  // Para flashcards, balanceado
  flashcards: {
    temperature: 0.75,
    top_p: 0.9,
    top_k: 75,
    repetition_penalty: 1.1,
  },
  // Para resumos, mais objetivo
  summary: {
    temperature: 0.6,
    top_p: 0.85,
    top_k: 40,
    repetition_penalty: 1.05,
  },
  // Para planos de estudo
  study_plan: {
    temperature: 0.7,
    top_p: 0.9,
    top_k: 60,
    repetition_penalty: 1.1,
  }
}

export type VariationConfigType = keyof typeof VARIATION_CONFIG

/**
 * Gerar seed unico por usuario + topico + timestamp
 * Isso garante que cada usuario tenha uma experiencia unica
 */
export function generateUniqueSeed(userId: string, topic: string): number {
  const timestamp = Math.floor(Date.now() / (1000 * 60)) // Muda a cada minuto
  const hash = crypto
    .createHash('md5')
    .update(`${userId}-${topic}-${timestamp}`)
    .digest('hex')
  return parseInt(hash.substring(0, 8), 16)
}

/**
 * Gerar seed diario para o usuario (muda 1x por dia)
 */
export function generateDailySeed(userId: string): number {
  const today = new Date().toISOString().split('T')[0]
  const hash = crypto
    .createHash('md5')
    .update(`${userId}-${today}`)
    .digest('hex')
  return parseInt(hash.substring(0, 8), 16)
}

// Abordagens de ensino disponiveis
const TEACHING_APPROACHES = [
  'explicacao_detalhada',
  'analogias_cotidianas',
  'casos_praticos',
  'perguntas_socraticas',
  'comparacao_sistemas',
  'timeline_historica',
  'perspectiva_clinica',
  'foco_em_patologias',
  'mnemonicos',
  'visual_diagrams'
] as const

export type TeachingApproach = typeof TEACHING_APPROACHES[number]

/**
 * Selecionar abordagem de ensino variada baseada no usuario e topico
 */
export function selectTeachingApproach(topic: string, userId: string): TeachingApproach {
  const seed = generateUniqueSeed(userId, topic)
  const index = seed % TEACHING_APPROACHES.length
  return TEACHING_APPROACHES[index]
}

/**
 * Obter instrucao de abordagem de ensino
 */
export function getApproachInstruction(approach: TeachingApproach): string {
  const approachInstructions: Record<TeachingApproach, string> = {
    'explicacao_detalhada':
      'Explique de forma detalhada, passo a passo, comecando pelos conceitos fundamentais. Use uma estrutura logica e progressiva.',
    'analogias_cotidianas':
      'Use analogias do dia a dia para explicar os conceitos. Compare com situacoes familiares que o estudante conhece bem.',
    'casos_praticos':
      'Apresente atraves de casos praticos e exemplos reais da pratica medica. Use cenarios clinicos concretos.',
    'perguntas_socraticas':
      'Use o metodo socratico, fazendo perguntas que guiem o raciocinio do estudante. Estimule a reflexao ativa.',
    'comparacao_sistemas':
      'Compare com outros sistemas do corpo, destacando semelhancas e diferencas. Mostre conexoes entre areas.',
    'timeline_historica':
      'Apresente uma perspectiva historica de como o conhecimento sobre este tema evoluiu. Contextualize descobertas importantes.',
    'perspectiva_clinica':
      'Foque na relevancia clinica, sinais, sintomas e diagnostico diferencial. Priorize o que aparece na pratica.',
    'foco_em_patologias':
      'Aborde as principais patologias associadas e seus mecanismos fisiopatologicos. Conecte teoria com doenca.',
    'mnemonicos':
      'Crie e utilize mnemonicos para facilitar a memorizacao. Use siglas, rimas ou associacoes visuais.',
    'visual_diagrams':
      'Descreva conceitos de forma visual, sugira diagramas e fluxogramas. Organize informacao espacialmente.'
  }

  return approachInstructions[approach]
}

/**
 * Gerar prompt com variacao de abordagem
 */
export function generateVariedPrompt(
  basePrompt: string,
  topic: string,
  userId: string
): string {
  const approach = selectTeachingApproach(topic, userId)
  const instruction = getApproachInstruction(approach)

  return `${basePrompt}

ABORDAGEM DE ENSINO: ${instruction}

IMPORTANTE:
- Varie a estrutura da resposta. Nao use sempre os mesmos subtitulos ou organizacao.
- Use exemplos diferentes dos usuais quando possivel.
- Traga informacoes complementares interessantes.
- Mantenha a precisao medica mesmo variando a forma de explicar.`
}

/**
 * Detectar tipo de resposta baseado na mensagem
 */
export function detectResponseType(message: string): VariationConfigType {
  const lowerMessage = message.toLowerCase()

  // Questoes
  if (
    lowerMessage.includes('questao') ||
    lowerMessage.includes('questoes') ||
    lowerMessage.includes('pergunta') ||
    lowerMessage.includes('prova') ||
    lowerMessage.includes('simulado')
  ) {
    return 'questions'
  }

  // Flashcards
  if (lowerMessage.includes('flashcard')) {
    return 'flashcards'
  }

  // Casos clinicos
  if (
    lowerMessage.includes('caso clinico') ||
    lowerMessage.includes('caso clínico') ||
    lowerMessage.includes('paciente') ||
    lowerMessage.includes('diagnostico')
  ) {
    return 'clinical_cases'
  }

  // Resumos
  if (
    lowerMessage.includes('resumo') ||
    lowerMessage.includes('resumir') ||
    lowerMessage.includes('sintetize')
  ) {
    return 'summary'
  }

  // Planos de estudo
  if (
    lowerMessage.includes('plano de estudo') ||
    lowerMessage.includes('cronograma') ||
    lowerMessage.includes('como estudar')
  ) {
    return 'study_plan'
  }

  return 'educational'
}

/**
 * Extrair topico principal da mensagem
 */
export function extractTopic(message: string): string {
  // Remove palavras comuns e extrai o topico principal
  const stopWords = [
    'sobre', 'explique', 'fale', 'me', 'conte', 'o', 'a', 'os', 'as',
    'um', 'uma', 'que', 'qual', 'quais', 'como', 'porque', 'por que',
    'crie', 'gere', 'faca', 'questoes', 'flashcards', 'resumo'
  ]

  const words = message
    .toLowerCase()
    .replace(/[.,!?]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))

  // Retorna as primeiras 3 palavras relevantes como topico
  return words.slice(0, 3).join(' ') || 'medicina'
}

/**
 * Verificar se resposta e muito similar a anteriores (anti-repeticao)
 * Usa algoritmo de n-grams para comparacao
 */
export function checkResponseSimilarity(
  newResponse: string,
  cachedResponses: string[]
): { isSimilar: boolean; similarity: number; mostSimilarIndex: number } {
  if (cachedResponses.length === 0) {
    return { isSimilar: false, similarity: 0, mostSimilarIndex: -1 }
  }

  // Calcular tri-grams da nova resposta
  const getTriGrams = (text: string): Set<string> => {
    const words = text.toLowerCase().split(/\s+/)
    const trigrams = new Set<string>()
    for (let i = 0; i < words.length - 2; i++) {
      trigrams.add(`${words[i]} ${words[i+1]} ${words[i+2]}`)
    }
    return trigrams
  }

  const newGrams = getTriGrams(newResponse)

  let maxSimilarity = 0
  let mostSimilarIndex = -1

  for (let i = 0; i < cachedResponses.length; i++) {
    const cachedGrams = getTriGrams(cachedResponses[i])
    const intersection = new Set([...newGrams].filter(x => cachedGrams.has(x)))
    const union = new Set([...newGrams, ...cachedGrams])
    const similarity = union.size > 0 ? intersection.size / union.size : 0

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity
      mostSimilarIndex = i
    }
  }

  return {
    isSimilar: maxSimilarity > 0.7, // 70% de similaridade e muito
    similarity: maxSimilarity,
    mostSimilarIndex
  }
}

/**
 * Gerar variacao de temperatura baseada no historico
 * Se respostas anteriores foram muito similares, aumenta a temperatura
 */
export function adjustTemperature(
  baseTemperature: number,
  recentSimilarities: number[]
): number {
  if (recentSimilarities.length === 0) return baseTemperature

  const avgSimilarity = recentSimilarities.reduce((a, b) => a + b, 0) / recentSimilarities.length

  // Se similaridade media > 50%, aumentar temperatura
  if (avgSimilarity > 0.5) {
    const boost = (avgSimilarity - 0.5) * 0.4 // Max boost de 0.2
    return Math.min(1.0, baseTemperature + boost)
  }

  return baseTemperature
}

/**
 * Selecionar estilo de resposta variado
 */
export function selectResponseStyle(userId: string): {
  useEmoji: boolean
  useBulletPoints: boolean
  useNumberedLists: boolean
  useHeaders: boolean
  verbosity: 'concise' | 'moderate' | 'detailed'
} {
  const seed = generateDailySeed(userId)

  return {
    useEmoji: (seed % 3) === 0,
    useBulletPoints: (seed % 2) === 0,
    useNumberedLists: (seed % 2) === 1,
    useHeaders: true, // Sempre usar headers para organizacao
    verbosity: ['concise', 'moderate', 'detailed'][seed % 3] as 'concise' | 'moderate' | 'detailed'
  }
}

/**
 * Gerar instrucoes de estilo para o prompt
 */
export function generateStyleInstructions(userId: string): string {
  const style = selectResponseStyle(userId)

  const instructions: string[] = []

  if (style.useEmoji) {
    instructions.push('Use emojis relevantes para destacar pontos importantes')
  }

  if (style.useBulletPoints) {
    instructions.push('Organize informacoes em bullet points quando apropriado')
  } else if (style.useNumberedLists) {
    instructions.push('Use listas numeradas para sequencias e etapas')
  }

  switch (style.verbosity) {
    case 'concise':
      instructions.push('Seja conciso e direto ao ponto, sem informacoes redundantes')
      break
    case 'moderate':
      instructions.push('Equilibre detalhamento com clareza')
      break
    case 'detailed':
      instructions.push('Forneca explicacoes detalhadas e abrangentes')
      break
  }

  return instructions.join('. ') + '.'
}
