'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { MENSAGENS_MOTIVACIONAIS, DICAS_DIARIAS } from '@/lib/nutrivida/data'
import {
  Droplets,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  Pill,
  Target,
  Flame,
  Scale,
  Baby,
  Sparkles,
  ArrowRight,
  Calendar
} from 'lucide-react'

export default function NutriDashboardPage() {
  const { profile, imc, pesoAPerdido, pesoRestante, progressoPercentual, metaCalorias, updateProfile } = useNutriAuth()
  const [aguaHoje, setAguaHoje] = useState(0)
  const [refeicoesHoje, setRefeicoesHoje] = useState(0)
  const [suplementosHoje, setSuplementosHoje] = useState(0)
  const [mensagemDia] = useState(MENSAGENS_MOTIVACIONAIS[Math.floor(Math.random() * MENSAGENS_MOTIVACIONAIS.length)])
  const [dicaDia] = useState(DICAS_DIARIAS[Math.floor(Math.random() * DICAS_DIARIAS.length)])
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Check if user needs onboarding
  useEffect(() => {
    if (profile && !profile.peso_atual && !profile.peso_meta) {
      setShowOnboarding(true)
    }
  }, [profile])

  // Fetch today's data
  useEffect(() => {
    const fetchTodayData = async () => {
      if (!profile?.id) return

      const hoje = new Date().toISOString().split('T')[0]

      const [aguaResult, refeicoesResult, suplementosResult] = await Promise.all([
        supabase
          .from('agua_diaria_nutri')
          .select('quantidade_ml')
          .eq('user_id', profile.id)
          .eq('data', hoje)
          .single(),
        supabase
          .from('refeicoes_diarias_nutri')
          .select('id')
          .eq('user_id', profile.id)
          .eq('data', hoje),
        supabase
          .from('suplementos_diarios_nutri')
          .select('id')
          .eq('user_id', profile.id)
          .eq('data', hoje)
          .eq('tomado', true)
      ])

      if (aguaResult.data) setAguaHoje(aguaResult.data.quantidade_ml)
      if (refeicoesResult.data) setRefeicoesHoje(refeicoesResult.data.length)
      if (suplementosResult.data) setSuplementosHoje(suplementosResult.data.length)
    }

    fetchTodayData()
  }, [profile?.id])

  // Onboarding Modal
  const OnboardingModal = () => {
    const [step, setStep] = useState(1)
    const [temFilho, setTemFilho] = useState(false)
    const [formData, setFormData] = useState({
      nome: profile?.nome || '',
      idade: profile?.idade || 25,
      altura: profile?.altura || 1.65,
      peso_inicial: profile?.peso_inicial || 70,
      peso_atual: profile?.peso_atual || 70,
      peso_meta: profile?.peso_meta || 60,
      idade_bebe: profile?.idade_bebe || 0,
      amamentando: profile?.amamentando || false,
      plano: profile?.plano || 'normal'
    })

    const handleSave = async () => {
      const dataToSave = {
        ...formData,
        peso_inicial: formData.peso_inicial || formData.peso_atual,
        // Se nao tem filho, limpa os campos relacionados
        idade_bebe: temFilho ? formData.idade_bebe : null,
        amamentando: temFilho ? formData.amamentando : false
      }
      const success = await updateProfile(dataToSave)
      if (success) {
        setShowOnboarding(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Vamos comecar!</h2>
            <p className="text-gray-500 mt-1">Configure seu perfil para personalizar sua experiencia</p>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Seu nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Como podemos te chamar?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Idade</label>
                  <input
                    type="number"
                    value={formData.idade || ''}
                    onChange={(e) => setFormData({ ...formData, idade: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Altura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.altura || ''}
                    onChange={(e) => setFormData({ ...formData, altura: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="1.65"
                  />
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
              >
                Proximo
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Peso Atual (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.peso_atual || ''}
                    onChange={(e) => setFormData({ ...formData, peso_atual: Number(e.target.value), peso_inicial: formData.peso_inicial || Number(e.target.value) })}
                    className="w-full px-3 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Peso Meta (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.peso_meta || ''}
                    onChange={(e) => setFormData({ ...formData, peso_meta: Number(e.target.value) })}
                    className="w-full px-3 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>

              {/* Pergunta sobre maternidade - opcional */}
              <div className="flex items-center justify-between p-4 bg-pink-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Baby className="w-5 h-5 text-pink-500" />
                  <span className="font-medium text-gray-700">Voce tem filho(a)?</span>
                </div>
                <button
                  onClick={() => setTemFilho(!temFilho)}
                  className={`w-12 h-7 rounded-full transition-all ${temFilho ? 'bg-pink-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${temFilho ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Campos de maternidade - aparecem apenas se tem filho */}
              {temFilho && (
                <div className="space-y-3 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Idade do bebe (dias)</label>
                    <input
                      type="number"
                      value={formData.idade_bebe || ''}
                      onChange={(e) => setFormData({ ...formData, idade_bebe: Number(e.target.value) })}
                      className="w-full px-3 py-3 bg-white border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="Ex: 30"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-700">Esta amamentando?</span>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, amamentando: !formData.amamentando })}
                      className={`w-12 h-7 rounded-full transition-all ${formData.amamentando ? 'bg-purple-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.amamentando ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Escolha seu plano</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, plano: 'normal' })}
                    className={`p-4 rounded-xl border-2 transition-all ${formData.plano === 'normal' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'}`}
                  >
                    <p className="font-semibold text-gray-800">Equilibrado</p>
                    <p className="text-xs text-gray-500 mt-1">1900 kcal/dia</p>
                    <p className="text-xs text-pink-500">2-3 kg/mes</p>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, plano: 'restritivo' })}
                    className={`p-4 rounded-xl border-2 transition-all ${formData.plano === 'restritivo' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                  >
                    <p className="font-semibold text-gray-800">Acelerado</p>
                    <p className="text-xs text-gray-500 mt-1">1300 kcal/dia</p>
                    <p className="text-xs text-purple-500">ate 5 kg/mes</p>
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  Comecar!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const getIconForDica = (icon: string) => {
    const icons: Record<string, React.ReactNode> = {
      water: <Droplets className="w-5 h-5 text-blue-500" />,
      egg: <UtensilsCrossed className="w-5 h-5 text-yellow-500" />,
      salad: <UtensilsCrossed className="w-5 h-5 text-green-500" />,
      walk: <Dumbbell className="w-5 h-5 text-purple-500" />,
      sleep: <Calendar className="w-5 h-5 text-indigo-500" />,
      fruit: <UtensilsCrossed className="w-5 h-5 text-red-500" />,
      phone: <Droplets className="w-5 h-5 text-cyan-500" />,
      stretch: <Dumbbell className="w-5 h-5 text-pink-500" />
    }
    return icons[icon] || <Sparkles className="w-5 h-5 text-pink-500" />
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {showOnboarding && <OnboardingModal />}

      {/* Saudacao */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">Ola, {profile?.nome || 'Usuaria'}!</h1>
            {profile?.idade_bebe && profile.idade_bebe > 0 && (
              <p className="text-pink-100 text-sm mt-1">Bebe com {profile.idade_bebe} dias {profile.amamentando && '• Amamentando'}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{progressoPercentual}%</p>
            <p className="text-pink-100 text-xs">progresso</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
          <p className="text-sm italic">&quot;{mensagemDia}&quot;</p>
        </div>
      </div>

      {/* Dica do Dia */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center flex-shrink-0">
          {getIconForDica(dicaDia.icon)}
        </div>
        <div>
          <p className="text-xs text-pink-500 font-medium">DICA DO DIA</p>
          <p className="text-gray-700 font-medium">{dicaDia.texto}</p>
        </div>
      </div>

      {/* Stats Rapidos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-5 h-5 text-pink-500" />
            <span className="text-sm text-gray-500">Peso Atual</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{profile?.peso_atual || '--'} kg</p>
          {pesoAPerdido > 0 && (
            <p className="text-xs text-green-500 mt-1">-{pesoAPerdido} kg perdidos</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Meta</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{profile?.peso_meta || '--'} kg</p>
          {pesoRestante > 0 && (
            <p className="text-xs text-gray-400 mt-1">{pesoRestante} kg restantes</p>
          )}
        </div>
      </div>

      {/* Progresso Diario */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
        <h2 className="font-semibold text-gray-800 mb-4">Progresso de Hoje</h2>
        <div className="space-y-4">
          {/* Agua */}
          <Link href="/nutrivida/dashboard/agua" className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Agua</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (aguaHoje / 3000) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-blue-600">{(aguaHoje / 1000).toFixed(1)}L</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </Link>

          {/* Refeicoes */}
          <Link href="/nutrivida/dashboard/refeicoes" className="flex items-center gap-4 p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Refeicoes</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-orange-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (refeicoesHoje / 6) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-orange-600">{refeicoesHoje}/6</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </Link>

          {/* Suplementos */}
          <Link href="/nutrivida/dashboard/suplementos" className="flex items-center gap-4 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Suplementos</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-purple-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (suplementosHoje / 8) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-purple-600">{suplementosHoje}/8</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-4 text-white">
          <Flame className="w-6 h-6 mb-2" />
          <p className="text-2xl font-bold">{metaCalorias}</p>
          <p className="text-pink-100 text-sm">kcal/dia</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-4 text-white">
          <Scale className="w-6 h-6 mb-2" />
          <p className="text-2xl font-bold">{imc || '--'}</p>
          <p className="text-purple-100 text-sm">IMC</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { href: '/nutrivida/dashboard/refeicoes', icon: UtensilsCrossed, label: 'Comer', color: 'orange' },
          { href: '/nutrivida/dashboard/agua', icon: Droplets, label: 'Agua', color: 'blue' },
          { href: '/nutrivida/dashboard/treinos', icon: Dumbbell, label: 'Treinar', color: 'purple' },
          { href: '/nutrivida/dashboard/ia', icon: Sparkles, label: 'Nutri IA', color: 'pink' }
        ].map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className={`bg-${action.color}-50 rounded-2xl p-3 flex flex-col items-center gap-1 hover:bg-${action.color}-100 transition-colors`}
          >
            <action.icon className={`w-6 h-6 text-${action.color}-500`} />
            <span className="text-xs font-medium text-gray-600">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
