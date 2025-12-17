'use client'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
  const { profile, stats } = useAuth()
  const nome = profile?.nome?.split(' ')[0] || 'Estudante'

  // Fallback values matching the design
  const questoesHoje = stats?.questoes_hoje ?? 42
  const taxaAcerto = stats?.taxa_acerto ?? 85
  const horasEstudadas = stats?.horas_estudadas ?? 2.5
  const sequenciaDias = stats?.sequencia_dias ?? 12

  // Weekly performance data
  const weeklyData = [40, 65, 50, 85, 60, 75, 55]
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  return (
    <div className="min-h-screen">
      <Header title="Página Inicial" />

      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Header Section - Greeting + Streak */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-[#111418] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
              Olá, {nome}!
            </h2>
            <p className="text-[#637588] dark:text-[#9dabb9] text-base font-normal leading-normal mt-1">
              Vamos manter o foco nos estudos hoje.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-[#1c242d] px-4 py-2 rounded-full border border-[#e6e8eb] dark:border-[#283039] shadow-sm">
            <span className="material-symbols-outlined text-orange-500">local_fire_department</span>
            <div className="flex flex-col">
              <span className="text-xs text-[#637588] dark:text-[#9dabb9] font-medium uppercase">Ofensiva</span>
              <span className="text-[#111418] dark:text-white font-bold leading-none">{sequenciaDias} Dias</span>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Card 1 - Questões Hoje */}
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1c242d] border border-[#e6e8eb] dark:border-[#283039] shadow-sm hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
            <div className="flex justify-between items-start">
              <div className="bg-blue-50 dark:bg-[#137fec]/20 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
              </div>
              <span className="text-[#0bda5b] bg-[#0bda5b]/10 px-2 py-1 rounded text-xs font-bold">+20%</span>
            </div>
            <div className="mt-2">
              <p className="text-[#637588] dark:text-[#9dabb9] text-sm font-medium">Questões Hoje</p>
              <p className="text-[#111418] dark:text-white text-3xl font-bold leading-tight mt-1">{questoesHoje}</p>
            </div>
          </div>

          {/* Card 2 - Taxa de Acerto */}
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1c242d] border border-[#e6e8eb] dark:border-[#283039] shadow-sm hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
            <div className="flex justify-between items-start">
              <div className="bg-blue-50 dark:bg-[#137fec]/20 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">analytics</span>
              </div>
              <span className="text-[#0bda5b] bg-[#0bda5b]/10 px-2 py-1 rounded text-xs font-bold">+5%</span>
            </div>
            <div className="mt-2">
              <p className="text-[#637588] dark:text-[#9dabb9] text-sm font-medium">Taxa de Acerto</p>
              <p className="text-[#111418] dark:text-white text-3xl font-bold leading-tight mt-1">{taxaAcerto}%</p>
            </div>
          </div>

          {/* Card 3 - Horas Estudadas */}
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1c242d] border border-[#e6e8eb] dark:border-[#283039] shadow-sm hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
            <div className="flex justify-between items-start">
              <div className="bg-blue-50 dark:bg-[#137fec]/20 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">timer</span>
              </div>
              <span className="text-[#0bda5b] bg-[#0bda5b]/10 px-2 py-1 rounded text-xs font-bold">+0.5h</span>
            </div>
            <div className="mt-2">
              <p className="text-[#637588] dark:text-[#9dabb9] text-sm font-medium">Horas Estudadas</p>
              <p className="text-[#111418] dark:text-white text-3xl font-bold leading-tight mt-1">{horasEstudadas}h</p>
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column - Reviews & Chart */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Review Panel Section */}
            <section className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-[#111418] dark:text-white text-xl font-bold">Painel de Revisões</h2>
                <button className="text-primary text-sm font-bold hover:underline">Ver todas</button>
              </div>

              {/* Alert - Overdue Reviews */}
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-5 flex items-start gap-4">
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full shrink-0 text-red-600 dark:text-red-400">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div className="flex flex-col grow">
                  <h3 className="text-red-800 dark:text-red-200 font-bold text-lg">5 Revisões Atrasadas</h3>
                  <p className="text-red-600 dark:text-red-300/80 text-sm mt-1">
                    Você tem tópicos de Matemática e História que precisam de atenção imediata para não perder o ritmo.
                  </p>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm shrink-0 whitespace-nowrap">
                  Revisar Agora
                </button>
              </div>

              {/* Upcoming Reviews List */}
              <div className="bg-white dark:bg-[#1c242d] border border-[#e6e8eb] dark:border-[#283039] rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[#e6e8eb] dark:border-[#283039]">
                  <h3 className="text-[#111418] dark:text-white font-bold text-base">Próximas na fila</h3>
                </div>
                <div className="divide-y divide-[#e6e8eb] dark:divide-[#283039]">
                  {/* Review Item 1 */}
                  <div className="p-4 flex items-center justify-between hover:bg-background-light dark:hover:bg-[#232d38] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <span className="material-symbols-outlined">biotech</span>
                      </div>
                      <div>
                        <p className="text-[#111418] dark:text-white font-medium">Biologia Celular</p>
                        <p className="text-[#637588] dark:text-[#9dabb9] text-sm">Agendado para Amanhã</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#637588] dark:text-[#505a66] group-hover:text-primary transition-colors cursor-pointer">
                      arrow_forward_ios
                    </span>
                  </div>

                  {/* Review Item 2 */}
                  <div className="p-4 flex items-center justify-between hover:bg-background-light dark:hover:bg-[#232d38] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined">public</span>
                      </div>
                      <div>
                        <p className="text-[#111418] dark:text-white font-medium">Geopolítica Atual</p>
                        <p className="text-[#637588] dark:text-[#9dabb9] text-sm">Agendado para Amanhã</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#637588] dark:text-[#505a66] group-hover:text-primary transition-colors cursor-pointer">
                      arrow_forward_ios
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Weekly Performance Chart */}
            <section className="bg-white dark:bg-[#1c242d] border border-[#e6e8eb] dark:border-[#283039] rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#111418] dark:text-white font-bold text-lg">Desempenho Semanal</h3>
                <select className="bg-background-light dark:bg-[#111418] text-[#111418] dark:text-white text-sm rounded-lg border-none focus:ring-2 focus:ring-primary py-1 px-3">
                  <option>Últimos 7 dias</option>
                  <option>Este Mês</option>
                </select>
              </div>

              {/* Chart Bars */}
              <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
                {weeklyData.map((height, index) => (
                  <div
                    key={index}
                    className={`w-full rounded-t-sm relative group cursor-pointer ${
                      index === 3 ? 'bg-primary' : 'bg-blue-100 dark:bg-blue-900/20'
                    }`}
                    style={{ height: `${height}%` }}
                  >
                    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 ${
                      index === 3 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } ${
                      index === 3 ? 'bg-primary' : 'bg-black'
                    } text-white text-xs py-1 px-2 rounded transition-opacity ${
                      index === 3 ? 'font-bold' : ''
                    }`}>
                      {height}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Day Labels */}
              <div className="flex justify-between text-xs text-[#637588] dark:text-[#9dabb9] mt-2 px-2">
                {weekDays.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </section>
          </div>

          {/* Right Sidebar - News & Activity */}
          <div className="flex flex-col gap-6">
            {/* News & Tips Card */}
            <div className="bg-white dark:bg-[#1c242d] border border-[#e6e8eb] dark:border-[#283039] rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#e6e8eb] dark:border-[#283039] flex justify-between items-center">
                <h3 className="text-[#111418] dark:text-white font-bold text-base">Notícias & Dicas</h3>
              </div>
              <div className="p-4 flex flex-col gap-5">
                {/* Featured Article */}
                <article className="flex flex-col gap-2 group cursor-pointer">
                  <div
                    className="h-32 w-full rounded-lg bg-cover bg-center"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD-I4NtklxwRrvzqLqRLTAkdq-WC8MA8tq6gTlO5WT8z75MbqaTo0Xu-1VSBsTg39iCGWge4y55DQog8zLB-XGhYUMqj-6Gn_O7MKzhfl7XrlTQTsnJo2-eMsYevg8aGUznaioG8Bud8skmtximI2xLF3sONwfJN_FtxnF5nm027KVjHC4xxRBanajJj03hhBMOy2R9RFDVO0peD_gea5r-MW-h1VYQErMP8gMH4J6MZYzSW7vFkPKNYhRYjOa_l9D4YzwWSPT5yuA")'
                    }}
                  />
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">Dica de Estudo</span>
                    <h4 className="text-[#111418] dark:text-white font-medium leading-tight mt-1 group-hover:text-primary transition-colors">
                      Técnica Pomodoro: Como aumentar sua produtividade
                    </h4>
                    <p className="text-[#637588] dark:text-[#9dabb9] text-xs mt-1">Leitura de 5 min</p>
                  </div>
                </article>

                {/* Secondary Article */}
                <article className="flex gap-3 group cursor-pointer">
                  <div
                    className="h-20 w-20 shrink-0 rounded-lg bg-cover bg-center"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCPt3CJswEHOQgVOt_OUtMOZfcgmCRUN9M43sLyKgpcpeapuIuTeTKwL4MsyIHkL_NDBOD0oIe-Q6_KoWsnZWH9CHylAeZLPiZUSXdQkGid0txXo30qBK8-TnlKDKilFv7ubq2_nTO8Hj2_0Fw-9D0xliLsJgAayDW3Ksy8dVD3MO2XfCFnXubjBQK3LR424BQyFXp-B0wxtWH560oKWh8iaTI3gKH2zU--qfO6qH3nvJ_XLIpDRXfGYx9qcw1GLp3zSzd_3rbn4eo")'
                    }}
                  />
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold text-orange-500 uppercase tracking-wide">Vestibular</span>
                    <h4 className="text-[#111418] dark:text-white text-sm font-medium leading-tight mt-1 group-hover:text-primary transition-colors">
                      Novo edital publicado para o ENEM 2024
                    </h4>
                  </div>
                </article>
              </div>

              {/* See All Button */}
              <div className="p-3 border-t border-[#e6e8eb] dark:border-[#283039] text-center">
                <button className="text-primary text-sm font-bold w-full py-1 hover:bg-blue-50 dark:hover:bg-[#137fec]/10 rounded transition-colors">
                  Ver todas notícias
                </button>
              </div>
            </div>

            {/* Class Activity Card */}
            <div className="bg-white dark:bg-[#1c242d] border border-[#e6e8eb] dark:border-[#283039] rounded-xl overflow-hidden shadow-sm flex-1">
              <div className="p-4 border-b border-[#e6e8eb] dark:border-[#283039]">
                <h3 className="text-[#111418] dark:text-white font-bold text-base">Atividade da Turma</h3>
              </div>
              <div className="p-4 flex flex-col gap-4">
                {/* Activity 1 */}
                <div className="flex gap-3">
                  <div
                    className="h-10 w-10 rounded-full bg-cover bg-center shrink-0"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCFRrJcuXToCR2KKt0DA0hkkdm76Z1m4wQwxPSNJgEv1t4ye5KQw3SOhHt1FDcSUr4-PbMgWrdNb5CPvGB4Lup_0PJo9ojuXC1HwviAv748H0HXVwaaul7_KauLxj_Sj_MsSl9UVZxJrXv70GUW_3Uv5l4PbscMnk6_dGc9mdNyV7dr2VIGvgtSScQ0IVWIxdfiADPwBlqxXFO-CdddIaK2ABEvfnCajDhFBhrkvSUCcEHtlDXvnZI2bz-maaEhScN6ogKyCKTnRM0")'
                    }}
                  />
                  <div>
                    <p className="text-sm text-[#111418] dark:text-white">
                      <span className="font-bold">Ana Silva</span> completou o simulado de <span className="font-medium text-primary">Matemática Básica</span>.
                    </p>
                    <p className="text-xs text-[#637588] dark:text-[#9dabb9] mt-0.5">20 min atrás</p>
                  </div>
                </div>

                {/* Activity 2 */}
                <div className="flex gap-3">
                  <div
                    className="h-10 w-10 rounded-full bg-cover bg-center shrink-0"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCJ25cV3Js39GXNzLNiCvuV619pAyBFrvRjM8-LQz3jC4mOj3WKWRgmkU-Z_hAPPvaxqx7m4uCQLMqhvtr_Cwxk9-Jd7ZS8kbX9qNy7w9DYHQTy4sXLmmyVK_uTj29CS0na7EQVVWqPwOFwyJvUOI2TBOiuvJie_BnrRFKJKTdfBlFf492huszsiFEIO5tDtLSdGWInAlr53gSLb9bRuYrEaYGYZ-iKVw09kaDTPWaJMMsDQ7E29oRnB6ocMghbKXwLSvpnTYYFTH4")'
                    }}
                  />
                  <div>
                    <p className="text-sm text-[#111418] dark:text-white">
                      <span className="font-bold">Pedro Santos</span> iniciou uma nova sequência de estudos 🔥
                    </p>
                    <p className="text-xs text-[#637588] dark:text-[#9dabb9] mt-0.5">1 hora atrás</p>
                  </div>
                </div>

                {/* Activity 3 */}
                <div className="flex gap-3">
                  <div
                    className="h-10 w-10 rounded-full bg-cover bg-center shrink-0"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCDA1k3AN4PK60NvkvR73tG1ge18hk4i3cxiqYgdtMPuPh_KNKuVOjjSSK_4mQTrFwFdn0RkpjNMc7GA-yctYsVMrfoCwLbbtPB7TNkWLhAoE9FhXNNSbCeYGqiLb4J8Qa1-RqdzlW2nJoDxmVMnUvU9A51lMR2E7LqhT_WTeeCVQDlOz5kcCO5DzSZqbizd5oS_fFhSs6PRDj-rcMRa0o1jTM-gPmOtpFMuvuaEtJ3HWrHWmojme-KBtmYIX1qIhXgPCcKyiR7kXU")'
                    }}
                  />
                  <div>
                    <p className="text-sm text-[#111418] dark:text-white">
                      <span className="font-bold">Julia Costa</span> postou uma dúvida em <span className="font-medium text-primary">Física</span>.
                    </p>
                    <p className="text-xs text-[#637588] dark:text-[#9dabb9] mt-0.5">2 horas atrás</p>
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
