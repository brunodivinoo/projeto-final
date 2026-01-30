'use client'

/**
 * Input de Chat Centralizado - Versão 2.0
 * Melhorias:
 * - Textarea expansível (não corta texto longo)
 * - Auto-resize conforme digitação
 * - Sugestões de autocomplete inteligentes
 * - Melhor UX no mobile
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Sparkles, Mic } from 'lucide-react'

interface ChatInputProps {
  onSubmit: (message: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showSuggestions?: boolean
  initialValue?: string
}

// Sugestões de prompt que aparecem ao digitar
const SUGGESTIONS = [
  { prefix: 'questões', full: 'Crie 5 questões sobre ' },
  { prefix: 'flashcards', full: 'Gere flashcards para estudar ' },
  { prefix: 'simulado', full: 'Monte um simulado com 10 questões sobre ' },
  { prefix: 'resumo', full: 'Faça um resumo completo sobre ' },
  { prefix: 'explique', full: 'Explique detalhadamente ' },
  { prefix: 'compare', full: 'Compare e diferencie ' },
  { prefix: 'plano', full: 'Crie um plano de estudos para ' },
  { prefix: 'caso', full: 'Crie um caso clínico sobre ' },
  { prefix: 'diagnóstico', full: 'Quais são os diagnósticos diferenciais de ' },
  { prefix: 'tratamento', full: 'Qual o tratamento para ' },
]

export function ChatInput({
  onSubmit,
  placeholder = 'Pergunte, peça questões, flashcards, resumos...',
  disabled = false,
  className = '',
  showSuggestions = true,
  initialValue = ''
}: ChatInputProps) {
  const [message, setMessage] = useState(initialValue)
  const [showAutoComplete, setShowAutoComplete] = useState(false)
  const [matchingSuggestion, setMatchingSuggestion] = useState<typeof SUGGESTIONS[0] | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height para calcular corretamente
    textarea.style.height = 'auto'
    
    // Calcular nova altura baseada no scrollHeight
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 52), 200)
    textarea.style.height = `${newHeight}px`
  }, [])

  // Ajustar altura quando mensagem muda
  useEffect(() => {
    adjustTextareaHeight()
  }, [message, adjustTextareaHeight])

  // Atualizar quando initialValue muda
  useEffect(() => {
    if (initialValue) {
      setMessage(initialValue)
    }
  }, [initialValue])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Verificar autocomplete
    if (showSuggestions && value.length >= 3) {
      const lowerValue = value.toLowerCase()
      const match = SUGGESTIONS.find(s => s.prefix.startsWith(lowerValue))
      if (match && !value.includes(' ')) {
        setMatchingSuggestion(match)
        setShowAutoComplete(true)
      } else {
        setShowAutoComplete(false)
      }
    } else {
      setShowAutoComplete(false)
    }
  }, [showSuggestions])

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (message.trim() && !disabled) {
      onSubmit(message.trim())
      setMessage('')
      setShowAutoComplete(false)
      
      // Reset altura do textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = '52px'
      }
    }
  }, [message, disabled, onSubmit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Tab para autocomplete
    if (e.key === 'Tab' && showAutoComplete && matchingSuggestion) {
      e.preventDefault()
      setMessage(matchingSuggestion.full)
      setShowAutoComplete(false)
      textareaRef.current?.focus()
    }

    // Enter para enviar (sem Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [showAutoComplete, matchingSuggestion, handleSubmit])

  const applySuggestion = useCallback((suggestion: typeof SUGGESTIONS[0]) => {
    setMessage(suggestion.full)
    setShowAutoComplete(false)
    textareaRef.current?.focus()
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Autocomplete suggestion */}
      {showAutoComplete && matchingSuggestion && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 rounded-xl bg-slate-800/95 border border-white/10 backdrop-blur-sm z-10">
          <button
            onClick={() => applySuggestion(matchingSuggestion)}
            className="w-full text-left flex items-center gap-2 text-white/80 hover:text-white transition"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="text-emerald-400">{matchingSuggestion.prefix}</span>
              <span className="text-white/40"> → {matchingSuggestion.full}</span>
            </span>
            <span className="text-xs text-white/30 bg-white/10 px-2 py-0.5 rounded flex-shrink-0">TAB</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10
                        focus-within:border-emerald-500/50 focus-within:bg-white/[0.05] transition-all
                        shadow-lg shadow-black/10">
          {/* Textarea expansível */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="chat-textarea-expandable flex-1 bg-transparent text-white placeholder-white/40 
                       resize-none focus:outline-none text-sm md:text-base leading-relaxed
                       scrollbar-thin pr-2"
            style={{
              minHeight: '52px',
              maxHeight: '200px',
            }}
          />

          {/* Botões de ação */}
          <div className="flex items-center gap-1.5 pb-0.5">
            {/* Indicador de caracteres quando mensagem é longa */}
            {message.length > 500 && (
              <span className="text-[10px] text-white/30 tabular-nums">
                {message.length}
              </span>
            )}
            
            {/* Botão de enviar */}
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30
                         disabled:cursor-not-allowed text-white transition-all
                         active:scale-95 flex-shrink-0"
              title="Enviar (Enter)"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dica de uso - escondida no mobile para economizar espaço */}
        <div className="hidden md:flex items-center justify-center gap-4 mt-2 text-xs text-white/30">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">Enter</kbd>
            enviar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">Shift+Enter</kbd>
            nova linha
          </span>
        </div>
      </form>
    </div>
  )
}
