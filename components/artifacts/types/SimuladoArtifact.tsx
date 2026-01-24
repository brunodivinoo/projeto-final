'use client'

/**
 * Artefato de Simulado Interativo
 * Prova cronometrada com correção automática
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Trophy,
  AlertCircle
} from 'lucide-react'

export interface SimuladoQuestion {
  id: string
  enunciado: string
  alternativas: { letra: string; texto: string }[]
  respostaCorreta: string
  explicacao: string
  dificuldade: 'facil' | 'medio' | 'dificil'
}

export interface SimuladoResult {
  acertos: number
  total: number
  tempo: number
  respostas: { questionId: string; resposta: string; correta: boolean }[]
  percentual: number
}

interface SimuladoArtifactProps {
  questions: SimuladoQuestion[]
  timeLimit?: number // em minutos
  onComplete?: (result: SimuladoResult) => void
  title?: string
}

type Mode = 'intro' | 'prova' | 'resultado'

export function SimuladoArtifact({
  questions,
  timeLimit,
  onComplete,
  title = 'Simulado'
}: SimuladoArtifactProps) {
  const [mode, setMode] = useState<Mode>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [tempoRestante, setTempoRestante] = useState(timeLimit ? timeLimit * 60 : 0)
  const [tempoInicio, setTempoInicio] = useState<Date | null>(null)
  const [resultado, setResultado] = useState<SimuladoResult | null>(null)
  const [showExplicacao, setShowExplicacao] = useState<string | null>(null)

  // Timer
  useEffect(() => {
    if (mode !== 'prova' || !timeLimit) return

    const interval = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          finalizarSimulado()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [mode, timeLimit])

  const iniciarSimulado = () => {
    setMode('prova')
    setTempoInicio(new Date())
    setRespostas({})
    setCurrentIndex(0)
  }

  const selecionarResposta = (questionId: string, letra: string) => {
    setRespostas((prev) => ({ ...prev, [questionId]: letra }))
  }

  const finalizarSimulado = useCallback(() => {
    const tempoTotal = tempoInicio
      ? Math.round((new Date().getTime() - tempoInicio.getTime()) / 1000)
      : 0

    let acertos = 0
    const respostasDetalhadas: SimuladoResult['respostas'] = []

    questions.forEach((q) => {
      const resposta = respostas[q.id]
      const correta = resposta === q.respostaCorreta
      if (correta) acertos++

      respostasDetalhadas.push({
        questionId: q.id,
        resposta: resposta || '',
        correta
      })
    })

    const resultadoFinal: SimuladoResult = {
      acertos,
      total: questions.length,
      tempo: tempoTotal,
      respostas: respostasDetalhadas,
      percentual: Math.round((acertos / questions.length) * 100)
    }

    setResultado(resultadoFinal)
    setMode('resultado')
    onComplete?.(resultadoFinal)
  }, [questions, respostas, tempoInicio, onComplete])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'facil': return 'text-emerald-400 bg-emerald-400/10'
      case 'medio': return 'text-amber-400 bg-amber-400/10'
      case 'dificil': return 'text-red-400 bg-red-400/10'
      default: return 'text-white/60 bg-white/10'
    }
  }

  const question = questions[currentIndex]
  const respondidas = Object.keys(respostas).length

  // TELA INICIAL
  if (mode === 'intro') {
    const faceis = questions.filter(q => q.dificuldade === 'facil').length
    const medias = questions.filter(q => q.dificuldade === 'medio').length
    const dificeis = questions.filter(q => q.dificuldade === 'dificil').length

    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
                        flex items-center justify-center">
          <Flag className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-xl text-white font-bold mb-2">{title}</h3>
        <p className="text-white/60 mb-6">
          {questions.length} questões {timeLimit && `| ${timeLimit} minutos`}
        </p>

        {/* Distribuição de dificuldade */}
        <div className="flex justify-center gap-3 mb-6">
          {faceis > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400">
              {faceis} fácil
            </span>
          )}
          {medias > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400">
              {medias} médio
            </span>
          )}
          {dificeis > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-400/10 text-red-400">
              {dificeis} difícil
            </span>
          )}
        </div>

        <button
          onClick={iniciarSimulado}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl
                     bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700
                     text-white font-semibold transition-all shadow-lg shadow-blue-500/25"
        >
          <Play className="w-5 h-5" />
          Iniciar Simulado
        </button>

        {timeLimit && (
          <p className="text-white/40 text-sm mt-4">
            O tempo começa a contar ao clicar
          </p>
        )}
      </div>
    )
  }

  // TELA DE PROVA
  if (mode === 'prova' && question) {
    return (
      <div className="py-4">
        {/* Header com timer e progresso */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
          <span className="text-white/60 text-sm">
            Questão {currentIndex + 1} de {questions.length}
          </span>

          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm">
              {respondidas}/{questions.length} respondidas
            </span>

            {timeLimit && (
              <span className={`flex items-center gap-1.5 font-mono font-medium ${
                tempoRestante < 60 ? 'text-red-400' : 'text-white'
              }`}>
                <Clock className="w-4 h-4" />
                {formatTime(tempoRestante)}
              </span>
            )}
          </div>
        </div>

        {/* Questão */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(question.dificuldade)}`}>
              {question.dificuldade}
            </span>
          </div>

          <p className="text-white leading-relaxed mb-4">{question.enunciado}</p>

          <div className="space-y-2">
            {question.alternativas.map((alt) => (
              <button
                key={alt.letra}
                onClick={() => selecionarResposta(question.id, alt.letra)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  respostas[question.id] === alt.letra
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-white/10 hover:border-white/30 text-white/80 hover:text-white'
                }`}
              >
                <span className="font-semibold text-blue-400 mr-2">{alt.letra})</span>
                {alt.texto}
              </button>
            ))}
          </div>
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10
                       disabled:opacity-30 transition flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700
                         transition flex items-center gap-1"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finalizarSimulado}
              className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700
                         transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Finalizar
            </button>
          )}
        </div>

        {/* Navegação rápida */}
        <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-white/10">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                i === currentIndex
                  ? 'bg-blue-600 text-white'
                  : respostas[q.id]
                  ? 'bg-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // TELA DE RESULTADO
  if (mode === 'resultado' && resultado) {
    const getResultColor = () => {
      if (resultado.percentual >= 70) return 'text-emerald-400'
      if (resultado.percentual >= 50) return 'text-amber-400'
      return 'text-red-400'
    }

    const getResultMessage = () => {
      if (resultado.percentual >= 90) return 'Excelente! Parabéns!'
      if (resultado.percentual >= 70) return 'Muito bom! Continue assim!'
      if (resultado.percentual >= 50) return 'Bom resultado. Revise os pontos fracos.'
      return 'Precisa estudar mais. Não desista!'
    }

    return (
      <div className="py-4">
        {/* Resultado principal */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600
                          flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <h3 className="text-xl text-white font-bold mb-2">Resultado do Simulado</h3>

          <div className={`text-5xl font-bold mb-2 ${getResultColor()}`}>
            {resultado.percentual}%
          </div>

          <p className="text-white/60 mb-1">
            {resultado.acertos} de {resultado.total} questões corretas
          </p>

          {resultado.tempo > 0 && (
            <p className="text-white/40 text-sm">
              Tempo: {formatTime(resultado.tempo)}
            </p>
          )}

          <p className={`mt-2 ${getResultColor()}`}>
            {getResultMessage()}
          </p>
        </div>

        {/* Lista de questões com resultado */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {questions.map((q, i) => {
            const resp = resultado.respostas.find(r => r.questionId === q.id)
            const acertou = resp?.correta

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition ${
                  acertou
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${acertou ? 'text-emerald-400' : 'text-red-400'}`}>
                    {acertou ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>

                  <div className="flex-1">
                    <p className="text-white font-medium text-sm mb-1">Questão {i + 1}</p>
                    <p className="text-white/60 text-sm line-clamp-2">{q.enunciado}</p>

                    {!acertou && (
                      <div className="mt-2 text-sm">
                        <span className="text-red-400">Sua: {resp?.resposta || 'Não respondida'}</span>
                        <span className="text-white/40 mx-2">|</span>
                        <span className="text-emerald-400">Correta: {q.respostaCorreta}</span>
                      </div>
                    )}

                    <button
                      onClick={() => setShowExplicacao(showExplicacao === q.id ? null : q.id)}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      {showExplicacao === q.id ? 'Ocultar explicação' : 'Ver explicação'}
                    </button>

                    <AnimatePresence>
                      {showExplicacao === q.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 rounded-lg bg-white/5 text-white/70 text-sm"
                        >
                          {q.explicacao}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Botão refazer */}
        <button
          onClick={() => {
            setMode('intro')
            setRespostas({})
            setResultado(null)
            setCurrentIndex(0)
            setShowExplicacao(null)
          }}
          className="w-full mt-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70
                     hover:text-white transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Refazer Simulado
        </button>
      </div>
    )
  }

  return null
}

// Função helper para parsear questões do texto da IA
export function parseSimuladoFromText(text: string): SimuladoQuestion[] {
  const questions: SimuladoQuestion[] = []

  // Pattern: **Questão N** | Nível: ...
  const pattern = /\*\*Questão\s*(\d+)\*\*[^\n]*\n+([\s\S]*?)(?=\*\*Questão\s*\d+\*\*|$)/gi
  let match

  while ((match = pattern.exec(text)) !== null) {
    const questionText = match[2]

    // Extrair enunciado (antes das alternativas)
    const enunciadoMatch = questionText.match(/^([\s\S]*?)(?=\n\s*[a-e]\))/i)
    const enunciado = enunciadoMatch ? enunciadoMatch[1].trim() : ''

    // Extrair alternativas
    const alternativas: { letra: string; texto: string }[] = []
    const altPattern = /([a-e])\)\s*([^\n]+)/gi
    let altMatch

    while ((altMatch = altPattern.exec(questionText)) !== null) {
      alternativas.push({
        letra: altMatch[1].toUpperCase(),
        texto: altMatch[2].trim()
      })
    }

    // Extrair resposta correta
    const respostaMatch = questionText.match(/(?:Resposta|Gabarito):\s*([A-E])/i)
    const respostaCorreta = respostaMatch ? respostaMatch[1].toUpperCase() : ''

    // Extrair explicação
    const explicacaoMatch = questionText.match(/(?:Explicação|Comentário):\s*([\s\S]*?)(?=\n\n|$)/i)
    const explicacao = explicacaoMatch ? explicacaoMatch[1].trim() : ''

    // Extrair dificuldade
    const diffMatch = questionText.match(/Nível:\s*(fácil|médio|difícil|facil|medio|dificil)/i)
    let dificuldade: 'facil' | 'medio' | 'dificil' = 'medio'
    if (diffMatch) {
      const d = diffMatch[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      dificuldade = d === 'facil' ? 'facil' : d === 'dificil' ? 'dificil' : 'medio'
    }

    if (enunciado && alternativas.length >= 4) {
      questions.push({
        id: `sim-q${questions.length + 1}-${Date.now()}`,
        enunciado,
        alternativas,
        respostaCorreta,
        explicacao,
        dificuldade
      })
    }
  }

  return questions
}
