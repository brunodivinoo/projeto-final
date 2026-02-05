// Detector de Complexidade para Roteamento Inteligente de Modelos
// Analisa a pergunta do usuario e determina qual modelo usar

// ==========================================
// TIPOS
// ==========================================

export type ComplexityLevel = 'simples' | 'moderada' | 'complexa' | 'especializada'

export interface ComplexityAnalysis {
  nivel: ComplexityLevel
  score: number // 0-100
  fatores: string[]
  modeloRecomendado: 'o4-mini' | 'gpt-5.2' | 'claude-opus'
  reasoningEffort?: 'low' | 'medium' | 'high'
  motivo: string
}

// ==========================================
// PALAVRAS-CHAVE POR CATEGORIA
// ==========================================

// Termos que indicam questoes simples
const TERMOS_SIMPLES = [
  'o que e', 'o que é', 'defina', 'definicao', 'definição',
  'explique', 'resuma', 'liste', 'quais sao', 'quais são',
  'como funciona', 'qual a diferenca', 'qual a diferença',
  'cite', 'mencione', 'descreva', 'brevemente'
]

// Termos que indicam questoes de complexidade moderada
const TERMOS_MODERADOS = [
  'compare', 'relacione', 'analise', 'avalie',
  'fisiopatologia', 'mecanismo', 'patogenese', 'patogênese',
  'diagnostico diferencial', 'diagnóstico diferencial',
  'tratamento', 'manejo', 'conduta', 'abordagem'
]

// Termos que indicam questoes complexas
const TERMOS_COMPLEXOS = [
  'caso clinico', 'caso clínico', 'paciente com',
  'diagnostique', 'trate', 'conduza',
  'prova de residencia', 'prova de residência',
  'questao', 'questão', 'enare', 'usp', 'unifesp',
  'discussao', 'discussão', 'detalhadamente',
  'correlacione', 'integre', 'sintetize'
]

// Termos que indicam questoes especializadas (requer Opus)
const TERMOS_ESPECIALIZADOS = [
  'pesquisa', 'evidencia', 'evidência', 'meta-analise', 'meta-análise',
  'guideline', 'diretriz', 'consenso', 'protocolo',
  'cite fontes', 'referencias', 'referências', 'artigo',
  'uptodate', 'pubmed', 'cochrane',
  'web search', 'busca na web', 'pesquise online'
]

// Especialidades medicas que aumentam complexidade
const ESPECIALIDADES_COMPLEXAS = [
  'neurologia', 'neurocirurgia', 'cardiologia',
  'oncologia', 'hematologia', 'reumatologia',
  'endocrinologia', 'nefrologia', 'hepatologia',
  'infectologia', 'imunologia', 'genetica', 'genética'
]

// Indicadores de artefatos
const INDICADORES_ARTEFATOS = {
  flashcard: ['flashcard', 'flashcards', 'cartoes', 'cartões', 'anki'],
  questao: ['questao', 'questão', 'questoes', 'questões', 'prova', 'simulado'],
  resumo: ['resumo', 'resumir', 'sintetize', 'sintetizar'],
  mapa: ['mapa mental', 'mapa conceitual', 'diagrama', 'fluxograma']
}

// ==========================================
// FUNCAO PRINCIPAL DE ANALISE
// ==========================================

