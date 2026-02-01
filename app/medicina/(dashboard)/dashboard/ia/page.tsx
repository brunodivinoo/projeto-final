'use client'

import { useState, useEffect, useRef, useCallback, useTransition, memo, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  ChevronRight,
  Menu,
  Square,
  Stethoscope,
  MoreVertical,
  Pencil,
  Check,
  FolderOpen,
} from 'lucide-react'
import ArtifactRenderer, { type PlanoUsuario } from '@/components/ia/ArtifactRenderer'
import ArtifactsSidebar from '@/components/ia/ArtifactsSidebar'
import { useSmartScroll } from '@/hooks/useSmartScroll'
import { useArtifactsStore, type ChatModeType } from '@/stores/artifactsStore'
import { VoiceButton } from '@/components/medicina/VoiceButton'
import { ExamAnalyzerModal } from '@/components/medicina/ExamAnalyzer'
import { ChatModeSelector, ChatModeIntro, useChatMode, type ChatMode } from '@/components/medicina/ChatModes'
import { useChatModeStore, ChatMode as StoreChatMode, MODE_CONFIG } from '@/lib/stores/chatModeStore'
import { useConversaStore, type Conversa as StoreConversa } from '@/lib/stores/conversaStore'
import { ModeSelector, ModeIndicator } from '@/components/chat/ModeSelector'
import { QuestaoDetector, extrairQuestoes } from '@/components/chat/QuestaoDetector'
import { type QuestaoData } from '@/components/chat/QuestaoInterativa'
import { useSessoesIA } from '@/hooks/useSessoesIA'
import { SimulacaoConfig, gerarPromptSimulacao, type SimulacaoConfigData } from '@/components/chat/SimulacaoConfig'
import { IndicadorProgresso, FichaDrawer, type DadosFicha, DADOS_FICHA_VAZIO } from '@/components/chat/FichaAnamnese'
import {
  MobileChatInput
} from '@/components/mobile'
import { MobileArtifactsScreen } from '@/components/mobile/MobileArtifactsScreen'

// Hook para obter o estado da sidebar de artefatos
// Considera artefatos filtrados pelo modo atual e conversa
const useArtifactsSidebar = () => {
  const isSidebarOpen = useArtifactsStore(state => state.isSidebarOpen)
  const allArtifacts = useArtifactsStore(state => state.artifacts)
  const currentConversaId = useArtifactsStore(state => state.currentConversaId)
  const chatModeFilter = useArtifactsStore(state => state.chatModeFilter)

  // Filtrar artefatos pela conversa atual e modo de chat (mesma lógica do ArtifactsSidebar)
  const hasVisibleArtifacts = useMemo(() => {
    let filtered = allArtifacts

    // Filtrar por conversa
    if (currentConversaId) {
      filtered = filtered.filter(a => a.conversaId === currentConversaId || !a.conversaId)
    }

    // Filtrar por modo de chat
    if (chatModeFilter !== 'all') {
      filtered = filtered.filter(a => a.chatMode === chatModeFilter)
    }

    return filtered.length > 0
  }, [allArtifacts, currentConversaId, chatModeFilter])

  return { isSidebarOpen, hasArtifacts: hasVisibleArtifacts }
}

