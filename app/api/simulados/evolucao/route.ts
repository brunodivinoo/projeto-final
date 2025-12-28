import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PontoEvolucao {
  data: string
  data_formatada: string
  simulado_id: string
  titulo: string
  pontuacao: number
  acertos: number
  erros: number
  total_questoes: number
  tempo_gasto_minutos: number
  tempo_por_questao_segundos: number
}

interface EvolucaoPorDisciplina {
  disciplina: string
  pontos: Array<{
    data: string
    percentual: number
    acertos: number
    total: number
  }>
  tendencia: 'melhorando' | 'piorando' | 'estavel'
  variacao_total: number
}

interface EstatisticasPeriodo {
  periodo: string
  total_simulados: number
  total_questoes: number
  media_pontuacao: number
  melhor_pontuacao: number
  pior_pontuacao: number
  tempo_total_minutos: number
}

// GET - Obter dados de evolução temporal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const periodo = searchParams.get('periodo') || '30d' // 7d, 30d, 90d, 6m, 1a, all
    const tipo = searchParams.get('tipo') || 'geral' // geral, disciplina, dificuldade

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Verificar se usuário é PRO para dados avançados
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano')
      .eq('id', user_id)
      .single()

    const isPro = profile?.plano?.toLowerCase() === 'pro' ||
                  profile?.plano?.toLowerCase() === 'estuda_pro'

    // Calcular data de início baseada no período
    const dataInicio = calcularDataInicio(periodo)

    // Buscar simulados do período
    let query = supabase
      .from('simulados')
      .select(`
        id,
        titulo,
        pontuacao,
        acertos,
        erros,
        quantidade_questoes,
        tempo_gasto_segundos,
        finalizado_em,
        simulado_questoes(
          esta_correta,
          tempo_resposta_segundos,
          questao:questoes(disciplina, assunto, dificuldade)
        )
      `)
      .eq('user_id', user_id)
      .eq('status', 'finalizado')
      .order('finalizado_em', { ascending: true })

    if (dataInicio) {
      query = query.gte('finalizado_em', dataInicio.toISOString())
    }

    // Limitar dados para não-PRO
    if (!isPro) {
      query = query.limit(10)
    }

    const { data: simulados, error } = await query

    if (error) {
      console.error('[EVOLUCAO] Erro ao buscar simulados:', error)
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
    }

    if (!simulados || simulados.length === 0) {
      return NextResponse.json({
        evolucao_geral: [],
        evolucao_por_disciplina: [],
        estatisticas_periodo: [],
        resumo: {
          total_simulados: 0,
          media_geral: 0,
          tendencia: 'estavel',
          melhor_disciplina: null,
          pior_disciplina: null
        }
      })
    }

    // Processar evolução geral
    const evolucaoGeral: PontoEvolucao[] = simulados.map(sim => {
      const tempoGastoMin = Math.round((sim.tempo_gasto_segundos || 0) / 60)
      const tempoPorQuestao = sim.quantidade_questoes > 0 && sim.tempo_gasto_segundos
        ? Math.round(sim.tempo_gasto_segundos / sim.quantidade_questoes)
        : 0

      return {
        data: sim.finalizado_em,
        data_formatada: formatarData(sim.finalizado_em),
        simulado_id: sim.id,
        titulo: sim.titulo,
        pontuacao: sim.pontuacao || 0,
        acertos: sim.acertos || 0,
        erros: sim.erros || 0,
        total_questoes: sim.quantidade_questoes,
        tempo_gasto_minutos: tempoGastoMin,
        tempo_por_questao_segundos: tempoPorQuestao
      }
    })

    // Processar evolução por disciplina (apenas PRO)
    let evolucaoPorDisciplina: EvolucaoPorDisciplina[] = []

    if (isPro && tipo !== 'simples') {
      const disciplinasData = new Map<string, Array<{
        data: string
        acertos: number
        total: number
      }>>()

      simulados.forEach(sim => {
        const data = sim.finalizado_em
        const questoes = sim.simulado_questoes || []

        // Agrupar por disciplina
        const porDisciplina = new Map<string, { acertos: number; total: number }>()

        questoes.forEach((q: { esta_correta?: boolean; questao?: { disciplina?: string } }) => {
          if (q.esta_correta === null || q.esta_correta === undefined) return

          const disciplina = q.questao?.disciplina || 'Sem disciplina'

          if (!porDisciplina.has(disciplina)) {
            porDisciplina.set(disciplina, { acertos: 0, total: 0 })
          }

          const stats = porDisciplina.get(disciplina)!
          stats.total++
          if (q.esta_correta) stats.acertos++
        })

        // Adicionar aos dados por disciplina
        porDisciplina.forEach((stats, disciplina) => {
          if (!disciplinasData.has(disciplina)) {
            disciplinasData.set(disciplina, [])
          }

          disciplinasData.get(disciplina)!.push({
            data,
            acertos: stats.acertos,
            total: stats.total
          })
        })
      })

      // Processar cada disciplina
      evolucaoPorDisciplina = Array.from(disciplinasData.entries())
        .filter(([, pontos]) => pontos.length >= 2) // Pelo menos 2 pontos para tendência
        .map(([disciplina, pontosRaw]) => {
          // Ordenar por data
          const pontos = pontosRaw
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .map(p => ({
              data: p.data,
              percentual: p.total > 0 ? Math.round((p.acertos / p.total) * 100) : 0,
              acertos: p.acertos,
              total: p.total
            }))

          // Calcular tendência
          const primeiro = pontos[0].percentual
          const ultimo = pontos[pontos.length - 1].percentual
          const variacao = ultimo - primeiro

          let tendencia: 'melhorando' | 'piorando' | 'estavel'
          if (variacao > 10) tendencia = 'melhorando'
          else if (variacao < -10) tendencia = 'piorando'
          else tendencia = 'estavel'

          return {
            disciplina,
            pontos,
            tendencia,
            variacao_total: variacao
          }
        })
        .sort((a, b) => b.pontos.length - a.pontos.length) // Ordenar por quantidade de dados
    }

    // Calcular estatísticas por período (semana/mês)
    const estatisticasPeriodo = calcularEstatisticasPeriodo(simulados, periodo)

    // Calcular resumo geral
    const pontuacoes = evolucaoGeral.map(e => e.pontuacao)
    const mediaGeral = pontuacoes.length > 0
      ? pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length
      : 0

    // Tendência geral (comparar primeira metade com segunda metade)
    let tendenciaGeral: 'melhorando' | 'piorando' | 'estavel' = 'estavel'
    if (pontuacoes.length >= 4) {
      const metade = Math.floor(pontuacoes.length / 2)
      const primeiraMeta = pontuacoes.slice(0, metade)
      const segundaMetade = pontuacoes.slice(metade)

      const mediaPrimeira = primeiraMeta.reduce((a, b) => a + b, 0) / primeiraMeta.length
      const mediaSegunda = segundaMetade.reduce((a, b) => a + b, 0) / segundaMetade.length

      if (mediaSegunda - mediaPrimeira > 5) tendenciaGeral = 'melhorando'
      else if (mediaSegunda - mediaPrimeira < -5) tendenciaGeral = 'piorando'
    }

    // Identificar melhor e pior disciplina
    const disciplinasResumo = evolucaoPorDisciplina
      .filter(d => d.pontos.length >= 2)
      .map(d => {
        const mediaDisc = d.pontos.reduce((acc, p) => acc + p.percentual, 0) / d.pontos.length
        return { disciplina: d.disciplina, media: mediaDisc }
      })
      .sort((a, b) => b.media - a.media)

    const melhorDisciplina = disciplinasResumo[0] || null
    const piorDisciplina = disciplinasResumo[disciplinasResumo.length - 1] || null

    // Calcular média móvel (últimos 5 simulados)
    const mediaMovel: Array<{ data: string; media: number }> = []
    for (let i = 4; i < evolucaoGeral.length; i++) {
      const ultimos5 = evolucaoGeral.slice(i - 4, i + 1)
      const media = ultimos5.reduce((acc, e) => acc + e.pontuacao, 0) / 5
      mediaMovel.push({
        data: evolucaoGeral[i].data,
        media: Math.round(media * 100) / 100
      })
    }

    return NextResponse.json({
      evolucao_geral: evolucaoGeral,
      evolucao_por_disciplina: evolucaoPorDisciplina,
      estatisticas_periodo: estatisticasPeriodo,
      media_movel: mediaMovel,
      resumo: {
        total_simulados: simulados.length,
        media_geral: Math.round(mediaGeral * 100) / 100,
        tendencia: tendenciaGeral,
        melhor_disciplina: melhorDisciplina,
        pior_disciplina: piorDisciplina,
        periodo_analisado: periodo
      }
    })

  } catch (error) {
    console.error('[EVOLUCAO] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function calcularDataInicio(periodo: string): Date | null {
  const agora = new Date()

  switch (periodo) {
    case '7d':
      return new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '6m':
      return new Date(agora.getTime() - 180 * 24 * 60 * 60 * 1000)
    case '1a':
      return new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000)
    case 'all':
      return null
    default:
      return new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
}

function formatarData(dataISO: string): string {
  const data = new Date(dataISO)
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  })
}

