'use client'
import { useState, useRef, useEffect } from 'react'
import { useChatIA, Conversa } from '@/hooks/useChatIA'

export function ChatIA() {
  const {
    conversas,
    conversaAtual,
    mensagens,
    loading,
    enviando,
    error,
    enviarMensagem,
    selecionarConversa,
    novaConversa,
    deletarConversa
  } = useChatIA()

  const [input, setInput] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`
    }
  }, [input])

  const handleEnviar = async () => {
    if (!input.trim() || enviando) return

    const msg = input
    setInput('')
    await enviarMensagem(msg)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  const formatarData = (data: string) => {
    const d = new Date(data)
    const agora = new Date()
    const diff = agora.getTime() - d.getTime()
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (dias === 0) return 'Hoje'
    if (dias === 1) return 'Ontem'
    if (dias < 7) return `${dias} dias atrás`
    return d.toLocaleDateString('pt-BR')
  }

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] overflow-hidden">
      {/* Sidebar - Conversas */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} border-r border-gray-200 dark:border-[#283039] flex flex-col transition-all overflow-hidden`}>
        <div className="p-3 border-b border-gray-200 dark:border-[#283039]">
          <button
            onClick={novaConversa}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nova Conversa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversas.length === 0 ? (
            <div className="p-4 text-center text-sm text-[#9dabb9]">
              Nenhuma conversa ainda
            </div>
          ) : (
            <div className="p-2 flex flex-col gap-1">
              {conversas.map((conv: Conversa) => (
                <button
                  key={conv.id}
                  onClick={() => selecionarConversa(conv.id)}
                  className={`group flex items-start gap-2 p-3 rounded-lg text-left transition-colors ${
                    conversaAtual?.id === conv.id
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'hover:bg-gray-100 dark:hover:bg-[#283039] text-gray-900 dark:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg mt-0.5">chat_bubble</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.titulo}</p>
                    <p className="text-xs text-[#9dabb9]">{formatarData(conv.updated_at)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Deletar esta conversa?')) {
                        deletarConversa(conv.id)
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded text-[#9dabb9] hover:text-red-500 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-[#283039]">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#283039] rounded-lg text-[#9dabb9] hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">{showSidebar ? 'menu_open' : 'menu'}</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-500">smart_toy</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {conversaAtual?.titulo || 'Nova Conversa'}
              </h3>
              <p className="text-xs text-[#9dabb9]">Assistente de Estudos</p>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4">
          {mensagens.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-emerald-500">chat_bubble</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Como posso ajudar?
              </h3>
              <p className="text-sm text-[#9dabb9] max-w-sm mb-6">
                Tire dúvidas sobre qualquer assunto de concursos. Posso explicar conceitos,
                resolver questões e dar dicas de estudo.
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-md">
                {[
                  'Explique o princípio da legalidade',
                  'Quais são os poderes da administração?',
                  'O que é competência tributária?',
                  'Diferença entre ato e fato jurídico'
                ].map((sugestao, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(sugestao)}
                    className="p-3 text-left text-sm bg-gray-50 dark:bg-[#141A21] rounded-lg border border-gray-200 dark:border-[#283039] hover:border-emerald-500/50 transition-colors"
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {mensagens.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-[#137fec]/20'
                      : 'bg-emerald-500/20'
                  }`}>
                    <span className={`material-symbols-outlined text-lg ${
                      msg.role === 'user' ? 'text-[#137fec]' : 'text-emerald-500'
                    }`}>
                      {msg.role === 'user' ? 'person' : 'smart_toy'}
                    </span>
                  </div>
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-[#137fec] text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-[#283039] text-gray-900 dark:text-white rounded-bl-md'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <p className="text-xs text-[#9dabb9] mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {enviando && (
                <div className="flex gap-3">
                  <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg text-emerald-500">smart_toy</span>
                  </div>
                  <div className="p-3 rounded-2xl rounded-bl-md bg-gray-100 dark:bg-[#283039]">
                    <div className="flex gap-1">
                      <span className="size-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="size-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="size-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Erro */}
        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-[#283039]">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua dúvida..."
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white placeholder:text-[#9dabb9] focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                disabled={enviando}
              />
            </div>
            <button
              onClick={handleEnviar}
              disabled={!input.trim() || enviando}
              className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          <p className="text-xs text-[#9dabb9] mt-2 text-center">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  )
}
