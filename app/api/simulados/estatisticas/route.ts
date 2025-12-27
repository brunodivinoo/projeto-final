import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Obter estatísticas gerais do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Buscar todos os simulados finalizados do usuário
    const { data: simulados, error: simuladosError } = await supabase
      .from('simulados')
      .select(`
        id,
        titulo,
        quantidade_questoes,
        acertos,
        erros,
        pontuacao,
        tempo_gasto_segundos,
        created_at,
        finalizado_em
      `)
      .eq('user_id', user_id)
      .eq('status', 'finalizado')
      .order('finalizado_em', { ascending: false })

    if (simuladosError) {
      console.error('[ESTATISTICAS] Erro ao buscar simulados:', simuladosError)
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
    }

    // Calcular estatísticas gerais
    const totalSimulados = simulados?.length || 0
    const totalQuestoes = simulados?.reduce((acc, s) => acc + (s.quantidade_questoes || 0), 0) || 0
    const totalAcertos = simulados?.reduce((acc, s) => acc + (s.acertos || 0), 0) || 0
    const totalErros = simulados?.reduce((acc, s) => acc + (s.erros || 0), 0) || 0
    const mediaGeral = totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0
    const tempoTotalSegundos = simulados?.reduce((acc, s) => acc + (s.tempo_gasto_segundos || 0), 0) || 0

    // Evolução ao longo do tempo (últimos 10 simulados)
    const evolucao = simulados?.slice(0, 10).reverse().map(s => ({
      data: s.finalizado_em,
      pontuacao: s.pontuacao
    })) || []

    // Buscar desempenho agregado por disciplina
    const { data: desempenhoDisciplinas, error: discError } = await supabase
      .from('simulado_desempenho')
      .select('area_nome, total_questoes, acertos, erros')
      .eq('user_id', user_id)
      .eq('tipo', 'disciplina')

    if (discError) {
      console.error('[ESTATISTICAS] Erro ao buscar desempenho por disciplina:', discError)
    }

    // Agregar desempenho por disciplina
    const disciplinasMap = new Map<string, { total: number; acertos: number; erros: number }>()
    desempenhoDisciplinas?.forEach(d => {
      const key = d.area_nome
      if (!disciplinasMap.has(key)) {
        disciplinasMap.set(key, { total: 0, acertos: 0, erros: 0 })
      }
      const stats = disciplinasMap.get(key)!
      stats.total += d.total_questoes || 0
      stats.acertos += d.acertos || 0
      stats.erros += d.erros || 0
    })

    const desempenhoPorDisciplina = Array.from(disciplinasMap.entries())
      .map(([nome, stats]) => ({
        nome,
        total_questoes: stats.total,
        acertos: stats.acertos,
        erros: stats.erros,
        percentual: stats.total > 0 ? Math.round((stats.acertos / stats.total) * 100) : 0
      }))
      .sort((a, b) => b.total_questoes - a.total_questoes)

    // Identificar pontos fortes e fracos
    const pontosFortes = desempenhoPorDisciplina
      .filter(d => d.percentual >= 70 && d.total_questoes >= 5)
      .slice(0, 5)

    const pontosFracos = desempenhoPorDisciplina
      .filter(d => d.percentual < 50 && d.total_questoes >= 5)
      .sort((a, b) => a.percentual - b.percentual)
      .slice(0, 5)

    // Buscar sugestões não visualizadas
    const { data: sugestoes, error: sugError } = await supabase
      .from('simulado_sugestoes')
      .select('*')
      .eq('user_id', user_id)
      .eq('visualizada', false)
      .order('prioridade', { ascending: false })
      .limit(5)

    if (sugError) {
      console.error('[ESTATISTICAS] Erro ao buscar sugestões:', sugError)
    }

    // Contar simulados do mês atual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const { count: simuladosMes } = await supabase
      .from('simulados')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .gte('created_at', inicioMes.toISOString())

    // Buscar limite do plano
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano')
      .eq('id', user_id)
      .single()

    const { data: plano } = await supabase
      .from('planos')
      .select('limite_simulados_mes')
      .eq('nome', profile?.plano || 'gratuito')
      .single()

    const limiteSimulados = plano?.limite_simulados_mes || 5

    return NextResponse.json({
      resumo: {
        total_simulados: totalSimulados,
        total_questoes: totalQuestoes,
        total_acertos: totalAcertos,
        total_erros: totalErros,
        media_geral: Math.round(mediaGeral * 100) / 100,
        tempo_total_segundos: tempoTotalSegundos,
        tempo_total_formatado: formatarTempo(tempoTotalSegundos)
      },
      uso_mensal: {
        simulados_realizados: simuladosMes || 0,
        limite: limiteSimulados,
        restantes: Math.max(0, limiteSimulados - (simuladosMes || 0))
      },
      evolucao,
      desempenho_por_disciplina: desempenhoPorDisciplina,
      pontos_fortes: pontosFortes,
      pontos_fracos: pontosFracos,
      sugestoes: sugestoes || [],
      ultimos_simulados: simulados?.slice(0, 5).map(s => ({
        id: s.id,
        titulo: s.titulo,
        pontuacao: s.pontuacao,
        data: s.finalizado_em
      })) || []
    })
  } catch (error) {
    console.error('[ESTATISTICAS] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function formatarTempo(segundos: number): string {
  const horas = Math.floor(segundos / 3600)
  const minutos = Math.floor((segundos % 3600) / 60)

  if (horas > 0) {
    return `${horas}h ${minutos}min`
  }
  return `${minutos}min`
}
