'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface RankingUser {
  posicao: number
  userId: string
  nome: string
  avatar?: string
  xpSemana: number
  nivel: number
  plano: string
  isPro: boolean
  isCurrentUser: boolean
}

export interface RankingData {
  ranking: RankingUser[]
  userPosition: number | null
  userRanking: RankingUser | null
  totalParticipantes: number
  semanaAtual: string
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

// Função para obter o início da semana atual (domingo)
function getInicioSemana(): Date {
  const hoje = new Date()
  const dia = hoje.getDay() // 0 = domingo
  const diff = hoje.getDate() - dia
  const inicioSemana = new Date(hoje.setDate(diff))
  inicioSemana.setHours(0, 0, 0, 0)
  return inicioSemana
}

// Função para formatar período da semana
function formatarPeriodoSemana(): string {
  const inicio = getInicioSemana()
  const fim = new Date(inicio)
  fim.setDate(fim.getDate() + 6)

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return `${formatDate(inicio)} - ${formatDate(fim)}`
}

// Dados mock para desenvolvimento (definidos fora do hook para evitar recriação)
const MOCK_RANKING: RankingUser[] = [
  { posicao: 1, userId: '1', nome: 'Maria Silva', xpSemana: 2450, nivel: 8, plano: 'ESTUDA_PRO', isPro: true, isCurrentUser: false },
  { posicao: 2, userId: '2', nome: 'João Santos', xpSemana: 2180, nivel: 7, plano: 'ESTUDA_PRO', isPro: true, isCurrentUser: false },
  { posicao: 3, userId: '3', nome: 'Ana Oliveira', xpSemana: 1950, nivel: 6, plano: 'FREE', isPro: false, isCurrentUser: false },
  { posicao: 4, userId: '4', nome: 'Pedro Costa', xpSemana: 1720, nivel: 6, plano: 'ESTUDA_PRO', isPro: true, isCurrentUser: false },
  { posicao: 5, userId: '5', nome: 'Carla Mendes', xpSemana: 1580, nivel: 5, plano: 'FREE', isPro: false, isCurrentUser: false },
  { posicao: 6, userId: 'current', nome: 'Você', xpSemana: 1340, nivel: 4, plano: 'FREE', isPro: false, isCurrentUser: true },
  { posicao: 7, userId: '7', nome: 'Lucas Ferreira', xpSemana: 1200, nivel: 4, plano: 'FREE', isPro: false, isCurrentUser: false },
  { posicao: 8, userId: '8', nome: 'Juliana Lima', xpSemana: 1050, nivel: 4, plano: 'ESTUDA_PRO', isPro: true, isCurrentUser: false },
  { posicao: 9, userId: '9', nome: 'Rafael Souza', xpSemana: 920, nivel: 3, plano: 'FREE', isPro: false, isCurrentUser: false },
  { posicao: 10, userId: '10', nome: 'Fernanda Rocha', xpSemana: 850, nivel: 3, plano: 'FREE', isPro: false, isCurrentUser: false },
  { posicao: 11, userId: '11', nome: 'Bruno Almeida', xpSemana: 780, nivel: 3, plano: 'FREE', isPro: false, isCurrentUser: false },
  { posicao: 12, userId: '12', nome: 'Camila Dias', xpSemana: 650, nivel: 2, plano: 'FREE', isPro: false, isCurrentUser: false },
  { posicao: 13, userId: '13', nome: 'Thiago Martins', xpSemana: 520, nivel: 2, plano: 'FREE', isPro: false, isCurrentUser: false },
  { posicao: 14, userId: '14', nome: 'Patricia Gomes', xpSemana: 410, nivel: 2, plano: 'FREE', isPro: false, isCurrentUser: false },
  { posicao: 15, userId: '15', nome: 'Diego Ribeiro', xpSemana: 320, nivel: 1, plano: 'FREE', isPro: false, isCurrentUser: false },
]

export function useRanking(): RankingData {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ranking, setRanking] = useState<RankingUser[]>([])
  const [userPosition, setUserPosition] = useState<number | null>(null)
  const [userRanking, setUserRanking] = useState<RankingUser | null>(null)
  const [totalParticipantes, setTotalParticipantes] = useState(0)

