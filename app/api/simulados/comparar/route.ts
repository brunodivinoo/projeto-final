import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ComparacaoSimulado {
  id: string
  titulo: string
  data: string
  pontuacao: number
  acertos: number
  erros: number
  total_questoes: number
  tempo_gasto_segundos: number
  tempo_medio_por_questao: number
  desempenho_por_disciplina: Array<{
    disciplina: string
    acertos: number
    erros: number
    total: number
    percentual: number
  }>
  desempenho_por_dificuldade: Array<{
    dificuldade: string
    acertos: number
    erros: number
    total: number
    percentual: number
  }>
}

interface ResultadoComparacao {
  simulados: ComparacaoSimulado[]
  analise_comparativa: {
    melhor_simulado: string
    pior_simulado: string
    evolucao_percentual: number
    disciplinas_melhoraram: string[]
    disciplinas_pioraram: string[]
    tempo_evolucao: number // positivo = mais rápido, negativo = mais lento
    consistencia: 'alta' | 'media' | 'baixa'
    insights: string[]
  }
}

// GET - Comparar múltiplos simulados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const ids = searchParams.get('ids') // IDs separados por vírgula

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Verificar se usuário é PRO
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano')
      .eq('id', user_id)
      .single()

    const isPro = profile?.plano?.toLowerCase() === 'pro' ||
                  profile?.plano?.toLowerCase() === 'estuda_pro'

    if (!isPro) {
      return NextResponse.json({
        error: 'Recurso exclusivo para usuários PRO',
        upgrade_required: true
      }, { status: 403 })
    }

    // Se IDs fornecidos, usar esses; senão, pegar últimos 5 finalizados
    let simuladoIds: string[] = []
    if (ids) {
      simuladoIds = ids.split(',').filter(Boolean).slice(0, 10)
    } else {
      const { data: ultimos } = await supabase
        .from('simulados')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'finalizado')
        .order('finalizado_em', { ascending: false })
        .limit(5)

      simuladoIds = ultimos?.map(s => s.id) || []
    }

    if (simuladoIds.length < 2) {
      return NextResponse.json({
        error: 'É necessário pelo menos 2 simulados finalizados para comparação'
      }, { status: 400 })
    }

    // Buscar dados detalhados de cada simulado
    const { data: simulados, error: simuladosError } = await supabase
      .from('simulados')
      .select(`
        id,
        titulo,
        finalizado_em,
        pontuacao,
        acertos,
        erros,
        quantidade_questoes,
        tempo_gasto_segundos,
        simulado_questoes(
          esta_correta,
          tempo_resposta_segundos,
          questao:questoes(disciplina, dificuldade)
        )
      `)
      .in('id', simuladoIds)
      .eq('user_id', user_id)
      .eq('status', 'finalizado')
      .order('finalizado_em', { ascending: true })

    if (simuladosError) {
      console.error('[COMPARAR] Erro ao buscar simulados:', simuladosError)
      return NextResponse.json({ error: 'Erro ao buscar simulados' }, { status: 500 })
    }

    if (!simulados || simulados.length < 2) {
      return NextResponse.json({
        error: 'Simulados não encontrados ou insuficientes para comparação'
      }, { status: 404 })
    }

    // Processar cada simulado
    const simuladosProcessados: ComparacaoSimulado[] = simulados.map(sim => {
      const questoes = sim.simulado_questoes || []

      // Agrupar por disciplina
      const porDisciplina = new Map<string, { acertos: number; erros: number; total: number }>()
      const porDificuldade = new Map<string, { acertos: number; erros: number; total: number }>()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      questoes.forEach((q: any) => {
        if (q.esta_correta === null || q.esta_correta === undefined) return

        const questaoData = Array.isArray(q.questao) ? q.questao[0] : q.questao
        const disciplina = questaoData?.disciplina || 'Sem disciplina'
        const dificuldade = questaoData?.dificuldade || 'media'

        // Por disciplina
        if (!porDisciplina.has(disciplina)) {
          porDisciplina.set(disciplina, { acertos: 0, erros: 0, total: 0 })
        }
        const statDisc = porDisciplina.get(disciplina)!
        statDisc.total++
        if (q.esta_correta) statDisc.acertos++
        else statDisc.erros++

        // Por dificuldade
        if (!porDificuldade.has(dificuldade)) {
          porDificuldade.set(dificuldade, { acertos: 0, erros: 0, total: 0 })
        }
        const statDif = porDificuldade.get(dificuldade)!
        statDif.total++
        if (q.esta_correta) statDif.acertos++
        else statDif.erros++
      })

      // Calcular tempo médio
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const temposValidos = questoes
        .filter((q: any) => q.tempo_resposta_segundos)
        .map((q: any) => q.tempo_resposta_segundos!)
      /* eslint-enable @typescript-eslint/no-explicit-any */

      const tempoMedioPorQuestao = temposValidos.length > 0
        ? temposValidos.reduce((a, b) => a + b, 0) / temposValidos.length
        : sim.tempo_gasto_segundos ? sim.tempo_gasto_segundos / sim.quantidade_questoes : 0

      return {
        id: sim.id,
        titulo: sim.titulo,
        data: sim.finalizado_em,
        pontuacao: sim.pontuacao || 0,
        acertos: sim.acertos || 0,
        erros: sim.erros || 0,
        total_questoes: sim.quantidade_questoes,
        tempo_gasto_segundos: sim.tempo_gasto_segundos || 0,
        tempo_medio_por_questao: Math.round(tempoMedioPorQuestao),
        desempenho_por_disciplina: Array.from(porDisciplina.entries())
          .map(([disciplina, stats]) => ({
            disciplina,
            acertos: stats.acertos,
            erros: stats.erros,
            total: stats.total,
            percentual: Math.round((stats.acertos / stats.total) * 100)
          }))
          .sort((a, b) => b.total - a.total),
        desempenho_por_dificuldade: Array.from(porDificuldade.entries())
          .map(([dificuldade, stats]) => ({
            dificuldade,
            acertos: stats.acertos,
            erros: stats.erros,
            total: stats.total,
            percentual: Math.round((stats.acertos / stats.total) * 100)
          }))
      }
    })

    // Gerar análise comparativa
    const analise = gerarAnaliseComparativa(simuladosProcessados)

    const resultado: ResultadoComparacao = {
      simulados: simuladosProcessados,
      analise_comparativa: analise
    }

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('[COMPARAR] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function gerarAnaliseComparativa(simulados: ComparacaoSimulado[]) {
  // Ordenar por pontuação
  const porPontuacao = [...simulados].sort((a, b) => b.pontuacao - a.pontuacao)
  const melhorSimulado = porPontuacao[0]
  const piorSimulado = porPontuacao[porPontuacao.length - 1]

  // Calcular evolução (primeiro vs último cronologicamente)
  const primeiro = simulados[0]
  const ultimo = simulados[simulados.length - 1]
  const evolucaoPercentual = ultimo.pontuacao - primeiro.pontuacao

  // Comparar disciplinas entre primeiro e último
  const disciplinasPrimeiro = new Map(
    primeiro.desempenho_por_disciplina.map(d => [d.disciplina, d.percentual])
  )
  const disciplinasUltimo = new Map(
    ultimo.desempenho_por_disciplina.map(d => [d.disciplina, d.percentual])
  )

  const disciplinasMelhoraram: string[] = []
  const disciplinasPioraram: string[] = []

  // Comparar disciplinas presentes em ambos
  const todasDisciplinas = new Set([
    ...Array.from(disciplinasPrimeiro.keys()),
    ...Array.from(disciplinasUltimo.keys())
  ])

  todasDisciplinas.forEach(disc => {
    const percentualPrimeiro = disciplinasPrimeiro.get(disc)
    const percentualUltimo = disciplinasUltimo.get(disc)

    if (percentualPrimeiro !== undefined && percentualUltimo !== undefined) {
      const diferenca = percentualUltimo - percentualPrimeiro
      if (diferenca >= 10) {
        disciplinasMelhoraram.push(disc)
      } else if (diferenca <= -10) {
        disciplinasPioraram.push(disc)
      }
    }
  })

  // Evolução de tempo
  const tempoEvolucao = primeiro.tempo_medio_por_questao - ultimo.tempo_medio_por_questao

  // Calcular consistência (desvio padrão das pontuações)
  const pontuacoes = simulados.map(s => s.pontuacao)
  const mediaPontuacao = pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length
  const variancia = pontuacoes.reduce((acc, p) => acc + Math.pow(p - mediaPontuacao, 2), 0) / pontuacoes.length
  const desvioPadrao = Math.sqrt(variancia)

  let consistencia: 'alta' | 'media' | 'baixa'
  if (desvioPadrao < 5) {
    consistencia = 'alta'
  } else if (desvioPadrao < 15) {
    consistencia = 'media'
  } else {
    consistencia = 'baixa'
  }

  // Gerar insights
  const insights: string[] = []

  if (evolucaoPercentual > 5) {
    insights.push(`Excelente evolução! Você melhorou ${evolucaoPercentual.toFixed(1)} pontos percentuais entre o primeiro e o último simulado.`)
  } else if (evolucaoPercentual < -5) {
    insights.push(`Atenção: houve uma queda de ${Math.abs(evolucaoPercentual).toFixed(1)} pontos percentuais. Considere revisar o conteúdo.`)
  } else {
    insights.push(`Seu desempenho manteve-se estável ao longo dos simulados comparados.`)
  }

  if (disciplinasMelhoraram.length > 0) {
    insights.push(`Você melhorou significativamente em: ${disciplinasMelhoraram.slice(0, 3).join(', ')}.`)
  }

  if (disciplinasPioraram.length > 0) {
    insights.push(`Precisa de atenção: ${disciplinasPioraram.slice(0, 3).join(', ')} apresentaram queda de desempenho.`)
  }

  if (tempoEvolucao > 30) {
    insights.push(`Ótimo! Você está ${Math.round(tempoEvolucao)} segundos mais rápido por questão.`)
  } else if (tempoEvolucao < -30) {
    insights.push(`Você está levando mais tempo por questão. Tente manter um ritmo constante.`)
  }

  if (consistencia === 'alta') {
    insights.push(`Sua consistência é alta - você mantém um desempenho regular.`)
  } else if (consistencia === 'baixa') {
    insights.push(`Sua pontuação varia bastante entre simulados. Tente identificar o que causa essa oscilação.`)
  }

  // Análise do melhor vs pior
  if (melhorSimulado.id !== piorSimulado.id) {
    const diferencaMelhorPior = melhorSimulado.pontuacao - piorSimulado.pontuacao
    insights.push(`A diferença entre seu melhor e pior simulado é de ${diferencaMelhorPior.toFixed(1)} pontos.`)
  }

  return {
    melhor_simulado: melhorSimulado.id,
    pior_simulado: piorSimulado.id,
    evolucao_percentual: Math.round(evolucaoPercentual * 100) / 100,
    disciplinas_melhoraram: disciplinasMelhoraram,
    disciplinas_pioraram: disciplinasPioraram,
    tempo_evolucao: Math.round(tempoEvolucao),
    consistencia,
    insights
  }
}
