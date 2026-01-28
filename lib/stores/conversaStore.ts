import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Conversa {
  id: string
  titulo: string
  updated_at: string
}

interface ConversaState {
  conversas: Conversa[]
  conversaSelecionada: string | null
  loading: boolean
  isChangingConversa: boolean // Flag para indicar troca em andamento

  // Actions
  setConversas: (conversas: Conversa[]) => void
  addConversa: (conversa: Conversa) => void
  removeConversa: (id: string) => void
  updateConversa: (id: string, updates: Partial<Conversa>) => void
  setConversaSelecionada: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setIsChangingConversa: (changing: boolean) => void
  clearAll: () => void

  // Método otimizado para trocar conversa
  trocarConversa: (id: string | null) => Promise<void>
}

export const useConversaStore = create<ConversaState>()(
  persist(
    (set, get) => ({
      conversas: [],
      conversaSelecionada: null,
      loading: false,
      isChangingConversa: false,

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

      setIsChangingConversa: (changing) => set({ isChangingConversa: changing }),

      clearAll: () => set({ conversas: [], conversaSelecionada: null }),

      // Método otimizado para trocar conversa SEM navegação completa
      trocarConversa: async (id) => {
        const currentId = get().conversaSelecionada
        if (currentId === id) return // Já está na conversa

        console.log('[ConversaStore] Trocando conversa:', currentId, '->', id)
        set({ isChangingConversa: true, conversaSelecionada: id })

        // Atualizar URL sem causar navegação completa
        if (typeof window !== 'undefined') {
          const newUrl = id
            ? `/medicina/dashboard/ia?c=${id}`
            : '/medicina/dashboard/ia'
          window.history.pushState({}, '', newUrl)
        }

        // Pequeno delay para permitir que o componente reaja
        await new Promise(resolve => setTimeout(resolve, 50))

        set({ isChangingConversa: false })
      }
    }),
    {
      name: 'conversa-store',
      partialize: (state) => ({
        conversaSelecionada: state.conversaSelecionada
      })
    }
  )
)

// Conversa já exportada na interface acima
