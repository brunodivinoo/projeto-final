import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Listar anotações do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const pasta = searchParams.get('pasta')
    const busca = searchParams.get('busca')
    const favoritos = searchParams.get('favoritos') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('anotacoes_med')
      .select(`
        *,
        teoria:teorias_med(id, titulo),
        questao:questoes_med(id, enunciado)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (pasta) {
      query = query.eq('pasta', pasta)
    }

    if (favoritos) {
      query = query.eq('favorito', true)
    }

    if (busca) {
      query = query.or(`titulo.ilike.%${busca}%,conteudo.ilike.%${busca}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: anotacoes, error, count } = await query

    if (error) throw error

    // Buscar pastas distintas
    const { data: pastasData } = await supabase
      .from('anotacoes_med')
      .select('pasta')
      .eq('user_id', userId)
      .not('pasta', 'is', null)

    const pastas = [...new Set(pastasData?.map(p => p.pasta).filter(Boolean))]

    return NextResponse.json({
      anotacoes: anotacoes || [],
      pastas,
      total: count || 0
    })

  } catch (error) {
    console.error('Erro ao buscar anotações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar anotações' },
      { status: 500 }
    )
  }
}

// POST - Criar anotação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, titulo, conteudo, teoriaId, questaoId, artigoId, tags, pasta, favorito, destaques } = body

    if (!userId || !titulo || !conteudo) {
      return NextResponse.json(
        { error: 'userId, titulo e conteudo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar limite de anotações
    const { count } = await supabase
      .from('anotacoes_med')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    // Buscar plano do usuário
    const { data: profile } = await supabase
      .from('profiles_med')
      .select('plano')
      .eq('id', userId)
      .single()

    const plano = profile?.plano || 'gratuito'
    const limites: Record<string, number> = {
      gratuito: 10,
      premium: 100,
      residencia: -1 // ilimitado
    }

    const limite = limites[plano]
    if (limite !== -1 && (count || 0) >= limite) {
      return NextResponse.json(
        { error: 'Limite de anotações atingido. Faça upgrade para continuar.' },
        { status: 403 }
      )
    }

    const { data: anotacao, error } = await supabase
      .from('anotacoes_med')
      .insert({
        user_id: userId,
        titulo,
        conteudo,
        teoria_id: teoriaId || null,
        questao_id: questaoId || null,
        artigo_id: artigoId || null,
        tags: tags || [],
        pasta: pasta || null,
        favorito: favorito || false,
        destaques: destaques || null
      })
      .select()
      .single()

    if (error) throw error

    // Atualizar contador no limites_uso
    const mesRef = new Date().toISOString().slice(0, 7)
    await supabase
      .from('limites_uso_med')
      .upsert({
        user_id: userId,
        mes_referencia: mesRef,
        anotacoes_total: (count || 0) + 1
      }, {
        onConflict: 'user_id,mes_referencia'
      })

    return NextResponse.json({ anotacao })

  } catch (error) {
    console.error('Erro ao criar anotação:', error)
    return NextResponse.json(
      { error: 'Erro ao criar anotação' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar anotação
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, titulo, conteudo, tags, pasta, favorito, destaques } = body

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id e userId são obrigatórios' },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (titulo !== undefined) updateData.titulo = titulo
    if (conteudo !== undefined) updateData.conteudo = conteudo
    if (tags !== undefined) updateData.tags = tags
    if (pasta !== undefined) updateData.pasta = pasta
    if (favorito !== undefined) updateData.favorito = favorito
    if (destaques !== undefined) updateData.destaques = destaques

    const { data: anotacao, error } = await supabase
      .from('anotacoes_med')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ anotacao })

  } catch (error) {
    console.error('Erro ao atualizar anotação:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar anotação' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir anotação
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
      .from('anotacoes_med')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao excluir anotação:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir anotação' },
      { status: 500 }
    )
  }
}
