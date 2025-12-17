'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  const handleGithubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  return (
    <div className="min-h-screen bg-[#101922] flex items-center justify-center p-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-[#192633] rounded-xl shadow-2xl border border-[#324d67] relative z-10">
        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">school</span>
            </div>
            <span className="text-xl font-bold text-white">StudyHub</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo de volta!</h1>
          <p className="text-[#92adc9] text-sm mt-1">Acesse sua área de estudos</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 pt-6 flex flex-col gap-5">
          <Input
            label="E-mail ou Usuário"
            icon="mail"
            type="email"
            placeholder="exemplo@estudante.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-white text-sm font-medium">Senha</span>
              <Link href="#" className="text-primary text-sm hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              label=""
              icon="lock"
              type="password"
              placeholder="Sua senha segura"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2">
            Entrar <span className="material-symbols-outlined text-lg">login</span>
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-[#324d67]" />
            <span className="text-[#92adc9] text-xs uppercase">Ou continue com</span>
            <div className="flex-1 h-px bg-[#324d67]" />
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" onClick={handleGoogleLogin}>
              <GoogleIcon /> Google
            </Button>
            <Button variant="outline" type="button" onClick={handleGithubLogin}>
              <GithubIcon /> GitHub
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-[#111a22] p-5 text-center border-t border-[#324d67]">
          <p className="text-[#92adc9] text-sm">
            Não tem conta? <Link href="/cadastro" className="text-primary font-bold hover:underline">Cadastre-se</Link>
          </p>
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

const GithubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)
