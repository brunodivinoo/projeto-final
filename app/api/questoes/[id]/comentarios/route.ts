import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar comentários de uma questão
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questaoId } = await params

    // Buscar comentários com dados do usuário
    const { data: comentarios, error } = await supabase
      .from('questoes_comentarios')
      .select(`
        id,
        conteudo,
        parent_id,
        likes_count,
        dislikes_count,
        created_at,
        user_id,
        profiles:user_id (
          nome,
          avatar_url
        )
      `)
      .eq('questao_id', questaoId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Buscar likes do usuário atual (se logado)
    const authHeader = request.headers.get('authorization')
    let userLikes: { comentario_id: string; tipo: string }[] = []

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)

      if (user) {
        const { data: likes } = await supabase
          .from('questoes_comentarios_likes')
          .select('comentario_id, tipo')
          .eq('user_id', user.id)

        userLikes = likes || []
      }
    }

    // Organizar comentários em árvore (pais e filhos)
    const comentariosMap = new Map()
    const rootComentarios: typeof comentarios = []

    comentarios?.forEach(c => {
      const userLike = userLikes.find(l => l.comentario_id === c.id)
      comentariosMap.set(c.id, {
        ...c,
        respostas: [],
        userLike: userLike?.tipo || null
      })
    })

    comentarios?.forEach(c => {
      const comentario = comentariosMap.get(c.id)
      if (c.parent_id && comentariosMap.has(c.parent_id)) {
        comentariosMap.get(c.parent_id).respostas.push(comentario)
      } else if (!c.parent_id) {
        rootComentarios.push(comentario)
      }
    })

    return NextResponse.json({
      comentarios: rootComentarios,
      total: comentarios?.length || 0
    })
  } catch (error) {
    console.error('Erro ao buscar comentários:', error)
    return NextResponse.json({ error: 'Erro ao buscar comentários' }, { status: 500 })
  }
}

// POST - Criar novo comentário
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questaoId } = await params
    const body = await request.json()
    const { conteudo, parent_id } = body

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Criar comentário
    const { data, error } = await supabase
      .from('questoes_comentarios')
      .insert({
        questao_id: questaoId,
        user_id: user.id,
        conteudo,
        parent_id: parent_id || null
      })
      .select(`
        id,
        conteudo,
        parent_id,
        likes_count,
        dislikes_count,
        created_at,
        user_id,
        profiles:user_id (
          nome,
          avatar_url
        )
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ comentario: { ...data, respostas: [], userLike: null } })
  } catch (error) {
    console.error('Erro ao criar comentário:', error)
    return NextResponse.json({ error: 'Erro ao criar comentário' }, { status: 500 })
  }
}

// DELETE - Excluir comentário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const comentarioId = searchParams.get('comentario_id')

    if (!comentarioId) {
      return NextResponse.json({ error: 'ID do comentário não fornecido' }, { status: 400 })
    }

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o comentário pertence ao usuário
    const { data: comentario } = await supabase
      .from('questoes_comentarios')
      .select('user_id')
      .eq('id', comentarioId)
      .single()

    if (!comentario || comentario.user_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado a excluir este comentário' }, { status: 403 })
    }

    // Excluir comentário
    const { error } = await supabase
      .from('questoes_comentarios')
      .delete()
      .eq('id', comentarioId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir comentário:', error)
    return NextResponse.json({ error: 'Erro ao excluir comentário' }, { status: 500 })
  }
}