function calcularEstatisticasPeriodo(
  simulados: Array<{
    finalizado_em: string
    pontuacao: number | null
    quantidade_questoes: number
    tempo_gasto_segundos: number | null
  }>,
  periodoFiltro: string
): EstatisticasPeriodo[] {
  const estatisticas: EstatisticasPeriodo[] = []

  // Agrupar por semana ou mês dependendo do período
  const agruparPorMes = periodoFiltro === '90d' || periodoFiltro === '6m' || periodoFiltro === '1a' || periodoFiltro === 'all'

  const grupos = new Map<string, typeof simulados>()

  simulados.forEach(sim => {
    const data = new Date(sim.finalizado_em)
    let chave: string

    if (agruparPorMes) {
      chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
    } else {
      // Agrupar por semana
      const inicioSemana = new Date(data)
      inicioSemana.setDate(data.getDate() - data.getDay())
      chave = `${inicioSemana.getFullYear()}-${String(inicioSemana.getMonth() + 1).padStart(2, '0')}-${String(inicioSemana.getDate()).padStart(2, '0')}`
    }

    if (!grupos.has(chave)) {
      grupos.set(chave, [])
    }
    grupos.get(chave)!.push(sim)
  })

  // Processar cada grupo
  Array.from(grupos.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([chave, simsGrupo]) => {
      const pontuacoes = simsGrupo.map(s => s.pontuacao || 0)
      const tempoTotal = simsGrupo.reduce((acc, s) => acc + (s.tempo_gasto_segundos || 0), 0)

      // Formatar período para exibição
      let periodoFormatado: string
      if (agruparPorMes) {
        const [ano, mes] = chave.split('-')
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        periodoFormatado = `${meses[parseInt(mes) - 1]}/${ano}`
      } else {
        const [ano, mes, dia] = chave.split('-')
        periodoFormatado = `Sem. ${dia}/${mes}/${ano}`
      }

      estatisticas.push({
        periodo: periodoFormatado,
        total_simulados: simsGrupo.length,
        total_questoes: simsGrupo.reduce((acc, s) => acc + s.quantidade_questoes, 0),
        media_pontuacao: Math.round(pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length * 100) / 100,
        melhor_pontuacao: Math.max(...pontuacoes),
        pior_pontuacao: Math.min(...pontuacoes),
        tempo_total_minutos: Math.round(tempoTotal / 60)
      })
    })

  return estatisticas
}
