import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Responder uma questão do simulado
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { user_id, questao_id, resposta, tempo_resposta_segundos, marcada_revisao } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (!questao_id || resposta === undefined) {
      return NextResponse.json(
        { error: 'questao_id e resposta são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o simulado pertence ao usuário e está em andamento
    const { data: simulado, error: checkError } = await supabase
      .from('simulados')
      .select('id, status, modalidade')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (checkError || !simulado) {
      return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 })
    }

    if (simulado.status !== 'em_andamento') {
      return NextResponse.json(
        { error: 'Este simulado não está em andamento' },
        { status: 400 }
      )
    }

    // Verificar se a questão pertence ao simulado
    const { data: simuladoQuestao, error: sqError } = await supabase
      .from('simulado_questoes')
      .select('id, questao_id')
      .eq('simulado_id', id)
      .eq('questao_id', questao_id)
      .single()

    if (sqError || !simuladoQuestao) {
      return NextResponse.json(
        { error: 'Questão não encontrada neste simulado' },
        { status: 404 }
      )
    }

    // Buscar a resposta correta da questão
    const { data: questao, error: questaoError } = await supabase
      .from('questoes')
      .select('resposta_correta, explicacao')
      .eq('id', questao_id)
      .single()

    if (questaoError || !questao) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    // Verificar se a resposta está correta
    const respostaCorreta = questao.resposta_correta
    let estaCorreta = false

    // Para certo/errado: resposta pode ser 'C', 'E', 'certo', 'errado', etc
    if (simulado.modalidade === 'certo_errado') {
      const respostaUsuarioNormalizada = String(resposta).toUpperCase().trim()
      const respostaCorretaNormalizada = String(respostaCorreta).toUpperCase().trim()

      // Normalizar para C ou E
      const mapearResposta = (r: string) => {
        if (r === 'C' || r === 'CERTO' || r === 'V' || r === 'VERDADEIRO') return 'C'
        if (r === 'E' || r === 'ERRADO' || r === 'F' || r === 'FALSO') return 'E'
        return r
      }

      estaCorreta = mapearResposta(respostaUsuarioNormalizada) === mapearResposta(respostaCorretaNormalizada)
    } else {
      // Para múltipla escolha: comparar diretamente (A, B, C, D, E)
      estaCorreta = String(resposta).toUpperCase().trim() === String(respostaCorreta).toUpperCase().trim()
    }

    // Atualizar a resposta do usuário
    const { error: updateError } = await supabase
      .from('simulado_questoes')
      .update({
        resposta_usuario: String(resposta).toUpperCase().trim(),
        esta_correta: estaCorreta,
        tempo_resposta_segundos: tempo_resposta_segundos || null,
        respondida_em: new Date().toISOString(),
        marcada_revisao: marcada_revisao || false
      })
      .eq('id', simuladoQuestao.id)

    if (updateError) {
      console.error('[SIMULADOS] Erro ao registrar resposta:', updateError)
      return NextResponse.json({ error: 'Erro ao registrar resposta' }, { status: 500 })
    }

    // Atualizar contador de questões respondidas no simulado
    const { count: totalRespondidas } = await supabase
      .from('simulado_questoes')
      .select('id', { count: 'exact', head: true })
      .eq('simulado_id', id)
      .not('resposta_usuario', 'is', null)

    await supabase
      .from('simulados')
      .update({
        questoes_respondidas: totalRespondidas || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    console.log('[SIMULADOS] Resposta registrada:', {
      simulado_id: id,
      questao_id,
      resposta,
      esta_correta: estaCorreta
    })

    return NextResponse.json({
      success: true,
      resultado: {
        esta_correta: estaCorreta,
        resposta_usuario: String(resposta).toUpperCase().trim(),
        resposta_correta: respostaCorreta,
        explicacao: questao.explicacao
      },
      message: estaCorreta ? 'Resposta correta!' : 'Resposta incorreta'
    })
  } catch (error) {
    console.error('[SIMULADOS] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Marcar/desmarcar questão para revisão
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { user_id, questao_id, marcada_revisao } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (!questao_id) {
      return NextResponse.json({ error: 'questao_id é obrigatório' }, { status: 400 })
    }

    // Verificar se o simulado pertence ao usuário
    const { data: simulado, error: checkError } = await supabase
      .from('simulados')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (checkError || !simulado) {
      return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 })
    }

    if (simulado.status !== 'em_andamento') {
      return NextResponse.json(
        { error: 'Este simulado não está em andamento' },
        { status: 400 }
      )
    }

    // Atualizar marcação de revisão
    const { error: updateError } = await supabase
      .from('simulado_questoes')
      .update({ marcada_revisao: !!marcada_revisao })
      .eq('simulado_id', id)
      .eq('questao_id', questao_id)

    if (updateError) {
      console.error('[SIMULADOS] Erro ao marcar revisão:', updateError)
      return NextResponse.json({ error: 'Erro ao marcar revisão' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      marcada_revisao: !!marcada_revisao,
      message: marcada_revisao ? 'Questão marcada para revisão' : 'Marcação removida'
    })
  } catch (error) {
    console.error('[SIMULADOS] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
