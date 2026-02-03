// LangChain - Ferramenta de Banco de Dados
// Busca questoes e conteudo no Supabase

import { Tool } from '@langchain/core/tools'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ==========================================
// CONFIGURACAO
// ==========================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ==========================================
// TIPOS
// ==========================================

export interface QuestaoResult {
  id: number
  enunciado: string
  alternativas: Record<string, string>
  gabarito: string
  explicacao?: string
  ano?: number
  banca?: { nome: string }
  disciplina?: { nome: string }
  tema?: string
}

export interface SearchOptions {
  tema?: string
  disciplina?: string
  banca?: string
  anoMin?: number
  anoMax?: number
  dificuldade?: string
  limit?: number
}

// ==========================================
// CLASSE - BUSCA DE QUESTOES
// ==========================================

export class BuscarQuestoesTool extends Tool {
  name = 'buscar_questoes_banco'
  description = `Busca questoes de provas anteriores no banco de dados.
Use esta ferramenta quando o usuario quiser:
- Praticar com questoes de provas reais
- Estudar questoes de uma banca especifica (REVALIDA, USP, UNICAMP, etc)
- Questoes sobre um tema especifico
- Questoes de determinado ano

Input: JSON com filtros (tema, disciplina, banca, ano) ou string com tema`

  async _call(input: string): Promise<string> {
    let options: SearchOptions

    if (input.startsWith('{')) {
      try {
        options = JSON.parse(input)
      } catch {
        options = { tema: input }
      }
    } else {
      options = { tema: input }
    }

    try {
      const questoes = await this.buscarQuestoes(options)
      return this.formatQuestoes(questoes)
    } catch (error) {
      console.error('[DatabaseTool] Erro na busca:', error)
      return `Erro ao buscar questoes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }

  async _callWithOptions(input: string | SearchOptions): Promise<string> {
    let options: SearchOptions

    if (typeof input === 'string') {
      try {
        options = JSON.parse(input)
      } catch {
        // Se nao for JSON, usar como tema
        options = { tema: input }
      }
    } else {
      options = input
    }

    try {
      const questoes = await this.buscarQuestoes(options)
      return this.formatQuestoes(questoes)
    } catch (error) {
      console.error('[DatabaseTool] Erro na busca:', error)
      return `Erro ao buscar questoes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }

  /**
   * Busca questoes no Supabase
   */
  async buscarQuestoes(options: SearchOptions): Promise<QuestaoResult[]> {
    const { tema, disciplina, banca, anoMin, anoMax, limit = 10 } = options

    let query = supabase
      .from('questoes_med')
      .select(`
        id,
        enunciado,
        alternativas,
        gabarito,
        explicacao,
        ano,
        banca:bancas_med(nome),
        disciplina:disciplinas_med(nome)
      `)
      .limit(limit)

    // Aplicar filtros
    if (tema) {
      query = query.or(`enunciado.ilike.%${tema}%,tema.ilike.%${tema}%`)
    }

    if (disciplina) {
      // Buscar ID da disciplina primeiro
      const { data: disc } = await supabase
        .from('disciplinas_med')
        .select('id')
        .ilike('nome', `%${disciplina}%`)
        .single()

      if (disc) {
        query = query.eq('disciplina_id', disc.id)
      }
    }

    if (banca) {
      // Buscar ID da banca
      const { data: bancaData } = await supabase
        .from('bancas_med')
        .select('id')
        .ilike('nome', `%${banca}%`)
        .single()

      if (bancaData) {
        query = query.eq('banca_id', bancaData.id)
      }
    }

    if (anoMin) {
      query = query.gte('ano', anoMin)
    }

    if (anoMax) {
      query = query.lte('ano', anoMax)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return (data || []) as unknown as QuestaoResult[]
  }

  /**
   * Formata questoes para exibicao
   */
  private formatQuestoes(questoes: QuestaoResult[]): string {
    if (questoes.length === 0) {
      return 'Nenhuma questao encontrada com os filtros especificados.'
    }

    let text = `## Encontrei ${questoes.length} questoes:\n\n`

    questoes.forEach((q, i) => {
      text += `### Questao ${i + 1}\n`
      if (q.banca?.nome || q.ano) {
        text += `*${q.banca?.nome || 'Banca nao informada'} - ${q.ano || 'Ano nao informado'}*\n\n`
      }

      text += `${q.enunciado}\n\n`

      if (q.alternativas) {
        Object.entries(q.alternativas).forEach(([letra, alt]) => {
          text += `${letra}) ${alt}\n`
        })
      }

      text += `\n<details>\n<summary>Ver Gabarito</summary>\n\n`
      text += `**Gabarito: ${q.gabarito}**\n\n`
      if (q.explicacao) {
        text += `**Explicacao:** ${q.explicacao}\n`
      }
      text += `</details>\n\n---\n\n`
    })

    return text
  }
}

// ==========================================
// CLASSE - BUSCA DE FLASHCARDS SALVOS
// ==========================================

export class BuscarFlashcardsTool extends Tool {
  name = 'buscar_flashcards_salvos'
  description = `Busca flashcards salvos pelo usuario no banco de dados.
Use quando o usuario quiser revisar flashcards existentes.
Input: JSON com userId, categoria (opcional), limit (opcional)`

  async _call(input: string): Promise<string> {
    let params: { userId: string; categoria?: string; limit?: number }

    try {
      params = JSON.parse(input)
    } catch {
      return 'Erro: Input invalido. Esperado JSON com userId.'
    }

    try {
      let query = supabase
        .from('flashcards_med')
        .select('*')
        .eq('user_id', params.userId)
        .limit(params.limit || 20)

      if (params.categoria) {
        query = query.ilike('categoria', `%${params.categoria}%`)
      }

      const { data, error } = await query

      if (error) throw error

      if (!data || data.length === 0) {
        return 'Nenhum flashcard encontrado.'
      }

      let text = `## Seus Flashcards (${data.length}):\n\n`
      data.forEach((f, i) => {
        text += `### ${i + 1}. ${f.frente}\n`
        text += `**Resposta:** ${f.verso}\n`
        if (f.categoria) text += `*Categoria: ${f.categoria}*\n`
        text += '\n'
      })

      return text

    } catch (error) {
      return `Erro ao buscar flashcards: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }
}

// ==========================================
// CLASSE - ESTATISTICAS DO USUARIO
// ==========================================

export class EstatisticasUsuarioTool extends Tool {
  name = 'estatisticas_usuario'
  description = `Busca estatisticas de estudo do usuario.
Use para mostrar progresso, areas fortes/fracas, etc.
Input: userId (string)`

  async _call(input: string): Promise<string> {
    const userId = input

    try {
      // Buscar estatisticas de questoes
      const { data: questoes } = await supabase
        .from('respostas_questoes_med')
        .select('correta, disciplina_id')
        .eq('user_id', userId)

      // Buscar flashcards
      const { data: flashcards } = await supabase
        .from('flashcards_med')
        .select('id')
        .eq('user_id', userId)

      // Calcular estatisticas
      const totalQuestoes = questoes?.length || 0
      const acertos = questoes?.filter(q => q.correta).length || 0
      const taxa = totalQuestoes > 0 ? Math.round((acertos / totalQuestoes) * 100) : 0

      let text = `## Suas Estatisticas de Estudo\n\n`
      text += `**Questoes respondidas:** ${totalQuestoes}\n`
      text += `**Taxa de acerto:** ${taxa}%\n`
      text += `**Flashcards criados:** ${flashcards?.length || 0}\n`

      return text

    } catch (error) {
      return `Erro ao buscar estatisticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default BuscarQuestoesTool
