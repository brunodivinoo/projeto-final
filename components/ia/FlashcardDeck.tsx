'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Save,
  Sparkles,
  Target,
  Zap,
  BookOpen,
  Trophy,
  ArrowRight
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
  isFullscreenMode?: boolean
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
  conversaId,
  isFullscreenMode = false
}: FlashcardDeckProps) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [progress, setProgress] = useState<Map<string, CardProgress>>(new Map())
  const [showStats, setShowStats] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [animatingAnswer, setAnimatingAnswer] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Inicializar progress
  useEffect(() => {
    const initialProgress = new Map<string, CardProgress>()
    initialCards.forEach(card => {
      initialProgress.set(card.id, { status: 'nao_visto', vezes_revisado: 0 })
    })
    setProgress(initialProgress)
    setCards(initialCards)
    setStartTime(new Date())
    setSessionComplete(false)
  }, [initialCards])

  const currentCard = cards[currentIndex]

  // Estatísticas
  const stats = useMemo(() => {
    let acertos = 0, erros = 0, naoVistos = 0, revisao = 0
    progress.forEach(p => {
      if (p.status === 'acertou') acertos++
      else if (p.status === 'errou') erros++
      else if (p.status === 'revisao') revisao++
      else naoVistos++
    })
    const total = cards.length
    const porcentagem = total > 0 ? Math.round(((acertos + revisao) / total) * 100) : 0
    return { acertos, erros, naoVistos, revisao, total, porcentagem }
  }, [progress, cards.length])

  // Virar card
  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev)
  }, [])

  // Navegar
  const goToNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
    } else if (stats.naoVistos === 0) {
      setSessionComplete(true)
    }
  }, [currentIndex, cards.length, stats.naoVistos])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setIsFlipped(false)
    }
  }, [currentIndex])

  // Marcar resposta com animação
  const markAnswer = useCallback((status: 'acertou' | 'errou' | 'revisao') => {
    if (!currentCard) return

    setAnimatingAnswer(status)
    
    setTimeout(() => {
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
      
      setAnimatingAnswer(null)
      goToNext()
    }, 300)
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
    setSessionComplete(false)
    const resetProgress = new Map<string, CardProgress>()
    cards.forEach(card => {
      resetProgress.set(card.id, { status: 'nao_visto', vezes_revisado: 0 })
    })
    setProgress(resetProgress)
    setStartTime(new Date())
  }, [cards])

  // Revisar erros
  const reviewErrors = useCallback(() => {
    const errorCards = cards.filter(c => progress.get(c.id)?.status === 'errou')
    if (errorCards.length > 0) {
      setCards(errorCards)
      setCurrentIndex(0)
      setIsFlipped(false)
      setSessionComplete(false)
    }
  }, [cards, progress])

  // Teclas de atalho
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionComplete) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        flipCard()
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        if (isFlipped) markAnswer('acertou')
        else goToNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (isFlipped) markAnswer('errou')
        else goToPrev()
      } else if (e.key === '1' && isFlipped) markAnswer('errou')
      else if (e.key === '2' && isFlipped) markAnswer('revisao')
      else if (e.key === '3' && isFlipped) markAnswer('acertou')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flipCard, goToNext, goToPrev, isFlipped, markAnswer, sessionComplete])

  // Timer
  const elapsedTime = useMemo(() => {
    if (!startTime) return '0:00'
    const diff = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
    const mins = Math.floor(diff / 60)
    const secs = diff % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [startTime])

  const [, forceUpdate] = useState({})
  useEffect(() => {
    const interval = setInterval(() => forceUpdate({}), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!currentCard && !sessionComplete) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-purple-500" />
        </div>
        <p className="text-gray-500">Nenhum flashcard para revisar</p>
      </div>
    )
  }

  // Tela de conclusão
  if (sessionComplete) {
    const emoji = stats.porcentagem >= 80 ? '🎉' : stats.porcentagem >= 50 ? '👍' : '💪'
    const message = stats.porcentagem >= 80 ? 'Excelente!' : stats.porcentagem >= 50 ? 'Bom trabalho!' : 'Continue praticando!'
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 ${isExpanded ? 'fixed inset-4 z-50' : ''}`}
      >
        <div className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <span className="text-4xl">{emoji}</span>
          </motion.div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{message}</h3>
          <p className="text-gray-500 mb-6">Você completou todos os {stats.total} flashcards</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
            <div className="bg-emerald-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-emerald-600">{stats.acertos}</div>
              <div className="text-sm text-emerald-600/70">Acertos</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-amber-600">{stats.revisao}</div>
              <div className="text-sm text-amber-600/70">Revisar</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-red-600">{stats.erros}</div>
              <div className="text-sm text-red-600/70">Erros</div>
            </div>
          </div>

          {/* Progress Ring */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
              <motion.circle
                cx="64" cy="64" r="56"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 352' }}
                animate={{ strokeDasharray: `${stats.porcentagem * 3.52} 352` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-800">{stats.porcentagem}%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={resetDeck}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Revisar Tudo
            </button>
            {stats.erros > 0 && (
              <button
                onClick={reviewErrors}
                className="flex items-center gap-2 px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-medium transition-all"
              >
                <Target className="w-4 h-4" />
                Apenas Erros ({stats.erros})
              </button>
            )}
            {onSaveToArtefatos && (
              <button
                onClick={() => onSaveToArtefatos(initialCards, titulo)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-medium transition-all"
              >
                <Save className="w-4 h-4" />
                Salvar na Biblioteca
              </button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  const cardProgress = progress.get(currentCard.id)

  // Determinar se está em modo expandido (interno ou externo via fullscreen do modal)
  const effectiveExpanded = isExpanded || isFullscreenMode

  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all ${isExpanded ? 'fixed inset-4 z-50 flex flex-col' : ''} ${isFullscreenMode ? 'h-full flex flex-col' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md flex-shrink-0">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none">{titulo}</h3>
            <p className="text-[10px] sm:text-xs text-gray-500">{stats.total - stats.naoVistos}/{stats.total}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-gray-500 text-xs bg-gray-100 px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3" />
            {elapsedTime}
          </div>
          <button onClick={shuffleCards} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Embaralhar">
            <Shuffle className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={() => setShowStats(!showStats)} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Estatísticas">
            <BarChart3 className="w-4 h-4 text-gray-500" />
          </button>
          {onSaveToArtefatos && (
            <button onClick={() => onSaveToArtefatos(cards, titulo)} className="hidden sm:block p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Salvar">
              <Save className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-100 flex">
        <motion.div className="bg-emerald-500" animate={{ width: `${(stats.acertos / stats.total) * 100}%` }} />
        <motion.div className="bg-amber-500" animate={{ width: `${(stats.revisao / stats.total) * 100}%` }} />
        <motion.div className="bg-red-500" animate={{ width: `${(stats.erros / stats.total) * 100}%` }} />
      </div>

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-100 overflow-hidden"
          >
            <div className="p-4 bg-gray-50/50">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-emerald-600">{stats.acertos}</div>
                  <div className="text-xs text-gray-500">Acertos</div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-amber-600">{stats.revisao}</div>
                  <div className="text-xs text-gray-500">Revisar</div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-red-600">{stats.erros}</div>
                  <div className="text-xs text-gray-500">Erros</div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-gray-600">{stats.naoVistos}</div>
                  <div className="text-xs text-gray-500">Restantes</div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={resetDeck} className="flex-1 py-2 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium">
                  <RotateCcw className="w-3 h-3 inline mr-1" /> Reiniciar
                </button>
                {stats.erros > 0 && (
                  <button onClick={reviewErrors} className="flex-1 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-medium">
                    Revisar Erros ({stats.erros})
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Area */}
      <div className={`p-3 sm:p-6 ${effectiveExpanded ? 'flex-1 flex flex-col justify-center' : ''}`}>
        {/* Card Counter */}
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <span className="text-xs sm:text-sm font-medium text-gray-400">Card</span>
          <span className="px-2 sm:px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm font-bold text-gray-700">
            {currentIndex + 1} / {cards.length}
          </span>
          {cardProgress?.status && cardProgress.status !== 'nao_visto' && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
              cardProgress.status === 'acertou' ? 'bg-emerald-100 text-emerald-700' :
              cardProgress.status === 'errou' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {cardProgress.status === 'acertou' ? '✓ Acertou' : cardProgress.status === 'errou' ? '✗ Errou' : '↻ Revisar'}
            </span>
          )}
        </div>

        {/* Flashcard */}
        <div
          ref={cardRef}
          className={`relative cursor-pointer ${isExpanded ? 'min-h-[300px] sm:min-h-[350px]' : 'min-h-[250px] sm:min-h-[280px]'}`}
          onClick={flipCard}
          style={{ perspective: '1000px' }}
        >
          <motion.div
            className="relative w-full min-h-[250px] sm:min-h-[280px]"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Frente */}
            <div
              className={`absolute inset-0 rounded-xl sm:rounded-2xl p-4 sm:p-8 flex flex-col items-center justify-center shadow-lg border-2 transition-all ${
                animatingAnswer === 'errou' ? 'border-red-300 bg-red-50' :
                animatingAnswer === 'acertou' ? 'border-emerald-300 bg-emerald-50' :
                animatingAnswer === 'revisao' ? 'border-amber-300 bg-amber-50' :
                'border-gray-200 bg-white'
              }`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 sm:mb-6 shadow-md">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-sm sm:text-xl font-medium text-center text-gray-800 leading-relaxed max-h-[120px] sm:max-h-[160px] overflow-y-auto">{currentCard.frente}</p>
              <p className="mt-3 sm:mt-6 text-xs sm:text-sm text-purple-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" /> Toque para ver
              </p>
            </div>

            {/* Verso */}
            <div
              className="absolute inset-0 rounded-xl sm:rounded-2xl p-4 sm:p-8 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg border-2 border-purple-200"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 px-2 py-0.5 sm:px-3 sm:py-1 bg-purple-500 text-white text-[10px] sm:text-xs font-medium rounded-full">
                Resposta
              </div>
              <p className="text-sm sm:text-lg font-medium text-center text-gray-800 leading-relaxed mt-4 sm:mt-0 max-h-[140px] sm:max-h-[200px] overflow-y-auto">{currentCard.verso}</p>
              {currentCard.referencia && (
                <p className="text-[10px] sm:text-xs text-purple-500 text-center italic mt-2">{currentCard.referencia}</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Botões de Ação */}
        <div className="mt-4 sm:mt-6">
          <AnimatePresence mode="wait">
            {!isFlipped ? (
              <motion.div
                key="nav"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-3 sm:gap-4"
              >
                <button
                  onClick={goToPrev}
                  disabled={currentIndex === 0}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </button>
                <button
                  onClick={flipCard}
                  className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm sm:text-base font-medium shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-105 active:scale-95"
                >
                  Ver Resposta
                </button>
                <button
                  onClick={goToNext}
                  disabled={currentIndex === cards.length - 1}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="answer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2 sm:space-y-3"
              >
                <p className="text-center text-gray-500 text-xs sm:text-sm">Como foi?</p>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <button
                    onClick={() => markAnswer('errou')}
                    disabled={!!animatingAnswer}
                    className="flex-1 max-w-[90px] sm:max-w-[130px] py-2.5 sm:py-4 rounded-xl bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 font-medium transition-all active:scale-95 disabled:opacity-50"
                  >
                    <X className="w-5 h-5 mx-auto mb-0.5" />
                    <span className="text-xs sm:text-sm block">Errei</span>
                  </button>
                  <button
                    onClick={() => markAnswer('revisao')}
                    disabled={!!animatingAnswer}
                    className="flex-1 max-w-[90px] sm:max-w-[130px] py-2.5 sm:py-4 rounded-xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-600 font-medium transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Clock className="w-5 h-5 mx-auto mb-0.5" />
                    <span className="text-xs sm:text-sm block">Revisar</span>
                  </button>
                  <button
                    onClick={() => markAnswer('acertou')}
                    disabled={!!animatingAnswer}
                    className="flex-1 max-w-[90px] sm:max-w-[130px] py-2.5 sm:py-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 text-emerald-600 font-medium transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-5 h-5 mx-auto mb-0.5" />
                    <span className="text-xs sm:text-sm block">Acertei</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer - Oculto no mobile */}
      <div className="hidden sm:block px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-gray-400 text-[11px] text-center">
          Atalhos: <span className="text-gray-500">Espaço</span> (virar) • <span className="text-gray-500">← →</span> (navegar) • <span className="text-gray-500">1 2 3</span> (responder)
        </p>
      </div>
    </div>
  )
}
