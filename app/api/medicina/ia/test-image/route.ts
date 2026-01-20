// Endpoint de teste para verificar geração de imagens
// Acesse: /api/medicina/ia/test-image

import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
  }

  // 1. Verificar se a variável existe
  const apiKey = process.env.OPENAI_API_KEY
  diagnostics.openai_key_exists = !!apiKey
  diagnostics.openai_key_length = apiKey?.length || 0
  diagnostics.openai_key_prefix = apiKey?.substring(0, 10) || 'N/A'

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'OPENAI_API_KEY não está configurada',
      diagnostics
    }, { status: 500 })
  }

  // 2. Verificar formato da chave
  diagnostics.key_format_valid = apiKey.startsWith('sk-')
  diagnostics.key_is_project = apiKey.startsWith('sk-proj-')

  // 3. Tentar inicializar o cliente
  try {
    const openai = new OpenAI({ apiKey })
    diagnostics.client_initialized = true

    // 4. Tentar uma chamada simples (listar modelos)
    try {
      const models = await openai.models.list()
      diagnostics.models_call_success = true
      diagnostics.models_count = models.data?.length || 0
      diagnostics.dalle_available = models.data?.some(m => m.id.includes('dall-e')) || false
    } catch (modelError) {
      diagnostics.models_call_success = false
      diagnostics.models_error = modelError instanceof Error ? modelError.message : String(modelError)
    }

    // 5. Tentar gerar uma imagem simples
    try {
      console.log('[Test Image] Iniciando geração de imagem de teste...')

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: 'A simple red circle on white background, minimal, clean',
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      })

      diagnostics.image_generation_success = true
      diagnostics.image_url_received = !!response.data?.[0]?.url
      diagnostics.image_url_preview = response.data?.[0]?.url?.substring(0, 100) + '...'
      diagnostics.revised_prompt = response.data?.[0]?.revised_prompt

      return NextResponse.json({
        success: true,
        message: 'Geração de imagem funcionando corretamente!',
        image_url: response.data?.[0]?.url,
        diagnostics
      })
    } catch (imageError: unknown) {
      diagnostics.image_generation_success = false

      const err = imageError as { status?: number; code?: string; message?: string }
      diagnostics.image_error_status = err.status
      diagnostics.image_error_code = err.code
      diagnostics.image_error_message = err.message

      return NextResponse.json({
        success: false,
        error: 'Falha na geração de imagem',
        diagnostics
      }, { status: 500 })
    }
  } catch (clientError) {
    diagnostics.client_initialized = false
    diagnostics.client_error = clientError instanceof Error ? clientError.message : String(clientError)

    return NextResponse.json({
      success: false,
      error: 'Falha ao inicializar cliente OpenAI',
      diagnostics
    }, { status: 500 })
  }
}
