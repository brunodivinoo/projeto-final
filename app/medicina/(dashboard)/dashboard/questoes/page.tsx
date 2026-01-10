'use client'

import { useState, useEffect, useCallback } from 'react'
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
  ChevronUp
} from 'lucide-react'

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

export default function QuestoesPage() {
  const { user, plano, limitesPlano, limites } = useMedAuth()
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [buscaIniciada, setBuscaIniciada] = useState(false)

  // Filtros
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [assuntos, setAssuntos] = useState<Assunto[]>([])
  const [bancas, setBancas] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(true)

  // Seleções múltiplas
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<string[]>([])
  const [assuntosSelecionados, setAssuntosSelecionados] = useState<string[]>([])
  const [bancasSelecionadas, setBancasSelecionadas] = useState<string[]>([])
  const [anosSelecionados, setAnosSelecionados] = useState<string[]>([])
  const [dificuldadesSelecionadas, setDificuldadesSelecionadas] = useState<string[]>([])
  const [naoRespondidas, setNaoRespondidas] = useState(false)
  const [erradas, setErradas] = useState(false)

  // Estado das questões
  const [respostasUsuario, setRespostasUsuario] = useState<Record<string, RespostaUsuario>>({})
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<Record<string, string>>({})
  const [questoesRespondidas, setQuestoesRespondidas] = useState<Set<string>>(new Set())
  const [questoesExpandidas, setQuestoesExpandidas] = useState<Set<string>>(new Set())

  // Compartilhamento
  const [shareMenuAberto, setShareMenuAberto] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  // Paginação
  const [page, setPage] = useState(0)
  const pageSize = 10

  // Anos disponíveis
  const anos = [2024, 2023, 2022, 2021, 2020, 2019, 2018]

  // Dificuldades
  const dificuldades = [
    { value: '1', label: 'Muito Fácil', cor: 'text-green-400 bg-green-500/20' },
    { value: '2', label: 'Fácil', cor: 'text-emerald-400 bg-emerald-500/20' },
    { value: '3', label: 'Médio', cor: 'text-yellow-400 bg-yellow-500/20' },
    { value: '4', label: 'Difícil', cor: 'text-orange-400 bg-orange-500/20' },
    { value: '5', label: 'Muito Difícil', cor: 'text-red-400 bg-red-500/20' }
  ]

  // Carregar disciplinas e bancas
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

      if (assuntosData) setAssuntos(assuntosData)

      const { data: bancasData } = await supabase
        .from('questoes_med')
        .select('banca')
        .not('banca', 'is', null)

      if (bancasData) {
        const unique = [...new Set(bancasData.map(b => b.banca).filter(Boolean))]
        setBancas(unique as string[])
      }
    }
    loadMeta()
  }, [])

  // Filtrar assuntos baseado nas disciplinas selecionadas
  const assuntosFiltrados = disciplinasSelecionadas.length > 0
    ? assuntos.filter(a => disciplinasSelecionadas.includes(a.disciplina_id))
    : assuntos

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
      if (dificuldadesSelecionadas.length > 0) {
        params.set('dificuldades', dificuldadesSelecionadas.join(','))
      }
      if (naoRespondidas) params.set('naoRespondidas', 'true')
      if (erradas) params.set('erradas', 'true')

      const response = await fetch(`/api/medicina/questoes?${params}`)
      const data = await response.json()

      const questoesData = data.questoes || []
      setQuestoes(questoesData)
      setTotal(data.total || 0)

      // Expandir todas as questões por padrão
      setQuestoesExpandidas(new Set(questoesData.map((q: Questao) => q.id)))

      // Carregar respostas anteriores do usuário
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
      console.error('Erro ao buscar questões:', error)
    } finally {
      setLoading(false)
    }
  }, [user, disciplinasSelecionadas, assuntosSelecionados, bancasSelecionadas, anosSelecionados, dificuldadesSelecionadas, naoRespondidas, erradas, page])

  const limparFiltros = () => {
    setDisciplinasSelecionadas([])
    setAssuntosSelecionados([])
    setBancasSelecionadas([])
    setAnosSelecionados([])
    setDificuldadesSelecionadas([])
    setNaoRespondidas(false)
    setErradas(false)
    setPage(0)
  }

  const temFiltrosAtivos =
    disciplinasSelecionadas.length > 0 ||
    assuntosSelecionados.length > 0 ||
    bancasSelecionadas.length > 0 ||
    anosSelecionados.length > 0 ||
    dificuldadesSelecionadas.length > 0 ||
    naoRespondidas ||
    erradas

  // Toggle seleção
  const toggleSelecao = (array: string[], setArray: (arr: string[]) => void, value: string) => {
    if (array.includes(value)) {
      setArray(array.filter(v => v !== value))
    } else {
      setArray([...array, value])
    }
  }

  // Responder questão
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

  // Limite de questões
  const questoesUsadas = limites?.questoes_dia || 0
  const questoesLimite = limitesPlano.questoes_dia
  const podeResponder = questoesLimite === -1 || questoesUsadas < questoesLimite

  const getDificuldadeInfo = (nivel: number) => {
    return dificuldades.find(d => d.value === String(nivel)) || dificuldades[2]
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
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
            <Target className="w-5 h-5 text-emerald-400" />
            <span className="text-white/80">
              {questoesUsadas} / {questoesLimite === -1 ? '∞' : questoesLimite} hoje
            </span>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>
      </div>

      {/* Painel de Filtros */}
      {showFilters && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Filtros</h3>
            <div className="flex items-center gap-3">
              {temFiltrosAtivos && (
                <button
                  onClick={limparFiltros}
                  className="text-white/60 text-sm hover:text-white flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Disciplinas - Multi-select */}
          <div className="mb-6">
            <label className="block text-white/60 text-sm mb-3">Disciplinas</label>
            <div className="flex flex-wrap gap-2">
              {disciplinas.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    toggleSelecao(disciplinasSelecionadas, setDisciplinasSelecionadas, d.id)
                    // Limpar assuntos que não pertencem mais às disciplinas selecionadas
                    if (disciplinasSelecionadas.includes(d.id)) {
                      setAssuntosSelecionados(prev =>
                        prev.filter(aId => {
                          const assunto = assuntos.find(a => a.id === aId)
                          return assunto && disciplinasSelecionadas.filter(id => id !== d.id).includes(assunto.disciplina_id)
                        })
                      )
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    disciplinasSelecionadas.includes(d.id)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {d.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Assuntos - Multi-select */}
          {assuntosFiltrados.length > 0 && (
            <div className="mb-6">
              <label className="block text-white/60 text-sm mb-3">
                Assuntos {disciplinasSelecionadas.length > 0 && `(${assuntosFiltrados.length} disponiveis)`}
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {assuntosFiltrados.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => toggleSelecao(assuntosSelecionados, setAssuntosSelecionados, a.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      assuntosSelecionados.includes(a.id)
                        ? 'bg-teal-500 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {a.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Segunda linha de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Bancas */}
            <div>
              <label className="block text-white/60 text-sm mb-3">Bancas</label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {bancas.map((b) => (
                  <button
                    key={b}
                    onClick={() => toggleSelecao(bancasSelecionadas, setBancasSelecionadas, b)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      bancasSelecionadas.includes(b)
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Anos */}
            <div>
              <label className="block text-white/60 text-sm mb-3">Anos</label>
              <div className="flex flex-wrap gap-2">
                {anos.map((ano) => (
                  <button
                    key={ano}
                    onClick={() => toggleSelecao(anosSelecionados, setAnosSelecionados, String(ano))}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      anosSelecionados.includes(String(ano))
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {ano}
                  </button>
                ))}
              </div>
            </div>

            {/* Dificuldades */}
            <div>
              <label className="block text-white/60 text-sm mb-3">Dificuldade</label>
              <div className="flex flex-wrap gap-2">
                {dificuldades.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => toggleSelecao(dificuldadesSelecionadas, setDificuldadesSelecionadas, d.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      dificuldadesSelecionadas.includes(d.value)
                        ? d.cor
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filtros extras */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={naoRespondidas}
                onChange={(e) => {
                  setNaoRespondidas(e.target.checked)
                  if (e.target.checked) setErradas(false)
                }}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-white/80 text-sm">Apenas nao respondidas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={erradas}
                onChange={(e) => {
                  setErradas(e.target.checked)
                  if (e.target.checked) setNaoRespondidas(false)
                }}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-white/80 text-sm">Apenas erradas</span>
            </label>
          </div>

          {/* Botao Buscar */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <p className="text-white/40 text-sm">
              {temFiltrosAtivos
                ? `${disciplinasSelecionadas.length} disciplinas, ${assuntosSelecionados.length} assuntos selecionados`
                : 'Nenhum filtro selecionado - todas as questoes'}
            </p>
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
        <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
          <Search className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Pronto para estudar?</h3>
          <p className="text-white/60 mb-4">
            Selecione os filtros acima e clique em &quot;Buscar Questoes&quot; para comecar
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : questoes.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
          <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhuma questao encontrada</h3>
          <p className="text-white/60 mb-4">Tente ajustar os filtros ou limpar a busca</p>
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
            <p className="text-white/60">
              {total} questoes encontradas
            </p>
          </div>

          {/* Lista de Questoes Expandidas */}
          {questoes.map((questao, index) => {
            const dificuldade = getDificuldadeInfo(questao.dificuldade)
            const jaRespondeu = questoesRespondidas.has(questao.id)
            const respostaAnterior = respostasUsuario[questao.id]
            const respostaSelecionada = respostasSelecionadas[questao.id]
            const isExpandida = questoesExpandidas.has(questao.id)

            return (
              <div
                key={questao.id}
                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
              >
                {/* Header da Questao */}
                <div className="p-5 border-b border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
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
                          <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                            {questao.banca} {questao.ano && `${questao.ano}`}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${dificuldade.cor}`}>
                          {dificuldade.label}
                        </span>
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
                      <p className="text-white/90 whitespace-pre-wrap">
                        {questao.enunciado}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botao Compartilhar */}
                      <div className="relative">
                        <button
                          onClick={() => setShareMenuAberto(shareMenuAberto === questao.id ? null : questao.id)}
                          className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>

                        {shareMenuAberto === questao.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-10">
                            <button
                              onClick={() => copiarLink(questao.id)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-white/80 hover:bg-white/5 transition-colors"
                            >
                              <Link2 className="w-4 h-4" />
                              {copiado ? 'Link copiado!' : 'Copiar link'}
                            </button>
                            <Link
                              href={`/medicina/dashboard/forum/novo?questaoId=${questao.id}`}
                              className="w-full flex items-center gap-2 px-4 py-3 text-white/80 hover:bg-white/5 transition-colors"
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
                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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

                            let bgClass = 'bg-white/5 hover:bg-white/10 border-white/10'
                            if (mostrarResultado) {
                              if (isCorreta) {
                                bgClass = 'bg-green-500/20 border-green-500/50'
                              } else if (isSelected && !isCorreta) {
                                bgClass = 'bg-red-500/20 border-red-500/50'
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
                                  mostrarResultado && isCorreta
                                    ? 'bg-green-500 text-white'
                                    : mostrarResultado && isSelected && !isCorreta
                                    ? 'bg-red-500 text-white'
                                    : isSelected
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white/10 text-white/60'
                                }`}>
                                  {alt.letra}
                                </span>
                                <span className="text-white/80 text-left flex-1">{alt.texto}</span>
                                {mostrarResultado && isCorreta && (
                                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                                )}
                                {mostrarResultado && isSelected && !isCorreta && (
                                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
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

                        {/* Comentario/Explicacao */}
                        {jaRespondeu && (questao.explicacao || questao.comentario_ia) && (
                          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <h5 className="text-blue-400 font-medium mb-2">Explicacao:</h5>
                            <p className="text-white/80 whitespace-pre-wrap">{questao.explicacao || questao.comentario_ia}</p>
                          </div>
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
                className="px-4 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-white/60">
                Pagina {page + 1} de {Math.ceil(total / pageSize)}
              </span>
              <button
                onClick={() => {
                  setPage(page + 1)
                  buscarQuestoes()
                }}
                disabled={(page + 1) * pageSize >= total}
                className="px-4 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
