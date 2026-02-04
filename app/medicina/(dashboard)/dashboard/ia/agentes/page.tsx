'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Brain,
  Sparkles,
  Users,
  ClipboardList,
  Pencil,
  Eye,
  Activity,
  Zap,
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react'
import Link from 'next/link'

// Tipos
interface AgentExecution {
  id: string
  user_id: string
  conversa_id?: string
  task_type: string
  status: 'pending' | 'running' | 'completed' | 'error'
  mensagem_original?: string
  parametros?: Record<string, unknown>
  resultado?: Record<string, unknown>
  execution_log?: string[]
  started_at: string
  completed_at?: string
  duration_ms?: number
  tokens_used?: number
  error?: string
  created_at: string
}

interface Estatisticas {
  total: number
  porStatus: {
    pending: number
    running: number
    completed: number
    error: number
  }
  porTipo: Record<string, number>
  tempoMedioMs: number
  tokensTotal: number
}

// Configuracao visual dos tipos de tarefa
const TASK_TYPE_CONFIG: Record<string, {
  icon: React.ElementType
  label: string
  color: string
  bgColor: string
  description: string
}> = {
  study_plan: {
    icon: FileText,
    label: 'Plano de Estudos',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    description: 'Gera cronogramas e planos personalizados'
  },
  content_complex: {
    icon: Brain,
    label: 'Conteudo Complexo',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    description: 'Questoes, flashcards e resumos em lote'
  }
}

