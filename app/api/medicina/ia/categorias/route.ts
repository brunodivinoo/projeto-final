import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Criar cliente Supabase com service role para bypass de RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar categorias do usuário
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('user_id')
  const tipo = searchParams.get('tipo') // disciplina, assunto, sub_assunto
  const parentId = searchParams.get('parent_id') // Para buscar assuntos de uma disciplina

  if (!userId) {
    return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
  }

  try {
    let query = supabase
      .from('categorias_questoes_ia_med')
      .select('*')
      .eq('user_id', userId)
      .order('nome', { ascending: true })

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    if (parentId) {
      query = query.eq('parent_id', parentId)
    } else if (tipo === 'disciplina') {
      // Disciplinas não têm parent
      query = query.is('parent_id', null)
    }

    const { data: categorias, error: catError } = await query

    if (catError) {
      // Se a tabela não existir, retornar vazio
      if (catError.code === '42P01') {
        return NextResponse.json({ categorias: [], bancas: [] })
      }
      throw catError
    }

    // Buscar bancas também
    const { data: bancas, error: bancasError } = await supabase
      .from('bancas_questoes_ia_med')
      .select('*')
      .eq('user_id', userId)
      .order('nome', { ascending: true })

    if (bancasError && bancasError.code !== '42P01') {
      throw bancasError
    }

    return NextResponse.json({
      categorias: categorias || [],
      bancas: bancas || []
    })
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
  }
}

// POST - Adicionar categoria ou banca (evitando duplicatas)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, tipo, nome, parent_id, is_banca } = body

    if (!user_id || !nome) {
      return NextResponse.json({ error: 'user_id e nome são obrigatórios' }, { status: 400 })
    }

    // Se é banca
    if (is_banca) {
      // Verificar se já existe
      const { data: existente } = await supabase
        .from('bancas_questoes_ia_med')
        .select('id')
        .eq('user_id', user_id)
        .eq('nome', nome.trim())
        .single()

      if (existente) {
        return NextResponse.json({ success: true, data: existente, exists: true })
      }

      const { data, error } = await supabase
        .from('bancas_questoes_ia_med')
        .insert({ user_id, nome: nome.trim() })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Violação de unique
          return NextResponse.json({ success: true, exists: true })
        }
        throw error
      }

      return NextResponse.json({ success: true, data, novo: true })
    }

    // Se é categoria
    if (!tipo) {
      return NextResponse.json({ error: 'tipo é obrigatório para categorias' }, { status: 400 })
    }

    // Verificar se já existe
    let checkQuery = supabase
      .from('categorias_questoes_ia_med')
      .select('id')
      .eq('user_id', user_id)
      .eq('tipo', tipo)
      .eq('nome', nome.trim())

    if (parent_id) {
      checkQuery = checkQuery.eq('parent_id', parent_id)
    } else {
      checkQuery = checkQuery.is('parent_id', null)
    }

    const { data: existente } = await checkQuery.single()

    if (existente) {
      return NextResponse.json({ success: true, data: existente, exists: true })
    }

    const insertData: Record<string, unknown> = {
      user_id,
      tipo,
      nome: nome.trim()
    }

    if (parent_id) {
      insertData.parent_id = parent_id
    }

    const { data, error } = await supabase
      .from('categorias_questoes_ia_med')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Violação de unique
        return NextResponse.json({ success: true, exists: true })
      }
      throw error
    }

    return NextResponse.json({ success: true, data, novo: true })
  } catch (error) {
    console.error('Erro ao salvar categoria:', error)
    return NextResponse.json({ error: 'Erro ao salvar categoria' }, { status: 500 })
  }
}

// Endpoint para salvar múltiplas categorias de uma vez (para extrair da questão)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, disciplina, assunto, sub_assunto, banca } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const resultados: Record<string, unknown> = {}

    // Salvar disciplina
    if (disciplina) {
      const { data: discData } = await supabase
        .from('categorias_questoes_ia_med')
        .upsert(
          { user_id, tipo: 'disciplina', nome: disciplina.trim(), parent_id: null },
          { onConflict: 'user_id,tipo,nome,parent_id', ignoreDuplicates: true }
        )
        .select()
        .single()

      resultados.disciplina = discData

      // Se temos disciplina e assunto, salvar assunto vinculado
      if (assunto && discData) {
        const { data: assuntoData } = await supabase
          .from('categorias_questoes_ia_med')
          .upsert(
            { user_id, tipo: 'assunto', nome: assunto.trim(), parent_id: discData.id },
            { onConflict: 'user_id,tipo,nome,parent_id', ignoreDuplicates: true }
          )
          .select()
          .single()

        resultados.assunto = assuntoData

        // Se temos assunto e sub_assunto, salvar sub_assunto vinculado
        if (sub_assunto && assuntoData) {
          const { data: subData } = await supabase
            .from('categorias_questoes_ia_med')
            .upsert(
              { user_id, tipo: 'sub_assunto', nome: sub_assunto.trim(), parent_id: assuntoData.id },
              { onConflict: 'user_id,tipo,nome,parent_id', ignoreDuplicates: true }
            )
            .select()
            .single()

          resultados.sub_assunto = subData
        }
      }
    }

    // Salvar banca
    if (banca) {
      await supabase
        .from('bancas_questoes_ia_med')
        .upsert(
          { user_id, nome: banca.trim() },
          { onConflict: 'user_id,nome', ignoreDuplicates: true }
        )
        .select()
        .single()

      resultados.banca = banca
    }

    return NextResponse.json({ success: true, resultados })
  } catch (error) {
    console.error('Erro ao salvar categorias em lote:', error)
    return NextResponse.json({ error: 'Erro ao salvar categorias' }, { status: 500 })
  }
}
