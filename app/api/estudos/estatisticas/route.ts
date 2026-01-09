import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Estatísticas de estudo do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const periodo = searchParams.get('periodo') || '7' // dias
    const tipo = searchParams.get('tipo') || 'geral'

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const diasAtras = parseInt(periodo)
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - diasAtras)
    const dataInicioStr = dataInicio.toISOString().split('T')[0]
    const dataHoje = new Date().toISOString().split('T')[0]

    if (tipo === 'hoje') {
      // Estatísticas de hoje
      const { data: estudoHoje } = await supabase
        .from('estudo_diario')
        .select('*')
        .eq('user_id', user_id)
        .eq('data', dataHoje)
        .single()

      const { count: revisoesHoje } = await supabase
        .from('revisoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .in('status', ['pendente', 'atrasada'])
        .lte('proxima_revisao', dataHoje)

      const { data: sessaoAtiva } = await supabase
        .from('sessoes_estudo')
        .select('id, inicio, metodo, disciplina:disciplinas(nome)')
        .eq('user_id', user_id)
        .in('status', ['em_andamento', 'pausada'])
        .limit(1)
        .single()

      return NextResponse.json({
        hoje: {
          total_segundos: estudoHoje?.total_segundos || 0,
          total_horas: ((estudoHoje?.total_segundos || 0) / 3600).toFixed(1),
          total_sessoes: estudoHoje?.total_sessoes || 0,
          total_questoes: estudoHoje?.total_questoes || 0,
          total_corretas: estudoHoje?.total_corretas || 0,
          porcentagem_acerto: estudoHoje?.total_questoes
            ? ((estudoHoje.total_corretas / estudoHoje.total_questoes) * 100).toFixed(1)
            : 0,
          total_revisoes: estudoHoje?.total_revisoes || 0,
          xp_ganho: estudoHoje?.xp_ganho || 0
        },
        revisoes_pendentes: revisoesHoje || 0,
        sessao_ativa: sessaoAtiva || null
      })
    }

    if (tipo === 'semanal') {
      // Estatísticas dos últimos 7 dias
      const { data: estudoSemanal } = await supabase
        .from('estudo_diario')
        .select('*')
        .eq('user_id', user_id)
        .gte('data', dataInicioStr)
        .order('data', { ascending: true })

      // Calcular totais
      const totais = (estudoSemanal || []).reduce((acc, dia) => ({
        total_segundos: acc.total_segundos + (dia.total_segundos || 0),
        total_sessoes: acc.total_sessoes + (dia.total_sessoes || 0),
        total_questoes: acc.total_questoes + (dia.total_questoes || 0),
        total_corretas: acc.total_corretas + (dia.total_corretas || 0),
        total_revisoes: acc.total_revisoes + (dia.total_revisoes || 0),
        xp_ganho: acc.xp_ganho + (dia.xp_ganho || 0)
      }), {
        total_segundos: 0,
        total_sessoes: 0,
        total_questoes: 0,
        total_corretas: 0,
        total_revisoes: 0,
        xp_ganho: 0
      })

      // Gerar dados para gráfico (últimos 7 dias)
      const diasGrafico = []
      for (let i = diasAtras - 1; i >= 0; i--) {
        const data = new Date()
        data.setDate(data.getDate() - i)
        const dataStr = data.toISOString().split('T')[0]
        const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' })

        const estudo = (estudoSemanal || []).find(e => e.data === dataStr)
        diasGrafico.push({
          data: dataStr,
          dia: diaSemana,
          horas: ((estudo?.total_segundos || 0) / 3600).toFixed(1),
          segundos: estudo?.total_segundos || 0,
          questoes: estudo?.total_questoes || 0,
          revisoes: estudo?.total_revisoes || 0
        })
      }

      return NextResponse.json({
        periodo: `${diasAtras} dias`,
        totais: {
          ...totais,
          total_horas: (totais.total_segundos / 3600).toFixed(1),
          media_diaria_horas: (totais.total_segundos / 3600 / diasAtras).toFixed(1),
          porcentagem_acerto: totais.total_questoes
            ? ((totais.total_corretas / totais.total_questoes) * 100).toFixed(1)
            : 0
        },
        grafico: diasGrafico,
        dias_estudados: (estudoSemanal || []).filter(d => d.total_segundos > 0).length
      })
    }

    if (tipo === 'ciclo') {
      // Estatísticas do ciclo atual
      const { data: cicloAtual } = await supabase
        .from('ciclos_estudo')
        .select(`
          *,
          ciclo_itens (
            *,
            disciplina:disciplinas (id, nome, icon, cor)
          )
        `)
        .eq('user_id', user_id)
        .eq('status', 'em_progresso')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!cicloAtual) {
        return NextResponse.json({ ciclo: null })
      }

      // Calcular progresso geral
      const totalHorasMeta = (cicloAtual.ciclo_itens || []).reduce((acc: number, item: { horas_meta?: number }) => acc + (item.horas_meta || 0), 0)
      const totalHorasEstudadas = (cicloAtual.ciclo_itens || []).reduce((acc: number, item: { horas_estudadas?: number }) => acc + (item.horas_estudadas || 0), 0)
      const progressoGeral = totalHorasMeta > 0 ? ((totalHorasEstudadas / totalHorasMeta) * 100).toFixed(1) : 0

      // Dias restantes
      const dataFim = new Date(cicloAtual.data_fim)
      const hoje = new Date()
      const diasRestantes = Math.max(0, Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)))

      return NextResponse.json({
        ciclo: {
          ...cicloAtual,
          progresso_geral: progressoGeral,
          dias_restantes: diasRestantes,
          total_horas_meta: totalHorasMeta,
          total_horas_estudadas: totalHorasEstudadas.toFixed(1)
        }
      })
    }

    if (tipo === 'disciplinas') {
      // Estatísticas por disciplina
      const { data: sessoes } = await supabase
        .from('sessoes_estudo')
        .select(`
          duracao_segundos,
          questoes_feitas,
          questoes_corretas,
          disciplina:disciplinas (id, nome, icon, cor)
        `)
        .eq('user_id', user_id)
        .eq('status', 'finalizada')
        .gte('inicio', dataInicioStr)

      // Agrupar por disciplina
      interface DisciplinaStats {
        disciplina: unknown
        total_segundos: number
        total_sessoes: number
        total_questoes: number
        total_corretas: number
      }
      const porDisciplina: Record<string, DisciplinaStats> = {}
      for (const sessao of (sessoes || [])) {
        const discId = (sessao.disciplina as { id?: string })?.id
        if (!discId) continue

        if (!porDisciplina[discId]) {
          porDisciplina[discId] = {
            disciplina: sessao.disciplina,
            total_segundos: 0,
            total_sessoes: 0,
            total_questoes: 0,
            total_corretas: 0
          }
        }

        porDisciplina[discId].total_segundos += sessao.duracao_segundos || 0
        porDisciplina[discId].total_sessoes += 1
        porDisciplina[discId].total_questoes += sessao.questoes_feitas || 0
        porDisciplina[discId].total_corretas += sessao.questoes_corretas || 0
      }

      const disciplinas = Object.values(porDisciplina)
        .map(d => ({
          ...d,
          total_horas: (d.total_segundos / 3600).toFixed(1),
          porcentagem_acerto: d.total_questoes
            ? ((d.total_corretas / d.total_questoes) * 100).toFixed(1)
            : 0
        }))
        .sort((a, b) => b.total_segundos - a.total_segundos)

      return NextResponse.json({ disciplinas })
    }

    // Estatísticas gerais
    const [
      { data: estudoSemanal },
      { count: totalRevisoesPendentes },
      { count: totalRevisoesAtrasadas },
      { data: cicloAtual },
      { count: totalSessoes }
    ] = await Promise.all([
      supabase
        .from('estudo_diario')
        .select('*')
        .eq('user_id', user_id)
        .gte('data', dataInicioStr)
        .order('data', { ascending: true }),
      supabase
        .from('revisoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('status', 'pendente'),
      supabase
        .from('revisoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('status', 'atrasada'),
      supabase
        .from('ciclos_estudo')
        .select('id, nome, status, horas_planejadas, horas_estudadas')
        .eq('user_id', user_id)
        .eq('status', 'em_progresso')
        .limit(1)
        .single(),
      supabase
        .from('sessoes_estudo')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('status', 'finalizada')
    ])

    const totais = (estudoSemanal || []).reduce((acc, dia) => ({
      total_segundos: acc.total_segundos + (dia.total_segundos || 0),
      total_questoes: acc.total_questoes + (dia.total_questoes || 0),
      total_corretas: acc.total_corretas + (dia.total_corretas || 0),
      xp_ganho: acc.xp_ganho + (dia.xp_ganho || 0)
    }), {
      total_segundos: 0,
      total_questoes: 0,
      total_corretas: 0,
      xp_ganho: 0
    })

    return NextResponse.json({
      periodo: `${diasAtras} dias`,
      resumo: {
        total_horas: (totais.total_segundos / 3600).toFixed(1),
        media_diaria: (totais.total_segundos / 3600 / diasAtras).toFixed(1),
        total_questoes: totais.total_questoes,
        porcentagem_acerto: totais.total_questoes
          ? ((totais.total_corretas / totais.total_questoes) * 100).toFixed(1)
          : 0,
        total_sessoes: totalSessoes || 0,
        xp_ganho: totais.xp_ganho
      },
      revisoes: {
        pendentes: totalRevisoesPendentes || 0,
        atrasadas: totalRevisoesAtrasadas || 0,
        total: (totalRevisoesPendentes || 0) + (totalRevisoesAtrasadas || 0)
      },
      ciclo_atual: cicloAtual ? {
        ...cicloAtual,
        progresso: cicloAtual.horas_planejadas > 0
          ? ((cicloAtual.horas_estudadas / cicloAtual.horas_planejadas) * 100).toFixed(1)
          : 0
      } : null,
      dias_estudados: (estudoSemanal || []).filter(d => d.total_segundos > 0).length
    })
  } catch (error) {
    console.error('Erro na API de estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
