'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'

interface Questao {
  id: string
  disciplina: string
  topico: string
  banca: string
  ano: string
  dificuldade: 'Fácil' | 'Médio' | 'Difícil'
  tipo: 'multipla' | 'certo_errado'
  enunciado: string
  opcoes: { letra: string; texto: string }[]
  gabarito: string
  comentarios: number
}

const questoesExemplo: Questao[] = [
  {
    id: 'Q8492',
    disciplina: 'Português',
    topico: 'Crase',
    banca: 'FGV',
    ano: '2023',
    dificuldade: 'Fácil',
    tipo: 'multipla',
    enunciado: 'Assinale a alternativa em que o sinal indicativo de crase foi empregado em conformidade com a norma-padrão da língua portuguesa.',
    opcoes: [
      { letra: 'A', texto: 'Ele referiu-se à ela com muito respeito durante a reunião.' },
      { letra: 'B', texto: 'Fomos àquela festa que você mencionou na semana passada.' },
      { letra: 'C', texto: 'O documento foi entregue à Vossa Senhoria ontem à tarde.' },
      { letra: 'D', texto: 'Não direi nada à ninguém sobre o ocorrido.' },
    ],
    gabarito: 'B',
    comentarios: 12,
  },
  {
    id: 'Q8493',
    disciplina: 'Direito Constitucional',
    topico: 'Direitos Fundamentais',
    banca: 'Cebraspe',
    ano: '2024',
    dificuldade: 'Médio',
    tipo: 'certo_errado',
    enunciado: 'JULGUE O ITEM A SEGUIR',
    opcoes: [
      { letra: 'C', texto: 'Certo' },
      { letra: 'E', texto: 'Errado' },
    ],
    gabarito: 'C',
    comentarios: 45,
  },
]

const rankingUsuarios = [
  { posicao: 1, nome: 'Lucas Mendes', xp: '1.240 XP' },
  { posicao: 2, nome: 'Ana Carolina', xp: '1.180 XP' },
  { posicao: 3, nome: 'Pedro Santos', xp: '1.050 XP' },
]

