import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Listar tópicos do fórum
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const disciplinaId = searchParams.get('disciplinaId')
    const busca = searchParams.get('busca')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('forum_topicos_med')
      .select(`
        *,
        autor:profiles_med!forum_topicos_med_user_id_fkey(id, nome, plano),
        disciplina:disciplinas_med(id, nome)
      `, { count: 'exact' })

    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    if (disciplinaId) {
      query = query.eq('disciplina_id', disciplinaId)
    }

    if (busca) {
      query = query.or(`titulo.ilike.%${busca}%,conteudo.ilike.%${busca}%`)
    }

    query = query
      .order('fixado', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: topicos, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      topicos: topicos || [],
      total: count || 0
    })

  } catch (error) {
    console.error('Erro ao buscar tópicos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar tópicos' },
      { status: 500 }
    )
  }
}

// POST - Criar novo tópico
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, titulo, conteudo, disciplinaId, categoria, questaoId, teoriaId } = body

    if (!userId || !titulo || !conteudo) {
      return NextResponse.json(
        { error: 'userId, titulo e conteudo são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: topico, error } = await supabase
      .from('forum_topicos_med')
      .insert({
        user_id: userId,
        titulo,
        conteudo,
        disciplina_id: disciplinaId || null,
        categoria: categoria || 'discussao',
        questao_id: questaoId || null,
        teoria_id: teoriaId || null
      })
      .select(`
        *,
        autor:profiles_med!forum_topicos_med_user_id_fkey(id, nome, plano),
        disciplina:disciplinas_med(id, nome)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ topico })

  } catch (error) {
    console.error('Erro ao criar tópico:', error)
    return NextResponse.json(
      { error: 'Erro ao criar tópico' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar tópico
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, titulo, conteudo, resolvido } = body

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id e userId são obrigatórios' },
        { status: 400 }
      )
    }

    const updateData: Record<string, string | boolean> = {
      updated_at: new Date().toISOString()
    }

    if (titulo !== undefined) updateData.titulo = titulo
    if (conteudo !== undefined) updateData.conteudo = conteudo
    if (resolvido !== undefined) updateData.resolvido = resolvido

    const { data: topico, error } = await supabase
      .from('forum_topicos_med')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ topico })

  } catch (error) {
    console.error('Erro ao atualizar tópico:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar tópico' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir tópico
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id e userId são obrigatórios' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('forum_topicos_med')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao excluir tópico:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir tópico' },
      { status: 500 }
    )
  }
}
