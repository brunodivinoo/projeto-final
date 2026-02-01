/**
 * Módulo de Visão e OCR para PREPARA MED
 *
 * Integra modelos de visão do Hugging Face para:
 * - OCR (reconhecimento de texto em imagens)
 * - Análise de imagens médicas
 * - Captioning de imagens
 */

import { HfInference } from '@huggingface/inference'

// Cliente Hugging Face
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Modelos de visão disponíveis
export const VISION_MODELS = {
  // OCR para documentos e textos
  OCR_GENERAL: 'microsoft/trocr-large-printed',
  OCR_HANDWRITTEN: 'microsoft/trocr-base-handwritten',

  // Image captioning
  CAPTION: 'Salesforce/blip-image-captioning-large',

  // Visão médica (document understanding)
  MEDICAL_VISION: 'microsoft/Florence-2-large',

  // OCR avançado multilíngue
  OCR_MULTILINGUAL: 'ucaslcl/GOT-OCR2_0',
} as const

export interface OCRResult {
  text: string
  confidence: number
  model: string
  processingTime: number
}

export interface ImageAnalysisResult {
  description: string
  detectedText?: string
  entities?: string[]
  confidence: number
}

/**
 * Extrai texto de uma imagem usando OCR
 */
export async function extractTextFromImage(
  imageData: string | Blob,
  options?: {
    model?: keyof typeof VISION_MODELS
    language?: string
  }
): Promise<OCRResult> {
  const startTime = Date.now()
  const model = options?.model ? VISION_MODELS[options.model] : VISION_MODELS.OCR_GENERAL

  try {
    // Converter base64 para blob se necessário
    let imageBlob: Blob
    if (typeof imageData === 'string') {
      // Remove prefixo data:image se existir
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
      const binaryData = Buffer.from(base64Data, 'base64')
      imageBlob = new Blob([binaryData])
    } else {
      imageBlob = imageData
    }

    // Usar image-to-text para OCR
    const result = await hf.imageToText({
      data: imageBlob,
      model: model,
    })

    const processingTime = Date.now() - startTime

    return {
      text: result.generated_text || '',
      confidence: 0.9, // HF não retorna confidence diretamente
      model: model,
      processingTime,
    }
  } catch (error) {
    console.error('[OCR] Erro ao extrair texto:', error)

    // Fallback para caption se OCR falhar
    try {
      const captionResult = await hf.imageToText({
        data: typeof imageData === 'string'
          ? new Blob([Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64')])
          : imageData,
        model: VISION_MODELS.CAPTION,
      })

      return {
        text: captionResult.generated_text || 'Não foi possível extrair texto da imagem',
        confidence: 0.7,
        model: VISION_MODELS.CAPTION,
        processingTime: Date.now() - startTime,
      }
    } catch {
      return {
        text: '',
        confidence: 0,
        model: model,
        processingTime: Date.now() - startTime,
      }
    }
  }
}

/**
 * Analisa uma imagem e retorna descrição + texto detectado
 */
export async function analyzeImage(
  imageData: string | Blob
): Promise<ImageAnalysisResult> {
  try {
    // Converter para blob
    let imageBlob: Blob
    if (typeof imageData === 'string') {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
      const binaryData = Buffer.from(base64Data, 'base64')
      imageBlob = new Blob([binaryData])
    } else {
      imageBlob = imageData
    }

    // Obter caption da imagem
    const captionResult = await hf.imageToText({
      data: imageBlob,
      model: VISION_MODELS.CAPTION,
    })

    // Tentar extrair texto também
    let detectedText: string | undefined
    try {
      const ocrResult = await extractTextFromImage(imageBlob)
      if (ocrResult.text && ocrResult.confidence > 0.5) {
        detectedText = ocrResult.text
      }
    } catch {
      // OCR opcional, continua sem
    }

    return {
      description: captionResult.generated_text || 'Imagem médica',
      detectedText,
      confidence: 0.85,
    }
  } catch (error) {
    console.error('[Vision] Erro ao analisar imagem:', error)
    return {
      description: 'Não foi possível analisar a imagem',
      confidence: 0,
    }
  }
}

/**
 * Prepara contexto de imagem para enviar ao LLM principal
 * Combina OCR + caption para dar mais contexto
 */
export async function prepareImageContext(
  imageData: string | Blob
): Promise<string> {
  const analysis = await analyzeImage(imageData)

  let context = `[ANÁLISE DA IMAGEM]\n`
  context += `Descrição: ${analysis.description}\n`

  if (analysis.detectedText) {
    context += `\nTexto detectado na imagem:\n${analysis.detectedText}\n`
  }

  return context
}

/**
 * Verifica se a imagem contém texto significativo
 */
export async function hasSignificantText(imageData: string | Blob): Promise<boolean> {
  try {
    const ocrResult = await extractTextFromImage(imageData)
    // Considera texto significativo se tiver mais de 10 caracteres
    return ocrResult.text.length > 10 && ocrResult.confidence > 0.5
  } catch {
    return false
  }
}
