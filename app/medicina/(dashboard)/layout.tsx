'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MedAuthProvider, useMedAuth } from '@/contexts/MedAuthContext'
import { TrialBanner } from '@/components/medicina/TrialBanner'
import { UpgradeModal } from '@/components/medicina/UpgradeModal'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { BadgeMiniWidget } from '@/components/medicina/BadgeDisplay'
import { supabase } from '@/lib/supabase'
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
  MoreVertical,
  Pencil,
  Check,
  ChevronDown
} from 'lucide-react'

// Interface para conversas do histórico
interface Conversa {
  id: string
  titulo: string
  updated_at: string
}

// Menu simplificado - Funcionalidades migradas para o Chat central
const menuItems = [
  { href: '/medicina/dashboard', label: 'Chat IA', icon: Brain, primary: true }, // Chat é a página principal
  { href: '/medicina/dashboard/biblioteca', label: 'Biblioteca', icon: BookOpen },
  { href: '/medicina/dashboard/estatisticas', label: 'Estatísticas', icon: BarChart3 },
]

// REMOVIDOS (migrados para o chat):
// - Questões → Agora geradas via chat ("crie 5 questões sobre...")
// - Simulados → Agora gerados via chat ("monte um simulado de...")
// - Flashcards → Agora gerados via chat ("gere flashcards de...")
// - Anotações → Agora artefatos salvos na biblioteca
// - IA Tutora → Dashboard É o chat agora

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, plano, loading, signOut, trialStatus } = useMedAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Sidebar recolhida no desktop
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [loadingConversas, setLoadingConversas] = useState(false)
  const [showAllConversas, setShowAllConversas] = useState(false) // Expandir histórico
  const [menuAberto, setMenuAberto] = useState<string | null>(null) // Menu de 3 pontos
  const [editandoConversa, setEditandoConversa] = useState<string | null>(null) // Edição de título
  const [novoTitulo, setNovoTitulo] = useState('')
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null) // Para seleção visual imediata
  const [excluindoTodas, setExcluindoTodas] = useState(false)
  const menuRef = useRef<HTMLLIElement>(null)

  // Hook para modais de upgrade
  const {
    showModal,
    modalTipo,
    modalFeature,
    conquista,
    fecharModal
  } = useUpgradePrompt()

  // Buscar conversas recentes
  const fetchConversas = useCallback(async () => {
    if (!user) return

    try {
      setLoadingConversas(true)
      const { data } = await supabase
        .from('conversas_ia_med')
        .select('id, titulo, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50) // Buscar mais para permitir expandir

      if (data) {
        setConversas(data)
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error)
    } finally {
      setLoadingConversas(false)
    }
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/medicina/login')
    }
  }, [user, loading, router])

  // Carregar conversas quando usuário estiver disponível
  useEffect(() => {
    if (user && !loading) {
      fetchConversas()
    }
  }, [user, loading, fetchConversas])

  // Sincronizar seleção com a URL atual
  useEffect(() => {
    if (pathname === '/medicina/dashboard/ia' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const conversaId = params.get('c')
      if (conversaId) {
        setConversaSelecionada(conversaId)
      }
    } else if (pathname === '/medicina/dashboard') {
      // Na home, limpar seleção
      setConversaSelecionada(null)
    }
  }, [pathname])

  // Função auxiliar para formatar tempo relativo
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  // Deletar conversa
  const deletarConversa = async (conversaId: string) => {
    if (!user) return
    try {
      await fetch(`/api/medicina/ia/chat?conversa_id=${conversaId}&user_id=${user.id}`, {
        method: 'DELETE'
      })
      setConversas(prev => prev.filter(c => c.id !== conversaId))
      setMenuAberto(null)
    } catch (error) {
      console.error('Erro ao deletar conversa:', error)
    }
  }

  // Excluir todas as conversas
  const excluirTodasConversas = async () => {
    if (!user || conversas.length === 0) return
    if (!confirm('Tem certeza que deseja excluir TODAS as conversas? Esta ação não pode ser desfeita.')) return

    setExcluindoTodas(true)
    try {
      // Deletar todas em paralelo
      await Promise.all(
        conversas.map(c =>
          fetch(`/api/medicina/ia/chat?conversa_id=${c.id}&user_id=${user.id}`, { method: 'DELETE' })
        )
      )
      setConversas([])
      setConversaSelecionada(null)
    } catch (error) {
      console.error('Erro ao excluir conversas:', error)
    } finally {
      setExcluindoTodas(false)
    }
  }

  // Salvar título editado
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

      setConversas(prev => prev.map(c =>
        c.id === conversaId ? { ...c, titulo: novoTitulo.trim() } : c
      ))
      setEditandoConversa(null)
      setNovoTitulo('')
    } catch (error) {
      console.error('Erro ao salvar título:', error)
    }
  }

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-950 to-cyan-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/medicina/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-2"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/medicina/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold">PREPARAMED</span>
          </Link>
          <Link href="/medicina/dashboard/perfil" className="text-white p-2">
            <User className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-slate-900 border-r border-white/10
        transform transition-all duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'lg:w-20' : 'w-64'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <Link href="/medicina/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <span className="text-white text-lg font-bold">PREPARAMED</span>
                )}
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation + Histórico */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
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
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        ${sidebarCollapsed ? 'justify-center' : ''}
                        ${isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : (item as { highlight?: boolean }).highlight
                          ? 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300'
                          : (item as { primary?: boolean }).primary
                          ? 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 font-semibold'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }
                      `}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${(item as { highlight?: boolean }).highlight && !isActive ? 'text-amber-400' : ''}`} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="font-medium">{item.label}</span>
                          {(item as { highlight?: boolean }).highlight && !isActive && (
                            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded font-bold">
                              PRO
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Separador e Histórico de Conversas - estilo Meta AI */}
            {!sidebarCollapsed && (
              <div className="mt-6 pt-4 border-t border-white/10">
                {/* Botões de ação */}
                <div className="mx-3 mb-3 space-y-2">
                  {/* Botão Nova Conversa em destaque */}
                  <Link
                    href="/medicina/dashboard"
                    onClick={() => { setSidebarOpen(false); setConversaSelecionada(null) }}
                    className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 hover:text-emerald-300 transition-all text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Conversa
                  </Link>

                  {/* Botão Excluir Todas */}
                  {conversas.length > 0 && (
                    <button
                      onClick={excluirTodasConversas}
                      disabled={excluindoTodas}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all text-xs font-medium disabled:opacity-50"
                    >
                      {excluindoTodas ? (
                        <>
                          <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3" />
                          Excluir Todas ({conversas.length})
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Header do Histórico */}
                {conversas.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-3 mb-2">
                      <span className="text-white/40 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-3 h-3" />
                        Histórico
                      </span>
                    </div>

                    {/* Lista de Conversas - sem scroll horizontal */}
                    <ul className="space-y-0.5 max-h-[250px] overflow-y-auto overflow-x-hidden scrollbar-thin">
                      {(showAllConversas ? conversas : conversas.slice(0, 10)).map((conversa) => {
                        // Seleção visual: apenas UMA pode estar selecionada
                        const isActive = conversaSelecionada === conversa.id

                        // Abreviar título para não ter scroll horizontal
                        const tituloAbreviado = (conversa.titulo || 'Conversa sem título').length > 22
                          ? (conversa.titulo || 'Conversa sem título').substring(0, 22) + '...'
                          : (conversa.titulo || 'Conversa sem título')

                        return (
                          <li key={conversa.id} className="relative group" ref={menuAberto === conversa.id ? menuRef : undefined}>
                            {editandoConversa === conversa.id ? (
                              // Modo edição
                              <div className="flex items-center gap-1 px-2 py-2">
                                <input
                                  type="text"
                                  value={novoTitulo}
                                  onChange={(e) => setNovoTitulo(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') salvarTitulo(conversa.id)
                                    if (e.key === 'Escape') setEditandoConversa(null)
                                  }}
                                  className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                                  autoFocus
                                />
                                <button
                                  onClick={() => salvarTitulo(conversa.id)}
                                  className="p-1 hover:bg-emerald-500/20 rounded text-emerald-400 flex-shrink-0"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditandoConversa(null)}
                                  className="p-1 hover:bg-white/10 rounded text-white/40 flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              // Modo normal - layout fixo sem scroll
                              <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg group-hover:bg-white/5">
                                <button
                                  onClick={() => {
                                    setConversaSelecionada(conversa.id)
                                    setSidebarOpen(false)
                                    router.push(`/medicina/dashboard/ia?c=${conversa.id}`)
                                  }}
                                  className={`
                                    flex-1 min-w-0 flex items-center gap-2 px-2 py-1 rounded transition-colors text-sm text-left
                                    ${isActive
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'text-white/60 hover:text-white/80'
                                    }
                                  `}
                                >
                                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                                  <span className="truncate" title={conversa.titulo || 'Conversa sem título'}>
                                    {tituloAbreviado}
                                  </span>
                                </button>

                                {/* Botão 3 pontos - sempre visível e alinhado */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setMenuAberto(menuAberto === conversa.id ? null : conversa.id)
                                  }}
                                  className="p-1 hover:bg-white/10 rounded transition-all flex-shrink-0 opacity-50 group-hover:opacity-100"
                                >
                                  <MoreVertical className="w-4 h-4 text-white/60" />
                                </button>

                                {/* Menu dropdown */}
                                {menuAberto === conversa.id && (
                                  <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 py-1 min-w-[130px]">
                                    <button
                                      onClick={() => {
                                        setConversaSelecionada(conversa.id)
                                        setSidebarOpen(false)
                                        setMenuAberto(null)
                                        router.push(`/medicina/dashboard/ia?c=${conversa.id}`)
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      Abrir
                                    </button>
                                    <button
                                      onClick={() => {
                                        setNovoTitulo(conversa.titulo || '')
                                        setEditandoConversa(conversa.id)
                                        setMenuAberto(null)
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                      <Pencil className="w-4 h-4" />
                                      Renomear
                                    </button>
                                    <button
                                      onClick={() => deletarConversa(conversa.id)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Excluir
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>

                    {/* Ver mais / Ver menos */}
                    {conversas.length > 10 && (
                      <button
                        onClick={() => setShowAllConversas(!showAllConversas)}
                        className="w-full flex items-center justify-center gap-1 mt-2 px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors"
                      >
                        {showAllConversas ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            Ver todas ({conversas.length})
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Ícone de histórico quando sidebar recolhida */}
            {sidebarCollapsed && conversas.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
                <Link
                  href="/medicina/dashboard/ia"
                  title="Histórico de conversas"
                  className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <History className="w-5 h-5" />
                </Link>
              </div>
            )}
          </nav>

          {/* Upgrade Banner (for free users) - esconde quando recolhido */}
          {plano === 'gratuito' && !sidebarCollapsed && (
            <div className="mx-3 mb-4 p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-white font-semibold text-sm">Upgrade</span>
              </div>
              <p className="text-emerald-200/80 text-xs mb-3">
                Desbloqueie questões ilimitadas e IA tutora
              </p>
              <Link
                href="/medicina/dashboard/assinatura"
                className="block w-full py-2 text-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors"
              >
                Ver planos
              </Link>
            </div>
          )}

          {/* Upgrade icon quando recolhido */}
          {plano === 'gratuito' && sidebarCollapsed && (
            <div className="mx-3 mb-3 flex justify-center">
              <Link
                href="/medicina/dashboard/assinatura"
                title="Ver planos"
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center hover:from-emerald-500/30 hover:to-teal-500/30 transition-colors"
              >
                <Crown className="w-5 h-5 text-amber-400" />
              </Link>
            </div>
          )}

          {/* Badges Mini Widget - esconde quando recolhido */}
          {!sidebarCollapsed && (
            <div className="mx-3 mb-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <BadgeMiniWidget />
            </div>
          )}

          {/* User Profile */}
          <div className="border-t border-white/10 p-4">
            {sidebarCollapsed ? (
              // Versão recolhida - apenas avatar e logout
              <div className="flex flex-col items-center gap-3">
                <Link
                  href="/medicina/dashboard/perfil"
                  title={profile?.nome || 'Perfil'}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center hover:ring-2 hover:ring-emerald-500/50 transition-all"
                >
                  <span className="text-white font-bold">
                    {profile?.nome?.[0]?.toUpperCase() || 'U'}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  title="Sair"
                  className="w-10 h-10 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center justify-center"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              // Versão expandida - completa
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">
                      {profile?.nome?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate text-sm">
                      {profile?.nome || 'Estudante'}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        plano === 'residencia' ? 'bg-amber-500/20 text-amber-400' :
                        plano === 'premium' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {plano === 'residencia' ? 'Residência' :
                         plano === 'premium' ? 'Premium' : 'Gratuito'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Links do perfil */}
                <div className="space-y-1 mb-3">
                  <Link
                    href="/medicina/dashboard/perfil"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </Link>
                  <Link
                    href="/medicina/dashboard/assinatura"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                  >
                    <Crown className="w-4 h-4" />
                    Meu Plano
                  </Link>
                  <Link
                    href="/medicina/dashboard/indicacoes"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Gift className="w-4 h-4" />
                    Indicações
                  </Link>
                </div>

                {/* Botão Sair */}
                <button
                  onClick={handleSignOut}
                  className="w-full py-2 text-center text-red-400 hover:text-red-300 text-sm rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da conta
                </button>
              </>
            )}
          </div>

          {/* Toggle para recolher/expandir sidebar (apenas desktop) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-white/10 rounded-full items-center justify-center text-white/60 hover:text-white hover:bg-slate-700 transition-colors shadow-lg"
            title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 lg:pt-0 min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Back to top button (mobile) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="lg:hidden fixed bottom-6 right-6 w-12 h-12 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-600 transition-colors"
      >
        <ChevronUp className="w-6 h-6" />
      </button>

      {/* Trial Banner - Mostra quando trial está ativo */}
      {trialStatus.ativo && (
        <TrialBanner />
      )}

      {/* Upgrade Modal - Mostra quando há necessidade de upgrade */}
      {showModal && (
        <UpgradeModal
          tipo={modalTipo}
          feature={modalFeature}
          conquista={conquista || undefined}
          onClose={fecharModal}
        />
      )}
    </div>
  )
}

export default function MedicinaDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MedAuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </MedAuthProvider>
  )
}
