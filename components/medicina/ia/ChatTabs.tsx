'use client'

import { MessageSquare, BookOpen, FileQuestion, Stethoscope } from 'lucide-react'
import { ChatMode, useChatModeStore, MODE_CONFIG } from '@/lib/stores/chatModeStore'

// Mapeamento de icones para cada modo
const MODE_ICONS: Record<ChatMode, React.ElementType> = {
  chat: MessageSquare,
  tutor: BookOpen,
  questoes: FileQuestion,
  caso_clinico: Stethoscope
}

interface ChatTabsProps {
  onModeChange?: (mode: ChatMode) => void
}

export function ChatTabs({ onModeChange }: ChatTabsProps) {
  const { currentMode, setCurrentMode, conversationsByMode } = useChatModeStore()

  const handleTabClick = (mode: ChatMode) => {
    setCurrentMode(mode)
    onModeChange?.(mode)
  }

  return (
    <div className="flex border-b border-white/10 bg-slate-900/50">
      {(Object.keys(MODE_CONFIG) as ChatMode[]).map((mode) => {
        const config = MODE_CONFIG[mode]
        const Icon = MODE_ICONS[mode]
        const isActive = currentMode === mode
        const conversationCount = conversationsByMode[mode]?.length ?? 0

        return (
          <button
            key={mode}
            onClick={() => handleTabClick(mode)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3
              transition-all relative group
              ${isActive
                ? `${config.bgColor} ${config.color} border-b-2 border-current`
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium text-sm hidden sm:inline">{config.label}</span>

            {/* Badge de contagem */}
            {conversationCount > 0 && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full
                ${isActive ? `${config.bgColor} ${config.color}` : 'bg-white/10 text-white/50'}
              `}>
                {conversationCount}
              </span>
            )}

            {/* Tooltip */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                {config.description}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Componente para exibir o modo atual com icone
interface CurrentModeDisplayProps {
  showLabel?: boolean
  className?: string
}

export function CurrentModeDisplay({ showLabel = true, className = '' }: CurrentModeDisplayProps) {
  const { currentMode } = useChatModeStore()
  const config = MODE_CONFIG[currentMode]
  const Icon = MODE_ICONS[currentMode]

  return (
    <div className={`flex items-center gap-2 ${config.color} ${className}`}>
      <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      {showLabel && (
        <span className="font-medium text-sm">{config.label}</span>
      )}
    </div>
  )
}

// Componente para selecao de modo em forma de chips
interface ModeChipsProps {
  onModeChange?: (mode: ChatMode) => void
  compact?: boolean
}

export function ModeChips({ onModeChange, compact = false }: ModeChipsProps) {
  const { currentMode, setCurrentMode } = useChatModeStore()

  const handleModeClick = (mode: ChatMode) => {
    setCurrentMode(mode)
    onModeChange?.(mode)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(MODE_CONFIG) as ChatMode[]).map((mode) => {
        const config = MODE_CONFIG[mode]
        const Icon = MODE_ICONS[mode]
        const isActive = currentMode === mode

        return (
          <button
            key={mode}
            onClick={() => handleModeClick(mode)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full
              transition-all text-sm font-medium
              ${isActive
                ? `${config.bgColor} ${config.color} ring-2 ring-current ring-opacity-50`
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            {!compact && <span>{config.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
