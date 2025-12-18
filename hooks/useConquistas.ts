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

// Definição de todas as conquistas
export const CONQUISTAS_CONFIG: Omit<Conquista, 'conquistada' | 'dataConquista' | 'progresso'>[] = [
  // Categoria: Estudo
  {
    id: '1',
    codigo: 'primeira_questao',
    nome: 'Primeiro Passo',
    descricao: 'Responda sua primeira questão',
    icone: 'play_arrow',
    cor: '#22c55e',
    categoria: 'estudo',
    xpRecompensa: 50,
    requisito: 'Responder 1 questão',
    meta: 1
  },
  {
    id: '2',
    codigo: 'questoes_10',
    nome: 'Aquecendo os Motores',
    descricao: 'Responda 10 questões',
    icone: 'local_fire_department',
    cor: '#f59e0b',
    categoria: 'estudo',
    xpRecompensa: 100,
    requisito: 'Responder 10 questões',
    meta: 10
  },
  {
    id: '3',
    codigo: 'questoes_50',
    nome: 'Estudante Dedicado',
    descricao: 'Responda 50 questões',
    icone: 'school',
    cor: '#3b82f6',
    categoria: 'estudo',
    xpRecompensa: 250,
    requisito: 'Responder 50 questões',
    meta: 50
  },
  {
    id: '4',
    codigo: 'questoes_100',
    nome: 'Centurião',
    descricao: 'Responda 100 questões',
    icone: 'military_tech',
    cor: '#8b5cf6',
    categoria: 'estudo',
    xpRecompensa: 500,
    requisito: 'Responder 100 questões',
    meta: 100
  },
  {
    id: '5',
    codigo: 'questoes_500',
    nome: 'Mestre das Questões',
    descricao: 'Responda 500 questões',
    icone: 'emoji_events',
    cor: '#fbbf24',
    categoria: 'estudo',
    xpRecompensa: 1000,
    requisito: 'Responder 500 questões',
    meta: 500
  },
  {
    id: '6',
    codigo: 'primeiro_simulado',
    nome: 'Simulador',
    descricao: 'Complete seu primeiro simulado',
    icone: 'assignment',
    cor: '#ec4899',
    categoria: 'estudo',
    xpRecompensa: 100,
    requisito: 'Completar 1 simulado',
    meta: 1
  },
  {
    id: '7',
    codigo: 'simulados_10',
    nome: 'Veterano de Provas',
    descricao: 'Complete 10 simulados',
    icone: 'workspace_premium',
    cor: '#14b8a6',
    categoria: 'estudo',
    xpRecompensa: 500,
    requisito: 'Completar 10 simulados',
    meta: 10
  },
  {
    id: '8',
    codigo: 'primeiro_resumo',
    nome: 'Resumidor',
    descricao: 'Crie seu primeiro resumo com IA',
    icone: 'summarize',
    cor: '#a855f7',
    categoria: 'estudo',
    xpRecompensa: 75,
    requisito: 'Criar 1 resumo',
    meta: 1
  },
  {
    id: '9',
    codigo: 'flashcards_100',
    nome: 'Memória de Elefante',
    descricao: 'Revise 100 flashcards',
    icone: 'style',
    cor: '#06b6d4',
    categoria: 'estudo',
    xpRecompensa: 300,
    requisito: 'Revisar 100 flashcards',
    meta: 100
  },
  {
    id: '10',
    codigo: 'acertos_90',
    nome: 'Precisão Cirúrgica',
    descricao: 'Alcance 90% de acertos em um simulado',
    icone: 'target',
    cor: '#ef4444',
    categoria: 'estudo',
    xpRecompensa: 200,
    requisito: '90% de acertos',
    meta: 90
  },

  // Categoria: Consistência
  {
    id: '11',
    codigo: 'sequencia_3',
    nome: 'Começando Bem',
    descricao: 'Estude 3 dias seguidos',
    icone: 'calendar_today',
    cor: '#22c55e',
    categoria: 'consistencia',
    xpRecompensa: 75,
    requisito: '3 dias de sequência',
    meta: 3
  },
  {
    id: '12',
    codigo: 'sequencia_7',
    nome: 'Semana Perfeita',
    descricao: 'Estude 7 dias seguidos',
    icone: 'date_range',
    cor: '#3b82f6',
    categoria: 'consistencia',
    xpRecompensa: 150,
    requisito: '7 dias de sequência',
    meta: 7
  },
  {
    id: '13',
    codigo: 'sequencia_30',
    nome: 'Mês de Fogo',
    descricao: 'Estude 30 dias seguidos',
    icone: 'whatshot',
    cor: '#f97316',
    categoria: 'consistencia',
    xpRecompensa: 500,
    requisito: '30 dias de sequência',
    meta: 30
  },
  {
    id: '14',
    codigo: 'sequencia_100',
    nome: 'Lenda Viva',
    descricao: 'Estude 100 dias seguidos',
    icone: 'diamond',
    cor: '#fbbf24',
    categoria: 'consistencia',
    xpRecompensa: 1500,
    requisito: '100 dias de sequência',
    meta: 100
  },
  {
    id: '15',
    codigo: 'madrugador',
    nome: 'Madrugador',
    descricao: 'Estude antes das 6h da manhã',
    icone: 'wb_twilight',
    cor: '#f59e0b',
    categoria: 'consistencia',
    xpRecompensa: 50,
    requisito: 'Estudar antes das 6h',
    meta: 1
  },
  {
    id: '16',
    codigo: 'coruja',
    nome: 'Coruja Noturna',
    descricao: 'Estude após meia-noite',
    icone: 'nightlight',
    cor: '#6366f1',
    categoria: 'consistencia',
    xpRecompensa: 50,
    requisito: 'Estudar após 0h',
    meta: 1
  },

  // Categoria: Social
  {
    id: '17',
    codigo: 'primeiro_ranking',
    nome: 'Competidor',
    descricao: 'Entre no Top 100 do ranking semanal',
    icone: 'leaderboard',
    cor: '#22c55e',
    categoria: 'social',
    xpRecompensa: 100,
    requisito: 'Top 100 no ranking',
    meta: 100
  },
  {
    id: '18',
    codigo: 'top_10',
    nome: 'Elite',
    descricao: 'Entre no Top 10 do ranking semanal',
    icone: 'star',
    cor: '#fbbf24',
    categoria: 'social',
    xpRecompensa: 300,
    requisito: 'Top 10 no ranking',
    meta: 10
  },
  {
    id: '19',
    codigo: 'campeao',
    nome: 'Campeão',
    descricao: 'Fique em 1º lugar no ranking semanal',
    icone: 'emoji_events',
    cor: '#fbbf24',
    categoria: 'social',
    xpRecompensa: 1000,
    requisito: '1º lugar no ranking',
    meta: 1
  },

  // Categoria: Especial
  {
    id: '20',
    codigo: 'pro_member',
    nome: 'Membro PRO',
    descricao: 'Assine o plano Estuda PRO',
    icone: 'workspace_premium',
    cor: '#137fec',
    categoria: 'especial',
    xpRecompensa: 200,
    requisito: 'Ser assinante PRO',
    meta: 1
  },
  {
    id: '21',
    codigo: 'nivel_5',
    nome: 'Avançando',
    descricao: 'Alcance o nível 5',
    icone: 'trending_up',
    cor: '#22c55e',
    categoria: 'especial',
    xpRecompensa: 250,
    requisito: 'Chegar ao nível 5',
    meta: 5
  },
  {
    id: '22',
    codigo: 'nivel_10',
    nome: 'Transcendente',
    descricao: 'Alcance o nível 10 (máximo)',
    icone: 'auto_awesome',
    cor: '#fbbf24',
    categoria: 'especial',
    xpRecompensa: 1000,
    requisito: 'Chegar ao nível 10',
    meta: 10
  },
  {
    id: '23',
    codigo: 'xp_1000',
    nome: 'Milhar',
    descricao: 'Acumule 1.000 XP',
    icone: 'stars',
    cor: '#8b5cf6',
    categoria: 'especial',
    xpRecompensa: 100,
    requisito: '1.000 XP total',
    meta: 1000
  },
  {
    id: '24',
    codigo: 'xp_10000',
    nome: 'Lendário',
    descricao: 'Acumule 10.000 XP',
    icone: 'diamond',
    cor: '#ec4899',
    categoria: 'especial',
    xpRecompensa: 500,
    requisito: '10.000 XP total',
    meta: 10000
  },
]

