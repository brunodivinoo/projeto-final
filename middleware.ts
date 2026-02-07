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

  const pathname = request.nextUrl.pathname

  // Detectar rotas de auth e dashboard (ambos /medicina/* e raiz)
  const isMedAuthPage = pathname.startsWith('/medicina/login') || pathname.startsWith('/medicina/cadastro')
  const isMedDashboard = pathname.startsWith('/medicina/dashboard')
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/cadastro')
  const isDashboard = pathname.startsWith('/dashboard')

  // MEDICINA: Se não está logado e tenta acessar dashboard, redireciona pro login
  if (!session && isMedDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/medicina/login'
    return NextResponse.redirect(url)
  }

  // MEDICINA: Se está logado e tenta acessar login/cadastro, redireciona pro dashboard
  if (session && isMedAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/medicina/dashboard'
    return NextResponse.redirect(url)
  }

  // RAIZ: Se não está logado e tenta acessar dashboard, redireciona pro login
  if (!session && isDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // RAIZ: Se está logado e tenta acessar login/cadastro, redireciona pro dashboard
  if (session && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
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
  ],
}
