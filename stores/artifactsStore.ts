import { create } from 'zustand'

// Tipos de modos de chat
export type ChatModeType = 'chat' | 'caso_clinico' | 'tutor' | 'questoes'

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
  | 'question' // Questões geradas pela IA
  | 'simulado' // Simulados completos (conjunto de questões)
  | 'flashcard' // Flashcard singular (alias)
  | 'flashcards' // Flashcards gerados pela IA
  | 'image_generated' // Imagens geradas por IA (DALL-E 3)
  | 'image_uploaded' // Imagens enviadas pelo usuário
  | 'pdf_uploaded' // PDFs enviados pelo usuário
  | 'document' // Documentos gerais

// Categorias de artefatos para abas
export type ArtifactCategory = 'all' | 'images_generated' | 'images_uploaded' | 'pdfs' | 'questions' | 'diagrams' | 'simulados' | 'flashcards_cat'

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

// Metadados para imagens
export interface ImageMetadata {
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  mimeType?: string
  size?: number // em bytes
  source?: 'generated' | 'uploaded' | 'medical_search'
  prompt?: string // prompt usado para gerar (se gerada)
  revisedPrompt?: string // prompt revisado pelo DALL-E
  structure?: string // estrutura anatômica (se médica)
  imageType?: 'anatomy' | 'histology' | 'radiology' | 'pathology' | 'diagram' | 'other'
}

// Metadados para PDFs
export interface PDFMetadata {
  url: string
  fileName: string
  pageCount?: number
  size?: number // em bytes
  uploadedAt?: Date
}

export interface Artifact {
  id: string
  type: ArtifactType
  title: string
  content: string
  messageId?: string
  conversaId?: string  // ID da conversa para filtrar artefatos por chat
  chatMode?: ChatModeType  // Modo do chat que gerou o artefato
  createdAt: Date
  metadata?: {
    language?: string
    subtype?: string
    interactive?: boolean
    // Metadados específicos para questões
    question?: Question
    // Metadados para imagens
    image?: ImageMetadata
    // Metadados para PDFs
    pdf?: PDFMetadata
    // Metadados para simulados
    simulado?: {
      titulo: string
      disciplina: string
      total_questoes: number
      tempo_estimado: string
      dificuldade_media: string
      questoes: Array<{
        numero: number
        tipo: string
        dificuldade: string
        tema: string
        enunciado: string
        alternativas: Array<{ letra: string; texto: string }>
        gabarito_comentado: {
          resposta_correta: string
          explicacao: string
          ponto_chave?: string
        }
      }>
    }
    // Metadados para flashcards
    flashcards?: {
      titulo: string
      cards: Array<{
        id: string
        frente: string
        verso: string
        referencia?: string
        tags?: string[]
        dificuldade?: 'facil' | 'medio' | 'dificil'
      }>
    }
  }
}

interface ArtifactsState {
  // Estado
  artifacts: Artifact[]
  selectedArtifactId: string | null
  isSidebarOpen: boolean
  isMobileDrawerOpen: boolean
  currentConversaId: string | null  // Conversa atual para filtrar artefatos
  currentChatMode: ChatModeType | null  // Modo de chat atual para filtrar artefatos
  chatModeFilter: ChatModeType | 'all'  // Filtro por modo de chat na sidebar
  categoryFilter: ArtifactCategory  // Filtro por categoria (imagens, pdfs, etc.)

