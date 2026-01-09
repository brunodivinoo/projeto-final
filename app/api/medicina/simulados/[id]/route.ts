import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Buscar simulado específico com questões
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar simulado
    const { data: simulado, error: simuladoError } = await supabase
      .from('simulados_med')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (simuladoError || !simulado) {
      return NextResponse.json(
        { error: 'Simulado não encontrado' },
        { status: 404 }
      )
    }

    // Buscar respostas do simulado
    const { data: respostas } = await supabase
      .from('simulado_respostas_med')
      .select('*')
      .eq('simulado_id', id)
      .order('ordem')

    // Buscar questões
    const { data: questoes } = await supabase
      .from('questoes_med')
      .select(`
        *,
        disciplina:disciplinas_med(id, nome),
        assunto:assuntos_med(id, nome)
      `)
      .in('id', simulado.questoes_ids)

    // Ordenar questões conforme ordem do simulado
    const questoesOrdenadas = simulado.questoes_ids.map((qId: string) =>
      questoes?.find(q => q.id === qId)
    ).filter(Boolean)

    // Combinar questões com respostas
    const questoesComRespostas = questoesOrdenadas.map((questao: any) => {
      const resposta = respostas?.find(r => r.questao_id === questao.id)
      return {
        ...questao,
        resposta_usuario: resposta?.resposta || null,
        acertou: resposta?.acertou ?? null,
        tempo_questao: resposta?.tempo_segundos || 0
      }
    })

    return NextResponse.json({
      simulado,
      questoes: questoesComRespostas
    })

  } catch (error) {
    console.error('Erro ao buscar simulado:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar simulado' },
      { status: 500 }
    )
  }
}

// POST - Registrar resposta de uma questão do simulado
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, questaoId, resposta, tempoSegundos } = body

    if (!userId || !questaoId || !resposta) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Verificar se o simulado pertence ao usuário
    const { data: simulado } = await supabase
      .from('simulados_med')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!simulado) {
      return NextResponse.json(
        { error: 'Simulado não encontrado' },
        { status: 404 }
      )
    }

    if (simulado.status === 'finalizado') {
      return NextResponse.json(
        { error: 'Simulado já finalizado' },
        { status: 400 }
      )
    }

    // Buscar gabarito
    const { data: questao } = await supabase
      .from('questoes_med')
      .select('gabarito')
      .eq('id', questaoId)
      .single()

    if (!questao) {
      return NextResponse.json(
        { error: 'Questão não encontrada' },
        { status: 404 }
      )
    }

    const acertou = questao.gabarito === resposta

    // Atualizar resposta
    const { error: updateError } = await supabase
      .from('simulado_respostas_med')
      .update({
        resposta,
        acertou,
        tempo_segundos: tempoSegundos || null
      })
      .eq('simulado_id', id)
      .eq('questao_id', questaoId)

    if (updateError) throw updateError

    return NextResponse.json({
      acertou,
      gabaritoCorreto: questao.gabarito
    })

  } catch (error) {
    console.error('Erro ao registrar resposta:', error)
    return NextResponse.json(
      { error: 'Erro ao registrar resposta' },
      { status: 500 }
    )
  }
}
