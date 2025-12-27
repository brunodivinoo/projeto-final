import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface QuestaoComResposta {
  id: string
  questao_id: string
  ordem: number
  resposta_usuario: string | null
  esta_correta: boolean | null
  tempo_resposta_segundos: number | null
}

// POST - Finalizar simulado e calcular estatísticas
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { user_id, tempo_total_segundos } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Verificar se o simulado pertence ao usuário e está em andamento
    const { data: simulado, error: checkError } = await supabase
      .from('simulados')
      .select(`
        id,
        status,
        quantidade_questoes,
        iniciado_em,
        simulado_questoes(
          id,
          questao_id,
          ordem,
          resposta_usuario,
          esta_correta,
          tempo_resposta_segundos
        )
      `)
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (checkError || !simulado) {
      return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 })
    }

    if (simulado.status === 'finalizado') {
      return NextResponse.json(
        { error: 'Este simulado já foi finalizado' },
        { status: 400 }
      )
    }

    if (simulado.status !== 'em_andamento') {
      return NextResponse.json(
        { error: 'Este simulado não está em andamento' },
        { status: 400 }
      )
    }

    // Buscar detalhes das questões para análise de desempenho
    const questaoIds = simulado.simulado_questoes.map((sq: { questao_id: string }) => sq.questao_id)
    const { data: questoesDetalhes } = await supabase
      .from('questoes')
      .select('id, disciplina, assunto, subassunto')
      .in('id', questaoIds)

    const questoesMap = new Map(questoesDetalhes?.map(q => [q.id, q]))

    // Calcular estatísticas gerais
    const questoesRespondidas = simulado.simulado_questoes.filter(
      (sq: { resposta_usuario: string | null }) => sq.resposta_usuario !== null
    )
    const acertos = questoesRespondidas.filter(
      (sq: { esta_correta: boolean | null }) => sq.esta_correta === true
    ).length
    const erros = questoesRespondidas.filter(
      (sq: { esta_correta: boolean | null }) => sq.esta_correta === false
    ).length
    const naoRespondidas = simulado.quantidade_questoes - questoesRespondidas.length

    const pontuacao = simulado.quantidade_questoes > 0
      ? (acertos / simulado.quantidade_questoes) * 100
      : 0

    // Calcular tempo gasto
    let tempoGasto = tempo_total_segundos
    if (!tempoGasto && simulado.iniciado_em) {
      const inicio = new Date(simulado.iniciado_em)
      const fim = new Date()
      tempoGasto = Math.floor((fim.getTime() - inicio.getTime()) / 1000)
    }

    // Calcular desempenho por disciplina
    const desempenhoPorDisciplina = new Map<string, { total: number; acertos: number; erros: number; tempos: number[] }>()
    const desempenhoPorAssunto = new Map<string, { total: number; acertos: number; erros: number; tempos: number[] }>()

    simulado.simulado_questoes.forEach((sq: QuestaoComResposta) => {
      const questao = questoesMap.get(sq.questao_id)
      if (!questao) return

      // Por disciplina
      const disciplina = questao.disciplina || 'Sem disciplina'
      if (!desempenhoPorDisciplina.has(disciplina)) {
        desempenhoPorDisciplina.set(disciplina, { total: 0, acertos: 0, erros: 0, tempos: [] })
      }
      const statsDisciplina = desempenhoPorDisciplina.get(disciplina)!
      statsDisciplina.total++
      if (sq.esta_correta === true) statsDisciplina.acertos++
      if (sq.esta_correta === false) statsDisciplina.erros++
      if (sq.tempo_resposta_segundos) statsDisciplina.tempos.push(sq.tempo_resposta_segundos)

      // Por assunto
      const assunto = questao.assunto || 'Sem assunto'
      if (!desempenhoPorAssunto.has(assunto)) {
        desempenhoPorAssunto.set(assunto, { total: 0, acertos: 0, erros: 0, tempos: [] })
      }
      const statsAssunto = desempenhoPorAssunto.get(assunto)!
      statsAssunto.total++
      if (sq.esta_correta === true) statsAssunto.acertos++
      if (sq.esta_correta === false) statsAssunto.erros++
      if (sq.tempo_resposta_segundos) statsAssunto.tempos.push(sq.tempo_resposta_segundos)
    })

    // Inserir registros de desempenho
    const desempenhoInserts: Array<{
      simulado_id: string
      user_id: string
      tipo: string
      area_nome: string
      total_questoes: number
      acertos: number
      erros: number
      percentual: number
      tempo_medio_segundos: number | null
    }> = []

    desempenhoPorDisciplina.forEach((stats, disciplina) => {
      const tempoMedio = stats.tempos.length > 0
        ? Math.round(stats.tempos.reduce((a, b) => a + b, 0) / stats.tempos.length)
        : null

      desempenhoInserts.push({
        simulado_id: id,
        user_id: user_id,
        tipo: 'disciplina',
        area_nome: disciplina,
        total_questoes: stats.total,
        acertos: stats.acertos,
        erros: stats.erros,
        percentual: stats.total > 0 ? (stats.acertos / stats.total) * 100 : 0,
        tempo_medio_segundos: tempoMedio
      })
    })

    desempenhoPorAssunto.forEach((stats, assunto) => {
      const tempoMedio = stats.tempos.length > 0
        ? Math.round(stats.tempos.reduce((a, b) => a + b, 0) / stats.tempos.length)
        : null

      desempenhoInserts.push({
        simulado_id: id,
        user_id: user_id,
        tipo: 'assunto',
        area_nome: assunto,
        total_questoes: stats.total,
        acertos: stats.acertos,
        erros: stats.erros,
        percentual: stats.total > 0 ? (stats.acertos / stats.total) * 100 : 0,
        tempo_medio_segundos: tempoMedio
      })
    })

    // Inserir desempenho
    if (desempenhoInserts.length > 0) {
      await supabase
        .from('simulado_desempenho')
        .insert(desempenhoInserts)
    }

    // Atualizar simulado como finalizado
    const { data: simuladoFinalizado, error: updateError } = await supabase
      .from('simulados')
      .update({
        status: 'finalizado',
        questoes_respondidas: questoesRespondidas.length,
        acertos,
        erros,
        pontuacao: Math.round(pontuacao * 100) / 100,
        tempo_gasto_segundos: tempoGasto,
        finalizado_em: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[SIMULADOS] Erro ao finalizar:', updateError)
      return NextResponse.json({ error: 'Erro ao finalizar simulado' }, { status: 500 })
    }

    // Identificar pontos fortes e fracos
    const pontosFortes: string[] = []
    const pontosFracos: string[] = []

    desempenhoPorDisciplina.forEach((stats, disciplina) => {
      const percentual = stats.total > 0 ? (stats.acertos / stats.total) * 100 : 0
      if (percentual >= 70) {
        pontosFortes.push(disciplina)
      } else if (percentual < 50 && stats.total >= 2) {
        pontosFracos.push(disciplina)
      }
    })

    // Gerar sugestões baseadas no desempenho
    const sugestoesInserts: Array<{
      user_id: string
      simulado_id: string
      tipo: string
      titulo: string
      descricao: string
      config_sugerida: object
      prioridade: number
    }> = []

    // Sugestão para pontos fracos
    pontosFracos.forEach((disciplina, index) => {
      sugestoesInserts.push({
        user_id: user_id,
        simulado_id: id,
        tipo: 'reforco',
        titulo: `Reforçar ${disciplina}`,
        descricao: `Seu desempenho em ${disciplina} ficou abaixo de 50%. Recomendamos praticar mais questões dessa disciplina.`,
        config_sugerida: {
          disciplinas: [disciplina],
          quantidade_questoes: 20,
          dificuldades: ['facil', 'medio']
        },
        prioridade: pontosFracos.length - index
      })
    })

    // Sugestão de simulado similar se bom desempenho
    if (pontuacao >= 70) {
      sugestoesInserts.push({
        user_id: user_id,
        simulado_id: id,
        tipo: 'avanco',
        titulo: 'Aumentar dificuldade',
        descricao: `Excelente desempenho! (${Math.round(pontuacao)}%) Sugerimos um simulado com questões mais difíceis.`,
        config_sugerida: {
          quantidade_questoes: simulado.quantidade_questoes,
          dificuldades: ['medio', 'dificil']
        },
        prioridade: 1
      })
    }

    if (sugestoesInserts.length > 0) {
      await supabase
        .from('simulado_sugestoes')
        .insert(sugestoesInserts)
    }

    console.log('[SIMULADOS] Simulado finalizado:', {
      id: simuladoFinalizado.id,
      acertos,
      erros,
      nao_respondidas: naoRespondidas,
      pontuacao: Math.round(pontuacao * 100) / 100,
      tempo_gasto: tempoGasto
    })

    return NextResponse.json({
      success: true,
      simulado: simuladoFinalizado,
      estatisticas: {
        total_questoes: simulado.quantidade_questoes,
        respondidas: questoesRespondidas.length,
        nao_respondidas: naoRespondidas,
        acertos,
        erros,
        pontuacao: Math.round(pontuacao * 100) / 100,
        tempo_gasto_segundos: tempoGasto,
        pontos_fortes: pontosFortes,
        pontos_fracos: pontosFracos,
        desempenho_por_disciplina: Array.from(desempenhoPorDisciplina.entries()).map(([nome, stats]) => ({
          nome,
          ...stats,
          percentual: stats.total > 0 ? Math.round((stats.acertos / stats.total) * 100) : 0
        })),
        desempenho_por_assunto: Array.from(desempenhoPorAssunto.entries()).map(([nome, stats]) => ({
          nome,
          ...stats,
          percentual: stats.total > 0 ? Math.round((stats.acertos / stats.total) * 100) : 0
        }))
      },
      sugestoes: sugestoesInserts.length,
      message: 'Simulado finalizado com sucesso'
    })
  } catch (error) {
    console.error('[SIMULADOS] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