export function useConquistas(): ConquistasData {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conquistas, setConquistas] = useState<Conquista[]>([])

  const fetchConquistas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user) {
        // Retornar conquistas sem status de conquistada
        const conquistasSemStatus = CONQUISTAS_CONFIG.map(c => ({
          ...c,
          conquistada: false,
          progresso: 0
        }))
        setConquistas(conquistasSemStatus)
        setLoading(false)
        return
      }

      // Buscar conquistas do usuário
      const { data: userConquistas, error: userError } = await supabase
        .from('user_conquistas')
        .select('conquista_id, data_conquista')
        .eq('user_id', user.id)

      if (userError && userError.code !== 'PGRST116') {
        console.error('Erro ao buscar conquistas:', userError)
      }

      // Mapear conquistas conquistadas
      const conquistadasMap = new Map(
        userConquistas?.map(uc => [uc.conquista_id, uc.data_conquista]) || []
      )

      // Buscar progresso do usuário para calcular progresso das conquistas
      // Por enquanto usar dados mock
      const progressoMock: Record<string, number> = {
        'primeira_questao': 1,
        'questoes_10': 7,
        'questoes_50': 7,
        'questoes_100': 7,
        'questoes_500': 7,
        'primeiro_simulado': 1,
        'simulados_10': 2,
        'primeiro_resumo': 1,
        'flashcards_100': 45,
        'acertos_90': 85,
        'sequencia_3': 5,
        'sequencia_7': 5,
        'sequencia_30': 5,
        'sequencia_100': 5,
        'nivel_5': 4,
        'nivel_10': 4,
        'xp_1000': 850,
        'xp_10000': 850,
      }

      // Montar lista com status
      const conquistasComStatus: Conquista[] = CONQUISTAS_CONFIG.map(c => ({
        ...c,
        conquistada: conquistadasMap.has(c.id) || ['primeira_questao', 'primeiro_simulado', 'primeiro_resumo', 'sequencia_3'].includes(c.codigo),
        dataConquista: conquistadasMap.get(c.id),
        progresso: progressoMock[c.codigo] || 0
      }))

      setConquistas(conquistasComStatus)
      setLoading(false)
    } catch (err) {
      console.error('Erro ao buscar conquistas:', err)
      setError('Erro ao carregar conquistas')
      setLoading(false)
    }
  }, [user])

  // Verificar se uma conquista foi alcançada
  const verificarConquista = useCallback(async (codigo: string): Promise<boolean> => {
    if (!user) return false

    const conquista = conquistas.find(c => c.codigo === codigo)
    if (!conquista || conquista.conquistada) return false

    // TODO: Implementar lógica de verificação real
    // Por enquanto, retorna false
    return false
  }, [user, conquistas])

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
    loading,
    error,
    refresh: fetchConquistas,
    verificarConquista
  }
}

// Função para obter nome da categoria
export function getNomeCategoria(categoria: string): string {
  const nomes: Record<string, string> = {
    estudo: 'Estudo',
    social: 'Social',
    consistencia: 'Consistência',
    especial: 'Especial'
  }
  return nomes[categoria] || categoria
}

// Função para obter cor da categoria
export function getCorCategoria(categoria: string): string {
  const cores: Record<string, string> = {
    estudo: '#3b82f6',
    social: '#22c55e',
    consistencia: '#f59e0b',
    especial: '#a855f7'
  }
  return cores[categoria] || '#64748b'
}
