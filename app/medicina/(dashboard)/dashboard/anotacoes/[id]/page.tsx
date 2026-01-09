'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import {
  ArrowLeft,
  Save,
  X,
  Tag,
  Folder,
  Star,
  Plus,
  AlertCircle,
  Trash2,
  Clock
} from 'lucide-react'

interface Anotacao {
  id: string
  titulo: string
  conteudo: string
  pasta: string | null
  favorito: boolean
  tags: string[] | null
  teoria_id: string | null
  questao_id: string | null
  created_at: string
  updated_at: string
}

export default function EditarAnotacaoPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useMedAuth()

  const [loading, setLoading] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [pasta, setPasta] = useState('')
  const [novaPasta, setNovaPasta] = useState('')
  const [showNovaPasta, setShowNovaPasta] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [novaTag, setNovaTag] = useState('')
  const [favorito, setFavorito] = useState(false)
  const [updatedAt, setUpdatedAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const fetchAnotacao = useCallback(async () => {
    if (!params.id || !user) return

    try {
      setLoading(true)

      const response = await fetch(`/api/medicina/anotacoes?userId=${user.id}`)
      const data = await response.json()

      const anotacao = data.anotacoes?.find((a: Anotacao) => a.id === params.id)

      if (anotacao) {
        setTitulo(anotacao.titulo)
        setConteudo(anotacao.conteudo)
        setPasta(anotacao.pasta || '')
        setTags(anotacao.tags || [])
        setFavorito(anotacao.favorito)
        setUpdatedAt(anotacao.updated_at)
      } else {
        router.push('/medicina/dashboard/anotacoes')
      }

    } catch (error) {
      console.error('Erro ao buscar anotação:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id, user, router])

  useEffect(() => {
    fetchAnotacao()
  }, [fetchAnotacao])

  const handleAddTag = () => {
    if (novaTag.trim() && !tags.includes(novaTag.trim())) {
      setTags([...tags, novaTag.trim()])
      setNovaTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')

    if (!titulo.trim()) {
      setError('O título é obrigatório')
      return
    }

    if (!conteudo.trim()) {
      setError('O conteúdo é obrigatório')
      return
    }

    try {
      setSaving(true)

      const pastaFinal = showNovaPasta ? novaPasta.trim() : pasta

      const response = await fetch('/api/medicina/anotacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.id,
          userId: user.id,
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
          tags,
          pasta: pastaFinal || null,
          favorito
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar anotação')
      }

      router.push('/medicina/dashboard/anotacoes')

    } catch (err: any) {
      setError(err.message || 'Erro ao salvar anotação')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !confirm('Deseja realmente excluir esta anotação?')) return

    try {
      setDeleting(true)

      const response = await fetch(`/api/medicina/anotacoes?id=${params.id}&userId=${user.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir anotação')
      }

      router.push('/medicina/dashboard/anotacoes')

    } catch (err) {
      setError('Erro ao excluir anotação')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/medicina/dashboard/anotacoes"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFavorito(!favorito)}
            className={`p-2 rounded-lg transition-colors ${
              favorito
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Star className={`w-5 h-5 ${favorito ? 'fill-amber-400' : ''}`} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Last Updated */}
      {updatedAt && (
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <Clock className="w-4 h-4" />
          Última atualização: {formatDate(updatedAt)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <div>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título da anotação..."
            className="w-full bg-transparent text-2xl md:text-3xl font-bold text-white placeholder-white/30 focus:outline-none"
          />
        </div>

        {/* Pasta */}
        <div className="flex items-center gap-3">
          <Folder className="w-5 h-5 text-white/40" />
          {showNovaPasta ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={novaPasta}
                onChange={(e) => setNovaPasta(e.target.value)}
                placeholder="Nome da nova pasta..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowNovaPasta(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={pasta}
                onChange={(e) => setPasta(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" className="bg-slate-800">Sem pasta</option>
                <option value="Anatomia" className="bg-slate-800">Anatomia</option>
                <option value="Fisiologia" className="bg-slate-800">Fisiologia</option>
                <option value="Patologia" className="bg-slate-800">Patologia</option>
                <option value="Farmacologia" className="bg-slate-800">Farmacologia</option>
                <option value="Clínica" className="bg-slate-800">Clínica</option>
                <option value="Cirurgia" className="bg-slate-800">Cirurgia</option>
                <option value="Outros" className="bg-slate-800">Outros</option>
              </select>
              <button
                type="button"
                onClick={() => setShowNovaPasta(true)}
                className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-5 h-5 text-white/40" />
            <span className="text-white/60 text-sm">Tags</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={novaTag}
              onChange={(e) => setNovaTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Adicionar tag..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Escreva sua anotação aqui..."
            className="w-full min-h-[400px] bg-transparent p-6 text-white placeholder-white/30 focus:outline-none resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/medicina/dashboard/anotacoes"
            className="px-6 py-3 text-white/60 hover:text-white transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