export function analisarComplexidade(
  mensagem: string,
  contexto?: {
    historicoMensagens?: number
    temImagem?: boolean
    temPdf?: boolean
    plano?: 'premium' | 'residencia'
  }
): ComplexityAnalysis {
  const texto = mensagem.toLowerCase()
  const fatores: string[] = []
  let score = 0

  // ==========================================
  // 1. ANALISE DE TERMOS
  // ==========================================

  // Verificar termos simples
  const termosSimples = TERMOS_SIMPLES.filter(t => texto.includes(t))
  if (termosSimples.length > 0) {
    score += 10
    fatores.push(`Termos simples: ${termosSimples.join(', ')}`)
  }

  // Verificar termos moderados
  const termosModerados = TERMOS_MODERADOS.filter(t => texto.includes(t))
  if (termosModerados.length > 0) {
    score += 25 * termosModerados.length
    fatores.push(`Termos moderados: ${termosModerados.join(', ')}`)
  }

  // Verificar termos complexos
  const termosComplexos = TERMOS_COMPLEXOS.filter(t => texto.includes(t))
  if (termosComplexos.length > 0) {
    score += 35 * termosComplexos.length
    fatores.push(`Termos complexos: ${termosComplexos.join(', ')}`)
  }

  // Verificar termos especializados
  const termosEspecializados = TERMOS_ESPECIALIZADOS.filter(t => texto.includes(t))
  if (termosEspecializados.length > 0) {
    score += 50 * termosEspecializados.length
    fatores.push(`Termos especializados: ${termosEspecializados.join(', ')}`)
  }

  // Verificar especialidades complexas
  const especialidades = ESPECIALIDADES_COMPLEXAS.filter(e => texto.includes(e))
  if (especialidades.length > 0) {
    score += 15 * especialidades.length
    fatores.push(`Especialidades: ${especialidades.join(', ')}`)
  }

  // ==========================================
  // 2. ANALISE DE COMPRIMENTO
  // ==========================================

  const palavras = texto.split(/\s+/).length

  if (palavras > 200) {
    score += 30
    fatores.push('Mensagem longa (>200 palavras)')
  } else if (palavras > 100) {
    score += 20
    fatores.push('Mensagem media (>100 palavras)')
  } else if (palavras > 50) {
    score += 10
    fatores.push('Mensagem curta-media (>50 palavras)')
  }

  // ==========================================
  // 3. ANALISE DE CONTEXTO
  // ==========================================

  if (contexto?.temImagem) {
    score += 25
    fatores.push('Contem imagem para analise')
  }

  if (contexto?.temPdf) {
    score += 35
    fatores.push('Contem PDF para analise')
  }

  if (contexto?.historicoMensagens && contexto.historicoMensagens > 10) {
    score += 15
    fatores.push('Conversa longa com contexto')
  }

  // ==========================================
  // 4. DETECCAO DE ARTEFATOS
  // ==========================================

  let tipoArtefato: string | null = null

  for (const [tipo, indicadores] of Object.entries(INDICADORES_ARTEFATOS)) {
    if (indicadores.some(ind => texto.includes(ind))) {
      tipoArtefato = tipo
      break
    }
  }

  if (tipoArtefato === 'flashcard') {
    // Flashcards sao simples, o4-mini da conta
    score = Math.min(score, 40)
    fatores.push('Geracao de flashcards (tarefa estruturada)')
  } else if (tipoArtefato === 'questao') {
    // Questoes precisam de raciocinio
    score = Math.max(score, 60)
    fatores.push('Geracao de questoes (requer raciocinio)')
  } else if (tipoArtefato === 'resumo') {
    // Resumos dependem do tema
    score = Math.max(score, 35)
    fatores.push('Geracao de resumo')
  }

  // ==========================================
  // 5. DETERMINAR NIVEL E MODELO
  // ==========================================

  // Normalizar score (0-100)
  score = Math.min(100, Math.max(0, score))

  let nivel: ComplexityLevel
  let modeloRecomendado: 'o4-mini' | 'gpt-5.2' | 'claude-opus'
  let reasoningEffort: 'low' | 'medium' | 'high' | undefined
  let motivo: string

  if (score < 25) {
    nivel = 'simples'
    modeloRecomendado = 'o4-mini'
    reasoningEffort = 'low'
    motivo = 'Pergunta simples e direta - o4-mini e suficiente'
  } else if (score < 50) {
    nivel = 'moderada'
    modeloRecomendado = 'o4-mini'
    reasoningEffort = 'medium'
    motivo = 'Complexidade moderada - o4-mini com raciocinio medio'
  } else if (score < 75) {
    nivel = 'complexa'
    modeloRecomendado = 'gpt-5.2'
    reasoningEffort = 'medium'
    motivo = 'Pergunta complexa - gpt-5.2 para raciocinio avancado'
  } else {
    nivel = 'especializada'

    // Para plano residencia com pesquisa, usar Claude Opus
    if (contexto?.plano === 'residencia' && termosEspecializados.length > 0) {
      modeloRecomendado = 'claude-opus'
      motivo = 'Questao especializada com pesquisa - Claude Opus com Web Search'
    } else {
      modeloRecomendado = 'gpt-5.2'
      reasoningEffort = 'high'
      motivo = 'Questao especializada - gpt-5.2 com raciocinio alto'
    }
  }

  // Override para contextos especiais
  if (contexto?.temPdf || contexto?.temImagem) {
    if (modeloRecomendado === 'o4-mini') {
      modeloRecomendado = 'gpt-5.2'
      reasoningEffort = 'medium'
      motivo = 'Analise de midia - gpt-5.2 para melhor processamento'
    }
  }

  return {
    nivel,
    score,
    fatores,
    modeloRecomendado,
    reasoningEffort,
    motivo
  }
}

