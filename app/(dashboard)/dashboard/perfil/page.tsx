'use client'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function PerfilPage() {
  const { profile, stats } = useAuth()

  // Dados de exemplo para o gráfico semanal (valores em horas)
  const weeklyData = [
    { day: 'Seg', hours: 4, percentage: 40 },
    { day: 'Ter', hours: 6.5, percentage: 65 },
    { day: 'Qua', hours: 8.5, percentage: 85 },
    { day: 'Qui', hours: 5, percentage: 50 },
    { day: 'Sex', hours: 6, percentage: 60 },
    { day: 'Sáb', hours: 3, percentage: 30 },
    { day: 'Dom', hours: 2, percentage: 20 },
  ]

  const initialLetter = profile?.nome?.charAt(0).toUpperCase() || 'A'
  const userName = profile?.nome || 'Ana Silva'
  const userEmail = profile?.email || '@ana.civil'
  const userCourse = profile?.curso || 'Engenharia Civil'
  const userInstitution = profile?.instituicao || 'USP'
  const userPlan = profile?.plano?.toUpperCase() || 'PRO'
  const memberSince = new Date(profile?.created_at || Date.now()).getFullYear()
  const userBio = profile?.bio || '🎓 Focada em passar em Cálculo II e Estruturas Metálicas. Adoro grupos de estudo e trocar resumos! Sempre buscando novos métodos de produtividade. 📚☕'

  // Stats com valores reais ou defaults
  const horasEstudadas = stats?.horas_estudadas || 12
  const flashcardsRevisados = stats?.flashcards_revisados || 154
  const sequenciaDias = stats?.sequencia_dias || 7
  const ranking = stats?.ranking || 42

  return (
    <main className="flex-1 overflow-y-auto relative bg-background-light dark:bg-background-dark">
      <div className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-6 md:gap-8">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight dark:text-white text-slate-900">Meu Perfil</h1>
          <p className="text-slate-500 dark:text-[#9dabb9] text-base">Gerencie sua conta e visualize seu progresso.</p>
        </div>

        {/* Profile Card */}
        <div className="w-full rounded-xl bg-white dark:bg-card-dark p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start md:items-center text-center sm:text-left w-full md:w-auto">
              <div className="relative">
                {profile?.avatar_url ? (
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-24 h-24 md:w-32 md:h-32 border-4 border-white dark:border-background-dark shadow-xl"
                    style={{ backgroundImage: `url(${profile.avatar_url})` }}
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center border-4 border-white dark:border-background-dark shadow-xl">
                    <span className="text-4xl md:text-5xl font-bold text-white">{initialLetter}</span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-primary text-white p-1.5 rounded-full border-4 border-white dark:border-background-dark flex items-center justify-center" title="Verified Student">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">{userName}</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-[#9dabb9] text-sm md:text-base">
                  <span>{userEmail.startsWith('@') ? userEmail : `@${userEmail.split('@')[0]}`}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{userCourse} - {userInstitution}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Plano {userPlan}</span>
                  <span className="text-slate-400 dark:text-slate-600 text-xs">Membro desde {memberSince}</span>
                </div>
              </div>
            </div>
            <button className="w-full md:w-auto bg-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">edit</span>
              Editar Perfil
            </button>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl">
              {userBio}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-primary mb-1">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">Horas Estudadas</p>
            </div>
            <p className="text-3xl font-black dark:text-white text-slate-900">{horasEstudadas}h</p>
            <p className="text-xs text-green-500 font-medium">+2h que a média</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-primary mb-1">
              <span className="material-symbols-outlined text-[20px]">style</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">Flashcards</p>
            </div>
            <p className="text-3xl font-black dark:text-white text-slate-900">{flashcardsRevisados}</p>
            <p className="text-xs text-slate-400 font-medium">Revisados esta semana</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-primary mb-1">
              <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">Ofensiva</p>
            </div>
            <p className="text-3xl font-black dark:text-white text-slate-900">{sequenciaDias} <span className="text-lg font-bold text-slate-500">dias</span></p>
            <p className="text-xs text-green-500 font-medium">Recorde pessoal!</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-primary mb-1">
              <span className="material-symbols-outlined text-[20px]">trophy</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">Ranking</p>
            </div>
            <p className="text-3xl font-black dark:text-white text-slate-900">#{ranking}</p>
            <p className="text-xs text-slate-400 font-medium">Top 5% da turma</p>
          </div>
        </div>

        {/* Activity & Achievements Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
          {/* Weekly Activity Chart */}
          <div className="lg:col-span-2 rounded-xl bg-white dark:bg-card-dark p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-lg font-bold dark:text-white text-slate-900">Atividade Semanal</h3>
                <p className="text-slate-500 text-sm mt-1">Comparativo com a semana anterior</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold dark:text-white text-slate-900">12h 30m</span>
                <div className="flex items-center justify-end gap-1 text-green-500 text-sm font-medium">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span>+20%</span>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-[250px] w-full grid grid-cols-7 gap-3 md:gap-6 items-end px-2">
              {weeklyData.map((data, index) => (
                <div key={data.day} className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                  <div
                    className={`relative w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${
                      index === 2
                        ? 'bg-primary shadow-[0_0_15px_rgba(19,127,236,0.4)]'
                        : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-primary/50'
                    }`}
                    style={{ height: `${data.percentage}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.hours}h
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${index === 2 ? 'text-primary' : 'text-slate-400'}`}>
                    {data.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Achievements & Info */}
          <div className="flex flex-col gap-6">
            {/* Achievements */}
            <div className="rounded-xl bg-white dark:bg-card-dark p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold dark:text-white text-slate-900">Conquistas</h3>
                <Link href="#" className="text-primary text-sm font-medium hover:underline">Ver todas</Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex flex-col items-center gap-1 min-w-[64px]">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined fill-1">workspace_premium</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Mestre</span>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-[64px]">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-primary flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined fill-1">bolt</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Veloz</span>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-[64px]">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined fill-1">school</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Sábio</span>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-[64px]">
                  <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined">lock</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">???</span>
                </div>
              </div>
            </div>

            {/* User Plan */}
            <div className="rounded-xl bg-white dark:bg-card-dark p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold dark:text-white text-slate-900">Assinatura</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  userPlan === 'PRO' || userPlan === 'ESTUDA_PRO'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {userPlan === 'PRO' || userPlan === 'ESTUDA_PRO' ? 'PRO' : 'FREE'}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Plano Atual</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                      {userPlan === 'PRO' || userPlan === 'ESTUDA_PRO' ? 'Estuda PRO' : 'Plano Free'}
                    </p>
                  </div>
                  <div className={`size-10 rounded-full flex items-center justify-center shadow-md shrink-0 ${
                    userPlan === 'PRO' || userPlan === 'ESTUDA_PRO'
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    <span className={`material-symbols-outlined text-[20px] fill-1 ${
                      userPlan === 'PRO' || userPlan === 'ESTUDA_PRO' ? 'text-white' : 'text-slate-500'
                    }`}>
                      {userPlan === 'PRO' || userPlan === 'ESTUDA_PRO' ? 'workspace_premium' : 'person'}
                    </span>
                  </div>
                </div>

                {userPlan === 'PRO' || userPlan === 'ESTUDA_PRO' ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm items-end">
                      <span className="text-slate-500 dark:text-slate-400">Próxima cobrança</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">15 Jan, 2025</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mt-1 relative overflow-hidden">
                      <div className="bg-primary h-2 rounded-full absolute top-0 left-0" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-xs text-slate-400 mt-1">Renovação automática ativada</span>
                  </div>
                ) : (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Faça upgrade para o <span className="font-bold text-primary">Estuda PRO</span> e desbloqueie recursos ilimitados!
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2.5 mt-2">
                  <Link
                    href="/dashboard/assinatura"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {userPlan === 'PRO' || userPlan === 'ESTUDA_PRO' ? 'manage_accounts' : 'rocket_launch'}
                    </span>
                    {userPlan === 'PRO' || userPlan === 'ESTUDA_PRO' ? 'Gerenciar Plano' : 'Fazer Upgrade'}
                  </Link>
                  <Link
                    href="/dashboard/creditos"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">token</span>
                    Ver Créditos IA
                  </Link>
                  {(userPlan === 'PRO' || userPlan === 'ESTUDA_PRO') && (
                    <button className="flex items-center justify-center gap-2 w-full py-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-xs font-medium transition-colors">
                      Cancelar Assinatura
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Social Stats */}
            <div className="rounded-xl bg-white dark:bg-card-dark p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-4">Social</h3>
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black dark:text-white text-slate-900">120</span>
                  <span className="text-xs font-medium text-slate-500">Seguidores</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black dark:text-white text-slate-900">45</span>
                  <span className="text-xs font-medium text-slate-500">Seguindo</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black dark:text-white text-slate-900">12</span>
                  <span className="text-xs font-medium text-slate-500">Grupos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
