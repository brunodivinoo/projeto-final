'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface LimitItem {
  id: string
  nome: string
  icone: string
  usado: number
  limite: number
  tipo: 'diario' | 'mensal'
  cor: string
}

export interface LimitsData {
  plano: string
  isPro: boolean
  limites: LimitItem[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const LIMITE_ILIMITADO = -1

export function useLimits(): LimitsData {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plano, setPlano] = useState('FREE')
  const [limites, setLimites] = useState<LimitItem[]>([])

  const fetchLimits = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Buscar o plano do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('plano')
        .eq('id', user.id)
        .single()

      const userPlano = profile?.plano?.toUpperCase() || 'FREE'
      const planoNome = userPlano === 'ESTUDA_PRO' ? 'ESTUDA_PRO' : 'FREE'
      setPlano(planoNome)

      // Buscar limites do plano
      const { data: planoData } = await supabase
        .from('planos')
        .select('*')
        .eq('nome', planoNome)
        .single()

      if (!planoData) {
        setError('Plano não encontrado')
        setLoading(false)
        return
      }

      // Buscar uso diário
      const hoje = new Date().toISOString().split('T')[0]
      const { data: usoDiario } = await supabase
        .from('uso_diario')
        .select('tipo, quantidade')
        .eq('user_id', user.id)
        .eq('data', hoje)

      // Buscar uso mensal
      const primeiroDiaMes = new Date()
      primeiroDiaMes.setDate(1)
      const mesRef = primeiroDiaMes.toISOString().split('T')[0]

      const { data: usoMensal } = await supabase
        .from('uso_mensal')
        .select('tipo, quantidade')
        .eq('user_id', user.id)
        .eq('mes_referencia', mesRef)

      // Mapear uso para acesso fácil
      const usoDiarioMap: Record<string, number> = {}
      usoDiario?.forEach(u => { usoDiarioMap[u.tipo] = u.quantidade })

      const usoMensalMap: Record<string, number> = {}
      usoMensal?.forEach(u => { usoMensalMap[u.tipo] = u.quantidade })

      // Montar lista de limites
      const limitesData: LimitItem[] = [
        {
          id: 'questoes_ia',
          nome: 'Questões IA',
          icone: 'quiz',
          usado: usoDiarioMap['questoes_ia'] || 0,
          limite: planoData.limite_questoes_ia_dia,
          tipo: 'diario',
          cor: '#137fec'
        },
        {
          id: 'resumos',
          nome: 'Resumos',
          icone: 'summarize',
          usado: usoMensalMap['resumos'] || 0,
          limite: planoData.limite_resumos_mes,
          tipo: 'mensal',
          cor: '#a855f7'
        },
        {
          id: 'chat_mensagens',
          nome: 'Chat IA',
          icone: 'chat_bubble',
          usado: usoDiarioMap['chat_mensagens'] || 0,
          limite: planoData.limite_chat_mensagens_dia,
          tipo: 'diario',
          cor: '#10b981'
        },
        {
          id: 'pdf_paginas',
          nome: 'Páginas PDF',
          icone: 'picture_as_pdf',
          usado: usoMensalMap['pdf_paginas'] || 0,
          limite: planoData.limite_pdf_paginas_mes,
          tipo: 'mensal',
          cor: '#f59e0b'
        },
        {
          id: 'questoes',
          nome: 'Questões/Dia',
          icone: 'help_outline',
          usado: usoDiarioMap['questoes'] || 0,
          limite: planoData.limite_questoes_dia,
          tipo: 'diario',
          cor: '#6366f1'
        },
        {
          id: 'simulados',
          nome: 'Simulados',
          icone: 'assignment',
          usado: usoMensalMap['simulados'] || 0,
          limite: planoData.limite_simulados_mes,
          tipo: 'mensal',
          cor: '#ec4899'
        }
      ]

      // Filtrar limites ilimitados para não mostrar na lista
      const limitesFiltrados = limitesData.filter(l => l.limite !== LIMITE_ILIMITADO)

      setLimites(limitesFiltrados)
      setLoading(false)
    } catch (err) {
      console.error('Erro ao buscar limites:', err)
      setError('Erro ao carregar limites')
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchLimits()
  }, [fetchLimits])

  return {
    plano,
    isPro: plano === 'ESTUDA_PRO',
    limites,
    loading,
    error,
    refresh: fetchLimits
  }
}

// Função auxiliar para calcular porcentagem
export function calcularPorcentagem(usado: number, limite: number): number {
  if (limite === LIMITE_ILIMITADO) return 0
  if (limite === 0) return 100
  return Math.min(Math.round((usado / limite) * 100), 100)
}

// Função para obter mensagem motivacional
export function getMensagemMotivacional(porcentagemMedia: number, isPro: boolean): string {
  if (isPro) {
    if (porcentagemMedia < 30) {
      return "Você tem muitos recursos disponíveis! Continue estudando! 🚀"
    } else if (porcentagemMedia < 60) {
      return "Ótimo progresso! Continue aproveitando seu plano PRO! 💪"
    } else if (porcentagemMedia < 90) {
      return "Você está usando bem seus recursos! Excelente dedicação! 🌟"
    } else {
      return "Uso intensivo! Você está dando o máximo! 🔥"
    }
  } else {
    if (porcentagemMedia < 30) {
      return "Bom começo! Explore os recursos disponíveis! 📚"
    } else if (porcentagemMedia < 60) {
      return "Você está progredindo bem! Continue assim! 💪"
    } else if (porcentagemMedia < 90) {
      return "Quase no limite! Considere o Estuda PRO para mais recursos! ⭐"
    } else {
      return "Limite quase atingido! Faça upgrade para continuar estudando! 🚀"
    }
  }
}

// Função para obter cor baseada na porcentagem
export function getCorPorcentagem(porcentagem: number): string {
  if (porcentagem < 50) return 'bg-green-500'
  if (porcentagem < 75) return 'bg-yellow-500'
  if (porcentagem < 90) return 'bg-orange-500'
  return 'bg-red-500'
}
