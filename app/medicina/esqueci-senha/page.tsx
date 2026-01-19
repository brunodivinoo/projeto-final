'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Stethoscope, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

export default function EsqueciSenhaPage() {
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
        redirectTo: `${window.location.origin}/medicina/redefinir-senha`
      })

      if (error) {
        setErro(error.message)
        return
      }

      setSucesso(true)
    } catch (err) {
      console.error('Erro ao enviar email:', err)
      setErro('Erro ao enviar email. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Email enviado!</h2>
            <p className="text-emerald-200 mb-6">
              Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
            </p>
            <p className="text-emerald-300/60 text-sm mb-6">
              Verifique sua caixa de entrada e spam. O link expira em 24 horas.
            </p>
            <Link
              href="/medicina/login"
              className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link
          href="/medicina/login"
          className="inline-flex items-center gap-2 text-emerald-200 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao login
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">PREPARAMED</h1>
            <p className="text-emerald-200">Recuperar acesso</p>
          </div>

          {/* Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-2 text-center">
              Esqueceu sua senha?
            </h2>
            <p className="text-emerald-200/70 text-sm text-center mb-6">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>

            {/* Erro */}
            {erro && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {erro}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-1.5">
                  Email cadastrado
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Botão Enviar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperação'
                )}
              </button>
            </form>

            {/* Link para Login */}
            <p className="mt-6 text-center text-emerald-200">
              Lembrou a senha?{' '}
              <Link
                href="/medicina/login"
                className="text-white font-semibold hover:underline"
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
