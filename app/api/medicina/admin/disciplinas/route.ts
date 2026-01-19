import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/admin/auth'

export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar disciplinas
    const { data: disciplinas, error } = await supabase
      .from('disciplinas_med')
      .select('id, nome, icone, cor, ordem, ativo')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      disciplinas: disciplinas || []
    })

  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar disciplinas' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

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
    const { nome, icone, cor } = body

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Criar disciplina
    const { data: disciplina, error } = await supabase
      .from('disciplinas_med')
      .insert({
        nome,
        nome_normalizado: nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        icone: icone || 'book',
        cor: cor || '#3B82F6'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      disciplina
    })

  } catch (error) {
    console.error('Erro ao criar disciplina:', error)
    return NextResponse.json(
      { error: 'Erro ao criar disciplina' },
      { status: 500 }
    )
  }
}
