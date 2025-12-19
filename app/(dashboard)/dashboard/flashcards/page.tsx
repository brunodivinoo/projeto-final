'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { useFlashcards, Deck, Flashcard, calcularIntervaloDisplay } from '@/hooks/useFlashcards'
import { useAuth } from '@/contexts/AuthContext'

type ViewMode = 'decks' | 'revisar' | 'gerar' | 'deck-detail'

// Cores disponiveis para decks
const CORES_DECK = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#22c55e', '#14b8a6', '#6366f1'
]

// Icones disponiveis para decks
const ICONES_DECK = [
  'style', 'school', 'science', 'calculate', 'history_edu',
  'language', 'public', 'psychology', 'biotech', 'balance'
]

export default function FlashcardsPage() {
  const { user } = useAuth()
  const {
    decks,
    cardsParaRevisar,
    totalCards,
    totalDecks,
    limiteBaralhos,
    limiteGeracoesDia,
    geracoesHoje,
    loading,
    error,
    refresh,
    criarDeck,
    deletarDeck,
    registrarRevisao,
    getCardsParaRevisarDoDeck
  } = useFlashcards()

  // Estados da UI
  const [viewMode, setViewMode] = useState<ViewMode>('decks')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [deckCards, setDeckCards] = useState<Flashcard[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showCreateDeck, setShowCreateDeck] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)

  // Estados do formulario de criar deck
  const [novoDeckNome, setNovoDeckNome] = useState('')
  const [novoDeckDescricao, setNovoDeckDescricao] = useState('')
  const [novoDeckCor, setNovoDeckCor] = useState(CORES_DECK[0])
  const [novoDeckIcone, setNovoDeckIcone] = useState(ICONES_DECK[0])

  // Estados do gerador
  const [gerarDisciplina, setGerarDisciplina] = useState('')
  const [gerarAssunto, setGerarAssunto] = useState('')
  const [gerarSubassunto, setGerarSubassunto] = useState('')
  const [gerarDificuldade, setGerarDificuldade] = useState('medio')
  const [gerarQuantidade, setGerarQuantidade] = useState(5)
  const [gerarDeckId, setGerarDeckId] = useState('')
  const [gerando, setGerando] = useState(false)
  const [gerarErro, setGerarErro] = useState('')
  const [gerarSucesso, setGerarSucesso] = useState('')

  // Carregar preferencias salvas do gerador
  useEffect(() => {
    const saved = localStorage.getItem('flashcards_gerador_prefs')
    if (saved) {
      try {
        const prefs = JSON.parse(saved)
        setGerarDisciplina(prefs.disciplina || '')
        setGerarAssunto(prefs.assunto || '')
        setGerarSubassunto(prefs.subassunto || '')
        setGerarDificuldade(prefs.dificuldade || 'medio')
      } catch {
        // Ignorar erro
      }
    }
  }, [])

  // Salvar preferencias do gerador
  const salvarPreferenciasGerador = useCallback(() => {
    localStorage.setItem('flashcards_gerador_prefs', JSON.stringify({
      disciplina: gerarDisciplina,
      assunto: gerarAssunto,
      subassunto: gerarSubassunto,
      dificuldade: gerarDificuldade
    }))
  }, [gerarDisciplina, gerarAssunto, gerarSubassunto, gerarDificuldade])

  // Criar novo deck
  const handleCriarDeck = async () => {
    if (!novoDeckNome.trim()) return

    const novoDeck = await criarDeck({
      nome: novoDeckNome,
      descricao: novoDeckDescricao,
      cor: novoDeckCor,
      icone: novoDeckIcone
    })

    if (novoDeck) {
      setShowCreateDeck(false)
      setNovoDeckNome('')
      setNovoDeckDescricao('')
    }
  }

  // Iniciar revisao de um deck
  const iniciarRevisao = async (deck: Deck) => {
    const cards = await getCardsParaRevisarDoDeck(deck.id)
    if (cards.length === 0) {
      alert('Nenhum card para revisar neste deck!')
      return
    }
    setSelectedDeck(deck)
    setDeckCards(cards)
    setCurrentCardIndex(0)
    setShowAnswer(false)
    setViewMode('revisar')
  }

  // Iniciar revisao geral
  const iniciarRevisaoGeral = () => {
    if (cardsParaRevisar.length === 0) {
      alert('Nenhum card para revisar!')
      return
    }
    setSelectedDeck(null)
    setDeckCards(cardsParaRevisar)
    setCurrentCardIndex(0)
    setShowAnswer(false)
    setViewMode('revisar')
  }

  // Registrar resposta na revisao
  const handleResposta = async (qualidade: number) => {
    const card = deckCards[currentCardIndex]
    if (!card) return

    await registrarRevisao(card.id, qualidade)

    // Proximo card ou finalizar
    if (currentCardIndex < deckCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
      setShowAnswer(false)
    } else {
      // Finalizar revisao
      setViewMode('decks')
      refresh()
    }
  }

  // Gerar flashcards com IA
  const handleGerarFlashcards = async () => {
    if (!gerarDeckId || !user) return

    setGerando(true)
    setGerarErro('')
    setGerarSucesso('')
    salvarPreferenciasGerador()

    try {
      const response = await fetch('/api/flashcards/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          deck_id: gerarDeckId,
          disciplina: gerarDisciplina,
          assunto: gerarAssunto,
          subassunto: gerarSubassunto,
          dificuldade: gerarDificuldade,
          quantidade: gerarQuantidade
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setGerarErro(data.error || 'Erro ao gerar flashcards')
        return
      }

      setGerarSucesso(`${data.quantidade} flashcards gerados com sucesso!`)
      refresh()

      // Limpar apos sucesso
      setTimeout(() => {
        setGerarSucesso('')
        setShowGenerator(false)
      }, 2000)
    } catch (err) {
      console.error('Erro ao gerar:', err)
      setGerarErro('Erro ao gerar flashcards')
    } finally {
      setGerando(false)
    }
  }

  // Card atual para revisao
  const cardAtual = deckCards[currentCardIndex]

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Flashcards" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="Flashcards" />

      <main className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">

          {/* Erro global */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Header com estatisticas */}
          {viewMode === 'decks' && (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                    Seus Flashcards
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400">
                    Sistema de repeticao espacada para maximizar sua memoria
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {cardsParaRevisar.length > 0 && (
                    <button
                      onClick={iniciarRevisaoGeral}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                    >
                      <span className="material-symbols-outlined">play_arrow</span>
                      Revisar Agora ({cardsParaRevisar.length})
                    </button>
                  )}

                  <button
                    onClick={() => setShowGenerator(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined">auto_awesome</span>
                    Gerar com IA
                  </button>

                  <button
                    onClick={() => setShowCreateDeck(true)}
                    disabled={limiteBaralhos !== -1 && totalDecks >= limiteBaralhos}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Criar Deck
                  </button>
                </div>
              </div>

              {/* Cards de estatisticas */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-[#1c252e] rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-500">style</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCards}</p>
                      <p className="text-xs text-slate-500">Total de Cards</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1c252e] rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-purple-500">folder</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {totalDecks}/{limiteBaralhos === -1 ? '∞' : limiteBaralhos}
                      </p>
                      <p className="text-xs text-slate-500">Baralhos</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1c252e] rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-orange-500">schedule</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{cardsParaRevisar.length}</p>
                      <p className="text-xs text-slate-500">Para Revisar</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1c252e] rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-500">bolt</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {geracoesHoje}/{limiteGeracoesDia === -1 ? '∞' : limiteGeracoesDia}
                      </p>
                      <p className="text-xs text-slate-500">Geracoes Hoje</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de decks */}
              {decks.length === 0 ? (
                <div className="bg-white dark:bg-[#1c252e] rounded-2xl p-12 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl text-slate-400">style</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Nenhum baralho criado
                  </h3>
                  <p className="text-slate-500 mb-6">
                    Crie seu primeiro baralho para comecar a estudar com flashcards
                  </p>
                  <button
                    onClick={() => setShowCreateDeck(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Criar Primeiro Deck
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {decks.map(deck => {
                    const cardsParaRevisarDeck = cardsParaRevisar.filter(c => c.deck_id === deck.id).length
                    return (
                      <div
                        key={deck.id}
                        className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-primary/50 transition-colors group"
                      >
                        {/* Header colorido */}
                        <div
                          className="h-2"
                          style={{ backgroundColor: deck.cor }}
                        />

                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${deck.cor}20` }}
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ color: deck.cor }}
                                >
                                  {deck.icone}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{deck.nome}</h3>
                                <p className="text-xs text-slate-500">
                                  {deck.disciplina || deck.materia || 'Geral'}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Deletar este baralho e todos seus cards?')) {
                                  deletarDeck(deck.id)
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                            >
                              <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-lg">style</span>
                              {deck.total_cards} cards
                            </span>
                            {cardsParaRevisarDeck > 0 && (
                              <span className="flex items-center gap-1 text-orange-500">
                                <span className="material-symbols-outlined text-lg">schedule</span>
                                {cardsParaRevisarDeck} para revisar
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => iniciarRevisao(deck)}
                            disabled={cardsParaRevisarDeck === 0}
                            className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-xl">play_arrow</span>
                            {cardsParaRevisarDeck > 0 ? 'Revisar' : 'Sem revisoes'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Info sobre repeticao espacada */}
              <div className="mt-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-2xl text-blue-500">psychology</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                      Como funciona a Repeticao Espacada?
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Nosso sistema usa o algoritmo SM-2 para otimizar sua memoria de longo prazo.
                      Cards dificeis aparecem mais frequentemente, enquanto os faceis tem intervalos maiores.
                      Isso garante que voce estude de forma eficiente, focando no que realmente precisa.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Modo revisao */}
          {viewMode === 'revisar' && cardAtual && (
            <div className="max-w-2xl mx-auto">
              {/* Header da revisao */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setViewMode('decks')}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Voltar
                </button>
                <div className="text-sm text-slate-500">
                  Card {currentCardIndex + 1} de {deckCards.length}
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-8">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentCardIndex + 1) / deckCards.length) * 100}%` }}
                />
              </div>

              {/* Card de revisao */}
              <div
                onClick={() => setShowAnswer(!showAnswer)}
                className="bg-white dark:bg-[#1c252e] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 min-h-[300px] p-8 cursor-pointer flex flex-col items-center justify-center text-center relative group mb-8"
              >
                <span className="absolute top-4 left-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  {showAnswer ? 'Resposta' : 'Pergunta'}
                </span>

                <p className="text-2xl font-medium text-slate-900 dark:text-white leading-relaxed">
                  {showAnswer ? cardAtual.verso : cardAtual.frente}
                </p>

                <div className="absolute bottom-4 text-slate-400 text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-lg">touch_app</span>
                  Clique para {showAnswer ? 'ver pergunta' : 'ver resposta'}
                </div>
              </div>

              {/* Botoes de dificuldade */}
              {showAnswer && (
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => handleResposta(1)}
                    className="py-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 font-medium hover:bg-red-500/20 transition-colors flex flex-col items-center gap-1"
                  >
                    <span className="text-xs uppercase tracking-wider opacity-70">Errei</span>
                    <span className="text-sm font-bold">
                      {calcularIntervaloDisplay(1, cardAtual.repeticoes)}
                    </span>
                  </button>

                  <button
                    onClick={() => handleResposta(2)}
                    className="py-4 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-500 font-medium hover:bg-orange-500/20 transition-colors flex flex-col items-center gap-1"
                  >
                    <span className="text-xs uppercase tracking-wider opacity-70">Dificil</span>
                    <span className="text-sm font-bold">
                      {calcularIntervaloDisplay(2, cardAtual.repeticoes)}
                    </span>
                  </button>

                  <button
                    onClick={() => handleResposta(3)}
                    className="py-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-500 font-medium hover:bg-green-500/20 transition-colors flex flex-col items-center gap-1"
                  >
                    <span className="text-xs uppercase tracking-wider opacity-70">Bom</span>
                    <span className="text-sm font-bold">
                      {calcularIntervaloDisplay(3, cardAtual.repeticoes)}
                    </span>
                  </button>

                  <button
                    onClick={() => handleResposta(4)}
                    className="py-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-500 font-medium hover:bg-blue-500/20 transition-colors flex flex-col items-center gap-1"
                  >
                    <span className="text-xs uppercase tracking-wider opacity-70">Facil</span>
                    <span className="text-sm font-bold">
                      {calcularIntervaloDisplay(4, cardAtual.repeticoes)}
                    </span>
                  </button>
                </div>
              )}

              {!showAnswer && (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">visibility</span>
                  Mostrar Resposta
                </button>
              )}
            </div>
          )}

          {/* Modal criar deck */}
          {showCreateDeck && (
            <>
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => setShowCreateDeck(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                  className="bg-white dark:bg-[#1c252e] rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Criar Novo Deck</h2>
                      <button
                        onClick={() => setShowCreateDeck(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nome do Deck *
                      </label>
                      <input
                        type="text"
                        value={novoDeckNome}
                        onChange={e => setNovoDeckNome(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary focus:ring-0 text-slate-900 dark:text-white"
                        placeholder="Ex: Direito Constitucional"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Descricao
                      </label>
                      <textarea
                        value={novoDeckDescricao}
                        onChange={e => setNovoDeckDescricao(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary focus:ring-0 text-slate-900 dark:text-white resize-none h-20"
                        placeholder="Descricao opcional..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Cor
                      </label>
                      <div className="flex gap-2">
                        {CORES_DECK.map(cor => (
                          <button
                            key={cor}
                            onClick={() => setNovoDeckCor(cor)}
                            className={`w-8 h-8 rounded-full transition-transform ${novoDeckCor === cor ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                            style={{ backgroundColor: cor }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Icone
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ICONES_DECK.map(icone => (
                          <button
                            key={icone}
                            onClick={() => setNovoDeckIcone(icone)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${novoDeckIcone === icone ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                          >
                            <span className="material-symbols-outlined">{icone}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161f28]">
                    <button
                      onClick={handleCriarDeck}
                      disabled={!novoDeckNome.trim()}
                      className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                    >
                      Criar Deck
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Modal gerador IA */}
          {showGenerator && (
            <>
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => setShowGenerator(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                  className="bg-white dark:bg-[#1c252e] rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-purple-500">auto_awesome</span>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gerar com IA</h2>
                          <p className="text-sm text-slate-500">
                            {geracoesHoje}/{limiteGeracoesDia === -1 ? '∞' : limiteGeracoesDia} geracoes hoje
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowGenerator(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Selecionar deck */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Deck de destino *
                      </label>
                      <select
                        value={gerarDeckId}
                        onChange={e => setGerarDeckId(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary focus:ring-0 text-slate-900 dark:text-white"
                      >
                        <option value="">Selecione um deck...</option>
                        {decks.map(deck => (
                          <option key={deck.id} value={deck.id}>{deck.nome}</option>
                        ))}
                      </select>
                    </div>

                    {/* Configuracoes hierarquicas */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Disciplina
                        </label>
                        <input
                          type="text"
                          value={gerarDisciplina}
                          onChange={e => setGerarDisciplina(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary focus:ring-0 text-slate-900 dark:text-white text-sm"
                          placeholder="Ex: Direito"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Assunto
                        </label>
                        <input
                          type="text"
                          value={gerarAssunto}
                          onChange={e => setGerarAssunto(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary focus:ring-0 text-slate-900 dark:text-white text-sm"
                          placeholder="Constitucional"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Subassunto
                        </label>
                        <input
                          type="text"
                          value={gerarSubassunto}
                          onChange={e => setGerarSubassunto(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary focus:ring-0 text-slate-900 dark:text-white text-sm"
                          placeholder="Art. 5"
                        />
                      </div>
                    </div>

                    {/* Dificuldade */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Dificuldade
                      </label>
                      <div className="flex gap-2">
                        {['facil', 'medio', 'dificil'].map(dif => (
                          <button
                            key={dif}
                            onClick={() => setGerarDificuldade(dif)}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                              gerarDificuldade === dif
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {dif === 'facil' ? 'Facil' : dif === 'medio' ? 'Medio' : 'Dificil'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quantidade */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Quantidade de flashcards: {gerarQuantidade}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={gerarQuantidade}
                        onChange={e => setGerarQuantidade(parseInt(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>1</span>
                        <span>10</span>
                      </div>
                    </div>

                    {/* Erros e sucessos */}
                    {gerarErro && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                        {gerarErro}
                      </div>
                    )}
                    {gerarSucesso && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined">check_circle</span>
                        {gerarSucesso}
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161f28]">
                    <button
                      onClick={handleGerarFlashcards}
                      disabled={!gerarDeckId || gerando || (limiteGeracoesDia !== -1 && geracoesHoje >= limiteGeracoesDia)}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      {gerando ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Gerando...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">bolt</span>
                          Gerar {gerarQuantidade} Flashcards
                        </>
                      )}
                    </button>

                    {limiteGeracoesDia !== -1 && geracoesHoje >= limiteGeracoesDia && (
                      <p className="text-xs text-center text-slate-500 mt-2">
                        Voce atingiu o limite de geracoes diarias. Faca upgrade para mais!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
