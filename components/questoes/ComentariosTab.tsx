'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Comentario {
  id: string
  conteudo: string
  parent_id: string | null
  likes_count: number
  dislikes_count: number
  created_at: string
  user_id: string
  profiles: {
    nome: string | null
    avatar_url: string | null
  } | null
  respostas: Comentario[]
  userLike: 'like' | 'dislike' | null
}

interface ComentariosTabProps {
  questaoId: string
}

export function ComentariosTab({ questaoId }: ComentariosTabProps) {
  const { user } = useAuth()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loading, setLoading] = useState(true)
  const [novoComentario, setNovoComentario] = useState('')
  const [respondendoA, setRespondendoA] = useState<string | null>(null)
  const [respostaComentario, setRespostaComentario] = useState('')

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const carregarComentarios = useCallback(async () => {
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (user) {
        const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
      }

      const res = await fetch(`/api/questoes/${questaoId}/comentarios`, { headers })
      const data = await res.json()
      setComentarios(data.comentarios || [])
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    } finally {
      setLoading(false)
    }
  }, [questaoId, user])

  useEffect(() => {
    carregarComentarios()
  }, [carregarComentarios])

  const enviarComentario = async (parentId: string | null = null) => {
    const conteudo = parentId ? respostaComentario : novoComentario
    if (!conteudo.trim() || !user) return

    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch(`/api/questoes/${questaoId}/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ conteudo, parent_id: parentId })
      })

      if (res.ok) {
        const data = await res.json()
        if (parentId) {
          setComentarios(prev => prev.map(c => {
            if (c.id === parentId) {
              return { ...c, respostas: [...c.respostas, data.comentario] }
            }
            return c
          }))
          setRespostaComentario('')
          setRespondendoA(null)
        } else {
          setComentarios(prev => [data.comentario, ...prev])
          setNovoComentario('')
        }
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
    }
  }

  const excluirComentario = async (comentarioId: string) => {
    if (!user) return

    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch(`/api/questoes/${questaoId}/comentarios?comentario_id=${comentarioId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (res.ok) {
        setComentarios(prev => prev.filter(c => c.id !== comentarioId).map(c => ({
          ...c,
          respostas: c.respostas.filter(r => r.id !== comentarioId)
        })))
      }
    } catch (error) {
      console.error('Erro ao excluir comentário:', error)
    }
  }

  const handleLike = async (comentarioId: string, tipo: 'like' | 'dislike') => {
    if (!user) return

    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch(`/api/questoes/${questaoId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ comentario_id: comentarioId, tipo })
      })

      if (res.ok) {
        const data = await res.json()
        const atualizarComentario = (c: Comentario): Comentario => {
          if (c.id === comentarioId) {
            return { ...c, likes_count: data.likes_count, dislikes_count: data.dislikes_count, userLike: data.userLike }
          }
          return { ...c, respostas: c.respostas.map(atualizarComentario) }
        }
        setComentarios(prev => prev.map(atualizarComentario))
      }
    } catch (error) {
      console.error('Erro ao processar like:', error)
    }
  }

  const renderComentario = (comentario: Comentario, isResposta = false) => (
    <div key={comentario.id} className={`${isResposta ? 'ml-8 mt-3' : ''}`}>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {comentario.profiles?.avatar_url ? (
            <img src={comentario.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <span className="text-primary text-sm font-bold">
              {comentario.profiles?.nome?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {comentario.profiles?.nome || 'Usuário'}
            </span>
            <span className="text-xs text-gray-400">{formatarData(comentario.created_at)}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 break-words">{comentario.conteudo}</p>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => handleLike(comentario.id, 'like')}
              className={`flex items-center gap-1 text-xs ${
                comentario.userLike === 'like' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'
              }`}
            >
              <span className="material-symbols-outlined text-base">thumb_up</span>
              {comentario.likes_count > 0 && comentario.likes_count}
            </button>
            <button
              onClick={() => handleLike(comentario.id, 'dislike')}
              className={`flex items-center gap-1 text-xs ${
                comentario.userLike === 'dislike' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <span className="material-symbols-outlined text-base">thumb_down</span>
              {comentario.dislikes_count > 0 && comentario.dislikes_count}
            </button>
            {!isResposta && user && (
              <button
                onClick={() => setRespondendoA(respondendoA === comentario.id ? null : comentario.id)}
                className="text-xs text-gray-400 hover:text-primary"
              >
                Responder
              </button>
            )}
            {user && comentario.user_id === user.id && (
              <button onClick={() => excluirComentario(comentario.id)} className="text-xs text-gray-400 hover:text-red-500">
                Excluir
              </button>
            )}
          </div>

          {respondendoA === comentario.id && user && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={respostaComentario}
                onChange={(e) => setRespostaComentario(e.target.value)}
                placeholder="Escreva uma resposta..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-[#283039] rounded-lg bg-white dark:bg-[#161f28] text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                onKeyDown={(e) => e.key === 'Enter' && enviarComentario(comentario.id)}
              />
              <button
                onClick={() => enviarComentario(comentario.id)}
                className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-blue-600"
              >
                Enviar
              </button>
            </div>
          )}

          {comentario.respostas.map(r => renderComentario(r, true))}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {user ? (
        <div className="flex gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary text-sm font-bold">{user.email?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1">
            <textarea
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Escreva um comentário..."
              className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-[#283039] rounded-xl bg-white dark:bg-[#161f28] text-gray-900 dark:text-white focus:outline-none focus:border-primary resize-none"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => enviarComentario()}
                disabled={!novoComentario.trim()}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Comentar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 mb-4 bg-gray-50 dark:bg-[#161f28] rounded-xl">
          <p className="text-gray-500 dark:text-gray-400">Faça login para comentar</p>
        </div>
      )}

      {comentarios.length === 0 ? (
        <div className="text-center py-6">
          <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">forum</span>
          <p className="text-gray-500 dark:text-gray-400">Nenhum comentário ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-4">{comentarios.map(c => renderComentario(c))}</div>
      )}
    </div>
  )
}
