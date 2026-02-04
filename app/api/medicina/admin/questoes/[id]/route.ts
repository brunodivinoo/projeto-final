import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'



// GET - Buscar uma questão específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: questao, error } = await getSupabaseAdmin()
      .from('questoes_med')
      .select(`
        id,
        enunciado,
        alternativas,
        gabarito,
        banca,
        ano,
        instituicao,
        prova,
        dificuldade,
        periodo_dificuldade,
        total_respostas,
        total_acertos,
        comentario_ia,
        explicacao,
        tags,
        tipo_questao,
        created_at,
        disciplina:disciplinas_med(id, nome),
        assunto:assuntos_med(id, nome),
        subassunto:subassuntos_med(id, nome)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ questao })

  } catch (error) {
    console.error('Erro ao buscar questão:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar questão' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir uma questão
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await getSupabaseAdmin()
      .from('questoes_med')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao excluir questão:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir questão' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar uma questão
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { data: questao, error } = await getSupabaseAdmin()
      .from('questoes_med')
      .update({
        enunciado: body.enunciado,
        alternativas: body.alternativas,
        gabarito: body.gabarito,
        explicacao: body.explicacao,
        comentario_ia: body.comentario_ia,
        dificuldade: body.dificuldade,
        periodo_dificuldade: body.periodo_dificuldade,
        tags: body.tags,
        tipo_questao: body.tipo_questao,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ questao })

  } catch (error) {
    console.error('Erro ao atualizar questão:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar questão' },
      { status: 500 }
    )
  }
}
