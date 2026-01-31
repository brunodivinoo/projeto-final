import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Cliente admin do Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

/**
 * POST - Registrar resposta de questão na sessão
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessao_id,
      user_id,
      questao_json,
      questao_id,
      resposta_usuario,
      resposta_correta,
      acertou,
      tempo_resposta_segundos,
      tema,
      dificuldade
    } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    // Registrar questão respondida
    const { data, error } = await supabaseAdmin
      .from('questoes_sessao_med')
      .insert({
        sessao_id,
        user_id,
        questao_id,
        questao_json,
        resposta_usuario,
        resposta_correta,
        acertou,
        tempo_resposta_segundos,
        tema,
        dificuldade,
        viu_gabarito: true
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao registrar questão:', error)
      return NextResponse.json(
        { error: 'Erro ao registrar questão', details: error.message },
        { status: 500 }
      )
    }

    // Atualizar métricas da sessão se houver sessao_id
    if (sessao_id) {
      const { data: sessao } = await supabaseAdmin
        .from('sessoes_modo_med')
        .select('metricas')
        .eq('id', sessao_id)
        .single()

      const metricasAtuais = sessao?.metricas || {}
      const novasMetricas = {
        ...metricasAtuais,
        questoes_total: (metricasAtuais.questoes_total || 0) + 1,
        questoes_acertos: (metricasAtuais.questoes_acertos || 0) + (acertou ? 1 : 0),
        questoes_erros: (metricasAtuais.questoes_erros || 0) + (!acertou ? 1 : 0),
        score: 0
      }

      // Calcular score
      if (novasMetricas.questoes_total > 0) {
        novasMetricas.score = Math.round(
          (novasMetricas.questoes_acertos / novasMetricas.questoes_total) * 100
        )
      }

      await supabaseAdmin
        .from('sessoes_modo_med')
        .update({
          metricas: novasMetricas,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessao_id)
    }

    return NextResponse.json({
      success: true,
      questao: data
    })

  } catch (error) {
    console.error('Erro na API de questões:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

/**
 * GET - Listar questões de uma sessão ou estatísticas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const sessao_id = searchParams.get('sessao_id')
    const tipo = searchParams.get('tipo') // 'lista' | 'estatisticas' | 'erros'

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    // Retornar questões erradas (para revisão)
    if (tipo === 'erros') {
      const { data: questoesErradas, error } = await supabaseAdmin
        .from('questoes_sessao_med')
        .select('*')
        .eq('user_id', user_id)
        .eq('acertou', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Erro ao buscar questões erradas:', error)
        return NextResponse.json(
          { error: 'Erro ao buscar questões' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        questoes: questoesErradas || []
      })
    }

    // Retornar estatísticas por tema
    if (tipo === 'estatisticas') {
      const { data: questoes, error } = await supabaseAdmin
        .from('questoes_sessao_med')
        .select('tema, acertou, tempo_resposta_segundos')
        .eq('user_id', user_id)

      if (error) {
        console.error('Erro ao buscar estatísticas:', error)
        return NextResponse.json(
          { error: 'Erro ao buscar estatísticas' },
          { status: 500 }
        )
      }

      // Agregar por tema
      const porTema: Record<string, { total: number; acertos: number; tempo_total: number }> = {}
      let totalGeral = 0
      let acertosGeral = 0
      let tempoTotal = 0

      questoes?.forEach(q => {
        const tema = q.tema || 'Outros'
        if (!porTema[tema]) {
          porTema[tema] = { total: 0, acertos: 0, tempo_total: 0 }
        }
        porTema[tema].total++
        if (q.acertou) porTema[tema].acertos++
        porTema[tema].tempo_total += q.tempo_resposta_segundos || 0

        totalGeral++
        if (q.acertou) acertosGeral++
        tempoTotal += q.tempo_resposta_segundos || 0
      })

      // Converter para array com taxas
      const estatisticasPorTema = Object.entries(porTema).map(([tema, stats]) => ({
        tema,
        total: stats.total,
        acertos: stats.acertos,
        erros: stats.total - stats.acertos,
        taxa_acerto: Math.round((stats.acertos / stats.total) * 100),
        tempo_medio: Math.round(stats.tempo_total / stats.total)
      })).sort((a, b) => b.total - a.total)

      return NextResponse.json({
        success: true,
        estatisticas: {
          geral: {
            total: totalGeral,
            acertos: acertosGeral,
            erros: totalGeral - acertosGeral,
            taxa_acerto: totalGeral > 0 ? Math.round((acertosGeral / totalGeral) * 100) : 0,
            tempo_medio: totalGeral > 0 ? Math.round(tempoTotal / totalGeral) : 0
          },
          por_tema: estatisticasPorTema
        }
      })
    }

    // Retornar questões de uma sessão específica
    if (sessao_id) {
      const { data: questoes, error } = await supabaseAdmin
        .from('questoes_sessao_med')
        .select('*')
        .eq('sessao_id', sessao_id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao listar questões da sessão:', error)
        return NextResponse.json(
          { error: 'Erro ao listar questões' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        questoes: questoes || []
      })
    }

    // Retornar últimas questões do usuário
    const { data: questoes, error } = await supabaseAdmin
      .from('questoes_sessao_med')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Erro ao listar questões:', error)
      return NextResponse.json(
        { error: 'Erro ao listar questões' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      questoes: questoes || []
    })

  } catch (error) {
    console.error('Erro na API de questões:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Atualizar questão (marcar como revisada, etc)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { questao_id, user_id, viu_gabarito, feedback_lido } = body

    if (!questao_id || !user_id) {
      return NextResponse.json(
        { error: 'questao_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    const updateData: { viu_gabarito?: boolean; feedback_lido?: boolean } = {}
    if (viu_gabarito !== undefined) updateData.viu_gabarito = viu_gabarito
    if (feedback_lido !== undefined) updateData.feedback_lido = feedback_lido

    const { data, error } = await supabaseAdmin
      .from('questoes_sessao_med')
      .update(updateData)
      .eq('id', questao_id)
      .eq('user_id', user_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar questão:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar questão' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      questao: data
    })

  } catch (error) {
    console.error('Erro na API de questões:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
