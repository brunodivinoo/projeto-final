'use client'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const acoes = [
  { icon: 'auto_awesome', label: 'Gerador de Questões', desc: 'Crie simulados personalizados baseados em qualquer tópico', href: '/dashboard/ia', btn: 'Começar agora' },
  { icon: 'summarize', label: 'Resumidor Inteligente', desc: 'Transforme textos longos em tópicos digestíveis instantaneamente', href: '/dashboard/ia', btn: 'Resumir texto' },
  { icon: 'chat', label: 'Chat Tira-Dúvidas', desc: 'Converse com a IA em tempo real para esclarecer conceitos', href: '/dashboard/ia', btn: 'Iniciar chat' },
]

export default function DashboardPage() {
  const { profile, stats } = useAuth()
  const nome = profile?.nome?.split(' ')[0] || 'Estudante'

  return (
    <div className="min-h-screen">
      <Header title="Página Inicial" />

      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Greeting + Streak */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Olá, {nome}!</h2>
            <p className="text-slate-400 mt-1">Vamos manter o foco nos estudos hoje.</p>
          </div>
          <div className="flex items-center gap-3 bg-[#1c242d] px-4 py-2 rounded-full border border-slate-700">
            <span className="material-symbols-outlined text-orange-500">local_fire_department</span>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium uppercase">Ofensiva</span>
              <span className="text-white font-bold leading-none">{stats?.sequencia_dias || 0} Dias</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1c242d] rounded-xl p-6 border border-slate-700 hover:border-blue-900 transition-colors">
            <div className="flex justify-between items-start">
              <div className="bg-primary/20 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
              </div>
              <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold">+20%</span>
            </div>
            <div className="mt-4">
              <p className="text-slate-400 text-sm font-medium">Questões Hoje</p>
              <p className="text-white text-3xl font-bold mt-1">{stats?.questoes_hoje || 0}</p>
            </div>
          </div>
          <div className="bg-[#1c242d] rounded-xl p-6 border border-slate-700 hover:border-blue-900 transition-colors">
            <div className="flex justify-between items-start">
              <div className="bg-primary/20 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">analytics</span>
              </div>
              <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold">+5%</span>
            </div>
            <div className="mt-4">
              <p className="text-slate-400 text-sm font-medium">Taxa de Acerto</p>
              <p className="text-white text-3xl font-bold mt-1">{stats?.taxa_acerto || 0}%</p>
            </div>
          </div>
          <div className="bg-[#1c242d] rounded-xl p-6 border border-slate-700 hover:border-blue-900 transition-colors">
            <div className="flex justify-between items-start">
              <div className="bg-primary/20 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">timer</span>
              </div>
              <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold">+0.5h</span>
            </div>
            <div className="mt-4">
              <p className="text-slate-400 text-sm font-medium">Horas Estudadas</p>
              <p className="text-white text-3xl font-bold mt-1">{stats?.horas_estudadas || 0}h</p>
            </div>
          </div>
        </div>

        {/* IA Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Central IA</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {acoes.map(acao => (
              <div key={acao.label} className="bg-[#1c242d] rounded-xl p-5 border border-slate-700">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-purple-400 text-2xl">{acao.icon}</span>
                </div>
                <h4 className="text-white font-bold mb-2">{acao.label}</h4>
                <p className="text-slate-400 text-sm mb-4">{acao.desc}</p>
                <Link href={acao.href} className="inline-block bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {acao.btn}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Revisões */}
            <div className="bg-[#1c242d] rounded-xl border border-slate-700">
              <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-white font-bold">Painel de Revisões</h3>
                <Link href="/dashboard/revisoes" className="text-primary text-sm font-bold hover:underline">Ver todas</Link>
              </div>
              <div className="p-5">
                <div className="bg-red-900/20 border border-red-900/30 rounded-xl p-5 flex items-start gap-4 mb-4">
                  <div className="bg-red-900/30 p-2 rounded-full text-red-400 shrink-0">
                    <span className="material-symbols-outlined">warning</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-200 font-bold text-lg">5 Revisões Atrasadas</h4>
                    <p className="text-red-300/80 text-sm mt-1">Você tem tópicos de Matemática e História que precisam de atenção imediata.</p>
                  </div>
                  <Link href="/dashboard/revisoes" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shrink-0">
                    Revisar Agora
                  </Link>
                </div>
                <div className="divide-y divide-slate-700">
                  <div className="py-4 flex items-center justify-between hover:bg-slate-800/50 px-2 rounded-lg transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-900/20 flex items-center justify-center text-purple-400">
                        <span className="material-symbols-outlined">biotech</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Biologia Celular</p>
                        <p className="text-slate-400 text-sm">Agendado para Amanhã</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">arrow_forward_ios</span>
                  </div>
                  <div className="py-4 flex items-center justify-between hover:bg-slate-800/50 px-2 rounded-lg transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-900/20 flex items-center justify-center text-green-400">
                        <span className="material-symbols-outlined">public</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Geopolítica Atual</p>
                        <p className="text-slate-400 text-sm">Agendado para Amanhã</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">arrow_forward_ios</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desempenho Semanal */}
            <div className="bg-[#1c242d] rounded-xl border border-slate-700 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg">Desempenho Semanal</h3>
                <span className="text-slate-400 text-sm">Últimos 7 dias</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-2 px-2">
                {[40, 65, 50, 85, 60, 75, 55].map((height, i) => (
                  <div key={i} className="w-full flex flex-col items-center gap-2">
                    <div className={`w-full rounded-t-sm ${i === 3 ? 'bg-primary' : 'bg-blue-900/20'}`} style={{ height: `${height}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2 px-2">
                <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
              </div>
            </div>
          </div>

          {/* Sidebar direita */}
          <div className="space-y-6">
            {/* Notícias */}
            <div className="bg-[#1c242d] rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-white font-bold">Notícias & Dicas</h3>
              </div>
              <div className="p-4">
                <div className="group cursor-pointer">
                  <div className="h-32 w-full rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-primary text-4xl">lightbulb</span>
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Dica de Estudo</span>
                  <h4 className="text-white font-medium mt-1 group-hover:text-primary transition-colors">Técnica Pomodoro: Como aumentar sua produtividade</h4>
                  <p className="text-slate-400 text-xs mt-1">Leitura de 5 min</p>
                </div>
              </div>
            </div>

            {/* Atividade */}
            <div className="bg-[#1c242d] rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-white font-bold">Atividade da Turma</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <div>
                    <p className="text-sm text-white"><span className="font-bold">Ana Silva</span> completou o simulado de <span className="text-primary">Matemática</span></p>
                    <p className="text-xs text-slate-400 mt-0.5">20 min atrás</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <div>
                    <p className="text-sm text-white"><span className="font-bold">Pedro Santos</span> iniciou uma nova sequência 🔥</p>
                    <p className="text-xs text-slate-400 mt-0.5">1 hora atrás</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
