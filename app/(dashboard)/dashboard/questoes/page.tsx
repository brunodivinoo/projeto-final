'use client'

import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Check, ChatBubbleLeftIcon, BookmarkIcon, FlagIcon, TrophyIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'

interface Questao {
  id: string
  numero: number
  disciplina: string
  topico: string
  banca: string
  ano: string
  enunciado: string
  opcoes: { letra: string; texto: string }[]
  respostaSelecionada?: string
  comentarios: number
  salva?: boolean
}

const questoesExemplo: Questao[] = [
  {
    id: 'Q8492',
    numero: 8492,
    disciplina: 'Português',
    topico: 'Crase',
    banca: 'FGV',
    ano: '2023',
    enunciado: 'Assinale a alternativa em que o sinal indicativo de crase foi empregado em conformidade com a norma-padrão da língua portuguesa.',
    opcoes: [
      { letra: 'A', texto: 'Ele referiu-se à ela com muito respeito durante a reunião.' },
      { letra: 'B', texto: 'Fomos àquela festa que você mencionou na semana passada.' },
      { letra: 'C', texto: 'O documento foi entregue à Vossa Senhoria ontem à tarde.' },
      { letra: 'D', texto: 'Não direi nada à ninguém sobre o ocorrido.' },
    ],
    respostaSelecionada: 'B',
    comentarios: 12,
    salva: true,
  },
  {
    id: 'Q8493',
    numero: 8493,
    disciplina: 'Direito Constitucional',
    topico: 'Direitos Fundamentais',
    banca: 'Cebraspe',
    ano: '2024',
    enunciado: 'Acerca dos direitos e garantias fundamentais, julgue o item a seguir.\n\nA casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial.',
    opcoes: [
      { letra: 'C', texto: 'Certo' },
      { letra: 'E', texto: 'Errado' },
    ],
    comentarios: 45,
    salva: false,
  },
]