interface ImagemGerada {
  id: string
  url: string
  storageUrl?: string // URL permanente do Supabase Storage
  estrutura: string
  descricao: string
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
  imagemGerada?: ImagemGerada
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

// Componente memoizado para mensagens individuais
// Evita re-render de mensagens antigas durante streaming
interface MemoizedMessageProps {
  msg: Mensagem
  streaming: boolean
  copiado: string | null
  copiarResposta: (id: string, conteudo: string) => void
  user: { id: string } | null | undefined
  conversaAtual: string | null
  chatMode: ChatModeType
  plano: PlanoUsuario
  trialAtivo: boolean
  onQuestaoResponder?: (questao: QuestaoData, letra: string, acertou: boolean, tempo: number) => void
  questoesRespondidas?: Set<number>
}

const MemoizedMessage = memo(function MemoizedMessage({
  msg,
  streaming,
  copiado,
  copiarResposta,
  user,
  conversaAtual,
  chatMode,
  plano,
  trialAtivo,
  onQuestaoResponder,
  questoesRespondidas = new Set()
}: MemoizedMessageProps) {
  // Verificar se a mensagem contém questões
  const temQuestao = msg.tipo === 'ia' && chatMode === 'questoes' && msg.conteudo?.includes('```questao')
  return (
    <div
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
          <div className="mb-1.5 p-2 bg-amber-100 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-[10px] font-medium mb-0.5 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> Raciocínio
            </p>
            <p className="text-amber-600/80 text-[10px] line-clamp-3">{msg.thinking}</p>
          </div>
        )}

        <div className={`rounded-lg md:rounded-xl p-2.5 md:p-3 ${
          msg.tipo === 'usuario'
            ? 'bg-emerald-500 text-white shadow-sm'
            : 'bg-white text-slate-800 border border-slate-200 shadow-sm'
        }`}>
          {(msg.hasImage || msg.hasPdf) && msg.tipo === 'usuario' && (
            <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-white/30">
              {msg.hasImage && (
                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Imagem
                </span>
              )}
              {msg.hasPdf && (
                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <FileUp className="w-3 h-3" /> PDF
                </span>
              )}
            </div>
          )}

          {msg.tipo === 'ia' ? (
            <div className="prose prose-slate prose-sm max-w-none text-xs md:text-sm">
              {/* Renderizar imagem gerada se existir */}
              {msg.imagemGerada && (
                <div className="my-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <div className="p-2 border-b border-slate-200 bg-slate-100">
                    <p className="text-xs text-purple-600 font-medium flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {msg.imagemGerada.estrutura}
                    </p>
                  </div>
                  <img
                    src={msg.imagemGerada.storageUrl || msg.imagemGerada.url}
                    alt={msg.imagemGerada.descricao || msg.imagemGerada.estrutura}
                    className="w-full max-w-lg mx-auto"
                    style={{ display: 'block' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      if (msg.imagemGerada?.storageUrl && target.src === msg.imagemGerada.storageUrl) {
                        target.src = msg.imagemGerada.url
                      } else {
                        target.style.display = 'none'
                      }
                    }}
                  />
                  {msg.imagemGerada.descricao && (
                    <p className="p-2 text-xs text-slate-500 text-center border-t border-slate-200">
                      {msg.imagemGerada.descricao}
                    </p>
                  )}
                </div>
              )}
              {/* Renderizar questões interativas se for modo questões */}
              {temQuestao ? (
                <QuestaoDetector
                  conteudo={msg.conteudo}
                  onResponder={onQuestaoResponder}
                  questoesRespondidas={questoesRespondidas}
                />
              ) : (
                <ArtifactRenderer
                  content={(msg.conteudo || (streaming && !msg.conteudo ? 'Pensando...' : '')).replace(/\[GENERATED_IMAGE:[^\]]+\]/g, '')}
                  userId={user?.id}
                  messageId={msg.id}
                  conversaId={conversaAtual || undefined}
                  chatMode={chatMode}
                  planoUsuario={plano}
                  trialAtivo={trialAtivo}
                  onUpgradeClick={() => {
                    window.location.href = '/medicina/planos'
                  }}
                />
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-xs md:text-sm">{msg.conteudo}</p>
          )}
        </div>

        {msg.tipo === 'ia' && msg.conteudo && (
          <div className="flex items-center gap-2 mt-1 ml-1">
            <button
              onClick={() => copiarResposta(msg.id, msg.conteudo)}
              className="text-slate-400 hover:text-slate-600 text-[10px] flex items-center gap-1 transition-colors"
            >
              {copiado === msg.id ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {copiado === msg.id ? 'Copiado!' : 'Copiar'}
            </button>
            {msg.tokens && (
              <span className="text-slate-300 text-[10px]">
                {msg.tokens.toLocaleString()} tokens
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison: só re-renderiza se a mensagem mudou
  // Mensagens do usuário nunca mudam depois de enviadas
  if (prevProps.msg.tipo === 'usuario') {
    return prevProps.msg.id === nextProps.msg.id &&
           prevProps.copiado === nextProps.copiado
  }
  // Mensagens da IA: comparar conteúdo também
  return prevProps.msg.id === nextProps.msg.id &&
         prevProps.msg.conteudo === nextProps.msg.conteudo &&
         prevProps.copiado === nextProps.copiado &&
         prevProps.streaming === nextProps.streaming
})

export default function IAPage() {
  const { user, plano, trialStatus } = useMedAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [mensagemInicialProcessada, setMensagemInicialProcessada] = useState(false)
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaAtual, setConversaAtual] = useState<string | null>(null)
  const [carregandoConversa, setCarregandoConversa] = useState(false) // Loading ao abrir conversa
  const [showConversas, setShowConversas] = useState(false) // Agora usado apenas no mobile
  const [showOpcoes, setShowOpcoes] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [uso, setUso] = useState<UsoIA | null>(null)

  // Opções avançadas
  const [useWebSearch, setUseWebSearch] = useState(true) // Habilitado por padrão
  const [useExtendedThinking, setUseExtendedThinking] = useState(false)
  const [imagemBase64, setImagemBase64] = useState<string | null>(null)
  const [imagemTipo, setImagemTipo] = useState<string | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [showExamAnalyzer, setShowExamAnalyzer] = useState(false)

  // useTransition para updates não-urgentes (evita flickering)
  const [isPending, startTransition] = useTransition()

  // Gerenciar artefatos por conversa e modo de chat
  const { clearArtifacts, setCurrentConversa, setCurrentChatMode, setChatModeFilter } = useArtifactsStore()

  // Store de modos com abas separadas
  const {
    setCurrentMode: setStoreMode,
    activeConversationByMode,
    setActiveConversation,
    setConversations
  } = useChatModeStore()

  // Modo de chat (Chat Livre, Caso Clínico, Tutor, Questões)
  const { modo: chatMode, trocarModo: trocarModoBase, mostrarIntro, iniciarModo, getSystemPrompt } = useChatMode()

  // Hook de sessões para integração com APIs
  const {
    sessaoAtiva,
    estatisticas,
    criarSessao,
    finalizarSessao,
    registrarQuestao,
    refreshEstatisticas
  } = useSessoesIA({ userId: user?.id, conversaId: conversaAtual })

  // Estado para questões respondidas (evitar re-responder)
  const [questoesRespondidas, setQuestoesRespondidas] = useState<Set<number>>(new Set())

  // Estado para simulação de atendimento (modo caso_clinico)
  const [showSimulacaoConfig, setShowSimulacaoConfig] = useState(false)

  // Estado para ficha de anamnese (opcional na simulação)
  const [fichaAtiva, setFichaAtiva] = useState(false)
  const [fichaAberta, setFichaAberta] = useState(false)
  const [dadosFicha, setDadosFicha] = useState<DadosFicha>(DADOS_FICHA_VAZIO)

  // Calcular itens preenchidos da ficha
  const fichaItensPreenchidos = useMemo(() => {
    let count = 0
    if (dadosFicha.identificacao?.idade || dadosFicha.identificacao?.sexo) count++
    if (dadosFicha.queixaPrincipal) count++
    if (dadosFicha.hda) count++
    if (dadosFicha.interrogatorio?.cardiovascular || dadosFicha.interrogatorio?.respiratorio || dadosFicha.interrogatorio?.digestorio) count++
    if (dadosFicha.historiaPatologica || dadosFicha.historiaFamiliar || dadosFicha.habitosVida) count++
    if (dadosFicha.exameFisico?.sinaisVitais?.fc || dadosFicha.exameFisico?.ectoscopia) count++
    if (dadosFicha.hipotesesDiagnosticas?.length || dadosFicha.conduta) count++
    return count
  }, [dadosFicha])

  // Estado para controlar dropdown de modo
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const modeDropdownDesktopRef = useRef<HTMLDivElement>(null)
  const modeDropdownMobileRef = useRef<HTMLDivElement>(null)

  // Estado para componentes mobile
  const [mobileConversasOpen, setMobileConversasOpen] = useState(false)
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)
  const [mobileArtifactsOpen, setMobileArtifactsOpen] = useState(false)

  // Estado para menu de 3 pontinhos (renomear/excluir conversa)
  const [menuConversaAberto, setMenuConversaAberto] = useState<string | null>(null)
  const [conversaRenomeando, setConversaRenomeando] = useState<string | null>(null)
  const [novoTituloConversa, setNovoTituloConversa] = useState('')

  // Estado para sugestões inteligentes
  interface SugestaoInteligente {
    type: 'topic' | 'action' | 'review'
    text: string
    fullPrompt: string
    icon: string
    priority: number
  }
  const [sugestoesInteligentes, setSugestoesInteligentes] = useState<{
    topics: SugestaoInteligente[]
    actions: SugestaoInteligente[]
    reviews: SugestaoInteligente[]
  }>({ topics: [], actions: [], reviews: [] })

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutsideDesktop = modeDropdownDesktopRef.current && !modeDropdownDesktopRef.current.contains(target)
      const isOutsideMobile = modeDropdownMobileRef.current && !modeDropdownMobileRef.current.contains(target)

      if (isOutsideDesktop && isOutsideMobile) {
        setShowModeDropdown(false)
      }

      // Fechar menu de conversa se clicar fora
      if (menuConversaAberto) {
        setMenuConversaAberto(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuConversaAberto])

  // Wrapper para trocar modo - com opção de manter conversa
  const trocarModo = useCallback(async (novoModo: ChatMode, manterConversa: boolean = false) => {
    trocarModoBase(novoModo)
    setCurrentChatMode(novoModo)
    // Sincronizar filtro de artefatos com o modo atual
    setChatModeFilter(novoModo as StoreChatMode)
    // Sincronizar com store de modos
    setStoreMode(novoModo as StoreChatMode)

    // Se estiver em uma conversa ativa e quiser manter, não limpa nada
    if (manterConversa && conversaAtual && mensagens.length > 0) {
      // Apenas troca o modo - mensagens permanecem
      // O próximo envio usará o novo modo
      return
    }

    // Limpar mensagens ao trocar de modo (comportamento padrão)
    setMensagens([])
    setConversaAtual(null)

    // A conversa ativa do novo modo será carregada pelo useEffect que monitora activeConversationByMode
    // Isso garante que as mensagens sejam efetivamente carregadas
  }, [trocarModoBase, setCurrentChatMode, setChatModeFilter, setStoreMode, conversaAtual, mensagens.length])

  // Função específica para trocar modo dentro da conversa
  const trocarModoNaConversa = useCallback((novoModo: ChatMode) => {
    trocarModo(novoModo, true)
    setShowModeDropdown(false)
  }, [trocarModo])

  // Smart scroll - permite scroll manual durante streaming
  const { containerRef: chatRef, isAtBottom, scrollToBottom } = useSmartScroll({
    threshold: 150,
    smoothScroll: true
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Ref para controlar requisições em andamento
  const abortControllerRef = useRef<AbortController | null>(null)

  // Verificar limites (gratuito agora tem 10 chats grátis)
  const podeUsarIA = true // todos os planos podem usar IA agora
  const isResidencia = plano === 'residencia'

  // Estado da sidebar de artefatos para ajustar layout
  const { isSidebarOpen: isArtifactsSidebarOpen, hasArtifacts } = useArtifactsSidebar()

  // Título da conversa atual
  const tituloConversa = useMemo(() => {
    if (!conversaAtual) return null
    const conversa = conversas.find(c => c.id === conversaAtual)
    return conversa?.titulo || null
  }, [conversaAtual, conversas])

  // Detectar mobile para responsividade
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Buscar sugestões inteligentes
  const fetchSugestoes = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/medicina/ia/sugestoes?user_id=${user.id}`)
      const data = await response.json()
      if (data.success && data.sugestoes) {
        setSugestoesInteligentes(data.sugestoes)
      }
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error)
    }
  }, [user])

  // Buscar conversas filtradas por modo
  const fetchConversas = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/medicina/ia/chat?user_id=${user.id}&modo=${chatMode}`)
      const data = await response.json()
      setConversas(data.conversas || [])
      // Atualizar cache na store
      setConversations(chatMode as StoreChatMode, data.conversas || [])
    } catch (error) {
      console.error('Erro ao buscar conversas:', error)
    }
  }, [user, chatMode, setConversations])

  // Carregar conversa específica
  const carregarConversa = useCallback(async (conversaId: string) => {
    if (!user) return

    console.log('[IA Page] Carregando conversa:', conversaId)

    // IMPORTANTE: Definir a conversa atual IMEDIATAMENTE para mostrar na UI
    setConversaAtual(conversaId)
    setActiveConversation(chatMode as StoreChatMode, conversaId)
    setCarregandoConversa(true)

    // Limpar artefatos ao trocar de conversa
    clearArtifacts()
    setCurrentConversa(conversaId)

    try {
      const response = await fetch(`/api/medicina/ia/chat?user_id=${user.id}&conversa_id=${conversaId}`)
      const data = await response.json()

      console.log('[IA Page] Resposta da API:', {
        hasConversa: !!data.conversa,
        hasMensagens: !!data.mensagens,
        mensagensCount: data.mensagens?.length || 0,
        error: data.error
      })

      if (data.mensagens && Array.isArray(data.mensagens)) {
        const msgs: Mensagem[] = data.mensagens.map((m: { id: string; role: string; content: string; created_at: string; has_image?: boolean; has_pdf?: boolean; tokens?: number }) => {
          const msg: Mensagem = {
            id: m.id,
            tipo: m.role === 'user' ? 'usuario' : 'ia',
            conteudo: m.content,
            timestamp: new Date(m.created_at),
            hasImage: m.has_image,
            hasPdf: m.has_pdf,
            tokens: m.tokens
          }

          // Extrair imagens do conteúdo e reconstruir artefatos
          // Formato: [GENERATED_IMAGE:id:storageUrl] ou [GENERATED_IMAGE:id]
          const imageMatches = m.content.matchAll(/\[GENERATED_IMAGE:([^:\]]+)(?::([^\]]+))?\]/g)
          for (const match of imageMatches) {
            const imageId = match[1]
            const storageUrl = match[2]

            if (storageUrl && storageUrl.startsWith('http')) {
              console.log('[IA Page] Reconstruindo artefato de imagem:', imageId)

              // Adicionar ao store de artefatos
              try {
                const { addImageArtifact } = useArtifactsStore.getState()
                addImageArtifact(
                  {
                    url: storageUrl,
                    source: 'generated',
                    imageType: 'anatomy'
                  },
                  'Imagem Médica Gerada',
                  conversaId,
                  m.id
                )
              } catch (err) {
                console.error('[IA Page] Erro ao reconstruir artefato de imagem:', err)
              }

              // Adicionar info de imagem à mensagem
              msg.imagemGerada = {
                id: imageId,
                url: storageUrl,
                storageUrl: storageUrl,
                estrutura: 'Imagem Médica',
                descricao: ''
              }
            }
          }

          return msg
        })
        console.log('[IA Page] Mensagens processadas:', msgs.length)
        setMensagens(msgs)
      } else {
        console.log('[IA Page] Nenhuma mensagem encontrada ou formato inválido')
        setMensagens([])
      }
    } catch (error) {
      console.error('[IA Page] Erro ao carregar conversa:', error)
    } finally {
      setCarregandoConversa(false)
    }
    setShowConversas(false)
  }, [user, clearArtifacts, setCurrentConversa, chatMode, setActiveConversation])

