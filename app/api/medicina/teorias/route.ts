import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Listar teorias
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const disciplinaId = searchParams.get('disciplinaId')
    const assuntoId = searchParams.get('assuntoId')
    const busca = searchParams.get('busca')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('teorias_med')
      .select(`
        id,
        titulo,
        subtitulo,
        tempo_leitura_minutos,
        nivel_dificuldade,
        pontos_chave,
        created_at,
        disciplina:disciplinas_med(id, nome),
        assunto:assuntos_med(id, nome),
        subassunto:subassuntos_med(id, nome)
      `, { count: 'exact' })

    if (disciplinaId) {
      query = query.eq('disciplina_id', disciplinaId)
    }

    if (assuntoId) {
      query = query.eq('assunto_id', assuntoId)
    }

    if (busca) {
      query = query.or(`titulo.ilike.%${busca}%,subtitulo.ilike.%${busca}%`)
    }

    query = query
      .order('disciplina_id')
      .order('assunto_id')
      .order('titulo')
      .range(offset, offset + limit - 1)

    const { data: teorias, error, count } = await query

    if (error) throw error

    // Buscar progresso do usuário
    const progresso: Record<string, { teoria_id: string; percentual_lido: number; ultima_leitura: string }> = {}
    if (userId && teorias && teorias.length > 0) {
      const teoriaIds = teorias.map(t => t.id)

      const { data: progressoData } = await supabase
        .from('progresso_leitura_med')
        .select('*')
        .eq('user_id', userId)
        .in('teoria_id', teoriaIds)

      if (progressoData) {
        progressoData.forEach(p => {
          progresso[p.teoria_id] = p
        })
      }
    }

    // Combinar teorias com progresso
    const teoriasComProgresso = teorias?.map(t => ({
      ...t,
      progresso: progresso[t.id] || null
    })) || []

    return NextResponse.json({
      teorias: teoriasComProgresso,
      total: count || 0
    })

  } catch (error) {
    console.error('Erro ao buscar teorias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar teorias' },
      { status: 500 }
    )
  }
}

// POST - Atualizar progresso de leitura
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, teoriaId, nivelLido, lido, favorito } = body

    if (!userId || !teoriaId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Verificar se já existe progresso
    const { data: existente } = await supabase
      .from('progresso_leitura_med')
      .select('*')
      .eq('user_id', userId)
      .eq('teoria_id', teoriaId)
      .single()

    const dados: Record<string, string | boolean> = {
      ultima_leitura: new Date().toISOString()
    }

    if (nivelLido !== undefined) dados.nivel_lido = nivelLido
    if (lido !== undefined) dados.lido = lido
    if (favorito !== undefined) dados.favorito = favorito

    let result
    if (existente) {
      const { data, error } = await supabase
        .from('progresso_leitura_med')
        .update(dados)
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('progresso_leitura_med')
        .insert({
          user_id: userId,
          teoria_id: teoriaId,
          ...dados
        })
        .select()
        .single()

      if (error) throw error
      result = data

      // Atualizar estudo diário
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
            teorias_lidas: estudoHoje.teorias_lidas + 1
          })
          .eq('id', estudoHoje.id)
      } else {
        await supabase
          .from('estudo_diario_med')
          .insert({
            user_id: userId,
            data: hoje,
            teorias_lidas: 1
          })
      }
    }

    return NextResponse.json({ progresso: result })

  } catch (error) {
    console.error('Erro ao atualizar progresso:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar progresso' },
      { status: 500 }
    )
  }
}