// Configuracao visual dos status
const STATUS_CONFIG: Record<string, {
  icon: React.ElementType
  label: string
  color: string
  bgColor: string
}> = {
  pending: {
    icon: Clock,
    label: 'Pendente',
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10'
  },
  running: {
    icon: Loader2,
    label: 'Executando',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  completed: {
    icon: CheckCircle,
    label: 'Concluido',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  error: {
    icon: XCircle,
    label: 'Erro',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10'
  }
}

// Componente de card de estatistica
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = 'emerald'
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subValue?: string
  color?: 'emerald' | 'blue' | 'purple' | 'amber'
}) {
  const colors = {
    emerald: 'from-emerald-500 to-teal-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
    amber: 'from-amber-500 to-orange-600'
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
          {subValue && (
            <p className="text-[10px] text-slate-400">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente de linha de execucao
function ExecutionRow({
  execution,
  expanded,
  onToggle
}: {
  execution: AgentExecution
  expanded: boolean
  onToggle: () => void
}) {
  const taskConfig = TASK_TYPE_CONFIG[execution.task_type] || {
    icon: Bot,
    label: execution.task_type,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
    description: ''
  }
  const statusConfig = STATUS_CONFIG[execution.status]
  const TaskIcon = taskConfig.icon
  const StatusIcon = statusConfig.icon

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <motion.div
      layout
      className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        {/* Icone do tipo */}
        <div className={`w-10 h-10 rounded-lg ${taskConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
          <TaskIcon className={`w-5 h-5 ${taskConfig.color}`} />
        </div>

        {/* Info principal */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-slate-800 dark:text-white">
              {taskConfig.label}
            </span>
            <span className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
              ${statusConfig.bgColor} ${statusConfig.color}
            `}>
              <StatusIcon className={`w-3 h-3 ${execution.status === 'running' ? 'animate-spin' : ''}`} />
              {statusConfig.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {execution.mensagem_original?.substring(0, 80) || 'Sem mensagem'}
            {(execution.mensagem_original?.length || 0) > 80 ? '...' : ''}
          </p>
        </div>

        {/* Metricas */}
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-500">
          <div className="text-center">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {formatDuration(execution.duration_ms)}
            </p>
            <p className="text-[10px]">Duracao</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {execution.tokens_used?.toLocaleString() || '-'}
            </p>
            <p className="text-[10px]">Tokens</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {formatDate(execution.created_at)}
            </p>
            <p className="text-[10px]">Data</p>
          </div>
        </div>

        {/* Seta */}
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      {/* Detalhes expandidos */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-200 dark:border-slate-700"
          >
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 space-y-4">
              {/* Parametros */}
              {execution.parametros && Object.keys(execution.parametros).length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Parametros
                  </h4>
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                    <pre className="text-slate-600 dark:text-slate-400">
                      {JSON.stringify(execution.parametros, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Log de execucao */}
              {execution.execution_log && execution.execution_log.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Log de Execucao
                  </h4>
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {execution.execution_log.map((log, i) => (
                      <div key={i} className="text-xs font-mono text-slate-600 dark:text-slate-400 flex gap-2">
                        <span className="text-slate-400 select-none">{String(i + 1).padStart(2, '0')}.</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Erro */}
              {execution.error && (
                <div>
                  <h4 className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                    Erro
                  </h4>
                  <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 text-xs text-red-700 dark:text-red-400">
                    {execution.error}
                  </div>
                </div>
              )}

              {/* Link para conversa */}
              {execution.conversa_id && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Link
                    href={`/medicina/dashboard/ia?conversa=${execution.conversa_id}`}
                    className="inline-flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    Ver conversa relacionada
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Pagina principal
export default function AgentsDashboardPage() {
  const { user } = useMedAuth()
  const [executions, setExecutions] = useState<AgentExecution[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string>('all')

  // Buscar execucoes
  const fetchExecutions = useCallback(async (showRefresh = false) => {
    if (!user?.id) return

    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams({
        user_id: user.id,
        limit: '50'
      })

      if (filtroStatus !== 'all') {
        params.set('status', filtroStatus)
      }

      const response = await fetch(`/api/medicina/ia/agents?${params}`)
      const data = await response.json()

      if (data.executions) {
        setExecutions(data.executions)
      }
      if (data.estatisticas) {
        setEstatisticas(data.estatisticas)
      }
    } catch (error) {
      console.error('Erro ao buscar execucoes:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id, filtroStatus])

  useEffect(() => {
    fetchExecutions()
  }, [fetchExecutions])

  // Auto-refresh a cada 30s se tiver execucoes running
  useEffect(() => {
    const hasRunning = executions.some(e => e.status === 'running')
    if (!hasRunning) return

    const interval = setInterval(() => {
      fetchExecutions(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [executions, fetchExecutions])

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            Dashboard Multi-Agentes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualize e acompanhe as execucoes dos agentes de IA
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchExecutions(true)}
            disabled={refreshing}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/medicina/dashboard/ia"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Ir para o Chat
          </Link>
        </div>
      </div>

      {/* Cards de estatisticas */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Activity}
            label="Total de Execucoes"
            value={estatisticas.total}
            color="emerald"
          />
          <StatCard
            icon={CheckCircle}
            label="Concluidas"
            value={estatisticas.porStatus.completed}
            subValue={`${estatisticas.total > 0 ? Math.round((estatisticas.porStatus.completed / estatisticas.total) * 100) : 0}% sucesso`}
            color="blue"
          />
          <StatCard
            icon={Clock}
            label="Tempo Medio"
            value={formatDuration(estatisticas.tempoMedioMs)}
            color="purple"
          />
          <StatCard
            icon={Zap}
            label="Tokens Usados"
            value={estatisticas.tokensTotal.toLocaleString()}
            color="amber"
          />
        </div>
      )}

      {/* Distribuicao por tipo */}
      {estatisticas && Object.keys(estatisticas.porTipo).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Distribuicao por Tipo
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(estatisticas.porTipo).map(([tipo, count]) => {
              const config = TASK_TYPE_CONFIG[tipo] || {
                icon: Bot,
                label: tipo,
                color: 'text-slate-500',
                bgColor: 'bg-slate-500/10'
              }
              const Icon = config.icon

              return (
                <div
                  key={tipo}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bgColor}`}
                >
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {config.label}
                  </span>
                  <span className={`text-xs font-bold ${config.color}`}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">Filtrar:</span>
        </div>
        <div className="flex gap-2">
          {['all', 'running', 'completed', 'error'].map(status => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filtroStatus === status
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }
              `}
            >
              {status === 'all' ? 'Todos' : STATUS_CONFIG[status]?.label || status}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de execucoes */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhuma execucao de agentes encontrada</p>
            <p className="text-xs text-slate-400 mt-1">
              Os multi-agentes sao ativados automaticamente para tarefas complexas no chat
            </p>
            <Link
              href="/medicina/dashboard/ia"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Experimentar no Chat
            </Link>
          </div>
        ) : (
          executions.map(execution => (
            <ExecutionRow
              key={execution.id}
              execution={execution}
              expanded={expandedId === execution.id}
              onToggle={() => setExpandedId(expandedId === execution.id ? null : execution.id)}
            />
          ))
        )}
      </div>

      {/* Info sobre multi-agentes */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-800 dark:text-emerald-200 mb-1">
              Como funcionam os Multi-Agentes?
            </h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
              Os multi-agentes sao ativados automaticamente quando voce faz solicitacoes complexas no chat, como:
            </p>
            <ul className="space-y-2 text-sm text-emerald-600 dark:text-emerald-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Criar planos de estudo personalizados para provas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Gerar grandes quantidades de questoes ou flashcards
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Produzir material completo sobre um tema
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
