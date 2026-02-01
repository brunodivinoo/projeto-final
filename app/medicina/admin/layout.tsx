'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MedAuthProvider, useMedAuth } from '@/contexts/MedAuthContext'
import { AdminGuard, AdminBadge } from '@/components/admin/AdminGuard'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronLeft,
  Database,
  Zap
} from 'lucide-react'

const adminMenuItems = [
  { href: '/medicina/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/medicina/admin/questoes', label: 'Questões', icon: FileText },
  { href: '/medicina/admin/questoes/gerar', label: 'Gerar Questões', icon: Sparkles, highlight: true },
  { href: '/medicina/admin/disciplinas', label: 'Disciplinas', icon: BookOpen },
  { href: '/medicina/admin/historico', label: 'Histórico', icon: History },
]

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useMedAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/medicina/login')
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0A0F1C]/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-2"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            <span className="text-white font-bold">Admin PREPARAMED</span>
          </div>
          <AdminBadge />
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
        fixed top-0 left-0 z-50 h-full w-64 bg-[#0D1424] border-r border-slate-200
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-white text-lg font-bold block">Admin</span>
                  <span className="text-slate-500 text-xs">PREPARAMED</span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-slate-600 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Back to Dashboard */}
          <div className="px-3 pt-4">
            <Link
              href="/medicina/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-white hover:bg-slate-100 rounded-lg transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar ao App
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Menu Admin
            </p>
            <ul className="space-y-1">
              {adminMenuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        ${isActive
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : item.highlight
                          ? 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-white'
                        }
                      `}
                    >
                      <item.icon className={`w-5 h-5 ${item.highlight && !isActive ? 'text-emerald-400' : ''}`} />
                      <span className="font-medium">{item.label}</span>
                      {item.highlight && !isActive && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-bold">
                          IA
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User Info */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate text-sm">
                  {user?.email}
                </p>
                <AdminBadge />
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full py-2 text-center text-red-400 hover:text-red-300 text-sm rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function MedicinaAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MedAuthProvider>
      <AdminGuard>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminGuard>
    </MedAuthProvider>
  )
}