export default function QuestoesPage() {
  const [tabAtiva, setTabAtiva] = useState<'todas' | 'ineditas' | 'errei' | 'anotacoes' | 'ia'>('todas')
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<{ [key: string]: string }>({
    'Q8492': 'B'
  })
  const [filtros, setFiltros] = useState({
    disciplina: 'Português',
    assunto: 'Todos os assuntos',
    banca: 'Selecione a banca',
    ano: '2024',
    dificuldade: 'Todas',
    escolaridade: 'Todas',
    modalidades: ['multipla', 'certo_errado']
  })

  const selecionarResposta = (questaoId: string, letra: string) => {
    setRespostasSelecionadas({
      ...respostasSelecionadas,
      [questaoId]: letra,
    })
  }

  const toggleModalidade = (modalidade: string) => {
    if (filtros.modalidades.includes(modalidade)) {
      setFiltros({
        ...filtros,
        modalidades: filtros.modalidades.filter(m => m !== modalidade)
      })
    } else {
      setFiltros({
        ...filtros,
        modalidades: [...filtros.modalidades, modalidade]
      })
    }
  }

  const getDificuldadeColor = (dificuldade: string) => {
    switch (dificuldade) {
      case 'Fácil':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
      case 'Médio':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Difícil':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
      <Header title="Questões" />

      <div className="p-4 lg:p-6">
        <div className="max-w-[1400px] mx-auto">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-xl">
                search
              </span>
              <input
                type="text"
                placeholder="Pesquisar por palavras-chave no enunciado, código da questão..."
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setTabAtiva('todas')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tabAtiva === 'todas'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] text-gray-600 dark:text-gray-300 hover:border-primary/50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setTabAtiva('ineditas')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tabAtiva === 'ineditas'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] text-gray-600 dark:text-gray-300 hover:border-primary/50'
              }`}
            >
              Inéditas
            </button>
            <button
              onClick={() => setTabAtiva('errei')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tabAtiva === 'errei'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] text-gray-600 dark:text-gray-300 hover:border-primary/50'
              }`}
            >
              Errei anteriormente
            </button>
            <button
              onClick={() => setTabAtiva('anotacoes')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tabAtiva === 'anotacoes'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] text-gray-600 dark:text-gray-300 hover:border-primary/50'
              }`}
            >
              Minhas anotações
            </button>
            <button
              onClick={() => setTabAtiva('ia')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                tabAtiva === 'ia'
                  ? 'bg-gradient-to-r from-purple-500 to-primary text-white shadow-md'
                  : 'bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] text-purple-500 hover:border-purple-500/50'
              }`}
            >
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              Geradas por IA
            </button>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Questions List */}
            <div className="flex-1 space-y-4">
              {questoesExemplo.map((questao) => (
                <div
                  key={questao.id}
                  className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] overflow-hidden shadow-sm"
                >
                  {/* Question Header */}
                  <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100 dark:border-[#283039]">
                    <span className="text-primary font-bold text-sm">{questao.id}</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{questao.disciplina}</span>
                    <span className="text-gray-400">&gt;</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{questao.topico}</span>
                    <div className="flex-1"></div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{questao.banca}</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{questao.ano}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDificuldadeColor(questao.dificuldade)}`}>
                      {questao.dificuldade}
                    </span>
                  </div>

                  {/* Question Content */}
                  <div className="p-4 lg:p-6">
                    {/* Enunciado */}
                    <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed mb-6">
                      {questao.enunciado}
                    </p>

                    {/* Options */}
                    <div className="space-y-3">
                      {questao.opcoes.map((opcao) => {
                        const isSelected = respostasSelecionadas[questao.id] === opcao.letra

                        return (
                          <label
                            key={opcao.letra}
                            onClick={() => selecionarResposta(questao.id, opcao.letra)}
                            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 dark:border-[#283039] hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-all ${
                                isSelected
                                  ? 'bg-primary text-white'
                                  : 'border-2 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {opcao.letra}
                            </div>
                            <span className={`text-sm pt-1 ${
                              isSelected
                                ? 'text-gray-900 dark:text-white font-medium'
                                : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {opcao.texto}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Question Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 px-4 lg:px-6 py-4 border-t border-gray-100 dark:border-[#283039] bg-gray-50 dark:bg-[#161f28]">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        Gabarito Comentado
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">chat_bubble_outline</span>
                        Comentários ({questao.comentarios})
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">bar_chart</span>
                        Estatística
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md shadow-primary/20 transition-all">
                        Responder
                      </button>
                      <button className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Reportar">
                        <span className="material-symbols-outlined text-xl">flag</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Second Question - Certo/Errado style */}
              <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] overflow-hidden shadow-sm">
                {/* Question Header */}
                <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100 dark:border-[#283039]">
                  <span className="text-primary font-bold text-sm">Q8493</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Direito Constitucional</span>
                  <span className="text-gray-400">&gt;</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Direitos Fundamentais</span>
                  <div className="flex-1"></div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Cebraspe</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">2024</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Médio
                  </span>
                </div>

                {/* Question Content */}
                <div className="p-4 lg:p-6">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">
                    JULGUE O ITEM A SEGUIR
                  </p>
                  <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed">
                    A casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial.
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar - Filters */}
            <aside className="w-full lg:w-80 space-y-6">
              {/* Filters Card */}
              <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filtros</h3>
                  <button className="text-sm text-primary hover:underline font-medium">Limpar tudo</button>
                </div>

                <div className="space-y-4">
                  {/* Disciplina */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Disciplina</label>
                    <div className="relative">
                      <select
                        value={filtros.disciplina}
                        onChange={(e) => setFiltros({ ...filtros, disciplina: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#101922] border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white text-sm appearance-none cursor-pointer focus:border-primary focus:outline-none"
                      >
                        <option>Português</option>
                        <option>Matemática</option>
                        <option>Direito Constitucional</option>
                        <option>Direito Administrativo</option>
                        <option>Informática</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-lg pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Assunto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assunto</label>
                    <div className="relative">
                      <select
                        value={filtros.assunto}
                        onChange={(e) => setFiltros({ ...filtros, assunto: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#101922] border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white text-sm appearance-none cursor-pointer focus:border-primary focus:outline-none"
                      >
                        <option>Todos os assuntos</option>
                        <option>Crase</option>
                        <option>Concordância</option>
                        <option>Regência</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-lg pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Banca */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Banca</label>
                    <div className="relative">
                      <select
                        value={filtros.banca}
                        onChange={(e) => setFiltros({ ...filtros, banca: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#101922] border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white text-sm appearance-none cursor-pointer focus:border-primary focus:outline-none"
                      >
                        <option>Selecione a banca</option>
                        <option>FGV</option>
                        <option>Cebraspe</option>
                        <option>Vunesp</option>
                        <option>FCC</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-lg pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Ano e Dificuldade - side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ano</label>
                      <div className="relative">
                        <select
                          value={filtros.ano}
                          onChange={(e) => setFiltros({ ...filtros, ano: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#101922] border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white text-sm appearance-none cursor-pointer focus:border-primary focus:outline-none"
                        >
                          <option>2024</option>
                          <option>2023</option>
                          <option>2022</option>
                          <option>2021</option>
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-lg pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dificuldade</label>
                      <div className="relative">
                        <select
                          value={filtros.dificuldade}
                          onChange={(e) => setFiltros({ ...filtros, dificuldade: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#101922] border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white text-sm appearance-none cursor-pointer focus:border-primary focus:outline-none"
                        >
                          <option>Todas</option>
                          <option>Fácil</option>
                          <option>Médio</option>
                          <option>Difícil</option>
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-lg pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Escolaridade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Escolaridade</label>
                    <div className="relative">
                      <select
                        value={filtros.escolaridade}
                        onChange={(e) => setFiltros({ ...filtros, escolaridade: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#101922] border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white text-sm appearance-none cursor-pointer focus:border-primary focus:outline-none"
                      >
                        <option>Todas</option>
                        <option>Ensino Médio</option>
                        <option>Ensino Superior</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-lg pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Modalidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Modalidade</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={filtros.modalidades.includes('multipla')}
                            onChange={() => toggleModalidade('multipla')}
                            className="peer sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            filtros.modalidades.includes('multipla')
                              ? 'bg-primary border-primary'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {filtros.modalidades.includes('multipla') && (
                              <span className="material-symbols-outlined text-white text-sm">check</span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Múltipla Escolha</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={filtros.modalidades.includes('certo_errado')}
                            onChange={() => toggleModalidade('certo_errado')}
                            className="peer sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            filtros.modalidades.includes('certo_errado')
                              ? 'bg-primary border-primary'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {filtros.modalidades.includes('certo_errado') && (
                              <span className="material-symbols-outlined text-white text-sm">check</span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Certo / Errado</span>
                      </label>
                    </div>
                  </div>

                  {/* Apply Filters Button */}
                  <button className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all mt-2">
                    Aplicar Filtros
                  </button>
                </div>
              </div>

              {/* Ranking Card */}
              <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-500 text-xl">emoji_events</span>
                    <h3 className="font-bold text-gray-900 dark:text-white">Ranking Semanal</h3>
                  </div>
                  <a href="#" className="text-sm text-primary hover:underline font-medium">Ver todos</a>
                </div>

                <div className="space-y-3">
                  {rankingUsuarios.map((usuario) => (
                    <div key={usuario.posicao} className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-5 ${
                        usuario.posicao === 1 ? 'text-yellow-500' :
                        usuario.posicao === 2 ? 'text-gray-400' :
                        usuario.posicao === 3 ? 'text-amber-600' : 'text-gray-400'
                      }`}>
                        {usuario.posicao}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {usuario.nome.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{usuario.nome}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{usuario.xp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
