// Agente Criador de Conteudo
// Responsavel por gerar questoes, flashcards, resumos

import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import {
  runQuestoesChain,
  QuestoesOutput,
  formatQuestoesParaExibicao
} from '../../langchain/chains/questoes-chain'
import {
  runFlashcardsChain,
  FlashcardsOutput,
  formatFlashcardsParaExibicao
} from '../../langchain/chains/flashcards-chain'
import {
  runResumoChain,
  Resumo,
  formatResumoParaExibicao
} from '../../langchain/chains/resumo-chain'

// ==========================================
// TIPOS
// ==========================================

export type ContentType = 'questoes' | 'flashcards' | 'resumo' | 'misto'

export interface ContentTask {
  type: ContentType
  tema: string
  quantidade?: number
  dificuldade?: 'facil' | 'media' | 'dificil' | 'mista'
  contexto?: string
  baseadoEm?: string // Texto base para criar conteudo
}

export interface ContentOutput {
  type: ContentType
  questoes?: QuestoesOutput
  flashcards?: FlashcardsOutput
  resumo?: Resumo
  formatted: string
}

// ==========================================
// PROMPT DO AGENTE
// ==========================================

const CREATOR_SYSTEM_PROMPT = `Voce e um AGENTE CRIADOR DE CONTEUDO especializado em material de estudo medico.

SEU PAPEL:
- Criar questoes de prova de alta qualidade
- Gerar flashcards eficientes para memorizacao
- Produzir resumos claros e didaticos
- Desenvolver material personalizado

PRINCIPIOS DE QUALIDADE:
1. PRECISAO: Informacoes medicas corretas e atualizadas
2. RELEVANCIA: Focar no que cai em provas
3. CLAREZA: Linguagem objetiva e didatica
4. VARIEDADE: Diferentes niveis e formatos
5. PRATICA: Conteudo aplicavel clinicamente

PARA QUESTOES:
- Enunciados claros e completos
- Distratores plausiveis
- Explicacoes detalhadas
- Casos clinicos quando apropriado

PARA FLASHCARDS:
- Uma informacao por card
- Frente objetiva
- Verso conciso
- Mneumonicos quando possivel

PARA RESUMOS:
- Estrutura logica
- Pontos-chave destacados
- Diagramas quando util
- Foco em memorize`

// ==========================================
// CLASSE DO AGENTE
// ==========================================

export class CreatorAgent {
  private model: ChatAnthropic | ChatGoogleGenerativeAI

  constructor(provider: 'claude' | 'gemini' = 'claude') {
    if (provider === 'claude') {
      this.model = new ChatAnthropic({
        modelName: 'claude-sonnet-4-20250514',
        anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
        temperature: 0.7,
        maxTokens: 8000
      })
    } else {
      this.model = new ChatGoogleGenerativeAI({
        model: 'gemini-2.0-flash',
        apiKey: process.env.GEMINI_API_KEY!,
        temperature: 0.7,
        maxOutputTokens: 8000
      })
    }
  }

  /**
   * Cria conteudo baseado no tipo solicitado
   */
  async create(task: ContentTask): Promise<ContentOutput> {
    const { type, tema, quantidade = 5, dificuldade = 'mista', contexto, baseadoEm } = task

    console.log(`[CreatorAgent] Criando ${type} sobre: ${tema}`)

    switch (type) {
      case 'questoes':
        return await this.createQuestoes(tema, quantidade, dificuldade, contexto)

      case 'flashcards':
        return await this.createFlashcards(tema, quantidade, contexto)

      case 'resumo':
        return await this.createResumo(tema, contexto, baseadoEm)

      case 'misto':
        return await this.createMisto(tema, quantidade, contexto)

      default:
        throw new Error(`Tipo de conteudo desconhecido: ${type}`)
    }
  }

  /**
   * Cria questoes
   */
  private async createQuestoes(
    tema: string,
    quantidade: number,
    dificuldade: 'facil' | 'media' | 'dificil' | 'mista',
    contexto?: string
  ): Promise<ContentOutput> {
    const result = await runQuestoesChain({
      tema,
      quantidade,
      dificuldade,
      estilo: 'residencia',
      incluirCasosClinicas: true,
      provider: 'claude',
      contextoAdicional: contexto
    })

    return {
      type: 'questoes',
      questoes: result,
      formatted: formatQuestoesParaExibicao(result)
    }
  }

  /**
   * Cria flashcards
   */
  private async createFlashcards(
    tema: string,
    quantidade: number,
    contexto?: string
  ): Promise<ContentOutput> {
    const result = await runFlashcardsChain({
      tema,
      quantidade,
      tipo: 'misto',
      nivel: 'intermediario',
      provider: 'gemini',
      contextoAdicional: contexto
    })

    return {
      type: 'flashcards',
      flashcards: result,
      formatted: formatFlashcardsParaExibicao(result)
    }
  }

  /**
   * Cria resumo
   */
  private async createResumo(
    tema: string,
    contexto?: string,
    baseadoEm?: string
  ): Promise<ContentOutput> {
    let contextoFinal = contexto || ''

    if (baseadoEm) {
      contextoFinal += `\n\nTEXTO BASE PARA O RESUMO:\n${baseadoEm}`
    }

    const result = await runResumoChain({
      tema,
      profundidade: 'intermediario',
      incluirDiagramas: true,
      provider: 'claude',
      contextoAdicional: contextoFinal || undefined
    })

    return {
      type: 'resumo',
      resumo: result,
      formatted: formatResumoParaExibicao(result)
    }
  }

  /**
   * Cria conteudo misto (questoes + flashcards + resumo)
   */
  private async createMisto(
    tema: string,
    quantidade: number,
    contexto?: string
  ): Promise<ContentOutput> {
    // Criar em paralelo
    const [questoesResult, flashcardsResult, resumoResult] = await Promise.all([
      this.createQuestoes(tema, Math.min(quantidade, 5), 'mista', contexto),
      this.createFlashcards(tema, Math.min(quantidade * 2, 10), contexto),
      this.createResumo(tema, contexto)
    ])

    // Combinar formatacao
    let formatted = `# Material de Estudo: ${tema}\n\n`
    formatted += `---\n\n`

    // Resumo primeiro
    if (resumoResult.formatted) {
      formatted += resumoResult.formatted
      formatted += `\n\n---\n\n`
    }

    // Depois questoes
    if (questoesResult.formatted) {
      formatted += questoesResult.formatted
      formatted += `\n\n---\n\n`
    }

    // Por fim flashcards
    if (flashcardsResult.formatted) {
      formatted += flashcardsResult.formatted
    }

    return {
      type: 'misto',
      questoes: questoesResult.questoes,
      flashcards: flashcardsResult.flashcards,
      resumo: resumoResult.resumo,
      formatted
    }
  }

  /**
   * Melhora conteudo existente
   */
  async improve(content: string, feedback: string): Promise<string> {
    const userPrompt = `MELHORAR CONTEUDO:

CONTEUDO ATUAL:
${content}

FEEDBACK:
${feedback}

Melhore o conteudo considerando o feedback. Mantenha o formato original.`

    const response = await this.model.invoke([
      new SystemMessage(CREATOR_SYSTEM_PROMPT),
      new HumanMessage(userPrompt)
    ])

    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)
  }
}

// ==========================================
// FACTORY FUNCTION
// ==========================================

export function createCreatorAgent(provider?: 'claude' | 'gemini'): CreatorAgent {
  return new CreatorAgent(provider)
}

// ==========================================
// EXPORT
// ==========================================

export default CreatorAgent
