import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: Usar getSession() primeiro - é mais rápido e não invalida tokens
  // getUser() faz uma chamada ao servidor e pode causar problemas de sessão
  const { data: { session }, error } = await supabase.auth.getSession()

  // Se houve erro ao verificar sessão, deixar passar (não deslogar o usuário)
  if (error) {
    console.error('Middleware: Erro ao verificar sessão:', error.message)
    return supabaseResponse
  }

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/cadastro')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  // Se não está logado e tenta acessar dashboard, redireciona pro login
  if (!session && isDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se está logado e tenta acessar login/cadastro, redireciona pro dashboard
  if (session && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/cadastro'],
}
