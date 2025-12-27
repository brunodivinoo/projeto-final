import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Obter detalhes de um simulado
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Buscar simulado com todas as relações
    const { data: simulado, error: simuladoError } = await supabase
      .from('simulados')
      .select(`
        *,
        simulado_disciplinas(id, disciplina_id, disciplina_nome),
        simulado_assuntos(id, assunto_id, assunto_nome),
        simulado_subassuntos(id, subassunto_id, subassunto_nome),
        simulado_questoes(
          id,
          questao_id,
          ordem,
          resposta_usuario,
          esta_correta,
          tempo_resposta_segundos,
          respondida_em,
          marcada_revisao
        )
      `)
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (simuladoError) {
      if (simuladoError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 })
      }
      console.error('[SIMULADOS] Erro ao buscar simulado:', simuladoError)
      return NextResponse.json({ error: 'Erro ao buscar simulado' }, { status: 500 })
    }

    // Se o simulado está em andamento ou finalizado, buscar detalhes das questões
    if (simulado.status !== 'pendente') {
      const questaoIds = simulado.simulado_questoes.map((sq: { questao_id: string }) => sq.questao_id)

      const { data: questoesDetalhes, error: questoesError } = await supabase
        .from('questoes')
        .select('id, enunciado, alternativas, resposta_correta, disciplina, assunto, subassunto, dificuldade, modalidade, explicacao')
        .in('id', questaoIds)

      if (questoesError) {
        console.error('[SIMULADOS] Erro ao buscar questões:', questoesError)
      } else {
        // Mapear questões para incluir detalhes
        const questoesMap = new Map(questoesDetalhes?.map(q => [q.id, q]))
        simulado.simulado_questoes = simulado.simulado_questoes
          .map((sq: { questao_id: string; ordem: number }) => ({
            ...sq,
            questao: questoesMap.get(sq.questao_id)
          }))
          .sort((a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem)
      }
    }

    // Buscar desempenho se finalizado
    let desempenho = null
    if (simulado.status === 'finalizado') {
      const { data: desempenhoData } = await supabase
        .from('simulado_desempenho')
        .select('*')
        .eq('simulado_id', id)
        .order('tipo', { ascending: true })

      desempenho = desempenhoData
    }

    return NextResponse.json({
      simulado,
      desempenho
    })
  } catch (error) {
    console.error('[SIMULADOS] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Atualizar simulado
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { user_id, titulo, descricao, tempo_limite_minutos } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Verificar se o simulado pertence ao usuário
    const { data: simuladoExistente, error: checkError } = await supabase
      .from('simulados')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (checkError || !simuladoExistente) {
      return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 })
    }

    // Não permitir edição se já foi iniciado
    if (simuladoExistente.status !== 'pendente') {
      return NextResponse.json(
        { error: 'Não é possível editar um simulado que já foi iniciado' },
        { status: 400 }
      )
    }

    // Atualizar simulado
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (titulo) updateData.titulo = titulo
    if (descricao !== undefined) updateData.descricao = descricao
    if (tempo_limite_minutos !== undefined) updateData.tempo_limite_minutos = tempo_limite_minutos

    const { data: simulado, error: updateError } = await supabase
      .from('simulados')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[SIMULADOS] Erro ao atualizar:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar simulado' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      simulado,
      message: 'Simulado atualizado com sucesso'
    })
  } catch (error) {
    console.error('[SIMULADOS] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir simulado
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Verificar se o simulado pertence ao usuário
    const { data: simuladoExistente, error: checkError } = await supabase
      .from('simulados')
      .select('id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (checkError || !simuladoExistente) {
      return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 })
    }

    // Deletar simulado (CASCADE vai deletar registros relacionados)
    const { error: deleteError } = await supabase
      .from('simulados')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[SIMULADOS] Erro ao deletar:', deleteError)
      return NextResponse.json({ error: 'Erro ao deletar simulado' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Simulado excluído com sucesso'
    })
  } catch (error) {
    console.error('[SIMULADOS] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
