'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  MoreHorizontal,
  Pencil,
  Check,
  X,
  ChevronDown,
  Sparkles,
  Clock,
  Calendar,
  FolderOpen
} from 'lucide-react'
import { useConversaStore, type Conversa } from '@/lib/stores/conversaStore'

interface ChatHistorySidebarProps {
  userId: string | undefined
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onDeleteChat: (id: string) => Promise<void>
  onRenameChat: (id: string, newTitle: string) => Promise<void>
  onDeleteAllChats: () => Promise<void>
  collapsed?: boolean
}

// Agrupar conversas por período
function groupConversasByDate(conversas: Conversa[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)
  const monthAgo = new Date(today.getTime() - 30 * 86400000)

  const groups: { label: string; conversas: Conversa[] }[] = [
    { label: 'Hoje', conversas: [] },
    { label: 'Ontem', conversas: [] },
    { label: 'Últimos 7 dias', conversas: [] },
    { label: 'Últimos 30 dias', conversas: [] },
    { label: 'Mais antigas', conversas: [] }
  ]

  conversas.forEach(c => {
    const date = new Date(c.updated_at)
    if (date >= today) {
      groups[0].conversas.push(c)
    } else if (date >= yesterday) {
      groups[1].conversas.push(c)
    } else if (date >= weekAgo) {
      groups[2].conversas.push(c)
    } else if (date >= monthAgo) {
      groups[3].conversas.push(c)
    } else {
      groups[4].conversas.push(c)
    }
  })

  return groups.filter(g => g.conversas.length > 0)
}

export function ChatHistorySidebar({
  userId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onDeleteAllChats,
  collapsed = false
}: ChatHistorySidebarProps) {
  const pathname = usePathname()
  const { conversas, conversaSelecionada } = useConversaStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Hoje', 'Ontem']))
  
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filtrar conversas pela busca
  const filteredConversas = useMemo(() => {
    if (!searchQuery.trim()) return conversas
    const query = searchQuery.toLowerCase()
    return conversas.filter(c => 
      (c.titulo || '').toLowerCase().includes(query)
    )
  }, [conversas, searchQuery])

  // Agrupar por data
  const groupedConversas = useMemo(() => {
    return groupConversasByDate(filteredConversas)
  }, [filteredConversas])

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus no input de busca quando abrir
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Abrir menu de contexto
  const handleMenuOpen = (e: React.MouseEvent, conversaId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPosition({
      top: rect.top,
      left: rect.right + 8
    })
    setMenuOpenId(conversaId)
  }

  // Iniciar edição
  const startEditing = (conversa: Conversa) => {
    setEditingId(conversa.id)
    setEditTitle(conversa.titulo || 'Nova conversa')
    setMenuOpenId(null)
  }

  // Salvar edição
  const saveEdit = async () => {
    if (editingId && editTitle.trim()) {
      await onRenameChat(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }

  // Cancelar edição
  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  // Toggle grupo expandido
  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  // Deletar todas
  const handleDeleteAll = async () => {
    if (!confirm('Tem certeza que deseja excluir TODAS as conversas? Esta ação não pode ser desfeita.')) return
    setIsDeleting(true)
    try {
      await onDeleteAllChats()
    } finally {
      setIsDeleting(false)
    }
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        <button
          onClick={onNewChat}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-white transition-all"
          title="Nova conversa"
        >
          <Plus className="w-5 h-5" />
        </button>
        {conversas.length > 0 && (
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-white transition-all"
            title="Buscar conversas"
          >
            <Search className="w-5 h-5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header com logo e nova conversa */}
      <div className="p-4 space-y-4 border-b border-slate-700/50">
        {/* Logo */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">PREPARA MED</span>
        </div>

        {/* Botão nova conversa */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl text-white font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>Nova conversa</span>
        </button>

        {/* Barra de busca */}
        {conversas.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversas..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded-full"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lista de conversas agrupadas */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        <AnimatePresence mode="popLayout">
          {groupedConversas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-3 py-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-white font-medium">
                {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
              </p>
              {!searchQuery && (
                <p className="text-slate-400 text-sm mt-1">
                  Comece uma nova conversa!
                </p>
              )}
            </motion.div>
          ) : (
            groupedConversas.map((group) => (
              <div key={group.label} className="mb-4">
                {/* Header do grupo */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center gap-2 px-2 py-2 text-xs text-slate-400 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-800/50"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      expandedGroups.has(group.label) ? '' : '-rotate-90'
                    }`}
                  />
                  <span className="font-semibold uppercase tracking-wider">{group.label}</span>
                  <span className="text-slate-500 font-normal">({group.conversas.length})</span>
                </button>

                {/* Conversas do grupo */}
                <AnimatePresence>
                  {expandedGroups.has(group.label) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-1 mt-1"
                    >
                      {group.conversas.map((conversa, index) => {
                        const isActive = conversaSelecionada === conversa.id
                        const isEditing = editingId === conversa.id

                        return (
                          <motion.div
                            key={conversa.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ delay: index * 0.02 }}
                            className="relative group"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 rounded-xl border border-emerald-500/50">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit()
                                    if (e.key === 'Escape') cancelEdit()
                                  }}
                                  className="flex-1 min-w-0 bg-transparent text-sm text-white focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={saveEdit}
                                  className="p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => onSelectChat(conversa.id)}
                                className={`
                                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200
                                  ${isActive
                                    ? 'bg-emerald-500 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                  }
                                `}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isActive ? 'bg-white/20' : 'bg-slate-800'
                                }`}>
                                  <MessageSquare className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                                </div>
                                <span className="flex-1 truncate text-sm font-medium">
                                  {conversa.titulo || 'Nova conversa'}
                                </span>

                                {/* Menu de opções */}
                                <div
                                  onClick={(e) => handleMenuOpen(e, conversa.id)}
                                  className={`
                                    p-1.5 rounded-lg transition-all
                                    ${isActive
                                      ? 'opacity-100 hover:bg-white/20'
                                      : 'opacity-0 group-hover:opacity-100 hover:bg-slate-700'}
                                  `}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </div>
                              </button>
                            )}
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer com ação de deletar todas */}
      {conversas.length > 0 && (
        <div className="p-3 border-t border-slate-700/50">
          <button
            onClick={handleDeleteAll}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Limpar histórico
              </>
            )}
          </button>
        </div>
      )}

      {/* Menu de contexto flutuante */}
      <AnimatePresence>
        {menuOpenId && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[100] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 min-w-[140px]"
            style={{
              top: menuPosition.top,
              left: Math.min(menuPosition.left, window.innerWidth - 160)
            }}
          >
            <button
              onClick={() => {
                const conversa = conversas.find(c => c.id === menuOpenId)
                if (conversa) startEditing(conversa)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Renomear
            </button>
            <button
              onClick={async () => {
                if (menuOpenId) {
                  await onDeleteChat(menuOpenId)
                  setMenuOpenId(null)
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ChatHistorySidebar
