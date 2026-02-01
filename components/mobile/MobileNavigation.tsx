'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  Settings,
  Menu,
  Brain,
  GraduationCap,
  Stethoscope,
  FileQuestion,
  X,
  ChevronUp,
  History,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatModeStore, ChatMode, MODE_CONFIG, MODE_LIST } from '@/lib/stores/chatModeStore'

// ==========================================
// TIPOS
// ==========================================

interface MobileNavigationProps {
  onNewChat: () => void
  onOpenConversas: () => void
  onOpenSettings: () => void
  conversaAtiva?: boolean
  className?: string
}

interface MobileModeSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectMode: (mode: ChatMode) => void
  currentMode: ChatMode
}

// ==========================================
// ÍCONES DOS MODOS
// ==========================================

const MODE_ICONS: Record<ChatMode, React.ElementType> = {
  chat: Brain,
  tutor: GraduationCap,
  caso_clinico: Stethoscope,
  questoes: FileQuestion
}

// ==========================================
// SELETOR DE MODO FULLSCREEN (Mobile)
// ==========================================

export function MobileModeSelector({ isOpen, onClose, onSelectMode, currentMode }: MobileModeSelectorProps) {
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-900/98 backdrop-blur-xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] pb-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Escolha o modo</h2>
            <button
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 active:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Lista de modos */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-3 max-w-md mx-auto">
              {MODE_LIST.map((modo) => {
                const config = MODE_CONFIG[modo.id]
                const Icon = MODE_ICONS[modo.id]
                const isActive = currentMode === modo.id

                return (
                  <motion.button
                    key={modo.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectMode(modo.id)
                      onClose()
                    }}
                    className={cn(
                      "w-full p-5 rounded-2xl text-left transition-all",
                      "border-2",
                      isActive
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-white/10 bg-white/5 active:bg-white/10"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Ícone */}
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                        config.bgColor
                      )}>
                        <Icon className={cn("w-7 h-7", config.color)} />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{config.icon}</span>
                          <h3 className="text-base font-semibold text-white">
                            {modo.label}
                          </h3>
                          {isActive && (
                            <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full">
                              Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed">
                          {config.description}
                        </p>

                        {/* Features em destaque */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {modo.features.slice(0, 3).map((feature, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-white/5 text-white/50 text-xs rounded-lg"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Footer com dica */}
          <div className="px-5 py-4 border-t border-white/10 bg-white/5">
            <p className="text-center text-sm text-white/40">
              <Sparkles className="w-4 h-4 inline mr-1.5" />
              Dica: O modo afeta como a IA responde suas perguntas
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ==========================================
// BOTTOM NAVIGATION BAR
// ==========================================

export function MobileBottomNav({
  onNewChat,
  onOpenConversas,
  onOpenSettings,
  conversaAtiva = false,
  className
}: MobileNavigationProps) {
  const [showModeSelector, setShowModeSelector] = useState(false)
  const currentMode = useChatModeStore((state) => state.currentMode)
  const setCurrentMode = useChatModeStore((state) => state.setCurrentMode)
  const config = MODE_CONFIG[currentMode]
  const ModeIcon = MODE_ICONS[currentMode]

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
          "bg-slate-900/95 backdrop-blur-xl border-t border-white/10",
          "pb-[env(safe-area-inset-bottom,8px)]",
          className
        )}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {/* Conversas / Histórico */}
          <button
            onClick={onOpenConversas}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl min-w-[72px]",
              "active:bg-white/10 transition-colors"
            )}
          >
            <History className="w-6 h-6 text-white/60" />
            <span className="text-[10px] text-white/50 font-medium">Histórico</span>
          </button>

          {/* Seletor de Modo (central, destacado) */}
          <button
            onClick={() => setShowModeSelector(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-5 rounded-xl min-w-[80px]",
              "bg-white/5 active:bg-white/10 transition-all",
              "border border-white/10"
            )}
          >
            <div className="flex items-center gap-1.5">
              <ModeIcon className={cn("w-5 h-5", config.color)} />
              <ChevronUp className="w-3.5 h-3.5 text-white/40" />
            </div>
            <span className={cn("text-[10px] font-medium", config.color)}>
              {config.icon} {currentMode === 'caso_clinico' ? 'Caso' : currentMode === 'questoes' ? 'Quest.' : currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}
            </span>
          </button>

          {/* Novo Chat */}
          <button
            onClick={onNewChat}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl min-w-[72px]",
              "bg-indigo-500/20 active:bg-indigo-500/30 transition-colors"
            )}
          >
            <Plus className="w-6 h-6 text-indigo-400" />
            <span className="text-[10px] text-indigo-400 font-medium">Novo</span>
          </button>

          {/* Configurações */}
          <button
            onClick={onOpenSettings}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl min-w-[72px]",
              "active:bg-white/10 transition-colors"
            )}
          >
            <Settings className="w-6 h-6 text-white/60" />
            <span className="text-[10px] text-white/50 font-medium">Config</span>
          </button>
        </div>
      </nav>

      {/* Modal de Seleção de Modo */}
      <MobileModeSelector
        isOpen={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        onSelectMode={setCurrentMode}
        currentMode={currentMode}
      />
    </>
  )
}

// ==========================================
// MOBILE HEADER COMPACTO
// ==========================================

interface MobileHeaderProps {
  title?: string
  subtitle?: string
  onMenuClick?: () => void
  rightAction?: React.ReactNode
  className?: string
}

export function MobileHeader({
  title = 'PREPARAMED',
  subtitle,
  onMenuClick,
  rightAction,
  className
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 lg:hidden",
        "bg-slate-900/95 backdrop-blur-xl border-b border-white/10",
        "pt-[env(safe-area-inset-top,0px)]",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Menu / Voltar */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="w-11 h-11 flex items-center justify-center rounded-xl active:bg-white/10 transition-colors -ml-2"
          >
            <Menu className="w-6 h-6 text-white/70" />
          </button>
        )}

        {/* Título */}
        <div className="flex-1 text-center">
          <h1 className="text-base font-bold text-white tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-white/40">{subtitle}</p>
          )}
        </div>

        {/* Ação direita */}
        <div className="w-11 h-11 flex items-center justify-center">
          {rightAction}
        </div>
      </div>
    </header>
  )
}

// ==========================================
// DRAWER DE CONVERSAS (Mobile)
// ==========================================

interface MobileConversasDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function MobileConversasDrawer({ isOpen, onClose, children }: MobileConversasDrawerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[90] lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed top-0 left-0 h-full z-[95] lg:hidden",
              "w-[85%] max-w-[320px]",
              "bg-slate-900 border-r border-white/10",
              "flex flex-col",
              "pt-[env(safe-area-inset-top,0px)]",
              "pb-[env(safe-area-inset-bottom,0px)]"
            )}
          >
            {/* Header do Drawer */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/10 flex-shrink-0">
              <h2 className="text-base font-semibold text-white">Conversas</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl active:bg-white/10"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ==========================================
// EXPORTS
// ==========================================

export default MobileBottomNav
