'use client'

import { useEffect, useCallback, useState, useMemo } from 'react'
import {
  X,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers
} from 'lucide-react'
import { useArtifactsStore, ARTIFACT_ICONS, ARTIFACT_LABELS, type Artifact, type ArtifactType } from '@/stores/artifactsStore'
import dynamic from 'next/dynamic'

// Importar MermaidDiagram dinamicamente
const MermaidDiagram = dynamic(() => import('./MermaidDiagram'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  )
})

// Importar InteractiveDiagram dinamicamente
const InteractiveDiagram = dynamic(() => import('./InteractiveDiagram'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  )
})

interface ArtifactsSidebarProps {
  className?: string
}

// Componente para renderizar conteúdo do artefato
function ArtifactContent({ artifact, isFullscreen = false }: { artifact: Artifact; isFullscreen?: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(artifact.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [artifact.content])

  const containerClass = isFullscreen ? 'max-h-[70vh] overflow-auto' : ''

  // Renderização baseada no tipo
  switch (artifact.type) {
    case 'diagram':
    case 'flowchart':
      return (
        <div className={`relative ${containerClass}`}>
          <MermaidDiagram chart={artifact.content} title={artifact.title} />
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
            title="Copiar código"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/60" />}
          </button>
        </div>
      )

    case 'ecg':
      return (
        <div className={`p-4 bg-slate-900 rounded-lg ${containerClass}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💓</span>
            <h4 className="text-white font-medium">{artifact.title}</h4>
          </div>
          {/* ECG Visualization */}
          <div className="relative h-32 bg-black rounded-lg overflow-hidden">
            <svg viewBox="0 0 400 100" className="w-full h-full">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a3d2e" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* ECG Line - Normal Sinus Rhythm */}
              <path
                d="M0,50 L20,50 L25,50 L30,30 L35,70 L40,50 L60,50 L65,50 L70,10 L75,90 L80,50 L100,50 L120,50 L125,50 L130,30 L135,70 L140,50 L160,50 L165,50 L170,10 L175,90 L180,50 L200,50 L220,50 L225,50 L230,30 L235,70 L240,50 L260,50 L265,50 L270,10 L275,90 L280,50 L300,50 L320,50 L325,50 L330,30 L335,70 L340,50 L360,50 L365,50 L370,10 L375,90 L380,50 L400,50"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                className="animate-pulse"
              />
            </svg>
          </div>
          <div className="mt-3 text-white/60 text-sm whitespace-pre-wrap">
            {artifact.content}
          </div>
        </div>
      )

    case 'comparison':
      return (
        <div className={`p-4 ${containerClass}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚖️</span>
            <h4 className="text-white font-medium">{artifact.title}</h4>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-white/80">{artifact.content}</div>
          </div>
        </div>
      )

    case 'checklist':
      return (
        <div className={`p-4 ${containerClass}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">✅</span>
            <h4 className="text-white font-medium">{artifact.title}</h4>
          </div>
          <div className="space-y-2">
            {artifact.content.split('\n').map((line, i) => {
              const isChecked = line.includes('[x]')
              const text = line.replace(/\[[ x]\]/g, '').trim()
              if (!text) return null
              return (
                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    defaultChecked={isChecked}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className={`text-sm ${isChecked ? 'text-white/40 line-through' : 'text-white/80'}`}>
                    {text}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )

    case 'timeline':
      return (
        <div className={`p-4 ${containerClass}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📅</span>
            <h4 className="text-white font-medium">{artifact.title}</h4>
          </div>
          <div className="relative border-l-2 border-emerald-500/30 pl-4 space-y-4">
            {artifact.content.split('\n').filter(l => l.trim()).map((line, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                <p className="text-white/80 text-sm">{line}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'table':
      return (
        <div className={`p-4 overflow-x-auto ${containerClass}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📋</span>
            <h4 className="text-white font-medium">{artifact.title}</h4>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="text-white/80 text-sm whitespace-pre-wrap">{artifact.content}</pre>
          </div>
        </div>
      )

    case 'code':
      return (
        <div className={`relative ${containerClass}`}>
          <pre className="p-4 bg-slate-900 rounded-lg overflow-x-auto text-sm font-mono text-white/80">
            {artifact.content}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
            title="Copiar código"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/60" />}
          </button>
        </div>
      )

    case 'interactive':
      // Detectar o tipo de diagrama interativo pelo conteúdo
      const interactiveType = artifact.content.toLowerCase().includes('ecg') ||
                              artifact.content.toLowerCase().includes('iam') ||
                              artifact.content.toLowerCase().includes('infarto')
        ? 'ecg' as const
        : artifact.content.toLowerCase().includes('metabol') ||
          artifact.content.toLowerCase().includes('glic') ||
          artifact.content.toLowerCase().includes('krebs')
        ? 'metabolism' as const
        : 'ecg' as const

      return (
        <div className={containerClass}>
          <InteractiveDiagram type={interactiveType} title={artifact.title} />
        </div>
      )

    default:
      return (
        <div className={`p-4 ${containerClass}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{ARTIFACT_ICONS[artifact.type]}</span>
            <h4 className="text-white font-medium">{artifact.title}</h4>
          </div>
          <div className="text-white/80 text-sm whitespace-pre-wrap">{artifact.content}</div>
        </div>
      )
  }
}

// Modal de tela cheia
function FullscreenModal({
  artifact,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  currentIndex,
  totalCount
}: {
  artifact: Artifact
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
  currentIndex: number
  totalCount: number
}) {
  const [copied, setCopied] = useState(false)

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          if (hasPrevious) onPrevious()
          break
        case 'ArrowRight':
          if (hasNext) onNext()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrevious, onNext, hasPrevious, hasNext])

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{ARTIFACT_ICONS[artifact.type]}</span>
          <div>
            <h2 className="text-white font-semibold text-lg">{artifact.title}</h2>
            <span className="text-white/40 text-sm">{ARTIFACT_LABELS[artifact.type]}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Contador */}
          <span className="text-white/40 text-sm mr-4">
            {currentIndex + 1} / {totalCount}
          </span>

          {/* Copiar */}
          <button
            onClick={handleCopy}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Copiar conteúdo"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>

          {/* Fechar */}
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Fechar (ESC)"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-white/10">
            <ArtifactContent artifact={artifact} isFullscreen />
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-center gap-4 p-4 border-t border-white/10">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            hasPrevious
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Anterior</span>
        </button>

        <div className="text-white/40 text-sm">
          Use ← → para navegar, ESC para fechar
        </div>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            hasNext
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          <span>Próximo</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// Card de artefato para lista vertical
function ArtifactCard({
  artifact,
  isSelected,
  onSelect,
  onRemove,
  onFullscreen
}: {
  artifact: Artifact
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
  onFullscreen: () => void
}) {
  return (
    <div
      className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/10'
          : 'bg-slate-800/50 border-white/5 hover:border-white/20 hover:bg-slate-800/80'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Ícone do tipo */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
          isSelected ? 'bg-purple-500/30' : 'bg-white/5'
        }`}>
          {ARTIFACT_ICONS[artifact.type]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium truncate ${isSelected ? 'text-purple-300' : 'text-white'}`}>
            {artifact.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded ${
              isSelected ? 'bg-purple-500/20 text-purple-300' : 'bg-white/10 text-white/50'
            }`}>
              {ARTIFACT_LABELS[artifact.type]}
            </span>
          </div>
        </div>

        {/* Ações (visíveis no hover) */}
        <div className={`flex items-center gap-1 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <button
            onClick={(e) => { e.stopPropagation(); onFullscreen() }}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Tela cheia"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Remover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview do conteúdo (selecionado) */}
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-purple-500/20">
          <div className="bg-slate-900/50 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
            <ArtifactContent artifact={artifact} />
          </div>
        </div>
      )}
    </div>
  )
}

// Componente principal da Sidebar
export default function ArtifactsSidebar({ className = '' }: ArtifactsSidebarProps) {
  const {
    artifacts,
    selectedArtifactId,
    isSidebarOpen,
    selectArtifact,
    removeArtifact,
    clearArtifacts,
    toggleSidebar,
    setSidebarOpen
  } = useArtifactsStore()

  // Estados locais
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ArtifactType | 'all'>('all')
  const [fullscreenArtifact, setFullscreenArtifact] = useState<Artifact | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filtrar artefatos
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter(artifact => {
      const matchesSearch = searchQuery === '' ||
        artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artifact.content.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter = activeFilter === 'all' || artifact.type === activeFilter

      return matchesSearch && matchesFilter
    })
  }, [artifacts, searchQuery, activeFilter])

  // Tipos disponíveis para filtro
  const availableTypes = useMemo(() => {
    const types = new Set(artifacts.map(a => a.type))
    return Array.from(types) as ArtifactType[]
  }, [artifacts])

  // Navegação no fullscreen
  const currentFullscreenIndex = fullscreenArtifact
    ? filteredArtifacts.findIndex(a => a.id === fullscreenArtifact.id)
    : -1

  const handlePreviousFullscreen = useCallback(() => {
    if (currentFullscreenIndex > 0) {
      setFullscreenArtifact(filteredArtifacts[currentFullscreenIndex - 1])
    }
  }, [currentFullscreenIndex, filteredArtifacts])

  const handleNextFullscreen = useCallback(() => {
    if (currentFullscreenIndex < filteredArtifacts.length - 1) {
      setFullscreenArtifact(filteredArtifacts[currentFullscreenIndex + 1])
    }
  }, [currentFullscreenIndex, filteredArtifacts])

  // Fechar sidebar com ESC (quando não está em fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen && !fullscreenArtifact) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen, setSidebarOpen, fullscreenArtifact])

  // Se não há artefatos, não mostrar nada
  if (artifacts.length === 0) {
    return null
  }

  return (
    <>
      {/* Modal Fullscreen */}
      {fullscreenArtifact && (
        <FullscreenModal
          artifact={fullscreenArtifact}
          onClose={() => setFullscreenArtifact(null)}
          onPrevious={handlePreviousFullscreen}
          onNext={handleNextFullscreen}
          hasPrevious={currentFullscreenIndex > 0}
          hasNext={currentFullscreenIndex < filteredArtifacts.length - 1}
          currentIndex={currentFullscreenIndex}
          totalCount={filteredArtifacts.length}
        />
      )}

      {/* Botão toggle quando sidebar está fechada */}
      {!isSidebarOpen && artifacts.length > 0 && (
        <button
          onClick={toggleSidebar}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
          title="Abrir artefatos"
        >
          <PanelRightOpen className="w-5 h-5" />
          {artifacts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
              {artifacts.length}
            </span>
          )}
        </button>
      )}

      {/* Sidebar Desktop */}
      <div
        className={`fixed top-0 right-0 h-full bg-slate-900/95 backdrop-blur-sm border-l border-white/10 transition-all duration-300 z-50 hidden md:flex flex-col ${
          isSidebarOpen ? 'w-[420px]' : 'w-0'
        } ${className}`}
      >
        {isSidebarOpen && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Artefatos</h3>
                <span className="text-white/40 text-sm">({filteredArtifacts.length})</span>
              </div>
              <div className="flex items-center gap-2">
                {artifacts.length > 0 && (
                  <button
                    onClick={clearArtifacts}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Limpar todos"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Fechar sidebar"
                >
                  <PanelRightClose className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Busca e Filtros */}
            <div className="p-3 border-b border-white/10 space-y-2">
              {/* Campo de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Buscar artefatos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 text-sm"
                />
              </div>

              {/* Toggle filtros */}
              {availableTypes.length > 1 && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    showFilters ? 'bg-purple-500/20 text-purple-400' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtrar por tipo</span>
                  {activeFilter !== 'all' && (
                    <span className="px-1.5 py-0.5 bg-purple-500/30 text-purple-300 rounded text-xs">
                      {ARTIFACT_LABELS[activeFilter]}
                    </span>
                  )}
                </button>
              )}

              {/* Filtros por tipo */}
              {showFilters && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activeFilter === 'all'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Todos
                  </button>
                  {availableTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setActiveFilter(type)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        activeFilter === type
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{ARTIFACT_ICONS[type]}</span>
                      <span>{ARTIFACT_LABELS[type]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de artefatos - VERTICAL */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredArtifacts.length > 0 ? (
                filteredArtifacts.map((artifact) => (
                  <ArtifactCard
                    key={artifact.id}
                    artifact={artifact}
                    isSelected={selectedArtifactId === artifact.id}
                    onSelect={() => selectArtifact(artifact.id)}
                    onRemove={() => removeArtifact(artifact.id)}
                    onFullscreen={() => setFullscreenArtifact(artifact)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Search className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-white/40 text-sm">
                    Nenhum artefato encontrado
                  </p>
                  {(searchQuery || activeFilter !== 'all') && (
                    <button
                      onClick={() => { setSearchQuery(''); setActiveFilter('all') }}
                      className="mt-2 text-purple-400 text-sm hover:underline"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer com dica */}
            <div className="p-3 border-t border-white/10 text-center">
              <p className="text-white/30 text-xs">
                Clique em um artefato para expandir • <Maximize2 className="w-3 h-3 inline" /> para tela cheia
              </p>
            </div>
          </>
        )}
      </div>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-2xl border-t border-white/10 transition-transform duration-300 z-50 md:hidden ${
          isSidebarOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Artefatos</h3>
            <span className="text-white/40 text-sm">({filteredArtifacts.length})</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Busca mobile */}
        <div className="px-4 py-2 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar artefatos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 text-sm"
            />
          </div>
        </div>

        {/* Lista mobile */}
        <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(85vh - 150px)' }}>
          {filteredArtifacts.map((artifact) => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              isSelected={selectedArtifactId === artifact.id}
              onSelect={() => selectArtifact(artifact.id)}
              onRemove={() => removeArtifact(artifact.id)}
              onFullscreen={() => setFullscreenArtifact(artifact)}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// Componente de botão flutuante para abrir artefatos
export function ArtifactsFloatingButton() {
  const { artifacts, toggleSidebar, isSidebarOpen } = useArtifactsStore()

  if (artifacts.length === 0 || isSidebarOpen) return null

  return (
    <button
      onClick={toggleSidebar}
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-105 md:hidden"
    >
      <Layers className="w-5 h-5" />
      <span className="text-sm font-medium">Artefatos</span>
      <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">
        {artifacts.length}
      </span>
    </button>
  )
}
