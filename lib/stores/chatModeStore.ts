import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Tipos de modo de chat - alinhados com ChatModes.tsx
export type ChatMode = 'chat' | 'caso_clinico' | 'tutor' | 'questoes'

// Interface para conversa no modo
export interface ModeConversation {
  id: string
  titulo: string
  updated_at: string
  modo: ChatMode
}

// Configuracao visual de cada modo
export const MODE_CONFIG: Record<ChatMode, {
  label: string
  icon: string
  color: string
  bgColor: string
  description: string
}> = {
  chat: {
    label: 'Chat Livre',
    icon: '💬',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Duvidas gerais'
  },
  caso_clinico: {
    label: 'Caso Clinico',
    icon: '🏥',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    description: 'Pratica clinica'
  },
  tutor: {
    label: 'Modo Tutor',
    icon: '🎓',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    description: 'Aprendizado guiado'
  },
  questoes: {
    label: 'Questoes',
    icon: '📝',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    description: 'Questoes de prova'
  }
}

// Interface do estado
interface ChatModeState {
  // Modo atual
  currentMode: ChatMode

  // Conversa ativa por modo
  activeConversationByMode: Record<ChatMode, string | null>

  // Lista de conversas por modo (cache local)
  conversationsByMode: Record<ChatMode, ModeConversation[]>

  // Actions
  setCurrentMode: (mode: ChatMode) => void
  setActiveConversation: (mode: ChatMode, conversaId: string | null) => void
  addConversation: (mode: ChatMode, conversa: ModeConversation) => void
  removeConversation: (mode: ChatMode, conversaId: string) => void
  setConversations: (mode: ChatMode, conversas: ModeConversation[]) => void
  clearConversationsCache: () => void
}

export const useChatModeStore = create<ChatModeState>()(
  persist(
    (set) => ({
      currentMode: 'chat',

      activeConversationByMode: {
        chat: null,
        caso_clinico: null,
        tutor: null,
        questoes: null
      },

      conversationsByMode: {
        chat: [],
        caso_clinico: [],
        tutor: [],
        questoes: []
      },

      setCurrentMode: (mode) => set({ currentMode: mode }),

      setActiveConversation: (mode, conversaId) => set((state) => ({
        activeConversationByMode: {
          ...state.activeConversationByMode,
          [mode]: conversaId
        }
      })),

      addConversation: (mode, conversa) => set((state) => ({
        conversationsByMode: {
          ...state.conversationsByMode,
          [mode]: [conversa, ...state.conversationsByMode[mode].filter(c => c.id !== conversa.id)]
        }
      })),

      removeConversation: (mode, conversaId) => set((state) => ({
        conversationsByMode: {
          ...state.conversationsByMode,
          [mode]: state.conversationsByMode[mode].filter(c => c.id !== conversaId)
        },
        // Se a conversa removida era a ativa, limpar
        activeConversationByMode: {
          ...state.activeConversationByMode,
          [mode]: state.activeConversationByMode[mode] === conversaId
            ? null
            : state.activeConversationByMode[mode]
        }
      })),

      setConversations: (mode, conversas) => set((state) => ({
        conversationsByMode: {
          ...state.conversationsByMode,
          [mode]: conversas
        }
      })),

      clearConversationsCache: () => set({
        conversationsByMode: {
          chat: [],
          caso_clinico: [],
          tutor: [],
          questoes: []
        }
      })
    }),
    {
      name: 'preparamed-chat-mode',
      partialize: (state) => ({
        currentMode: state.currentMode,
        activeConversationByMode: state.activeConversationByMode
        // Nao persistir conversationsByMode - recarregar do servidor
      })
    }
  )
)

// Hook para obter dados do modo atual
export function useCurrentModeData() {
  const {
    currentMode,
    activeConversationByMode,
    conversationsByMode
  } = useChatModeStore()

  return {
    mode: currentMode,
    config: MODE_CONFIG[currentMode],
    activeConversation: activeConversationByMode[currentMode],
    conversations: conversationsByMode[currentMode]
  }
}
