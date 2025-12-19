'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

// Componente de Editor de Texto Rico
function RichTextEditor({
  value,
  onChange,
  placeholder,
  rows = 3
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  rows?: number
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<string[]>([''])
  const [historyIndex, setHistoryIndex] = useState(0)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const saveToHistory = () => {
    const content = editorRef.current?.innerHTML || ''
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(content)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleInput = () => {
    const content = editorRef.current?.innerHTML || ''
    onChange(content)
  }

  const execCommand = (command: string, value?: string) => {
    saveToHistory()
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex]
        onChange(history[newIndex])
      }
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex]
        onChange(history[newIndex])
      }
    }
  }

  const handleHighlight = () => {
    saveToHistory()
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      if (selectedText) {
        const span = document.createElement('mark')
        span.style.backgroundColor = '#fef08a'
        span.style.padding = '0 2px'
        span.style.borderRadius = '2px'
        range.surroundContents(span)
        handleInput()
      }
    }
    editorRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault()
          if (e.shiftKey) handleRedo()
          else handleUndo()
          break
        case 'y':
          e.preventDefault()
          handleRedo()
          break
        case 'b':
          e.preventDefault()
          execCommand('bold')
          break
        case 'i':
          e.preventDefault()
          execCommand('italic')
          break
        case 'u':
          e.preventDefault()
          execCommand('underline')
          break
      }
    }
  }

  return (
    <div className="border border-gray-200 dark:border-[#283039] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 dark:bg-[#161f28] border-b border-gray-200 dark:border-[#283039]">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#283039] transition-colors"
          title="Negrito (Ctrl+B)"
        >
          <span className="material-symbols-outlined text-lg text-gray-600 dark:text-gray-400">format_bold</span>
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#283039] transition-colors"
          title="Itálico (Ctrl+I)"
        >
          <span className="material-symbols-outlined text-lg text-gray-600 dark:text-gray-400">format_italic</span>
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#283039] transition-colors"
          title="Sublinhado (Ctrl+U)"
        >
          <span className="material-symbols-outlined text-lg text-gray-600 dark:text-gray-400">format_underlined</span>
        </button>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        <button
          type="button"
          onClick={handleHighlight}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#283039] transition-colors"
          title="Marca-texto"
        >
          <span className="material-symbols-outlined text-lg text-yellow-500">ink_highlighter</span>
        </button>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        <button
          type="button"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#283039] transition-colors disabled:opacity-30"
          title="Desfazer (Ctrl+Z)"
        >
          <span className="material-symbols-outlined text-lg text-gray-600 dark:text-gray-400">undo</span>
        </button>
        <button
          type="button"
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#283039] transition-colors disabled:opacity-30"
          title="Refazer (Ctrl+Y)"
        >
          <span className="material-symbols-outlined text-lg text-gray-600 dark:text-gray-400">redo</span>
        </button>
      </div>
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={saveToHistory}
        className="px-4 py-3 text-sm bg-white dark:bg-[#1C252E] text-gray-900 dark:text-white focus:outline-none min-h-[80px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        style={{ minHeight: `${rows * 24}px` }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  )
}

