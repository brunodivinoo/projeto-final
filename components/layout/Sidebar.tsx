'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/contexts/SidebarContext'

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
  const { isOpen, closeSidebar } = useSidebar()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    closeSidebar()
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 h-screen bg-white dark:bg-[#1c252e] border-r border-slate-200 dark:border-slate-800
        flex flex-col fixed left-0 top-0 z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">school</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Estuda</span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={closeSidebar}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuPrincipal.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all group ${
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all group ${
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all group ${
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${
                isActive(item.href) ? '' : 'group-hover:text-primary'
              }`}>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
