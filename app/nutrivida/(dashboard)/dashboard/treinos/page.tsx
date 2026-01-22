'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { TREINOS_COMPLETOS, Treino, Exercicio } from '@/lib/nutrivida/data'
import {
  Dumbbell,
  Clock,
  Target,
  Check,
  Play,
  Trophy,
  Timer,
  Flame,
  ArrowLeft,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Bot,
  Sparkles,
  Loader2,
  Heart,
  Zap,
  Moon
} from 'lucide-react'

type FaseTreino = 'fase1' | 'fase2' | 'fase3'
type TipoTreino = 'fases' | 'rapido' | 'yoga' | 'cardio' | 'forca'

// Treinos rapidos sem fases
const TREINOS_RAPIDOS = {
  '5min': {
    nome: '5 Minutos Energia',
    duracao: '5 min',
    foco: 'Ativacao rapida',
    exercicios: [
      { nome: 'Polichinelos', series: 1, reps: '20', tempo: '1 min', dica: 'Movimentos controlados' },
      { nome: 'Agachamento', series: 1, reps: '15', tempo: '1 min', dica: 'Joelhos alinhados' },
      { nome: 'Prancha', series: 1, reps: '1', tempo: '30 seg', dica: 'Mantenha o abdomen contraido' },
      { nome: 'Alongamento', series: 1, reps: '-', tempo: '2 min', dica: 'Respire profundamente' },
    ]
  },
  '10min': {
    nome: '10 Minutos Full Body',
    duracao: '10 min',
    foco: 'Corpo todo',
    exercicios: [
      { nome: 'Aquecimento articular', series: 1, reps: '-', tempo: '2 min', dica: 'Rotacione todas as articulacoes' },
      { nome: 'Agachamento', series: 2, reps: '12', tempo: '2 min', dica: 'Desça ate 90 graus' },
      { nome: 'Flexao (joelhos)', series: 2, reps: '10', tempo: '2 min', dica: 'Cotovelos para fora' },
      { nome: 'Abdominal', series: 2, reps: '15', tempo: '2 min', dica: 'Queixo longe do peito' },
      { nome: 'Alongamento', series: 1, reps: '-', tempo: '2 min', dica: 'Foque nos musculos trabalhados' },
    ]
  },
  '15min': {
    nome: '15 Minutos HIIT',
    duracao: '15 min',
    foco: 'Alta intensidade',
    exercicios: [
      { nome: 'Aquecimento', series: 1, reps: '-', tempo: '2 min', dica: 'Eleve a frequencia cardiaca' },
      { nome: 'Burpees', series: 3, reps: '8', tempo: '3 min', dica: 'Explosao no salto' },
      { nome: 'Mountain climbers', series: 3, reps: '20', tempo: '3 min', dica: 'Mantenha quadril baixo' },
      { nome: 'Squat jumps', series: 3, reps: '10', tempo: '3 min', dica: 'Aterrisse suavemente' },
      { nome: 'Prancha', series: 2, reps: '1', tempo: '2 min', dica: 'Segure 30 segundos cada' },
      { nome: 'Alongamento', series: 1, reps: '-', tempo: '2 min', dica: 'Respiracao profunda' },
    ]
  }
}

