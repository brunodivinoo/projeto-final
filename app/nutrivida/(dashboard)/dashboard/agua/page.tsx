'use client'

import { useState, useEffect, useMemo } from 'react'
import { useNutriAuth, formatarIdadeBebe } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { Droplets, Plus, RotateCcw, TrendingUp, Lightbulb, Check, Baby, HeartPulse, AlertTriangle, Info } from 'lucide-react'

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

// Dicas dinamicas por situacao
const getDicasAgua = (situacao: string) => {
  const dicasBase = [
    'Beba um copo de agua ao acordar',
    'Leve uma garrafa sempre com voce',
    'Coloque lembretes no celular',
    'Beba um copo antes de cada refeicao',
  ]

  if (situacao === 'gestante') {
    return [
      ...dicasBase,
      'A hidratacao previne infeccoes urinarias comuns na gestacao',
      'Agua ajuda a prevenir constipacao e inchaco',
      'Beba pequenos goles ao longo do dia para evitar nauseas',
      'Agua com limao pode ajudar com enjoos matinais'
    ]
  }

  if (situacao === 'amamentando') {
    return [
      ...dicasBase,
      'Beba um copo de agua TODA vez que for amamentar',
      'A producao de leite requer muita agua extra',
      'Mantenha uma garrafa ao lado do local de amamentacao',
      'Sucos naturais e chas sem cafeina tambem contam'
    ]
  }

  if (situacao === 'pos_parto') {
    return [
      ...dicasBase,
      'A hidratacao ajuda na recuperacao do corpo',
      'Agua auxilia na cicatrizacao de tecidos',
      'Beba um copo a cada vez que trocar o bebe'
    ]
  }

  return [
    ...dicasBase,
    'Associe a hidratacao a uma atividade',
    'Use um app para lembrar'
  ]
}

// Meta de agua por situacao (em ml)
const getMetaAgua = (situacao: string): { meta: number; explicacao: string } => {
  switch (situacao) {
    case 'gestante':
      return { meta: 2500, explicacao: '2.5L recomendados durante a gestacao' }
    case 'amamentando':
      return { meta: 3500, explicacao: '3.5L recomendados durante amamentacao' }
    case 'pos_parto':
      return { meta: 3000, explicacao: '3L para ajudar na recuperacao' }
    default:
      return { meta: 2500, explicacao: '2.5L recomendados para mulheres' }
  }
}

