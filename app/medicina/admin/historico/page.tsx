'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  History,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen
} from 'lucide-react'

interface Alternativa {
  letra: string
  texto: string
  correta?: boolean
}

interface QuestaoRecente {
  id: string
  enunciado: string
  tipo_questao?: string
  alternativas?: Alternativa[]
  resposta_correta?: string
  gabarito_comentado?: string
  referencia_abnt?: string
  periodo_dificuldade?: number
  created_at: string
  disciplina_nome?: string
  assunto_nome?: string
}

interface LogGeracao {
  id: string
  created_at: string
  quantidade: number
  status: 'iniciado' | 'concluido' | 'erro' | 'parcial'
  disciplina_id: string
  assunto_id?: string
  periodo?: number
  modelo_ia?: string
  erro?: string
  tempo_total_ms?: number
  questoes_sucesso?: number
  questoes_erro?: number
  disciplina_nome?: string
  assunto_nome?: string
}

export default function AdminHistoricoPage() {
  const [logs, setLogs] = useState<LogGeracao[]>([])
  const [questoesRecentes, setQuestoesRecentes] = useState<QuestaoRecente[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingQuestoes, setLoadingQuestoes] = useState(true)
  const [filtros, setFiltros] = useState({
    status: '',
    periodo: ''
  })
  const [stats, setStats] = useState({
    total: 0,
    sucesso: 0,
    erro: 0,
    questoesGeradas: 0
  })
  const [abaAtiva, setAbaAtiva] = useState<'logs' | 'questoes'>('questoes')
  const [expandedQuestao, setExpandedQuestao] = useState<string | null>(null)

  useEffect(() => {
    loadLogs()
    loadQuestoesRecentes()
  }, [filtros])

  async function loadQuestoesRecentes() {
    setLoadingQuestoes(true)

    const { data, error } = await supabase
      .from('questoes_med')
      .select(`
        id,
        enunciado,
        tipo_questao,
        alternativas,
        resposta_correta,
        gabarito_comentado,
        referencia_abnt,
        periodo_dificuldade,
        created_at,
        disciplinas_med(nome),
        assuntos_med(nome)
      `)
      .eq('gerado_por_ia', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      const questoesFormatadas = data.map((q: Record<string, unknown>) => ({
        id: q.id as string,
        enunciado: q.enunciado as string,
        tipo_questao: q.tipo_questao as string | undefined,
        alternativas: q.alternativas as Alternativa[] | undefined,
        resposta_correta: q.resposta_correta as string | undefined,
        gabarito_comentado: q.gabarito_comentado as string | undefined,
        referencia_abnt: q.referencia_abnt as string | undefined,
        periodo_dificuldade: q.periodo_dificuldade as number | undefined,
        created_at: q.created_at as string,
        disciplina_nome: (q.disciplinas_med as { nome: string } | null)?.nome,
        assunto_nome: (q.assuntos_med as { nome: string } | null)?.nome
      }))
      setQuestoesRecentes(questoesFormatadas)
    }

    setLoadingQuestoes(false)
  }

  async function loadLogs() {
    setLoading(true)

    let query = supabase
      .from('admin_geracao_logs_med')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (filtros.status) {
      query = query.eq('status', filtros.status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao carregar logs:', error)
      setLoading(false)
      return
    }

    // Buscar nomes das disciplinas e assuntos
    const disciplinaIds = [...new Set((data || []).map(l => l.disciplina_id).filter(Boolean))]
    const assuntoIds = [...new Set((data || []).map(l => l.assunto_id).filter(Boolean))]

    const disciplinasMap: Record<string, string> = {}
    const assuntosMap: Record<string, string> = {}

    if (disciplinaIds.length > 0) {
      const { data: disciplinas } = await supabase
        .from('disciplinas_med')
        .select('id, nome')
        .in('id', disciplinaIds)

      disciplinas?.forEach(d => {
        disciplinasMap[d.id] = d.nome
      })
    }

    if (assuntoIds.length > 0) {
      const { data: assuntos } = await supabase
        .from('assuntos_med')
        .select('id, nome')
        .in('id', assuntoIds)

      assuntos?.forEach(a => {
        assuntosMap[a.id] = a.nome
      })
    }

    const logsComNomes = (data || []).map(log => ({
      ...log,
      disciplina_nome: log.disciplina_id ? disciplinasMap[log.disciplina_id] : undefined,
      assunto_nome: log.assunto_id ? assuntosMap[log.assunto_id] : undefined
    }))

    setLogs(logsComNomes)

    // Calcular estatísticas
    const totalLogs = logsComNomes.length
    const sucesso = logsComNomes.filter(l => l.status === 'concluido').length
    const erro = logsComNomes.filter(l => l.status === 'erro').length
    const questoesGeradas = logsComNomes.reduce((acc, l) => acc + (l.questoes_sucesso || l.quantidade || 0), 0)

    setStats({
      total: totalLogs,
      sucesso,
      erro,
      questoesGeradas
    })

    setLoading(false)
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'concluido':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'erro':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'iniciado':
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-amber-400" />
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'concluido':
        return 'Concluído'
      case 'erro':
        return 'Erro'
      case 'iniciado':
        return 'Em andamento'
      case 'parcial':
        return 'Parcial'
      default:
        return status
    }
  }

  function formatDuration(ms?: number) {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`
  }

  if (loading && loadingQuestoes) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <History className="w-8 h-8 text-amber-400" />
          Histórico de Gerações
        </h1>
        <p className="text-white/60 mt-1">
          Acompanhe todas as gerações de questões realizadas
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-white/10 pb-1">
        <button
          onClick={() => setAbaAtiva('questoes')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            abaAtiva === 'questoes'
              ? 'bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-500'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Questões Geradas ({questoesRecentes.length})
          </span>
        </button>
        <button
          onClick={() => setAbaAtiva('logs')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            abaAtiva === 'logs'
              ? 'bg-amber-500/20 text-amber-400 border-b-2 border-amber-500'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Logs de Geração ({logs.length})
          </span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="text-white/60 text-sm">Total de Lotes</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-white/60 text-sm">Sucesso</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.sucesso}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-white/60 text-sm">Erros</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.erro}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span className="text-white/60 text-sm">Questões Geradas</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.questoesGeradas.toLocaleString()}</p>
        </div>
      </div>

      {/* Conteúdo baseado na aba ativa */}
      {abaAtiva === 'questoes' ? (
        /* Lista de Questões Geradas */
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {loadingQuestoes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : questoesRecentes.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Nenhuma questão gerada por IA encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {questoesRecentes.map((questao) => (
                <div key={questao.id} className="hover:bg-white/5 transition-colors">
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedQuestao(expandedQuestao === questao.id ? null : questao.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-white text-sm mb-2 ${expandedQuestao === questao.id ? '' : 'line-clamp-2'}`}>
                          {questao.enunciado}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {questao.disciplina_nome && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                              {questao.disciplina_nome}
                            </span>
                          )}
                          {questao.assunto_nome && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                              {questao.assunto_nome}
                            </span>
                          )}
                          {questao.periodo_dificuldade && (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">
                              {questao.periodo_dificuldade}º período
                            </span>
                          )}
                          <span className="text-white/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(questao.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-white/40">
                        {expandedQuestao === questao.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes expandidos */}
                  {expandedQuestao === questao.id && (
                    <div className="px-4 pb-4 border-t border-white/10 bg-white/5">
                      <div className="pt-4 space-y-4">
                        {/* Alternativas */}
                        {questao.alternativas && questao.alternativas.length > 0 && (
                          <div>
                            <h4 className="text-white/60 text-sm font-medium mb-2">Alternativas:</h4>
                            <div className="space-y-2">
                              {questao.alternativas.map((alt, idx) => (
                                <div
                                  key={idx}
                                  className={`p-3 rounded-lg ${
                                    alt.correta || alt.letra === questao.resposta_correta
                                      ? 'bg-green-500/20 border border-green-500/30'
                                      : 'bg-white/5 border border-white/10'
                                  }`}
                                >
                                  <span className={`font-bold ${
                                    alt.correta || alt.letra === questao.resposta_correta
                                      ? 'text-green-400'
                                      : 'text-white/60'
                                  }`}>
                                    {alt.letra})
                                  </span>
                                  <span className="text-white ml-2">{alt.texto}</span>
                                  {(alt.correta || alt.letra === questao.resposta_correta) && (
                                    <span className="ml-2 text-xs text-green-400">(Correta)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Gabarito Comentado */}
                        {questao.gabarito_comentado && (
                          <div>
                            <h4 className="text-white/60 text-sm font-medium mb-2 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              Gabarito Comentado:
                            </h4>
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-white/10">
                              <p className="text-white/90 whitespace-pre-wrap text-sm leading-relaxed">
                                {questao.gabarito_comentado}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Referência ABNT */}
                        {questao.referencia_abnt && (
                          <div>
                            <h4 className="text-white/60 text-sm font-medium mb-2">Referência (ABNT):</h4>
                            <p className="text-cyan-300 text-sm italic">
                              {questao.referencia_abnt}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Aba de Logs */
        <>
          {/* Filtros */}
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <select
                value={filtros.status}
                onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                className="appearance-none px-4 py-2 pl-10 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500 cursor-pointer min-w-[150px]"
              >
                <option value="">Todos status</option>
                <option value="concluido">Concluído</option>
                <option value="erro">Erro</option>
                <option value="iniciado">Em andamento</option>
                <option value="parcial">Parcial</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>

          {/* Lista de Logs */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">Nenhum registro encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className="mt-1">
                        {getStatusIcon(log.status)}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-white font-medium">
                            {log.disciplina_nome || 'Disciplina não identificada'}
                          </span>
                          {log.assunto_nome && (
                            <>
                              <span className="text-white/30">›</span>
                              <span className="text-white/70 text-sm">{log.assunto_nome}</span>
                            </>
                          )}
                          {log.periodo && (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-xs">
                              {log.periodo}º período
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/40">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(log.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>

                          {log.tempo_total_ms && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDuration(log.tempo_total_ms)}
                            </span>
                          )}

                          {log.modelo_ia && (
                            <span className="text-cyan-400/70">
                              {log.modelo_ia}
                            </span>
                          )}
                        </div>

                        {log.erro && (
                          <p className="mt-2 text-red-400 text-sm bg-red-500/10 p-2 rounded">
                            {log.erro}
                          </p>
                        )}
                      </div>

                      {/* Stats do lote */}
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${log.status === 'concluido' ? 'bg-green-500/20 text-green-300' :
                            log.status === 'erro' ? 'bg-red-500/20 text-red-300' :
                              log.status === 'iniciado' ? 'bg-cyan-500/20 text-cyan-300' :
                                'bg-amber-500/20 text-amber-300'
                          }`}>
                          {getStatusLabel(log.status)}
                        </span>
                        <p className="text-white mt-1 text-lg font-bold">
                          {log.questoes_sucesso || log.quantidade || 0}
                        </p>
                        <p className="text-white/40 text-xs">questões</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
