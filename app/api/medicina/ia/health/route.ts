// API Route - Health Check e Monitoramento de IA PREPARAMED

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { MODELOS } from '@/lib/ai/config'
import { getEstatisticasCache } from '@/lib/ai/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ==========================================
// GET - Health Check
// ==========================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const full = searchParams.get('full') === 'true'
  const admin_key = searchParams.get('admin_key')

  const startTime = Date.now()
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {}

  // 1. Check Supabase
  try {
    const start = Date.now()
    const { error } = await supabase.from('profiles_med').select('id').limit(1)
    checks.supabase = {
      status: error ? 'error' : 'ok',
      latency: Date.now() - start,
      error: error?.message
    }
  } catch (e) {
    checks.supabase = { status: 'error', error: String(e) }
  }

  // 2. Check Anthropic API Key
  checks.anthropic = {
    status: process.env.ANTHROPIC_API_KEY ? 'ok' : 'missing',
    error: process.env.ANTHROPIC_API_KEY ? undefined : 'ANTHROPIC_API_KEY não configurada'
  }

  // 3. Check Gemini API Key
  checks.gemini = {
    status: process.env.GEMINI_API_KEY ? 'ok' : 'missing',
    error: process.env.GEMINI_API_KEY ? undefined : 'GEMINI_API_KEY não configurada'
  }

  // Full check com chamadas reais às APIs
  if (full && admin_key === process.env.ADMIN_SECRET_KEY) {
    // Check Claude API
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const start = Date.now()
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

        const response = await anthropic.messages.create({
          model: MODELOS.claude.haiku, // Usar Haiku para teste (mais barato)
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }]
        })

        checks.anthropic_api = {
          status: response.content ? 'ok' : 'error',
          latency: Date.now() - start
        }
      } catch (e) {
        checks.anthropic_api = { status: 'error', error: String(e) }
      }
    }

    // Check Gemini API
    if (process.env.GEMINI_API_KEY) {
      try {
        const start = Date.now()
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: MODELOS.gemini.flash })

        const result = await model.generateContent('ping')
        const response = result.response.text()

        checks.gemini_api = {
          status: response ? 'ok' : 'error',
          latency: Date.now() - start
        }
      } catch (e) {
        checks.gemini_api = { status: 'error', error: String(e) }
      }
    }

    // Estatísticas de cache
    checks.cache = {
      status: 'ok',
      ...getEstatisticasCache()
    } as typeof checks.cache

    // Estatísticas de uso global
    try {
      const { data: usoTotal } = await supabase
        .from('uso_ia_med')
        .select('tokens_input, tokens_output, custo_estimado')

      const totais = usoTotal?.reduce((acc, u) => ({
        tokens_input: acc.tokens_input + (u.tokens_input || 0),
        tokens_output: acc.tokens_output + (u.tokens_output || 0),
        custo_estimado: acc.custo_estimado + (u.custo_estimado || 0)
      }), { tokens_input: 0, tokens_output: 0, custo_estimado: 0 })

      checks.uso_global = {
        status: 'ok',
        ...totais
      } as typeof checks.uso_global
    } catch (e) {
      checks.uso_global = { status: 'error', error: String(e) }
    }

    // Contagem de conversas e mensagens
    try {
      const { count: totalConversas } = await supabase
        .from('conversas_ia_med')
        .select('id', { count: 'exact', head: true })

      const { count: totalMensagens } = await supabase
        .from('mensagens_ia_med')
        .select('id', { count: 'exact', head: true })

      const { count: totalFlashcards } = await supabase
        .from('flashcards_ia_med')
        .select('id', { count: 'exact', head: true })

      const { count: totalResumos } = await supabase
        .from('resumos_ia_med')
        .select('id', { count: 'exact', head: true })

      checks.conteudo = {
        status: 'ok',
        conversas: totalConversas || 0,
        mensagens: totalMensagens || 0,
        flashcards: totalFlashcards || 0,
        resumos: totalResumos || 0
      } as typeof checks.conteudo
    } catch (e) {
      checks.conteudo = { status: 'error', error: String(e) }
    }
  }

  // Determinar status geral
  const allOk = Object.values(checks).every(c => c.status === 'ok' || c.status === 'missing')

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    latency_total: Date.now() - startTime,
    checks,
    version: '1.0.0',
    modelos: {
      claude: MODELOS.claude.opus,
      gemini: MODELOS.gemini.flash
    }
  })
}

// ==========================================
// POST - Testar funcionalidade específica
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { admin_key, test_type, test_params } = body

    // Verificar chave admin
    if (admin_key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const result: Record<string, unknown> = {
      test_type,
      timestamp: new Date().toISOString()
    }

    switch (test_type) {
      case 'claude_chat':
        try {
          const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
          const start = Date.now()

          const response = await anthropic.messages.create({
            model: test_params?.model || MODELOS.claude.haiku,
            max_tokens: test_params?.max_tokens || 100,
            messages: [{ role: 'user', content: test_params?.message || 'Olá, isto é um teste.' }]
          })

          result.success = true
          result.latency = Date.now() - start
          result.tokens = response.usage
          result.response = response.content[0]
        } catch (e) {
          result.success = false
          result.error = String(e)
        }
        break

      case 'gemini_chat':
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
          const model = genAI.getGenerativeModel({ model: test_params?.model || MODELOS.gemini.flash })
          const start = Date.now()

          const response = await model.generateContent(test_params?.message || 'Olá, isto é um teste.')

          result.success = true
          result.latency = Date.now() - start
          result.response = response.response.text()
        } catch (e) {
          result.success = false
          result.error = String(e)
        }
        break

      case 'supabase_write':
        try {
          const start = Date.now()

          // Inserir e deletar um registro de teste
          const { data, error } = await supabase
            .from('uso_ia_med')
            .insert({
              user_id: '00000000-0000-0000-0000-000000000000',
              mes_referencia: '1900-01'
            })
            .select()
            .single()

          if (error) throw error

          // Deletar imediatamente
          await supabase
            .from('uso_ia_med')
            .delete()
            .eq('id', data.id)

          result.success = true
          result.latency = Date.now() - start
        } catch (e) {
          result.success = false
          result.error = String(e)
        }
        break

      default:
        result.success = false
        result.error = `Tipo de teste desconhecido: ${test_type}`
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
