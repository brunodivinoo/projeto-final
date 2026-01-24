'use client'

/**
 * Input de Chat Centralizado
 * Input estilizado para a página inicial do chat
 */

import { useState, useRef, useCallback } from 'react'
import { Send, Sparkles, Image, FileText, Mic } from 'lucide-react'

interface ChatInputProps {
  onSubmit: (message: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showSuggestions?: boolean
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
]

export function ChatInput({
  onSubmit,
  placeholder = 'Pergunte sobre medicina ou peça questões, flashcards, resumos...',
  disabled = false,
  className = '',
  showSuggestions = true
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [showAutoComplete, setShowAutoComplete] = useState(false)
  const [matchingSuggestion, setMatchingSuggestion] = useState<typeof SUGGESTIONS[0] | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
    }
  }, [message, disabled, onSubmit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Tab para autocomplete
    if (e.key === 'Tab' && showAutoComplete && matchingSuggestion) {
      e.preventDefault()
      setMessage(matchingSuggestion.full)
      setShowAutoComplete(false)
      inputRef.current?.focus()
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
    inputRef.current?.focus()
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Autocomplete suggestion */}
      {showAutoComplete && matchingSuggestion && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 rounded-xl bg-slate-800/95 border border-white/10 backdrop-blur-sm">
          <button
            onClick={() => applySuggestion(matchingSuggestion)}
            className="w-full text-left flex items-center gap-2 text-white/80 hover:text-white transition"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>
              <span className="text-emerald-400">{matchingSuggestion.prefix}</span>
              <span className="text-white/40"> → {matchingSuggestion.full}</span>
            </span>
            <span className="ml-auto text-xs text-white/30 bg-white/10 px-2 py-0.5 rounded">TAB</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end gap-2 p-3 rounded-2xl bg-white/5 border border-white/10
                        focus-within:border-emerald-500/50 focus-within:bg-white/[0.07] transition-all">
          {/* Textarea */}
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-white/40 resize-none
                       focus:outline-none text-base leading-relaxed max-h-32"
            style={{
              minHeight: '24px',
              height: message.split('\n').length > 1 ? 'auto' : '24px'
            }}
          />

          {/* Botões de ação */}
          <div className="flex items-center gap-1">
            {/* Botão de enviar */}
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30
                         disabled:cursor-not-allowed text-white transition-all"
              title="Enviar (Enter)"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dica de uso */}
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-white/30">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10">Enter</kbd>
            enviar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10">Shift+Enter</kbd>
            nova linha
          </span>
        </div>
      </form>
    </div>
  )
}
