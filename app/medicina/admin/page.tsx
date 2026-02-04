'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  FileText,
  Sparkles,
  BookOpen,
  History,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Database,
  Zap,
  MessageSquare,
  Bug,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Eye
} from 'lucide-react'

interface Feedback {
  id: string
  tipo: string
  titulo: string
  descricao: string
  status: string
  created_at: string
  usuario?: {
    nome: string
    email: string
  } | null
}

interface ErrorLog {
  id: string
  error_type: string
  error_message: string
  pagina: string
  created_at: string
}

interface DashboardStats {
  totalQuestoes: number
  questoesIA: number
  questoesRevisadas: number
  questoesPendentes: number
  totalDisciplinas: number
  totalAssuntos: number
  totalFeedbacks: number
  feedbacksPendentes: number
  totalErros: number
  errosHoje: number
  ultimasGeracoes: Array<{
    id: string
    created_at: string
    quantidade: number
    status: string
    disciplina_nome?: string
  }>
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [erros, setErros] = useState<ErrorLog[]>([])
  const [showMonitoramento, setShowMonitoramento] = useState(false)
  const [abaMonitoramento, setAbaMonitoramento] = useState<'feedbacks' | 'erros'>('feedbacks')
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
    loadMonitoramento()
  }, [])

  async function loadMonitoramento() {
    try {
      // Carregar feedbacks recentes
      const { data: feedbacksData, error: feedbackError } = await supabase
        .from('feedback_med')
        .select(`
          id,
          tipo,
          titulo,
          descricao,
          status,
          created_at,
          usuario:profiles_med!user_id(nome, email)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (feedbackError) {
        console.error('Erro ao carregar feedbacks:', feedbackError)
      } else if (feedbacksData) {
        // Transformar dados do Supabase para o formato esperado
        // O join retorna array, precisamos extrair o primeiro elemento
        const feedbacksFormatados = feedbacksData.map((f: { id: string; tipo: string; titulo: string; descricao: string; status: string; created_at: string; usuario?: { nome: string; email: string } | { nome: string; email: string }[] | null }) => ({
          ...f,
          usuario: Array.isArray(f.usuario) ? (f.usuario[0] || null) : f.usuario
        }))
        setFeedbacks(feedbacksFormatados as Feedback[])
      }
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error)
    }

    try {
      // Carregar erros recentes
      const { data: errosData, error: errosError } = await supabase
        .from('error_logs_med')
        .select('id, error_type, error_message, pagina, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (errosError) {
        console.error('Erro ao carregar erros:', errosError)
      } else if (errosData) {
        setErros(errosData)
      }
    } catch (error) {
      console.error('Erro ao carregar erros:', error)
    }
  }

  async function atualizarStatusFeedback(id: string, novoStatus: string) {
    const { error } = await supabase
      .from('feedback_med')
      .update({ status: novoStatus })
      .eq('id', id)

    if (!error) {
      setFeedbacks(prev => prev.map(f =>
        f.id === id ? { ...f, status: novoStatus } : f
      ))
    }
  }

  async function loadStats() {
    const hoje = new Date().toISOString().split('T')[0]

    try {
      // Carregar cada estatística individualmente com tratamento de erro
      let totalQuestoes = 0
      let questoesIA = 0
      let questoesRevisadas = 0
      let questoesPendentes = 0
      let totalDisciplinas = 0
      let totalAssuntos = 0
      let totalFeedbacks = 0
      let feedbacksPendentesCount = 0
      let totalErros = 0
      let errosHoje = 0
      let ultimasGeracoes: Array<{ id: string; created_at: string; quantidade: number; status: string; disciplina_id?: string }> = []

      // Queries principais - executar em paralelo
      const results = await Promise.allSettled([
        supabase.from('questoes_med').select('*', { count: 'exact', head: true }),
        supabase.from('questoes_med').select('*', { count: 'exact', head: true }).eq('gerado_por_ia', true),
        supabase.from('questoes_med').select('*', { count: 'exact', head: true }).eq('revisado', true),
        supabase.from('questoes_med').select('*', { count: 'exact', head: true }).eq('gerado_por_ia', true).eq('revisado', false),
        supabase.from('disciplinas_med').select('*', { count: 'exact', head: true }),
        supabase.from('assuntos_med').select('*', { count: 'exact', head: true }),
        supabase.from('feedback_med').select('*', { count: 'exact', head: true }),
        supabase.from('feedback_med').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('error_logs_med').select('*', { count: 'exact', head: true }),
        supabase.from('error_logs_med').select('*', { count: 'exact', head: true }).gte('created_at', hoje),
        supabase.from('admin_geracao_logs_med').select('id, created_at, quantidade, status, disciplina_id').order('created_at', { ascending: false }).limit(5)
      ])

      // Extrair valores com segurança
      if (results[0].status === 'fulfilled') totalQuestoes = results[0].value.count || 0
      if (results[1].status === 'fulfilled') questoesIA = results[1].value.count || 0
      if (results[2].status === 'fulfilled') questoesRevisadas = results[2].value.count || 0
      if (results[3].status === 'fulfilled') questoesPendentes = results[3].value.count || 0
      if (results[4].status === 'fulfilled') totalDisciplinas = results[4].value.count || 0
      if (results[5].status === 'fulfilled') totalAssuntos = results[5].value.count || 0
      if (results[6].status === 'fulfilled') totalFeedbacks = results[6].value.count || 0
      if (results[7].status === 'fulfilled') feedbacksPendentesCount = results[7].value.count || 0
      if (results[8].status === 'fulfilled') totalErros = results[8].value.count || 0
      if (results[9].status === 'fulfilled') errosHoje = results[9].value.count || 0
      if (results[10].status === 'fulfilled') ultimasGeracoes = results[10].value.data || []

      // Buscar nomes das disciplinas das gerações
      const disciplinaIds = ultimasGeracoes.map(g => g.disciplina_id).filter(Boolean) as string[]
      const disciplinasMap: Record<string, string> = {}

      if (disciplinaIds.length > 0) {
        try {
          const { data: disciplinas } = await supabase
            .from('disciplinas_med')
            .select('id, nome')
            .in('id', disciplinaIds)

          disciplinas?.forEach((d: { id: string; nome: string }) => {
            disciplinasMap[d.id] = d.nome
          })
        } catch {
          // Ignorar erro
        }
      }

      setStats({
        totalQuestoes,
        questoesIA,
        questoesRevisadas,
        questoesPendentes,
        totalDisciplinas,
        totalAssuntos,
        totalFeedbacks,
        feedbacksPendentes: feedbacksPendentesCount,
        totalErros,
        errosHoje,
        ultimasGeracoes: ultimasGeracoes.map(g => ({
          ...g,
          disciplina_nome: g.disciplina_id ? disciplinasMap[g.disciplina_id] : undefined
        }))
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      // Definir stats vazio para não ficar loading infinito
      setStats({
        totalQuestoes: 0,
        questoesIA: 0,
        questoesRevisadas: 0,
        questoesPendentes: 0,
        totalDisciplinas: 0,
        totalAssuntos: 0,
        totalFeedbacks: 0,
        feedbacksPendentes: 0,
        totalErros: 0,
        errosHoje: 0,
        ultimasGeracoes: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  const quickActions = [
    {
      href: '/medicina/admin/questoes/gerar',
      label: 'Gerar Questões',
      description: 'Criar novas questões com IA',
      icon: Sparkles,
      color: 'from-emerald-500 to-teal-600',
      highlight: true
    },
    {
      href: '/medicina/admin/questoes',
      label: 'Gerenciar Questões',
      description: 'Editar e revisar questões',
      icon: FileText,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      href: '/medicina/admin/disciplinas',
      label: 'Disciplinas',
      description: 'Gerenciar disciplinas e assuntos',
      icon: BookOpen,
      color: 'from-purple-500 to-pink-600'
    },
    {
      href: '/medicina/admin/historico',
      label: 'Histórico',
      description: 'Ver logs de geração',
      icon: History,
      color: 'from-amber-500 to-orange-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-400" />
            Painel Admin
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie questões, disciplinas e conteúdo da plataforma
          </p>
        </div>
        <Link
          href="/medicina/admin/questoes/gerar"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all"
        >
          <Sparkles className="w-5 h-5" />
          Gerar Questões
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-600 text-sm">Total Questões</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalQuestoes.toLocaleString()}</p>
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-slate-600 text-sm">Geradas por IA</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.questoesIA.toLocaleString()}</p>
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-slate-600 text-sm">Revisadas</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.questoesRevisadas.toLocaleString()}</p>
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-slate-600 text-sm">Pendentes Revisão</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.questoesPendentes.toLocaleString()}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`
                group relative overflow-hidden rounded-xl p-5 border transition-all
                ${action.highlight
                  ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-400/50'
                  : 'bg-slate-100 border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-1">{action.label}</h3>
              <p className="text-slate-600 text-sm">{action.description}</p>
              <ArrowRight className="absolute top-5 right-5 w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Stats secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conteúdo */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            Conteúdo
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-100 rounded-lg p-4">
              <p className="text-slate-600 text-sm mb-1">Disciplinas</p>
              <p className="text-xl font-bold text-white">{stats?.totalDisciplinas}</p>
            </div>
            <div className="bg-slate-100 rounded-lg p-4">
              <p className="text-slate-600 text-sm mb-1">Assuntos</p>
              <p className="text-xl font-bold text-white">{stats?.totalAssuntos}</p>
            </div>
          </div>
        </div>

        {/* Últimas Gerações */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Últimas Gerações
          </h3>
          {stats?.ultimasGeracoes && stats.ultimasGeracoes.length > 0 ? (
            <div className="space-y-3">
              {stats.ultimasGeracoes.map((geracao) => (
                <div key={geracao.id} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      geracao.status === 'concluido' ? 'bg-green-400' :
                      geracao.status === 'erro' ? 'bg-red-400' :
                      'bg-amber-400'
                    }`} />
                    <div>
                      <p className="text-white text-sm">
                        {geracao.disciplina_nome || 'Disciplina'}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {new Date(geracao.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-600 text-sm">
                    {geracao.quantidade} questões
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">
              Nenhuma geração registrada ainda
            </p>
          )}
        </div>
      </div>

      {/* Seção de Monitoramento */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {/* Header do Monitoramento */}
        <button
          onClick={() => setShowMonitoramento(!showMonitoramento)}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold">Monitoramento</h3>
              <p className="text-slate-600 text-sm">
                {stats?.feedbacksPendentes || 0} feedbacks pendentes • {stats?.errosHoje || 0} erros hoje
              </p>
            </div>
          </div>
          {showMonitoramento ? (
            <ChevronUp className="w-5 h-5 text-slate-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Conteúdo expandido */}
        {showMonitoramento && (
          <div className="border-t border-slate-200">
            {/* Abas */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setAbaMonitoramento('feedbacks')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  abaMonitoramento === 'feedbacks'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10'
                    : 'text-slate-600 hover:text-white hover:bg-slate-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Feedbacks ({feedbacks.length})
              </button>
              <button
                onClick={() => setAbaMonitoramento('erros')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  abaMonitoramento === 'erros'
                    ? 'text-red-400 border-b-2 border-red-400 bg-red-500/10'
                    : 'text-slate-600 hover:text-white hover:bg-slate-100'
                }`}
              >
                <Bug className="w-4 h-4" />
                Erros ({erros.length})
              </button>
            </div>

            {/* Lista de Feedbacks */}
            {abaMonitoramento === 'feedbacks' && (
              <div className="max-h-96 overflow-y-auto">
                {feedbacks.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-slate-600">Nenhum feedback recebido</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {feedbacks.map((fb) => (
                      <div key={fb.id} className="p-4 hover:bg-slate-100">
                        <div
                          className="cursor-pointer"
                          onClick={() => setExpandedFeedback(expandedFeedback === fb.id ? null : fb.id)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  fb.tipo === 'bug' ? 'bg-red-500/20 text-red-400' :
                                  fb.tipo === 'sugestao' ? 'bg-blue-500/20 text-blue-400' :
                                  fb.tipo === 'duvida' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-slate-200 text-slate-600'
                                }`}>
                                  {fb.tipo}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  fb.status === 'pendente' ? 'bg-amber-500/20 text-amber-400' :
                                  fb.status === 'resolvido' ? 'bg-green-500/20 text-green-400' :
                                  'bg-slate-200 text-slate-600'
                                }`}>
                                  {fb.status}
                                </span>
                              </div>
                              <h4 className="text-white font-medium text-sm truncate">{fb.titulo}</h4>
                              <p className="text-slate-500 text-xs mt-1">
                                {fb.usuario?.nome || fb.usuario?.email || 'Anônimo'} • {new Date(fb.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            {expandedFeedback === fb.id ? (
                              <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Detalhes expandidos */}
                        {expandedFeedback === fb.id && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-slate-700 text-sm whitespace-pre-wrap mb-3">{fb.descricao}</p>
                            <div className="flex gap-2">
                              {fb.status === 'pendente' && (
                                <button
                                  onClick={() => atualizarStatusFeedback(fb.id, 'resolvido')}
                                  className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                                >
                                  Marcar como Resolvido
                                </button>
                              )}
                              {fb.status === 'resolvido' && (
                                <button
                                  onClick={() => atualizarStatusFeedback(fb.id, 'pendente')}
                                  className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded text-xs hover:bg-amber-500/30 transition-colors"
                                >
                                  Reabrir
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lista de Erros */}
            {abaMonitoramento === 'erros' && (
              <div className="max-h-96 overflow-y-auto">
                {erros.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bug className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-slate-600">Nenhum erro registrado</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {erros.map((erro) => (
                      <div key={erro.id} className="p-4 hover:bg-slate-100">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                                {erro.error_type}
                              </span>
                              <span className="text-slate-500 text-xs">
                                {erro.pagina}
                              </span>
                            </div>
                            <p className="text-slate-700 text-sm break-all">{erro.error_message}</p>
                            <p className="text-slate-500 text-xs mt-1">
                              {new Date(erro.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
