import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Verifica se já existe profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        // Se não existe, cria o profile
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

          // Cria estatísticas iniciais
          await supabase.from('estatisticas_usuario').insert({
            user_id: user.id,
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
