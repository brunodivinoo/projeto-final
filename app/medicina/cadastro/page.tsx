'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Stethoscope, Mail, Lock, User, ArrowLeft, Loader2, GraduationCap, MapPin, CheckCircle2 } from 'lucide-react'

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const ANOS_CURSO = [
  { value: 1, label: '1º ano' },
  { value: 2, label: '2º ano' },
  { value: 3, label: '3º ano' },
  { value: 4, label: '4º ano' },
  { value: 5, label: '5º ano' },
  { value: 6, label: '6º ano (Internato)' },
  { value: 7, label: 'Formado' }
]

export default function MedicinaCadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  // Step 1 - Dados básicos
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  // Step 2 - Dados acadêmicos
  const [faculdade, setFaculdade] = useState('')
  const [anoCurso, setAnoCurso] = useState<number | ''>('')
  const [estado, setEstado] = useState('')
  const [cidade, setCidade] = useState('')

  const validarStep1 = () => {
    if (!nome.trim()) {
      setErro('Digite seu nome')
      return false
    }
    if (!email.trim()) {
      setErro('Digite seu email')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErro('Email inválido')
      return false
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      return false
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem')
      return false
    }
    return true
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    if (validarStep1()) {
      setStep(2)
    }
  }

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome
          }
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setErro('Este email já está cadastrado')
        } else {
          setErro(error.message)
        }
        return
      }

      if (data.user) {
        // Criar profile_MED
        await supabase
          .from('profiles_med')
          .insert({
            id: data.user.id,
            nome,
            email,
            faculdade: faculdade || null,
            ano_curso: anoCurso || null,
            estado: estado || null,
            cidade: cidade || null,
            plano: 'gratuito'
          })

        // Criar limites de uso do mês atual
        const mesAtual = new Date().toISOString().slice(0, 7)
        await supabase
          .from('limites_uso_med')
          .insert({
            user_id: data.user.id,
            mes_referencia: mesAtual,
            questoes_dia: 0,
            data_questoes: new Date().toISOString().split('T')[0],
            simulados_mes: 0,
            perguntas_ia_mes: 0,
            resumos_ia_mes: 0,
            flashcards_ia_mes: 0,
            anotacoes_total: 0
          })

        setSucesso(true)
      }
    } catch (err) {
      console.error('Erro no cadastro:', err)
      setErro('Erro ao criar conta. Tente novamente.')
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
            <h2 className="text-2xl font-bold text-white mb-4">Cadastro realizado!</h2>
            <p className="text-emerald-200 mb-6">
              Enviamos um email de confirmação para <strong>{email}</strong>.
              Verifique sua caixa de entrada e clique no link para ativar sua conta.
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
      {/* Header */}
      <header className="p-4">
        <Link
          href="/medicina"
          className="inline-flex items-center gap-2 text-emerald-200 hover:text-white transition-colors"
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">PREPARAMED</h1>
            <p className="text-emerald-200">Crie sua conta gratuita</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-emerald-300'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 rounded ${step >= 2 ? 'bg-emerald-500' : 'bg-white/20'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-emerald-300'
            }`}>
              2
            </div>
          </div>

          {/* Card de Cadastro */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            {/* Erro */}
            {erro && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {erro}
              </div>
            )}

            {/* Step 1 - Dados básicos */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4 text-center">
                  Dados da conta
                </h2>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-1.5">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-1.5">
                    Email
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

                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
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
                    Confirmar senha
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

                {/* Botão Continuar */}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all"
                >
                  Continuar
                </button>
              </form>
            )}

            {/* Step 2 - Dados acadêmicos */}
            {step === 2 && (
              <form onSubmit={handleCadastro} className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4 text-center">
                  Dados acadêmicos
                </h2>
                <p className="text-sm text-emerald-300 text-center mb-4">
                  (Opcional - você pode preencher depois)
                </p>

                {/* Faculdade */}
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-1.5">
                    Faculdade
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                    <input
                      type="text"
                      value={faculdade}
                      onChange={(e) => setFaculdade(e.target.value)}
                      placeholder="Ex: USP, UNIFESP, UFMG..."
                      className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Ano do Curso */}
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-1.5">
                    Ano do curso
                  </label>
                  <select
                    value={anoCurso}
                    onChange={(e) => setAnoCurso(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900">Selecione...</option>
                    {ANOS_CURSO.map((ano) => (
                      <option key={ano.value} value={ano.value} className="bg-gray-900">
                        {ano.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado e Cidade */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-200 mb-1.5">
                      Estado
                    </label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
                    >
                      <option value="" className="bg-gray-900">UF</option>
                      {ESTADOS_BRASIL.map((uf) => (
                        <option key={uf} value={uf} className="bg-gray-900">
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-200 mb-1.5">
                      Cidade
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                      <input
                        type="text"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="Cidade"
                        className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 focus:outline-none transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar conta'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Link para Login */}
            <p className="mt-6 text-center text-emerald-200">
              Já tem uma conta?{' '}
              <Link
                href="/medicina/login"
                className="text-white font-semibold hover:underline"
              >
                Faça login
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-emerald-300/60">
            Ao criar sua conta, você concorda com nossos{' '}
            <Link href="/termos" className="underline hover:text-white">Termos de Uso</Link>
            {' '}e{' '}
            <Link href="/privacidade" className="underline hover:text-white">Política de Privacidade</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
