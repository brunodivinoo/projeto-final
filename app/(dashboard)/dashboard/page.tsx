'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { LimitsIndicator } from '@/components/limits'

export default function DashboardPage() {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { toggleSidebar } = useSidebar()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const nome = profile?.nome?.split(' ')[0] || 'Estudante'

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

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Weekly performance data
  const weeklyData = [
    { day: 'Seg', value: 40, height: '40%' },
    { day: 'Ter', value: 65, height: '65%' },
    { day: 'Qua', value: 50, height: '50%' },
    { day: 'Qui', value: 85, height: '85%', active: true },
    { day: 'Sex', value: 60, height: '60%' },
    { day: 'Sáb', value: 70, height: '70%' },
    { day: 'Dom', value: 55, height: '55%' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-[#1c252e] border-b border-slate-200 dark:border-slate-700 px-3 lg:px-6 py-3 lg:py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Hamburger menu for mobile */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            {/* Mobile: just show icon */}
            <span className="material-symbols-outlined text-primary text-2xl sm:hidden">dashboard</span>
            {/* Desktop: full greeting */}
            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {getGreeting()}, {nome}! <span className="text-lg lg:text-2xl">👋</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 hidden md:block">
                Aqui está o resumo do seu progresso hoje.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-xl">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar..."
                className="w-48 lg:w-64 h-10 pl-10 pr-4 rounded-lg bg-slate-100 dark:bg-[#101922] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none transition-colors"
              />
            </div>
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
                      onClick={() => { setShowDropdown(false); signOut(); }}
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
        </div>
      </div>

      <div className="p-6 max-w-[1200px] mx-auto">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Desempenho Semanal */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bar_chart</span>
                Desempenho Semanal
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">Últimos 7 dias</span>
            </div>

            {/* Chart */}
            <div className="h-48 flex items-end justify-between gap-3 px-2">
              {weeklyData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full h-40 flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        item.active
                          ? 'bg-primary'
                          : 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                      }`}
                      style={{ height: item.height }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    item.active ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Meta Diária */}
          <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-green-500">flag</span>
              Meta Diária
            </h2>

            {/* Circular Progress */}
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-slate-200 dark:text-slate-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${72 * 3.51} ${100 * 3.51}`}
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">72%</span>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-sm text-center mb-4">
              Você completou <span className="font-bold text-slate-900 dark:text-white">18 de 25</span> questões hoje.
            </p>

            <button className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2">
              Continuar Estudos
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Resumo por Área */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Resumo por Área
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Flashcards */}
            <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">style</span>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  +12 novos
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Flashcards</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">120 cards para revisar</p>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            {/* Questões */}
            <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-orange-500 text-2xl">help</span>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                  Média 8.5
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Questões</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">342 respondidas este mês</p>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            {/* Simulados */}
            <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500 text-2xl">task_alt</span>
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                  Pendente
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Simulados</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Próximo: Direito Civil</p>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>

            {/* Ciclo Atual */}
            <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-cyan-500 text-2xl">refresh</span>
                </div>
                <span className="text-xs font-bold text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 px-2 py-1 rounded-full">
                  Ativo
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Ciclo Atual</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Português - 45min rest.</p>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Atividades Recentes */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Atividades Recentes</h2>
              <button className="text-primary text-sm font-semibold hover:underline">Ver tudo</button>
            </div>

            <div className="space-y-4">
              {/* Activity 1 */}
              <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Simulado de Direito Constitucional</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Você acertou 85% das questões.</p>
                </div>
                <span className="text-xs text-slate-400">Há 2 horas</span>
              </div>

              {/* Activity 2 */}
              <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">style</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Revisão de Flashcards</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">32 cards revisados em Português.</p>
                </div>
                <span className="text-xs text-slate-400">Há 4 horas</span>
              </div>

              {/* Activity 3 */}
              <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-500">emoji_events</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Nova conquista desbloqueada!</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Você completou 7 dias seguidos de estudo.</p>
                </div>
                <span className="text-xs text-slate-400">Ontem</span>
              </div>
            </div>
          </div>

          {/* Central IA Sugere */}
          <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-white/80">auto_awesome</span>
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Central IA Sugere</span>
              </div>

              <h3 className="text-xl font-bold mb-2">Hora de Revisar!</h3>
              <p className="text-white/80 text-sm mb-6">
                Com base no seu desempenho recente, a IA identificou que você precisa reforçar seus conhecimentos em <span className="font-semibold text-white">Direito Administrativo</span>.
              </p>

              <button className="w-full bg-white text-primary font-semibold py-3 px-4 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                Iniciar Revisão
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
