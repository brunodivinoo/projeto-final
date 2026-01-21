'use client'

import { useState, useEffect } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import {
  Heart,
  Smile,
  Meh,
  Frown,
  Angry,
  Zap,
  Moon,
  Droplets,
  Dumbbell,
  Send,
  Loader2,
  Trophy,
  TrendingUp,
  Calendar,
  Sparkles,
  Target
} from 'lucide-react'

type Humor = 'otimo' | 'bom' | 'regular' | 'ruim'

interface CoachResponse {
  mensagem_motivacional: string
  analise_dia: string
  sugestoes: string[]
  meta_amanha: string
  pontuacao_dia: number
}

interface CheckInStats {
  total_checkins: number
  media_energia: number
  media_sono: number
  media_agua: number
  dias_exercicio: number
}

export default function CoachPage() {
  const { user, profile } = useNutriAuth()
  const [humor, setHumor] = useState<Humor | null>(null)
  const [energia, setEnergia] = useState(5)
  const [sonoHoras, setSonoHoras] = useState(6)
  const [aguaMl, setAguaMl] = useState(1500)
  const [exercicio, setExercicio] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)
  const [coachResponse, setCoachResponse] = useState<CoachResponse | null>(null)
  const [stats, setStats] = useState<CheckInStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchStats()
    }
  }, [user?.id])

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/nutrivida/coach?userId=${user?.id}&dias=7`)
      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Erro ao buscar stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const enviarCheckIn = async () => {
    if (!humor) return

    setLoading(true)
    try {
      const response = await fetch('/api/nutrivida/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          checkIn: {
            humor,
            energia,
            sono_horas: sonoHoras,
            agua_ml: aguaMl,
            exercicio,
            observacoes: observacoes || undefined
          }
        })
      })

      const data = await response.json()
      if (data.coach) {
        setCoachResponse(data.coach)
        fetchStats() // Atualizar estatísticas
      }
    } catch (err) {
      console.error('Erro no check-in:', err)
    } finally {
      setLoading(false)
    }
  }

  const humorOptions: { value: Humor; icon: React.ReactNode; label: string; color: string }[] = [
    { value: 'otimo', icon: <Smile className="w-8 h-8" />, label: 'Otimo', color: 'bg-green-100 text-green-600 border-green-300' },
    { value: 'bom', icon: <Smile className="w-8 h-8" />, label: 'Bom', color: 'bg-blue-100 text-blue-600 border-blue-300' },
    { value: 'regular', icon: <Meh className="w-8 h-8" />, label: 'Regular', color: 'bg-yellow-100 text-yellow-600 border-yellow-300' },
    { value: 'ruim', icon: <Frown className="w-8 h-8" />, label: 'Ruim', color: 'bg-red-100 text-red-600 border-red-300' }
  ]

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Coach Virtual</h1>
          <p className="text-gray-500">Seu check-in diario de bem-estar</p>
        </div>
      </div>

      {/* Stats da Semana */}
      {!loadingStats && stats && stats.total_checkins > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">Sua Semana</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total_checkins}</p>
              <p className="text-xs text-white/70">Check-ins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.media_energia}</p>
              <p className="text-xs text-white/70">Energia</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.media_sono}h</p>
              <p className="text-xs text-white/70">Sono</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.dias_exercicio}</p>
              <p className="text-xs text-white/70">Treinos</p>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de Check-in */}
      {!coachResponse ? (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">
              Ola, {profile?.nome?.split(' ')[0]}! Como voce esta hoje?
            </p>
          </div>

          {/* Humor */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">
              Como esta seu humor?
            </label>
            <div className="grid grid-cols-4 gap-3">
              {humorOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setHumor(option.value)}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                    humor === option.value
                      ? option.color
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.icon}
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energia */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-3">
              <Zap className="w-4 h-4 text-yellow-500" />
              Nivel de energia: {energia}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={energia}
              onChange={(e) => setEnergia(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Sem energia</span>
              <span>Super disposta</span>
            </div>
          </div>

          {/* Sono */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-3">
              <Moon className="w-4 h-4 text-indigo-500" />
              Horas de sono: {sonoHoras}h
            </label>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={sonoHoras}
              onChange={(e) => setSonoHoras(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Água */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-3">
              <Droplets className="w-4 h-4 text-blue-500" />
              Agua consumida: {aguaMl}ml
            </label>
            <input
              type="range"
              min="0"
              max="4000"
              step="250"
              value={aguaMl}
              onChange={(e) => setAguaMl(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0ml</span>
              <span>4L</span>
            </div>
          </div>

          {/* Exercício */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-gray-700">Fez exercicio hoje?</span>
            </div>
            <button
              onClick={() => setExercicio(!exercicio)}
              className={`w-12 h-7 rounded-full transition-all ${
                exercicio ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                exercicio ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Algo mais que queira compartilhar? (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Como foi seu dia, dificuldades, conquistas..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            />
          </div>

          {/* Botão Enviar */}
          <button
            onClick={enviarCheckIn}
            disabled={!humor || loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar Check-in
              </>
            )}
          </button>
        </div>
      ) : (
        /* Resposta do Coach */
        <div className="space-y-4">
          {/* Pontuação do Dia */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{coachResponse.pontuacao_dia}</span>
            </div>
            <p className="text-gray-500">Pontuacao do seu dia</p>
          </div>

          {/* Mensagem Motivacional */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-5 text-white">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 flex-shrink-0" />
              <p className="text-lg">{coachResponse.mensagem_motivacional}</p>
            </div>
          </div>

          {/* Análise */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-gray-800">Analise do seu dia</h3>
            </div>
            <p className="text-gray-600">{coachResponse.analise_dia}</p>
          </div>

          {/* Sugestões */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-800">Sugestoes para voce</h3>
            </div>
            <ul className="space-y-2">
              {coachResponse.sugestoes.map((sugestao, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600">
                  <span className="text-green-500 mt-0.5">•</span>
                  {sugestao}
                </li>
              ))}
            </ul>
          </div>

          {/* Meta de Amanhã */}
          <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-indigo-800">Meta para amanha</h3>
            </div>
            <p className="text-indigo-700">{coachResponse.meta_amanha}</p>
          </div>

          {/* Botão Novo Check-in */}
          <button
            onClick={() => {
              setCoachResponse(null)
              setHumor(null)
              setObservacoes('')
            }}
            className="w-full py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
          >
            Fazer novo check-in
          </button>
        </div>
      )}
    </div>
  )
}
