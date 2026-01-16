'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useMedAuth } from '@/contexts/MedAuthContext'

// Tipos específicos para PREPARAMED
export interface FlashcardMed {
  id: string
  user_id: string
  frente: string
  verso: string
  disciplina: string | null
  assunto: string | null
  tags: string[] | null

  // Spaced Repetition (SM-2)
  intervalo: number
  facilidade: number
  repeticoes: number
  proxima_revisao: string
  ultima_revisao: string | null

  // Estatísticas
  vezes_acertou: number
  vezes_errou: number
  tempo_medio_ms: number

  // Origem
  gerado_por_ia: boolean
  questao_origem_id: string | null
  conversa_origem_id: string | null

  created_at: string
  updated_at: string
}

export type QualidadeResposta = 0 | 1 | 2 | 3 | 4 | 5
// 0 = Errou completamente
// 1 = Errou, mas reconheceu a resposta
// 2 = Errou, mas quase acertou
// 3 = Acertou com dificuldade
// 4 = Acertou com hesitação
// 5 = Acertou perfeitamente

export interface FlashcardStatsMed {
  total: number
  paraRevisar: number
  novos: number
  aprendidos: number
  taxaAcerto: number
  porDisciplina: Record<string, number>
}

export interface CriarFlashcardMedData {
  frente: string
  verso: string
  disciplina?: string
  assunto?: string
  tags?: string[]
  gerado_por_ia?: boolean
  questao_origem_id?: string
  conversa_origem_id?: string
}

// Algoritmo SM-2 (SuperMemo 2)
function calcularSM2(
  facilidade: number,
  intervalo: number,
  repeticoes: number,
  qualidade: QualidadeResposta
): { novoIntervalo: number; novaFacilidade: number; novasRepeticoes: number } {
  // Se qualidade < 3, resetar
  if (qualidade < 3) {
    return {
      novoIntervalo: 1,
      novaFacilidade: Math.max(1.3, facilidade - 0.2),
      novasRepeticoes: 0
    }
  }

  // Calcular novo fator de facilidade
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const novaFacilidade = Math.max(
    1.3,
    facilidade + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02))
  )

  // Calcular novo intervalo
  let novoIntervalo: number
  if (repeticoes === 0) {
    novoIntervalo = 1
  } else if (repeticoes === 1) {
    novoIntervalo = 6
  } else {
    novoIntervalo = Math.round(intervalo * novaFacilidade)
  }

  return {
    novoIntervalo,
    novaFacilidade: Math.round(novaFacilidade * 100) / 100,
    novasRepeticoes: repeticoes + 1
  }
}

// Converter qualidade simples (1-4) para SM-2 (0-5)
export function converterQualidade(qualidade: 1 | 2 | 3 | 4): QualidadeResposta {
  const mapa: Record<number, QualidadeResposta> = {
    1: 1, // Errou
    2: 3, // Difícil
    3: 4, // Bom
    4: 5  // Fácil
  }
  return mapa[qualidade]
}

// Calcular próximo intervalo para exibição
export function calcularIntervaloExibicao(
  qualidade: 1 | 2 | 3 | 4,
  repeticoes: number,
  facilidade: number = 2.5,
  intervaloAtual: number = 0
): string {
  const qualidadeSM2 = converterQualidade(qualidade)
  const { novoIntervalo } = calcularSM2(facilidade, intervaloAtual, repeticoes, qualidadeSM2)

  if (novoIntervalo === 1) return '1d'
  if (novoIntervalo < 7) return `${novoIntervalo}d`
  if (novoIntervalo < 30) return `${Math.round(novoIntervalo / 7)}sem`
  return `${Math.round(novoIntervalo / 30)}m`
}

