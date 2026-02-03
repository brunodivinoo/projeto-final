'use client'

import { memo, useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, User, Copy, Check, Sparkles, Clock } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface StreamingMessageProps {
  content: string
  isStreaming: boolean
  tipo: 'usuario' | 'ia' | 'system'
  thinking?: string
  tokens?: number
  timestamp?: Date
  onCopy?: () => void
  copiado?: boolean
}

// Componente de cursor de digitação
const TypingCursor = memo(function TypingCursor() {
  return (
    <motion.span
      className="inline-block w-0.5 h-5 ml-0.5 bg-emerald-500 rounded-full"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
    />
  )
})

// Componente de avatar
const MessageAvatar = memo(function MessageAvatar({ tipo }: { tipo: 'usuario' | 'ia' | 'system' }) {
  if (tipo === 'usuario') {
    return (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-white" />
      </div>
    )
  }
  
  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
      <Bot className="w-4 h-4 text-white" />
    </div>
  )
})

// Componente de pensamento (extended thinking)
const ThinkingBlock = memo(function ThinkingBlock({ content }: { content: string }) {
  if (!content) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
    >
      <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1">
        <Sparkles className="w-3 h-3" />
        Extended Thinking
      </div>
      <p className="text-amber-200/70 text-sm line-clamp-3">{content}</p>
    </motion.div>
  )
})

// Componente principal de mensagem otimizado
export const StreamingMessage = memo(function StreamingMessage({
  content,
  isStreaming,
  tipo,
  thinking,
  tokens,
  timestamp,
  onCopy,
  copiado = false
}: StreamingMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevContentLength = useRef(content.length)

  // Scroll suave apenas quando conteúdo aumenta durante streaming
  useEffect(() => {
    if (isStreaming && content.length > prevContentLength.current && containerRef.current) {
      // Apenas scroll se o usuário estiver perto do final
      const container = containerRef.current
      const parent = container.parentElement
      if (parent) {
        const isNearBottom = parent.scrollHeight - parent.scrollTop - parent.clientHeight < 200
        if (isNearBottom) {
          requestAnimationFrame(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'end' })
          })
        }
      }
    }
    prevContentLength.current = content.length
  }, [content.length, isStreaming])

  // Memoizar estilos do container
  const containerStyles = useMemo(() => ({
    // Otimizações de renderização
    willChange: isStreaming ? 'contents' : 'auto',
    contain: isStreaming ? 'layout style' : 'none'
  }), [isStreaming])

  if (tipo === 'usuario') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] md:max-w-[60%]">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-md shadow-lg">
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          </div>
          {timestamp && (
            <p className="text-xs text-slate-400 mt-1 text-right">
              {timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
      style={containerStyles}
    >
      <MessageAvatar tipo={tipo} />
      
      <div className="flex-1 min-w-0">
        {/* Thinking block */}
        {thinking && <ThinkingBlock content={thinking} />}
        
        {/* Conteúdo da mensagem */}
        <div className="bg-slate-100 backdrop-blur-sm border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-lg">
          {content ? (
            <div className="prose prose-slate prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Otimizar renderização de código
                  code: ({ className, children, ...props }) => {
                    const isInline = !className
                    if (isInline) {
                      return (
                        <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-700 text-sm" {...props}>
                          {children}
                        </code>
                      )
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  // Otimizar tabelas
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse">{children}</table>
                    </div>
                  ),
                  // Otimizar parágrafos
                  p: ({ children }) => (
                    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                  ),
                  // Otimizar listas
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
                  )
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && <TypingCursor />}
            </div>
          ) : isStreaming ? (
            <div className="flex items-center gap-2 text-slate-500">
              <motion.div
                className="flex gap-1"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 bg-emerald-500 rounded-full" style={{ animationDelay: '0.4s' }} />
              </motion.div>
              <span className="text-sm">Pensando...</span>
            </div>
          ) : null}
        </div>

        {/* Footer da mensagem */}
        <div className="flex items-center justify-between mt-1.5 px-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {timestamp && (
              <span>{timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
            {tokens && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {tokens.toLocaleString()} tokens
              </span>
            )}
          </div>
          
          {!isStreaming && content && onCopy && (
            <button
              onClick={onCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-600 hover:bg-slate-100 rounded transition-all"
            >
              {copiado ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
})

// Componente de lista de mensagens otimizado
interface MessagesListProps {
  mensagens: Array<{
    id: string
    tipo: 'usuario' | 'ia' | 'system'
    conteudo: string
    timestamp: Date
    thinking?: string
    tokens?: number
  }>
  streamingId?: string | null
  copiadoId?: string | null
  onCopy?: (id: string, conteudo: string) => void
}

export const MessagesList = memo(function MessagesList({
  mensagens,
  streamingId,
  copiadoId,
  onCopy
}: MessagesListProps) {
  return (
    <div className="space-y-4">
      {mensagens.map((msg) => (
        <StreamingMessage
          key={msg.id}
          content={msg.conteudo}
          isStreaming={streamingId === msg.id}
          tipo={msg.tipo}
          thinking={msg.thinking}
          tokens={msg.tokens}
          timestamp={msg.timestamp}
          onCopy={onCopy ? () => onCopy(msg.id, msg.conteudo) : undefined}
          copiado={copiadoId === msg.id}
        />
      ))}
    </div>
  )
})

export default StreamingMessage
