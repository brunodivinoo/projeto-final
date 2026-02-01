'use client'

/**
 * Artefato de Flashcards Interativo
 * Permite virar cards, marcar como aprendido, embaralhar
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Shuffle, CheckCircle, RotateCcw, BookOpen } from 'lucide-react'

export interface Flashcard {
  id: string
  front: string
  back: string
  learned: boolean
}

interface FlashcardArtifactProps {
  cards: Flashcard[]
  onMarkLearned?: (id: string, learned: boolean) => void
  onShuffle?: () => void
  title?: string
}

export function FlashcardArtifact({
  cards: initialCards,
  onMarkLearned,
  onShuffle,
  title = 'Flashcards'
}: FlashcardArtifactProps) {
  const [cards, setCards] = useState(initialCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const currentCard = cards[currentIndex]
  const learnedCount = cards.filter(c => c.learned).length
  const progress = cards.length > 0 ? Math.round((learnedCount / cards.length) * 100) : 0

  const handleNext = useCallback(() => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length)
    }, 150)
  }, [cards.length])

  const handlePrev = useCallback(() => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
    }, 150)
  }, [cards.length])

  const handleMarkLearned = useCallback(() => {
    const updatedCards = [...cards]
    updatedCards[currentIndex].learned = !updatedCards[currentIndex].learned
    setCards(updatedCards)
    onMarkLearned?.(currentCard.id, updatedCards[currentIndex].learned)
  }, [cards, currentIndex, currentCard?.id, onMarkLearned])

  const handleShuffle = useCallback(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    onShuffle?.()
  }, [cards, onShuffle])

  const handleReset = useCallback(() => {
    const resetCards = cards.map(c => ({ ...c, learned: false }))
    setCards(resetCards)
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [cards])

  if (cards.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Nenhum flashcard disponível
      </div>
    )
  }

  // Modo lista (ver todos)
  if (showAll) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            {title} ({cards.length} cards)
          </h3>
          <button
            onClick={() => setShowAll(false)}
            className="text-sm text-purple-400 hover:text-purple-300 transition"
          >
            Modo estudo
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {cards.map((card, i) => (
            <div
              key={card.id}
              className={`p-4 rounded-xl border transition ${
                card.learned
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-slate-100 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-slate-600 text-xs mb-1">Frente:</p>
                  <p className="text-white font-medium">{card.front}</p>
                  <p className="text-slate-600 text-xs mt-2 mb-1">Verso:</p>
                  <p className="text-slate-700">{card.back}</p>
                </div>
                <button
                  onClick={() => {
                    const updated = [...cards]
                    updated[i].learned = !updated[i].learned
                    setCards(updated)
                  }}
                  className={`p-2 rounded-lg transition ${
                    card.learned
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-100 text-slate-500 hover:text-slate-600'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Modo estudo (um por vez)
  return (
    <div className="flex flex-col items-center py-4">
      {/* Header com progresso */}
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <span className="text-slate-600 text-sm">
            {currentIndex + 1} / {cards.length}
          </span>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-emerald-400 text-sm">
            {learnedCount} aprendidos
          </span>
        </div>

        <button
          onClick={() => setShowAll(true)}
          className="text-sm text-slate-500 hover:text-slate-600 transition"
        >
          Ver todos
        </button>
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-md h-56 cursor-pointer perspective-1000 select-none"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex + (isFlipped ? '-back' : '-front')}
            initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              className={`absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center
                         text-center transition-all shadow-xl ${
                isFlipped
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                  : 'bg-gradient-to-br from-purple-600 to-indigo-700'
              } ${currentCard.learned ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900' : ''}`}
            >
              <p className="text-slate-600 text-xs mb-2 uppercase tracking-wider">
                {isFlipped ? 'Verso' : 'Frente'}
              </p>
              <p className="text-white text-lg font-medium leading-relaxed">
                {isFlipped ? currentCard.back : currentCard.front}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-slate-500 text-xs mt-3">Clique no card para virar</p>

      {/* Controles principais */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handlePrev}
          className="p-3 rounded-xl bg-slate-100 hover:bg-slate-100 text-slate-600 hover:text-white transition"
          title="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleMarkLearned}
          className={`px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${
            currentCard.learned
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-100 hover:text-white'
          }`}
        >
          <CheckCircle className={`w-4 h-4 ${currentCard.learned ? 'fill-emerald-400' : ''}`} />
          {currentCard.learned ? 'Aprendido!' : 'Marcar como aprendido'}
        </button>

        <button
          onClick={handleNext}
          className="p-3 rounded-xl bg-slate-100 hover:bg-slate-100 text-slate-600 hover:text-white transition"
          title="Próximo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Controles secundários */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={handleShuffle}
          className="text-sm text-slate-500 hover:text-slate-600 transition flex items-center gap-1.5"
        >
          <Shuffle className="w-4 h-4" />
          Embaralhar
        </button>

        <span className="text-white/20">|</span>

        <button
          onClick={handleReset}
          className="text-sm text-slate-500 hover:text-slate-600 transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          Recomeçar
        </button>
      </div>

      {/* Indicadores de posição */}
      <div className="flex flex-wrap justify-center gap-1 mt-6 max-w-md">
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => {
              setIsFlipped(false)
              setCurrentIndex(i)
            }}
            className={`w-2.5 h-2.5 rounded-full transition ${
              i === currentIndex
                ? 'bg-purple-500 scale-125'
                : card.learned
                ? 'bg-emerald-500/50 hover:bg-emerald-500/70'
                : 'bg-slate-200 hover:bg-white/40'
            }`}
            title={`Card ${i + 1}${card.learned ? ' (aprendido)' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

// Função helper para parsear flashcards do texto da IA
export function parseFlashcardsFromText(text: string): Flashcard[] {
  const flashcards: Flashcard[] = []

  // Pattern: **Frente:** ... **Verso:** ...
  const pattern = /\*\*Frente:\*\*\s*([\s\S]*?)\*\*Verso:\*\*\s*([\s\S]*?)(?=\*\*Frente:\*\*|---|$)/gi
  let match

  while ((match = pattern.exec(text)) !== null) {
    const front = match[1].trim()
    const back = match[2].trim()

    if (front && back) {
      flashcards.push({
        id: `fc-${flashcards.length + 1}-${Date.now()}`,
        front,
        back,
        learned: false
      })
    }
  }

  // Pattern alternativo: 1. Frente: ... Verso: ...
  if (flashcards.length === 0) {
    const altPattern = /\d+\.\s*(?:Frente|Pergunta|Q):\s*([\s\S]*?)(?:Verso|Resposta|R):\s*([\s\S]*?)(?=\d+\.\s*(?:Frente|Pergunta|Q):|$)/gi

    while ((match = altPattern.exec(text)) !== null) {
      const front = match[1].trim()
      const back = match[2].trim()

      if (front && back) {
        flashcards.push({
          id: `fc-${flashcards.length + 1}-${Date.now()}`,
          front,
          back,
          learned: false
        })
      }
    }
  }

  return flashcards
}
