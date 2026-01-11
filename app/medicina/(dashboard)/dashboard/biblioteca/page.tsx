'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { supabase } from '@/lib/supabase'
import {
  BookOpen,
  Search,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Star,
  GraduationCap,
  X,
  Filter,
  BarChart3,
  Layers,
  BookMarked,
  Sparkles
} from 'lucide-react'

interface Teoria {
  id: string
  titulo: string
  subtitulo: string | null
  tempo_leitura_minutos: number
  nivel_dificuldade: number
  pontos_chave: string[] | null
  disciplina: { id: string, nome: string } | null
  assunto: { id: string, nome: string } | null
  subassunto: { id: string, nome: string } | null
  progresso: {
    lido: boolean
    favorito: boolean
    nivel_lido: string
  } | null
}

interface Assunto {
  id: string
  nome: string
  teorias: Teoria[]
  subassuntos: Map<string, { nome: string; teorias: Teoria[] }>
  expanded: boolean
}

interface Disciplina {
  id: string
  nome: string
  cor: string
  assuntos: Map<string, Assunto>
  totalTeorias: number
  teoriasLidas: number
  expanded: boolean
}

// Cores para disciplinas
const CORES_DISCIPLINAS: Record<string, { bg: string; text: string; border: string }> = {
  'Clínica Médica': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  'Cirurgia': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  'Pediatria': { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  'Ginecologia e Obstetrícia': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Medicina Preventiva': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  'Cardiologia': { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  'Farmacologia': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  'Anatomia': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'Fisiologia': { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
  'Patologia': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  'default': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' }
}

function getCorDisciplina(nome: string) {
  return CORES_DISCIPLINAS[nome] || CORES_DISCIPLINAS['default']
}

export default function BibliotecaPage() {
  const { user, limitesPlano } = useMedAuth()
  const [loading, setLoading] = useState(true)
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [todasTeorias, setTodasTeorias] = useState<Teoria[]>([])
  const [busca, setBusca] = useState('')
  const [filtroLido, setFiltroLido] = useState<'todos' | 'lidos' | 'nao_lidos'>('todos')
  const [filtroFavoritos, setFiltroFavoritos] = useState(false)
  const [filtroDificuldade, setFiltroDificuldade] = useState<number | null>(null)
  const [filtroTempo, setFiltroTempo] = useState<'todos' | 'rapido' | 'medio' | 'longo'>('todos')
  const [showFiltros, setShowFiltros] = useState(false)
  const [visualizacao, setVisualizacao] = useState<'hierarquia' | 'lista' | 'cards'>('hierarquia')

  const fetchTeorias = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // Buscar todas as disciplinas com seus assuntos
      const { data: discsData } = await supabase
        .from('disciplinas_med')
        .select('id, nome')
        .order('nome')

      // Buscar assuntos
      const { data: assuntosData } = await supabase
        .from('assuntos_med')
        .select('id, nome, disciplina_id')
        .order('nome')

      // Buscar subassuntos
      const { data: subassuntosData } = await supabase
        .from('subassuntos_med')
        .select('id, nome, assunto_id')
        .order('nome')

      // Buscar teorias
      const params = new URLSearchParams()
      params.set('userId', user.id)
      if (busca) params.set('busca', busca)

      const response = await fetch(`/api/medicina/teorias?${params}`)
      const data = await response.json()

      setTodasTeorias(data.teorias || [])

      // Criar mapa de assuntos por disciplina
      const assuntosPorDisciplina: Record<string, Array<{ id: string; nome: string; disciplina_id: string }>> = {}
      assuntosData?.forEach(a => {
        if (!assuntosPorDisciplina[a.disciplina_id]) {
          assuntosPorDisciplina[a.disciplina_id] = []
        }
        assuntosPorDisciplina[a.disciplina_id]!.push(a)
      })

      // Criar mapa de subassuntos por assunto
      const subassuntosPorAssunto: Record<string, Array<{ id: string; nome: string; assunto_id: string }>> = {}
      subassuntosData?.forEach(s => {
        if (!subassuntosPorAssunto[s.assunto_id]) {
          subassuntosPorAssunto[s.assunto_id] = []
        }
        subassuntosPorAssunto[s.assunto_id]!.push(s)
      })

      // Construir estrutura hierárquica
      const disciplinasMap: Record<string, Disciplina> = {}

      discsData?.forEach(d => {
        const cor = getCorDisciplina(d.nome)
        disciplinasMap[d.id] = {
          ...d,
          cor: cor.bg,
          assuntos: new Map(),
          totalTeorias: 0,
          teoriasLidas: 0,
          expanded: false
        }

        // Adicionar assuntos
        assuntosPorDisciplina[d.id]?.forEach(a => {
          const assunto: Assunto = {
            id: a.id,
            nome: a.nome,
            teorias: [],
            subassuntos: new Map(),
            expanded: false
          }

          // Adicionar subassuntos
          subassuntosPorAssunto[a.id]?.forEach(s => {
            assunto.subassuntos.set(s.id, {
              nome: s.nome,
              teorias: []
            })
          })

          disciplinasMap[d.id].assuntos.set(a.id, assunto)
        })
      })

      // Distribuir teorias na hierarquia
      data.teorias?.forEach((t: Teoria) => {
        // Aplicar filtros
        if (filtroLido === 'lidos' && !t.progresso?.lido) return
        if (filtroLido === 'nao_lidos' && t.progresso?.lido) return
        if (filtroFavoritos && !t.progresso?.favorito) return
        if (filtroDificuldade && t.nivel_dificuldade !== filtroDificuldade) return
        if (filtroTempo === 'rapido' && t.tempo_leitura_minutos > 10) return
        if (filtroTempo === 'medio' && (t.tempo_leitura_minutos <= 10 || t.tempo_leitura_minutos > 20)) return
        if (filtroTempo === 'longo' && t.tempo_leitura_minutos <= 20) return

        if (t.disciplina?.id && disciplinasMap[t.disciplina.id]) {
          const disc = disciplinasMap[t.disciplina.id]
          disc.totalTeorias++
          if (t.progresso?.lido) disc.teoriasLidas++

          if (t.assunto?.id && disc.assuntos.has(t.assunto.id)) {
            const assunto = disc.assuntos.get(t.assunto.id)!

            if (t.subassunto?.id && assunto.subassuntos.has(t.subassunto.id)) {
              assunto.subassuntos.get(t.subassunto.id)!.teorias.push(t)
            } else {
              assunto.teorias.push(t)
            }
          }
        }
      })

      // Converter para array e ordenar
      const disciplinasArray = Object.values(disciplinasMap)
        .filter(d => d.totalTeorias > 0 || !busca)
        .sort((a, b) => b.totalTeorias - a.totalTeorias)

      // Expandir primeira disciplina com conteúdo
      if (disciplinasArray.length > 0) {
        const primeiraComConteudo = disciplinasArray.find(d => d.totalTeorias > 0)
        if (primeiraComConteudo) {
          primeiraComConteudo.expanded = true
        }
      }

      setDisciplinas(disciplinasArray)

    } catch (error) {
      console.error('Erro ao buscar teorias:', error)
    } finally {
      setLoading(false)
    }
  }, [user, busca, filtroLido, filtroFavoritos, filtroDificuldade, filtroTempo])

  useEffect(() => {
    fetchTeorias()
  }, [fetchTeorias])

  const toggleDisciplina = (id: string) => {
    setDisciplinas(prev => prev.map(d =>
      d.id === id ? { ...d, expanded: !d.expanded } : d
    ))
  }

  const toggleAssunto = (discId: string, assuntoId: string) => {
    setDisciplinas(prev => prev.map(d => {
      if (d.id === discId) {
        const newAssuntos = new Map(d.assuntos)
        const assunto = newAssuntos.get(assuntoId)
        if (assunto) {
          newAssuntos.set(assuntoId, { ...assunto, expanded: !assunto.expanded })
        }
        return { ...d, assuntos: newAssuntos }
      }
      return d
    }))
  }

  // Estatísticas
  const stats = useMemo(() => {
    const total = todasTeorias.length
    const lidas = todasTeorias.filter(t => t.progresso?.lido).length
    const favoritas = todasTeorias.filter(t => t.progresso?.favorito).length
    const tempoTotal = todasTeorias.reduce((acc, t) => acc + t.tempo_leitura_minutos, 0)

    return { total, lidas, favoritas, tempoTotal, percentLido: total > 0 ? Math.round((lidas / total) * 100) : 0 }
  }, [todasTeorias])

  const nivelTeoria = limitesPlano.teoria_nivel

  const limparFiltros = () => {
    setBusca('')
    setFiltroLido('todos')
    setFiltroFavoritos(false)
    setFiltroDificuldade(null)
    setFiltroTempo('todos')
  }

  const temFiltrosAtivos = busca || filtroLido !== 'todos' || filtroFavoritos || filtroDificuldade || filtroTempo !== 'todos'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header com Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl p-6 border border-emerald-500/20">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Biblioteca de Teoria
              </h1>
              <p className="text-emerald-200/70">
                Conteúdo organizado para sua preparação
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span className="text-white/80 text-sm capitalize">{nivelTeoria}</span>
            </div>
          </div>

          {/* Barra de Progresso Geral */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/60">Progresso Geral</span>
              <span className="text-emerald-400 font-medium">{stats.percentLido}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.percentLido}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-white/60 text-sm">Teorias</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">{stats.lidas} lidas</span>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{Math.round(stats.tempoTotal / 60)}h</p>
              <p className="text-white/60 text-sm">Conteúdo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-amber-400">{stats.favoritas} favoritas</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título, tema ou palavra-chave..."
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Toggle & View Options */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFiltros || temFiltrosAtivos
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtros
              {temFiltrosAtivos && (
                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              )}
            </button>

            <div className="flex bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setVisualizacao('hierarquia')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  visualizacao === 'hierarquia' ? 'bg-emerald-500 text-white' : 'text-white/60 hover:text-white'
                }`}
                title="Hierarquia"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setVisualizacao('lista')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  visualizacao === 'lista' ? 'bg-emerald-500 text-white' : 'text-white/60 hover:text-white'
                }`}
                title="Lista"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setVisualizacao('cards')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  visualizacao === 'cards' ? 'bg-emerald-500 text-white' : 'text-white/60 hover:text-white'
                }`}
                title="Cards"
              >
                <BookMarked className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFiltros && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10">
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-xs">Status</label>
              <select
                value={filtroLido}
                onChange={(e) => setFiltroLido(e.target.value as 'todos' | 'lidos' | 'nao_lidos')}
                className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="todos" className="bg-slate-800">Todos</option>
                <option value="lidos" className="bg-slate-800">Lidos</option>
                <option value="nao_lidos" className="bg-slate-800">Não lidos</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-xs">Dificuldade</label>
              <select
                value={filtroDificuldade || ''}
                onChange={(e) => setFiltroDificuldade(e.target.value ? Number(e.target.value) : null)}
                className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" className="bg-slate-800">Todas</option>
                <option value="1" className="bg-slate-800">⭐ Fácil</option>
                <option value="2" className="bg-slate-800">⭐⭐ Médio-Fácil</option>
                <option value="3" className="bg-slate-800">⭐⭐⭐ Médio</option>
                <option value="4" className="bg-slate-800">⭐⭐⭐⭐ Difícil</option>
                <option value="5" className="bg-slate-800">⭐⭐⭐⭐⭐ Expert</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-xs">Tempo de Leitura</label>
              <select
                value={filtroTempo}
                onChange={(e) => setFiltroTempo(e.target.value as 'todos' | 'rapido' | 'medio' | 'longo')}
                className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="todos" className="bg-slate-800">Todos</option>
                <option value="rapido" className="bg-slate-800">Rápido (até 10min)</option>
                <option value="medio" className="bg-slate-800">Médio (10-20min)</option>
                <option value="longo" className="bg-slate-800">Longo (+20min)</option>
              </select>
            </div>

            <button
              onClick={() => setFiltroFavoritos(!filtroFavoritos)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors self-end ${
                filtroFavoritos
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Star className={`w-4 h-4 ${filtroFavoritos ? 'fill-amber-400' : ''}`} />
              Favoritos
            </button>

            {temFiltrosAtivos && (
              <button
                onClick={limparFiltros}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 self-end"
              >
                <X className="w-4 h-4" />
                Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : disciplinas.filter(d => d.totalTeorias > 0).length === 0 ? (
        <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
          <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhuma teoria encontrada</h3>
          <p className="text-white/60 mb-4">Tente ajustar os filtros ou a busca</p>
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : visualizacao === 'hierarquia' ? (
        /* Visualização Hierárquica */
        <div className="space-y-4">
          {disciplinas.filter(d => d.totalTeorias > 0).map((disciplina) => {
            const cores = getCorDisciplina(disciplina.nome)
            const progressoDisc = disciplina.totalTeorias > 0
              ? Math.round((disciplina.teoriasLidas / disciplina.totalTeorias) * 100)
              : 0

            return (
              <div key={disciplina.id} className={`bg-white/5 rounded-xl border ${cores.border} overflow-hidden`}>
                {/* Disciplina Header */}
                <button
                  onClick={() => toggleDisciplina(disciplina.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${cores.bg} flex items-center justify-center`}>
                      <BookOpen className={`w-6 h-6 ${cores.text}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">{disciplina.nome}</h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-white/60">
                          {disciplina.totalTeorias} teorias
                        </span>
                        <span className={cores.text}>
                          {disciplina.teoriasLidas} lidas
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Mini Progress Bar */}
                    <div className="hidden md:flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${cores.bg.replace('/20', '')}`}
                          style={{ width: `${progressoDisc}%` }}
                        />
                      </div>
                      <span className={`text-sm ${cores.text}`}>{progressoDisc}%</span>
                    </div>
                    <ChevronDown className={`w-6 h-6 text-white/40 transition-transform ${
                      disciplina.expanded ? 'rotate-180' : ''
                    }`} />
                  </div>
                </button>

                {/* Assuntos */}
                {disciplina.expanded && (
                  <div className="border-t border-white/10">
                    {Array.from(disciplina.assuntos.values())
                      .filter(a => a.teorias.length > 0 || Array.from(a.subassuntos.values()).some(s => s.teorias.length > 0))
                      .map((assunto) => {
                        const totalAssunto = assunto.teorias.length +
                          Array.from(assunto.subassuntos.values()).reduce((acc, s) => acc + s.teorias.length, 0)

                        if (totalAssunto === 0) return null

                        return (
                          <div key={assunto.id} className="border-b border-white/5 last:border-b-0">
                            {/* Assunto Header */}
                            <button
                              onClick={() => toggleAssunto(disciplina.id, assunto.id)}
                              className="w-full px-6 py-3 pl-10 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="text-white/80 font-medium">{assunto.nome}</span>
                                <span className="text-white/40 text-sm">({totalAssunto})</span>
                              </div>
                              <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${
                                assunto.expanded ? 'rotate-90' : ''
                              }`} />
                            </button>

                            {/* Teorias do Assunto */}
                            {assunto.expanded && (
                              <div className="bg-white/[0.02]">
                                {/* Teorias diretas do assunto */}
                                {assunto.teorias.map((teoria) => (
                                  <TeoriaItem key={teoria.id} teoria={teoria} nivel={2} />
                                ))}

                                {/* Subassuntos */}
                                {Array.from(assunto.subassuntos.entries())
                                  .filter(([, s]) => s.teorias.length > 0)
                                  .map(([subId, subassunto]) => (
                                    <div key={subId}>
                                      <div className="px-6 py-2 pl-16 text-white/50 text-sm font-medium flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" />
                                        {subassunto.nome}
                                      </div>
                                      {subassunto.teorias.map((teoria) => (
                                        <TeoriaItem key={teoria.id} teoria={teoria} nivel={3} />
                                      ))}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        )
                      })}

                    {/* Caso não tenha assuntos mas tenha teorias */}
                    {disciplina.assuntos.size === 0 && (
                      <div className="px-6 py-4 text-center text-white/40">
                        Nenhum conteúdo disponível ainda
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : visualizacao === 'lista' ? (
        /* Visualização em Lista */
        <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/5">
          {todasTeorias
            .filter(t => {
              if (filtroLido === 'lidos' && !t.progresso?.lido) return false
              if (filtroLido === 'nao_lidos' && t.progresso?.lido) return false
              if (filtroFavoritos && !t.progresso?.favorito) return false
              if (filtroDificuldade && t.nivel_dificuldade !== filtroDificuldade) return false
              return true
            })
            .map((teoria) => (
              <TeoriaItem key={teoria.id} teoria={teoria} nivel={0} showDisciplina />
            ))}
        </div>
      ) : (
        /* Visualização em Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todasTeorias
            .filter(t => {
              if (filtroLido === 'lidos' && !t.progresso?.lido) return false
              if (filtroLido === 'nao_lidos' && t.progresso?.lido) return false
              if (filtroFavoritos && !t.progresso?.favorito) return false
              if (filtroDificuldade && t.nivel_dificuldade !== filtroDificuldade) return false
              return true
            })
            .map((teoria) => (
              <TeoriaCard key={teoria.id} teoria={teoria} />
            ))}
        </div>
      )}
    </div>
  )
}

// Componente de Item de Teoria (para lista e hierarquia)
function TeoriaItem({ teoria, nivel, showDisciplina }: { teoria: Teoria; nivel: number; showDisciplina?: boolean }) {
  const paddingLeft = nivel === 0 ? 'pl-6' : nivel === 1 ? 'pl-10' : nivel === 2 ? 'pl-14' : 'pl-20'

  return (
    <Link
      href={`/medicina/dashboard/biblioteca/${teoria.id}`}
      className={`block px-6 py-3 ${paddingLeft} hover:bg-white/5 transition-colors`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {teoria.progresso?.lido && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            {teoria.progresso?.favorito && (
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
            )}
            <h4 className="text-white font-medium truncate">{teoria.titulo}</h4>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            {showDisciplina && teoria.disciplina && (
              <span className="text-emerald-400">{teoria.disciplina.nome}</span>
            )}
            {teoria.assunto && !showDisciplina && (
              <span className="text-emerald-400/70">{teoria.assunto.nome}</span>
            )}
            <span className="flex items-center gap-1 text-white/40">
              <Clock className="w-3 h-3" />
              {teoria.tempo_leitura_minutos}min
            </span>
            <span className="text-white/40">
              {'⭐'.repeat(teoria.nivel_dificuldade)}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0 mt-1" />
      </div>
    </Link>
  )
}

// Componente de Card de Teoria
function TeoriaCard({ teoria }: { teoria: Teoria }) {
  const cores = teoria.disciplina ? getCorDisciplina(teoria.disciplina.nome) : getCorDisciplina('default')

  return (
    <Link
      href={`/medicina/dashboard/biblioteca/${teoria.id}`}
      className={`block bg-white/5 rounded-xl border ${cores.border} p-5 hover:bg-white/10 transition-colors group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`px-2 py-1 rounded-md ${cores.bg} ${cores.text} text-xs font-medium`}>
          {teoria.disciplina?.nome || 'Geral'}
        </div>
        <div className="flex items-center gap-1">
          {teoria.progresso?.favorito && (
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          )}
          {teoria.progresso?.lido && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
        </div>
      </div>

      <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
        {teoria.titulo}
      </h3>

      {teoria.subtitulo && (
        <p className="text-white/60 text-sm mb-3 line-clamp-2">{teoria.subtitulo}</p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3 text-white/50">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {teoria.tempo_leitura_minutos}min
          </span>
          <span>{'⭐'.repeat(teoria.nivel_dificuldade)}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-emerald-400 transition-colors" />
      </div>
    </Link>
  )
}
