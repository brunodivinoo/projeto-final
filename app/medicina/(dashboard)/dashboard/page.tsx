'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useMedAuth, LIMITES_PLANO } from '@/contexts/MedAuthContext'
import { supabase } from '@/lib/supabase'
import {
  FileText,
  BookOpen,
  Brain,
  ClipboardList,
  TrendingUp,
  Target,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
  Flame,
  CheckCircle2
} from 'lucide-react'

interface EstatisticasHoje {
  questoes_feitas: number
  questoes_corretas: number
  teorias_lidas: number
  simulados_feitos: number
  tempo_total_segundos: number
}

interface RevisaoPendente {
  id: string
  titulo: string
  disciplina: { nome: string } | null
  proxima_revisao: string
}

export default function MedicinaDashboardPage() {
  const { user, profile, plano, limitesPlano, limites, loading: authLoading } = useMedAuth()
  const [estatisticas, setEstatisticas] = useState<EstatisticasHoje | null>(null)
  const [sequenciaDias, setSequenciaDias] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchDados = useCallback(async () => {
    if (authLoading || !user) return

    try {
      setLoading(true)
      const hoje = new Date().toISOString().split('T')[0]

      // Buscar estatísticas de hoje
      const { data: estudoHoje } = await supabase
        .from('estudo_diario_med')
        .select('*')
        .eq('user_id', user.id)
        .eq('data', hoje)
        .single()

      if (estudoHoje) {
        setEstatisticas(estudoHoje as EstatisticasHoje)
      } else {
        setEstatisticas({
          questoes_feitas: 0,
          questoes_corretas: 0,
          teorias_lidas: 0,
          simulados_feitos: 0,
          tempo_total_segundos: 0
        })
      }

      // Calcular sequência de dias
      const { data: estudoRecente } = await supabase
        .from('estudo_diario_med')
        .select('data, questoes_feitas')
        .eq('user_id', user.id)
        .order('data', { ascending: false })
        .limit(30)

      if (estudoRecente && estudoRecente.length > 0) {
        let sequencia = 0
        const dataAtual = new Date()

        for (let i = 0; i < estudoRecente.length; i++) {
          const dataEstudo = new Date(estudoRecente[i].data + 'T00:00:00')
          const diffDias = Math.floor((dataAtual.getTime() - dataEstudo.getTime()) / (1000 * 60 * 60 * 24))

          if (diffDias === i && estudoRecente[i].questoes_feitas > 0) {
            sequencia++
          } else if (diffDias === i + 1 && i === 0) {
            // Permite que o dia atual ainda não tenha sido estudado
            continue
          } else {
            break
          }
        }
        setSequenciaDias(sequencia)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    fetchDados()
  }, [fetchDados])

  const taxaAcerto = estatisticas?.questoes_feitas
    ? Math.round((estatisticas.questoes_corretas / estatisticas.questoes_feitas) * 100)
    : 0

  const tempoEstudo = estatisticas?.tempo_total_segundos
    ? `${Math.floor(estatisticas.tempo_total_segundos / 3600)}h ${Math.floor((estatisticas.tempo_total_segundos % 3600) / 60)}min`
    : '0h 0min'

  // Calcular limites usados
  const questoesUsadas = limites?.questoes_dia || 0
  const questoesLimite = limitesPlano.questoes_dia
  const questoesRestantes = questoesLimite === -1 ? '∞' : Math.max(0, questoesLimite - questoesUsadas)

  const simuladosUsados = limites?.simulados_mes || 0
  const simuladosLimite = limitesPlano.simulados_mes
  const simuladosRestantes = simuladosLimite === -1 ? '∞' : Math.max(0, simuladosLimite - simuladosUsados)

  const iaUsadas = limites?.perguntas_ia_mes || 0
  const iaLimite = limitesPlano.perguntas_ia_mes
  const iaRestantes = iaLimite === -1 ? '∞' : Math.max(0, iaLimite - iaUsadas)

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Olá, {profile?.nome?.split(' ')[0] || 'Estudante'}!
          </h1>
          <p className="text-emerald-200/70 mt-1">
            Continue estudando e conquiste sua vaga na residência
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-lg">
            <Flame className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-bold">{sequenciaDias} dias</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-white/60 text-sm">Questões Hoje</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{estatisticas?.questoes_feitas || 0}</span>
            <span className="text-emerald-400 text-sm">/ {questoesLimite === -1 ? '∞' : questoesLimite}</span>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-teal-400" />
            </div>
            <span className="text-white/60 text-sm">Taxa de Acerto</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{taxaAcerto}%</span>
            <span className="text-teal-400 text-sm">{estatisticas?.questoes_corretas || 0} corretas</span>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-white/60 text-sm">Tempo Hoje</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{tempoEstudo}</span>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white/60 text-sm">Simulados Mês</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{simuladosUsados}</span>
            <span className="text-purple-400 text-sm">/ {simuladosLimite === -1 ? '∞' : simuladosLimite}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/medicina/dashboard/questoes"
          className="group bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl p-6 border border-emerald-500/30 hover:border-emerald-500/50 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-white font-bold text-lg mb-1">Resolver Questões</h3>
          <p className="text-emerald-200/60 text-sm">
            {questoesRestantes} questões restantes hoje
          </p>
        </Link>

        <Link
          href="/medicina/dashboard/simulados"
          className="group bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6 text-purple-400" />
            </div>
            <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-white font-bold text-lg mb-1">Fazer Simulado</h3>
          <p className="text-purple-200/60 text-sm">
            {simuladosRestantes} simulados restantes no mês
          </p>
        </Link>

        <Link
          href="/medicina/dashboard/biblioteca"
          className="group bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-500/50 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-cyan-400" />
            </div>
            <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-white font-bold text-lg mb-1">Estudar Teoria</h3>
          <p className="text-cyan-200/60 text-sm">
            {estatisticas?.teorias_lidas || 0} teorias lidas hoje
          </p>
        </Link>

        <Link
          href="/medicina/dashboard/ia"
          className="group bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-500/30 hover:border-amber-500/50 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-amber-400" />
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-white font-bold text-lg mb-1">IA Tutora</h3>
          <p className="text-amber-200/60 text-sm">
            {iaRestantes} perguntas restantes no mês
          </p>
        </Link>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disciplinas mais estudadas */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Disciplinas em Destaque</h2>
            <Link href="/medicina/dashboard/estatisticas" className="text-emerald-400 text-sm hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { nome: 'Clínica Médica', progresso: 75, cor: 'emerald' },
              { nome: 'Cirurgia', progresso: 60, cor: 'teal' },
              { nome: 'Pediatria', progresso: 45, cor: 'cyan' },
              { nome: 'Ginecologia', progresso: 30, cor: 'purple' },
            ].map((disc, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm">{disc.nome}</span>
                  <span className="text-white/60 text-sm">{disc.progresso}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-${disc.cor}-500 rounded-full transition-all`}
                    style={{ width: `${disc.progresso}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Limites do Plano */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Seu Plano: {plano.charAt(0).toUpperCase() + plano.slice(1)}</h2>
            {plano === 'gratuito' && (
              <Link href="/medicina/dashboard/assinatura" className="text-amber-400 text-sm hover:underline flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Upgrade
              </Link>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span className="text-white/80">Questões/dia</span>
              </div>
              <span className="text-white font-medium">
                {questoesUsadas} / {questoesLimite === -1 ? '∞' : questoesLimite}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-purple-400" />
                <span className="text-white/80">Simulados/mês</span>
              </div>
              <span className="text-white font-medium">
                {simuladosUsados} / {simuladosLimite === -1 ? '∞' : simuladosLimite}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-amber-400" />
                <span className="text-white/80">Perguntas IA/mês</span>
              </div>
              <span className="text-white font-medium">
                {iaUsadas} / {iaLimite === -1 ? '∞' : iaLimite}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span className="text-white/80">Nível de Teoria</span>
              </div>
              <span className="text-white font-medium capitalize">
                {limitesPlano.teoria_nivel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
