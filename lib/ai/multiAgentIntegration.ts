// Multi-Agent Integration - Integra as crews do LangChain na API principal
// Detecta quando usar multi-agentes e executa a crew apropriada

import { generateStudyPlan, type StudyPlanRequest, type StudyPlanResult } from '@/lib/agents/crews/study-plan-crew'
import { generateContent, type ContentRequest, type ContentCrewResult } from '@/lib/agents/crews/content-crew'

// ==========================================
// TIPOS
// ==========================================

export type MultiAgentTaskType = 'study_plan' | 'content_complex' | 'none'

export interface MultiAgentDetectionResult {
  shouldUseAgents: boolean
  taskType: MultiAgentTaskType
  confidence: number
  extractedParams: Record<string, unknown>
  reason: string
}

export interface MultiAgentExecutionResult {
  success: boolean
  response: string
  executionLog?: string[]
  artifacts?: {
    type: string
    data: unknown
  }
  error?: string
}

// ==========================================
// DETECTOR DE TAREFAS COMPLEXAS
// ==========================================

/**
 * Detecta se a mensagem requer multi-agentes
 * Retorna true para tarefas que se beneficiam de coordenacao entre agentes
 */
export function detectMultiAgentTask(mensagem: string): MultiAgentDetectionResult {
  const msgLower = mensagem.toLowerCase()

  // ==========================================
  // 1. PLANO DE ESTUDOS (requer pesquisa + planejamento + criacao)
  // ==========================================
  const planoKeywords = [
    'plano de estudo',
    'plano de estudos',
    'cronograma de estudo',
    'cronograma de estudos',
    'planejamento de estudo',
    'planejamento de estudos',
    'rotina de estudo',
    'rotina de estudos',
    'organizar meus estudos',
    'organizar meu estudo',
    'como estudar para',
    'como me preparar para',
    'preparacao para prova',
    'preparação para prova',
    'preparar para residencia',
    'preparar para residência',
    'monte um plano',
    'criar um plano',
    'crie um plano',
    'elabore um plano',
    'fazer um plano'
  ]

  for (const keyword of planoKeywords) {
    if (msgLower.includes(keyword)) {
      // Extrair parametros do plano
      const params = extractStudyPlanParams(mensagem)
      return {
        shouldUseAgents: true,
        taskType: 'study_plan',
        confidence: 0.95,
        extractedParams: params,
        reason: `Detectado pedido de plano de estudos: "${keyword}"`
      }
    }
  }

  // ==========================================
  // 2. CONTEUDO COMPLEXO (multiplos tipos ou grande quantidade)
  // ==========================================

  // Detectar pedido de multiplos tipos de conteudo
  const tiposConteudo = {
    questoes: msgLower.includes('quest') || msgLower.includes('pergunta'),
    flashcards: msgLower.includes('flash') || msgLower.includes('card'),
    resumo: msgLower.includes('resum') || msgLower.includes('sintetiz')
  }

  const tiposSolicitados = Object.values(tiposConteudo).filter(Boolean).length

  // Se pede 2 ou mais tipos, usar multi-agentes
  if (tiposSolicitados >= 2) {
    const params = extractContentParams(mensagem, tiposConteudo)
    return {
      shouldUseAgents: true,
      taskType: 'content_complex',
      confidence: 0.85,
      extractedParams: params,
      reason: `Detectados ${tiposSolicitados} tipos de conteudo solicitados`
    }
  }

  // Detectar grande quantidade (10+ questoes ou 20+ flashcards)
  const quantidadeMatch = msgLower.match(/(\d+)\s*(quest|flash)/i)
  if (quantidadeMatch) {
    const quantidade = parseInt(quantidadeMatch[1])
    const tipo = quantidadeMatch[2].toLowerCase()

    const limiteComplexo = tipo.startsWith('quest') ? 10 : 20

    if (quantidade >= limiteComplexo) {
      const params = extractContentParams(mensagem, tiposConteudo)
      return {
        shouldUseAgents: true,
        taskType: 'content_complex',
        confidence: 0.80,
        extractedParams: { ...params, quantidade },
        reason: `Grande quantidade solicitada: ${quantidade} ${tipo}`
      }
    }
  }

  // Detectar pedido de conteudo "completo" ou "detalhado"
  const complexKeywords = [
    'conteudo completo',
    'conteúdo completo',
    'material completo',
    'estudo completo',
    'material de estudo sobre',
    'me ensine tudo sobre',
    'quero aprender tudo sobre',
    'explicacao completa',
    'explicação completa'
  ]

  for (const keyword of complexKeywords) {
    if (msgLower.includes(keyword)) {
      const params = extractContentParams(mensagem, tiposConteudo)
      return {
        shouldUseAgents: true,
        taskType: 'content_complex',
        confidence: 0.75,
        extractedParams: params,
        reason: `Detectado pedido de conteudo complexo: "${keyword}"`
      }
    }
  }

  // ==========================================
  // 3. NAO REQUER MULTI-AGENTES
  // ==========================================
  return {
    shouldUseAgents: false,
    taskType: 'none',
    confidence: 0,
    extractedParams: {},
    reason: 'Tarefa simples - usar fluxo normal'
  }
}

