// LangChain - Ferramenta de Busca Web com SERPER.DEV
// Busca informacoes medicas atualizadas na internet

import { Tool } from '@langchain/core/tools'
import { z } from 'zod'

// ==========================================
// TIPOS
// ==========================================

export interface SerperResult {
  title: string
  link: string
  snippet: string
  position: number
  source?: string
  date?: string
}

export interface SerperSearchOutput {
  results: SerperResult[]
  query: string
  totalResults: number
}

// ==========================================
// CONFIGURACAO
// ==========================================

const SERPER_API_KEY = process.env.SERPER_API_KEY
const SERPER_BASE_URL = 'https://google.serper.dev/search'

// Dominios medicos confiaveis
const MEDICAL_DOMAINS = [
  'pubmed.ncbi.nlm.nih.gov',
  'uptodate.com',
  'medscape.com',
  'mayoclinic.org',
  'who.int',
  'cdc.gov',
  'anvisa.gov.br',
  'saude.gov.br',
  'scielo.br',
  'msdmanuals.com',
  'bmj.com',
  'nejm.org',
  'thelancet.com',
  'nature.com/medicine'
]

// ==========================================
// CLASSE DA FERRAMENTA
// ==========================================

export class SerperMedicalSearchTool extends Tool {
  name = 'busca_medica_web'
  description = `Busca informacoes medicas atualizadas na internet.
Use esta ferramenta quando precisar de:
- Guidelines e protocolos atualizados
- Informacoes sobre medicamentos (bulas, indicacoes, doses)
- Artigos cientificos recentes
- Dados epidemiologicos atuais
- Noticias de saude publica

Input: Query de busca em portugues ou ingles (string)`

  async _call(input: string): Promise<string> {
    const query = input
    const numResults = 5
    const onlyMedicalSources = true

    try {
      const results = await this.search(query, numResults, onlyMedicalSources)
      return this.formatResults(results)
    } catch (error) {
      console.error('[SerperTool] Erro na busca:', error)
      return `Erro ao buscar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }

  /**
   * Executa busca no SERPER.DEV
   */
  async search(query: string, numResults: number = 5, onlyMedicalSources: boolean = true): Promise<SerperSearchOutput> {
    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY nao configurada')
    }

    // Adicionar termos medicos a query se necessario
    let enhancedQuery = query
    if (onlyMedicalSources) {
      // Adicionar sites confiaveis
      const siteFilter = MEDICAL_DOMAINS.slice(0, 5).map(d => `site:${d}`).join(' OR ')
      enhancedQuery = `(${query}) (${siteFilter})`
    }

    const response = await fetch(SERPER_BASE_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: enhancedQuery,
        num: numResults * 2, // Buscar mais para filtrar
        gl: 'br',
        hl: 'pt-br'
      })
    })

    if (!response.ok) {
      throw new Error(`SERPER API erro: ${response.status}`)
    }

    const data = await response.json()

    // Extrair resultados organicos
    const organic = data.organic || []

    // Filtrar e formatar
    let results: SerperResult[] = organic.map((item: {
      title: string
      link: string
      snippet: string
      position: number
      source?: string
      date?: string
    }, index: number) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      position: index + 1,
      source: this.extractSource(item.link),
      date: item.date
    }))

    // Filtrar apenas fontes medicas se solicitado
    if (onlyMedicalSources) {
      results = results.filter(r =>
        MEDICAL_DOMAINS.some(d => r.link.includes(d)) ||
        this.isMedicalContent(r.title, r.snippet)
      )
    }

    // Limitar ao numero solicitado
    results = results.slice(0, numResults)

    return {
      results,
      query,
      totalResults: results.length
    }
  }

  /**
   * Extrai nome da fonte do link
   */
  private extractSource(link: string): string {
    try {
      const url = new URL(link)
      return url.hostname.replace('www.', '')
    } catch {
      return 'fonte desconhecida'
    }
  }

  /**
   * Verifica se o conteudo parece ser medico
   */
  private isMedicalContent(title: string, snippet: string): boolean {
    const medicalTerms = [
      'medic', 'saude', 'health', 'doenca', 'disease', 'tratamento', 'treatment',
      'diagnostico', 'diagnosis', 'sintoma', 'symptom', 'paciente', 'patient',
      'clinico', 'clinical', 'hospital', 'medicamento', 'drug', 'farmaco'
    ]

    const text = (title + ' ' + snippet).toLowerCase()
    return medicalTerms.some(term => text.includes(term))
  }

  /**
   * Formata resultados para exibicao
   */
  private formatResults(output: SerperSearchOutput): string {
    if (output.results.length === 0) {
      return `Nenhum resultado encontrado para: "${output.query}"`
    }

    let text = `## Resultados da Busca: "${output.query}"\n\n`

    output.results.forEach((r, i) => {
      text += `### ${i + 1}. ${r.title}\n`
      text += `**Fonte:** [${r.source}](${r.link})\n`
      text += `${r.snippet}\n\n`
    })

    return text
  }
}

// ==========================================
// FUNCAO AUXILIAR PARA BUSCA RAPIDA
// ==========================================

export async function searchMedicalWeb(
  query: string,
  options?: { numResults?: number; onlyMedicalSources?: boolean }
): Promise<SerperSearchOutput> {
  const tool = new SerperMedicalSearchTool()
  return tool.search(query, options?.numResults, options?.onlyMedicalSources)
}

// ==========================================
// EXPORT
// ==========================================

export default SerperMedicalSearchTool
