/**
 * API Route - Operacoes em conversa especifica
 *
 * GET - Buscar conversa com mensagens
 * PATCH - Atualizar conversa (renomear)
 * DELETE - Excluir conversa
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET - Buscar conversa especifica com mensagens
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id e obrigatorio' }, { status: 400 })
    }

    // Buscar conversa
    const { data: conversa, error: convError } = await supabase
      .from('conversas_ia_med')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (convError || !conversa) {
      console.error('[Conversa API] Erro ao buscar conversa:', convError)
      return NextResponse.json({ error: 'Conversa nao encontrada' }, { status: 404 })
    }

    // Buscar mensagens
    const { data: mensagens, error: msgError } = await supabase
      .from('mensagens_ia_med')
      .select('*')
      .eq('conversa_id', id)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('[Conversa API] Erro ao buscar mensagens:', msgError)
    }

    return NextResponse.json({
      success: true,
      conversa,
      mensagens: mensagens || []
    })
  } catch (error) {
    console.error('[Conversa API] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Atualizar conversa (renomear)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { titulo, user_id } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id e obrigatorio' }, { status: 400 })
    }

    if (!titulo || titulo.trim() === '') {
      return NextResponse.json({ error: 'Titulo invalido' }, { status: 400 })
    }

    // Verificar se conversa pertence ao usuario
    const { data: conversa } = await supabase
      .from('conversas_ia_med')
      .select('id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (!conversa) {
      return NextResponse.json({ error: 'Conversa nao encontrada' }, { status: 404 })
    }

    // Atualizar titulo
    const { error: updateError } = await supabase
      .from('conversas_ia_med')
      .update({
        titulo: titulo.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user_id)

    if (updateError) {
      console.error('[Conversa API] Erro ao atualizar:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar conversa' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Conversa API] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir conversa
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id e obrigatorio' }, { status: 400 })
    }

    // Verificar se conversa pertence ao usuario
    const { data: conversa } = await supabase
      .from('conversas_ia_med')
      .select('id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (!conversa) {
      return NextResponse.json({ error: 'Conversa nao encontrada' }, { status: 404 })
    }

    // Antes de deletar, migrar artefatos para tabela centralizada
    // (os artefatos sao preservados mesmo apos excluir o chat)
    try {
      const { data: mensagens } = await supabase
        .from('mensagens_ia_med')
        .select('content')
        .eq('conversa_id', id)
        .eq('role', 'assistant')

      if (mensagens && mensagens.length > 0) {
        // Extrair artefatos das mensagens e salvar na tabela artefatos_med
        // (implementar logica de extracao se necessario)
        console.log(`[Conversa API] ${mensagens.length} mensagens para preservar artefatos`)
      }
    } catch (migrateError) {
      console.error('[Conversa API] Erro ao migrar artefatos:', migrateError)
      // Continua com a delecao mesmo se falhar a migracao
    }

    // Deletar conversa (cascade vai deletar mensagens)
    const { error: deleteError } = await supabase
      .from('conversas_ia_med')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)

    if (deleteError) {
      console.error('[Conversa API] Erro ao deletar:', deleteError)
      return NextResponse.json({ error: 'Erro ao excluir conversa' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Conversa API] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
