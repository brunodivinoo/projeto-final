'use client'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function PerfilPage() {
  const { profile, stats } = useAuth()

  const statsDisplay = [
    { label: 'Horas Estudadas', value: `${stats?.horas_estudadas || 0}h`, sub: '+5% que a média', color: 'text-blue-400', icon: 'schedule' },
    { label: 'Flashcards', value: `${stats?.flashcards_revisados || 0}`, sub: 'Revisados esta semana', color: 'text-purple-400', icon: 'style' },
    { label: 'Ofensiva', value: `${stats?.sequencia_dias || 0} dias`, sub: 'Recorde pessoal', color: 'text-orange-400', icon: 'local_fire_department' },
    { label: 'Ranking', value: `#${stats?.ranking || '--'}`, sub: 'Top 5% da turma', color: 'text-green-400', icon: 'leaderboard' },
  ]

  const conquistas = [
    { icon: 'workspace_premium', nome: 'Plano do Usuário', desc: profile?.plano?.toUpperCase() || 'FREE', color: 'text-yellow-400' },
    { icon: 'military_tech', nome: 'Student Pro Award', desc: 'Completou 100 questões', color: 'text-blue-400' },
  ]

  return (
    <div className="min-h-screen">
      <Header title="Meu Perfil" />

      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
        <p className="text-slate-400 mb-6">Gerencie sua conta e visualize seu progresso</p>

        {/* Profile Card */}
        <div className="bg-[#1c242d] rounded-xl border border-slate-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center shrink-0">
              <span className="text-4xl font-bold text-white">{profile?.nome?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{profile?.nome || 'Usuário'}</h2>
              <p className="text-slate-400">@{profile?.email?.split('@')[0]} • {profile?.curso || 'Estudante'} {profile?.instituicao ? `- ${profile.instituicao}` : ''}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase">{profile?.plano || 'Free'}</span>
                <span className="text-slate-500 text-sm">Membro desde {new Date(profile?.created_at || Date.now()).getFullYear()}</span>
              </div>
            </div>
            <Link
              href="#"
              className="px-4 py-2 rounded-lg border border-slate-600 text-white hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Editar Perfil
            </Link>
          </div>

          {profile?.bio && (
            <div className="mt-6 p-4 bg-[#101922] rounded-lg">
              <p className="text-slate-400 text-sm">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statsDisplay.map(stat => (
            <div key={stat.label} className="bg-[#1c242d] rounded-xl border border-slate-700 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-white text-sm font-medium">{stat.label}</p>
              <p className="text-slate-500 text-xs mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Activity & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity */}
          <div className="bg-[#1c242d] rounded-xl border border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Atividade Semanal</h3>
              <span className="text-slate-400 text-sm">{stats?.horas_estudadas || 0}h 30m</span>
            </div>
            <div className="flex items-end justify-between h-32 gap-2">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia, i) => {
                const heights = [60, 80, 45, 90, 70, 30, 50]
                return (
                  <div key={dia} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-primary/40 rounded-t-sm transition-all hover:bg-primary"
                      style={{ height: `${heights[i]}%` }}
                    />
                    <span className="text-slate-500 text-xs">{dia}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
              <span className="text-white font-medium">Comparado com a semana anterior</span>
              <span className="text-green-400 text-sm font-bold">+120%</span>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-[#1c242d] rounded-xl border border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Conquistas</h3>
              <Link href="#" className="text-primary text-sm font-bold hover:underline">Ver todas</Link>
            </div>
            <div className="space-y-3">
              {conquistas.map(c => (
                <div key={c.nome} className="flex items-center gap-4 p-4 bg-[#101922] rounded-lg">
                  <span className={`material-symbols-outlined text-3xl ${c.color}`}>{c.icon}</span>
                  <div>
                    <p className="text-white font-medium">{c.nome}</p>
                    <p className="text-slate-400 text-sm">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
