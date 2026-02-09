import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cachedResponse } from '@/lib/api-cache'

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

    // Buscar simulado primeiro (precisamos dos questoes_ids)
    const { data: simulado, error: simuladoError } = await supabase
      .from('simulados_med')
      .select('id, nome, tipo, status, questoes_ids, total_questoes, questoes_respondidas, acertos, tempo_limite_minutos, tempo_gasto_segundos, nota, data_inicio, finalizado_em, created_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (simuladoError || !simulado) {
      return NextResponse.json(
        { error: 'Simulado não encontrado' },
        { status: 404 }
      )
    }

    // Buscar respostas E questoes em PARALELO (ambas dependem só do id/questoes_ids)
    const [{ data: respostas }, { data: questoes }] = await Promise.all([
      supabase
        .from('simulado_respostas_med')
        .select('questao_id, resposta, acertou, tempo_segundos, ordem')
        .eq('simulado_id', id)
        .order('ordem'),
      supabase
        .from('questoes_med')
        .select(`
          id, enunciado, alternativas, gabarito, explicacao, dificuldade, ano, banca, periodo_dificuldade,
          disciplina:disciplinas_med(id, nome),
          assunto:assuntos_med(id, nome)
        `)
        .in('id', simulado.questoes_ids)
    ])

    // Ordenar questões conforme ordem do simulado
    const questoesOrdenadas = simulado.questoes_ids.map((qId: string) =>
      questoes?.find(q => q.id === qId)
    ).filter(Boolean)

    // Combinar questões com respostas
    const questoesComRespostas = questoesOrdenadas.map((questao: { id: string }) => {
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

    // Buscar simulado + gabarito em PARALELO
    const [{ data: simulado }, { data: questao }] = await Promise.all([
      supabase
        .from('simulados_med')
        .select('id, status')
        .eq('id', id)
        .eq('user_id', userId)
        .single(),
      supabase
        .from('questoes_med')
        .select('gabarito')
        .eq('id', questaoId)
        .single()
    ])

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
