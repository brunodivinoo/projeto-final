/**
 * Sistema de Sugestoes Inteligentes
 *
 * Aprende com o historico do usuario para sugerir:
 * - Topicos relevantes baseados em estudos anteriores
 * - Acoes personalizadas (questoes, flashcards, etc.)
 * - Revisoes de espacamento baseadas em performance
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Usar getSupabaseAdmin() para lazy init

export interface Suggestion {
  type: 'topic' | 'action' | 'review'
  text: string
  fullPrompt: string
  icon: string
  priority: number
}

export interface UserLearningData {
  topicos_frequentes: Array<{ topico: string; count: number; ultima_vez: string }>
  termos_recentes: Array<{ termo: string; data: string }>
  disciplinas_preferidas: Array<{ disciplina: string; count: number }>
  performance_por_disciplina: Record<string, { acertos: number; total: number; taxa: number }>
}

// Acoes base com templates
export const BASE_ACTIONS = [
  {
    type: 'action' as const,
    template: 'Crie questoes sobre',
    icon: '📝',
    action: 'questoes',
  },
  {
    type: 'action' as const,
    template: 'Gere flashcards de',
    icon: '🃏',
    action: 'flashcards',
  },
  {
    type: 'action' as const,
    template: 'Monte um simulado de',
    icon: '📊',
    action: 'simulado',
  },
  {
    type: 'action' as const,
    template: 'Resumo sobre',
    icon: '📄',
    action: 'resumo',
  },
  {
    type: 'action' as const,
    template: 'Explique com imagens',
    icon: '🖼️',
    action: 'imagens',
  },
  {
    type: 'action' as const,
    template: 'Crie plano de estudos para',
    icon: '📅',
    action: 'plano',
  },
  {
    type: 'action' as const,
    template: 'Analise caso clinico de',
    icon: '🏥',
    action: 'caso_clinico',
  },
  {
    type: 'action' as const,
    template: 'Mapa mental de',
    icon: '🧠',
    action: 'mapa_mental',
  },
]

// Topicos medicos populares como fallback
const FALLBACK_TOPICS = [
  'Infarto Agudo do Miocardio',
  'Diabetes Mellitus Tipo 2',
  'Insuficiencia Cardiaca',
  'Pneumonia',
  'Hipertensao Arterial',
  'Asma',
  'DPOC',
  'Acidente Vascular Cerebral',
  'Hepatite',
  'Cirrose Hepatica',
  'Insuficiencia Renal',
  'Arritmias Cardiacas',
  'Sepse',
  'Meningite',
  'Tuberculose',
]

// Disciplinas medicas para sugestoes
const DISCIPLINAS_MEDICAS = [
  'Cardiologia',
  'Pneumologia',
  'Gastroenterologia',
  'Neurologia',
  'Nefrologia',
  'Endocrinologia',
  'Infectologia',
  'Hematologia',
  'Reumatologia',
  'Dermatologia',
  'Pediatria',
  'Ginecologia',
  'Cirurgia Geral',
  'Ortopedia',
  'Psiquiatria',
]

/**
 * Buscar dados de aprendizado do usuario
 */
async function getUserLearningData(userId: string): Promise<UserLearningData | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('aprendizado_usuario_med')
      .select('topicos_frequentes, termos_recentes, disciplinas_preferidas, performance_por_disciplina')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      console.log('[Suggestions] Nenhum dado de aprendizado encontrado para usuario')
      return null
    }

    return {
      topicos_frequentes: (data.topicos_frequentes as UserLearningData['topicos_frequentes']) || [],
      termos_recentes: (data.termos_recentes as UserLearningData['termos_recentes']) || [],
      disciplinas_preferidas: (data.disciplinas_preferidas as UserLearningData['disciplinas_preferidas']) || [],
      performance_por_disciplina: (data.performance_por_disciplina as UserLearningData['performance_por_disciplina']) || {},
    }
  } catch (error) {
    console.error('[Suggestions] Erro ao buscar dados de aprendizado:', error)
    return null
  }
}

/**
 * Buscar sugestoes personalizadas baseadas no historico
 */
export async function getSmartSuggestions(userId: string): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = []

  try {
    const learningData = await getUserLearningData(userId)

    if (learningData) {
      // Adicionar topicos frequentes do usuario
      if (learningData.topicos_frequentes && Array.isArray(learningData.topicos_frequentes)) {
        learningData.topicos_frequentes.slice(0, 3).forEach((t, i) => {
          suggestions.push({
            type: 'topic',
            text: t.topico,
            fullPrompt: `Explique detalhadamente sobre ${t.topico}`,
            icon: '📚',
            priority: 10 - i,
          })
        })
      }

      // Adicionar termos recentes
      if (learningData.termos_recentes && Array.isArray(learningData.termos_recentes)) {
        learningData.termos_recentes.slice(0, 2).forEach((t, i) => {
          // Evitar duplicatas
          if (!suggestions.some(s => s.text.toLowerCase() === t.termo.toLowerCase())) {
            suggestions.push({
              type: 'topic',
              text: t.termo,
              fullPrompt: `Continue estudando sobre ${t.termo}`,
              icon: '🔄',
              priority: 7 - i,
            })
          }
        })
      }

      // Sugerir areas com baixa performance para revisao
      if (learningData.performance_por_disciplina) {
        const lowPerformance = Object.entries(learningData.performance_por_disciplina)
          .filter(([, stats]) => stats.taxa < 0.6 && stats.total >= 5)
          .sort((a, b) => a[1].taxa - b[1].taxa)
          .slice(0, 2)

        lowPerformance.forEach(([disciplina], i) => {
          suggestions.push({
            type: 'review',
            text: `Revisar ${disciplina}`,
            fullPrompt: `Preciso revisar ${disciplina}. Crie questoes focadas nos pontos mais importantes.`,
            icon: '⚠️',
            priority: 8 - i,
          })
        })
      }
    }

    // Se nao tem dados suficientes, usar fallback
    if (suggestions.length < 3) {
      const shuffled = [...FALLBACK_TOPICS].sort(() => Math.random() - 0.5)
      shuffled.slice(0, 3 - suggestions.length).forEach((topic, i) => {
        suggestions.push({
          type: 'topic',
          text: topic,
          fullPrompt: `Explique sobre ${topic}`,
          icon: '💡',
          priority: 3 - i,
        })
      })
    }

    return suggestions.sort((a, b) => b.priority - a.priority)
  } catch (error) {
    console.error('[Suggestions] Erro ao buscar sugestoes:', error)
    // Retornar fallback em caso de erro
    return FALLBACK_TOPICS.slice(0, 3).map((topic, i) => ({
      type: 'topic',
      text: topic,
      fullPrompt: `Explique sobre ${topic}`,
      icon: '💡',
      priority: 3 - i,
    }))
  }
}

