import { NextRequest, NextResponse } from 'next/server'
import { generatePreparaMedImage, GenerateMedicalImageRequest } from '@/lib/services/gptImageService'
import { createClient } from '@supabase/supabase-js'

// Timeout de 60 segundos para geração de imagem
export const maxDuration = 60

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      user_id,
      structure,
      type = 'anatomy',
      annotations,
      view,
      additionalDetails,
      quality = 'medium',
      size = '1024x1024',
    } = body as {
      user_id: string
      structure: string
      type?: 'anatomy' | 'histology' | 'radiology' | 'pathology' | 'diagram'
      annotations?: string[]
      view?: string
      additionalDetails?: string
      quality?: 'low' | 'medium' | 'high'
      size?: '1024x1024' | '1024x1536' | '1536x1024'
    }

    // Validações
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!structure || typeof structure !== 'string') {
      return NextResponse.json(
        { error: 'structure é obrigatório e deve ser uma string' },
        { status: 400 }
      )
    }

    // Verificar se usuário existe e tem permissão
    const { data: profile } = await supabase
      .from('profiles_med')
      .select('id, plano')
      .eq('id', user_id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar limite de imagens (baseado no plano)
    const limiteImagens: Record<string, number> = {
      gratuito: 5,
      premium: 50,
      residencia: 200,
    }

    const { data: usoAtual } = await supabase
      .from('uso_ia_med')
      .select('imagens_geradas')
      .eq('user_id', user_id)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .single()

    const imagensUsadas = usoAtual?.imagens_geradas || 0
    const limite = limiteImagens[profile.plano] || 5

    if (imagensUsadas >= limite) {
      return NextResponse.json(
        {
          error: `Limite de imagens atingido (${limite}/mês). Faça upgrade do plano para gerar mais imagens.`,
          limite,
          usadas: imagensUsadas,
        },
        { status: 429 }
      )
    }

    console.log(`[Gerar Imagem] Usuário ${user_id} solicitou imagem de ${structure} (${type})`)

    // Gerar imagem
    const imageRequest: GenerateMedicalImageRequest = {
      structure,
      type,
      annotations,
      view,
      additionalDetails,
      quality,
      size,
    }

    const result = await generatePreparaMedImage(imageRequest)

    // Registrar uso
    await supabase.rpc('incrementar_uso_imagens', { p_user_id: user_id })

    // Salvar no histórico de imagens geradas (opcional)
    try {
      await supabase
        .from('imagens_geradas_med')
        .insert({
          user_id,
          structure,
          type,
          annotations,
          image_url: result.url,
          prompt_used: result.revisedPrompt,
          cost: result.estimatedCost,
        })
    } catch {
      // Tabela pode não existir ainda, ignorar erro
      console.log('[Gerar Imagem] Tabela imagens_geradas_med não existe, ignorando log')
    }

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        revisedPrompt: result.revisedPrompt,
        estimatedCost: result.estimatedCost,
      },
    })

  } catch (error: unknown) {
    console.error('[API Gerar Imagem] Erro:', error)

    const err = error as { message?: string; status?: number; code?: string }

    // Tratar erros específicos
    if (err.status === 429 || err.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' },
        { status: 429 }
      )
    }

    if (err.status === 400 || err.code === 'content_policy_violation') {
      return NextResponse.json(
        { error: 'O prompt foi rejeitado pela moderação. Tente descrever de forma diferente.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: err.message || 'Erro interno ao gerar imagem' },
      { status: 500 }
    )
  }
}
