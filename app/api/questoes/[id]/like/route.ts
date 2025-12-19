import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Dar like/dislike em um comentário
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { comentario_id, tipo } = body // tipo: 'like' ou 'dislike'

    if (!comentario_id || !tipo || !['like', 'dislike'].includes(tipo)) {
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

    // Verificar se já existe um like/dislike do usuário
    const { data: existingLike } = await supabase
      .from('questoes_comentarios_likes')
      .select('id, tipo')
      .eq('comentario_id', comentario_id)
      .eq('user_id', user.id)
      .single()

    let action = ''

    if (existingLike) {
      if (existingLike.tipo === tipo) {
        // Remover like/dislike (toggle off)
        await supabase
          .from('questoes_comentarios_likes')
          .delete()
          .eq('id', existingLike.id)

        // Atualizar contador - buscar valor atual e decrementar
        const field = tipo === 'like' ? 'likes_count' : 'dislikes_count'
        const { data: comentarioAtual } = await supabase
          .from('questoes_comentarios')
          .select(field)
          .eq('id', comentario_id)
          .single()

        if (comentarioAtual) {
          const currentCount = (comentarioAtual as Record<string, number>)[field] || 0
          await supabase
            .from('questoes_comentarios')
            .update({ [field]: Math.max(0, currentCount - 1) })
            .eq('id', comentario_id)
        }

        action = 'removed'
      } else {
        // Trocar like por dislike ou vice-versa
        await supabase
          .from('questoes_comentarios_likes')
          .update({ tipo })
          .eq('id', existingLike.id)

        // Atualizar contadores
        const oldField = existingLike.tipo === 'like' ? 'likes_count' : 'dislikes_count'
        const newField = tipo === 'like' ? 'likes_count' : 'dislikes_count'

        const { data: comentario } = await supabase
          .from('questoes_comentarios')
          .select('likes_count, dislikes_count')
          .eq('id', comentario_id)
          .single()

        if (comentario) {
          await supabase
            .from('questoes_comentarios')
            .update({
              [oldField]: Math.max(0, (comentario[oldField as keyof typeof comentario] as number || 0) - 1),
              [newField]: ((comentario[newField as keyof typeof comentario] as number) || 0) + 1
            })
            .eq('id', comentario_id)
        }

        action = 'changed'
      }
    } else {
      // Criar novo like/dislike
      await supabase
        .from('questoes_comentarios_likes')
        .insert({
          comentario_id,
          user_id: user.id,
          tipo
        })

      // Atualizar contador
      const field = tipo === 'like' ? 'likes_count' : 'dislikes_count'
      const { data: comentario } = await supabase
        .from('questoes_comentarios')
        .select(field)
        .eq('id', comentario_id)
        .single()

      if (comentario) {
        await supabase
          .from('questoes_comentarios')
          .update({ [field]: ((comentario as Record<string, number>)[field] || 0) + 1 })
          .eq('id', comentario_id)
      }

      action = 'added'
    }

    // Buscar contadores atualizados
    const { data: updatedComentario } = await supabase
      .from('questoes_comentarios')
      .select('likes_count, dislikes_count')
      .eq('id', comentario_id)
      .single()

    return NextResponse.json({
      success: true,
      action,
      likes_count: updatedComentario?.likes_count || 0,
      dislikes_count: updatedComentario?.dislikes_count || 0,
      userLike: action === 'removed' ? null : tipo
    })
  } catch (error) {
    console.error('Erro ao processar like:', error)
    return NextResponse.json({ error: 'Erro ao processar like' }, { status: 500 })
  }
}
