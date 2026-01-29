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
    <div className={`aurora-gradient-animated rounded-2xl overflow-hidden transition-all shadow-xl ${
      isExpanded ? 'fixed inset-4 z-50' : ''
    }`}>
      {/* Header com glassmorphism */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl aurora-gradient flex items-center justify-center shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{titulo}</h3>
            <p className="text-white/70 text-xs">{cards.length} flashcards</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer */}
          <div className="flex items-center gap-1 text-white/80 text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
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

      {/* Stats Panel com glassmorphism */}
      {showStats && (
        <div className="px-4 py-3 bg-black/20 backdrop-blur-sm">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
              <div className="text-2xl font-bold text-emerald-300">{stats.acertos}</div>
              <div className="text-xs text-white/60">Acertos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
              <div className="text-2xl font-bold text-red-300">{stats.erros}</div>
              <div className="text-xs text-white/60">Erros</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
              <div className="text-2xl font-bold text-amber-300">{stats.revisao}</div>
              <div className="text-xs text-white/60">Revisão</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
              <div className="text-2xl font-bold text-white/80">{stats.naoVistos}</div>
              <div className="text-xs text-white/60">Restantes</div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-400 transition-all"
              style={{ width: `${(stats.acertos / stats.total) * 100}%` }}
            />
            <div
              className="bg-red-400 transition-all"
              style={{ width: `${(stats.erros / stats.total) * 100}%` }}
            />
            <div
              className="bg-amber-400 transition-all"
              style={{ width: `${(stats.revisao / stats.total) * 100}%` }}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={resetDeck}
              className="flex-1 py-2 text-xs bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-white font-medium backdrop-blur-sm"
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              Reiniciar
            </button>
            {stats.erros > 0 && (
              <button
                onClick={reviewErrors}
                className="flex-1 py-2 text-xs bg-red-500/30 hover:bg-red-500/40 rounded-xl transition-colors text-white font-medium backdrop-blur-sm"
              >
                Revisar Erros ({stats.erros})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card Area */}
      <div className={`p-6 ${isExpanded ? 'flex-1 flex flex-col justify-center' : ''}`}>
        {/* Contador com badge estilizado */}
        <div className="text-center mb-4">
          <span className="bg-white/20 backdrop-blur-sm text-white/90 text-sm px-4 py-1.5 rounded-full">
            Card {currentIndex + 1} de {cards.length}
          </span>
        </div>

        {/* Flashcard com flip animation estilo Aurora */}
        <div
          className={`relative cursor-pointer perspective-1000 ${isExpanded ? 'min-h-[320px]' : 'min-h-[240px]'}`}
          onClick={flipCard}
        >
          <div className={`relative w-full h-full flip-transition preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`} style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}>
            {/* Frente - Card branco com sombra */}
            <div
              className="absolute inset-0 backface-hidden rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-2xl"
              style={{
                backfaceVisibility: 'hidden',
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div className="w-12 h-12 rounded-full aurora-gradient flex items-center justify-center mb-6 shadow-lg">
                <span className="text-white font-bold">{currentIndex + 1}</span>
              </div>
              <p className="text-xl sm:text-2xl font-medium text-center text-gray-800">{currentCard.frente}</p>
              <p className="mt-6 text-sm text-purple-500/70">Toque para ver a resposta</p>
            </div>

            {/* Verso - Card branco com resposta */}
            <div
              className="absolute inset-0 backface-hidden rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-2xl"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'rgba(255, 255, 255, 0.98)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <p className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-6">{currentCard.verso}</p>
              {currentCard.referencia && (
                <p className="text-sm text-gray-500 text-center mb-6">{currentCard.referencia}</p>
              )}
            </div>
          </div>
        </div>

        {/* Botoes de navegacao e resposta - estilo Aurora */}
        <div className="mt-6">
          {!isFlipped ? (
            /* Navegacao quando nao virado */
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className="w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={flipCard}
                className="px-8 py-3 rounded-xl text-white font-medium transition-all hover:scale-105 active:scale-95 shadow-lg"
                style={{ background: 'linear-gradient(135deg, hsl(280 80% 60%), hsl(200 90% 55%))' }}
              >
                Mostrar Resposta
              </button>

              <button
                onClick={goToNext}
                disabled={currentIndex === cards.length - 1}
                className="w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>
          ) : (
            /* Botoes Anki quando virado - estilo Aurora pastel */
            <div className="space-y-3">
              <p className="text-center text-white/60 text-sm">Como foi?</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => markAnswer('errou')}
                  className="flex-1 max-w-[120px] py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'hsl(0 70% 95%)', color: 'hsl(0 70% 45%)' }}
                >
                  <X className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm">Errei</span>
                  <span className="block text-xs opacity-60">(1)</span>
                </button>

                <button
                  onClick={() => markAnswer('revisao')}
                  className="flex-1 max-w-[120px] py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'hsl(45 80% 95%)', color: 'hsl(45 80% 35%)' }}
                >
                  <Clock className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm">Revisar</span>
                  <span className="block text-xs opacity-60">(2)</span>
                </button>

                <button
                  onClick={() => markAnswer('acertou')}
                  className="flex-1 max-w-[120px] py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'hsl(150 60% 95%)', color: 'hsl(150 60% 35%)' }}
                >
                  <Check className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm">Acertei</span>
                  <span className="block text-xs opacity-60">(3)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conclusao - estilo Aurora */}
      {allReviewed && (
        <div className="p-6 bg-black/20 backdrop-blur-sm border-t border-white/10">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full aurora-gradient mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-2xl">🎉</span>
            </div>
            <h4 className="text-white font-bold text-lg">Parabens! Voce revisou todos os cards!</h4>
            <p className="text-white/60 text-sm mt-2">
              Acertos: {stats.acertos} | Erros: {stats.erros} | Para revisao: {stats.revisao}
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={resetDeck}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', backdropFilter: 'blur(10px)' }}
              >
                <RotateCcw className="w-4 h-4 inline mr-2" />
                Revisar Novamente
              </button>
              {stats.erros > 0 && (
                <button
                  onClick={reviewErrors}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'hsl(0 70% 95%)', color: 'hsl(0 70% 45%)' }}
                >
                  Apenas Erros ({stats.erros})
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
