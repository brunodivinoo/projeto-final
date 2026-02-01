'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  MessageSquare,
  Search,
  Grid3X3,
  Filter,
  FolderOpen,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  FileQuestion,
  Layers,
  BookOpen,
  Zap
} from 'lucide-react'
import { useArtifactsStore, ARTIFACT_ICONS, ARTIFACT_LABELS, type Artifact, type ArtifactType } from '@/stores/artifactsStore'

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
// TELA FULLSCREEN DE ARTEFATOS (MOBILE)
// ==========================================

export function MobileArtifactsScreen({ isOpen, onClose, onViewArtifact }: MobileArtifactsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<ArtifactType | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Obter artefatos do store
  const artifacts = useArtifactsStore(state => state.artifacts)
  const currentConversaId = useArtifactsStore(state => state.currentConversaId)

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

  // Fechar com ESC
  if (typeof window !== 'undefined') {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-900 flex flex-col lg:hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-3 border-b border-slate-200 bg-slate-900">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-semibold text-white">Artefatos</h2>
                <p className="text-xs text-slate-500">{filteredArtifacts.length} itens</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
                  showFilters ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 active:bg-slate-100 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Barra de Busca */}
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar artefatos..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-all"
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
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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
          <div className="flex-1 overflow-y-auto">
            {filteredArtifacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <FolderOpen className="w-16 h-16 text-white/10 mb-4" />
                <p className="text-slate-500 text-sm">
                  {searchQuery ? 'Nenhum artefato encontrado' : 'Nenhum artefato ainda. Peca ao assistente para criar!'}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredArtifacts.map((artifact) => {
                  const Icon = TYPE_ICONS[artifact.type] || TYPE_ICONS.default
                  const typeLabel = ARTIFACT_LABELS[artifact.type] || artifact.type

                  return (
                    <motion.button
                      key={artifact.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onViewArtifact?.(artifact)
                        onClose()
                      }}
                      className="w-full flex items-start gap-3 p-4 bg-slate-100 hover:bg-white/8 border border-slate-200 rounded-xl text-left transition-colors"
                    >
                      {/* Ícone */}
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-emerald-400" />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">
                          {artifact.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded">
                            {typeLabel}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(artifact.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <ChevronDown className="w-4 h-4 text-white/20 -rotate-90 flex-shrink-0 mt-1" />
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Safe Area Bottom */}
          <div className="pb-[env(safe-area-inset-bottom,0px)]" />
        </motion.div>
      )}
    </AnimatePresence>
  )
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
