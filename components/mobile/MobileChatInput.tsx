'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Image as ImageIcon,
  FileUp,
  Search,
  Zap,
  Stethoscope,
  Plus,
  X,
  Mic,
  MicOff,
  Loader2,
  ChevronUp,
  Camera,
  Paperclip
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ==========================================
// TIPOS
// ==========================================

interface MobileChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onImageUpload?: () => void
  onPdfUpload?: () => void
  onWebSearch?: () => void
  onExamAnalyzer?: () => void
  onVoiceInput?: (transcript: string) => void
  isLoading?: boolean
  isWebSearchEnabled?: boolean
  isExtendedThinkingEnabled?: boolean
  onToggleWebSearch?: () => void
  onToggleExtendedThinking?: () => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  className?: string
}

interface QuickActionButtonProps {
  icon: React.ElementType
  label: string
  onClick: () => void
  isActive?: boolean
  activeColor?: string
  disabled?: boolean
}

// ==========================================
// BOTÃO DE AÇÃO RÁPIDA
// ==========================================

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  isActive = false,
  activeColor = 'text-indigo-400',
  disabled = false
}: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 py-3 px-4 rounded-xl min-w-[72px]",
        "transition-all active:scale-95",
        disabled && "opacity-50 pointer-events-none",
        isActive
          ? `bg-slate-100 ${activeColor}`
          : "text-slate-500 active:bg-slate-100"
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

// ==========================================
// PAINEL DE AÇÕES EXPANDIDO
// ==========================================

interface ActionsExpandedProps {
  isOpen: boolean
  onClose: () => void
  onImageUpload?: () => void
  onPdfUpload?: () => void
  onWebSearch?: () => void
  onExamAnalyzer?: () => void
  isWebSearchEnabled?: boolean
  isExtendedThinkingEnabled?: boolean
  onToggleWebSearch?: () => void
  onToggleExtendedThinking?: () => void
}

function ActionsExpanded({
  isOpen,
  onClose,
  onImageUpload,
  onPdfUpload,
  onWebSearch,
  onExamAnalyzer,
  isWebSearchEnabled,
  isExtendedThinkingEnabled,
  onToggleWebSearch,
  onToggleExtendedThinking
}: ActionsExpandedProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          {/* Painel de ações */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-slate-800 rounded-t-3xl border-t border-slate-200",
              "pb-[env(safe-area-inset-bottom,16px)]"
            )}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Grid de ações */}
            <div className="px-4 pb-4">
              <div className="grid grid-cols-4 gap-2">
                {/* Imagem */}
                {onImageUpload && (
                  <QuickActionButton
                    icon={ImageIcon}
                    label="Imagem"
                    onClick={() => {
                      onImageUpload()
                      onClose()
                    }}
                  />
                )}

                {/* PDF */}
                {onPdfUpload && (
                  <QuickActionButton
                    icon={FileUp}
                    label="PDF"
                    onClick={() => {
                      onPdfUpload()
                      onClose()
                    }}
                  />
                )}

                {/* Busca Web */}
                {onToggleWebSearch && (
                  <QuickActionButton
                    icon={Search}
                    label="Busca Web"
                    onClick={onToggleWebSearch}
                    isActive={isWebSearchEnabled}
                    activeColor="text-emerald-400"
                  />
                )}

                {/* Extended Thinking */}
                {onToggleExtendedThinking && (
                  <QuickActionButton
                    icon={Zap}
                    label="Pensar+"
                    onClick={onToggleExtendedThinking}
                    isActive={isExtendedThinkingEnabled}
                    activeColor="text-amber-400"
                  />
                )}

                {/* Analisar Exame */}
                {onExamAnalyzer && (
                  <QuickActionButton
                    icon={Stethoscope}
                    label="Exame"
                    onClick={() => {
                      onExamAnalyzer()
                      onClose()
                    }}
                  />
                )}

                {/* Câmera */}
                <QuickActionButton
                  icon={Camera}
                  label="Câmera"
                  onClick={() => {
                    // TODO: Implementar captura de câmera
                    onClose()
                  }}
                />
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 my-4" />

              {/* Status das opções ativas */}
              <div className="flex flex-wrap gap-2">
                {isWebSearchEnabled && (
                  <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    Busca Web ativa
                  </span>
                )}
                {isExtendedThinkingEnabled && (
                  <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Pensamento estendido
                  </span>
                )}
              </div>
            </div>

            {/* Botão de fechar */}
            <button
              onClick={onClose}
              className="absolute top-3 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 active:bg-slate-100"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ==========================================
