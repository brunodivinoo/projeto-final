import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar questões do usuário com filtros
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const disciplina = searchParams.get('disciplina')
    const assunto = searchParams.get('assunto')
    const subassunto = searchParams.get('subassunto')
    const banca = searchParams.get('banca')
    const dificuldade = searchParams.get('dificuldade')
    const modalidade = searchParams.get('modalidade')
    const respondida = searchParams.get('respondida')
    const acertou = searchParams.get('acertou')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    let query = supabase
      .from('questoes_ia_geradas')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (disciplina) query = query.eq('disciplina', disciplina)
    if (assunto) query = query.eq('assunto', assunto)
    if (subassunto) query = query.eq('subassunto', subassunto)
    if (banca) query = query.eq('banca', banca)
    if (dificuldade) query = query.eq('dificuldade', dificuldade)
    if (modalidade) query = query.eq('modalidade', modalidade)
    if (respondida === 'true') query = query.eq('respondida', true)
    if (respondida === 'false') query = query.eq('respondida', false)
    if (acertou === 'true') query = query.eq('acertou', true)
    if (acertou === 'false') query = query.eq('acertou', false)

    // Paginação
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar questões:', error)
      return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
    }

    return NextResponse.json({
      questoes: data || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Responder uma questão
export async function POST(req: NextRequest) {
  try {
    const { questao_id, user_id, resposta, tempo_resposta } = await req.json()

    if (!questao_id || !user_id || !resposta) {
      return NextResponse.json({ error: 'questao_id, user_id e resposta são obrigatórios' }, { status: 400 })
    }

    // Buscar a questão
    const { data: questao, error: fetchError } = await supabase
      .from('questoes_ia_geradas')
      .select('gabarito')
      .eq('id', questao_id)
      .eq('user_id', user_id)
      .single()

    if (fetchError || !questao) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    const acertou = resposta.toUpperCase() === questao.gabarito.toUpperCase()

    // Atualizar a questão
    const { error: updateError } = await supabase
      .from('questoes_ia_geradas')
      .update({
        respondida: true,
        resposta_usuario: resposta.toUpperCase(),
        acertou,
        tempo_resposta: tempo_resposta || null
      })
      .eq('id', questao_id)

    if (updateError) {
      console.error('Erro ao atualizar questão:', updateError)
      return NextResponse.json({ error: 'Erro ao registrar resposta' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      acertou,
      gabarito: questao.gabarito
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Deletar questão
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const questao_id = searchParams.get('questao_id')
    const user_id = searchParams.get('user_id')

    if (!questao_id || !user_id) {
      return NextResponse.json({ error: 'questao_id e user_id são obrigatórios' }, { status: 400 })
    }

    const { error } = await supabase
      .from('questoes_ia_geradas')
      .delete()
      .eq('id', questao_id)
      .eq('user_id', user_id)

    if (error) {
      console.error('Erro ao deletar questão:', error)
      return NextResponse.json({ error: 'Erro ao deletar questão' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
