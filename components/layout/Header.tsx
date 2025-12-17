'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export function Header({ title, searchPlaceholder }: { title: string; searchPlaceholder?: string }) {
  const [search, setSearch] = useState('')
  const { profile } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-14 bg-white dark:bg-[#1c252e] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-xl">
            search
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder || "Buscar..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64 h-10 pl-10 pr-4 rounded-lg bg-slate-100 dark:bg-[#101922] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          <span className="material-symbols-outlined">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notifications */}
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1c252e]" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700 relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center relative">
            <span className="text-white font-bold text-sm">
              {profile?.nome?.charAt(0).toUpperCase() || 'U'}
            </span>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1c252e]"></span>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">{profile?.nome || 'Usuário'}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 leading-none mt-1 capitalize">{profile?.plano || 'Free'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
