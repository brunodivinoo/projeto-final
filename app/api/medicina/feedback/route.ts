import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// supabase - usar getSupabaseAdmin() dentro das funções

// POST - Criar feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, tipo, titulo, descricao, pagina, userAgent } = body

    if (!tipo || !titulo || !descricao) {
      return NextResponse.json(
        { error: 'tipo, titulo e descricao são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: feedback, error } = await getSupabaseAdmin()
      .from('feedback_med')
      .insert({
        user_id: userId || null,
        tipo,
        titulo,
        descricao,
        pagina: pagina || null,
        user_agent: userAgent || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ feedback, success: true })

  } catch (error) {
    console.error('Erro ao criar feedback:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar feedback' },
      { status: 500 }
    )
  }
}

// GET - Listar feedbacks (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tipo = searchParams.get('tipo')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = getSupabaseAdmin()
      .from('feedback_med')
      .select(`
        *,
        usuario:profiles_med!user_id(id, nome, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    const { data: feedbacks, error, count } = await query

    if (error) throw error

    return NextResponse.json({ feedbacks, total: count })

  } catch (error) {
    console.error('Erro ao buscar feedbacks:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar feedbacks' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar feedback (admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, prioridade, respostaAdmin, respondidoPor } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id é obrigatório' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (prioridade) updateData.prioridade = prioridade
    if (respostaAdmin !== undefined) updateData.resposta_admin = respostaAdmin
    if (respondidoPor) updateData.respondido_por = respondidoPor

    const { data: feedback, error } = await getSupabaseAdmin()
      .from('feedback_med')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ feedback })

  } catch (error) {
    console.error('Erro ao atualizar feedback:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar feedback' },
      { status: 500 }
    )
  }
}
