'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { MENSAGENS_MOTIVACIONAIS, DICAS_DIARIAS, OpcaoRefeicao } from '@/lib/nutrivida/data'
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
  Calendar,
  Check,
  AlertTriangle,
  Award,
  ChevronRight,
  Activity,
  Beef,
  Wheat,
  Droplet,
  TrendingDown,
  BarChart3,
  RefreshCw
} from 'lucide-react'

interface ResumoSemanal {
  mediaCalorias: number
  mediaProteinas: number
  diasRegistrados: number
  tendenciaPeso: 'subindo' | 'descendo' | 'estavel'
  refeicaoMaisPulada: string | null
}

interface TreinoHoje {
  treino: string
  concluido: boolean
}

export default function NutriDashboardPage() {
  const { profile, imc, pesoAPerdido, pesoRestante, progressoPercentual, metaCalorias, metasMacros, updateProfile } = useNutriAuth()
  const [aguaHoje, setAguaHoje] = useState(0)
  const [refeicoesHoje, setRefeicoesHoje] = useState(0)
  const [suplementosHoje, setSuplementosHoje] = useState(0)
  const [treinosHoje, setTreinosHoje] = useState<TreinoHoje[]>([])
  const [macrosHoje, setMacrosHoje] = useState({ calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 })
  const [mensagemDia] = useState(MENSAGENS_MOTIVACIONAIS[Math.floor(Math.random() * MENSAGENS_MOTIVACIONAIS.length)])
  const [dicaDia] = useState(DICAS_DIARIAS[Math.floor(Math.random() * DICAS_DIARIAS.length)])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [resumoSemanal, setResumoSemanal] = useState<ResumoSemanal | null>(null)
  const [loadingResumo, setLoadingResumo] = useState(false)

  // Check if user needs onboarding
  useEffect(() => {
    if (profile && !profile.peso_atual && !profile.peso_meta) {
      setShowOnboarding(true)
    }
  }, [profile])

  // Fetch today's data
  const fetchTodayData = useCallback(async () => {
    if (!profile?.id) return

    const hoje = new Date().toISOString().split('T')[0]

    const [aguaResult, refeicoesResult, suplementosResult, treinosResult] = await Promise.all([
      supabase
        .from('agua_diaria_nutri')
        .select('quantidade_ml')
        .eq('user_id', profile.id)
        .eq('data', hoje)
        .single(),
      supabase
        .from('refeicoes_diarias_nutri')
        .select('tipo_refeicao, refeicao_selecionada')
        .eq('user_id', profile.id)
        .eq('data', hoje),
      supabase
        .from('suplementos_diarios_nutri')
        .select('id')
        .eq('user_id', profile.id)
        .eq('data', hoje)
        .eq('tomado', true),
      supabase
        .from('treinos_progresso_nutri')
        .select('treino, concluido')
        .eq('user_id', profile.id)
        .eq('data', hoje)
    ])

    if (aguaResult.data) setAguaHoje(aguaResult.data.quantidade_ml)
    if (refeicoesResult.data) {
      setRefeicoesHoje(refeicoesResult.data.length)
      // Calcular macros do dia
      const macros = refeicoesResult.data.reduce((acc, item) => {
        const refeicao = item.refeicao_selecionada as OpcaoRefeicao
        if (refeicao) {
          return {
            calorias: acc.calorias + (refeicao.calorias || 0),
            proteinas: acc.proteinas + (refeicao.proteinas || 0),
            carboidratos: acc.carboidratos + (refeicao.carboidratos || 0),
            gorduras: acc.gorduras + (refeicao.gorduras || 0)
          }
        }
        return acc
      }, { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 })
      setMacrosHoje(macros)
    }
    if (suplementosResult.data) setSuplementosHoje(suplementosResult.data.length)
    if (treinosResult.data) setTreinosHoje(treinosResult.data as TreinoHoje[])
  }, [profile?.id])

  useEffect(() => {
    fetchTodayData()
  }, [fetchTodayData])

  // Fetch weekly summary
  const fetchResumoSemanal = useCallback(async () => {
    if (!profile?.id) return
    setLoadingResumo(true)

    try {
      const seteDiasAtras = new Date()
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

      const { data: refeicoesSemanais } = await supabase
        .from('refeicoes_diarias_nutri')
        .select('data, tipo_refeicao, refeicao_selecionada')
        .eq('user_id', profile.id)
        .gte('data', seteDiasAtras.toISOString().split('T')[0])

      if (refeicoesSemanais && refeicoesSemanais.length > 0) {
        // Agrupar por dia
        const porDia: Record<string, { calorias: number; proteinas: number; tipos: string[] }> = {}
        refeicoesSemanais.forEach(r => {
          if (!porDia[r.data]) {
            porDia[r.data] = { calorias: 0, proteinas: 0, tipos: [] }
          }
          const refeicao = r.refeicao_selecionada as OpcaoRefeicao
          if (refeicao) {
            porDia[r.data].calorias += refeicao.calorias || 0
            porDia[r.data].proteinas += refeicao.proteinas || 0
            porDia[r.data].tipos.push(r.tipo_refeicao)
          }
        })

        const dias = Object.values(porDia)
        const mediaCalorias = Math.round(dias.reduce((a, b) => a + b.calorias, 0) / dias.length)
        const mediaProteinas = Math.round(dias.reduce((a, b) => a + b.proteinas, 0) / dias.length)

        // Descobrir qual refeição é mais pulada
        const tiposRefeicao = ['cafe', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia']
        const contagem = tiposRefeicao.map(tipo => ({
          tipo,
          count: Object.values(porDia).filter(d => d.tipos.includes(tipo)).length
        }))
        const maisPulada = contagem.sort((a, b) => a.count - b.count)[0]

        setResumoSemanal({
          mediaCalorias,
          mediaProteinas,
          diasRegistrados: dias.length,
          tendenciaPeso: pesoAPerdido > 0 ? 'descendo' : pesoAPerdido < 0 ? 'subindo' : 'estavel',
          refeicaoMaisPulada: maisPulada.count < dias.length ? maisPulada.tipo : null
        })
      }
    } catch (err) {
      console.error('Erro ao buscar resumo:', err)
    } finally {
      setLoadingResumo(false)
    }
  }, [profile?.id, pesoAPerdido])

  useEffect(() => {
    fetchResumoSemanal()
  }, [fetchResumoSemanal])

  // Verificar status de cada macro
  const getMacroStatus = (atual: number, meta: { min: number; max: number }) => {
    if (atual < meta.min * 0.8) return { status: 'baixo', color: 'text-yellow-500', bg: 'bg-yellow-100' }
    if (atual > meta.max) return { status: 'alto', color: 'text-red-500', bg: 'bg-red-100' }
    return { status: 'ok', color: 'text-green-500', bg: 'bg-green-100' }
  }

  const proteinaStatus = getMacroStatus(macrosHoje.proteinas, metasMacros.proteinas)
  const carbosStatus = getMacroStatus(macrosHoje.carboidratos, metasMacros.carboidratos)
  const gordurasStatus = getMacroStatus(macrosHoje.gorduras, metasMacros.gorduras)

  // Calcular progresso de cada item
  const aguaProgresso = Math.min(100, (aguaHoje / 3000) * 100)
  const caloriasProgresso = Math.min(100, (macrosHoje.calorias / metaCalorias) * 100)
  const proteinasProgresso = Math.min(100, (macrosHoje.proteinas / metasMacros.proteinas.max) * 100)
  const treinosConcluidos = treinosHoje.filter(t => t.concluido).length

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
                    <span className="font-medium text-gray-700">Esta amamentando?</span>
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

  const getNomeRefeicao = (tipo: string) => {
    const nomes: Record<string, string> = {
      cafe: 'Cafe da manha',
      lanche_manha: 'Lanche da manha',
      almoco: 'Almoco',
      lanche_tarde: 'Lanche da tarde',
      jantar: 'Jantar',
      ceia: 'Ceia'
    }
    return nomes[tipo] || tipo
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

      {/* CARD RESUMO INTEGRADO DO DIA */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-pink-500" />
            Resumo de Hoje
          </h2>
          <button onClick={fetchTodayData} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Grid de Status */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Calorias */}
          <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-600">Calorias</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{macrosHoje.calorias}</p>
            <p className="text-xs text-gray-500">/ {metaCalorias} kcal</p>
            <div className="mt-2 h-1.5 bg-orange-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${caloriasProgresso > 100 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${caloriasProgresso}%` }} />
            </div>
          </div>

          {/* Agua */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-600">Agua</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{(aguaHoje / 1000).toFixed(1)}L</p>
            <p className="text-xs text-gray-500">/ 3L meta</p>
            <div className="mt-2 h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${aguaProgresso}%` }} />
            </div>
          </div>

          {/* Refeicoes */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <UtensilsCrossed className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-600">Refeicoes</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{refeicoesHoje}/6</p>
            <p className="text-xs text-gray-500">registradas</p>
            <div className="mt-2 flex gap-0.5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= refeicoesHoje ? 'bg-green-500' : 'bg-green-100'}`} />
              ))}
            </div>
          </div>

          {/* Treino/Suplementos */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-600">Atividade</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{treinosConcluidos > 0 ? `${treinosConcluidos} treino${treinosConcluidos > 1 ? 's' : ''}` : `${suplementosHoje} suplem.`}</p>
            <p className="text-xs text-gray-500">{treinosConcluidos > 0 ? 'concluidos' : 'tomados'}</p>
            <div className="mt-2 flex gap-1">
              {treinosConcluidos > 0 ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Pill className="w-4 h-4 text-purple-500" />
              )}
              <span className="text-xs text-gray-500">{treinosConcluidos > 0 ? 'Treinou hoje!' : `${suplementosHoje}/8`}</span>
            </div>
          </div>
        </div>

        {/* Macros com status */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Distribuicao de Macros
          </p>
          <div className="grid grid-cols-3 gap-3">
            {/* Proteinas */}
            <div className={`rounded-xl p-3 ${proteinaStatus.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <Beef className={`w-4 h-4 ${proteinaStatus.color}`} />
                {proteinaStatus.status !== 'ok' && (
                  <AlertTriangle className={`w-3 h-3 ${proteinaStatus.color}`} />
                )}
              </div>
              <p className="text-lg font-bold text-gray-800">{macrosHoje.proteinas}g</p>
              <p className="text-xs text-gray-500">Proteinas</p>
              <p className="text-xs text-gray-400 mt-1">{metasMacros.proteinas.min}-{metasMacros.proteinas.max}g</p>
              <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${proteinaStatus.status === 'ok' ? 'bg-green-500' : proteinaStatus.status === 'baixo' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${proteinasProgresso}%` }} />
              </div>
            </div>

            {/* Carboidratos */}
            <div className={`rounded-xl p-3 ${carbosStatus.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <Wheat className={`w-4 h-4 ${carbosStatus.color}`} />
                {carbosStatus.status !== 'ok' && (
                  <AlertTriangle className={`w-3 h-3 ${carbosStatus.color}`} />
                )}
              </div>
              <p className="text-lg font-bold text-gray-800">{macrosHoje.carboidratos}g</p>
              <p className="text-xs text-gray-500">Carbos</p>
              <p className="text-xs text-gray-400 mt-1">{metasMacros.carboidratos.min}-{metasMacros.carboidratos.max}g</p>
              <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${carbosStatus.status === 'ok' ? 'bg-green-500' : carbosStatus.status === 'baixo' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (macrosHoje.carboidratos / metasMacros.carboidratos.max) * 100)}%` }} />
              </div>
            </div>

            {/* Gorduras */}
            <div className={`rounded-xl p-3 ${gordurasStatus.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <Droplet className={`w-4 h-4 ${gordurasStatus.color}`} />
                {gordurasStatus.status !== 'ok' && (
                  <AlertTriangle className={`w-3 h-3 ${gordurasStatus.color}`} />
                )}
              </div>
              <p className="text-lg font-bold text-gray-800">{macrosHoje.gorduras}g</p>
              <p className="text-xs text-gray-500">Gorduras</p>
              <p className="text-xs text-gray-400 mt-1">{metasMacros.gorduras.min}-{metasMacros.gorduras.max}g</p>
              <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${gordurasStatus.status === 'ok' ? 'bg-green-500' : gordurasStatus.status === 'baixo' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (macrosHoje.gorduras / metasMacros.gorduras.max) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RESUMO SEMANAL */}
      {resumoSemanal && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Resumo Semanal
            </h2>
            <Link href="/nutrivida/dashboard/progresso" className="text-xs bg-white/20 px-2 py-1 rounded-lg hover:bg-white/30 flex items-center gap-1">
              Ver mais <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{resumoSemanal.mediaCalorias}</p>
              <p className="text-xs text-white/70">media kcal/dia</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{resumoSemanal.mediaProteinas}g</p>
              <p className="text-xs text-white/70">media proteina</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{resumoSemanal.diasRegistrados}</p>
              <p className="text-xs text-white/70">dias registrados</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center flex flex-col items-center justify-center">
              {resumoSemanal.tendenciaPeso === 'descendo' ? (
                <>
                  <TrendingDown className="w-6 h-6 text-green-300" />
                  <p className="text-xs text-white/70 mt-1">Peso descendo</p>
                </>
              ) : resumoSemanal.tendenciaPeso === 'subindo' ? (
                <>
                  <TrendingUp className="w-6 h-6 text-red-300" />
                  <p className="text-xs text-white/70 mt-1">Peso subindo</p>
                </>
              ) : (
                <>
                  <Activity className="w-6 h-6 text-yellow-300" />
                  <p className="text-xs text-white/70 mt-1">Peso estavel</p>
                </>
              )}
            </div>
          </div>

          {resumoSemanal.refeicaoMaisPulada && (
            <div className="mt-4 p-3 bg-white/10 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
              <p className="text-sm">
                Voce costuma pular o <strong>{getNomeRefeicao(resumoSemanal.refeicaoMaisPulada)}</strong>. Tente manter essa refeicao para melhores resultados!
              </p>
            </div>
          )}
        </div>
      )}

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
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              -{pesoAPerdido} kg perdidos
            </p>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { href: '/nutrivida/dashboard/refeicoes', icon: UtensilsCrossed, label: 'Comer', bg: 'bg-orange-50', iconColor: 'text-orange-500' },
          { href: '/nutrivida/dashboard/agua', icon: Droplets, label: 'Agua', bg: 'bg-blue-50', iconColor: 'text-blue-500' },
          { href: '/nutrivida/dashboard/treinos', icon: Dumbbell, label: 'Treinar', bg: 'bg-purple-50', iconColor: 'text-purple-500' },
          { href: '/nutrivida/dashboard/ia', icon: Sparkles, label: 'Nutri IA', bg: 'bg-pink-50', iconColor: 'text-pink-500' }
        ].map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className={`${action.bg} rounded-2xl p-3 flex flex-col items-center gap-1 hover:opacity-80 transition-opacity`}
          >
            <action.icon className={`w-6 h-6 ${action.iconColor}`} />
            <span className="text-xs font-medium text-gray-600">{action.label}</span>
          </Link>
        ))}
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

      {/* Conquista do dia */}
      {caloriasProgresso >= 80 && caloriasProgresso <= 110 && refeicoesHoje >= 4 && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 text-white flex items-center gap-4">
          <Award className="w-10 h-10" />
          <div>
            <p className="font-bold">Parabens!</p>
            <p className="text-sm text-yellow-100">Voce esta no caminho certo hoje. Continue assim!</p>
          </div>
        </div>
      )}
    </div>
  )
}
