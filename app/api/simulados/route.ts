import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Listar simulados do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Parâmetros de filtro
    const status = searchParams.get('status')
    const fonte = searchParams.get('fonte')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const porPagina = parseInt(searchParams.get('por_pagina') || '10')

    // Validar porPagina
    const porPaginaValido = [5, 10, 15, 20, 50].includes(porPagina) ? porPagina : 10
    const offset = (pagina - 1) * porPaginaValido

    // Construir query
    let query = supabase
      .from('simulados')
      .select(`
        *,
        simulado_disciplinas(disciplina_nome),
        simulado_assuntos(assunto_nome),
        simulado_questoes(count)
      `, { count: 'exact' })
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }
    if (fonte) {
      query = query.eq('fonte', fonte)
    }

    // Paginar
    query = query.range(offset, offset + porPaginaValido - 1)

    const { data: simulados, count, error } = await query

    if (error) {
      console.error('[SIMULADOS] Erro ao buscar:', error)
      return NextResponse.json({ error: 'Erro ao buscar simulados' }, { status: 500 })
    }

    // Calcular total de páginas
    const totalPaginas = Math.ceil((count || 0) / porPaginaValido)

    return NextResponse.json({
      simulados,
      paginacao: {
        pagina,
        porPagina: porPaginaValido,
        total: count,
        totalPaginas,
        temAnterior: pagina > 1,
        temProxima: pagina < totalPaginas
      }
    })
  } catch (error) {
    console.error('[SIMULADOS] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar novo simulado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      titulo,
      descricao,
      fonte = 'banco',
      modalidade,
      quantidade_questoes,
      tempo_limite_minutos,
      dificuldades = [],
      banca,
      cargo,
      instituicao,
      ano,
      disciplinas = [],
      assuntos = [],
      subassuntos = []
    } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    console.log('[SIMULADOS] Criando simulado:', {
      user_id,
      titulo,
      fonte,
      modalidade,
      quantidade_questoes,
      disciplinas: disciplinas.length,
      assuntos: assuntos.length
    })

    // Validações
    if (!titulo || !modalidade || !quantidade_questoes) {
      return NextResponse.json(
        { error: 'Título, modalidade e quantidade de questões são obrigatórios' },
        { status: 400 }
      )
    }

    if (quantidade_questoes < 1 || quantidade_questoes > 100) {
      return NextResponse.json(
        { error: 'Quantidade de questões deve ser entre 1 e 100' },
        { status: 400 }
      )
    }

    // Verificar limite do plano
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plano')
      .eq('id', user_id)
      .single()

    if (profileError) {
      console.error('[SIMULADOS] Erro ao buscar perfil:', profileError)
      return NextResponse.json({ error: 'Erro ao verificar perfil' }, { status: 500 })
    }

    // Buscar limite do plano
    const { data: plano, error: planoError } = await supabase
      .from('planos')
      .select('limite_simulados_mes')
      .eq('nome', profile.plano || 'gratuito')
      .single()

    if (planoError) {
      console.error('[SIMULADOS] Erro ao buscar plano:', planoError)
    }

    const limiteSimulados = plano?.limite_simulados_mes || 5

    // Contar simulados do mês atual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const { count: simuladosMes, error: countError } = await supabase
      .from('simulados')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .gte('created_at', inicioMes.toISOString())

    if (countError) {
      console.error('[SIMULADOS] Erro ao contar simulados:', countError)
    }

    if ((simuladosMes || 0) >= limiteSimulados) {
      return NextResponse.json({
        error: 'Limite de simulados do mês atingido',
        limite: limiteSimulados,
        usado: simuladosMes
      }, { status: 403 })
    }

    // Buscar questões disponíveis
    let questoesQuery = supabase
      .from('questoes')
      .select('id, enunciado, alternativas, resposta_correta, disciplina, assunto, subassunto, dificuldade, modalidade')

    // Aplicar filtros de modalidade
    if (modalidade === 'certo_errado') {
      questoesQuery = questoesQuery.eq('modalidade', 'certo_errado')
    } else if (modalidade === 'multipla_escolha') {
      questoesQuery = questoesQuery.eq('modalidade', 'multipla_escolha')
    }

    // Filtrar por disciplinas
    if (disciplinas.length > 0) {
      const nomesDisciplinas = disciplinas.map((d: { nome: string }) => d.nome)
      questoesQuery = questoesQuery.in('disciplina', nomesDisciplinas)
    }

    // Filtrar por assuntos
    if (assuntos.length > 0) {
      const nomesAssuntos = assuntos.map((a: { nome: string }) => a.nome)
      questoesQuery = questoesQuery.in('assunto', nomesAssuntos)
    }

    // Filtrar por subassuntos
    if (subassuntos.length > 0) {
      const nomesSubassuntos = subassuntos.map((s: { nome: string }) => s.nome)
      questoesQuery = questoesQuery.in('subassunto', nomesSubassuntos)
    }

    // Filtrar por dificuldades
    if (dificuldades.length > 0) {
      questoesQuery = questoesQuery.in('dificuldade', dificuldades)
    }

    // Filtrar por banca
    if (banca) {
      questoesQuery = questoesQuery.eq('banca', banca)
    }

    // Filtrar por ano
    if (ano) {
      questoesQuery = questoesQuery.eq('ano', ano)
    }

    // Buscar questões
    const { data: questoesDisponiveis, error: questoesError } = await questoesQuery

    if (questoesError) {
      console.error('[SIMULADOS] Erro ao buscar questões:', questoesError)
      return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
    }

    if (!questoesDisponiveis || questoesDisponiveis.length < quantidade_questoes) {
      return NextResponse.json({
        error: 'Não há questões suficientes com os filtros selecionados',
        disponiveis: questoesDisponiveis?.length || 0,
        solicitadas: quantidade_questoes
      }, { status: 400 })
    }

    // Selecionar questões aleatoriamente
    const questoesSelecionadas = questoesDisponiveis
      .sort(() => Math.random() - 0.5)
      .slice(0, quantidade_questoes)

    // Criar simulado
    const { data: simulado, error: simuladoError } = await supabase
      .from('simulados')
      .insert({
        user_id,
        titulo,
        descricao,
        fonte,
        modalidade,
        quantidade_questoes,
        tempo_limite_minutos,
        dificuldades,
        banca,
        cargo,
        instituicao,
        ano,
        status: 'pendente'
      })
      .select()
      .single()

    if (simuladoError) {
      console.error('[SIMULADOS] Erro ao criar simulado:', simuladoError)
      return NextResponse.json({ error: 'Erro ao criar simulado' }, { status: 500 })
    }

    // Inserir disciplinas selecionadas
    if (disciplinas.length > 0) {
      const disciplinasInsert = disciplinas.map((d: { id: string, nome: string }) => ({
        simulado_id: simulado.id,
        disciplina_id: d.id || null,
        disciplina_nome: d.nome
      }))

      await supabase
        .from('simulado_disciplinas')
        .insert(disciplinasInsert)
    }

    // Inserir assuntos selecionados
    if (assuntos.length > 0) {
      const assuntosInsert = assuntos.map((a: { id: string, nome: string }) => ({
        simulado_id: simulado.id,
        assunto_id: a.id || null,
        assunto_nome: a.nome
      }))

      await supabase
        .from('simulado_assuntos')
        .insert(assuntosInsert)
    }

    // Inserir subassuntos selecionados
    if (subassuntos.length > 0) {
      const subassuntosInsert = subassuntos.map((s: { id: string, nome: string }) => ({
        simulado_id: simulado.id,
        subassunto_id: s.id || null,
        subassunto_nome: s.nome
      }))

      await supabase
        .from('simulado_subassuntos')
        .insert(subassuntosInsert)
    }

    // Inserir questões do simulado
    const questoesInsert = questoesSelecionadas.map((q, index) => ({
      simulado_id: simulado.id,
      questao_id: q.id,
      ordem: index + 1
    }))

    const { error: questoesInsertError } = await supabase
      .from('simulado_questoes')
      .insert(questoesInsert)

    if (questoesInsertError) {
      console.error('[SIMULADOS] Erro ao inserir questões:', questoesInsertError)
      // Deletar simulado criado em caso de erro
      await supabase.from('simulados').delete().eq('id', simulado.id)
      return NextResponse.json({ error: 'Erro ao adicionar questões ao simulado' }, { status: 500 })
    }

    console.log('[SIMULADOS] Simulado criado com sucesso:', {
      id: simulado.id,
      questoes: questoesSelecionadas.length
    })

    return NextResponse.json({
      success: true,
      simulado: {
        ...simulado,
        questoes_count: questoesSelecionadas.length
      },
      message: 'Simulado criado com sucesso'
    })

  } catch (error) {
    console.error('[SIMULADOS] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
