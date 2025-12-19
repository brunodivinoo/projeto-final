'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// Tipos
export interface Flashcard {
  id: string
  deck_id: string
  frente: string
  verso: string
  dificuldade: string
  disciplina?: string | null
  assunto?: string | null
  subassunto?: string | null
  proxima_revisao: string
  repeticoes: number
  intervalo_dias: number
  fator_facilidade: number
  qualidade_ultima: number
  status: 'novo' | 'aprendendo' | 'revisao' | 'dominado'
  created_at: string
}

export interface Deck {
  id: string
  user_id: string
  nome: string
  descricao?: string
  materia?: string
  disciplina?: string
  assunto?: string
  subassunto?: string
  cor: string
  icone: string
  total_cards: number
  cards_para_revisar: number
  progresso: number
  ultima_revisao?: string
  created_at: string
}

export interface FlashcardsData {
  decks: Deck[]
  flashcards: Flashcard[]
  cardsParaRevisar: Flashcard[]
  totalCards: number
  totalDecks: number
  limiteBaralhos: number
  limiteFlashcards: number
  limiteGeracoesDia: number
  geracoesHoje: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  criarDeck: (dados: Partial<Deck>) => Promise<Deck | null>
  deletarDeck: (deckId: string) => Promise<boolean>
  criarFlashcard: (dados: Partial<Flashcard>) => Promise<Flashcard | null>
  criarFlashcards: (deckId: string, cards: Array<{ frente: string; verso: string }>) => Promise<boolean>
  deletarFlashcard: (flashcardId: string) => Promise<boolean>
  registrarRevisao: (flashcardId: string, qualidade: number) => Promise<boolean>
  getFlashcardsDoDeck: (deckId: string) => Promise<Flashcard[]>
  getCardsParaRevisarDoDeck: (deckId: string) => Promise<Flashcard[]>
}

// Dados mock fora do hook
const MOCK_DECKS: Deck[] = []
const MOCK_FLASHCARDS: Flashcard[] = []

// Algoritmo SM-2 para repeticao espacada
function calcularProximaRevisao(
  qualidade: number, // 0-5 (0=esqueceu, 5=perfeito)
  repeticoes: number,
  fatorFacilidade: number,
  intervaloAtual: number
): { intervalo: number; fator: number; repeticoes: number } {
  // Qualidade < 3 = errou, resetar
  if (qualidade < 3) {
    return {
      intervalo: 1, // Revisar amanha
      fator: Math.max(1.3, fatorFacilidade - 0.2),
      repeticoes: 0
    }
  }

  // Calcular novo fator de facilidade
  const novoFator = Math.max(
    1.3,
    fatorFacilidade + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02))
  )

  // Calcular novo intervalo
  let novoIntervalo: number
  if (repeticoes === 0) {
    novoIntervalo = 1
  } else if (repeticoes === 1) {
    novoIntervalo = 6
  } else {
    novoIntervalo = Math.round(intervaloAtual * novoFator)
  }

  return {
    intervalo: novoIntervalo,
    fator: novoFator,
    repeticoes: repeticoes + 1
  }
}

// Funcao para calcular intervalo baseado na qualidade (1-4) - reflete o SM-2 real
export function calcularIntervaloDisplay(qualidade: number, repeticoes: number, fatorFacilidade: number = 2.5, intervaloAtual: number = 0): string {
  // Converter qualidade 1-4 para escala SM-2 (0-5)
  const qualidadeSM2 = qualidade === 1 ? 1 : qualidade === 2 ? 3 : qualidade === 3 ? 4 : 5

  // Qualidade < 3 (errou) = resetar para 1 dia
  if (qualidadeSM2 < 3) {
    return '1d'
  }

  // Calcular intervalo usando SM-2
  let novoIntervalo: number
  if (repeticoes === 0) {
    novoIntervalo = 1
  } else if (repeticoes === 1) {
    novoIntervalo = 6
  } else {
    const novoFator = Math.max(
      1.3,
      fatorFacilidade + (0.1 - (5 - qualidadeSM2) * (0.08 + (5 - qualidadeSM2) * 0.02))
    )
    novoIntervalo = Math.round(intervaloAtual * novoFator)
  }

  // Formatar para exibicao
  if (novoIntervalo === 1) return '1d'
  if (novoIntervalo < 7) return `${novoIntervalo}d`
  if (novoIntervalo < 30) return `${Math.round(novoIntervalo / 7)}sem`
  return `${Math.round(novoIntervalo / 30)}m`
}

