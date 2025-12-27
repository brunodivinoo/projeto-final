import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Iniciar simulado
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Verificar se o simulado pertence ao usuário e está pendente
    const { data: simulado, error: checkError } = await supabase
      .from('simulados')
      .select(`
        id,
        status,
        quantidade_questoes,
        tempo_limite_minutos,
        simulado_questoes(
          id,
          questao_id,
          ordem
        )
      `)
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (checkError || !simulado) {
      return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 })
    }

    if (simulado.status !== 'pendente') {
      if (simulado.status === 'em_andamento') {
        // Retornar o simulado em andamento
        return NextResponse.json({
          success: true,
          simulado,
          message: 'Simulado já em andamento'
        })
      }
      return NextResponse.json(
        { error: 'Este simulado não pode ser iniciado' },
        { status: 400 }
      )
    }

    // Buscar detalhes das questões
    const questaoIds = simulado.simulado_questoes.map((sq: { questao_id: string }) => sq.questao_id)

    const { data: questoesDetalhes, error: questoesError } = await supabase
      .from('questoes')
      .select('id, enunciado, alternativas, resposta_correta, disciplina, assunto, subassunto, dificuldade, modalidade')
      .in('id', questaoIds)

    if (questoesError) {
      console.error('[SIMULADOS] Erro ao buscar questões:', questoesError)
      return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
    }

    // Atualizar status para em_andamento
    const { data: simuladoAtualizado, error: updateError } = await supabase
      .from('simulados')
      .update({
        status: 'em_andamento',
        iniciado_em: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[SIMULADOS] Erro ao iniciar:', updateError)
      return NextResponse.json({ error: 'Erro ao iniciar simulado' }, { status: 500 })
    }

    // Mapear questões para incluir detalhes (sem a resposta correta para não expor)
    const questoesMap = new Map(questoesDetalhes?.map(q => [q.id, {
      id: q.id,
      enunciado: q.enunciado,
      alternativas: q.alternativas,
      disciplina: q.disciplina,
      assunto: q.assunto,
      subassunto: q.subassunto,
      dificuldade: q.dificuldade,
      modalidade: q.modalidade
      // NÃO incluir resposta_correta aqui
    }]))

    const questoesOrdenadas = simulado.simulado_questoes
      .map((sq: { questao_id: string; ordem: number; id: string }) => ({
        ...sq,
        questao: questoesMap.get(sq.questao_id)
      }))
      .sort((a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem)

    console.log('[SIMULADOS] Simulado iniciado:', {
      id: simuladoAtualizado.id,
      questoes: questoesOrdenadas.length,
      tempo_limite: simuladoAtualizado.tempo_limite_minutos
    })

    return NextResponse.json({
      success: true,
      simulado: {
        ...simuladoAtualizado,
        questoes: questoesOrdenadas
      },
      message: 'Simulado iniciado com sucesso'
    })
  } catch (error) {
    console.error('[SIMULADOS] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
