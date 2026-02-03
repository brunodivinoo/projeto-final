// Agente Pesquisador
// Responsavel por buscar e coletar informacoes

import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { SerperMedicalSearchTool, searchMedicalWeb } from '../../langchain/tools/serper-tool'

// ==========================================
// TIPOS
// ==========================================

export interface ResearchResult {
  topic: string
  findings: string[]
  sources: Array<{ title: string; url: string; snippet: string }>
  summary: string
  confidence: number
}

export interface ResearchTask {
  query: string
  context?: string
  depth?: 'shallow' | 'medium' | 'deep'
  focusAreas?: string[]
}

// ==========================================
// PROMPT DO AGENTE
// ==========================================

const RESEARCHER_SYSTEM_PROMPT = `Voce e um AGENTE PESQUISADOR especializado em medicina.

SEU PAPEL:
- Buscar informacoes atualizadas e confiaveis
- Analisar e sintetizar dados de multiplas fontes
- Identificar consensos e controversias
- Fornecer evidencias para embasar decisoes

COMO VOCE TRABALHA:
1. Recebe uma tarefa de pesquisa
2. Identifica as melhores fontes para o tema
3. Coleta informacoes relevantes
4. Analisa e sintetiza os achados
5. Retorna um relatorio estruturado

FONTES PRIORITARIAS:
- Guidelines (OMS, sociedades medicas)
- Artigos cientificos (PubMed, Cochrane)
- Livros-texto de referencia
- Consensos e diretrizes brasileiras

FORMATO DE SAIDA:
Sempre retorne um JSON estruturado com:
- topic: tema pesquisado
- findings: lista de achados principais
- sources: fontes consultadas
- summary: resumo executivo
- confidence: nivel de confianca (0-1)`

// ==========================================
// CLASSE DO AGENTE
// ==========================================

export class ResearcherAgent {
  private model: ChatGoogleGenerativeAI | ChatAnthropic
  private searchTool: SerperMedicalSearchTool

  constructor(provider: 'gemini' | 'claude' = 'gemini') {
    if (provider === 'claude') {
      this.model = new ChatAnthropic({
        modelName: 'claude-sonnet-4-20250514',
        anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
        temperature: 0.3,
        maxTokens: 4000
      })
    } else {
      this.model = new ChatGoogleGenerativeAI({
        model: 'gemini-2.0-flash',
        apiKey: process.env.GEMINI_API_KEY!,
        temperature: 0.3,
        maxOutputTokens: 4000
      })
    }

    this.searchTool = new SerperMedicalSearchTool()
  }

  /**
   * Executa uma tarefa de pesquisa
   */
  async research(task: ResearchTask): Promise<ResearchResult> {
    const { query, context, depth = 'medium', focusAreas } = task

    console.log(`[ResearcherAgent] Iniciando pesquisa: ${query}`)

    // Passo 1: Buscar informacoes na web
    let webResults: Array<{ title: string; url: string; snippet: string }> = []

    try {
      const numResults = depth === 'deep' ? 10 : depth === 'medium' ? 5 : 3
      const searchOutput = await searchMedicalWeb(query, { numResults })
      webResults = searchOutput.results.map(r => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet
      }))
    } catch (error) {
      console.error('[ResearcherAgent] Erro na busca web:', error)
    }

    // Passo 2: Analisar com LLM
    let userPrompt = `TAREFA DE PESQUISA:\n${query}\n\n`

    if (context) {
      userPrompt += `CONTEXTO:\n${context}\n\n`
    }

    if (focusAreas && focusAreas.length > 0) {
      userPrompt += `FOCAR EM:\n${focusAreas.join(', ')}\n\n`
    }

    if (webResults.length > 0) {
      userPrompt += `RESULTADOS DA BUSCA WEB:\n`
      webResults.forEach((r, i) => {
        userPrompt += `${i + 1}. ${r.title}\n   ${r.snippet}\n   Fonte: ${r.url}\n\n`
      })
    }

    userPrompt += `\nAnalise as informacoes e retorne um JSON com:
{
  "topic": "tema pesquisado",
  "findings": ["achado 1", "achado 2", ...],
  "sources": [{"title": "...", "url": "...", "snippet": "..."}],
  "summary": "resumo executivo",
  "confidence": 0.85
}`

    const response = await this.model.invoke([
      new SystemMessage(RESEARCHER_SYSTEM_PROMPT),
      new HumanMessage(userPrompt)
    ])

    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)

    // Extrair JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // Fallback se nao conseguir extrair JSON
      return {
        topic: query,
        findings: [content],
        sources: webResults,
        summary: content.substring(0, 500),
        confidence: 0.5
      }
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        topic: parsed.topic || query,
        findings: parsed.findings || [],
        sources: parsed.sources || webResults,
        summary: parsed.summary || '',
        confidence: parsed.confidence || 0.7
      }
    } catch {
      return {
        topic: query,
        findings: [content],
        sources: webResults,
        summary: content.substring(0, 500),
        confidence: 0.5
      }
    }
  }

  /**
   * Pesquisa multiplos topicos em paralelo
   */
  async researchMultiple(tasks: ResearchTask[]): Promise<ResearchResult[]> {
    const results = await Promise.all(
      tasks.map(task => this.research(task))
    )
    return results
  }
}

// ==========================================
// FACTORY FUNCTION
// ==========================================

export function createResearcherAgent(provider?: 'gemini' | 'claude'): ResearcherAgent {
  return new ResearcherAgent(provider)
}

// ==========================================
// EXPORT
// ==========================================

export default ResearcherAgent
