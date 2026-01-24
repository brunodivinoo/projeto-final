'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Trash2
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
  { href: '/medicina/dashboard/forum', label: 'Fórum', icon: MessageSquare },
  { href: '/medicina/dashboard/indicacoes', label: 'Indicações', icon: Gift },
  { href: '/medicina/dashboard/assinatura', label: 'Meu Plano', icon: Crown, highlight: true },
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
        .limit(10)

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
            {!sidebarCollapsed && conversas.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/10">
                {/* Header do Histórico */}
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-white/40 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3 h-3" />
                    Histórico
                  </span>
                  <Link
                    href="/medicina/dashboard"
                    className="text-emerald-400 hover:text-emerald-300 transition-colors"
                    title="Nova conversa"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                </div>

                {/* Lista de Conversas */}
                <ul className="space-y-0.5">
                  {conversas.map((conversa) => {
                    const isActive = pathname === `/medicina/dashboard/ia` &&
                      (typeof window !== 'undefined' && window.location.search.includes(`c=${conversa.id}`))

                    return (
                      <li key={conversa.id}>
                        <Link
                          href={`/medicina/dashboard/ia?c=${conversa.id}`}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm
                            ${isActive
                              ? 'bg-white/10 text-white'
                              : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                            }
                          `}
                        >
                          <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />
                          <span className="flex-1 truncate">
                            {conversa.titulo || 'Conversa sem título'}
                          </span>
                          <span className="text-[10px] text-white/30 group-hover:text-white/50 flex-shrink-0">
                            {formatRelativeTime(conversa.updated_at)}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>

                {/* Ver mais */}
                {conversas.length >= 10 && (
                  <Link
                    href="/medicina/dashboard/biblioteca"
                    className="flex items-center justify-center gap-1 mt-2 px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    Ver todas as conversas
                  </Link>
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
                <div className="flex gap-2">
                  <Link
                    href="/medicina/dashboard/perfil"
                    className="flex-1 py-2 text-center text-white/60 hover:text-white text-sm rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Perfil
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 py-2 text-center text-red-400 hover:text-red-300 text-sm rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
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
