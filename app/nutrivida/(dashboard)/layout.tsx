'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { NutriAuthProvider, useNutriAuth } from '@/contexts/NutriAuthContext'
import { ServiceWorkerRegistration } from '@/components/nutrivida/ServiceWorkerRegistration'
import {
  Home,
  UtensilsCrossed,
  Droplets,
  Dumbbell,
  Pill,
  ShoppingCart,
  TrendingUp,
  Bot,
  ChefHat,
  User,
  LogOut,
  Menu,
  X,
  Heart,
  ChevronUp
} from 'lucide-react'

const menuItems = [
  { href: '/nutrivida/dashboard', label: 'Inicio', icon: Home },
  { href: '/nutrivida/dashboard/refeicoes', label: 'Refeicoes', icon: UtensilsCrossed },
  { href: '/nutrivida/dashboard/agua', label: 'Agua', icon: Droplets },
  { href: '/nutrivida/dashboard/treinos', label: 'Treinos', icon: Dumbbell },
  { href: '/nutrivida/dashboard/suplementos', label: 'Vitaminas', icon: Pill },
  { href: '/nutrivida/dashboard/compras', label: 'Compras', icon: ShoppingCart },
  { href: '/nutrivida/dashboard/progresso', label: 'Progresso', icon: TrendingUp },
  { href: '/nutrivida/dashboard/ia', label: 'Nutri IA', icon: Bot },
  { href: '/nutrivida/dashboard/receitas', label: 'Receitas', icon: ChefHat },
]

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loading, signOut, progressoPercentual } = useNutriAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/nutrivida/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-pink-600 font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/nutrivida/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-2"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/nutrivida/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold">NutriVida</span>
          </Link>
          <Link href="/nutrivida/dashboard/perfil" className="text-white p-2">
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
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-pink-100
        transform transition-transform duration-300 ease-in-out shadow-xl
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-pink-100 bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500">
            <div className="flex items-center justify-between">
              <Link href="/nutrivida/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-white text-lg font-bold block">NutriVida</span>
                  <span className="text-pink-100 text-xs">Saude feminina</span>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white/80 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Progress Mini */}
          {profile && (
            <div className="px-4 py-3 border-b border-pink-50">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">Progresso</span>
                <span className="text-pink-600 font-semibold">{progressoPercentual}%</span>
              </div>
              <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, progressoPercentual)}%` }}
                />
              </div>
            </div>
          )}

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
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                        ${isActive
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                          : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
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

          {/* User Profile */}
          <div className="border-t border-pink-100 p-4 bg-pink-50/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold">
                  {profile?.nome?.[0]?.toUpperCase() || 'M'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-medium truncate text-sm">
                  {profile?.nome || 'Usuaria'}
                </p>
                <p className="text-xs text-gray-500">
                  {profile?.plano === 'restritivo' ? 'Plano Acelerado' : 'Plano Equilibrado'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/nutrivida/dashboard/perfil"
                className="flex-1 py-2 text-center text-gray-600 hover:text-pink-600 text-sm rounded-lg hover:bg-white transition-colors"
              >
                Perfil
              </Link>
              <button
                onClick={handleSignOut}
                className="flex-1 py-2 text-center text-red-500 hover:text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
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
        <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 px-2 py-2 z-40">
        <div className="flex justify-around items-center">
          {[
            { href: '/nutrivida/dashboard', icon: Home, label: 'Inicio' },
            { href: '/nutrivida/dashboard/refeicoes', icon: UtensilsCrossed, label: 'Comida' },
            { href: '/nutrivida/dashboard/agua', icon: Droplets, label: 'Agua' },
            { href: '/nutrivida/dashboard/treinos', icon: Dumbbell, label: 'Treino' },
            { href: '/nutrivida/dashboard/progresso', icon: TrendingUp, label: 'Stats' },
          ].map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-3 py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-pink-600 bg-pink-50'
                    : 'text-gray-400 hover:text-pink-500'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Back to top button (desktop) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="hidden lg:flex fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full shadow-lg items-center justify-center hover:from-pink-600 hover:to-purple-600 transition-all"
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </div>
  )
}

export default function NutrimaeDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NutriAuthProvider>
      <ServiceWorkerRegistration />
      <DashboardContent>{children}</DashboardContent>
    </NutriAuthProvider>
  )
}
