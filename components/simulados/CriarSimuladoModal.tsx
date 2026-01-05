'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSimulados, FiltrosSimulado } from '@/hooks/useSimulados'
import { useCheckLimit } from '@/hooks/useCheckLimit'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (simuladoId: string) => void
}

// Tipos para a estrutura hierárquica
interface AssuntoHierarquico {
  nome: string
  questoes: number
}

interface DisciplinaHierarquica {
  nome: string
  questoes: number
  assuntos: AssuntoHierarquico[]
}

interface FiltrosHierarquicos {
  disciplinas: DisciplinaHierarquica[]
  assuntos: { nome: string; questoes: number; disciplina: string }[]
  bancas: { nome: string; questoes: number }[]
  anos: { ano: number; questoes: number }[]
  dificuldades: { nome: string; label: string; questoes: number }[]
  modalidades: { nome: string; label: string; questoes: number }[]
  total_questoes_disponiveis: number
}

export function CriarSimuladoModal({ isOpen, onClose, onSuccess }: Props) {
  const { criarSimulado, loading } = useSimulados()
  const { checkLimit } = useCheckLimit()

  // Estados do formulário
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [modalidade, setModalidade] = useState<'certo_errado' | 'multipla_escolha'>('multipla_escolha')
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState(10)
  const [tempoLimite, setTempoLimite] = useState<number | undefined>(undefined)
  const [usarTempo, setUsarTempo] = useState(false)
  const [dificuldadesSelecionadas, setDificuldadesSelecionadas] = useState<string[]>([])
  const [bancaSelecionada, setBancaSelecionada] = useState('')
  const [anoSelecionado, setAnoSelecionado] = useState<number | undefined>(undefined)
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<string[]>([])
  const [assuntosSelecionados, setAssuntosSelecionados] = useState<string[]>([])
  const [disciplinasExpandidas, setDisciplinasExpandidas] = useState<string[]>([])

  // Estados de filtros
  const [filtros, setFiltros] = useState<FiltrosHierarquicos | null>(null)
  const [loadingFiltros, setLoadingFiltros] = useState(false)
  const [loadingInicial, setLoadingInicial] = useState(true)

  // Estado de limite
  const [limiteInfo, setLimiteInfo] = useState<{ canUse: boolean; restante: number; limite: number } | null>(null)

  // Erro
  const [erro, setErro] = useState<string | null>(null)

  // Buscar filtros otimizado
  const carregarFiltros = useCallback(async (mod?: string) => {
    setLoadingFiltros(true)
    try {
      const params = new URLSearchParams()
      if (mod) params.append('modalidade', mod)
      if (disciplinasSelecionadas.length > 0) {
        params.append('disciplinas', disciplinasSelecionadas.join(','))
      }

      const response = await fetch(`/api/simulados/filtros?${params}`)
      const data = await response.json()

      if (response.ok) {
        setFiltros(data)
      }
    } catch (error) {
      console.error('Erro ao carregar filtros:', error)
    } finally {
      setLoadingFiltros(false)
      setLoadingInicial(false)
    }
  }, [disciplinasSelecionadas])

  // Carregar filtros quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setLoadingInicial(true)
      carregarFiltros(modalidade)
      checkLimit('simulados').then(info => {
        setLimiteInfo({
          canUse: info.canUse,
          restante: info.restante,
          limite: info.limite
        })
      })
    }
  }, [isOpen])

  // Recarregar filtros quando modalidade mudar
  useEffect(() => {
    if (isOpen && !loadingInicial) {
      carregarFiltros(modalidade)
    }
  }, [modalidade])

  // Calcular assuntos disponíveis baseado nas disciplinas selecionadas
  const assuntosDisponiveis = useMemo(() => {
    if (!filtros || disciplinasSelecionadas.length === 0) return []

    const assuntos: { nome: string; questoes: number; disciplina: string }[] = []

    disciplinasSelecionadas.forEach(discNome => {
      const disc = filtros.disciplinas.find(d => d.nome === discNome)
      if (disc) {
        disc.assuntos.forEach(assunto => {
          assuntos.push({
            nome: assunto.nome,
            questoes: assunto.questoes,
            disciplina: discNome
          })
        })
      }
    })

    return assuntos.sort((a, b) => b.questoes - a.questoes)
  }, [filtros, disciplinasSelecionadas])

  const toggleDificuldade = (dif: string) => {
    setDificuldadesSelecionadas(prev =>
      prev.includes(dif) ? prev.filter(d => d !== dif) : [...prev, dif]
    )
  }

  const toggleDisciplina = (disc: string) => {
    setDisciplinasSelecionadas(prev => {
      const newSelection = prev.includes(disc)
        ? prev.filter(d => d !== disc)
        : [...prev, disc]

      // Se deselecionar disciplina, remover assuntos dessa disciplina
      if (prev.includes(disc)) {
        setAssuntosSelecionados(current =>
          current.filter(a => {
            const assuntoData = assuntosDisponiveis.find(ad => ad.nome === a)
            return assuntoData?.disciplina !== disc
          })
        )
      }

      return newSelection
    })
  }

  const toggleDisciplinaExpandida = (disc: string) => {
    setDisciplinasExpandidas(prev =>
      prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]
    )
  }

  const toggleAssunto = (assunto: string) => {
    setAssuntosSelecionados(prev =>
      prev.includes(assunto) ? prev.filter(a => a !== assunto) : [...prev, assunto]
    )
  }

  const selecionarTodosAssuntosDaDisciplina = (disc: string) => {
    const discData = filtros?.disciplinas.find(d => d.nome === disc)
    if (!discData) return

    const assuntosDaDisciplina = discData.assuntos.map(a => a.nome)
    const todosJaSelecionados = assuntosDaDisciplina.every(a => assuntosSelecionados.includes(a))

    if (todosJaSelecionados) {
      // Deselecionar todos
      setAssuntosSelecionados(prev => prev.filter(a => !assuntosDaDisciplina.includes(a)))
    } else {
      // Selecionar todos
      setAssuntosSelecionados(prev => [...new Set([...prev, ...assuntosDaDisciplina])])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!titulo.trim()) {
      setErro('O título é obrigatório')
      return
    }

    if (quantidadeQuestoes < 1 || quantidadeQuestoes > 100) {
      setErro('A quantidade de questões deve ser entre 1 e 100')
      return
    }

    if (!limiteInfo?.canUse) {
      setErro('Você atingiu o limite mensal de simulados')
      return
    }

    const filtrosSimulado: FiltrosSimulado = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      fonte: 'banco',
      modalidade,
      quantidade_questoes: quantidadeQuestoes,
      tempo_limite_minutos: usarTempo ? tempoLimite : undefined,
      dificuldades: dificuldadesSelecionadas.length > 0 ? dificuldadesSelecionadas : undefined,
      banca: bancaSelecionada || undefined,
      ano: anoSelecionado,
      disciplinas: disciplinasSelecionadas.map(d => ({ id: '', nome: d })),
      assuntos: assuntosSelecionados.map(a => ({ id: '', nome: a }))
    }

    const simulado = await criarSimulado(filtrosSimulado)

    if (simulado) {
      resetForm()
      onClose()
      onSuccess?.(simulado.id)
    } else {
      setErro('Erro ao criar simulado. Verifique se há questões suficientes com os filtros selecionados.')
    }
  }

  const resetForm = () => {
    setTitulo('')
    setDescricao('')
    setModalidade('multipla_escolha')
    setQuantidadeQuestoes(10)
    setTempoLimite(undefined)
    setUsarTempo(false)
    setDificuldadesSelecionadas([])
    setBancaSelecionada('')
    setAnoSelecionado(undefined)
    setDisciplinasSelecionadas([])
    setAssuntosSelecionados([])
    setDisciplinasExpandidas([])
    setErro(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white dark:bg-[#1C252E] rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-[#283039] flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500">quiz</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Criar Novo Simulado
              </h2>
              <p className="text-xs text-gray-500 dark:text-[#9dabb9]">
                Configure seu simulado personalizado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#283039] text-gray-500 hover:text-gray-700 dark:text-[#9dabb9] dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Limite Info */}
        {limiteInfo && (
          <div className={`px-4 py-2 text-sm flex items-center gap-2 ${limiteInfo.canUse ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
            <span className="material-symbols-outlined text-base">
              {limiteInfo.canUse ? 'info' : 'warning'}
            </span>
            {limiteInfo.canUse
              ? `Você pode criar mais ${limiteInfo.restante} simulado(s) este mês`
              : 'Limite mensal de simulados atingido'
            }
          </div>
        )}

        {/* Loading Inicial */}
        {loadingInicial ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3">
              <div className="size-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-[#9dabb9]">Carregando filtros...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Formulário */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Título do Simulado <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Simulado de Português - CESPE"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#283039] rounded-xl bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Descrição <span className="text-xs text-gray-400">(opcional)</span>
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o objetivo do simulado..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#283039] rounded-xl bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
                />
              </div>

              {/* Modalidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Questões
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'multipla_escolha', label: 'Múltipla Escolha', icon: 'format_list_bulleted' },
                    { id: 'certo_errado', label: 'Certo ou Errado', icon: 'check_circle' }
                  ].map((tipo) => {
                    const count = filtros?.modalidades.find(m => m.nome === tipo.id)?.questoes || 0
                    return (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => setModalidade(tipo.id as 'certo_errado' | 'multipla_escolha')}
                        className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all ${
                          modalidade === tipo.id
                            ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'border-gray-200 dark:border-[#283039] hover:border-gray-300 dark:hover:border-[#3a4552] text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl">{tipo.icon}</span>
                        <span className="font-medium text-sm">{tipo.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          modalidade === tipo.id
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-[#283039] text-gray-500 dark:text-[#9dabb9]'
                        }`}>
                          {count.toLocaleString()} questões
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quantidade e Tempo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Quantidade de Questões
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantidadeQuestoes}
                    onChange={(e) => setQuantidadeQuestoes(parseInt(e.target.value) || 10)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#283039] rounded-xl bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-[#9dabb9] mt-1">
                    Disponíveis: {(filtros?.total_questoes_disponiveis || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <input
                      type="checkbox"
                      checked={usarTempo}
                      onChange={(e) => setUsarTempo(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Tempo Limite (min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={tempoLimite || ''}
                    onChange={(e) => setTempoLimite(parseInt(e.target.value) || undefined)}
                    disabled={!usarTempo}
                    placeholder="Ex: 60"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#283039] rounded-xl bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Dificuldades */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dificuldade <span className="text-xs text-gray-400">(opcional)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {filtros?.dificuldades.map(dif => (
                    <button
                      key={dif.nome}
                      type="button"
                      onClick={() => toggleDificuldade(dif.nome)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                        dificuldadesSelecionadas.includes(dif.nome)
                          ? dif.nome === 'facil' ? 'bg-green-500 text-white' :
                            dif.nome === 'medio' ? 'bg-yellow-500 text-white' :
                            'bg-red-500 text-white'
                          : 'bg-gray-100 dark:bg-[#283039] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a4552]'
                      }`}
                    >
                      {dificuldadesSelecionadas.includes(dif.nome) && (
                        <span className="material-symbols-outlined text-base">check</span>
                      )}
                      {dif.label}
                      <span className="text-xs opacity-75">({dif.questoes})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Disciplinas e Assuntos - UI Hierárquica */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Disciplinas e Assuntos <span className="text-xs text-gray-400">(opcional)</span>
                </label>
                <div className="border border-gray-200 dark:border-[#283039] rounded-xl overflow-hidden">
                  {/* Contador de seleção */}
                  {(disciplinasSelecionadas.length > 0 || assuntosSelecionados.length > 0) && (
                    <div className="px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border-b border-gray-200 dark:border-[#283039] flex items-center justify-between">
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {disciplinasSelecionadas.length} disciplina(s), {assuntosSelecionados.length} assunto(s) selecionado(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDisciplinasSelecionadas([])
                          setAssuntosSelecionados([])
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Limpar seleção
                      </button>
                    </div>
                  )}

                  {/* Lista de disciplinas com accordion */}
                  <div className="max-h-64 overflow-y-auto">
                    {loadingFiltros ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="size-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      filtros?.disciplinas.slice(0, 30).map(disc => {
                        const isSelected = disciplinasSelecionadas.includes(disc.nome)
                        const isExpanded = disciplinasExpandidas.includes(disc.nome)
                        const temAssuntos = disc.assuntos && disc.assuntos.length > 0

                        return (
                          <div key={disc.nome} className="border-b border-gray-100 dark:border-[#283039] last:border-b-0">
                            {/* Header da disciplina */}
                            <div className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${
                              isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-[#1a2128]'
                            }`}>
                              {/* Checkbox da disciplina */}
                              <button
                                type="button"
                                onClick={() => toggleDisciplina(disc.nome)}
                                className={`size-5 rounded border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'border-gray-300 dark:border-[#3a4552] hover:border-blue-500'
                                }`}
                              >
                                {isSelected && (
                                  <span className="material-symbols-outlined text-sm">check</span>
                                )}
                              </button>

                              {/* Nome e contagem */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (temAssuntos) {
                                    toggleDisciplinaExpandida(disc.nome)
                                    if (!isSelected) toggleDisciplina(disc.nome)
                                  } else {
                                    toggleDisciplina(disc.nome)
                                  }
                                }}
                                className="flex-1 text-left flex items-center justify-between"
                              >
                                <span className={`text-sm ${isSelected ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {disc.nome}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-[#9dabb9] bg-gray-100 dark:bg-[#283039] px-2 py-0.5 rounded-full">
                                  {disc.questoes}
                                </span>
                              </button>

                              {/* Botão expandir */}
                              {temAssuntos && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    toggleDisciplinaExpandida(disc.nome)
                                    if (!isSelected) toggleDisciplina(disc.nome)
                                  }}
                                  className="size-7 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-[#283039] text-gray-500 transition-all"
                                >
                                  <span className={`material-symbols-outlined text-lg transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                    expand_more
                                  </span>
                                </button>
                              )}
                            </div>

                            {/* Assuntos (expandidos) */}
                            {isExpanded && temAssuntos && (
                              <div className="bg-gray-50 dark:bg-[#141A21] border-t border-gray-100 dark:border-[#283039]">
                                {/* Selecionar todos os assuntos */}
                                <button
                                  type="button"
                                  onClick={() => selecionarTodosAssuntosDaDisciplina(disc.nome)}
                                  className="w-full px-4 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    {disc.assuntos.every(a => assuntosSelecionados.includes(a.nome)) ? 'remove_done' : 'done_all'}
                                  </span>
                                  {disc.assuntos.every(a => assuntosSelecionados.includes(a.nome)) ? 'Desmarcar todos' : 'Selecionar todos'}
                                </button>

                                {/* Lista de assuntos */}
                                <div className="px-3 pb-2 space-y-1">
                                  {disc.assuntos.slice(0, 20).map(assunto => {
                                    const assuntoSelecionado = assuntosSelecionados.includes(assunto.nome)
                                    return (
                                      <button
                                        key={assunto.nome}
                                        type="button"
                                        onClick={() => toggleAssunto(assunto.nome)}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all ${
                                          assuntoSelecionado
                                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                                            : 'hover:bg-gray-100 dark:hover:bg-[#1a2128] text-gray-600 dark:text-gray-400'
                                        }`}
                                      >
                                        <span className={`material-symbols-outlined text-base ${assuntoSelecionado ? 'text-blue-500' : 'text-gray-400'}`}>
                                          {assuntoSelecionado ? 'check_box' : 'check_box_outline_blank'}
                                        </span>
                                        <span className="flex-1 text-sm truncate">{assunto.nome}</span>
                                        <span className="text-xs text-gray-400 dark:text-[#9dabb9]">
                                          {assunto.questoes}
                                        </span>
                                      </button>
                                    )
                                  })}
                                  {disc.assuntos.length > 20 && (
                                    <p className="text-xs text-center text-gray-400 dark:text-[#9dabb9] py-1">
                                      + {disc.assuntos.length - 20} assuntos
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Banca e Ano */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Banca <span className="text-xs text-gray-400">(opcional)</span>
                  </label>
                  <select
                    value={bancaSelecionada}
                    onChange={(e) => setBancaSelecionada(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#283039] rounded-xl bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Todas as bancas</option>
                    {filtros?.bancas.slice(0, 30).map(banca => (
                      <option key={banca.nome} value={banca.nome}>
                        {banca.nome} ({banca.questoes})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Ano <span className="text-xs text-gray-400">(opcional)</span>
                  </label>
                  <select
                    value={anoSelecionado || ''}
                    onChange={(e) => setAnoSelecionado(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#283039] rounded-xl bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Todos os anos</option>
                    {filtros?.anos.map(ano => (
                      <option key={ano.ano} value={ano.ano}>
                        {ano.ano} ({ano.questoes})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Erro */}
              {erro && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-400 text-sm">
                  <span className="material-symbols-outlined">error</span>
                  {erro}
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#283039] rounded-xl transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !limiteInfo?.canUse}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-xl transition-colors flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">add</span>
                    Criar Simulado
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
