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
  | 'question' // NOVO: Questões geradas pela IA

// Interface para alternativa de questão
export interface QuestionAlternative {
  letra: string
  texto: string
  correta?: boolean  // Opcional - não vem no JSON para não vazar gabarito
}

// Interface para análise de alternativa no gabarito
export interface AlternativeAnalysis {
  letra: string
  texto_resumido?: string
  correta?: boolean
  analise: string
}

// Interface para gabarito comentado
export interface QuestionFeedback {
  resposta_correta: string
  explicacao?: string
  explicacao_geral?: string  // Nova - explicação mais detalhada
  analise_alternativas?: AlternativeAnalysis[]
  ponto_chave?: string
  pegadinha?: string
  dica_memorizacao?: string
  referencias?: string[]
}

// Interface para questão
export interface Question {
  id?: string
  numero: number
  tipo: 'multipla_escolha' | 'certo_errado'
  dificuldade: 'facil' | 'medio' | 'dificil' | 'muito_dificil'
  banca?: string  // Nome da banca (ex: REVALIDA, USP-RP)
  banca_estilo?: string  // Estilo da banca para geração
  disciplina: string
  assunto: string
  subassunto?: string
  enunciado: string
  caso_clinico?: string
  imagem_url?: string
  alternativas: QuestionAlternative[]
  gabarito_comentado: QuestionFeedback
  tags?: string[]
  // Estado do usuário na sessão
  resposta_usuario?: string
  acertou?: boolean
  mostrar_gabarito?: boolean
}

export interface Artifact {
  id: string
  type: ArtifactType
  title: string
  content: string
  messageId?: string
  conversaId?: string  // ID da conversa para filtrar artefatos por chat
  createdAt: Date
  metadata?: {
    language?: string
    subtype?: string
    interactive?: boolean
    // Metadados específicos para questões
    question?: Question
  }
}

interface ArtifactsState {
  // Estado
  artifacts: Artifact[]
  selectedArtifactId: string | null
  isSidebarOpen: boolean
  isMobileDrawerOpen: boolean
  currentConversaId: string | null  // Conversa atual para filtrar artefatos

  // Ações
  addArtifact: (artifact: Omit<Artifact, 'id' | 'createdAt'>) => string
  removeArtifact: (id: string) => void
  clearArtifacts: () => void
  clearArtifactsForConversa: (conversaId: string) => void  // Limpar artefatos de uma conversa específica
  setCurrentConversa: (conversaId: string | null) => void  // Definir conversa atual
  selectArtifact: (id: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileDrawer: () => void
  setMobileDrawerOpen: (open: boolean) => void
  getArtifactsByMessage: (messageId: string) => Artifact[]
  getArtifactsForCurrentConversa: () => Artifact[]  // Obter artefatos da conversa atual
  updateQuestionAnswer: (artifactId: string, resposta: string, acertou: boolean) => void  // Sincronizar resposta
}

export const useArtifactsStore = create<ArtifactsState>((set, get) => ({
  // Estado inicial
  artifacts: [],
  selectedArtifactId: null,
  isSidebarOpen: false,
  isMobileDrawerOpen: false,
  currentConversaId: null,

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

  // Limpar artefatos de uma conversa específica
  clearArtifactsForConversa: (conversaId) => {
    set((state) => ({
      artifacts: state.artifacts.filter((a) => a.conversaId !== conversaId),
      selectedArtifactId: null
    }))
  },

  // Definir conversa atual
  setCurrentConversa: (conversaId) => {
    set({ currentConversaId: conversaId })
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
  },

  // Obter artefatos apenas da conversa atual
  getArtifactsForCurrentConversa: () => {
    const state = get()
    if (!state.currentConversaId) return state.artifacts
    return state.artifacts.filter((a) => a.conversaId === state.currentConversaId || !a.conversaId)
  },

  // Atualizar estado de questão respondida (sincronização chat <-> sidebar)
  updateQuestionAnswer: (artifactId, resposta, acertou) => {
    set((state) => ({
      artifacts: state.artifacts.map((artifact) => {
        if (artifact.id === artifactId && artifact.type === 'question' && artifact.metadata?.question) {
          return {
            ...artifact,
            metadata: {
              ...artifact.metadata,
              question: {
                ...artifact.metadata.question,
                resposta_usuario: resposta,
                acertou: acertou,
                mostrar_gabarito: true
              }
            }
          }
        }
        return artifact
      })
    }))
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
  note: '📝',
  question: '❓'
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
  note: 'Nota',
  question: 'Questão'
}

// Cores para dificuldade de questões
export const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  facil: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Fácil' },
  medio: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Médio' },
  dificil: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Difícil' },
  muito_dificil: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Muito Difícil' }
}
