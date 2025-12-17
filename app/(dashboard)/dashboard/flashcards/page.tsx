'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'

type Deck = { id: string; nome: string; total_cards: number; progresso: number; materia: string }

export default function FlashcardsPage() {
  const { user } = useAuth()
  const [showCard, setShowCard] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [decks, setDecks] = useState<Deck[]>([])
  const [, setSelectedDeck] = useState<Deck | null>(null)
  const [aiTopic, setAiTopic] = useState('')
  const [generatingCards, setGeneratingCards] = useState(false)

  const cards = [
    { frente: 'Qual é o principal pigmento utilizado na fotossíntese?', verso: 'Clorofila' },
    { frente: 'Onde ocorre a respiração celular?', verso: 'Mitocôndrias' },
    { frente: 'O que é ATP?', verso: 'Adenosina trifosfato - molécula de energia' },
  ]

  const loadDecks = async () => {
    const { data } = await supabase.from('flashcard_decks').select('*').eq('user_id', user?.id)
    if (data && data.length > 0) {
      setDecks(data as Deck[])
      setSelectedDeck(data[0] as Deck)
    }
  }

  useEffect(() => {
    if (user) loadDecks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const createDeck = async () => {
    if (!user) return
    const nome = prompt('Nome do deck:')
    if (!nome) return

    const { data } = await supabase.from('flashcard_decks').insert({
      user_id: user.id,
      nome,
      materia: 'Geral'
    }).select().single()

    if (data) {
      setDecks([...decks, data as Deck])
      setSelectedDeck(data as Deck)
    }
  }

  const generateCards = async () => {
    if (!aiTopic.trim()) return
    setGeneratingCards(true)
    setTimeout(() => {
      setGeneratingCards(false)
      setAiTopic('')
    }, 2000)
  }

  return (
    <div className="min-h-screen">
      <Header title="Flashcards por IA" />

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <span>Flashcards</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span>Biologia</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Fotossíntese</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Revisando 20 cartões • Vence hoje</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={createDeck}
                  className="flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">add_circle</span>
                  Criar Deck
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-2 mb-8">
              <div className="flex justify-between items-end text-sm">
                <span className="text-slate-900 dark:text-white font-medium">Progresso da Sessão</span>
                <span className="text-slate-500">9 / 20</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            {/* Card Area */}
            <div className="flex flex-col justify-center items-center min-h-[350px] mb-8">
              <div className="group relative w-full max-w-2xl aspect-[3/2]">
                <div
                  onClick={() => setShowCard(!showCard)}
                  className="relative w-full h-full duration-500 cursor-pointer"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="absolute inset-0 w-full h-full bg-white dark:bg-[#1c252e] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-8 md:p-12 text-center z-10">
                    <span className="absolute top-6 left-6 text-xs font-bold tracking-widest text-slate-400 uppercase">
                      {showCard ? 'Resposta' : 'Questão'}
                    </span>
                    <p className="text-2xl md:text-3xl font-medium text-slate-900 dark:text-white leading-snug">
                      {showCard ? cards[currentCard].verso : cards[currentCard].frente}
                    </p>
                    <div className="absolute bottom-6 text-slate-400 text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-lg">touch_app</span>
                      Clique para virar
                    </div>
                  </div>
                </div>
              </div>

              {/* Difficulty Buttons */}
              <div className="mt-8 flex flex-wrap justify-center gap-4 w-full max-w-2xl">
                <button
                  onClick={() => { setCurrentCard(c => Math.min(cards.length - 1, c + 1)); setShowCard(false) }}
                  className="flex-1 min-w-[100px] py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 font-medium hover:bg-red-500/20 transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-xs uppercase tracking-wider opacity-70">Difícil</span>
                  <span className="text-sm font-bold">1m</span>
                </button>
                <button
                  onClick={() => { setCurrentCard(c => Math.min(cards.length - 1, c + 1)); setShowCard(false) }}
                  className="flex-1 min-w-[100px] py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 font-medium hover:bg-yellow-500/20 transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-xs uppercase tracking-wider opacity-70">Médio</span>
                  <span className="text-sm font-bold">10m</span>
                </button>
                <button
                  onClick={() => { setCurrentCard(c => Math.min(cards.length - 1, c + 1)); setShowCard(false) }}
                  className="flex-1 min-w-[100px] py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-500 font-medium hover:bg-green-500/20 transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-xs uppercase tracking-wider opacity-70">Fácil</span>
                  <span className="text-sm font-bold">4d</span>
                </button>
              </div>
            </div>

            {/* AI Generator Section */}
            <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-purple-500">auto_awesome</span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Gerador IA</h3>
              </div>
              <textarea
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="w-full h-24 bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-0 rounded-lg text-sm text-slate-900 dark:text-white p-3 resize-none placeholder:text-slate-400 mb-4"
                placeholder="Digite um tópico para gerar flashcards automaticamente (ex: Revolução Francesa, Mitose, Física Quântica...)"
              />
              <button
                onClick={generateCards}
                disabled={generatingCards}
                className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white py-2 px-6 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                {generatingCards ? 'Gerando...' : 'Gerar Cartões com IA'}
              </button>
            </div>

            {/* Decks List */}
            {decks.length > 0 && (
              <div className="mt-8">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Seus Decks</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {decks.map(deck => (
                    <div key={deck.id} className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-primary transition-colors cursor-pointer">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{deck.nome}</h4>
                      <p className="text-sm text-slate-500">{deck.materia}</p>
                      <div className="mt-2 text-xs text-slate-400">{deck.total_cards} cartões</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
