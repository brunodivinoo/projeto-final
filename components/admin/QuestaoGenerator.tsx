'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Loader2,
  BookOpen,
  Layers,
  GraduationCap,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  FileText
} from 'lucide-react'
import { PERIODOS_OPCOES } from '@/lib/admin/periodos'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { SugestaoConteudoIA } from './SugestaoConteudoIA'

interface Disciplina {
  id: string
  nome: string
}

interface Assunto {
  id: string
  nome: string
  disciplina_id: string
}

interface SubAssunto {
  id: string
  nome: string
  assunto_id: string
}

interface LogEntry {
  type: 'inicio' | 'gerando' | 'sucesso' | 'erro' | 'aviso' | 'concluido'
  message?: string
  questao_id?: string
  enunciado_preview?: string
  tempo_ms?: number
  tokens?: number
  total_geradas?: number
  total_erros?: number
  total_estimado?: number
  erro?: string
  disciplina?: string
  assunto?: string
  sub_assunto?: string
  periodo?: number
  numero?: number
}

interface QuestaoGerada {
  id: string
  preview: string
}

export function QuestaoGenerator() {
  const { user } = useMedAuth()

  // Estados de dados
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [assuntos, setAssuntos] = useState<Assunto[]>([])
  const [subAssuntos, setSubAssuntos] = useState<SubAssunto[]>([])
  const [loadingDados, setLoadingDados] = useState(true)

  // Estados de seleção
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<string>('')
  const [assuntosSelecionados, setAssuntosSelecionados] = useState<string[]>([])
  const [periodosSelecionados, setPeriodosSelecionados] = useState<number[]>([])
  const [tipoQuestao, setTipoQuestao] = useState<'multipla_escolha' | 'caso_clinico'>('multipla_escolha')
  const [quantidadePorAssunto, setQuantidadePorAssunto] = useState(3)

  // Estados de geração
  const [gerando, setGerando] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [questoesGeradas, setQuestoesGeradas] = useState<QuestaoGerada[]>([])
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 })

  const logsEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Função para carregar disciplinas (reutilizável)
  const carregarDisciplinas = async () => {
    try {
      const res = await fetch('/api/medicina/admin/disciplinas')
      const data = await res.json()
      if (data.disciplinas) {
        setDisciplinas(data.disciplinas)
      }
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error)
    } finally {
      setLoadingDados(false)
    }
  }

  // Função para carregar assuntos (reutilizável)
  const carregarAssuntos = async () => {
    if (!disciplinaSelecionada) return
    try {
      const res = await fetch(`/api/medicina/admin/disciplinas/assuntos?disciplina_id=${disciplinaSelecionada}`)
      const data = await res.json()
      if (data.assuntos) {
        setAssuntos(data.assuntos)
      }
    } catch (error) {
      console.error('Erro ao carregar assuntos:', error)
    }
  }

  // Callback quando conteúdo é criado pela IA
  const handleConteudoCriado = () => {
    carregarDisciplinas()
    if (disciplinaSelecionada) {
      carregarAssuntos()
    }
  }

  // Carregar disciplinas no mount
  useEffect(() => {
    carregarDisciplinas()
  }, [])

  // Carregar assuntos quando disciplina muda
  useEffect(() => {
    if (!disciplinaSelecionada) {
      setAssuntos([])
      setAssuntosSelecionados([])
      return
    }

    carregarAssuntos()
  }, [disciplinaSelecionada])

  // Auto-scroll dos logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const disciplinaAtual = disciplinas.find(d => d.id === disciplinaSelecionada)
  const assuntosFiltrados = assuntos.filter(a => a.disciplina_id === disciplinaSelecionada)

  const totalEstimado = assuntosSelecionados.length * periodosSelecionados.length * quantidadePorAssunto

  const iniciarGeracao = async () => {
    if (!disciplinaSelecionada || assuntosSelecionados.length === 0 || periodosSelecionados.length === 0) {
      alert('Selecione disciplina, assuntos e períodos')
      return
    }

    if (!user?.id) {
      alert('Usuário não autenticado')
      return
    }

    setGerando(true)
    setLogs([])
    setQuestoesGeradas([])
    setProgresso({ atual: 0, total: totalEstimado })
    abortControllerRef.current = new AbortController()

    const assuntosCompletos = assuntosFiltrados
      .filter(a => assuntosSelecionados.includes(a.id))
      .map(a => ({
        id: a.id,
        nome: a.nome,
        sub_assuntos: subAssuntos.filter(s => s.assunto_id === a.id)
      }))

    try {
      const response = await fetch('/api/medicina/admin/questoes/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          disciplina_id: disciplinaSelecionada,
          disciplina_nome: disciplinaAtual?.nome,
          assuntos: assuntosCompletos,
          periodos: periodosSelecionados,
          quantidade_por_assunto: quantidadePorAssunto,
          tipo_questao: tipoQuestao
        }),
        signal: abortControllerRef.current.signal
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value)
          const lines = text.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as LogEntry
                setLogs(prev => [...prev, data])

                if (data.type === 'sucesso' && data.questao_id) {
                  setQuestoesGeradas(prev => [...prev, {
                    id: data.questao_id!,
                    preview: data.enunciado_preview || ''
                  }])
                  setProgresso(prev => ({ ...prev, atual: data.total_geradas || prev.atual + 1 }))
                }

                if (data.type === 'inicio' && data.total_estimado) {
                  setProgresso(prev => ({ ...prev, total: data.total_estimado! }))
                }
              } catch (e) {
                // Ignorar linhas inválidas
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setLogs(prev => [...prev, {
          type: 'erro',
          erro: error.message
        }])
      }
    } finally {
      setGerando(false)
    }
  }

  const pararGeracao = () => {
    abortControllerRef.current?.abort()
    setGerando(false)
    setLogs(prev => [...prev, { type: 'aviso', message: 'Geração interrompida pelo usuário' }])
  }

  const excluirQuestao = async (questaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta questão?')) return

    try {
      const res = await fetch(`/api/medicina/admin/questoes/${questaoId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setQuestoesGeradas(prev => prev.filter(q => q.id !== questaoId))
        setLogs(prev => [...prev, { type: 'aviso', message: `Questão ${questaoId.slice(0, 8)} excluída` }])
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
    }
  }

  const selecionarTodosAssuntos = () => {
    setAssuntosSelecionados(assuntosFiltrados.map(a => a.id))
  }

  const limparSelecaoAssuntos = () => {
    setAssuntosSelecionados([])
  }

  const selecionarTodosPeriodos = () => {
    setPeriodosSelecionados(PERIODOS_OPCOES.map(p => p.value))
  }

  const limparSelecaoPeriodos = () => {
    setPeriodosSelecionados([])
  }

  if (loadingDados) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sugestões com IA - Opus 4.5 */}
      <SugestaoConteudoIA
        disciplinas={disciplinas}
        disciplinaSelecionada={disciplinaSelecionada}
        onConteudoCriado={handleConteudoCriado}
      />

      {/* Configurações */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Configurar Geração de Questões
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Disciplina */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Disciplina</label>
            <select
              value={disciplinaSelecionada}
              onChange={(e) => {
                setDisciplinaSelecionada(e.target.value)
                setAssuntosSelecionados([])
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              disabled={gerando}
            >
              <option value="">Selecione uma disciplina</option>
              {disciplinas.map(d => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Questão */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Tipo de Questão</label>
            <select
              value={tipoQuestao}
              onChange={(e) => setTipoQuestao(e.target.value as 'multipla_escolha' | 'caso_clinico')}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              disabled={gerando}
            >
              <option value="multipla_escolha">Múltipla Escolha</option>
              <option value="caso_clinico">Caso Clínico</option>
            </select>
          </div>

          {/* Assuntos */}
          {disciplinaSelecionada && (
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/70 text-sm">
                  Assuntos ({assuntosSelecionados.length} de {assuntosFiltrados.length} selecionados)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={selecionarTodosAssuntos}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                    disabled={gerando}
                  >
                    Selecionar todos
                  </button>
                  <span className="text-white/30">|</span>
                  <button
                    onClick={limparSelecaoAssuntos}
                    className="text-xs text-white/40 hover:text-white/60"
                    disabled={gerando}
                  >
                    Limpar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-3 bg-white/5 rounded-lg border border-white/10">
                {assuntosFiltrados.length === 0 ? (
                  <p className="text-white/40 text-sm col-span-full">Nenhum assunto cadastrado para esta disciplina</p>
                ) : (
                  assuntosFiltrados.map(a => (
                    <label key={a.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={assuntosSelecionados.includes(a.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssuntosSelecionados(prev => [...prev, a.id])
                          } else {
                            setAssuntosSelecionados(prev => prev.filter(id => id !== a.id))
                          }
                        }}
                        disabled={gerando}
                        className="rounded text-cyan-500 bg-white/10 border-white/20 focus:ring-cyan-500"
                      />
                      <span className="text-white/80 text-sm truncate">{a.nome}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Períodos */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/70 text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Períodos/Níveis ({periodosSelecionados.length} selecionados)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selecionarTodosPeriodos}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                  disabled={gerando}
                >
                  Selecionar todos
                </button>
                <span className="text-white/30">|</span>
                <button
                  onClick={limparSelecaoPeriodos}
                  className="text-xs text-white/40 hover:text-white/60"
                  disabled={gerando}
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {PERIODOS_OPCOES.map(p => (
                <label
                  key={p.value}
                  className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border transition-all ${
                    periodosSelecionados.includes(p.value)
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={periodosSelecionados.includes(p.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPeriodosSelecionados(prev => [...prev, p.value])
                      } else {
                        setPeriodosSelecionados(prev => prev.filter(v => v !== p.value))
                      }
                    }}
                    disabled={gerando}
                    className="rounded text-cyan-500 bg-white/10 border-white/20 focus:ring-cyan-500"
                  />
                  <span className="text-white/80 text-xs">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Questões por Assunto/Período
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={quantidadePorAssunto}
              onChange={(e) => setQuantidadePorAssunto(parseInt(e.target.value) || 1)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              disabled={gerando}
            />
          </div>

          {/* Total estimado */}
          <div className="flex items-end">
            <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20 w-full">
              <p className="text-white/60 text-sm">Total estimado de questões:</p>
              <p className="text-3xl font-bold text-cyan-400">{totalEstimado}</p>
              <p className="text-white/40 text-xs mt-1">
                {assuntosSelecionados.length} assuntos × {periodosSelecionados.length} períodos × {quantidadePorAssunto} questões
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={iniciarGeracao}
            disabled={gerando || !disciplinaSelecionada || assuntosSelecionados.length === 0 || periodosSelecionados.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {gerando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            {gerando ? 'Gerando...' : 'Iniciar Geração'}
          </button>

          {gerando && (
            <button
              onClick={pararGeracao}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 font-semibold rounded-lg hover:bg-red-500/30 transition-all"
            >
              <Square className="w-5 h-5" />
              Parar
            </button>
          )}
        </div>
      </div>

      {/* Barra de Progresso */}
      {(gerando || progresso.atual > 0) && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">Progresso</span>
            <span className="text-cyan-400 font-medium">
              {progresso.atual} / {progresso.total}
            </span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
              style={{ width: `${progresso.total > 0 ? (progresso.atual / progresso.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Logs em Tempo Real */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-green-400" />
          Logs de Geração
        </h2>

        <div className="bg-black/30 rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-white/40">Aguardando início da geração...</p>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 mb-2 ${
                  log.type === 'erro' ? 'text-red-400' :
                  log.type === 'sucesso' ? 'text-green-400' :
                  log.type === 'aviso' ? 'text-yellow-400' :
                  log.type === 'concluido' ? 'text-cyan-400' :
                  'text-white/70'
                }`}
              >
                {log.type === 'sucesso' && <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {log.type === 'erro' && <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {log.type === 'gerando' && <Loader2 className="w-4 h-4 mt-0.5 animate-spin flex-shrink-0" />}
                {log.type === 'aviso' && <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}

                <span className="break-words">
                  {log.type === 'inicio' && `🚀 ${log.message} (${log.total_estimado} questões)`}
                  {log.type === 'gerando' && `⏳ Gerando: ${log.assunto} (${log.periodo}º período) - #${log.numero}`}
                  {log.type === 'sucesso' && `✅ Questão #${log.total_geradas} criada (${log.tempo_ms}ms, ${log.tokens} tokens)`}
                  {log.type === 'erro' && `❌ Erro: ${log.erro}`}
                  {log.type === 'aviso' && `⚠️ ${log.message}`}
                  {log.type === 'concluido' && `🎉 ${log.message}`}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Questões Geradas */}
      {questoesGeradas.length > 0 && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Questões Geradas ({questoesGeradas.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {questoesGeradas.map((q, i) => (
              <div key={q.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                <span className="text-white/80 text-sm truncate flex-1 mr-4">
                  <span className="text-cyan-400 font-medium">#{i + 1}</span> - {q.preview}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => window.open(`/medicina/admin/questoes/${q.id}`, '_blank')}
                    className="p-2 text-white/40 hover:text-cyan-400 transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => excluirQuestao(q.id)}
                    className="p-2 text-white/40 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