const TREINOS_YOGA = {
  relaxamento: {
    nome: 'Yoga Relaxamento',
    duracao: '15 min',
    foco: 'Relaxar e acalmar',
    exercicios: [
      { nome: 'Postura da crianca', series: 1, reps: '-', tempo: '2 min', dica: 'Respire lentamente' },
      { nome: 'Gato-vaca', series: 1, reps: '10', tempo: '2 min', dica: 'Sincronize com a respiracao' },
      { nome: 'Cachorro olhando para baixo', series: 1, reps: '-', tempo: '1 min', dica: 'Pressione os calcanhares' },
      { nome: 'Alongamento de piriforme', series: 2, reps: '-', tempo: '2 min', dica: '1 min cada lado' },
      { nome: 'Torção deitada', series: 2, reps: '-', tempo: '2 min', dica: '1 min cada lado' },
      { nome: 'Pernas na parede', series: 1, reps: '-', tempo: '3 min', dica: 'Relaxe completamente' },
      { nome: 'Savasana', series: 1, reps: '-', tempo: '3 min', dica: 'Deixe o corpo pesado' },
    ]
  },
  energia: {
    nome: 'Yoga Energia',
    duracao: '20 min',
    foco: 'Despertar e energizar',
    exercicios: [
      { nome: 'Saudacao ao sol', series: 3, reps: '1', tempo: '5 min', dica: 'Movimentos fluidos' },
      { nome: 'Guerreiro I', series: 2, reps: '-', tempo: '2 min', dica: '1 min cada lado' },
      { nome: 'Guerreiro II', series: 2, reps: '-', tempo: '2 min', dica: 'Olhar sobre a mao da frente' },
      { nome: 'Triangulo', series: 2, reps: '-', tempo: '2 min', dica: 'Alongue lateralmente' },
      { nome: 'Arvore', series: 2, reps: '-', tempo: '2 min', dica: 'Equilibrio e foco' },
      { nome: 'Ponte', series: 2, reps: '5', tempo: '2 min', dica: 'Eleve o quadril' },
      { nome: 'Meditacao', series: 1, reps: '-', tempo: '5 min', dica: 'Atencao na respiracao' },
    ]
  }
}

const CATEGORIAS_TREINO = [
  { id: 'fases', nome: 'Por Fase', icon: Target, cor: 'from-purple-500 to-pink-500', desc: 'Progressao gradual' },
  { id: 'rapido', nome: 'Rapidos', icon: Zap, cor: 'from-orange-500 to-red-500', desc: '5-15 minutos' },
  { id: 'yoga', nome: 'Yoga', icon: Moon, cor: 'from-blue-500 to-indigo-500', desc: 'Flexibilidade e calma' },
]

