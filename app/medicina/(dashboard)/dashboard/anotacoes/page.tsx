'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import {
  PenTool,
  Plus,
  Search,
  Folder,
  Star,
  Trash2,
  MoreVertical,
  FileText,
  BookOpen,
  Clock,
  X,
  FolderPlus
} from 'lucide-react'

interface Anotacao {
  id: string
  titulo: string
  conteudo: string
  pasta: string | null
  favorito: boolean
  tags: string[] | null
  teoria: { id: string, titulo: string } | null
  questao: { id: string, enunciado: string } | null
  created_at: string
  updated_at: string
}

export default function AnotacoesPage() {
  const { user, limitesPlano } = useMedAuth()
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([])
  const [pastas, setPastas] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [pastaAtiva, setPastaAtiva] = useState<string | null>(null)
  const [somenteFavoritos, setSomenteFavoritos] = useState(false)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)

  const fetchAnotacoes = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.set('userId', user.id)
      if (pastaAtiva) params.set('pasta', pastaAtiva)
      if (busca) params.set('busca', busca)
      if (somenteFavoritos) params.set('favoritos', 'true')

      const response = await fetch(`/api/medicina/anotacoes?${params}`)
      const data = await response.json()

      setAnotacoes(data.anotacoes || [])
      setPastas(data.pastas || [])
      setTotal(data.total || 0)

    } catch (error) {
      console.error('Erro ao buscar anotações:', error)
    } finally {
      setLoading(false)
    }
  }, [user, pastaAtiva, busca, somenteFavoritos])

  useEffect(() => {
    fetchAnotacoes()
  }, [fetchAnotacoes])

  const toggleFavorito = async (id: string, atual: boolean) => {
    if (!user) return

    try {
      await fetch('/api/medicina/anotacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          userId: user.id,
          favorito: !atual
        })
      })

      setAnotacoes(prev => prev.map(a =>
        a.id === id ? { ...a, favorito: !atual } : a
      ))

    } catch (error) {
      console.error('Erro ao atualizar favorito:', error)
    }
  }

  const excluirAnotacao = async (id: string) => {
    if (!user || !confirm('Deseja realmente excluir esta anotação?')) return

    try {
      await fetch(`/api/medicina/anotacoes?id=${id}&userId=${user.id}`, {
        method: 'DELETE'
      })

      setAnotacoes(prev => prev.filter(a => a.id !== id))
      setTotal(prev => prev - 1)
      setMenuAberto(null)

    } catch (error) {
      console.error('Erro ao excluir anotação:', error)
    }
  }

  const limiteAnotacoes = limitesPlano.anotacoes_total
  const podecriar = limiteAnotacoes === -1 || total < limiteAnotacoes

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength).trim() + '...'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Minhas Anotações
          </h1>
          <p className="text-emerald-200/70 mt-1">
            {total} anotações • {limiteAnotacoes === -1 ? 'Ilimitadas' : `${total}/${limiteAnotacoes}`}
          </p>
        </div>

        <Link
          href={podecriar ? '/medicina/dashboard/anotacoes/nova' : '#'}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
            podecriar
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
          onClick={(e) => !podecriar && e.preventDefault()}
        >
          <Plus className="w-5 h-5" />
          Nova Anotação
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
            placeholder="Buscar anotações..."
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

        {/* Favoritos */}
        <button
          onClick={() => setSomenteFavoritos(!somenteFavoritos)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            somenteFavoritos
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <Star className={`w-5 h-5 ${somenteFavoritos ? 'fill-amber-400' : ''}`} />
          Favoritas
        </button>
      </div>

      {/* Pastas */}
      {pastas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPastaAtiva(null)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              !pastaAtiva
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Folder className="w-4 h-4" />
            Todas
          </button>
          {pastas.map((pasta) => (
            <button
              key={pasta}
              onClick={() => setPastaAtiva(pasta === pastaAtiva ? null : pasta)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pasta === pastaAtiva
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Folder className="w-4 h-4" />
              {pasta}
            </button>
          ))}
        </div>
      )}

      {/* Lista de Anotações */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : anotacoes.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
          <PenTool className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {busca || pastaAtiva || somenteFavoritos
              ? 'Nenhuma anotação encontrada'
              : 'Você ainda não tem anotações'
            }
          </h3>
          <p className="text-white/60 mb-6">
            {busca || pastaAtiva || somenteFavoritos
              ? 'Tente ajustar os filtros'
              : 'Comece criando sua primeira anotação'
            }
          </p>
          {!busca && !pastaAtiva && !somenteFavoritos && podecriar && (
            <Link
              href="/medicina/dashboard/anotacoes/nova"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Anotação
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {anotacoes.map((anotacao) => (
            <div
              key={anotacao.id}
              className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors group"
            >
              <Link
                href={`/medicina/dashboard/anotacoes/${anotacao.id}`}
                className="block p-5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-white line-clamp-1 flex-1">
                    {anotacao.titulo}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      toggleFavorito(anotacao.id, anotacao.favorito)
                    }}
                    className="p-1 -m-1"
                  >
                    <Star className={`w-5 h-5 ${
                      anotacao.favorito
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-white/20 group-hover:text-white/40'
                    }`} />
                  </button>
                </div>

                {/* Content Preview */}
                <p className="text-white/60 text-sm line-clamp-3 mb-4">
                  {truncateContent(anotacao.conteudo)}
                </p>

                {/* Tags */}
                {anotacao.tags && anotacao.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {anotacao.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {anotacao.tags.length > 3 && (
                      <span className="px-2 py-0.5 text-white/40 text-xs">
                        +{anotacao.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-white/40">
                  {anotacao.pasta && (
                    <span className="flex items-center gap-1">
                      <Folder className="w-3 h-3" />
                      {anotacao.pasta}
                    </span>
                  )}
                  {anotacao.teoria && (
                    <span className="flex items-center gap-1 text-emerald-400/60">
                      <BookOpen className="w-3 h-3" />
                      Teoria
                    </span>
                  )}
                  {anotacao.questao && (
                    <span className="flex items-center gap-1 text-teal-400/60">
                      <FileText className="w-3 h-3" />
                      Questão
                    </span>
                  )}
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />
                    {formatDate(anotacao.updated_at)}
                  </span>
                </div>
              </Link>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-white/5 flex justify-end relative">
                <button
                  onClick={() => setMenuAberto(menuAberto === anotacao.id ? null : anotacao.id)}
                  className="p-1 text-white/40 hover:text-white transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {menuAberto === anotacao.id && (
                  <div className="absolute bottom-full right-0 mb-2 bg-slate-800 rounded-lg shadow-xl border border-white/10 py-1 min-w-[140px] z-10">
                    <Link
                      href={`/medicina/dashboard/anotacoes/${anotacao.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-white/80 hover:bg-white/5 transition-colors"
                    >
                      <PenTool className="w-4 h-4" />
                      Editar
                    </Link>
                    <button
                      onClick={() => excluirAnotacao(anotacao.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Limite Warning */}
      {!podecriar && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <PenTool className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-amber-200 font-medium">Limite de anotações atingido</p>
            <p className="text-amber-200/70 text-sm">
              Seu plano permite até {limiteAnotacoes} anotações. Faça upgrade para criar mais.
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
