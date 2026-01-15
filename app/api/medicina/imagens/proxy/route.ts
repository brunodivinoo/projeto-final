// API Route - Proxy de Imagens Médicas
// Resolve problemas de CORS servindo imagens através do nosso servidor
// Versão robusta com redirect handling e validação de conteúdo

import { NextRequest, NextResponse } from 'next/server'

// Cache em memória para imagens (evita re-downloads)
const imageCache = new Map<string, { data: ArrayBuffer; contentType: string; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hora
const MAX_CACHE_SIZE = 100

// Domínios permitidos (expandido para cobrir redirects comuns)
const ALLOWED_DOMAINS = [
  'openi.nlm.nih.gov',
  'www.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'upload.wikimedia.org',
  'commons.wikimedia.org',
  // Domínios de CDN/storage que OpenI pode redirecionar
  'www.nlm.nih.gov',
  'nlm.nih.gov',
  'nih.gov',
  'pmc.ncbi.nlm.nih.gov'
]

// Content-types válidos para imagens
const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff'
]

// Limpar cache antigo periodicamente
function cleanOldCache() {
  const now = Date.now()
  for (const [key, value] of imageCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      imageCache.delete(key)
    }
  }
  // Limitar tamanho do cache
  while (imageCache.size > MAX_CACHE_SIZE) {
    const firstKey = imageCache.keys().next().value
    if (firstKey) imageCache.delete(firstKey)
    else break
  }
}

// Verificar se o domínio é permitido
function isDomainAllowed(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(domain =>
    hostname === domain || hostname.endsWith('.' + domain)
  )
}

// Verificar se é um content-type de imagem válido
function isValidImageType(contentType: string | null): boolean {
  if (!contentType) return false
  const type = contentType.split(';')[0].trim().toLowerCase()
  return VALID_IMAGE_TYPES.includes(type) || type.startsWith('image/')
}

// Detectar tipo de imagem pelos magic bytes
function detectImageType(buffer: ArrayBuffer): string | null {
  const arr = new Uint8Array(buffer.slice(0, 16))

  // JPEG: FF D8 FF
  if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
    return 'image/jpeg'
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
    return 'image/png'
  }
  // GIF: 47 49 46 38
  if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) {
    return 'image/gif'
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46 &&
      arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50) {
    return 'image/webp'
  }
  // BMP: 42 4D
  if (arr[0] === 0x42 && arr[1] === 0x4D) {
    return 'image/bmp'
  }

  return null
}

// Fetch com seguimento de redirects manual (para validar cada redirect)
async function fetchWithRedirects(url: string, maxRedirects: number = 5): Promise<Response> {
  let currentUrl = url
  let redirectCount = 0

  while (redirectCount < maxRedirects) {
    const response = await fetch(currentUrl, {
      headers: {
        'User-Agent': 'PreparaMed/1.0 (Medical Education App; +https://preparamed.com.br)',
        'Accept': 'image/*, */*',
        'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
        'Referer': 'https://openi.nlm.nih.gov/'
      },
      redirect: 'manual', // Não seguir automaticamente para validar cada hop
      signal: AbortSignal.timeout(20000)
    })

    // Se é redirect, verificar se o destino é permitido
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) {
        throw new Error('Redirect sem header Location')
      }

      // Resolver URL relativa
      const nextUrl = new URL(location, currentUrl)

      // Verificar se domínio do redirect é permitido
      if (!isDomainAllowed(nextUrl.hostname)) {
        throw new Error(`Redirect para domínio não permitido: ${nextUrl.hostname}`)
      }

      currentUrl = nextUrl.href
      redirectCount++
      continue
    }

    // Resposta final
    return response
  }

  throw new Error('Muitos redirects')
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

    // Validar URL inicial
    let parsedUrl: URL
    try {
      parsedUrl = new URL(imageUrl)
    } catch {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      )
    }

    if (!isDomainAllowed(parsedUrl.hostname)) {
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
          'X-Cache': 'HIT',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Baixar imagem com suporte a redirects
    const response = await fetchWithRedirects(imageUrl)

    if (!response.ok) {
      console.error(`Proxy: Erro HTTP ${response.status} para ${imageUrl}`)
      return NextResponse.json(
        { error: `Erro ao baixar imagem: ${response.status}` },
        { status: response.status }
      )
    }

    // Verificar content-type do servidor
    const serverContentType = response.headers.get('content-type')

    // Baixar o conteúdo
    const arrayBuffer = await response.arrayBuffer()

    // Verificar se o conteúdo é muito pequeno (provavelmente erro)
    if (arrayBuffer.byteLength < 100) {
      console.error(`Proxy: Imagem muito pequena (${arrayBuffer.byteLength} bytes) para ${imageUrl}`)
      return NextResponse.json(
        { error: 'Imagem inválida ou corrompida' },
        { status: 422 }
      )
    }

    // Detectar tipo real da imagem pelos magic bytes
    const detectedType = detectImageType(arrayBuffer)

    // Usar tipo detectado, fallback para server content-type, fallback para jpeg
    const contentType = detectedType ||
      (isValidImageType(serverContentType) ? serverContentType!.split(';')[0].trim() : null) ||
      'image/jpeg'

    // Se não conseguiu detectar e o content-type não é imagem, pode ser erro HTML
    if (!detectedType && !isValidImageType(serverContentType)) {
      // Verificar se começa com HTML
      const textDecoder = new TextDecoder('utf-8', { fatal: false })
      const text = textDecoder.decode(arrayBuffer.slice(0, 500))
      if (text.toLowerCase().includes('<!doctype') || text.toLowerCase().includes('<html')) {
        console.error(`Proxy: Recebeu HTML ao invés de imagem para ${imageUrl}`)
        return NextResponse.json(
          { error: 'Fonte retornou HTML ao invés de imagem' },
          { status: 422 }
        )
      }
    }

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
        'X-Cache': 'MISS',
        'X-Content-Type-Detected': detectedType || 'none',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro no proxy de imagens:', errorMessage)

    // Retornar erro mais descritivo
    if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
      return NextResponse.json(
        { error: 'Timeout ao baixar imagem - fonte muito lenta' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao processar imagem' },
      { status: 500 }
    )
  }
}
