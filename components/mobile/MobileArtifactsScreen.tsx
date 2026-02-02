'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  X,
  Search,
  Filter,
  FolderOpen,
  ChevronDown,
  ChevronLeft,
  FileText,
  Image as ImageIcon,
  FileQuestion,
  Layers,
  BookOpen,
  Zap,
  Maximize2
} from 'lucide-react'
import { useArtifactsStore, ARTIFACT_ICONS, ARTIFACT_LABELS, type Artifact, type ArtifactType } from '@/stores/artifactsStore'

// Importar componentes de renderização dinamicamente
const FlashcardDeck = dynamic(() => import('../ia/FlashcardDeck'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
    </div>
  )
})

const SimuladoCard = dynamic(() => import('../ia/SimuladoCard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )
})

const QuestionArtifactCard = dynamic(() => import('../ia/QuestionArtifactCard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  )
})

// ==========================================
// TIPOS
// ==========================================

interface MobileArtifactsScreenProps {
  isOpen: boolean
  onClose: () => void
  onViewArtifact?: (artifact: Artifact) => void
}

// ==========================================
// ÍCONES DOS TIPOS DE ARTEFATOS
// ==========================================

const TYPE_ICONS: Record<string, React.ElementType> = {
  question: FileQuestion,
  simulado: BookOpen,
  flashcard: Zap,
  flashcards: Zap,
  diagram: Layers,
  flowchart: Layers,
  image_uploaded: ImageIcon,
  image_generated: ImageIcon,
  pdf_uploaded: FileText,
  document: FileText,
  default: FolderOpen
}

// ==========================================
// RENDERIZADOR DE CONTEÚDO DO ARTEFATO
// ==========================================

function ArtifactContent({ artifact }: { artifact: Artifact }) {
  switch (artifact.type) {
    case 'flashcard':
    case 'flashcards':
      try {
        const flashcardData = artifact.metadata?.flashcards || JSON.parse(artifact.content)
        const cards = flashcardData.cards || flashcardData
        if (Array.isArray(cards) && cards.length > 0) {
          return (
            <div className="p-3 overflow-x-hidden">
              <div className="max-w-full overflow-hidden rounded-xl">
                <FlashcardDeck
                  titulo={flashcardData.titulo || artifact.title}
                  cards={cards}
                />
              </div>
            </div>
          )
        }
      } catch {
        // Fallback
      }
      return (
        <div className="p-6 text-center">
          <p className="text-slate-500">Flashcards disponíveis</p>
        </div>
      )

    case 'simulado':
      try {
        const simuladoData = artifact.metadata?.simulado || JSON.parse(artifact.content)
        if (simuladoData) {
          return (
            <div className="p-3 overflow-x-hidden">
              <div className="max-w-full overflow-hidden rounded-xl bg-white">
                <SimuladoCard simulado={simuladoData} />
              </div>
            </div>
          )
        }
      } catch {
        // Fallback
      }
      return (
        <div className="p-6 text-center">
          <p className="text-slate-500">Simulado disponível</p>
        </div>
      )

    case 'question':
      try {
        const questionData = artifact.metadata?.question
        if (questionData) {
          return (
            <div className="p-3 overflow-x-hidden">
              <div className="max-w-full overflow-hidden rounded-xl shadow-lg">
                <QuestionArtifactCard question={questionData} />
              </div>
            </div>
          )
        }
      } catch {
        // Fallback
      }
      return (
        <div className="p-6 text-center">
          <p className="text-slate-500">Questão disponível</p>
        </div>
      )

    case 'image_uploaded':
    case 'image_generated':
      return (
        <div className="p-4 flex items-center justify-center">
          <img
            src={artifact.metadata?.image?.url || artifact.content}
            alt={artifact.title}
            className="max-w-full max-h-[60vh] rounded-xl object-contain"
          />
        </div>
      )

    default:
      return (
        <div className="p-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-medium text-slate-800 mb-2">{artifact.title}</h4>
            <p className="text-slate-600 text-sm whitespace-pre-wrap">{artifact.content}</p>
          </div>
        </div>
      )
  }
}

// ==========================================
// TELA FULLSCREEN DE ARTEFATOS (MOBILE)
// ==========================================

