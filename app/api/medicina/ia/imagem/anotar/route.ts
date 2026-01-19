import { NextRequest, NextResponse } from 'next/server'
import { annotateImage } from '@/lib/services/imageAnnotationService'

/**
 * API para anotar imagens médicas usando Claude Vision
 *
 * POST /api/medicina/ia/imagem/anotar
 *
 * Body:
 * - imageUrl: URL da imagem para anotar
 * - imageType: 'anatomy' | 'histology' | 'radiology' | 'pathology' | 'diagram'
 * - context?: Contexto adicional
 * - maxAnnotations?: Número máximo de anotações (default: 10)
 * - language?: 'pt' | 'en' | 'both' (default: 'pt')
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      imageUrl,
      imageType = 'anatomy',
      context,
      maxAnnotations = 10,
      language = 'pt',
    } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl é obrigatório' },
        { status: 400 }
      )
    }

    // Validar tipo de imagem
    const tiposValidos = ['anatomy', 'histology', 'radiology', 'pathology', 'diagram']
    if (!tiposValidos.includes(imageType)) {
      return NextResponse.json(
        { error: `imageType inválido. Use: ${tiposValidos.join(', ')}` },
        { status: 400 }
      )
    }

    console.log('[API Anotar] Iniciando anotação de imagem')
    console.log('[API Anotar] URL:', imageUrl.substring(0, 80) + '...')
    console.log('[API Anotar] Tipo:', imageType)

    const result = await annotateImage({
      imageUrl,
      imageType,
      context,
      maxAnnotations,
      language,
    })

    console.log('[API Anotar] Anotações geradas:', result.annotations.length)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[API Anotar] Erro:', error)

    const message = error instanceof Error ? error.message : 'Erro desconhecido'

    return NextResponse.json(
      { error: `Erro ao anotar imagem: ${message}` },
      { status: 500 }
    )
  }
}
