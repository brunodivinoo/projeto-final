import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// =============================================
// CRON JOB: RESET AUTOMÁTICO DE LIMITES
// =============================================
// Este endpoint deve ser chamado:
// - Diariamente à meia-noite para resetar limites diários
// - No primeiro dia do mês para resetar limites mensais
//
// Configure no vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/cron/reset-limites",
//       "schedule": "0 0 * * *"  // Todo dia à meia-noite UTC
//     }
//   ]
// }
// =============================================

// Função para criar cliente Supabase admin (lazy init)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    // Verificar autorização (Vercel Cron ou API key)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Vercel envia automaticamente o header em cron jobs
    // Ou podemos verificar uma API key
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Verificar se é um cron job do Vercel
      const vercelCron = request.headers.get('x-vercel-cron')
      if (!vercelCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0] // "2026-01-19"
    const mesAtual = hoje.toISOString().slice(0, 7) // "2026-01"
    const primeiroDiaMes = hoje.getDate() === 1

    console.log(`[Cron] Iniciando reset de limites - Data: ${hojeStr}, Mês: ${mesAtual}`)

    const resultados = {
      limites_diarios_resetados: 0,
      limites_mensais_resetados: 0,
      novos_registros_mensais: 0,
      erros: [] as string[]
    }

    // =============================================
    // 1. RESETAR LIMITES DIÁRIOS (questoes_dia)
    // =============================================
    const { data: limitesDesatualizados, error: fetchError } = await supabaseAdmin
      .from('limites_uso_med')
      .select('id, user_id, data_questoes')
      .neq('data_questoes', hojeStr)

    if (fetchError) {
      resultados.erros.push(`Erro ao buscar limites: ${fetchError.message}`)
    } else if (limitesDesatualizados && limitesDesatualizados.length > 0) {
      // Resetar questoes_dia para todos os usuários
      const { error: updateError, count } = await supabaseAdmin
        .from('limites_uso_med')
        .update({
          questoes_dia: 0,
          data_questoes: hojeStr
        })
        .neq('data_questoes', hojeStr)

      if (updateError) {
        resultados.erros.push(`Erro ao resetar diários: ${updateError.message}`)
      } else {
        resultados.limites_diarios_resetados = count || limitesDesatualizados.length
      }
    }

    // =============================================
    // 2. RESETAR/CRIAR LIMITES MENSAIS (no 1º dia do mês)
    // =============================================
    if (primeiroDiaMes) {
      // Buscar todos os usuários que não têm registro para o mês atual
      const { data: usuarios, error: usersError } = await supabaseAdmin
        .from('profiles_med')
        .select('id')

      if (usersError) {
        resultados.erros.push(`Erro ao buscar usuários: ${usersError.message}`)
      } else if (usuarios) {
        for (const usuario of usuarios) {
          // Verificar se já existe registro para este mês
          const { data: limiteExistente } = await supabaseAdmin
            .from('limites_uso_med')
            .select('id')
            .eq('user_id', usuario.id)
            .eq('mes_referencia', mesAtual)
            .single()

          if (!limiteExistente) {
            // Criar novo registro para o mês
            const { error: insertError } = await supabaseAdmin
              .from('limites_uso_med')
              .insert({
                user_id: usuario.id,
                mes_referencia: mesAtual,
                questoes_dia: 0,
                data_questoes: hojeStr,
                simulados_mes: 0,
                perguntas_ia_mes: 0,
                resumos_ia_mes: 0,
                flashcards_ia_mes: 0,
                casos_clinicos_mes: 0,
                anotacoes_total: 0
              })

            if (insertError) {
              resultados.erros.push(`Erro ao criar limites para ${usuario.id}: ${insertError.message}`)
            } else {
              resultados.novos_registros_mensais++
            }
          }
        }
      }
    }

    // =============================================
    // 3. TAMBÉM RESETAR LIMITES DO SISTEMA LEGACY
    // =============================================
    // Resetar uso_diario para o dia atual
    const { error: legacyDailyError } = await supabaseAdmin
      .from('uso_diario')
      .update({ quantidade: 0 })
      .neq('data', hojeStr)

    if (legacyDailyError) {
      // Tabela pode não existir, ignorar
      console.log('[Cron] Tabela uso_diario não encontrada ou vazia')
    }

    // No primeiro dia do mês, resetar uso_mensal
    if (primeiroDiaMes) {
      const { error: legacyMonthlyError } = await supabaseAdmin
        .from('uso_mensal')
        .update({ quantidade: 0 })
        .neq('mes_referencia', mesAtual)

      if (legacyMonthlyError) {
        console.log('[Cron] Tabela uso_mensal não encontrada ou vazia')
      }
    }

    console.log(`[Cron] Reset concluído:`, resultados)

    return NextResponse.json({
      success: true,
      data: hojeStr,
      mes: mesAtual,
      primeiro_dia_mes: primeiroDiaMes,
      resultados
    })

  } catch (error) {
    console.error('[Cron] Erro no reset de limites:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// Também permitir POST para testes manuais
export async function POST(request: NextRequest) {
  return GET(request)
}
