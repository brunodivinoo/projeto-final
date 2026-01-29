'use client'

import { useState, useMemo } from 'react'
import {
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Play,
  RotateCcw,
  Flag,
  X,
  Pause,
  PieChart
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Importar QuestionArtifactCard dinamicamente
const QuestionArtifactCard = dynamic(() => import('./QuestionArtifactCard'), {
  ssr: false,
  loading: () => (
    <div className="bg-[#1A2332] border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-2 text-white/40">
        <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
        <span>Carregando questão...</span>
      </div>
    </div>
  )
})

interface Questao {
  numero: number
  tipo: string
  dificuldade: string
  tema: string
  enunciado: string
  alternativas: Array<{ letra: string; texto: string }>
  gabarito_comentado: {
    resposta_correta: string
    explicacao: string
    ponto_chave?: string
  }
}

interface SimuladoData {
  titulo: string
  disciplina: string
  total_questoes: number
  tempo_estimado: string
  dificuldade_media: string
  questoes: Questao[]
}

interface SimuladoCardProps {
  simulado: SimuladoData
  userId?: string
  conversaId?: string
}

export default function SimuladoCard({ simulado, userId, conversaId }: SimuladoCardProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [paused, setPaused] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [respostas, setRespostas] = useState<Record<number, { resposta: string; acertou: boolean }>>({})

  // Estatísticas
  const stats = useMemo(() => {
    const respondidas = Object.keys(respostas).length
    const corretas = Object.values(respostas).filter(r => r.acertou).length
    const erradas = respondidas - corretas
    const pendentes = simulado.questoes.length - respondidas
    const percentual = respondidas > 0 ? Math.round((corretas / respondidas) * 100) : 0

    return { respondidas, corretas, erradas, pendentes, percentual }
  }, [respostas, simulado.questoes.length])

  const handleAnswer = (questionNum: number, resposta: string, acertou: boolean) => {
    setRespostas(prev => ({
      ...prev,
      [questionNum]: { resposta, acertou }
    }))

    // Auto-avançar para próxima questão após 1 segundo
    if (currentQuestion < simulado.questoes.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 1000)
    } else if (stats.respondidas + 1 >= simulado.questoes.length) {
      setTimeout(() => setFinished(true), 1000)
    }
  }

  const handleStart = () => {
    setStarted(true)
  }

  const handleReset = () => {
    setStarted(false)
    setFinished(false)
    setPaused(false)
    setShowStats(false)
    setRespostas({})
    setCurrentQuestion(0)
  }

  const handlePause = () => {
    setPaused(true)
  }

  const handleResume = () => {
    setPaused(false)
  }

  // Tela inicial
  if (!started) {
    return (
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{simulado.titulo}</h2>
          <p className="text-white/60 text-sm mb-4">{simulado.disciplina}</p>

          <div className="flex items-center justify-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2 text-white/60">
              <span className="text-lg">📝</span>
              <span>{simulado.total_questoes} questões</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <Clock className="w-4 h-4" />
              <span>{simulado.tempo_estimado}</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 mx-auto"
          >
            <Play className="w-5 h-5" />
            Iniciar Simulado
          </button>
        </div>
      </div>
    )
  }

  // Tela de pausa
  if (paused) {
    return (
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Pause className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Simulado Pausado</h2>
            <p className="text-white/60 text-sm">{simulado.titulo}</p>
          </div>

          {/* Progresso atual */}
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/60 text-sm">Progresso</span>
              <span className="text-white font-medium">{stats.respondidas}/{simulado.questoes.length}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                style={{ width: `${(stats.respondidas / simulado.questoes.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-emerald-400">{stats.corretas} acertos</span>
              <span className="text-red-400">{stats.erradas} erros</span>
              <span className="text-white/40">{stats.pendentes} pendentes</span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleResume}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Continuar Simulado
            </button>
            <button
              onClick={handleReset}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar do Zero
            </button>
            <button
              onClick={() => { setPaused(false); setStarted(false) }}
              className="w-full py-2 text-white/60 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <X className="w-4 h-4" />
              Fechar Simulado
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Tela de resultado
  if (finished) {
    return (
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">{stats.percentual >= 70 ? '🎉' : stats.percentual >= 50 ? '👍' : '📚'}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Simulado Concluído!</h2>
            <p className="text-white/60">{simulado.titulo}</p>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">{stats.corretas}</div>
              <div className="text-xs text-white/40">Acertos</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{stats.erradas}</div>
              <div className="text-xs text-white/40">Erros</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{stats.respondidas}</div>
              <div className="text-xs text-white/40">Total</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">{stats.percentual}%</div>
              <div className="text-xs text-white/40">Aproveitamento</div>
            </div>
          </div>

          {/* Barra de progresso visual */}
          <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
              style={{ width: `${stats.percentual}%` }}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Refazer Simulado
            </button>
            <button
              onClick={() => { setFinished(false); setCurrentQuestion(0) }}
              className="flex-1 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Revisar Questões
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Tela do simulado em andamento
  const questaoAtual = simulado.questoes[currentQuestion]
  const respostaAtual = respostas[questaoAtual.numero]

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-xl overflow-hidden">
      {/* Header com progresso */}
      <div className="px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium text-sm truncate max-w-[60%]">{simulado.titulo}</span>
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">
              {stats.respondidas}/{simulado.questoes.length}
            </span>
            {/* Botões de controle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Ver estatísticas"
            >
              <PieChart className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={handlePause}
              className="p-1.5 bg-white/10 hover:bg-amber-500/30 rounded-lg transition-colors"
              title="Pausar simulado"
            >
              <Pause className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${(stats.respondidas / simulado.questoes.length) * 100}%` }}
          />
        </div>

        {/* Mini estatísticas */}
        <div className="flex items-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle className="w-3 h-3" /> {stats.corretas}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <XCircle className="w-3 h-3" /> {stats.erradas}
          </span>
          <span className="flex items-center gap-1 text-white/40">
            <Clock className="w-3 h-3" /> {simulado.tempo_estimado}
          </span>
        </div>

        {/* Painel de estatísticas expandido */}
        {showStats && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-500/10 rounded-lg p-2">
                <div className="text-lg font-bold text-emerald-400">{stats.corretas}</div>
                <div className="text-[10px] text-white/40">Corretas</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2">
                <div className="text-lg font-bold text-red-400">{stats.erradas}</div>
                <div className="text-[10px] text-white/40">Erradas</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-lg font-bold text-white/60">{stats.pendentes}</div>
                <div className="text-[10px] text-white/40">Pendentes</div>
              </div>
            </div>
            {stats.respondidas > 0 && (
              <div className="mt-2 text-center">
                <span className="text-xs text-white/40">Aproveitamento: </span>
                <span className={`text-sm font-bold ${stats.percentual >= 70 ? 'text-emerald-400' : stats.percentual >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {stats.percentual}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navegação por números */}
      <div className="px-4 py-2 border-b border-white/10 overflow-x-auto">
        <div className="flex gap-1">
          {simulado.questoes.map((q, idx) => {
            const resp = respostas[q.numero]
            return (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors flex-shrink-0 ${
                  idx === currentQuestion
                    ? 'bg-emerald-500 text-white'
                    : resp
                      ? resp.acertou
                        ? 'bg-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/30 text-red-400'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Questão atual */}
      <div className="p-4">
        <QuestionArtifactCard
          question={{
            id: `simulado-q-${questaoAtual.numero}`,
            numero: questaoAtual.numero,
            tipo: questaoAtual.tipo as 'multipla_escolha' | 'certo_errado',
            dificuldade: questaoAtual.dificuldade as 'facil' | 'medio' | 'dificil' | 'muito_dificil',
            disciplina: simulado.disciplina,
            assunto: questaoAtual.tema,
            enunciado: questaoAtual.enunciado,
            alternativas: questaoAtual.alternativas.map(a => ({ letra: a.letra, texto: a.texto })),
            gabarito_comentado: {
              resposta_correta: questaoAtual.gabarito_comentado.resposta_correta,
              explicacao: questaoAtual.gabarito_comentado.explicacao,
              ponto_chave: questaoAtual.gabarito_comentado.ponto_chave,
              analise_alternativas: [],
              referencias: []
            },
            resposta_usuario: respostaAtual?.resposta,
            acertou: respostaAtual?.acertou
          }}
          userId={userId}
          conversaId={conversaId}
          onAnswerSubmit={(qId, answer, correct) => {
            handleAnswer(questaoAtual.numero, answer, correct)
          }}
        />
      </div>

      {/* Navegação */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
        <button
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="flex items-center gap-1 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white/80 text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <span className="text-white/40 text-sm">
          {currentQuestion + 1} de {simulado.questoes.length}
        </span>

        <button
          onClick={() => {
            if (currentQuestion < simulado.questoes.length - 1) {
              setCurrentQuestion(prev => prev + 1)
            } else {
              setFinished(true)
            }
          }}
          className="flex items-center gap-1 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400 text-sm transition-colors"
        >
          {currentQuestion < simulado.questoes.length - 1 ? (
            <>
              Próxima
              <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <Flag className="w-4 h-4" />
              Finalizar
            </>
          )}
        </button>
      </div>
    </div>
  )
}
