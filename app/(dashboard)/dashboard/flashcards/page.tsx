'use client'
import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

type Deck = { id: string; nome: string; total_cards: number; progresso: number; materia: string }

export default function FlashcardsPage() {
  const { user } = useAuth()
  const [showCard, setShowCard] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)

  const cards = [
    { frente: 'Qual é o principal pigmento utilizado na fotossíntese?', verso: 'Clorofila' },
    { frente: 'Onde ocorre a respiração celular?', verso: 'Mitocôndrias' },
    { frente: 'O que é ATP?', verso: 'Adenosina trifosfato - molécula de energia' },
  ]

  useEffect(() => {
    if (user) loadDecks()
  }, [user])

  const loadDecks = async () => {
    const { data } = await supabase.from('flashcard_decks').select('*').eq('user_id', user?.id)
    if (data && data.length > 0) {
      setDecks(data as Deck[])
      setSelectedDeck(data[0] as Deck)
    }
  }

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

  return (
    <div className="min-h-screen">
      <Header title="Flashcards" />

      <div className="p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <span>Flashcards</span>
              {selectedDeck && (
                <>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span>{selectedDeck.materia || 'Geral'}</span>
                </>
              )}
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">{selectedDeck?.nome || 'Meus Flashcards'}</h2>
            <p className="text-slate-400 text-sm">Revisando {cards.length} cartões • Vence hoje</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 items-center rounded-lg bg-slate-800 p-1">
              <label className="cursor-pointer h-full flex items-center px-4 rounded-md bg-[#1c252e] shadow-sm text-white text-sm font-medium">
                <span className="material-symbols-outlined text-lg mr-2">style</span>
                Estudar
              </label>
              <label className="cursor-pointer h-full flex items-center px-4 rounded-md text-slate-500 hover:text-white text-sm font-medium transition-colors">
                <span className="material-symbols-outlined text-lg mr-2">grid_view</span>
                Grade
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <div className="flex justify-between items-end text-sm">
            <span className="text-white font-medium">Progresso da Sessão</span>
            <span className="text-slate-500">{currentCard + 1} / {cards.length}</span>
          </div>
          <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentCard + 1) / cards.length) * 100}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Card Principal */}
          <div className="xl:col-span-3 flex flex-col items-center">
            <div
              onClick={() => setShowCard(!showCard)}
              className="w-full max-w-2xl aspect-[3/2] bg-[#1c252e] rounded-2xl shadow-xl border border-slate-700 flex flex-col items-center justify-center p-8 md:p-12 text-center cursor-pointer group hover:border-primary transition-colors relative"
            >
              <span className="absolute top-6 left-6 text-xs font-bold tracking-widest text-slate-400 uppercase">
                {showCard ? 'Resposta' : 'Questão'}
              </span>
              <p className="text-2xl md:text-3xl font-medium text-white leading-snug">
                {showCard ? cards[currentCard].verso : cards[currentCard].frente}
              </p>
              <div className="absolute bottom-6 text-slate-400 text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-lg">touch_app</span>
                Clique para virar
              </div>
            </div>

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

          {/* Sidebar - Decks */}
          <div className="xl:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">Seus Decks</h3>
              <button onClick={createDeck} className="text-primary text-sm hover:underline">+ Novo</button>
            </div>
            {decks.length === 0 ? (
              <div className="bg-[#1c252e] rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-slate-400 text-sm">Nenhum deck criado</p>
                <button onClick={createDeck} className="mt-2 text-primary text-sm font-medium hover:underline">
                  Criar primeiro deck
                </button>
              </div>
            ) : (
              decks.map(deck => (
                <div
                  key={deck.id}
                  onClick={() => setSelectedDeck(deck)}
                  className={`bg-[#1c252e] rounded-xl p-4 border cursor-pointer transition-colors ${
                    selectedDeck?.id === deck.id ? 'border-primary' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">{deck.nome}</h4>
                    <span className="text-slate-500 text-sm">{deck.total_cards || 0} cards</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${deck.progresso || 0}%` }} />
                  </div>
                  <p className="text-slate-500 text-xs mt-2">{deck.progresso || 0}% completo</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
