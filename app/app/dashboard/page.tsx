'use client'

import { usePrepaMedAuth } from '@/contexts/PrepaMedAuthContext'

function StatCard({ label, value, sublabel, color }: {
  label: string; value: string | number; sublabel?: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { profile } = usePrepaMedAuth()

  const examLabels: Record<string, string> = {
    residencia_medica: 'Residência Médica',
    revalida: 'Revalida',
    enare: 'ENARE',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Olá, {profile?.full_name?.split(' ')[0] ?? 'Estudante'} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          {profile?.exam_type ? `Preparando para ${examLabels[profile.exam_type]}` : 'Bem-vindo ao Prepara Med'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="XP Total" value={profile?.xp ?? 0} sublabel="pontos de experiência" color="text-indigo-600" />
        <StatCard label="Nível" value={profile?.level ?? 1} sublabel="continue evoluindo" color="text-emerald-600" />
        <StatCard label="Questões hoje" value={0} sublabel="meta: 20" color="text-amber-600" />
        <StatCard label="Sequência" value="0 dias" sublabel="não perca o ritmo!" color="text-rose-600" />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Acesso rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { href: '/app/questoes', label: 'Responder Questões', desc: 'Pratique com questões comentadas', color: 'bg-indigo-600', emoji: '📝' },
            { href: '/app/flashcards', label: 'Revisar Flashcards', desc: 'Repetição espaçada com IA', color: 'bg-emerald-600', emoji: '🧠' },
            { href: '/app/tutor', label: 'Tutor IA', desc: 'Tire dúvidas com IA médica', color: 'bg-violet-600', emoji: '🤖' },
            { href: '/app/simulados', label: 'Fazer Simulado', desc: 'Simule a prova real', color: 'bg-amber-600', emoji: '🎯' },
            { href: '/app/plano', label: 'Plano de Estudos', desc: 'Veja o cronograma hoje', color: 'bg-rose-600', emoji: '📅' },
          ].map(action => (
            <a
              key={action.href}
              href={action.href}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition group"
            >
              <span className="text-2xl">{action.emoji}</span>
              <p className="font-semibold text-slate-900 mt-2 group-hover:text-indigo-700 transition">{action.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Onboarding completion */}
      {profile && (!profile.specialties?.length || !profile.exam_date) && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-semibold text-indigo-800">Complete seu perfil</p>
            <p className="text-sm text-indigo-600 mt-0.5">
              Adicione suas especialidades e data da prova para receber recomendações personalizadas.
            </p>
            <a href="/onboarding" className="inline-block mt-3 text-sm font-medium text-indigo-700 underline">
              Completar perfil →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
