import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Listar simulados do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('simulados_med')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: simulados, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      simulados: simulados || [],
      total: count || 0
    })

  } catch (error) {
    console.error('Erro ao buscar simulados:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar simulados' },
      { status: 500 }
    )
  }
}

// POST - Criar novo simulado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      nome,
      tipo,
      disciplinas,
      assuntos,
      dificuldadeMin,
      dificuldadeMax,
      bancas,
      anos,
      totalQuestoes,
      tempoLimite
    } = body

    if (!userId || !nome || !totalQuestoes) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Verificar limite de simulados
    const mesRef = new Date().toISOString().slice(0, 7)
    const { data: limiteData } = await supabase
      .from('limites_uso_med')
      .select('simulados_mes')
      .eq('user_id', userId)
      .eq('mes_referencia', mesRef)
      .single()

    const { data: profile } = await supabase
      .from('profiles_med')
      .select('plano')
      .eq('id', userId)
      .single()

    const plano = profile?.plano || 'gratuito'
    const limites: Record<string, number> = {
      gratuito: 2,
      premium: 10,
      residencia: -1
    }

    const limite = limites[plano]
    const usados = limiteData?.simulados_mes || 0

    if (limite !== -1 && usados >= limite) {
      return NextResponse.json(
        { error: 'Limite de simulados do mês atingido' },
        { status: 403 }
      )
    }

    // Buscar questões aleatórias baseadas nos filtros
    let queryQuestoes = supabase
      .from('questoes_med')
      .select('id')
      .eq('ativo', true)

    if (disciplinas && disciplinas.length > 0) {
      queryQuestoes = queryQuestoes.in('disciplina_id', disciplinas)
    }

    if (assuntos && assuntos.length > 0) {
      queryQuestoes = queryQuestoes.in('assunto_id', assuntos)
    }

    if (dificuldadeMin) {
      queryQuestoes = queryQuestoes.gte('dificuldade', dificuldadeMin)
    }

    if (dificuldadeMax) {
      queryQuestoes = queryQuestoes.lte('dificuldade', dificuldadeMax)
    }

    if (bancas && bancas.length > 0) {
      queryQuestoes = queryQuestoes.in('banca', bancas)
    }

    if (anos && anos.length > 0) {
      queryQuestoes = queryQuestoes.in('ano', anos)
    }

    const { data: questoesDisponiveis, error: questoesError } = await queryQuestoes

    if (questoesError) throw questoesError

    if (!questoesDisponiveis || questoesDisponiveis.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma questão encontrada com os filtros selecionados' },
        { status: 400 }
      )
    }

    // Selecionar questões aleatórias
    const shuffled = questoesDisponiveis.sort(() => Math.random() - 0.5)
    const selecionadas = shuffled.slice(0, Math.min(totalQuestoes, shuffled.length))
    const questoesIds = selecionadas.map(q => q.id)

    // Criar o simulado
    const { data: simulado, error: simuladoError } = await supabase
      .from('simulados_med')
      .insert({
        user_id: userId,
        nome,
        tipo: tipo || 'personalizado',
        disciplinas: disciplinas || null,
        dificuldade_min: dificuldadeMin || null,
        dificuldade_max: dificuldadeMax || null,
        bancas: bancas || null,
        anos: anos || null,
        questoes_ids: questoesIds,
        total_questoes: questoesIds.length,
        tempo_limite_minutos: tempoLimite || null,
        status: 'em_andamento',
        data_inicio: new Date().toISOString()
      })
      .select()
      .single()

    if (simuladoError) throw simuladoError

    // Criar registros de resposta vazios
    const respostasIniciais = questoesIds.map((questaoId, index) => ({
      simulado_id: simulado.id,
      questao_id: questaoId,
      ordem: index + 1
    }))

    await supabase
      .from('simulado_respostas_med')
      .insert(respostasIniciais)

    // Atualizar contador de simulados do mês
    await supabase
      .from('limites_uso_med')
      .upsert({
        user_id: userId,
        mes_referencia: mesRef,
        simulados_mes: usados + 1
      }, {
        onConflict: 'user_id,mes_referencia'
      })

    return NextResponse.json({ simulado })

  } catch (error) {
    console.error('Erro ao criar simulado:', error)
    return NextResponse.json(
      { error: 'Erro ao criar simulado' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar simulado (finalizar, atualizar tempo, etc)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, tempoGasto, status, questoesCorretas } = body

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id e userId são obrigatórios' },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = {}

    if (tempoGasto !== undefined) updateData.tempo_gasto_segundos = tempoGasto
    if (status !== undefined) updateData.status = status
    if (questoesCorretas !== undefined) updateData.questoes_corretas = questoesCorretas
    if (status === 'finalizado') updateData.data_fim = new Date().toISOString()

    const { data: simulado, error } = await supabase
      .from('simulados_med')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // Se finalizou, atualizar estudo diário
    if (status === 'finalizado') {
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
            simulados_feitos: estudoHoje.simulados_feitos + 1,
            tempo_total_segundos: estudoHoje.tempo_total_segundos + (tempoGasto || 0)
          })
          .eq('id', estudoHoje.id)
      } else {
        await supabase
          .from('estudo_diario_med')
          .insert({
            user_id: userId,
            data: hoje,
            simulados_feitos: 1,
            tempo_total_segundos: tempoGasto || 0
          })
      }
    }

    return NextResponse.json({ simulado })

  } catch (error) {
    console.error('Erro ao atualizar simulado:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar simulado' },
      { status: 500 }
    )
  }
}
