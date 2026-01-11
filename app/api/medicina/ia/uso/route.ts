// API Route - Uso e Estatísticas de IA PREPARAMED

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PlanoIA, LIMITES_IA } from '@/lib/ai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ==========================================
// GET - Obter Estatísticas de Uso
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const periodo = searchParams.get('periodo') || 'mes' // mes, semana, total

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Buscar plano do usuário
    const { data: profile } = await supabase
      .from('profiles_med')
      .select('plano')
      .eq('id', user_id)
      .single()

    const plano = (profile?.plano || 'gratuito') as PlanoIA
    const limites = LIMITES_IA[plano]

    // Buscar uso do mês atual
    const mesAtual = new Date().toISOString().slice(0, 7)
    const { data: usoMes } = await supabase
      .from('uso_ia_med')
      .select('*')
      .eq('user_id', user_id)
      .eq('mes_referencia', mesAtual)
      .single()

    // Estatísticas de uso
    const estatisticas = {
      plano,
      limites: {
        chats: limites.chats_mes,
        resumos: limites.resumos_mes,
        flashcards: limites.flashcards_mes,
        imagens: limites.imagens_mes,
        web_search: limites.web_search,
        vision: limites.vision,
        pdf_support: limites.pdf_support,
        extended_thinking: limites.extended_thinking
      },
      uso_mes: {
        chats: usoMes?.chats_usados || 0,
        resumos: usoMes?.resumos_usados || 0,
        flashcards: usoMes?.flashcards_usados || 0,
        imagens: usoMes?.imagens_geradas || 0,
        web_searches: usoMes?.web_searches || 0,
        pdfs: usoMes?.pdfs_analisados || 0,
        imagens_analisadas: usoMes?.imagens_analisadas || 0,
        tokens_input: usoMes?.tokens_input || 0,
        tokens_output: usoMes?.tokens_output || 0,
        custo_estimado: usoMes?.custo_estimado || 0
      },
      percentuais: {
        chats: limites.chats_mes === -1 ? 0 : Math.round(((usoMes?.chats_usados || 0) / limites.chats_mes) * 100),
        resumos: limites.resumos_mes === -1 ? 0 : Math.round(((usoMes?.resumos_usados || 0) / limites.resumos_mes) * 100),
        flashcards: limites.flashcards_mes === -1 ? 0 : Math.round(((usoMes?.flashcards_usados || 0) / limites.flashcards_mes) * 100),
        imagens: limites.imagens_mes === -1 ? 0 : Math.round(((usoMes?.imagens_geradas || 0) / limites.imagens_mes) * 100)
      }
    }

    // Se período for total, buscar histórico completo
    if (periodo === 'total') {
      const { data: usoTotal } = await supabase
        .from('uso_ia_med')
        .select('*')
        .eq('user_id', user_id)
        .order('mes_referencia', { ascending: false })

      const totais = usoTotal?.reduce((acc, mes) => ({
        chats: acc.chats + (mes.chats_usados || 0),
        resumos: acc.resumos + (mes.resumos_usados || 0),
        flashcards: acc.flashcards + (mes.flashcards_usados || 0),
        imagens: acc.imagens + (mes.imagens_geradas || 0),
        tokens_input: acc.tokens_input + (mes.tokens_input || 0),
        tokens_output: acc.tokens_output + (mes.tokens_output || 0),
        custo_estimado: acc.custo_estimado + (mes.custo_estimado || 0)
      }), { chats: 0, resumos: 0, flashcards: 0, imagens: 0, tokens_input: 0, tokens_output: 0, custo_estimado: 0 })

      return NextResponse.json({
        ...estatisticas,
        uso_total: totais,
        historico: usoTotal
      })
    }

    // Buscar estatísticas de conversas
    const { data: conversas, count: totalConversas } = await supabase
      .from('conversas_ia_med')
      .select('id, titulo, tokens_usados, created_at', { count: 'exact' })
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Buscar estatísticas de flashcards
    const { count: totalFlashcards } = await supabase
      .from('flashcards_ia_med')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)

    const { count: flashcardsPendentes } = await supabase
      .from('flashcards_ia_med')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .or(`proxima_revisao.is.null,proxima_revisao.lte.${new Date().toISOString()}`)

    // Buscar estatísticas de resumos
    const { count: totalResumos } = await supabase
      .from('resumos_ia_med')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)

    return NextResponse.json({
      ...estatisticas,
      conteudo: {
        conversas: {
          total: totalConversas || 0,
          recentes: conversas || []
        },
        flashcards: {
          total: totalFlashcards || 0,
          pendentes_revisao: flashcardsPendentes || 0
        },
        resumos: {
          total: totalResumos || 0
        }
      },
      mes_referencia: mesAtual
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ==========================================
// POST - Resetar Uso (Admin)
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, admin_key, campo } = body

    // Verificar chave admin
    if (admin_key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const mesAtual = new Date().toISOString().slice(0, 7)

    if (campo) {
      // Resetar campo específico
      await supabase
        .from('uso_ia_med')
        .update({ [campo]: 0 })
        .eq('user_id', user_id)
        .eq('mes_referencia', mesAtual)
    } else {
      // Resetar tudo
      await supabase
        .from('uso_ia_med')
        .update({
          chats_usados: 0,
          resumos_usados: 0,
          flashcards_usados: 0,
          imagens_geradas: 0,
          web_searches: 0,
          pdfs_analisados: 0,
          imagens_analisadas: 0,
          tokens_input: 0,
          tokens_output: 0,
          custo_estimado: 0
        })
        .eq('user_id', user_id)
        .eq('mes_referencia', mesAtual)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao resetar uso:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
