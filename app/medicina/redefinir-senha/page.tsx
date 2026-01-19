'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Stethoscope, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [tokenValido, setTokenValido] = useState<boolean | null>(null)

  useEffect(() => {
    // Verificar se há uma sessão válida (link de recuperação)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      // Se chegou aqui via link de email, o Supabase automaticamente
      // cria uma sessão temporária para permitir a troca de senha
      if (session) {
        setTokenValido(true)
      } else {
        // Verificar se há hash na URL (link de recuperação)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')

        if (accessToken && type === 'recovery') {
          setTokenValido(true)
        } else {
          setTokenValido(false)
        }
      }
    }

    checkSession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      })

      if (error) {
        setErro(error.message)
        return
      }

      setSucesso(true)

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/medicina/login')
      }, 3000)
    } catch (err) {
      console.error('Erro ao redefinir senha:', err)
      setErro('Erro ao redefinir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (tokenValido === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  // Token inválido ou expirado
  if (tokenValido === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Link inválido ou expirado</h2>
            <p className="text-emerald-200 mb-6">
              Este link de recuperação de senha não é válido ou já expirou.
              Solicite um novo link.
            </p>
            <Link
              href="/medicina/esqueci-senha"
              className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Sucesso
  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Senha redefinida!</h2>
            <p className="text-emerald-200 mb-6">
              Sua senha foi alterada com sucesso.
              Você será redirecionado para o login em instantes...
            </p>
            <Link
              href="/medicina/login"
              className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              Ir para o Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">PREPARAMED</h1>
            <p className="text-emerald-200">Redefinir senha</p>
          </div>

          {/* Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-2 text-center">
              Criar nova senha
            </h2>
            <p className="text-emerald-200/70 text-sm text-center mb-6">
              Digite sua nova senha abaixo.
            </p>

            {/* Erro */}
            {erro && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {erro}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Nova Senha */}
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-1.5">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full pl-11 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white transition-colors"
                  >
                    {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-1.5">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Botão Redefinir */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir senha'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
