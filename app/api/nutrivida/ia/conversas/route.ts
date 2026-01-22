import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =====================================================
// GET - Listar conversas ou buscar conversa especifica
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const conversaId = searchParams.get('conversaId')

    if (!userId) {
      return NextResponse.json({ error: 'userId e obrigatorio' }, { status: 400 })
    }

    // Se tem conversaId, buscar mensagens da conversa
    if (conversaId) {
      const { data: conversa, error } = await supabase
        .from('chat_ia_nutri')
        .select('id, titulo, mensagens, created_at, updated_at')
        .eq('id', conversaId)
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Erro ao buscar conversa:', error)
        return NextResponse.json({ error: 'Conversa nao encontrada' }, { status: 404 })
      }

      return NextResponse.json({
        conversa: {
          id: conversa.id,
          titulo: conversa.titulo,
          created_at: conversa.created_at,
          updated_at: conversa.updated_at
        },
        mensagens: conversa.mensagens || []
      })
    }

    // Listar todas as conversas do usuario
    const { data: conversas, error } = await supabase
      .from('chat_ia_nutri')
      .select('id, titulo, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erro ao listar conversas:', error)
      return NextResponse.json({ error: 'Erro ao listar conversas' }, { status: 500 })
    }

    return NextResponse.json({ conversas: conversas || [] })
  } catch (error) {
    console.error('Erro na API de conversas:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisicao' },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE - Deletar uma conversa
// =====================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const conversaId = searchParams.get('conversaId')

    if (!userId || !conversaId) {
      return NextResponse.json(
        { error: 'userId e conversaId sao obrigatorios' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('chat_ia_nutri')
      .delete()
      .eq('id', conversaId)
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao deletar conversa:', error)
      return NextResponse.json({ error: 'Erro ao deletar conversa' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de conversas:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisicao' },
      { status: 500 }
    )
  }
}

// =====================================================
// PUT - Atualizar titulo da conversa
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const { userId, conversaId, titulo } = await request.json()

    if (!userId || !conversaId) {
      return NextResponse.json(
        { error: 'userId e conversaId sao obrigatorios' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('chat_ia_nutri')
      .update({ titulo, updated_at: new Date().toISOString() })
      .eq('id', conversaId)
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao atualizar conversa:', error)
      return NextResponse.json({ error: 'Erro ao atualizar conversa' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de conversas:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisicao' },
      { status: 500 }
    )
  }
}
