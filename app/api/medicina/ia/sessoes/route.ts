import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Cliente admin do Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Tipos
export type ChatMode = 'chat' | 'caso_clinico' | 'tutor' | 'questoes'

export interface SessaoModo {
  id: string
  conversa_id: string
  user_id: string
  modo: ChatMode
  iniciado_em: string
  finalizado_em: string | null
  total_mensagens: number
  total_tokens: number
  metricas: {
    score?: number
    questoes_total?: number
    questoes_acertos?: number
    questoes_erros?: number
    caso_id?: string
    caso_estado?: string
    conceitos_aprendidos?: string[]
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

export interface EstatisticasModo {
  modo: ChatMode
  total_sessoes: number
  total_mensagens: number
  total_tokens: number
  tempo_medio_segundos: number
  score_medio: number | null
  total_questoes: number
  questoes_acertos: number
  taxa_acerto: number
}

/**
 * POST - Criar nova sessão de modo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, conversa_id, modo } = body

    if (!user_id || !conversa_id || !modo) {
      return NextResponse.json(
        { error: 'user_id, conversa_id e modo são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar modo
    const modosValidos: ChatMode[] = ['chat', 'caso_clinico', 'tutor', 'questoes']
    if (!modosValidos.includes(modo)) {
      return NextResponse.json(
        { error: `Modo inválido. Use: ${modosValidos.join(', ')}` },
        { status: 400 }
      )
    }

    // Finalizar sessão anterior da mesma conversa (se houver)
    await supabaseAdmin
      .from('sessoes_modo_med')
      .update({ 
        finalizado_em: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('conversa_id', conversa_id)
      .is('finalizado_em', null)

    // Criar nova sessão
    const { data: novaSessao, error } = await supabaseAdmin
      .from('sessoes_modo_med')
      .insert({
        conversa_id,
        user_id,
        modo,
        iniciado_em: new Date().toISOString(),
        metricas: {}
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar sessão:', error)
      return NextResponse.json(
        { error: 'Erro ao criar sessão', details: error.message },
        { status: 500 }
      )
    }

    // Atualizar modo da conversa
    await supabaseAdmin
      .from('conversas_ia_med')
      .update({ modo })
      .eq('id', conversa_id)

    return NextResponse.json({
      success: true,
      sessao: novaSessao,
      message: `Sessão de ${modo} iniciada`
    })

  } catch (error) {
    console.error('Erro na API de sessões:', error)
    return NextResponse.json(
      { error: 'Erro interno', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

/**
 * GET - Listar sessões de uma conversa ou estatísticas do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const conversa_id = searchParams.get('conversa_id')
    const tipo = searchParams.get('tipo') // 'lista' | 'estatisticas' | 'ativa'

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    // Retornar sessão ativa de uma conversa
    if (tipo === 'ativa' && conversa_id) {
      const { data: sessaoAtiva, error } = await supabaseAdmin
        .from('sessoes_modo_med')
        .select('*')
        .eq('conversa_id', conversa_id)
        .is('finalizado_em', null)
        .order('iniciado_em', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Erro ao buscar sessão ativa:', error)
      }

      return NextResponse.json({
        success: true,
        sessao_ativa: sessaoAtiva || null
      })
    }

    // Retornar estatísticas por modo
    if (tipo === 'estatisticas') {
      // Estatísticas de sessões por modo
      const { data: sessoes, error: sessoesError } = await supabaseAdmin
        .from('sessoes_modo_med')
        .select('modo, total_mensagens, total_tokens, metricas, iniciado_em, finalizado_em')
        .eq('user_id', user_id)

      if (sessoesError) {
        console.error('Erro ao buscar estatísticas:', sessoesError)
        return NextResponse.json(
          { error: 'Erro ao buscar estatísticas' },
          { status: 500 }
        )
      }

      // Estatísticas de questões
      const { data: questoes, error: questoesError } = await supabaseAdmin
        .from('questoes_sessao_med')
        .select('tema, acertou, tempo_resposta_segundos')
        .eq('user_id', user_id)

      // Agregar por modo
      const estatisticas: Record<ChatMode, EstatisticasModo> = {
        chat: { modo: 'chat', total_sessoes: 0, total_mensagens: 0, total_tokens: 0, tempo_medio_segundos: 0, score_medio: null, total_questoes: 0, questoes_acertos: 0, taxa_acerto: 0 },
        caso_clinico: { modo: 'caso_clinico', total_sessoes: 0, total_mensagens: 0, total_tokens: 0, tempo_medio_segundos: 0, score_medio: null, total_questoes: 0, questoes_acertos: 0, taxa_acerto: 0 },
        tutor: { modo: 'tutor', total_sessoes: 0, total_mensagens: 0, total_tokens: 0, tempo_medio_segundos: 0, score_medio: null, total_questoes: 0, questoes_acertos: 0, taxa_acerto: 0 },
        questoes: { modo: 'questoes', total_sessoes: 0, total_mensagens: 0, total_tokens: 0, tempo_medio_segundos: 0, score_medio: null, total_questoes: 0, questoes_acertos: 0, taxa_acerto: 0 }
      }

      // Processar sessões
      const temposPorModo: Record<ChatMode, number[]> = { chat: [], caso_clinico: [], tutor: [], questoes: [] }
      const scoresPorModo: Record<ChatMode, number[]> = { chat: [], caso_clinico: [], tutor: [], questoes: [] }

      sessoes?.forEach(s => {
        const modo = s.modo as ChatMode
        estatisticas[modo].total_sessoes++
        estatisticas[modo].total_mensagens += s.total_mensagens || 0
        estatisticas[modo].total_tokens += s.total_tokens || 0

        // Tempo da sessão
        if (s.iniciado_em) {
          const inicio = new Date(s.iniciado_em).getTime()
          const fim = s.finalizado_em ? new Date(s.finalizado_em).getTime() : Date.now()
          temposPorModo[modo].push((fim - inicio) / 1000)
        }

        // Score
        if (s.metricas?.score) {
          scoresPorModo[modo].push(s.metricas.score)
        }
      })

      // Calcular médias
      Object.keys(estatisticas).forEach(modo => {
        const m = modo as ChatMode
        if (temposPorModo[m].length > 0) {
          estatisticas[m].tempo_medio_segundos = Math.round(
            temposPorModo[m].reduce((a, b) => a + b, 0) / temposPorModo[m].length
          )
        }
        if (scoresPorModo[m].length > 0) {
          estatisticas[m].score_medio = Math.round(
            scoresPorModo[m].reduce((a, b) => a + b, 0) / scoresPorModo[m].length
          )
        }
      })

      // Adicionar estatísticas de questões
      if (questoes) {
        estatisticas.questoes.total_questoes = questoes.length
        estatisticas.questoes.questoes_acertos = questoes.filter(q => q.acertou).length
        estatisticas.questoes.taxa_acerto = questoes.length > 0 
          ? Math.round((estatisticas.questoes.questoes_acertos / questoes.length) * 100)
          : 0
      }

      return NextResponse.json({
        success: true,
        estatisticas: Object.values(estatisticas)
      })
    }

    // Retornar lista de sessões de uma conversa
    if (conversa_id) {
      const { data: sessoes, error } = await supabaseAdmin
        .from('sessoes_modo_med')
        .select('*')
        .eq('conversa_id', conversa_id)
        .order('iniciado_em', { ascending: true })

      if (error) {
        console.error('Erro ao listar sessões:', error)
        return NextResponse.json(
          { error: 'Erro ao listar sessões' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        sessoes: sessoes || []
      })
    }

    // Retornar todas as sessões do usuário (últimas 50)
    const { data: sessoes, error } = await supabaseAdmin
      .from('sessoes_modo_med')
      .select('*, conversas_ia_med(titulo)')
      .eq('user_id', user_id)
      .order('iniciado_em', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erro ao listar sessões:', error)
      return NextResponse.json(
        { error: 'Erro ao listar sessões' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sessoes: sessoes || []
    })

  } catch (error) {
    console.error('Erro na API de sessões:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Atualizar sessão (finalizar, atualizar métricas)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessao_id, user_id, finalizar, metricas } = body

    if (!sessao_id || !user_id) {
      return NextResponse.json(
        { error: 'sessao_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (finalizar) {
      updateData.finalizado_em = new Date().toISOString()
    }

    if (metricas) {
      // Buscar métricas atuais para fazer merge
      const { data: sessaoAtual } = await supabaseAdmin
        .from('sessoes_modo_med')
        .select('metricas')
        .eq('id', sessao_id)
        .single()

      updateData.metricas = {
        ...(sessaoAtual?.metricas || {}),
        ...metricas
      }
    }

    const { data, error } = await supabaseAdmin
      .from('sessoes_modo_med')
      .update(updateData)
      .eq('id', sessao_id)
      .eq('user_id', user_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar sessão:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar sessão' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sessao: data
    })

  } catch (error) {
    console.error('Erro na API de sessões:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Deletar sessão
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessao_id = searchParams.get('sessao_id')
    const user_id = searchParams.get('user_id')

    if (!sessao_id || !user_id) {
      return NextResponse.json(
        { error: 'sessao_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('sessoes_modo_med')
      .delete()
      .eq('id', sessao_id)
      .eq('user_id', user_id)

    if (error) {
      console.error('Erro ao deletar sessão:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar sessão' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Sessão deletada'
    })

  } catch (error) {
    console.error('Erro na API de sessões:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
