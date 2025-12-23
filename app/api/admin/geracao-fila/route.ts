import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar status da fila do usuário
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 })
    }

    // Buscar itens pendentes/processando do usuário
    const { data, error } = await supabase
      .from('geracao_fila')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pendente', 'processando'])
      .order('created_at', { ascending: true })

    if (error) throw error

    // Calcular totais
    const totais = {
      pendentes: data?.filter(d => d.status === 'pendente').length || 0,
      processando: data?.filter(d => d.status === 'processando').length || 0,
      totalQuestoes: data?.reduce((acc, d) => acc + d.quantidade, 0) || 0,
      geradas: data?.reduce((acc, d) => acc + d.geradas, 0) || 0,
      erros: data?.reduce((acc, d) => acc + d.erros, 0) || 0
    }

    return NextResponse.json({ fila: data || [], totais })
  } catch (error) {
    console.error('Erro ao buscar fila:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Adicionar itens à fila
export async function POST(req: NextRequest) {
  try {
    const { user_id, itens } = await req.json() as {
      user_id: string
      itens: Array<{
        disciplina: string
        assunto?: string
        subassunto?: string
        banca: string
        modalidade: string
        dificuldade: string
        quantidade: number
      }>
    }

    if (!user_id || !itens || itens.length === 0) {
      return NextResponse.json({ error: 'user_id e itens são obrigatórios' }, { status: 400 })
    }

    // Inserir todos os itens na fila
    const itensParaInserir = itens.map(item => ({
      user_id,
      status: 'pendente',
      disciplina: item.disciplina,
      assunto: item.assunto || null,
      subassunto: item.subassunto || null,
      banca: item.banca,
      modalidade: item.modalidade,
      dificuldade: item.dificuldade,
      quantidade: item.quantidade,
      geradas: 0,
      erros: 0
    }))

    const { data, error } = await supabase
      .from('geracao_fila')
      .insert(itensParaInserir)
      .select()

    if (error) throw error

    return NextResponse.json({
      sucesso: true,
      inseridos: data?.length || 0,
      ids: data?.map(d => d.id) || []
    })
  } catch (error) {
    console.error('Erro ao adicionar à fila:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Cancelar itens da fila
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    const itemId = searchParams.get('item_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 })
    }

    if (itemId) {
      // Cancelar item específico
      const { error } = await supabase
        .from('geracao_fila')
        .update({ status: 'cancelado', completed_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('user_id', userId)
        .in('status', ['pendente', 'processando'])

      if (error) throw error
    } else {
      // Cancelar todos pendentes do usuário
      const { error } = await supabase
        .from('geracao_fila')
        .update({ status: 'cancelado', completed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('status', ['pendente', 'processando'])

      if (error) throw error
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao cancelar fila:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
