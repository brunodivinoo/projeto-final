'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { supabase } from '@/lib/supabase'
import {
  User,
  Mail,
  GraduationCap,
  MapPin,
  Save,
  Camera,
  Crown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3
} from 'lucide-react'

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const periodosCurso = [
  { value: 1, label: '1º Período' },
  { value: 2, label: '2º Período' },
  { value: 3, label: '3º Período' },
  { value: 4, label: '4º Período' },
  { value: 5, label: '5º Período' },
  { value: 6, label: '6º Período' },
  { value: 7, label: '7º Período' },
  { value: 8, label: '8º Período' },
  { value: 9, label: '9º Período (Internato)' },
  { value: 10, label: '10º Período (Internato)' },
  { value: 11, label: '11º Período (Internato)' },
  { value: 12, label: '12º Período (Internato)' },
  { value: 13, label: 'Formado' },
]

export default function PerfilPage() {
  const router = useRouter()
  const { user, profile, plano, refreshProfile } = useMedAuth()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Estados para alteração de email
  const [editandoEmail, setEditandoEmail] = useState(false)
  const [novoEmail, setNovoEmail] = useState('')
  const [salvandoEmail, setSalvandoEmail] = useState(false)
  const [emailEnviado, setEmailEnviado] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    faculdade: '',
    periodo_curso: 1,
    estado: '',
    cidade: ''
  })

  useEffect(() => {
    if (profile) {
      setForm({
        nome: profile.nome || '',
        email: profile.email || user?.email || '',
        faculdade: profile.faculdade || '',
        periodo_curso: profile.periodo_curso || profile.ano_curso || 1,
        estado: profile.estado || '',
        cidade: profile.cidade || ''
      })
      setNovoEmail(profile.email || user?.email || '')
    }
  }, [profile, user])

  const handleAlterarEmail = async () => {
    if (!novoEmail || novoEmail === form.email) {
      setEditandoEmail(false)
      return
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(novoEmail)) {
      setError('Digite um email válido')
      return
    }

    setSalvandoEmail(true)
    setError('')

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: novoEmail
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setEmailEnviado(true)
        setEditandoEmail(false)
      }
    } catch (err) {
      console.error('Erro ao alterar email:', err)
      setError('Erro ao alterar email. Tente novamente.')
    } finally {
      setSalvandoEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      const response = await fetch('/api/medicina/auth/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          ...form
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar perfil')
      }

      await refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Não foi possível salvar as alterações')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Meu Perfil
        </h1>
        <p className="text-slate-500 mt-1">
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Avatar Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {form.nome?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{form.nome || 'Estudante'}</h2>
            <p className="text-slate-500">{form.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full ${
                plano === 'residencia' ? 'bg-amber-100 text-amber-700' :
                plano === 'premium' ? 'bg-emerald-100 text-emerald-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {plano === 'residencia' ? '👑 Residência' :
                 plano === 'premium' ? '⭐ Premium' : 'Gratuito'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Informações Pessoais</h3>

          <div className="grid gap-6">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-12 pr-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                E-mail
              </label>
              {editandoEmail ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      className="w-full bg-white border border-emerald-500 rounded-lg py-3 pl-12 pr-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="novo@email.com"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAlterarEmail}
                      disabled={salvandoEmail}
                      className="flex-1 py-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {salvandoEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Confirmar'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoEmail(false)
                        setNovoEmail(form.email)
                      }}
                      className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg py-3 pl-12 pr-12 text-slate-600 cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setEditandoEmail(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    title="Alterar email"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              {emailEnviado ? (
                <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Email de confirmação enviado para {novoEmail}. Verifique sua caixa de entrada.
                </p>
              ) : (
                <p className="text-slate-500 text-xs mt-1">Clique no ícone para alterar o email</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Informações Acadêmicas</h3>

          <div className="grid gap-6">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Faculdade
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={form.faculdade}
                  onChange={(e) => setForm({ ...form, faculdade: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-12 pr-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white"
                  placeholder="Nome da sua faculdade"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Período do Curso
              </label>
              <select
                value={form.periodo_curso}
                onChange={(e) => setForm({ ...form, periodo_curso: parseInt(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white"
              >
                {periodosCurso.map((periodo) => (
                  <option key={periodo.value} value={periodo.value} className="bg-white">
                    {periodo.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  Estado
                </label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white"
                >
                  <option value="" className="bg-white">Selecione</option>
                  {estados.map((uf) => (
                    <option key={uf} value={uf} className="bg-white">
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  Cidade
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-12 pr-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white"
                    placeholder="Sua cidade"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span>Perfil atualizado com sucesso!</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar Alterações
            </>
          )}
        </button>
      </form>

      {/* Statistics Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Estatísticas Gerais</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">
              {profile?.questoes_respondidas || 0}
            </div>
            <div className="text-slate-600 text-sm">Questões</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-400">
              {profile?.questoes_respondidas
                ? Math.round((profile.questoes_corretas || 0) / profile.questoes_respondidas * 100)
                : 0}%
            </div>
            <div className="text-slate-600 text-sm">Aproveitamento</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">
              {profile?.tempo_estudo_segundos
                ? Math.floor(profile.tempo_estudo_segundos / 3600)
                : 0}h
            </div>
            <div className="text-slate-600 text-sm">Tempo de Estudo</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {profile?.questoes_corretas || 0}
            </div>
            <div className="text-slate-600 text-sm">Acertos</div>
          </div>
        </div>
      </div>
    </div>
  )
}