// ==========================================
// FUNCAO PARA DETERMINAR MODELO POR TAREFA
// ==========================================

export type TarefaIA =
  | 'chat_simples'
  | 'chat_complexo'
  | 'flashcards'
  | 'questoes'
  | 'resumo'
  | 'analise_imagem'
  | 'analise_pdf'
  | 'pesquisa_web'

export function getModeloPorTarefa(
  tarefa: TarefaIA,
  plano: 'premium' | 'residencia'
): { modelo: string; reasoningEffort?: 'low' | 'medium' | 'high' } {
  switch (tarefa) {
    case 'chat_simples':
      return { modelo: 'o4-mini', reasoningEffort: 'low' }

    case 'chat_complexo':
      return { modelo: 'gpt-5.2', reasoningEffort: 'medium' }

    case 'flashcards':
      // Flashcards sao estruturados, o4-mini da conta
      return { modelo: 'o4-mini', reasoningEffort: 'low' }

    case 'questoes':
      // Questoes precisam de raciocinio para criar distratores bons
      return { modelo: 'gpt-5.2', reasoningEffort: 'high' }

    case 'resumo':
      return { modelo: 'o4-mini', reasoningEffort: 'medium' }

    case 'analise_imagem':
      // Vision com gpt-4o
      return { modelo: 'gpt-4o' }

    case 'analise_pdf':
      // PDF precisa de mais contexto
      return { modelo: 'gpt-5.2', reasoningEffort: 'medium' }

    case 'pesquisa_web':
      // Pesquisa web so com Claude Opus (Web Search nativo)
      if (plano === 'residencia') {
        return { modelo: 'claude-opus-4-5-20251101' }
      }
      // Fallback para gpt-5.2 sem web search
      return { modelo: 'gpt-5.2', reasoningEffort: 'high' }

    default:
      return { modelo: 'o4-mini', reasoningEffort: 'medium' }
  }
}

// ==========================================
// FUNCAO PARA ESTIMAR CUSTO
// ==========================================

export function estimarCustoPorComplexidade(
  analysis: ComplexityAnalysis,
  tokensEstimados: number = 2000
): { modelo: string; custoEstimadoUSD: number; custoEstimadoBRL: number } {
  const TAXA_BRL = 5.0

  let custoInput: number
  let custoOutput: number

  switch (analysis.modeloRecomendado) {
    case 'o4-mini':
      custoInput = 1.10 / 1_000_000
      custoOutput = 4.40 / 1_000_000
      break
    case 'gpt-5.2':
      custoInput = 2.50 / 1_000_000
      custoOutput = 10.00 / 1_000_000
      break
    case 'claude-opus':
      custoInput = 5.00 / 1_000_000
      custoOutput = 25.00 / 1_000_000
      break
    default:
      custoInput = 2.50 / 1_000_000
      custoOutput = 10.00 / 1_000_000
  }

  const custoEstimadoUSD = (tokensEstimados * custoInput) + (tokensEstimados * custoOutput)

  return {
    modelo: analysis.modeloRecomendado,
    custoEstimadoUSD,
    custoEstimadoBRL: custoEstimadoUSD * TAXA_BRL
  }
}

// ==========================================
// EXPORTS
// ==========================================

export default analisarComplexidade