  useEffect(() => {
    fetchUso()
    fetchConversas()
    fetchSugestoes()
  }, [fetchUso, fetchConversas, fetchSugestoes])

  // Ref para controlar se a mensagem inicial foi enviada
  const mensagemInicialEnviadaRef = useRef(false)
  // Ref para evitar loop infinito ao carregar conversa
  const conversaCarregadaRef = useRef<string | null>(null)
  // Flag para indicar que está processando mensagem inicial - evita carregamentos paralelos
  const processandoMensagemInicialRef = useRef<boolean>(false)
  // Ref para a função de enviar mensagem (para evitar problemas de hoisting)
  const enviarMensagemDiretaRef = useRef<((msg: string) => void) | null>(null)
  // Refs para correção do bug de navegação do histórico
  const ultimaConversaTentadaRef = useRef<string | null>(null)
  const prevIsChangingRef = useRef(false)
  // Estado para mensagem pendente (usando state para triggerar re-render)
  const [mensagemPendente, setMensagemPendente] = useState<string | null>(null)

  // Carregar conversa ativa automaticamente quando a página é carregada
  // Isso garante que o histórico seja restaurado quando o usuário volta à página
  // MAS NÃO se tiver parâmetro 'm' (mensagem inicial) - isso significa nova conversa
  useEffect(() => {
    const conversaAtivaDoModo = activeConversationByMode[chatMode as StoreChatMode]
    const temMensagemInicial = searchParams.get('m')
    const temConversaParam = searchParams.get('c')

    // Se tem mensagem inicial ou está processando mensagem inicial, NÃO carregar conversa anterior
    if (temMensagemInicial || processandoMensagemInicialRef.current) {
      conversaCarregadaRef.current = null
      return
    }

    // Se está em loading (streaming), não interferir
    if (loading) {
      return
    }

    // Se já tem mensagens carregadas, não sobrescrever
    if (mensagens.length > 0) {
      return
    }

    // Se tem parâmetro de conversa específico, será tratado pelo outro useEffect
    if (temConversaParam) {
      return
    }

    // Se há uma conversa ativa salva no localStorage e ainda não carregamos mensagens
    // E não tentamos carregar esta conversa ainda (evita loop infinito se der 404)
    if (conversaAtivaDoModo && conversaCarregadaRef.current !== conversaAtivaDoModo) {
      conversaCarregadaRef.current = conversaAtivaDoModo
      carregarConversa(conversaAtivaDoModo)
    }
  }, [activeConversationByMode, chatMode, mensagens.length, loading, carregarConversa, searchParams])

