'use client'
import { Header } from '@/components/layout/Header'

export default function CiclosPage() {
  return (
    <div className="min-h-screen">
      <Header title="Ciclos de Estudo" />

      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20">
                Em Progresso
              </span>
              <span className="text-slate-400 text-sm">Restam 5 dias</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Ciclo #04: Foco em Exatas
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Planejamento intensivo para vestibular com ênfase em cálculo e física.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#232d3b] transition-colors">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#232d3b] transition-colors">
              <span className="material-symbols-outlined text-[18px]">share</span>
              Compartilhar
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Horas Planejadas */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Horas Planejadas</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">40h</h3>
              </div>
              <div className="p-2 rounded bg-blue-500/10 text-primary">
                <span className="material-symbols-outlined">schedule</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-500">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+5% vs semana passada</span>
            </div>
          </div>

          {/* Horas Estudadas */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Horas Estudadas</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">28h 15m</h3>
              </div>
              <div className="p-2 rounded bg-purple-500/10 text-purple-500">
                <span className="material-symbols-outlined">timer</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-500">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+12% vs média</span>
            </div>
          </div>

          {/* Progresso Geral */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Progresso Geral</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">70%</h3>
              </div>
              <div className="p-2 rounded bg-green-500/10 text-green-500">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>

        {/* Próxima Sessão Sugerida */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Próxima Sessão Sugerida</h3>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-[#0b5cb6] p-6 md:p-8 text-white shadow-lg">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[180px]">functions</span>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold mb-3 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  Prioridade Alta
                </div>
                <h2 className="text-3xl font-bold mb-2">Matemática - Funções</h2>
                <p className="text-blue-100 max-w-lg text-sm md:text-base">
                  Você precisa completar mais 2 horas deste módulo para atingir a meta semanal. Última sessão foi há 2 dias.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                <button className="flex items-center justify-center gap-2 w-full bg-white text-primary hover:bg-blue-50 font-bold py-3 px-6 rounded-lg shadow-sm transition-all transform hover:scale-[1.02]">
                  <span className="material-symbols-outlined filled">play_arrow</span>
                  Iniciar Sessão
                </button>
                <div className="text-center text-xs text-blue-100 font-medium">Meta: 1h 30min</div>
              </div>
            </div>
          </div>
        </section>

        {/* Matérias do Ciclo */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Matérias do Ciclo</h3>
            <button className="text-sm font-medium text-primary hover:text-blue-400">Ver todas</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Português */}
            <div className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-4 transition-all hover:border-primary/50 hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">Português</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Gramática e Interpretação</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Progresso</span>
                  <span className="text-slate-900 dark:text-white">45%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <div className="flex justify-between text-xs mt-2 text-slate-500 dark:text-slate-400">
                  <span>4.5h estudadas</span>
                  <span>Meta: 10h</span>
                </div>
              </div>
            </div>

            {/* Química */}
            <div className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-4 transition-all hover:border-primary/50 hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">biotech</span>
                </div>
                <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">Química</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Química Orgânica</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Progresso</span>
                  <span className="text-slate-900 dark:text-white">80%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-pink-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <div className="flex justify-between text-xs mt-2 text-slate-500 dark:text-slate-400">
                  <span>8h estudadas</span>
                  <span>Meta: 10h</span>
                </div>
              </div>
            </div>

            {/* Geografia */}
            <div className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-4 transition-all hover:border-primary/50 hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-500 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">public</span>
                </div>
                <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">Geografia</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Geopolítica Atual</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Progresso</span>
                  <span className="text-slate-900 dark:text-white">20%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <div className="flex justify-between text-xs mt-2 text-slate-500 dark:text-slate-400">
                  <span>1h estudadas</span>
                  <span>Meta: 5h</span>
                </div>
              </div>
            </div>

            {/* Adicionar Matéria */}
            <button className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-transparent p-4 min-h-[180px] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary mb-3 transition-colors">
                <span className="material-symbols-outlined">add</span>
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Adicionar Matéria</span>
            </button>
          </div>
        </section>
      </div>

      {/* Timer Widget (Fixed Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white dark:bg-[#1c242d] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 flex items-center pr-4 cursor-pointer hover:border-primary transition-colors">
          <div className="bg-primary/10 text-primary p-2 rounded-md mr-3">
            <span className="material-symbols-outlined text-[20px]">hourglass_bottom</span>
          </div>
          <div className="flex flex-col mr-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Em Pausa</span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">00:25:30</span>
          </div>
          <button className="text-primary hover:text-blue-600">
            <span className="material-symbols-outlined filled text-[28px]">play_circle</span>
          </button>
        </div>
      </div>
    </div>
  )
}
