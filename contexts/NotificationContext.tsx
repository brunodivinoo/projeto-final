'use client'
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

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

export type GenerationTaskType = 'flashcards' | 'questoes_ia'

export interface GenerationTask {
  id: string
  taskType: GenerationTaskType
  status: 'pending' | 'generating' | 'completed' | 'error' | 'interrupted'
  deckName: string
  quantidade: number
  progress?: string
  startedAt: Date
  completedAt?: Date
  error?: string
  config?: unknown // Configuração para retomar
  result?: {
    flashcards?: number
    questoes?: number
    geracoesRestantes?: number
  }
}

type NotificationContextType = {
  notifications: Notification[]
  unreadCount: number
  generationTasks: GenerationTask[]
  hasActiveGeneration: boolean
  interruptedTasks: GenerationTask[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  removeNotification: (id: string) => void
  startGeneration: (deckId: string, deckName: string, quantidade: number, params: GenerationParams) => Promise<GenerationTask>
  startQuestoesGeneration: (config: QuestoesGenerationConfig) => Promise<GenerationTask>
  retryTask: (taskId: string) => Promise<void>
  dismissInterruptedTask: (taskId: string) => void
  clearCompletedTasks: () => void
}

interface GenerationParams {
  user_id: string
  disciplina?: string
  assunto?: string
  subassunto?: string
  dificuldade?: string
}

export interface QuestoesGenerationConfig {
  user_id: string
  disciplinas: Array<{ nome: string; peso: number }>
  assuntos: Array<{ nome: string; disciplina: string; peso: number }>
  subassuntos: Array<{ nome: string; assunto: string; disciplina: string; peso: number }>
  bancas: string[]
  dificuldades: string[]
  modalidade: 'multipla_escolha' | 'certo_errado' | 'mista'
  quantidade: number
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  generationTasks: [],
  hasActiveGeneration: false,
  interruptedTasks: [],
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
  removeNotification: () => {},
  startGeneration: async () => ({ id: '', taskType: 'flashcards', status: 'pending', deckName: '', quantidade: 0, startedAt: new Date() }),
  startQuestoesGeneration: async () => ({ id: '', taskType: 'questoes_ia', status: 'pending', deckName: '', quantidade: 0, startedAt: new Date() }),
  retryTask: async () => {},
  dismissInterruptedTask: () => {},
  clearCompletedTasks: () => {},
})

