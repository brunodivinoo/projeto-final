'use client'

import { useState, useEffect } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { Droplets, Plus, RotateCcw, TrendingUp, Lightbulb, Check } from 'lucide-react'

const QUICK_AMOUNTS = [
  { ml: 150, label: '150ml' },
  { ml: 200, label: '200ml' },
  { ml: 250, label: '250ml' },
  { ml: 300, label: '300ml' },
  { ml: 350, label: '350ml' },
  { ml: 500, label: '500ml' },
  { ml: 750, label: '750ml' },
  { ml: 1000, label: '1L' }
]

const DICAS_AGUA = [
  'Beba um copo de agua ao acordar',
  'Leve uma garrafa sempre com voce',
  'Coloque lembretes no celular',
  'Beba um copo antes de cada refeicao',
  'Associe a hidratacao a uma atividade',
  'Use um app para lembrar'
]

export default function AguaPage() {
  const { profile } = useNutriAuth()
  const [quantidade, setQuantidade] = useState(0)
  const [meta] = useState(3000) // 3 litros
  const [loading, setLoading] = useState(true)
  const [historico, setHistorico] = useState<Array<{ data: string; quantidade: number }>>([])
  const [showSuccess, setShowSuccess] = useState(false)

  const hoje = new Date().toISOString().split('T')[0]
  const progresso = Math.min(100, (quantidade / meta) * 100)
  const litros = (quantidade / 1000).toFixed(1)
  const metaLitros = (meta / 1000).toFixed(1)

  useEffect(() => {
    const fetchAgua = async () => {
      if (!profile?.id) return

      try {
        // Buscar agua de hoje
        const { data: aguaHoje } = await supabase
          .from('agua_diaria_nutri')
          .select('quantidade_ml')
          .eq('user_id', profile.id)
          .eq('data', hoje)
          .single()

        if (aguaHoje) {
          setQuantidade(aguaHoje.quantidade_ml)
        }

        // Buscar historico da ultima semana
        const seteDiasAtras = new Date()
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

        const { data: historicoData } = await supabase
          .from('agua_diaria_nutri')
          .select('data, quantidade_ml')
          .eq('user_id', profile.id)
          .gte('data', seteDiasAtras.toISOString().split('T')[0])
          .order('data', { ascending: false })

        if (historicoData) {
          setHistorico(historicoData.map(h => ({ data: h.data, quantidade: h.quantidade_ml })))
        }
      } catch (err) {
        console.error('Erro ao buscar agua:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAgua()
  }, [profile?.id, hoje])

  const adicionarAgua = async (ml: number) => {
    if (!profile?.id) return

    const novaQuantidade = quantidade + ml

    try {
      const { error } = await supabase
        .from('agua_diaria_nutri')
        .upsert({
          user_id: profile.id,
          data: hoje,
          quantidade_ml: novaQuantidade,
          meta_ml: meta
        }, {
          onConflict: 'user_id,data'
        })

      if (!error) {
        setQuantidade(novaQuantidade)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 1500)
      }
    } catch (err) {
      console.error('Erro ao adicionar agua:', err)
    }
  }

  const resetar = async () => {
    if (!profile?.id) return

    try {
      const { error } = await supabase
        .from('agua_diaria_nutri')
        .upsert({
          user_id: profile.id,
          data: hoje,
          quantidade_ml: 0,
          meta_ml: meta
        }, {
          onConflict: 'user_id,data'
        })

      if (!error) {
        setQuantidade(0)
      }
    } catch (err) {
      console.error('Erro ao resetar agua:', err)
    }
  }

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr + 'T00:00:00')
    const hojeDate = new Date()
    hojeDate.setHours(0, 0, 0, 0)
    const diff = Math.floor((hojeDate.getTime() - data.getTime()) / (1000 * 60 * 60 * 24))

    if (diff === 0) return 'Hoje'
    if (diff === 1) return 'Ontem'
    return data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hidratacao</h1>
          <p className="text-gray-500">Meta diaria: {metaLitros} litros</p>
        </div>
        <button
          onClick={resetar}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Reiniciar contador"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Circulo de Progresso */}
      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-8 text-white text-center relative overflow-hidden">
        {/* Success animation */}
        {showSuccess && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/90 z-10 animate-pulse">
            <Check className="w-16 h-16" />
          </div>
        )}

        <div className="relative w-48 h-48 mx-auto">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="12"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="white"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progresso / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets className="w-8 h-8 mb-1 opacity-80" />
            <p className="text-4xl font-bold">{litros}L</p>
            <p className="text-blue-100">de {metaLitros}L</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-5xl font-bold">{Math.round(progresso)}%</p>
          <p className="text-blue-100 mt-1">
            {quantidade >= meta ? 'Meta atingida! Parabens!' : `Faltam ${((meta - quantidade) / 1000).toFixed(1)}L`}
          </p>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-500" />
          Adicionar Agua
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount.ml}
              onClick={() => adicionarAgua(amount.ml)}
              className="py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl transition-colors active:scale-95"
            >
              {amount.label}
            </button>
          ))}
        </div>
      </div>

      {/* Historico */}
      {historico.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Historico
          </h2>
          <div className="space-y-3">
            {historico.slice(0, 7).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-20 text-sm text-gray-500">{formatarData(item.data)}</div>
                <div className="flex-1 h-3 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${item.quantidade >= meta ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (item.quantidade / meta) * 100)}%` }}
                  />
                </div>
                <div className="w-16 text-right text-sm font-medium text-gray-600">
                  {(item.quantidade / 1000).toFixed(1)}L
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dicas */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 border border-blue-100">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Dicas para se hidratar mais
        </h2>
        <div className="space-y-2">
          {DICAS_AGUA.map((dica, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-gray-600 text-sm">{dica}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