/**
 * Gerar sugestoes completas para os botoes de acao
 * Autocompleta com topicos relevantes do usuario
 */
export async function getActionSuggestions(
  userId: string,
  action: string
): Promise<string> {
  try {
    const suggestions = await getSmartSuggestions(userId)

    // Pegar o topico mais relevante
    const topTopic = suggestions[0]?.text || 'Sistema Cardiovascular'

    // Montar prompt completo baseado na acao
    const actionTemplates: Record<string, string> = {
      'questoes': `Crie 5 questoes de multipla escolha sobre ${topTopic} no estilo de provas de residencia medica`,
      'flashcards': `Gere 10 flashcards sobre ${topTopic} com conceitos essenciais para memorizar`,
      'simulado': `Monte um simulado com 10 questoes sobre ${topTopic} com diferentes niveis de dificuldade`,
      'resumo': `Faca um resumo completo sobre ${topTopic} destacando os pontos mais importantes`,
      'imagens': `Explique ${topTopic} usando imagens anatomicas de referencia e diagramas`,
      'plano': `Crie um plano de estudos de 2 semanas sobre ${topTopic} com metas diarias`,
      'caso_clinico': `Apresente um caso clinico sobre ${topTopic} e guie a analise diagnostica`,
      'mapa_mental': `Crie um mapa mental organizado sobre ${topTopic} com as principais conexoes`,
    }

    return actionTemplates[action] || `Explique sobre ${topTopic}`
  } catch (error) {
    console.error('[Suggestions] Erro ao gerar sugestao de acao:', error)
    return 'Explique sobre Sistema Cardiovascular'
  }
}

/**
 * Atualizar dados de aprendizado quando usuario pesquisa
 */
export async function updateUserLearning(
  userId: string,
  topic: string,
  discipline?: string
): Promise<void> {
  try {
    // Usar a funcao SQL que criamos
    await getSupabaseAdmin().rpc('atualizar_aprendizado_med', {
      p_user_id: userId,
      p_disciplina: discipline || 'Geral',
      p_topico: topic,
      p_termo_pesquisado: topic,
    })

    console.log('[Suggestions] Aprendizado atualizado para usuario:', userId)
  } catch (error) {
    console.error('[Suggestions] Erro ao atualizar aprendizado:', error)
  }
}

/**
 * Obter disciplinas sugeridas para o usuario
 */
export async function getSuggestedDisciplines(userId: string): Promise<string[]> {
  try {
    const learningData = await getUserLearningData(userId)

    if (learningData?.disciplinas_preferidas && learningData.disciplinas_preferidas.length > 0) {
      return learningData.disciplinas_preferidas
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(d => d.disciplina)
    }

    // Retornar disciplinas aleatorias como fallback
    return DISCIPLINAS_MEDICAS.sort(() => Math.random() - 0.5).slice(0, 5)
  } catch (error) {
    console.error('[Suggestions] Erro ao buscar disciplinas:', error)
    return DISCIPLINAS_MEDICAS.slice(0, 5)
  }
}

/**
 * Obter topicos para revisao (espacamento)
 */
export async function getTopicsForReview(userId: string): Promise<Suggestion[]> {
  try {
    // Buscar artefatos que precisam de revisao
    const { data: artefatos } = await getSupabaseAdmin()
      .from('artefatos_med')
      .select('titulo, topico, disciplina, proxima_revisao')
      .eq('user_id', userId)
      .lte('proxima_revisao', new Date().toISOString())
      .neq('status', 'arquivado')
      .order('proxima_revisao', { ascending: true })
      .limit(5)

    if (!artefatos || artefatos.length === 0) {
      return []
    }

    return artefatos.map((a, i) => ({
      type: 'review' as const,
      text: a.topico || a.titulo,
      fullPrompt: `Revisar: ${a.titulo}. Disciplina: ${a.disciplina || 'Geral'}`,
      icon: '🔔',
      priority: 10 - i,
    }))
  } catch (error) {
    console.error('[Suggestions] Erro ao buscar topicos para revisao:', error)
    return []
  }
}

/**
 * Combinar todas as sugestoes (topicos + revisoes + acoes)
 */
export async function getAllSuggestions(userId: string): Promise<{
  topics: Suggestion[]
  reviews: Suggestion[]
  actions: typeof BASE_ACTIONS
}> {
  const [topics, reviews] = await Promise.all([
    getSmartSuggestions(userId),
    getTopicsForReview(userId),
  ])

  return {
    topics,
    reviews,
    actions: BASE_ACTIONS,
  }
}
