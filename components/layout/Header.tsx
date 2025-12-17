'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function Header({ title }: { title: string }) {
  const [search, setSearch] = useState('')
  const { profile } = useAuth()

  return (
    <header className="h-14 bg-[#1c252e] border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-lg font-bold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64 h-10 pl-10 pr-4 rounded-lg bg-[#101922] border border-transparent text-white text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Notifications */}
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1c252e]" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {profile?.nome?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-sm font-bold text-white leading-none">{profile?.nome || 'Usuário'}</span>
            <span className="text-xs text-slate-400 leading-none mt-1 capitalize">{profile?.plano || 'Free'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
