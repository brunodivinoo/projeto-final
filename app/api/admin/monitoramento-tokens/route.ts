// API Admin - Monitoramento de Tokens por Usuário
// Endpoint protegido por ADMIN_SECRET_KEY
// Retorna uso de tokens, custo e média por usuário

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('key') || request.headers.get('x-admin-key')

    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const mesReferencia = searchParams.get('mes') || new Date().toISOString().slice(0, 7)

    // 1. Buscar uso de TODOS os usuários no mês
    const { data: usoMes, error: usoError } = await supabase
      .from('uso_ia_med')
      .select('user_id, chats_usados, tokens_input, tokens_output, custo_estimado, resumos_usados, flashcards_usados, web_searches')
      .eq('mes_referencia', mesReferencia)
      .order('tokens_output', { ascending: false })

    if (usoError) {
      console.error('[Admin] Erro ao buscar uso:', usoError)
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
    }

    if (!usoMes || usoMes.length === 0) {
      return NextResponse.json({
        mes: mesReferencia,
        total_usuarios: 0,
        usuarios: [],
        resumo: {
          total_chats: 0,
          total_tokens_input: 0,
          total_tokens_output: 0,
          total_tokens: 0,
          custo_total_usd: 0,
          custo_total_brl: 0,
          media_tokens_por_chat: 0,
          media_custo_por_chat_brl: 0,
          media_custo_por_usuario_brl: 0
        }
      })
    }

    // 2. Buscar perfis dos usuários para nome/email
    const userIds = usoMes.map(u => u.user_id)
    const { data: profiles } = await supabase
      .from('profiles_med')
      .select('id, nome, plano, email')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // 3. Montar dados por usuário
    const usuarios = usoMes.map(uso => {
      const profile = profileMap.get(uso.user_id)
      const totalTokens = (uso.tokens_input || 0) + (uso.tokens_output || 0)
      const custoUSD = uso.custo_estimado || 0
      const custoBRL = custoUSD * 5.0
      const mediaPorChat = uso.chats_usados > 0 ? Math.round(totalTokens / uso.chats_usados) : 0
      const custoPorChatBRL = uso.chats_usados > 0 ? custoBRL / uso.chats_usados : 0

      return {
        user_id: uso.user_id,
        nome: profile?.nome || 'Sem nome',
        email: profile?.email || '',
        plano: profile?.plano || 'gratuito',
        chats: uso.chats_usados || 0,
        resumos: uso.resumos_usados || 0,
        flashcards: uso.flashcards_usados || 0,
        web_searches: uso.web_searches || 0,
        tokens_input: uso.tokens_input || 0,
        tokens_output: uso.tokens_output || 0,
        tokens_total: totalTokens,
        media_tokens_por_chat: mediaPorChat,
        custo_usd: parseFloat(custoUSD.toFixed(4)),
        custo_brl: parseFloat(custoBRL.toFixed(2)),
        custo_por_chat_brl: parseFloat(custoPorChatBRL.toFixed(4))
      }
    })

    // 4. Calcular resumo geral
    const totalChats = usuarios.reduce((s, u) => s + u.chats, 0)
    const totalInput = usuarios.reduce((s, u) => s + u.tokens_input, 0)
    const totalOutput = usuarios.reduce((s, u) => s + u.tokens_output, 0)
    const totalTokens = totalInput + totalOutput
    const custoTotalUSD = usuarios.reduce((s, u) => s + u.custo_usd, 0)
    const custoTotalBRL = custoTotalUSD * 5.0

    return NextResponse.json({
      mes: mesReferencia,
      total_usuarios: usuarios.length,
      usuarios,
      resumo: {
        total_chats: totalChats,
        total_tokens_input: totalInput,
        total_tokens_output: totalOutput,
        total_tokens: totalTokens,
        custo_total_usd: parseFloat(custoTotalUSD.toFixed(4)),
        custo_total_brl: parseFloat(custoTotalBRL.toFixed(2)),
        media_tokens_por_chat: totalChats > 0 ? Math.round(totalTokens / totalChats) : 0,
        media_custo_por_chat_brl: totalChats > 0 ? parseFloat((custoTotalBRL / totalChats).toFixed(4)) : 0,
        media_custo_por_usuario_brl: usuarios.length > 0 ? parseFloat((custoTotalBRL / usuarios.length).toFixed(2)) : 0
      }
    })

  } catch (error) {
    console.error('[Admin] Erro no monitoramento:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
