'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, Heart, AlertCircle } from 'lucide-react'

export default function NutriRedefinirSenhaPage() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [sessaoValida, setSessaoValida] = useState<boolean | null>(null)

  useEffect(() => {
    // Verificar se tem uma sessao de recuperacao ativa
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      // Verificar se existe hash na URL (indica redirecionamento do email)
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        setSessaoValida(true)
        return
      }

      // Se tem sessao, pode redefinir
      if (session) {
        setSessaoValida(true)
      } else {
        setSessaoValida(false)
      }
    }

    checkSession()

    // Ouvir mudancas de autenticacao (quando o usuario clica no link do email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessaoValida(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.updateUser({
        password: senha
      })

      if (error) {
        setErro(error.message)
      } else {
        setSucesso(true)
        // Redirecionar apos 3 segundos
        setTimeout(() => {
          router.push('/nutrivida/login')
        }, 3000)
      }
    } catch (err) {
      console.error('Erro ao atualizar senha:', err)
      setErro('Erro ao atualizar senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Loading inicial
  if (sessaoValida === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-rose-400 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    )
  }

  // Link expirado ou invalido
  if (sessaoValida === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-rose-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Link expirado</h2>
          <p className="text-gray-600 mb-6">
            O link de recuperacao de senha expirou ou e invalido. Por favor, solicite um novo link.
          </p>
          <Link
            href="/nutrivida/esqueci-senha"
            className="inline-block w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  // Sucesso
  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-rose-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Senha atualizada!</h2>
          <p className="text-gray-600 mb-6">
            Sua senha foi alterada com sucesso. Voce sera redirecionada para o login em instantes...
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
          href="/nutrivida/login"
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
            <h1 className="text-2xl font-bold text-white mb-2">Nova senha</h1>
            <p className="text-pink-100">Crie uma nova senha para sua conta</p>
          </div>

          {/* Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
            {/* Erro */}
            {erro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {erro}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Nova senha
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

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-pink-50 border border-pink-100 rounded-xl text-gray-800 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar senha'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