const TASKS_STORAGE_KEY = 'generation_tasks'

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [generationTasks, setGenerationTasks] = useState<GenerationTask[]>([])

  // Carregar tarefas do localStorage ao iniciar
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(TASKS_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as GenerationTask[]
        // Converter datas de string para Date e marcar tarefas ativas como interrompidas
        const tasksWithDates = parsed.map(t => ({
          ...t,
          startedAt: new Date(t.startedAt),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
          status: (t.status === 'generating' || t.status === 'pending') ? 'interrupted' as const : t.status,
        }))
        setGenerationTasks(tasksWithDates)
      } catch (e) {
        console.error('Erro ao carregar tarefas:', e)
        localStorage.removeItem(TASKS_STORAGE_KEY)
      }
    }
  }, [])

  // Salvar tarefas no localStorage quando mudar
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Manter apenas as últimas 10 tarefas
    const tasksToSave = generationTasks.slice(0, 10)
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasksToSave))
  }, [generationTasks])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 50))
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

  const dismissInterruptedTask = useCallback((taskId: string) => {
    setGenerationTasks(prev => prev.filter(t => t.id !== taskId))
  }, [])

  // Geração de Flashcards (existente)
  const startGeneration = useCallback(async (
    deckId: string,
    deckName: string,
    quantidade: number,
    params: GenerationParams
  ): Promise<GenerationTask> => {
    const taskId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newTask: GenerationTask = {
      id: taskId,
      taskType: 'flashcards',
      status: 'generating',
      deckName,
      quantidade,
      progress: 'Iniciando geracao...',
      startedAt: new Date(),
      config: { deckId, deckName, quantidade, params },
    }

    setGenerationTasks(prev => [newTask, ...prev])

    addNotification({
      type: 'generation',
      title: 'Geracao Iniciada',
      message: `Gerando ${quantidade} flashcards para "${deckName}"`,
      icon: 'auto_awesome',
      link: '/dashboard/flashcards',
    })

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

      const errorTask: GenerationTask = {
        ...newTask,
        status: 'error',
        completedAt: new Date(),
        progress: undefined,
        error: errorMessage,
      }

      setGenerationTasks(prev => prev.map(t => t.id === taskId ? errorTask : t))

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

  // Geração de Questões IA (novo)
  const startQuestoesGeneration = useCallback(async (
    config: QuestoesGenerationConfig
  ): Promise<GenerationTask> => {
    const taskId = `questoes-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const descricao = config.disciplinas.length > 0
      ? config.disciplinas.map(d => d.nome).join(', ')
      : 'Questões personalizadas'

    const newTask: GenerationTask = {
      id: taskId,
      taskType: 'questoes_ia',
      status: 'generating',
      deckName: descricao,
      quantidade: config.quantidade,
      progress: 'Iniciando geracao...',
      startedAt: new Date(),
      config,
    }

    setGenerationTasks(prev => [newTask, ...prev])

    addNotification({
      type: 'generation',
      title: 'Geracao Iniciada',
      message: `Gerando ${config.quantidade} questoes de "${descricao}"`,
      icon: 'quiz',
      link: '/dashboard/ia',
    })

    setGenerationTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, progress: 'Consultando IA...' } : t
    ))

    try {
      const response = await fetch('/api/ia/questoes/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: config.user_id, config }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar questoes')
      }

      const completedTask: GenerationTask = {
        ...newTask,
        status: 'completed',
        completedAt: new Date(),
        progress: undefined,
        result: {
          questoes: data.quantidade || 0,
          geracoesRestantes: data.geracoes_restantes,
        },
      }

      setGenerationTasks(prev => prev.map(t => t.id === taskId ? completedTask : t))

      addNotification({
        type: 'success',
        title: 'Questoes Geradas!',
        message: `${data.quantidade} questoes criadas`,
        icon: 'check_circle',
        link: '/dashboard/ia',
      })

      return completedTask
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

      const errorTask: GenerationTask = {
        ...newTask,
        status: 'error',
        completedAt: new Date(),
        progress: undefined,
        error: errorMessage,
      }

      setGenerationTasks(prev => prev.map(t => t.id === taskId ? errorTask : t))

      addNotification({
        type: 'error',
        title: 'Erro na Geracao',
        message: errorMessage,
        icon: 'error',
        link: '/dashboard/ia',
      })

      return errorTask
    }
  }, [addNotification])

  // Retomar tarefa interrompida
  const retryTask = useCallback(async (taskId: string) => {
    const task = generationTasks.find(t => t.id === taskId)
    if (!task || !task.config) return

    // Remover a tarefa antiga
    setGenerationTasks(prev => prev.filter(t => t.id !== taskId))

    if (task.taskType === 'questoes_ia') {
      await startQuestoesGeneration(task.config as QuestoesGenerationConfig)
    } else if (task.taskType === 'flashcards') {
      const cfg = task.config as { deckId: string; deckName: string; quantidade: number; params: GenerationParams }
      await startGeneration(cfg.deckId, cfg.deckName, cfg.quantidade, cfg.params)
    }
  }, [generationTasks, startQuestoesGeneration, startGeneration])

  const unreadCount = notifications.filter(n => !n.read).length
  const hasActiveGeneration = generationTasks.some(t => t.status === 'generating' || t.status === 'pending')
  const interruptedTasks = generationTasks.filter(t => t.status === 'interrupted')

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        generationTasks,
        hasActiveGeneration,
        interruptedTasks,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        removeNotification,
        startGeneration,
        startQuestoesGeneration,
        retryTask,
        dismissInterruptedTask,
        clearCompletedTasks,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
