'use client'

import { useState, useEffect } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { SUPLEMENTOS } from '@/lib/nutrivida/data'
import {
  Pill,
  Clock,
  Check,
  Info,
  Sun,
  Moon,
  Utensils,
  Fish,
  Bone,
  Zap,
  Sparkle,
  Dumbbell
} from 'lucide-react'

const ICONS: Record<string, React.ReactNode> = {
  fish: <Fish className="w-5 h-5" />,
  sun: <Sun className="w-5 h-5" />,
  strength: <Dumbbell className="w-5 h-5" />,
  bone: <Bone className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  sparkle: <Sparkle className="w-5 h-5" />,
  gut: <Pill className="w-5 h-5" />,
  moon: <Moon className="w-5 h-5" />
}

export default function SuplementosPage() {
  const { profile } = useNutriAuth()
  const [suplementosTomados, setSuplementosTomados] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [infoAberto, setInfoAberto] = useState<string | null>(null)

  const hoje = new Date().toISOString().split('T')[0]
  const progresso = (suplementosTomados.length / SUPLEMENTOS.length) * 100
  const essenciaisTomados = SUPLEMENTOS.filter(s => s.essencial && suplementosTomados.includes(s.id)).length
  const essenciaisTotal = SUPLEMENTOS.filter(s => s.essencial).length

  useEffect(() => {
    const fetchSuplementos = async () => {
      if (!profile?.id) return

      try {
        const { data } = await supabase
          .from('suplementos_diarios_nutri')
          .select('suplemento_id')
          .eq('user_id', profile.id)
          .eq('data', hoje)
          .eq('tomado', true)

        if (data) {
          setSuplementosTomados(data.map(d => d.suplemento_id))
        }
      } catch (err) {
        console.error('Erro ao buscar suplementos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSuplementos()
  }, [profile?.id, hoje])

  const toggleSuplemento = async (id: string) => {
    if (!profile?.id) return

    const tomado = suplementosTomados.includes(id)

    try {
      if (tomado) {
        await supabase
          .from('suplementos_diarios_nutri')
          .delete()
          .eq('user_id', profile.id)
          .eq('suplemento_id', id)
          .eq('data', hoje)

        setSuplementosTomados(prev => prev.filter(s => s !== id))
      } else {
        await supabase
          .from('suplementos_diarios_nutri')
          .upsert({
            user_id: profile.id,
            suplemento_id: id,
            tomado: true,
            data: hoje
          }, {
            onConflict: 'user_id,suplemento_id,data'
          })

        setSuplementosTomados(prev => [...prev, id])
      }
    } catch (err) {
      console.error('Erro ao atualizar suplemento:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Suplementos</h1>
        <p className="text-gray-500">Vitaminas recomendadas para o pos-parto</p>
      </div>

      {/* Progresso */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-purple-100">Progresso de hoje</p>
            <p className="text-2xl font-bold">{suplementosTomados.length}/{SUPLEMENTOS.length}</p>
          </div>
          <div className="text-right">
            <p className="text-purple-100">Essenciais</p>
            <p className="text-xl font-bold">{essenciaisTomados}/{essenciaisTotal}</p>
          </div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Essenciais */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          Essenciais
        </h2>
        <div className="space-y-3">
          {SUPLEMENTOS.filter(s => s.essencial).map((suplemento) => {
            const tomado = suplementosTomados.includes(suplemento.id)
            return (
              <div
                key={suplemento.id}
                className={`bg-white rounded-2xl border-2 transition-all ${
                  tomado ? 'border-green-300 bg-green-50/50' : 'border-gray-100'
                }`}
              >
                <div className="p-4 flex items-center gap-4">
                  <button
                    onClick={() => toggleSuplemento(suplemento.id)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      tomado ? 'bg-green-500 text-white' : 'bg-purple-100 text-purple-500'
                    }`}
                  >
                    {tomado ? <Check className="w-6 h-6" /> : ICONS[suplemento.icon]}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${tomado ? 'text-gray-400' : 'text-gray-800'}`}>
                        {suplemento.nome}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">
                        ESSENCIAL
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{suplemento.descricao}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Pill className="w-3 h-3" />
                        {suplemento.dose}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {suplemento.horario}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setInfoAberto(infoAberto === suplemento.id ? null : suplemento.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Info className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                {infoAberto === suplemento.id && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="p-3 bg-purple-50 rounded-xl text-sm text-gray-600">
                      <p><strong>Beneficio:</strong> {suplemento.descricao}</p>
                      <p className="mt-1"><strong>Dose:</strong> {suplemento.dose}</p>
                      <p className="mt-1"><strong>Melhor horario:</strong> {suplemento.horario}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Opcionais */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          Opcionais
        </h2>
        <div className="space-y-3">
          {SUPLEMENTOS.filter(s => !s.essencial).map((suplemento) => {
            const tomado = suplementosTomados.includes(suplemento.id)
            return (
              <div
                key={suplemento.id}
                className={`bg-white rounded-2xl border-2 transition-all ${
                  tomado ? 'border-green-300 bg-green-50/50' : 'border-gray-100'
                }`}
              >
                <div className="p-4 flex items-center gap-4">
                  <button
                    onClick={() => toggleSuplemento(suplemento.id)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      tomado ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tomado ? <Check className="w-6 h-6" /> : ICONS[suplemento.icon]}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${tomado ? 'text-gray-400' : 'text-gray-800'}`}>
                      {suplemento.nome}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{suplemento.descricao}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Pill className="w-3 h-3" />
                        {suplemento.dose}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {suplemento.horario}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setInfoAberto(infoAberto === suplemento.id ? null : suplemento.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Info className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                {infoAberto === suplemento.id && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                      <p><strong>Beneficio:</strong> {suplemento.descricao}</p>
                      <p className="mt-1"><strong>Dose:</strong> {suplemento.dose}</p>
                      <p className="mt-1"><strong>Melhor horario:</strong> {suplemento.horario}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Aviso */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800">
        <p className="font-semibold mb-1">Importante</p>
        <p>Consulte seu medico antes de iniciar qualquer suplementacao, especialmente durante a amamentacao.</p>
      </div>
    </div>
  )
}