  // Ações
  addArtifact: (artifact: Omit<Artifact, 'id' | 'createdAt'>) => string
  addImageArtifact: (image: ImageMetadata, title: string, conversaId?: string, messageId?: string) => string
  addPDFArtifact: (pdf: PDFMetadata, conversaId?: string, messageId?: string) => string
  removeArtifact: (id: string) => void
  clearArtifacts: () => void
  clearArtifactsForConversa: (conversaId: string) => void  // Limpar artefatos de uma conversa específica
  setCurrentConversa: (conversaId: string | null) => void  // Definir conversa atual
  setCurrentChatMode: (mode: ChatModeType | null) => void  // Definir modo de chat atual
  setChatModeFilter: (filter: ChatModeType | 'all') => void  // Definir filtro por modo de chat
  setCategoryFilter: (filter: ArtifactCategory) => void  // Definir filtro por categoria
  selectArtifact: (id: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileDrawer: () => void
  setMobileDrawerOpen: (open: boolean) => void
  getArtifactsByMessage: (messageId: string) => Artifact[]
  getArtifactsForCurrentConversa: () => Artifact[]  // Obter artefatos da conversa atual
  getArtifactsByChatMode: (mode: ChatModeType) => Artifact[]  // Obter artefatos por modo
  getArtifactsByCategory: (category: ArtifactCategory) => Artifact[]  // Obter artefatos por categoria
  getGeneratedImages: () => Artifact[]  // Obter todas as imagens geradas
  getUploadedImages: () => Artifact[]  // Obter todas as imagens enviadas
  getUploadedPDFs: () => Artifact[]  // Obter todos os PDFs enviados
  updateQuestionAnswer: (artifactId: string, resposta: string, acertou: boolean) => void  // Sincronizar resposta
}

export const useArtifactsStore = create<ArtifactsState>((set, get) => ({
  // Estado inicial
  artifacts: [],
  selectedArtifactId: null,
  isSidebarOpen: false,
  isMobileDrawerOpen: false,
  currentConversaId: null,
  currentChatMode: null,
  chatModeFilter: 'all',
  categoryFilter: 'all',

  // Adicionar artefato genérico
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

  // Adicionar imagem como artefato
  addImageArtifact: (image, title, conversaId, messageId) => {
    const id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const type: ArtifactType = image.source === 'generated' ? 'image_generated' : 'image_uploaded'

    const newArtifact: Artifact = {
      id,
      type,
      title: title || 'Imagem',
      content: image.url,
      conversaId,
      messageId,
      createdAt: new Date(),
      metadata: {
        image
      }
    }

    set((state) => ({
      artifacts: [...state.artifacts, newArtifact],
      isSidebarOpen: true
    }))

    return id
  },

  // Adicionar PDF como artefato
  addPDFArtifact: (pdf, conversaId, messageId) => {
    const id = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newArtifact: Artifact = {
      id,
      type: 'pdf_uploaded',
      title: pdf.fileName || 'Documento PDF',
      content: pdf.url,
      conversaId,
      messageId,
      createdAt: new Date(),
      metadata: {
        pdf
      }
    }

    set((state) => ({
      artifacts: [...state.artifacts, newArtifact],
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

  // Definir modo de chat atual
  setCurrentChatMode: (mode) => {
    set({ currentChatMode: mode })
  },

  // Definir filtro por modo de chat
  setChatModeFilter: (filter) => {
    set({ chatModeFilter: filter })
  },

  // Definir filtro por categoria
  setCategoryFilter: (filter) => {
    set({ categoryFilter: filter })
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

  // Obter artefatos por modo de chat
  getArtifactsByChatMode: (mode) => {
    return get().artifacts.filter((a) => a.chatMode === mode)
  },

  // Obter artefatos por categoria
  getArtifactsByCategory: (category) => {
    const artifacts = get().artifacts
    switch (category) {
      case 'images_generated':
        return artifacts.filter((a) => a.type === 'image_generated')
      case 'images_uploaded':
        return artifacts.filter((a) => a.type === 'image_uploaded')
      case 'pdfs':
        return artifacts.filter((a) => a.type === 'pdf_uploaded')
      case 'questions':
        return artifacts.filter((a) => a.type === 'question')
      case 'diagrams':
        return artifacts.filter((a) => ['diagram', 'flowchart', 'layers'].includes(a.type))
      default:
        return artifacts
    }
  },

  // Obter todas as imagens geradas
  getGeneratedImages: () => {
    return get().artifacts.filter((a) => a.type === 'image_generated')
  },

  // Obter todas as imagens enviadas
  getUploadedImages: () => {
    return get().artifacts.filter((a) => a.type === 'image_uploaded')
  },

  // Obter todos os PDFs enviados
  getUploadedPDFs: () => {
    return get().artifacts.filter((a) => a.type === 'pdf_uploaded')
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
  question: '❓',
  simulado: '📋',
  flashcard: '🃏',
  flashcards: '🃏',
  image_generated: '🖼️',
  image_uploaded: '📷',
  pdf_uploaded: '📄',
  document: '📑'
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
  question: 'Questão',
  simulado: 'Simulado',
  flashcard: 'Flashcard',
  flashcards: 'Flashcards',
  image_generated: 'Imagem Gerada',
  image_uploaded: 'Imagem Enviada',
  pdf_uploaded: 'PDF Enviado',
  document: 'Documento'
}

// Labels para categorias de artefatos
export const CATEGORY_LABELS: Record<ArtifactCategory, string> = {
  all: 'Todos',
  images_generated: 'Imagens Geradas',
  images_uploaded: 'Imagens Enviadas',
  pdfs: 'PDFs',
  questions: 'Questões',
  diagrams: 'Diagramas',
  simulados: 'Simulados',
  flashcards_cat: 'Flashcards'
}

// Ícones para categorias
export const CATEGORY_ICONS: Record<ArtifactCategory, string> = {
  all: '📁',
  images_generated: '🖼️',
  images_uploaded: '📷',
  pdfs: '📄',
  questions: '❓',
  diagrams: '📊',
  simulados: '📋',
  flashcards_cat: '🃏'
}

// Cores para dificuldade de questões
export const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  facil: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Fácil' },
  medio: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Médio' },
  dificil: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Difícil' },
  muito_dificil: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Muito Difícil' }
}

// Labels e cores para modos de chat
export const CHAT_MODE_CONFIG: Record<ChatModeType, { label: string; icon: string; color: string; bgColor: string; description: string }> = {
  chat: {
    label: 'Chat Livre',
    icon: '💬',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Dúvidas gerais'
  },
  caso_clinico: {
    label: 'Caso Clínico',
    icon: '🏥',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    description: 'Prática clínica'
  },
  tutor: {
    label: 'Modo Tutor',
    icon: '🎓',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    description: 'Aprendizado guiado'
  },
  questoes: {
    label: 'Questões',
    icon: '📝',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    description: 'Questões de prova'
  }
}
