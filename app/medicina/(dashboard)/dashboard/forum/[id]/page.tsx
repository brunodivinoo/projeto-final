'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import {
  ArrowLeft,
  MessageSquare,
  Eye,
  Clock,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Crown,
  Send,
  MoreVertical,
  Trash2,
  Flag,
  Share2,
  BookOpen,
  FileText
} from 'lucide-react'

interface Autor {
  id: string
  nome: string
  plano: string
  avatar_url: string | null
}

interface Resposta {
  id: string
  conteudo: string
  votos_positivos: number
  votos_negativos: number
  melhor_resposta: boolean
  created_at: string
  autor: Autor | null
}

interface Topico {
  id: string
  titulo: string
  conteudo: string
  categoria: string
  visualizacoes: number
  total_respostas: number
  resolvido: boolean
  created_at: string
  autor: Autor | null
  disciplina: { id: string, nome: string } | null
  questao: { id: string, enunciado: string } | null
  teoria: { id: string, titulo: string } | null
}

const categoriasCores: Record<string, string> = {
  discussao: 'bg-blue-500/20 text-blue-400',
  duvida: 'bg-amber-500/20 text-amber-400',
  questao: 'bg-purple-500/20 text-purple-400',
  dica: 'bg-emerald-500/20 text-emerald-400',
  recurso: 'bg-red-500/20 text-red-400',
}

