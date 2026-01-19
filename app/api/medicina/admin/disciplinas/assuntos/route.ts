import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { isAdmin } from '@/lib/admin/auth'

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(req.url)
    const disciplina_id = searchParams.get('disciplina_id')

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Montar query
    let query = supabase
      .from('assuntos_med')
      .select('id, nome, disciplina_id, parent_id, ordem')
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true })

    if (disciplina_id) {
      query = query.eq('disciplina_id', disciplina_id)
    }

    const { data: assuntos, error } = await query

    if (error) throw error

    // Buscar subassuntos se houver assuntos
    let subassuntos: Array<{ id: string; nome: string; assunto_id: string }> = []
    if (assuntos && assuntos.length > 0) {
      const assuntosIds = assuntos.map(a => a.id)
      const { data: subs } = await supabase
        .from('subassuntos_med')
        .select('id, nome, assunto_id')
        .in('assunto_id', assuntosIds)
        .order('ordem', { ascending: true })

      subassuntos = subs || []
    }

    return NextResponse.json({
      success: true,
      assuntos: assuntos || [],
      subassuntos
    })

  } catch (error) {
    console.error('Erro ao buscar assuntos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar assuntos' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const { nome, disciplina_id, parent_id } = body

    if (!nome || !disciplina_id) {
      return NextResponse.json({ error: 'Nome e disciplina_id são obrigatórios' }, { status: 400 })
    }

    // Criar assunto
    const { data: assunto, error } = await supabase
      .from('assuntos_med')
      .insert({
        nome,
        nome_normalizado: nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        disciplina_id,
        parent_id: parent_id || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      assunto
    })

  } catch (error) {
    console.error('Erro ao criar assunto:', error)
    return NextResponse.json(
      { error: 'Erro ao criar assunto' },
      { status: 500 }
    )
  }
}