export default function AguaPage() {
  const { profile, situacaoAtual, semanaGestacaoCalculada, trimestreGestacao, idadeBebeCalculada } = useNutriAuth()
  const [quantidade, setQuantidade] = useState(0)
  const [loading, setLoading] = useState(true)
  const [historico, setHistorico] = useState<Array<{ data: string; quantidade: number }>>([])
  const [showSuccess, setShowSuccess] = useState(false)

  // Meta dinamica baseada na situacao
  const { meta, explicacao } = useMemo(() => getMetaAgua(situacaoAtual), [situacaoAtual])
  const dicasAgua = useMemo(() => getDicasAgua(situacaoAtual), [situacaoAtual])

  const hoje = new Date().toISOString().split('T')[0]
  const progresso = Math.min(100, (quantidade / meta) * 100)
  const litros = (quantidade / 1000).toFixed(1)
  const metaLitros = (meta / 1000).toFixed(1)

  // Subtitulo dinamico
  const getSubtitulo = () => {
    if (situacaoAtual === 'gestante') {
      return `Gestante - ${semanaGestacaoCalculada}ª semana`
    } else if (situacaoAtual === 'amamentando') {
      return `Amamentando - Bebe com ${formatarIdadeBebe(idadeBebeCalculada)}`
    } else if (situacaoAtual === 'pos_parto') {
      return `Pos-parto - Bebe com ${formatarIdadeBebe(idadeBebeCalculada)}`
    }
    return explicacao
  }

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

  // Cor do gradiente baseada na situacao
  const getGradientColors = () => {
    if (situacaoAtual === 'gestante') return 'from-pink-500 to-rose-500'
    if (situacaoAtual === 'amamentando') return 'from-purple-500 to-pink-500'
    if (situacaoAtual === 'pos_parto') return 'from-purple-500 to-indigo-500'
    return 'from-blue-500 to-cyan-500'
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
          <p className="text-gray-500">{getSubtitulo()}</p>
        </div>
        <button
          onClick={resetar}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Reiniciar contador"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Alerta especial para gestantes */}
      {situacaoAtual === 'gestante' && (
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Baby className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-pink-800">Hidratacao na Gestacao</h3>
              <p className="text-sm text-pink-700 mt-1">
                {trimestreGestacao === 1 && 'A hidratacao ajuda a reduzir nauseas e previne infeccoes urinarias.'}
                {trimestreGestacao === 2 && 'Beber agua suficiente ajuda na formacao do liquido amniotico.'}
                {trimestreGestacao === 3 && 'Mantenha-se hidratada para evitar contrações de Braxton Hicks.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta especial para amamentacao */}
      {situacaoAtual === 'amamentando' && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-800">Hidratacao na Amamentacao</h3>
              <p className="text-sm text-purple-700 mt-1">
                Voce precisa de mais agua para produzir leite! Beba um copo de agua TODA vez que for amamentar.
                A meta aumentada de {metaLitros}L ajuda a manter a producao de leite.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Circulo de Progresso */}
      <div className={`bg-gradient-to-br ${getGradientColors()} rounded-3xl p-8 text-white text-center relative overflow-hidden`}>
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
            <p className="text-white/70">de {metaLitros}L</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-5xl font-bold">{Math.round(progresso)}%</p>
          <p className="text-white/70 mt-1">
            {quantidade >= meta ? 'Meta atingida! Parabens!' : `Faltam ${((meta - quantidade) / 1000).toFixed(1)}L`}
          </p>
        </div>

        {/* Indicador de meta especial */}
        {(situacaoAtual === 'gestante' || situacaoAtual === 'amamentando') && (
          <div className="mt-4 bg-white/20 rounded-xl px-3 py-2 inline-flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span className="text-sm">{explicacao}</span>
          </div>
        )}
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
              className={`py-3 font-semibold rounded-xl transition-colors active:scale-95 ${
                situacaoAtual === 'gestante'
                  ? 'bg-pink-50 hover:bg-pink-100 text-pink-600'
                  : situacaoAtual === 'amamentando'
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-600'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
              }`}
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
                    className={`h-full rounded-full transition-all ${
                      item.quantidade >= meta
                        ? 'bg-green-500'
                        : situacaoAtual === 'gestante'
                        ? 'bg-pink-500'
                        : situacaoAtual === 'amamentando'
                        ? 'bg-purple-500'
                        : 'bg-blue-500'
                    }`}
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
      <div className={`rounded-2xl p-5 border ${
        situacaoAtual === 'gestante'
          ? 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100'
          : situacaoAtual === 'amamentando'
          ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100'
          : 'bg-gradient-to-br from-cyan-50 to-blue-50 border-blue-100'
      }`}>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          {situacaoAtual === 'gestante'
            ? 'Dicas de hidratacao para gestantes'
            : situacaoAtual === 'amamentando'
            ? 'Dicas de hidratacao para mamaes'
            : 'Dicas para se hidratar mais'}
        </h2>
        <div className="space-y-2">
          {dicasAgua.map((dica, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                situacaoAtual === 'gestante'
                  ? 'bg-pink-500'
                  : situacaoAtual === 'amamentando'
                  ? 'bg-purple-500'
                  : 'bg-blue-500'
              }`} />
              <p className="text-gray-600 text-sm">{dica}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Aviso importante para gestantes */}
      {situacaoAtual === 'gestante' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Atencao</p>
            <p className="text-xs text-amber-700 mt-1">
              Se estiver com inchaco excessivo ou pressao alta, consulte seu medico sobre a quantidade ideal de agua.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
