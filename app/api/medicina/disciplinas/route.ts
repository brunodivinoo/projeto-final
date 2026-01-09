import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Listar disciplinas, assuntos ou subassuntos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'disciplinas'
    const disciplina_id = searchParams.get('disciplina_id')
    const assunto_id = searchParams.get('assunto_id')
    const busca = searchParams.get('busca')

    if (tipo === 'disciplinas') {
      let query = supabase
        .from('disciplinas_med')
        .select('id, nome, nome_normalizado, icone, cor, ordem')
        .eq('ativo', true)
        .order('ordem')

      if (busca) {
        query = query.ilike('nome', `%${busca}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar disciplinas:', error)
        return NextResponse.json({ error: 'Erro ao buscar disciplinas' }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    if (tipo === 'assuntos') {
      if (!disciplina_id) {
        return NextResponse.json({ error: 'disciplina_id é obrigatório' }, { status: 400 })
      }

      let query = supabase
        .from('assuntos_med')
        .select('id, nome, nome_normalizado, disciplina_id, ordem')
        .eq('disciplina_id', disciplina_id)
        .order('ordem')

      if (busca) {
        query = query.ilike('nome', `%${busca}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar assuntos:', error)
        return NextResponse.json({ error: 'Erro ao buscar assuntos' }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    if (tipo === 'subassuntos') {
      if (!assunto_id) {
        return NextResponse.json({ error: 'assunto_id é obrigatório' }, { status: 400 })
      }

      let query = supabase
        .from('subassuntos_med')
        .select('id, nome, nome_normalizado, assunto_id')
        .eq('assunto_id', assunto_id)
        .order('nome')

      if (busca) {
        query = query.ilike('nome', `%${busca}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar subassuntos:', error)
        return NextResponse.json({ error: 'Erro ao buscar subassuntos' }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  } catch (error) {
    console.error('Erro na API de disciplinas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar nova disciplina, assunto ou subassunto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, nome, disciplina_id, assunto_id } = body

    if (!nome || !tipo) {
      return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 })
    }

    const nomeNormalizado = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, '_')

    if (tipo === 'disciplina') {
      const { data: existente } = await supabase
        .from('disciplinas_med')
        .select('id, nome')
        .eq('nome_normalizado', nomeNormalizado)
        .single()

      if (existente) {
        return NextResponse.json({
          error: 'Disciplina já existe',
          existente
        }, { status: 409 })
      }

      const { data, error } = await supabase
        .from('disciplinas_med')
        .insert({
          nome: nome.trim(),
          nome_normalizado: nomeNormalizado,
          ordem: 100 // Nova disciplina vai para o final
        })
        .select('id, nome, nome_normalizado, icone, cor, ordem')
        .single()

      if (error) {
        console.error('Erro ao criar disciplina:', error)
        return NextResponse.json({ error: 'Erro ao criar disciplina' }, { status: 500 })
      }

      return NextResponse.json(data, { status: 201 })
    }

    if (tipo === 'assunto') {
      if (!disciplina_id) {
        return NextResponse.json({ error: 'disciplina_id é obrigatório' }, { status: 400 })
      }

      const { data: existente } = await supabase
        .from('assuntos_med')
        .select('id, nome')
        .eq('disciplina_id', disciplina_id)
        .eq('nome_normalizado', nomeNormalizado)
        .single()

      if (existente) {
        return NextResponse.json({
          error: 'Assunto já existe nesta disciplina',
          existente
        }, { status: 409 })
      }

      const { data, error } = await supabase
        .from('assuntos_med')
        .insert({
          disciplina_id,
          nome: nome.trim(),
          nome_normalizado: nomeNormalizado,
          ordem: 100
        })
        .select('id, nome, nome_normalizado, disciplina_id, ordem')
        .single()

      if (error) {
        console.error('Erro ao criar assunto:', error)
        return NextResponse.json({ error: 'Erro ao criar assunto' }, { status: 500 })
      }

      return NextResponse.json(data, { status: 201 })
    }

    if (tipo === 'subassunto') {
      if (!assunto_id) {
        return NextResponse.json({ error: 'assunto_id é obrigatório' }, { status: 400 })
      }

      const { data: existente } = await supabase
        .from('subassuntos_med')
        .select('id, nome')
        .eq('assunto_id', assunto_id)
        .eq('nome_normalizado', nomeNormalizado)
        .single()

      if (existente) {
        return NextResponse.json({
          error: 'Subassunto já existe neste assunto',
          existente
        }, { status: 409 })
      }

      const { data, error } = await supabase
        .from('subassuntos_med')
        .insert({
          assunto_id,
          nome: nome.trim(),
          nome_normalizado: nomeNormalizado
        })
        .select('id, nome, nome_normalizado, assunto_id')
        .single()

      if (error) {
        console.error('Erro ao criar subassunto:', error)
        return NextResponse.json({ error: 'Erro ao criar subassunto' }, { status: 500 })
      }

      return NextResponse.json(data, { status: 201 })
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  } catch (error) {
    console.error('Erro na API de disciplinas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
