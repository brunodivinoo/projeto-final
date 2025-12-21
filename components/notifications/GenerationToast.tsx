'use client'
import { useNotifications, GenerationTask } from '@/contexts/NotificationContext'
import { useState, useEffect } from 'react'

export function GenerationToast() {
  const { generationTasks, interruptedTasks, clearCompletedTasks, retryTask, dismissInterruptedTask } = useNotifications()
  const [minimized, setMinimized] = useState(false)
  const [showInterrupted, setShowInterrupted] = useState(false)

  // Mostrar modal de tarefas interrompidas ao carregar
  useEffect(() => {
    if (interruptedTasks.length > 0) {
      setShowInterrupted(true)
    }
  }, [interruptedTasks.length])

  // Filtrar tasks recentes (ultimos 30 segundos para completadas/erro, ou todas ativas)
  const recentTasks = generationTasks.filter(task => {
    if (task.status === 'generating' || task.status === 'pending') return true
    if (task.completedAt) {
      const thirtySecondsAgo = new Date(Date.now() - 30000)
      return task.completedAt > thirtySecondsAgo
    }
    return false
  })

  const activeTask = recentTasks.find(t => t.status === 'generating' || t.status === 'pending')
  const completedTasks = recentTasks.filter(t => t.status === 'completed')
  const errorTasks = recentTasks.filter(t => t.status === 'error')

  const getTaskIcon = (task: GenerationTask) => {
    return task.taskType === 'questoes_ia' ? 'quiz' : 'style'
  }

  const getTaskTitle = (task: GenerationTask, status: 'active' | 'completed' | 'error') => {
    const type = task.taskType === 'questoes_ia' ? 'Questoes' : 'Flashcards'
    if (status === 'active') return `Gerando ${type}`
    if (status === 'completed') return `${type} Gerados!`
    return 'Erro na Geracao'
  }

  const getTaskResult = (task: GenerationTask) => {
    if (task.taskType === 'questoes_ia') {
      return `${task.result?.questoes || task.quantidade} questoes`
    }
    return `${task.result?.flashcards || task.quantidade} cards`
  }

  if (recentTasks.length === 0 && interruptedTasks.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {/* Modal de tarefas interrompidas */}
      {showInterrupted && interruptedTasks.length > 0 && (
        <div className="bg-white dark:bg-[#1c252e] rounded-xl shadow-2xl border border-amber-500/30 overflow-hidden w-80 animate-slide-up">
          <div className="flex items-center justify-between p-3 bg-amber-500/10 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">warning</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                Geracao Interrompida
              </span>
            </div>
            <button
              onClick={() => setShowInterrupted(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-500 mb-3">
              Voce tinha uma geracao em andamento que foi interrompida. Deseja retomar?
            </p>
            {interruptedTasks.slice(0, 2).map(task => (
              <div key={task.id} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-amber-500 text-sm">{getTaskIcon(task)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {task.deckName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {task.quantidade} {task.taskType === 'questoes_ia' ? 'questoes' : 'flashcards'}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  interruptedTasks.forEach(t => retryTask(t.id))
                  setShowInterrupted(false)
                }}
                className="flex-1 px-3 py-2 text-xs bg-[#137fec] text-white rounded-lg hover:bg-[#137fec]/90 transition-colors"
              >
                Retomar
              </button>
              <button
                onClick={() => {
                  interruptedTasks.forEach(t => dismissInterruptedTask(t.id))
                  setShowInterrupted(false)
                }}
                className="flex-1 px-3 py-2 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de geracao ativa */}
      {activeTask && (
        <div className={`bg-white dark:bg-[#1c252e] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ${minimized ? 'w-auto' : 'w-80'}`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 ${
            activeTask.taskType === 'questoes_ia'
              ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10'
              : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center animate-pulse ${
                activeTask.taskType === 'questoes_ia' ? 'bg-blue-500/20' : 'bg-purple-500/20'
              }`}>
                <span className={`material-symbols-outlined text-sm ${
                  activeTask.taskType === 'questoes_ia' ? 'text-blue-500' : 'text-purple-500'
                }`}>{getTaskIcon(activeTask)}</span>
              </div>
              {!minimized && (
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {getTaskTitle(activeTask, 'active')}
                </span>
              )}
            </div>
            <button
              onClick={() => setMinimized(!minimized)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
            >
              <span className="material-symbols-outlined text-lg">
                {minimized ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>

          {/* Content */}
          {!minimized && (
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activeTask.taskType === 'questoes_ia' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                }`}>
                  <span className={`material-symbols-outlined ${
                    activeTask.taskType === 'questoes_ia' ? 'text-blue-500' : 'text-purple-500'
                  }`}>{getTaskIcon(activeTask)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {activeTask.deckName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activeTask.quantidade} {activeTask.taskType === 'questoes_ia' ? 'questoes' : 'flashcards'}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full animate-pulse w-2/3 ${
                      activeTask.taskType === 'questoes_ia'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
                    }`} />
                  </div>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  {activeTask.progress || 'Processando...'}
                </p>
              </div>

              {/* Info */}
              <p className="text-xs text-slate-400 mt-3">
                Voce pode navegar normalmente. Avisaremos quando terminar.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Toasts de conclusao */}
      {completedTasks.map(task => (
        <div
          key={task.id}
          className="bg-white dark:bg-[#1c252e] rounded-xl shadow-2xl border border-green-500/30 overflow-hidden w-80 animate-slide-up"
        >
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {getTaskTitle(task, 'completed')}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {getTaskResult(task)} em &quot;{task.deckName}&quot;
              </p>
            </div>
            <button
              onClick={clearCompletedTasks}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      ))}

      {/* Toasts de erro */}
      {errorTasks.map(task => (
        <div
          key={task.id}
          className="bg-white dark:bg-[#1c252e] rounded-xl shadow-2xl border border-red-500/30 overflow-hidden w-80 animate-slide-up"
        >
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-red-500">error</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {getTaskTitle(task, 'error')}
              </p>
              <p className="text-xs text-red-500 truncate">
                {task.error}
              </p>
            </div>
            <button
              onClick={clearCompletedTasks}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
