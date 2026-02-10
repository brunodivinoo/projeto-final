// API Route - Busca de Imagens Médicas BRASILEIRAS
// Fontes: MOL USP, UNICAMP, SciELO, Fiocruz, universidades federais
// TODAS as imagens incluem referências ABNT automaticamente

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { searchMedicalImages, type ResultadoBusca } from '@/lib/medical-images/service'
import { buscarImagensMedicas } from '@/lib/services/serperImageService'
import type { PlanoIA } from '@/lib/ai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const { data: profile } = await supabase
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

    // PIPELINE: Serper (Google Images) como fonte PRIMÁRIA, BD local como fallback
    const allImages: Array<{
      id: string; url: string; thumbUrl: string; title: string; titulo: string;
      caption: string; descricao: string; source: string; sourceUrl: string;
      sourceName: string; fonte: string; siglaInstituicao: string; instituicao: string;
      modality: string; license: string; referenciaABNT: string;
    }> = []
    const urlsVistas = new Set<string>()
    const queryUsada = queries[0]

    // 1. Buscar via Serper (Google Images) - fonte primária com mais imagens
    for (const query of queries.slice(0, 3)) {
      try {
        console.log(`[Imagens] Serper buscando: "${query}"`)
        const serperResult = await buscarImagensMedicas(query, 6)

        if (serperResult.success && serperResult.imagens.length > 0) {
          for (const img of serperResult.imagens) {
            if (!urlsVistas.has(img.url)) {
              urlsVistas.add(img.url)
              allImages.push({
                id: `serper-${allImages.length}`,
                url: img.url,
                thumbUrl: img.url,
                title: img.titulo,
                titulo: img.titulo,
                caption: img.titulo,
                descricao: img.titulo,
                source: 'serper_google_images',
                sourceUrl: img.linkOriginal,
                sourceName: img.fonte,
                fonte: img.fonte,
                siglaInstituicao: img.dominio,
                instituicao: img.fonte,
                modality: 'Medical',
                license: 'Uso educacional',
                referenciaABNT: img.referencia
              })
            }
          }
        }
      } catch (error) {
        console.error(`[Imagens] Erro Serper para "${query}":`, error)
      }

      if (allImages.length >= 12) break
    }

    // 2. Complementar com BD local se Serper retornou pouco
    if (allImages.length < 4) {
      for (const query of queries.slice(0, 3)) {
        try {
          const localRes = await searchMedicalImages(query, { limit: 6 })
          if (localRes.imagens.length > 0) {
            for (const img of localRes.imagens) {
              if (!urlsVistas.has(img.url)) {
                urlsVistas.add(img.url)
                allImages.push({
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
                })
              }
            }
          }
        } catch (error) {
          console.error(`[Imagens] Erro BD local para "${query}":`, error)
        }
        if (allImages.length >= 12) break
      }
    }

    const images = allImages.slice(0, 12)

    if (images.length === 0) {
      return NextResponse.json({
        images: [],
        total: 0,
        cached: false,
        source: 'nenhuma',
        queryUsed: queries[0],
        originalQuery: queries[0],
        referencias: [],
        suggestions: [
          'Tente termos em português como: "sistema cardiovascular", "tecido epitelial", "sangue"',
          'Use nomes de sistemas: "sistema nervoso", "sistema respiratório"'
        ]
      })
    }

    console.log(`[Imagens] ✓ Retornando ${images.length} imagens (Serper + BD local)`)

    return NextResponse.json({
      images,
      total: images.length,
      cached: false,
      source: 'serper_com_fallback_local',
      queryUsed: queryUsada,
      originalQuery: queries[0],
      referencias: images.map(img => img.referenciaABNT).filter(Boolean),
      suggestions: []
    })

  } catch (error) {
    console.error('[Imagens BR] Erro na API POST:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar imagens' },
      { status: 500 }
    )
  }
}
