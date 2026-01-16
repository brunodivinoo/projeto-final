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
  Zap,
  ChevronDown,
  Menu,
  Square
} from 'lucide-react'
import ArtifactRenderer from '@/components/ia/ArtifactRenderer'
import ArtifactsSidebar from '@/components/ia/ArtifactsSidebar'
import { useSmartScroll } from '@/hooks/useSmartScroll'
import { useArtifactsStore } from '@/stores/artifactsStore'

// Hook para obter o estado da sidebar de artefatos
const useArtifactsSidebar = () => {
  const isSidebarOpen = useArtifactsStore(state => state.isSidebarOpen)
  const artifacts = useArtifactsStore(state => state.artifacts)
  return { isSidebarOpen, hasArtifacts: artifacts.length > 0 }
}

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

  // Smart scroll - permite scroll manual durante streaming
  const { containerRef: chatRef, isAtBottom, scrollToBottom } = useSmartScroll({
    threshold: 150,
    smoothScroll: true
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Verificar limites (gratuito agora tem 10 chats grátis)
  const podeUsarIA = true // todos os planos podem usar IA agora
  const isResidencia = plano === 'residencia'

  // Estado da sidebar de artefatos para ajustar layout
  const { isSidebarOpen: isArtifactsSidebarOpen, hasArtifacts } = useArtifactsSidebar()

  // Detectar mobile para responsividade
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Gerenciar artefatos por conversa
  const { clearArtifacts, setCurrentConversa } = useArtifactsStore()

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

    // Limpar artefatos ao trocar de conversa
    clearArtifacts()
    setCurrentConversa(conversaId)

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
  }, [user, clearArtifacts, setCurrentConversa])

  useEffect(() => {
    fetchUso()
    fetchConversas()
  }, [fetchUso, fetchConversas])

  // O scroll automático agora é gerenciado pelo hook useSmartScroll
  // Permite scroll manual durante streaming sem travar

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

  // Ref para controlar requisições em andamento
  const abortControllerRef = useRef<AbortController | null>(null)

  // Função para cancelar geração (Problema 5)
  const cancelarGeracao = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setLoading(false)
      setStreaming(false)

      // Atualizar última mensagem para indicar que foi cancelada
      setMensagens(prev => {
        const updated = [...prev]
        const lastMsg = updated[updated.length - 1]
        if (lastMsg && lastMsg.tipo === 'ia' && !lastMsg.conteudo) {
          lastMsg.conteudo = '*Geração interrompida pelo usuário*'
        } else if (lastMsg && lastMsg.tipo === 'ia') {
          lastMsg.conteudo += '\n\n---\n*Geração interrompida*'
        }
        return updated
      })
    }
  }, [])

  // Enviar mensagem com streaming
  const enviarMensagem = async () => {
    if (!input.trim() || !user || loading || !podeUsarIA) return

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

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

    // Timeout de segurança - garante que loading seja resetado após 5 minutos
    const timeoutId = setTimeout(() => {
      console.warn('Timeout de segurança atingido - resetando estado')
      setLoading(false)
      setStreaming(false)
      setMensagens(prev => prev.map(m =>
        m.id === respostaId && !m.conteudo
          ? { ...m, conteudo: 'A resposta demorou muito. Tente novamente.' }
          : m
      ))
    }, 5 * 60 * 1000) // 5 minutos

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
        }),
        signal: abortControllerRef.current.signal
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
      let receivedDone = false
      let buffer = '' // Buffer para chunks incompletos

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // Processar linhas completas (terminadas em \n)
        const lines = buffer.split('\n')
        // Manter a última linha (possivelmente incompleta) no buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6)
              if (!jsonStr) continue

              const data = JSON.parse(jsonStr)

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
                receivedDone = true
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
              // Mas logar se não for erro de JSON
              if (!(parseError instanceof SyntaxError)) {
                console.error('Erro no processamento:', parseError)
              }
            }
          }
        }
      }

      // Processar qualquer dado restante no buffer
      if (buffer.trim().startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.trim().slice(6))
          if (data.type === 'text') {
            fullResponse += data.content
            setMensagens(prev => prev.map(m =>
              m.id === respostaId
                ? { ...m, conteudo: fullResponse }
                : m
            ))
          }
        } catch {
          // Ignorar - chunk incompleto no final
        }
      }

      // Se stream terminou sem evento 'done', marcar como completo mesmo assim
      if (!receivedDone && fullResponse) {
        console.warn('Stream terminou sem evento done, mas há resposta')
        // Adicionar indicador visual de que pode estar incompleto
        setMensagens(prev => prev.map(m =>
          m.id === respostaId
            ? { ...m, conteudo: fullResponse + '\n\n---\n*A geração pode ter sido interrompida. Se a resposta parece incompleta, tente perguntar novamente.*' }
            : m
        ))
        fetchUso()
        fetchConversas()
      }

    } catch (error) {
      // Ignorar erros de abort (usuário cancelou)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Requisição cancelada pelo usuário')
        return
      }

      console.error('Erro no envio de mensagem:', error)
      setMensagens(prev => prev.map(m =>
        m.id === respostaId
          ? { ...m, conteudo: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}` }
          : m
      ))
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
      setStreaming(false)
      setImagemBase64(null)
      setImagemTipo(null)
      setPdfBase64(null)
      abortControllerRef.current = null
    }
  }

  // Nova conversa
  const novaConversa = () => {
    setMensagens([])
    setConversaAtual(null)
    setShowConversas(false)
    clearArtifacts() // Limpar artefatos ao iniciar nova conversa
    setCurrentConversa(null)
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
    <div className={`h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] flex flex-col md:flex-row transition-all duration-300 ${
      isArtifactsSidebarOpen && hasArtifacts && !isMobile ? 'mr-[420px]' : ''
    }`}>
      {/* MOBILE: Sidebar como Drawer sobreposto */}
      {isMobile ? (
        <>
          {/* Backdrop */}
          {showConversas && (
            <div
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowConversas(false)}
            />
          )}

          {/* Drawer */}
          <div className={`
            fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-slate-900 z-50
            transform transition-transform duration-300 ease-out
            ${showConversas ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="h-full flex flex-col p-4">
              {/* Header do drawer */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Conversas</h3>
                <button
                  onClick={() => setShowConversas(false)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Botão Nova Conversa */}
              <button
                onClick={() => { novaConversa(); setShowConversas(false) }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-colors mb-4"
              >
                <Plus className="w-5 h-5" />
                Nova Conversa
              </button>

              {/* Lista de conversas */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {conversas.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                      conversaAtual === conv.id ? 'bg-purple-500/20' : 'hover:bg-white/5'
                    }`}
                    onClick={() => { carregarConversa(conv.id); setShowConversas(false) }}
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
                        className="p-1 hover:bg-white/10 rounded transition-all"
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
        </>
      ) : (
        /* DESKTOP: Sidebar fixa */
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
      )}

      {/* Chat Principal */}
      <div className="flex-1 flex flex-col relative min-h-0 overflow-hidden">
        {/* Header - Compacto */}
        <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 border-b border-white/10">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Botão menu/conversas */}
            <button
              onClick={() => setShowConversas(!showConversas)}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              {isMobile ? (
                <Menu className="w-4 h-4 text-white/60" />
              ) : (
                <MessageSquare className="w-4 h-4 text-white/60" />
              )}
            </button>

            {/* Logo e info - Compacto */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xs md:text-sm font-bold text-white">PREPARAMED IA</h1>
                <p className="text-white/50 text-[9px] md:text-[10px] hidden sm:block">
                  {isResidencia ? 'Claude Opus | Ilimitado' : `Gemini Flash | ${uso?.uso_mes.chats || 0}/100`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isResidencia && <Crown className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />}
            <button
              onClick={() => setShowOpcoes(!showOpcoes)}
              className={`p-1.5 rounded-lg transition-colors ${
                showOpcoes ? 'bg-purple-500/20 text-purple-400' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
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

        {/* Chat Area - Responsivo e Compacto */}
        <div
          ref={chatRef}
          className="flex-1 min-h-0 overflow-y-auto p-2 md:p-3 space-y-2 md:space-y-3"
        >
          {mensagens.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-4xl mx-auto w-full">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center mb-3 md:mb-4">
                <Brain className="w-7 h-7 md:w-8 md:h-8 text-purple-400" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white mb-1.5">Como posso ajudar?</h2>
              <p className="text-white/60 mb-4 md:mb-6 max-w-md text-xs md:text-sm">
                {isResidencia
                  ? 'Tire dúvidas, analise imagens, PDFs e use busca na web para informações atualizadas.'
                  : 'Tire dúvidas sobre medicina, peça explicações de conceitos ou ajuda com questões.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 w-full max-w-xl">
                {sugestoes.map((sugestao, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(sugestao.texto)}
                    className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left border border-white/5 hover:border-white/10"
                  >
                    <sugestao.icon className={`w-4 h-4 md:w-5 md:h-5 ${sugestao.cor} flex-shrink-0`} />
                    <span className="text-white/80 text-xs md:text-sm">{sugestao.texto}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            mensagens.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'gap-2 md:gap-3 justify-start'}`}
              >
                {/* Avatar - menor no mobile */}
                {msg.tipo === 'ia' && (
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 md:w-5 md:h-5 text-white" />
                  </div>
                )}

                {/* Mensagem com largura diferenciada - usuário compacta, IA expande total */}
                <div className={`${
                  msg.tipo === 'usuario'
                    ? 'max-w-[80%] md:max-w-[55%] lg:max-w-[45%]'
                    : 'max-w-full'
                } ${msg.tipo === 'usuario' ? 'order-first' : ''}`}>
                  {msg.thinking && (
                    <div className="mb-1.5 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-amber-200 text-[10px] font-medium mb-0.5 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Raciocínio
                      </p>
                      <p className="text-amber-100/60 text-[10px] line-clamp-3">{msg.thinking}</p>
                    </div>
                  )}

                  <div className={`rounded-lg md:rounded-xl p-2.5 md:p-3 ${
                    msg.tipo === 'usuario'
                      ? 'bg-emerald-500/20 text-white'
                      : 'bg-white/5 text-white/90 border border-white/5'
                  }`}>
                    {(msg.hasImage || msg.hasPdf) && msg.tipo === 'usuario' && (
                      <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-white/10">
                        {msg.hasImage && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Imagem
                          </span>
                        )}
                        {msg.hasPdf && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <FileUp className="w-3 h-3" /> PDF
                          </span>
                        )}
                      </div>
                    )}

                    {msg.tipo === 'ia' ? (
                      <div className="prose prose-invert prose-sm max-w-none text-xs md:text-sm">
                        <ArtifactRenderer
                          content={msg.conteudo || (streaming && !msg.conteudo ? 'Pensando...' : '')}
                          userId={user?.id}
                          messageId={msg.id}
                          conversaId={conversaAtual || undefined}
                        />
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-xs md:text-sm">{msg.conteudo}</p>
                    )}
                  </div>

                  {msg.tipo === 'ia' && msg.conteudo && (
                    <div className="flex items-center gap-2 mt-0.5 ml-1">
                      <button
                        onClick={() => copiarResposta(msg.id, msg.conteudo)}
                        className="text-white/40 hover:text-white text-[10px] flex items-center gap-1"
                      >
                        {copiado === msg.id ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiado === msg.id ? 'Copiado!' : 'Copiar'}
                      </button>
                      {msg.tokens && (
                        <span className="text-white/30 text-[10px]">
                          {msg.tokens.toLocaleString()} tokens
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Avatar do usuário removido - mensagem fica mais limpa */}
              </div>
            ))
          )}

          {loading && !mensagens.find(m => m.tipo === 'ia' && m.conteudo === '') && (
            <div className="flex gap-2 md:gap-3">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="bg-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/5">
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-purple-400 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Botão voltar ao final - só ícone */}
        {!isAtBottom && mensagens.length > 0 && (
          <div className="absolute bottom-36 md:bottom-32 right-3 md:right-6 z-10">
            <button
              onClick={() => scrollToBottom(true)}
              className="p-2 md:p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
              title="Voltar ao final"
            >
              <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        )}

        {/* Indicador de streaming */}
        {streaming && (
          <div className="px-4 pb-2">
            <div className="flex items-center justify-center gap-2 text-purple-400 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Gerando resposta...</span>
              <button
                onClick={cancelarGeracao}
                className="text-white/40 hover:text-red-400 transition-colors underline"
              >
                cancelar
              </button>
            </div>
          </div>
        )}

        {/* Input Area - Compacto */}
        <div className="px-2 md:px-3 py-2 border-t border-white/10 bg-slate-900/50">
          <div className="relative">
            {/* Container do input com borda visual */}
            <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500/30 transition-all">

              {/* Área de anexos DENTRO do container */}
              {(imagemBase64 || pdfBase64) && (
                <div className="px-3 md:px-4 pt-3 flex gap-2 flex-wrap">
                  {imagemBase64 && (
                    <div className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs">
                      <ImageIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">Imagem</span>
                      <button
                        onClick={() => { setImagemBase64(null); setImagemTipo(null) }}
                        className="hover:bg-blue-500/20 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {pdfBase64 && (
                    <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs">
                      <FileUp className="w-3 h-3" />
                      <span className="hidden sm:inline">PDF</span>
                      <button
                        onClick={() => setPdfBase64(null)}
                        className="hover:bg-red-500/20 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Textarea expandível */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (loading) {
                      cancelarGeracao()
                    } else {
                      enviarMensagem()
                    }
                  }
                }}
                placeholder="Digite sua pergunta..."
                disabled={loading}
                rows={1}
                className="w-full bg-transparent py-2.5 md:py-3 px-3 md:px-4 text-white placeholder-white/40 focus:outline-none disabled:opacity-50 resize-none min-h-[40px] md:min-h-[44px] max-h-[100px] md:max-h-[140px] text-sm"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, isMobile ? 120 : 160) + 'px'
                }}
              />

              {/* Barra de ações DENTRO do container */}
              <div className="flex items-center justify-between px-2 md:px-4 py-2 border-t border-white/5 bg-white/[0.02]">
                {/* Botões de ação à esquerda */}
                <div className="flex items-center gap-0.5 md:gap-1">
                  {isResidencia && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 md:p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Anexar imagem"
                      >
                        <ImageIcon className="w-4 h-4" />
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
                        className="p-1.5 md:p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Anexar PDF"
                      >
                        <FileUp className="w-4 h-4" />
                      </button>
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                      />

                      {/* Separador */}
                      <div className="w-px h-4 bg-white/10 mx-0.5 md:mx-1" />

                      {/* Toggle Web Search */}
                      <button
                        onClick={() => setUseWebSearch(!useWebSearch)}
                        className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                          useWebSearch
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                        title="Busca na Web"
                      >
                        <Search className="w-4 h-4" />
                      </button>

                      {/* Toggle Extended Thinking */}
                      <button
                        onClick={() => setUseExtendedThinking(!useExtendedThinking)}
                        className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                          useExtendedThinking
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                        title="Extended Thinking"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Botão enviar/cancelar à direita */}
                <button
                  onClick={loading ? cancelarGeracao : enviarMensagem}
                  disabled={!loading && !input.trim()}
                  className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all ${
                    loading
                      ? 'bg-red-500/80 hover:bg-red-600 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105'
                  }`}
                >
                  {loading ? (
                    <Square className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Dica de atalho - minimal */}
          <p className="text-center text-white/20 text-[9px] mt-1">
            Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </div>

      {/* Sidebar de Artefatos */}
      <ArtifactsSidebar userId={user?.id} />
    </div>
  )
}
