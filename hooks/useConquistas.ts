'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Conquista {
  id: string
  codigo: string
  nome: string
  descricao: string
  icone: string
  cor: string
  categoria: 'estudo' | 'social' | 'consistencia' | 'especial'
  xpRecompensa: number
  requisito: string
  conquistada: boolean
  dataConquista?: string
  progresso?: number
  meta?: number
}

export interface ConquistasData {
  conquistas: Conquista[]
  conquistadas: Conquista[]
  pendentes: Conquista[]
  totalConquistas: number
  conquistasObtidas: number
  porcentagemCompleta: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  verificarConquista: (codigo: string) => Promise<boolean>
}

// Conquistas mock para fallback
const CONQUISTAS_MOCK: Conquista[] = [
  { id: '1', codigo: 'primeira_questao', nome: 'Primeiro Passo', descricao: 'Responda sua primeira questao', icone: 'play_arrow', cor: '#22c55e', categoria: 'estudo', xpRecompensa: 50, requisito: 'Responder 1 questao', meta: 1, conquistada: true, progresso: 1 },
  { id: '2', codigo: 'questoes_10', nome: 'Aquecendo os Motores', descricao: 'Responda 10 questoes', icone: 'local_fire_department', cor: '#f59e0b', categoria: 'estudo', xpRecompensa: 100, requisito: 'Responder 10 questoes', meta: 10, conquistada: false, progresso: 7 },
  { id: '3', codigo: 'sequencia_3', nome: 'Comecando Bem', descricao: 'Estude 3 dias seguidos', icone: 'calendar_today', cor: '#22c55e', categoria: 'consistencia', xpRecompensa: 75, requisito: '3 dias de sequencia', meta: 3, conquistada: true, progresso: 5 },
  { id: '4', codigo: 'sequencia_7', nome: 'Semana Perfeita', descricao: 'Estude 7 dias seguidos', icone: 'date_range', cor: '#3b82f6', categoria: 'consistencia', xpRecompensa: 150, requisito: '7 dias de sequencia', meta: 7, conquistada: false, progresso: 5 },
]

export function useConquistas(): ConquistasData {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conquistas, setConquistas] = useState<Conquista[]>(CONQUISTAS_MOCK)

  const fetchConquistas = useCallback(async () => {
    // Aguardar autenticacao carregar primeiro
    if (authLoading) {
      return
    }

    // Se nao tem usuario, usar dados mock e parar loading
    if (!user) {
      setConquistas(CONQUISTAS_MOCK)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Buscar todas as conquistas do banco
      const { data: conquistasDb, error: conquistasError } = await supabase
        .from('conquistas')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: true })

      if (conquistasError) {
        console.error('Erro ao buscar conquistas:', conquistasError)
        setConquistas(CONQUISTAS_MOCK)
        setLoading(false)
        return
      }

      // Buscar conquistas do usuario
      const { data: userConquistas } = await supabase
        .from('user_conquistas')
        .select('conquista_id, desbloqueada_em')
        .eq('user_id', user.id)

      // Buscar estatisticas do usuario para calcular progresso
      const { data: stats } = await supabase
        .from('estatisticas_usuario')
        .select('questoes_total, sequencia_dias')
        .eq('user_id', user.id)
        .single()

      const { data: xpData } = await supabase
        .from('user_xp')
        .select('xp_total, nivel')
        .eq('user_id', user.id)
        .single()

      // Mapear conquistas conquistadas
      const conquistadasMap = new Map(
        userConquistas?.map(uc => [uc.conquista_id, uc.desbloqueada_em]) || []
      )

      // Calcular progresso baseado no tipo de requisito
      const calcularProgresso = (requisito_tipo: string, requisito_valor: number): number => {
        switch (requisito_tipo) {
          case 'questoes_respondidas':
            return stats?.questoes_total || 0
          case 'sequencia_dias':
            return stats?.sequencia_dias || 0
          case 'nivel':
            return xpData?.nivel || 1
          case 'xp_total':
            return xpData?.xp_total || 0
          default:
            return 0
        }
      }

      // Montar lista de conquistas formatadas
      const conquistasFormatadas: Conquista[] = (conquistasDb || []).map((c: any) => ({
        id: c.id,
        codigo: c.codigo,
        nome: c.nome,
        descricao: c.descricao,
        icone: c.icone,
        cor: c.cor || '#3b82f6',
        categoria: (c.categoria || 'estudo') as Conquista['categoria'],
        xpRecompensa: c.xp_recompensa,
        requisito: `${c.requisito_tipo}: ${c.requisito_valor}`,
        conquistada: conquistadasMap.has(c.id),
        dataConquista: conquistadasMap.get(c.id),
        progresso: calcularProgresso(c.requisito_tipo, c.requisito_valor),
        meta: c.requisito_valor || c.meta || 1
      }))

      setConquistas(conquistasFormatadas.length > 0 ? conquistasFormatadas : CONQUISTAS_MOCK)
      setLoading(false)
    } catch (err) {
      console.error('Erro ao buscar conquistas:', err)
      setError('Erro ao carregar conquistas')
      setConquistas(CONQUISTAS_MOCK)
      setLoading(false)
    }
  }, [user, authLoading])

  // Verificar se uma conquista foi alcancada
  const verificarConquista = useCallback(async (codigo: string): Promise<boolean> => {
    if (!user) return false

    const conquista = conquistas.find(c => c.codigo === codigo)
    if (!conquista || conquista.conquistada) return false

    // Verificar se o progresso atingiu a meta
    if (conquista.progresso && conquista.meta && conquista.progresso >= conquista.meta) {
      // Desbloquear conquista
      const { error } = await supabase
        .from('user_conquistas')
        .insert({
          user_id: user.id,
          conquista_id: conquista.id
        })

      if (!error) {
        // Adicionar XP da conquista
        await supabase
          .from('user_xp')
          .update({
            xp_total: supabase.rpc('increment_xp', { amount: conquista.xpRecompensa })
          })
          .eq('user_id', user.id)

        // Atualizar lista
        await fetchConquistas()
        return true
      }
    }

    return false
  }, [user, conquistas, fetchConquistas])

  useEffect(() => {
    fetchConquistas()
  }, [fetchConquistas])

  const conquistadas = conquistas.filter(c => c.conquistada)
  const pendentes = conquistas.filter(c => !c.conquistada)

  return {
    conquistas,
    conquistadas,
    pendentes,
    totalConquistas: conquistas.length,
    conquistasObtidas: conquistadas.length,
    porcentagemCompleta: conquistas.length > 0
      ? Math.round((conquistadas.length / conquistas.length) * 100)
      : 0,
    loading: loading || authLoading,
    error,
    refresh: fetchConquistas,
    verificarConquista
  }
}

// Funcao para obter nome da categoria
export function getNomeCategoria(categoria: string): string {
  const nomes: Record<string, string> = {
    estudo: 'Estudo',
    social: 'Social',
    consistencia: 'Consistencia',
    especial: 'Especial'
  }
  return nomes[categoria] || categoria
}

// Funcao para obter cor da categoria
export function getCorCategoria(categoria: string): string {
  const cores: Record<string, string> = {
    estudo: '#3b82f6',
    social: '#22c55e',
    consistencia: '#f59e0b',
    especial: '#a855f7'
  }
  return cores[categoria] || '#64748b'
}