  // NOVO: Reagir às mudanças da store de conversas (troca dinâmica de conversa)
  // Isso permite trocar de conversa SEM reload da página
  const { conversaSelecionada: storeConversaSelecionada, isChangingConversa } = useConversaStore()

  useEffect(() => {
    // Se a store está mudando de conversa e é diferente da atual
    // IMPORTANTE: NÃO interferir se estiver em loading/streaming
    // CORREÇÃO: Removido !isChangingConversa para evitar race condition
    if (storeConversaSelecionada && storeConversaSelecionada !== conversaAtual && !loading && !streaming) {
      // Evitar carregar a mesma conversa múltiplas vezes
      if (ultimaConversaTentadaRef.current === storeConversaSelecionada) {
        return
      }
      console.log('[IA Page] Store mudou conversa:', storeConversaSelecionada)
      ultimaConversaTentadaRef.current = storeConversaSelecionada
      carregarConversa(storeConversaSelecionada)
    }
  }, [storeConversaSelecionada, conversaAtual, loading, streaming, carregarConversa])

  // Fallback: quando isChangingConversa muda de true para false, verificar se precisa carregar
  useEffect(() => {
    // Detectar transição de true para false
    if (prevIsChangingRef.current && !isChangingConversa) {
      // A troca de conversa terminou, verificar se a conversa foi carregada
      if (storeConversaSelecionada && storeConversaSelecionada !== conversaAtual && !loading && !streaming) {
        console.log('[IA Page] Fallback: carregando conversa após isChangingConversa=false:', storeConversaSelecionada)
        ultimaConversaTentadaRef.current = storeConversaSelecionada
        carregarConversa(storeConversaSelecionada)
      }
    }
    prevIsChangingRef.current = isChangingConversa
  }, [isChangingConversa, storeConversaSelecionada, conversaAtual, loading, streaming, carregarConversa])

  // Listener para evento customizado de troca de conversa (backup)
  useEffect(() => {
    const handleConversaChanged = (event: CustomEvent<{ conversaId: string | null; previousId: string | null }>) => {
      const { conversaId, previousId } = event.detail
      console.log('[IA Page] Evento conversa-changed:', previousId, '->', conversaId)
      // IMPORTANTE: NÃO interferir se estiver em loading/streaming
      if (conversaId && conversaId !== conversaAtual && !loading && !streaming) {
        carregarConversa(conversaId)
      }
    }

    window.addEventListener('conversa-changed', handleConversaChanged as EventListener)
    return () => {
      window.removeEventListener('conversa-changed', handleConversaChanged as EventListener)
    }
  }, [conversaAtual, loading, streaming, carregarConversa])

  // Sincronizar filtro de artefatos quando o modo de chat muda
  useEffect(() => {
    setCurrentChatMode(chatMode)
    setChatModeFilter(chatMode as StoreChatMode)
  }, [chatMode, setCurrentChatMode, setChatModeFilter])

  // Processar parâmetros da URL (m = mensagem inicial, c = conversa)
  useEffect(() => {
    if (!user) return

    const mensagemInicial = searchParams.get('m')
    const conversaId = searchParams.get('c')

    // Se tem conversa ID, carregar conversa
    if (conversaId && !mensagemInicial) {
      // Não interromper se estiver em streaming
      if (loading || streaming) {
        console.log('[IA Page] Ignorando carregamento - streaming em andamento')
        return
      }
      // Não recarregar se já é a conversa atual
      if (conversaAtual === conversaId) {
        console.log('[IA Page] Ignorando carregamento - já é a conversa atual')
        return
      }
      // Não carregar se ainda está processando mensagem inicial
      if (processandoMensagemInicialRef.current) {
        console.log('[IA Page] Ignorando carregamento - processando mensagem inicial')
        return
      }
      // CORREÇÃO: Permitir trocar de conversa mesmo com mensagens
      // A condição anterior bloqueava troca de conversas
      console.log('[IA Page] Carregando conversa via URL:', conversaId)
      carregarConversa(conversaId)
      return
    }

    // Se tem mensagem inicial e ainda não processamos
    if (mensagemInicial && !mensagemInicialEnviadaRef.current) {
      const decodedMessage = decodeURIComponent(mensagemInicial)

      // Marcar como processada E como processando para bloquear outros useEffects
      mensagemInicialEnviadaRef.current = true
      processandoMensagemInicialRef.current = true

      // IMPORTANTE: Limpar conversa atual para criar uma NOVA conversa
      // MAS NÃO limpar mensagens aqui - elas serão gerenciadas pela função de envio
      setConversaAtual(null)
      // NÃO fazer setMensagens([]) aqui - a função enviarMensagemDireta vai adicionar as mensagens

      // Limpar URL sem recarregar a página
      router.replace('/medicina/dashboard/ia', { scroll: false })

      // Definir mensagem pendente (isso vai triggerar o próximo useEffect)
      setMensagemPendente(decodedMessage)
    }
  }, [user, searchParams, router, carregarConversa, loading, streaming, conversaAtual, mensagens.length])

  // Efeito para enviar mensagem pendente quando disponível
  useEffect(() => {
    if (mensagemPendente && enviarMensagemDiretaRef.current && !loading && user) {
      const msg = mensagemPendente
      setMensagemPendente(null) // Limpar para não enviar novamente
      // Pequeno delay para garantir que estado foi atualizado
      setTimeout(() => {
        enviarMensagemDiretaRef.current?.(msg)
        // Liberar flag após um tempo (depois que o streaming começar)
        setTimeout(() => {
          processandoMensagemInicialRef.current = false
        }, 500)
      }, 50)
    }
  }, [mensagemPendente, loading, user])

