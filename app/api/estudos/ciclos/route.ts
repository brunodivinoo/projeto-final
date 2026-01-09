import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Listar ciclos do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const status = searchParams.get('status')
    const id = searchParams.get('id')
    const atual = searchParams.get('atual')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Buscar ciclo específico
    if (id) {
      const { data: ciclo, error } = await supabase
        .from('ciclos_estudo')
        .select(`
          *,
          plano:planos_estudo (id, nome),
          ciclo_itens (
            *,
            disciplina:disciplinas (id, nome, icon, cor),
            assunto:assuntos (id, nome),
            subassunto:subassuntos (id, nome)
          )
        `)
        .eq('id', id)
        .eq('user_id', user_id)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 })
      }

      return NextResponse.json(ciclo)
    }

    // Buscar ciclo atual (em progresso)
    if (atual === 'true') {
      const { data: ciclo } = await supabase
        .from('ciclos_estudo')
        .select(`
          *,
          plano:planos_estudo (id, nome),
          ciclo_itens (
            *,
            disciplina:disciplinas (id, nome, icon, cor),
            assunto:assuntos (id, nome),
            subassunto:subassuntos (id, nome)
          )
        `)
        .eq('user_id', user_id)
        .eq('status', 'em_progresso')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return NextResponse.json(ciclo || null)
    }

    // Listar ciclos
    let query = supabase
      .from('ciclos_estudo')
      .select(`
        *,
        plano:planos_estudo (id, nome),
        ciclo_itens (count)
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: ciclos, error } = await query

    if (error) {
      console.error('Erro ao buscar ciclos:', error)
      return NextResponse.json({ error: 'Erro ao buscar ciclos' }, { status: 500 })
    }

    return NextResponse.json(ciclos)
  } catch (error) {
    console.error('Erro na API de ciclos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar novo ciclo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, nome, descricao, plano_id, duracao_dias, data_inicio, horas_planejadas, itens } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Contar ciclos existentes para numeração
    const { count } = await supabase
      .from('ciclos_estudo')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)

    // Criar ciclo
    const { data: ciclo, error: cicloError } = await supabase
      .from('ciclos_estudo')
      .insert({
        user_id,
        plano_id: plano_id || null,
        nome,
        descricao,
        numero: (count || 0) + 1,
        duracao_dias: duracao_dias || 7,
        data_inicio: data_inicio || new Date().toISOString().split('T')[0],
        data_fim: data_inicio
          ? new Date(new Date(data_inicio).getTime() + (duracao_dias || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : new Date(Date.now() + (duracao_dias || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        horas_planejadas: horas_planejadas || 40,
        status: 'em_progresso'
      })
      .select()
      .single()

    if (cicloError) {
      console.error('Erro ao criar ciclo:', cicloError)
      return NextResponse.json({ error: 'Erro ao criar ciclo' }, { status: 500 })
    }

    // Inserir itens do ciclo
    if (itens && itens.length > 0) {
      const itensParaInserir = itens.map((item: Record<string, unknown>, index: number) => ({
        ciclo_id: ciclo.id,
        disciplina_id: item.disciplina_id,
        assunto_id: item.assunto_id || null,
        subassunto_id: item.subassunto_id || null,
        nome_display: item.nome_display || null,
        cor: item.cor || 'blue',
        icone: item.icone || 'book',
        horas_meta: item.horas_meta || 10,
        prioridade: item.prioridade || 3,
        ordem: index
      }))

      const { error: itensError } = await supabase
        .from('ciclo_itens')
        .insert(itensParaInserir)

      if (itensError) {
        console.error('Erro ao inserir itens do ciclo:', itensError)
      }
    }

    // Buscar ciclo completo
    const { data: cicloCompleto } = await supabase
      .from('ciclos_estudo')
      .select(`
        *,
        plano:planos_estudo (id, nome),
        ciclo_itens (
          *,
          disciplina:disciplinas (id, nome, icon, cor),
          assunto:assuntos (id, nome),
          subassunto:subassuntos (id, nome)
        )
      `)
      .eq('id', ciclo.id)
      .single()

    return NextResponse.json(cicloCompleto, { status: 201 })
  } catch (error) {
    console.error('Erro na API de ciclos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT - Atualizar ciclo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, user_id, nome, descricao, status, horas_planejadas, itens } = body

    if (!id || !user_id) {
      return NextResponse.json({ error: 'ID e user_id são obrigatórios' }, { status: 400 })
    }

    // Verificar propriedade
    const { data: cicloExistente } = await supabase
      .from('ciclos_estudo')
      .select('id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (!cicloExistente) {
      return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 })
    }

    // Atualizar ciclo
    const updateData: Record<string, unknown> = {}
    if (nome !== undefined) updateData.nome = nome
    if (descricao !== undefined) updateData.descricao = descricao
    if (status !== undefined) updateData.status = status
    if (horas_planejadas !== undefined) updateData.horas_planejadas = horas_planejadas

    const { error: updateError } = await supabase
      .from('ciclos_estudo')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Erro ao atualizar ciclo:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar ciclo' }, { status: 500 })
    }

    // Atualizar itens se fornecidos
    if (itens !== undefined) {
      await supabase
        .from('ciclo_itens')
        .delete()
        .eq('ciclo_id', id)

      if (itens.length > 0) {
        const itensParaInserir = itens.map((item: Record<string, unknown>, index: number) => ({
          ciclo_id: id,
          disciplina_id: item.disciplina_id,
          assunto_id: item.assunto_id || null,
          subassunto_id: item.subassunto_id || null,
          nome_display: item.nome_display || null,
          cor: item.cor || 'blue',
          icone: item.icone || 'book',
          horas_meta: item.horas_meta || 10,
          horas_estudadas: item.horas_estudadas || 0,
          progresso: item.progresso || 0,
          prioridade: item.prioridade || 3,
          ordem: index
        }))

        await supabase.from('ciclo_itens').insert(itensParaInserir)
      }
    }

    // Buscar ciclo atualizado
    const { data: cicloAtualizado } = await supabase
      .from('ciclos_estudo')
      .select(`
        *,
        plano:planos_estudo (id, nome),
        ciclo_itens (
          *,
          disciplina:disciplinas (id, nome, icon, cor),
          assunto:assuntos (id, nome),
          subassunto:subassuntos (id, nome)
        )
      `)
      .eq('id', id)
      .single()

    return NextResponse.json(cicloAtualizado)
  } catch (error) {
    console.error('Erro na API de ciclos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir ciclo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const user_id = searchParams.get('user_id')

    if (!id || !user_id) {
      return NextResponse.json({ error: 'ID e user_id são obrigatórios' }, { status: 400 })
    }

    const { error } = await supabase
      .from('ciclos_estudo')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)

    if (error) {
      console.error('Erro ao excluir ciclo:', error)
      return NextResponse.json({ error: 'Erro ao excluir ciclo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de ciclos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
