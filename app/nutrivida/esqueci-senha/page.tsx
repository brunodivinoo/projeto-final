'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, ArrowLeft, Loader2, CheckCircle2, Heart } from 'lucide-react'

export default function NutriEsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/nutrivida/redefinir-senha`
      })

      if (error) {
        setErro(error.message)
      } else {
        setSucesso(true)
      }
    } catch (err) {
      console.error('Erro ao enviar email:', err)
      setErro('Erro ao enviar email. Tente novamente.')
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Email enviado!</h2>
          <p className="text-gray-600 mb-6">
            Enviamos um link para <strong>{email}</strong>. Clique no link do email para redefinir sua senha.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Nao recebeu? Verifique sua caixa de spam ou tente novamente.
          </p>
          <Link
            href="/nutrivida/login"
            className="inline-block w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all"
          >
            Voltar para Login
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
            <h1 className="text-2xl font-bold text-white mb-2">Esqueceu sua senha?</h1>
            <p className="text-pink-100">Sem problemas! Vamos te ajudar a recuperar.</p>
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
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Seu email cadastrado
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperacao'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-500 text-sm">
              Lembrou a senha?{' '}
              <Link
                href="/nutrivida/login"
                className="text-pink-600 font-semibold hover:underline"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
