// LangChain - Sistema de Memoria de Conversa
// Mantém contexto da conversa com resumo automatico

import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'

// ==========================================
// TIPOS
// ==========================================

export interface MessageEntry {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  metadata?: {
    intent?: string
    topics?: string[]
    entities?: string[]
  }
}

export interface ConversationSummary {
  summary: string
  topics: string[]
  entities: EntityInfo[]
  keyPoints: string[]
  lastUpdated: number
}

export interface EntityInfo {
  name: string
  type: 'paciente' | 'medicamento' | 'doenca' | 'exame' | 'procedimento' | 'outro'
  description: string
  mentions: number
}

export interface MemoryConfig {
  maxRecentMessages: number  // Mensagens recentes mantidas completas
  summaryThreshold: number   // Quando começar a resumir
  maxSummaryLength: number   // Tamanho maximo do resumo
}

// ==========================================
// CLASSE DE MEMORIA
// ==========================================

export class ConversationMemory {
  private messages: MessageEntry[] = []
  private summary: ConversationSummary | null = null
  private config: MemoryConfig
  private conversaId: string | null = null

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxRecentMessages: 10,
      summaryThreshold: 15,
      maxSummaryLength: 1000,
      ...config
    }
  }

  // ==========================================
  // METODOS PUBLICOS
  // ==========================================

  /**
   * Define o ID da conversa (para persistencia)
   */
  setConversaId(id: string): void {
    this.conversaId = id
  }

  /**
   * Adiciona uma mensagem a memoria
   */
  async addMessage(role: 'user' | 'assistant', content: string, metadata?: MessageEntry['metadata']): Promise<void> {
    this.messages.push({
      role,
      content,
      timestamp: Date.now(),
      metadata
    })

    // Verificar se precisa resumir
    if (this.messages.length > this.config.summaryThreshold) {
      await this.updateSummary()
    }
  }

  /**
   * Carrega historico de mensagens existentes
   */
  loadHistory(messages: Array<{ role: 'user' | 'assistant'; content: string }>): void {
    this.messages = messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: Date.now()
    }))
  }

  /**
   * Obtem contexto formatado para o LLM
   */
  getContext(): string {
    const recentMessages = this.messages.slice(-this.config.maxRecentMessages)
    let context = ''

    // Adicionar resumo se existir
    if (this.summary) {
      context += `## RESUMO DA CONVERSA ANTERIOR:\n${this.summary.summary}\n\n`

      if (this.summary.entities.length > 0) {
        context += `## ENTIDADES MENCIONADAS:\n`
        this.summary.entities.forEach(e => {
          context += `- ${e.name} (${e.type}): ${e.description}\n`
        })
        context += '\n'
      }
    }

    // Adicionar mensagens recentes
    if (recentMessages.length > 0) {
      context += `## MENSAGENS RECENTES:\n`
      recentMessages.forEach(m => {
        const role = m.role === 'user' ? 'Usuario' : 'Assistente'
        const preview = m.content.length > 300 ? m.content.substring(0, 300) + '...' : m.content
        context += `[${role}]: ${preview}\n\n`
      })
    }

    return context
  }

  /**
   * Obtem mensagens no formato LangChain
   */
  getLangChainMessages(): BaseMessage[] {
    const messages: BaseMessage[] = []

    // Adicionar resumo como contexto do sistema
    if (this.summary) {
      messages.push(new SystemMessage(
        `Contexto da conversa anterior: ${this.summary.summary}`
      ))
    }

    // Adicionar mensagens recentes
    const recentMessages = this.messages.slice(-this.config.maxRecentMessages)
    recentMessages.forEach(m => {
      if (m.role === 'user') {
        messages.push(new HumanMessage(m.content))
      } else {
        messages.push(new AIMessage(m.content))
      }
    })

    return messages
  }

  /**
   * Obtem entidades detectadas
   */
  getEntities(): EntityInfo[] {
    return this.summary?.entities || []
  }

  /**
   * Obtem topicos discutidos
   */
  getTopics(): string[] {
    return this.summary?.topics || []
  }

  /**
   * Obtem estatisticas da memoria
   */
  getStats(): { totalMessages: number; hasSummary: boolean; entities: number; topics: number } {
    return {
      totalMessages: this.messages.length,
      hasSummary: this.summary !== null,
      entities: this.summary?.entities.length || 0,
      topics: this.summary?.topics.length || 0
    }
  }

  /**
   * Limpa a memoria
   */
  clear(): void {
    this.messages = []
    this.summary = null
  }

  // ==========================================
  // METODOS PRIVADOS
  // ==========================================

  /**
   * Atualiza o resumo da conversa
   */
  private async updateSummary(): Promise<void> {
    // Pegar mensagens antigas para resumir
    const messagesToSummarize = this.messages.slice(0, -this.config.maxRecentMessages)

    if (messagesToSummarize.length < 5) {
      return // Nao vale a pena resumir poucas mensagens
    }

    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey: process.env.GEMINI_API_KEY!,
      temperature: 0.3,
      maxOutputTokens: 1000
    })

    const conversationText = messagesToSummarize
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Assistente'}: ${m.content}`)
      .join('\n\n')

    const prompt = `Analise esta conversa medica e forneca:
1. Um RESUMO conciso (maximo 3 paragrafos)
2. TOPICOS discutidos (lista)
3. ENTIDADES importantes (pacientes, medicamentos, doencas, exames) com tipo e descricao
4. PONTOS-CHAVE da discussao

CONVERSA:
${conversationText}

Responda em JSON:
{
  "summary": "...",
  "topics": ["...", "..."],
  "entities": [
    {"name": "...", "type": "paciente|medicamento|doenca|exame|procedimento|outro", "description": "..."}
  ],
  "keyPoints": ["...", "..."]
}`

    try {
      const response = await model.invoke([
        new SystemMessage('Voce e um assistente que resume conversas medicas.'),
        new HumanMessage(prompt)
      ])

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content)

      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])

        // Merge com resumo existente se houver
        if (this.summary) {
          this.summary = {
            summary: parsed.summary,
            topics: [...new Set([...this.summary.topics, ...parsed.topics])],
            entities: this.mergeEntities(this.summary.entities, parsed.entities || []),
            keyPoints: [...this.summary.keyPoints, ...(parsed.keyPoints || [])].slice(-10),
            lastUpdated: Date.now()
          }
        } else {
          this.summary = {
            summary: parsed.summary,
            topics: parsed.topics || [],
            entities: (parsed.entities || []).map((e: Partial<EntityInfo>) => ({
              ...e,
              mentions: 1
            })),
            keyPoints: parsed.keyPoints || [],
            lastUpdated: Date.now()
          }
        }

        // Remover mensagens antigas que foram resumidas
        this.messages = this.messages.slice(-this.config.maxRecentMessages)
      }
    } catch (error) {
      console.error('[ConversationMemory] Erro ao criar resumo:', error)
      // Continua sem resumo - nao e critico
    }
  }

  /**
   * Merge entidades novas com existentes
   */
  private mergeEntities(existing: EntityInfo[], newEntities: Partial<EntityInfo>[]): EntityInfo[] {
    const merged = new Map<string, EntityInfo>()

    // Adicionar existentes
    existing.forEach(e => {
      merged.set(e.name.toLowerCase(), e)
    })

    // Adicionar/atualizar novas
    newEntities.forEach(e => {
      if (!e.name) return

      const key = e.name.toLowerCase()
      if (merged.has(key)) {
        const current = merged.get(key)!
        current.mentions += 1
        if (e.description && e.description.length > current.description.length) {
          current.description = e.description
        }
      } else {
        merged.set(key, {
          name: e.name,
          type: e.type || 'outro',
          description: e.description || '',
          mentions: 1
        })
      }
    })

    return Array.from(merged.values())
  }
}

// ==========================================
// FACTORY FUNCTION
// ==========================================

export function createConversationMemory(config?: Partial<MemoryConfig>): ConversationMemory {
  return new ConversationMemory(config)
}

// ==========================================
// EXPORT
// ==========================================

export default ConversationMemory
