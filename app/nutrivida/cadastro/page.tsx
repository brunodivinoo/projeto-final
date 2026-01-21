'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Heart, Mail, Lock, User, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

export default function NutrimaeCadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    if (senha !== confirmarSenha) {
      setErro('As senhas nao coincidem')
      return
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome: nome
          },
          emailRedirectTo: `${window.location.origin}/nutrivida/auth/callback`
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setErro('Este email ja esta cadastrado')
        } else {
          setErro(error.message)
        }
        return
      }

      if (data.user) {
        // Perfil é criado automaticamente pelo trigger no banco
        // Mas tentamos criar aqui também caso o usuário não precise confirmar email
        if (data.session) {
          // Sessão criada = email confirmation disabled
          try {
            await supabase
              .from('profiles_nutri')
              .upsert({
                id: data.user.id,
                nome: nome,
                email: email,
                plano: 'normal',
                amamentando: false
              }, { onConflict: 'id' })
          } catch {
            // Perfil já criado pelo trigger, ignorar
          }
          router.push('/nutrivida/dashboard')
          return
        }

        setSucesso(true)
      }
    } catch (err) {
      console.error('Erro no cadastro:', err)
      setErro('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setErro('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/nutrivida/auth/callback`
        }
      })

      if (error) {
        setErro(error.message)
      }
    } catch (err) {
      console.error('Erro no cadastro Google:', err)
      setErro('Erro ao cadastrar com Google')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-rose-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Conta criada!</h2>
          <p className="text-gray-600 mb-6">
            Enviamos um link de confirmacao para <strong>{email}</strong>.
            Verifique seu email para ativar sua conta.
          </p>
          <Link
            href="/nutrivida/login"
            className="inline-block w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    )
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
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 mb-3 backdrop-blur-sm">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Criar Conta</h1>
            <p className="text-pink-100 text-sm">Comece sua jornada de bem-estar</p>
          </div>

          {/* Card de Cadastro */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 shadow-2xl">
            {/* Erro */}
            {erro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {erro}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCadastro} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nome
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="w-full pl-11 pr-4 py-2.5 bg-pink-50 border border-pink-100 rounded-xl text-gray-800 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
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
                    className="w-full pl-11 pr-4 py-2.5 bg-pink-50 border border-pink-100 rounded-xl text-gray-800 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Minimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full pl-11 pr-12 py-2.5 bg-pink-50 border border-pink-100 rounded-xl text-gray-800 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all text-sm"
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

              {/* Confirmar Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    className="w-full pl-11 pr-4 py-2.5 bg-pink-50 border border-pink-100 rounded-xl text-gray-800 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              {/* Botao Cadastrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta gratuita'
                )}
              </button>
            </form>

            {/* Divisor */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pink-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">ou</span>
              </div>
            </div>

            {/* Cadastro Google */}
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full py-2.5 bg-white border-2 border-pink-100 text-gray-700 font-medium rounded-xl hover:bg-pink-50 hover:border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Cadastrar com Google
            </button>

            {/* Link para Login */}
            <p className="mt-5 text-center text-gray-500 text-sm">
              Ja tem uma conta?{' '}
              <Link
                href="/nutrivida/login"
                className="text-pink-600 font-semibold hover:underline"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