export default function TopicoPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useMedAuth()

  const [topico, setTopico] = useState<Topico | null>(null)
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [loading, setLoading] = useState(true)
  const [novaResposta, setNovaResposta] = useState('')
  const [enviando, setEnviando] = useState(false)

  const fetchTopico = useCallback(async () => {
    if (!params.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/medicina/forum/${params.id}`)
      const data = await response.json()

      if (data.topico) {
        setTopico(data.topico)
      }
      if (data.respostas) {
        setRespostas(data.respostas)
      }

    } catch (error) {
      console.error('Erro ao buscar tópico:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchTopico()
  }, [fetchTopico])

  const enviarResposta = async () => {
    if (!novaResposta.trim() || !user || !topico || enviando) return

    try {
      setEnviando(true)

      const response = await fetch(`/api/medicina/forum/${topico.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          conteudo: novaResposta.trim()
        })
      })

      const data = await response.json()

      if (response.ok && data.resposta) {
        setRespostas(prev => [...prev, data.resposta])
        setNovaResposta('')
        setTopico(prev => prev ? { ...prev, total_respostas: prev.total_respostas + 1 } : null)
      }

    } catch (error) {
      console.error('Erro ao enviar resposta:', error)
    } finally {
      setEnviando(false)
    }
  }

  const votar = async (respostaId: string, voto: 'positivo' | 'negativo') => {
    if (!user || !topico) return

    try {
      await fetch(`/api/medicina/forum/${topico.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          respostaId,
          acao: 'votar',
          voto
        })
      })

      // Atualizar votos localmente
      setRespostas(prev => prev.map(r => {
        if (r.id === respostaId) {
          return {
            ...r,
            votos_positivos: voto === 'positivo' ? r.votos_positivos + 1 : r.votos_positivos,
            votos_negativos: voto === 'negativo' ? r.votos_negativos + 1 : r.votos_negativos
          }
        }
        return r
      }))

    } catch (error) {
      console.error('Erro ao votar:', error)
    }
  }

  const marcarMelhorResposta = async (respostaId: string) => {
    if (!user || !topico || topico.autor?.id !== user.id) return

    try {
      await fetch(`/api/medicina/forum/${topico.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          respostaId,
          acao: 'melhor_resposta'
        })
      })

      setRespostas(prev => prev.map(r => ({
        ...r,
        melhor_resposta: r.id === respostaId
      })))
      setTopico(prev => prev ? { ...prev, resolvido: true } : null)

    } catch (error) {
      console.error('Erro ao marcar melhor resposta:', error)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
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

  if (!topico) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-white mb-2">Tópico não encontrado</h2>
        <Link href="/medicina/dashboard/forum" className="text-emerald-400 hover:underline">
          Voltar para o fórum
        </Link>
      </div>
    )
  }

  const categoriaLabel: Record<string, string> = {
    discussao: 'Discussão',
    duvida: 'Dúvida',
    questao: 'Questão',
    dica: 'Dica',
    recurso: 'Recurso'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/medicina/dashboard/forum"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="flex items-center gap-2">
          <button className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Flag className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tópico Principal */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        {/* Meta */}
        <div className="px-6 py-3 border-b border-white/10 flex flex-wrap items-center gap-2">
          {topico.resolvido && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Resolvido
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs ${categoriasCores[topico.categoria] || categoriasCores.discussao}`}>
            {categoriaLabel[topico.categoria] || topico.categoria}
          </span>
          {topico.disciplina && (
            <span className="text-white/40 text-xs">{topico.disciplina.nome}</span>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-4">{topico.titulo}</h1>

          <p className="text-white/80 whitespace-pre-wrap mb-6">{topico.conteudo}</p>

          {/* Linked content */}
          {topico.questao && (
            <Link
              href={`/medicina/dashboard/questoes/${topico.questao.id}`}
              className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors mb-4"
            >
              <FileText className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-purple-400 text-sm font-medium">Questão Relacionada</div>
                <div className="text-white/60 text-sm line-clamp-1">{topico.questao.enunciado}</div>
              </div>
            </Link>
          )}

          {topico.teoria && (
            <Link
              href={`/medicina/dashboard/biblioteca/${topico.teoria.id}`}
              className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors mb-4"
            >
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-emerald-400 text-sm font-medium">Teoria Relacionada</div>
                <div className="text-white/60 text-sm">{topico.teoria.titulo}</div>
              </div>
            </Link>
          )}

          {/* Author */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {topico.autor?.nome?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 text-white font-medium">
                  {topico.autor?.nome || 'Anônimo'}
                  {topico.autor?.plano === 'residencia' && (
                    <Crown className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="text-white/40 text-xs">
                  {formatDate(topico.created_at)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-white/40 text-sm">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {topico.visualizacoes}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {topico.total_respostas}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Respostas */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          {respostas.length} {respostas.length === 1 ? 'Resposta' : 'Respostas'}
        </h2>

        {respostas.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
            <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">Seja o primeiro a responder!</p>
          </div>
        ) : (
          respostas.map((resposta) => (
            <div
              key={resposta.id}
              className={`bg-white/5 rounded-xl border overflow-hidden ${
                resposta.melhor_resposta
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/10'
              }`}
            >
              {resposta.melhor_resposta && (
                <div className="px-4 py-2 bg-emerald-500/20 border-b border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Melhor Resposta
                </div>
              )}

              <div className="p-5">
                <p className="text-white/80 whitespace-pre-wrap mb-4">{resposta.conteudo}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {resposta.autor?.nome?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        {resposta.autor?.nome || 'Anônimo'}
                        {resposta.autor?.plano === 'residencia' && (
                          <Crown className="w-3 h-3 text-amber-400" />
                        )}
                      </div>
                      <div className="text-white/40 text-xs">{formatDate(resposta.created_at)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Votos */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => votar(resposta.id, 'positivo')}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-500/10 transition-colors text-white/60 hover:text-emerald-400"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">{resposta.votos_positivos}</span>
                      </button>
                      <button
                        onClick={() => votar(resposta.id, 'negativo')}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition-colors text-white/60 hover:text-red-400"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span className="text-sm">{resposta.votos_negativos}</span>
                      </button>
                    </div>

                    {/* Marcar como melhor */}
                    {user && topico.autor?.id === user.id && !resposta.melhor_resposta && (
                      <button
                        onClick={() => marcarMelhorResposta(resposta.id)}
                        className="text-xs text-emerald-400 hover:underline"
                      >
                        Marcar como melhor
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Nova Resposta */}
      {user && (
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <h3 className="text-white font-medium mb-3">Sua Resposta</h3>
          <textarea
            value={novaResposta}
            onChange={(e) => setNovaResposta(e.target.value)}
            placeholder="Escreva sua resposta..."
            className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-4"
          />
          <div className="flex justify-end">
            <button
              onClick={enviarResposta}
              disabled={!novaResposta.trim() || enviando}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Resposta
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
