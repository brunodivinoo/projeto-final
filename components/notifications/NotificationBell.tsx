'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications, Notification } from '@/contexts/NotificationContext'

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'Agora'
  if (diffMinutes < 60) return `${diffMinutes}m atras`
  if (diffHours < 24) return `${diffHours}h atras`
  return `${diffDays}d atras`
}

function getNotificationIcon(notification: Notification): string {
  if (notification.icon) return notification.icon
  switch (notification.type) {
    case 'success': return 'check_circle'
    case 'error': return 'error'
    case 'warning': return 'warning'
    case 'generation': return 'auto_awesome'
    default: return 'info'
  }
}

function getNotificationColor(type: Notification['type']): string {
  switch (type) {
    case 'success': return 'text-green-500 bg-green-500/20'
    case 'error': return 'text-red-500 bg-red-500/20'
    case 'warning': return 'text-yellow-500 bg-yellow-500/20'
    case 'generation': return 'text-purple-500 bg-purple-500/20'
    default: return 'text-blue-500 bg-blue-500/20'
  }
}

export function NotificationBell() {
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    hasActiveGeneration,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications()

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
      setShowDropdown(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
      >
        <span className={`material-symbols-outlined text-xl ${hasActiveGeneration ? 'animate-pulse text-purple-500' : ''}`}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 lg:top-0.5 lg:right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white dark:border-[#1c252e] flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Notificacoes
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista de notificacoes */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">
                  notifications_off
                </span>
                <p className="text-sm text-slate-500">
                  Nenhuma notificacao
                </p>
              </div>
            ) : (
              notifications.slice(0, 10).map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                    <span className="material-symbols-outlined text-lg">
                      {getNotificationIcon(notification)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-medium' : ''} text-slate-900 dark:text-white`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatTimeAgo(notification.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNotification(notification.id)
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 opacity-0 group-hover:opacity-100 hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-center">
              <span className="text-xs text-slate-500">
                +{notifications.length - 10} notificacoes
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
