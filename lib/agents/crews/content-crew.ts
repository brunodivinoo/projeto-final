// Crew de Criacao de Conteudo
// Coordena agentes para criar material de estudo de alta qualidade

import { ResearcherAgent, createResearcherAgent } from '../agents/researcher'
import { CreatorAgent, createCreatorAgent, ContentOutput } from '../agents/creator'
import { ReviewerAgent, createReviewerAgent, formatReviewResult } from '../agents/reviewer'

// ==========================================
// TIPOS
// ==========================================

export interface ContentRequest {
  tema: string
  tipos: Array<'questoes' | 'flashcards' | 'resumo'>
  quantidades?: {
    questoes?: number
    flashcards?: number
  }
  dificuldade?: 'facil' | 'media' | 'dificil' | 'mista'
  contexto?: string
  pesquisarAntees?: boolean
  revisarConteudo?: boolean
}

export interface ContentCrewResult {
  conteudos: ContentOutput[]
  pesquisa?: {
    summary: string
    sources: number
  }
  revisoes?: Array<{
    tipo: string
    aprovado: boolean
    score: number
  }>
  formatted: string
  executionLog: string[]
}

// ==========================================
// CLASSE DA CREW
// ==========================================

export class ContentCrew {
  private researcher: ResearcherAgent
  private creator: CreatorAgent
  private reviewer: ReviewerAgent
  private executionLog: string[] = []

  constructor() {
    this.researcher = createResearcherAgent('gemini')
    this.creator = createCreatorAgent('claude')
    this.reviewer = createReviewerAgent('claude')
  }

  /**
   * Executa a criacao de conteudo
   */
  async execute(request: ContentRequest): Promise<ContentCrewResult> {
    this.executionLog = []
    this.log(`Iniciando criacao de conteudo sobre: ${request.tema}`)

    const {
      tema,
      tipos,
      quantidades = {},
      dificuldade = 'mista',
      contexto,
      pesquisarAntees = false,
      revisarConteudo = true
    } = request

    // ==========================================
    // ETAPA 1: PESQUISA (opcional)
    // ==========================================
    let pesquisaContexto = contexto || ''
    let pesquisaResult: ContentCrewResult['pesquisa']

    if (pesquisarAntees) {
      this.log('[Pesquisador] Buscando informacoes atualizadas...')

      try {
        const pesquisa = await this.researcher.research({
          query: `${tema} medicina atualizado guidelines`,
          depth: 'medium'
        })

        pesquisaContexto += `\n\nINFORMACOES PESQUISADAS:\n${pesquisa.summary}`
        pesquisaResult = {
          summary: pesquisa.summary,
          sources: pesquisa.sources.length
        }

        this.log(`[Pesquisador] Encontradas ${pesquisa.findings.length} informacoes`)

      } catch (error) {
        this.log(`[Pesquisador] Erro: ${error}`)
      }
    }

    // ==========================================
    // ETAPA 2: CRIACAO DE CONTEUDO
    // ==========================================
    this.log('[Criador] Gerando conteudo...')

    const conteudos: ContentOutput[] = []

    for (const tipo of tipos) {
      this.log(`[Criador] Criando ${tipo}...`)

      try {
        const quantidade = tipo === 'questoes'
          ? (quantidades.questoes || 5)
          : tipo === 'flashcards'
            ? (quantidades.flashcards || 10)
            : undefined

        const conteudo = await this.creator.create({
          type: tipo,
          tema,
          quantidade,
          dificuldade,
          contexto: pesquisaContexto || undefined
        })

        conteudos.push(conteudo)
        this.log(`[Criador] ${tipo} criado com sucesso`)

      } catch (error) {
        this.log(`[Criador] Erro ao criar ${tipo}: ${error}`)
      }
    }

    // ==========================================
    // ETAPA 3: REVISAO (opcional)
    // ==========================================
    let revisoes: ContentCrewResult['revisoes']

    if (revisarConteudo && conteudos.length > 0) {
      this.log('[Revisor] Revisando conteudo...')
      revisoes = []

      for (const conteudo of conteudos) {
        try {
          const revisao = await this.reviewer.review({
            content: conteudo.formatted,
            contentType: conteudo.type === 'questoes' ? 'questao' :
              conteudo.type === 'flashcards' ? 'flashcard' : 'resumo'
          })

          revisoes.push({
            tipo: conteudo.type,
            aprovado: revisao.approved,
            score: revisao.score
          })

          this.log(`[Revisor] ${conteudo.type}: ${revisao.score}/10`)

          // Se nao aprovado e tem conteudo corrigido, usar
          if (!revisao.approved && revisao.correctedContent) {
            conteudo.formatted = revisao.correctedContent
            this.log(`[Revisor] Conteudo de ${conteudo.type} corrigido`)
          }

        } catch (error) {
          this.log(`[Revisor] Erro ao revisar ${conteudo.type}: ${error}`)
        }
      }
    }

    // ==========================================
    // RESULTADO FINAL
    // ==========================================
    this.log('Criacao de conteudo finalizada!')

    // Combinar todos os conteudos formatados
    let formatted = `# Material de Estudo: ${tema}\n\n`

    if (pesquisaResult) {
      formatted += `*Baseado em ${pesquisaResult.sources} fontes pesquisadas*\n\n---\n\n`
    }

    conteudos.forEach(c => {
      formatted += c.formatted + '\n\n---\n\n'
    })

    return {
      conteudos,
      pesquisa: pesquisaResult,
      revisoes,
      formatted,
      executionLog: this.executionLog
    }
  }

  /**
   * Cria conteudo rapido (sem pesquisa/revisao)
   */
  async quickCreate(
    tema: string,
    tipo: 'questoes' | 'flashcards' | 'resumo',
    quantidade?: number
  ): Promise<ContentOutput> {
    return this.creator.create({
      type: tipo,
      tema,
      quantidade
    })
  }

  /**
   * Adiciona entrada ao log
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    this.executionLog.push(`[${timestamp}] ${message}`)
    console.log(`[ContentCrew] ${message}`)
  }
}

// ==========================================
// FACTORY FUNCTION
// ==========================================

export function createContentCrew(): ContentCrew {
  return new ContentCrew()
}

// ==========================================
// FUNCOES DE CONVENIENCIA
// ==========================================

export async function generateContent(request: ContentRequest): Promise<ContentCrewResult> {
  const crew = createContentCrew()
  return crew.execute(request)
}

export async function quickGenerateQuestoes(tema: string, quantidade: number = 5): Promise<ContentOutput> {
  const crew = createContentCrew()
  return crew.quickCreate(tema, 'questoes', quantidade)
}

export async function quickGenerateFlashcards(tema: string, quantidade: number = 10): Promise<ContentOutput> {
  const crew = createContentCrew()
  return crew.quickCreate(tema, 'flashcards', quantidade)
}

export async function quickGenerateResumo(tema: string): Promise<ContentOutput> {
  const crew = createContentCrew()
  return crew.quickCreate(tema, 'resumo')
}

// ==========================================
// EXPORT
// ==========================================

export default ContentCrew
