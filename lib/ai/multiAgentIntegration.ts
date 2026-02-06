// Multi-Agent Integration - Integra as crews do LangChain na API principal
// Detecta quando usar multi-agentes e executa a crew apropriada

import { generateStudyPlan, type StudyPlanRequest, type StudyPlanResult } from '@/lib/agents/crews/study-plan-crew'
import { generateContent, type ContentRequest, type ContentCrewResult } from '@/lib/agents/crews/content-crew'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { buscarImagensComFallback } from '@/lib/services/serperImageService'

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
    resumo: msgLower.includes('resum') || msgLower.includes('sintetiz'),
    diagrama: msgLower.includes('diagrama') || msgLower.includes('mapa mental') || msgLower.includes('mapa conceitual'),
    fluxograma: msgLower.includes('fluxograma') || msgLower.includes('flowchart') || msgLower.includes('algoritmo'),
    organograma: msgLower.includes('organograma') || msgLower.includes('arvore') || msgLower.includes('árvore') || msgLower.includes('hierarquia') || msgLower.includes('classificação') || msgLower.includes('classificacao')
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
  tiposDetectados: { questoes: boolean; flashcards: boolean; resumo: boolean; diagrama?: boolean; fluxograma?: boolean; organograma?: boolean }
): Partial<ContentRequest> & { visuais?: string[] } {
  const msgLower = mensagem.toLowerCase()

  // Extrair tipos de conteudo textual
  const tipos: Array<'questoes' | 'flashcards' | 'resumo'> = []
  if (tiposDetectados.questoes) tipos.push('questoes')
  if (tiposDetectados.flashcards) tipos.push('flashcards')
  if (tiposDetectados.resumo) tipos.push('resumo')

  // Extrair tipos visuais (diagrama, fluxograma, organograma)
  const visuais: string[] = []
  if (tiposDetectados.diagrama) visuais.push('diagrama')
  if (tiposDetectados.fluxograma) visuais.push('fluxograma')
  if (tiposDetectados.organograma) visuais.push('organograma')

  // Se nenhum tipo especifico, criar questoes + flashcards
  if (tipos.length === 0 && visuais.length === 0) {
    tipos.push('questoes', 'flashcards')
  }

  // Se só tem visuais sem texto, adicionar resumo como base
  if (tipos.length === 0 && visuais.length > 0) {
    tipos.push('resumo')
  }

  // Extrair tema - PRIORIDADE: buscar o tópico após "sobre" ou "de/do/da"
  // Isso é mais confiável do que remover palavras-chave
  let tema = ''

  // Estratégia 1: Extrair tópico após "sobre" (mais confiável)
  const sobreMatch = mensagem.match(/sobre\s+(?:o\s+|a\s+|os\s+|as\s+)?(.{3,100}?)(?:\s*$|[?.])/i)
  if (sobreMatch) {
    tema = sobreMatch[1].trim()
  }

  // Estratégia 2: Extrair tópico após "de/do/da" no final da frase
  if (!tema || tema.length < 5) {
    const deMatch = mensagem.match(/(?:cards?|questões?|questoes?|flashcards?|diagramas?|fluxogramas?|organogramas?|resumos?)\s+(?:sobre\s+|d[eoa]s?\s+)(.{3,100}?)$/i)
    if (deMatch) {
      tema = deMatch[1].trim()
    }
  }

  // Estratégia 3: Fallback - remover palavras-chave e limpar
  if (!tema || tema.length < 5) {
    tema = mensagem
      .replace(/^(gere?|crie?|cria|fac?a|faça|elabore?|monte?|produza?|me\s+(?:dê|de|fale|ensine))\s+/gi, '')
      .replace(/\b(pra\s+mi[mn]|para\s+mi[mn]|por\s+favor)\b/gi, '')
      .replace(/\b\d+\s*(questões?|questoes?|flashcards?|cards?|diagramas?|fluxogramas?|organogramas?)\b/gi, '')
      .replace(/\b(questões?|questoes?|flashcards?|cards?|diagramas?|fluxogramas?|organogramas?|resumos?|mapas?\s+mentais?)\b/gi, '')
      .replace(/\b(material|conteudo|conteúdo|completo|detalhado)\b/gi, '')
      .replace(/\b(sobre|para|com)\b/gi, '')
      .replace(/,\s*,/g, ',')       // limpar vírgulas duplas
      .replace(/^[\s,e]+|[\s,e]+$/g, '') // limpar vírgulas, "e" e espaços no início/fim
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Capitalizar primeira letra
  if (tema.length > 0) {
    tema = tema.charAt(0).toUpperCase() + tema.slice(1)
  }

  // Último fallback: usar mensagem original cortada
  if (tema.length < 3) {
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
    visuais,
    pesquisarAntees: msgLower.includes('atualizado') || msgLower.includes('recente'),
    revisarConteudo: true
  }
}

// ==========================================
// GERADOR DE DIAGRAMAS COM IA (Gemini Flash)
// ==========================================

const MERMAID_STYLE_BLOCK = `
    classDef default fill:#1e3a5f,stroke:#60a5fa,stroke-width:2px,color:#fff,font-size:13px
    classDef root fill:#7c3aed,stroke:#a78bfa,stroke-width:3px,color:#fff,font-size:15px,font-weight:bold
    classDef highlight fill:#065f46,stroke:#34d399,stroke-width:2px,color:#fff
    classDef decision fill:#92400e,stroke:#f59e0b,stroke-width:2px,color:#fff
    classDef danger fill:#991b1b,stroke:#f87171,stroke-width:2px,color:#fff
    classDef success fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff
    classDef info fill:#1e40af,stroke:#60a5fa,stroke-width:2px,color:#fff`

/**
 * Gera diagrama Mermaid usando Gemini Flash (rápido e econômico)
 * Retorna código Mermaid real baseado no tema médico
 */
async function generateMermaidWithAI(
  tema: string,
  tipo: 'diagrama' | 'fluxograma' | 'organograma'
): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048
      }
    })

    const tipoInstrucao = {
      diagrama: 'um mapa conceitual/diagrama relacional mostrando os principais conceitos, relações e subdivisões. Use graph TD.',
      fluxograma: 'um fluxograma clínico/diagnóstico com decisões (losangos), ações (retângulos) e início/fim (estádios). Use flowchart TD. Inclua setas com labels descritivos nas decisões (ex: |"Positivo"|).',
      organograma: 'uma árvore hierárquica de classificação mostrando grupos, subgrupos e categorias. Use graph TD.'
    }

    const prompt = `Gere APENAS código Mermaid (sem explicação, sem markdown fences) para ${tipoInstrucao[tipo]}

TEMA MÉDICO: ${tema}

REGRAS OBRIGATÓRIAS:
1. Gere conteúdo REAL e preciso sobre "${tema}" - use terminologia médica correta
2. Mínimo 10 nós, máximo 20 nós
3. Use IDs curtos (A, B, C1, C2, D1 etc.)
4. Texto dos nós entre aspas duplas: A["Texto aqui"]
5. Use [["texto"]] para nó raiz principal
6. NÃO use caracteres especiais como parênteses dentro dos nós
7. NÃO use emojis nos nós
8. Cada nó deve ter conteúdo médico real e específico do tema
9. Ao final, adicione as classes:
${MERMAID_STYLE_BLOCK}
10. Aplique class ao nó raiz: class A root
11. ${tipo === 'fluxograma' ? 'Aplique class aos nós de decisão: class X,Y decision' : 'Aplique class highlight aos nós mais importantes'}

Responda APENAS com o código Mermaid, começando com "graph TD" ou "flowchart TD".`

    const result = await model.generateContent(prompt)
    let mermaidCode = result.response.text().trim()

    // Limpar fences markdown se presentes
    mermaidCode = mermaidCode
      .replace(/^```mermaid\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    // Garantir que começa com graph ou flowchart
    if (!mermaidCode.startsWith('graph') && !mermaidCode.startsWith('flowchart')) {
      // Tentar encontrar graph/flowchart no início de alguma linha
      const headerMatch = mermaidCode.match(/^(graph|flowchart)\s+(TD|LR|BT|RL)/m)
      if (headerMatch) {
        // Remover lixo antes do header
        mermaidCode = mermaidCode.substring(mermaidCode.indexOf(headerMatch[0]))
      } else {
        // Adicionar header padrão
        const header = tipo === 'fluxograma' ? 'flowchart TD' : 'graph TD'
        mermaidCode = header + '\n' + mermaidCode
      }
    }

    // Garantir que tem os estilos
    if (!mermaidCode.includes('classDef')) {
      mermaidCode += '\n' + MERMAID_STYLE_BLOCK
    }

    console.log(`[DiagramAI] Gerado ${tipo} sobre "${tema}" com sucesso (${mermaidCode.length} chars)`)
    return mermaidCode
  } catch (error) {
    console.error(`[DiagramAI] Erro ao gerar ${tipo}:`, error)
    // Fallback para template melhorado
    return generateFallbackMermaid(tema, tipo)
  }
}

/**
 * Fallback: gera template Mermaid melhorado quando a IA falha
 */
function generateFallbackMermaid(tema: string, tipo: 'diagrama' | 'fluxograma' | 'organograma'): string {
  const temaLimpo = tema.replace(/["\(\)]/g, '').substring(0, 60)

  if (tipo === 'fluxograma') {
    return `flowchart TD
    START(["Paciente com suspeita de ${temaLimpo}"]) --> ANAMNESE["Anamnese Dirigida"]
    ANAMNESE --> EF["Exame Físico"]
    EF --> EXAMES{"Exames Complementares"}
    EXAMES -->|"Alterados"| DIAG["Diagnóstico Confirmado"]
    EXAMES -->|"Normais"| INVEST["Investigação Adicional"]
    INVEST --> EXAMES2{"Exames Específicos"}
    EXAMES2 -->|"Positivo"| DIAG
    EXAMES2 -->|"Negativo"| OBS["Observação e Seguimento"]
    DIAG --> CLASS["Classificação / Estadiamento"]
    CLASS --> TRAT["Definir Conduta Terapêutica"]
    TRAT --> SEG["Acompanhamento"]
    SEG --> REAV{"Reavaliação Clínica"}
    REAV -->|"Boa resposta"| ALTA(["Alta / Manutenção"])
    REAV -->|"Sem resposta"| TRAT
${MERMAID_STYLE_BLOCK}
    class START,ALTA success
    class EXAMES,EXAMES2,REAV decision`
  }

  if (tipo === 'organograma') {
    return `graph TD
    A[["${temaLimpo}"]] --> B["Classificação"]
    A --> C["Aspectos Clínicos"]
    A --> D["Tratamento"]
    B --> B1["Tipo I"]
    B --> B2["Tipo II"]
    B --> B3["Tipo III"]
    C --> C1["Sinais e Sintomas"]
    C --> C2["Diagnóstico"]
    C --> C3["Diagnóstico Diferencial"]
    D --> D1["Farmacológico"]
    D --> D2["Não Farmacológico"]
    D --> D3["Cirúrgico"]
    C2 --> C2a["Laboratorial"]
    C2 --> C2b["Imagem"]
${MERMAID_STYLE_BLOCK}
    class A root
    class B,C,D highlight`
  }

  // diagrama padrão
  return `graph TD
    A[["${temaLimpo}"]] --> B["Definição e Epidemiologia"]
    A --> C["Fisiopatologia"]
    A --> D["Quadro Clínico"]
    A --> E["Tratamento"]
    B --> B1["Incidência"]
    B --> B2["Fatores de Risco"]
    C --> C1["Mecanismo"]
    C --> C2["Alterações Patológicas"]
    D --> D1["Sinais"]
    D --> D2["Sintomas"]
    D --> D3["Complicações"]
    E --> E1["Medicamentoso"]
    E --> E2["Não Medicamentoso"]
    E --> E3["Prognóstico"]
${MERMAID_STYLE_BLOCK}
    class A root
    class D,E highlight`
}

// ==========================================
// GERADOR DE DADOS VISUAIS ESTRUTURADOS (Gemini)
// ==========================================

interface VisualDataResult {
  diagrama?: {
    titulo: string
    descricao?: string
    elementos: Array<{
      id: string
      nome: string
      emoji?: string
      descricao?: string
      x: number
      y: number
      tipo?: string
    }>
  }
  fluxograma?: {
    titulo: string
    descricao?: string
    etapas: Array<{
      id: string
      texto: string
      subtexto?: string
      emoji?: string
      tipo: 'inicio' | 'processo' | 'decisao' | 'fim'
      cor?: string
    }>
    conexoes: Array<{ de: string; para: string; label?: string }>
  }
  organograma?: {
    titulo: string
    descricao?: string
    raiz: {
      nome: string
      emoji?: string
      descricao?: string
      filhos?: Array<{
        nome: string
        emoji?: string
        descricao?: string
        filhos?: Array<{
          nome: string
          emoji?: string
          descricao?: string
        }>
      }>
    }
  }
}

/**
 * Gera dados visuais estruturados (diagrama, fluxograma, organograma) usando Gemini Flash
 * Retorna JSON estruturado para renderização CSS (não Mermaid)
 */
async function generateVisualDataWithAI(
  tema: string,
  visuais: string[]
): Promise<VisualDataResult> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json'
      }
    })

    const sections: string[] = []

    if (visuais.includes('diagrama')) {
      sections.push(`"diagrama": {
  "titulo": "titulo do diagrama sobre o tema",
  "descricao": "subtitulo curto descritivo em CAIXA ALTA",
  "elementos": [
    { "id": "el1", "nome": "Nome da Estrutura", "emoji": "emoji representativo", "descricao": "breve descricao", "x": 50, "y": 20, "tipo": "orgao" }
  ]
}
REGRAS diagrama: coloque 6-10 elementos, x e y sao porcentagens (0-100), distribua bem no espaço, use emojis medicos`)
    }

    if (visuais.includes('fluxograma')) {
      sections.push(`"fluxograma": {
  "titulo": "titulo do fluxograma",
  "descricao": "subtitulo curto descritivo em CAIXA ALTA",
  "etapas": [
    { "id": "e1", "texto": "Etapa Principal", "subtexto": "detalhes", "emoji": "emoji", "tipo": "inicio", "cor": "inicio" },
    { "id": "e2", "texto": "Processo", "subtexto": "descricao", "emoji": "emoji", "tipo": "processo" }
  ],
  "conexoes": [
    { "de": "e1", "para": "e2" },
    { "de": "e3", "para": "e4", "label": "Se sim" }
  ]
}
REGRAS fluxograma: use 5-8 etapas, tipos: inicio/processo/decisao/fim, decisoes podem ter 2+ conexoes com labels, cor pode ser: inicio/processo/decisao/fim/ovulacao/lutea`)
    }

    if (visuais.includes('organograma')) {
      sections.push(`"organograma": {
  "titulo": "titulo do organograma",
  "descricao": "subtitulo curto descritivo em CAIXA ALTA",
  "raiz": {
    "nome": "Categoria Principal",
    "emoji": "emoji",
    "descricao": "descricao curta",
    "filhos": [
      {
        "nome": "Subcategoria",
        "emoji": "emoji",
        "descricao": "descricao",
        "filhos": [
          { "nome": "Item", "emoji": "emoji", "descricao": "descricao" }
        ]
      }
    ]
  }
}
REGRAS organograma: maximo 3 niveis de profundidade, 2-4 filhos por no, use emojis medicos em cada no`)
    }

    const prompt = `Gere dados EDUCATIVOS MEDICOS PRECISOS sobre "${tema}" em formato JSON.

RETORNE UM JSON com estas chaves:
${sections.join('\n\n')}

REGRAS GLOBAIS:
1. Conteudo REAL e preciso sobre "${tema}" - terminologia medica correta
2. Use emojis adequados ao contexto medico (orgaos, processos, etc.)
3. Todos os textos em portugues do Brasil
4. Seja especifico - nada generico
5. Use nomes reais de estruturas, processos, fases etc.

Retorne APENAS o JSON valido.`

    const result = await model.generateContent(prompt)
    let jsonStr = result.response.text().trim()

    // Limpar fences markdown se presentes
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

    const parsed = JSON.parse(jsonStr) as VisualDataResult
    console.log(`[VisualAI] Dados visuais gerados com sucesso para "${tema}": ${Object.keys(parsed).join(', ')}`)
    return parsed
  } catch (error) {
    console.error(`[VisualAI] Erro ao gerar dados visuais:`, error)
    return generateFallbackVisualData(tema, visuais)
  }
}

/**
 * Fallback: gera dados visuais basicos quando a IA falha
 */
function generateFallbackVisualData(tema: string, visuais: string[]): VisualDataResult {
  const result: VisualDataResult = {}

  if (visuais.includes('diagrama')) {
    result.diagrama = {
      titulo: tema,
      descricao: 'DIAGRAMA CONCEITUAL',
      elementos: [
        { id: 'e1', nome: tema, emoji: '🏥', descricao: 'Tema principal', x: 50, y: 15, tipo: 'principal' },
        { id: 'e2', nome: 'Definição', emoji: '📖', descricao: 'Conceito base', x: 20, y: 40 },
        { id: 'e3', nome: 'Classificação', emoji: '📋', descricao: 'Tipos e subtipos', x: 50, y: 40 },
        { id: 'e4', nome: 'Tratamento', emoji: '💊', descricao: 'Abordagem terapêutica', x: 80, y: 40 },
        { id: 'e5', nome: 'Diagnóstico', emoji: '🔬', descricao: 'Exames e critérios', x: 35, y: 70 },
        { id: 'e6', nome: 'Prognóstico', emoji: '📈', descricao: 'Evolução e desfechos', x: 65, y: 70 },
      ]
    }
  }

  if (visuais.includes('fluxograma')) {
    result.fluxograma = {
      titulo: 'Abordagem Clínica',
      descricao: `FLUXO DE AVALIAÇÃO - ${tema.toUpperCase()}`,
      etapas: [
        { id: 'f1', texto: 'Avaliação Inicial', subtexto: 'Anamnese e exame físico', emoji: '👨‍⚕️', tipo: 'inicio', cor: 'inicio' },
        { id: 'f2', texto: 'Exames Complementares', subtexto: 'Laboratoriais e imagem', emoji: '🔬', tipo: 'processo' },
        { id: 'f3', texto: 'Diagnóstico Confirmado?', emoji: '❓', tipo: 'decisao' },
        { id: 'f4', texto: 'Tratamento', subtexto: 'Conduta terapêutica', emoji: '💊', tipo: 'processo' },
        { id: 'f5', texto: 'Investigação Adicional', subtexto: 'Exames específicos', emoji: '🔎', tipo: 'processo' },
        { id: 'f6', texto: 'Acompanhamento', subtexto: 'Seguimento clínico', emoji: '📋', tipo: 'fim', cor: 'fim' },
      ],
      conexoes: [
        { de: 'f1', para: 'f2' },
        { de: 'f2', para: 'f3' },
        { de: 'f3', para: 'f4', label: 'Sim' },
        { de: 'f3', para: 'f5', label: 'Não' },
        { de: 'f4', para: 'f6' },
        { de: 'f5', para: 'f3' },
      ]
    }
  }

  if (visuais.includes('organograma')) {
    result.organograma = {
      titulo: 'Classificação',
      descricao: `ORGANIZAÇÃO HIERÁRQUICA - ${tema.toUpperCase()}`,
      raiz: {
        nome: tema,
        emoji: '🏥',
        descricao: 'Classificação geral',
        filhos: [
          {
            nome: 'Categoria A',
            emoji: '📋',
            descricao: 'Primeiro grupo',
            filhos: [
              { nome: 'Tipo 1', emoji: '🔵', descricao: 'Subtipo' },
              { nome: 'Tipo 2', emoji: '🟢', descricao: 'Subtipo' },
            ]
          },
          {
            nome: 'Categoria B',
            emoji: '📑',
            descricao: 'Segundo grupo',
            filhos: [
              { nome: 'Tipo 3', emoji: '🟡', descricao: 'Subtipo' },
              { nome: 'Tipo 4', emoji: '🔴', descricao: 'Subtipo' },
            ]
          }
        ]
      }
    }
  }

  return result
}

/**
 * Gera emojis para flashcards com base no tema
 */
function getFlashcardEmojis(tema: string): string[] {
  const temaLower = tema.toLowerCase()
  if (temaLower.includes('reprodut') || temaLower.includes('ginecol')) {
    return ['🫘', '🌿', '🍐', '🌸', '🩸', '🧬', '💧', '🌺']
  }
  if (temaLower.includes('cardi') || temaLower.includes('coração')) {
    return ['❤️', '🫀', '💓', '🩺', '📈', '💉', '🔬', '🏥']
  }
  if (temaLower.includes('neuro') || temaLower.includes('cérebro')) {
    return ['🧠', '⚡', '🔬', '💊', '🩻', '🧬', '📊', '🏥']
  }
  if (temaLower.includes('pulm') || temaLower.includes('respir')) {
    return ['🫁', '💨', '🩺', '🔬', '💊', '📊', '🏥', '⚕️']
  }
  // Default
  return ['📖', '🔬', '💊', '🩺', '🧬', '📋', '🏥', '⚕️']
}

/**
 * Detecta ícone do tema
 */
function getThemeIcon(tema: string): string {
  const temaLower = tema.toLowerCase()
  if (temaLower.includes('reprodut') && temaLower.includes('femin')) return '♀️'
  if (temaLower.includes('reprodut') && temaLower.includes('masc')) return '♂️'
  if (temaLower.includes('cardi') || temaLower.includes('coração')) return '❤️'
  if (temaLower.includes('neuro') || temaLower.includes('cérebro')) return '🧠'
  if (temaLower.includes('pulm') || temaLower.includes('respir')) return '🫁'
  if (temaLower.includes('digest') || temaLower.includes('gastr')) return '🫃'
  if (temaLower.includes('renal') || temaLower.includes('rim')) return '🫘'
  if (temaLower.includes('endócrino') || temaLower.includes('hormôn')) return '🧪'
  if (temaLower.includes('imuno') || temaLower.includes('infec')) return '🦠'
  if (temaLower.includes('osso') || temaLower.includes('ortop')) return '🦴'
  if (temaLower.includes('pele') || temaLower.includes('derma')) return '🧴'
  return '📚'
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

        const visuais = params.visuais as string[] || []
        const tema = params.tema as string || 'Medicina'

        // Executar em paralelo: content-crew + visual data + imagens + mermaid (backward compat)
        const [result, visualData, imagensResult, ...mermaidResults] = await Promise.allSettled([
          // 1. Content-crew (questões + flashcards + resumo)
          generateContent(request),
          // 2. Dados visuais estruturados para o componente unificado
          visuais.length > 0
            ? generateVisualDataWithAI(tema, visuais)
            : Promise.resolve({} as VisualDataResult),
          // 3. Buscar imagens via Serper
          buscarImagensComFallback(tema, 4),
          // 4. Mermaid blocks para backward compatibility (sidebar)
          ...visuais.map(async (tipo) => {
            const tipoLabel = tipo.charAt(0).toUpperCase() + tipo.slice(1)
            try {
              const mermaidCode = await generateMermaidWithAI(
                tema,
                tipo as 'diagrama' | 'fluxograma' | 'organograma'
              )
              return `\n\n\`\`\`mermaid:${tipoLabel} - ${tema}\n${mermaidCode}\n\`\`\`\n`
            } catch (err) {
              console.error(`[MultiAgent] Erro ao gerar mermaid ${tipo}:`, err)
              const fallback = generateFallbackMermaid(tema, tipo as 'diagrama' | 'fluxograma' | 'organograma')
              return `\n\n\`\`\`mermaid:${tipoLabel} - ${tema}\n${fallback}\n\`\`\`\n`
            }
          })
        ])

        // Extrair resultados (com fallback se algum falhou)
        const contentResult = result.status === 'fulfilled' ? result.value : null
        const visuals = visualData.status === 'fulfilled' ? visualData.value : {} as VisualDataResult
        const imagens = imagensResult.status === 'fulfilled' ? imagensResult.value : null
        const mermaidContent = mermaidResults
          .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
          .map(r => r.value)
          .join('')

        if (!contentResult) {
          return {
            success: false,
            response: '',
            error: 'Erro ao gerar conteúdo com content-crew'
          }
        }

        // Extrair flashcards e questões do resultado da content-crew
        const flashcardEmojis = getFlashcardEmojis(tema)
        const flashcardsFromCrew = contentResult.conteudos.find(c => c.type === 'flashcards')
        const questoesFromCrew = contentResult.conteudos.find(c => c.type === 'questoes')

        // Construir flashcards com emojis para o componente unificado
        let unifiedFlashcards: Array<{ id: string; emoji?: string; frente: string; verso: string; referencia?: string }> | undefined
        if (flashcardsFromCrew?.flashcards) {
          unifiedFlashcards = flashcardsFromCrew.flashcards.flashcards.map((fc, i) => ({
            id: `fc-${i + 1}`,
            emoji: flashcardEmojis[i % flashcardEmojis.length],
            frente: fc.frente,
            verso: fc.verso,
            referencia: (fc as Record<string, unknown>).referencia as string | undefined
          }))
        }

        // Construir questões para o componente unificado
        let unifiedQuestoes: Array<{
          numero: number; disciplina: string; assunto: string; enunciado: string;
          alternativas: Array<{ letra: string; texto: string }>;
          gabarito_comentado: { resposta_correta: string; explicacao: string; analise_alternativas?: Array<{ letra: string; analise: string }>; ponto_chave?: string; imagem_url?: string }
        }> | undefined
        if (questoesFromCrew?.questoes) {
          // Buscar imagem para gabarito se possível
          const imagemGabarito = imagens?.imagens?.[1]?.url || undefined

          unifiedQuestoes = questoesFromCrew.questoes.questoes.map((q, i) => ({
            numero: i + 1,
            disciplina: questoesFromCrew.questoes?.metadata?.tema_principal || tema,
            assunto: q.tema || tema,
            enunciado: q.enunciado,
            alternativas: Object.entries(q.alternativas)
              .filter(([, alt]) => alt)
              .map(([letra, texto]) => ({ letra, texto: texto as string })),
            gabarito_comentado: {
              resposta_correta: q.gabarito,
              explicacao: q.explicacao,
              analise_alternativas: (q.analise_alternativas || []).map((a: { letra: string; analise: string }) => ({
                letra: a.letra,
                analise: a.analise
              })),
              ponto_chave: q.ponto_chave || '',
              imagem_url: i === 0 ? imagemGabarito : undefined
            }
          }))
        }

        // Construir imagens para o componente unificado
        const unifiedImagens = imagens?.imagens?.map(img => ({
          url: img.url,
          titulo: img.titulo,
          fonte: img.fonte
        })) || []

        // Montar o JSON do unified_study
        const unifiedStudyData: Record<string, unknown> = {
          titulo: tema,
          icone: getThemeIcon(tema),
          subtitulo: 'Material de estudo interativo',
          imagens: unifiedImagens.length > 0 ? unifiedImagens : undefined
        }

        if (unifiedFlashcards && unifiedFlashcards.length > 0) {
          unifiedStudyData.flashcards = { cards: unifiedFlashcards }
        }
        if (unifiedQuestoes && unifiedQuestoes.length > 0) {
          unifiedStudyData.questoes = unifiedQuestoes
        }
        if (visuals.diagrama) {
          unifiedStudyData.diagrama = visuals.diagrama
        }
        if (visuals.fluxograma) {
          unifiedStudyData.fluxograma = visuals.fluxograma
        }
        if (visuals.organograma) {
          unifiedStudyData.organograma = visuals.organograma
        }

        // Gerar texto de introdução com imagens
        let introText = `# Material de Estudo: ${tema}\n\n`

        // Adicionar imagens inline no texto
        if (unifiedImagens.length > 0) {
          introText += `\n`
          unifiedImagens.slice(0, 2).forEach((img) => {
            introText += `![${img.titulo}](${img.url})\n`
          })
          introText += `\n`
        }

        // O bloco unified_study (componente principal)
        const unifiedBlock = `\n\n\`\`\`unified_study:${tema}\n${JSON.stringify(unifiedStudyData)}\n\`\`\`\n`

        // NOTA: Não incluir blocos tradicionais (flashcards/questões/mermaid) para evitar duplicação
        // O componente unified_study no painel de artefatos já contém todo o conteúdo interativo

        return {
          success: true,
          response: introText + unifiedBlock,
          executionLog: contentResult.executionLog,
          artifacts: {
            type: 'conteudo_completo',
            data: {
              conteudos: contentResult.conteudos,
              revisoes: contentResult.revisoes,
              unifiedStudyData
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
