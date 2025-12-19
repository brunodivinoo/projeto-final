'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { QuestaoCard } from '@/components/questoes/QuestaoCard'

// Tipos
interface Questao {
  id: string
  id_original: string
  tipo_prova: string
  modalidade: string
  disciplina: string
  assunto: string | null
  subassunto: string | null
  banca: string | null
  ano: number | null
  dificuldade: string
  enunciado: string
  gabarito: string
  comentario: string | null
  alternativa_a: string | null
  alternativa_b: string | null
  alternativa_c: string | null
  alternativa_d: string | null
  alternativa_e: string | null
}

interface Paginacao {
  pagina: number
  porPagina: number
  total: number
  totalPaginas: number
  temAnterior: boolean
  temProxima: boolean
}

interface Disciplina {
  id: string
  nome: string
  qtd_questoes: number
}

interface AssuntoGrupo {
  disciplina: string
  disciplina_id: string
  assuntos: { id: string; nome: string; qtd_questoes: number }[]
}

interface SubassuntoGrupo {
  assunto: string
  assunto_id: string
  disciplina: string
  subassuntos: { id: string; nome: string; qtd_questoes: number }[]
}

interface Banca {
  nome: string
  qtd_questoes: number
}

interface Ano {
  ano: number
  qtd_questoes: number
}

