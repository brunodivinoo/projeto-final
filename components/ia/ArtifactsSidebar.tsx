'use client'

import { useEffect, useCallback, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  Grid3X3,
  List,
  FolderOpen,
  Folder,
  HelpCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { useArtifactsStore, ARTIFACT_ICONS, ARTIFACT_LABELS, type Artifact, type ArtifactType } from '@/stores/artifactsStore'
import dynamic from 'next/dynamic'

// Funções auxiliares para extrair informações do JSON
function tryParseJson(content: string): Record<string, unknown> | null {
  try {
    return JSON.parse(content)
  } catch {
    return null
  }
}

function tryParseTitle(content: string): string | null {
  const data = tryParseJson(content)
  return data?.title as string | null
}

function tryParseLayerCount(content: string): number {
  const data = tryParseJson(content)
  return Array.isArray(data?.layers) ? data.layers.length : 0
}

function tryParseRowCount(content: string): number {
  const data = tryParseJson(content)
  return Array.isArray(data?.rows) ? data.rows.length : 0
}

function tryParseLayerNames(content: string): string[] {
  const data = tryParseJson(content)
  if (!data?.layers || !Array.isArray(data.layers)) return []
  return data.layers.slice(0, 4).map((layer: { name?: string }) => layer.name || 'Camada')
}

function tryParseStagingRows(content: string): string[] {
  const data = tryParseJson(content)
  if (!data?.rows || !Array.isArray(data.rows)) return []
  return data.rows.slice(0, 4).map((row: { stage?: string }) => row.stage || 'Estádio')
}

// Componente de preview para Layers/Anatomy
function PreviewLayersCard({ content, onExpand }: { content: string; onExpand: (e: React.MouseEvent) => void }) {
  const title = tryParseTitle(content)
  const layerCount = tryParseLayerCount(content)
  const layerNames = tryParseLayerNames(content)

  // Cores para as camadas
  const layerColors = ['bg-pink-500/30', 'bg-amber-500/30', 'bg-red-500/30', 'bg-orange-500/30', 'bg-purple-500/30', 'bg-cyan-500/30']

  return (
    <div className="bg-gradient-to-b from-pink-500/10 to-purple-500/10 rounded-lg p-3 border border-white/10">
      <div className="flex items-start gap-3">
        {/* Ícone visual de camadas */}
        <div className="w-12 h-12 rounded-lg bg-slate-900/50 flex flex-col items-center justify-center gap-0.5 overflow-hidden p-1">
          {layerNames.slice(0, 4).map((_, i) => (
            <div
              key={i}
              className={`w-full h-2 rounded-sm ${layerColors[i % layerColors.length]}`}
            />
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-sm font-medium truncate">
            {title || 'Diagrama de Camadas'}
          </p>
          <p className="text-white/40 text-xs mt-1">
            {layerCount} camadas
          </p>

          {/* Mini lista de camadas */}
          {layerNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {layerNames.map((name, i) => (
                <span
                  key={i}
                  className={`px-1.5 py-0.5 rounded text-[10px] ${layerColors[i % layerColors.length]} text-white/70 truncate max-w-[80px]`}
                >
                  {name}
                </span>
              ))}
              {layerCount > 4 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/50">
                  +{layerCount - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onExpand}
        className="w-full mt-3 py-1.5 text-xs text-purple-400 hover:text-purple-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
      >
        Ver diagrama completo ↓
      </button>
    </div>
  )
}

// Componente de preview para Staging Tables
function PreviewStagingCard({ content, onExpand }: { content: string; onExpand: (e: React.MouseEvent) => void }) {
  const title = tryParseTitle(content)
  const rowCount = tryParseRowCount(content)
  const stages = tryParseStagingRows(content)
  const data = tryParseJson(content)
  const cancerType = data?.cancerType as string | undefined

  // Cores para estágios
  const stageColors: Record<string, string> = {
    'tis': 'bg-emerald-500/30 text-emerald-300',
    't1': 'bg-yellow-500/30 text-yellow-300',
    't1a': 'bg-yellow-500/30 text-yellow-300',
    't1b': 'bg-yellow-500/30 text-yellow-300',
    't2': 'bg-orange-500/30 text-orange-300',
    't3': 'bg-red-500/30 text-red-300',
    't4': 'bg-red-700/30 text-red-300',
    't4a': 'bg-red-700/30 text-red-300',
    't4b': 'bg-red-700/30 text-red-300',
  }

  const getStageColor = (stage: string) => {
    const key = stage.toLowerCase()
    return stageColors[key] || 'bg-slate-500/30 text-slate-300'
  }

  return (
    <div className="bg-gradient-to-b from-emerald-500/10 to-cyan-500/10 rounded-lg p-3 border border-white/10">
      <div className="flex items-start gap-3">
        {/* Ícone visual de tabela */}
        <div className="w-12 h-12 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-sm font-medium truncate">
            {title || 'Tabela de Estadiamento'}
          </p>
          {cancerType && (
            <p className="text-white/50 text-xs truncate">{cancerType}</p>
          )}
          <p className="text-white/40 text-xs mt-1">
            {rowCount} estádios
          </p>

          {/* Mini lista de estágios */}
          {stages.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {stages.map((stage, i) => (
                <span
                  key={i}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStageColor(stage)}`}
                >
                  {stage}
                </span>
              ))}
              {rowCount > 4 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/50">
                  +{rowCount - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onExpand}
        className="w-full mt-3 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
      >
        Ver tabela completa ↓
      </button>
    </div>
  )
}

// Componente de preview para Diagramas/Fluxogramas
function PreviewDiagramCard({ content, title, onExpand }: { content: string; title: string; onExpand: (e: React.MouseEvent) => void }) {
  // Detectar tipo de diagrama mermaid
  const diagramType = content.includes('graph TD') || content.includes('graph TB')
    ? 'Fluxograma Vertical'
    : content.includes('graph LR') || content.includes('graph RL')
    ? 'Fluxograma Horizontal'
    : content.includes('sequenceDiagram')
    ? 'Diagrama de Sequência'
    : content.includes('stateDiagram')
    ? 'Diagrama de Estados'
    : content.includes('erDiagram')
    ? 'Diagrama ER'
    : 'Diagrama'

  // Contar nós aproximadamente
  const nodeCount = (content.match(/\[[^\]]+\]/g) || []).length +
                    (content.match(/\{[^\}]+\}/g) || []).length +
                    (content.match(/\([^\)]+\)/g) || []).length

  return (
    <div className="bg-gradient-to-b from-blue-500/10 to-cyan-500/10 rounded-lg p-3 border border-white/10">
      <div className="flex items-start gap-3">
        {/* Ícone visual */}
        <div className="w-12 h-12 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-2xl">🔀</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-sm font-medium truncate">
            {title}
          </p>
          <p className="text-white/50 text-xs">{diagramType}</p>
          {nodeCount > 0 && (
            <p className="text-white/40 text-xs mt-1">
              ~{nodeCount} elementos
            </p>
          )}
        </div>
      </div>

      <button
        onClick={onExpand}
        className="w-full mt-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
      >
        Ver diagrama completo ↓
      </button>
    </div>
  )
}

// Categorias de artefatos
const ARTIFACT_CATEGORIES: Record<string, { label: string; icon: string; types: ArtifactType[]; color: string }> = {
  questions: {
    label: 'Questões',
    icon: '❓',
    types: ['question'],
    color: 'from-emerald-500 to-green-500'
  },
  visual: {
    label: 'Visualizações',
    icon: '📊',
    types: ['diagram', 'flowchart', 'table', 'timeline', 'layers', 'staging'],
    color: 'from-blue-500 to-cyan-500'
  },
  medical: {
    label: 'Médicos',
    icon: '🏥',
    types: ['ecg', 'anatomy', 'comparison'],
    color: 'from-emerald-500 to-teal-500'
  },
  interactive: {
    label: 'Interativos',
    icon: '✨',
    types: ['interactive', 'checklist'],
    color: 'from-purple-500 to-pink-500'
  },
  reference: {
    label: 'Referência',
    icon: '📚',
    types: ['code', 'note'],
    color: 'from-amber-500 to-orange-500'
  }
}

// Tipo de view da sidebar
type ViewMode = 'list' | 'grid' | 'categories' | 'questions'

// Tipo de filtro de status de questões
type QuestionStatusFilter = 'all' | 'answered' | 'correct' | 'wrong' | 'pending'

// Interface para categorias do banco
interface Categoria {
  id: string
  user_id: string
  tipo: 'disciplina' | 'assunto' | 'sub_assunto'
  nome: string
  parent_id: string | null
  created_at: string
}

interface Banca {
  id: string
  user_id: string
  nome: string
  created_at: string
}

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

// Importar LayeredDiagram dinamicamente
const LayeredDiagram = dynamic(() => import('./LayeredDiagram'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  )
})

// Importar StagingTable dinamicamente
const StagingTable = dynamic(() => import('./StagingTable'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  )
})

// Importar QuestionArtifactCard dinamicamente
const QuestionArtifactCard = dynamic(() => import('./QuestionArtifactCard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  )
})

interface ArtifactsSidebarProps {
  className?: string
  userId?: string
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

    case 'layers':
    case 'anatomy':
      // Renderizar diagrama de camadas (layers e anatomy usam o mesmo componente)
      try {
        const layersData = JSON.parse(artifact.content)
        // Validar se tem a estrutura esperada
        if (!layersData.layers || !Array.isArray(layersData.layers)) {
          throw new Error('Estrutura inválida')
        }
        return (
          <div className={containerClass}>
            <LayeredDiagram
              title={layersData.title || artifact.title}
              layers={layersData.layers}
              theme={layersData.theme || 'histology'}
              showLegend={layersData.showLegend}
              showStaging={layersData.showStaging}
              interactive={layersData.interactive ?? true}
              description={layersData.description}
            />
          </div>
        )
      } catch {
        // Fallback: mostrar preview visual ao invés de conteúdo bruto
        return (
          <div className={`p-4 ${containerClass}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🔬</span>
              <h4 className="text-white font-medium">{artifact.title}</h4>
            </div>
            <div className="bg-gradient-to-b from-pink-500/10 to-purple-500/10 rounded-lg p-4 border border-white/10">
              <p className="text-white/60 text-sm text-center">
                Diagrama de camadas disponível
              </p>
              <p className="text-white/40 text-xs text-center mt-2">
                Clique em &quot;Tela cheia&quot; para visualizar
              </p>
            </div>
          </div>
        )
      }

    case 'staging':
      // Renderizar tabela de estadiamento
      try {
        const stagingData = JSON.parse(artifact.content)
        // Validar se tem a estrutura esperada
        if (!stagingData.rows || !Array.isArray(stagingData.rows)) {
          throw new Error('Estrutura inválida')
        }
        return (
          <div className={containerClass}>
            <StagingTable
              title={stagingData.title || artifact.title}
              rows={stagingData.rows}
              highlightStage={stagingData.highlightStage}
              cancerType={stagingData.cancerType}
              source={stagingData.source}
            />
          </div>
        )
      } catch {
        // Fallback: mostrar preview visual ao invés de conteúdo bruto
        return (
          <div className={`p-4 ${containerClass}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📈</span>
              <h4 className="text-white font-medium">{artifact.title}</h4>
            </div>
            <div className="bg-gradient-to-b from-emerald-500/10 to-cyan-500/10 rounded-lg p-4 border border-white/10">
              <p className="text-white/60 text-sm text-center">
                Tabela de estadiamento disponível
              </p>
              <p className="text-white/40 text-xs text-center mt-2">
                Clique em &quot;Tela cheia&quot; para visualizar
              </p>
            </div>
          </div>
        )
      }

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

// Níveis de preview
type PreviewLevel = 'collapsed' | 'preview' | 'expanded'

// Card de artefato com 3 níveis de preview
function ArtifactCard({
  artifact,
  isSelected,
  onSelect,
  onRemove,
  onFullscreen,
  viewMode = 'list'
}: {
  artifact: Artifact
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
  onFullscreen: () => void
  viewMode?: ViewMode
}) {
  const [previewLevel, setPreviewLevel] = useState<PreviewLevel>('collapsed')

  // Quando selecionado, mostrar preview automaticamente
  useEffect(() => {
    if (isSelected && previewLevel === 'collapsed') {
      setPreviewLevel('preview')
    }
  }, [isSelected, previewLevel])

  // Alternar entre níveis de preview (simplificado: collapsed <-> expanded)
  const cyclePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (previewLevel === 'collapsed') {
      setPreviewLevel('expanded')
    } else {
      setPreviewLevel('collapsed')
    }
  }

  // Encontrar categoria do artefato
  const category = Object.entries(ARTIFACT_CATEGORIES).find(([, cat]) =>
    cat.types.includes(artifact.type)
  )
  const categoryColor = category?.[1].color || 'from-slate-500 to-slate-600'

  // Card em modo grid (compacto)
  if (viewMode === 'grid') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`group relative rounded-xl border overflow-hidden transition-all cursor-pointer ${
          isSelected
            ? 'border-purple-500/50 shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/30'
            : 'border-white/10 hover:border-white/20'
        }`}
        onClick={onSelect}
      >
        {/* Gradiente de fundo baseado na categoria */}
        <div className={`absolute inset-0 bg-gradient-to-br ${categoryColor} opacity-10`} />

        {/* Miniatura/Thumbnail */}
        <div className="relative h-24 bg-slate-900/50 flex items-center justify-center overflow-hidden">
          <span className="text-3xl opacity-50">{ARTIFACT_ICONS[artifact.type]}</span>

          {/* Ações no hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onFullscreen() }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Tela cheia"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
              title="Remover"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="relative p-2">
          <h4 className="text-white text-sm font-medium truncate">{artifact.title}</h4>
          <span className="text-white/40 text-xs">{ARTIFACT_LABELS[artifact.type]}</span>
        </div>
      </motion.div>
    )
  }

  // Card em modo lista (vertical) com 3 níveis de preview
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`group relative rounded-xl border transition-all overflow-hidden ${
        isSelected
          ? 'bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/10'
          : 'bg-slate-800/50 border-white/5 hover:border-white/20 hover:bg-slate-800/80'
      }`}
    >
      {/* Indicador de categoria (barra lateral) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${categoryColor}`} />

      {/* Header do card */}
      <div
        className="flex items-center gap-3 p-3 pl-4 cursor-pointer"
        onClick={onSelect}
      >
        {/* Ícone do tipo */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
          isSelected
            ? `bg-gradient-to-br ${categoryColor} bg-opacity-30`
            : 'bg-white/5'
        }`}>
          {ARTIFACT_ICONS[artifact.type]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium truncate transition-colors ${
            isSelected ? 'text-purple-300' : 'text-white'
          }`}>
            {artifact.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded transition-colors ${
              isSelected ? 'bg-purple-500/20 text-purple-300' : 'bg-white/10 text-white/50'
            }`}>
              {ARTIFACT_LABELS[artifact.type]}
            </span>
            {/* Indicador de preview level */}
            {previewLevel !== 'collapsed' && (
              <span className="text-xs text-white/30">
                {previewLevel === 'preview' ? 'Preview' : 'Expandido'}
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className={`flex items-center gap-1 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {/* Toggle preview - apenas expandir/fechar */}
          <button
            onClick={cyclePreview}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={previewLevel === 'collapsed' ? 'Expandir' : 'Fechar'}
          >
            {previewLevel === 'collapsed' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={(e) => { e.stopPropagation(); onFullscreen() }}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Tela cheia"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Remover */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Remover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview do conteúdo - apenas um nível (expandido) */}
      <AnimatePresence>
        {previewLevel === 'expanded' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 border-t border-purple-500/20">
              <div className="bg-slate-900/50 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <ArtifactContent artifact={artifact} />
              </div>
              <button
                onClick={cyclePreview}
                className="w-full mt-2 py-1 text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                Fechar ↑
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Componente de categoria colapsável
function CategorySection({
  categoryKey,
  category,
  artifacts,
  selectedArtifactId,
  onSelectArtifact,
  onRemoveArtifact,
  onFullscreen,
  defaultExpanded = true
}: {
  categoryKey: string
  category: typeof ARTIFACT_CATEGORIES[string]
  artifacts: Artifact[]
  selectedArtifactId: string | null
  onSelectArtifact: (id: string) => void
  onRemoveArtifact: (id: string) => void
  onFullscreen: (artifact: Artifact) => void
  defaultExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (artifacts.length === 0) return null

  return (
    <div className="mb-4">
      {/* Header da categoria */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-white/40" />
          ) : (
            <Folder className="w-4 h-4 text-white/40" />
          )}
          <span className="text-lg">{category.icon}</span>
          <span className="text-white font-medium text-sm">{category.label}</span>
          <span className="text-white/40 text-xs">({artifacts.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40" />
        )}
      </button>

      {/* Lista de artefatos da categoria */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 pl-2">
              {artifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  isSelected={selectedArtifactId === artifact.id}
                  onSelect={() => onSelectArtifact(artifact.id)}
                  onRemove={() => onRemoveArtifact(artifact.id)}
                  onFullscreen={() => onFullscreen(artifact)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Componente principal da Sidebar
export default function ArtifactsSidebar({ className = '', userId }: ArtifactsSidebarProps) {
  const {
    artifacts: allArtifacts,
    selectedArtifactId,
    isSidebarOpen,
    selectArtifact,
    removeArtifact,
    clearArtifacts,
    toggleSidebar,
    setSidebarOpen,
    currentConversaId,
    updateQuestionAnswer
  } = useArtifactsStore()

  // Filtrar artefatos pela conversa atual
  const artifacts = useMemo(() => {
    if (!currentConversaId) return allArtifacts
    return allArtifacts.filter(a => a.conversaId === currentConversaId || !a.conversaId)
  }, [allArtifacts, currentConversaId])

  // Estados locais
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ArtifactType | 'all'>('all')
  const [fullscreenArtifact, setFullscreenArtifact] = useState<Artifact | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  // Estados para filtros de questões
  const [questionStatusFilter, setQuestionStatusFilter] = useState<QuestionStatusFilter>('all')
  const [questionDisciplineFilter, setQuestionDisciplineFilter] = useState<string>('all')
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState<string>('all')
  const [questionBancaFilter, setQuestionBancaFilter] = useState<string>('all')
  const [questionAssuntoFilter, setQuestionAssuntoFilter] = useState<string>('all')
  // Estado para navegação de questões uma por vez
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  // Estado para mostrar painel de filtros avançados
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  // Categorias carregadas do banco
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [bancas, setBancas] = useState<Banca[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)

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

  // Agrupar artefatos por categoria
  const artifactsByCategory = useMemo(() => {
    const grouped: Record<string, Artifact[]> = {}

    Object.keys(ARTIFACT_CATEGORIES).forEach(key => {
      grouped[key] = filteredArtifacts.filter(artifact =>
        ARTIFACT_CATEGORIES[key].types.includes(artifact.type)
      )
    })

    // Artefatos sem categoria
    const categorizedTypes = Object.values(ARTIFACT_CATEGORIES).flatMap(c => c.types)
    grouped['other'] = filteredArtifacts.filter(
      artifact => !categorizedTypes.includes(artifact.type)
    )

    return grouped
  }, [filteredArtifacts])

  // Filtrar e obter apenas questões
  const questionArtifacts = useMemo(() => {
    return artifacts.filter(a => a.type === 'question' && a.metadata?.question)
  }, [artifacts])

  // Filtrar questões com filtros específicos
  const filteredQuestions = useMemo(() => {
    return questionArtifacts.filter(artifact => {
      const question = artifact.metadata?.question
      if (!question) return false

      // Filtro de busca
      if (searchQuery) {
        const search = searchQuery.toLowerCase()
        const matchesSearch =
          artifact.title.toLowerCase().includes(search) ||
          question.enunciado?.toLowerCase().includes(search) ||
          question.disciplina?.toLowerCase().includes(search) ||
          question.assunto?.toLowerCase().includes(search)
        if (!matchesSearch) return false
      }

      // Filtro de status
      if (questionStatusFilter !== 'all') {
        if (questionStatusFilter === 'pending' && question.resposta_usuario) return false
        if (questionStatusFilter === 'answered' && !question.resposta_usuario) return false
        if (questionStatusFilter === 'correct' && question.acertou !== true) return false
        if (questionStatusFilter === 'wrong' && question.acertou !== false) return false
      }

      // Filtro de disciplina
      if (questionDisciplineFilter !== 'all' && question.disciplina !== questionDisciplineFilter) {
        return false
      }

      // Filtro de assunto
      if (questionAssuntoFilter !== 'all' && question.assunto !== questionAssuntoFilter) {
        return false
      }

      // Filtro de banca
      if (questionBancaFilter !== 'all' && question.banca !== questionBancaFilter) {
        return false
      }

      // Filtro de dificuldade
      if (questionDifficultyFilter !== 'all' && question.dificuldade !== questionDifficultyFilter) {
        return false
      }

      return true
    })
  }, [questionArtifacts, searchQuery, questionStatusFilter, questionDisciplineFilter, questionAssuntoFilter, questionBancaFilter, questionDifficultyFilter])

  // Extrair disciplinas e dificuldades únicas para filtros
  const uniqueDisciplines = useMemo(() => {
    const disciplines = new Set<string>()
    questionArtifacts.forEach(a => {
      if (a.metadata?.question?.disciplina) {
        disciplines.add(a.metadata.question.disciplina)
      }
    })
    return Array.from(disciplines).sort()
  }, [questionArtifacts])

  const uniqueDifficulties = useMemo(() => {
    const difficulties = new Set<string>()
    questionArtifacts.forEach(a => {
      if (a.metadata?.question?.dificuldade) {
        difficulties.add(a.metadata.question.dificuldade)
      }
    })
    return Array.from(difficulties)
  }, [questionArtifacts])

  // Estatísticas de questões
  const questionStats = useMemo(() => {
    const total = questionArtifacts.length
    const answered = questionArtifacts.filter(a => a.metadata?.question?.resposta_usuario).length
    const correct = questionArtifacts.filter(a => a.metadata?.question?.acertou === true).length
    const wrong = questionArtifacts.filter(a => a.metadata?.question?.acertou === false).length
    const pending = total - answered
    return { total, answered, correct, wrong, pending }
  }, [questionArtifacts])

  // Quando há questões, alternar automaticamente para o modo questões
  useEffect(() => {
    if (questionArtifacts.length > 0 && viewMode === 'list') {
      // Opcional: não forçar automaticamente, deixar o usuário escolher
    }
  }, [questionArtifacts.length, viewMode])

  // Carregar categorias do banco quando userId está disponível
  useEffect(() => {
    const loadCategorias = async () => {
      if (!userId) return
      setLoadingCategorias(true)
      try {
        const response = await fetch(`/api/medicina/ia/categorias?user_id=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setCategorias(data.categorias || [])
          setBancas(data.bancas || [])
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      } finally {
        setLoadingCategorias(false)
      }
    }
    loadCategorias()
  }, [userId])

  // Extrair disciplinas únicas das categorias carregadas + das questões
  const allDisciplinas = useMemo(() => {
    const fromCategorias = categorias
      .filter(c => c.tipo === 'disciplina')
      .map(c => c.nome)
    const fromQuestions = questionArtifacts
      .map(a => a.metadata?.question?.disciplina)
      .filter(Boolean) as string[]
    return [...new Set([...fromCategorias, ...fromQuestions])].sort()
  }, [categorias, questionArtifacts])

  // Extrair assuntos baseados na disciplina selecionada (cascata)
  const filteredAssuntos = useMemo(() => {
    // Pegar o ID da disciplina selecionada
    const disciplinaCategoria = categorias.find(
      c => c.tipo === 'disciplina' && c.nome === questionDisciplineFilter
    )

    // Assuntos do banco vinculados à disciplina
    const fromCategorias = categorias
      .filter(c => c.tipo === 'assunto' && (
        questionDisciplineFilter === 'all' || c.parent_id === disciplinaCategoria?.id
      ))
      .map(c => c.nome)

    // Assuntos das questões filtrados pela disciplina
    const fromQuestions = questionArtifacts
      .filter(a => questionDisciplineFilter === 'all' || a.metadata?.question?.disciplina === questionDisciplineFilter)
      .map(a => a.metadata?.question?.assunto)
      .filter(Boolean) as string[]

    return [...new Set([...fromCategorias, ...fromQuestions])].sort()
  }, [categorias, questionArtifacts, questionDisciplineFilter])

  // Extrair bancas únicas
  const allBancas = useMemo(() => {
    const fromDB = bancas.map(b => b.nome)
    const fromQuestions = questionArtifacts
      .map(a => a.metadata?.question?.banca)
      .filter(Boolean) as string[]
    return [...new Set([...fromDB, ...fromQuestions])].sort()
  }, [bancas, questionArtifacts])

  // Resetar assunto quando disciplina muda
  useEffect(() => {
    setQuestionAssuntoFilter('all')
  }, [questionDisciplineFilter])

  // Resetar índice quando filtros de questão mudam ou quando há novas questões
  useEffect(() => {
    setCurrentQuestionIndex(0)
  }, [questionStatusFilter, questionDisciplineFilter, questionAssuntoFilter, questionBancaFilter, questionDifficultyFilter, filteredQuestions.length])

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

            {/* Busca, Filtros e Modo de Visualização */}
            <div className="p-3 border-b border-white/10 space-y-2">
              {/* Campo de busca + botões de modo */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Buscar artefatos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 text-sm"
                  />
                </div>

                {/* Botões de modo de visualização */}
                <div className="flex items-center bg-white/5 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'list' ? 'bg-purple-500/30 text-purple-400' : 'text-white/40 hover:text-white'
                    }`}
                    title="Lista"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'grid' ? 'bg-purple-500/30 text-purple-400' : 'text-white/40 hover:text-white'
                    }`}
                    title="Grade"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('categories')}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'categories' ? 'bg-purple-500/30 text-purple-400' : 'text-white/40 hover:text-white'
                    }`}
                    title="Categorias"
                  >
                    <Folder className="w-4 h-4" />
                  </button>
                  {/* Botão de Questões - só aparece se houver questões */}
                  {questionArtifacts.length > 0 && (
                    <button
                      onClick={() => setViewMode('questions')}
                      className={`p-1.5 rounded transition-colors relative ${
                        viewMode === 'questions' ? 'bg-emerald-500/30 text-emerald-400' : 'text-white/40 hover:text-white'
                      }`}
                      title="Questões"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                        {questionArtifacts.length}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Toggle filtros */}
              {availableTypes.length > 1 && viewMode !== 'categories' && (
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
              {showFilters && viewMode !== 'categories' && (
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

            {/* Lista de artefatos */}
            <div className="flex-1 overflow-y-auto p-3">
              {filteredArtifacts.length > 0 ? (
                <>
                  {/* Modo LISTA */}
                  {viewMode === 'list' && (
                    <div className="space-y-2">
                      {filteredArtifacts.map((artifact) => (
                        <ArtifactCard
                          key={artifact.id}
                          artifact={artifact}
                          isSelected={selectedArtifactId === artifact.id}
                          onSelect={() => selectArtifact(artifact.id)}
                          onRemove={() => removeArtifact(artifact.id)}
                          onFullscreen={() => setFullscreenArtifact(artifact)}
                          viewMode="list"
                        />
                      ))}
                    </div>
                  )}

                  {/* Modo GRID */}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-2 gap-3">
                      <AnimatePresence>
                        {filteredArtifacts.map((artifact) => (
                          <ArtifactCard
                            key={artifact.id}
                            artifact={artifact}
                            isSelected={selectedArtifactId === artifact.id}
                            onSelect={() => selectArtifact(artifact.id)}
                            onRemove={() => removeArtifact(artifact.id)}
                            onFullscreen={() => setFullscreenArtifact(artifact)}
                            viewMode="grid"
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Modo CATEGORIAS */}
                  {viewMode === 'categories' && (
                    <div>
                      {Object.entries(ARTIFACT_CATEGORIES).map(([key, category]) => (
                        <CategorySection
                          key={key}
                          categoryKey={key}
                          category={category}
                          artifacts={artifactsByCategory[key] || []}
                          selectedArtifactId={selectedArtifactId}
                          onSelectArtifact={selectArtifact}
                          onRemoveArtifact={removeArtifact}
                          onFullscreen={setFullscreenArtifact}
                        />
                      ))}
                      {/* Outros (sem categoria) */}
                      {artifactsByCategory['other']?.length > 0 && (
                        <CategorySection
                          categoryKey="other"
                          category={{ label: 'Outros', icon: '📄', types: [], color: 'from-slate-500 to-slate-600' }}
                          artifacts={artifactsByCategory['other']}
                          selectedArtifactId={selectedArtifactId}
                          onSelectArtifact={selectArtifact}
                          onRemoveArtifact={removeArtifact}
                          onFullscreen={setFullscreenArtifact}
                        />
                      )}
                    </div>
                  )}

                  {/* Modo QUESTÕES */}
                  {viewMode === 'questions' && (
                    <div className="space-y-3">
                      {/* Header com estatísticas compactas */}
                      <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-lg p-2 border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-400 text-xs font-medium">
                              {questionStats.total} questões
                            </span>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="flex items-center gap-0.5 text-green-400">
                                <CheckCircle className="w-3 h-3" />{questionStats.correct}
                              </span>
                              <span className="flex items-center gap-0.5 text-red-400">
                                <XCircle className="w-3 h-3" />{questionStats.wrong}
                              </span>
                              <span className="flex items-center gap-0.5 text-yellow-400">
                                <Clock className="w-3 h-3" />{questionStats.pending}
                              </span>
                            </div>
                          </div>
                          <span className="text-emerald-400 text-xs font-bold">
                            {questionStats.answered > 0
                              ? Math.round((questionStats.correct / questionStats.answered) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>

                      {/* Filtros de questões - linha única */}
                      <div className="flex items-center gap-2">
                        {/* Filtro de status */}
                        <div className="flex gap-1">
                          {[
                            { value: 'all', label: 'Todas', icon: HelpCircle },
                            { value: 'pending', label: 'Pendentes', icon: Clock },
                            { value: 'correct', label: 'Acertos', icon: CheckCircle },
                            { value: 'wrong', label: 'Erros', icon: XCircle }
                          ].map(filter => (
                            <button
                              key={filter.value}
                              onClick={() => setQuestionStatusFilter(filter.value as QuestionStatusFilter)}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                                questionStatusFilter === filter.value
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                              }`}
                              title={filter.label}
                            >
                              <filter.icon className="w-3 h-3" />
                            </button>
                          ))}
                        </div>

                        {/* Botão Filtro Avançado */}
                        <button
                          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ml-auto ${
                            showAdvancedFilters || questionDisciplineFilter !== 'all' || questionAssuntoFilter !== 'all' || questionBancaFilter !== 'all' || questionDifficultyFilter !== 'all'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                          Filtro
                          {(questionDisciplineFilter !== 'all' || questionAssuntoFilter !== 'all' || questionBancaFilter !== 'all' || questionDifficultyFilter !== 'all') && (
                            <span className="w-4 h-4 bg-purple-500 text-white rounded-full text-[8px] flex items-center justify-center">
                              {[questionDisciplineFilter, questionAssuntoFilter, questionBancaFilter, questionDifficultyFilter].filter(f => f !== 'all').length}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Painel de Filtros Avançados em Cascata */}
                      <AnimatePresence>
                        {showAdvancedFilters && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-slate-800/80 rounded-lg p-3 border border-white/10 space-y-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white/70 text-xs font-medium">Filtros Avançados</span>
                                {(questionDisciplineFilter !== 'all' || questionAssuntoFilter !== 'all' || questionBancaFilter !== 'all' || questionDifficultyFilter !== 'all') && (
                                  <button
                                    onClick={() => {
                                      setQuestionDisciplineFilter('all')
                                      setQuestionAssuntoFilter('all')
                                      setQuestionBancaFilter('all')
                                      setQuestionDifficultyFilter('all')
                                    }}
                                    className="text-[10px] text-purple-400 hover:underline"
                                  >
                                    Limpar tudo
                                  </button>
                                )}
                              </div>

                              {/* Disciplina */}
                              <div>
                                <label className="text-white/40 text-[10px] mb-1 block">Disciplina</label>
                                <select
                                  value={questionDisciplineFilter}
                                  onChange={(e) => setQuestionDisciplineFilter(e.target.value)}
                                  className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-purple-500/50"
                                >
                                  <option value="all">Todas as disciplinas</option>
                                  {allDisciplinas.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Assunto (cascata - só mostra se tem disciplina ou assuntos disponíveis) */}
                              {(filteredAssuntos.length > 0 || questionDisciplineFilter !== 'all') && (
                                <div>
                                  <label className="text-white/40 text-[10px] mb-1 block">
                                    Assunto
                                    {questionDisciplineFilter !== 'all' && (
                                      <span className="text-purple-400 ml-1">({questionDisciplineFilter})</span>
                                    )}
                                  </label>
                                  <select
                                    value={questionAssuntoFilter}
                                    onChange={(e) => setQuestionAssuntoFilter(e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-purple-500/50"
                                  >
                                    <option value="all">Todos os assuntos</option>
                                    {filteredAssuntos.map(a => (
                                      <option key={a} value={a}>{a}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Banca */}
                              {allBancas.length > 0 && (
                                <div>
                                  <label className="text-white/40 text-[10px] mb-1 block">Banca</label>
                                  <select
                                    value={questionBancaFilter}
                                    onChange={(e) => setQuestionBancaFilter(e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-purple-500/50"
                                  >
                                    <option value="all">Todas as bancas</option>
                                    {allBancas.map(b => (
                                      <option key={b} value={b}>{b}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Dificuldade */}
                              <div>
                                <label className="text-white/40 text-[10px] mb-1 block">Dificuldade</label>
                                <div className="flex flex-wrap gap-1">
                                  <button
                                    onClick={() => setQuestionDifficultyFilter('all')}
                                    className={`px-2 py-1 rounded text-[10px] transition-colors ${
                                      questionDifficultyFilter === 'all'
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : 'bg-white/5 text-white/50 hover:text-white'
                                    }`}
                                  >
                                    Todas
                                  </button>
                                  {['facil', 'medio', 'dificil', 'muito_dificil'].map(d => (
                                    <button
                                      key={d}
                                      onClick={() => setQuestionDifficultyFilter(d)}
                                      className={`px-2 py-1 rounded text-[10px] transition-colors ${
                                        questionDifficultyFilter === d
                                          ? d === 'facil' ? 'bg-green-500/20 text-green-400'
                                          : d === 'medio' ? 'bg-yellow-500/20 text-yellow-400'
                                          : d === 'dificil' ? 'bg-orange-500/20 text-orange-400'
                                          : 'bg-red-500/20 text-red-400'
                                          : 'bg-white/5 text-white/50 hover:text-white'
                                      }`}
                                    >
                                      {d === 'facil' ? 'Fácil' : d === 'medio' ? 'Médio' : d === 'dificil' ? 'Difícil' : 'Muito Difícil'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Questão atual - SEM navegação no topo */}
                      {filteredQuestions.length > 0 ? (
                        <div className="space-y-2">
                          {/* Questão atual */}
                          {(() => {
                            const currentArtifact = filteredQuestions[currentQuestionIndex]
                            const question = currentArtifact?.metadata?.question
                            if (!question) return null

                            return (
                              <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-white/5">
                                <QuestionArtifactCard
                                  question={question}
                                  userId={userId}
                                  conversaId={currentConversaId || undefined}
                                  onAnswerSubmit={(qId, answer, correct) => {
                                    // Sincronizar com a store
                                    updateQuestionAnswer(currentArtifact.id, answer, correct)
                                  }}
                                />
                              </div>
                            )
                          })()}

                          {/* NAVEGAÇÃO ABAIXO DO CARD - apenas setas pequenas */}
                          <div className="flex items-center justify-center gap-4 py-1">
                            <button
                              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                              disabled={currentQuestionIndex === 0}
                              className={`p-1.5 rounded-full transition-colors ${
                                currentQuestionIndex === 0
                                  ? 'text-white/20 cursor-not-allowed'
                                  : 'text-white/60 hover:text-white hover:bg-white/10'
                              }`}
                              title="Questão anterior"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Indicadores de navegação (dots) compactos */}
                            {filteredQuestions.length > 1 && filteredQuestions.length <= 15 && (
                              <div className="flex gap-1">
                                {filteredQuestions.map((artifact, idx) => {
                                  const q = artifact.metadata?.question
                                  const isAnswered = q?.mostrar_gabarito || q?.resposta_usuario
                                  const isCorrect = q?.acertou

                                  return (
                                    <button
                                      key={artifact.id}
                                      onClick={() => setCurrentQuestionIndex(idx)}
                                      className={`h-1.5 rounded-full transition-all ${
                                        idx === currentQuestionIndex
                                          ? 'w-4 bg-emerald-500'
                                          : isAnswered
                                            ? isCorrect
                                              ? 'w-1.5 bg-green-500/50'
                                              : 'w-1.5 bg-red-500/50'
                                            : 'w-1.5 bg-white/20 hover:bg-white/40'
                                      }`}
                                      title={`Questão ${idx + 1}`}
                                    />
                                  )
                                })}
                              </div>
                            )}

                            {/* Contador se muitas questões */}
                            {filteredQuestions.length > 15 && (
                              <span className="text-white/50 text-xs">
                                {currentQuestionIndex + 1}/{filteredQuestions.length}
                              </span>
                            )}

                            <button
                              onClick={() => setCurrentQuestionIndex(prev => Math.min(filteredQuestions.length - 1, prev + 1))}
                              disabled={currentQuestionIndex >= filteredQuestions.length - 1}
                              className={`p-1.5 rounded-full transition-colors ${
                                currentQuestionIndex >= filteredQuestions.length - 1
                                  ? 'text-white/20 cursor-not-allowed'
                                  : 'text-white/60 hover:text-white hover:bg-white/10'
                              }`}
                              title="Próxima questão"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <HelpCircle className="w-8 h-8 text-white/20 mb-2" />
                          <p className="text-white/40 text-sm">Nenhuma questão encontrada</p>
                          {(questionStatusFilter !== 'all' || questionDisciplineFilter !== 'all' || questionAssuntoFilter !== 'all' || questionBancaFilter !== 'all' || questionDifficultyFilter !== 'all') && (
                            <button
                              onClick={() => {
                                setQuestionStatusFilter('all')
                                setQuestionDisciplineFilter('all')
                                setQuestionAssuntoFilter('all')
                                setQuestionBancaFilter('all')
                                setQuestionDifficultyFilter('all')
                              }}
                              className="mt-2 text-emerald-400 text-sm hover:underline"
                            >
                              Limpar filtros
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
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
                {viewMode === 'list' && 'Clique para preview • 👁 para expandir • ⛶ para tela cheia'}
                {viewMode === 'grid' && 'Hover para ações • Clique para selecionar'}
                {viewMode === 'categories' && 'Clique nas categorias para expandir/recolher'}
                {viewMode === 'questions' && 'Use ✂️ para eliminar alternativas • Filtre por status ou dificuldade'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Mobile Drawer Overlay - opaco */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/95 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer - slide de baixo */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl border-t border-white/10 transition-transform duration-300 ease-out z-50 md:hidden flex flex-col ${
          isSidebarOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '80vh' }}
      >
        {/* Handle para arrastar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header compacto */}
        <div className="flex items-center justify-between px-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Artefatos</h3>
              <span className="text-white/40 text-xs">{filteredArtifacts.length} itens</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {artifacts.length > 0 && (
              <button
                onClick={clearArtifacts}
                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                title="Limpar todos"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Busca mobile - mais compacta */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 text-sm"
            />
          </div>
        </div>

        {/* Lista mobile - com scroll */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="w-6 h-6 text-white/20 mb-2" />
              <p className="text-white/40 text-sm">Nenhum artefato</p>
            </div>
          )}
        </div>

        {/* Footer mobile */}
        <div className="px-4 py-2 border-t border-white/10 bg-slate-900/80">
          <p className="text-white/30 text-[10px] text-center">
            Toque para selecionar • Deslize para fechar
          </p>
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
      className="fixed bottom-20 right-3 z-40 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-105 md:hidden"
    >
      <Layers className="w-4 h-4" />
      <span className="text-xs font-medium">Artefatos</span>
      <span className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[10px]">
        {artifacts.length}
      </span>
    </button>
  )
}
