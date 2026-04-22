import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/medicina/dashboard'

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
          } catch {}
        },
      },
    }
  )

  let authError = false

  // PKCE flow (OAuth / email confirm)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) authError = true
  }
  // Magic link / OTP flow (token_hash + type)
  else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'email' | 'signup' | 'magiclink' | 'email_change' | 'recovery',
    })
    if (error) authError = true
  } else {
    return NextResponse.redirect(`${origin}/login?error=missing_token`)
  }

  if (authError) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  // PrepaMed /app/* flow: check if profile is complete
  if (next.startsWith('/app')) {
    const { data: prepaMedProfile } = await supabase
      .from('prepamed_profiles')
      .select('id, exam_type, full_name')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!prepaMedProfile?.exam_type || !prepaMedProfile?.full_name) {
      return NextResponse.redirect(`${origin}/onboarding`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // Existing /medicina/* flow
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existingProfile) {
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

    await supabase.from('estatisticas_usuario').insert({
      user_id: user.id,
    })
  }

  return NextResponse.redirect(`${origin}${next}`)
}
