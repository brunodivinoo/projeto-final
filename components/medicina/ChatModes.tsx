'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Stethoscope,
  GraduationCap,
  FileQuestion,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle,
  Info,
  Clock,
  Target,
  X,
  BarChart3
} from 'lucide-react'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { 
  useChatModeStore, 
  MODE_CONFIG, 
  MODE_LIST,
  MODE_SYSTEM_PROMPTS,
  MODE_WELCOME_MESSAGES,
  type ChatMode,
  type SessaoModo,
  type EstatisticasModo,
  type ModeConfigItem
} from '@/lib/stores/chatModeStore'
import { cn } from '@/lib/utils'

// Re-exportar tipos para compatibilidade
export type { ChatMode } from '@/lib/stores/chatModeStore'
export { MODE_CONFIG, MODE_SYSTEM_PROMPTS as MODE_PROMPTS }

// Mapeamento de ícones
const ICONS: Record<string, React.ElementType> = {
  MessageSquare,
  Stethoscope,
  GraduationCap,
  FileQuestion
}

// Configuração dos modos (legado - compatibilidade)
export const CHAT_MODES = MODE_LIST.map(config => ({
  id: config.id,
  nome: config.label,
  descricao: config.description,
  icon: ICONS[config.icon],
  cor: config.color,
  corBg: config.bgColor,
  premium: config.premium
}))

// ============================================
// COMPONENTE PRINCIPAL: ChatModeSelector
// ============================================

interface ChatModeSelectorProps {
  modoAtual: ChatMode
  onChange: (modo: ChatMode) => void
  variant?: 'tabs' | 'dropdown' | 'pills' | 'modern'
  className?: string
  disabled?: boolean
  showStats?: boolean
}

