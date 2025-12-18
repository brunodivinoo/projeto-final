import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name } = await request.json()

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'userId ou email obrigatorio' },
        { status: 400 }
      )
    }

    // Buscar dados do usuario se tiver userId
    let userEmail = email
    let userName = name

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, nome')
        .eq('id', userId)
        .single()

      if (profile) {
        userEmail = profile.email || email
        userName = profile.nome || name
      }
    }

    // Montar URL de checkout
    const checkoutBaseUrl = process.env.NEXT_PUBLIC_CAKTO_CHECKOUT_URL

    if (!checkoutBaseUrl) {
      return NextResponse.json(
        { error: 'Checkout URL nao configurada' },
        { status: 500 }
      )
    }

    const url = new URL(checkoutBaseUrl)

    // Adicionar parametros para pre-preencher e rastrear
    if (userEmail) url.searchParams.set('email', userEmail)
    if (userName) url.searchParams.set('name', userName)
    if (userId) url.searchParams.set('utm_content', userId) // Para identificar no webhook

    return NextResponse.json({
      checkoutUrl: url.toString(),
    })
  } catch (error) {
    console.error('[Checkout] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar checkout' },
      { status: 500 }
    )
  }
}

// GET para verificar status da assinatura
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId obrigatorio' },
        { status: 400 }
      )
    }

    // Buscar assinatura do usuario
    const { data: assinatura, error } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Buscar plano do profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      plano: profile?.plano || 'FREE',
      assinatura: assinatura || null,
      isPro: profile?.plano === 'ESTUDA_PRO',
    })
  } catch (error) {
    console.error('[Checkout Status] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar status' },
      { status: 500 }
    )
  }
}
