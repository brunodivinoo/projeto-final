import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Buscar questão específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const { data: questao, error } = await supabase
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
      const { data: resposta } = await supabase
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
