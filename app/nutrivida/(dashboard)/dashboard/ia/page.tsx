'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import {
  Bot,
  Send,
  Sparkles,
  ChefHat,
  Droplets,
  Dumbbell,
  Apple,
  User,
  RefreshCw,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  X,
  Heart,
  Salad,
  Moon,
  Pill,
  Scale,
  Menu
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Mensagem {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  fromCache?: boolean
}

interface Conversa {
  id: string
  titulo: string
  created_at: string
  updated_at: string
}

// Sugestoes por categoria
const SUGESTOES = [
  { icon: ChefHat, texto: 'Me de uma receita rapida e saudavel', categoria: 'receita', cor: 'from-orange-400 to-red-400' },
  { icon: Droplets, texto: 'Como posso beber mais agua no dia?', categoria: 'hidratacao', cor: 'from-blue-400 to-cyan-400' },
  { icon: Dumbbell, texto: 'Qual o melhor exercicio para emagrecer?', categoria: 'treino', cor: 'from-green-400 to-emerald-400' },
  { icon: Apple, texto: 'Qual fruta e mais nutritiva?', categoria: 'nutricao', cor: 'from-pink-400 to-rose-400' },
  { icon: Scale, texto: 'Dicas para perder peso de forma saudavel', categoria: 'emagrecimento', cor: 'from-purple-400 to-violet-400' },
  { icon: Moon, texto: 'Alimentos que ajudam a dormir melhor', categoria: 'sono', cor: 'from-indigo-400 to-blue-400' },
]

// Modos de chat
const MODOS = [
  { id: 'normal', nome: 'Chat Livre', icon: '💬', descricao: 'Converse sobre qualquer tema de saude', cor: 'bg-pink-500/20 text-pink-400' },
  { id: 'receitas', nome: 'Receitas', icon: '👩‍🍳', descricao: 'Foco em receitas e culinaria saudavel', cor: 'bg-orange-500/20 text-orange-400' },
  { id: 'treino', nome: 'Treinos', icon: '💪', descricao: 'Dicas de exercicios e atividade fisica', cor: 'bg-green-500/20 text-green-400' },
  { id: 'nutricao', nome: 'Nutricao', icon: '🥗', descricao: 'Orientacoes nutricionais personalizadas', cor: 'bg-purple-500/20 text-purple-400' },
]