const rankingUsuarios = [
  { posicao: 1, nome: 'Ana Silva', xp: '1.240 XP', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArB7zgpmeIHCHL8hsEuVIDW4-LExUVMa4bNmSrO6G6dnlx-rlRhwVwrjO00mVIDgWi0oSUa8QXomQrVUX5BOcg0VHDvOcjNJl8SkQOV-zJFWiX0IzQbAayR0SGWNByoWJ2GRrS71sS_8TqTE9RAHJdUTfblAF0vsMvmsnzwXp2ZFw6xCrjroWURjmKXkpJLucL2cnFk8FPTSsSyO7rvzcVa7kYh79qTO9JXlVcakNF-fmCDwF-B9lw4AogFWRiy8RiOrUiOu15ilc' },
  { posicao: 2, nome: 'Pedro Costa', xp: '980 XP', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGV1oXhoDLVSxGGJOX1kaibgGx7qBUs8BATp15LxY3yJiQWYRECNS0opggcy4wPpAdMRiIJbXlOMztxQ9tSLmAAE1haNfwCz-RgG8WjkPhWoNOYmuOCXWgNHwSOic7RslQKjSITuEhqzXmnpa_N-FwqRcSisccFlzinxohBbV9OQiPUKryVchEAInrn8uBw57XzLcTGFeFvTIhyQw7_vq4vdEtGWjevSN2hMw2iPHOSVTpscQVNrIMJCALZSvq7Qctz1-2NbAxEXU' },
  { posicao: 3, nome: 'Mariana Luz', xp: '850 XP', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDe5vS5mY_HUKHxmOkrk8MrbZOQv7N9uDywdhYmqTcXiAi5q0LTELBxfmsuMZgqaOJXex0VnTjlnhEvrEQsyj8s5lmCnpiZah6ObAAxuj4gnFa3wdRObiechryy8NYFZ_Ah01Jl4uq_Neatylg6ErFBAFTISdJ5dis7RzmbqTnz1sIIwSjc4qxe2CnNG3pmitWfRjWft0va_CpCjYZ7eIPPyxWWz1bINKZv9trpTywkMWhiKJHRVY5KrpKHGjUp_5pBL1QxILNjNHI' },
]

const tagsEmAlta = ['#Constitucional', '#Crase', '#RLM', '#Informatica']

export default function QuestoesPage() {
  const [tabAtiva, setTabAtiva] = useState<'ineditas' | 'errei' | 'comentadas' | 'anotacoes'>('ineditas')
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<string[]>(['Português'])
  const [bancasSelecionadas, setBancasSelecionadas] = useState<string[]>([])
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<{ [key: string]: string }>({})

  const toggleDisciplina = (disciplina: string) => {
    if (disciplinasSelecionadas.includes(disciplina)) {
      setDisciplinasSelecionadas(disciplinasSelecionadas.filter(d => d !== disciplina))
    } else {
      setDisciplinasSelecionadas([...disciplinasSelecionadas, disciplina])
    }
  }

  const toggleBanca = (banca: string) => {
    if (bancasSelecionadas.includes(banca)) {
      setBancasSelecionadas(bancasSelecionadas.filter(b => b !== banca))
    } else {
      setBancasSelecionadas([...bancasSelecionadas, banca])
    }
  }

  const selecionarResposta = (questaoId: string, letra: string) => {
    setRespostasSelecionadas({
      ...respostasSelecionadas,
      [questaoId]: letra,
    })
  }

  return (
    <div className="min-h-screen bg-[#101922] font-['Lexend',sans-serif]">
      {/* Main Content */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Main Column */}
        <main className="col-span-1 lg:col-span-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                Banco de Questões
              </h1>
              <p className="text-[#9dabb9]">Explore mais de 24.500 questões filtradas.</p>
            </div>
            <button className="lg:hidden flex items-center gap-2 px-4 py-2 bg-[#1C252E] border border-[#2A3441] rounded-lg text-sm font-medium text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Filtros
            </button>
          </div>

          {/* Search Bar */}
          <div className="w-full">
            <div className="relative flex items-center w-full h-12 rounded-lg bg-[#1C252E] border border-[#2A3441] shadow-sm focus-within:border-[#137fec] focus-within:ring-1 focus-within:ring-[#137fec] overflow-hidden">
              <div className="grid place-items-center h-full w-12 text-[#9dabb9]">
                <Search className="w-5 h-5" />
              </div>
              <input
                className="peer h-full w-full outline-none bg-transparent text-sm text-white pr-4 placeholder:text-[#9dabb9]"
                placeholder="Pesquisar por palavras-chave no enunciado..."
                type="text"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setTabAtiva('ineditas')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-transform hover:-translate-y-0.5 ${
                tabAtiva === 'ineditas'
                  ? 'bg-[#137fec] text-white shadow-md shadow-[#137fec]/20'
                  : 'bg-[#1C252E] border border-[#2A3441] hover:bg-white/5 text-gray-300'
              }`}
            >
              {tabAtiva === 'ineditas' && <Check className="w-[18px] h-[18px]" />}
              Inéditas
            </button>
            <button
              onClick={() => setTabAtiva('errei')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-transform hover:-translate-y-0.5 ${
                tabAtiva === 'errei'
                  ? 'bg-[#137fec] text-white shadow-md shadow-[#137fec]/20'
                  : 'bg-[#1C252E] border border-[#2A3441] hover:bg-white/5 text-gray-300'
              }`}
            >
              {tabAtiva === 'errei' && <Check className="w-[18px] h-[18px]" />}
              Errei anteriormente
            </button>
            <button
              onClick={() => setTabAtiva('comentadas')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-transform hover:-translate-y-0.5 ${
                tabAtiva === 'comentadas'
                  ? 'bg-[#137fec] text-white shadow-md shadow-[#137fec]/20'
                  : 'bg-[#1C252E] border border-[#2A3441] hover:bg-white/5 text-gray-300'
              }`}
            >
              {tabAtiva === 'comentadas' && <Check className="w-[18px] h-[18px]" />}
              Comentadas
            </button>
            <button
              onClick={() => setTabAtiva('anotacoes')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-transform hover:-translate-y-0.5 ${
                tabAtiva === 'anotacoes'
                  ? 'bg-[#137fec] text-white shadow-md shadow-[#137fec]/20'
                  : 'bg-[#1C252E] border border-[#2A3441] hover:bg-white/5 text-gray-300'
              }`}
            >
              {tabAtiva === 'anotacoes' && <Check className="w-[18px] h-[18px]" />}
              Minhas anotações
            </button>
          </div>

          {/* Questões */}
          {questoesExemplo.map((questao) => (
            <article key={questao.id} className="bg-[#1C252E] rounded-xl border border-[#2A3441] p-5 md:p-6 shadow-sm">
              {/* Breadcrumb */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-3 mb-4 text-xs font-medium text-[#9dabb9]">
                <span className="text-[#137fec] bg-[#137fec]/10 px-2 py-0.5 rounded">{questao.id}</span>
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  {questao.disciplina}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  {questao.topico}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  {questao.banca}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  {questao.ano}
                </span>
              </div>

              {/* Enunciado */}
              <div className="mb-6">
                <p className="text-base leading-relaxed text-gray-200 whitespace-pre-line">
                  {questao.enunciado}
                </p>
              </div>

              {/* Opções */}
              <div className="space-y-3 mb-6">
                {questao.opcoes.map((opcao) => {
                  const isSelected = respostasSelecionadas[questao.id] === opcao.letra
                  const isPreSelected = questao.respostaSelecionada === opcao.letra

                  return (
                    <label
                      key={opcao.letra}
                      className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-colors group ${
                        isSelected || isPreSelected
                          ? 'border-[#137fec] bg-[#137fec]/5'
                          : 'border-[#2A3441] hover:bg-white/5'
                      }`}
                    >
                      <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                        <input
                          className="peer sr-only"
                          name={`questao-${questao.id}`}
                          type="radio"
                          checked={isSelected || isPreSelected}
                          onChange={() => selecionarResposta(questao.id, opcao.letra)}
                        />
                        <div
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                            isSelected || isPreSelected
                              ? 'border-[#137fec] bg-[#137fec]'
                              : 'border-gray-400 group-hover:border-[#137fec]'
                          }`}
                        ></div>
                        <span
                          className={`absolute text-[10px] font-bold text-white ${
                            isSelected || isPreSelected ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          {opcao.letra}
                        </span>
                      </div>
                      <span
                        className={`text-sm transition-colors ${
                          isSelected || isPreSelected
                            ? 'text-white font-medium'
                            : 'text-gray-300 group-hover:text-white'
                        }`}
                      >
                        {opcao.texto}
                      </span>
                    </label>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#2A3441]">
                <button className="bg-[#137fec] hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-md shadow-[#137fec]/20 transition-all active:scale-95">
                  Responder
                </button>
                <div className="flex items-center gap-2 sm:gap-4">
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-[#137fec] transition-colors px-2 py-1 rounded-md hover:bg-white/5">
                    <ChatBubbleLeftIcon className="w-5 h-5" />
                    <span className="text-xs font-medium">{questao.comentarios} Comentários</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-[#137fec] transition-colors px-2 py-1 rounded-md hover:bg-white/5">
                    {questao.salva ? (
                      <BookmarkSolidIcon className="w-5 h-5 text-[#137fec]" />
                    ) : (
                      <BookmarkIcon className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline text-xs font-medium">Salvar</span>
                  </button>
                  <button
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Reportar Erro"
                  >
                    <FlagIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </article>
          ))}

          {/* Paginação */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              disabled={paginaAtual === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#2A3441] bg-[#1C252E] text-gray-300 hover:bg-white/5 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#137fec] text-white font-medium shadow-md shadow-[#137fec]/20">
              1
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#2A3441] bg-[#1C252E] text-gray-300 hover:bg-white/5 hover:text-[#137fec] transition-colors">
              2
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#2A3441] bg-[#1C252E] text-gray-300 hover:bg-white/5 hover:text-[#137fec] transition-colors">
              3
            </button>
            <span className="text-[#9dabb9] px-1">...</span>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#2A3441] bg-[#1C252E] text-gray-300 hover:bg-white/5 hover:text-[#137fec] transition-colors">
              12
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#2A3441] bg-[#1C252E] text-gray-300 hover:bg-white/5">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        {/* Sidebar Direita */}
        <aside className="hidden lg:block lg:col-span-5 space-y-6">
          {/* Filtros */}
          <div className="bg-[#1C252E] rounded-xl border border-[#2A3441] p-5 space-y-4 shadow-sm sticky top-24">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Filtros</h3>
              <button className="text-xs font-medium text-[#137fec] hover:text-[#137fec]/80">
                Limpar tudo
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Disciplina */}
              <details className="flex flex-col rounded-lg border border-[#2A3441] bg-white/5 overflow-hidden group" open>
                <summary className="flex cursor-pointer items-center justify-between p-3 select-none hover:bg-white/10 transition-colors">
                  <span className="text-sm font-medium text-white">Disciplina</span>
                  <svg
                    className="w-5 h-5 text-[#9dabb9] group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-3 pb-3 pt-1 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group/item">
                    <input
                      type="checkbox"
                      checked={disciplinasSelecionadas.includes('Português')}
                      onChange={() => toggleDisciplina('Português')}
                      className="rounded border-gray-600 text-[#137fec] focus:ring-[#137fec] bg-transparent"
                    />
                    <span className="text-sm text-gray-300 group-hover/item:text-[#137fec] transition-colors">
                      Português
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group/item">
                    <input
                      type="checkbox"
                      checked={disciplinasSelecionadas.includes('Matemática')}
                      onChange={() => toggleDisciplina('Matemática')}
                      className="rounded border-gray-600 text-[#137fec] focus:ring-[#137fec] bg-transparent"
                    />
                    <span className="text-sm text-gray-300 group-hover/item:text-[#137fec] transition-colors">
                      Matemática
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group/item">
                    <input
                      type="checkbox"
                      checked={disciplinasSelecionadas.includes('Direito Const.')}
                      onChange={() => toggleDisciplina('Direito Const.')}
                      className="rounded border-gray-600 text-[#137fec] focus:ring-[#137fec] bg-transparent"
                    />
                    <span className="text-sm text-gray-300 group-hover/item:text-[#137fec] transition-colors">
                      Direito Const.
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group/item">
                    <input
                      type="checkbox"
                      checked={disciplinasSelecionadas.includes('Informática')}
                      onChange={() => toggleDisciplina('Informática')}
                      className="rounded border-gray-600 text-[#137fec] focus:ring-[#137fec] bg-transparent"
                    />
                    <span className="text-sm text-gray-300 group-hover/item:text-[#137fec] transition-colors">
                      Informática
                    </span>
                  </label>
                </div>
              </details>

              {/* Banca */}
              <details className="flex flex-col rounded-lg border border-[#2A3441] bg-white/5 overflow-hidden group">
                <summary className="flex cursor-pointer items-center justify-between p-3 select-none hover:bg-white/10 transition-colors">
                  <span className="text-sm font-medium text-white">Banca</span>
                  <svg
                    className="w-5 h-5 text-[#9dabb9] group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-3 pb-3 pt-1 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group/item">
                    <input
                      type="checkbox"
                      checked={bancasSelecionadas.includes('FGV')}
                      onChange={() => toggleBanca('FGV')}
                      className="rounded border-gray-600 text-[#137fec] focus:ring-[#137fec] bg-transparent"
                    />
                    <span className="text-sm text-gray-300 group-hover/item:text-[#137fec] transition-colors">
                      FGV
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group/item">
                    <input
                      type="checkbox"
                      checked={bancasSelecionadas.includes('Cebraspe')}
                      onChange={() => toggleBanca('Cebraspe')}
                      className="rounded border-gray-600 text-[#137fec] focus:ring-[#137fec] bg-transparent"
                    />
                    <span className="text-sm text-gray-300 group-hover/item:text-[#137fec] transition-colors">
                      Cebraspe
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group/item">
                    <input
                      type="checkbox"
                      checked={bancasSelecionadas.includes('Vunesp')}
                      onChange={() => toggleBanca('Vunesp')}
                      className="rounded border-gray-600 text-[#137fec] focus:ring-[#137fec] bg-transparent"
                    />
                    <span className="text-sm text-gray-300 group-hover/item:text-[#137fec] transition-colors">
                      Vunesp
                    </span>
                  </label>
                </div>
              </details>

              {/* Ano */}
              <details className="flex flex-col rounded-lg border border-[#2A3441] bg-white/5 overflow-hidden group">
                <summary className="flex cursor-pointer items-center justify-between p-3 select-none hover:bg-white/10 transition-colors">
                  <span className="text-sm font-medium text-white">Ano</span>
                  <svg
                    className="w-5 h-5 text-[#9dabb9] group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-3 pb-3 pt-1 space-y-2">
                  <p className="text-xs text-[#9dabb9]">Selecione os anos</p>
                </div>
              </details>

              {/* Dificuldade */}
              <details className="flex flex-col rounded-lg border border-[#2A3441] bg-white/5 overflow-hidden group">
                <summary className="flex cursor-pointer items-center justify-between p-3 select-none hover:bg-white/10 transition-colors">
                  <span className="text-sm font-medium text-white">Dificuldade</span>
                  <svg
                    className="w-5 h-5 text-[#9dabb9] group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-3 pb-3 pt-1 space-y-2">
                  <p className="text-xs text-[#9dabb9]">Selecione a dificuldade</p>
                </div>
              </details>
            </div>

            <button className="w-full bg-[#137fec] hover:bg-blue-600 text-white font-medium py-3 rounded-lg shadow-lg shadow-[#137fec]/20 transition-all active:scale-[0.98]">
              Aplicar Filtros
            </button>
          </div>

          {/* Ranking Semanal */}
          <div className="bg-[#1C252E] rounded-xl border border-[#2A3441] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
                Ranking Semanal
              </h3>
              <a className="text-xs font-medium text-[#137fec] hover:underline" href="#">
                Ver todos
              </a>
            </div>
            <div className="space-y-4">
              {rankingUsuarios.map((usuario) => (
                <div key={usuario.posicao} className="flex items-center gap-3">
                  <div className="text-sm font-bold text-gray-400 w-4">{usuario.posicao}</div>
                  <div
                    className="w-8 h-8 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${usuario.avatar}")` }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{usuario.nome}</p>
                    <p className="text-xs text-[#9dabb9]">{usuario.xp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Em Alta */}
          <div className="bg-[#1C252E] rounded-xl border border-[#2A3441] p-5">
            <h3 className="text-sm font-bold text-[#9dabb9] uppercase tracking-wider mb-4">Em Alta</h3>
            <div className="flex flex-wrap gap-2">
              {tagsEmAlta.map((tag) => (
                <a
                  key={tag}
                  className="px-3 py-1 bg-white/5 hover:bg-[#137fec]/10 hover:text-[#137fec] rounded-md text-xs font-medium text-gray-300 transition-colors"
                  href="#"
                >
                  {tag}
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
