// API Route - Proxy de Imagens Médicas
// Resolve problemas de CORS servindo imagens através do nosso servidor

import { NextRequest, NextResponse } from 'next/server'

// Cache em memória para imagens (evita re-downloads)
const imageCache = new Map<string, { data: ArrayBuffer; contentType: string; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hora

// Limpar cache antigo periodicamente
function cleanOldCache() {
  const now = Date.now()
  for (const [key, value] of imageCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      imageCache.delete(key)
    }
  }
  // Limitar tamanho do cache
  if (imageCache.size > 100) {
    const firstKey = imageCache.keys().next().value
    if (firstKey) imageCache.delete(firstKey)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Parâmetro "url" é obrigatório' },
        { status: 400 }
      )
    }

    // Validar URL - apenas domínios permitidos
    const allowedDomains = [
      'openi.nlm.nih.gov',
      'www.ncbi.nlm.nih.gov',
      'ncbi.nlm.nih.gov',
      'upload.wikimedia.org',
      'commons.wikimedia.org'
    ]

    let parsedUrl: URL
    try {
      parsedUrl = new URL(imageUrl)
    } catch {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      )
    }

    if (!allowedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
      return NextResponse.json(
        { error: 'Domínio não permitido' },
        { status: 403 }
      )
    }

    // Verificar cache
    cleanOldCache()
    const cached = imageCache.get(imageUrl)
    if (cached) {
      return new NextResponse(cached.data, {
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          'X-Cache': 'HIT'
        }
      })
    }

    // Baixar imagem
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'PreparaMed/1.0 (Medical Education App)',
        'Accept': 'image/*'
      },
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erro ao baixar imagem: ${response.status}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const arrayBuffer = await response.arrayBuffer()

    // Salvar no cache
    imageCache.set(imageUrl, {
      data: arrayBuffer,
      contentType,
      timestamp: Date.now()
    })

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Cache': 'MISS'
      }
    })

  } catch (error) {
    console.error('Erro no proxy de imagens:', error)
    return NextResponse.json(
      { error: 'Erro ao processar imagem' },
      { status: 500 }
    )
  }
}
