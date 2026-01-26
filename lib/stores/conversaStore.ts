import { create } from 'zustand'

// Interface para conversa
interface Conversa {
  id: string
  titulo: string
  updated_at: string
}

interface ConversaState {
  // Lista de conversas
  conversas: Conversa[]

  // Conversa selecionada
  conversaSelecionada: string | null

  // Loading state
  loading: boolean

  // Actions
  setConversas: (conversas: Conversa[]) => void
  addConversa: (conversa: Conversa) => void
  removeConversa: (id: string) => void
  updateConversa: (id: string, updates: Partial<Conversa>) => void
  setConversaSelecionada: (id: string | null) => void
  setLoading: (loading: boolean) => void
  clearAll: () => void
}

export const useConversaStore = create<ConversaState>((set) => ({
  conversas: [],
  conversaSelecionada: null,
  loading: false,

  setConversas: (conversas) => set({ conversas }),

  addConversa: (conversa) => set((state) => {
    console.log('[ConversaStore] Adicionando conversa:', conversa.id)
    return {
      conversas: [conversa, ...state.conversas.filter(c => c.id !== conversa.id)]
    }
  }),

  removeConversa: (id) => set((state) => ({
    conversas: state.conversas.filter(c => c.id !== id),
    conversaSelecionada: state.conversaSelecionada === id ? null : state.conversaSelecionada
  })),

  updateConversa: (id, updates) => set((state) => ({
    conversas: state.conversas.map(c =>
      c.id === id ? { ...c, ...updates } : c
    )
  })),

  setConversaSelecionada: (id) => set({ conversaSelecionada: id }),

  setLoading: (loading) => set({ loading }),

  clearAll: () => set({ conversas: [], conversaSelecionada: null })
}))

// Export type for external use
export type { Conversa }
