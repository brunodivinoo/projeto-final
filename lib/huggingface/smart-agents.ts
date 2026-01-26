/**
 * Servico de Agentes Inteligentes
 *
 * Implementa agentes especializados para diferentes tarefas medicas.
 * Usa a logica de agentes, mas roteando para Claude/Gemini conforme o plano.
 *
 * MELHORIA: Adiciona inteligencia na escolha de estrategias
 * NAO SUBSTITUI: Claude/Gemini continuam sendo executados
 */

import { FEATURES } from './config'
import { enrichQueryWithContext } from './medical-rag'

// Tipos de agentes disponiveis
export type AgentType =
  | 'question_generator'    // Gera questoes de prova
  | 'flashcard_generator'   // Gera flashcards
  | 'case_analyzer'         // Analisa casos clinicos
  | 'study_planner'         // Cria planos de estudo
  | 'image_explainer'       // Explica imagens medicas
  | 'general'               // Conversa geral

// Configuracao de cada agente
const AGENT_CONFIGS: Record<AgentType, {
  name: string
  description: string
  systemPromptAddition: string
  requiredContext: boolean
}> = {
  question_generator: {
    name: 'Gerador de Questoes',
    description: 'Especialista em criar questoes de provas medicas',
    systemPromptAddition: `
Voce e um especialista em elaboracao de questoes para provas de medicina.
REGRAS PARA QUESTOES:
1. Crie questoes com 5 alternativas (A a E)
2. Apenas UMA alternativa correta
3. Alternativas incorretas devem ser plausiveis (distratores de qualidade)
4. Inclua o gabarito comentado explicando cada alternativa
5. Baseie-se em bancas como REVALIDA, ENARE, USP, UNICAMP
6. Use casos clinicos quando apropriado
7. Varie a dificuldade conforme solicitado
`,
    requiredContext: true
  },

  flashcard_generator: {
    name: 'Gerador de Flashcards',
    description: 'Especialista em criar flashcards para memorizacao',
    systemPromptAddition: `
Voce e um especialista em criar flashcards eficientes para estudo medico.
REGRAS PARA FLASHCARDS:
1. Frente: pergunta objetiva e clara
2. Verso: resposta concisa mas completa
3. Use tecnicas de repeticao espacada
4. Inclua mnemonicos quando possivel
5. Priorize informacoes de alta relevancia clinica
6. Formato JSON com campos: frente, verso, dificuldade, tags
`,
    requiredContext: true
  },

  case_analyzer: {
    name: 'Analisador de Casos',
    description: 'Especialista em analise de casos clinicos',
    systemPromptAddition: `
Voce e um especialista em analise de casos clinicos.
ESTRUTURA DE ANALISE:
1. Identificacao do problema principal
2. Hipoteses diagnosticas (em ordem de probabilidade)
3. Exames complementares sugeridos
4. Diagnosticos diferenciais
5. Conduta proposta
6. Pontos-chave para a prova
`,
    requiredContext: true
  },

  study_planner: {
    name: 'Planejador de Estudos',
    description: 'Especialista em criar planos de estudo personalizados',
    systemPromptAddition: `
Voce e um especialista em planejamento de estudos para medicina.
CONSIDERE:
1. Tempo disponivel do estudante
2. Areas de maior dificuldade
3. Importancia relativa dos temas para provas
4. Tecnicas de estudo ativo (questoes, flashcards, mapas mentais)
5. Pausas e revisoes espacadas
6. Metas SMART (especificas, mensuraveis, atingiveis, relevantes, temporais)
`,
    requiredContext: false
  },

  image_explainer: {
    name: 'Explicador de Imagens',
    description: 'Especialista em explicar imagens medicas',
    systemPromptAddition: `
Voce e um especialista em interpretar e explicar imagens medicas.
AO ANALISAR IMAGENS:
1. Descreva a modalidade do exame (RX, TC, RM, USG, etc.)
2. Identifique estruturas anatomicas relevantes
3. Aponte achados normais e anormais
4. Correlacione com a clinica quando possivel
5. Sugira diagnosticos diferenciais baseados na imagem
6. Use terminologia medica adequada
`,
    requiredContext: false
  },

  general: {
    name: 'Assistente Geral',
    description: 'Assistente de estudos medicos',
    systemPromptAddition: '',
    requiredContext: false
  }
}

/**
 * Detecta qual tipo de agente usar baseado na query
 */
