'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  FileText,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Sparkles,
  AlertTriangle,
  BookOpen,
  Clock
} from 'lucide-react'

interface Questao {
  id: string
  enunciado: string
  disciplina_id: string
  assunto_id: string
  subassunto_id?: string
  dificuldade: string
  periodo_dificuldade?: number
  gerado_por_ia: boolean
  revisado: boolean
  created_at: string
  disciplinas_med?: { nome: string }
  assuntos_med?: { nome: string }
}

interface Disciplina {
  id: string
  nome: string
}

export default function AdminQuestoesPage() {
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    busca: '',
    disciplina: '',
    geradoIA: '',
    revisado: '',
    periodo: ''
  })
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [total, setTotal] = useState(0)
  const porPagina = 20

  useEffect(() => {
    loadDisciplinas()
  }, [])

  useEffect(() => {
    loadQuestoes()
  }, [filtros, paginaAtual])

  async function loadDisciplinas() {
        const { data } = await supabase
      .from('disciplinas_med')
      .select('id, nome')
      .order('nome')

    setDisciplinas(data || [])
  }

  async function loadQuestoes() {
    setLoading(true)
    
    let query = supabase
      .from('questoes_med')
      .select(`
        id,
        enunciado,
        disciplina_id,
        assunto_id,
        subassunto_id,
        dificuldade,
        periodo_dificuldade,
        gerado_por_ia,
        revisado,
        created_at,
        disciplinas_med(nome),
        assuntos_med(nome)
      `, { count: 'exact' })

    // Aplicar filtros
    if (filtros.busca) {
      query = query.ilike('enunciado', `%${filtros.busca}%`)
    }
    if (filtros.disciplina) {
      query = query.eq('disciplina_id', filtros.disciplina)
    }
    if (filtros.geradoIA === 'sim') {
      query = query.eq('gerado_por_ia', true)
    } else if (filtros.geradoIA === 'nao') {
      query = query.eq('gerado_por_ia', false)
    }
    if (filtros.revisado === 'sim') {
      query = query.eq('revisado', true)
    } else if (filtros.revisado === 'nao') {
      query = query.eq('revisado', false)
    }
    if (filtros.periodo) {
      query = query.eq('periodo_dificuldade', parseInt(filtros.periodo))
    }

    // Paginação
    const from = (paginaAtual - 1) * porPagina
    const to = from + porPagina - 1

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Erro ao carregar questões:', error)
    } else {
      setQuestoes(data || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }

  async function toggleRevisado(id: string, atual: boolean) {
        const { error } = await supabase
      .from('questoes_med')
      .update({ revisado: !atual })
      .eq('id', id)

    if (!error) {
      setQuestoes(prev => prev.map(q =>
        q.id === id ? { ...q, revisado: !atual } : q
      ))
    }
  }

  async function deleteQuestao(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta questão?')) return

        const { error } = await supabase
      .from('questoes_med')
      .delete()
      .eq('id', id)

    if (!error) {
      setQuestoes(prev => prev.filter(q => q.id !== id))
      setTotal(prev => prev - 1)
    }
  }

  const totalPaginas = Math.ceil(total / porPagina)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            Gerenciar Questões
          </h1>
          <p className="text-white/60 mt-1">
            {total.toLocaleString()} questões cadastradas
          </p>
        </div>
        <Link
          href="/medicina/admin/questoes/gerar"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all"
        >
          <Sparkles className="w-5 h-5" />
          Gerar Novas
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-white/60" />
          <span className="text-white font-medium">Filtros</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Buscar no enunciado..."
                value={filtros.busca}
                onChange={(e) => {
                  setFiltros(prev => ({ ...prev, busca: e.target.value }))
                  setPaginaAtual(1)
                }}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Disciplina */}
          <div className="relative">
            <select
              value={filtros.disciplina}
              onChange={(e) => {
                setFiltros(prev => ({ ...prev, disciplina: e.target.value }))
                setPaginaAtual(1)
              }}
              className="w-full appearance-none px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="">Todas disciplinas</option>
              {disciplinas.map(d => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>

          {/* Gerado por IA */}
          <div className="relative">
            <select
              value={filtros.geradoIA}
              onChange={(e) => {
                setFiltros(prev => ({ ...prev, geradoIA: e.target.value }))
                setPaginaAtual(1)
              }}
              className="w-full appearance-none px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="">IA: Todos</option>
              <option value="sim">Gerado por IA</option>
              <option value="nao">Manual</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>

          {/* Revisado */}
          <div className="relative">
            <select
              value={filtros.revisado}
              onChange={(e) => {
                setFiltros(prev => ({ ...prev, revisado: e.target.value }))
                setPaginaAtual(1)
              }}
              className="w-full appearance-none px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="">Revisão: Todos</option>
              <option value="sim">Revisadas</option>
              <option value="nao">Pendentes</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Lista de Questões */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : questoes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">Nenhuma questão encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {questoes.map((questao) => (
              <div key={questao.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Status indicators */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    {questao.gerado_por_ia && (
                      <span title="Gerado por IA" className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      </span>
                    )}
                    {questao.revisado ? (
                      <span title="Revisada" className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      </span>
                    ) : (
                      <span title="Pendente revisão" className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      </span>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm line-clamp-2 mb-2">
                      {questao.enunciado}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                        {(questao.disciplinas_med as { nome: string } | null)?.nome || 'Sem disciplina'}
                      </span>
                      {(questao.assuntos_med as { nome: string } | null)?.nome && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                          {(questao.assuntos_med as { nome: string } | null)?.nome}
                        </span>
                      )}
                      {questao.periodo_dificuldade && (
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">
                          {questao.periodo_dificuldade}º período
                        </span>
                      )}
                      <span className="text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(questao.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRevisado(questao.id, questao.revisado)}
                      className={`p-2 rounded-lg transition-colors ${
                        questao.revisado
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                      title={questao.revisado ? 'Marcar como pendente' : 'Marcar como revisada'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteQuestao(questao.id)}
                      className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-white/60 text-sm">
              Mostrando {((paginaAtual - 1) * porPagina) + 1} a {Math.min(paginaAtual * porPagina, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                disabled={paginaAtual === 1}
                className="px-3 py-1 bg-white/5 text-white rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-white/60 text-sm">
                {paginaAtual} / {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                disabled={paginaAtual === totalPaginas}
                className="px-3 py-1 bg-white/5 text-white rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