export function MobileArtifactsScreen({ isOpen, onClose, onViewArtifact }: MobileArtifactsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<ArtifactType | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null)
  const [mounted, setMounted] = useState(false)

  // Montar apenas no cliente para evitar erros de SSR com portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Obter artefatos do store
  const artifacts = useArtifactsStore(state => state.artifacts)
  const currentConversaId = useArtifactsStore(state => state.currentConversaId)
  const storeSelectedId = useArtifactsStore(state => state.selectedArtifactId)

  // Auto-selecionar artefato do store quando abrir
  useMemo(() => {
    if (isOpen && storeSelectedId && !selectedArtifact) {
      const artifact = artifacts.find(a => a.id === storeSelectedId)
      if (artifact) {
        setSelectedArtifact(artifact)
      }
    }
  }, [isOpen, storeSelectedId, artifacts, selectedArtifact])

  // Filtrar artefatos
  const filteredArtifacts = useMemo(() => {
    let filtered = artifacts

    // Filtrar por conversa atual
    if (currentConversaId) {
      filtered = filtered.filter(a => a.conversaId === currentConversaId || !a.conversaId)
    }

    // Filtrar por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.type === filterType)
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [artifacts, currentConversaId, filterType, searchQuery])

  // Tipos disponíveis
  const availableTypes = useMemo(() => {
    const types = new Set(artifacts.map(a => a.type))
    return Array.from(types)
  }, [artifacts])

  // Fechar e limpar seleção
  const handleClose = () => {
    setSelectedArtifact(null)
    onClose()
  }

  // Voltar para lista
  const handleBack = () => {
    setSelectedArtifact(null)
  }

  // Não renderizar no servidor ou se não estiver montado
  if (!mounted) return null

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col lg:hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-3 border-b border-slate-200 bg-white">
            {selectedArtifact ? (
              // Header quando visualizando artefato
              <>
                <button
                  onClick={handleBack}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 active:bg-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1 mx-3 min-w-0">
                  <h2 className="text-sm font-semibold text-slate-800 truncate">{selectedArtifact.title}</h2>
                  <p className="text-xs text-slate-500">{ARTIFACT_LABELS[selectedArtifact.type] || selectedArtifact.type}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500 active:bg-emerald-600 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </>
            ) : (
              // Header da lista
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">Artefatos</h2>
                    <p className="text-xs text-slate-500">{filteredArtifacts.length} itens</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
                      showFilters ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500 active:bg-emerald-600 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Conteúdo */}
          {selectedArtifact ? (
            // Visualizador do artefato
            <div className="flex-1 overflow-y-auto bg-slate-50">
              <ArtifactContent artifact={selectedArtifact} />
            </div>
          ) : (
            // Lista de artefatos
            <>
              {/* Barra de Busca */}
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar artefatos..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtros */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-slate-200"
                  >
                    <div className="px-4 py-3">
                      <p className="text-xs text-slate-500 mb-2">Filtrar por tipo</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setFilterType('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            filterType === 'all'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          Todos
                        </button>
                        {availableTypes.map(type => {
                          const Icon = TYPE_ICONS[type] || TYPE_ICONS.default
                          return (
                            <button
                              key={type}
                              onClick={() => setFilterType(type)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                                filterType === type
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {ARTIFACT_LABELS[type] || type}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lista de Artefatos */}
              <div className="flex-1 overflow-y-auto bg-slate-50">
                {filteredArtifacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <FolderOpen className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-500 text-sm">
                      {searchQuery ? 'Nenhum artefato encontrado' : 'Nenhum artefato ainda. Peça ao assistente para criar!'}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {filteredArtifacts.map((artifact) => {
                      const Icon = TYPE_ICONS[artifact.type] || TYPE_ICONS.default
                      const typeLabel = ARTIFACT_LABELS[artifact.type] || artifact.type

                      // Determinar cor do ícone baseado no tipo
                      let iconBgClass = 'bg-emerald-100'
                      let iconTextClass = 'text-emerald-600'
                      if (artifact.type === 'flashcard' || artifact.type === 'flashcards') {
                        iconBgClass = 'bg-purple-100'
                        iconTextClass = 'text-purple-600'
                      } else if (artifact.type === 'simulado') {
                        iconBgClass = 'bg-blue-100'
                        iconTextClass = 'text-blue-600'
                      } else if (artifact.type === 'question') {
                        iconBgClass = 'bg-emerald-100'
                        iconTextClass = 'text-emerald-600'
                      }

                      return (
                        <motion.button
                          key={artifact.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedArtifact(artifact)}
                          className="w-full flex items-start gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-colors shadow-sm"
                        >
                          {/* Ícone */}
                          <div className={`w-12 h-12 rounded-xl ${iconBgClass} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-6 h-6 ${iconTextClass}`} />
                          </div>

                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-800 truncate">
                              {artifact.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`px-2 py-0.5 ${iconBgClass} ${iconTextClass} text-[10px] font-medium rounded`}>
                                {typeLabel}
                              </span>
                              <span className="text-slate-400 text-[10px]">
                                {new Date(artifact.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>

                          <ChevronDown className="w-5 h-5 text-slate-400 -rotate-90 flex-shrink-0 mt-2" />
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Safe Area Bottom */}
          <div className="pb-[env(safe-area-inset-bottom,0px)]" />
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Usar portal para renderizar diretamente no body, fora do contexto de stacking
  return createPortal(content, document.body)
}

// ==========================================
// BOTÃO DE ARTEFATOS INTEGRADO (HEADER)
// ==========================================

interface MobileArtifactsButtonProps {
  onClick: () => void
  className?: string
}

export function MobileArtifactsButton({ onClick, className = '' }: MobileArtifactsButtonProps) {
  const artifacts = useArtifactsStore(state => state.artifacts)
  const currentConversaId = useArtifactsStore(state => state.currentConversaId)

  // Contar artefatos da conversa atual
  const count = useMemo(() => {
    if (!currentConversaId) return artifacts.length
    return artifacts.filter(a => a.conversaId === currentConversaId || !a.conversaId).length
  }, [artifacts, currentConversaId])

  if (count === 0) return null

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 active:bg-slate-100 transition-colors ${className}`}
    >
      <Layers className="w-4.5 h-4.5 text-slate-600" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-emerald-500 text-white text-[10px] font-bold rounded-full px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}

export default MobileArtifactsScreen
