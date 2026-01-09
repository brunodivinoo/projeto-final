'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { supabase } from '@/lib/supabase'
import {
  BookOpen,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Star,
  GraduationCap,
  X
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
  progresso: {
    lido: boolean
    favorito: boolean
    nivel_lido: string
  } | null
}

interface Disciplina {
  id: string
  nome: string
  teorias: Teoria[]
  expanded: boolean
}

export default function BibliotecaPage() {
  const { user, limitesPlano } = useMedAuth()
  const [loading, setLoading] = useState(true)
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [busca, setBusca] = useState('')
  const [filtroLido, setFiltroLido] = useState<'todos' | 'lidos' | 'nao_lidos'>('todos')
  const [filtroFavoritos, setFiltroFavoritos] = useState(false)

  const fetchTeorias = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // Buscar todas as disciplinas
      const { data: discsData } = await supabase
        .from('disciplinas_med')
        .select('id, nome')
        .order('nome')

      // Buscar teorias
      const params = new URLSearchParams()
      params.set('userId', user.id)
      if (busca) params.set('busca', busca)

      const response = await fetch(`/api/medicina/teorias?${params}`)
      const data = await response.json()

      // Agrupar por disciplina
      const disciplinasMap: Record<string, Disciplina> = {}

      discsData?.forEach(d => {
        disciplinasMap[d.id] = {
          ...d,
          teorias: [],
          expanded: false
        }
      })

      data.teorias?.forEach((t: Teoria) => {
        if (t.disciplina?.id && disciplinasMap[t.disciplina.id]) {
          // Aplicar filtros
          if (filtroLido === 'lidos' && !t.progresso?.lido) return
          if (filtroLido === 'nao_lidos' && t.progresso?.lido) return
          if (filtroFavoritos && !t.progresso?.favorito) return

          disciplinasMap[t.disciplina.id].teorias.push(t)
        }
      })

      // Converter para array e filtrar vazias
      const disciplinasArray = Object.values(disciplinasMap)
        .filter(d => d.teorias.length > 0 || !busca)
        .sort((a, b) => b.teorias.length - a.teorias.length)

      // Expandir primeira disciplina com conteúdo
      if (disciplinasArray.length > 0) {
        const primeiraComConteudo = disciplinasArray.find(d => d.teorias.length > 0)
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
  }, [user, busca, filtroLido, filtroFavoritos])

  useEffect(() => {
    fetchTeorias()
  }, [fetchTeorias])

  const toggleDisciplina = (id: string) => {
    setDisciplinas(prev => prev.map(d =>
      d.id === id ? { ...d, expanded: !d.expanded } : d
    ))
  }

  const totalTeorias = disciplinas.reduce((acc, d) => acc + d.teorias.length, 0)
  const teoriasLidas = disciplinas.reduce((acc, d) =>
    acc + d.teorias.filter(t => t.progresso?.lido).length, 0
  )

  const nivelTeoria = limitesPlano.teoria_nivel

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Biblioteca de Teoria
          </h1>
          <p className="text-emerald-200/70 mt-1">
            {totalTeorias} teorias disponíveis • {teoriasLidas} lidas
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
          <GraduationCap className="w-5 h-5 text-emerald-400" />
          <span className="text-white/80">
            Nível: <span className="text-emerald-400 font-medium capitalize">{nivelTeoria}</span>
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título ou tema..."
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

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filtroLido}
            onChange={(e) => setFiltroLido(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="todos" className="bg-slate-800">Todos</option>
            <option value="lidos" className="bg-slate-800">Lidos</option>
            <option value="nao_lidos" className="bg-slate-800">Não lidos</option>
          </select>

          <button
            onClick={() => setFiltroFavoritos(!filtroFavoritos)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              filtroFavoritos
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Star className={`w-5 h-5 ${filtroFavoritos ? 'fill-amber-400' : ''}`} />
            Favoritos
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : disciplinas.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
          <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhuma teoria encontrada</h3>
          <p className="text-white/60">Tente ajustar os filtros ou a busca</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disciplinas.map((disciplina) => (
            <div key={disciplina.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              {/* Disciplina Header */}
              <button
                onClick={() => toggleDisciplina(disciplina.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">{disciplina.nome}</h3>
                    <p className="text-white/60 text-sm">
                      {disciplina.teorias.length} teorias •
                      {' '}{disciplina.teorias.filter(t => t.progresso?.lido).length} lidas
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-6 h-6 text-white/40 transition-transform ${
                  disciplina.expanded ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Teorias List */}
              {disciplina.expanded && disciplina.teorias.length > 0 && (
                <div className="border-t border-white/10">
                  {disciplina.teorias.map((teoria, index) => (
                    <Link
                      key={teoria.id}
                      href={`/medicina/dashboard/biblioteca/${teoria.id}`}
                      className={`block px-6 py-4 hover:bg-white/5 transition-colors ${
                        index < disciplina.teorias.length - 1 ? 'border-b border-white/5' : ''
                      }`}
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
                          {teoria.subtitulo && (
                            <p className="text-white/60 text-sm truncate mb-2">{teoria.subtitulo}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm">
                            {teoria.assunto && (
                              <span className="text-emerald-400/80">{teoria.assunto.nome}</span>
                            )}
                            <span className="flex items-center gap-1 text-white/40">
                              <Clock className="w-4 h-4" />
                              {teoria.tempo_leitura_minutos} min
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {disciplina.expanded && disciplina.teorias.length === 0 && (
                <div className="px-6 py-8 text-center text-white/40 border-t border-white/10">
                  Nenhuma teoria disponível para esta disciplina
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
