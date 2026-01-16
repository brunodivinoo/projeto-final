'use client'

import { useState, useEffect, useMemo } from 'react'

// Mensagens de progresso que variam com o tempo
const PROGRESS_MESSAGES = [
  { time: 0, emoji: '📝', text: 'Elaborando caso clínico...' },
  { time: 3000, emoji: '🏥', text: 'Contextualizando cenário médico...' },
  { time: 6000, emoji: '✍️', text: 'Criando alternativas desafiadoras...' },
  { time: 10000, emoji: '🎯', text: 'Finalizando questão...' },
  { time: 15000, emoji: '📋', text: 'Preparando gabarito comentado...' },
  { time: 20000, emoji: '🔍', text: 'Revisando conteúdo médico...' },
  { time: 25000, emoji: '⏳', text: 'Quase lá, finalizando detalhes...' },
]

// Dicas médicas para mostrar durante loading longo
const MEDICAL_TIPS = [
  'Questões de residência costumam testar raciocínio clínico integrado',
  'Analise sempre os dados vitais e exames laboratoriais do caso',
  'Correlacione os achados clínicos antes de escolher a resposta',
  'Em provas, elimine as alternativas claramente incorretas primeiro',
  'Preste atenção aos modificadores: "mais provável", "exceto", "incorreto"',
]

interface QuestionStreamingSkeletonProps {
  /** Dados parciais extraídos do JSON incompleto (se disponível) */
  partialData?: {
    disciplina?: string
    assunto?: string
    enunciado?: string
    alternativasCount?: number
    caso_clinico?: string
    questionIndex?: number
    totalExpected?: number
  }
  /** Callback quando o timeout é atingido */
  onTimeout?: () => void
  /** Callback para cancelar/retry */
  onCancel?: () => void
  /** Tempo em ms para considerar timeout (default: 45s) */
  timeoutMs?: number
}

