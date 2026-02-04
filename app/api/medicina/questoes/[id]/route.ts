import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'



// GET - Buscar questão específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const { data: questao, error } = await getSupabaseAdmin()
      .from('questoes_med')
      .select(`
        *,
        disciplina:disciplinas_med(id, nome),
        assunto:assuntos_med(id, nome),
        subassunto:subassuntos_med(id, nome),
        teoria:teorias_med(id, titulo)
      `)
      .eq('id', id)
      .single()

    if (error || !questao) {
      return NextResponse.json(
        { error: 'Questão não encontrada' },
        { status: 404 }
      )
    }

    // Se tiver userId, buscar se já respondeu
    let respostaUsuario = null
    if (userId) {
      const { data: resposta } = await getSupabaseAdmin()
        .from('respostas_med')
        .select('*')
        .eq('user_id', userId)
        .eq('questao_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      respostaUsuario = resposta
    }

    return NextResponse.json({
      questao,
      respostaUsuario
    })

  } catch (error) {
    console.error('Erro ao buscar questão:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar questão' },
      { status: 500 }
    )
  }
}
