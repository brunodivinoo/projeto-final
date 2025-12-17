'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos'
        : error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const handleMicrosoftLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div className="min-h-screen bg-[#101922] flex flex-col">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        {/* Login Card */}
        <div className="w-full max-w-[480px] bg-[#192633] rounded-xl shadow-2xl border border-[#324d67] overflow-hidden">
          {/* Header Section */}
          <div className="p-8 pb-0 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">StudyHub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">Bem-vindo de volta!</h1>
            <p className="text-[#92adc9] text-sm font-normal">Acesse sua área de estudos e continue aprendendo.</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 pt-6 flex flex-col gap-5">
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="text-white text-sm font-medium" htmlFor="email">E-mail ou Usuário</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="exemplo@estudante.com"
                  required
                  className="w-full rounded-lg border border-[#324d67] bg-[#111a22] focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 pl-11 text-base placeholder:text-[#92adc9] text-white transition-colors outline-none"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#92adc9] flex items-center">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-white text-sm font-medium" htmlFor="password">Senha</label>
                <Link href="#" className="text-primary hover:underline text-sm font-medium transition-colors">Esqueceu a senha?</Link>
              </div>
              <div className="relative flex w-full items-center">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Sua senha segura"
                  required
                  className="w-full rounded-lg border border-[#324d67] bg-[#111a22] focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 pl-11 pr-12 text-base placeholder:text-[#92adc9] text-white transition-colors outline-none"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#92adc9] flex items-center">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3 text-[#92adc9] hover:text-white flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center rounded-lg bg-primary hover:bg-[#0f6ac6] h-12 px-4 text-white text-sm font-bold tracking-wide transition-colors shadow-lg shadow-primary/20 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar</span>
                  <span className="material-symbols-outlined ml-2 text-lg">login</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#324d67]"></div>
              <span className="flex-shrink-0 mx-4 text-[#92adc9] text-xs font-medium uppercase">Ou continue com</span>
              <div className="flex-grow border-t border-[#324d67]"></div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center h-10 rounded-lg border border-[#324d67] bg-[#111a22] hover:bg-[#1a2530] transition-colors gap-2"
              >
                <GoogleIcon />
                <span className="text-sm font-medium text-white">Google</span>
              </button>
              <button
                type="button"
                onClick={handleMicrosoftLogin}
                className="flex items-center justify-center h-10 rounded-lg border border-[#324d67] bg-[#111a22] hover:bg-[#1a2530] transition-colors gap-2"
              >
                <MicrosoftIcon />
                <span className="text-sm font-medium text-white">Microsoft</span>
              </button>
            </div>
          </form>

          {/* Footer / Sign Up CTA */}
          <div className="bg-[#111a22] p-5 text-center border-t border-[#324d67]">
            <p className="text-[#92adc9] text-sm">
              Não tem uma conta?{' '}
              <Link href="/cadastro" className="text-primary font-bold hover:underline ml-1">Cadastre-se agora</Link>
            </p>
          </div>
        </div>

        {/* Help / Links */}
        <div className="mt-8 flex gap-6 text-sm text-[#92adc9]">
          <Link href="#" className="hover:text-primary transition-colors">Privacidade</Link>
          <Link href="#" className="hover:text-primary transition-colors">Termos</Link>
          <Link href="#" className="hover:text-primary transition-colors">Ajuda</Link>
        </div>
      </div>
    </div>
  )
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.49 12.275c0-.85-.076-1.666-.217-2.455H12v4.643h6.44c-.277 1.496-1.123 2.764-2.394 3.615v3.004h3.877c2.268-2.09 3.576-5.166 3.576-8.807Z"/>
    <path fill="#34A853" d="M12 24c3.233 0 5.945-1.07 7.926-2.9l-3.877-3.004c-1.072.718-2.443 1.144-4.049 1.144-3.12 0-5.76-2.108-6.704-4.942H1.305v3.108C3.268 21.34 7.37 24 12 24Z"/>
    <path fill="#FBBC05" d="M5.296 14.3c-.24-.717-.376-1.485-.376-2.3 0-.814.137-1.582.376-2.3V6.592H1.305C.473 8.243 0 10.086 0 12s.473 3.757 1.305 5.408l3.99-3.109Z"/>
    <path fill="#EA4335" d="M12 4.757c1.76 0 3.342.605 4.584 1.792l3.438-3.438C17.94 1.17 15.228 0 12 0 7.37 0 3.268 2.66 1.305 7.408l3.991 3.108C6.24 7.648 8.88 5.54 12 4.757Z"/>
  </svg>
)

const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
)
