'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nome: form.name },
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Este e-mail já está cadastrado'
        : error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  const handleGithubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#101922] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#192633] rounded-xl p-8 border border-[#324d67] text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-green-400 text-3xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Conta criada!</h2>
          <p className="text-[#92adc9] mb-6">
            Enviamos um link de confirmação para <strong className="text-white">{form.email}</strong>. Verifique seu e-mail para ativar sua conta.
          </p>
          <Link href="/login">
            <button className="w-full flex items-center justify-center rounded-lg h-12 bg-[#137fec] text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-[#137fec]/20">
              Ir para Login
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#101922] text-white overflow-x-hidden transition-colors duration-200">
      {/* Header com design exato do HTML */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#233648] px-4 py-3 md:px-10 bg-[#111a22]">
        <div className="flex items-center gap-4 text-white">
          <div className="w-8 h-8 text-[#137fec]">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
              <path clipRule="evenodd" d="M39.998 12.236C39.9944 12.2537 39.9875 12.2845 39.9748 12.3294C39.9436 12.4399 39.8949 12.5741 39.8346 12.7175C39.8168 12.7597 39.7989 12.8007 39.7813 12.8398C38.5103 13.7113 35.9788 14.9393 33.7095 15.4811C30.9875 16.131 27.6413 16.5217 24 16.5217C20.3587 16.5217 17.0125 16.131 14.2905 15.4811C12.0012 14.9346 9.44505 13.6897 8.18538 12.8168C8.17384 12.7925 8.16216 12.767 8.15052 12.7408C8.09919 12.6249 8.05721 12.5114 8.02977 12.411C8.00356 12.3152 8.00039 12.2667 8.00004 12.2612C8.00004 12.261 8 12.2607 8.00004 12.2612C8.00004 12.2359 8.0104 11.9233 8.68485 11.3686C9.34546 10.8254 10.4222 10.2469 11.9291 9.72276C14.9242 8.68098 19.1919 8 24 8C28.8081 8 33.0758 8.68098 36.0709 9.72276C37.5778 10.2469 38.6545 10.8254 39.3151 11.3686C39.9006 11.8501 39.9857 12.1489 39.998 12.236ZM4.95178 15.2312L21.4543 41.6973C22.6288 43.5809 25.3712 43.5809 26.5457 41.6973L43.0534 15.223C43.0709 15.1948 43.0878 15.1662 43.104 15.1371L41.3563 14.1648C43.104 15.1371 43.1038 15.1374 43.104 15.1371L43.1051 15.135L43.1065 15.1325L43.1101 15.1261L43.1199 15.1082C43.1276 15.094 43.1377 15.0754 43.1497 15.0527C43.1738 15.0075 43.2062 14.9455 43.244 14.8701C43.319 14.7208 43.4196 14.511 43.5217 14.2683C43.6901 13.8679 44 13.0689 44 12.2609C44 10.5573 43.003 9.22254 41.8558 8.2791C40.6947 7.32427 39.1354 6.55361 37.385 5.94477C33.8654 4.72057 29.133 4 24 4C18.867 4 14.1346 4.72057 10.615 5.94478C8.86463 6.55361 7.30529 7.32428 6.14419 8.27911C4.99695 9.22255 3.99999 10.5573 3.99999 12.2609C3.99999 13.1275 4.29264 13.9078 4.49321 14.3607C4.60375 14.6102 4.71348 14.8196 4.79687 14.9689C4.83898 15.0444 4.87547 15.1065 4.9035 15.1529C4.91754 15.1762 4.92954 15.1957 4.93916 15.2111L4.94662 15.223L4.95178 15.2312ZM35.9868 18.996L24 38.22L12.0131 18.996C12.4661 19.1391 12.9179 19.2658 13.3617 19.3718C16.4281 20.1039 20.0901 20.5217 24 20.5217C27.9099 20.5217 31.5719 20.1039 34.6383 19.3718C35.082 19.2658 35.5339 19.1391 35.9868 18.996Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">StudySocial</h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <div className="hidden md:flex items-center gap-9">
            <a className="text-[#92adc9] text-sm font-medium leading-normal hover:text-[#137fec] transition-colors" href="#">Sobre</a>
            <a className="text-[#92adc9] text-sm font-medium leading-normal hover:text-[#137fec] transition-colors" href="#">Recursos</a>
            <a className="text-[#92adc9] text-sm font-medium leading-normal hover:text-[#137fec] transition-colors" href="#">Contato</a>
          </div>
          <div className="flex gap-2">
            <Link href="/login">
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#233648] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#2f465c] transition-colors">
                <span className="truncate">Login</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-5 md:py-12">
        <div className="w-full max-w-[480px] flex flex-col gap-6">
          {/* Heading */}
          <div className="flex flex-col gap-2 text-left md:text-center">
            <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              Crie sua conta
            </h1>
            <p className="text-[#92adc9] text-base font-normal leading-normal">
              Junte-se a comunidade. Comece a gerenciar seus estudos e conectar-se com colegas.
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-5 mt-4" onSubmit={handleSubmit}>
            {/* Nome completo */}
            <label className="flex flex-col gap-2">
              <span className="text-white text-sm font-medium leading-normal">Nome completo</span>
              <div className="flex items-center rounded-lg border border-[#324d67] bg-[#192633] focus-within:border-[#137fec] focus-within:ring-1 focus-within:ring-[#137fec] h-14 overflow-hidden transition-all">
                <div className="pl-4 flex items-center justify-center text-[#92adc9]">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <input
                  className="flex w-full flex-1 border-none bg-transparent text-white focus:outline-0 focus:ring-0 placeholder:text-[#92adc9] p-4 text-base font-normal leading-normal"
                  placeholder="Ex: Maria Silva"
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </label>

            {/* E-mail */}
            <label className="flex flex-col gap-2">
              <span className="text-white text-sm font-medium leading-normal">E-mail</span>
              <div className="flex items-center rounded-lg border border-[#324d67] bg-[#192633] focus-within:border-[#137fec] focus-within:ring-1 focus-within:ring-[#137fec] h-14 overflow-hidden transition-all">
                <div className="pl-4 flex items-center justify-center text-[#92adc9]">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  className="flex w-full flex-1 border-none bg-transparent text-white focus:outline-0 focus:ring-0 placeholder:text-[#92adc9] p-4 text-base font-normal leading-normal"
                  placeholder="Ex: maria@exemplo.com"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </label>

            {/* Senha */}
            <label className="flex flex-col gap-2">
              <span className="text-white text-sm font-medium leading-normal">Senha</span>
              <div className="flex items-center rounded-lg border border-[#324d67] bg-[#192633] focus-within:border-[#137fec] focus-within:ring-1 focus-within:ring-[#137fec] h-14 overflow-hidden transition-all">
                <div className="pl-4 flex items-center justify-center text-[#92adc9]">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  className="flex w-full flex-1 border-none bg-transparent text-white focus:outline-0 focus:ring-0 placeholder:text-[#92adc9] p-4 text-base font-normal leading-normal"
                  placeholder="Crie uma senha segura"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  className="pr-4 flex items-center justify-center text-[#92adc9] hover:text-[#137fec] transition-colors cursor-pointer"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[22px]">visibility</span>
                </button>
              </div>
            </label>

            {/* Confirmar senha */}
            <label className="flex flex-col gap-2">
              <span className="text-white text-sm font-medium leading-normal">Confirmar senha</span>
              <div className="flex items-center rounded-lg border border-[#324d67] bg-[#192633] focus-within:border-[#137fec] focus-within:ring-1 focus-within:ring-[#137fec] h-14 overflow-hidden transition-all">
                <div className="pl-4 flex items-center justify-center text-[#92adc9]">
                  <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                </div>
                <input
                  className="flex w-full flex-1 border-none bg-transparent text-white focus:outline-0 focus:ring-0 placeholder:text-[#92adc9] p-4 text-base font-normal leading-normal"
                  placeholder="Repita sua senha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                />
                <button
                  className="pr-4 flex items-center justify-center text-[#92adc9] hover:text-[#137fec] transition-colors cursor-pointer"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-symbols-outlined text-[22px]">visibility</span>
                </button>
              </div>
            </label>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-[#137fec] text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-[#137fec]/20 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="truncate">Cadastrar</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="flex flex-col gap-4 items-center">
            <p className="text-[#92adc9] text-sm font-normal">
              Já tem uma conta?
              <Link href="/login" className="text-[#137fec] font-bold hover:underline ml-1">
                Faça login
              </Link>
            </p>

            {/* Divider */}
            <div className="relative flex w-full items-center py-2">
              <div className="flex-grow border-t border-[#324d67]"></div>
              <span className="mx-4 flex-shrink-0 text-xs font-medium text-[#92adc9] uppercase tracking-wider">Ou</span>
              <div className="flex-grow border-t border-[#324d67]"></div>
            </div>

            {/* Social Login */}
            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex flex-1 items-center justify-center gap-3 rounded-lg border border-[#324d67] bg-[#192633] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#233648] shadow-sm"
              >
                <div className="w-5 h-5">
                  <svg className="h-full w-full" viewBox="0 0 24 24">
                    <path d="M12.0003 20.45c4.6669 0 8.5829-3.916 8.5829-8.5829 0-4.667-3.916-8.583-8.5829-8.583-4.667 0-8.583 3.916-8.583 8.583 0 4.6669 3.916 8.5829 8.583 8.5829Z" fill="#fff" fillOpacity="0" stroke="none"></path>
                    <path d="M23.49 12.275c0-.85-.076-1.666-.217-2.455H12v4.643h6.44c-.277 1.496-1.123 2.764-2.394 3.615v3.004h3.877c2.268-2.09 3.576-5.166 3.576-8.807Z" fill="#4285F4"></path>
                    <path d="M12 24c3.233 0 5.945-1.07 7.926-2.9l-3.877-3.004c-1.072.718-2.443 1.144-4.049 1.144-3.12 0-5.76-2.108-6.704-4.942H1.305v3.108C3.268 21.34 7.37 24 12 24Z" fill="#34A853"></path>
                    <path d="M5.296 14.3c-.24-.717-.376-1.485-.376-2.3 0-.814.137-1.582.376-2.3V6.592H1.305C.473 8.243 0 10.086 0 12s.473 3.757 1.305 5.408l3.99-3.109Z" fill="#FBBC05"></path>
                    <path d="M12 4.757c1.76 0 3.342.605 4.584 1.792l3.438-3.438C17.94 1.17 15.228 0 12 0 7.37 0 3.268 2.66 1.305 7.408l3.991 3.108C6.24 7.648 8.88 5.54 12 4.757Z" fill="#EA4335"></path>
                  </svg>
                </div>
                Google
              </button>
              <button
                type="button"
                onClick={handleGithubLogin}
                className="flex flex-1 items-center justify-center gap-3 rounded-lg border border-[#324d67] bg-[#192633] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#233648] shadow-sm"
              >
                <div className="w-5 h-5 text-white">
                  <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                  </svg>
                </div>
                GitHub
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
