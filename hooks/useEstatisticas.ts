'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// Tipos
export interface DesempenhoDisciplina {
  disciplina: string
  total: number
  acertos: number
  taxa: number
  assuntos: DesempenhoAssunto[]
}

export interface DesempenhoAssunto {
  assunto: string
  total: number
  acertos: number
  taxa: number
  subassuntos: DesempenhoSubassunto[]
}

export interface DesempenhoSubassunto {
  subassunto: string
  total: number
  acertos: number
  taxa: number
}

export interface DesempenhoDificuldade {
  dificuldade: string
  total: number
  acertos: number
  taxa: number
}

export interface EvolucaoDiaria {
  data: string
  questoes: number
  acertos: number
  taxa: number
}

export interface Atividade {
  id: string
  tipo: string
  titulo: string
  descricao: string
  icone: string
  cor: string
  created_at: string
}

export interface EstatisticasData {
  // Resumo geral
  questoesTotal: number
  questoesHoje: number
  questoesSemana: number
  questoesMes: number
  acertosTotal: number
  taxaAcertoGeral: number
  sequenciaDias: number
  horasEstudadas: number

  // Desempenho por area
  desempenhoDisciplinas: DesempenhoDisciplina[]
  desempenhoDificuldade: DesempenhoDificuldade[]

  // Evolucao
  evolucao30Dias: EvolucaoDiaria[]

  // Historico
  atividades: Atividade[]

  // Estado
  loading: boolean
  error: string | null

  // Acoes
  refresh: () => Promise<void>
  filtrarAtividades: (periodo: 'dia' | 'semana' | 'mes' | 'custom', dataInicio?: string, dataFim?: string) => Promise<Atividade[]>
}

// Gerar evolucao vazia para 30 dias (sem dados mock)
const gerarEvolucaoVazia = (): EvolucaoDiaria[] => {
  return Array.from({ length: 30 }, (_, i) => {
    const data = new Date()
    data.setDate(data.getDate() - (29 - i))
    return {
      data: data.toISOString().split('T')[0],
      questoes: 0,
      acertos: 0,
      taxa: 0
    }
  })
}

