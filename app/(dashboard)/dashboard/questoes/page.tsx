'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'

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

  // Estado de respostas do usuário
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<{ [key: string]: string }>({})
  const [questoesRespondidas, setQuestoesRespondidas] = useState<{ [key: string]: boolean }>({})
  const [mostrarComentario, setMostrarComentario] = useState<{ [key: string]: boolean }>({})

  // Estados de UI
  const [isMobile, setIsMobile] = useState(false)
  const [questaoAtualMobile, setQuestaoAtualMobile] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  // Estados dos dropdowns
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null)

  // Toggle dropdown
  const toggleDropdown = (nome: string) => {
    setDropdownAberto(dropdownAberto === nome ? null : nome)
  }

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

  // Carregar subassuntos quando assuntos mudam
  useEffect(() => {
    if (assuntoIdsSelecionados.length > 0) {
      carregarSubassuntos()
    } else {
      setSubassuntosDisponiveis([])
      setSubassuntosSelecionados([])
    }
  }, [assuntoIdsSelecionados])

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

  const carregarSubassuntos = async () => {
    try {
      const res = await fetch(`/api/questoes/filtros?tipo=subassuntos&assunto_ids=${assuntoIdsSelecionados.join(',')}`)
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

  // Selecionar resposta
  const selecionarResposta = (questaoId: string, letra: string) => {
    if (!questoesRespondidas[questaoId]) {
      setRespostasSelecionadas(prev => ({ ...prev, [questaoId]: letra }))
    }
  }

  // Responder questão
  const responderQuestao = (questao: Questao) => {
    setQuestoesRespondidas(prev => ({ ...prev, [questao.id]: true }))
  }

  // Toggle comentário
  const toggleComentario = (questaoId: string) => {
    setMostrarComentario(prev => ({ ...prev, [questaoId]: !prev[questaoId] }))
  }

  // Obter cor da dificuldade
  const getDificuldadeColor = (dificuldade: string) => {
    switch (dificuldade) {
      case 'facil':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
      case 'media':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'dificil':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  // Obter nome da dificuldade
  const getDificuldadeNome = (dificuldade: string) => {
    switch (dificuldade) {
      case 'facil': return 'Fácil'
      case 'media': return 'Médio'
      case 'dificil': return 'Difícil'
      default: return dificuldade
    }
  }

  // Obter nome da banca formatado
  const getBancaNome = (banca: string | null) => {
    if (!banca) return ''
    return banca.toUpperCase()
  }

  // Renderizar questão
  const renderQuestao = (questao: Questao) => {
    const respondida = questoesRespondidas[questao.id]
    const respostaSelecionada = respostasSelecionadas[questao.id]
    const isCertoErrado = questao.modalidade === 'certo_errado'

    // Preparar opções
    const opcoes = isCertoErrado
      ? [
          { letra: 'C', texto: 'Certo' },
          { letra: 'E', texto: 'Errado' }
        ]
      : [
          questao.alternativa_a && { letra: 'A', texto: questao.alternativa_a },
          questao.alternativa_b && { letra: 'B', texto: questao.alternativa_b },
          questao.alternativa_c && { letra: 'C', texto: questao.alternativa_c },
          questao.alternativa_d && { letra: 'D', texto: questao.alternativa_d },
          questao.alternativa_e && { letra: 'E', texto: questao.alternativa_e }
        ].filter(Boolean) as { letra: string; texto: string }[]

    // Converter gabarito para certo/errado se necessário
    const gabaritoConvertido = isCertoErrado
      ? (questao.gabarito === 'CERTO' ? 'C' : 'E')
      : questao.gabarito

    return (
      <div
        key={questao.id}
        className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100 dark:border-[#283039]">
          <span className="text-primary font-bold text-sm">{questao.id_original?.slice(-6).toUpperCase() || questao.id.slice(-6).toUpperCase()}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{questao.disciplina}</span>
          {questao.assunto && (
            <>
              <span className="text-gray-400">&gt;</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">{questao.assunto}</span>
            </>
          )}
          <div className="flex-1"></div>
          {questao.banca && <span className="text-gray-500 dark:text-gray-400 text-sm">{getBancaNome(questao.banca)}</span>}
          {questao.ano && (
            <>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">{questao.ano}</span>
            </>
          )}
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDificuldadeColor(questao.dificuldade)}`}>
            {getDificuldadeNome(questao.dificuldade)}
          </span>
        </div>

        {/* Conteúdo */}
        <div className="p-4 lg:p-6">
          {isCertoErrado && (
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">
              JULGUE O ITEM A SEGUIR
            </p>
          )}
          <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed mb-6 whitespace-pre-wrap">
            {questao.enunciado}
          </p>

          {/* Opções */}
          <div className="space-y-3">
            {opcoes.map((opcao) => {
              const isSelected = respostaSelecionada === opcao.letra
              const isCorrect = gabaritoConvertido === opcao.letra
              const showResult = respondida

              let bgClass = 'border-gray-200 dark:border-[#283039] hover:border-gray-300 dark:hover:border-gray-600'
              if (showResult) {
                if (isCorrect) {
                  bgClass = 'border-green-500 bg-green-50 dark:bg-green-900/20'
                } else if (isSelected && !isCorrect) {
                  bgClass = 'border-red-500 bg-red-50 dark:bg-red-900/20'
                }
              } else if (isSelected) {
                bgClass = 'border-primary bg-primary/5'
              }

              return (
                <label
                  key={opcao.letra}
                  onClick={() => !respondida && selecionarResposta(questao.id, opcao.letra)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${bgClass}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-all ${
                      showResult && isCorrect
                        ? 'bg-green-500 text-white'
                        : showResult && isSelected && !isCorrect
                        ? 'bg-red-500 text-white'
                        : isSelected
                        ? 'bg-primary text-white'
                        : 'border-2 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {showResult && isCorrect ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : showResult && isSelected && !isCorrect ? (
                      <span className="material-symbols-outlined text-sm">close</span>
                    ) : (
                      opcao.letra
                    )}
                  </div>
                  <span className={`text-sm pt-1 ${
                    isSelected || (showResult && isCorrect)
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {opcao.texto}
                  </span>
                </label>
              )
            })}
          </div>

          {/* Comentário */}
          {respondida && questao.comentario && mostrarComentario[questao.id] && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">lightbulb</span>
                Comentário
              </h4>
              <div className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-wrap leading-relaxed">
                {questao.comentario}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 lg:px-6 py-4 border-t border-gray-100 dark:border-[#283039] bg-gray-50 dark:bg-[#161f28]">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {respondida && questao.comentario && (
              <button
                onClick={() => toggleComentario(questao.id)}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  {mostrarComentario[questao.id] ? 'visibility_off' : 'visibility'}
                </span>
                {mostrarComentario[questao.id] ? 'Ocultar Comentário' : 'Ver Comentário'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!respondida ? (
              <button
                onClick={() => responderQuestao(questao)}
                disabled={!respostaSelecionada}
                className={`px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-all ${
                  respostaSelecionada
                    ? 'bg-primary hover:bg-blue-600 text-white shadow-primary/20'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Responder
              </button>
            ) : (
              <span className={`px-4 py-2 rounded-lg text-sm font-bold ${
                respostaSelecionada === gabaritoConvertido
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {respostaSelecionada === gabaritoConvertido ? 'Acertou!' : 'Errou!'}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Componente Dropdown
  const DropdownFiltro = ({
    nome,
    titulo,
    children,
    disabled = false,
    badge = 0
  }: {
    nome: string
    titulo: string
    children: React.ReactNode
    disabled?: boolean
    badge?: number
  }) => (
    <div className="border-b border-gray-200 dark:border-[#283039]">
      <button
        onClick={() => !disabled && toggleDropdown(nome)}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-4 transition-all ${
          disabled
            ? 'bg-gray-100 dark:bg-[#1a2129] cursor-not-allowed opacity-50'
            : 'hover:bg-gray-50 dark:hover:bg-[#1a2129]'
        } ${dropdownAberto === nome ? 'bg-primary text-white' : ''}`}
      >
        <span className={`font-medium ${dropdownAberto === nome ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
          {titulo}
        </span>
        <div className="flex items-center gap-2">
          {badge > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              dropdownAberto === nome
                ? 'bg-white/20 text-white'
                : 'bg-primary/10 text-primary'
            }`}>
              {badge}
            </span>
          )}
          <span className={`material-symbols-outlined transition-transform ${
            dropdownAberto === nome ? 'rotate-180 text-white' : 'text-gray-400'
          }`}>
            expand_more
          </span>
        </div>
      </button>
      {dropdownAberto === nome && (
        <div className="p-4 bg-white dark:bg-[#1C252E] max-h-64 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  )

  // Renderizar filtros
  const renderFiltros = () => (
    <div className="border border-gray-200 dark:border-[#283039] rounded-xl overflow-hidden">
      {/* Disciplina */}
      <DropdownFiltro
        nome="disciplina"
        titulo="Disciplina"
        badge={disciplinasSelecionadas.length}
      >
        <div className="space-y-1">
          {disciplinasDisponiveis.map((disc) => (
            <label
              key={disc.id}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
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

      {/* Assunto */}
      <DropdownFiltro
        nome="assunto"
        titulo="Assunto"
        disabled={disciplinasSelecionadas.length === 0}
        badge={assuntosSelecionados.length}
      >
        <div className="space-y-4">
          {assuntosDisponiveis.map((grupo) => (
            <div key={grupo.disciplina_id}>
              <p className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">visibility</span>
                {grupo.disciplina}
              </p>
              <div className="space-y-1 ml-2">
                {grupo.assuntos.map((assunto) => (
                  <label
                    key={assunto.id}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={assuntosSelecionados.includes(assunto.nome)}
                      onChange={() => toggleAssunto(assunto)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{assunto.nome}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-[#283039] px-2 py-0.5 rounded">
                      {assunto.qtd_questoes}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DropdownFiltro>

      {/* Subassunto - só aparece se tiver assunto selecionado */}
      {assuntosSelecionados.length > 0 && subassuntosDisponiveis.length > 0 && (
        <DropdownFiltro
          nome="subassunto"
          titulo="Subassunto"
          badge={subassuntosSelecionados.length}
        >
          <div className="space-y-4">
            {subassuntosDisponiveis.map((grupo) => (
              <div key={grupo.assunto_id}>
                <p className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  {grupo.assunto}
                </p>
                <div className="space-y-1 ml-2">
                  {grupo.subassuntos.map((sub) => (
                    <label
                      key={sub.id}
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={subassuntosSelecionados.includes(sub.nome)}
                        onChange={() => toggleSubassunto(sub.nome)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{sub.nome}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-[#283039] px-2 py-0.5 rounded">
                        {sub.qtd_questoes}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DropdownFiltro>
      )}

      {/* Banca */}
      <DropdownFiltro nome="banca" titulo="Banca" badge={bancasSelecionadas.length}>
        <div className="space-y-1">
          {bancasDisponiveis.map((banca) => (
            <label
              key={banca.nome}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
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
      <DropdownFiltro nome="ano" titulo="Ano" badge={anosSelecionados.length}>
        <div className="space-y-1">
          {anosDisponiveis.map((ano) => (
            <label
              key={ano.ano}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
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
      <DropdownFiltro nome="dificuldade" titulo="Dificuldade" badge={dificuldadesSelecionadas.length}>
        <div className="space-y-1">
          {['facil', 'media', 'dificil'].map((dif) => (
            <label
              key={dif}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
            >
              <input
                type="checkbox"
                checked={dificuldadesSelecionadas.includes(dif)}
                onChange={() => toggleDificuldade(dif)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{getDificuldadeNome(dif)}</span>
            </label>
          ))}
        </div>
      </DropdownFiltro>

      {/* Modalidade */}
      <DropdownFiltro nome="modalidade" titulo="Modalidade" badge={modalidadesSelecionadas.length}>
        <div className="space-y-1">
          <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors">
            <input
              type="checkbox"
              checked={modalidadesSelecionadas.includes('multipla_escolha_5')}
              onChange={() => toggleModalidade('multipla_escolha_5')}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Múltipla Escolha</span>
          </label>
          <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors">
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

      {/* Botões */}
      <div className="p-4 space-y-2 bg-gray-50 dark:bg-[#161f28]">
        <button
          onClick={() => buscarQuestoes(1)}
          className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all"
        >
          Buscar Questões
        </button>
        <button
          onClick={limparFiltros}
          className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium py-2 text-sm transition-all"
        >
          Limpar Filtros
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
        <div className="max-w-[1400px] mx-auto">

          {/* Mobile: Botão de filtros */}
          {isMobile && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full mb-4 bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] rounded-xl p-4 flex items-center justify-between"
            >
              <span className="font-medium text-gray-700 dark:text-gray-300">Filtros</span>
              <span className="material-symbols-outlined text-gray-400">
                {showFilters ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          )}

          {/* Mobile: Filtros expandidos */}
          {isMobile && showFilters && (
            <div className="mb-4 bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] rounded-xl p-4">
              {renderFiltros()}
            </div>
          )}

          {/* Layout principal */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Lista de questões */}
            <div className="flex-1 space-y-4">
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
                    Use os filtros ao lado para buscar questões
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
                  {questoes[questaoAtualMobile] && renderQuestao(questoes[questaoAtualMobile])}
                  <div className="h-20"></div> {/* Espaço para a navegação fixa */}
                </>
              ) : (
                // Desktop: lista de questões
                <>
                  {questoes.map(renderQuestao)}
                  {renderPaginacaoDesktop()}
                </>
              )}
            </div>

            {/* Sidebar - Filtros (Desktop) */}
            {!isMobile && (
              <aside className="w-full lg:w-80 space-y-6">
                <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filtros</h3>
                    {buscaInicial && (
                      <span className="text-sm text-primary font-medium">
                        {paginacao.total.toLocaleString()} questões
                      </span>
                    )}
                  </div>
                  {renderFiltros()}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Navegação fixa */}
      {isMobile && buscaInicial && questoes.length > 0 && renderNavegacaoMobile()}
    </div>
  )
}