// MOBILE CHAT INPUT
// ==========================================

export function MobileChatInput({
  value,
  onChange,
  onSend,
  onImageUpload,
  onPdfUpload,
  onWebSearch,
  onExamAnalyzer,
  onVoiceInput,
  isLoading = false,
  isWebSearchEnabled = false,
  isExtendedThinkingEnabled = false,
  onToggleWebSearch,
  onToggleExtendedThinking,
  placeholder = 'Digite sua mensagem...',
  maxLength = 4000,
  disabled = false,
  className
}: MobileChatInputProps) {
  const [showActions, setShowActions] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [value])

  // Enviar com Enter (sem shift)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && value.trim()) {
      e.preventDefault()
      onSend()
    }
  }, [isLoading, value, onSend])

  const canSend = value.trim().length > 0 && !isLoading && !disabled

  return (
    <>
      {/* Container do Input */}
      <div
        className={cn(
          "bg-slate-900/95 backdrop-blur-xl border-t border-slate-200",
          "pb-[env(safe-area-inset-bottom,8px)]",
          "lg:hidden", // Apenas mobile
          className
        )}
      >
        {/* Indicadores ativos (se houver) */}
        {(isWebSearchEnabled || isExtendedThinkingEnabled) && (
          <div className="flex gap-2 px-3 pt-2 pb-1">
            {isWebSearchEnabled && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full flex items-center gap-1">
                <Search className="w-3 h-3" />
                Web
              </span>
            )}
            {isExtendedThinkingEnabled && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Think+
              </span>
            )}
          </div>
        )}

        {/* Área de input */}
        <div className="flex items-end gap-2 px-3 py-2">
          {/* Botão de ações (+) */}
          <button
            onClick={() => setShowActions(true)}
            disabled={disabled || isLoading}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0",
              "bg-slate-100 active:bg-slate-100 transition-colors",
              "disabled:opacity-50"
            )}
          >
            <Plus className="w-6 h-6 text-slate-600" />
          </button>

          {/* Textarea container */}
          <div
            className={cn(
              "flex-1 flex items-end gap-2 px-4 py-2.5 rounded-2xl",
              "bg-slate-100 border transition-all",
              isFocused ? "border-indigo-500/50" : "border-slate-200"
            )}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              maxLength={maxLength}
              rows={1}
              className={cn(
                "flex-1 bg-transparent text-white text-base resize-none",
                "placeholder:text-slate-400 outline-none",
                "min-h-[24px] max-h-[120px]",
                "disabled:opacity-50"
              )}
            />

            {/* Contador de caracteres (quando próximo do limite) */}
            {value.length > maxLength * 0.8 && (
              <span className={cn(
                "text-[10px] flex-shrink-0",
                value.length > maxLength * 0.95 ? "text-red-400" : "text-slate-400"
              )}>
                {value.length}/{maxLength}
              </span>
            )}
          </div>

          {/* Botão de enviar ou gravar */}
          {canSend ? (
            <button
              onClick={onSend}
              disabled={isLoading}
              className={cn(
                "w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0",
                "bg-indigo-500 active:bg-indigo-600 transition-colors",
                "disabled:opacity-50"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          ) : (
            <button
              onClick={() => setIsRecording(!isRecording)}
              disabled={disabled || isLoading}
              className={cn(
                "w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0",
                "transition-colors",
                isRecording
                  ? "bg-red-500 active:bg-red-600"
                  : "bg-slate-100 active:bg-slate-100",
                "disabled:opacity-50"
              )}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-slate-600" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Painel de ações expandido */}
      <ActionsExpanded
        isOpen={showActions}
        onClose={() => setShowActions(false)}
        onImageUpload={onImageUpload}
        onPdfUpload={onPdfUpload}
        onWebSearch={onWebSearch}
        onExamAnalyzer={onExamAnalyzer}
        isWebSearchEnabled={isWebSearchEnabled}
        isExtendedThinkingEnabled={isExtendedThinkingEnabled}
        onToggleWebSearch={onToggleWebSearch}
        onToggleExtendedThinking={onToggleExtendedThinking}
      />
    </>
  )
}

export default MobileChatInput