// ==========================================
// EXTRATORES DE PARAMETROS
// ==========================================

function extractStudyPlanParams(mensagem: string): Partial<StudyPlanRequest> {
  const msgLower = mensagem.toLowerCase()
  const params: Partial<StudyPlanRequest> = {
    objetivo: mensagem
  }

  // Detectar prova alvo
  const provas = [
    { pattern: /residencia|residência/i, value: 'Residência Médica' },
    { pattern: /revalida/i, value: 'REVALIDA' },
    { pattern: /enade/i, value: 'ENADE' },
    { pattern: /usp/i, value: 'USP' },
    { pattern: /unicamp/i, value: 'UNICAMP' },
    { pattern: /unifesp/i, value: 'UNIFESP' },
    { pattern: /santa casa/i, value: 'Santa Casa' },
    { pattern: /enare/i, value: 'ENARE' },
    { pattern: /sus/i, value: 'Prova SUS' }
  ]

  for (const prova of provas) {
    if (prova.pattern.test(mensagem)) {
      params.provaAlvo = prova.value
      break
    }
  }

  // Detectar horas disponiveis
  const horasMatch = msgLower.match(/(\d+)\s*(h|hora)/i)
  if (horasMatch) {
    params.horasDisponiveis = parseInt(horasMatch[1])
  } else {
    params.horasDisponiveis = 4 // Default
  }

  // Detectar dias ate a prova
  const diasMatch = msgLower.match(/(\d+)\s*(dia|semana|mes|mês)/i)
  if (diasMatch) {
    let dias = parseInt(diasMatch[1])
    const unidade = diasMatch[2].toLowerCase()

    if (unidade.includes('semana')) dias *= 7
    else if (unidade.includes('mes') || unidade.includes('mês')) dias *= 30

    const dataProva = new Date()
    dataProva.setDate(dataProva.getDate() + dias)
    params.dataProva = dataProva.toISOString().split('T')[0]
  }

  // Detectar especialidade/area
  const especialidades = [
    'cardiologia', 'neurologia', 'pediatria', 'ginecologia',
    'cirurgia', 'clinica medica', 'clínica médica', 'ortopedia',
    'dermatologia', 'psiquiatria', 'oftalmologia', 'urologia',
    'nefrologia', 'pneumologia', 'gastroenterologia', 'endocrinologia',
    'reumatologia', 'infectologia', 'oncologia', 'hematologia'
  ]

  for (const esp of especialidades) {
    if (msgLower.includes(esp)) {
      params.areasFortes = params.areasFortes || []
      // Se menciona como foco, pode ser area fraca a melhorar
      if (msgLower.includes('melhorar') || msgLower.includes('fraco') || msgLower.includes('dificuldade')) {
        params.areasFracas = [esp]
      }
      break
    }
  }

  // Nivel de detalhe
  if (msgLower.includes('detalhado') || msgLower.includes('completo')) {
    params.nivelDetalhe = 'completo'
  } else if (msgLower.includes('basico') || msgLower.includes('simples')) {
    params.nivelDetalhe = 'basico'
  } else {
    params.nivelDetalhe = 'detalhado'
  }

  // Incluir material
  params.incluirMaterial = msgLower.includes('material') ||
                           msgLower.includes('questoes') ||
                           msgLower.includes('flashcard')

  return params
}

