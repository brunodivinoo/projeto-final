'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MedAuthProvider, useMedAuth } from '@/contexts/MedAuthContext'
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
  ChevronUp
} from 'lucide-react'

const menuItems = [
  { href: '/medicina/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/medicina/dashboard/questoes', label: 'Questões', icon: FileText },
  { href: '/medicina/dashboard/biblioteca', label: 'Biblioteca', icon: BookOpen },
  { href: '/medicina/dashboard/anotacoes', label: 'Anotações', icon: PenTool },
  { href: '/medicina/dashboard/simulados', label: 'Simulados', icon: ClipboardList },
  { href: '/medicina/dashboard/ia', label: 'IA Tutora', icon: Brain },
  { href: '/medicina/dashboard/forum', label: 'Fórum', icon: MessageSquare },
  { href: '/medicina/dashboard/estatisticas', label: 'Estatísticas', icon: BarChart3 },
]

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, plano, loading, signOut } = useMedAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/medicina/login')
    }
  }, [user, loading, router])

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
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <Link href="/medicina/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-lg font-bold">PREPARAMED</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        ${isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Upgrade Banner (for free users) */}
          {plano === 'gratuito' && (
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

          {/* User Profile */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
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
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
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
