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
  Zap
} from 'lucide-react'

interface DashboardStats {
  totalQuestoes: number
  questoesIA: number
  questoesRevisadas: number
  questoesPendentes: number
  totalDisciplinas: number
  totalAssuntos: number
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

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    
    try {
      // Total de questões
      const { count: totalQuestoes } = await supabase
        .from('questoes_med')
        .select('*', { count: 'exact', head: true })

      // Questões geradas por IA
      const { count: questoesIA } = await supabase
        .from('questoes_med')
        .select('*', { count: 'exact', head: true })
        .eq('gerado_por_ia', true)

      // Questões revisadas
      const { count: questoesRevisadas } = await supabase
        .from('questoes_med')
        .select('*', { count: 'exact', head: true })
        .eq('revisado', true)

      // Questões pendentes de revisão (IA não revisadas)
      const { count: questoesPendentes } = await supabase
        .from('questoes_med')
        .select('*', { count: 'exact', head: true })
        .eq('gerado_por_ia', true)
        .eq('revisado', false)

      // Total de disciplinas
      const { count: totalDisciplinas } = await supabase
        .from('disciplinas_med')
        .select('*', { count: 'exact', head: true })

      // Total de assuntos
      const { count: totalAssuntos } = await supabase
        .from('assuntos_med')
        .select('*', { count: 'exact', head: true })

      // Últimas gerações (do log)
      const { data: ultimasGeracoes } = await supabase
        .from('admin_geracao_logs_med')
        .select(`
          id,
          created_at,
          quantidade,
          status,
          disciplina_id
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // Buscar nomes das disciplinas
      const disciplinaIds = ultimasGeracoes?.map(g => g.disciplina_id).filter(Boolean) || []
      let disciplinasMap: Record<string, string> = {}

      if (disciplinaIds.length > 0) {
        const { data: disciplinas } = await supabase
          .from('disciplinas_med')
          .select('id, nome')
          .in('id', disciplinaIds)

        disciplinas?.forEach(d => {
          disciplinasMap[d.id] = d.nome
        })
      }

      setStats({
        totalQuestoes: totalQuestoes || 0,
        questoesIA: questoesIA || 0,
        questoesRevisadas: questoesRevisadas || 0,
        questoesPendentes: questoesPendentes || 0,
        totalDisciplinas: totalDisciplinas || 0,
        totalAssuntos: totalAssuntos || 0,
        ultimasGeracoes: (ultimasGeracoes || []).map(g => ({
          ...g,
          disciplina_nome: g.disciplina_id ? disciplinasMap[g.disciplina_id] : undefined
        }))
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
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
          <p className="text-white/60 mt-1">
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
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/60 text-sm">Total Questões</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalQuestoes.toLocaleString()}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-white/60 text-sm">Geradas por IA</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.questoesIA.toLocaleString()}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60 text-sm">Revisadas</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.questoesRevisadas.toLocaleString()}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-white/60 text-sm">Pendentes Revisão</span>
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
                  : 'bg-white/5 border-white/10 hover:border-white/20'
                }
              `}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-1">{action.label}</h3>
              <p className="text-white/60 text-sm">{action.description}</p>
              <ArrowRight className="absolute top-5 right-5 w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Stats secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conteúdo */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            Conteúdo
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-1">Disciplinas</p>
              <p className="text-xl font-bold text-white">{stats?.totalDisciplinas}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-1">Assuntos</p>
              <p className="text-xl font-bold text-white">{stats?.totalAssuntos}</p>
            </div>
          </div>
        </div>

        {/* Últimas Gerações */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Últimas Gerações
          </h3>
          {stats?.ultimasGeracoes && stats.ultimasGeracoes.length > 0 ? (
            <div className="space-y-3">
              {stats.ultimasGeracoes.map((geracao) => (
                <div key={geracao.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
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
                      <p className="text-white/40 text-xs">
                        {new Date(geracao.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className="text-white/60 text-sm">
                    {geracao.quantidade} questões
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm text-center py-4">
              Nenhuma geração registrada ainda
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
