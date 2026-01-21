'use client'

import { useState, useEffect } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { TREINOS_COMPLETOS, Treino, Exercicio } from '@/lib/nutrimae/data'
import {
  Dumbbell,
  Clock,
  Target,
  ChevronRight,
  Check,
  X,
  Play,
  Trophy,
  Timer,
  Flame,
  ArrowLeft
} from 'lucide-react'

type FaseTreino = 'fase1' | 'fase2' | 'fase3'

export default function TreinosPage() {
  const { profile } = useNutriAuth()
  const [faseAtual, setFaseAtual] = useState<FaseTreino>('fase1')
  const [treinoAtivo, setTreinoAtivo] = useState<{ nome: string; treino: Treino } | null>(null)
  const [exerciciosConcluidos, setExerciciosConcluidos] = useState<number[]>([])
  const [treinosConcluidos, setTreinosConcluidos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const hoje = new Date().toISOString().split('T')[0]
  const faseData = TREINOS_COMPLETOS[faseAtual]

  useEffect(() => {
    const fetchProgresso = async () => {
      if (!profile?.id) return

      try {
        const { data } = await supabase
          .from('treinos_progresso_nutri')
          .select('treino, exercicios_concluidos, concluido')
          .eq('user_id', profile.id)
          .eq('data', hoje)

        if (data) {
          const concluidos = data.filter(t => t.concluido).map(t => t.treino)
          setTreinosConcluidos(concluidos)
        }
      } catch (err) {
        console.error('Erro ao buscar progresso:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProgresso()
  }, [profile?.id, hoje])

  const iniciarTreino = (nome: string, treino: Treino) => {
    setTreinoAtivo({ nome, treino })
    setExerciciosConcluidos([])
  }

  const toggleExercicio = (index: number) => {
    setExerciciosConcluidos(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const finalizarTreino = async () => {
    if (!profile?.id || !treinoAtivo) return

    const todosFeitos = exerciciosConcluidos.length === treinoAtivo.treino.exercicios.length

    try {
      await supabase
        .from('treinos_progresso_nutri')
        .upsert({
          user_id: profile.id,
          fase: faseAtual,
          treino: treinoAtivo.nome,
          exercicios_concluidos: exerciciosConcluidos.map(String),
          concluido: todosFeitos,
          data: hoje
        })

      if (todosFeitos) {
        setTreinosConcluidos(prev => [...prev, treinoAtivo.nome])
      }
    } catch (err) {
      console.error('Erro ao salvar treino:', err)
    }

    setTreinoAtivo(null)
    setExerciciosConcluidos([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  // Tela do treino ativo
  if (treinoAtivo) {
    const progresso = (exerciciosConcluidos.length / treinoAtivo.treino.exercicios.length) * 100
    const todosConcluidos = exerciciosConcluidos.length === treinoAtivo.treino.exercicios.length

    return (
      <div className="space-y-6 pb-20 lg:pb-6">
        {/* Header do Treino */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTreinoAtivo(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{treinoAtivo.treino.nome}</h1>
            <p className="text-sm text-gray-500">{treinoAtivo.treino.foco}</p>
          </div>
        </div>

        {/* Progresso */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{treinoAtivo.treino.duracao}</span>
            </div>
            <span className="font-bold">{Math.round(progresso)}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
          {todosConcluidos && (
            <div className="mt-3 flex items-center justify-center gap-2 text-yellow-300">
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">Treino completo!</span>
            </div>
          )}
        </div>

        {/* Lista de Exercicios */}
        <div className="space-y-3">
          {treinoAtivo.treino.exercicios.map((exercicio, index) => {
            const concluido = exerciciosConcluidos.includes(index)
            return (
              <button
                key={index}
                onClick={() => toggleExercicio(index)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  concluido
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-100 bg-white hover:border-purple-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    concluido ? 'bg-green-500 text-white' : 'bg-purple-100 text-purple-500'
                  }`}>
                    {concluido ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${concluido ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {exercicio.nome}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{exercicio.series}x{exercicio.reps}</span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {exercicio.tempo}
                      </span>
                    </div>
                    <p className="text-xs text-purple-500 mt-2">{exercicio.dica}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Botao Finalizar */}
        <button
          onClick={finalizarTreino}
          className={`w-full py-4 rounded-2xl font-semibold transition-all ${
            todosConcluidos
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {todosConcluidos ? 'Finalizar Treino' : 'Encerrar e Salvar Progresso'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Treinos</h1>
        <p className="text-gray-500">Exercicios seguros para o pos-parto</p>
      </div>

      {/* Seletor de Fase */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(Object.keys(TREINOS_COMPLETOS) as FaseTreino[]).map((fase) => {
          const isActive = faseAtual === fase
          return (
            <button
              key={fase}
              onClick={() => setFaseAtual(fase)}
              className={`px-4 py-3 rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
              }`}
            >
              <span className="font-semibold">{TREINOS_COMPLETOS[fase].nome}</span>
              <span className={`block text-xs mt-0.5 ${isActive ? 'text-purple-100' : 'text-gray-400'}`}>
                Semanas {TREINOS_COMPLETOS[fase].semanas}
              </span>
            </button>
          )
        })}
      </div>

      {/* Info da Fase */}
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">{faseData.nome}</h2>
            <p className="text-sm text-gray-600 mt-1">{faseData.descricao}</p>
            <p className="text-xs text-purple-600 mt-2 font-medium">{faseData.frequencia}</p>
          </div>
        </div>
      </div>

      {/* Lista de Treinos */}
      <div className="space-y-3">
        {Object.entries(faseData.treinos).map(([key, treino]) => {
          const concluido = treinosConcluidos.includes(key)
          return (
            <button
              key={key}
              onClick={() => iniciarTreino(key, treino)}
              className={`w-full bg-white rounded-2xl p-5 border-2 text-left transition-all ${
                concluido ? 'border-green-300 bg-green-50/50' : 'border-gray-100 hover:border-purple-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  concluido ? 'bg-green-500 text-white' : 'bg-purple-100 text-purple-500'
                }`}>
                  {concluido ? <Check className="w-7 h-7" /> : <Dumbbell className="w-7 h-7" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{treino.nome}</h3>
                    {concluido && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                        Feito hoje
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{treino.foco}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {treino.duracao}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {treino.exercicios.length} exercicios
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  concluido ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  {concluido ? (
                    <Trophy className="w-5 h-5 text-green-500" />
                  ) : (
                    <Play className="w-5 h-5 text-purple-500" />
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