export function useEstatisticas(): EstatisticasData {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados
  const [questoesTotal, setQuestoesTotal] = useState(0)
  const [questoesHoje, setQuestoesHoje] = useState(0)
  const [questoesSemana, setQuestoesSemana] = useState(0)
  const [questoesMes, setQuestoesMes] = useState(0)
  const [acertosTotal, setAcertosTotal] = useState(0)
  const [taxaAcertoGeral, setTaxaAcertoGeral] = useState(0)
  const [sequenciaDias, setSequenciaDias] = useState(0)
  const [horasEstudadas, setHorasEstudadas] = useState(0)

  const [desempenhoDisciplinas, setDesempenhoDisciplinas] = useState<DesempenhoDisciplina[]>([])
  const [desempenhoDificuldade, setDesempenhoDificuldade] = useState<DesempenhoDificuldade[]>([])
  const [evolucao30Dias, setEvolucao30Dias] = useState<EvolucaoDiaria[]>(gerarEvolucaoVazia())
  const [atividades, setAtividades] = useState<Atividade[]>([])

  const fetchEstatisticas = useCallback(async () => {
    if (authLoading) return

    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const hoje = new Date()
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
      const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay()).toISOString()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
      const inicio30Dias = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 30).toISOString()

      // Buscar todas as respostas do usuario
      const { data: respostas, error: respostasError } = await supabase
        .from('respostas_usuario')
        .select(`
          id,
          questao_id,
          acertou,
          tempo_segundos,
          created_at,
          questoes (
            disciplina,
            assunto,
            subassunto,
            dificuldade
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (respostasError) {
        console.error('Erro ao buscar respostas:', respostasError)
        throw respostasError
      }

      // Buscar estatisticas do usuario
      const { data: stats } = await supabase
        .from('estatisticas_usuario')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Processar respostas
      const todasRespostas = respostas || []
      const total = todasRespostas.length
      const acertos = todasRespostas.filter(r => r.acertou).length

      // Questoes por periodo
      const respostasHoje = todasRespostas.filter(r => r.created_at >= inicioHoje)
      const respostasSemana = todasRespostas.filter(r => r.created_at >= inicioSemana)
      const respostasMes = todasRespostas.filter(r => r.created_at >= inicioMes)

      setQuestoesTotal(total)
      setQuestoesHoje(respostasHoje.length)
      setQuestoesSemana(respostasSemana.length)
      setQuestoesMes(respostasMes.length)
      setAcertosTotal(acertos)
      setTaxaAcertoGeral(total > 0 ? Math.round((acertos / total) * 100) : 0)
      setSequenciaDias(stats?.sequencia_dias || 0)
      setHorasEstudadas(Number(stats?.horas_estudadas) || 0)

      // Processar desempenho por disciplina
      const disciplinasMap = new Map<string, {
        total: number
        acertos: number
        assuntos: Map<string, {
          total: number
          acertos: number
          subassuntos: Map<string, { total: number; acertos: number }>
        }>
      }>()

      todasRespostas.forEach(r => {
        const questao = r.questoes as { disciplina?: string; assunto?: string; subassunto?: string; dificuldade?: string } | null
        if (!questao) return

        const disciplina = questao.disciplina || 'Outros'
        const assunto = questao.assunto || 'Geral'
        const subassunto = questao.subassunto || 'Geral'

        if (!disciplinasMap.has(disciplina)) {
          disciplinasMap.set(disciplina, { total: 0, acertos: 0, assuntos: new Map() })
        }

        const disc = disciplinasMap.get(disciplina)!
        disc.total++
        if (r.acertou) disc.acertos++

        if (!disc.assuntos.has(assunto)) {
          disc.assuntos.set(assunto, { total: 0, acertos: 0, subassuntos: new Map() })
        }

        const ass = disc.assuntos.get(assunto)!
        ass.total++
        if (r.acertou) ass.acertos++

        if (!ass.subassuntos.has(subassunto)) {
          ass.subassuntos.set(subassunto, { total: 0, acertos: 0 })
        }

        const sub = ass.subassuntos.get(subassunto)!
        sub.total++
        if (r.acertou) sub.acertos++
      })

      const desempenhoDisciplinasData: DesempenhoDisciplina[] = Array.from(disciplinasMap.entries())
        .map(([disciplina, data]) => ({
          disciplina,
          total: data.total,
          acertos: data.acertos,
          taxa: data.total > 0 ? Math.round((data.acertos / data.total) * 100) : 0,
          assuntos: Array.from(data.assuntos.entries())
            .map(([assunto, assData]) => ({
              assunto,
              total: assData.total,
              acertos: assData.acertos,
              taxa: assData.total > 0 ? Math.round((assData.acertos / assData.total) * 100) : 0,
              subassuntos: Array.from(assData.subassuntos.entries())
                .map(([subassunto, subData]) => ({
                  subassunto,
                  total: subData.total,
                  acertos: subData.acertos,
                  taxa: subData.total > 0 ? Math.round((subData.acertos / subData.total) * 100) : 0
                }))
                .sort((a, b) => b.total - a.total)
            }))
            .sort((a, b) => b.total - a.total)
        }))
        .sort((a, b) => b.total - a.total)

      setDesempenhoDisciplinas(desempenhoDisciplinasData)

      // Processar desempenho por dificuldade
      const dificuldadeMap = new Map<string, { total: number; acertos: number }>()

      todasRespostas.forEach(r => {
        const questao = r.questoes as { dificuldade?: string } | null
        const dificuldade = questao?.dificuldade || 'media'
        const dificuldadeNome = dificuldade === 'facil' ? 'Fácil' : dificuldade === 'media' ? 'Médio' : 'Difícil'

        if (!dificuldadeMap.has(dificuldadeNome)) {
          dificuldadeMap.set(dificuldadeNome, { total: 0, acertos: 0 })
        }

        const data = dificuldadeMap.get(dificuldadeNome)!
        data.total++
        if (r.acertou) data.acertos++
      })

      const desempenhoDificuldadeData: DesempenhoDificuldade[] = Array.from(dificuldadeMap.entries())
        .map(([dificuldade, data]) => ({
          dificuldade,
          total: data.total,
          acertos: data.acertos,
          taxa: data.total > 0 ? Math.round((data.acertos / data.total) * 100) : 0
        }))

      setDesempenhoDificuldade(desempenhoDificuldadeData)

      // Processar evolucao 30 dias
      const evolucaoMap = new Map<string, { questoes: number; acertos: number }>()

      // Inicializar todos os dias dos ultimos 30 dias
      for (let i = 0; i < 30; i++) {
        const data = new Date()
        data.setDate(data.getDate() - (29 - i))
        const dataStr = data.toISOString().split('T')[0]
        evolucaoMap.set(dataStr, { questoes: 0, acertos: 0 })
      }

      // Preencher com dados reais
      const respostas30Dias = todasRespostas.filter(r => r.created_at >= inicio30Dias)
      respostas30Dias.forEach(r => {
        const dataStr = r.created_at.split('T')[0]
        if (evolucaoMap.has(dataStr)) {
          const data = evolucaoMap.get(dataStr)!
          data.questoes++
          if (r.acertou) data.acertos++
        }
      })

      const evolucaoData: EvolucaoDiaria[] = Array.from(evolucaoMap.entries())
        .map(([data, values]) => ({
          data,
          questoes: values.questoes,
          acertos: values.acertos,
          taxa: values.questoes > 0 ? Math.round((values.acertos / values.questoes) * 100) : 0
        }))

      setEvolucao30Dias(evolucaoData)

      // Buscar atividades recentes
      const { data: atividadesData } = await supabase
        .from('historico_atividades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      setAtividades(atividadesData || [])

    } catch (err) {
      console.error('Erro ao buscar estatisticas:', err)
      setError('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  const filtrarAtividades = useCallback(async (
    periodo: 'dia' | 'semana' | 'mes' | 'custom',
    dataInicio?: string,
    dataFim?: string
  ): Promise<Atividade[]> => {
    if (!user) return []

    const hoje = new Date()
    let inicio: string
    let fim: string = new Date().toISOString()

    switch (periodo) {
      case 'dia':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
        break
      case 'semana':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 7).toISOString()
        break
      case 'mes':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate()).toISOString()
        break
      case 'custom':
        inicio = dataInicio || inicio30DiasPadrao()
        fim = dataFim || new Date().toISOString()
        break
      default:
        inicio = inicio30DiasPadrao()
    }

    const { data, error } = await supabase
      .from('historico_atividades')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', inicio)
      .lte('created_at', fim)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao filtrar atividades:', error)
      return []
    }

    return data || []
  }, [user])

  useEffect(() => {
    fetchEstatisticas()
  }, [fetchEstatisticas])

  return {
    questoesTotal,
    questoesHoje,
    questoesSemana,
    questoesMes,
    acertosTotal,
    taxaAcertoGeral,
    sequenciaDias,
    horasEstudadas,
    desempenhoDisciplinas,
    desempenhoDificuldade,
    evolucao30Dias,
    atividades,
    loading: loading || authLoading,
    error,
    refresh: fetchEstatisticas,
    filtrarAtividades
  }
}

function inicio30DiasPadrao(): string {
  const data = new Date()
  data.setDate(data.getDate() - 30)
  return data.toISOString()
}

// Funcao auxiliar para registrar atividade
export async function registrarAtividade(
  userId: string,
  tipo: string,
  titulo: string,
  descricao: string,
  icone: string = 'check_circle',
  cor: string = '#22c55e',
  metadata: Record<string, unknown> = {}
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('historico_atividades')
      .insert({
        user_id: userId,
        tipo,
        titulo,
        descricao,
        icone,
        cor,
        metadata
      })

    if (error) throw error
    return true
  } catch (err) {
    console.error('Erro ao registrar atividade:', err)
    return false
  }
}
