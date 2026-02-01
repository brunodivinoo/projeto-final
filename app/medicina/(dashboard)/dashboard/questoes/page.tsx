'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { supabase } from '@/lib/supabase'
import {
  FileText,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  X,
  Share2,
  Link2,
  MessageSquare,
  Crown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Lock
} from 'lucide-react'
import { GabaritoBlur, UpgradeFeedback } from '@/components/medicina/questoes/GabaritoBlur'

interface Alternativa {
  letra: string
  texto: string
}

interface Questao {
  id: string
  enunciado: string
  alternativas: Alternativa[]
  gabarito: string
  comentario_ia: string | null
  explicacao: string | null
  banca: string | null
  ano: number | null
  dificuldade: number
  periodo_dificuldade: number | null
  tipo_questao: string | null
  disciplina: { id: string, nome: string } | null
  assunto: { id: string, nome: string } | null
}

interface Disciplina {
  id: string
  nome: string
}

interface Assunto {
  id: string
  nome: string
  disciplina_id: string
}

interface RespostaUsuario {
  questao_id: string
  acertou: boolean
  resposta_selecionada: string
}

// Componente de Dropdown Multi-Select
function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder,
  disabled = false,
  groupBy
}: {
  label: string
  options: { id: string; nome: string; group?: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder: string
  disabled?: boolean
  groupBy?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const clearAll = () => {
    onChange([])
  }

  const selectedNames = options
    .filter(o => selected.includes(o.id))
    .map(o => o.nome)

  // Agrupar opcoes se necessario
  const groupedOptions = groupBy
    ? options.reduce((acc, opt) => {
        const group = opt.group || 'Outros'
        if (!acc[group]) acc[group] = []
        acc[group].push(opt)
        return acc
      }, {} as Record<string, typeof options>)
    : null

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-slate-600 text-sm mb-2">{label}</label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'
        } ${isOpen ? 'ring-2 ring-emerald-500' : ''}`}
      >
        <span className={selected.length > 0 ? 'text-white' : 'text-slate-500'}>
          {selected.length === 0
            ? placeholder
            : selected.length === 1
            ? selectedNames[0]
            : `${selected.length} selecionados`}
        </span>
        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {/* Header com limpar */}
          {selected.length > 0 && (
            <div className="sticky top-0 bg-slate-800 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
              <span className="text-slate-600 text-sm">{selected.length} selecionados</span>
              <button
                onClick={clearAll}
                className="text-emerald-400 text-sm hover:underline"
              >
                Limpar
              </button>
            </div>
          )}

          {/* Opcoes agrupadas ou simples */}
          {groupedOptions ? (
            Object.entries(groupedOptions).map(([group, opts]) => (
              <div key={group}>
                <div className="px-4 py-2 bg-slate-100 text-slate-500 text-xs font-semibold uppercase">
                  {group}
                </div>
                {opts.map(option => (
                  <button
                    key={option.id}
                    onClick={() => toggleOption(option.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selected.includes(option.id)
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300'
                    }`}>
                      {selected.includes(option.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-slate-700">{option.nome}</span>
                  </button>
                ))}
              </div>
            ))
          ) : (
            options.map(option => (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition-colors"
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  selected.includes(option.id)
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-slate-300'
                }`}>
                  {selected.includes(option.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-slate-700">{option.nome}</span>
              </button>
            ))
          )}

          {options.length === 0 && (
            <div className="px-4 py-6 text-center text-slate-500">
              Nenhuma opcao disponivel
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function QuestoesPage() {
  const { user, plano, limitesPlano, limites, trialStatus } = useMedAuth()

  // Verificar se deve aplicar blur no gabarito (FREE sem trial ativo)
  const deveBlurGabarito = plano === 'gratuito' && !trialStatus?.ativo
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [buscaIniciada, setBuscaIniciada] = useState(false)

  // Dados para filtros
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [todosAssuntos, setTodosAssuntos] = useState<Assunto[]>([])
  const [bancasDisponiveis, setBancasDisponiveis] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(true)

  // Selecoes
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<string[]>([])
  const [assuntosSelecionados, setAssuntosSelecionados] = useState<string[]>([])
  const [bancasSelecionadas, setBancasSelecionadas] = useState<string[]>([])
  const [anosSelecionados, setAnosSelecionados] = useState<string[]>([])
  const [periodosSelecionados, setPeriodosSelecionados] = useState<string[]>([])
  const [tipoQuestaoSelecionado, setTipoQuestaoSelecionado] = useState<string>('')
  const [naoRespondidas, setNaoRespondidas] = useState(false)
  const [erradas, setErradas] = useState(false)

  // Tipos de questão disponíveis
  const tiposQuestao = [
    { id: 'multipla_escolha', nome: 'Múltipla Escolha' },
    { id: 'caso_clinico', nome: 'Caso Clínico' },
    { id: 'imagem', nome: 'Com Imagem' },
    { id: 'verdadeiro_falso', nome: 'Afirmativa V/F' },
    { id: 'associacao_colunas', nome: 'Associação de Colunas' },
    { id: 'sequencia', nome: 'Sequência' },
    { id: 'lacunas', nome: 'Preencher Lacunas' },
    { id: 'multipla_resposta', nome: 'Múltipla Resposta' }
  ]

  // Estado das questoes
  const [respostasUsuario, setRespostasUsuario] = useState<Record<string, RespostaUsuario>>({})
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<Record<string, string>>({})
  const [questoesRespondidas, setQuestoesRespondidas] = useState<Set<string>>(new Set())
  const [questoesExpandidas, setQuestoesExpandidas] = useState<Set<string>>(new Set())

  // Compartilhamento
  const [shareMenuAberto, setShareMenuAberto] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  // Paginacao
  const [page, setPage] = useState(0)
  const pageSize = 10

  // Anos e dificuldades
  const anos = [
    { id: '2024', nome: '2024' },
    { id: '2023', nome: '2023' },
    { id: '2022', nome: '2022' },
    { id: '2021', nome: '2021' },
    { id: '2020', nome: '2020' },
    { id: '2019', nome: '2019' },
    { id: '2018', nome: '2018' }
  ]

  // Períodos do curso de medicina (1º ao 12º)
  const periodosOpcoes = [
    { id: '1', nome: '1º Período' },
    { id: '2', nome: '2º Período' },
    { id: '3', nome: '3º Período' },
    { id: '4', nome: '4º Período' },
    { id: '5', nome: '5º Período' },
    { id: '6', nome: '6º Período' },
    { id: '7', nome: '7º Período' },
    { id: '8', nome: '8º Período' },
    { id: '9', nome: '9º Período' },
    { id: '10', nome: '10º Período' },
    { id: '11', nome: '11º Período' },
    { id: '12', nome: '12º Período' }
  ]

  // Cores por período (gradiente do básico ao avançado)
  const periodosInfo: Record<string, { label: string; cor: string }> = {
    '1': { label: '1º Período', cor: 'text-green-400 bg-green-500/20' },
    '2': { label: '2º Período', cor: 'text-green-400 bg-green-500/20' },
    '3': { label: '3º Período', cor: 'text-emerald-400 bg-emerald-500/20' },
    '4': { label: '4º Período', cor: 'text-emerald-400 bg-emerald-500/20' },
    '5': { label: '5º Período', cor: 'text-teal-400 bg-teal-500/20' },
    '6': { label: '6º Período', cor: 'text-cyan-400 bg-cyan-500/20' },
    '7': { label: '7º Período', cor: 'text-blue-400 bg-blue-500/20' },
    '8': { label: '8º Período', cor: 'text-blue-400 bg-blue-500/20' },
    '9': { label: '9º Período', cor: 'text-indigo-400 bg-indigo-500/20' },
    '10': { label: '10º Período', cor: 'text-purple-400 bg-purple-500/20' },
    '11': { label: '11º Período', cor: 'text-orange-400 bg-orange-500/20' },
    '12': { label: '12º Período', cor: 'text-red-400 bg-red-500/20' }
  }

  // Carregar disciplinas, assuntos e bancas
  useEffect(() => {
    const loadMeta = async () => {
      const { data: discs } = await supabase
        .from('disciplinas_med')
        .select('id, nome')
        .order('nome')

      if (discs) setDisciplinas(discs)

      const { data: assuntosData } = await supabase
        .from('assuntos_med')
        .select('id, nome, disciplina_id')
        .order('nome')

      if (assuntosData) setTodosAssuntos(assuntosData)

      const { data: bancasData } = await supabase
        .from('questoes_med')
        .select('banca')
        .not('banca', 'is', null)

      if (bancasData) {
        const unique = [...new Set(bancasData.map(b => b.banca).filter(Boolean))]
        setBancasDisponiveis(unique as string[])
      }
    }
    loadMeta()
  }, [])

  // Assuntos filtrados por disciplinas selecionadas (com agrupamento por disciplina)
  const assuntosFiltrados = disciplinasSelecionadas.length > 0
    ? todosAssuntos
        .filter(a => disciplinasSelecionadas.includes(a.disciplina_id))
        .map(a => {
          const disc = disciplinas.find(d => d.id === a.disciplina_id)
          return { ...a, group: disc?.nome || 'Outros' }
        })
    : []

  // Quando disciplinas mudam, limpar assuntos que nao pertencem mais
  useEffect(() => {
    if (disciplinasSelecionadas.length > 0) {
      setAssuntosSelecionados(prev =>
        prev.filter(aId => {
          const assunto = todosAssuntos.find(a => a.id === aId)
          return assunto && disciplinasSelecionadas.includes(assunto.disciplina_id)
        })
      )
    } else {
      setAssuntosSelecionados([])
    }
  }, [disciplinasSelecionadas, todosAssuntos])

  const buscarQuestoes = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setBuscaIniciada(true)

      const params = new URLSearchParams()
      params.set('userId', user.id)
      params.set('limit', pageSize.toString())
      params.set('offset', (page * pageSize).toString())

      if (disciplinasSelecionadas.length > 0) {
        params.set('disciplinaIds', disciplinasSelecionadas.join(','))
      }
      if (assuntosSelecionados.length > 0) {
        params.set('assuntoIds', assuntosSelecionados.join(','))
      }
      if (bancasSelecionadas.length > 0) {
        params.set('bancas', bancasSelecionadas.join(','))
      }
      if (anosSelecionados.length > 0) {
        params.set('anos', anosSelecionados.join(','))
      }
      if (periodosSelecionados.length > 0) {
        params.set('periodos', periodosSelecionados.join(','))
      }
      if (tipoQuestaoSelecionado) {
        params.set('tiposQuestao', tipoQuestaoSelecionado)
      }
      if (naoRespondidas) params.set('naoRespondidas', 'true')
      if (erradas) params.set('erradas', 'true')

      const response = await fetch(`/api/medicina/questoes?${params}`)
      const data = await response.json()

      const questoesData = data.questoes || []
      setQuestoes(questoesData)
      setTotal(data.total || 0)

      // Expandir todas as questoes por padrao
      setQuestoesExpandidas(new Set(questoesData.map((q: Questao) => q.id)))

      // Carregar respostas anteriores do usuario
      if (questoesData.length > 0) {
        const { data: respostas } = await supabase
          .from('respostas_med')
          .select('questao_id, acertou, resposta_selecionada')
          .eq('user_id', user.id)
          .in('questao_id', questoesData.map((q: Questao) => q.id))

        if (respostas) {
          const respostasMap: Record<string, RespostaUsuario> = {}
          const respondidas = new Set<string>()
          respostas.forEach(r => {
            respostasMap[r.questao_id] = r
            respondidas.add(r.questao_id)
          })
          setRespostasUsuario(respostasMap)
          setQuestoesRespondidas(respondidas)
        }
      }

    } catch (error) {
      console.error('Erro ao buscar questoes:', error)
    } finally {
      setLoading(false)
    }
  }, [user, disciplinasSelecionadas, assuntosSelecionados, bancasSelecionadas, anosSelecionados, periodosSelecionados, tipoQuestaoSelecionado, naoRespondidas, erradas, page])

  const limparFiltros = () => {
    setDisciplinasSelecionadas([])
    setAssuntosSelecionados([])
    setBancasSelecionadas([])
    setAnosSelecionados([])
    setPeriodosSelecionados([])
    setTipoQuestaoSelecionado('')
    setNaoRespondidas(false)
    setErradas(false)
    setPage(0)
  }

  const temFiltrosAtivos =
    disciplinasSelecionadas.length > 0 ||
    assuntosSelecionados.length > 0 ||
    bancasSelecionadas.length > 0 ||
    anosSelecionados.length > 0 ||
    periodosSelecionados.length > 0 ||
    tipoQuestaoSelecionado !== '' ||
    naoRespondidas ||
    erradas

  // Responder questao
  const responderQuestao = async (questaoId: string) => {
    if (!user || questoesRespondidas.has(questaoId)) return

    const respostaSelecionada = respostasSelecionadas[questaoId]
    if (!respostaSelecionada) return

    try {
      const response = await fetch('/api/medicina/questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          questaoId,
          respostaSelecionada
        })
      })

      const data = await response.json()

      if (response.ok) {
        setQuestoesRespondidas(new Set([...questoesRespondidas, questaoId]))
        setRespostasUsuario(prev => ({
          ...prev,
          [questaoId]: {
            questao_id: questaoId,
            acertou: data.acertou,
            resposta_selecionada: respostaSelecionada
          }
        }))
      }
    } catch (error) {
      console.error('Erro ao responder:', error)
    }
  }

  // Compartilhar
  const copiarLink = (questaoId: string) => {
    const url = `${window.location.origin}/medicina/dashboard/questoes/${questaoId}`
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => {
      setCopiado(false)
      setShareMenuAberto(null)
    }, 2000)
  }

  // Limite de questoes
  const questoesUsadas = limites?.questoes_dia || 0
  const questoesLimite = limitesPlano.questoes_dia
  const podeResponder = questoesLimite === -1 || questoesUsadas < questoesLimite

  const getPeriodoInfo = (periodo: number | null) => {
    if (!periodo) return null
    return periodosInfo[String(periodo)] || null
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Banco de Questoes
          </h1>
          <p className="text-emerald-200/70 mt-1">
            Selecione os filtros e clique em buscar
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
            <Target className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-700">
              {questoesUsadas} / {questoesLimite === -1 ? '∞' : questoesLimite} hoje
            </span>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>
      </div>

      {/* Painel de Filtros */}
      {showFilters && (
        <div className="bg-slate-100 rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Filtros</h3>
            {temFiltrosAtivos && (
              <button
                onClick={limparFiltros}
                className="text-slate-600 text-sm hover:text-white flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpar todos
              </button>
            )}
          </div>

          {/* Linha 1: Disciplinas e Assuntos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <MultiSelectDropdown
              label="Disciplinas"
              options={disciplinas.map(d => ({ id: d.id, nome: d.nome }))}
              selected={disciplinasSelecionadas}
              onChange={setDisciplinasSelecionadas}
              placeholder="Selecione as disciplinas"
            />

            <MultiSelectDropdown
              label="Assuntos"
              options={assuntosFiltrados}
              selected={assuntosSelecionados}
              onChange={setAssuntosSelecionados}
              placeholder={disciplinasSelecionadas.length === 0 ? "Selecione disciplinas primeiro" : "Selecione os assuntos"}
              disabled={disciplinasSelecionadas.length === 0}
              groupBy="group"
            />
          </div>

          {/* Linha 2: Bancas, Anos, Período */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <MultiSelectDropdown
              label="Bancas"
              options={bancasDisponiveis.map(b => ({ id: b, nome: b }))}
              selected={bancasSelecionadas}
              onChange={setBancasSelecionadas}
              placeholder="Todas as bancas"
            />

            <MultiSelectDropdown
              label="Anos"
              options={anos}
              selected={anosSelecionados}
              onChange={setAnosSelecionados}
              placeholder="Todos os anos"
            />

            <MultiSelectDropdown
              label="Período"
              options={periodosOpcoes}
              selected={periodosSelecionados}
              onChange={setPeriodosSelecionados}
              placeholder="Todos os períodos"
            />
          </div>

          {/* Linha 3: Tipo de Questão */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">Tipo de Questão</label>
              <div className="relative">
                <select
                  value={tipoQuestaoSelecionado}
                  onChange={(e) => setTipoQuestaoSelecionado(e.target.value)}
                  className="w-full appearance-none px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="" className="bg-slate-800">Todos os tipos</option>
                  {tiposQuestao.map(tipo => (
                    <option key={tipo.id} value={tipo.id} className="bg-slate-800">
                      {tipo.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Filtros extras */}
          <div className="flex flex-wrap items-center gap-6 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={naoRespondidas}
                onChange={(e) => {
                  setNaoRespondidas(e.target.checked)
                  if (e.target.checked) setErradas(false)
                }}
                className="w-4 h-4 rounded border-slate-300 bg-slate-100 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-slate-700">Apenas nao respondidas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={erradas}
                onChange={(e) => {
                  setErradas(e.target.checked)
                  if (e.target.checked) setNaoRespondidas(false)
                }}
                className="w-4 h-4 rounded border-slate-300 bg-slate-100 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-slate-700">Apenas erradas</span>
            </label>
          </div>

          {/* Resumo e Botao Buscar */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="text-slate-500 text-sm">
              {temFiltrosAtivos ? (
                <div className="flex flex-wrap gap-2">
                  {disciplinasSelecionadas.length > 0 && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                      {disciplinasSelecionadas.length} disciplina(s)
                    </span>
                  )}
                  {assuntosSelecionados.length > 0 && (
                    <span className="px-2 py-1 bg-teal-500/20 text-teal-400 rounded-full text-xs">
                      {assuntosSelecionados.length} assunto(s)
                    </span>
                  )}
                  {bancasSelecionadas.length > 0 && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                      {bancasSelecionadas.length} banca(s)
                    </span>
                  )}
                  {anosSelecionados.length > 0 && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                      {anosSelecionados.length} ano(s)
                    </span>
                  )}
                  {periodosSelecionados.length > 0 && (
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">
                      {periodosSelecionados.length} período(s)
                    </span>
                  )}
                  {tipoQuestaoSelecionado && (
                    <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs">
                      {tiposQuestao.find(t => t.id === tipoQuestaoSelecionado)?.nome}
                    </span>
                  )}
                </div>
              ) : (
                'Nenhum filtro - todas as questoes'
              )}
            </div>
            <button
              onClick={() => {
                setPage(0)
                buscarQuestoes()
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors"
            >
              <Search className="w-5 h-5" />
              Buscar Questoes
            </button>
          </div>
        </div>
      )}

      {/* Resultado */}
      {!buscaIniciada ? (
        <div className="bg-slate-100 rounded-xl p-12 border border-slate-200 text-center">
          <Search className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Pronto para estudar?</h3>
          <p className="text-slate-600 mb-4">
            Selecione os filtros acima e clique em &quot;Buscar Questoes&quot; para comecar
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : questoes.length === 0 ? (
        <div className="bg-slate-100 rounded-xl p-12 border border-slate-200 text-center">
          <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhuma questao encontrada</h3>
          <p className="text-slate-600 mb-4">Tente ajustar os filtros ou limpar a busca</p>
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="text-emerald-400 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Resumo */}
          <div className="flex items-center justify-between">
            <p className="text-slate-600">
              {total} questoes encontradas
            </p>
          </div>

          {/* Lista de Questoes Expandidas */}
          {questoes.map((questao, index) => {
            const periodo = getPeriodoInfo(questao.periodo_dificuldade)
            const jaRespondeu = questoesRespondidas.has(questao.id)
            const respostaAnterior = respostasUsuario[questao.id]
            const respostaSelecionada = respostasSelecionadas[questao.id]
            const isExpandida = questoesExpandidas.has(questao.id)

            return (
              <div
                key={questao.id}
                className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Header da Questao */}
                <div className="p-5 border-b border-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                          #{index + 1 + page * pageSize}
                        </span>
                        {questao.disciplina && (
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                            {questao.disciplina.nome}
                          </span>
                        )}
                        {questao.assunto && (
                          <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-xs rounded-full">
                            {questao.assunto.nome}
                          </span>
                        )}
                        {questao.banca && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                            {questao.banca} {questao.ano && `${questao.ano}`}
                          </span>
                        )}
                        {periodo && (
                          <span className={`px-2 py-1 text-xs rounded-full ${periodo.cor}`}>
                            {periodo.label}
                          </span>
                        )}
                        {questao.tipo_questao && questao.tipo_questao !== 'multipla_escolha' && (
                          <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full">
                            {tiposQuestao.find(t => t.id === questao.tipo_questao)?.nome || questao.tipo_questao}
                          </span>
                        )}
                        {jaRespondeu && (
                          <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                            respostaAnterior?.acertou
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {respostaAnterior?.acertou ? (
                              <><CheckCircle2 className="w-3 h-3" /> Acertou</>
                            ) : (
                              <><XCircle className="w-3 h-3" /> Errou</>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Enunciado */}
                      <p className="text-slate-800 whitespace-pre-wrap">
                        {questao.enunciado}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botao Compartilhar */}
                      <div className="relative">
                        <button
                          onClick={() => setShareMenuAberto(shareMenuAberto === questao.id ? null : questao.id)}
                          className="p-2 text-slate-500 hover:text-white hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>

                        {shareMenuAberto === questao.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-200 rounded-lg shadow-xl z-10">
                            <button
                              onClick={() => copiarLink(questao.id)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Link2 className="w-4 h-4" />
                              {copiado ? 'Link copiado!' : 'Copiar link'}
                            </button>
                            <Link
                              href={`/medicina/dashboard/forum/novo?questaoId=${questao.id}`}
                              className="w-full flex items-center gap-2 px-4 py-3 text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Discutir no forum
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Expandir/Colapsar */}
                      <button
                        onClick={() => {
                          const newSet = new Set(questoesExpandidas)
                          if (isExpandida) {
                            newSet.delete(questao.id)
                          } else {
                            newSet.add(questao.id)
                          }
                          setQuestoesExpandidas(newSet)
                        }}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {isExpandida ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Alternativas - Expandido */}
                {isExpandida && (
                  <div className="p-5">
                    {/* Verificar limite */}
                    {!podeResponder && !jaRespondeu ? (
                      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6 text-center">
                        <Crown className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Limite diario atingido!
                        </h4>
                        <p className="text-amber-200/80 mb-4">
                          Voce ja respondeu {questoesUsadas} questoes hoje.
                          {plano === 'gratuito'
                            ? ' Faca upgrade para ter questoes ilimitadas!'
                            : ' Seu limite sera renovado amanha.'}
                        </p>
                        {plano === 'gratuito' && (
                          <Link
                            href="/medicina/dashboard/assinatura"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-colors"
                          >
                            <Sparkles className="w-5 h-5" />
                            Desbloquear Questoes Ilimitadas
                          </Link>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Alternativas */}
                        <div className="space-y-3 mb-4">
                          {questao.alternativas?.map((alt) => {
                            const isSelected = respostaSelecionada === alt.letra || respostaAnterior?.resposta_selecionada === alt.letra
                            const isCorreta = alt.letra === questao.gabarito
                            const mostrarResultado = jaRespondeu
                            // Se deve blur, nao revelar qual e a correta
                            const mostrarCorreta = mostrarResultado && !deveBlurGabarito

                            let bgClass = 'bg-slate-100 hover:bg-slate-100 border-slate-200'
                            if (mostrarResultado) {
                              if (mostrarCorreta && isCorreta) {
                                bgClass = 'bg-green-500/20 border-green-500/50'
                              } else if (isSelected && !isCorreta && mostrarCorreta) {
                                bgClass = 'bg-red-500/20 border-red-500/50'
                              } else if (isSelected && deveBlurGabarito) {
                                // Resposta selecionada mas com blur - nao revela se esta certa
                                bgClass = 'bg-blue-500/20 border-blue-500/50'
                              }
                            } else if (isSelected) {
                              bgClass = 'bg-emerald-500/20 border-emerald-500/50'
                            }

                            return (
                              <button
                                key={alt.letra}
                                onClick={() => {
                                  if (!jaRespondeu && podeResponder) {
                                    setRespostasSelecionadas(prev => ({
                                      ...prev,
                                      [questao.id]: alt.letra
                                    }))
                                  }
                                }}
                                disabled={jaRespondeu || !podeResponder}
                                className={`w-full flex items-start gap-3 p-4 rounded-lg border transition-all ${bgClass} ${
                                  jaRespondeu ? 'cursor-default' : 'cursor-pointer'
                                }`}
                              >
                                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                                  mostrarCorreta && isCorreta
                                    ? 'bg-green-500 text-white'
                                    : mostrarCorreta && isSelected && !isCorreta
                                    ? 'bg-red-500 text-white'
                                    : isSelected
                                    ? deveBlurGabarito && jaRespondeu
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-emerald-500 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {alt.letra}
                                </span>
                                <span className="text-slate-700 text-left flex-1">{alt.texto}</span>
                                {mostrarCorreta && isCorreta && (
                                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                                )}
                                {mostrarCorreta && isSelected && !isCorreta && (
                                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                )}
                                {deveBlurGabarito && jaRespondeu && isSelected && (
                                  <Lock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                )}
                              </button>
                            )
                          })}
                        </div>

                        {/* Botao Responder */}
                        {!jaRespondeu && (
                          <button
                            onClick={() => responderQuestao(questao.id)}
                            disabled={!respostaSelecionada}
                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Confirmar Resposta
                          </button>
                        )}

                        {/* Feedback para usuario FREE sem trial */}
                        <UpgradeFeedback show={jaRespondeu && deveBlurGabarito} />

                        {/* Comentario/Explicacao */}
                        {jaRespondeu && (questao.explicacao || questao.comentario_ia) && (
                          <GabaritoBlur mostrarBlur={deveBlurGabarito} tipo="explicacao">
                            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <h5 className="text-blue-400 font-medium mb-2">Explicacao:</h5>
                              <p className="text-slate-700 whitespace-pre-wrap">{questao.explicacao || questao.comentario_ia}</p>
                            </div>
                          </GabaritoBlur>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Paginacao */}
          {total > pageSize && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => {
                  setPage(Math.max(0, page - 1))
                  buscarQuestoes()
                }}
                disabled={page === 0}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-slate-600">
                Pagina {page + 1} de {Math.ceil(total / pageSize)}
              </span>
              <button
                onClick={() => {
                  setPage(page + 1)
                  buscarQuestoes()
                }}
                disabled={(page + 1) * pageSize >= total}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proxima
              </button>
            </div>
          )}
        </div>
      )}

      {/* Aviso de limite (flutuante) */}
      {!podeResponder && buscaIniciada && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
          <Clock className="w-5 h-5" />
          <span>Limite diario atingido!</span>
          <Link href="/medicina/dashboard/assinatura" className="font-semibold underline">
            Fazer upgrade
          </Link>
        </div>
      )}
    </div>
  )
}