export default function QuestoesPage() {
  // Estados de dados
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [paginacao, setPaginacao] = useState<Paginacao>({
    pagina: 1,
    porPagina: 5,
    total: 0,
    totalPaginas: 0,
    temAnterior: false,
    temProxima: false
  })
  const [loading, setLoading] = useState(false)
  const [buscaInicial, setBuscaInicial] = useState(false)

  // Estados de filtros disponíveis
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<Disciplina[]>([])
  const [assuntosDisponiveis, setAssuntosDisponiveis] = useState<AssuntoGrupo[]>([])
  const [subassuntosDisponiveis, setSubassuntosDisponiveis] = useState<SubassuntoGrupo[]>([])
  const [bancasDisponiveis, setBancasDisponiveis] = useState<Banca[]>([])
  const [anosDisponiveis, setAnosDisponiveis] = useState<Ano[]>([])

  // Estados de filtros selecionados
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<string[]>([])
  const [disciplinaIdsSelecionadas, setDisciplinaIdsSelecionadas] = useState<string[]>([])
  const [assuntosSelecionados, setAssuntosSelecionados] = useState<string[]>([])
  const [assuntoIdsSelecionados, setAssuntoIdsSelecionados] = useState<string[]>([])
  const [subassuntosSelecionados, setSubassuntosSelecionados] = useState<string[]>([])
  const [bancasSelecionadas, setBancasSelecionadas] = useState<string[]>([])
  const [anosSelecionados, setAnosSelecionados] = useState<number[]>([])
  const [dificuldadesSelecionadas, setDificuldadesSelecionadas] = useState<string[]>([])
  const [modalidadesSelecionadas, setModalidadesSelecionadas] = useState<string[]>([])

  // Estados de UI
  const [isMobile, setIsMobile] = useState(false)
  const [questaoAtualMobile, setQuestaoAtualMobile] = useState(0)
  const [filtrosExpandidosMobile, setFiltrosExpandidosMobile] = useState(true)

  // Estados dos dropdowns
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null)

  // Estado de pesquisa nos dropdowns
  const [pesquisaDisciplina, setPesquisaDisciplina] = useState('')
  const [pesquisaAssunto, setPesquisaAssunto] = useState('')
  const [pesquisaBanca, setPesquisaBanca] = useState('')

  // Toggle dropdown
  const toggleDropdown = (nome: string) => {
    setDropdownAberto(dropdownAberto === nome ? null : nome)
  }

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setDropdownAberto(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Carregar disciplinas ao montar
  useEffect(() => {
    carregarDisciplinas()
    carregarBancas()
    carregarAnos()
  }, [])

  // Carregar assuntos quando disciplinas mudam
  useEffect(() => {
    if (disciplinaIdsSelecionadas.length > 0) {
      carregarAssuntos()
    } else {
      setAssuntosDisponiveis([])
      setAssuntosSelecionados([])
      setAssuntoIdsSelecionados([])
    }
  }, [disciplinaIdsSelecionadas])

  // Carregar subassuntos quando assuntos disponíveis mudam (para mostrar expandidos)
  useEffect(() => {
    if (assuntosDisponiveis.length > 0) {
      // Pegar todos os IDs de assuntos disponíveis para carregar seus subassuntos
      const todosAssuntoIds = assuntosDisponiveis.flatMap(g => g.assuntos.map(a => a.id))
      carregarSubassuntosPorIds(todosAssuntoIds)
    } else {
      setSubassuntosDisponiveis([])
      setSubassuntosSelecionados([])
    }
  }, [assuntosDisponiveis])

  // Funções de carregamento de filtros
  const carregarDisciplinas = async () => {
    try {
      const res = await fetch('/api/questoes/filtros?tipo=disciplinas')
      const data = await res.json()
      setDisciplinasDisponiveis(data.disciplinas || [])
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error)
    }
  }

  const carregarAssuntos = async () => {
    try {
      const res = await fetch(`/api/questoes/filtros?tipo=assuntos&disciplina_ids=${disciplinaIdsSelecionadas.join(',')}`)
      const data = await res.json()
      setAssuntosDisponiveis(data.assuntos || [])
    } catch (error) {
      console.error('Erro ao carregar assuntos:', error)
    }
  }

  const carregarSubassuntosPorIds = async (assuntoIds: string[]) => {
    if (assuntoIds.length === 0) {
      setSubassuntosDisponiveis([])
      return
    }
    try {
      const res = await fetch(`/api/questoes/filtros?tipo=subassuntos&assunto_ids=${assuntoIds.join(',')}`)
      const data = await res.json()
      setSubassuntosDisponiveis(data.subassuntos || [])
    } catch (error) {
      console.error('Erro ao carregar subassuntos:', error)
    }
  }

  const carregarBancas = async () => {
    try {
      const res = await fetch('/api/questoes/filtros?tipo=bancas')
      const data = await res.json()
      setBancasDisponiveis(data.bancas || [])
    } catch (error) {
      console.error('Erro ao carregar bancas:', error)
    }
  }

  const carregarAnos = async () => {
    try {
      const res = await fetch('/api/questoes/filtros?tipo=anos')
      const data = await res.json()
      setAnosDisponiveis(data.anos || [])
    } catch (error) {
      console.error('Erro ao carregar anos:', error)
    }
  }

  // Buscar questões
  const buscarQuestoes = useCallback(async (pagina = 1) => {
    setLoading(true)
    setBuscaInicial(true)

    try {
      const params = new URLSearchParams()

      if (disciplinasSelecionadas.length > 0) {
        params.append('disciplinas', disciplinasSelecionadas.join(','))
      }
      if (assuntosSelecionados.length > 0) {
        params.append('assuntos', assuntosSelecionados.join(','))
      }
      if (subassuntosSelecionados.length > 0) {
        params.append('subassuntos', subassuntosSelecionados.join(','))
      }
      if (bancasSelecionadas.length > 0) {
        params.append('bancas', bancasSelecionadas.join(','))
      }
      if (anosSelecionados.length > 0) {
        params.append('anos', anosSelecionados.join(','))
      }
      if (dificuldadesSelecionadas.length > 0) {
        params.append('dificuldades', dificuldadesSelecionadas.join(','))
      }
      if (modalidadesSelecionadas.length > 0) {
        params.append('modalidades', modalidadesSelecionadas.join(','))
      }

      params.append('pagina', pagina.toString())
      params.append('por_pagina', isMobile ? '1' : paginacao.porPagina.toString())

      const res = await fetch(`/api/questoes?${params.toString()}`)
      const data = await res.json()

      setQuestoes(data.questoes || [])
      setPaginacao(prev => ({ ...prev, ...data.paginacao }))
      setQuestaoAtualMobile(0)

      // Recolher filtros no mobile após buscar
      if (isMobile) {
        setFiltrosExpandidosMobile(false)
        setDropdownAberto(null)
      }
    } catch (error) {
      console.error('Erro ao buscar questões:', error)
    } finally {
      setLoading(false)
    }
  }, [disciplinasSelecionadas, assuntosSelecionados, subassuntosSelecionados, bancasSelecionadas, anosSelecionados, dificuldadesSelecionadas, modalidadesSelecionadas, isMobile, paginacao.porPagina])

  // Toggle disciplina
  const toggleDisciplina = (disciplina: Disciplina) => {
    if (disciplinasSelecionadas.includes(disciplina.nome)) {
      setDisciplinasSelecionadas(prev => prev.filter(d => d !== disciplina.nome))
      setDisciplinaIdsSelecionadas(prev => prev.filter(id => id !== disciplina.id))
    } else {
      setDisciplinasSelecionadas(prev => [...prev, disciplina.nome])
      setDisciplinaIdsSelecionadas(prev => [...prev, disciplina.id])
    }
  }

  // Toggle assunto
  const toggleAssunto = (assunto: { id: string; nome: string }) => {
    if (assuntosSelecionados.includes(assunto.nome)) {
      setAssuntosSelecionados(prev => prev.filter(a => a !== assunto.nome))
      setAssuntoIdsSelecionados(prev => prev.filter(id => id !== assunto.id))
    } else {
      setAssuntosSelecionados(prev => [...prev, assunto.nome])
      setAssuntoIdsSelecionados(prev => [...prev, assunto.id])
    }
  }

  // Toggle subassunto
  const toggleSubassunto = (nome: string) => {
    if (subassuntosSelecionados.includes(nome)) {
      setSubassuntosSelecionados(prev => prev.filter(s => s !== nome))
    } else {
      setSubassuntosSelecionados(prev => [...prev, nome])
    }
  }

  // Toggle banca
  const toggleBanca = (nome: string) => {
    if (bancasSelecionadas.includes(nome)) {
      setBancasSelecionadas(prev => prev.filter(b => b !== nome))
    } else {
      setBancasSelecionadas(prev => [...prev, nome])
    }
  }

  // Toggle ano
  const toggleAno = (ano: number) => {
    if (anosSelecionados.includes(ano)) {
      setAnosSelecionados(prev => prev.filter(a => a !== ano))
    } else {
      setAnosSelecionados(prev => [...prev, ano])
    }
  }

  // Toggle dificuldade
  const toggleDificuldade = (dif: string) => {
    if (dificuldadesSelecionadas.includes(dif)) {
      setDificuldadesSelecionadas(prev => prev.filter(d => d !== dif))
    } else {
      setDificuldadesSelecionadas(prev => [...prev, dif])
    }
  }

  // Toggle modalidade
  const toggleModalidade = (mod: string) => {
    if (modalidadesSelecionadas.includes(mod)) {
      setModalidadesSelecionadas(prev => prev.filter(m => m !== mod))
    } else {
      setModalidadesSelecionadas(prev => [...prev, mod])
    }
  }

  // Limpar filtros
  const limparFiltros = () => {
    setDisciplinasSelecionadas([])
    setDisciplinaIdsSelecionadas([])
    setAssuntosSelecionados([])
    setAssuntoIdsSelecionados([])
    setSubassuntosSelecionados([])
    setBancasSelecionadas([])
    setAnosSelecionados([])
    setDificuldadesSelecionadas([])
    setModalidadesSelecionadas([])
  }

  // Remover filtro individual
  const removerDisciplina = (nome: string) => {
    const disc = disciplinasDisponiveis.find(d => d.nome === nome)
    if (disc) {
      setDisciplinasSelecionadas(prev => prev.filter(d => d !== nome))
      setDisciplinaIdsSelecionadas(prev => prev.filter(id => id !== disc.id))
    }
  }

  const removerAssunto = (nome: string) => {
    const assuntoEncontrado = assuntosDisponiveis.flatMap(g => g.assuntos).find(a => a.nome === nome)
    if (assuntoEncontrado) {
      setAssuntosSelecionados(prev => prev.filter(a => a !== nome))
      setAssuntoIdsSelecionados(prev => prev.filter(id => id !== assuntoEncontrado.id))
    }
  }

  // Obter nome da dificuldade (usado nos filtros)
  const getDificuldadeNome = (dificuldade: string) => {
    switch (dificuldade) {
      case 'facil': return 'Fácil'
      case 'media': return 'Médio'
      case 'dificil': return 'Difícil'
      default: return dificuldade
    }
  }

  // Verificar se tem filtros aplicados
  const temFiltrosAplicados = () => {
    return disciplinasSelecionadas.length > 0 ||
           assuntosSelecionados.length > 0 ||
           subassuntosSelecionados.length > 0 ||
           bancasSelecionadas.length > 0 ||
           anosSelecionados.length > 0 ||
           dificuldadesSelecionadas.length > 0 ||
           modalidadesSelecionadas.length > 0
  }

  // Renderizar filtros aplicados (tags)
  const renderFiltrosAplicados = () => {
    if (!temFiltrosAplicados()) return null

    return (
      <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-4 mb-4">
        {/* Disciplinas */}
        {disciplinasSelecionadas.length > 0 && (
          <div className="flex flex-wrap items-start gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 py-1 min-w-[80px]">Disciplinas</span>
            <div className="flex flex-wrap gap-2">
              {disciplinasSelecionadas.map(nome => (
                <span
                  key={nome}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  {nome}
                  <button onClick={() => removerDisciplina(nome)} className="hover:text-blue-900 dark:hover:text-blue-100">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Assuntos */}
        {assuntosSelecionados.length > 0 && (
          <div className="flex flex-wrap items-start gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 py-1 min-w-[80px]">Assuntos</span>
            <div className="flex flex-wrap gap-2">
              {assuntosSelecionados.map(nome => (
                <span
                  key={nome}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                >
                  {nome}
                  <button onClick={() => removerAssunto(nome)} className="hover:text-purple-900 dark:hover:text-purple-100">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Subassuntos */}
        {subassuntosSelecionados.length > 0 && (
          <div className="flex flex-wrap items-start gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 py-1 min-w-[80px]">Subassuntos</span>
            <div className="flex flex-wrap gap-2">
              {subassuntosSelecionados.map(nome => (
                <span
                  key={nome}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                >
                  {nome}
                  <button onClick={() => setSubassuntosSelecionados(prev => prev.filter(s => s !== nome))} className="hover:text-indigo-900 dark:hover:text-indigo-100">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bancas */}
        {bancasSelecionadas.length > 0 && (
          <div className="flex flex-wrap items-start gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 py-1 min-w-[80px]">Bancas</span>
            <div className="flex flex-wrap gap-2">
              {bancasSelecionadas.map(nome => (
                <span
                  key={nome}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm"
                >
                  {nome.toUpperCase()}
                  <button onClick={() => setBancasSelecionadas(prev => prev.filter(b => b !== nome))} className="hover:text-orange-900 dark:hover:text-orange-100">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Anos */}
        {anosSelecionados.length > 0 && (
          <div className="flex flex-wrap items-start gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 py-1 min-w-[80px]">Anos</span>
            <div className="flex flex-wrap gap-2">
              {anosSelecionados.map(ano => (
                <span
                  key={ano}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
                >
                  {ano}
                  <button onClick={() => setAnosSelecionados(prev => prev.filter(a => a !== ano))} className="hover:text-green-900 dark:hover:text-green-100">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botão limpar tudo */}
        <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-[#283039] mt-2">
          <button
            onClick={limparFiltros}
            className="text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Limpar todos os filtros
          </button>
        </div>
      </div>
    )
  }

  // Componente Dropdown de Filtro
  const DropdownFiltro = ({
    nome,
    titulo,
    children,
    disabled = false
  }: {
    nome: string
    titulo: string
    children: React.ReactNode
    disabled?: boolean
  }) => (
    <div className="dropdown-container relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) toggleDropdown(nome)
        }}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
          disabled
            ? 'bg-gray-100 dark:bg-[#1a2129] border-gray-200 dark:border-[#283039] cursor-not-allowed opacity-50'
            : dropdownAberto === nome
            ? 'bg-primary text-white border-primary'
            : 'bg-white dark:bg-[#1C252E] border-gray-200 dark:border-[#283039] hover:border-primary'
        }`}
      >
        <span className={`font-medium text-sm ${dropdownAberto === nome ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
          {titulo}
        </span>
        <span className={`material-symbols-outlined transition-transform ${
          dropdownAberto === nome ? 'rotate-180 text-white' : 'text-gray-400'
        }`}>
          expand_more
        </span>
      </button>
      {dropdownAberto === nome && (
        <div className="absolute z-50 mt-2 w-full min-w-[300px] bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] shadow-xl max-h-[400px] overflow-hidden">
          {children}
        </div>
      )}
    </div>
  )

  // Renderizar filtros no topo
  const renderFiltros = () => (
    <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-4 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {/* Disciplina */}
        <DropdownFiltro nome="disciplina" titulo="Disciplina">
          <div className="p-3 border-b border-gray-200 dark:border-[#283039]">
            <input
              type="text"
              placeholder="Pesquisar..."
              value={pesquisaDisciplina}
              onChange={(e) => setPesquisaDisciplina(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#283039] rounded-lg bg-gray-50 dark:bg-[#161f28] text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto max-h-[300px] p-2">
            {disciplinasDisponiveis
              .filter(d => d.nome.toLowerCase().includes(pesquisaDisciplina.toLowerCase()))
              .map((disc) => (
                <label
                  key={disc.id}
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={disciplinasSelecionadas.includes(disc.nome)}
                    onChange={() => toggleDisciplina(disc)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{disc.nome}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-[#283039] px-2 py-0.5 rounded">
                    {disc.qtd_questoes}
                  </span>
                </label>
              ))}
          </div>
        </DropdownFiltro>

        {/* Assunto (com subassuntos hierárquicos) */}
        <DropdownFiltro
          nome="assunto"
          titulo="Assunto"
          disabled={disciplinasSelecionadas.length === 0}
        >
          <div className="p-3 border-b border-gray-200 dark:border-[#283039]">
            <input
              type="text"
              placeholder="Pesquisar..."
              value={pesquisaAssunto}
              onChange={(e) => setPesquisaAssunto(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#283039] rounded-lg bg-gray-50 dark:bg-[#161f28] text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto max-h-[300px] p-2">
            {assuntosDisponiveis.map((grupo) => (
              <div key={grupo.disciplina_id} className="mb-4">
                {/* Nome da Disciplina como header se tiver múltiplas */}
                {disciplinasSelecionadas.length > 1 && (
                  <p className="text-xs font-bold text-primary px-2 py-1 bg-primary/5 rounded mb-2">
                    {grupo.disciplina}
                  </p>
                )}
                {grupo.assuntos
                  .filter(a => a.nome.toLowerCase().includes(pesquisaAssunto.toLowerCase()))
                  .map((assunto) => {
                    // Verificar se tem subassuntos para esse assunto
                    const subassuntosDoAssunto = subassuntosDisponiveis.find(s => s.assunto_id === assunto.id)

                    return (
                      <div key={assunto.id}>
                        {/* Assunto principal */}
                        <label
                          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={assuntosSelecionados.includes(assunto.nome)}
                            onChange={() => toggleAssunto(assunto)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 font-medium">{assunto.nome}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-[#283039] px-2 py-0.5 rounded">
                            {assunto.qtd_questoes}
                          </span>
                        </label>

                        {/* Subassuntos sempre visíveis (expandidos) */}
                        {subassuntosDoAssunto && subassuntosDoAssunto.subassuntos.length > 0 && (
                          <div className="ml-6 border-l-2 border-gray-200 dark:border-[#283039] pl-3 mb-2">
                            {subassuntosDoAssunto.subassuntos
                              .filter(s => s.nome.toLowerCase().includes(pesquisaAssunto.toLowerCase()))
                              .map((sub) => (
                                <label
                                  key={sub.id}
                                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={subassuntosSelecionados.includes(sub.nome)}
                                    onChange={() => toggleSubassunto(sub.nome)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{sub.nome}</span>
                                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-[#283039] px-2 py-0.5 rounded">
                                    {sub.qtd_questoes}
                                  </span>
                                </label>
                              ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            ))}
          </div>
        </DropdownFiltro>

        {/* Banca */}
        <DropdownFiltro nome="banca" titulo="Banca">
          <div className="p-3 border-b border-gray-200 dark:border-[#283039]">
            <input
              type="text"
              placeholder="Pesquisar..."
              value={pesquisaBanca}
              onChange={(e) => setPesquisaBanca(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#283039] rounded-lg bg-gray-50 dark:bg-[#161f28] text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto max-h-[300px] p-2">
            {bancasDisponiveis
              .filter(b => b.nome.toLowerCase().includes(pesquisaBanca.toLowerCase()))
              .map((banca) => (
                <label
                  key={banca.nome}
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={bancasSelecionadas.includes(banca.nome)}
                    onChange={() => toggleBanca(banca.nome)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{banca.nome.toUpperCase()}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-[#283039] px-2 py-0.5 rounded">
                    {banca.qtd_questoes}
                  </span>
                </label>
              ))}
          </div>
        </DropdownFiltro>

        {/* Ano */}
        <DropdownFiltro nome="ano" titulo="Ano">
          <div className="overflow-y-auto max-h-[300px] p-2">
            {anosDisponiveis.map((ano) => (
              <label
                key={ano.ano}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={anosSelecionados.includes(ano.ano)}
                  onChange={() => toggleAno(ano.ano)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{ano.ano}</span>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-[#283039] px-2 py-0.5 rounded">
                  {ano.qtd_questoes}
                </span>
              </label>
            ))}
          </div>
        </DropdownFiltro>

        {/* Dificuldade */}
        <DropdownFiltro nome="dificuldade" titulo="Dificuldade">
          <div className="p-2">
            {['facil', 'media', 'dificil'].map((dif) => (
              <label
                key={dif}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={dificuldadesSelecionadas.includes(dif)}
                  onChange={() => toggleDificuldade(dif)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{getDificuldadeNome(dif)}</span>
              </label>
            ))}
          </div>
        </DropdownFiltro>

        {/* Modalidade */}
        <DropdownFiltro nome="modalidade" titulo="Modalidade">
          <div className="p-2">
            <label
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={modalidadesSelecionadas.includes('multipla_escolha_5')}
                onChange={() => toggleModalidade('multipla_escolha_5')}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Múltipla Escolha</span>
            </label>
            <label
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={modalidadesSelecionadas.includes('certo_errado')}
                onChange={() => toggleModalidade('certo_errado')}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Certo / Errado</span>
            </label>
          </div>
        </DropdownFiltro>
      </div>

      {/* Botão Buscar */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-[#283039]">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {buscaInicial && `${paginacao.total.toLocaleString()} questões encontradas`}
        </span>
        <button
          onClick={() => buscarQuestoes(1)}
          className="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
        >
          Buscar Questões
        </button>
      </div>
    </div>
  )

  // Renderizar paginação desktop
  const renderPaginacaoDesktop = () => (
    <div className="flex items-center justify-between mt-6 bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {paginacao.total.toLocaleString()} questões encontradas
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Por página:</span>
          <select
            value={paginacao.porPagina}
            onChange={(e) => {
              setPaginacao(prev => ({ ...prev, porPagina: parseInt(e.target.value) }))
              buscarQuestoes(1)
            }}
            className="h-8 px-2 rounded border border-gray-200 dark:border-[#283039] bg-white dark:bg-[#101922] text-gray-700 dark:text-gray-300 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => buscarQuestoes(paginacao.pagina - 1)}
          disabled={!paginacao.temAnterior}
          className={`p-2 rounded-lg transition-all ${
            paginacao.temAnterior
              ? 'hover:bg-gray-100 dark:hover:bg-[#283039] text-gray-700 dark:text-gray-300'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        <span className="text-sm text-gray-700 dark:text-gray-300 px-4">
          Página {paginacao.pagina} de {paginacao.totalPaginas}
        </span>

        <button
          onClick={() => buscarQuestoes(paginacao.pagina + 1)}
          disabled={!paginacao.temProxima}
          className={`p-2 rounded-lg transition-all ${
            paginacao.temProxima
              ? 'hover:bg-gray-100 dark:hover:bg-[#283039] text-gray-700 dark:text-gray-300'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  )

  // Renderizar navegação mobile
  const renderNavegacaoMobile = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1C252E] border-t border-gray-200 dark:border-[#283039] p-4 z-50">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (questaoAtualMobile > 0) {
              setQuestaoAtualMobile(prev => prev - 1)
            } else if (paginacao.temAnterior) {
              buscarQuestoes(paginacao.pagina - 1)
            }
          }}
          disabled={questaoAtualMobile === 0 && !paginacao.temAnterior}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${
            questaoAtualMobile === 0 && !paginacao.temAnterior
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'bg-gray-100 dark:bg-[#283039] text-gray-700 dark:text-gray-300'
          }`}
        >
          <span className="material-symbols-outlined">chevron_left</span>
          Anterior
        </button>

        <span className="text-sm text-gray-600 dark:text-gray-400">
          {((paginacao.pagina - 1) * paginacao.porPagina) + questaoAtualMobile + 1} / {paginacao.total}
        </span>

        <button
          onClick={() => {
            if (questaoAtualMobile < questoes.length - 1) {
              setQuestaoAtualMobile(prev => prev + 1)
            } else if (paginacao.temProxima) {
              buscarQuestoes(paginacao.pagina + 1)
            }
          }}
          disabled={questaoAtualMobile === questoes.length - 1 && !paginacao.temProxima}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${
            questaoAtualMobile === questoes.length - 1 && !paginacao.temProxima
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'bg-primary text-white'
          }`}
        >
          Próxima
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
      <Header title="Questões" />

      <div className="p-4 lg:p-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Mobile: Botão para expandir/recolher filtros */}
          {isMobile && buscaInicial && (
            <button
              onClick={() => setFiltrosExpandidosMobile(!filtrosExpandidosMobile)}
              className="w-full mb-4 bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">filter_list</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">Filtros</span>
                {temFiltrosAplicados() && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Filtros aplicados
                  </span>
                )}
              </div>
              <span className="material-symbols-outlined text-gray-400">
                {filtrosExpandidosMobile ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          )}

          {/* Filtros no topo - sempre visível no desktop, expandível no mobile */}
          {(!isMobile || filtrosExpandidosMobile || !buscaInicial) && renderFiltros()}

          {/* Filtros aplicados (tags) */}
          {renderFiltrosAplicados()}

          {/* Lista de questões */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Buscando questões...</p>
              </div>
            ) : !buscaInicial ? (
              <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-8 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">search</span>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Selecione os filtros</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Use os filtros acima para buscar questões
                </p>
              </div>
            ) : questoes.length === 0 ? (
              <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-8 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">quiz</span>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Nenhuma questão encontrada</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Tente ajustar os filtros para encontrar questões
                </p>
              </div>
            ) : isMobile ? (
              // Mobile: uma questão por vez
              <>
                {questoes[questaoAtualMobile] && (
                  <QuestaoCard key={questoes[questaoAtualMobile].id} questao={questoes[questaoAtualMobile]} />
                )}
                <div className="h-20"></div> {/* Espaço para a navegação fixa */}
              </>
            ) : (
              // Desktop: lista de questões
              <>
                {questoes.map(questao => (
                  <QuestaoCard key={questao.id} questao={questao} />
                ))}
                {renderPaginacaoDesktop()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Navegação fixa */}
      {isMobile && buscaInicial && questoes.length > 0 && renderNavegacaoMobile()}
    </div>
  )
}
