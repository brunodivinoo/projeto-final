'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Database,
  LogOut,
  Home
} from 'lucide-react'
import { AdminBadge } from './AdminGuard'

const menuItems = [
  {
    href: '/medicina/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true
  },
  {
    href: '/medicina/admin/disciplinas',
    label: 'Disciplinas',
    icon: BookOpen
  },
  {
    href: '/medicina/admin/questoes',
    label: 'Questões',
    icon: FileText
  },
  {
    href: '/medicina/admin/questoes/gerar',
    label: 'Gerador IA',
    icon: Sparkles,
    highlight: true
  },
  {
    href: '/medicina/admin/historico',
    label: 'Histórico',
    icon: History
  }
]

interface AdminSidebarProps {
  children: React.ReactNode
}

export function AdminSidebar({ children }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-[#0A0F1C]">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-[#0D1321] border-r border-slate-200 transition-all duration-300 z-40 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">Admin</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-white"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Admin Badge */}
        {!collapsed && (
          <div className="p-4">
            <AdminBadge />
          </div>
        )}

        {/* Menu Items */}
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                    : item.highlight
                    ? 'text-amber-400 hover:bg-amber-500/10'
                    : 'text-slate-600 hover:text-white hover:bg-slate-100'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${item.highlight && !active ? 'text-amber-400' : ''}`} />
                {!collapsed && (
                  <span className={`font-medium ${item.highlight && !active ? 'text-amber-300' : ''}`}>
                    {item.label}
                  </span>
                )}
                {!collapsed && item.highlight && (
                  <span className="ml-auto text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">
                    IA
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-slate-200">
          <Link
            href="/medicina/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-white hover:bg-slate-100 transition-all"
            title={collapsed ? 'Voltar ao Dashboard' : undefined}
          >
            <Home className="w-5 h-5" />
            {!collapsed && <span>Voltar ao Dashboard</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* Top Bar */}
        <header className="h-16 bg-[#0D1321]/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <h1 className="text-lg font-semibold text-white">
            Painel Administrativo - PREPARAMED
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
