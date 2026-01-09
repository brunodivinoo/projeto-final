'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { supabase } from '@/lib/supabase'
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Calendar,
  BookOpen,
  FileText,
  Brain,
  Award,
  ChevronDown
} from 'lucide-react'

interface EstatisticasGerais {
  totalQuestoes: number
  totalCorretas: number
  tempoTotal: number
  simuladosFeitos: number
  teoriasLidas: number
}

interface EstatisticaDia {
  data: string
  questoes: number
  corretas: number
  tempo: number
}

interface EstatisticaDisciplina {
  id: string
  nome: string
  questoes: number
  corretas: number
  porcentagem: number
}

export default function EstatisticasPage() {
  const { user, profile } = useMedAuth()
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [estatisticasGerais, setEstatisticasGerais] = useState<EstatisticasGerais | null>(null)
  const [estatisticasDia, setEstatisticasDia] = useState<EstatisticaDia[]>([])
  const [estatisticasDisciplina, setEstatisticasDisciplina] = useState<EstatisticaDisciplina[]>([])

  const fetchEstatisticas = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // Calcular data inicial baseada no período
      const hoje = new Date()
      let dataInicial = new Date()

      switch (periodo) {
        case '7d':
          dataInicial.setDate(hoje.getDate() - 7)
          break
        case '30d':
          dataInicial.setDate(hoje.getDate() - 30)
          break
        case '90d':
          dataInicial.setDate(hoje.getDate() - 90)
          break
        case 'all':
          dataInicial = new Date('2020-01-01')
          break
      }

      const dataInicialStr = dataInicial.toISOString().split('T')[0]

      // Buscar estatísticas diárias
      const { data: estudoDiario } = await supabase
        .from('estudo_diario_med')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', dataInicialStr)
        .order('data', { ascending: true })

      if (estudoDiario) {
        const estatsDia = estudoDiario.map(d => ({
          data: d.data,
          questoes: d.questoes_feitas,
          corretas: d.questoes_corretas,
          tempo: d.tempo_total_segundos
        }))
        setEstatisticasDia(estatsDia)

        // Calcular totais
        const totais = estudoDiario.reduce((acc, d) => ({
          totalQuestoes: acc.totalQuestoes + (d.questoes_feitas || 0),
          totalCorretas: acc.totalCorretas + (d.questoes_corretas || 0),
          tempoTotal: acc.tempoTotal + (d.tempo_total_segundos || 0),
          simuladosFeitos: acc.simuladosFeitos + (d.simulados_feitos || 0),
          teoriasLidas: acc.teoriasLidas + (d.teorias_lidas || 0)
        }), {
          totalQuestoes: 0,
          totalCorretas: 0,
          tempoTotal: 0,
          simuladosFeitos: 0,
          teoriasLidas: 0
        })

        setEstatisticasGerais(totais)
      }

      // Buscar estatísticas por disciplina
      const { data: respostas } = await supabase
        .from('respostas_med')
        .select(`
          acertou,
          questao:questoes_med!inner(
            disciplina:disciplinas_med(id, nome)
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', dataInicialStr)

      if (respostas && respostas.length > 0) {
        const porDisciplina: Record<string, { nome: string, questoes: number, corretas: number }> = {}

        respostas.forEach((r: any) => {
          const disc = r.questao?.disciplina
          if (disc) {
            if (!porDisciplina[disc.id]) {
              porDisciplina[disc.id] = { nome: disc.nome, questoes: 0, corretas: 0 }
            }
            porDisciplina[disc.id].questoes++
            if (r.acertou) porDisciplina[disc.id].corretas++
          }
        })

        const disciplinasStats = Object.entries(porDisciplina)
          .map(([id, d]) => ({
            id,
            nome: d.nome,
            questoes: d.questoes,
            corretas: d.corretas,
            porcentagem: Math.round((d.corretas / d.questoes) * 100)
          }))
          .sort((a, b) => b.questoes - a.questoes)

        setEstatisticasDisciplina(disciplinasStats)
      }

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }, [user, periodo])

  useEffect(() => {
    fetchEstatisticas()
  }, [fetchEstatisticas])

  const taxaGeral = estatisticasGerais?.totalQuestoes
    ? Math.round((estatisticasGerais.totalCorretas / estatisticasGerais.totalQuestoes) * 100)
    : 0

  const tempoFormatado = estatisticasGerais?.tempoTotal
    ? `${Math.floor(estatisticasGerais.tempoTotal / 3600)}h ${Math.floor((estatisticasGerais.tempoTotal % 3600) / 60)}min`
    : '0h 0min'

  // Encontrar maior valor para o gráfico
  const maxQuestoesDia = Math.max(...estatisticasDia.map(d => d.questoes), 1)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Estatísticas
          </h1>
          <p className="text-emerald-200/70 mt-1">
            Acompanhe seu progresso e identifique pontos de melhoria
          </p>
        </div>

        {/* Período Selector */}
        <div className="relative">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as any)}
            className="appearance-none bg-white/5 border border-white/10 rounded-lg py-2 pl-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="7d" className="bg-slate-800">Últimos 7 dias</option>
            <option value="30d" className="bg-slate-800">Últimos 30 dias</option>
            <option value="90d" className="bg-slate-800">Últimos 90 dias</option>
            <option value="all" className="bg-slate-800">Todo período</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">
                {estatisticasGerais?.totalQuestoes || 0}
              </div>
              <div className="text-white/60 text-sm">Questões Resolvidas</div>
            </div>

            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-teal-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">
                {taxaGeral}%
              </div>
              <div className="text-white/60 text-sm">Taxa de Acerto</div>
            </div>

            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">
                {tempoFormatado}
              </div>
              <div className="text-white/60 text-sm">Tempo de Estudo</div>
            </div>

            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">
                {estatisticasGerais?.simuladosFeitos || 0}
              </div>
              <div className="text-white/60 text-sm">Simulados</div>
            </div>

            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">
                {estatisticasGerais?.teoriasLidas || 0}
              </div>
              <div className="text-white/60 text-sm">Teorias Lidas</div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-6">Atividade Diária</h2>

            {estatisticasDia.length > 0 ? (
              <div className="space-y-4">
                {/* Chart */}
                <div className="h-48 flex items-end gap-1">
                  {estatisticasDia.slice(-30).map((dia, i) => {
                    const altura = (dia.questoes / maxQuestoesDia) * 100
                    const taxa = dia.questoes > 0 ? (dia.corretas / dia.questoes) * 100 : 0

                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center group cursor-pointer"
                        title={`${new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR')}: ${dia.questoes} questões (${Math.round(taxa)}% acerto)`}
                      >
                        <div
                          className="w-full rounded-t transition-all group-hover:opacity-80"
                          style={{
                            height: `${Math.max(altura, 4)}%`,
                            background: taxa >= 70
                              ? 'linear-gradient(to top, #10b981, #14b8a6)'
                              : taxa >= 50
                              ? 'linear-gradient(to top, #f59e0b, #fbbf24)'
                              : 'linear-gradient(to top, #ef4444, #f87171)'
                          }}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-white/60">70%+ acerto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-500" />
                    <span className="text-white/60">50-69% acerto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-white/60">&lt;50% acerto</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-white/40">
                Nenhuma atividade registrada neste período
              </div>
            )}
          </div>

          {/* Disciplinas Performance */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-6">Desempenho por Disciplina</h2>

            {estatisticasDisciplina.length > 0 ? (
              <div className="space-y-4">
                {estatisticasDisciplina.slice(0, 10).map((disc) => (
                  <div key={disc.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80">{disc.nome}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-white/40">{disc.questoes} questões</span>
                        <span className={`font-medium ${
                          disc.porcentagem >= 70 ? 'text-emerald-400' :
                          disc.porcentagem >= 50 ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {disc.porcentagem}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          disc.porcentagem >= 70 ? 'bg-emerald-500' :
                          disc.porcentagem >= 50 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${disc.porcentagem}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">
                Resolva questões para ver seu desempenho por disciplina
              </div>
            )}
          </div>

          {/* Performance Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Points to Improve */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Pontos a Melhorar</h3>
              </div>

              {estatisticasDisciplina.filter(d => d.porcentagem < 60).length > 0 ? (
                <ul className="space-y-3">
                  {estatisticasDisciplina
                    .filter(d => d.porcentagem < 60)
                    .slice(0, 5)
                    .map((disc) => (
                      <li key={disc.id} className="flex items-center justify-between">
                        <span className="text-white/80">{disc.nome}</span>
                        <span className="text-red-400 text-sm">{disc.porcentagem}%</span>
                      </li>
                    ))
                  }
                </ul>
              ) : (
                <p className="text-white/40 text-center py-4">
                  Excelente! Nenhuma disciplina abaixo de 60%
                </p>
              )}
            </div>

            {/* Strong Points */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Seus Pontos Fortes</h3>
              </div>

              {estatisticasDisciplina.filter(d => d.porcentagem >= 70).length > 0 ? (
                <ul className="space-y-3">
                  {estatisticasDisciplina
                    .filter(d => d.porcentagem >= 70)
                    .sort((a, b) => b.porcentagem - a.porcentagem)
                    .slice(0, 5)
                    .map((disc) => (
                      <li key={disc.id} className="flex items-center justify-between">
                        <span className="text-white/80">{disc.nome}</span>
                        <span className="text-emerald-400 text-sm">{disc.porcentagem}%</span>
                      </li>
                    ))
                  }
                </ul>
              ) : (
                <p className="text-white/40 text-center py-4">
                  Continue estudando para identificar seus pontos fortes
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
