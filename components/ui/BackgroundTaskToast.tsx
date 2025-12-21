'use client'
import { useState, useEffect } from 'react'
import { useBackgroundTask, BackgroundTask } from '@/contexts/BackgroundTaskContext'

export function BackgroundTaskToast() {
  const { tasks, activeTask, removeTask } = useBackgroundTask()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCompleted, setShowCompleted] = useState<string | null>(null)

  // Mostrar toast de conclusão por 5 segundos
  useEffect(() => {
    const recentlyCompleted = tasks.find(
      t => t.status === 'completed' &&
      t.completedAt &&
      Date.now() - t.completedAt.getTime() < 5000
    )

    if (recentlyCompleted) {
      setShowCompleted(recentlyCompleted.id)
      const timer = setTimeout(() => {
        setShowCompleted(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [tasks])

  // Tarefas visíveis (rodando, pendentes ou recém concluídas)
  const visibleTasks = tasks.filter(t =>
    t.status === 'running' ||
    t.status === 'pending' ||
    t.id === showCompleted ||
    (t.status === 'failed' && t.completedAt && Date.now() - t.completedAt.getTime() < 10000)
  )

  if (visibleTasks.length === 0) return null

  const getStatusIcon = (status: BackgroundTask['status']) => {
    switch (status) {
      case 'running':
        return <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
      case 'pending':
        return <span className="material-symbols-outlined text-lg text-amber-500">schedule</span>
      case 'completed':
        return <span className="material-symbols-outlined text-lg text-emerald-500">check_circle</span>
      case 'failed':
        return <span className="material-symbols-outlined text-lg text-red-500">error</span>
      case 'interrupted':
        return <span className="material-symbols-outlined text-lg text-amber-500">warning</span>
      default:
        return null
    }
  }

  const getStatusText = (status: BackgroundTask['status']) => {
    switch (status) {
      case 'running': return 'Em andamento'
      case 'pending': return 'Aguardando'
      case 'completed': return 'Concluído'
      case 'failed': return 'Falhou'
      case 'interrupted': return 'Interrompido'
      default: return ''
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {/* Toast compacto quando há apenas uma tarefa rodando */}
      {!isExpanded && activeTask && visibleTasks.length === 1 && (
        <div
          onClick={() => setIsExpanded(true)}
          className="bg-white dark:bg-[#1C252E] rounded-xl shadow-2xl border border-gray-200 dark:border-[#283039] p-3 flex items-center gap-3 cursor-pointer hover:shadow-xl transition-all animate-slide-up"
        >
          <div className="size-10 rounded-lg bg-[#137fec]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#137fec] animate-spin">progress_activity</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {activeTask.title}
            </p>
            <p className="text-xs text-[#9dabb9]">
              {activeTask.description || 'Processando...'}
            </p>
          </div>
          <span className="material-symbols-outlined text-[#9dabb9] text-sm">expand_less</span>
        </div>
      )}

      {/* Lista expandida ou quando há múltiplas tarefas */}
      {(isExpanded || visibleTasks.length > 1 || !activeTask) && visibleTasks.map(task => (
        <div
          key={task.id}
          className={`bg-white dark:bg-[#1C252E] rounded-xl shadow-2xl border border-gray-200 dark:border-[#283039] p-3 animate-slide-up ${
            task.status === 'completed' ? 'border-emerald-500/50' :
            task.status === 'failed' ? 'border-red-500/50' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`size-10 rounded-lg flex items-center justify-center ${
              task.status === 'running' ? 'bg-[#137fec]/20' :
              task.status === 'completed' ? 'bg-emerald-500/20' :
              task.status === 'failed' ? 'bg-red-500/20' :
              'bg-amber-500/20'
            }`}>
              {getStatusIcon(task.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {task.title}
                </p>
                {(task.status === 'completed' || task.status === 'failed') && (
                  <button
                    onClick={() => removeTask(task.id)}
                    className="text-[#9dabb9] hover:text-gray-900 dark:hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-[#9dabb9]">
                {task.error || task.description || getStatusText(task.status)}
              </p>

              {/* Barra de progresso */}
              {task.status === 'running' && task.progress !== undefined && (
                <div className="mt-2 h-1.5 bg-gray-200 dark:bg-[#283039] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#137fec] rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Botão de minimizar quando expandido */}
          {isExpanded && task.status === 'running' && (
            <button
              onClick={() => setIsExpanded(false)}
              className="mt-2 w-full text-xs text-[#9dabb9] hover:text-[#137fec] flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">expand_more</span>
              Minimizar
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
