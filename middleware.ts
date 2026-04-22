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

  // getUser() valida o JWT no servidor Supabase e faz refresh automático se expirado.
  // Mais confiável que getSession() que só lê do cookie local sem validar.
  const { data: { user }, error } = await supabase.auth.getUser()

  // Se houve erro ao verificar, deixar passar (não deslogar o usuário por erro de rede)
  if (error && error.status !== 401) {
    console.error('Middleware: Erro ao verificar usuário:', error.message)
    return supabaseResponse
  }

  const isAuthenticated = !!user
  const pathname = request.nextUrl.pathname

  // Detectar rotas de auth e dashboard (ambos /medicina/* e raiz)
  const isMedAuthPage = pathname.startsWith('/medicina/login') || pathname.startsWith('/medicina/cadastro')
  const isMedDashboard = pathname.startsWith('/medicina/dashboard')
  const isAuthPage = pathname === '/login'
  const isDashboard = pathname.startsWith('/dashboard')
  const isAppRoute = pathname.startsWith('/app')
  const isOnboarding = pathname.startsWith('/onboarding')

  // MEDICINA: Se não está logado e tenta acessar dashboard, redireciona pro login
  if (!isAuthenticated && isMedDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/medicina/login'
    return NextResponse.redirect(url)
  }

  // MEDICINA: Se está logado e tenta acessar login/cadastro, redireciona pro dashboard
  if (isAuthenticated && isMedAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/medicina/dashboard'
    return NextResponse.redirect(url)
  }

  // RAIZ: Se não está logado e tenta acessar dashboard, redireciona pro login
  if (!isAuthenticated && isDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // PREPARA MED: Se não está logado e tenta acessar /app/*, redireciona pro /login
  if (!isAuthenticated && isAppRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // PREPARA MED: Se não está logado e tenta acessar /onboarding, redireciona pro /login
  if (!isAuthenticated && isOnboarding) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // PREPARA MED: Se está logado e tenta acessar /login, redireciona pro /app/dashboard
  if (isAuthenticated && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/cadastro',
    '/medicina/dashboard/:path*',
    '/medicina/login',
    '/medicina/cadastro',
    '/app/:path*',
    '/onboarding/:path*',
    '/onboarding',
  ],
}