export function ChatModeSelector({
  modoAtual,
  onChange,
  variant = 'dropdown',
  className = '',
  disabled = false,
  showStats = false
}: ChatModeSelectorProps) {
  const { plano, podeUsarFuncionalidade } = useMedAuth()
  const { 
    estatisticas, 
    showModeDropdown, 
    setShowModeDropdown,
    sessaoAtiva 
  } = useChatModeStore()
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [showPreview, setShowPreview] = useState<ChatMode | null>(null)

  const modoConfig = MODE_CONFIG[modoAtual]
  const Icon = ICONS[modoConfig.icon]

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false)
        setShowPreview(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setShowModeDropdown])

  const podeUsarModo = (modo: ChatMode): boolean => {
    const config = MODE_CONFIG[modo]
    if (!config.premium) return true
    return plano === 'premium' || plano === 'residencia' || podeUsarFuncionalidade?.('ia')
  }

  const handleModeChange = (modo: ChatMode) => {
    if (!podeUsarModo(modo) || disabled) return
    onChange(modo)
    setShowModeDropdown(false)
    setShowPreview(null)
  }

  const getEstatisticasModo = (modo: ChatMode): EstatisticasModo | undefined => {
    return estatisticas.find(e => e.modo === modo)
  }

  // ============================================
  // VARIANTE MODERN (Novo design melhorado)
  // ============================================
  if (variant === 'modern') {
    return (
      <div ref={dropdownRef} className={cn("relative", className)}>
        {/* Botão Principal */}
        <button
          onClick={() => !disabled && setShowModeDropdown(!showModeDropdown)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200",
            "border backdrop-blur-sm",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "hover:scale-[1.02] active:scale-[0.98]",
            modoConfig.gradientFrom,
            modoConfig.gradientTo,
            modoConfig.borderColor,
            "bg-gradient-to-r"
          )}
        >
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", modoConfig.bgColor)}>
            <Icon className={cn("w-4 h-4", modoConfig.color)} />
          </div>
          
          <div className="flex flex-col items-start">
            <span className={cn("text-sm font-medium", modoConfig.color)}>
              {modoConfig.label}
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:block">
              {modoConfig.description}
            </span>
          </div>
          
          <motion.div animate={{ rotate: showModeDropdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className={cn("w-4 h-4 ml-1", modoConfig.color)} />
          </motion.div>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {showModeDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute z-50 mt-2",
                "w-80 max-w-[calc(100vw-2rem)]",
                "left-0 md:left-auto md:right-0",
                "bg-slate-800/95 backdrop-blur-xl",
                "border border-slate-200 rounded-2xl",
                "shadow-2xl shadow-black/50",
                "overflow-hidden"
              )}
            >
              {/* Header */}
              <div className="p-3 border-b border-slate-200 bg-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Selecionar Modo</span>
                  <button 
                    onClick={() => setShowModeDropdown(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 transition-colors md:hidden"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Lista de Modos */}
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                {MODE_LIST.map((modo) => {
                  const ModoIcon = ICONS[modo.icon]
                  const isAtivo = modoAtual === modo.id
                  const podeusar = podeUsarModo(modo.id)
                  const stats = getEstatisticasModo(modo.id)

                  return (
                    <button
                      key={modo.id}
                      onClick={() => handleModeChange(modo.id)}
                      disabled={!podeusar || disabled}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200 mb-1",
                        "text-left",
                        isAtivo && "bg-slate-100 ring-1 ring-white/20",
                        podeusar && !isAtivo && "hover:bg-slate-100",
                        !podeusar && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        modo.bgColor
                      )}>
                        <ModoIcon className={cn("w-5 h-5", modo.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white">{modo.label}</span>
                          {modo.premium && (
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                              podeusar ? "bg-amber-500/20 text-amber-400" : "bg-slate-100 text-slate-500"
                            )}>
                              {podeusar ? '✨ PRO' : '🔒 PRO'}
                            </span>
                          )}
                          {isAtivo && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{modo.descriptionLonga}</p>

                        {/* Estatísticas */}
                        {showStats && stats && stats.total_sessoes > 0 && (
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {stats.total_sessoes} sessões
                            </span>
                            {modo.id === 'questoes' && stats.total_questoes > 0 && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {stats.taxa_acerto}% acerto
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {!podeusar && <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-slate-200 bg-slate-100">
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500">
                    O histórico da conversa é mantido ao trocar de modo.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ============================================
  // VARIANTE DROPDOWN (Padrão - design original melhorado)
  // ============================================
  if (variant === 'dropdown') {
    return (
      <div ref={dropdownRef} className={cn("relative", className)}>
        <button
          onClick={() => !disabled && setShowModeDropdown(!showModeDropdown)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
            modoConfig.bgColor,
            modoConfig.color,
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{modoConfig.label}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", showModeDropdown && "rotate-180")} />
        </button>

        <AnimatePresence>
          {showModeDropdown && (
            <>
              {/* Overlay */}
              <div className="fixed inset-0 z-40" onClick={() => setShowModeDropdown(false)} />
              
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 w-72 bg-slate-800/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-2">
                  {MODE_LIST.map(modo => {
                    const ModoIcon = ICONS[modo.icon]
                    const disponivel = podeUsarModo(modo.id)
                    const ativo = modoAtual === modo.id

                    return (
                      <button
                        key={modo.id}
                        onClick={() => handleModeChange(modo.id)}
                        disabled={!disponivel || disabled}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                          ativo ? cn(modo.bgColor, modo.color) : disponivel ? "text-slate-700 hover:bg-slate-100" : "text-slate-400 cursor-not-allowed"
                        )}
                      >
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", modo.bgColor)}>
                          <ModoIcon className={cn("w-5 h-5", modo.color)} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{modo.label}</p>
                            {modo.premium && !disponivel && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">PRO</span>
                            )}
                          </div>
                          <p className="text-xs opacity-60">{modo.description}</p>
                        </div>
                        {ativo && <CheckCircle className="w-4 h-4" />}
                        {!disponivel && <Lock className="w-4 h-4" />}
                      </button>
                    )
                  })}
                </div>

                {/* Dica */}
                <div className="p-3 border-t border-slate-200 bg-slate-100">
                  <p className="text-[10px] text-slate-500 text-center">
                    💡 Trocar modo altera como a IA responde
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ============================================
  // VARIANTE PILLS (Compacta horizontal)
  // ============================================
  if (variant === 'pills') {
    return (
      <div className={cn("flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto", className)}>
        {MODE_LIST.map(modo => {
          const ModoIcon = ICONS[modo.icon]
          const disponivel = podeUsarModo(modo.id)
          const ativo = modoAtual === modo.id

          return (
            <button
              key={modo.id}
              onClick={() => disponivel && onChange(modo.id)}
              disabled={!disponivel || disabled}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap",
                ativo ? cn(modo.bgColor, modo.color) : disponivel ? "text-slate-600 hover:text-white hover:bg-slate-100" : "text-slate-400 cursor-not-allowed"
              )}
              title={modo.descriptionLonga}
            >
              <ModoIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{modo.labelCurto}</span>
              {!disponivel && <Lock className="w-3 h-3 ml-1" />}
            </button>
          )
        })}
      </div>
    )
  }

  // ============================================
  // VARIANTE TABS (Design original)
  // ============================================
  return (
    <div className={cn("flex items-center border-b border-slate-200 overflow-x-auto", className)}>
      {MODE_LIST.map(modo => {
        const ModoIcon = ICONS[modo.icon]
        const disponivel = podeUsarModo(modo.id)
        const ativo = modoAtual === modo.id

        return (
          <button
            key={modo.id}
            onClick={() => disponivel && onChange(modo.id)}
            disabled={!disponivel || disabled}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 transition-colors whitespace-nowrap",
              ativo ? modo.color : disponivel ? "text-slate-600 hover:text-white" : "text-slate-400 cursor-not-allowed"
            )}
          >
            <ModoIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{modo.label}</span>
            {!disponivel && <Lock className="w-3 h-3" />}
            
            {ativo && (
              <motion.div
                layoutId="activeTab"
                className={cn("absolute bottom-0 left-0 right-0 h-0.5", modo.bgColor.replace('/20', ''))}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ============================================
// COMPONENTE: ChatModeIntro (Tela de boas-vindas do modo)
// ============================================

interface ChatModeIntroProps {
  modo: ChatMode
  onStart?: () => void
}

export function ChatModeIntro({ modo, onStart }: ChatModeIntroProps) {
  const modoConfig = MODE_CONFIG[modo]
  if (!modoConfig || modo === 'chat') return null

  const Icon = ICONS[modoConfig.icon]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-6 rounded-2xl border max-w-lg mx-auto text-center",
        modoConfig.bgColor,
        modoConfig.borderColor
      )}
    >
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", modoConfig.bgColor)}>
        <Icon className={cn("w-8 h-8", modoConfig.color)} />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{modoConfig.label}</h3>
      <p className="text-slate-600 mb-4">{modoConfig.descriptionLonga}</p>

      <ul className="text-left space-y-2 mb-6">
        {modoConfig.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
            <Sparkles className={cn("w-4 h-4 mt-0.5 flex-shrink-0", modoConfig.color)} />
            {feature}
          </li>
        ))}
      </ul>

      {onStart && (
        <button
          onClick={onStart}
          className={cn(
            "w-full py-3 rounded-xl font-medium text-white transition-colors",
            modo === 'caso_clinico' && "bg-emerald-600 hover:bg-emerald-700",
            modo === 'tutor' && "bg-purple-600 hover:bg-purple-700",
            modo === 'questoes' && "bg-amber-600 hover:bg-amber-700"
          )}
        >
          Começar
        </button>
      )}
    </motion.div>
  )
}

// ============================================
// COMPONENTE: ModeChangeMarker (Marcador de troca de modo no chat)
// ============================================

interface ModeChangeMarkerProps {
  modo: ChatMode
  timestamp?: string
}

export function ModeChangeMarker({ modo, timestamp }: ModeChangeMarkerProps) {
  const config = MODE_CONFIG[modo]
  const Icon = ICONS[config.icon]
  
  const time = timestamp 
    ? new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex items-center justify-center py-4">
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full",
        "bg-gradient-to-r border",
        config.gradientFrom,
        config.gradientTo,
        config.borderColor
      )}>
        <Icon className={cn("w-4 h-4", config.color)} />
        <span className={cn("text-sm font-medium", config.color)}>
          Modo: {config.label}
        </span>
        {time && <span className="text-xs text-slate-500">{time}</span>}
      </div>
    </div>
  )
}

// ============================================
// HOOK: useChatMode (para compatibilidade com código existente)
// ============================================

export function useChatMode() {
  const {
    currentMode,
    setCurrentMode,
    showModeWelcome,
    setShowModeWelcome,
    sessaoAtiva,
    setSessaoAtiva
  } = useChatModeStore()

  const trocarModo = useCallback((novoModo: ChatMode) => {
    setCurrentMode(novoModo)
    setShowModeWelcome(novoModo !== 'chat')
  }, [setCurrentMode, setShowModeWelcome])

  const iniciarModo = useCallback(() => {
    setShowModeWelcome(false)
  }, [setShowModeWelcome])

  const getSystemPrompt = useCallback((): string => {
    return MODE_SYSTEM_PROMPTS[currentMode]
  }, [currentMode])

  return {
    modo: currentMode,
    trocarModo,
    mostrarIntro: showModeWelcome,
    iniciarModo,
    getSystemPrompt,
    sessaoAtiva,
    setSessaoAtiva
  }
}

export default ChatModeSelector
