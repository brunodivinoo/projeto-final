'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { LimitsIndicator } from '@/components/limits'
import { XPIndicator } from '@/components/xp'

export function Header({ title, searchPlaceholder }: { title: string; searchPlaceholder?: string }) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { toggleSidebar } = useSidebar()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = () => {
    setShowDropdown(false)
    signOut()
  }

  return (
    <header className="h-14 bg-white dark:bg-[#1c252e] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 lg:px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Hamburger menu for mobile */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        <span className="material-symbols-outlined text-primary text-2xl lg:text-3xl hidden sm:block">psychology</span>
        <h1 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white hidden sm:block">{title}</h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
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
            className="w-48 lg:w-64 h-10 pl-10 pr-4 rounded-lg bg-slate-100 dark:bg-[#101922] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* XP Indicator */}
        <XPIndicator />

        {/* Limits Indicator */}
        <LimitsIndicator />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          <span className="material-symbols-outlined text-xl">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notifications */}
        <button className="w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-1 right-1 lg:top-2 lg:right-2 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1c252e]" />
        </button>

        {/* Avatar with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-3 border-l border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center relative">
              <span className="text-white font-bold text-xs lg:text-sm">
                {profile?.nome?.charAt(0).toUpperCase() || 'U'}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 lg:bottom-0 lg:right-0 w-2.5 h-2.5 lg:w-3 lg:h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1c252e]"></span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-base lg:text-lg">
              {showDropdown ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg py-2 z-50">
              {/* User info in dropdown */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{profile?.nome || 'Usuário'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile?.email}</p>
                <span className="inline-block mt-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded capitalize">{profile?.plano || 'Free'}</span>
              </div>

              <Link
                href="/dashboard"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">dashboard</span>
                Meu Painel
              </Link>
              <Link
                href="/dashboard/perfil"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">credit_card</span>
                Minhas Assinaturas
              </Link>
              <Link
                href="/dashboard/perfil"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">settings</span>
                Configurações
              </Link>

              <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
