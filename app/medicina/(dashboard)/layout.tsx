'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MedAuthProvider, useMedAuth } from '@/contexts/MedAuthContext'
import { TrialBanner } from '@/components/medicina/TrialBanner'
import { UpgradeModal } from '@/components/medicina/UpgradeModal'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { BadgeMiniWidget } from '@/components/medicina/BadgeDisplay'
import { supabase } from '@/lib/supabase'
import { useConversaStore } from '@/lib/stores/conversaStore'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  PenTool,
  ClipboardList,
  Brain,
  MessageSquare,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Stethoscope,
  Crown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Gift,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Clock,
  History,
  Trash2,
  MoreHorizontal,
  Pencil,
  Check,
  ChevronDown,
  Search,
  Settings
} from 'lucide-react'

// Menu simplificado
const menuItems = [
  { href: '/medicina/dashboard', label: 'Chat IA', icon: Brain, primary: true },
  { href: '/medicina/dashboard/biblioteca', label: 'Biblioteca', icon: BookOpen },
  { href: '/medicina/dashboard/estatisticas', label: 'Estatísticas', icon: BarChart3 },
]

// Função para agrupar conversas por data
function groupConversasByDate(conversas: { id: string; titulo: string; updated_at: string }[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)
  const monthAgo = new Date(today.getTime() - 30 * 86400000)

  const groups: { label: string; icon: typeof Clock; conversas: typeof conversas }[] = [
    { label: 'Hoje', icon: Sparkles, conversas: [] },
    { label: 'Ontem', icon: Clock, conversas: [] },
    { label: 'Últimos 7 dias', icon: History, conversas: [] },
    { label: 'Este mês', icon: History, conversas: [] },
    { label: 'Anteriores', icon: History, conversas: [] }
  ]

  conversas.forEach(c => {
    const date = new Date(c.updated_at)
    if (date >= today) groups[0].conversas.push(c)
    else if (date >= yesterday) groups[1].conversas.push(c)
    else if (date >= weekAgo) groups[2].conversas.push(c)
    else if (date >= monthAgo) groups[3].conversas.push(c)
    else groups[4].conversas.push(c)
  })

  return groups.filter(g => g.conversas.length > 0)
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, plano, loading, signOut, trialStatus } = useMedAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Store de conversas
  const {
    conversas,
    conversaSelecionada,
    setConversas,
    setConversaSelecionada,
    addConversa,
    removeConversa,
    updateConversa
  } = useConversaStore()

  const [loadingConversas, setLoadingConversas] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Hoje', 'Ontem', 'Últimos 7 dias']))
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [editandoConversa, setEditandoConversa] = useState<string | null>(null)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [excluindoTodas, setExcluindoTodas] = useState(false)
  const [perfilMenuAberto, setPerfilMenuAberto] = useState(false)
  
  const menuRef = useRef<HTMLDivElement>(null)
  const perfilMenuRef = useRef<HTMLDivElement>(null)

  const { showModal, modalTipo, modalFeature, conquista, fecharModal } = useUpgradePrompt()

  // Buscar conversas
  const fetchConversas = useCallback(async () => {
    if (!user) return
    try {
      setLoadingConversas(true)
      const { data } = await supabase
        .from('conversas_ia_med')
        .select('id, titulo, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(100)

      if (data) setConversas(data)
    } catch (error) {
      console.error('Erro ao buscar conversas:', error)
    } finally {
      setLoadingConversas(false)
    }
  }, [user, setConversas])

  useEffect(() => {
    if (!loading && !user) router.push('/medicina/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading) fetchConversas()
  }, [user, loading, fetchConversas])

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-menu-portal]')) return
      if (menuAberto) {
        setMenuAberto(null)
        setMenuPosition(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuAberto])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (perfilMenuRef.current && !perfilMenuRef.current.contains(e.target as Node)) {
        setPerfilMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sincronizar com URL
  useEffect(() => {
    if (pathname === '/medicina/dashboard/ia' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const conversaId = params.get('c')
      if (conversaId) setConversaSelecionada(conversaId)
    } else if (pathname === '/medicina/dashboard') {
      setConversaSelecionada(null)
    }
  }, [pathname, setConversaSelecionada])

  // Filtrar conversas pela busca
  const filteredConversas = searchQuery.trim()
    ? conversas.filter(c => (c.titulo || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : conversas

  // Agrupar por data
  const groupedConversas = groupConversasByDate(filteredConversas)

  // Toggle grupo
  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  // Deletar conversa
  const deletarConversa = async (conversaId: string) => {
    if (!user) return
    try {
      await fetch(`/api/medicina/ia/chat?conversa_id=${conversaId}&user_id=${user.id}`, { method: 'DELETE' })
      removeConversa(conversaId)
      setMenuAberto(null)
      setMenuPosition(null)
      if (conversaSelecionada === conversaId) {
        setConversaSelecionada(null)
        router.push('/medicina/dashboard')
      }
    } catch (error) {
      console.error('Erro ao deletar:', error)
    }
  }

  // Excluir todas
  const excluirTodasConversas = async () => {
    if (!user || conversas.length === 0) return
    if (!confirm('Excluir TODAS as conversas? Esta ação não pode ser desfeita.')) return
    setExcluindoTodas(true)
    try {
      await Promise.all(conversas.map(c =>
        fetch(`/api/medicina/ia/chat?conversa_id=${c.id}&user_id=${user.id}`, { method: 'DELETE' })
      ))
      useConversaStore.getState().clearAll()
      router.push('/medicina/dashboard')
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setExcluindoTodas(false)
    }
  }

  // Salvar título
  const salvarTitulo = async (conversaId: string) => {
    if (!user || !novoTitulo.trim()) {
      setEditandoConversa(null)
      return
    }
    try {
      await supabase
        .from('conversas_ia_med')
        .update({ titulo: novoTitulo.trim() })
        .eq('id', conversaId)
        .eq('user_id', user.id)
      updateConversa(conversaId, { titulo: novoTitulo.trim() })
      setEditandoConversa(null)
      setNovoTitulo('')
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-950 to-cyan-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!user) return null

  const handleSignOut = async () => {
    await signOut()
    router.push('/medicina/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 overflow-x-hidden" data-main-container>
      {/* Mobile Header - Com espaçamento adequado para notch/ilha dinâmica */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-5 pt-[env(safe-area-inset-top,12px)] pb-3">
        <div className="flex items-center justify-between max-w-full mt-1">
          <button onClick={() => setSidebarOpen(true)} className="text-white p-2.5 rounded-xl hover:bg-white/10 transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/medicina/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold">PREPARAMED</span>
          </Link>
          <Link href="/medicina/dashboard/perfil" className="text-white p-2.5 rounded-xl hover:bg-white/10 transition-colors">
            <User className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-slate-900/95 backdrop-blur-xl border-r border-white/10
        transform transition-all duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'lg:w-[72px]' : 'w-[280px] max-w-[85vw]'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo */}
          <div className="p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <Link href="/medicina/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <span className="text-white text-lg font-bold tracking-tight">PREPARAMED</span>
                )}
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin overflow-x-hidden">
            {/* Menu Principal */}
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                        ${sidebarCollapsed ? 'justify-center' : ''}
                        ${isActive
                          ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10'
                          : item.primary
                          ? 'text-white hover:bg-white/5'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className={`font-medium ${item.primary ? 'text-sm' : 'text-sm'}`}>{item.label}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Histórico de Conversas - Estilo ChatGPT */}
            {!sidebarCollapsed && (
              <div className="mt-6 pt-4 border-t border-white/10">
                {/* Nova Conversa */}
                <Link
                  href="/medicina/dashboard"
                  onClick={() => { setSidebarOpen(false); setConversaSelecionada(null) }}
                  className="flex items-center justify-center gap-2 mx-1 mb-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white/80 hover:text-white transition-all group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                  <span className="text-sm font-medium">Nova conversa</span>
                </Link>

                {/* Busca */}
                {conversas.length > 5 && (
                  <div className="relative mx-1 mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar conversas..."
                      className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded">
                        <X className="w-3 h-3 text-white/40" />
                      </button>
                    )}
                  </div>
                )}

                {/* Lista Agrupada */}
                <div className="space-y-1 max-h-[calc(100vh-450px)] overflow-y-auto overflow-x-hidden scrollbar-thin pr-1">
                  {groupedConversas.length === 0 ? (
                    <div className="px-3 py-6 text-center">
                      <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-white/30 text-xs">
                        {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                      </p>
                    </div>
                  ) : (
                    groupedConversas.map((group) => (
                      <div key={group.label} className="mb-2">
                        {/* Header do Grupo */}
                        <button
                          onClick={() => toggleGroup(group.label)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-white/40 hover:text-white/60 transition-colors"
                        >
                          <ChevronDown className={`w-3 h-3 transition-transform ${expandedGroups.has(group.label) ? '' : '-rotate-90'}`} />
                          <span className="font-semibold uppercase tracking-wider">{group.label}</span>
                          <span className="text-white/20 ml-auto">{group.conversas.length}</span>
                        </button>

                        {/* Conversas */}
                        <AnimatePresence>
                          {expandedGroups.has(group.label) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              {group.conversas.map((conversa) => {
                                const isActive = conversaSelecionada === conversa.id
                                const isEditing = editandoConversa === conversa.id

                                return (
                                  <div key={conversa.id} className="relative group px-1">
                                    {isEditing ? (
                                      <div className="flex items-center gap-1 py-1">
                                        <input
                                          type="text"
                                          value={novoTitulo}
                                          onChange={(e) => setNovoTitulo(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') salvarTitulo(conversa.id)
                                            if (e.key === 'Escape') setEditandoConversa(null)
                                          }}
                                          className="flex-1 min-w-0 bg-white/10 border border-emerald-500/50 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none"
                                          autoFocus
                                        />
                                        <button onClick={() => salvarTitulo(conversa.id)} className="p-1.5 hover:bg-emerald-500/20 rounded-lg text-emerald-400">
                                          <Check className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setEditandoConversa(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40">
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className={`flex items-center rounded-lg transition-all ${isActive ? 'bg-emerald-500/15' : 'hover:bg-white/5'}`}>
                                        <button
                                          onClick={async () => {
                                            setSidebarOpen(false)
                                            // CORREÇÃO: Usar navegação real se não está na página do chat
                                            const isOnChatPage = pathname?.includes('/dashboard/ia')
                                            if (isOnChatPage) {
                                              // Já está na página do chat - usar pushState (mais rápido)
                                              await useConversaStore.getState().trocarConversa(conversa.id)
                                            } else {
                                              // Não está na página do chat - precisa navegar
                                              router.push(`/medicina/dashboard/ia?c=${conversa.id}`)
                                            }
                                          }}
                                          className={`flex-1 flex items-center gap-2 px-2.5 py-2 text-left min-w-0 ${isActive ? 'text-emerald-300' : 'text-white/60 hover:text-white/80'}`}
                                        >
                                          <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'opacity-40'}`} />
                                          <span className="truncate text-sm" title={conversa.titulo || 'Nova conversa'}>
                                            {conversa.titulo || 'Nova conversa'}
                                          </span>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            if (menuAberto === conversa.id) {
                                              setMenuAberto(null)
                                              setMenuPosition(null)
                                            } else {
                                              const rect = e.currentTarget.getBoundingClientRect()
                                              setMenuPosition({ top: rect.top, left: rect.right + 8 })
                                              setMenuAberto(conversa.id)
                                            }
                                          }}
                                          className={`p-1.5 rounded-lg transition-all mr-1 ${isActive || menuAberto === conversa.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:bg-white/10`}
                                        >
                                          <MoreHorizontal className="w-4 h-4 text-white/50" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>

                {/* Limpar Histórico */}
                {conversas.length > 0 && (
                  <button
                    onClick={excluirTodasConversas}
                    disabled={excluindoTodas}
                    className="w-full flex items-center justify-center gap-2 mt-3 mx-1 py-2 text-xs text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                  >
                    {excluindoTodas ? (
                      <>
                        <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3" />
                        Limpar histórico
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Ícones quando collapsed */}
            {sidebarCollapsed && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col items-center gap-2">
                <Link
                  href="/medicina/dashboard"
                  title="Nova conversa"
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                >
                  <Plus className="w-5 h-5" />
                </Link>
                {conversas.length > 0 && (
                  <div title={`${conversas.length} conversas`} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                    <History className="w-5 h-5" />
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Upgrade Banner */}
          {plano === 'gratuito' && !sidebarCollapsed && (
            <div className="mx-3 mb-4 p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-white font-semibold text-sm">Upgrade</span>
              </div>
              <p className="text-emerald-200/60 text-xs mb-3">Desbloqueie recursos avançados</p>
              <Link
                href="/medicina/dashboard/assinatura"
                onClick={() => setSidebarOpen(false)}
                className="block w-full py-2 text-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors"
              >
                Ver planos
              </Link>
            </div>
          )}

          {plano === 'gratuito' && sidebarCollapsed && (
            <div className="mx-3 mb-3 flex justify-center flex-shrink-0">
              <Link href="/medicina/dashboard/assinatura" title="Ver planos" className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </Link>
            </div>
          )}

          {/* Badges */}
          {!sidebarCollapsed && (
            <div className="mx-3 mb-3 p-3 bg-white/5 rounded-xl border border-white/10 flex-shrink-0">
              <BadgeMiniWidget />
            </div>
          )}

          {/* User Profile */}
          <div className="border-t border-white/10 p-4 flex-shrink-0">
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                <Link href="/medicina/dashboard/perfil" title={profile?.nome || 'Perfil'} className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center hover:ring-2 hover:ring-emerald-500/50 transition-all">
                  <span className="text-white font-bold">{profile?.nome?.[0]?.toUpperCase() || 'U'}</span>
                </Link>
                <button onClick={handleSignOut} title="Sair" className="w-10 h-10 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="relative" ref={perfilMenuRef}>
                <button onClick={() => setPerfilMenuAberto(!perfilMenuAberto)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{profile?.nome?.[0]?.toUpperCase() || 'U'}</span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-white font-medium truncate text-sm">{profile?.nome || 'Estudante'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                      plano === 'residencia' ? 'bg-amber-500/20 text-amber-400' :
                      plano === 'premium' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {plano === 'residencia' ? 'Residência' : plano === 'premium' ? 'Premium' : 'Gratuito'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${perfilMenuAberto ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {perfilMenuAberto && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                      <Link href="/medicina/dashboard/perfil" onClick={() => { setPerfilMenuAberto(false); setSidebarOpen(false) }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                        <User className="w-4 h-4" />
                        Meu Perfil
                      </Link>
                      <Link href="/medicina/dashboard/assinatura" onClick={() => { setPerfilMenuAberto(false); setSidebarOpen(false) }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors">
                        <Crown className="w-4 h-4" />
                        Meu Plano
                      </Link>
                      <Link href="/medicina/dashboard/indicacoes" onClick={() => { setPerfilMenuAberto(false); setSidebarOpen(false) }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                        <Gift className="w-4 h-4" />
                        Indicações
                      </Link>
                      <div className="border-t border-white/10">
                        <button onClick={() => { setPerfilMenuAberto(false); handleSignOut() }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                          <LogOut className="w-4 h-4" />
                          Sair da conta
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Toggle Sidebar */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-white/10 rounded-full items-center justify-center text-white/60 hover:text-white hover:bg-slate-700 transition-colors shadow-lg"
            title={sidebarCollapsed ? 'Expandir' : 'Recolher'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content - Otimizado para ocupar mais espaço */}
      <main 
        className={`pt-[72px] lg:pt-0 min-h-screen transition-all duration-300 overflow-x-hidden ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-72'}`}
        data-main-container
      >
        <div className="p-3 md:p-4 lg:p-6 max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* 🔴 REMOVIDO: Botão flutuante de scroll no mobile */}
      {/* O botão foi removido pois atrapalhava a UX no mobile */}

      {/* Trial Banner */}
      {trialStatus.ativo && <TrialBanner />}

      {/* Upgrade Modal */}
      {showModal && (
        <UpgradeModal tipo={modalTipo} feature={modalFeature} conquista={conquista || undefined} onClose={fecharModal} />
      )}

      {/* Menu Portal */}
      {menuAberto && menuPosition && typeof document !== 'undefined' && createPortal(
        <motion.div
          data-menu-portal
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-1 min-w-[140px] z-[9999]"
          style={{ top: menuPosition.top, left: Math.min(menuPosition.left, window.innerWidth - 160) }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const conversa = conversas.find(c => c.id === menuAberto)
              if (conversa) {
                setNovoTitulo(conversa.titulo || '')
                setEditandoConversa(conversa.id)
                setMenuAberto(null)
                setMenuPosition(null)
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Renomear
          </button>
          <button
            onClick={() => menuAberto && deletarConversa(menuAberto)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </motion.div>,
        document.body
      )}
    </div>
  )
}

export default function MedicinaDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MedAuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </MedAuthProvider>
  )
}

