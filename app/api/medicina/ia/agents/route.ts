// API Route - Gerenciamento de execucoes de Multi-Agentes

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// supabase - usar getSupabaseAdmin() dentro das funções

// ==========================================
// GET - Listar execucoes de agentes
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const execution_id = searchParams.get('execution_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id e obrigatorio' }, { status: 400 })
    }

    // Buscar execucao especifica
    if (execution_id) {
      const { data: execution, error } = await getSupabaseAdmin()
        .from('agent_executions_med')
        .select('*')
        .eq('id', execution_id)
        .eq('user_id', user_id)
        .single()

      if (error || !execution) {
        return NextResponse.json({ error: 'Execucao nao encontrada' }, { status: 404 })
      }

      return NextResponse.json({ execution })
    }

    // Listar execucoes
    let query = getSupabaseAdmin()
      .from('agent_executions_med')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: executions, error, count } = await query

    if (error) {
      console.error('[Agents API] Erro ao buscar execucoes:', error)
      return NextResponse.json({ error: 'Erro ao buscar execucoes' }, { status: 500 })
    }

    // Calcular estatisticas
    const { data: stats } = await getSupabaseAdmin()
      .from('agent_executions_med')
      .select('status, task_type, duration_ms, tokens_used')
      .eq('user_id', user_id)

    const estatisticas = {
      total: count || 0,
      porStatus: {
        pending: 0,
        running: 0,
        completed: 0,
        error: 0
      },
      porTipo: {} as Record<string, number>,
      tempoMedioMs: 0,
      tokensTotal: 0
    }

    if (stats) {
      let totalDuration = 0
      let completedCount = 0

      for (const s of stats) {
        // Contar por status
        if (s.status in estatisticas.porStatus) {
          estatisticas.porStatus[s.status as keyof typeof estatisticas.porStatus]++
        }

        // Contar por tipo
        if (s.task_type) {
          estatisticas.porTipo[s.task_type] = (estatisticas.porTipo[s.task_type] || 0) + 1
        }

        // Somar duracao (apenas completed)
        if (s.status === 'completed' && s.duration_ms) {
          totalDuration += s.duration_ms
          completedCount++
        }

        // Somar tokens
        estatisticas.tokensTotal += s.tokens_used || 0
      }

      estatisticas.tempoMedioMs = completedCount > 0 ? Math.round(totalDuration / completedCount) : 0
    }

    return NextResponse.json({
      executions,
      total: count,
      estatisticas
    })

  } catch (error) {
    console.error('[Agents API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ==========================================
// POST - Criar nova execucao
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      conversa_id,
      task_type,
      mensagem_original,
      parametros
    } = body

    if (!user_id || !task_type) {
      return NextResponse.json(
        { error: 'user_id e task_type sao obrigatorios' },
        { status: 400 }
      )
    }

    const { data: execution, error } = await getSupabaseAdmin()
      .from('agent_executions_med')
      .insert({
        user_id,
        conversa_id,
        task_type,
        mensagem_original,
        parametros,
        status: 'pending',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[Agents API] Erro ao criar execucao:', error)
      return NextResponse.json({ error: 'Erro ao criar execucao' }, { status: 500 })
    }

    return NextResponse.json({ execution })

  } catch (error) {
    console.error('[Agents API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ==========================================
// PATCH - Atualizar execucao
// ==========================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      execution_id,
      user_id,
      status,
      resultado,
      execution_log,
      error: errorMsg,
      tokens_used
    } = body

    if (!execution_id || !user_id) {
      return NextResponse.json(
        { error: 'execution_id e user_id sao obrigatorios' },
        { status: 400 }
      )
    }

    // Verificar se execucao existe e pertence ao usuario
    const { data: existing } = await getSupabaseAdmin()
      .from('agent_executions_med')
      .select('id, started_at')
      .eq('id', execution_id)
      .eq('user_id', user_id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Execucao nao encontrada' }, { status: 404 })
    }

    // Preparar update
    const updateData: Record<string, unknown> = {}

    if (status) {
      updateData.status = status
    }

    if (resultado) {
      updateData.resultado = resultado
    }

    if (execution_log) {
      updateData.execution_log = execution_log
    }

    if (errorMsg) {
      updateData.error = errorMsg
    }

    if (tokens_used !== undefined) {
      updateData.tokens_used = tokens_used
    }

    // Se status e completed ou error, calcular duracao
    if (status === 'completed' || status === 'error') {
      updateData.completed_at = new Date().toISOString()

      if (existing.started_at) {
        const startTime = new Date(existing.started_at).getTime()
        const endTime = Date.now()
        updateData.duration_ms = endTime - startTime
      }
    }

    const { data: execution, error } = await getSupabaseAdmin()
      .from('agent_executions_med')
      .update(updateData)
      .eq('id', execution_id)
      .select()
      .single()

    if (error) {
      console.error('[Agents API] Erro ao atualizar execucao:', error)
      return NextResponse.json({ error: 'Erro ao atualizar execucao' }, { status: 500 })
    }

    return NextResponse.json({ execution })

  } catch (error) {
    console.error('[Agents API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
