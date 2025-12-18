'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// Configuracao de niveis
export const NIVEIS_CONFIG = [
  { nivel: 1, nome: 'Iniciante', xpMin: 0, xpMax: 100, cor: '#94a3b8', icone: 'school' },
  { nivel: 2, nome: 'Aprendiz', xpMin: 100, xpMax: 300, cor: '#22c55e', icone: 'auto_stories' },
  { nivel: 3, nome: 'Estudante', xpMin: 300, xpMax: 600, cor: '#3b82f6', icone: 'psychology' },
  { nivel: 4, nome: 'Dedicado', xpMin: 600, xpMax: 1000, cor: '#8b5cf6', icone: 'workspace_premium' },
  { nivel: 5, nome: 'Avancado', xpMin: 1000, xpMax: 1500, cor: '#f59e0b', icone: 'military_tech' },
  { nivel: 6, nome: 'Expert', xpMin: 1500, xpMax: 2100, cor: '#ef4444', icone: 'stars' },
  { nivel: 7, nome: 'Mestre', xpMin: 2100, xpMax: 2800, cor: '#ec4899', icone: 'diamond' },
  { nivel: 8, nome: 'Grao-Mestre', xpMin: 2800, xpMax: 3600, cor: '#14b8a6', icone: 'emoji_events' },
  { nivel: 9, nome: 'Lenda', xpMin: 3600, xpMax: 4500, cor: '#f97316', icone: 'local_fire_department' },
  { nivel: 10, nome: 'Transcendente', xpMin: 4500, xpMax: 999999, cor: '#fbbf24', icone: 'auto_awesome' },
]

// XP por acao
export const XP_ACOES = {
  questao_correta: 10,
  questao_errada: 2,
  simulado_completo: 50,
  resumo_criado: 30,
  flashcard_revisado: 5,
  flashcard_criado: 15,
  chat_mensagem: 3,
  pdf_analisado: 25,
  login_diario: 20,
  sequencia_7_dias: 100,
  sequencia_30_dias: 500,
  primeiro_simulado: 50,
  primeiro_resumo: 30,
  nivel_up: 0, // Nao da XP, mas registra
}

export type TipoAcaoXP = keyof typeof XP_ACOES

export interface NivelInfo {
  nivel: number
  nome: string
  xpMin: number
  xpMax: number
  cor: string
  icone: string
}

export interface XPData {
  xpTotal: number
  xpHoje: number
  nivel: number
  nivelInfo: NivelInfo
  proximoNivel: NivelInfo | null
  progressoNivel: number // 0-100
  xpParaProximoNivel: number
  sequenciaDias: number
  maiorSequencia: number
  multiplicador: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addXP: (tipo: TipoAcaoXP, descricao?: string) => Promise<{ xpGanho: number; nivelUp: boolean; novoNivel?: number }>
}

// Funcao para calcular nivel baseado no XP
export function calcularNivel(xp: number): NivelInfo {
  for (let i = NIVEIS_CONFIG.length - 1; i >= 0; i--) {
    if (xp >= NIVEIS_CONFIG[i].xpMin) {
      return NIVEIS_CONFIG[i]
    }
  }
  return NIVEIS_CONFIG[0]
}

// Funcao para obter proximo nivel
export function proximoNivel(nivelAtual: number): NivelInfo | null {
  const idx = NIVEIS_CONFIG.findIndex(n => n.nivel === nivelAtual)
  if (idx < NIVEIS_CONFIG.length - 1) {
    return NIVEIS_CONFIG[idx + 1]
  }
  return null
}

// Funcao para calcular progresso no nivel atual (0-100)
export function calcularProgressoNivel(xp: number, nivelInfo: NivelInfo): number {
  const xpNoNivel = xp - nivelInfo.xpMin
  const xpNecessario = nivelInfo.xpMax - nivelInfo.xpMin
  return Math.min(Math.round((xpNoNivel / xpNecessario) * 100), 100)
}

