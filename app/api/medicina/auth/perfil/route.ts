import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar perfil do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles_med')
      .select('*')
      .eq('id', user_id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erro ao buscar perfil:', profileError)
      return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
    }

    // Buscar assinatura ativa
    const { data: assinatura } = await supabase
      .from('assinaturas_med')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'ativa')
      .single()

    // Buscar limites de uso do mês atual
    const mesAtual = new Date().toISOString().slice(0, 7)
    const { data: limites } = await supabase
      .from('limites_uso_med')
      .select('*')
      .eq('user_id', user_id)
      .eq('mes_referencia', mesAtual)
      .single()

    return NextResponse.json({
      profile: profile || null,
      assinatura: assinatura || null,
      limites: limites || null
    })
  } catch (error) {
    console.error('Erro na API de perfil:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT - Atualizar perfil
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, userId, nome, faculdade, ano_curso, periodo_curso, estado, cidade, avatar_url } = body

    const finalUserId = user_id || userId

    if (!finalUserId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (nome !== undefined) updates.nome = nome
    if (faculdade !== undefined) updates.faculdade = faculdade
    // Suporta tanto periodo_curso quanto ano_curso para retrocompatibilidade
    if (periodo_curso !== undefined) updates.periodo_curso = periodo_curso
    if (ano_curso !== undefined) updates.ano_curso = ano_curso
    if (estado !== undefined) updates.estado = estado
    if (cidade !== undefined) updates.cidade = cidade
    if (avatar_url !== undefined) updates.avatar_url = avatar_url

    const { data: profile, error } = await supabase
      .from('profiles_med')
      .update(updates)
      .eq('id', finalUserId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar perfil:', error)
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Erro na API de perfil:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar perfil (se não existir)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, nome, email, faculdade, ano_curso, periodo_curso, estado, cidade } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Verificar se já existe
    const { data: existente } = await supabase
      .from('profiles_med')
      .select('id')
      .eq('id', user_id)
      .single()

    if (existente) {
      return NextResponse.json({ error: 'Perfil já existe', profile: existente }, { status: 409 })
    }

    // Criar perfil
    const { data: profile, error } = await supabase
      .from('profiles_med')
      .insert({
        id: user_id,
        nome: nome || 'Estudante',
        email,
        faculdade,
        periodo_curso: periodo_curso || ano_curso,
        estado,
        cidade,
        plano: 'gratuito'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar perfil:', error)
      return NextResponse.json({ error: 'Erro ao criar perfil' }, { status: 500 })
    }

    // Criar limites de uso
    const mesAtual = new Date().toISOString().slice(0, 7)
    await supabase
      .from('limites_uso_med')
      .insert({
        user_id,
        mes_referencia: mesAtual,
        questoes_dia: 0,
        data_questoes: new Date().toISOString().split('T')[0],
        simulados_mes: 0,
        perguntas_ia_mes: 0,
        resumos_ia_mes: 0,
        flashcards_ia_mes: 0,
        anotacoes_total: 0
      })

    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    console.error('Erro na API de perfil:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
