// Crew de Plano de Estudos
// Coordena agentes para criar plano de estudos completo

import { ResearcherAgent, createResearcherAgent } from '../agents/researcher'
import { PlannerAgent, createPlannerAgent, formatPlanoParaExibicao, PlanoEstudos } from '../agents/planner'
import { CreatorAgent, createCreatorAgent } from '../agents/creator'
import { ReviewerAgent, createReviewerAgent } from '../agents/reviewer'

// ==========================================
// TIPOS
// ==========================================

export interface StudyPlanRequest {
  objetivo: string
  provaAlvo?: string
  dataProva?: string
  horasDisponiveis: number
  areasFortes?: string[]
  areasFracas?: string[]
  incluirMaterial?: boolean // Se deve gerar questoes/flashcards iniciais
  nivelDetalhe?: 'basico' | 'detalhado' | 'completo'
}

export interface StudyPlanResult {
  plano: PlanoEstudos
  materialInicial?: {
    questoes?: string
    flashcards?: string
    resumo?: string
  }
  revisao?: {
    aprovado: boolean
    score: number
    feedback: string
  }
  formatted: string
  executionLog: string[]
}

// ==========================================
// CLASSE DA CREW
// ==========================================

export class StudyPlanCrew {
  private researcher: ResearcherAgent
  private planner: PlannerAgent
  private creator: CreatorAgent
  private reviewer: ReviewerAgent
  private executionLog: string[] = []

  constructor() {
    this.researcher = createResearcherAgent('gemini')
    this.planner = createPlannerAgent('claude')
    this.creator = createCreatorAgent('claude')
    this.reviewer = createReviewerAgent('claude')
  }

  /**
   * Executa a criacao completa do plano de estudos
   */
  async execute(request: StudyPlanRequest): Promise<StudyPlanResult> {
    this.executionLog = []
    this.log('Iniciando criacao do plano de estudos...')

    const {
      objetivo,
      provaAlvo,
      dataProva,
      horasDisponiveis,
      areasFortes,
      areasFracas,
      incluirMaterial = false,
      nivelDetalhe = 'detalhado'
    } = request

    // ==========================================
    // ETAPA 1: PESQUISA (se prova especifica)
    // ==========================================
    let pesquisaContexto = ''

    if (provaAlvo) {
      this.log(`[Pesquisador] Buscando informacoes sobre ${provaAlvo}...`)

      try {
        const pesquisa = await this.researcher.research({
          query: `${provaAlvo} prova medicina conteudo programatico temas mais cobrados`,
          depth: nivelDetalhe === 'completo' ? 'deep' : 'medium',
          focusAreas: ['edital', 'temas frequentes', 'nivel de dificuldade']
        })

        pesquisaContexto = `
INFORMACOES SOBRE A PROVA (${provaAlvo}):
${pesquisa.summary}

Temas mais frequentes: ${pesquisa.findings.slice(0, 5).join(', ')}
`
        this.log(`[Pesquisador] Encontradas ${pesquisa.findings.length} informacoes relevantes`)

      } catch (error) {
        this.log(`[Pesquisador] Erro na pesquisa: ${error}`)
      }
    }

    // ==========================================
    // ETAPA 2: PLANEJAMENTO
    // ==========================================
    this.log('[Planejador] Criando plano de estudos...')

    let plano: PlanoEstudos

    try {
      plano = await this.planner.createPlan({
        objetivo,
        provaAlvo,
        dataProva,
        horasDisponiveis,
        areasFortes,
        areasFracas,
        contextoAdicional: pesquisaContexto
      })

      this.log(`[Planejador] Plano criado com ${plano.fases.length} fases`)

    } catch (error) {
      this.log(`[Planejador] Erro ao criar plano: ${error}`)
      throw error
    }

    // ==========================================
    // ETAPA 3: REVISAO
    // ==========================================
    this.log('[Revisor] Revisando qualidade do plano...')

    let revisaoResult: StudyPlanResult['revisao']

    try {
      const revisao = await this.reviewer.review({
        content: JSON.stringify(plano, null, 2),
        contentType: 'plano',
        context: `Plano para ${provaAlvo || objetivo}`,
        strictMode: nivelDetalhe === 'completo'
      })

      revisaoResult = {
        aprovado: revisao.approved,
        score: revisao.score,
        feedback: revisao.overallFeedback
      }

      this.log(`[Revisor] Score: ${revisao.score}/10 - ${revisao.approved ? 'APROVADO' : 'AJUSTES NECESSARIOS'}`)

      // Se nao aprovado e tem sugestoes, ajustar plano
      if (!revisao.approved && revisao.correctedContent) {
        this.log('[Planejador] Ajustando plano baseado no feedback...')
        try {
          plano = await this.planner.adjustPlan(plano, revisao.overallFeedback)
          this.log('[Planejador] Plano ajustado com sucesso')
        } catch {
          this.log('[Planejador] Usando plano original')
        }
      }

    } catch (error) {
      this.log(`[Revisor] Erro na revisao: ${error}`)
    }

    // ==========================================
    // ETAPA 4: CRIAR MATERIAL INICIAL (opcional)
    // ==========================================
    let materialInicial: StudyPlanResult['materialInicial']

    if (incluirMaterial && plano.fases.length > 0) {
      this.log('[Criador] Gerando material inicial...')

      const primeiraFase = plano.fases[0]
      const primeirosTopicos = primeiraFase.topicos.slice(0, 3).join(', ')

      try {
        // Criar conteudo misto para os primeiros topicos
        const conteudo = await this.creator.create({
          type: 'misto',
          tema: primeirosTopicos,
          quantidade: 5,
          contexto: `Material inicial para ${primeiraFase.nome}`
        })

        materialInicial = {
          questoes: conteudo.questoes ? `${conteudo.questoes.questoes.length} questoes geradas` : undefined,
          flashcards: conteudo.flashcards ? `${conteudo.flashcards.flashcards.length} flashcards gerados` : undefined,
          resumo: conteudo.resumo ? 'Resumo gerado' : undefined
        }

        this.log('[Criador] Material inicial gerado com sucesso')

      } catch (error) {
        this.log(`[Criador] Erro ao gerar material: ${error}`)
      }
    }

    // ==========================================
    // RESULTADO FINAL
    // ==========================================
    this.log('Plano de estudos finalizado!')

    const formatted = formatPlanoParaExibicao(plano)

    return {
      plano,
      materialInicial,
      revisao: revisaoResult,
      formatted,
      executionLog: this.executionLog
    }
  }

  /**
   * Adiciona entrada ao log de execucao
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    this.executionLog.push(`[${timestamp}] ${message}`)
    console.log(`[StudyPlanCrew] ${message}`)
  }
}

// ==========================================
// FACTORY FUNCTION
// ==========================================

export function createStudyPlanCrew(): StudyPlanCrew {
  return new StudyPlanCrew()
}

// ==========================================
// FUNCAO DE CONVENIENCIA
// ==========================================

export async function generateStudyPlan(request: StudyPlanRequest): Promise<StudyPlanResult> {
  const crew = createStudyPlanCrew()
  return crew.execute(request)
}

// ==========================================
// EXPORT
// ==========================================

export default StudyPlanCrew
