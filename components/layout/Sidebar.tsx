'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const menuPrincipal = [
  { icon: 'home', label: 'Página Inicial', href: '/dashboard' },
  { icon: 'auto_awesome', label: 'Central IA', href: '/dashboard/ia', special: true },
]

const menuEstudos = [
  { icon: 'style', label: 'Flashcards', href: '/dashboard/flashcards' },
  { icon: 'quiz', label: 'Questões', href: '/dashboard/questoes' },
  { icon: 'assignment_turned_in', label: 'Simulados', href: '/dashboard/simulados' },
  { icon: 'donut_large', label: 'Ciclos de Estudo', href: '/dashboard/ciclos' },
  { icon: 'history', label: 'Revisões', href: '/dashboard/revisoes' },
  { icon: 'calendar_month', label: 'Planos de Estudo', href: '/dashboard/planos' },
]

const menuComunidade = [
  { icon: 'groups', label: 'Social', href: '/dashboard/social' },
  { icon: 'person', label: 'Perfil do Usuário', href: '/dashboard/perfil' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut, profile } = useAuth()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 h-screen bg-[#1c252e] border-r border-slate-800 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-slate-800">
        <span className="material-symbols-outlined text-primary text-3xl">school</span>
        <span className="text-lg font-bold text-white tracking-tight">StudyHub</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {menuPrincipal.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all group ${
              isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className={`material-symbols-outlined text-xl ${
              item.special ? 'text-purple-500' : isActive(item.href) ? '' : 'group-hover:text-primary'
            }`}>{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}

        <div className="px-3 pt-4 pb-2">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Estudos</h3>
        </div>
        {menuEstudos.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all group ${
              isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className={`material-symbols-outlined text-xl ${
              isActive(item.href) ? '' : 'group-hover:text-primary'
            }`}>{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}

        <div className="px-3 pt-4 pb-2">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Comunidade</h3>
        </div>
        {menuComunidade.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all group ${
              isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className={`material-symbols-outlined text-xl ${
              isActive(item.href) ? '' : 'group-hover:text-primary'
            }`}>{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Create New Deck Button */}
      {pathname.startsWith('/dashboard/flashcards') && (
        <div className="p-4 border-t border-slate-800">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 text-white px-4 py-3 text-sm font-medium hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-xl">add_circle</span>
            Criar Novo Deck
          </button>
        </div>
      )}

      {/* User & Logout */}
      <div className="p-4 border-t border-slate-800">
        {profile && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {profile.nome?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile.nome}</p>
              <p className="text-xs text-slate-500 truncate">{profile.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}
