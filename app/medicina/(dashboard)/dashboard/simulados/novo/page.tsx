'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  Target,
  Shuffle,
  Filter,
  ChevronDown,
  Play,
  AlertCircle,
  Zap
} from 'lucide-react'

interface Disciplina {
  id: string
  nome: string
}

export default function NovoSimuladoPage() {
  const router = useRouter()
  const { user, limitesPlano, limites } = useMedAuth()

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [bancas, setBancas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [nome, setNome] = useState('Simulado ' + new Date().toLocaleDateString('pt-BR'))
  const [totalQuestoes, setTotalQuestoes] = useState(30)
  const [tempoLimite, setTempoLimite] = useState<number | null>(null)
  const [tempoHabilitado, setTempoHabilitado] = useState(false)
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<string[]>([])
  const [bancasSelecionadas, setBancasSelecionadas] = useState<string[]>([])
  const [dificuldadeMin, setDificuldadeMin] = useState(1)
  const [dificuldadeMax, setDificuldadeMax] = useState(5)
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false)

  // Buscar disciplinas e bancas
  useEffect(() => {
    const fetchData = async () => {
      // Disciplinas
      const { data: discs } = await supabase
        .from('disciplinas_med')
        .select('id, nome')
        .order('nome')

      if (discs) setDisciplinas(discs)

      // Bancas
      const { data: bancasData } = await supabase
        .from('questoes_med')
        .select('banca')
        .not('banca', 'is', null)

      if (bancasData) {
        const unique = [...new Set(bancasData.map(b => b.banca).filter(Boolean))]
        setBancas(unique as string[])
      }
    }
    fetchData()
  }, [])

  const toggleDisciplina = (id: string) => {
    setDisciplinasSelecionadas(prev =>
      prev.includes(id)
        ? prev.filter(d => d !== id)
        : [...prev, id]
    )
  }

  const toggleBanca = (banca: string) => {
    setBancasSelecionadas(prev =>
      prev.includes(banca)
        ? prev.filter(b => b !== banca)
        : [...prev, banca]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')

    if (!nome.trim()) {
      setError('Digite um nome para o simulado')
      return
    }

    if (totalQuestoes < 5 || totalQuestoes > 100) {
      setError('O simulado deve ter entre 5 e 100 questões')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/medicina/simulados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          nome: nome.trim(),
          tipo: 'personalizado',
          disciplinas: disciplinasSelecionadas.length > 0 ? disciplinasSelecionadas : null,
          dificuldadeMin,
          dificuldadeMax,
          bancas: bancasSelecionadas.length > 0 ? bancasSelecionadas : null,
          totalQuestoes,
          tempoLimite: tempoHabilitado ? tempoLimite : null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar simulado')
      }

      router.push(`/medicina/dashboard/simulados/${data.simulado.id}`)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar simulado')
    } finally {
      setLoading(false)
    }
  }

  // Templates rápidos
  const templates = [
    { nome: 'Rápido (10 questões)', questoes: 10, tempo: 15 },
    { nome: 'Normal (30 questões)', questoes: 30, tempo: 45 },
    { nome: 'Extenso (60 questões)', questoes: 60, tempo: 90 },
    { nome: 'Prova Completa (100 questões)', questoes: 100, tempo: 180 },
  ]

  const simuladosRestantes = limitesPlano.simulados_mes === -1
    ? '∞'
    : Math.max(0, limitesPlano.simulados_mes - (limites?.simulados_mes || 0))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/medicina/dashboard/simulados"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>
        <div className="text-white/60 text-sm">
          {simuladosRestantes} simulados restantes este mês
        </div>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Novo Simulado
        </h1>
        <p className="text-emerald-200/70 mt-1">
          Configure seu simulado personalizado
        </p>
      </div>

      {/* Templates Rápidos */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-white">Modelos Rápidos</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {templates.map((template) => (
            <button
              key={template.nome}
              onClick={() => {
                setTotalQuestoes(template.questoes)
                setTempoLimite(template.tempo)
                setTempoHabilitado(true)
              }}
              className={`p-3 rounded-lg border text-center transition-colors ${
                totalQuestoes === template.questoes && tempoLimite === template.tempo
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="text-white font-medium text-sm">{template.nome}</div>
              <div className="text-white/40 text-xs mt-1">{template.tempo} min</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <label className="block text-white font-medium mb-3">Nome do Simulado</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Ex: Simulado de Clínica Médica"
          />
        </div>

        {/* Número de Questões */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            <label className="text-white font-medium">Número de Questões</label>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={totalQuestoes}
              onChange={(e) => setTotalQuestoes(parseInt(e.target.value))}
              className="flex-1 accent-emerald-500"
            />
            <div className="w-20 text-center">
              <input
                type="number"
                min="5"
                max="100"
                value={totalQuestoes}
                onChange={(e) => setTotalQuestoes(Math.min(100, Math.max(5, parseInt(e.target.value) || 5)))}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Tempo */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-teal-400" />
              <label className="text-white font-medium">Limite de Tempo</label>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tempoHabilitado}
                onChange={(e) => setTempoHabilitado(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-white/60 text-sm">Habilitar</span>
            </label>
          </div>
          {tempoHabilitado && (
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={tempoLimite || 60}
                onChange={(e) => setTempoLimite(parseInt(e.target.value))}
                className="flex-1 accent-teal-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={tempoLimite || 60}
                  onChange={(e) => setTempoLimite(parseInt(e.target.value) || 60)}
                  className="w-20 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-white/60">min</span>
              </div>
            </div>
          )}
        </div>

        {/* Disciplinas */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-purple-400" />
            <label className="text-white font-medium">Disciplinas</label>
            <span className="text-white/40 text-sm">(deixe vazio para todas)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {disciplinas.map((disc) => (
              <button
                key={disc.id}
                type="button"
                onClick={() => toggleDisciplina(disc.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  disciplinasSelecionadas.includes(disc.id)
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {disc.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros Avançados */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-cyan-400" />
              <span className="font-medium text-white">Filtros Avançados</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${showFiltrosAvancados ? 'rotate-180' : ''}`} />
          </button>

          {showFiltrosAvancados && (
            <div className="p-6 border-t border-white/10 space-y-6">
              {/* Dificuldade */}
              <div>
                <label className="text-white/80 text-sm mb-3 block">
                  Dificuldade: {dificuldadeMin} a {dificuldadeMax}
                </label>
                <div className="flex items-center gap-4">
                  <select
                    value={dificuldadeMin}
                    onChange={(e) => setDificuldadeMin(parseInt(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n} className="bg-slate-800">{n}</option>
                    ))}
                  </select>
                  <span className="text-white/40">até</span>
                  <select
                    value={dificuldadeMax}
                    onChange={(e) => setDificuldadeMax(parseInt(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n} className="bg-slate-800">{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bancas */}
              <div>
                <label className="text-white/80 text-sm mb-3 block">Bancas</label>
                <div className="flex flex-wrap gap-2">
                  {bancas.map((banca) => (
                    <button
                      key={banca}
                      type="button"
                      onClick={() => toggleBanca(banca)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        bancasSelecionadas.includes(banca)
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {banca}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
              Criando...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Iniciar Simulado
            </>
          )}
        </button>
      </form>
    </div>
  )
}
