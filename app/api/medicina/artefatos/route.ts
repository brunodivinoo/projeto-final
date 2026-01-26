/**
 * API Route - Artefatos Centralizados
 *
 * Gerencia todos os artefatos de estudo (questoes, flashcards, simulados, etc.)
 * Os artefatos persistem mesmo se o chat for excluido.
 *
 * POST - Criar novo artefato
 * GET - Listar artefatos com filtros
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tipos de artefatos validos
const TIPOS_VALIDOS = [
  'questao',
  'flashcard',
  'flashcard_deck',
  'simulado',
  'plano_estudo',
  'resumo',
  'mapa_mental',
  'caso_clinico',
  'imagem_anatomica',
  'anotacao'
] as const

type TipoArtefato = typeof TIPOS_VALIDOS[number]

// POST - Criar novo artefato
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      tipo,
      titulo,
      descricao,
      disciplina,
      topico,
      subtopico,
      tags,
      conteudo,
      conversa_id
    } = body

    // Validar campos obrigatorios
    if (!user_id) {
      return NextResponse.json({ error: 'user_id e obrigatorio' }, { status: 400 })
    }

    if (!tipo || !TIPOS_VALIDOS.includes(tipo as TipoArtefato)) {
      return NextResponse.json({
        error: `Tipo invalido. Valores validos: ${TIPOS_VALIDOS.join(', ')}`
      }, { status: 400 })
    }

    if (!titulo || titulo.trim() === '') {
      return NextResponse.json({ error: 'Titulo e obrigatorio' }, { status: 400 })
    }

    if (!conteudo) {
      return NextResponse.json({ error: 'Conteudo e obrigatorio' }, { status: 400 })
    }

    // Inserir artefato
    const { data, error } = await supabase
      .from('artefatos_med')
      .insert({
        user_id,
        conversa_id: conversa_id || null,
        tipo,
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        disciplina: disciplina?.trim() || null,
        topico: topico?.trim() || null,
        subtopico: subtopico?.trim() || null,
        tags: tags || [],
        conteudo,
        status: 'ativo',
        progresso: 0,
        vezes_respondido: 0,
        vezes_acertou: 0
      })
      .select()
      .single()

    if (error) {
      console.error('[Artefatos API] Erro ao criar:', error)
      return NextResponse.json({ error: 'Erro ao criar artefato' }, { status: 500 })
    }

    // Atualizar aprendizado do usuario
    if (topico || disciplina) {
      try {
        await supabase.rpc('atualizar_aprendizado_med', {
          p_user_id: user_id,
          p_disciplina: disciplina || 'Geral',
          p_topico: topico || titulo,
          p_termo_pesquisado: null
        })
      } catch (learnError) {
        console.error('[Artefatos API] Erro ao atualizar aprendizado:', learnError)
      }
    }

    return NextResponse.json({ success: true, artefato: data })
  } catch (error) {
    console.error('[Artefatos API] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET - Listar artefatos com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const tipo = searchParams.get('tipo')
    const disciplina = searchParams.get('disciplina')
    const status = searchParams.get('status')
    const busca = searchParams.get('busca')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const ordenar = searchParams.get('ordenar') || 'created_at'
    const ordem = searchParams.get('ordem') || 'desc'

    if (!user_id) {
      return NextResponse.json({ error: 'user_id e obrigatorio' }, { status: 400 })
    }

    // Construir query
    let query = supabase
      .from('artefatos_med')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)

    // Aplicar filtros
    if (tipo && TIPOS_VALIDOS.includes(tipo as TipoArtefato)) {
      query = query.eq('tipo', tipo)
    }

    if (disciplina) {
      query = query.eq('disciplina', disciplina)
    }

    if (status) {
      query = query.eq('status', status)
    } else {
      // Por padrao, nao mostrar arquivados
      query = query.neq('status', 'arquivado')
    }

    if (busca) {
      query = query.or(`titulo.ilike.%${busca}%,topico.ilike.%${busca}%,descricao.ilike.%${busca}%`)
    }

    // Ordenacao
    const validOrdenacao = ['created_at', 'updated_at', 'titulo', 'progresso', 'vezes_respondido', 'proxima_revisao']
    if (validOrdenacao.includes(ordenar)) {
      query = query.order(ordenar, { ascending: ordem === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Paginacao
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[Artefatos API] Erro ao buscar:', error)
      return NextResponse.json({ error: 'Erro ao buscar artefatos' }, { status: 500 })
    }

    // Buscar estatisticas agregadas
    const { data: stats } = await supabase
      .from('artefatos_med')
      .select('tipo')
      .eq('user_id', user_id)
      .neq('status', 'arquivado')

    const estatisticas = {
      total: count || 0,
      porTipo: {} as Record<string, number>
    }

    if (stats) {
      stats.forEach(s => {
        estatisticas.porTipo[s.tipo] = (estatisticas.porTipo[s.tipo] || 0) + 1
      })
    }

    return NextResponse.json({
      success: true,
      artefatos: data || [],
      total: count || 0,
      estatisticas
    })
  } catch (error) {
    console.error('[Artefatos API] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Atualizar artefato
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      user_id,
      titulo,
      descricao,
      status,
      progresso,
      vezes_respondido,
      vezes_acertou,
      proxima_revisao,
      intervalo_dias,
      facilidade
    } = body

    if (!id || !user_id) {
      return NextResponse.json({ error: 'id e user_id sao obrigatorios' }, { status: 400 })
    }

    // Verificar se artefato pertence ao usuario
    const { data: artefato } = await supabase
      .from('artefatos_med')
      .select('id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (!artefato) {
      return NextResponse.json({ error: 'Artefato nao encontrado' }, { status: 404 })
    }

    // Preparar campos para atualizar
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (titulo !== undefined) updates.titulo = titulo.trim()
    if (descricao !== undefined) updates.descricao = descricao?.trim() || null
    if (status !== undefined) updates.status = status
    if (progresso !== undefined) updates.progresso = progresso
    if (vezes_respondido !== undefined) {
      updates.vezes_respondido = vezes_respondido
      updates.ultima_resposta = new Date().toISOString()
    }
    if (vezes_acertou !== undefined) updates.vezes_acertou = vezes_acertou
    if (proxima_revisao !== undefined) updates.proxima_revisao = proxima_revisao
    if (intervalo_dias !== undefined) updates.intervalo_dias = intervalo_dias
    if (facilidade !== undefined) updates.facilidade = facilidade

    const { error: updateError } = await supabase
      .from('artefatos_med')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user_id)

    if (updateError) {
      console.error('[Artefatos API] Erro ao atualizar:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar artefato' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Artefatos API] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir artefato (soft delete - arquivar)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const user_id = searchParams.get('user_id')
    const hard = searchParams.get('hard') === 'true' // Para exclusao permanente

    if (!id || !user_id) {
      return NextResponse.json({ error: 'id e user_id sao obrigatorios' }, { status: 400 })
    }

    // Verificar se artefato pertence ao usuario
    const { data: artefato } = await supabase
      .from('artefatos_med')
      .select('id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (!artefato) {
      return NextResponse.json({ error: 'Artefato nao encontrado' }, { status: 404 })
    }

    if (hard) {
      // Exclusao permanente
      const { error: deleteError } = await supabase
        .from('artefatos_med')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id)

      if (deleteError) {
        console.error('[Artefatos API] Erro ao deletar:', deleteError)
        return NextResponse.json({ error: 'Erro ao excluir artefato' }, { status: 500 })
      }
    } else {
      // Soft delete - apenas arquivar
      const { error: archiveError } = await supabase
        .from('artefatos_med')
        .update({
          status: 'arquivado',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user_id)

      if (archiveError) {
        console.error('[Artefatos API] Erro ao arquivar:', archiveError)
        return NextResponse.json({ error: 'Erro ao arquivar artefato' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Artefatos API] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