export function useXP(): XPData {
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [xpTotal, setXpTotal] = useState(850) // Valor mock inicial
  const [xpHoje, setXpHoje] = useState(120) // Valor mock inicial
  const [sequenciaDias, setSequenciaDias] = useState(5) // Valor mock inicial
  const [maiorSequencia, setMaiorSequencia] = useState(12) // Valor mock inicial

  // Calcular multiplicador baseado no plano
  const isPro = profile?.plano?.toUpperCase() === 'ESTUDA_PRO'
  const multiplicador = isPro ? 1.5 : 1

  // Calcular nivel e progresso
  const nivelInfo = calcularNivel(xpTotal)
  const proxNivel = proximoNivel(nivelInfo.nivel)
  const progressoNivel = calcularProgressoNivel(xpTotal, nivelInfo)
  const xpParaProximoNivel = proxNivel ? proxNivel.xpMin - xpTotal : 0

  const fetchXP = useCallback(async () => {
    // Aguardar autenticacao carregar primeiro
    if (authLoading) {
      return
    }

    // Se nao tem usuario, usar dados mock e parar loading
    if (!user) {
      // Manter valores mock iniciais
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Buscar dados de XP do usuario
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (xpError && xpError.code !== 'PGRST116') {
        // PGRST116 = nao encontrado, vamos criar
        throw xpError
      }

      if (xpData) {
        setXpTotal(xpData.xp_total || 0)
        setSequenciaDias(xpData.sequencia_dias || 0)
        setMaiorSequencia(xpData.maior_sequencia || 0)
      } else {
        // Criar registro inicial
        const { error: insertError } = await supabase
          .from('user_xp')
          .insert({
            user_id: user.id,
            xp_total: 0,
            nivel: 1,
            sequencia_dias: 0,
            maior_sequencia: 0
          })

        if (insertError) {
          console.error('Erro ao criar user_xp:', insertError)
        }
        setXpTotal(0)
        setSequenciaDias(0)
        setMaiorSequencia(0)
      }

      // Buscar XP de hoje
      const hoje = new Date().toISOString().split('T')[0]
      const { data: historicoHoje } = await supabase
        .from('xp_historico')
        .select('xp_ganho')
        .eq('user_id', user.id)
        .gte('created_at', `${hoje}T00:00:00`)
        .lte('created_at', `${hoje}T23:59:59`)

      const xpHojeTotal = historicoHoje?.reduce((acc, h) => acc + (h.xp_ganho || 0), 0) || 0
      setXpHoje(xpHojeTotal)

      setLoading(false)
    } catch (err) {
      console.error('Erro ao buscar XP:', err)
      setError('Erro ao carregar XP')
      // Manter valores mock em caso de erro
      setLoading(false)
    }
  }, [user, authLoading])

  // Funcao para adicionar XP
  const addXP = useCallback(async (tipo: TipoAcaoXP, descricao?: string): Promise<{ xpGanho: number; nivelUp: boolean; novoNivel?: number }> => {
    if (!user) {
      return { xpGanho: 0, nivelUp: false }
    }

    try {
      const xpBase = XP_ACOES[tipo]
      const xpGanho = Math.round(xpBase * multiplicador)
      const novoXpTotal = xpTotal + xpGanho

      // Verificar se subiu de nivel
      const nivelAtual = calcularNivel(xpTotal)
      const novoNivelInfo = calcularNivel(novoXpTotal)
      const nivelUp = novoNivelInfo.nivel > nivelAtual.nivel

      // Atualizar XP no banco
      const { error: updateError } = await supabase
        .from('user_xp')
        .update({
          xp_total: novoXpTotal,
          nivel: novoNivelInfo.nivel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Erro ao atualizar XP:', updateError)
        return { xpGanho: 0, nivelUp: false }
      }

      // Registrar no historico
      await supabase
        .from('xp_historico')
        .insert({
          user_id: user.id,
          tipo_acao: tipo,
          xp_ganho: xpGanho,
          descricao: descricao || `${tipo} - ${xpGanho} XP`,
          multiplicador: multiplicador
        })

      // Atualizar estado local
      setXpTotal(novoXpTotal)
      setXpHoje(prev => prev + xpGanho)

      return {
        xpGanho,
        nivelUp,
        novoNivel: nivelUp ? novoNivelInfo.nivel : undefined
      }
    } catch (err) {
      console.error('Erro ao adicionar XP:', err)
      return { xpGanho: 0, nivelUp: false }
    }
  }, [user, xpTotal, multiplicador])

  useEffect(() => {
    fetchXP()
  }, [fetchXP])

  return {
    xpTotal,
    xpHoje,
    nivel: nivelInfo.nivel,
    nivelInfo,
    proximoNivel: proxNivel,
    progressoNivel,
    xpParaProximoNivel,
    sequenciaDias,
    maiorSequencia,
    multiplicador,
    loading: loading || authLoading,
    error,
    refresh: fetchXP,
    addXP
  }
}
