'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Send,
  AlertCircle
} from 'lucide-react'

interface Disciplina {
  id: string
  nome: string
}

const categorias = [
  { id: 'discussao', label: 'Discussão', descricao: 'Debate geral sobre um tema' },
  { id: 'duvida', label: 'Dúvida', descricao: 'Preciso de ajuda com algo' },
  { id: 'questao', label: 'Questão', descricao: 'Discussão sobre uma questão de prova' },
  { id: 'dica', label: 'Dica', descricao: 'Compartilhar uma dica de estudo' },
  { id: 'recurso', label: 'Recurso', descricao: 'Compartilhar material ou recurso' },
]

export default function NovoTopicoPage() {
  const router = useRouter()
  const { user } = useMedAuth()

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [categoria, setCategoria] = useState('discussao')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')

    if (!titulo.trim()) {
      setError('Digite um título para o tópico')
      return
    }

    if (!conteudo.trim()) {
      setError('Digite o conteúdo do tópico')
      return
    }

    if (conteudo.trim().length < 20) {
      setError('O conteúdo deve ter pelo menos 20 caracteres')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/medicina/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
          categoria,
          disciplinaId: disciplinaId || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar tópico')
      }

      router.push(`/medicina/dashboard/forum/${data.topico.id}`)

    } catch (err: any) {
      setError(err.message || 'Erro ao criar tópico')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/medicina/dashboard/forum"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Novo Tópico
        </h1>
        <p className="text-emerald-200/70 mt-1">
          Compartilhe sua dúvida ou inicie uma discussão
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Categoria */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <label className="block text-white font-medium mb-4">Categoria</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoria(cat.id)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  categoria === cat.id
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-white font-medium">{cat.label}</div>
                <div className="text-white/40 text-xs mt-1">{cat.descricao}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Disciplina */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <label className="block text-white font-medium mb-3">
            Disciplina <span className="text-white/40 font-normal">(opcional)</span>
          </label>
          <select
            value={disciplinaId}
            onChange={(e) => setDisciplinaId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="" className="bg-slate-800">Selecione uma disciplina</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id} className="bg-slate-800">{d.nome}</option>
            ))}
          </select>
        </div>

        {/* Título */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <label className="block text-white font-medium mb-3">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Escreva um título claro e objetivo..."
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            maxLength={200}
          />
          <div className="text-white/40 text-xs mt-2 text-right">
            {titulo.length}/200
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <label className="block text-white font-medium mb-3">Conteúdo</label>
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Descreva sua dúvida ou discussão em detalhes...

Dicas:
• Seja específico e claro
• Inclua contexto relevante
• Se for sobre uma questão, cite o enunciado"
            className="w-full min-h-[200px] bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <div className="text-white/40 text-xs mt-2 text-right">
            {conteudo.length} caracteres (mínimo 20)
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/medicina/dashboard/forum"
            className="px-6 py-3 text-white/60 hover:text-white transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                Publicando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Publicar Tópico
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
