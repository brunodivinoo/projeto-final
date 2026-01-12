'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMedAuth } from '@/contexts/MedAuthContext'
import {
  Brain,
  Send,
  Trash2,
  Copy,
  CheckCircle2,
  BookOpen,
  FileText,
  Layers,
  User,
  Bot,
  Crown,
  Plus,
  Image as ImageIcon,
  FileUp,
  Search,
  Lightbulb,
  MessageSquare,
  Loader2,
  X,
  Settings,
  Zap
} from 'lucide-react'
import ArtifactRenderer from '@/components/ia/ArtifactRenderer'

interface Mensagem {
  id: string
  tipo: 'usuario' | 'ia' | 'system'
  conteudo: string
  timestamp: Date
  hasImage?: boolean
  hasPdf?: boolean
  thinking?: string
  tokens?: number
}

interface Conversa {
  id: string
  titulo: string
  modelo: string
  tokens_usados: number
  created_at: string
  updated_at: string
}

interface UsoIA {
  plano: string
  uso_mes: {
    chats: number
    resumos: number
    flashcards: number
    imagens: number
    web_searches: number
    pdfs: number
    imagens_analisadas: number
    tokens_input: number
    tokens_output: number
  }
  limites: {
    chats: number
    resumos: number
    flashcards: number
    imagens: number
    web_search: boolean
    vision: boolean
    pdf_support: boolean
    extended_thinking: boolean
  }
}

