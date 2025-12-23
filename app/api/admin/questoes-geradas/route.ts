import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar questões geradas por IA
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const disciplina = searchParams.get('disciplina')
    const assunto = searchParams.get('assunto')
    const banca = searchParams.get('banca')
    const modalidade = searchParams.get('modalidade')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Construir query - questões geradas por IA têm id_original começando com "ia-admin-"
    let query = supabase
      .from('questoes')
      .select('*', { count: 'exact' })
      .like('id_original', 'ia-admin-%')
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (disciplina) {
      query = query.eq('disciplina', disciplina)
    }
    if (assunto) {
      query = query.eq('assunto', assunto)
    }
    if (banca) {
      query = query.ilike('banca', banca)
    }
    if (modalidade) {
      query = query.eq('modalidade', modalidade)
    }

    // Paginação
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    // Buscar filtros disponíveis (disciplinas únicas das questões geradas)
    const { data: disciplinasData } = await supabase
      .from('questoes')
      .select('disciplina')
      .like('id_original', 'ia-admin-%')
      .not('disciplina', 'is', null)

    const disciplinasUnicas = [...new Set(disciplinasData?.map(q => q.disciplina) || [])]
      .filter(Boolean)
      .sort()

    return NextResponse.json({
      questoes: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      filtrosDisponiveis: {
        disciplinas: disciplinasUnicas
      }
    })
  } catch (error) {
    console.error('Erro ao buscar questões geradas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Deletar questões geradas por IA
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const ids = searchParams.get('ids') // IDs separados por vírgula para deleção em massa

    if (!id && !ids) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    }

    if (ids) {
      // Deleção em massa
      const idsArray = ids.split(',').filter(Boolean)

      const { error, count } = await supabase
        .from('questoes')
        .delete()
        .in('id', idsArray)
        .like('id_original', 'ia-admin-%') // Segurança: só deleta questões geradas por IA

      if (error) throw error

      return NextResponse.json({
        sucesso: true,
        deletadas: count || idsArray.length
      })
    } else {
      // Deleção única
      const { error } = await supabase
        .from('questoes')
        .delete()
        .eq('id', id)
        .like('id_original', 'ia-admin-%') // Segurança: só deleta questões geradas por IA

      if (error) throw error

      return NextResponse.json({ sucesso: true })
    }
  } catch (error) {
    console.error('Erro ao deletar questão:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
