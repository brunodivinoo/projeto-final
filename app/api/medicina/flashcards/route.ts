import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Listar flashcards do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const paraRevisar = searchParams.get('paraRevisar') === 'true'
    const disciplinaId = searchParams.get('disciplinaId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('flashcards_med')
      .select(`
        *,
        disciplina:disciplinas_med(id, nome),
        assunto:assuntos_med(id, nome)
      `, { count: 'exact' })
      .eq('user_id', userId)

    if (paraRevisar) {
      const hoje = new Date().toISOString().split('T')[0]
      query = query.lte('proxima_revisao', hoje)
    }

    if (disciplinaId) {
      query = query.eq('disciplina_id', disciplinaId)
    }

    query = query
      .order('proxima_revisao', { ascending: true })
      .limit(limit)

    const { data: flashcards, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      flashcards: flashcards || [],
      total: count || 0
    })

  } catch (error) {
    console.error('Erro ao buscar flashcards:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar flashcards' },
      { status: 500 }
    )
  }
}

// POST - Criar flashcard
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, frente, verso, disciplinaId, assuntoId, teoriaId, geradoPorIA } = body

    if (!userId || !frente || !verso) {
      return NextResponse.json(
        { error: 'userId, frente e verso são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar limite
    const { count } = await supabase
      .from('flashcards_med')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    const { data: profile } = await supabase
      .from('profiles_med')
      .select('plano')
      .eq('id', userId)
      .single()

    const plano = profile?.plano || 'gratuito'
    const limites: Record<string, number> = {
      gratuito: 50,
      premium: 500,
      residencia: -1
    }

    const limite = limites[plano]
    if (limite !== -1 && (count || 0) >= limite) {
      return NextResponse.json(
        { error: 'Limite de flashcards atingido' },
        { status: 403 }
      )
    }

    const { data: flashcard, error } = await supabase
      .from('flashcards_med')
      .insert({
        user_id: userId,
        frente,
        verso,
        disciplina_id: disciplinaId || null,
        assunto_id: assuntoId || null,
        teoria_id: teoriaId || null,
        gerado_por_ia: geradoPorIA || false,
        proxima_revisao: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ flashcard })

  } catch (error) {
    console.error('Erro ao criar flashcard:', error)
    return NextResponse.json(
      { error: 'Erro ao criar flashcard' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar flashcard (após revisão - algoritmo SM-2)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, qualidade } = body // qualidade: 0-5 (0-2 errou, 3-5 acertou)

    if (!id || !userId || qualidade === undefined) {
      return NextResponse.json(
        { error: 'id, userId e qualidade são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar flashcard atual
    const { data: flashcard, error: fetchError } = await supabase
      .from('flashcards_med')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !flashcard) {
      return NextResponse.json(
        { error: 'Flashcard não encontrado' },
        { status: 404 }
      )
    }

    // Algoritmo SM-2
    let { repeticoes, fator_facilidade, intervalo } = flashcard
    fator_facilidade = parseFloat(fator_facilidade) || 2.5

    if (qualidade < 3) {
      // Errou - resetar
      repeticoes = 0
      intervalo = 1
    } else {
      // Acertou
      if (repeticoes === 0) {
        intervalo = 1
      } else if (repeticoes === 1) {
        intervalo = 6
      } else {
        intervalo = Math.round(intervalo * fator_facilidade)
      }
      repeticoes++

      // Atualizar fator de facilidade
      fator_facilidade = fator_facilidade + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02))
      if (fator_facilidade < 1.3) fator_facilidade = 1.3
    }

    // Calcular próxima revisão
    const proximaRevisao = new Date()
    proximaRevisao.setDate(proximaRevisao.getDate() + intervalo)

    const { data: updated, error } = await supabase
      .from('flashcards_med')
      .update({
        repeticoes,
        fator_facilidade,
        intervalo,
        proxima_revisao: proximaRevisao.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ flashcard: updated })

  } catch (error) {
    console.error('Erro ao atualizar flashcard:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar flashcard' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir flashcard
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
      .from('flashcards_med')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao excluir flashcard:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir flashcard' },
      { status: 500 }
    )
  }
}
