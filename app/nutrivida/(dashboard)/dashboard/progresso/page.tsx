'use client'

import { useState, useEffect } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Target,
  Calendar,
  Plus,
  X,
  Camera,
  Trophy,
  Flame
} from 'lucide-react'

interface HistoricoPeso {
  id: string
  peso: number
  nota: string | null
  data: string
}

export default function ProgressoPage() {
  const { profile, imc, pesoAPerdido, pesoRestante, progressoPercentual, updateProfile } = useNutriAuth()
  const [historico, setHistorico] = useState<HistoricoPeso[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [novoPeso, setNovoPeso] = useState('')
  const [notaPeso, setNotaPeso] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const fetchHistorico = async () => {
      if (!profile?.id) return

      try {
        const { data } = await supabase
          .from('historico_peso_nutri')
          .select('*')
          .eq('user_id', profile.id)
          .order('data', { ascending: false })
          .limit(30)

        if (data) {
          setHistorico(data)
        }
      } catch (err) {
        console.error('Erro ao buscar historico:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistorico()
  }, [profile?.id])

  const salvarPeso = async () => {
    if (!profile?.id || !novoPeso) return

    setSalvando(true)
    const peso = parseFloat(novoPeso)

    try {
      // Salvar no historico
      const { data: novoRegistro, error: histError } = await supabase
        .from('historico_peso_nutri')
        .insert({
          user_id: profile.id,
          peso,
          nota: notaPeso || null,
          data: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (!histError && novoRegistro) {
        setHistorico(prev => [novoRegistro, ...prev])
      }

      // Atualizar peso atual no perfil
      await updateProfile({ peso_atual: peso })

      setNovoPeso('')
      setNotaPeso('')
      setModalAberto(false)
    } catch (err) {
      console.error('Erro ao salvar peso:', err)
    } finally {
      setSalvando(false)
    }
  }

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr + 'T00:00:00')
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  // Calcular projecao
  const calcularProjecao = (meses: number) => {
    if (!profile?.peso_atual || !profile?.peso_meta) return null
    const perdaPorMes = profile.plano === 'restritivo' ? 4 : 2.5
    const pesoProjetado = Math.max(profile.peso_meta, profile.peso_atual - (perdaPorMes * meses))
    return pesoProjetado.toFixed(1)
  }

  // Calcular IMC categoria
  const getIMCCategoria = () => {
    if (!imc) return { texto: '--', cor: 'gray' }
    if (imc < 18.5) return { texto: 'Abaixo do peso', cor: 'yellow' }
    if (imc < 25) return { texto: 'Peso normal', cor: 'green' }
    if (imc < 30) return { texto: 'Sobrepeso', cor: 'orange' }
    return { texto: 'Obesidade', cor: 'red' }
  }

  const imcCategoria = getIMCCategoria()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Progresso</h1>
          <p className="text-gray-500">Acompanhe sua evolucao</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl shadow-lg hover:from-pink-600 hover:to-purple-600 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Card Principal */}
      <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-rose-500 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-pink-100">Peso Atual</p>
            <p className="text-4xl font-bold">{profile?.peso_atual || '--'} kg</p>
          </div>
          <div className="text-right">
            <p className="text-pink-100">Meta</p>
            <p className="text-2xl font-bold">{profile?.peso_meta || '--'} kg</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progresso</span>
            <span className="font-bold">{progressoPercentual}%</span>
          </div>
          <div className="h-4 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progressoPercentual)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <TrendingDown className="w-5 h-5 mx-auto mb-1" />
            <p className="text-2xl font-bold">{pesoAPerdido > 0 ? pesoAPerdido : 0}</p>
            <p className="text-xs text-pink-100">kg perdidos</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <Target className="w-5 h-5 mx-auto mb-1" />
            <p className="text-2xl font-bold">{pesoRestante > 0 ? pesoRestante : 0}</p>
            <p className="text-xs text-pink-100">kg restantes</p>
          </div>
        </div>
      </div>

      {/* IMC */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
        <h2 className="font-semibold text-gray-800 mb-4">Indice de Massa Corporal</h2>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-${imcCategoria.cor}-100`}>
            <Scale className={`w-8 h-8 text-${imcCategoria.cor}-500`} />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800">{imc || '--'}</p>
            <p className={`text-sm text-${imcCategoria.cor}-600 font-medium`}>{imcCategoria.texto}</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-${imcCategoria.cor}-500 rounded-full transition-all`}
            style={{ width: `${Math.min(100, ((imc || 0) / 40) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>40</span>
        </div>
      </div>

      {/* Projecao */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Projecao de Resultados
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[1, 3, 6].map((meses) => (
            <div key={meses} className="text-center p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Em {meses} {meses === 1 ? 'mes' : 'meses'}</p>
              <p className="text-xl font-bold text-gray-800">{calcularProjecao(meses) || '--'}</p>
              <p className="text-xs text-gray-400">kg</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          * Baseado no plano {profile?.plano === 'restritivo' ? 'acelerado (4kg/mes)' : 'equilibrado (2.5kg/mes)'}
        </p>
      </div>

      {/* Historico */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" />
          Historico de Pesagens
        </h2>
        {historico.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum registro ainda</p>
            <p className="text-sm">Clique em + para adicionar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historico.slice(0, 10).map((registro, i) => {
              const anterior = historico[i + 1]
              const diff = anterior ? registro.peso - anterior.peso : 0
              return (
                <div
                  key={registro.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="w-12 text-center">
                    <p className="text-xs text-gray-400">{formatarData(registro.data)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{registro.peso} kg</p>
                    {registro.nota && (
                      <p className="text-xs text-gray-500">{registro.nota}</p>
                    )}
                  </div>
                  {diff !== 0 && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      diff < 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {diff < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                      {Math.abs(diff).toFixed(1)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Adicionar Peso */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Registrar Peso</h2>
              <button
                onClick={() => setModalAberto(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={novoPeso}
                  onChange={(e) => setNovoPeso(e.target.value)}
                  placeholder={profile?.peso_atual?.toString() || '70.0'}
                  className="w-full px-4 py-3 text-2xl text-center bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nota (opcional)</label>
                <input
                  type="text"
                  value={notaPeso}
                  onChange={(e) => setNotaPeso(e.target.value)}
                  placeholder="Ex: Apos treino, manha..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <button
                onClick={salvarPeso}
                disabled={!novoPeso || salvando}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar Peso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
