// Agents - Sistema Multi-Agentes (equivalente ao CrewAI)
// Exportacoes principais

// ==========================================
// IMPORTS INTERNOS (para uso nas funcoes e exports)
// ==========================================
import type { ResearchTask } from './agents/researcher'
import type { ReviewTask } from './agents/reviewer'
import { ResearcherAgent, createResearcherAgent } from './agents/researcher'
import { PlannerAgent, createPlannerAgent } from './agents/planner'
import { CreatorAgent, createCreatorAgent } from './agents/creator'
import { ReviewerAgent, createReviewerAgent } from './agents/reviewer'
import { createStudyPlanCrew, generateStudyPlan } from './crews/study-plan-crew'
import { createContentCrew, generateContent, quickGenerateQuestoes, quickGenerateFlashcards, quickGenerateResumo } from './crews/content-crew'

// ==========================================
// AGENTS INDIVIDUAIS
// ==========================================
export {
  ResearcherAgent,
  createResearcherAgent,
  type ResearchResult,
  type ResearchTask
} from './agents/researcher'

export {
  PlannerAgent,
  createPlannerAgent,
  formatPlanoParaExibicao,
  PlanoEstudosSchema,
  type PlanoEstudos,
  type PlanningTask
} from './agents/planner'

export {
  CreatorAgent,
  createCreatorAgent,
  type ContentType,
  type ContentTask,
  type ContentOutput
} from './agents/creator'

export {
  ReviewerAgent,
  createReviewerAgent,
  formatReviewResult,
  ReviewResultSchema,
  type ReviewResult,
  type ReviewTask
} from './agents/reviewer'

// ==========================================
// CREWS (TIMES DE AGENTES)
// ==========================================
export {
  StudyPlanCrew,
  createStudyPlanCrew,
  generateStudyPlan,
  type StudyPlanRequest,
  type StudyPlanResult
} from './crews/study-plan-crew'

export {
  ContentCrew,
  createContentCrew,
  generateContent,
  quickGenerateQuestoes,
  quickGenerateFlashcards,
  quickGenerateResumo,
  type ContentRequest,
  type ContentCrewResult
} from './crews/content-crew'

// ==========================================
// TIPOS UTILITARIOS
// ==========================================

export type AgentType = 'researcher' | 'planner' | 'creator' | 'reviewer'

export interface AgentConfig {
  type: AgentType
  provider?: 'claude' | 'gemini'
}

// ==========================================
// FACTORY GERAL
// ==========================================

// Imports ja feitos no inicio do arquivo

export type AnyAgent = ResearcherAgent | PlannerAgent | CreatorAgent | ReviewerAgent

export function createAgent(config: AgentConfig): AnyAgent {
  const provider = config.provider || 'claude'

  switch (config.type) {
    case 'researcher':
      return createResearcherAgent(provider === 'claude' ? 'claude' : 'gemini')
    case 'planner':
      return createPlannerAgent(provider === 'claude' ? 'claude' : 'gemini')
    case 'creator':
      return createCreatorAgent(provider)
    case 'reviewer':
      return createReviewerAgent(provider)
    default:
      throw new Error(`Tipo de agente desconhecido: ${config.type}`)
  }
}

// ==========================================
// EXECUTOR SIMPLIFICADO
// ==========================================

export interface MultiAgentTask {
  type: 'study_plan' | 'content_creation' | 'research' | 'review'
  params: Record<string, unknown>
}

export async function executeMultiAgentTask(task: MultiAgentTask): Promise<unknown> {
  switch (task.type) {
    case 'study_plan': {
      const mod = await import('./crews/study-plan-crew')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mod.generateStudyPlan(task.params as any)
    }

    case 'content_creation': {
      const mod = await import('./crews/content-crew')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mod.generateContent(task.params as any)
    }

    case 'research': {
      const researcher = createResearcherAgent('gemini')
      return researcher.research(task.params as unknown as ResearchTask)
    }

    case 'review': {
      const reviewer = createReviewerAgent('claude')
      return reviewer.review(task.params as unknown as ReviewTask)
    }

    default:
      throw new Error(`Tipo de task desconhecido: ${task.type}`)
  }
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
  createAgent,
  createResearcherAgent,
  createPlannerAgent,
  createCreatorAgent,
  createReviewerAgent,
  createStudyPlanCrew,
  createContentCrew,
  generateStudyPlan,
  generateContent,
  quickGenerateQuestoes,
  quickGenerateFlashcards,
  quickGenerateResumo,
  executeMultiAgentTask
}
