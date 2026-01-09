'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  BarChart3,
  Calendar,
  ChevronRight,
  Target,
  Pause
} from 'lucide-react'

interface Simulado {
  id: string
  nome: string
  tipo: string
  total_questoes: number
  questoes_corretas: number
  tempo_limite_minutos: number | null
  tempo_gasto_segundos: number
  status: 'em_andamento' | 'finalizado' | 'pausado'
  data_inicio: string
  data_fim: string | null
  created_at: string
}

export default function SimuladosPage() {
  const { user, limitesPlano, limites } = useMedAuth()
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>('')

  const fetchSimulados = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.set('userId', user.id)
      if (filtroStatus) params.set('status', filtroStatus)

      const response = await fetch(`/api/medicina/simulados?${params}`)
      const data = await response.json()

      setSimulados(data.simulados || [])
      setTotal(data.total || 0)

    } catch (error) {
      console.error('Erro ao buscar simulados:', error)
    } finally {
      setLoading(false)
    }
  }, [user, filtroStatus])

  useEffect(() => {
    fetchSimulados()
  }, [fetchSimulados])

  const simuladosUsados = limites?.simulados_mes || 0
  const simuladosLimite = limitesPlano.simulados_mes
  const podeCriar = simuladosLimite === -1 || simuladosUsados < simuladosLimite

  const formatTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    if (horas > 0) {
      return `${horas}h ${minutos}min`
    }
    return `${minutos}min`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return { label: 'Em andamento', cor: 'text-amber-400 bg-amber-500/20', icon: Play }
      case 'pausado':
        return { label: 'Pausado', cor: 'text-blue-400 bg-blue-500/20', icon: Pause }
      case 'finalizado':
        return { label: 'Finalizado', cor: 'text-emerald-400 bg-emerald-500/20', icon: CheckCircle2 }
      default:
        return { label: status, cor: 'text-white/60 bg-white/10', icon: ClipboardList }
    }
  }

  // Estatísticas rápidas
  const simuladosFinalizados = simulados.filter(s => s.status === 'finalizado')
  const mediaAcertos = simuladosFinalizados.length > 0
    ? Math.round(
        simuladosFinalizados.reduce((acc, s) => acc + (s.questoes_corretas / s.total_questoes * 100), 0) /
        simuladosFinalizados.length
      )
    : 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Simulados
          </h1>
          <p className="text-emerald-200/70 mt-1">
            {simuladosUsados} / {simuladosLimite === -1 ? '∞' : simuladosLimite} simulados este mês
          </p>
        </div>

        <Link
          href={podeCriar ? '/medicina/dashboard/simulados/novo' : '#'}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
            podeCriar
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
          onClick={(e) => !podeCriar && e.preventDefault()}
        >
          <Plus className="w-5 h-5" />
          Novo Simulado
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-5 h-5 text-purple-400" />
            <span className="text-white/60 text-sm">Total</span>
          </div>
          <div className="text-2xl font-bold text-white">{total}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-white/60 text-sm">Finalizados</span>
          </div>
          <div className="text-2xl font-bold text-white">{simuladosFinalizados.length}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-teal-400" />
            <span className="text-white/60 text-sm">Média Acertos</span>
          </div>
          <div className="text-2xl font-bold text-white">{mediaAcertos}%</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Play className="w-5 h-5 text-amber-400" />
            <span className="text-white/60 text-sm">Em andamento</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {simulados.filter(s => s.status === 'em_andamento').length}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {['', 'em_andamento', 'finalizado'].map((status) => {
          const labels: Record<string, string> = {
            '': 'Todos',
            em_andamento: 'Em andamento',
            finalizado: 'Finalizados'
          }
          return (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroStatus === status
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {labels[status]}
            </button>
          )
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : simulados.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
          <ClipboardList className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {filtroStatus ? 'Nenhum simulado encontrado' : 'Você ainda não fez nenhum simulado'}
          </h3>
          <p className="text-white/60 mb-6">
            {filtroStatus ? 'Tente outro filtro' : 'Comece seu primeiro simulado agora!'}
          </p>
          {!filtroStatus && podeCriar && (
            <Link
              href="/medicina/dashboard/simulados/novo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Simulado
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {simulados.map((simulado) => {
            const statusInfo = getStatusInfo(simulado.status)
            const taxaAcerto = simulado.status === 'finalizado'
              ? Math.round((simulado.questoes_corretas / simulado.total_questoes) * 100)
              : null
            const StatusIcon = statusInfo.icon

            return (
              <Link
                key={simulado.id}
                href={`/medicina/dashboard/simulados/${simulado.id}`}
                className="block bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{simulado.nome}</h3>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusInfo.cor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="w-4 h-4" />
                        {simulado.total_questoes} questões
                      </span>
                      {simulado.tempo_limite_minutos && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {simulado.tempo_limite_minutos} min
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(simulado.created_at)}
                      </span>
                      {simulado.tempo_gasto_segundos > 0 && (
                        <span className="flex items-center gap-1">
                          Tempo: {formatTempo(simulado.tempo_gasto_segundos)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {taxaAcerto !== null && (
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          taxaAcerto >= 70 ? 'text-emerald-400' :
                          taxaAcerto >= 50 ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {taxaAcerto}%
                        </div>
                        <div className="text-white/40 text-xs">
                          {simulado.questoes_corretas}/{simulado.total_questoes} acertos
                        </div>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-white/40" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Limite Warning */}
      {!podeCriar && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-amber-200 font-medium">Limite de simulados atingido</p>
            <p className="text-amber-200/70 text-sm">
              Seu plano permite até {simuladosLimite} simulados por mês. Faça upgrade para criar mais.
            </p>
          </div>
          <Link
            href="/medicina/dashboard/assinatura"
            className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors flex-shrink-0"
          >
            Upgrade
          </Link>
        </div>
      )}
    </div>
  )
}