export function useFlashcards(): FlashcardsData {
  // Pegar authLoading do context
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [decks, setDecks] = useState<Deck[]>(MOCK_DECKS)
  const [flashcards, setFlashcards] = useState<Flashcard[]>(MOCK_FLASHCARDS)
  const [cardsParaRevisar, setCardsParaRevisar] = useState<Flashcard[]>([])
  const [limiteBaralhos, setLimiteBaralhos] = useState(2)
  const [limiteFlashcards, setLimiteFlashcards] = useState(50)
  const [limiteGeracoesDia, setLimiteGeracoesDia] = useState(3)
  const [geracoesHoje, setGeracoesHoje] = useState(0)

  const fetchFlashcards = useCallback(async () => {
    // Aguardar auth carregar primeiro - não fazer nada enquanto carrega
    if (authLoading) {
      // Manter loading true enquanto auth carrega
      return
    }

    // Sem usuario = usar mock e parar
    if (!user) {
      setDecks(MOCK_DECKS)
      setFlashcards(MOCK_FLASHCARDS)
      setCardsParaRevisar([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const hoje = new Date().toISOString()

      // Buscar tudo em paralelo
      const [decksResult, limitsResult, usoResult] = await Promise.all([
        // Buscar decks do usuario
        supabase
          .from('flashcard_decks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        // Buscar limites do plano
        supabase
          .from('profiles')
          .select('plano')
          .eq('id', user.id)
          .single(),

        // Buscar uso de hoje
        supabase
          .from('uso_diario')
          .select('tipo, quantidade')
          .eq('user_id', user.id)
          .eq('data', hoje.split('T')[0])
          .eq('tipo', 'geracoes_flashcards')
          .maybeSingle()
      ])

      const userDecks = (decksResult.data || []) as Deck[]
      setDecks(userDecks)

      // Buscar flashcards de todos os decks
      if (userDecks.length > 0) {
        const deckIds = userDecks.map(d => d.id)

        const [flashcardsResult, revisarResult] = await Promise.all([
          supabase
            .from('flashcards')
            .select('*')
            .in('deck_id', deckIds),

          supabase
            .from('flashcards')
            .select('*')
            .in('deck_id', deckIds)
            .lte('proxima_revisao', hoje)
            .order('proxima_revisao', { ascending: true })
        ])

        setFlashcards((flashcardsResult.data || []) as Flashcard[])
        setCardsParaRevisar((revisarResult.data || []) as Flashcard[])
      }

      // Buscar limites do plano
      const planoNome = limitsResult.data?.plano?.toUpperCase() || 'FREE'
      const { data: planoData } = await supabase
        .from('planos')
        .select('limite_baralhos, limite_flashcards, limite_geracoes_flashcards_dia')
        .eq('nome', planoNome)
        .single()

      if (planoData) {
        setLimiteBaralhos(planoData.limite_baralhos)
        setLimiteFlashcards(planoData.limite_flashcards)
        setLimiteGeracoesDia(planoData.limite_geracoes_flashcards_dia || 3)
      }

      // Uso de hoje
      setGeracoesHoje(usoResult.data?.quantidade || 0)

    } catch (err) {
      console.error('Erro ao buscar flashcards:', err)
      setError('Erro ao carregar flashcards')
      setDecks(MOCK_DECKS)
      setFlashcards(MOCK_FLASHCARDS)
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  // Criar deck
  const criarDeck = useCallback(async (dados: Partial<Deck>): Promise<Deck | null> => {
    if (!user) return null

    // Verificar limite de baralhos
    if (limiteBaralhos !== -1 && decks.length >= limiteBaralhos) {
      setError('Limite de baralhos atingido')
      return null
    }

    try {
      const { data, error: insertError } = await supabase
        .from('flashcard_decks')
        .insert({
          user_id: user.id,
          nome: dados.nome || 'Novo Deck',
          descricao: dados.descricao,
          materia: dados.materia,
          disciplina: dados.disciplina,
          assunto: dados.assunto,
          subassunto: dados.subassunto,
          cor: dados.cor || '#3b82f6',
          icone: dados.icone || 'style'
        })
        .select()
        .single()

      if (insertError) throw insertError

      const novoDeck = data as Deck
      setDecks(prev => [novoDeck, ...prev])
      return novoDeck
    } catch (err) {
      console.error('Erro ao criar deck:', err)
      setError('Erro ao criar deck')
      return null
    }
  }, [user, decks.length, limiteBaralhos])

  // Deletar deck
  const deletarDeck = useCallback(async (deckId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error: deleteError } = await supabase
        .from('flashcard_decks')
        .delete()
        .eq('id', deckId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      setDecks(prev => prev.filter(d => d.id !== deckId))
      setFlashcards(prev => prev.filter(f => f.deck_id !== deckId))
      return true
    } catch (err) {
      console.error('Erro ao deletar deck:', err)
      return false
    }
  }, [user])

  // Criar flashcard individual
  const criarFlashcard = useCallback(async (dados: Partial<Flashcard>): Promise<Flashcard | null> => {
    if (!user || !dados.deck_id) return null

    // Verificar limite de flashcards
    if (limiteFlashcards !== -1 && flashcards.length >= limiteFlashcards) {
      setError('Limite de flashcards atingido')
      return null
    }

    try {
      const { data, error: insertError } = await supabase
        .from('flashcards')
        .insert({
          deck_id: dados.deck_id,
          user_id: user.id,
          frente: dados.frente || '',
          verso: dados.verso || '',
          dificuldade: dados.dificuldade || 'medio',
          proxima_revisao: new Date().toISOString(),
          status: 'novo'
        })
        .select()
        .single()

      if (insertError) throw insertError

      const novoCard = data as Flashcard
      setFlashcards(prev => [novoCard, ...prev])

      // Atualizar contador do deck
      await supabase
        .from('flashcard_decks')
        .update({ total_cards: flashcards.filter(f => f.deck_id === dados.deck_id).length + 1 })
        .eq('id', dados.deck_id)

      return novoCard
    } catch (err) {
      console.error('Erro ao criar flashcard:', err)
      return null
    }
  }, [user, flashcards, limiteFlashcards])

  // Criar multiplos flashcards (para geracao por IA)
  const criarFlashcards = useCallback(async (
    deckId: string,
    cards: Array<{ frente: string; verso: string }>
  ): Promise<boolean> => {
    if (!user || cards.length === 0) return false

    // Verificar limite de flashcards
    const totalAposInsert = flashcards.length + cards.length
    if (limiteFlashcards !== -1 && totalAposInsert > limiteFlashcards) {
      setError(`Limite de flashcards atingido. Voce pode criar no maximo ${limiteFlashcards - flashcards.length} cards.`)
      return false
    }

    try {
      const cardsParaInserir = cards.map(card => ({
        deck_id: deckId,
        user_id: user.id,
        frente: card.frente,
        verso: card.verso,
        dificuldade: 'medio',
        proxima_revisao: new Date().toISOString(),
        status: 'novo'
      }))

      const { data, error: insertError } = await supabase
        .from('flashcards')
        .insert(cardsParaInserir)
        .select()

      if (insertError) throw insertError

      const novosCards = data as Flashcard[]
      setFlashcards(prev => [...novosCards, ...prev])

      // Atualizar contador do deck
      await supabase
        .from('flashcard_decks')
        .update({
          total_cards: flashcards.filter(f => f.deck_id === deckId).length + cards.length,
          cards_para_revisar: cardsParaRevisar.filter(f => f.deck_id === deckId).length + cards.length
        })
        .eq('id', deckId)

      return true
    } catch (err) {
      console.error('Erro ao criar flashcards:', err)
      return false
    }
  }, [user, flashcards, cardsParaRevisar, limiteFlashcards])

  // Deletar flashcard
  const deletarFlashcard = useCallback(async (flashcardId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const card = flashcards.find(f => f.id === flashcardId)
      if (!card) return false

      const { error: deleteError } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', flashcardId)

      if (deleteError) throw deleteError

      setFlashcards(prev => prev.filter(f => f.id !== flashcardId))
      setCardsParaRevisar(prev => prev.filter(f => f.id !== flashcardId))

      // Atualizar contador do deck
      await supabase
        .from('flashcard_decks')
        .update({ total_cards: flashcards.filter(f => f.deck_id === card.deck_id).length - 1 })
        .eq('id', card.deck_id)

      return true
    } catch (err) {
      console.error('Erro ao deletar flashcard:', err)
      return false
    }
  }, [user, flashcards])

  // Registrar revisao (sistema SM-2)
  const registrarRevisao = useCallback(async (
    flashcardId: string,
    qualidade: number // 1=dificil, 2=medio, 3=facil, 4=muito facil
  ): Promise<boolean> => {
    if (!user) return false

    try {
      // Buscar o card do estado local ou do banco
      let card = flashcards.find(f => f.id === flashcardId)

      // Se nao encontrou no estado, buscar do banco
      if (!card) {
        const { data } = await supabase
          .from('flashcards')
          .select('*')
          .eq('id', flashcardId)
          .single()

        if (!data) return false
        card = data as Flashcard
      }

      // Converter qualidade 1-4 para escala SM-2 (0-5)
      const qualidadeSM2 = qualidade === 1 ? 1 : qualidade === 2 ? 3 : qualidade === 3 ? 4 : 5

      // Calcular proxima revisao usando SM-2
      const resultado = calcularProximaRevisao(
        qualidadeSM2,
        card.repeticoes,
        card.fator_facilidade,
        card.intervalo_dias
      )

      // Calcular data da proxima revisao
      const proximaRevisao = new Date()
      proximaRevisao.setDate(proximaRevisao.getDate() + resultado.intervalo)

      // Determinar status
      let status: 'novo' | 'aprendendo' | 'revisao' | 'dominado' = 'aprendendo'
      if (resultado.repeticoes >= 5 && resultado.fator >= 2.5) {
        status = 'dominado'
      } else if (resultado.repeticoes >= 2) {
        status = 'revisao'
      }

      // Atualizar flashcard
      const { error: updateError } = await supabase
        .from('flashcards')
        .update({
          proxima_revisao: proximaRevisao.toISOString(),
          repeticoes: resultado.repeticoes,
          fator_facilidade: resultado.fator,
          intervalo_dias: resultado.intervalo,
          qualidade_ultima: qualidade,
          status
        })
        .eq('id', flashcardId)

      if (updateError) throw updateError

      // Registrar no historico
      await supabase
        .from('flashcard_revisoes')
        .insert({
          flashcard_id: flashcardId,
          user_id: user.id,
          qualidade,
          intervalo_anterior: card.intervalo_dias,
          intervalo_novo: resultado.intervalo
        })

      // Atualizar deck
      await supabase
        .from('flashcard_decks')
        .update({ ultima_revisao: new Date().toISOString() })
        .eq('id', card.deck_id)

      // Atualizar estado local
      setFlashcards(prev => prev.map(f =>
        f.id === flashcardId
          ? {
              ...f,
              proxima_revisao: proximaRevisao.toISOString(),
              repeticoes: resultado.repeticoes,
              fator_facilidade: resultado.fator,
              intervalo_dias: resultado.intervalo,
              qualidade_ultima: qualidade,
              status
            }
          : f
      ))

      // Remover da lista de revisao
      setCardsParaRevisar(prev => prev.filter(f => f.id !== flashcardId))

      return true
    } catch (err) {
      console.error('Erro ao registrar revisao:', err)
      return false
    }
  }, [user, flashcards])

  // Buscar flashcards de um deck
  const getFlashcardsDoDeck = useCallback(async (deckId: string): Promise<Flashcard[]> => {
    if (!user) return []

    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: false })

    return (data || []) as Flashcard[]
  }, [user])

  // Buscar cards para revisar de um deck
  const getCardsParaRevisarDoDeck = useCallback(async (deckId: string): Promise<Flashcard[]> => {
    if (!user) return []

    const hoje = new Date().toISOString()

    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .lte('proxima_revisao', hoje)
      .order('proxima_revisao', { ascending: true })

    return (data || []) as Flashcard[]
  }, [user])

  useEffect(() => {
    fetchFlashcards()
  }, [fetchFlashcards])

  // Combinar loading states
  return {
    decks,
    flashcards,
    cardsParaRevisar,
    totalCards: flashcards.length,
    totalDecks: decks.length,
    limiteBaralhos,
    limiteFlashcards,
    limiteGeracoesDia,
    geracoesHoje,
    loading: loading || authLoading,
    error,
    refresh: fetchFlashcards,
    criarDeck,
    deletarDeck,
    criarFlashcard,
    criarFlashcards,
    deletarFlashcard,
    registrarRevisao,
    getFlashcardsDoDeck,
    getCardsParaRevisarDoDeck
  }
}
