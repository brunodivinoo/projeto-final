'use client'
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export type TipoRecurso =
  | 'questoes_ia'
  | 'questoes'
  | 'resumos'
  | 'chat_mensagens'
  | 'pdf_paginas'
  | 'simulados'
  | 'flashcards'
  | 'baralhos'
  | 'ciclos'
  | 'planos_estudo'

interface LimitInfo {
  canUse: boolean
  usado: number
  limite: number
  restante: number
  tipo: 'diario' | 'mensal'
  isIlimitado: boolean
  mensagem: string
}

interface CheckLimitResult {
  checkLimit: (recurso: TipoRecurso, quantidade?: number) => Promise<LimitInfo>
  loading: boolean
  error: string | null
}

const LIMITE_ILIMITADO = -1

// Mapeamento de recursos para colunas do plano
const RECURSO_PARA_COLUNA: Record<TipoRecurso, { coluna: string; tipo: 'diario' | 'mensal' }> = {
  questoes_ia: { coluna: 'limite_questoes_ia_dia', tipo: 'diario' },
  questoes: { coluna: 'limite_questoes_dia', tipo: 'diario' },
  resumos: { coluna: 'limite_resumos_mes', tipo: 'mensal' },
  chat_mensagens: { coluna: 'limite_chat_mensagens_dia', tipo: 'diario' },
  pdf_paginas: { coluna: 'limite_pdf_paginas_mes', tipo: 'mensal' },
  simulados: { coluna: 'limite_simulados_mes', tipo: 'mensal' },
  flashcards: { coluna: 'limite_flashcards', tipo: 'mensal' },
  baralhos: { coluna: 'limite_baralhos', tipo: 'mensal' },
  ciclos: { coluna: 'limite_ciclos', tipo: 'mensal' },
  planos_estudo: { coluna: 'limite_planos_estudo', tipo: 'mensal' },
}

// Mensagens de limite atingido por recurso
const MENSAGENS_LIMITE: Record<TipoRecurso, string> = {
  questoes_ia: 'Você atingiu o limite diário de geração de questões com IA.',
  questoes: 'Você atingiu o limite diário de questões.',
  resumos: 'Você atingiu o limite mensal de resumos.',
  chat_mensagens: 'Você atingiu o limite diário de mensagens no chat IA.',
  pdf_paginas: 'Você atingiu o limite mensal de páginas de PDF.',
  simulados: 'Você atingiu o limite mensal de simulados.',
  flashcards: 'Você atingiu o limite de flashcards.',
  baralhos: 'Você atingiu o limite de baralhos.',
  ciclos: 'Você atingiu o limite de ciclos de estudo.',
  planos_estudo: 'Você atingiu o limite de planos de estudo.',
}

