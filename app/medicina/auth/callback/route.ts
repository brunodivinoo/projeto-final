import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Token hash vem de magic links e email confirmations
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'magiclink' | 'recovery' | 'email' | null

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context - ignorar
          }
        },
      },
    }
  )

  let authError = false

  // Fluxo 1: PKCE code exchange (OAuth como Google, GitHub, etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[Med Auth Callback] Erro ao trocar código:', error.message)
      authError = true
    }
  }

  // Fluxo 2: Token hash (magic link, email confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })
    if (error) {
      console.error('[Med Auth Callback] Erro ao verificar OTP:', error.message)
      authError = true
    }
  }

  if (authError) {
    return NextResponse.redirect(`${origin}/medicina/login?error=auth`)
  }

  // Obter usuário autenticado
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Criar profile_med se não existir
    const { data: existingProfile } = await supabase
      .from('profiles_med')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      const nome = user.user_metadata?.nome ||
                   user.user_metadata?.full_name ||
                   user.user_metadata?.name ||
                   user.email?.split('@')[0] || 'Estudante'

      await supabase.from('profiles_med').insert({
        id: user.id,
        nome: nome,
        email: user.email,
        plano: 'gratuito'
      })
    }

    // Também criar profile genérico se necessário (para compatibilidade)
    const { data: existingGenericProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingGenericProfile) {
      const nome = user.user_metadata?.nome ||
                   user.user_metadata?.full_name ||
                   user.user_metadata?.name ||
                   user.email?.split('@')[0] || 'Usuário'

      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email!,
        nome: nome,
        avatar_url: user.user_metadata?.avatar_url || null,
      })
    }

    return NextResponse.redirect(`${origin}/medicina/dashboard`)
  }

  // Se não conseguiu autenticar, voltar pro login
  return NextResponse.redirect(`${origin}/medicina/login?error=auth`)
}