export function ComentariosTab({ questaoId }: ComentariosTabProps) {
  const { user } = useAuth()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loading, setLoading] = useState(true)
  const [novoComentario, setNovoComentario] = useState('')
  const [respondendoA, setRespondendoA] = useState<string | null>(null)
  const [respostaComentario, setRespostaComentario] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [conteudoEdicao, setConteudoEdicao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

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
    // Limpar tags vazias e verificar se tem conteúdo
    const conteudoLimpo = conteudo.replace(/<[^>]*>/g, '').trim()
    if (!conteudoLimpo || !user) return

    setEnviando(true)
    setErro(null)

    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      if (!session?.access_token) {
        setErro('Sessão expirada. Faça login novamente.')
        setEnviando(false)
        return
      }

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
      } else {
        const errorData = await res.json()
        setErro(errorData.error || 'Erro ao enviar comentário')
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
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

  const iniciarEdicao = (comentario: Comentario) => {
    setEditandoId(comentario.id)
    setConteudoEdicao(comentario.conteudo)
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setConteudoEdicao('')
  }

  const salvarEdicao = async (comentarioId: string) => {
    const conteudoLimpo = conteudoEdicao.replace(/<[^>]*>/g, '').trim()
    if (!conteudoLimpo || !user) return

    setEnviando(true)
    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch(`/api/questoes/${questaoId}/comentarios`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ comentario_id: comentarioId, conteudo: conteudoEdicao })
      })

      if (res.ok) {
        const atualizarComentario = (c: Comentario): Comentario => {
          if (c.id === comentarioId) {
            return { ...c, conteudo: conteudoEdicao }
          }
          return { ...c, respostas: c.respostas.map(atualizarComentario) }
        }
        setComentarios(prev => prev.map(atualizarComentario))
        cancelarEdicao()
      }
    } catch (error) {
      console.error('Erro ao editar comentário:', error)
    } finally {
      setEnviando(false)
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

  const renderComentario = (comentario: Comentario, isResposta = false) => {
    const isProprioComentario = user && comentario.user_id === user.id
    const estaEditando = editandoId === comentario.id

    return (
      <div key={comentario.id} className={`${isResposta ? 'ml-8 mt-3' : ''}`}>
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {comentario.profiles?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
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
              {isProprioComentario && (
                <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">Você</span>
              )}
            </div>

            {/* Modo de edição ou visualização */}
            {estaEditando ? (
              <div className="mb-2">
                <RichTextEditor
                  value={conteudoEdicao}
                  onChange={setConteudoEdicao}
                  placeholder="Edite seu comentário..."
                  rows={2}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={cancelarEdicao}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => salvarEdicao(comentario.id)}
                    disabled={enviando}
                    className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {enviando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="text-sm text-gray-700 dark:text-gray-300 mb-2 break-words prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: comentario.conteudo }}
              />
            )}

            <div className="flex items-center gap-4 flex-wrap">
              {/* Like/Dislike - apenas para comentários de outros usuários */}
              {!isProprioComentario && (
                <>
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
                </>
              )}
              {/* Mostrar contadores para próprio comentário (sem botão) */}
              {isProprioComentario && (comentario.likes_count > 0 || comentario.dislikes_count > 0) && (
                <>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="material-symbols-outlined text-base">thumb_up</span>
                    {comentario.likes_count}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="material-symbols-outlined text-base">thumb_down</span>
                    {comentario.dislikes_count}
                  </span>
                </>
              )}
              {!isResposta && user && (
                <button
                  onClick={() => setRespondendoA(respondendoA === comentario.id ? null : comentario.id)}
                  className="text-xs text-gray-400 hover:text-primary"
                >
                  Responder
                </button>
              )}
              {isProprioComentario && !estaEditando && (
                <>
                  <button
                    onClick={() => iniciarEdicao(comentario)}
                    className="text-xs text-gray-400 hover:text-primary"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => excluirComentario(comentario.id)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Excluir
                  </button>
                </>
              )}
            </div>

            {respondendoA === comentario.id && user && (
              <div className="mt-3">
                <RichTextEditor
                  value={respostaComentario}
                  onChange={setRespostaComentario}
                  placeholder="Escreva uma resposta..."
                  rows={2}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setRespondendoA(null)}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => enviarComentario(comentario.id)}
                    disabled={enviando}
                    className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {enviando ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            )}

            {comentario.respostas.map(r => renderComentario(r, true))}
          </div>
        </div>
      </div>
    )
  }

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
            <RichTextEditor
              value={novoComentario}
              onChange={setNovoComentario}
              placeholder="Escreva um comentário..."
              rows={3}
            />
            {erro && (
              <p className="text-red-500 text-sm mt-2">{erro}</p>
            )}
            <div className="flex justify-end mt-2">
              <button
                onClick={() => enviarComentario()}
                disabled={!novoComentario.replace(/<[^>]*>/g, '').trim() || enviando}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Comentar'}
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