  // Função para enviar mensagem diretamente (usado para mensagem inicial)
  const enviarMensagemDireta = useCallback(async (mensagemTexto: string) => {
    if (!mensagemTexto.trim() || !user || loading || !podeUsarIA) return

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    const mensagemUsuario = mensagemTexto.trim()
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

    // Timeout de segurança
    const timeoutId = setTimeout(() => {
      setLoading(false)
      setStreaming(false)
      setMensagens(prev => prev.map(m =>
        m.id === respostaId && !m.conteudo
          ? { ...m, conteudo: 'A resposta demorou muito. Tente novamente.' }
          : m
      ))
    }, 5 * 60 * 1000)

    try {
      const response = await fetch('/api/medicina/ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          mensagem: mensagemUsuario,
          conversa_id: conversaAtual,
          modo: chatMode,
          imagem_base64: imagemBase64,
          imagem_tipo: imagemTipo,
          pdf_base64: pdfBase64,
          use_web_search: useWebSearch,
          use_extended_thinking: useExtendedThinking,
          thinking_budget: 8000,
          chat_mode: chatMode,
          system_prompt_extra: getSystemPrompt()
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao processar mensagem')
      }

      // Processar stream (mesma lógica de enviarMensagem)
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('Stream não disponível')

      let fullResponse = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.slice(6))
              if (data.type === 'text') {
                fullResponse += data.content
                setMensagens(prev => prev.map(m =>
                  m.id === respostaId ? { ...m, conteudo: fullResponse } : m
                ))
              } else if (data.type === 'conversa_created') {
                // ========== ATUALIZAR URL E HISTÓRICO IMEDIATAMENTE ==========
                console.log('[IA Page] Conversa criada (direta):', data.conversa_id)

                // Atualizar URL usando history API (não causa re-render como router.replace)
                // Isso evita interromper o streaming SSE
                window.history.replaceState(
                  { ...window.history.state, conversaId: data.conversa_id },
                  '',
                  `/medicina/dashboard/ia?c=${data.conversa_id}`
                )

                // Atualizar estado da conversa atual
                setConversaAtual(data.conversa_id)
                setActiveConversation(chatMode as StoreChatMode, data.conversa_id)
                setCurrentConversa(data.conversa_id)

                // Adicionar conversa ao histórico local IMEDIATAMENTE
                const novaConversa: Conversa = {
                  id: data.conversa_id,
                  titulo: data.titulo || 'Nova conversa',
                  modelo: data.modelo || (plano === 'residencia' ? 'claude' : 'gemini'),
                  tokens_usados: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
                setConversas(prev => [novaConversa, ...prev.filter(c => c.id !== data.conversa_id)])

                // Usar store para sincronizar com o layout (sidebar)
                console.log('[IA Page] Adicionando conversa via store:', novaConversa.id)
                useConversaStore.getState().addConversa({
                  id: novaConversa.id,
                  titulo: novaConversa.titulo,
                  updated_at: novaConversa.updated_at
                })
                useConversaStore.getState().setConversaSelecionada(novaConversa.id)
              } else if (data.type === 'done') {
                setConversaAtual(data.conversa_id)
                setMensagens(prev => prev.map(m =>
                  m.id === respostaId
                    ? { ...m, tokens: data.tokens?.input + data.tokens?.output, thinking: data.thinking || '' }
                    : m
                ))
                fetchUso()
                fetchConversas()
              }
            } catch {
              // Ignorar erros de parsing
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
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
  }, [user, loading, podeUsarIA, conversaAtual, chatMode, imagemBase64, imagemTipo, pdfBase64, useWebSearch, useExtendedThinking, getSystemPrompt, fetchUso, fetchConversas, router, setActiveConversation, setCurrentConversa, plano])

  // Atualizar ref quando a função muda
  useEffect(() => {
    enviarMensagemDiretaRef.current = enviarMensagemDireta
  }, [enviarMensagemDireta])

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

  // Função para iniciar simulação de atendimento
  const iniciarSimulacao = useCallback((config: SimulacaoConfigData) => {
    setShowSimulacaoConfig(false)

    // Ativar ficha de anamnese se configurado
    if (config.usarFichaAnamnese) {
      setFichaAtiva(true)
      setDadosFicha({
        identificacao: {},
        interrogatorio: {},
        exameFisico: {}
      })
    } else {
      setFichaAtiva(false)
    }

    const prompt = gerarPromptSimulacao(config)
    setInput(prompt)
    // Enviar automaticamente após um pequeno delay para permitir que o input seja atualizado
    setTimeout(() => {
      const enviarBtn = document.querySelector('[data-enviar-btn]') as HTMLButtonElement
      if (enviarBtn) {
        enviarBtn.click()
      }
    }, 100)
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
          modo: chatMode, // Incluir modo da conversa
          imagem_base64: imagemBase64,
          imagem_tipo: imagemTipo,
          pdf_base64: pdfBase64,
          use_web_search: useWebSearch,
          use_extended_thinking: useExtendedThinking,
          thinking_budget: 8000,
          chat_mode: chatMode,
          system_prompt_extra: getSystemPrompt()
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

      // Batching para reduzir re-renders durante streaming
      // Intervalo maior para chunks com imagens (aumentado para suavidade)
      let lastUpdateTime = 0
      const UPDATE_INTERVAL_NORMAL = 150 // ms para texto normal (aumentado para suavidade)
      const UPDATE_INTERVAL_IMAGES = 500 // ms para chunks com imagens (aumentado para evitar flickering)
      let pendingUpdate = false
      let pendingAnimationFrame: number | null = null

      const updateUI = (force = false, hasImages = false) => {
        const now = Date.now()
        const interval = hasImages ? UPDATE_INTERVAL_IMAGES : UPDATE_INTERVAL_NORMAL

        if (force || now - lastUpdateTime >= interval) {
          lastUpdateTime = now
          pendingUpdate = false

          // Cancelar animation frame pendente
          if (pendingAnimationFrame) {
            cancelAnimationFrame(pendingAnimationFrame)
            pendingAnimationFrame = null
          }

          // Usar requestAnimationFrame + startTransition para updates mais suaves
          pendingAnimationFrame = requestAnimationFrame(() => {
            startTransition(() => {
              setMensagens(prev => prev.map(m =>
                m.id === respostaId
                  ? { ...m, conteudo: fullResponse }
                  : m
              ))
            })
          })
        } else if (!pendingUpdate) {
          pendingUpdate = true
          setTimeout(() => updateUI(true, hasImages), interval - (now - lastUpdateTime))
        }
      }

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
                // Detectar se o chunk contém imagens para usar intervalo maior
                const hasImages = data.content.includes('![') ||
                                  data.content.includes('📷') ||
                                  data.content.includes('[IMAGE_SEARCH:') ||
                                  data.content.includes('imagens médicas')
                updateUI(false, hasImages) // Usa batching com intervalo maior para imagens
              } else if (data.type === 'tool_result') {
                // Tool foi executada
                console.log('[IA Page] Tool result recebido:', data.tool_name)

                // Processar imagem gerada
                if (data.tool_name === 'gerar_imagem_medica' && (data.result?.imagem_url || data.result?.imagem_base64)) {
                  console.log('[IA Page] Imagem gerada! Adicionando ao chat...')

                  // Preferir URL do storage, fallback para base64
                  const storageUrl = data.result.imagem_url?.startsWith('http') ? data.result.imagem_url : null
                  const displayUrl = data.result.imagem_base64 || data.result.imagem_url
                  console.log('[IA Page] Storage URL:', storageUrl ? 'disponível' : 'não disponível')
                  console.log('[IA Page] Display URL length:', displayUrl?.length || 0)

                  // Armazenar imagem para renderização
                  const imagemId = `img-${Date.now()}`

                  // Adicionar marcador especial no conteúdo com a URL do storage para persistência
                  // Formato: [GENERATED_IMAGE:id:storageUrl]
                  const imagemMarcador = storageUrl
                    ? `\n\n[GENERATED_IMAGE:${imagemId}:${storageUrl}]\n\n*Imagem gerada com DALL-E 3 para fins educacionais.*`
                    : `\n\n[GENERATED_IMAGE:${imagemId}]\n\n*Imagem gerada com DALL-E 3 para fins educacionais.*`
                  fullResponse += imagemMarcador

                  // Atualizar mensagem com marcador e dados da imagem
                  setMensagens(prev => prev.map(m =>
                    m.id === respostaId
                      ? {
                          ...m,
                          conteudo: fullResponse,
                          imagemGerada: {
                            id: imagemId,
                            url: displayUrl, // URL para exibição imediata (pode ser base64)
                            storageUrl: storageUrl, // URL permanente do storage
                            estrutura: data.result.estrutura || 'Imagem Médica',
                            descricao: data.result.descricao || ''
                          }
                        }
                      : m
                  ))

                  // Adicionar aos artefatos e abrir sidebar
                  try {
                    const { addImageArtifact, setSidebarOpen, artifacts } = useArtifactsStore.getState()
                    console.log('[IA Page] Artefatos ANTES:', artifacts.length)

                    const newArtifactId = addImageArtifact(
                      {
                        url: storageUrl || displayUrl, // Preferir storage URL para persistência
                        source: 'generated',
                        prompt: data.result.descricao || '',
                        structure: data.result.estrutura || '',
                        imageType: data.result.tipo || 'anatomy'
                      },
                      `Imagem: ${data.result.estrutura || 'Ilustração Médica'}`,
                      conversaAtual || '',
                      respostaId
                    )

                    // Verificar estado após adicionar
                    const stateAfter = useArtifactsStore.getState()
                    console.log('[IA Page] Artefatos DEPOIS:', stateAfter.artifacts.length)
                    console.log('[IA Page] Novo artefato ID:', newArtifactId)
                    console.log('[IA Page] Imagem adicionada aos artefatos!')
                  } catch (err) {
                    console.error('[IA Page] Erro ao adicionar artefato:', err)
                  }
                }
              } else if (data.type === 'conversa_created') {
                // ========== ATUALIZAR URL E HISTÓRICO IMEDIATAMENTE ==========
                console.log('[IA Page] Conversa criada:', data.conversa_id)

                // Atualizar URL usando history API (não causa re-render como router.replace)
                // Isso evita interromper o streaming SSE
                window.history.replaceState(
                  { ...window.history.state, conversaId: data.conversa_id },
                  '',
                  `/medicina/dashboard/ia?c=${data.conversa_id}`
                )

                // Atualizar estado da conversa atual
                setConversaAtual(data.conversa_id)
                setActiveConversation(chatMode as StoreChatMode, data.conversa_id)
                setCurrentConversa(data.conversa_id)

                // Adicionar conversa ao histórico local IMEDIATAMENTE
                const novaConversa: Conversa = {
                  id: data.conversa_id,
                  titulo: data.titulo || 'Nova conversa',
                  modelo: data.modelo || (plano === 'residencia' ? 'claude' : 'gemini'),
                  tokens_usados: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
                setConversas(prev => [novaConversa, ...prev.filter(c => c.id !== data.conversa_id)])

                // Atualizar store global para o layout reagir
                console.log('[IA Page] Atualizando store com conversa:', novaConversa)
                useConversaStore.getState().addConversa({
                  id: novaConversa.id,
                  titulo: novaConversa.titulo,
                  updated_at: novaConversa.updated_at
                })
                useConversaStore.getState().setConversaSelecionada(novaConversa.id)
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
    // Atualizar store de modos
    setActiveConversation(chatMode as StoreChatMode, null)
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

  // Renomear conversa
  const renomearConversa = async (id: string, novoTitulo: string) => {
    if (!user || !novoTitulo.trim()) return
    try {
      const response = await fetch(`/api/medicina/ia/conversa/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: novoTitulo.trim(), user_id: user.id })
      })
      if (response.ok) {
        setConversas(prev => prev.map(c =>
          c.id === id ? { ...c, titulo: novoTitulo.trim() } : c
        ))
        setConversaRenomeando(null)
        setNovoTituloConversa('')
      }
    } catch (error) {
      console.error('Erro ao renomear conversa:', error)
    }
  }

  // Iniciar renomeação
  const iniciarRenomeacao = (conv: Conversa) => {
    setConversaRenomeando(conv.id)
    setNovoTituloConversa(conv.titulo)
    setMenuConversaAberto(null)
  }

  // Copiar resposta
  const copiarResposta = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto)
    setCopiado(id)
    setTimeout(() => setCopiado(null), 2000)
  }

  // Handler para questões respondidas
  const handleQuestaoResponder = useCallback(async (
    questao: QuestaoData,
    letra: string,
    acertou: boolean,
    tempoSegundos: number
  ) => {
    // Marcar como respondida
    setQuestoesRespondidas(prev => new Set([...prev, questao.numero]))

    // Registrar na API
    await registrarQuestao({
      questao_json: questao as unknown as Record<string, unknown>,
      resposta_usuario: letra,
      resposta_correta: questao.gabarito_comentado.resposta_correta,
      acertou,
      tempo_resposta_segundos: tempoSegundos,
      tema: questao.tema,
      dificuldade: questao.dificuldade
    })

    // Atualizar estatísticas
    refreshEstatisticas()
  }, [registrarQuestao, refreshEstatisticas])

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
    <div className={`h-[calc(100dvh-64px)] lg:h-[calc(100dvh-0px)] flex flex-col md:flex-row transition-all duration-300 ${
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
            fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-white z-50
            transform transition-transform duration-300 ease-out
            ${showConversas ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="h-full flex flex-col p-4">
              {/* Header do drawer */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800 font-semibold">Conversas</h3>
                <button
                  onClick={() => setShowConversas(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-600" />
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
                    className={`group p-3 rounded-lg cursor-pointer transition-colors relative ${
                      conversaAtual === conv.id ? 'bg-purple-500/20' : 'hover:bg-slate-100'
                    }`}
                    onClick={() => {
                      if (conversaRenomeando !== conv.id) {
                        carregarConversa(conv.id)
                        setShowConversas(false)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Modo de renomeação */}
                        {conversaRenomeando === conv.id ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={novoTituloConversa}
                              onChange={(e) => setNovoTituloConversa(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') renomearConversa(conv.id, novoTituloConversa)
                                if (e.key === 'Escape') { setConversaRenomeando(null); setNovoTituloConversa('') }
                              }}
                              className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-sm text-slate-800 focus:outline-none focus:border-purple-500"
                              autoFocus
                            />
                            <button
                              onClick={() => renomearConversa(conv.id, novoTituloConversa)}
                              className="p-1 hover:bg-emerald-500/20 rounded"
                            >
                              <Check className="w-4 h-4 text-emerald-400" />
                            </button>
                            <button
                              onClick={() => { setConversaRenomeando(null); setNovoTituloConversa('') }}
                              className="p-1 hover:bg-red-500/20 rounded"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-slate-700 text-sm truncate">{conv.titulo}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                conv.modelo === 'claude' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {conv.modelo === 'claude' ? 'Claude' : 'Gemini'}
                              </span>
                              <span className="text-slate-500 text-xs">
                                {new Date(conv.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Menu 3 pontinhos */}
                      {conversaRenomeando !== conv.id && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setMenuConversaAberto(menuConversaAberto === conv.id ? null : conv.id)
                            }}
                            className="p-1 hover:bg-slate-100 rounded transition-all"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-500" />
                          </button>

                          {/* Dropdown do menu */}
                          {menuConversaAberto === conv.id && (
                            <div
                              className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 min-w-[140px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setMenuConversaAberto(null)
                                  carregarConversa(conv.id)
                                  setShowConversas(false)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                              >
                                <FolderOpen className="w-4 h-4" />
                                Abrir
                              </button>
                              <button
                                onClick={() => iniciarRenomeacao(conv)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                                Renomear
                              </button>
                              <button
                                onClick={() => {
                                  setMenuConversaAberto(null)
                                  deletarConversa(conv.id)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Estatísticas de Uso */}
              {uso && (
                <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-200">
                  <h4 className="text-slate-600 text-xs font-medium mb-2">Uso este mês</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Chats</span>
                      <span>{uso.uso_mes.chats}{uso.limites.chats !== -1 && `/${uso.limites.chats}`}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Tokens</span>
                      <span>{((uso.uso_mes.tokens_input + uso.uso_mes.tokens_output) / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null /* DESKTOP: Histórico agora está na sidebar principal do layout */}

      {/* Chat Principal */}
      <div className="flex-1 flex flex-col relative min-h-0 overflow-hidden">
        {/* Mobile Header - Barra limpa: título + artefatos */}
        <div className="lg:hidden flex items-center justify-between px-3 py-2.5 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          {/* Título do Chat */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-800 truncate">
              {tituloConversa || 'Nova Conversa'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Indicador de Ficha - Mobile */}
            {fichaAtiva && chatMode === 'caso_clinico' && (
              <IndicadorProgresso
                itensPreenchidos={fichaItensPreenchidos}
                totalItens={7}
                onClick={() => setFichaAberta(true)}
              />
            )}
            {/* Botão Artefatos - Mobile */}
            {hasArtifacts && (
              <button
                onClick={() => setMobileArtifactsOpen(true)}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 active:bg-slate-100 transition-colors"
              >
                <Layers className="w-4 h-4 text-slate-600" />
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-emerald-500 text-white text-[9px] font-bold rounded-full px-1">
                  {useArtifactsStore.getState().artifacts.filter(a => a.conversaId === conversaAtual || !a.conversaId).length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Header Desktop - Oculto no mobile (já tem barra de modo acima) */}
        <div className="hidden lg:flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Botão menu/conversas - apenas mobile (desktop usa sidebar do layout) */}
            {isMobile && (
              <button
                onClick={() => setShowConversas(!showConversas)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu className="w-4 h-4 text-slate-600" />
              </button>
            )}

            {/* Logo e info - Compacto */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <Brain className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xs md:text-sm font-bold text-slate-800">PREPARAMED IA</h1>
                <p className="text-slate-500 text-[9px] md:text-[10px] hidden sm:block">
                  {isResidencia ? 'Claude Opus | Ilimitado' : `Gemini Flash | ${uso?.uso_mes.chats || 0}/100`}
                </p>
              </div>
            </div>

          </div>

          <div className="flex items-center gap-2">
            {/* Indicador de Ficha - Desktop */}
            {fichaAtiva && chatMode === 'caso_clinico' && (
              <IndicadorProgresso
                itensPreenchidos={fichaItensPreenchidos}
                totalItens={7}
                onClick={() => setFichaAberta(true)}
              />
            )}

            {isResidencia && <Crown className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />}
            <button
              onClick={() => setShowOpcoes(!showOpcoes)}
              className={`p-1.5 rounded-lg transition-colors ${
                showOpcoes ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
        </div>

        {/* Opções Avançadas */}
        {showOpcoes && isResidencia && (
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 bg-white text-emerald-500 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 text-blue-500" />
                <span className="text-slate-700 text-sm">Busca Web</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useExtendedThinking}
                  onChange={(e) => setUseExtendedThinking(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 bg-white text-emerald-500 focus:ring-emerald-500"
                />
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-slate-700 text-sm">Extended Thinking</span>
              </label>
            </div>
          </div>
        )}

        {/* Chat Area - Responsivo e Compacto com CSS contain para anti-flickering */}
        {/* pb-24 lg:pb-0 para acomodar bottom nav no mobile */}
        <div
          ref={chatRef}
          className="flex-1 min-h-0 overflow-y-auto p-2 md:p-4 lg:p-5 pb-28 lg:pb-5 space-y-2 md:space-y-3"
          style={{ contain: 'layout style', willChange: streaming ? 'scroll-position' : 'auto' }}
        >
          {/* Loading ao abrir conversa */}
          {carregandoConversa && mensagens.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-3 md:mb-4">
                <Loader2 className="w-7 h-7 md:w-8 md:h-8 text-emerald-500 animate-spin" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-1.5">Carregando conversa...</h2>
              <p className="text-slate-500 text-xs md:text-sm">Aguarde um momento</p>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-4xl mx-auto w-full">
              {/* Seletor de Modo - Novo ModeSelector integrado */}
              <div className="mb-6 w-full max-w-xl flex justify-center">
                <ModeSelector
                  onModeChange={(modo) => trocarModo(modo as ChatMode)}
                  variant="full"
                />
              </div>

              {/* Configurador de Simulação de Atendimento (modo caso_clinico) */}
              {showSimulacaoConfig && chatMode === 'caso_clinico' && (
                <SimulacaoConfig
                  onStart={iniciarSimulacao}
                  onCancel={() => setShowSimulacaoConfig(false)}
                />
              )}

              {/* Intro do modo ou sugestões */}
              {mostrarIntro && !showSimulacaoConfig ? (
                <ChatModeIntro modo={chatMode} onStart={iniciarModo} />
              ) : !showSimulacaoConfig ? (
                <>
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-3 md:mb-4 shadow-sm">
                    <Brain className="w-7 h-7 md:w-8 md:h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-1.5">Como posso ajudar?</h2>
                  <p className="text-slate-500 mb-4 md:mb-6 max-w-md text-xs md:text-sm">
                    {isResidencia
                      ? 'Tire dúvidas, analise imagens, PDFs e use busca na web para informações atualizadas.'
                      : 'Tire dúvidas sobre medicina, peça explicações de conceitos ou ajuda com questões.'}
                  </p>

                  {/* Sugestões Inteligentes - Tópicos personalizados */}
                  {sugestoesInteligentes.topics.length > 0 && (
                    <div className="w-full max-w-xl mb-4">
                      <p className="text-slate-400 text-xs mb-2 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Baseado no seu histórico
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sugestoesInteligentes.topics.slice(0, 4).map((sugestao, i) => (
                          <button
                            key={`topic-${i}`}
                            onClick={() => setInput(sugestao.fullPrompt)}
                            className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors text-left border border-emerald-200 hover:border-emerald-300 shadow-sm"
                          >
                            <span className="text-lg flex-shrink-0">{sugestao.icon}</span>
                            <span className="text-slate-700 text-xs md:text-sm line-clamp-2">{sugestao.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sugestões de Revisão */}
                  {sugestoesInteligentes.reviews.length > 0 && (
                    <div className="w-full max-w-xl mb-4">
                      <p className="text-slate-400 text-xs mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Revisões pendentes
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {sugestoesInteligentes.reviews.slice(0, 2).map((sugestao, i) => (
                          <button
                            key={`review-${i}`}
                            onClick={() => setInput(sugestao.fullPrompt)}
                            className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors text-left border border-amber-200 hover:border-amber-300 shadow-sm"
                          >
                            <span className="text-lg flex-shrink-0">{sugestao.icon}</span>
                            <span className="text-slate-700 text-xs md:text-sm">{sugestao.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botão de Simulação de Atendimento (modo caso_clinico) */}
                  {chatMode === 'caso_clinico' && (
                    <div className="w-full max-w-xl mb-4">
                      <button
                        onClick={() => setShowSimulacaoConfig(true)}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl hover:from-emerald-100 hover:to-teal-100 transition-all text-left border border-emerald-200 hover:border-emerald-300 group shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Stethoscope className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-emerald-700 font-semibold block">Simulação de Atendimento</span>
                          <span className="text-slate-500 text-xs">Configure especialidade, dificuldade e cenário</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                      </button>
                    </div>
                  )}

                  {/* Sugestões padrão ou ações */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 w-full max-w-xl">
                    {(sugestoesInteligentes.actions.length > 0 ? sugestoesInteligentes.actions : sugestoes).map((sugestao, i) => (
                      <button
                        key={i}
                        onClick={() => setInput('fullPrompt' in sugestao ? sugestao.fullPrompt : sugestao.texto)}
                        className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white rounded-xl hover:bg-slate-50 transition-colors text-left border border-slate-200 hover:border-slate-300 shadow-sm"
                      >
                        {'icon' in sugestao && typeof sugestao.icon === 'string' ? (
                          <span className="text-lg flex-shrink-0">{sugestao.icon}</span>
                        ) : 'icon' in sugestao ? (
                          <sugestao.icon className={`w-4 h-4 md:w-5 md:h-5 ${'cor' in sugestao ? sugestao.cor : 'text-blue-400'} flex-shrink-0`} />
                        ) : null}
                        <span className="text-slate-700 text-xs md:text-sm">{'text' in sugestao ? sugestao.text : sugestao.texto}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            mensagens.map((msg) => (
              <MemoizedMessage
                key={msg.id}
                msg={msg}
                streaming={streaming}
                copiado={copiado}
                copiarResposta={copiarResposta}
                user={user}
                conversaAtual={conversaAtual}
                chatMode={chatMode as ChatModeType}
                plano={(plano || 'gratuito') as PlanoUsuario}
                trialAtivo={trialStatus.ativo}
                onQuestaoResponder={handleQuestaoResponder}
                questoesRespondidas={questoesRespondidas}
              />
            ))
          )}

          {loading && !mensagens.find(m => m.tipo === 'ia' && m.conteudo === '') && (
            <div className="flex gap-2 md:gap-3">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="bg-slate-100 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200">
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
                className="text-slate-500 hover:text-red-400 transition-colors underline"
              >
                cancelar
              </button>
            </div>
          </div>
        )}

        {/* Input Area - Compacto */}
        <div className="px-2 md:px-3 py-2 border-t border-slate-200 bg-slate-50">
          <div className="relative">
            {/* Container do input com borda visual */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl md:rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500/30 transition-all">

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
              <div className="flex items-center justify-between px-2 md:px-4 py-2 border-t border-slate-200 bg-white/[0.02]">
                {/* Botões de ação à esquerda */}
                <div className="flex items-center gap-0.5 md:gap-1">
                  {isResidencia && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 md:p-2 text-slate-500 hover:text-white hover:bg-slate-100 rounded-lg transition-colors"
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
                        className="p-1.5 md:p-2 text-slate-500 hover:text-white hover:bg-slate-100 rounded-lg transition-colors"
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
                      <div className="w-px h-4 bg-slate-100 mx-0.5 md:mx-1" />

                      {/* Toggle Web Search */}
                      <button
                        onClick={() => setUseWebSearch(!useWebSearch)}
                        className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                          useWebSearch
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-slate-500 hover:text-white hover:bg-slate-100'
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
                            : 'text-slate-500 hover:text-white hover:bg-slate-100'
                        }`}
                        title="Extended Thinking"
                      >
                        <Zap className="w-4 h-4" />
                      </button>

                      {/* Separador */}
                      <div className="w-px h-4 bg-slate-100 mx-0.5 md:mx-1" />

                      {/* Botão Análise de Exames */}
                      <button
                        onClick={() => setShowExamAnalyzer(true)}
                        className="p-1.5 md:p-2 text-slate-500 hover:text-white hover:bg-slate-100 rounded-lg transition-colors"
                        title="Analisar Exame"
                      >
                        <Stethoscope className="w-4 h-4" />
                      </button>

                      {/* Botão de Voz */}
                      <VoiceButton
                        onTranscription={(text) => setInput(prev => prev + ' ' + text)}
                        variant="compact"
                      />
                    </>
                  )}
                </div>

                {/* Botão enviar/cancelar à direita */}
                <button
                  data-enviar-btn
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

          {/* Dica de atalho - apenas desktop */}
          <p className="hidden lg:block text-center text-white/15 text-[8px] mt-0.5">
            Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </div>

      {/* Sidebar de Artefatos */}
      <ArtifactsSidebar userId={user?.id} />

      {/* Drawer da Ficha de Anamnese */}
      {fichaAtiva && (
        <FichaDrawer
          isOpen={fichaAberta}
          onClose={() => setFichaAberta(false)}
          dados={dadosFicha}
        />
      )}

      {/* Modal de Análise de Exames */}
      <ExamAnalyzerModal
        isOpen={showExamAnalyzer}
        onClose={() => setShowExamAnalyzer(false)}
        onAnalysis={(analysis) => {
          // Adicionar análise como mensagem no chat
          const novoId = Date.now().toString()
          setMensagens(prev => [...prev, {
            id: novoId,
            tipo: 'system' as const,
            conteudo: `📋 **Análise de Exame:**\n\n${analysis}`,
            timestamp: new Date()
          }])
          setShowExamAnalyzer(false)
        }}
      />

      {/* ========================================== */}
      {/* COMPONENTES MOBILE */}
      {/* ========================================== */}

      {/* Tela de Artefatos - Mobile (Fullscreen) */}
      <MobileArtifactsScreen
        isOpen={mobileArtifactsOpen}
        onClose={() => setMobileArtifactsOpen(false)}
      />
    </div>
  )
}

