'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'

// Tipos de tarefas em segundo plano
export type TaskType = 'geracao_questoes' | 'geracao_resumo' | 'geracao_pdf'

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'interrupted'

export interface BackgroundTask {
  id: string
  type: TaskType
  status: TaskStatus
  title: string
  description?: string
  progress?: number // 0-100
  result?: unknown
  error?: string
  createdAt: Date
  completedAt?: Date
  config?: unknown // Configuração para retomar a tarefa
}

interface BackgroundTaskContextType {
  tasks: BackgroundTask[]
  activeTask: BackgroundTask | null
  addTask: (task: Omit<BackgroundTask, 'id' | 'createdAt' | 'status'> & { status?: TaskStatus }) => string
  updateTask: (id: string, updates: Partial<BackgroundTask>) => void
  removeTask: (id: string) => void
  getTaskById: (id: string) => BackgroundTask | undefined
  hasPendingTasks: boolean
  hasRunningTasks: boolean
}

const BackgroundTaskContext = createContext<BackgroundTaskContextType>({
  tasks: [],
  activeTask: null,
  addTask: () => '',
  updateTask: () => {},
  removeTask: () => {},
  getTaskById: () => undefined,
  hasPendingTasks: false,
  hasRunningTasks: false,
})

const STORAGE_KEY = 'background_tasks'

export function BackgroundTaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<BackgroundTask[]>([])

  // Carregar tarefas do localStorage ao iniciar
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as BackgroundTask[]
        // Converter datas de string para Date
        const tasksWithDates = parsed.map(t => ({
          ...t,
          createdAt: new Date(t.createdAt),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
        }))

        // Marcar tarefas que estavam rodando como interrompidas
        const updatedTasks = tasksWithDates.map(t => {
          if (t.status === 'running' || t.status === 'pending') {
            return { ...t, status: 'interrupted' as TaskStatus }
          }
          return t
        })

        setTasks(updatedTasks)

        // Salvar tarefas atualizadas
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks))
      } catch (e) {
        console.error('Erro ao carregar tarefas:', e)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Salvar tarefas no localStorage quando mudar
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (tasks.length > 0) {
      // Manter apenas as últimas 10 tarefas
      const tasksToSave = tasks.slice(0, 10)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave))
    }
  }, [tasks])

  // Verificar tarefas interrompidas ao carregar e notificar usuário
  useEffect(() => {
    const interruptedTasks = tasks.filter(t => t.status === 'interrupted')
    if (interruptedTasks.length > 0 && user) {
      // Criar notificações para tarefas interrompidas
      interruptedTasks.forEach(async (task) => {
        // Criar notificação no banco
        await supabase.from('notificacoes').insert({
          user_id: user.id,
          tipo: 'aviso',
          titulo: 'Tarefa interrompida',
          mensagem: `A tarefa "${task.title}" foi interrompida. Deseja retomar?`,
          dados: { task_id: task.id, task_type: task.type, config: task.config },
          lida: false,
        })
      })
    }
  }, [user]) // Só executa quando user muda (login)

  const addTask = useCallback((taskData: Omit<BackgroundTask, 'id' | 'createdAt' | 'status'> & { status?: TaskStatus }): string => {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newTask: BackgroundTask = {
      ...taskData,
      id,
      status: taskData.status || 'pending',
      createdAt: new Date(),
    }

    setTasks(prev => [newTask, ...prev])
    return id
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<BackgroundTask>) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const updated = { ...task, ...updates }
        if (updates.status === 'completed' || updates.status === 'failed') {
          updated.completedAt = new Date()
        }
        return updated
      }
      return task
    }))
  }, [])

  const removeTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }, [])

  const getTaskById = useCallback((id: string) => {
    return tasks.find(t => t.id === id)
  }, [tasks])

  const activeTask = tasks.find(t => t.status === 'running') || null
  const hasPendingTasks = tasks.some(t => t.status === 'pending' || t.status === 'interrupted')
  const hasRunningTasks = tasks.some(t => t.status === 'running')

  return (
    <BackgroundTaskContext.Provider value={{
      tasks,
      activeTask,
      addTask,
      updateTask,
      removeTask,
      getTaskById,
      hasPendingTasks,
      hasRunningTasks,
    }}>
      {children}
    </BackgroundTaskContext.Provider>
  )
}

export const useBackgroundTask = () => useContext(BackgroundTaskContext)