export default function NutriIAPage() {
  const { user, profile } = useNutriAuth()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [conversaId, setConversaId] = useState<string | null>(null)
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [modo, setModo] = useState('normal')
  const [copiado, setCopiado] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Scroll para o final
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [mensagens, scrollToBottom])

  // Buscar conversas do usuario
  const fetchConversas = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/nutrivida/ia/conversas?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setConversas(data.conversas || [])
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error)
    }
  }, [user])

  useEffect(() => {
    fetchConversas()
  }, [fetchConversas])

  // Carregar conversa especifica
  const carregarConversa = async (id: string) => {
    if (!user) return
    try {
      const response = await fetch(`/api/nutrivida/ia/conversas?userId=${user.id}&conversaId=${id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.mensagens) {
          setMensagens(data.mensagens.map((m: { role: string; content: string; timestamp: string; fromCache?: boolean }) => ({
            id: Math.random().toString(36).substr(2, 9),
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp,
            fromCache: m.fromCache
          })))
          setConversaId(id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error)
    }
    setShowSidebar(false)
  }

  // Deletar conversa
  const deletarConversa = async (id: string) => {
    if (!user) return
    try {
      await fetch(`/api/nutrivida/ia/conversas?userId=${user.id}&conversaId=${id}`, {
        method: 'DELETE'
      })
      fetchConversas()
      if (conversaId === id) {
        novaConversa()
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error)
    }
  }

  // Nova conversa
  const novaConversa = () => {
    setMensagens([])
    setConversaId(null)
    setShowSidebar(false)
  }

  // Copiar resposta
  const copiarResposta = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto)
    setCopiado(id)
    setTimeout(() => setCopiado(null), 2000)
  }

  // Enviar mensagem
  const enviarMensagem = async (texto?: string) => {
    const mensagem = texto || input.trim()
    if (!mensagem || loading) return

    setInput('')
    setLoading(true)

    const novoId = Date.now().toString()
    const novaMensagem: Mensagem = {
      id: novoId,
      role: 'user',
      content: mensagem,
      timestamp: new Date().toISOString()
    }
    setMensagens(prev => [...prev, novaMensagem])

    // Criar mensagem de resposta vazia para streaming
    const respostaId = (Date.now() + 1).toString()
    setMensagens(prev => [...prev, {
      id: respostaId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }])
    setStreaming(true)

    try {
      const response = await fetch('/api/nutrivida/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem,
          historico: mensagens.map(m => ({ role: m.role, content: m.content })),
          userId: user?.id,
          conversaId,
          modo
        })
      })

      const data = await response.json()

      if (data.resposta) {
        // Simular streaming para melhor UX
        const palavras = data.resposta.split(' ')
        let textoAtual = ''

        for (let i = 0; i < palavras.length; i++) {
          textoAtual += (i > 0 ? ' ' : '') + palavras[i]
          const textoFinal = textoAtual

          setMensagens(prev => prev.map(m =>
            m.id === respostaId
              ? { ...m, content: textoFinal, fromCache: data.fromCache }
              : m
          ))

          // Delay pequeno para efeito de streaming
          if (i < palavras.length - 1 && i % 3 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        }

        if (data.conversa_id) {
          setConversaId(data.conversa_id)
          fetchConversas()
        }
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
      setMensagens(prev => prev.map(m =>
        m.id === respostaId
          ? { ...m, content: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.' }
          : m
      ))
    } finally {
      setLoading(false)
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensagem()
    }
  }

  // Renderizar markdown com estilo
  const renderMensagem = (content: string) => {
    return (
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-lg font-bold text-gray-800 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold text-gray-800 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold text-gray-700 mb-1">{children}</h3>,
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-gray-700">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-pink-600">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
          code: ({ children }) => <code className="bg-pink-50 text-pink-600 px-1 py-0.5 rounded text-sm">{children}</code>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-pink-300 pl-3 my-2 italic text-gray-600">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    )
  }

  const modoAtual = MODOS.find(m => m.id === modo) || MODOS[0]

  return (
    <div className="flex h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      {/* Sidebar Mobile - Drawer */}
      {isMobile && (
        <>
          {showSidebar && (
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowSidebar(false)}
            />
          )}
          <div className={`
            fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-white z-50
            transform transition-transform duration-300 ease-out shadow-2xl
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="h-full flex flex-col p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Conversas</h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-pink-50 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <button
                onClick={() => { novaConversa(); setShowSidebar(false) }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-colors mb-4"
              >
                <Plus className="w-5 h-5" />
                Nova Conversa
              </button>

              <div className="flex-1 overflow-y-auto space-y-2">
                {conversas.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">
                    Nenhuma conversa salva
                  </p>
                ) : (
                  conversas.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group p-3 rounded-xl cursor-pointer transition-colors ${
                        conversaId === conv.id ? 'bg-pink-100' : 'hover:bg-pink-50'
                      }`}
                      onClick={() => carregarConversa(conv.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 text-sm truncate font-medium">{conv.titulo}</p>
                          <span className="text-gray-400 text-xs">
                            {new Date(conv.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deletarConversa(conv.id)
                          }}
                          className="p-1 hover:bg-pink-100 rounded transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sidebar Desktop */}
      {!isMobile && (
        <div className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-pink-100`}>
          <div className="w-72 h-full bg-pink-50/50 p-4 flex flex-col">
            <button
              onClick={novaConversa}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-colors mb-4"
            >
              <Plus className="w-5 h-5" />
              Nova Conversa
            </button>

            <div className="flex-1 overflow-y-auto space-y-2">
              {conversas.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">
                  Nenhuma conversa salva
                </p>
              ) : (
                conversas.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group p-3 rounded-xl cursor-pointer transition-colors ${
                      conversaId === conv.id ? 'bg-pink-100' : 'hover:bg-pink-100/50'
                    }`}
                    onClick={() => carregarConversa(conv.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 text-sm truncate font-medium">{conv.titulo}</p>
                        <span className="text-gray-400 text-xs">
                          {new Date(conv.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deletarConversa(conv.id)
                        }}
                        className="p-1 hover:bg-pink-200 rounded transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Principal */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3 border-b border-pink-100 bg-white">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 hover:bg-pink-50 rounded-lg transition-colors"
            >
              {isMobile ? (
                <Menu className="w-5 h-5 text-gray-500" />
              ) : (
                <MessageSquare className="w-5 h-5 text-gray-500" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm md:text-base font-bold text-gray-800">Nutri IA</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Sua nutricionista virtual</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor de Modo */}
            <select
              value={modo}
              onChange={(e) => setModo(e.target.value)}
              className={`text-xs md:text-sm px-2 md:px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-pink-300 ${modoAtual.cor}`}
            >
              {MODOS.map(m => (
                <option key={m.id} value={m.id}>{m.icon} {m.nome}</option>
              ))}
            </select>

            <button
              onClick={novaConversa}
              className="p-2 hover:bg-pink-50 rounded-lg transition-colors"
              title="Nova conversa"
            >
              <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Area de Mensagens */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gradient-to-b from-pink-50/30 to-white"
        >
          {mensagens.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-pink-500" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                Ola{profile?.nome ? `, ${profile.nome.split(' ')[0]}` : ''}!
              </h2>
              <p className="text-gray-500 mb-6 max-w-md text-sm md:text-base">
                Sou sua nutricionista virtual. Posso te ajudar com receitas, dicas de alimentacao, exercicios e muito mais!
              </p>

              {/* Modos de Chat */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-2xl mb-6">
                {MODOS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModo(m.id)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      modo === m.id
                        ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg scale-105'
                        : 'bg-white border border-pink-100 hover:border-pink-300 hover:shadow'
                    }`}
                  >
                    <span className="text-xl md:text-2xl block mb-1">{m.icon}</span>
                    <span className={`text-xs font-medium ${modo === m.id ? 'text-white' : 'text-gray-700'}`}>
                      {m.nome}
                    </span>
                  </button>
                ))}
              </div>

              {/* Sugestoes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-3xl">
                {SUGESTOES.map((sugestao, i) => (
                  <button
                    key={i}
                    onClick={() => enviarMensagem(sugestao.texto)}
                    className="p-3 bg-white border border-pink-100 rounded-xl text-left hover:border-pink-300 hover:shadow-md transition-all group"
                  >
                    <div className={`w-8 h-8 bg-gradient-to-br ${sugestao.cor} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                      <sugestao.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs md:text-sm text-gray-700">{sugestao.texto}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {mensagens.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 md:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white'
                      : 'bg-gradient-to-br from-pink-500 to-purple-500 text-white'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    )}
                  </div>

                  <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? '' : 'flex-1'}`}>
                    <div className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-tr-sm'
                        : 'bg-white border border-pink-100 text-gray-800 rounded-tl-sm shadow-sm'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="text-sm md:text-base prose-sm">
                          {msg.content ? (
                            renderMensagem(msg.content)
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm">Pensando...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acoes da mensagem */}
                    {msg.role === 'assistant' && msg.content && (
                      <div className="flex items-center gap-2 mt-1 ml-1">
                        <button
                          onClick={() => copiarResposta(msg.id, msg.content)}
                          className="text-gray-400 hover:text-pink-500 text-xs flex items-center gap-1 transition-colors"
                        >
                          {copiado === msg.id ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              <span className="text-green-500">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                        {msg.fromCache && (
                          <span className="text-gray-300 text-xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Cache
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && !streaming && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-pink-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-3 md:p-4 border-t border-pink-100 bg-white">
          <div className="bg-pink-50 rounded-2xl border border-pink-100 focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-200 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta..."
              disabled={loading}
              rows={1}
              className="w-full bg-transparent px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50 resize-none min-h-[44px] max-h-[120px] text-sm md:text-base"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
              }}
            />

            <div className="flex items-center justify-between px-3 py-2 border-t border-pink-100/50">
              <div className="flex items-center gap-1">
                {/* Icones de categoria */}
                <Heart className="w-4 h-4 text-pink-300" />
                <Salad className="w-4 h-4 text-green-300" />
                <Pill className="w-4 h-4 text-purple-300" />
              </div>

              <button
                onClick={() => enviarMensagem()}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Enviar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-2 text-center">
            Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  )
}
