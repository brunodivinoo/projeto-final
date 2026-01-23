'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Apple,
  Calendar,
  ChevronLeft,
  Plus,
  History,
  Target,
  Award,
  PieChart,
  Copy,
  Star,
  Heart
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

// Interface para refeicao manual
interface RefeicaoManual {
  nome: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}

// Interface para historico
interface HistoricoItem {
  data: string
  totalCalorias: number
  totalProteinas: number
  totalCarboidratos: number
  totalGorduras: number
  refeicoesCount: number
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
  const [loadingDia, setLoadingDia] = useState(false) // Loading suave para troca de dia
  const [sugestaoIA, setSugestaoIA] = useState<string | null>(null)
  const [buscandoSugestao, setBuscandoSugestao] = useState(false)
  const [filtroRestritivo, setFiltroRestritivo] = useState(false)

  // Novos estados
  const [dataAtual, setDataAtual] = useState(new Date())
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [mostrarAddManual, setMostrarAddManual] = useState(false)
  const [refeicaoManual, setRefeicaoManual] = useState<RefeicaoManual>({
    nome: '',
    calorias: 0,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 0
  })
  const [tipoManual, setTipoManual] = useState<TipoRefeicao>('almoco')

  // Estados para Repetir Refeições e Favoritas
  const [refeicoesOntem, setRefeicoesOntem] = useState<Record<TipoRefeicao, OpcaoRefeicao | null>>({
    cafe: null,
    lanche_manha: null,
    almoco: null,
    lanche_tarde: null,
    jantar: null,
    ceia: null
  })
  const [mostrarRepetir, setMostrarRepetir] = useState(false)
  const [refeicoesFavoritas, setRefeicoesFavoritas] = useState<OpcaoRefeicao[]>([])
  const [mostrarFavoritas, setMostrarFavoritas] = useState(false)

  const hoje = dataAtual.toISOString().split('T')[0]
  const isHoje = hoje === new Date().toISOString().split('T')[0]
  const planoRestritivo = profile?.plano === 'restritivo'

  // Navegar entre dias
  const navegarDia = (direcao: 'anterior' | 'proximo') => {
    const novaData = new Date(dataAtual)
    if (direcao === 'anterior') {
      novaData.setDate(novaData.getDate() - 1)
    } else {
      novaData.setDate(novaData.getDate() + 1)
    }
    setDataAtual(novaData)
  }