  const fetchRanking = useCallback(async () => {
    // Aguardar autenticação carregar primeiro
    if (authLoading) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const inicioSemana = getInicioSemana().toISOString()

      // Buscar ranking semanal
      const { data: rankingData, error: rankingError } = await supabase
        .from('ranking_semanal')
        .select(`
          user_id,
          xp_semana,
          posicao,
          profiles:user_id (
            nome,
            avatar_url,
            plano
          ),
          user_xp:user_id (
            nivel
          )
        `)
        .eq('semana_inicio', inicioSemana.split('T')[0])
        .order('xp_semana', { ascending: false })
        .limit(100)

      if (rankingError || !rankingData || rankingData.length === 0) {
        // Se a tabela não existe ou está vazia, usar dados mock
        if (rankingError) {
          console.log('Usando dados mock para ranking:', rankingError)
        }

        // Usar dados mock
        setRanking(MOCK_RANKING)
        setTotalParticipantes(MOCK_RANKING.length)

        const currentUserIdx = MOCK_RANKING.findIndex(r => r.isCurrentUser)
        if (currentUserIdx !== -1) {
          setUserPosition(currentUserIdx + 1)
          setUserRanking(MOCK_RANKING[currentUserIdx])
        }

        setLoading(false)
        return
      }

      // Processar dados
      const rankingProcessado: RankingUser[] = rankingData.map((item: any, index: number) => ({
        posicao: index + 1,
        userId: item.user_id,
        nome: item.profiles?.nome || 'Usuário',
        avatar: item.profiles?.avatar_url,
        xpSemana: item.xp_semana || 0,
        nivel: item.user_xp?.nivel || 1,
        plano: item.profiles?.plano || 'FREE',
        isPro: item.profiles?.plano?.toUpperCase() === 'ESTUDA_PRO',
        isCurrentUser: user?.id === item.user_id
      }))

      setRanking(rankingProcessado)
      setTotalParticipantes(rankingProcessado.length)

      // Encontrar posição do usuário atual
      if (user) {
        const userIdx = rankingProcessado.findIndex(r => r.isCurrentUser)
        if (userIdx !== -1) {
          setUserPosition(userIdx + 1)
          setUserRanking(rankingProcessado[userIdx])
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Erro ao buscar ranking:', err)

      // Em caso de erro, usar dados mock
      setRanking(MOCK_RANKING)
      setTotalParticipantes(MOCK_RANKING.length)

      const currentUserIdx = MOCK_RANKING.findIndex(r => r.isCurrentUser)
      if (currentUserIdx !== -1) {
        setUserPosition(currentUserIdx + 1)
        setUserRanking(MOCK_RANKING[currentUserIdx])
      }

      setLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    fetchRanking()
  }, [fetchRanking])

  return {
    ranking,
    userPosition,
    userRanking,
    totalParticipantes,
    semanaAtual: formatarPeriodoSemana(),
    loading: loading || authLoading, // Considera loading se auth ainda está carregando
    error,
    refresh: fetchRanking
  }
}

// Função para obter cor do pódio
export function getCorPodio(posicao: number): string {
  switch (posicao) {
    case 1: return '#fbbf24' // Ouro
    case 2: return '#94a3b8' // Prata
    case 3: return '#cd7f32' // Bronze
    default: return '#64748b'
  }
}

// Função para obter ícone do pódio
export function getIconePodio(posicao: number): string {
  switch (posicao) {
    case 1: return 'emoji_events'
    case 2: return 'military_tech'
    case 3: return 'workspace_premium'
    default: return 'tag'
  }
}