export default function TreinosPage() {
  const { profile } = useNutriAuth()
  const [categoria, setCategoria] = useState<TipoTreino>('fases')
  const [faseAtual, setFaseAtual] = useState<FaseTreino>('fase1')
  const [treinoAtivo, setTreinoAtivo] = useState<{ nome: string; treino: Treino | typeof TREINOS_RAPIDOS['5min'] } | null>(null)
  const [exerciciosConcluidos, setExerciciosConcluidos] = useState<number[]>([])
  const [treinosConcluidos, setTreinosConcluidos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Timer
  const [timerAtivo, setTimerAtivo] = useState(false)
  const [timerSegundos, setTimerSegundos] = useState(0)
  const [exercicioTimer, setExercicioTimer] = useState<number | null>(null)
  const [somAtivo, setSomAtivo] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // IA Dica
  const [dicaIA, setDicaIA] = useState<string | null>(null)
  const [buscandoDica, setBuscandoDica] = useState(false)

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

  // Timer effect
  useEffect(() => {
    if (timerAtivo && timerSegundos > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSegundos(prev => {
          if (prev <= 1) {
            setTimerAtivo(false)
            if (somAtivo) {
              // Tocar som de conclusao
              const audio = new Audio('/sounds/timer-end.mp3')
              audio.play().catch(() => {})
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerAtivo, somAtivo])

  const iniciarTimer = (segundos: number, exercicioIndex: number) => {
    setTimerSegundos(segundos)
    setExercicioTimer(exercicioIndex)
    setTimerAtivo(true)
  }

  const pausarTimer = () => {
    setTimerAtivo(false)
  }

  const resetarTimer = () => {
    setTimerAtivo(false)
    setTimerSegundos(0)
    setExercicioTimer(null)
  }

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseTempoParaSegundos = (tempo: string): number => {
    const match = tempo.match(/(\d+)\s*(min|seg|s|m)/i)
    if (match) {
      const valor = parseInt(match[1])
      const unidade = match[2].toLowerCase()
      if (unidade.startsWith('m')) return valor * 60
      return valor
    }
    return 60 // default 1 minuto
  }

  // Buscar dica da IA para o exercicio
  const buscarDicaIA = async (exercicio: Exercicio | (typeof TREINOS_RAPIDOS)['5min']['exercicios'][0]) => {
    setBuscandoDica(true)
    setDicaIA(null)

    try {
      const response = await fetch('/api/nutrivida/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: `Me de uma dica rapida e pratica (max 2 frases) sobre como executar corretamente o exercicio "${exercicio.nome}" para uma mulher. Foque na tecnica e seguranca.`,
          modo: 'treino'
        })
      })

      const data = await response.json()
      if (data.resposta) {
        setDicaIA(data.resposta)
      }
    } catch (err) {
      console.error('Erro ao buscar dica:', err)
    } finally {
      setBuscandoDica(false)
    }
  }

  const iniciarTreino = (nome: string, treino: Treino | typeof TREINOS_RAPIDOS['5min']) => {
    setTreinoAtivo({ nome, treino })
    setExerciciosConcluidos([])
    setDicaIA(null)
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
    resetarTimer()
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
      <div className="space-y-4 pb-20 lg:pb-6">
        {/* Header do Treino */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setTreinoAtivo(null); resetarTimer() }}
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

        {/* Timer Flutuante */}
        {timerSegundos > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Exercicio {(exercicioTimer ?? 0) + 1}</p>
                <p className="text-3xl font-bold font-mono">{formatarTempo(timerSegundos)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSomAtivo(!somAtivo)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                >
                  {somAtivo ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  onClick={timerAtivo ? pausarTimer : () => setTimerAtivo(true)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                >
                  {timerAtivo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={resetarTimer}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dica da IA */}
        {(dicaIA || buscandoDica) && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-purple-600 font-medium mb-1">Dica da Nutri IA</p>
                {buscandoDica ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Gerando dica...</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">{dicaIA}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Exercicios */}
        <div className="space-y-3">
          {treinoAtivo.treino.exercicios.map((exercicio, index) => {
            const concluido = exerciciosConcluidos.includes(index)
            const tempoSegundos = parseTempoParaSegundos(exercicio.tempo)

            return (
              <div
                key={index}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  concluido
                    ? 'border-green-300 bg-green-50'
                    : exercicioTimer === index
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleExercicio(index)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      concluido ? 'bg-green-500 text-white' : 'bg-purple-100 text-purple-500 hover:bg-purple-200'
                    }`}
                  >
                    {concluido ? <Check className="w-5 h-5" /> : <span className="font-bold">{index + 1}</span>}
                  </button>
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

                    {/* Botoes de acao */}
                    {!concluido && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => iniciarTimer(tempoSegundos, index)}
                          className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-200 flex items-center gap-1"
                        >
                          <Timer className="w-3 h-3" />
                          Iniciar Timer
                        </button>
                        <button
                          onClick={() => buscarDicaIA(exercicio)}
                          disabled={buscandoDica}
                          className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-200 flex items-center gap-1 disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3" />
                          Dica IA
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
        <p className="text-gray-500">Exercicios para seu bem-estar</p>
      </div>

      {/* Categorias */}
      <div className="grid grid-cols-3 gap-2">
        {CATEGORIAS_TREINO.map((cat) => {
          const isActive = categoria === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setCategoria(cat.id as TipoTreino)}
              className={`p-3 rounded-xl text-center transition-all ${
                isActive
                  ? `bg-gradient-to-br ${cat.cor} text-white shadow-lg`
                  : 'bg-white border border-gray-200 hover:border-purple-200'
              }`}
            >
              <cat.icon className={`w-6 h-6 mx-auto mb-1 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              <p className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>{cat.nome}</p>
            </button>
          )
        })}
      </div>

      {/* Conteudo por categoria */}
      {categoria === 'fases' && (
        <>
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

          {/* Lista de Treinos da Fase */}
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
        </>
      )}

      {categoria === 'rapido' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Treinos express para seu dia a dia</p>
          {Object.entries(TREINOS_RAPIDOS).map(([key, treino]) => (
            <button
              key={key}
              onClick={() => iniciarTreino(key, treino)}
              className="w-full bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-orange-200 text-left transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{treino.nome}</h3>
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
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Play className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {categoria === 'yoga' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Praticas para relaxar e alongar</p>
          {Object.entries(TREINOS_YOGA).map(([key, treino]) => (
            <button
              key={key}
              onClick={() => iniciarTreino(key, treino)}
              className="w-full bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-blue-200 text-left transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <Moon className="w-7 h-7 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{treino.nome}</h3>
                  <p className="text-sm text-gray-500">{treino.foco}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {treino.duracao}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {treino.exercicios.length} posturas
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Play className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