function extractContentParams(
  mensagem: string,
  tiposDetectados: { questoes: boolean; flashcards: boolean; resumo: boolean }
): Partial<ContentRequest> {
  const msgLower = mensagem.toLowerCase()

  // Extrair tipos
  const tipos: Array<'questoes' | 'flashcards' | 'resumo'> = []
  if (tiposDetectados.questoes) tipos.push('questoes')
  if (tiposDetectados.flashcards) tipos.push('flashcards')
  if (tiposDetectados.resumo) tipos.push('resumo')

  // Se nenhum tipo especifico, criar todos
  if (tipos.length === 0) {
    tipos.push('questoes', 'flashcards', 'resumo')
  }

  // Extrair tema (remover palavras-chave de acao)
  let tema = mensagem
    .replace(/gere?|crie?|faca|faça|elabore?|monte?|produza?/gi, '')
    .replace(/\d+\s*(quest|flash|card)/gi, '')
    .replace(/questoes?|flashcards?|resumos?|sobre|de|para|com/gi, '')
    .replace(/material|conteudo|conteúdo|completo|detalhado/gi, '')
    .trim()

  // Se tema ficou muito curto, usar a mensagem original
  if (tema.length < 5) {
    tema = mensagem.substring(0, 100)
  }

  // Extrair quantidades
  const quantidades: { questoes?: number; flashcards?: number } = {}

  const questoesMatch = msgLower.match(/(\d+)\s*quest/i)
  if (questoesMatch) {
    quantidades.questoes = Math.min(parseInt(questoesMatch[1]), 20)
  }

  const flashMatch = msgLower.match(/(\d+)\s*flash/i)
  if (flashMatch) {
    quantidades.flashcards = Math.min(parseInt(flashMatch[1]), 30)
  }

  // Dificuldade
  let dificuldade: 'facil' | 'media' | 'dificil' | 'mista' = 'mista'
  if (msgLower.includes('facil') || msgLower.includes('fácil') || msgLower.includes('basico')) {
    dificuldade = 'facil'
  } else if (msgLower.includes('dificil') || msgLower.includes('difícil') || msgLower.includes('avancado') || msgLower.includes('avançado')) {
    dificuldade = 'dificil'
  } else if (msgLower.includes('medio') || msgLower.includes('médio') || msgLower.includes('intermediario')) {
    dificuldade = 'media'
  }

  return {
    tema,
    tipos,
    quantidades,
    dificuldade,
    pesquisarAntees: msgLower.includes('atualizado') || msgLower.includes('recente'),
    revisarConteudo: true
  }
}

// ==========================================
// EXECUTOR DE MULTI-AGENTES
// ==========================================

/**
 * Executa a tarefa usando multi-agentes
 */
export async function executeMultiAgentTask(
  taskType: MultiAgentTaskType,
  params: Record<string, unknown>
): Promise<MultiAgentExecutionResult> {
  console.log(`[MultiAgent] Executando tarefa: ${taskType}`)
  console.log(`[MultiAgent] Parametros:`, JSON.stringify(params, null, 2))

  try {
    switch (taskType) {
      case 'study_plan': {
        const request: StudyPlanRequest = {
          objetivo: params.objetivo as string || 'Preparacao para prova',
          provaAlvo: params.provaAlvo as string,
          dataProva: params.dataProva as string,
          horasDisponiveis: params.horasDisponiveis as number || 4,
          areasFortes: params.areasFortes as string[],
          areasFracas: params.areasFracas as string[],
          incluirMaterial: params.incluirMaterial as boolean || false,
          nivelDetalhe: params.nivelDetalhe as 'basico' | 'detalhado' | 'completo' || 'detalhado'
        }

        const result: StudyPlanResult = await generateStudyPlan(request)

        return {
          success: true,
          response: result.formatted,
          executionLog: result.executionLog,
          artifacts: {
            type: 'plano_estudos',
            data: result.plano
          }
        }
      }

      case 'content_complex': {
        const request: ContentRequest = {
          tema: params.tema as string || 'Medicina',
          tipos: params.tipos as Array<'questoes' | 'flashcards' | 'resumo'> || ['questoes', 'flashcards'],
          quantidades: params.quantidades as { questoes?: number; flashcards?: number },
          dificuldade: params.dificuldade as 'facil' | 'media' | 'dificil' | 'mista' || 'mista',
          contexto: params.contexto as string,
          pesquisarAntees: params.pesquisarAntees as boolean || false,
          revisarConteudo: params.revisarConteudo as boolean || true
        }

        const result: ContentCrewResult = await generateContent(request)

        return {
          success: true,
          response: result.formatted,
          executionLog: result.executionLog,
          artifacts: {
            type: 'conteudo_completo',
            data: {
              conteudos: result.conteudos,
              revisoes: result.revisoes
            }
          }
        }
      }

      default:
        return {
          success: false,
          response: '',
          error: `Tipo de tarefa desconhecido: ${taskType}`
        }
    }
  } catch (error) {
    console.error(`[MultiAgent] Erro ao executar ${taskType}:`, error)

    return {
      success: false,
      response: '',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// ==========================================
// FUNCAO PRINCIPAL DE INTEGRACAO
// ==========================================

/**
 * Verifica se deve usar multi-agentes e executa se necessario
 * Retorna null se nao deve usar multi-agentes
 */
export async function tryMultiAgentExecution(
  mensagem: string
): Promise<MultiAgentExecutionResult | null> {
  // Detectar se deve usar multi-agentes
  const detection = detectMultiAgentTask(mensagem)

  console.log(`[MultiAgent] Deteccao:`, detection)

  if (!detection.shouldUseAgents) {
    return null
  }

  // Executar com multi-agentes
  console.log(`[MultiAgent] Usando multi-agentes para: ${detection.reason}`)

  const result = await executeMultiAgentTask(
    detection.taskType,
    detection.extractedParams
  )

  return result
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  detectMultiAgentTask,
  executeMultiAgentTask,
  tryMultiAgentExecution
}
