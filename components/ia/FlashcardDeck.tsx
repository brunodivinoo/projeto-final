'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  Brain,
  Shuffle,
  BarChart3,
  Minimize2,
  Maximize2,
  Save
} from 'lucide-react'

export interface Flashcard {
  id: string
  frente: string
  verso: string
  referencia?: string
  dificuldade?: 'facil' | 'medio' | 'dificil'
}

interface FlashcardDeckProps {
  titulo: string
  cards: Flashcard[]
  onSaveToArtefatos?: (cards: Flashcard[], titulo: string) => void
  userId?: string
  conversaId?: string
}

type CardStatus = 'nao_visto' | 'acertou' | 'errou' | 'revisao'

interface CardProgress {
  status: CardStatus
  vezes_revisado: number
  ultima_revisao?: Date
}

export default function FlashcardDeck({
  titulo,
  cards: initialCards,
  onSaveToArtefatos,
  userId,
  conversaId
}: FlashcardDeckProps) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [progress, setProgress] = useState<Map<string, CardProgress>>(new Map())
  const [showStats, setShowStats] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [sessionStats, setSessionStats] = useState({
    acertos: 0,
    erros: 0,
    revisoes: 0,
    tempoTotal: 0
  })

  // Inicializar progress
  useEffect(() => {
    const initialProgress = new Map<string, CardProgress>()
    initialCards.forEach(card => {
      initialProgress.set(card.id, {
        status: 'nao_visto',
        vezes_revisado: 0
      })
    })
    setProgress(initialProgress)
    setCards(initialCards)
    setStartTime(new Date())
  }, [initialCards])

  const currentCard = cards[currentIndex]

  // Estatisticas
  const stats = useMemo(() => {
    let acertos = 0, erros = 0, naoVistos = 0, revisao = 0
    progress.forEach(p => {
      if (p.status === 'acertou') acertos++
      else if (p.status === 'errou') erros++
      else if (p.status === 'revisao') revisao++
      else naoVistos++
    })
    return { acertos, erros, naoVistos, revisao, total: cards.length }
  }, [progress, cards.length])

  // Virar card
  const flipCard = useCallback(() => {
    setIsFlipped(!isFlipped)
  }, [isFlipped])

  // Navegar
  const goToNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }, [currentIndex, cards.length])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }, [currentIndex])

  // Marcar resposta (estilo Anki)
  const markAnswer = useCallback((status: 'acertou' | 'errou' | 'revisao') => {
    if (!currentCard) return

    setProgress(prev => {
      const newProgress = new Map(prev)
      const cardProgress = newProgress.get(currentCard.id) || { status: 'nao_visto', vezes_revisado: 0 }

      newProgress.set(currentCard.id, {
        ...cardProgress,
        status,
        vezes_revisado: cardProgress.vezes_revisado + 1,
        ultima_revisao: new Date()
      })

      return newProgress
    })

    // Atualizar stats da sessao
    setSessionStats(prev => ({
      ...prev,
      acertos: prev.acertos + (status === 'acertou' ? 1 : 0),
      erros: prev.erros + (status === 'errou' ? 1 : 0),
      revisoes: prev.revisoes + (status === 'revisao' ? 1 : 0)
    }))

    // Ir para proximo
    goToNext()
  }, [currentCard, goToNext])

  // Embaralhar
  const shuffleCards = useCallback(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [cards])

  // Reiniciar
  const resetDeck = useCallback(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
    const resetProgress = new Map<string, CardProgress>()
    cards.forEach(card => {
      resetProgress.set(card.id, { status: 'nao_visto', vezes_revisado: 0 })
    })
    setProgress(resetProgress)
    setSessionStats({ acertos: 0, erros: 0, revisoes: 0, tempoTotal: 0 })
    setStartTime(new Date())
  }, [cards])

  // Revisar apenas errados
  const reviewErrors = useCallback(() => {
    const errorCards = cards.filter(c => progress.get(c.id)?.status === 'errou')
    if (errorCards.length > 0) {
      setCards(errorCards)
      setCurrentIndex(0)
      setIsFlipped(false)
    }
  }, [cards, progress])

  // Teclas de atalho
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        flipCard()
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        goToNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        goToPrev()
      } else if (e.key === '1' && isFlipped) {
        markAnswer('errou')
      } else if (e.key === '2' && isFlipped) {
        markAnswer('revisao')
      } else if (e.key === '3' && isFlipped) {
        markAnswer('acertou')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flipCard, goToNext, goToPrev, isFlipped, markAnswer])

  // Calcular tempo
  const elapsedTime = useMemo(() => {
    if (!startTime) return '0:00'
    const diff = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
    const mins = Math.floor(diff / 60)
    const secs = diff % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [startTime])

  // Timer atualiza a cada segundo
  const [, forceUpdate] = useState({})
  useEffect(() => {
    const interval = setInterval(() => forceUpdate({}), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!currentCard) {
    return (
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 text-center">
        <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <p className="text-white/60">Nenhum flashcard para revisar</p>
      </div>
    )
  }

  // Progresso concluido
  const allReviewed = stats.naoVistos === 0

  return (
    <div className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-xl overflow-hidden transition-all ${
      isExpanded ? 'fixed inset-4 z-50' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{titulo}</h3>
            <p className="text-white/40 text-xs">{cards.length} flashcards</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer */}
          <div className="flex items-center gap-1 text-white/40 text-xs bg-white/5 px-2 py-1 rounded">
            <Clock className="w-3 h-3" />
            {elapsedTime}
          </div>

          {/* Botoes */}
          <button
            onClick={shuffleCards}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Embaralhar"
          >
            <Shuffle className="w-4 h-4 text-white/60" />
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Estatísticas"
          >
            <BarChart3 className="w-4 h-4 text-white/60" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title={isExpanded ? 'Minimizar' : 'Expandir'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-white/60" />
            ) : (
              <Maximize2 className="w-4 h-4 text-white/60" />
            )}
          </button>
          {onSaveToArtefatos && (
            <button
              onClick={() => onSaveToArtefatos(cards, titulo)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Salvar na Biblioteca"
            >
              <Save className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="px-4 py-3 bg-white/5 border-b border-white/10">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-400">{stats.acertos}</div>
              <div className="text-xs text-white/40">Acertos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{stats.erros}</div>
              <div className="text-xs text-white/40">Erros</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">{stats.revisao}</div>
              <div className="text-xs text-white/40">Revisao</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white/60">{stats.naoVistos}</div>
              <div className="text-xs text-white/40">Restantes</div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${(stats.acertos / stats.total) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${(stats.erros / stats.total) * 100}%` }}
            />
            <div
              className="bg-amber-500 transition-all"
              style={{ width: `${(stats.revisao / stats.total) * 100}%` }}
            />
          </div>

          {/* Acoes */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={resetDeck}
              className="flex-1 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors text-white/80"
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              Reiniciar
            </button>
            {stats.erros > 0 && (
              <button
                onClick={reviewErrors}
                className="flex-1 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 rounded transition-colors text-red-400"
              >
                Revisar Erros ({stats.erros})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card Area */}
      <div className={`p-4 ${isExpanded ? 'flex-1 flex flex-col justify-center' : ''}`}>
        {/* Contador */}
        <div className="text-center mb-3">
          <span className="text-white/40 text-sm">
            Card {currentIndex + 1} de {cards.length}
          </span>
        </div>

        {/* Flashcard com flip animation */}
        <div
          className={`relative cursor-pointer perspective-1000 ${isExpanded ? 'min-h-[300px]' : 'min-h-[200px]'}`}
          onClick={flipCard}
        >
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`} style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}>
            {/* Frente */}
            <div
              className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-xl border border-white/20 p-6 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-xs text-purple-300 mb-2 uppercase tracking-wider">Pergunta</div>
              <p className="text-white text-center text-lg font-medium">{currentCard.frente}</p>
              <div className="mt-4 text-white/30 text-xs">Clique ou pressione ESPAÇO para ver a resposta</div>
            </div>

            {/* Verso */}
            <div
              className="absolute inset-0 backface-hidden bg-gradient-to-br from-emerald-600/30 to-teal-600/30 rounded-xl border border-white/20 p-6 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className="text-xs text-emerald-300 mb-2 uppercase tracking-wider">Resposta</div>
              <p className="text-white text-center text-base">{currentCard.verso}</p>
              {currentCard.referencia && (
                <p className="mt-3 text-white/40 text-xs text-center">{currentCard.referencia}</p>
              )}
            </div>
          </div>
        </div>

        {/* Botoes de navegacao e resposta */}
        <div className="mt-4">
          {!isFlipped ? (
            /* Navegacao quando nao virado */
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={flipCard}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors"
              >
                Mostrar Resposta
              </button>

              <button
                onClick={goToNext}
                disabled={currentIndex === cards.length - 1}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          ) : (
            /* Botoes Anki quando virado */
            <div className="space-y-3">
              <p className="text-center text-white/40 text-xs">Como foi?</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => markAnswer('errou')}
                  className="flex-1 max-w-[120px] py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 font-medium transition-colors"
                >
                  <X className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm">Errei</span>
                  <span className="block text-xs text-red-400/60">(1)</span>
                </button>

                <button
                  onClick={() => markAnswer('revisao')}
                  className="flex-1 max-w-[120px] py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-400 font-medium transition-colors"
                >
                  <Clock className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm">Revisar</span>
                  <span className="block text-xs text-amber-400/60">(2)</span>
                </button>

                <button
                  onClick={() => markAnswer('acertou')}
                  className="flex-1 max-w-[120px] py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-colors"
                >
                  <Check className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm">Acertei</span>
                  <span className="block text-xs text-emerald-400/60">(3)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conclusao */}
      {allReviewed && (
        <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20">
          <div className="text-center">
            <div className="text-3xl mb-2">🎉</div>
            <h4 className="text-emerald-400 font-bold">Parabens! Voce revisou todos os cards!</h4>
            <p className="text-white/60 text-sm mt-1">
              Acertos: {stats.acertos} | Erros: {stats.erros} | Para revisao: {stats.revisao}
            </p>
            <div className="flex gap-2 justify-center mt-3">
              <button
                onClick={resetDeck}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              >
                Revisar Novamente
              </button>
              {stats.erros > 0 && (
                <button
                  onClick={reviewErrors}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm transition-colors"
                >
                  Apenas Erros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Atalhos */}
      <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
        <p className="text-white/30 text-[10px] text-center">
          Atalhos: ESPACO (virar) | ← → (navegar) | 1 (errei) | 2 (revisar) | 3 (acertei)
        </p>
      </div>
    </div>
  )
}