export function useFlashcardsMed() {
  const { user, podeUsarFuncionalidade, verificarLimite, incrementarUso } = useMedAuth()

  const [flashcards, setFlashcards] = useState<FlashcardMed[]>([])
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroDisciplina, setFiltroDisciplina] = useState<string | null>(null)
  const [filtroAssunto, setFiltroAssunto] = useState<string | null>(null)

  // Carregar flashcards
  const carregarFlashcards = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('flashcards_med')
        .select('*')
        .eq('user_id', user.id)
        .order('proxima_revisao', { ascending: true })

      if (filtroDisciplina) {
        query = query.eq('disciplina', filtroDisciplina)
      }

      if (filtroAssunto) {
        query = query.eq('assunto', filtroAssunto)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        // Tabela pode não existir ainda
        if (fetchError.code === '42P01') {
          setFlashcards([])
          return
        }
        throw fetchError
      }

      setFlashcards(data || [])
    } catch (err) {
      console.error('Erro ao carregar flashcards:', err)
      setError('Erro ao carregar flashcards')
    } finally {
      setLoading(false)
    }
  }, [user, filtroDisciplina, filtroAssunto])

  useEffect(() => {
    carregarFlashcards()
  }, [carregarFlashcards])

  // Flashcards para revisar hoje
  const flashcardsParaRevisar = flashcards.filter(f => {
    const hoje = new Date().toISOString().split('T')[0]
    return f.proxima_revisao <= hoje
  })

  // Flashcard atual
  const flashcardAtual = flashcardsParaRevisar[indiceAtual] || null

  // Disciplinas disponíveis
  const disciplinas = [...new Set(flashcards.map(f => f.disciplina).filter(Boolean))] as string[]

  // Estatísticas
  const stats: FlashcardStatsMed = {
    total: flashcards.length,
    paraRevisar: flashcardsParaRevisar.length,
    novos: flashcards.filter(f => f.repeticoes === 0).length,
    aprendidos: flashcards.filter(f => f.repeticoes >= 3).length,
    taxaAcerto: flashcards.length > 0
      ? Math.round(
          (flashcards.reduce((acc, f) => acc + f.vezes_acertou, 0) /
            Math.max(1, flashcards.reduce((acc, f) => acc + f.vezes_acertou + f.vezes_errou, 0))) *
            100
        )
      : 0,
    porDisciplina: flashcards.reduce((acc, f) => {
      const disc = f.disciplina || 'Sem disciplina'
      acc[disc] = (acc[disc] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Criar flashcard
  const criarFlashcard = useCallback(
    async (data: CriarFlashcardMedData): Promise<FlashcardMed | null> => {
      if (!user) return null

      // Verificar se pode usar funcionalidade
      if (!podeUsarFuncionalidade('flashcards')) {
        const limite = verificarLimite('flashcards_semana')
        setError(`Limite de flashcards atingido (${limite.usado}/${limite.limite} esta semana)`)
        return null
      }

      try {
        const { data: novoFlashcard, error: insertError } = await supabase
          .from('flashcards_med')
          .insert({
            user_id: user.id,
            frente: data.frente,
            verso: data.verso,
            disciplina: data.disciplina || null,
            assunto: data.assunto || null,
            tags: data.tags || null,
            gerado_por_ia: data.gerado_por_ia || false,
            questao_origem_id: data.questao_origem_id || null,
            conversa_origem_id: data.conversa_origem_id || null,
            // Valores iniciais SM-2
            intervalo: 1,
            facilidade: 2.5,
            repeticoes: 0,
            proxima_revisao: new Date().toISOString().split('T')[0],
            vezes_acertou: 0,
            vezes_errou: 0,
            tempo_medio_ms: 0
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Incrementar uso
        await incrementarUso('flashcards_semana')

        setFlashcards(prev => [...prev, novoFlashcard])
        return novoFlashcard
      } catch (err) {
        console.error('Erro ao criar flashcard:', err)
        setError('Erro ao criar flashcard')
        return null
      }
    },
    [user, podeUsarFuncionalidade, verificarLimite, incrementarUso]
  )

  // Criar múltiplos flashcards (para geração por IA)
  const criarMultiplosFlashcards = useCallback(
    async (cards: CriarFlashcardMedData[]): Promise<FlashcardMed[]> => {
      if (!user || cards.length === 0) return []

      try {
        const flashcardsParaInserir = cards.map(card => ({
          user_id: user.id,
          frente: card.frente,
          verso: card.verso,
          disciplina: card.disciplina || null,
          assunto: card.assunto || null,
          tags: card.tags || null,
          gerado_por_ia: card.gerado_por_ia || false,
          questao_origem_id: card.questao_origem_id || null,
          conversa_origem_id: card.conversa_origem_id || null,
          intervalo: 1,
          facilidade: 2.5,
          repeticoes: 0,
          proxima_revisao: new Date().toISOString().split('T')[0],
          vezes_acertou: 0,
          vezes_errou: 0,
          tempo_medio_ms: 0
        }))

        const { data, error: insertError } = await supabase
          .from('flashcards_med')
          .insert(flashcardsParaInserir)
          .select()

        if (insertError) throw insertError

        const novosFlashcards = data as FlashcardMed[]
        setFlashcards(prev => [...prev, ...novosFlashcards])
        return novosFlashcards
      } catch (err) {
        console.error('Erro ao criar flashcards:', err)
        return []
      }
    },
    [user]
  )

  // Atualizar flashcard
  const atualizarFlashcard = useCallback(
    async (id: string, data: Partial<FlashcardMed>): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('flashcards_med')
          .update(data)
          .eq('id', id)

        if (updateError) throw updateError

        setFlashcards(prev =>
          prev.map(f => (f.id === id ? { ...f, ...data } : f))
        )
        return true
      } catch (err) {
        console.error('Erro ao atualizar flashcard:', err)
        return false
      }
    },
    []
  )

  // Deletar flashcard
  const deletarFlashcard = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('flashcards_med')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setFlashcards(prev => prev.filter(f => f.id !== id))
      return true
    } catch (err) {
      console.error('Erro ao deletar flashcard:', err)
      return false
    }
  }, [])

  // Responder flashcard (algoritmo SM-2)
  const responderFlashcard = useCallback(
    async (id: string, qualidade: 1 | 2 | 3 | 4, tempoMs: number) => {
      const flashcard = flashcards.find(f => f.id === id)
      if (!flashcard) return

      // Converter para escala SM-2
      const qualidadeSM2 = converterQualidade(qualidade)

      // Calcular novos valores com SM-2
      const { novoIntervalo, novaFacilidade, novasRepeticoes } = calcularSM2(
        flashcard.facilidade,
        flashcard.intervalo,
        flashcard.repeticoes,
        qualidadeSM2
      )

      // Calcular próxima revisão
      const proximaRevisao = new Date()
      proximaRevisao.setDate(proximaRevisao.getDate() + novoIntervalo)

      // Atualizar estatísticas
      const acertou = qualidade >= 3
      const novoTempoMedio = flashcard.tempo_medio_ms
        ? Math.round((flashcard.tempo_medio_ms + tempoMs) / 2)
        : tempoMs

      await atualizarFlashcard(id, {
        intervalo: novoIntervalo,
        facilidade: novaFacilidade,
        repeticoes: novasRepeticoes,
        proxima_revisao: proximaRevisao.toISOString().split('T')[0],
        ultima_revisao: new Date().toISOString(),
        vezes_acertou: flashcard.vezes_acertou + (acertou ? 1 : 0),
        vezes_errou: flashcard.vezes_errou + (acertou ? 0 : 1),
        tempo_medio_ms: novoTempoMedio
      })

      // Avançar para próximo
      proximoFlashcard()
    },
    [flashcards, atualizarFlashcard]
  )

  // Próximo flashcard
  const proximoFlashcard = useCallback(() => {
    setIndiceAtual(prev => {
      if (prev >= flashcardsParaRevisar.length - 1) {
        return 0 // Volta ao início
      }
      return prev + 1
    })
  }, [flashcardsParaRevisar.length])

  // Embaralhar deck
  const embaralharDeck = useCallback(() => {
    setFlashcards(prev => [...prev].sort(() => Math.random() - 0.5))
    setIndiceAtual(0)
  }, [])

  // Filtros
  const filtrarPorDisciplina = useCallback((disciplina: string | null) => {
    setFiltroDisciplina(disciplina)
    setIndiceAtual(0)
  }, [])

  const filtrarPorAssunto = useCallback((assunto: string | null) => {
    setFiltroAssunto(assunto)
    setIndiceAtual(0)
  }, [])

  // Resetar para início
  const resetarSessao = useCallback(() => {
    setIndiceAtual(0)
  }, [])

  return {
    // Dados
    flashcards,
    flashcardsParaRevisar,
    flashcardAtual,
    stats,
    disciplinas,
    indiceAtual,
    totalParaRevisar: flashcardsParaRevisar.length,

    // Estado
    loading,
    error,

    // Ações CRUD
    criarFlashcard,
    criarMultiplosFlashcards,
    atualizarFlashcard,
    deletarFlashcard,

    // Ações de Estudo
    responderFlashcard,
    proximoFlashcard,
    embaralharDeck,
    resetarSessao,

    // Filtros
    filtrarPorDisciplina,
    filtrarPorAssunto,
    filtroDisciplina,
    filtroAssunto,

    // Recarregar
    recarregar: carregarFlashcards
  }
}
