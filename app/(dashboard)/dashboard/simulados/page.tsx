'use client'

import { Header } from '@/components/layout/Header'

export default function SimuladosPage() {
  return (
    <div className="min-h-screen">
      <Header title="Simulados Inteligentes" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              Simulados Inteligentes
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-light leading-relaxed">
              Gere provas personalizadas com base no seu desempenho e foque no que importa. Nossa IA identifica seus pontos fracos automaticamente.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#283039] hover:bg-slate-50 dark:hover:bg-[#3b4754] text-slate-900 dark:text-white rounded-lg transition-colors text-sm font-medium border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-[20px]">history</span>
              Histórico
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Card 1 - Média Geral */}
          <div className="flex flex-col gap-1 rounded-xl p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Média Geral</p>
              <span className="material-symbols-outlined text-primary text-[20px]">monitoring</span>
            </div>
            <p className="text-slate-900 dark:text-white text-3xl font-bold">78%</p>
            <p className="text-green-600 dark:text-green-500 text-xs font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +5% esta semana
            </p>
          </div>

          {/* Card 2 - Questões Resolvidas */}
          <div className="flex flex-col gap-1 rounded-xl p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Questões Resolvidas</p>
              <span className="material-symbols-outlined text-purple-500 text-[20px]">check_circle</span>
            </div>
            <p className="text-slate-900 dark:text-white text-3xl font-bold">342</p>
            <p className="text-green-600 dark:text-green-500 text-xs font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +24 hoje
            </p>
          </div>

          {/* Card 3 - Dias de Ofensiva */}
          <div className="flex flex-col gap-1 rounded-xl p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Dias de Ofensiva</p>
              <span className="material-symbols-outlined text-orange-500 text-[20px]">local_fire_department</span>
            </div>
            <p className="text-slate-900 dark:text-white text-3xl font-bold">12</p>
            <p className="text-slate-500 text-xs font-medium mt-1">Continue assim!</p>
          </div>

          {/* Card 4 - Ranking Global */}
          <div className="flex flex-col gap-1 rounded-xl p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] shadow-sm relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">leaderboard</span>
            </div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ranking Global</p>
              <span className="material-symbols-outlined text-yellow-500 text-[20px]">emoji_events</span>
            </div>
            <p className="text-slate-900 dark:text-white text-3xl font-bold">#42</p>
            <p className="text-primary text-xs font-medium mt-1 flex items-center gap-1">
              Ver leaderboard <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          {/* Gerador de Simulados */}
          <div className="flex-[2] rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white dark:from-[#1c2127] to-slate-50 dark:to-[#16191f] p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-gradient-to-r from-primary to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Novo
                  </span>
                  <span className="text-primary text-xs font-bold tracking-wider uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span> Powered by AI
                  </span>
                </div>
                <h2 className="text-slate-900 dark:text-white text-2xl lg:text-3xl font-bold leading-tight">
                  Gerador de Simulados
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-xl">
                  Configure os parâmetros abaixo e deixe nossa inteligência artificial criar uma prova inédita focada nas suas necessidades atuais.
                </p>
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Matéria */}
                <div className="flex flex-col gap-2 group">
                  <label className="text-slate-900 dark:text-white text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">library_books</span> Matéria
                  </label>
                  <div className="relative">
                    <select className="w-full bg-slate-50 dark:bg-[#111418] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-3 pr-10 appearance-none cursor-pointer hover:border-primary/50 transition-colors">
                      <option>Mix Geral (Recomendado)</option>
                      <option>Matemática e Lógica</option>
                      <option>Língua Portuguesa</option>
                      <option>Ciências da Natureza</option>
                      <option>Ciências Humanas</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                </div>

                {/* Dificuldade */}
                <div className="flex flex-col gap-2 group">
                  <label className="text-slate-900 dark:text-white text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">equalizer</span> Dificuldade
                  </label>
                  <div className="relative">
                    <select className="w-full bg-slate-50 dark:bg-[#111418] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-3 pr-10 appearance-none cursor-pointer hover:border-primary/50 transition-colors">
                      <option>Adaptativo (IA)</option>
                      <option>Iniciante</option>
                      <option>Intermediário</option>
                      <option>Avançado</option>
                      <option>Desafio Extremo</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                </div>

                {/* Foco da Prova */}
                <div className="flex flex-col gap-2 group">
                  <label className="text-slate-900 dark:text-white text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">target</span> Foco da Prova
                  </label>
                  <div className="relative">
                    <select className="w-full bg-slate-50 dark:bg-[#111418] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-3 pr-10 appearance-none cursor-pointer hover:border-primary/50 transition-colors">
                      <option>ENEM 2024</option>
                      <option>Concurso Público - TI</option>
                      <option>OAB - 1ª Fase</option>
                      <option>Vestibular FUVEST</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-2">
                <button className="w-full md:w-auto bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-[0_4px_14px_0_rgba(19,127,236,0.39)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">smart_toy</span>
                  Gerar Simulado Agora
                </button>
              </div>
            </div>
          </div>

          {/* Revisão Pendente Sidebar */}
          <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] p-6 flex flex-col justify-between min-h-[280px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold">Revisão Pendente</h3>
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-orange-500 text-sm">priority_high</span>
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Você tem <span className="text-slate-900 dark:text-white font-bold">12 questões</span> marcadas como incorretas nos últimos simulados de Matemática.
              </p>
              <div className="space-y-3">
                {/* Topic 1 */}
                <div className="bg-slate-50 dark:bg-[#111418] p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded bg-red-500/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-red-500 text-lg">functions</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-white text-sm font-medium truncate">Logaritmos e Exponenciais</p>
                    <p className="text-slate-500 text-xs">5 erros</p>
                  </div>
                </div>
                {/* Topic 2 */}
                <div className="bg-slate-50 dark:bg-[#111418] p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded bg-red-500/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-red-500 text-lg">square_foot</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-white text-sm font-medium truncate">Geometria Espacial</p>
                    <p className="text-slate-500 text-xs">3 erros</p>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 bg-transparent border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
              Iniciar Sessão de Revisão
            </button>
          </div>
        </div>

        {/* Histórico Recente Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-slate-900 dark:text-white text-xl font-bold">Histórico Recente</h2>
            <a className="text-primary text-sm font-medium hover:underline flex items-center gap-1" href="#">
              Ver todos <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#1c2127] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-[#16191f] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">Simulado</th>
                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">Data</th>
                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">Duração</th>
                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">Pontuação</th>
                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-500 uppercase text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {/* Row 1 */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                          <span className="material-symbols-outlined">calculate</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-900 dark:text-white font-medium text-sm">Matemática - Intensivo</span>
                          <span className="text-slate-500 text-xs">Foco: ENEM 2024</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">Hoje, 14:30</td>
                    <td className="p-4 text-slate-500 text-sm">45 min</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white font-bold">85%</span>
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-[85%]"></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Concluído
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded hover:bg-slate-100 dark:hover:bg-white/10">
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </td>
                  </tr>

                  {/* Row 2 */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500">
                          <span className="material-symbols-outlined">menu_book</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-900 dark:text-white font-medium text-sm">Linguagens e Códigos</span>
                          <span className="text-slate-500 text-xs">Foco: Vestibular</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">Ontem, 09:15</td>
                    <td className="p-4 text-slate-500 text-sm">--</td>
                    <td className="p-4">
                      <span className="text-slate-500 text-sm">--</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                        Em Andamento
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="bg-primary/20 hover:bg-primary/30 text-primary hover:text-white transition-colors px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide">
                        Continuar
                      </button>
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500">
                          <span className="material-symbols-outlined">biotech</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-900 dark:text-white font-medium text-sm">Ciências da Natureza</span>
                          <span className="text-slate-500 text-xs">Mix Geral</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">12 Out, 16:00</td>
                    <td className="p-4 text-slate-500 text-sm">1h 20m</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white font-bold">62%</span>
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 w-[62%]"></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Concluído
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded hover:bg-slate-100 dark:hover:bg-white/10">
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