export default function IAPage() {
  const { user, plano } = useMedAuth()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaAtual, setConversaAtual] = useState<string | null>(null)
  const [showConversas, setShowConversas] = useState(false)
  const [showOpcoes, setShowOpcoes] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [uso, setUso] = useState<UsoIA | null>(null)

  // Opções avançadas
  const [useWebSearch, setUseWebSearch] = useState(false)
  const [useExtendedThinking, setUseExtendedThinking] = useState(false)
  const [imagemBase64, setImagemBase64] = useState<string | null>(null)
  const [imagemTipo, setImagemTipo] = useState<string | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)

  const chatRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Verificar limites (gratuito agora tem 10 chats grátis)
  const podeUsarIA = true // todos os planos podem usar IA agora
  const isResidencia = plano === 'residencia'

  // Buscar uso
  const fetchUso = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/medicina/ia/uso?user_id=${user.id}`)
      const data = await response.json()
      setUso(data)
    } catch (error) {
      console.error('Erro ao buscar uso:', error)
    }
  }, [user])

  // Buscar conversas
  const fetchConversas = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/medicina/ia/chat?user_id=${user.id}`)
      const data = await response.json()
      setConversas(data.conversas || [])
    } catch (error) {
      console.error('Erro ao buscar conversas:', error)
    }
  }, [user])

  // Carregar conversa específica
  const carregarConversa = useCallback(async (conversaId: string) => {
    if (!user) return
    try {
      const response = await fetch(`/api/medicina/ia/chat?user_id=${user.id}&conversa_id=${conversaId}`)
      const data = await response.json()

      if (data.mensagens) {
        const msgs: Mensagem[] = data.mensagens.map((m: { id: string; role: string; content: string; created_at: string; has_image?: boolean; has_pdf?: boolean; tokens?: number }) => ({
          id: m.id,
          tipo: m.role === 'user' ? 'usuario' : 'ia',
          conteudo: m.content,
          timestamp: new Date(m.created_at),
          hasImage: m.has_image,
          hasPdf: m.has_pdf,
          tokens: m.tokens
        }))
        setMensagens(msgs)
        setConversaAtual(conversaId)
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error)
    }
    setShowConversas(false)
  }, [user])

  useEffect(() => {
    fetchUso()
    fetchConversas()
  }, [fetchUso, fetchConversas])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensagens])

  // Processar imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      setImagemBase64(base64)
      setImagemTipo(file.type)
    }
    reader.readAsDataURL(file)
  }

  // Processar PDF
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      setPdfBase64(base64)
    }
    reader.readAsDataURL(file)
  }

  // Enviar mensagem com streaming
  const enviarMensagem = async () => {
    if (!input.trim() || !user || loading || !podeUsarIA) return

    const mensagemUsuario = input.trim()
    const novoId = Date.now().toString()

    setInput('')
    setMensagens(prev => [...prev, {
      id: novoId,
      tipo: 'usuario',
      conteudo: mensagemUsuario,
      timestamp: new Date(),
      hasImage: !!imagemBase64,
      hasPdf: !!pdfBase64
    }])
    setLoading(true)
    setStreaming(true)

    // Criar mensagem de resposta vazia
    const respostaId = (Date.now() + 1).toString()
    setMensagens(prev => [...prev, {
      id: respostaId,
      tipo: 'ia',
      conteudo: '',
      timestamp: new Date()
    }])

    try {
      const response = await fetch('/api/medicina/ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          mensagem: mensagemUsuario,
          conversa_id: conversaAtual,
          imagem_base64: imagemBase64,
          imagem_tipo: imagemTipo,
          pdf_base64: pdfBase64,
          use_web_search: useWebSearch,
          use_extended_thinking: useExtendedThinking,
          thinking_budget: 8000
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao processar mensagem')
      }

      // Processar stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Stream não disponível')
      }

      let fullResponse = ''
      let thinking = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'text') {
                fullResponse += data.content
                setMensagens(prev => prev.map(m =>
                  m.id === respostaId
                    ? { ...m, conteudo: fullResponse }
                    : m
                ))
              } else if (data.type === 'tool_result') {
                // Tool foi executada
                console.log('Tool result:', data)
              } else if (data.type === 'done') {
                setConversaAtual(data.conversa_id)
                thinking = data.thinking || ''

                // Atualizar mensagem final com tokens e thinking
                setMensagens(prev => prev.map(m =>
                  m.id === respostaId
                    ? { ...m, tokens: data.tokens?.input + data.tokens?.output, thinking }
                    : m
                ))

                fetchUso()
                fetchConversas()
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch (parseError) {
              // Ignorar erros de parsing de chunks incompletos
            }
          }
        }
      }

    } catch (error) {
      setMensagens(prev => prev.map(m =>
        m.id === respostaId
          ? { ...m, conteudo: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}` }
          : m
      ))
    } finally {
      setLoading(false)
      setStreaming(false)
      setImagemBase64(null)
      setImagemTipo(null)
      setPdfBase64(null)
    }
  }

  // Nova conversa
  const novaConversa = () => {
    setMensagens([])
    setConversaAtual(null)
    setShowConversas(false)
  }

  // Deletar conversa
  const deletarConversa = async (id: string) => {
    if (!user) return
    try {
      await fetch(`/api/medicina/ia/chat?conversa_id=${id}&user_id=${user.id}`, {
        method: 'DELETE'
      })
      fetchConversas()
      if (conversaAtual === id) {
        novaConversa()
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error)
    }
  }

  // Copiar resposta
  const copiarResposta = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto)
    setCopiado(id)
    setTimeout(() => setCopiado(null), 2000)
  }

  // Sugestões rápidas
  const sugestoes = [
    { icon: BookOpen, texto: 'Explique a fisiopatologia da insuficiência cardíaca', cor: 'text-blue-400' },
    { icon: FileText, texto: 'Quais são os critérios de Light para derrame pleural?', cor: 'text-emerald-400' },
    { icon: Layers, texto: 'Faça um resumo sobre diabetes mellitus tipo 2', cor: 'text-purple-400' },
    { icon: Lightbulb, texto: 'Me ajude a criar um plano de estudos para residência', cor: 'text-amber-400' },
  ]

  // Mostrar upgrade prompt apenas se limite atingido
  // (gratuito agora tem 10 chats, então não bloqueia mais)

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Sidebar de Conversas */}
      <div className={`${showConversas ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-white/10`}>
        <div className="w-72 h-full bg-white/5 p-4 flex flex-col">
          <button
            onClick={novaConversa}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-colors mb-4"
          >
            <Plus className="w-5 h-5" />
            Nova Conversa
          </button>

          <div className="flex-1 overflow-y-auto space-y-2">
            {conversas.map((conv) => (
              <div
                key={conv.id}
                className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                  conversaAtual === conv.id ? 'bg-purple-500/20' : 'hover:bg-white/5'
                }`}
                onClick={() => carregarConversa(conv.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm truncate">{conv.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        conv.modelo === 'claude' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {conv.modelo === 'claude' ? 'Claude' : 'Gemini'}
                      </span>
                      <span className="text-white/40 text-xs">
                        {new Date(conv.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletarConversa(conv.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-white/40" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Estatísticas de Uso */}
          {uso && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-white/60 text-xs font-medium mb-2">Uso este mês</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-white/80">
                  <span>Chats</span>
                  <span>{uso.uso_mes.chats}{uso.limites.chats !== -1 && `/${uso.limites.chats}`}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Tokens</span>
                  <span>{((uso.uso_mes.tokens_input + uso.uso_mes.tokens_output) / 1000).toFixed(1)}k</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConversas(!showConversas)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-white/60" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">PREPARAMED IA</h1>
                <p className="text-white/60 text-xs">
                  {isResidencia ? 'Claude Opus' : 'Gemini Flash'} | {isResidencia ? 'Ilimitado' : `${uso?.uso_mes.chats || 0}/100 chats`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isResidencia && (
              <Crown className="w-5 h-5 text-amber-400" />
            )}
            <button
              onClick={() => setShowOpcoes(!showOpcoes)}
              className={`p-2 rounded-lg transition-colors ${
                showOpcoes ? 'bg-purple-500/20 text-purple-400' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Opções Avançadas */}
        {showOpcoes && isResidencia && (
          <div className="p-4 border-b border-white/10 bg-white/5">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                />
                <Search className="w-4 h-4 text-blue-400" />
                <span className="text-white/80 text-sm">Busca Web</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useExtendedThinking}
                  onChange={(e) => setUseExtendedThinking(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                />
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-white/80 text-sm">Extended Thinking</span>
              </label>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {mensagens.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center mb-6">
                <Brain className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Como posso ajudar?</h2>
              <p className="text-white/60 mb-8 max-w-md">
                {isResidencia
                  ? 'Tire dúvidas, analise imagens, PDFs e use busca na web para informações atualizadas.'
                  : 'Tire dúvidas sobre medicina, peça explicações de conceitos ou ajuda com questões.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                {sugestoes.map((sugestao, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(sugestao.texto)}
                    className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left border border-white/5 hover:border-white/10"
                  >
                    <sugestao.icon className={`w-5 h-5 ${sugestao.cor} flex-shrink-0`} />
                    <span className="text-white/80 text-sm">{sugestao.texto}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            mensagens.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.tipo === 'ia' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div className={`max-w-[80%] ${msg.tipo === 'usuario' ? 'order-first' : ''}`}>
                  {msg.thinking && (
                    <div className="mb-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-amber-200 text-xs font-medium mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Raciocínio
                      </p>
                      <p className="text-amber-100/60 text-xs line-clamp-3">{msg.thinking}</p>
                    </div>
                  )}

                  <div className={`rounded-2xl p-4 ${
                    msg.tipo === 'usuario'
                      ? 'bg-emerald-500/20 text-white'
                      : 'bg-white/5 text-white/90 border border-white/5'
                  }`}>
                    {(msg.hasImage || msg.hasPdf) && msg.tipo === 'usuario' && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                        {msg.hasImage && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Imagem
                          </span>
                        )}
                        {msg.hasPdf && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded flex items-center gap-1">
                            <FileUp className="w-3 h-3" /> PDF
                          </span>
                        )}
                      </div>
                    )}

                    {msg.tipo === 'ia' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ArtifactRenderer
                          content={msg.conteudo || (streaming && !msg.conteudo ? 'Pensando...' : '')}
                          userId={user?.id}
                        />
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                    )}
                  </div>

                  {msg.tipo === 'ia' && msg.conteudo && (
                    <div className="flex items-center gap-3 mt-1 ml-2">
                      <button
                        onClick={() => copiarResposta(msg.id, msg.conteudo)}
                        className="text-white/40 hover:text-white text-xs flex items-center gap-1"
                      >
                        {copiado === msg.id ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiado === msg.id ? 'Copiado!' : 'Copiar'}
                      </button>
                      {msg.tokens && (
                        <span className="text-white/30 text-xs">
                          {msg.tokens.toLocaleString()} tokens
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {msg.tipo === 'usuario' && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-5 h-5 text-emerald-400" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && !mensagens.find(m => m.tipo === 'ia' && m.conteudo === '') && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Anexos Preview */}
        {(imagemBase64 || pdfBase64) && (
          <div className="px-4 py-2 flex gap-2">
            {imagemBase64 && (
              <div className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                <ImageIcon className="w-4 h-4" />
                <span>Imagem anexada</span>
                <button onClick={() => { setImagemBase64(null); setImagemTipo(null) }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {pdfBase64 && (
              <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                <FileUp className="w-4 h-4" />
                <span>PDF anexado</span>
                <button onClick={() => setPdfBase64(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-3 items-end">
            {/* Botões de anexo */}
            {isResidencia && (
              <div className="flex gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  title="Anexar imagem"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <button
                  onClick={() => pdfInputRef.current?.click()}
                  className="p-3 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  title="Anexar PDF"
                >
                  <FileUp className="w-5 h-5" />
                </button>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Input de texto */}
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    enviarMensagem()
                  }
                }}
                placeholder="Digite sua pergunta... (Enter para enviar, Shift+Enter para nova linha)"
                disabled={loading}
                rows={1}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 resize-none min-h-[56px] max-h-[200px]"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px'
                }}
              />
            </div>

            {/* Botão enviar */}
            <button
              onClick={enviarMensagem}
              disabled={!input.trim() || loading}
              className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Info de funcionalidades */}
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-white/40">
            {isResidencia && (
              <>
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Imagens
                </span>
                <span className="flex items-center gap-1">
                  <FileUp className="w-3 h-3" /> PDFs
                </span>
                <span className="flex items-center gap-1">
                  <Search className="w-3 h-3" /> Web Search
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Extended Thinking
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
