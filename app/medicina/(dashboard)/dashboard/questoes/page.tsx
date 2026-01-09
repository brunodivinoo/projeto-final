'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { supabase } from '@/lib/supabase'
import {
  FileText,
  Filter,
  Search,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  BookOpen,
  ChevronDown,
  X,
  RefreshCw
} from 'lucide-react'

interface Questao {
  id: string
  enunciado: string
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

interface Filtros {
  disciplinaId: string
  assuntoId: string
  banca: string
  ano: string
  dificuldade: string
  naoRespondidas: boolean
  erradas: boolean
}

export default function QuestoesPage() {
  const { user, limitesPlano, limites } = useMedAuth()
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [assuntos, setAssuntos] = useState<{ id: string, nome: string }[]>([])
  const [bancas, setBancas] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 20

  const [filtros, setFiltros] = useState<Filtros>({
    disciplinaId: '',
    assuntoId: '',
    banca: '',
    ano: '',
    dificuldade: '',
    naoRespondidas: false,
    erradas: false
  })

  // Carregar disciplinas e bancas
  useEffect(() => {
    const loadMeta = async () => {
      // Disciplinas
      const { data: discs } = await supabase
        .from('disciplinas_med')
        .select('id, nome')
        .order('nome')

      if (discs) setDisciplinas(discs)

      // Bancas únicas
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

  // Carregar assuntos quando disciplina muda
  useEffect(() => {
    const loadAssuntos = async () => {
      if (!filtros.disciplinaId) {
        setAssuntos([])
        return
      }

      const { data } = await supabase
        .from('assuntos_med')
        .select('id, nome')
        .eq('disciplina_id', filtros.disciplinaId)
        .order('nome')

      if (data) setAssuntos(data)
    }
    loadAssuntos()
  }, [filtros.disciplinaId])

  const fetchQuestoes = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.set('userId', user.id)
      params.set('limit', pageSize.toString())
      params.set('offset', (page * pageSize).toString())

      if (filtros.disciplinaId) params.set('disciplinaId', filtros.disciplinaId)
      if (filtros.assuntoId) params.set('assuntoId', filtros.assuntoId)
      if (filtros.banca) params.set('banca', filtros.banca)
      if (filtros.ano) params.set('ano', filtros.ano)
      if (filtros.dificuldade) params.set('dificuldade', filtros.dificuldade)
      if (filtros.naoRespondidas) params.set('naoRespondidas', 'true')
      if (filtros.erradas) params.set('erradas', 'true')

      const response = await fetch(`/api/medicina/questoes?${params}`)
      const data = await response.json()

      setQuestoes(data.questoes || [])
      setTotal(data.total || 0)

    } catch (error) {
      console.error('Erro ao buscar questões:', error)
    } finally {
      setLoading(false)
    }
  }, [user, filtros, page])

  useEffect(() => {
    fetchQuestoes()
  }, [fetchQuestoes])

  const limparFiltros = () => {
    setFiltros({
      disciplinaId: '',
      assuntoId: '',
      banca: '',
      ano: '',
      dificuldade: '',
      naoRespondidas: false,
      erradas: false
    })
    setPage(0)
  }

  const temFiltrosAtivos = Object.entries(filtros).some(([key, value]) => {
    if (typeof value === 'boolean') return value
    return value !== ''
  })

  // Calcular questões restantes
  const questoesUsadas = limites?.questoes_dia || 0
  const questoesLimite = limitesPlano.questoes_dia
  const podeResponder = questoesLimite === -1 || questoesUsadas < questoesLimite

  const getDificuldadeLabel = (nivel: number) => {
    switch (nivel) {
      case 1: return { label: 'Muito Fácil', cor: 'text-green-400' }
      case 2: return { label: 'Fácil', cor: 'text-emerald-400' }
      case 3: return { label: 'Médio', cor: 'text-yellow-400' }
      case 4: return { label: 'Difícil', cor: 'text-orange-400' }
      case 5: return { label: 'Muito Difícil', cor: 'text-red-400' }
      default: return { label: 'Médio', cor: 'text-yellow-400' }
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Banco de Questões
          </h1>
          <p className="text-emerald-200/70 mt-1">
            {total.toLocaleString()} questões disponíveis
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Limite de questões */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
            <Target className="w-5 h-5 text-emerald-400" />
            <span className="text-white/80">
              {questoesUsadas} / {questoesLimite === -1 ? '∞' : questoesLimite} hoje
            </span>
          </div>

          {/* Botão de Filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              temFiltrosAtivos
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
            {temFiltrosAtivos && (
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Painel de Filtros */}
      {showFilters && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Filtros</h3>
            {temFiltrosAtivos && (
              <button
                onClick={limparFiltros}
                className="text-emerald-400 text-sm hover:underline flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Disciplina */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Disciplina</label>
              <select
                value={filtros.disciplinaId}
                onChange={(e) => setFiltros({ ...filtros, disciplinaId: e.target.value, assuntoId: '' })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" className="bg-slate-800">Todas</option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-800">{d.nome}</option>
                ))}
              </select>
            </div>

            {/* Assunto */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Assunto</label>
              <select
                value={filtros.assuntoId}
                onChange={(e) => setFiltros({ ...filtros, assuntoId: e.target.value })}
                disabled={!filtros.disciplinaId}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <option value="" className="bg-slate-800">Todos</option>
                {assuntos.map((a) => (
                  <option key={a.id} value={a.id} className="bg-slate-800">{a.nome}</option>
                ))}
              </select>
            </div>

            {/* Banca */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Banca</label>
              <select
                value={filtros.banca}
                onChange={(e) => setFiltros({ ...filtros, banca: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" className="bg-slate-800">Todas</option>
                {bancas.map((b) => (
                  <option key={b} value={b} className="bg-slate-800">{b}</option>
                ))}
              </select>
            </div>

            {/* Ano */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Ano</label>
              <select
                value={filtros.ano}
                onChange={(e) => setFiltros({ ...filtros, ano: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" className="bg-slate-800">Todos</option>
                {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map((ano) => (
                  <option key={ano} value={ano} className="bg-slate-800">{ano}</option>
                ))}
              </select>
            </div>

            {/* Dificuldade */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Dificuldade</label>
              <select
                value={filtros.dificuldade}
                onChange={(e) => setFiltros({ ...filtros, dificuldade: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" className="bg-slate-800">Todas</option>
                <option value="1" className="bg-slate-800">Muito Fácil</option>
                <option value="2" className="bg-slate-800">Fácil</option>
                <option value="3" className="bg-slate-800">Médio</option>
                <option value="4" className="bg-slate-800">Difícil</option>
                <option value="5" className="bg-slate-800">Muito Difícil</option>
              </select>
            </div>

            {/* Checkbox Filters */}
            <div className="flex flex-col justify-end gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.naoRespondidas}
                  onChange={(e) => setFiltros({ ...filtros, naoRespondidas: e.target.checked, erradas: false })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-white/80 text-sm">Apenas não respondidas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.erradas}
                  onChange={(e) => setFiltros({ ...filtros, erradas: e.target.checked, naoRespondidas: false })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-white/80 text-sm">Apenas erradas</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Questões */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : questoes.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
          <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhuma questão encontrada</h3>
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
          {questoes.map((questao) => {
            const dificuldade = getDificuldadeLabel(questao.dificuldade)

            return (
              <Link
                key={questao.id}
                href={podeResponder ? `/medicina/dashboard/questoes/${questao.id}` : '#'}
                className={`block bg-white/5 rounded-xl p-5 border border-white/10 transition-all ${
                  podeResponder
                    ? 'hover:bg-white/10 hover:border-white/20 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={(e) => !podeResponder && e.preventDefault()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
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
                          {questao.banca} {questao.ano && `• ${questao.ano}`}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${dificuldade.cor} bg-white/5`}>
                        {dificuldade.label}
                      </span>
                    </div>

                    {/* Enunciado */}
                    <p className="text-white/80 line-clamp-2">
                      {questao.enunciado}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0 mt-2" />
                </div>
              </Link>
            )
          })}

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-white/60">
                Página {page + 1} de {Math.ceil(total / pageSize)}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * pageSize >= total}
                className="px-4 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}

      {/* Warning de limite */}
      {!podeResponder && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-amber-500/90 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <Clock className="w-5 h-5" />
          <span>Você atingiu o limite de questões diárias.</span>
          <Link href="/medicina/dashboard/assinatura" className="font-semibold underline">
            Fazer upgrade
          </Link>
        </div>
      )}
    </div>
  )
}
