'use client'
import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'generation'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  link?: string
  icon?: string
}

export interface GenerationTask {
  id: string
  status: 'pending' | 'generating' | 'completed' | 'error'
  deckName: string
  quantidade: number
  progress?: string
  startedAt: Date
  completedAt?: Date
  error?: string
  result?: {
    flashcards: number
    geracoesRestantes: number
  }
}

type NotificationContextType = {
  notifications: Notification[]
  unreadCount: number
  generationTasks: GenerationTask[]
  hasActiveGeneration: boolean
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  removeNotification: (id: string) => void
  startGeneration: (deckId: string, deckName: string, quantidade: number, params: GenerationParams) => Promise<GenerationTask>
  clearCompletedTasks: () => void
}

interface GenerationParams {
  user_id: string
  disciplina?: string
  assunto?: string
  subassunto?: string
  dificuldade?: string
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  generationTasks: [],
  hasActiveGeneration: false,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
  removeNotification: () => {},
  startGeneration: async () => ({ id: '', status: 'pending', deckName: '', quantidade: 0, startedAt: new Date() }),
  clearCompletedTasks: () => {},
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [generationTasks, setGenerationTasks] = useState<GenerationTask[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)) // Manter no maximo 50 notificacoes
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearCompletedTasks = useCallback(() => {
    setGenerationTasks(prev => prev.filter(t => t.status === 'generating' || t.status === 'pending'))
  }, [])

  const startGeneration = useCallback(async (
    deckId: string,
    deckName: string,
    quantidade: number,
    params: GenerationParams
  ): Promise<GenerationTask> => {
    const taskId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Criar task inicial
    const newTask: GenerationTask = {
      id: taskId,
      status: 'generating',
      deckName,
      quantidade,
      progress: 'Iniciando geracao...',
      startedAt: new Date(),
    }

    setGenerationTasks(prev => [newTask, ...prev])

    // Notificar inicio
    addNotification({
      type: 'generation',
      title: 'Geracao Iniciada',
      message: `Gerando ${quantidade} flashcards para "${deckName}"`,
      icon: 'auto_awesome',
      link: '/dashboard/flashcards',
    })

    // Atualizar progresso
    setGenerationTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, progress: 'Consultando IA...' } : t
    ))

    try {
      const response = await fetch('/api/flashcards/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: params.user_id,
          deck_id: deckId,
          disciplina: params.disciplina,
          assunto: params.assunto,
          subassunto: params.subassunto,
          dificuldade: params.dificuldade,
          quantidade,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar flashcards')
      }

      // Atualizar task como concluida
      const completedTask: GenerationTask = {
        ...newTask,
        status: 'completed',
        completedAt: new Date(),
        progress: undefined,
        result: {
          flashcards: data.quantidade || 0,
          geracoesRestantes: data.geracoes_restantes,
        },
      }

      setGenerationTasks(prev => prev.map(t => t.id === taskId ? completedTask : t))

      // Notificar conclusao
      addNotification({
        type: 'success',
        title: 'Flashcards Gerados!',
        message: `${data.quantidade} flashcards criados em "${deckName}"`,
        icon: 'check_circle',
        link: '/dashboard/flashcards',
      })

      return completedTask
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

      // Atualizar task como erro
      const errorTask: GenerationTask = {
        ...newTask,
        status: 'error',
        completedAt: new Date(),
        progress: undefined,
        error: errorMessage,
      }

      setGenerationTasks(prev => prev.map(t => t.id === taskId ? errorTask : t))

      // Notificar erro
      addNotification({
        type: 'error',
        title: 'Erro na Geracao',
        message: errorMessage,
        icon: 'error',
        link: '/dashboard/flashcards',
      })

      return errorTask
    }
  }, [addNotification])

  const unreadCount = notifications.filter(n => !n.read).length
  const hasActiveGeneration = generationTasks.some(t => t.status === 'generating' || t.status === 'pending')

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        generationTasks,
        hasActiveGeneration,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        removeNotification,
        startGeneration,
        clearCompletedTasks,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