export function useCheckLimit(): CheckLimitResult {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkLimit = useCallback(async (recurso: TipoRecurso, quantidade: number = 1): Promise<LimitInfo> => {
    if (!user) {
      return {
        canUse: false,
        usado: 0,
        limite: 0,
        restante: 0,
        tipo: 'diario',
        isIlimitado: false,
        mensagem: 'Usuário não autenticado'
      }
    }

    setLoading(true)
    setError(null)

    try {
      // Buscar o plano do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('plano')
        .eq('id', user.id)
        .single()

      const userPlano = profile?.plano?.toUpperCase() || 'FREE'
      const planoNome = userPlano === 'ESTUDA_PRO' ? 'ESTUDA_PRO' : 'FREE'

      // Buscar limites do plano
      const { data: planoData } = await supabase
        .from('planos')
        .select('*')
        .eq('nome', planoNome)
        .single()

      if (!planoData) {
        setError('Plano não encontrado')
        return {
          canUse: false,
          usado: 0,
          limite: 0,
          restante: 0,
          tipo: 'diario',
          isIlimitado: false,
          mensagem: 'Erro ao verificar plano'
        }
      }

      const config = RECURSO_PARA_COLUNA[recurso]
      const limite = planoData[config.coluna] as number

      // Verificar se é ilimitado
      if (limite === LIMITE_ILIMITADO) {
        setLoading(false)
        return {
          canUse: true,
          usado: 0,
          limite: -1,
          restante: -1,
          tipo: config.tipo,
          isIlimitado: true,
          mensagem: 'Recurso ilimitado'
        }
      }

      // Buscar uso atual
      let usado = 0

      if (config.tipo === 'diario') {
        const hoje = new Date().toISOString().split('T')[0]
        const { data: usoDiario } = await supabase
          .from('uso_diario')
          .select('quantidade')
          .eq('user_id', user.id)
          .eq('data', hoje)
          .eq('tipo', recurso)
          .single()

        usado = usoDiario?.quantidade || 0
      } else {
        const primeiroDiaMes = new Date()
        primeiroDiaMes.setDate(1)
        const mesRef = primeiroDiaMes.toISOString().split('T')[0]

        const { data: usoMensal } = await supabase
          .from('uso_mensal')
          .select('quantidade')
          .eq('user_id', user.id)
          .eq('mes_referencia', mesRef)
          .eq('tipo', recurso)
          .single()

        usado = usoMensal?.quantidade || 0
      }

      const restante = limite - usado
      const canUse = restante >= quantidade

      setLoading(false)
      return {
        canUse,
        usado,
        limite,
        restante,
        tipo: config.tipo,
        isIlimitado: false,
        mensagem: canUse ? 'OK' : MENSAGENS_LIMITE[recurso]
      }

    } catch (err) {
      console.error('Erro ao verificar limite:', err)
      setError('Erro ao verificar limite')
      setLoading(false)
      return {
        canUse: false,
        usado: 0,
        limite: 0,
        restante: 0,
        tipo: 'diario',
        isIlimitado: false,
        mensagem: 'Erro ao verificar limite'
      }
    }
  }, [user])

  return { checkLimit, loading, error }
}

// Hook para consumir um recurso (incrementar uso)
export function useConsumeLimit() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const consumeLimit = useCallback(async (recurso: TipoRecurso, quantidade: number = 1): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const config = RECURSO_PARA_COLUNA[recurso]

      if (config.tipo === 'diario') {
        const hoje = new Date().toISOString().split('T')[0]

        // Tentar inserir ou atualizar
        const { data: existing } = await supabase
          .from('uso_diario')
          .select('id, quantidade')
          .eq('user_id', user.id)
          .eq('data', hoje)
          .eq('tipo', recurso)
          .single()

        if (existing) {
          // Atualizar existente
          await supabase
            .from('uso_diario')
            .update({ quantidade: existing.quantidade + quantidade })
            .eq('id', existing.id)
        } else {
          // Inserir novo
          await supabase
            .from('uso_diario')
            .insert({
              user_id: user.id,
              data: hoje,
              tipo: recurso,
              quantidade: quantidade
            })
        }
      } else {
        const primeiroDiaMes = new Date()
        primeiroDiaMes.setDate(1)
        const mesRef = primeiroDiaMes.toISOString().split('T')[0]

        // Tentar inserir ou atualizar
        const { data: existing } = await supabase
          .from('uso_mensal')
          .select('id, quantidade')
          .eq('user_id', user.id)
          .eq('mes_referencia', mesRef)
          .eq('tipo', recurso)
          .single()

        if (existing) {
          // Atualizar existente
          await supabase
            .from('uso_mensal')
            .update({ quantidade: existing.quantidade + quantidade })
            .eq('id', existing.id)
        } else {
          // Inserir novo
          await supabase
            .from('uso_mensal')
            .insert({
              user_id: user.id,
              mes_referencia: mesRef,
              tipo: recurso,
              quantidade: quantidade
            })
        }
      }

      setLoading(false)
      return true

    } catch (err) {
      console.error('Erro ao consumir recurso:', err)
      setError('Erro ao registrar uso')
      setLoading(false)
      return false
    }
  }, [user])

  return { consumeLimit, loading, error }
}
