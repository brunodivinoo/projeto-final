'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  BarChart3,
  AlertTriangle,
  Trophy,
  RefreshCw
} from 'lucide-react'

interface Questao {
  id: string
  enunciado: string
  alternativas: { letra: string, texto: string }[]
  gabarito: string
  banca: string | null
  ano: number | null
  dificuldade: number
  disciplina: { id: string, nome: string } | null
  assunto: { id: string, nome: string } | null
  resposta_usuario: string | null
  acertou: boolean | null
}

interface Simulado {
  id: string
  nome: string
  total_questoes: number
  questoes_corretas: number
  tempo_limite_minutos: number | null
  tempo_gasto_segundos: number
  status: 'em_andamento' | 'finalizado' | 'pausado'
  data_inicio: string
}

export default function SimuladoPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useMedAuth()

  const [simulado, setSimulado] = useState<Simulado | null>(null)
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [loading, setLoading] = useState(true)
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [tempoRestante, setTempoRestante] = useState<number | null>(null)
  const [tempoGasto, setTempoGasto] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showResultado, setShowResultado] = useState(false)

  const fetchSimulado = useCallback(async () => {
    if (!params.id || !user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/medicina/simulados/${params.id}?userId=${user.id}`)
      const data = await response.json()

      if (data.simulado) {
        setSimulado(data.simulado)
        setTempoGasto(data.simulado.tempo_gasto_segundos || 0)

        if (data.simulado.status === 'finalizado') {
          setShowResultado(true)
        }

        if (data.simulado.tempo_limite_minutos && data.simulado.status !== 'finalizado') {
          const tempoTotal = data.simulado.tempo_limite_minutos * 60
          const tempoUsado = data.simulado.tempo_gasto_segundos || 0
          setTempoRestante(Math.max(0, tempoTotal - tempoUsado))
        }
      }

      if (data.questoes) {
        setQuestoes(data.questoes)
        // Carregar respostas anteriores
        const respostasAnteriores: Record<string, string> = {}
        data.questoes.forEach((q: Questao) => {
          if (q.resposta_usuario) {
            respostasAnteriores[q.id] = q.resposta_usuario
          }
        })
        setRespostas(respostasAnteriores)
      }

    } catch (error) {
      console.error('Erro ao buscar simulado:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id, user])

  useEffect(() => {
    fetchSimulado()
  }, [fetchSimulado])

  // Timer
  useEffect(() => {
    if (showResultado || !simulado || simulado.status === 'finalizado') return

    const interval = setInterval(() => {
      setTempoGasto(prev => prev + 1)

      if (tempoRestante !== null) {
        setTempoRestante(prev => {
          if (prev === null || prev <= 0) {
            // Tempo esgotado - finalizar
            finalizarSimulado()
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [showResultado, simulado, tempoRestante])

  const responderQuestao = async (questaoId: string, resposta: string) => {
    if (!user || !simulado || showResultado) return

    setRespostas(prev => ({ ...prev, [questaoId]: resposta }))

    try {
      await fetch(`/api/medicina/simulados/${simulado.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          questaoId,
          resposta
        })
      })
    } catch (error) {
      console.error('Erro ao registrar resposta:', error)
    }
  }

  const finalizarSimulado = async () => {
    if (!user || !simulado || submitting) return

    const naoRespondidas = questoes.filter(q => !respostas[q.id]).length
    if (naoRespondidas > 0) {
      if (!confirm(`Você ainda tem ${naoRespondidas} questões não respondidas. Deseja finalizar mesmo assim?`)) {
        return
      }
    }

    try {
      setSubmitting(true)

      // Calcular acertos
      const acertos = questoes.filter(q =>
        respostas[q.id] && respostas[q.id] === q.gabarito
      ).length

      await fetch('/api/medicina/simulados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: simulado.id,
          userId: user.id,
          tempoGasto,
          status: 'finalizado',
          questoesCorretas: acertos
        })
      })

      setSimulado(prev => prev ? {
        ...prev,
        status: 'finalizado',
        questoes_corretas: acertos,
        tempo_gasto_segundos: tempoGasto
      } : null)

      setShowResultado(true)

    } catch (error) {
      console.error('Erro ao finalizar simulado:', error)
      alert('Erro ao finalizar simulado')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTempo = (segundos: number) => {
    const h = Math.floor(segundos / 3600)
    const m = Math.floor((segundos % 3600) / 60)
    const s = segundos % 60
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!simulado || questoes.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-white mb-2">Simulado não encontrado</h2>
        <Link href="/medicina/dashboard/simulados" className="text-emerald-400 hover:underline">
          Voltar para simulados
        </Link>
      </div>
    )
  }

  // Tela de Resultado
  if (showResultado) {
    const acertos = questoes.filter(q => respostas[q.id] === q.gabarito).length
    const taxa = Math.round((acertos / questoes.length) * 100)

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/medicina/dashboard/simulados"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Simulados
        </Link>

        {/* Resultado Card */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl p-8 border border-emerald-500/30 text-center">
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${taxa >= 70 ? 'text-amber-400' : 'text-white/40'}`} />
          <h1 className="text-3xl font-bold text-white mb-2">{simulado.nome}</h1>
          <p className="text-emerald-200/70 mb-6">Simulado Finalizado</p>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <div className={`text-5xl font-bold ${
                taxa >= 70 ? 'text-emerald-400' :
                taxa >= 50 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {taxa}%
              </div>
              <div className="text-white/60">Aproveitamento</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white">{acertos}/{questoes.length}</div>
              <div className="text-white/60">Acertos</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white">{formatTempo(tempoGasto)}</div>
              <div className="text-white/60">Tempo Total</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Link
              href="/medicina/dashboard/simulados/novo"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Novo Simulado
            </Link>
            <Link
              href="/medicina/dashboard/simulados"
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              Ver Histórico
            </Link>
          </div>
        </div>

        {/* Revisão das Questões */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4">Revisão das Questões</h2>
          <div className="space-y-4">
            {questoes.map((q, index) => {
              const respondeu = respostas[q.id]
              const acertou = respondeu === q.gabarito

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-lg border ${
                    !respondeu ? 'bg-white/5 border-white/10' :
                    acertou ? 'bg-emerald-500/10 border-emerald-500/30' :
                    'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white/80 line-clamp-2 mb-2">{q.enunciado}</p>
                      <div className="flex items-center gap-4 text-sm">
                        {respondeu ? (
                          acertou ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              Correta: {q.gabarito}
                            </span>
                          ) : (
                            <>
                              <span className="flex items-center gap-1 text-red-400">
                                <XCircle className="w-4 h-4" />
                                Sua resposta: {respondeu}
                              </span>
                              <span className="text-emerald-400">
                                Correta: {q.gabarito}
                              </span>
                            </>
                          )
                        ) : (
                          <span className="text-white/40">Não respondida (Correta: {q.gabarito})</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Tela de Execução do Simulado
  const questao = questoes[questaoAtual]
  const respondidas = Object.keys(respostas).length

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/medicina/dashboard/simulados"
            className="text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-white">{simulado.nome}</h1>
        </div>

        <div className="flex items-center gap-4">
          {tempoRestante !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              tempoRestante < 300 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono">{formatTempo(tempoRestante)}</span>
            </div>
          )}
          <button
            onClick={finalizarSimulado}
            disabled={submitting}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Finalizando...' : 'Finalizar'}
          </button>
        </div>
      </div>

      {/* Progresso */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-sm">Questão {questaoAtual + 1} de {questoes.length}</span>
          <span className="text-white/60 text-sm">{respondidas} respondidas</span>
        </div>
        <div className="flex gap-1">
          {questoes.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuestaoAtual(i)}
              className={`flex-1 h-2 rounded-full transition-colors ${
                i === questaoAtual ? 'bg-emerald-500' :
                respostas[q.id] ? 'bg-emerald-500/50' :
                'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Questão */}
      <div className="bg-white/5 rounded-xl border border-white/10">
        {/* Meta */}
        <div className="px-6 py-3 border-b border-white/10 flex items-center gap-2 text-sm">
          {questao.disciplina && (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
              {questao.disciplina.nome}
            </span>
          )}
          {questao.banca && (
            <span className="text-white/40">{questao.banca} {questao.ano && `• ${questao.ano}`}</span>
          )}
        </div>

        {/* Enunciado */}
        <div className="p-6">
          <p className="text-white whitespace-pre-wrap leading-relaxed">{questao.enunciado}</p>
        </div>

        {/* Alternativas */}
        <div className="px-6 pb-6 space-y-3">
          {questao.alternativas.map((alt) => (
            <button
              key={alt.letra}
              onClick={() => responderQuestao(questao.id, alt.letra)}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                respostas[questao.id] === alt.letra
                  ? 'bg-emerald-500/20 border-emerald-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold flex-shrink-0">
                {alt.letra}
              </span>
              <span className="flex-1 pt-1">{alt.texto}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setQuestaoAtual(Math.max(0, questaoAtual - 1))}
          disabled={questaoAtual === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Anterior
        </button>

        <div className="flex gap-2">
          {questoes.slice(Math.max(0, questaoAtual - 2), questaoAtual + 3).map((q, i) => {
            const realIndex = Math.max(0, questaoAtual - 2) + i
            return (
              <button
                key={realIndex}
                onClick={() => setQuestaoAtual(realIndex)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  realIndex === questaoAtual
                    ? 'bg-emerald-500 text-white'
                    : respostas[q.id]
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {realIndex + 1}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setQuestaoAtual(Math.min(questoes.length - 1, questaoAtual + 1))}
          disabled={questaoAtual === questoes.length - 1}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Próxima
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
