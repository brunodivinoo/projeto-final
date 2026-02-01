'use client'

import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import {
  Bot,
  User,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Image as ImageIcon,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ==========================================
// TIPOS
// ==========================================

interface MobileChatMessageProps {
  id: string
  tipo: 'usuario' | 'ia' | 'system'
  conteudo: string
  timestamp?: Date
  hasImage?: boolean
  hasPdf?: boolean
  thinking?: string
  isLoading?: boolean
  avatar?: string
  children?: React.ReactNode // Para renderizar conteúdo customizado (artefatos, questões, etc)
}

// ==========================================
// COMPONENTE DE MENSAGEM MOBILE
// ==========================================

function MobileChatMessageComponent({
  id,
  tipo,
  conteudo,
  timestamp,
  hasImage,
  hasPdf,
  thinking,
  isLoading,
  avatar,
  children
}: MobileChatMessageProps) {
  const [showThinking, setShowThinking] = useState(false)
  const [copied, setCopied] = useState(false)

  const isUser = tipo === 'usuario'
  const isSystem = tipo === 'system'

  // Copiar mensagem
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(conteudo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  // Formatar timestamp
  const formatTime = (date?: Date) => {
    if (!date) return ''
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Mensagem de sistema
  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center px-4 py-2"
      >
        <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs rounded-full text-center">
          {conteudo}
        </span>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
          isUser
            ? "bg-indigo-500/20"
            : "bg-gradient-to-br from-violet-500/20 to-indigo-500/20"
        )}
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="w-full h-full rounded-xl object-cover"
          />
        ) : isUser ? (
          <User className="w-5 h-5 text-indigo-400" />
        ) : (
          <Bot className="w-5 h-5 text-violet-400" />
        )}
      </div>

      {/* Conteúdo */}
      <div className={cn("flex-1 min-w-0 space-y-2", isUser ? "items-end" : "items-start")}>
        {/* Indicadores de anexo */}
        {(hasImage || hasPdf) && (
          <div className="flex gap-2 mb-1">
            {hasImage && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg">
                <ImageIcon className="w-3.5 h-3.5" />
                Imagem
              </span>
            )}
            {hasPdf && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-lg">
                <FileText className="w-3.5 h-3.5" />
                PDF
              </span>
            )}
          </div>
        )}

        {/* Bloco de Thinking (se houver) */}
        {thinking && (
          <div className="mb-2">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl text-amber-400 text-sm transition-colors"
            >
              <Loader2 className={cn("w-4 h-4", isLoading && "animate-spin")} />
              <span>Pensando...</span>
              {showThinking ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showThinking && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl"
              >
                <pre className="text-xs text-amber-200/80 whitespace-pre-wrap font-mono overflow-x-auto">
                  {thinking}
                </pre>
              </motion.div>
            )}
          </div>
        )}

        {/* Balão da mensagem */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 max-w-[85%]",
            isUser
              ? "bg-indigo-500 text-white ml-auto rounded-br-md"
              : "bg-slate-100 text-slate-800 mr-auto rounded-bl-md"
          )}
        >
          {/* Loading indicator */}
          {isLoading && !conteudo ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : (
            <>
              {/* Texto da mensagem */}
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {conteudo}
              </div>

              {/* Conteúdo customizado (artefatos, questões) */}
              {children && (
                <div className="mt-3 -mx-1">
                  {children}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer: timestamp e ações */}
        <div
          className={cn(
            "flex items-center gap-3 px-1",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          {/* Timestamp */}
          {timestamp && (
            <span className="text-[10px] text-slate-400">
              {formatTime(timestamp)}
            </span>
          )}

          {/* Botão de copiar (apenas para IA) */}
          {!isUser && !isLoading && conteudo && (
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ==========================================
// COMPONENTE DE TYPING INDICATOR
// ==========================================

export function MobileTypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 px-4 py-3"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <Bot className="w-5 h-5 text-violet-400" />
      </div>

      {/* Indicador */}
      <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1.5">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
            className="w-2.5 h-2.5 bg-white/40 rounded-full"
          />
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
            className="w-2.5 h-2.5 bg-white/40 rounded-full"
          />
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
            className="w-2.5 h-2.5 bg-white/40 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  )
}

// ==========================================
// EXPORTS
// ==========================================

export const MobileChatMessage = memo(MobileChatMessageComponent)
export default MobileChatMessage