  const formatarData = (data: Date) => {
    const hojeStr = new Date().toISOString().split('T')[0]
    const dataStr = data.toISOString().split('T')[0]

    if (dataStr === hojeStr) return 'Hoje'

    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    if (dataStr === ontem.toISOString().split('T')[0]) return 'Ontem'

    return data.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

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

  // Calculos adicionais
  const percentualProteinas = metaCalorias > 0 ? Math.round((macrosDia.proteinas * 4 / metaCalorias) * 100) : 0
  const percentualCarbos = metaCalorias > 0 ? Math.round((macrosDia.carboidratos * 4 / metaCalorias) * 100) : 0
  const percentualGorduras = metaCalorias > 0 ? Math.round((macrosDia.gorduras * 9 / metaCalorias) * 100) : 0
  const caloriasRestantes = metaCalorias - macrosDia.calorias

  // Buscar refeicoes do dia anterior para repetir
  const buscarRefeicoesOntem = useCallback(async () => {
    if (!profile?.id) return

    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    const dataOntem = ontem.toISOString().split('T')[0]

    try {
      const { data } = await supabase
        .from('refeicoes_diarias_nutri')
        .select('tipo_refeicao, refeicao_selecionada')
        .eq('user_id', profile.id)
        .eq('data', dataOntem)

      if (data && data.length > 0) {
        const refeicoes: Record<TipoRefeicao, OpcaoRefeicao | null> = {
          cafe: null,
          lanche_manha: null,
          almoco: null,
          lanche_tarde: null,
          jantar: null,
          ceia: null
        }
        data.forEach((item) => {
          const tipo = item.tipo_refeicao as TipoRefeicao
          refeicoes[tipo] = item.refeicao_selecionada as OpcaoRefeicao
        })
        setRefeicoesOntem(refeicoes)
      }
    } catch (err) {
      console.error('Erro ao buscar refeicoes de ontem:', err)
    }
  }, [profile?.id])

  // Buscar refeicoes mais usadas (favoritas baseadas em frequencia)
  const buscarRefeicoesFavoritas = useCallback(async () => {
    if (!profile?.id) return

    try {
      const { data } = await supabase
        .from('refeicoes_diarias_nutri')
        .select('refeicao_selecionada')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (data && data.length > 0) {
        // Contar frequencia de cada refeicao
        const contagem: Record<string, { count: number; refeicao: OpcaoRefeicao }> = {}
        data.forEach((item) => {
          const refeicao = item.refeicao_selecionada as OpcaoRefeicao
          if (refeicao && refeicao.id) {
            if (contagem[refeicao.id]) {
              contagem[refeicao.id].count++
            } else {
              contagem[refeicao.id] = { count: 1, refeicao }
            }
          }
        })

        // Ordenar por frequencia e pegar top 10
        const favoritas = Object.values(contagem)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .map(item => item.refeicao)

        setRefeicoesFavoritas(favoritas)
      }
    } catch (err) {
      console.error('Erro ao buscar favoritas:', err)
    }
  }, [profile?.id])

  // Repetir todas as refeicoes de ontem
  const repetirRefeicoesOntem = async () => {
    if (!profile?.id) return

    const tiposComRefeicao = Object.entries(refeicoesOntem)
      .filter(([_, ref]) => ref !== null) as [TipoRefeicao, OpcaoRefeicao][]

    for (const [tipo, refeicao] of tiposComRefeicao) {
      await selecionarRefeicao(tipo, refeicao)
    }

    setMostrarRepetir(false)
  }

  // Buscar refeicoes do ontem e favoritas ao carregar
  useEffect(() => {
    if (profile?.id) {
      buscarRefeicoesOntem()
      buscarRefeicoesFavoritas()
    }
  }, [profile?.id, buscarRefeicoesOntem, buscarRefeicoesFavoritas])

  // Buscar historico
  const buscarHistorico = useCallback(async () => {
    if (!profile?.id) return

    setLoadingHistorico(true)
    try {
      const seteDiasAtras = new Date()
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

      const { data } = await supabase
        .from('refeicoes_diarias_nutri')
        .select('data, refeicao_selecionada')
        .eq('user_id', profile.id)
        .gte('data', seteDiasAtras.toISOString().split('T')[0])
        .order('data', { ascending: false })

      if (data) {
        // Agrupar por data
        const agrupado = data.reduce((acc, item) => {
          const dataStr = item.data
          if (!acc[dataStr]) {
            acc[dataStr] = {
              data: dataStr,
              totalCalorias: 0,
              totalProteinas: 0,
              totalCarboidratos: 0,
              totalGorduras: 0,
              refeicoesCount: 0
            }
          }
          const refeicao = item.refeicao_selecionada as OpcaoRefeicao
          if (refeicao) {
            acc[dataStr].totalCalorias += refeicao.calorias || 0
            acc[dataStr].totalProteinas += refeicao.proteinas || 0
            acc[dataStr].totalCarboidratos += refeicao.carboidratos || 0
            acc[dataStr].totalGorduras += refeicao.gorduras || 0
            acc[dataStr].refeicoesCount++
          }
          return acc
        }, {} as Record<string, HistoricoItem>)

        setHistorico(Object.values(agrupado).sort((a, b) => b.data.localeCompare(a.data)))
      }
    } catch (err) {
      console.error('Erro ao buscar historico:', err)
    } finally {
      setLoadingHistorico(false)
    }
  }, [profile?.id])

  // Buscar refeicoes do dia (com loading suave)
  const fetchRefeicoes = useCallback(async (isInitial: boolean = false) => {
    if (!profile?.id) return

    // Loading completo apenas no carregamento inicial
    if (isInitial) {
      setLoading(true)
    } else {
      setLoadingDia(true)
    }

    try {
      const { data } = await supabase
        .from('refeicoes_diarias_nutri')
        .select('tipo_refeicao, refeicao_selecionada')
        .eq('user_id', profile.id)
        .eq('data', hoje)

      // Resetar refeicoes ao trocar de dia
      const novasRefeicoes: Record<TipoRefeicao, OpcaoRefeicao | null> = {
        cafe: null,
        lanche_manha: null,
        almoco: null,
        lanche_tarde: null,
        jantar: null,
        ceia: null
      }

      if (data) {
        data.forEach((item) => {
          const tipo = item.tipo_refeicao as TipoRefeicao
          novasRefeicoes[tipo] = item.refeicao_selecionada as OpcaoRefeicao
        })
      }
      setRefeicoesSelecionadas(novasRefeicoes)
    } catch (err) {
      console.error('Erro ao buscar refeicoes:', err)
    } finally {
      setLoading(false)
      setLoadingDia(false)
    }
  }, [profile?.id, hoje])

  // Carregamento inicial
  useEffect(() => {
    fetchRefeicoes(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  // Recarregar ao mudar de dia (sem loading completo)
  useEffect(() => {
    if (!loading) {
      fetchRefeicoes(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoje])

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

  // Adicionar refeicao manual
  const adicionarRefeicaoManual = async () => {
    if (!profile?.id || !refeicaoManual.nome.trim()) return

    const novaOpcao: OpcaoRefeicao = {
      id: `manual_${Date.now()}`,
      nome: refeicaoManual.nome,
      descricao: 'Adicionado manualmente',
      calorias: refeicaoManual.calorias,
      proteinas: refeicaoManual.proteinas,
      carboidratos: refeicaoManual.carboidratos,
      gorduras: refeicaoManual.gorduras,
      ingredientes: [],
      restritivo: false
    }

    try {
      const { error } = await supabase
        .from('refeicoes_diarias_nutri')
        .upsert({
          user_id: profile.id,
          tipo_refeicao: tipoManual,
          refeicao_selecionada: novaOpcao,
          data: hoje
        }, {
          onConflict: 'user_id,tipo_refeicao,data'
        })

      if (!error) {
        setRefeicoesSelecionadas(prev => ({ ...prev, [tipoManual]: novaOpcao }))
        setMostrarAddManual(false)
        setRefeicaoManual({
          nome: '',
          calorias: 0,
          proteinas: 0,
          carboidratos: 0,
          gorduras: 0
        })
      }
    } catch (err) {
      console.error('Erro ao adicionar refeicao manual:', err)
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
      {/* Header com navegacao de dias */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Refeicoes</h1>
            <p className="text-gray-500">Planeje suas refeicoes do dia</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                buscarHistorico()
                setMostrarHistorico(!mostrarHistorico)
              }}
              className={`p-2.5 rounded-xl transition-all ${
                mostrarHistorico
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMostrarAddManual(true)}
              className="p-2.5 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navegacao de dias */}
        <div className={`flex items-center justify-between bg-white rounded-2xl p-3 border border-gray-100 transition-opacity ${loadingDia ? 'opacity-70' : ''}`}>
          <button
            onClick={() => navegarDia('anterior')}
            disabled={loadingDia}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            {loadingDia ? (
              <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 text-pink-500" />
            )}
            <span className="font-medium text-gray-800">{formatarData(dataAtual)}</span>
            {!isHoje && (
              <button
                onClick={() => setDataAtual(new Date())}
                disabled={loadingDia}
                className="text-xs text-pink-500 hover:underline ml-2 disabled:opacity-50"
              >
                Ir para hoje
              </button>
            )}
          </div>
          <button
            onClick={() => navegarDia('proximo')}
            disabled={isHoje || loadingDia}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Acoes rapidas - Repetir Ontem e Favoritas */}
        {isHoje && (
          <div className="flex flex-wrap gap-2">
            {/* Botao Repetir Ontem */}
            {Object.values(refeicoesOntem).some(r => r !== null) && (
              <button
                onClick={() => setMostrarRepetir(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-blue-600 hover:from-blue-100 hover:to-indigo-100 transition-all"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm font-medium">Repetir Ontem</span>
              </button>
            )}

            {/* Botao Favoritas */}
            {refeicoesFavoritas.length > 0 && (
              <button
                onClick={() => setMostrarFavoritas(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl text-pink-600 hover:from-pink-100 hover:to-rose-100 transition-all"
              >
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">Favoritas</span>
              </button>
            )}

            {/* Botao Resetar */}
            {refeicoesCompletas > 0 && (
              <button
                onClick={limparTodas}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600"
              >
                <RefreshCw className="w-4 h-4" />
                Resetar dia
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Repetir Ontem */}
      {mostrarRepetir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Copy className="w-5 h-5 text-blue-500" />
                Repetir Refeicoes de Ontem
              </h3>
              <button onClick={() => setMostrarRepetir(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Selecione as refeicoes que deseja repetir hoje:
            </p>

            <div className="space-y-3 mb-6">
              {(Object.entries(refeicoesOntem) as [TipoRefeicao, OpcaoRefeicao | null][]).map(([tipo, refeicao]) => {
                if (!refeicao) return null
                const colors = TIPO_COLORS[tipo]
                const refeicaoData = REFEICOES_COMPLETAS[tipo]
                return (
                  <div key={tipo} className={`p-3 rounded-xl ${colors.light} border border-gray-100`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center text-white`}>
                          {TIPO_ICONS[tipo]}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{refeicaoData.titulo}</p>
                          <p className="font-medium text-gray-800 text-sm">{refeicao.nome}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => selecionarRefeicao(tipo, refeicao)}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Usar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{refeicao.calorias} kcal • {refeicao.proteinas}g prot</p>
                  </div>
                )
              })}
            </div>

            <button
              onClick={repetirRefeicoesOntem}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Repetir Todas
            </button>
          </div>
        </div>
      )}

