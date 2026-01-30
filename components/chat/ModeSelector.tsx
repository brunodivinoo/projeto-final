'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Stethoscope,
  GraduationCap,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle,
  Sparkles,
  Clock,
  Target,
  X,
  Info
} from 'lucide-react'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { useChatModeStore, MODE_CONFIG, ChatMode } from '@/lib/stores/chatModeStore'
import { cn } from '@/lib/utils'

// Mapeamento de ícones
const ICONS: Record<string, React.ElementType> = {
  MessageSquare,
  Stethoscope,
  GraduationCap,
  FileQuestion
}

interface ModeSelectorProps {
  onModeChange?: (mode: ChatMode) => void
  disabled?: boolean
  variant?: 'default' | 'compact' | 'full'
  className?: string
}

export function ModeSelector({
  onModeChange,
  disabled = false,
  variant = 'default',
  className
}: ModeSelectorProps) {
  const { plano } = useMedAuth()
  const {
    currentMode,
    setCurrentMode,
    showModeDropdown,
    setShowModeDropdown,
    sessaoAtiva,
    estatisticas
  } = useChatModeStore()
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [showPreview, setShowPreview] = useState<ChatMode | null>(null)
  
  const modoAtual = MODE_CONFIG[currentMode]
  const IconAtual = ICONS[modoAtual.icon]
  
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
  
  // Verificar se pode usar o modo
  const podeUsarModo = (modo: ChatMode): boolean => {
    const config = MODE_CONFIG[modo]
    if (!config.premium) return true
    return plano === 'premium' || plano === 'residencia'
  }
  
  // Handler de troca de modo
  const handleModeChange = (modo: ChatMode) => {
    if (!podeUsarModo(modo) || disabled) return
    
    setCurrentMode(modo)
    setShowModeDropdown(false)
    setShowPreview(null)
    onModeChange?.(modo)
  }
  
  // Obter estatísticas do modo
  const getEstatisticasModo = (modo: ChatMode) => {
    return estatisticas.find(e => e.modo === modo)
  }
  
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
          // Cores baseadas no modo
          modoAtual.gradientFrom,
          modoAtual.gradientTo,
          modoAtual.borderColor,
          "bg-gradient-to-r"
        )}
      >
        {/* Ícone */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          modoAtual.bgColor
        )}>
          <IconAtual className={cn("w-4 h-4", modoAtual.color)} />
        </div>
        
        {/* Texto */}
        <div className="flex flex-col items-start">
          <span className={cn("text-sm font-medium", modoAtual.color)}>
            {variant === 'compact' ? modoAtual.labelCurto : modoAtual.label}
          </span>
          {variant !== 'compact' && (
            <span className="text-[10px] text-white/40">
              {modoAtual.description}
            </span>
          )}
        </div>
        
        {/* Chevron */}
        <motion.div
          animate={{ rotate: showModeDropdown ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={cn("w-4 h-4 ml-1", modoAtual.color)} />
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
              // Posicionamento responsivo
              "left-0 md:left-auto md:right-0",
              "bg-slate-800/95 backdrop-blur-xl",
              "border border-white/10 rounded-2xl",
              "shadow-2xl shadow-black/50",
              "overflow-hidden"
            )}
          >
            {/* Header do Dropdown */}
            <div className="p-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Selecionar Modo</span>
                <button 
                  onClick={() => setShowModeDropdown(false)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors md:hidden"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Trocar o modo altera como a IA responde
              </p>
            </div>
            
            {/* Lista de Modos */}
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {Object.values(MODE_CONFIG).map((modo) => {
                const Icon = ICONS[modo.icon]
                const isAtivo = currentMode === modo.id
                const podeusar = podeUsarModo(modo.id)
                const stats = getEstatisticasModo(modo.id)
                const isPreview = showPreview === modo.id
                
                return (
                  <div key={modo.id} className="mb-1 last:mb-0">
                    <button
                      onClick={() => handleModeChange(modo.id)}
                      onMouseEnter={() => setShowPreview(modo.id)}
                      onMouseLeave={() => setShowPreview(null)}
                      disabled={!podeusar || disabled}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200",
                        "text-left",
                        isAtivo && "bg-white/10 ring-1 ring-white/20",
                        podeusar && !isAtivo && "hover:bg-white/5",
                        !podeusar && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {/* Ícone */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        "transition-transform duration-200",
                        isPreview && "scale-110",
                        modo.bgColor
                      )}>
                        <Icon className={cn("w-5 h-5", modo.color)} />
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white">{modo.label}</span>
                          
                          {/* Badge Premium */}
                          {modo.premium && (
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                              podeusar 
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-white/10 text-white/40"
                            )}>
                              {podeusar ? '✨ PRO' : '🔒 PRO'}
                            </span>
                          )}
                          
                          {/* Check se ativo */}
                          {isAtivo && (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        
                        {/* Descrição */}
                        <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                          {modo.descriptionLonga}
                        </p>
                        
                        {/* Estatísticas do modo (se houver) */}
                        {stats && stats.total_sessoes > 0 && (
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {stats.total_sessoes} {stats.total_sessoes === 1 ? 'sessão' : 'sessões'}
                            </span>
                            {modo.id === 'questoes' && stats.total_questoes > 0 && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {stats.taxa_acerto}% acerto
                              </span>
                            )}
                            {stats.score_medio && (
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Score: {stats.score_medio}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Lock se não pode usar */}
                      {!podeusar && (
                        <Lock className="w-4 h-4 text-white/30 flex-shrink-0" />
                      )}
                    </button>
                    
                    {/* Preview expandido (desktop) */}
                    <AnimatePresence>
                      {isPreview && podeusar && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 py-2 mx-3 mb-2 rounded-lg bg-white/5 border border-white/5">
                            <p className="text-[10px] text-white/50 mb-2">Recursos:</p>
                            <div className="flex flex-wrap gap-1">
                              {modo.features.map((feature, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    "text-[9px] px-2 py-0.5 rounded-full",
                                    modo.bgColor,
                                    modo.color
                                  )}
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
            
            {/* Footer com dica */}
            <div className="p-3 border-t border-white/10 bg-white/5">
              <div className="flex items-start gap-2">
                <Info className="w-3 h-3 text-white/30 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-white/40 leading-relaxed">
                  O histórico da conversa é mantido ao trocar de modo. 
                  Cada modo cria uma sessão para acompanhar seu progresso.
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
// COMPONENTE DE CARD DE MODO (para sidebar)
// ============================================

interface ModeSessionCardProps {
  sessao: {
    id: string
    modo: ChatMode
    iniciado_em: string
    finalizado_em: string | null
    total_mensagens: number
    metricas: Record<string, any>
  }
  onClick?: () => void
  isActive?: boolean
}

export function ModeSessionCard({ sessao, onClick, isActive }: ModeSessionCardProps) {
  const config = MODE_CONFIG[sessao.modo]
  const Icon = ICONS[config.icon]
  
  const inicio = new Date(sessao.iniciado_em)
  const fim = sessao.finalizado_em ? new Date(sessao.finalizado_em) : null
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  
  const duracao = fim 
    ? Math.round((fim.getTime() - inicio.getTime()) / 1000 / 60)
    : Math.round((Date.now() - inicio.getTime()) / 1000 / 60)
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-xl text-left transition-all duration-200",
        "border",
        isActive 
          ? cn("bg-gradient-to-r", config.gradientFrom, config.gradientTo, config.borderColor)
          : "bg-white/5 border-white/10 hover:bg-white/10"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          config.bgColor
        )}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("text-sm font-medium", isActive ? config.color : "text-white")}>
              {config.label}
            </span>
            {!fim && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Ativo
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40">
            <span>{formatTime(inicio)}</span>
            {fim && (
              <>
                <span>→</span>
                <span>{formatTime(fim)}</span>
              </>
            )}
            <span>•</span>
            <span>{duracao} min</span>
            <span>•</span>
            <span>{sessao.total_mensagens} msgs</span>
          </div>
          
          {/* Métricas específicas */}
          {sessao.metricas?.score !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full", config.bgColor)}
                  style={{ width: `${sessao.metricas.score}%` }}
                />
              </div>
              <span className={cn("text-[10px] font-medium", config.color)}>
                {sessao.metricas.score}%
              </span>
            </div>
          )}
          
          {sessao.metricas?.questoes_total && (
            <div className="mt-1 text-[10px] text-white/40">
              {sessao.metricas.questoes_acertos}/{sessao.metricas.questoes_total} questões certas
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// ============================================
// MARCADOR DE TROCA DE MODO (para chat)
// ============================================

interface ModeChangeMarkerProps {
  modo: ChatMode
  timestamp: string
}

export function ModeChangeMarker({ modo, timestamp }: ModeChangeMarkerProps) {
  const config = MODE_CONFIG[modo]
  const Icon = ICONS[config.icon]
  
  const time = new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  return (
    <div className="flex items-center justify-center py-4">
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full",
        "bg-gradient-to-r",
        config.gradientFrom,
        config.gradientTo,
        "border",
        config.borderColor
      )}>
        <Icon className={cn("w-4 h-4", config.color)} />
        <span className={cn("text-sm font-medium", config.color)}>
          Modo: {config.label}
        </span>
        <span className="text-xs text-white/40">
          {time}
        </span>
      </div>
    </div>
  )
}

// ============================================
// INDICADOR DE MODO ATIVO (compacto)
// ============================================

interface ModeIndicatorProps {
  className?: string
}

export function ModeIndicator({ className }: ModeIndicatorProps) {
  const { currentMode } = useChatModeStore()
  const config = MODE_CONFIG[currentMode]
  const Icon = ICONS[config.icon]
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-lg",
      config.bgColor,
      className
    )}>
      <Icon className={cn("w-3 h-3", config.color)} />
      <span className={cn("text-xs font-medium", config.color)}>
        {config.labelCurto}
      </span>
    </div>
  )
}

export default ModeSelector
