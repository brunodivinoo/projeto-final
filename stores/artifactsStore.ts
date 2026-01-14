import { create } from 'zustand'

// Tipos de artefatos suportados
export type ArtifactType =
  | 'diagram'
  | 'flowchart'
  | 'table'
  | 'code'
  | 'ecg'
  | 'comparison'
  | 'timeline'
  | 'checklist'
  | 'formula'
  | 'anatomy'
  | 'interactive'
  | 'layers'
  | 'staging'
  | 'note'

export interface Artifact {
  id: string
  type: ArtifactType
  title: string
  content: string
  messageId?: string
  createdAt: Date
  metadata?: {
    language?: string
    subtype?: string
    interactive?: boolean
  }
}

interface ArtifactsState {
  // Estado
  artifacts: Artifact[]
  selectedArtifactId: string | null
  isSidebarOpen: boolean
  isMobileDrawerOpen: boolean

  // Ações
  addArtifact: (artifact: Omit<Artifact, 'id' | 'createdAt'>) => string
  removeArtifact: (id: string) => void
  clearArtifacts: () => void
  selectArtifact: (id: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileDrawer: () => void
  setMobileDrawerOpen: (open: boolean) => void
  getArtifactsByMessage: (messageId: string) => Artifact[]
}

export const useArtifactsStore = create<ArtifactsState>((set, get) => ({
  // Estado inicial
  artifacts: [],
  selectedArtifactId: null,
  isSidebarOpen: false,
  isMobileDrawerOpen: false,

  // Adicionar artefato
  addArtifact: (artifact) => {
    const id = `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newArtifact: Artifact = {
      ...artifact,
      id,
      createdAt: new Date()
    }

    set((state) => ({
      artifacts: [...state.artifacts, newArtifact],
      // Abrir sidebar automaticamente quando há artefato
      isSidebarOpen: true
    }))

    return id
  },

  // Remover artefato
  removeArtifact: (id) => {
    set((state) => ({
      artifacts: state.artifacts.filter((a) => a.id !== id),
      selectedArtifactId: state.selectedArtifactId === id ? null : state.selectedArtifactId
    }))
  },

  // Limpar todos os artefatos
  clearArtifacts: () => {
    set({
      artifacts: [],
      selectedArtifactId: null
    })
  },

  // Selecionar artefato
  selectArtifact: (id) => {
    set({ selectedArtifactId: id })
    if (id) {
      // Se selecionou um artefato, garantir que sidebar está aberta
      set({ isSidebarOpen: true })
    }
  },

  // Toggle sidebar
  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
  },

  setSidebarOpen: (open) => {
    set({ isSidebarOpen: open })
  },

  // Toggle mobile drawer
  toggleMobileDrawer: () => {
    set((state) => ({ isMobileDrawerOpen: !state.isMobileDrawerOpen }))
  },

  setMobileDrawerOpen: (open) => {
    set({ isMobileDrawerOpen: open })
  },

  // Obter artefatos por mensagem
  getArtifactsByMessage: (messageId) => {
    return get().artifacts.filter((a) => a.messageId === messageId)
  }
}))

// Funções helper para extrair artefatos do conteúdo
export function detectArtifactType(content: string): ArtifactType | null {
  const lowerContent = content.toLowerCase()

  // ECG patterns
  if (lowerContent.includes('ecg') || lowerContent.includes('eletrocardiograma') ||
      lowerContent.includes('ritmo') || lowerContent.includes('arritmia')) {
    return 'ecg'
  }

  // Flowchart/Diagram
  if (content.includes('graph ') || content.includes('flowchart ') ||
      content.includes('sequenceDiagram') || content.includes('classDiagram')) {
    return 'flowchart'
  }

  // Timeline
  if (lowerContent.includes('timeline') || lowerContent.includes('cronologia')) {
    return 'timeline'
  }

  // Comparison
  if (lowerContent.includes('vs') || lowerContent.includes('comparação') ||
      lowerContent.includes('diferença entre')) {
    return 'comparison'
  }

  // Checklist
  if (content.includes('[ ]') || content.includes('[x]') ||
      lowerContent.includes('checklist') || lowerContent.includes('critérios')) {
    return 'checklist'
  }

  // Table
  if (content.includes('|') && content.includes('---')) {
    return 'table'
  }

  // Code
  if (content.includes('```') && !content.includes('mermaid')) {
    return 'code'
  }

  // Formula
  if (content.includes('$') || lowerContent.includes('fórmula') ||
      lowerContent.includes('equação')) {
    return 'formula'
  }

  // Anatomy
  if (lowerContent.includes('anatomia') || lowerContent.includes('estrutura')) {
    return 'anatomy'
  }

  return 'diagram'
}

// Ícones para cada tipo de artefato
export const ARTIFACT_ICONS: Record<ArtifactType, string> = {
  diagram: '📊',
  flowchart: '🔀',
  table: '📋',
  code: '💻',
  ecg: '💓',
  comparison: '⚖️',
  timeline: '📅',
  checklist: '✅',
  formula: '🔢',
  anatomy: '🫀',
  interactive: '🎯',
  layers: '🔬',
  staging: '📈',
  note: '📝'
}

// Labels para cada tipo
export const ARTIFACT_LABELS: Record<ArtifactType, string> = {
  diagram: 'Diagrama',
  flowchart: 'Fluxograma',
  table: 'Tabela',
  code: 'Código',
  ecg: 'ECG',
  comparison: 'Comparação',
  timeline: 'Linha do Tempo',
  checklist: 'Checklist',
  formula: 'Fórmula',
  anatomy: 'Anatomia',
  interactive: 'Interativo',
  layers: 'Camadas',
  staging: 'Estadiamento',
  note: 'Nota'
}
