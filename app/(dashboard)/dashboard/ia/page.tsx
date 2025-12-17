'use client'
import { useState } from 'react'

export default function CentralIAPage() {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['resumo'])

  const toggleOption = (option: string) => {
    setSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col gap-2 mt-2">
          <h1 className="text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em] text-gray-900 dark:text-white">
            Olá, Estudante
          </h1>
          <p className="text-[#9dabb9] text-base lg:text-lg font-normal">
            Potencialize seus estudos com inteligência artificial hoje.
          </p>
        </div>

        {/* AI Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {/* Gerador de Questões */}
          <div className="group relative flex flex-col gap-4 p-5 rounded-xl bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] hover:border-[#137fec]/50 transition-all hover:shadow-lg hover:shadow-[#137fec]/10 cursor-pointer overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#137fec]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="size-12 rounded-lg bg-[#137fec]/20 flex items-center justify-center text-[#137fec] z-10">
              <span className="material-symbols-outlined text-3xl">quiz</span>
            </div>
            <div className="flex flex-col gap-1 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gerador de Questões</h3>
              <p className="text-[#9dabb9] text-sm">Crie simulados personalizados baseados em qualquer tópico.</p>
            </div>
            <div className="mt-auto pt-2 flex items-center text-[#137fec] text-sm font-bold group-hover:underline">
              Começar agora <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
            </div>
          </div>

          {/* Resumidor Inteligente */}
          <div className="group relative flex flex-col gap-4 p-5 rounded-xl bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] hover:border-[#137fec]/50 transition-all hover:shadow-lg hover:shadow-[#137fec]/10 cursor-pointer overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="size-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-[#a855f7] z-10">
              <span className="material-symbols-outlined text-3xl">summarize</span>
            </div>
            <div className="flex flex-col gap-1 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Resumidor Inteligente</h3>
              <p className="text-[#9dabb9] text-sm">Transforme textos longos em tópicos digeríveis instantaneamente.</p>
            </div>
            <div className="mt-auto pt-2 flex items-center text-[#a855f7] text-sm font-bold group-hover:underline">
              Resumir texto <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
            </div>
          </div>

          {/* Chat Tira-Dúvidas */}
          <div className="group relative flex flex-col gap-4 p-5 rounded-xl bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] hover:border-[#137fec]/50 transition-all hover:shadow-lg hover:shadow-[#137fec]/10 cursor-pointer overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="size-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 z-10">
              <span className="material-symbols-outlined text-3xl">chat_bubble</span>
            </div>
            <div className="flex flex-col gap-1 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chat Tira-Dúvidas</h3>
              <p className="text-[#9dabb9] text-sm">Converse com a IA em tempo real para esclarecer conceitos.</p>
            </div>
            <div className="mt-auto pt-2 flex items-center text-emerald-400 text-sm font-bold group-hover:underline">
              Iniciar chat <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
            </div>
          </div>
        </div>

        {/* PDF Analysis Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2">
            <span className="material-symbols-outlined text-[#137fec]">picture_as_pdf</span>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Analisar PDF</h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Upload Area */}
            <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-[#283039] rounded-xl bg-gray-50 dark:bg-[#1C252E]/50 p-8 flex flex-col items-center justify-center gap-4 text-center hover:border-[#137fec]/50 hover:bg-[#137fec]/5 transition-all cursor-pointer group min-h-[250px]">
              <div className="size-16 rounded-full bg-gray-200 dark:bg-[#283039] flex items-center justify-center text-[#9dabb9] group-hover:text-[#137fec] transition-colors">
                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-lg font-bold text-gray-900 dark:text-white">Arraste e solte seu PDF aqui</p>
                <p className="text-[#9dabb9] text-sm">Suporta arquivos PDF até 50MB</p>
              </div>
              <button className="mt-2 px-6 py-2.5 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold rounded-lg shadow-lg shadow-[#137fec]/20 transition-all">
                Selecionar arquivo
              </button>
            </div>

            {/* Sidebar Options */}
            <div className="w-full lg:w-80 flex flex-col gap-4 bg-white dark:bg-[#1C252E] p-6 rounded-xl border border-gray-200 dark:border-[#283039]">
              <h3 className="font-bold text-gray-900 dark:text-white">O que você deseja gerar?</h3>

              {/* Resumo Automático */}
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#283039] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes('resumo')}
                    onChange={() => toggleOption('resumo')}
                    className="peer size-5 cursor-pointer appearance-none rounded border border-[#9dabb9] checked:border-[#137fec] checked:bg-[#137fec] transition-all"
                  />
                  <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 material-symbols-outlined text-sm">check</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Resumo Automático</span>
                  <span className="text-xs text-[#9dabb9]">Pontos chave do documento</span>
                </div>
              </label>

              {/* Flashcards */}
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#283039] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes('flashcards')}
                    onChange={() => toggleOption('flashcards')}
                    className="peer size-5 cursor-pointer appearance-none rounded border border-[#9dabb9] checked:border-[#137fec] checked:bg-[#137fec] transition-all"
                  />
                  <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 material-symbols-outlined text-sm">check</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Flashcards</span>
                  <span className="text-xs text-[#9dabb9]">Para revisão espaçada</span>
                </div>
              </label>

              {/* Questões de Fixação */}
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#283039] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes('questoes')}
                    onChange={() => toggleOption('questoes')}
                    className="peer size-5 cursor-pointer appearance-none rounded border border-[#9dabb9] checked:border-[#137fec] checked:bg-[#137fec] transition-all"
                  />
                  <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 material-symbols-outlined text-sm">check</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Questões de Fixação</span>
                  <span className="text-xs text-[#9dabb9]">Quiz múltipla escolha</span>
                </div>
              </label>

              {/* Generate Button */}
              <div className="mt-auto pt-2">
                <p className="text-xs text-[#9dabb9] text-center mb-2">IA consumirá 1 crédito por página</p>
                <button
                  disabled={selectedOptions.length === 0}
                  className={`w-full py-2.5 text-white font-bold rounded-lg transition-all ${
                    selectedOptions.length === 0
                      ? 'bg-[#283039] opacity-50 cursor-not-allowed'
                      : 'bg-[#283039] hover:bg-[#333d4a]'
                  }`}
                >
                  Gerar Conteúdo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="flex flex-col gap-4 pb-10">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Atividade Recente</h2>
            <a className="text-sm font-medium text-[#137fec] hover:underline" href="#">Ver tudo</a>
          </div>

          <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] overflow-hidden">
            {/* Activity Item 1 */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-[#283039] hover:bg-gray-50 dark:hover:bg-[#202b36] transition-colors cursor-pointer">
              <div className="size-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-[#a855f7] shrink-0">
                <span className="material-symbols-outlined text-xl">description</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">Resumo: História da Arte Moderna</h4>
                <p className="text-xs text-[#9dabb9]">Gerado há 2 horas • 5 páginas processadas</p>
              </div>
              <div className="hidden sm:flex gap-2">
                <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#9dabb9] hover:text-white">
                  <span className="material-symbols-outlined text-lg">download</span>
                </button>
                <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#9dabb9] hover:text-white">
                  <span className="material-symbols-outlined text-lg">arrow_forward_ios</span>
                </button>
              </div>
            </div>

            {/* Activity Item 2 */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-[#283039] hover:bg-gray-50 dark:hover:bg-[#202b36] transition-colors cursor-pointer">
              <div className="size-10 rounded-lg bg-[#137fec]/20 flex items-center justify-center text-[#137fec] shrink-0">
                <span className="material-symbols-outlined text-xl">quiz</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">Simulado: Biologia Celular</h4>
                <p className="text-xs text-[#9dabb9]">Gerado ontem • 15 questões</p>
              </div>
              <div className="hidden sm:flex gap-2">
                <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#9dabb9] hover:text-white">
                  <span className="material-symbols-outlined text-lg">download</span>
                </button>
                <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#9dabb9] hover:text-white">
                  <span className="material-symbols-outlined text-lg">arrow_forward_ios</span>
                </button>
              </div>
            </div>

            {/* Activity Item 3 */}
            <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#202b36] transition-colors cursor-pointer">
              <div className="size-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <span className="material-symbols-outlined text-xl">forum</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">Chat sobre Física Quântica</h4>
                <p className="text-xs text-[#9dabb9]">Ontem</p>
              </div>
              <div className="hidden sm:flex gap-2">
                <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#9dabb9] hover:text-white">
                  <span className="material-symbols-outlined text-lg">arrow_forward_ios</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
