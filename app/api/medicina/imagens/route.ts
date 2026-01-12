// API Route - Busca de Imagens Médicas Reais
// Fonte: OpenI (NIH) + Wikimedia Commons
// Documentação: Medicina/ESCALABILIDADE-E-PLANOS.md

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { searchMedicalImages } from '@/lib/medical-images/service'
import type { PlanoIA } from '@/lib/ai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rate limiting simples em memória (MVP)
// TODO: Migrar para Vercel KV quando escalar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minuto
const RATE_LIMIT_MAX = 10 // 10 requisições por minuto por usuário

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }

  userLimit.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const userId = searchParams.get('user_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 10)

    // Validar parâmetros
    if (!query) {
      return NextResponse.json(
        { error: 'Parâmetro "q" (query) é obrigatório' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Parâmetro "user_id" é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar plano do usuário
    const { data: profile } = await supabase
      .from('profiles_med')
      .select('plano')
      .eq('id', userId)
      .single()

    const plano = (profile?.plano || 'gratuito') as PlanoIA

    // Verificar se plano permite imagens médicas reais
    // Apenas Premium e Residência têm acesso
    if (plano === 'gratuito') {
      return NextResponse.json(
        {
          error: 'Imagens médicas reais disponíveis apenas nos planos Premium e Residência',
          upgrade: true
        },
        { status: 403 }
      )
    }

    // Rate limiting
    const { allowed, remaining } = checkRateLimit(userId)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido. Aguarde 1 minuto.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          }
        }
      )
    }

    // Buscar imagens
    const result = await searchMedicalImages(query, { limit })

    // Headers de cache para CDN
    const headers = new Headers({
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-RateLimit-Remaining': remaining.toString(),
      'X-Source': result.source,
      'X-Cached': result.cached.toString()
    })

    return NextResponse.json(result, { headers })

  } catch (error) {
    console.error('Erro na API de imagens médicas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar imagens' },
      { status: 500 }
    )
  }
}

// POST para buscar múltiplas queries de uma vez (otimização)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { queries, user_id } = body

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { error: 'Array "queries" é obrigatório' },
        { status: 400 }
      )
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'Campo "user_id" é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar plano
    const { data: profile } = await supabase
      .from('profiles_med')
      .select('plano')
      .eq('id', user_id)
      .single()

    const plano = (profile?.plano || 'gratuito') as PlanoIA

    if (plano === 'gratuito') {
      return NextResponse.json(
        {
          error: 'Imagens médicas reais disponíveis apenas nos planos Premium e Residência',
          upgrade: true
        },
        { status: 403 }
      )
    }

    // Rate limiting
    const { allowed } = checkRateLimit(user_id)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido' },
        { status: 429 }
      )
    }

    // Limitar a 3 queries por vez
    const limitedQueries = queries.slice(0, 3)

    // Buscar todas em paralelo
    const results = await Promise.all(
      limitedQueries.map((q: string) => searchMedicalImages(q, { limit: 3 }))
    )

    // Combinar e remover duplicatas
    const allImages = results.flatMap(r => r.images)
    const uniqueImages = allImages.filter((img, index, self) =>
      index === self.findIndex(i => i.id === img.id)
    )

    // Pegar informações da primeira busca que encontrou algo (ou da última se nenhuma encontrou)
    const firstSuccessfulResult = results.find(r => r.images.length > 0) || results[results.length - 1]

    return NextResponse.json({
      images: uniqueImages,
      total: uniqueImages.length,
      queries: limitedQueries.length,
      queryUsed: firstSuccessfulResult?.queryUsed,
      originalQuery: limitedQueries[0],
      suggestions: uniqueImages.length === 0 ? firstSuccessfulResult?.suggestions : undefined
    })

  } catch (error) {
    console.error('Erro na API de imagens médicas (POST):', error)
    return NextResponse.json(
      { error: 'Erro ao buscar imagens' },
      { status: 500 }
    )
  }
}