      {/* Modal Favoritas */}
      {mostrarFavoritas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Suas Refeicoes Favoritas
              </h3>
              <button onClick={() => setMostrarFavoritas(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Baseado no seu historico, estas sao as refeicoes que voce mais consome:
            </p>

            <div className="space-y-2 mb-4">
              {refeicoesFavoritas.map((refeicao, index) => (
                <div
                  key={refeicao.id}
                  className="p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-100 hover:from-pink-100 hover:to-rose-100 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{refeicao.nome}</p>
                        <p className="text-xs text-gray-500">{refeicao.calorias} kcal • {refeicao.proteinas}g prot</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-1">{refeicao.descricao}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Clique em uma refeicao no menu principal para adicionala
            </p>
          </div>
        </div>
      )}

      {/* Historico */}
      {mostrarHistorico && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <History className="w-5 h-5 text-pink-500" />
              Historico (ultimos 7 dias)
            </h3>
            <button
              onClick={() => setMostrarHistorico(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loadingHistorico ? (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-pink-500 mx-auto" />
            </div>
          ) : historico.length > 0 ? (
            <div className="space-y-2">
              {historico.map((item) => {
                const percentMeta = Math.round((item.totalCalorias / metaCalorias) * 100)
                const dataFormatada = new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })
                return (
                  <button
                    key={item.data}
                    onClick={() => {
                      setDataAtual(new Date(item.data + 'T00:00:00'))
                      setMostrarHistorico(false)
                    }}
                    className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-between transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-800 capitalize">{dataFormatada}</p>
                      <p className="text-xs text-gray-500">{item.refeicoesCount} refeicoes registradas</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${percentMeta > 100 ? 'text-red-500' : percentMeta >= 80 ? 'text-green-500' : 'text-orange-500'}`}>
                        {item.totalCalorias} kcal
                      </p>
                      <p className="text-xs text-gray-400">{percentMeta}% da meta</p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-4">
              Nenhum registro encontrado
            </p>
          )}
        </div>
      )}

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
          {macrosDia.calorias > metaCalorias ? (
            <p className="text-xs text-yellow-200 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {macrosDia.calorias - metaCalorias} kcal acima da meta
            </p>
          ) : caloriasRestantes > 0 && (
            <p className="text-xs text-green-200 mt-1 flex items-center gap-1">
              <Target className="w-3 h-3" />
              {caloriasRestantes} kcal restantes
            </p>
          )}
        </div>

        {/* Distribuicao de macros */}
        {macrosDia.calorias > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4" />
              <p className="text-xs font-medium">Distribuicao</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs opacity-70">Prot</p>
                <p className="font-bold text-sm">{percentualProteinas}%</p>
              </div>
              <div className="flex-1 bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs opacity-70">Carb</p>
                <p className="font-bold text-sm">{percentualCarbos}%</p>
              </div>
              <div className="flex-1 bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs opacity-70">Gord</p>
                <p className="font-bold text-sm">{percentualGorduras}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Medalha se bateu a meta */}
        {macrosDia.calorias >= metaCalorias * 0.8 && macrosDia.calorias <= metaCalorias && (
          <div className="mt-3 flex items-center justify-center gap-2 bg-white/20 rounded-xl py-2">
            <Award className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-medium">Otimo trabalho! Na meta!</span>
          </div>
        )}
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

      {/* Modal Adicionar Refeicao Manual */}
      {mostrarAddManual && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white w-full lg:max-w-md lg:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Adicionar Refeicao</h2>
                </div>
                <button
                  onClick={() => setMostrarAddManual(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Tipo de refeicao */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de refeicao
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(REFEICOES_COMPLETAS) as TipoRefeicao[]).map((tipo) => {
                    const colors = TIPO_COLORS[tipo]
                    return (
                      <button
                        key={tipo}
                        onClick={() => setTipoManual(tipo)}
                        className={`p-2 rounded-xl text-center transition-all ${
                          tipoManual === tipo
                            ? `${colors.bg} text-white`
                            : `${colors.light} ${colors.text}`
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {TIPO_ICONS[tipo]}
                          <span className="text-xs font-medium">{REFEICOES_COMPLETAS[tipo].titulo}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da refeicao
                </label>
                <input
                  type="text"
                  value={refeicaoManual.nome}
                  onChange={(e) => setRefeicaoManual(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Salada com frango grelhado"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              {/* Macros */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Flame className="w-4 h-4 inline mr-1 text-orange-500" />
                    Calorias
                  </label>
                  <input
                    type="number"
                    value={refeicaoManual.calorias || ''}
                    onChange={(e) => setRefeicaoManual(prev => ({ ...prev, calorias: parseInt(e.target.value) || 0 }))}
                    placeholder="kcal"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Beef className="w-4 h-4 inline mr-1 text-red-500" />
                    Proteinas
                  </label>
                  <input
                    type="number"
                    value={refeicaoManual.proteinas || ''}
                    onChange={(e) => setRefeicaoManual(prev => ({ ...prev, proteinas: parseInt(e.target.value) || 0 }))}
                    placeholder="g"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Wheat className="w-4 h-4 inline mr-1 text-amber-500" />
                    Carboidratos
                  </label>
                  <input
                    type="number"
                    value={refeicaoManual.carboidratos || ''}
                    onChange={(e) => setRefeicaoManual(prev => ({ ...prev, carboidratos: parseInt(e.target.value) || 0 }))}
                    placeholder="g"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Droplet className="w-4 h-4 inline mr-1 text-yellow-500" />
                    Gorduras
                  </label>
                  <input
                    type="number"
                    value={refeicaoManual.gorduras || ''}
                    onChange={(e) => setRefeicaoManual(prev => ({ ...prev, gorduras: parseInt(e.target.value) || 0 }))}
                    placeholder="g"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>

              {/* Preview */}
              {refeicaoManual.nome && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
                  <p className="text-gray-800 font-semibold">{refeicaoManual.nome}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {refeicaoManual.calorias} kcal • P: {refeicaoManual.proteinas}g • C: {refeicaoManual.carboidratos}g • G: {refeicaoManual.gorduras}g
                  </p>
                </div>
              )}

              {/* Botao salvar */}
              <button
                onClick={adicionarRefeicaoManual}
                disabled={!refeicaoManual.nome.trim()}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
              >
                Adicionar Refeicao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
