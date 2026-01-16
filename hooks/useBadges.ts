'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useMedAuth } from '@/contexts/MedAuthContext'

export interface Badge {
  id: string
  codigo: string
  nome: string
  descricao: string
  icone: string
  categoria: string
  pontos: number
  requisito: {
    tipo: string
    valor: number
  }
}

export interface BadgeConquistado extends Badge {
  conquistado_em: string
}

export interface Ranking {
  id: string
  user_id: string
  pontos_semana: number
  pontos_mes: number
  pontos_total: number
  questoes_semana: number
  questoes_mes: number
  questoes_total: number
  sequencia_atual: number
  maior_sequencia: number
  ultimo_estudo: string | null
}

export interface RankingPosicao {
  user_id: string
  nome: string
  avatar_url: string | null
  pontos: number
  posicao: number
}

export function useBadges() {
  const { user, loading: authLoading } = useMedAuth()
  const [badges, setBadges] = useState<Badge[]>([])
  const [meusBadges, setMeusBadges] = useState<BadgeConquistado[]>([])
  const [ranking, setRanking] = useState<Ranking | null>(null)
  const [rankingGeral, setRankingGeral] = useState<RankingPosicao[]>([])
  const [loading, setLoading] = useState(true)
  const [novoBadge, setNovoBadge] = useState<BadgeConquistado | null>(null)

  // Buscar todos os badges e os conquistados
  const fetchBadges = useCallback(async () => {
    if (authLoading) return
    if (!user) {
      setBadges([])
      setMeusBadges([])
      setRanking(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Buscar em paralelo
      const [badgesRes, conquistadosRes, rankingRes] = await Promise.all([
        supabase
          .from('badges_med')
          .select('*')
          .order('pontos'),
        supabase
          .from('badges_usuario_med')
          .select('badge_id, conquistado_em, badges_med(*)')
          .eq('user_id', user.id),
        supabase
          .from('ranking_med')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ])

      if (badgesRes.data) {
        setBadges(badgesRes.data as Badge[])
      }

      if (conquistadosRes.data) {
        const badgesConquistados = conquistadosRes.data
          .filter(c => c.badges_med && !Array.isArray(c.badges_med))
          .map(c => ({
            ...(c.badges_med as unknown as Badge),
            conquistado_em: c.conquistado_em
          }))
        setMeusBadges(badgesConquistados)
      }

      if (rankingRes.data) {
        setRanking(rankingRes.data as Ranking)
      } else if (rankingRes.error?.code === 'PGRST116') {
        // Não existe ranking para o usuário - criar
        const { data: newRanking } = await supabase
          .from('ranking_med')
          .insert({
            user_id: user.id,
            pontos_semana: 0,
            pontos_mes: 0,
            pontos_total: 0,
            questoes_semana: 0,
            questoes_mes: 0,
            questoes_total: 0,
            sequencia_atual: 0,
            maior_sequencia: 0
          })
          .select()
          .single()

        if (newRanking) {
          setRanking(newRanking as Ranking)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar badges:', error)
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  // Buscar ranking geral (top 10)
  const fetchRankingGeral = useCallback(async (tipo: 'semana' | 'mes' | 'total' = 'semana') => {
    try {
      const { data } = await supabase
        .from('ranking_med')
        .select('user_id, pontos_semana, pontos_mes, pontos_total, profiles_med(nome, avatar_url)')
        .order(tipo === 'semana' ? 'pontos_semana' : tipo === 'mes' ? 'pontos_mes' : 'pontos_total', { ascending: false })
        .limit(10)

      if (data) {
        const rankingFormatado = data.map((item: Record<string, unknown>, index: number) => {
          const pontos = tipo === 'semana'
            ? item.pontos_semana
            : tipo === 'mes'
            ? item.pontos_mes
            : item.pontos_total
          const profile = item.profiles_med as { nome: string | null; avatar_url: string | null } | null

          return {
            user_id: item.user_id as string,
            nome: profile?.nome || 'Anônimo',
            avatar_url: profile?.avatar_url || null,
            pontos: (pontos as number) || 0,
            posicao: index + 1
          }
        })
        setRankingGeral(rankingFormatado)
      }
    } catch (error) {
      console.error('Erro ao buscar ranking geral:', error)
    }
  }, [])

  // Verificar e conceder novos badges
  const verificarBadges = useCallback(async (): Promise<BadgeConquistado[]> => {
    if (!user || !ranking) return []

    try {
      const { data: todosBadges } = await supabase
        .from('badges_med')
        .select('*')

      const { data: jaConquistados } = await supabase
        .from('badges_usuario_med')
        .select('badge_id')
        .eq('user_id', user.id)

      const idsConquistados = new Set(jaConquistados?.map(b => b.badge_id))
      const novosConquistados: Badge[] = []

      for (const badge of todosBadges || []) {
        if (idsConquistados.has(badge.id)) continue

        const requisito = badge.requisito as { tipo: string; valor: number }
        let conquistou = false

        switch (requisito.tipo) {
          case 'questoes_total':
            conquistou = ranking.questoes_total >= requisito.valor
            break
          case 'sequencia':
            conquistou = ranking.sequencia_atual >= requisito.valor || ranking.maior_sequencia >= requisito.valor
            break
          case 'simulado_acerto':
            // Este será verificado quando completar um simulado
            break
        }

        if (conquistou) {
          novosConquistados.push(badge)
        }
      }

      // Inserir novos badges
      if (novosConquistados.length > 0) {
        await supabase.from('badges_usuario_med').insert(
          novosConquistados.map(badge => ({
            user_id: user.id,
            badge_id: badge.id,
          }))
        )

        // Atualizar pontos
        const pontosGanhos = novosConquistados.reduce((acc, b) => acc + b.pontos, 0)
        await supabase
          .from('ranking_med')
          .update({
            pontos_semana: ranking.pontos_semana + pontosGanhos,
            pontos_mes: ranking.pontos_mes + pontosGanhos,
            pontos_total: ranking.pontos_total + pontosGanhos,
          })
          .eq('user_id', user.id)

        // Mostrar o primeiro badge conquistado
        if (novosConquistados[0]) {
          setNovoBadge({
            ...novosConquistados[0],
            conquistado_em: new Date().toISOString()
          })
        }

        fetchBadges() // Atualizar lista
      }

      return novosConquistados.map(b => ({
        ...b,
        conquistado_em: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Erro ao verificar badges:', error)
      return []
    }
  }, [user, ranking, fetchBadges])

  // Atualizar estatísticas após responder questão
  const registrarQuestao = useCallback(async () => {
    if (!user || !ranking) return

    const hoje = new Date().toISOString().split('T')[0]
    const ultimoEstudo = ranking.ultimo_estudo

    // Calcular sequência
    let novaSequencia = ranking.sequencia_atual
    if (ultimoEstudo !== hoje) {
      const ontem = new Date()
      ontem.setDate(ontem.getDate() - 1)
      const ontemStr = ontem.toISOString().split('T')[0]

      if (ultimoEstudo === ontemStr) {
        novaSequencia = ranking.sequencia_atual + 1
      } else if (ultimoEstudo !== hoje) {
        novaSequencia = 1 // Resetar sequência
      }
    }

    const updates = {
      questoes_semana: ranking.questoes_semana + 1,
      questoes_mes: ranking.questoes_mes + 1,
      questoes_total: ranking.questoes_total + 1,
      pontos_semana: ranking.pontos_semana + 1,
      pontos_mes: ranking.pontos_mes + 1,
      pontos_total: ranking.pontos_total + 1,
      sequencia_atual: novaSequencia,
      maior_sequencia: Math.max(ranking.maior_sequencia, novaSequencia),
      ultimo_estudo: hoje,
      updated_at: new Date().toISOString()
    }

    await supabase
      .from('ranking_med')
      .update(updates)
      .eq('user_id', user.id)

    setRanking({ ...ranking, ...updates })

    // Verificar novos badges
    verificarBadges()
  }, [user, ranking, verificarBadges])

  // Fechar notificação de badge
  const fecharNovoBadge = useCallback(() => {
    setNovoBadge(null)
  }, [])

  useEffect(() => {
    fetchBadges()
  }, [fetchBadges])

  return {
    // Dados
    badges,
    meusBadges,
    ranking,
    rankingGeral,
    novoBadge,
    loading: loading || authLoading,

    // Ações
    verificarBadges,
    registrarQuestao,
    fetchRankingGeral,
    fecharNovoBadge,
    refresh: fetchBadges,
  }
}
