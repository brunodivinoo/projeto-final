'use client'
import { Header } from '@/components/layout/Header'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePlanosEstudo, PlanoEstudo } from '@/hooks/usePlanosEstudo'
import { SeletorDisciplina } from '@/components/estudo'

const CORES_DIFICULDADE = {
  1: { texto: 'Muito Baixa', cor: 'green' },
  2: { texto: 'Baixa', cor: 'green' },
  3: { texto: 'Média', cor: 'blue' },
  4: { texto: 'Alta', cor: 'orange' },
  5: { texto: 'Muito Alta', cor: 'red' }
}

const PERIODOS = ['manha', 'tarde', 'noite'] as const
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

interface PlanoItem {
  disciplina_id: string
  disciplina_nome?: string
  assunto_id?: string
  assunto_nome?: string
  subassunto_id?: string
  subassunto_nome?: string
  prioridade: number
  dificuldade: number
  horas_meta: number
}

interface Disponibilidade {
  dia_semana: number
  periodo: 'manha' | 'tarde' | 'noite'
  disponivel: boolean
  horas: number
}

export default function PlanosPage() {
  const { user, loading: authLoading } = useAuth()
  const {
    planos,
    planoAtual,
    loading,
    buscarPlanos,
    buscarPlano,
    criarPlano,
    atualizarPlano,
    excluirPlano
  } = usePlanosEstudo()

  const [showCriarModal, setShowCriarModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoEstudo | null>(null)

  // Form state
  const [formNome, setFormNome] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formObjetivo, setFormObjetivo] = useState('')
  const [formDataInicio, setFormDataInicio] = useState('')
  const [formDataFim, setFormDataFim] = useState('')
  const [formHorasSemanais, setFormHorasSemanais] = useState(20)
  const [formAiSugestoes, setFormAiSugestoes] = useState(true)
  const [formItens, setFormItens] = useState<PlanoItem[]>([])
  const [formDisponibilidade, setFormDisponibilidade] = useState<Disponibilidade[]>([])

  // State para adicionar item
  const [showAdicionarItem, setShowAdicionarItem] = useState(false)
  const [novoItemSelecao, setNovoItemSelecao] = useState<Record<string, string | null>>({})
  const [novoItemDificuldade, setNovoItemDificuldade] = useState(3)
  const [novoItemPrioridade, setNovoItemPrioridade] = useState(3)
  const [novoItemHorasMeta, setNovoItemHorasMeta] = useState(10)

  // Carregar dados
  useEffect(() => {
    if (!authLoading && user) {
      buscarPlanos()
    }
  }, [authLoading, user, buscarPlanos])

  // Inicializar disponibilidade
  useEffect(() => {
    if (formDisponibilidade.length === 0) {
      const disp: Disponibilidade[] = []
      for (let dia = 0; dia < 7; dia++) {
        for (const periodo of PERIODOS) {
          disp.push({
            dia_semana: dia,
            periodo,
            disponivel: false,
            horas: 3
          })
        }
      }
      setFormDisponibilidade(disp)
    }
  }, [formDisponibilidade.length])

  const resetForm = () => {
    setFormNome('')
    setFormDescricao('')
    setFormObjetivo('')
    setFormDataInicio('')
    setFormDataFim('')
    setFormHorasSemanais(20)
    setFormAiSugestoes(true)
    setFormItens([])
    const disp: Disponibilidade[] = []
    for (let dia = 0; dia < 7; dia++) {
      for (const periodo of PERIODOS) {
        disp.push({ dia_semana: dia, periodo, disponivel: false, horas: 3 })
      }
    }
    setFormDisponibilidade(disp)
  }

  const handleAdicionarItem = () => {
    if (!novoItemSelecao.disciplina_id) return

    const novoItem: PlanoItem = {
      disciplina_id: novoItemSelecao.disciplina_id,
      disciplina_nome: novoItemSelecao.disciplina_nome || undefined,
      assunto_id: novoItemSelecao.assunto_id || undefined,
      assunto_nome: novoItemSelecao.assunto_nome || undefined,
      subassunto_id: novoItemSelecao.subassunto_id || undefined,
      subassunto_nome: novoItemSelecao.subassunto_nome || undefined,
      prioridade: novoItemPrioridade,
      dificuldade: novoItemDificuldade,
      horas_meta: novoItemHorasMeta
    }

    setFormItens([...formItens, novoItem])
    setNovoItemSelecao({})
    setNovoItemDificuldade(3)
    setNovoItemPrioridade(3)
    setNovoItemHorasMeta(10)
    setShowAdicionarItem(false)
  }

  const handleRemoverItem = (index: number) => {
    setFormItens(formItens.filter((_, i) => i !== index))
  }

  const toggleDisponibilidade = (dia: number, periodo: 'manha' | 'tarde' | 'noite') => {
    setFormDisponibilidade(prev =>
      prev.map(d =>
        d.dia_semana === dia && d.periodo === periodo
          ? { ...d, disponivel: !d.disponivel }
          : d
      )
    )
  }

  const isDisponivel = (dia: number, periodo: 'manha' | 'tarde' | 'noite') => {
    return formDisponibilidade.find(d => d.dia_semana === dia && d.periodo === periodo)?.disponivel || false
  }

  const handleCriarPlano = async () => {
    if (!formNome) return

    const disponibilidadeFiltrada = formDisponibilidade.filter(d => d.disponivel)

    await criarPlano({
      nome: formNome,
      descricao: formDescricao || undefined,
      objetivo: formObjetivo || undefined,
      data_inicio: formDataInicio || undefined,
      data_fim: formDataFim || undefined,
      horas_semanais: formHorasSemanais,
      ai_sugestoes: formAiSugestoes,
      itens: formItens,
      disponibilidade: disponibilidadeFiltrada
    })

    resetForm()
    setShowCriarModal(false)
  }

  const handleEditarPlano = (plano: PlanoEstudo) => {
    setPlanoSelecionado(plano)
    setFormNome(plano.nome)
    setFormDescricao(plano.descricao || '')
    setFormObjetivo(plano.objetivo || '')
    setFormDataInicio(plano.data_inicio || '')
    setFormDataFim(plano.data_fim || '')
    setFormHorasSemanais(plano.horas_semanais || 20)
    setFormAiSugestoes(plano.ai_sugestoes !== false)

    // Carregar itens
    if (plano.plano_itens) {
      setFormItens(plano.plano_itens.map(item => ({
        disciplina_id: item.disciplina_id,
        disciplina_nome: item.disciplina?.nome,
        assunto_id: item.assunto_id || undefined,
        assunto_nome: item.assunto?.nome,
        subassunto_id: item.subassunto_id || undefined,
        subassunto_nome: item.subassunto?.nome,
        prioridade: item.prioridade || 3,
        dificuldade: item.dificuldade || 3,
        horas_meta: item.horas_meta || 10
      })))
    }

    // Carregar disponibilidade
    const disp: Disponibilidade[] = []
    for (let dia = 0; dia < 7; dia++) {
      for (const periodo of PERIODOS) {
        const existente = plano.plano_disponibilidade?.find(
          d => d.dia_semana === dia && d.periodo === periodo
        )
        disp.push({
          dia_semana: dia,
          periodo,
          disponivel: existente?.disponivel || false,
          horas: existente?.horas || 3
        })
      }
    }
    setFormDisponibilidade(disp)

    setShowEditarModal(true)
  }

  const handleSalvarEdicao = async () => {
    if (!planoSelecionado || !formNome) return

    const disponibilidadeFiltrada = formDisponibilidade.filter(d => d.disponivel)

    await atualizarPlano(planoSelecionado.id, {
      nome: formNome,
      descricao: formDescricao || undefined,
      objetivo: formObjetivo || undefined,
      data_inicio: formDataInicio || undefined,
      data_fim: formDataFim || undefined,
      horas_semanais: formHorasSemanais,
      ai_sugestoes: formAiSugestoes,
      itens: formItens,
      disponibilidade: disponibilidadeFiltrada
    })

    resetForm()
    setPlanoSelecionado(null)
    setShowEditarModal(false)
  }

  const handleExcluirPlano = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      await excluirPlano(id)
    }
  }

  const totalHorasDisponiveis = formDisponibilidade.filter(d => d.disponivel).reduce((acc, d) => acc + d.horas, 0)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Header title="Planos de Estudo" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="Planos de Estudo" />

      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Planos de Estudo
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-1">
              Organize suas metas e cronograma de estudos
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowCriarModal(true) }}
            className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-5 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Criar Plano
          </button>
        </div>

        {/* Lista de Planos */}
        {planos.length === 0 ? (
          <div className="bg-white dark:bg-[#1c2127] rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
              event_note
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Nenhum plano criado
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Crie seu primeiro plano de estudo para organizar sua rotina
            </p>
            <button
              onClick={() => { resetForm(); setShowCriarModal(true) }}
              className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Criar meu primeiro plano
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planos.map((plano) => (
              <div
                key={plano.id}
                className={`bg-white dark:bg-[#1c2127] rounded-xl border ${
                  plano.ativo
                    ? 'border-primary/30 ring-2 ring-primary/20'
                    : 'border-slate-200 dark:border-slate-700'
                } p-5 hover:shadow-lg transition-all`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined ${
                      plano.ativo ? 'text-primary' : 'text-slate-400'
                    }`}>
                      {plano.ativo ? 'flag' : 'flag_2'}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                      {plano.nome}
                    </h3>
                  </div>
                  {plano.ativo && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                      Ativo
                    </span>
                  )}
                </div>

                {plano.objetivo && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                    {plano.objetivo}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {plano.horas_semanais || 20}h/semana
                  </div>
                  {plano.plano_itens && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="material-symbols-outlined text-sm">library_books</span>
                      {Array.isArray(plano.plano_itens)
                        ? plano.plano_itens.length
                        : (plano.plano_itens as { count?: number })?.count || 0} matérias
                    </div>
                  )}
                  {plano.ai_sugestoes && (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      IA
                    </div>
                  )}
                </div>

                {plano.data_inicio && plano.data_fim && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                    {new Date(plano.data_inicio).toLocaleDateString('pt-BR')} - {new Date(plano.data_fim).toLocaleDateString('pt-BR')}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => handleEditarPlano(plano)}
                    className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleExcluirPlano(plano.id)}
                    className="text-sm font-medium text-red-500 hover:text-red-600 py-2 px-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar/Editar Plano */}
      {(showCriarModal || showEditarModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1c2127] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-[#1c2127] p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {showEditarModal ? 'Editar Plano' : 'Criar Novo Plano'}
              </h2>
              <button
                onClick={() => { resetForm(); setShowCriarModal(false); setShowEditarModal(false) }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações Básicas */}
              <div className="bg-slate-50 dark:bg-[#101922] p-5 rounded-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="material-symbols-outlined text-primary">flag</span>
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Nome do Plano *</span>
                    <input
                      type="text"
                      value={formNome}
                      onChange={(e) => setFormNome(e.target.value)}
                      placeholder="Ex: Plano Intensivo ENEM 2024"
                      className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] text-slate-900 dark:text-white px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Objetivo</span>
                    <input
                      type="text"
                      value={formObjetivo}
                      onChange={(e) => setFormObjetivo(e.target.value)}
                      placeholder="Ex: Aprovação em Medicina"
                      className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] text-slate-900 dark:text-white px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Descrição</span>
                    <textarea
                      value={formDescricao}
                      onChange={(e) => setFormDescricao(e.target.value)}
                      placeholder="Descreva seu plano..."
                      rows={2}
                      className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] text-slate-900 dark:text-white px-4 py-3 text-sm resize-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Data Início</span>
                    <input
                      type="date"
                      value={formDataInicio}
                      onChange={(e) => setFormDataInicio(e.target.value)}
                      className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] text-slate-900 dark:text-white px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Data Fim / Prova</span>
                    <input
                      type="date"
                      value={formDataFim}
                      onChange={(e) => setFormDataFim(e.target.value)}
                      className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] text-slate-900 dark:text-white px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Horas Semanais</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formHorasSemanais}
                      onChange={(e) => setFormHorasSemanais(parseInt(e.target.value) || 20)}
                      className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] text-slate-900 dark:text-white px-4 py-3 text-sm"
                    />
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formAiSugestoes}
                        onChange={(e) => setFormAiSugestoes(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Sugestões via IA</span>
                  </div>
                </div>
              </div>

              {/* Matérias */}
              <div className="bg-slate-50 dark:bg-[#101922] p-5 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-primary">library_books</span>
                    Matérias e Dificuldade
                  </h3>
                  <button
                    onClick={() => setShowAdicionarItem(!showAdicionarItem)}
                    className="text-xs font-bold text-primary hover:text-blue-400 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + Adicionar
                  </button>
                </div>

                {/* Form adicionar item */}
                {showAdicionarItem && (
                  <div className="bg-white dark:bg-[#1c2127] p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                    <SeletorDisciplina
                      onSelecao={(selecao) => setNovoItemSelecao(selecao as Record<string, string | null>)}
                      valorInicial={{
                        disciplina_id: novoItemSelecao.disciplina_id || undefined,
                        assunto_id: novoItemSelecao.assunto_id || undefined,
                        subassunto_id: novoItemSelecao.subassunto_id || undefined
                      }}
                    />
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Dificuldade</span>
                        <select
                          value={novoItemDificuldade}
                          onChange={(e) => setNovoItemDificuldade(parseInt(e.target.value))}
                          className="rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-sm py-2"
                        >
                          {[1, 2, 3, 4, 5].map(n => (
                            <option key={n} value={n}>{CORES_DIFICULDADE[n as keyof typeof CORES_DIFICULDADE].texto}</option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Prioridade</span>
                        <select
                          value={novoItemPrioridade}
                          onChange={(e) => setNovoItemPrioridade(parseInt(e.target.value))}
                          className="rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-sm py-2"
                        >
                          {[1, 2, 3, 4, 5].map(n => (
                            <option key={n} value={n}>{n} - {n === 1 ? 'Baixa' : n === 5 ? 'Alta' : 'Normal'}</option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Horas Meta</span>
                        <input
                          type="number"
                          min="1"
                          value={novoItemHorasMeta}
                          onChange={(e) => setNovoItemHorasMeta(parseInt(e.target.value) || 10)}
                          className="rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-sm py-2"
                        />
                      </label>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleAdicionarItem}
                        disabled={!novoItemSelecao.disciplina_id}
                        className="flex-1 bg-primary hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm"
                      >
                        Adicionar
                      </button>
                      <button
                        onClick={() => setShowAdicionarItem(false)}
                        className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de itens */}
                <div className="flex flex-col gap-2">
                  {formItens.length === 0 ? (
                    <p className="text-center text-slate-400 dark:text-slate-500 py-4">
                      Nenhuma matéria adicionada
                    </p>
                  ) : (
                    formItens.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127]"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm text-slate-900 dark:text-white">
                            {item.disciplina_nome || 'Disciplina'}
                            {item.assunto_nome && (
                              <span className="text-slate-400 dark:text-slate-500"> → {item.assunto_nome}</span>
                            )}
                          </div>
                          <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span>Dificuldade: {CORES_DIFICULDADE[item.dificuldade as keyof typeof CORES_DIFICULDADE]?.texto}</span>
                            <span>•</span>
                            <span>Meta: {item.horas_meta}h</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoverItem(index)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Disponibilidade */}
              <div className="bg-slate-50 dark:bg-[#101922] p-5 rounded-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  Disponibilidade Semanal
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
                    ({totalHorasDisponiveis}h selecionadas)
                  </span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Clique nos blocos para marcar seus horários livres para estudo.
                </p>
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[500px] grid grid-cols-8 gap-1 text-center text-sm">
                    <div className="h-8"></div>
                    {DIAS.map((dia) => (
                      <div key={dia} className="font-bold text-slate-500 dark:text-slate-400">{dia}</div>
                    ))}
                    {PERIODOS.map((periodo, pIdx) => (
                      <>
                        <div key={`label-${periodo}`} className="flex items-center justify-end pr-2 text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                          {periodo === 'manha' ? 'Manhã' : periodo === 'tarde' ? 'Tarde' : 'Noite'}
                        </div>
                        {DIAS.map((_, dIdx) => (
                          <button
                            key={`${pIdx}-${dIdx}`}
                            onClick={() => toggleDisponibilidade(dIdx, periodo)}
                            className={`h-10 rounded transition-colors ${
                              isDisponivel(dIdx, periodo)
                                ? 'bg-primary/20 border border-primary/40 hover:bg-primary/30'
                                : 'bg-white dark:bg-[#1c2127] border border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          />
                        ))}
                      </>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-[#1c2127] p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => { resetForm(); setShowCriarModal(false); setShowEditarModal(false) }}
                className="px-6 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={showEditarModal ? handleSalvarEdicao : handleCriarPlano}
                disabled={!formNome}
                className="bg-primary hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>{showEditarModal ? 'Salvar' : 'Criar Plano'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
