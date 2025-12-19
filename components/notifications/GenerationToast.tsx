'use client'
import { useNotifications } from '@/contexts/NotificationContext'
import { useState } from 'react'

export function GenerationToast() {
  const { generationTasks, clearCompletedTasks } = useNotifications()
  const [minimized, setMinimized] = useState(false)

  // Filtrar tasks recentes (ultimos 30 segundos para completadas/erro, ou todas ativas)
  const recentTasks = generationTasks.filter(task => {
    if (task.status === 'generating' || task.status === 'pending') return true
    if (task.completedAt) {
      const thirtySecondsAgo = new Date(Date.now() - 30000)
      return task.completedAt > thirtySecondsAgo
    }
    return false
  })

  if (recentTasks.length === 0) return null

  const activeTask = recentTasks.find(t => t.status === 'generating' || t.status === 'pending')
  const completedTasks = recentTasks.filter(t => t.status === 'completed')
  const errorTasks = recentTasks.filter(t => t.status === 'error')

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {/* Toast de geracao ativa */}
      {activeTask && (
        <div className={`bg-white dark:bg-[#1c252e] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ${minimized ? 'w-auto' : 'w-80'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-sm text-purple-500">auto_awesome</span>
              </div>
              {!minimized && (
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Gerando Flashcards
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
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-500">style</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {activeTask.deckName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activeTask.quantidade} flashcards
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse w-2/3" />
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
                Flashcards Gerados!
              </p>
              <p className="text-xs text-slate-500 truncate">
                {task.result?.flashcards} cards em &quot;{task.deckName}&quot;
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
                Erro na Geracao
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
