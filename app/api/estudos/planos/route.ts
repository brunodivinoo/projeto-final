import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Listar planos do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const ativo = searchParams.get('ativo')
    const id = searchParams.get('id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Buscar plano específico
    if (id) {
      const { data: plano, error } = await supabase
        .from('planos_estudo')
        .select(`
          *,
          plano_itens (
            *,
            disciplina:disciplinas (id, nome),
            assunto:assuntos (id, nome),
            subassunto:subassuntos (id, nome)
          ),
          plano_disponibilidade (*)
        `)
        .eq('id', id)
        .eq('user_id', user_id)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
      }

      return NextResponse.json(plano)
    }

    // Listar planos
    let query = supabase
      .from('planos_estudo')
      .select(`
        *,
        plano_itens (count)
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (ativo !== null) {
      query = query.eq('ativo', ativo === 'true')
    }

    const { data: planos, error } = await query

    if (error) {
      console.error('Erro ao buscar planos:', error)
      return NextResponse.json({ error: 'Erro ao buscar planos' }, { status: 500 })
    }

    return NextResponse.json(planos)
  } catch (error) {
    console.error('Erro na API de planos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar novo plano
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, nome, descricao, objetivo, data_inicio, data_fim, horas_semanais, ai_sugestoes, itens, disponibilidade } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Criar plano
    const { data: plano, error: planoError } = await supabase
      .from('planos_estudo')
      .insert({
        user_id,
        nome,
        descricao,
        objetivo,
        data_inicio,
        data_fim,
        horas_semanais: horas_semanais || 20,
        ai_sugestoes: ai_sugestoes !== false
      })
      .select()
      .single()

    if (planoError) {
      console.error('Erro ao criar plano:', planoError)
      return NextResponse.json({ error: 'Erro ao criar plano' }, { status: 500 })
    }

    // Inserir itens do plano
    if (itens && itens.length > 0) {
      const itensParaInserir = itens.map((item: Record<string, unknown>, index: number) => ({
        plano_id: plano.id,
        disciplina_id: item.disciplina_id,
        assunto_id: item.assunto_id || null,
        subassunto_id: item.subassunto_id || null,
        prioridade: item.prioridade || 3,
        dificuldade: item.dificuldade || 3,
        horas_meta: item.horas_meta || 10,
        ordem: index
      }))

      const { error: itensError } = await supabase
        .from('plano_itens')
        .insert(itensParaInserir)

      if (itensError) {
        console.error('Erro ao inserir itens:', itensError)
      }
    }

    // Inserir disponibilidade
    if (disponibilidade && disponibilidade.length > 0) {
      const dispParaInserir = disponibilidade.map((d: Record<string, unknown>) => ({
        plano_id: plano.id,
        dia_semana: d.dia_semana,
        periodo: d.periodo,
        disponivel: d.disponivel !== false,
        horas: d.horas || 3
      }))

      const { error: dispError } = await supabase
        .from('plano_disponibilidade')
        .insert(dispParaInserir)

      if (dispError) {
        console.error('Erro ao inserir disponibilidade:', dispError)
      }
    }

    // Buscar plano completo
    const { data: planoCompleto } = await supabase
      .from('planos_estudo')
      .select(`
        *,
        plano_itens (
          *,
          disciplina:disciplinas (id, nome),
          assunto:assuntos (id, nome),
          subassunto:subassuntos (id, nome)
        ),
        plano_disponibilidade (*)
      `)
      .eq('id', plano.id)
      .single()

    return NextResponse.json(planoCompleto, { status: 201 })
  } catch (error) {
    console.error('Erro na API de planos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT - Atualizar plano
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, user_id, nome, descricao, objetivo, data_inicio, data_fim, horas_semanais, ai_sugestoes, ativo, itens, disponibilidade } = body

    if (!id || !user_id) {
      return NextResponse.json({ error: 'ID e user_id são obrigatórios' }, { status: 400 })
    }

    // Verificar propriedade
    const { data: planoExistente } = await supabase
      .from('planos_estudo')
      .select('id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (!planoExistente) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Atualizar plano
    const updateData: Record<string, unknown> = {}
    if (nome !== undefined) updateData.nome = nome
    if (descricao !== undefined) updateData.descricao = descricao
    if (objetivo !== undefined) updateData.objetivo = objetivo
    if (data_inicio !== undefined) updateData.data_inicio = data_inicio
    if (data_fim !== undefined) updateData.data_fim = data_fim
    if (horas_semanais !== undefined) updateData.horas_semanais = horas_semanais
    if (ai_sugestoes !== undefined) updateData.ai_sugestoes = ai_sugestoes
    if (ativo !== undefined) updateData.ativo = ativo

    const { error: updateError } = await supabase
      .from('planos_estudo')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Erro ao atualizar plano:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar plano' }, { status: 500 })
    }

    // Atualizar itens se fornecidos
    if (itens !== undefined) {
      // Remover itens antigos
      await supabase
        .from('plano_itens')
        .delete()
        .eq('plano_id', id)

      // Inserir novos itens
      if (itens.length > 0) {
        const itensParaInserir = itens.map((item: Record<string, unknown>, index: number) => ({
          plano_id: id,
          disciplina_id: item.disciplina_id,
          assunto_id: item.assunto_id || null,
          subassunto_id: item.subassunto_id || null,
          prioridade: item.prioridade || 3,
          dificuldade: item.dificuldade || 3,
          horas_meta: item.horas_meta || 10,
          ordem: index
        }))

        await supabase.from('plano_itens').insert(itensParaInserir)
      }
    }

    // Atualizar disponibilidade se fornecida
    if (disponibilidade !== undefined) {
      await supabase
        .from('plano_disponibilidade')
        .delete()
        .eq('plano_id', id)

      if (disponibilidade.length > 0) {
        const dispParaInserir = disponibilidade.map((d: Record<string, unknown>) => ({
          plano_id: id,
          dia_semana: d.dia_semana,
          periodo: d.periodo,
          disponivel: d.disponivel !== false,
          horas: d.horas || 3
        }))

        await supabase.from('plano_disponibilidade').insert(dispParaInserir)
      }
    }

    // Buscar plano atualizado
    const { data: planoAtualizado } = await supabase
      .from('planos_estudo')
      .select(`
        *,
        plano_itens (
          *,
          disciplina:disciplinas (id, nome),
          assunto:assuntos (id, nome),
          subassunto:subassuntos (id, nome)
        ),
        plano_disponibilidade (*)
      `)
      .eq('id', id)
      .single()

    return NextResponse.json(planoAtualizado)
  } catch (error) {
    console.error('Erro na API de planos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir plano
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const user_id = searchParams.get('user_id')

    if (!id || !user_id) {
      return NextResponse.json({ error: 'ID e user_id são obrigatórios' }, { status: 400 })
    }

    // Verificar propriedade e deletar
    const { error } = await supabase
      .from('planos_estudo')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)

    if (error) {
      console.error('Erro ao excluir plano:', error)
      return NextResponse.json({ error: 'Erro ao excluir plano' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de planos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
