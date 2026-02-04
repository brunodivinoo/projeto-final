import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// supabase - usar getSupabaseAdmin() dentro das funções

// POST - Registrar erro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, errorType, errorMessage, errorStack, componentStack, pagina, url, userAgent, metadata } = body

    if (!errorType || !errorMessage) {
      return NextResponse.json(
        { error: 'errorType e errorMessage são obrigatórios' },
        { status: 400 }
      )
    }

    const { error } = await getSupabaseAdmin()
      .from('error_logs_med')
      .insert({
        user_id: userId || null,
        error_type: errorType,
        error_message: errorMessage,
        error_stack: errorStack || null,
        component_stack: componentStack || null,
        pagina: pagina || null,
        url: url || null,
        user_agent: userAgent || null,
        metadata: metadata || null
      })

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao registrar erro:', error)
    return NextResponse.json(
      { error: 'Erro ao registrar' },
      { status: 500 }
    )
  }
}

// GET - Listar erros (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const errorType = searchParams.get('errorType')
    const periodo = searchParams.get('periodo') // hoje, semana, mes

    let query = getSupabaseAdmin()
      .from('error_logs_med')
      .select(`
        *,
        usuario:profiles_med!user_id(id, nome, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (errorType) {
      query = query.eq('error_type', errorType)
    }

    if (periodo) {
      const agora = new Date()
      let dataInicio: Date

      switch (periodo) {
        case 'hoje':
          dataInicio = new Date(agora.setHours(0, 0, 0, 0))
          break
        case 'semana':
          dataInicio = new Date(agora.setDate(agora.getDate() - 7))
          break
        case 'mes':
          dataInicio = new Date(agora.setMonth(agora.getMonth() - 1))
          break
        default:
          dataInicio = new Date(agora.setDate(agora.getDate() - 7))
      }

      query = query.gte('created_at', dataInicio.toISOString())
    }

    const { data: errors, error, count } = await query

    if (error) throw error

    // Agrupar por tipo
    const porTipo: Record<string, number> = {}
    errors?.forEach(e => {
      porTipo[e.error_type] = (porTipo[e.error_type] || 0) + 1
    })

    return NextResponse.json({
      errors,
      total: count,
      porTipo
    })

  } catch (error) {
    console.error('Erro ao buscar erros:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar erros' },
      { status: 500 }
    )
  }
}
