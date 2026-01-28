// API Route - Proxy de Imagens Médicas BRASILEIRAS
// Resolve problemas de CORS servindo imagens através do nosso servidor
// APENAS domínios de universidades e instituições brasileiras são permitidos

import { NextRequest, NextResponse } from 'next/server'

// Cache em memória para imagens (evita re-downloads)
const imageCache = new Map<string, { data: ArrayBuffer; contentType: string; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hora
const MAX_CACHE_SIZE = 100

// Domínios BRASILEIROS permitidos (universidades e instituições científicas)
const ALLOWED_DOMAINS = [
  // Universidade de São Paulo
  'usp.br',
  'mol.icb.usp.br',
  'repositorio.usp.br',
  'www.icb.usp.br',
  'icb.usp.br',
  
  // Universidade Estadual de Campinas
  'unicamp.br',
  'anatpat.unicamp.br',
  'repositorio.unicamp.br',
  'www.fcm.unicamp.br',
  'fcm.unicamp.br',
  
  // Universidade Estadual Paulista
  'unesp.br',
  'repositorio.unesp.br',
  
  // Universidade Federal de Juiz de Fora
  'ufjf.br',
  'atlas.anatomia.ufjf.br',
  
  // Universidade Federal Fluminense
  'uff.br',
  'neuroanatomia.uff.br',
  
  // Universidade Federal do Rio de Janeiro
  'ufrj.br',
  'nupem.ufrj.br',
  
  // Universidade Federal de Minas Gerais
  'ufmg.br',
  
  // Universidade Federal do Rio Grande do Sul
  'ufrgs.br',
  'lume.ufrgs.br',
  
  // Universidade Federal de Goiás
  'ufg.br',
  'histologia.icb.ufg.br',
  
  // Universidade Estadual de Londrina
  'uel.br',
  'departamentos.uel.br',
  
  // Universidade Federal de Alfenas
  'unifal-mg.edu.br',
  
  // Universidade Federal do Ceará
  'ufc.br',
  'repositorio.ufc.br',
  
  // Bibliotecas e repositórios científicos
  'scielo.br',
  'www.scielo.br',
  'scielo.org',
  'bvsalud.org',
  'pesquisa.bvsalud.org',
  'lilacs.bvsalud.org',
  
  // Fiocruz
  'fiocruz.br',
  'ioc.fiocruz.br',
  'portal.fiocruz.br',
  
  // Colégio Brasileiro de Radiologia
  'cbr.org.br',
  'radiologiabrasileira.org.br',
  
  // Governo Federal
  'gov.br',
  'saude.gov.br',
  
  // Outras universidades federais
  'ufpr.br',
  'ufsc.br',
  'ufba.br',
  'ufpe.br',
  'ufrn.br',
  'ufpa.br',
  'ufam.edu.br',
  'unb.br'
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

// Verificar se o domínio é permitido (apenas brasileiros)
function isDomainAllowed(hostname: string): boolean {
  const hostLower = hostname.toLowerCase()
  return ALLOWED_DOMAINS.some(domain =>
    hostLower === domain || hostLower.endsWith('.' + domain)
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
  // TIFF: 49 49 2A 00 ou 4D 4D 00 2A
  if ((arr[0] === 0x49 && arr[1] === 0x49 && arr[2] === 0x2A && arr[3] === 0x00) ||
      (arr[0] === 0x4D && arr[1] === 0x4D && arr[2] === 0x00 && arr[3] === 0x2A)) {
    return 'image/tiff'
  }

  return null
}

export async function GET(request: NextRequest) {
  // Limpar cache antigo
  cleanOldCache()

  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'URL da imagem não fornecida' },
      { status: 400 }
    )
  }

  // Validar URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(imageUrl)
  } catch {
    return NextResponse.json(
      { error: 'URL inválida' },
      { status: 400 }
    )
  }

  // Verificar domínio (APENAS BRASILEIROS)
  if (!isDomainAllowed(parsedUrl.hostname)) {
    console.log(`[Proxy] Domínio não permitido: ${parsedUrl.hostname}`)
    return NextResponse.json(
      { error: 'Domínio não permitido. Apenas fontes brasileiras acadêmicas são aceitas.' },
      { status: 403 }
    )
  }

  // Verificar cache
  const cacheKey = imageUrl
  const cached = imageCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new NextResponse(cached.data, {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'HIT',
        'X-Source': 'brazilian-academic'
      }
    })
  }

  try {
    // Fetch com timeout e seguindo redirects
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    let currentUrl = imageUrl
    let redirectCount = 0
    const maxRedirects = 5

    while (redirectCount < maxRedirects) {
      const response = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'PreparaMed/1.0 (Aplicativo Educacional Médico Brasileiro; +https://preparamed.com.br)',
          'Accept': 'image/*, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': new URL(currentUrl).origin + '/'
        },
        redirect: 'manual',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Handle redirects
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location) break

        const redirectUrl = new URL(location, currentUrl)

        // Verificar se o redirect é para domínio brasileiro permitido
        if (!isDomainAllowed(redirectUrl.hostname)) {
          console.log(`[Proxy] Redirect para domínio não permitido: ${redirectUrl.hostname}`)
          return NextResponse.json(
            { error: 'Redirect para domínio não brasileiro' },
            { status: 403 }
          )
        }

        currentUrl = redirectUrl.toString()
        redirectCount++
        continue
      }

      if (!response.ok) {
        return NextResponse.json(
          { error: `Erro ao buscar imagem: ${response.status}` },
          { status: response.status }
        )
      }

      // Verificar content-type
      const contentType = response.headers.get('content-type')
      const buffer = await response.arrayBuffer()

      // Detectar tipo real da imagem
      const detectedType = detectImageType(buffer)
      const finalContentType = detectedType || (isValidImageType(contentType) ? contentType : 'image/jpeg')

      // Verificar se é realmente uma imagem
      if (!detectedType && !isValidImageType(contentType)) {
        return NextResponse.json(
          { error: 'O arquivo não é uma imagem válida' },
          { status: 400 }
        )
      }

      // Verificar tamanho mínimo (evitar imagens quebradas)
      if (buffer.byteLength < 100) {
        return NextResponse.json(
          { error: 'Imagem muito pequena ou corrompida' },
          { status: 400 }
        )
      }

      // Salvar no cache
      imageCache.set(cacheKey, {
        data: buffer,
        contentType: finalContentType!,
        timestamp: Date.now()
      })

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': finalContentType!,
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'MISS',
          'X-Source': 'brazilian-academic',
          'X-Original-Domain': parsedUrl.hostname
        }
      })
    }

    return NextResponse.json(
      { error: 'Muitos redirects' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[Proxy] Erro ao buscar imagem:', error)

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout ao buscar imagem' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno ao processar imagem' },
      { status: 500 }
    )
  }
}
