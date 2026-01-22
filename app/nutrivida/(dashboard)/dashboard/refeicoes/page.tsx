'use client'

import { useState, useEffect } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { REFEICOES_COMPLETAS, OpcaoRefeicao } from '@/lib/nutrivida/data'
import {
  Clock,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Check,
  X,
  ChevronRight,
  Sun,
  Coffee,
  Utensils,
  Moon,
  Bot,
  Sparkles,
  Loader2,
  RefreshCw,
  TrendingUp,
  Apple
} from 'lucide-react'

type TipoRefeicao = 'cafe' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar' | 'ceia'

const TIPO_ICONS: Record<TipoRefeicao, React.ReactNode> = {
  cafe: <Coffee className="w-5 h-5" />,
  lanche_manha: <Sun className="w-5 h-5" />,
  almoco: <Utensils className="w-5 h-5" />,
  lanche_tarde: <Apple className="w-5 h-5" />,
  jantar: <Moon className="w-5 h-5" />,
  ceia: <Moon className="w-5 h-5" />
}

const TIPO_COLORS: Record<TipoRefeicao, { bg: string; text: string; light: string }> = {
  cafe: { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50' },
  lanche_manha: { bg: 'bg-yellow-500', text: 'text-yellow-500', light: 'bg-yellow-50' },
  almoco: { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-50' },
  lanche_tarde: { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-50' },
  jantar: { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-50' },
  ceia: { bg: 'bg-indigo-500', text: 'text-indigo-500', light: 'bg-indigo-50' }
}

export default function RefeicoesPage() {
  const { profile, metaCalorias } = useNutriAuth()
  const [refeicoesSelecionadas, setRefeicoesSelecionadas] = useState<Record<TipoRefeicao, OpcaoRefeicao | null>>({
    cafe: null,
    lanche_manha: null,
    almoco: null,
    lanche_tarde: null,
    jantar: null,
    ceia: null
  })
  const [modalAberto, setModalAberto] = useState<TipoRefeicao | null>(null)
  const [loading, setLoading] = useState(true)
  const [sugestaoIA, setSugestaoIA] = useState<string | null>(null)
  const [buscandoSugestao, setBuscandoSugestao] = useState(false)
  const [filtroRestritivo, setFiltroRestritivo] = useState(false)

  const hoje = new Date().toISOString().split('T')[0]
  const planoRestritivo = profile?.plano === 'restritivo'

  // Calcular macros do dia
  const macrosDia = Object.values(refeicoesSelecionadas).reduce(
    (acc, ref) => ({
      calorias: acc.calorias + (ref?.calorias || 0),
      proteinas: acc.proteinas + (ref?.proteinas || 0),
      carboidratos: acc.carboidratos + (ref?.carboidratos || 0),
      gorduras: acc.gorduras + (ref?.gorduras || 0)
    }),
    { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
  )

  const refeicoesCompletas = Object.values(refeicoesSelecionadas).filter(r => r !== null).length
  const percentualCalorias = Math.min(100, (macrosDia.calorias / metaCalorias) * 100)

  useEffect(() => {
    const fetchRefeicoes = async () => {
      if (!profile?.id) return

      try {
        const { data } = await supabase
          .from('refeicoes_diarias_nutri')
          .select('tipo_refeicao, refeicao_selecionada')
          .eq('user_id', profile.id)
          .eq('data', hoje)

        if (data) {
          const novasRefeicoes = { ...refeicoesSelecionadas }
          data.forEach((item) => {
            const tipo = item.tipo_refeicao as TipoRefeicao
            novasRefeicoes[tipo] = item.refeicao_selecionada as OpcaoRefeicao
          })
          setRefeicoesSelecionadas(novasRefeicoes)
        }
      } catch (err) {
        console.error('Erro ao buscar refeicoes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRefeicoes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, hoje])

  // Buscar sugestao da IA
  const buscarSugestaoIA = async (tipo: TipoRefeicao) => {
    setBuscandoSugestao(true)
    setSugestaoIA(null)

    const caloriasRestantes = metaCalorias - macrosDia.calorias
    const refeicaoData = REFEICOES_COMPLETAS[tipo]

    try {
      const response = await fetch('/api/nutrivida/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: `Sugira uma opcao de ${refeicaoData.titulo} saudavel para uma mulher.
          Ela tem ${caloriasRestantes} calorias restantes para o dia.
          ${planoRestritivo ? 'Ela segue um plano low carb/restritivo.' : ''}
          ${profile?.amamentando ? 'Ela esta amamentando.' : ''}
          De uma sugestao rapida (max 3 frases) com uma opcao especifica e seus beneficios.`,
          modo: 'nutricao'
        })
      })

      const data = await response.json()
      if (data.resposta) {
        setSugestaoIA(data.resposta)
      }
    } catch (err) {
      console.error('Erro ao buscar sugestao:', err)
    } finally {
      setBuscandoSugestao(false)
    }
  }

  const selecionarRefeicao = async (tipo: TipoRefeicao, opcao: OpcaoRefeicao) => {
    if (!profile?.id) return

    try {
      const { error } = await supabase
        .from('refeicoes_diarias_nutri')
        .upsert({
          user_id: profile.id,
          tipo_refeicao: tipo,
          refeicao_selecionada: opcao,
          data: hoje
        }, {
          onConflict: 'user_id,tipo_refeicao,data'
        })

      if (!error) {
        setRefeicoesSelecionadas(prev => ({ ...prev, [tipo]: opcao }))
        setModalAberto(null)
        setSugestaoIA(null)
      }
    } catch (err) {
      console.error('Erro ao salvar refeicao:', err)
    }
  }

  const limparRefeicao = async (tipo: TipoRefeicao) => {
    if (!profile?.id) return

    try {
      await supabase
        .from('refeicoes_diarias_nutri')
        .delete()
        .eq('user_id', profile.id)
        .eq('tipo_refeicao', tipo)
        .eq('data', hoje)

      setRefeicoesSelecionadas(prev => ({ ...prev, [tipo]: null }))
    } catch (err) {
      console.error('Erro ao limpar refeicao:', err)
    }
  }

  const limparTodas = async () => {
    if (!profile?.id) return

    try {
      await supabase
        .from('refeicoes_diarias_nutri')
        .delete()
        .eq('user_id', profile.id)
        .eq('data', hoje)

      setRefeicoesSelecionadas({
        cafe: null,
        lanche_manha: null,
        almoco: null,
        lanche_tarde: null,
        jantar: null,
        ceia: null
      })
    } catch (err) {
      console.error('Erro ao limpar refeicoes:', err)
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-800">Refeicoes</h1>
          <p className="text-gray-500">Planeje suas refeicoes do dia</p>
        </div>
        {refeicoesCompletas > 0 && (
          <button
            onClick={limparTodas}
            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Resetar
          </button>
        )}
      </div>

      {/* Macros do Dia */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Resumo do Dia</h2>
          <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
            {refeicoesCompletas}/6 refeicoes
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl mx-auto mb-2">
              <Flame className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold">{macrosDia.calorias}</p>
            <p className="text-xs text-orange-100">/ {metaCalorias} kcal</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl mx-auto mb-2">
              <Beef className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold">{macrosDia.proteinas}g</p>
            <p className="text-xs text-orange-100">proteinas</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl mx-auto mb-2">
              <Wheat className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold">{macrosDia.carboidratos}g</p>
            <p className="text-xs text-orange-100">carbos</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl mx-auto mb-2">
              <Droplet className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold">{macrosDia.gorduras}g</p>
            <p className="text-xs text-orange-100">gorduras</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>Progresso calorico</span>
            <span>{Math.round(percentualCalorias)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${macrosDia.calorias > metaCalorias ? 'bg-red-400' : 'bg-white'}`}
              style={{ width: `${percentualCalorias}%` }}
            />
          </div>
          {macrosDia.calorias > metaCalorias && (
            <p className="text-xs text-yellow-200 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {macrosDia.calorias - metaCalorias} kcal acima da meta
            </p>
          )}
        </div>
      </div>

      {/* Lista de Refeicoes */}
      <div className="space-y-3">
        {(Object.keys(REFEICOES_COMPLETAS) as TipoRefeicao[]).map((tipo) => {
          const refeicaoData = REFEICOES_COMPLETAS[tipo]
          const selecionada = refeicoesSelecionadas[tipo]
          const colors = TIPO_COLORS[tipo]

          return (
            <div
              key={tipo}
              className={`bg-white rounded-2xl border-2 transition-all ${
                selecionada ? `border-green-300 ${colors.light}` : 'border-gray-100'
              }`}
            >
              <button
                onClick={() => {
                  setModalAberto(tipo)
                  setSugestaoIA(null)
                }}
                className="w-full p-4 flex items-center gap-4 text-left"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selecionada ? `${colors.bg} text-white` : `${colors.light} ${colors.text}`
                }`}>
                  {TIPO_ICONS[tipo]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{refeicaoData.titulo}</h3>
                    {selecionada && <Check className="w-4 h-4 text-green-500" />}
                  </div>
                  {selecionada ? (
                    <p className="text-sm text-gray-600 truncate">{selecionada.nome}</p>
                  ) : (
                    <p className="text-sm text-gray-400">Toque para escolher</p>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {refeicaoData.horario}
                    {selecionada && (
                      <span className={`ml-2 ${colors.text} font-medium`}>{selecionada.calorias} kcal</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              {selecionada && (
                <div className="px-4 pb-4 pt-0 flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>P: {selecionada.proteinas}g</span>
                    <span>C: {selecionada.carboidratos}g</span>
                    <span>G: {selecionada.gorduras}g</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      limparRefeicao(tipo)
                    }}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal de Selecao */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white w-full lg:max-w-lg lg:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className={`p-4 ${TIPO_COLORS[modalAberto].bg} text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{REFEICOES_COMPLETAS[modalAberto].titulo}</h2>
                  <p className="text-sm opacity-80">{REFEICOES_COMPLETAS[modalAberto].importancia}</p>
                </div>
                <button
                  onClick={() => {
                    setModalAberto(null)
                    setSugestaoIA(null)
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Filtros e IA */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFiltroRestritivo(!filtroRestritivo)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filtroRestritivo
                      ? 'bg-purple-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  Low Carb
                </button>
                <button
                  onClick={() => buscarSugestaoIA(modalAberto)}
                  disabled={buscandoSugestao}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  {buscandoSugestao ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Bot className="w-3 h-3" />
                  )}
                  Sugestao IA
                </button>
              </div>

              {/* Sugestao da IA */}
              {(sugestaoIA || buscandoSugestao) && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-purple-600 font-medium mb-1">Sugestao da Nutri IA</p>
                      {buscandoSugestao ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs">Gerando sugestao...</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-700">{sugestaoIA}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Opcoes */}
            <div className="overflow-y-auto max-h-[50vh] p-4 space-y-3">
              {REFEICOES_COMPLETAS[modalAberto].opcoes
                .filter(opcao => {
                  if (filtroRestritivo && !opcao.restritivo) return false
                  return true
                })
                .map((opcao) => {
                  const isSelected = refeicoesSelecionadas[modalAberto]?.id === opcao.id
                  return (
                    <button
                      key={opcao.id}
                      onClick={() => selecionarRefeicao(modalAberto, opcao)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      } ${opcao.restritivo ? 'ring-2 ring-purple-200' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            {opcao.nome}
                            {isSelected && <Check className="w-4 h-4 text-green-500" />}
                          </h3>
                          {opcao.restritivo && (
                            <span className="inline-block text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full mt-1">
                              LOW CARB
                            </span>
                          )}
                          <p className="text-sm text-gray-500 mt-1">{opcao.descricao}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-orange-600 font-medium">{opcao.calorias} kcal</span>
                        <span className="text-gray-400">P: {opcao.proteinas}g</span>
                        <span className="text-gray-400">C: {opcao.carboidratos}g</span>
                        <span className="text-gray-400">G: {opcao.gorduras}g</span>
                      </div>
                      {opcao.ingredientes && opcao.ingredientes.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          Ingredientes: {opcao.ingredientes.slice(0, 3).join(', ')}
                          {opcao.ingredientes.length > 3 && '...'}
                        </p>
                      )}
                    </button>
                  )
                })}

              {REFEICOES_COMPLETAS[modalAberto].opcoes.filter(opcao => {
                if (filtroRestritivo && !opcao.restritivo) return false
                return true
              }).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>Nenhuma opcao encontrada com o filtro selecionado</p>
                  <button
                    onClick={() => setFiltroRestritivo(false)}
                    className="text-pink-500 text-sm mt-2"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
