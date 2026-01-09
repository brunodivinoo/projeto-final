import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Listar questões com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const disciplinaId = searchParams.get('disciplinaId')
    const assuntoId = searchParams.get('assuntoId')
    const banca = searchParams.get('banca')
    const ano = searchParams.get('ano')
    const dificuldade = searchParams.get('dificuldade')
    const naoRespondidas = searchParams.get('naoRespondidas') === 'true'
    const erradas = searchParams.get('erradas') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
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
        total_respostas,
        total_acertos,
        comentario_ia,
        explicacao,
        tags,
        created_at,
        disciplina:disciplinas_med(id, nome),
        assunto:assuntos_med(id, nome),
        subassunto:subassuntos_med(id, nome)
      `, { count: 'exact' })
      .eq('ativo', true)

    // Aplicar filtros
    if (disciplinaId) {
      query = query.eq('disciplina_id', disciplinaId)
    }
    if (assuntoId) {
      query = query.eq('assunto_id', assuntoId)
    }
    if (banca) {
      query = query.eq('banca', banca)
    }
    if (ano) {
      query = query.eq('ano', parseInt(ano))
    }
    if (dificuldade) {
      query = query.eq('dificuldade', parseInt(dificuldade))
    }

    // Filtrar não respondidas ou erradas
    if (userId && (naoRespondidas || erradas)) {
      const { data: respostas } = await supabase
        .from('respostas_med')
        .select('questao_id, acertou')
        .eq('user_id', userId)

      if (respostas) {
        if (naoRespondidas) {
          const respondidas = respostas.map(r => r.questao_id)
          if (respondidas.length > 0) {
            query = query.not('id', 'in', `(${respondidas.join(',')})`)
          }
        } else if (erradas) {
          const erradasIds = respostas
            .filter(r => !r.acertou)
            .map(r => r.questao_id)
          if (erradasIds.length > 0) {
            query = query.in('id', erradasIds)
          } else {
            return NextResponse.json({ questoes: [], total: 0 })
          }
        }
      }
    }

    // Ordenação e paginação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: questoes, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      questoes: questoes || [],
      total: count || 0
    })

  } catch (error) {
    console.error('Erro ao buscar questões:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar questões' },
      { status: 500 }
    )
  }
}

// POST - Registrar resposta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, questaoId, respostaSelecionada, tempoSegundos } = body

    if (!userId || !questaoId || !respostaSelecionada) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Buscar gabarito da questão
    const { data: questao, error: questaoError } = await supabase
      .from('questoes_med')
      .select('gabarito')
      .eq('id', questaoId)
      .single()

    if (questaoError || !questao) {
      return NextResponse.json(
        { error: 'Questão não encontrada' },
        { status: 404 }
      )
    }

    const acertou = questao.gabarito === respostaSelecionada

    // Registrar resposta
    const { data: resposta, error: respostaError } = await supabase
      .from('respostas_med')
      .insert({
        user_id: userId,
        questao_id: questaoId,
        resposta_selecionada: respostaSelecionada,
        acertou,
        tempo_segundos: tempoSegundos || null
      })
      .select()
      .single()

    if (respostaError) throw respostaError

    // Atualizar estatísticas da questão
    const updateQuestao: Record<string, any> = {
      total_respostas: supabase.rpc('increment_value', { x: 1 })
    }
    if (acertou) {
      updateQuestao.total_acertos = supabase.rpc('increment_value', { x: 1 })
    }

    await supabase.rpc('incrementar_questao_med', {
      p_questao_id: questaoId,
      p_acertou: acertou
    }).catch(() => {
      // Se a função não existir, usar update direto
      supabase
        .from('questoes_med')
        .update({
          total_respostas: (questao as any).total_respostas + 1,
          total_acertos: (questao as any).total_acertos + (acertou ? 1 : 0)
        })
        .eq('id', questaoId)
    })

    // Atualizar profile
    await supabase.rpc('atualizar_estatisticas_med', {
      p_user_id: userId,
      p_acertou: acertou,
      p_tempo: tempoSegundos || 0
    }).catch(() => {
      // Fallback se a função não existir
    })

    // Atualizar estudo diário
    const hoje = new Date().toISOString().split('T')[0]
    const { data: estudoHoje } = await supabase
      .from('estudo_diario_med')
      .select('*')
      .eq('user_id', userId)
      .eq('data', hoje)
      .single()

    if (estudoHoje) {
      await supabase
        .from('estudo_diario_med')
        .update({
          questoes_feitas: estudoHoje.questoes_feitas + 1,
          questoes_corretas: estudoHoje.questoes_corretas + (acertou ? 1 : 0),
          tempo_total_segundos: estudoHoje.tempo_total_segundos + (tempoSegundos || 0)
        })
        .eq('id', estudoHoje.id)
    } else {
      await supabase
        .from('estudo_diario_med')
        .insert({
          user_id: userId,
          data: hoje,
          questoes_feitas: 1,
          questoes_corretas: acertou ? 1 : 0,
          tempo_total_segundos: tempoSegundos || 0
        })
    }

    // Atualizar limites de uso
    const mesRef = new Date().toISOString().slice(0, 7)
    const { data: limiteExistente } = await supabase
      .from('limites_uso_med')
      .select('*')
      .eq('user_id', userId)
      .eq('mes_referencia', mesRef)
      .single()

    if (limiteExistente) {
      await supabase
        .from('limites_uso_med')
        .update({
          questoes_dia: limiteExistente.data_questoes === hoje
            ? limiteExistente.questoes_dia + 1
            : 1,
          data_questoes: hoje
        })
        .eq('id', limiteExistente.id)
    } else {
      await supabase
        .from('limites_uso_med')
        .insert({
          user_id: userId,
          mes_referencia: mesRef,
          questoes_dia: 1,
          data_questoes: hoje
        })
    }

    return NextResponse.json({
      resposta,
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
