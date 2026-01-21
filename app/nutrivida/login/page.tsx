'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Heart, Mail, Lock, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'

export default function NutrimaeLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMagicLink, setLoadingMagicLink] = useState(false)
  const [erro, setErro] = useState('')
  const [magicLinkEnviado, setMagicLinkEnviado] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErro('Email ou senha incorretos')
        } else if (error.message.includes('Email not confirmed')) {
          setErro('Confirme seu email antes de fazer login')
        } else {
          setErro(error.message)
        }
        return
      }

      if (data.user) {
        // Verificar/criar profile_NUTRI
        const { error: profileError } = await supabase
          .from('profiles_nutri')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          await supabase
            .from('profiles_nutri')
            .insert({
              id: data.user.id,
              nome: data.user.user_metadata?.nome || data.user.email?.split('@')[0] || 'Usuaria',
              email: data.user.email,
              plano: 'normal',
              amamentando: false
            })
        }

        router.push('/nutrivida/dashboard')
      }
    } catch (err) {
      console.error('Erro no login:', err)
      setErro('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setErro('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/nutrivida/dashboard`
        }
      })

      if (error) {
        setErro(error.message)
      }
    } catch (err) {
      console.error('Erro no login Google:', err)
      setErro('Erro ao fazer login com Google')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setErro('Digite seu email para receber o link magico')
      return
    }

    setLoadingMagicLink(true)
    setErro('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/nutrivida/dashboard`
        }
      })

      if (error) {
        setErro(error.message)
      } else {
        setMagicLinkEnviado(true)
      }
    } catch (err) {
      console.error('Erro ao enviar magic link:', err)
      setErro('Erro ao enviar link. Tente novamente.')
    } finally {
      setLoadingMagicLink(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-rose-400 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link
          href="/nutrivida"
          className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-4 backdrop-blur-sm">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">NutriVida</h1>
            <p className="text-pink-100">Saude e bem-estar feminino</p>
          </div>

          {/* Card de Login */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Entrar na sua conta
            </h2>

            {/* Erro */}
            {erro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {erro}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-pink-50 border border-pink-100 rounded-xl text-gray-800 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Sua senha"
                    required
                    className="w-full pl-11 pr-12 py-3 bg-pink-50 border border-pink-100 rounded-xl text-gray-800 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400 hover:text-pink-600 transition-colors"
                  >
                    {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Magic Link e Esqueceu Senha */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={loadingMagicLink || loading}
                  className="text-sm text-purple-500 hover:text-purple-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {loadingMagicLink ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Entrar sem senha
                </button>
                <Link
                  href="/nutrivida/esqueci-senha"
                  className="text-sm text-pink-500 hover:text-pink-600 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              {/* Magic Link Enviado */}
              {magicLinkEnviado && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-600 text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Link magico enviado!</p>
                    <p className="text-purple-400 text-xs mt-1">Verifique seu email e clique no link para entrar.</p>
                  </div>
                </div>
              )}

              {/* Botao Entrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            {/* Divisor */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pink-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">ou continue com</span>
              </div>
            </div>

            {/* Login Social */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 bg-white border-2 border-pink-100 text-gray-700 font-medium rounded-xl hover:bg-pink-50 hover:border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#4285F4"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>

            {/* Link para Cadastro */}
            <p className="mt-6 text-center text-gray-500">
              Nao tem uma conta?{' '}
              <Link
                href="/nutrivida/cadastro"
                className="text-pink-600 font-semibold hover:underline"
              >
                Cadastre-se gratis
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-white/70">
            Ao entrar, voce concorda com nossos{' '}
            <Link href="/termos" className="underline hover:text-white">Termos de Uso</Link>
            {' '}e{' '}
            <Link href="/privacidade" className="underline hover:text-white">Privacidade</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