export function detectAgentType(query: string): AgentType {
  const queryLower = query.toLowerCase()

  // Padroes para cada tipo de agente
  const patterns: Record<AgentType, RegExp[]> = {
    question_generator: [
      /crie?\s+\d*\s*quest[õo]/i,
      /gere?\s+\d*\s*quest[õo]/i,
      /elabore?\s+\d*\s*quest[õo]/i,
      /fa[çz]a?\s+\d*\s*quest[õo]/i,
      /simulado/i,
      /prova/i
    ],
    flashcard_generator: [
      /flashcard/i,
      /flash\s*card/i,
      /cart[õo]es/i,
      /memoriza[çr]/i
    ],
    case_analyzer: [
      /caso\s+cl[íi]nico/i,
      /analise?\s+o\s+caso/i,
      /paciente\s+(de\s+)?\d+\s*anos/i,
      /hist[óo]ria\s+cl[íi]nica/i
    ],
    study_planner: [
      /plano\s+de\s+estudo/i,
      /cronograma/i,
      /como\s+estudar/i,
      /organiz(ar|e)\s+(meus?\s+)?estudos/i
    ],
    image_explainer: [
      /expliqu?e?\s+(a\s+)?imagem/i,
      /analise?\s+(a\s+)?imagem/i,
      /raio[\s-]?x/i,
      /tomografia/i,
      /resson[âa]ncia/i,
      /ultrassom/i
    ],
    general: [] // Fallback
  }

  for (const [agentType, agentPatterns] of Object.entries(patterns)) {
    if (agentType === 'general') continue

    for (const pattern of agentPatterns) {
      if (pattern.test(queryLower)) {
        return agentType as AgentType
      }
    }
  }

  return 'general'
}

/**
 * Prepara o contexto para um agente especifico
 */
export async function prepareAgentContext(
  query: string,
  agentType?: AgentType
): Promise<{
  agentType: AgentType
  agentConfig: typeof AGENT_CONFIGS[AgentType]
  enrichedContext: string
  systemPromptAddition: string
  relatedTopics: string[]
}> {
  // Detectar tipo de agente se nao especificado
  const detectedAgent = agentType || detectAgentType(query)
  const config = AGENT_CONFIGS[detectedAgent]

  // Enriquecer com contexto medico se necessario
  let enrichedContext = ''
  let relatedTopics: string[] = []

  if (FEATURES.SMART_AGENTS && config.requiredContext) {
    const enrichment = await enrichQueryWithContext(query)
    enrichedContext = enrichment.enrichedPrompt
    relatedTopics = enrichment.relatedTopics
  }

  return {
    agentType: detectedAgent,
    agentConfig: config,
    enrichedContext,
    systemPromptAddition: config.systemPromptAddition,
    relatedTopics
  }
}

/**
 * Formata a resposta baseado no tipo de agente
 */
export function formatAgentResponse(
  response: string,
  agentType: AgentType,
  relatedTopics: string[]
): string {
  let formattedResponse = response

  // Adicionar sugestoes de topicos relacionados se houver
  if (relatedTopics.length > 0 && agentType !== 'general') {
    formattedResponse += '\n\n---\n'
    formattedResponse += '**Topicos relacionados que voce pode explorar:**\n'
    relatedTopics.forEach((topic, idx) => {
      formattedResponse += `${idx + 1}. ${topic}\n`
    })
  }

  return formattedResponse
}

/**
 * Sugere o proximo passo baseado no agente e resposta
 */
export function suggestNextSteps(
  agentType: AgentType,
  _query: string
): string[] {
  const suggestions: Record<AgentType, string[]> = {
    question_generator: [
      'Quer mais questoes sobre este tema?',
      'Gostaria de questoes de outro nivel de dificuldade?',
      'Quer que eu explique alguma alternativa em detalhes?'
    ],
    flashcard_generator: [
      'Quer que eu gere mais flashcards?',
      'Gostaria de flashcards sobre um subtema especifico?',
      'Quer converter estes flashcards em questoes?'
    ],
    case_analyzer: [
      'Quer que eu aprofunde em algum diagnostico diferencial?',
      'Gostaria de questoes baseadas neste caso?',
      'Quer que eu explique a fisiopatologia?'
    ],
    study_planner: [
      'Quer que eu detalhe algum dia do plano?',
      'Gostaria de adicionar ou remover algum tema?',
      'Quer que eu crie flashcards para os temas prioritarios?'
    ],
    image_explainer: [
      'Quer que eu explique algum achado em detalhes?',
      'Gostaria de casos clinicos relacionados?',
      'Quer questoes sobre este tipo de exame?'
    ],
    general: [
      'Posso ajudar com algo mais especifico?',
      'Quer que eu crie questoes sobre este tema?',
      'Gostaria de um resumo em flashcards?'
    ]
  }

  return suggestions[agentType] || suggestions.general
}
