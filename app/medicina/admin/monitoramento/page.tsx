'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  AlertTriangle,
  Bug,
  Lightbulb,
  Heart,
  HelpCircle,
  CheckCircle,
  Clock,
  Archive,
  Search,
  RefreshCw,
  ChevronDown,
  User,
  Calendar,
  ExternalLink
} from 'lucide-react'

interface Feedback {
  id: string
  tipo: string
  titulo: string
  descricao: string
  pagina: string | null
  status: string
  prioridade: string
  resposta_admin: string | null
  created_at: string
  usuario: { id: string; nome: string; email: string } | null
}

interface ErrorLog {
  id: string
  error_type: string
  error_message: string
  error_stack: string | null
  pagina: string | null
  created_at: string
  usuario: { id: string; nome: string; email: string } | null
}

const tipoIcons: Record<string, typeof Bug> = {
  bug: Bug,
  sugestao: Lightbulb,
  elogio: Heart,
  duvida: HelpCircle,
  outro: MessageSquare
}

const statusInfo: Record<string, { label: string; cor: string; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', cor: 'bg-amber-500/20 text-amber-400', icon: Clock },
  em_analise: { label: 'Em Análise', cor: 'bg-blue-500/20 text-blue-400', icon: Search },
  resolvido: { label: 'Resolvido', cor: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  arquivado: { label: 'Arquivado', cor: 'bg-gray-500/20 text-gray-400', icon: Archive }
}

export default function MonitoramentoPage() {
  const [aba, setAba] = useState<'feedback' | 'erros'>('feedback')
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [feedbackSelecionado, setFeedbackSelecionado] = useState<Feedback | null>(null)
  const [errosPorTipo, setErrosPorTipo] = useState<Record<string, number>>({})

  const carregarFeedbacks = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filtroStatus) params.set('status', filtroStatus)
      if (filtroTipo) params.set('tipo', filtroTipo)

      const response = await fetch(`/api/medicina/feedback?${params}`)
      const data = await response.json()
      setFeedbacks(data.feedbacks || [])
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error)
    }
  }, [filtroStatus, filtroTipo])

  const carregarErros = useCallback(async () => {
    try {
      const response = await fetch('/api/medicina/errors?periodo=semana')
      const data = await response.json()
      setErrors(data.errors || [])
      setErrosPorTipo(data.porTipo || {})
    } catch (error) {
      console.error('Erro ao carregar erros:', error)
    }
  }, [])

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      await Promise.all([carregarFeedbacks(), carregarErros()])
      setLoading(false)
    }
    carregar()
  }, [carregarFeedbacks, carregarErros])

  const atualizarFeedback = async (id: string, updates: Partial<Feedback>) => {
    try {
      await fetch('/api/medicina/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
      carregarFeedbacks()
    } catch (error) {
      console.error('Erro ao atualizar feedback:', error)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Contadores
  const feedbacksPendentes = feedbacks.filter(f => f.status === 'pendente').length
  const errosHoje = errors.filter(e => {
    const hoje = new Date().toDateString()
    return new Date(e.created_at).toDateString() === hoje
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitoramento</h1>
          <p className="text-slate-600 mt-1">Feedbacks e logs de erros</p>
        </div>
        <button
          onClick={() => {
            carregarFeedbacks()
            carregarErros()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-amber-400 text-2xl font-bold">{feedbacksPendentes}</p>
              <p className="text-slate-600 text-sm">Feedbacks pendentes</p>
            </div>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-red-400 text-2xl font-bold">{errosHoje}</p>
              <p className="text-slate-600 text-sm">Erros hoje</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 text-2xl font-bold">
                {feedbacks.filter(f => f.status === 'resolvido').length}
              </p>
              <p className="text-slate-600 text-sm">Resolvidos</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Bug className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-blue-400 text-2xl font-bold">{errors.length}</p>
              <p className="text-slate-600 text-sm">Erros (7 dias)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setAba('feedback')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            aba === 'feedback'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Feedbacks ({feedbacks.length})
        </button>
        <button
          onClick={() => setAba('erros')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            aba === 'erros'
              ? 'bg-red-500/20 text-red-400'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Erros ({errors.length})
        </button>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500/30 border-t-emerald-500" />
        </div>
      ) : aba === 'feedback' ? (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
            >
              <option value="" className="bg-slate-800">Todos os status</option>
              {Object.entries(statusInfo).map(([key, info]) => (
                <option key={key} value={key} className="bg-slate-800">{info.label}</option>
              ))}
            </select>

            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
            >
              <option value="" className="bg-slate-800">Todos os tipos</option>
              <option value="bug" className="bg-slate-800">Bug</option>
              <option value="sugestao" className="bg-slate-800">Sugestão</option>
              <option value="elogio" className="bg-slate-800">Elogio</option>
              <option value="duvida" className="bg-slate-800">Dúvida</option>
              <option value="outro" className="bg-slate-800">Outro</option>
            </select>
          </div>

          {/* Lista de feedbacks */}
          <div className="space-y-3">
            {feedbacks.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Nenhum feedback encontrado
              </div>
            ) : (
              feedbacks.map(fb => {
                const TipoIcon = tipoIcons[fb.tipo] || MessageSquare
                const status = statusInfo[fb.status] || statusInfo.pendente

                return (
                  <div
                    key={fb.id}
                    className="bg-slate-100 border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors cursor-pointer"
                    onClick={() => setFeedbackSelecionado(fb)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        fb.tipo === 'bug' ? 'bg-red-500/20 text-red-400' :
                        fb.tipo === 'sugestao' ? 'bg-amber-500/20 text-amber-400' :
                        fb.tipo === 'elogio' ? 'bg-pink-500/20 text-pink-400' :
                        fb.tipo === 'duvida' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        <TipoIcon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium truncate">{fb.titulo}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${status.cor}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-2">{fb.descricao}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          {fb.usuario && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {fb.usuario.nome}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(fb.created_at)}
                          </span>
                          {fb.pagina && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              {fb.pagina}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Erros por tipo */}
          {Object.keys(errosPorTipo).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(errosPorTipo).map(([tipo, count]) => (
                <span key={tipo} className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm">
                  {tipo}: {count}
                </span>
              ))}
            </div>
          )}

          {/* Lista de erros */}
          <div className="space-y-3">
            {errors.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Nenhum erro registrado
              </div>
            ) : (
              errors.map(err => (
                <div
                  key={err.id}
                  className="bg-slate-100 border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                          {err.error_type}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {formatDate(err.created_at)}
                        </span>
                      </div>
                      <p className="text-white text-sm font-mono break-all">
                        {err.error_message}
                      </p>
                      {err.pagina && (
                        <p className="text-slate-500 text-xs mt-1">
                          Página: {err.pagina}
                        </p>
                      )}
                      {err.usuario && (
                        <p className="text-slate-500 text-xs">
                          Usuário: {err.usuario.nome} ({err.usuario.email})
                        </p>
                      )}
                      {err.error_stack && (
                        <details className="mt-2">
                          <summary className="text-slate-500 text-xs cursor-pointer hover:text-slate-600">
                            Ver stack trace
                          </summary>
                          <pre className="mt-2 p-2 bg-black/30 rounded text-xs text-red-300 overflow-x-auto max-h-40">
                            {err.error_stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal de detalhes do feedback */}
      {feedbackSelecionado && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setFeedbackSelecionado(null)}
        >
          <div
            className="bg-slate-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{feedbackSelecionado.titulo}</h3>
              <button
                onClick={() => setFeedbackSelecionado(null)}
                className="text-slate-500 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-600 text-sm">Descrição</label>
                <p className="text-white mt-1">{feedbackSelecionado.descricao}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-600 text-sm block mb-1">Status</label>
                  <select
                    value={feedbackSelecionado.status}
                    onChange={e => {
                      atualizarFeedback(feedbackSelecionado.id, { status: e.target.value } as Partial<Feedback>)
                      setFeedbackSelecionado({ ...feedbackSelecionado, status: e.target.value })
                    }}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    {Object.entries(statusInfo).map(([key, info]) => (
                      <option key={key} value={key} className="bg-slate-800">{info.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 text-sm block mb-1">Prioridade</label>
                  <select
                    value={feedbackSelecionado.prioridade}
                    onChange={e => {
                      atualizarFeedback(feedbackSelecionado.id, { prioridade: e.target.value } as Partial<Feedback>)
                      setFeedbackSelecionado({ ...feedbackSelecionado, prioridade: e.target.value })
                    }}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="baixa" className="bg-slate-800">Baixa</option>
                    <option value="media" className="bg-slate-800">Média</option>
                    <option value="alta" className="bg-slate-800">Alta</option>
                    <option value="critica" className="bg-slate-800">Crítica</option>
                  </select>
                </div>
              </div>

              {feedbackSelecionado.usuario && (
                <div>
                  <label className="text-slate-600 text-sm">Usuário</label>
                  <p className="text-white mt-1">
                    {feedbackSelecionado.usuario.nome} ({feedbackSelecionado.usuario.email})
                  </p>
                </div>
              )}

              {feedbackSelecionado.pagina && (
                <div>
                  <label className="text-slate-600 text-sm">Página</label>
                  <p className="text-white mt-1 font-mono text-sm">{feedbackSelecionado.pagina}</p>
                </div>
              )}

              <div>
                <label className="text-slate-600 text-sm">Data</label>
                <p className="text-white mt-1">{formatDate(feedbackSelecionado.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
