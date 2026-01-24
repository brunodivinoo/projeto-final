'use client'

/**
 * Histórico de Conversas Recentes
 * Mostra conversas anteriores para fácil acesso
 */

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare, Sparkles, FileText, Brain } from 'lucide-react'

export interface Conversation {
  id: string
  title: string
  lastMessage: string
  updatedAt: Date
  artifactCount: number
  category: 'chat' | 'questoes' | 'flashcards' | 'simulado' | 'resumo' | 'outro'
}

interface ChatHistoryProps {
  conversations: Conversation[]
  onSelect: (id: string) => void
  className?: string
  maxItems?: number
}

const categoryIcons = {
  chat: MessageSquare,
  questoes: FileText,
  flashcards: Sparkles,
  simulado: Brain,
  resumo: FileText,
  outro: MessageSquare
}

const categoryColors = {
  chat: 'text-emerald-400',
  questoes: 'text-blue-400',
  flashcards: 'text-purple-400',
  simulado: 'text-amber-400',
  resumo: 'text-cyan-400',
  outro: 'text-white/60'
}

export function ChatHistory({
  conversations,
  onSelect,
  className = '',
  maxItems = 5
}: ChatHistoryProps) {
  if (conversations.length === 0) return null

  return (
    <div className={`w-full max-w-2xl ${className}`}>
      <h3 className="text-white/50 text-sm font-medium mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Conversas Recentes
      </h3>

      <div className="space-y-2">
        {conversations.slice(0, maxItems).map((conv) => {
          const Icon = categoryIcons[conv.category] || MessageSquare
          const colorClass = categoryColors[conv.category] || 'text-white/60'

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className="w-full text-left p-3 rounded-xl hover:bg-white/5 border border-transparent
                         hover:border-white/10 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/90 group-hover:text-white transition truncate font-medium">
                      {conv.title}
                    </span>
                    <span className="text-white/40 text-xs flex-shrink-0">
                      {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>

                  <p className="text-white/40 text-sm truncate mt-0.5">
                    {conv.lastMessage}
                  </p>

                  {conv.artifactCount > 0 && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-emerald-400/70 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {conv.artifactCount} {conv.artifactCount === 1 ? 'artefato' : 'artefatos'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {conversations.length > maxItems && (
        <button className="w-full mt-3 py-2 text-center text-white/40 hover:text-white/60 text-sm transition">
          Ver mais conversas ({conversations.length - maxItems})
        </button>
      )}
    </div>
  )
}

// Função para categorizar conversas baseado no conteúdo
export function categorizeConversation(title: string, content: string): Conversation['category'] {
  const text = (title + ' ' + content).toLowerCase()

  if (text.includes('questão') || text.includes('questões') || text.includes('questao')) {
    return 'questoes'
  }
  if (text.includes('flashcard') || text.includes('flash card')) {
    return 'flashcards'
  }
  if (text.includes('simulado') || text.includes('prova')) {
    return 'simulado'
  }
  if (text.includes('resumo') || text.includes('resumir')) {
    return 'resumo'
  }

  return 'chat'
}
