// API Route - Busca de Imagens Médicas BRASILEIRAS
// Fontes: MOL USP, UNICAMP, SciELO, Fiocruz, universidades federais
// TODAS as imagens incluem referências ABNT automaticamente

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { searchMedicalImages, type ResultadoBusca } from '@/lib/medical-images/service'
import type { PlanoIA } from '@/lib/ai'

// supabase - usar getSupabaseAdmin() dentro das funções

// Rate limiting simples em memória (MVP)
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
    const { data: profile } = await getSupabaseAdmin()
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

    // Rate limit
    const rateLimit = checkRateLimit(userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido. Aguarde 1 minuto.' },
        { status: 429 }
      )
    }

    // Buscar imagens de fontes BRASILEIRAS
    console.log(`[Imagens BR] Buscando: "${query}" para usuário ${userId}`)

    const resultado: ResultadoBusca = await searchMedicalImages(query, { limit })

    // Mapear para formato esperado pelo frontend
    const images = resultado.imagens.map(img => ({
      id: img.id,
      url: img.url,
      thumbUrl: img.thumbUrl,
      title: img.titulo,
      titulo: img.titulo,
      caption: img.descricao,
      descricao: img.descricao,
      source: 'brazilian_academic',
      sourceUrl: img.fonteUrl,
      sourceName: img.siglaInstituicao,
      fonte: img.fonte,
      siglaInstituicao: img.siglaInstituicao,
      instituicao: img.instituicao,
      modality: 'Medical',
      license: img.licenca,
      referenciaABNT: img.referenciaABNT
    }))

    return NextResponse.json({
      images,
      total: resultado.total,
      cached: resultado.cached,
      source: 'fontes_brasileiras_academicas',
      queryUsed: resultado.consultaUsada,
      originalQuery: resultado.consultaOriginal,
      referencias: resultado.referencias,
      suggestions: resultado.sugestoes
    })

  } catch (error) {
    console.error('[Imagens BR] Erro na API:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar imagens' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { queries, user_id: userId } = body

    // Validação
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { error: 'Campo "queries" (array de termos) é obrigatório' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Campo "user_id" é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar plano do usuário
    const { data: profile } = await getSupabaseAdmin()
      .from('profiles_med')
      .select('plano')
      .eq('id', userId)
      .single()

    const plano = (profile?.plano || 'gratuito') as PlanoIA

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

    // Rate limit
    const rateLimit = checkRateLimit(userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido. Aguarde 1 minuto.' },
        { status: 429 }
      )
    }

    // Buscar imagens para o primeiro termo que retornar resultados
    let resultado: ResultadoBusca | null = null
    let queryUsada = ''

    for (const query of queries.slice(0, 3)) { // Máximo 3 tentativas
      console.log(`[Imagens BR] Tentando busca: "${query}"`)

      const res = await searchMedicalImages(query, { limit: 8 })

      if (res.imagens.length > 0) {
        resultado = res
        queryUsada = query
        break
      }
    }

    if (!resultado || resultado.imagens.length === 0) {
      return NextResponse.json({
        images: [],
        total: 0,
        cached: false,
        source: 'fontes_brasileiras_academicas',
        queryUsed: queries[0],
        originalQuery: queries[0],
        referencias: [],
        suggestions: [
          'Tente termos em português como: "sistema cardiovascular", "tecido epitelial", "sangue"',
          'Use nomes de sistemas: "sistema nervoso", "sistema respiratório"',
          'Consulte a lista de tópicos disponíveis na base brasileira'
        ]
      })
    }

    // Mapear para formato esperado pelo frontend
    const images = resultado.imagens.map(img => ({
      id: img.id,
      url: img.url,
      thumbUrl: img.thumbUrl,
      title: img.titulo,
      titulo: img.titulo,
      caption: img.descricao,
      descricao: img.descricao,
      source: 'brazilian_academic',
      sourceUrl: img.fonteUrl,
      sourceName: img.siglaInstituicao,
      fonte: img.fonte,
      siglaInstituicao: img.siglaInstituicao,
      instituicao: img.instituicao,
      modality: 'Medical',
      license: img.licenca,
      referenciaABNT: img.referenciaABNT
    }))

    console.log(`[Imagens BR] ✓ Retornando ${images.length} imagens de fontes brasileiras`)

    return NextResponse.json({
      images,
      total: resultado.total,
      cached: resultado.cached,
      source: 'fontes_brasileiras_academicas',
      queryUsed: queryUsada,
      originalQuery: queries[0],
      referencias: resultado.referencias,
      suggestions: resultado.sugestoes
    })

  } catch (error) {
    console.error('[Imagens BR] Erro na API POST:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar imagens' },
      { status: 500 }
    )
  }
}
