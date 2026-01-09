'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { supabase } from '@/lib/supabase'
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Eye,
  MessageCircle,
  CheckCircle2,
  Pin,
  Star,
  Clock,
  X,
  Crown
} from 'lucide-react'

interface Topico {
  id: string
  titulo: string
  conteudo: string
  categoria: string
  visualizacoes: number
  total_respostas: number
  fixado: boolean
  destaque: boolean
  resolvido: boolean
  created_at: string
  autor: {
    id: string
    nome: string
    plano: string
  } | null
  disciplina: {
    id: string
    nome: string
  } | null
}

interface Disciplina {
  id: string
  nome: string
}

const categorias = [
  { id: 'discussao', label: 'Discussão', cor: 'bg-blue-500/20 text-blue-400' },
  { id: 'duvida', label: 'Dúvida', cor: 'bg-amber-500/20 text-amber-400' },
  { id: 'questao', label: 'Questão', cor: 'bg-purple-500/20 text-purple-400' },
  { id: 'dica', label: 'Dica', cor: 'bg-emerald-500/20 text-emerald-400' },
  { id: 'recurso', label: 'Recurso', cor: 'bg-red-500/20 text-red-400' },
]

export default function ForumPage() {
  const { user } = useMedAuth()
  const [topicos, setTopicos] = useState<Topico[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [disciplinaFiltro, setDisciplinaFiltro] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)

  // Carregar disciplinas
  useEffect(() => {
    const loadDisciplinas = async () => {
      const { data } = await supabase
        .from('disciplinas_med')
        .select('id, nome')
        .order('nome')
      if (data) setDisciplinas(data)
    }
    loadDisciplinas()
  }, [])

  const fetchTopicos = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (categoriaFiltro) params.set('categoria', categoriaFiltro)
      if (disciplinaFiltro) params.set('disciplinaId', disciplinaFiltro)
      if (busca) params.set('busca', busca)

      const response = await fetch(`/api/medicina/forum?${params}`)
      const data = await response.json()

      setTopicos(data.topicos || [])
      setTotal(data.total || 0)

    } catch (error) {
      console.error('Erro ao buscar tópicos:', error)
    } finally {
      setLoading(false)
    }
  }, [categoriaFiltro, disciplinaFiltro, busca])

  useEffect(() => {
    fetchTopicos()
  }, [fetchTopicos])

  const getCategoriaInfo = (cat: string) => {
    return categorias.find(c => c.id === cat) || categorias[0]
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return 'Agora'
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`
    return d.toLocaleDateString('pt-BR')
  }

  const limparFiltros = () => {
    setBusca('')
    setCategoriaFiltro('')
    setDisciplinaFiltro('')
  }

  const temFiltrosAtivos = busca || categoriaFiltro || disciplinaFiltro

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Fórum da Comunidade
          </h1>
          <p className="text-emerald-200/70 mt-1">
            {total} tópicos • Tire dúvidas e ajude colegas
          </p>
        </div>

        <Link
          href="/medicina/dashboard/forum/novo"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Tópico
        </Link>
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
            placeholder="Buscar tópicos..."
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

        {/* Filter Button */}
        <button
          onClick={() => setShowFiltros(!showFiltros)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            temFiltrosAtivos
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filtros
          {temFiltrosAtivos && <span className="w-2 h-2 bg-emerald-400 rounded-full" />}
        </button>
      </div>

      {/* Filters Panel */}
      {showFiltros && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-medium">Filtros</span>
            {temFiltrosAtivos && (
              <button onClick={limparFiltros} className="text-emerald-400 text-sm hover:underline">
                Limpar
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Categoria */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaFiltro(categoriaFiltro === cat.id ? '' : cat.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      categoriaFiltro === cat.id ? cat.cor : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Disciplina */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Disciplina</label>
              <select
                value={disciplinaFiltro}
                onChange={(e) => setDisciplinaFiltro(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" className="bg-slate-800">Todas</option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-800">{d.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Topics List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : topicos.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
          <MessageSquare className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {temFiltrosAtivos ? 'Nenhum tópico encontrado' : 'Nenhum tópico ainda'}
          </h3>
          <p className="text-white/60 mb-6">
            {temFiltrosAtivos ? 'Tente ajustar os filtros' : 'Seja o primeiro a iniciar uma discussão!'}
          </p>
          {!temFiltrosAtivos && (
            <Link
              href="/medicina/dashboard/forum/novo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Tópico
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {topicos.map((topico) => {
            const catInfo = getCategoriaInfo(topico.categoria)

            return (
              <Link
                key={topico.id}
                href={`/medicina/dashboard/forum/${topico.id}`}
                className="block bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {topico.autor?.nome?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {topico.fixado && (
                        <Pin className="w-4 h-4 text-amber-400" />
                      )}
                      {topico.resolvido && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Resolvido
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${catInfo.cor}`}>
                        {catInfo.label}
                      </span>
                      {topico.disciplina && (
                        <span className="text-white/40 text-xs">
                          {topico.disciplina.nome}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-medium text-white mb-1 line-clamp-1">
                      {topico.titulo}
                    </h3>

                    {/* Preview */}
                    <p className="text-white/60 text-sm line-clamp-2 mb-3">
                      {topico.conteudo}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        {topico.autor?.plano === 'residencia' && <Crown className="w-3 h-3 text-amber-400" />}
                        {topico.autor?.nome || 'Anônimo'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(topico.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {topico.visualizacoes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {topico.total_respostas}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-white/20 flex-shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