export default function QuestionStreamingSkeleton({
  partialData,
  onTimeout,
  onCancel,
  timeoutMs = 45000
}: QuestionStreamingSkeletonProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false)

  // Atualizar tempo decorrido
  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      setElapsedTime(elapsed)

      // Verificar timeout
      if (elapsed >= timeoutMs && !showTimeoutMessage) {
        setShowTimeoutMessage(true)
        onTimeout?.()
      }
    }, 500)

    return () => clearInterval(interval)
  }, [timeoutMs, onTimeout, showTimeoutMessage])

  // Rotacionar dicas a cada 8 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % MEDICAL_TIPS.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  // Determinar mensagem de progresso atual
  const currentProgress = useMemo(() => {
    let message = PROGRESS_MESSAGES[0]
    for (const pm of PROGRESS_MESSAGES) {
      if (elapsedTime >= pm.time) {
        message = pm
      }
    }
    return message
  }, [elapsedTime])

  // Se temos dados parciais, mostrar versão mais completa
  const hasPartialEnunciado = partialData?.enunciado && partialData.enunciado.length > 50

  return (
    <div className="bg-[#1A2332] border border-white/10 rounded-lg overflow-hidden animate-pulse-subtle">
      {/* Header Skeleton - compacto */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-[#151D2B] border-b border-white/10">
        {/* Número da questão - mostra índice se disponível */}
        <span className="bg-emerald-500/20 text-emerald-400 font-bold text-xs px-2 py-0.5 rounded">
          {partialData?.questionIndex ? `Q${partialData.questionIndex}` : 'Q?'}
          {partialData?.totalExpected && partialData?.questionIndex && (
            <span className="text-emerald-400/60 font-normal">/{partialData.totalExpected}</span>
          )}
        </span>

        {/* Disciplina - real se disponível */}
        {partialData?.disciplina ? (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-white/80 font-medium">{partialData.disciplina}</span>
            {partialData.assunto && (
              <>
                <span className="text-white/30">›</span>
                <span className="text-white/50">{partialData.assunto}</span>
              </>
            )}
          </div>
        ) : (
          <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
        )}

        <div className="flex-1" />

        {/* Badge IA */}
        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-medium flex items-center gap-0.5">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
          </svg>
          IA
        </span>
      </div>

      {/* Corpo da questão - compacto */}
      <div className="p-3">
        {/* Caso clínico - skeleton ou parcial */}
        {partialData?.caso_clinico ? (
          <div className="mb-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-blue-400 text-[10px] font-semibold uppercase tracking-wider">Caso Clínico</span>
            </div>
            <p className="text-white/70 text-xs leading-relaxed whitespace-pre-wrap">
              {partialData.caso_clinico}
              <span className="inline-block w-1.5 h-3 bg-emerald-400/50 animate-blink ml-1" />
            </p>
          </div>
        ) : elapsedTime > 2000 && (
          <div className="mb-3 p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-3.5 h-3.5 bg-blue-400/20 rounded animate-pulse" />
              <div className="h-2.5 w-16 bg-blue-400/20 rounded animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 bg-white/5 rounded w-full animate-pulse" />
              <div className="h-2.5 bg-white/5 rounded w-11/12 animate-pulse" />
              <div className="h-2.5 bg-white/5 rounded w-4/5 animate-pulse" />
            </div>
          </div>
        )}

        {/* Enunciado - parcial ou skeleton */}
        <div className="mb-3">
          {hasPartialEnunciado ? (
            <p className="text-white/85 text-sm leading-relaxed">
              {partialData!.enunciado}
              <span className="inline-block w-1.5 h-3 bg-emerald-400/50 animate-blink ml-1" />
            </p>
          ) : (
            <div className="space-y-1.5">
              <div className="h-3 bg-white/10 rounded w-full animate-pulse" />
              <div className="h-3 bg-white/10 rounded w-11/12 animate-pulse" />
              <div className="h-3 bg-white/10 rounded w-3/4 animate-pulse" />
            </div>
          )}
        </div>

        {/* Alternativas skeleton - compactas */}
        <div className="space-y-1.5">
          {['A', 'B', 'C', 'D', 'E'].map((letra, idx) => (
            <div
              key={letra}
              className="flex items-start gap-2 p-2.5 rounded-lg border border-white/5 bg-white/[0.02]"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/30 text-xs font-medium">
                {letra}
              </span>
              <div className="flex-1 pt-0.5">
                <div
                  className="h-2.5 bg-white/5 rounded animate-pulse"
                  style={{
                    width: `${70 + (idx % 3) * 10}%`,
                    animationDelay: `${idx * 150}ms`
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mensagem de progresso - compacta */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-center gap-2">
            {/* Spinner animado */}
            <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />

            {/* Mensagem atual */}
            <div className="flex items-center gap-1.5 text-white/60">
              <span className="text-sm">{currentProgress.emoji}</span>
              <span className="text-xs font-medium">{currentProgress.text}</span>
            </div>
          </div>

          {/* Barra de progresso visual */}
          <div className="mt-2 h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500/50 to-emerald-400/30 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(95, (elapsedTime / timeoutMs) * 100)}%`
              }}
            />
          </div>

          {/* Dica médica após 10 segundos */}
          {elapsedTime > 10000 && !showTimeoutMessage && (
            <div className="mt-3 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg">
              <div className="flex items-start gap-1.5">
                <span className="text-amber-400 text-xs">💡</span>
                <p className="text-[10px] text-amber-400/80 leading-relaxed">
                  <span className="font-medium">Dica:</span> {MEDICAL_TIPS[currentTipIndex]}
                </p>
              </div>
            </div>
          )}

          {/* Mensagem de timeout com botões de ação */}
          {showTimeoutMessage && (
            <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-1.5 text-orange-400 mb-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs">
                  Está demorando mais que o esperado. A questão ainda está sendo gerada...
                </p>
              </div>
              {onCancel && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {/* Continue waiting - do nothing */}}
                    className="px-2.5 py-1 text-[10px] font-medium bg-white/5 hover:bg-white/10 text-white/70 rounded transition-colors"
                  >
                    Aguardar mais
                  </button>
                  <button
                    onClick={onCancel}
                    className="px-2.5 py-1 text-[10px] font-medium bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded transition-colors"
                  >
                    Cancelar e tentar novamente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Estilos de animação customizados */}
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s ease-in-out infinite;
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
