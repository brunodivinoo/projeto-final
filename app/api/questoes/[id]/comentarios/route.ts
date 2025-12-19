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

    // Buscar comentários (sem JOIN - buscar profiles separadamente)
    const { data: comentarios, error } = await supabase
      .from('questoes_comentarios')
      .select('id, conteudo, parent_id, likes_count, dislikes_count, created_at, user_id')
      .eq('questao_id', questaoId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Buscar profiles dos usuários que comentaram
    const userIds = [...new Set(comentarios?.map(c => c.user_id) || [])]
    const profilesMap: Record<string, { nome: string; avatar_url: string | null }> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url')
        .in('id', userIds)

      profiles?.forEach(p => {
        profilesMap[p.id] = { nome: p.nome || 'Usuário', avatar_url: p.avatar_url }
      })
    }

    // Adicionar dados do profile a cada comentário
    const comentariosComProfile = comentarios?.map(c => ({
      ...c,
      profiles: profilesMap[c.user_id] || { nome: 'Usuário', avatar_url: null }
    })) || []

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
    const rootComentarios: typeof comentariosComProfile = []

    comentariosComProfile.forEach(c => {
      const userLike = userLikes.find(l => l.comentario_id === c.id)
      comentariosMap.set(c.id, {
        ...c,
        respostas: [],
        userLike: userLike?.tipo || null
      })
    })

    comentariosComProfile.forEach(c => {
      const comentario = comentariosMap.get(c.id)
      if (c.parent_id && comentariosMap.has(c.parent_id)) {
        comentariosMap.get(c.parent_id).respostas.push(comentario)
      } else if (!c.parent_id) {
        rootComentarios.push(comentario)
      }
    })

    return NextResponse.json({
      comentarios: rootComentarios,
      total: comentariosComProfile.length
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

    // Validar conteudo
    if (!conteudo || conteudo.trim().length === 0) {
      return NextResponse.json({ error: 'Conteúdo do comentário é obrigatório' }, { status: 400 })
    }

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Criar comentário primeiro (sem join)
    const { data: inserted, error: insertError } = await supabase
      .from('questoes_comentarios')
      .insert({
        questao_id: questaoId,
        user_id: user.id,
        conteudo: conteudo.trim(),
        parent_id: parent_id || null,
        likes_count: 0,
        dislikes_count: 0
      })
      .select('id, conteudo, parent_id, likes_count, dislikes_count, created_at, user_id')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Erro ao criar comentário: ' + insertError.message }, { status: 500 })
    }

    // Buscar dados do profile separadamente
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, avatar_url')
      .eq('id', user.id)
      .single()

    const comentario = {
      ...inserted,
      profiles: profile || { nome: 'Usuário', avatar_url: null },
      respostas: [],
      userLike: null
    }

    return NextResponse.json({ comentario })
  } catch (error) {
    console.error('Erro ao criar comentário:', error)
    return NextResponse.json({ error: 'Erro interno ao criar comentário' }, { status: 500 })
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

// PATCH - Editar comentário
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { comentario_id, conteudo } = body

    if (!comentario_id || !conteudo || conteudo.trim().length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
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
      .eq('id', comentario_id)
      .single()

    if (!comentario || comentario.user_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado a editar este comentário' }, { status: 403 })
    }

    // Atualizar comentário
    const { data, error } = await supabase
      .from('questoes_comentarios')
      .update({ conteudo: conteudo.trim() })
      .eq('id', comentario_id)
      .select('id, conteudo')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, comentario: data })
  } catch (error) {
    console.error('Erro ao editar comentário:', error)
    return NextResponse.json({ error: 'Erro ao editar comentário' }, { status: 500 })
  }
}
