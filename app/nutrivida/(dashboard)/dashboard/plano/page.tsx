'use client'

import { useState, useEffect } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import {
  CalendarDays,
  ShoppingCart,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Check,
  RefreshCw,
  Download
} from 'lucide-react'

interface Refeicao {
  tipo: string
  horario: string
  descricao: string
  calorias: number
}

interface Dia {
  dia: string
  refeicoes: Refeicao[]
}

interface ItemCompra {
  item: string
  quantidade: string
  categoria: string
}

interface PlanoSemanal {
  dias: Dia[]
  lista_compras: ItemCompra[]
  meta_calorias_diaria: number
  dicas_gerais: string[]
}

export default function PlanoSemanalPage() {
  const { user, profile, metaCalorias } = useNutriAuth()
  const [plano, setPlano] = useState<PlanoSemanal | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingExistente, setLoadingExistente] = useState(true)
  const [diaExpandido, setDiaExpandido] = useState<number | null>(0)
  const [preferencias, setPreferencias] = useState('')
  const [mostrarLista, setMostrarLista] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      buscarPlanoExistente()
    }
  }, [user?.id])

  const buscarPlanoExistente = async () => {
    try {
      const response = await fetch(`/api/nutrivida/plano-semanal?userId=${user?.id}`)
      const data = await response.json()
      if (data.plano) {
        setPlano(data.plano)
      }
    } catch (err) {
      console.error('Erro ao buscar plano:', err)
    } finally {
      setLoadingExistente(false)
    }
  }

  const gerarNovoPlano = async () => {
    setLoading(true)
    setErro(null)

    try {
      const response = await fetch('/api/nutrivida/plano-semanal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          preferencias
        })
      })

      const data = await response.json()

      if (data.erro) {
        setErro(data.erro)
      } else if (typeof data.plano === 'string') {
        // Fallback - exibir como texto
        setErro(data.plano)
      } else {
        setPlano(data.plano)
        setDiaExpandido(0)
      }
    } catch (err) {
      console.error('Erro ao gerar plano:', err)
      setErro('Erro ao gerar plano. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const getTotalCaloriasDia = (dia: Dia) => {
    return dia.refeicoes.reduce((total, ref) => total + ref.calorias, 0)
  }

  const categorizarCompras = (itens: ItemCompra[]) => {
    const categorias: Record<string, ItemCompra[]> = {}
    itens.forEach(item => {
      const cat = item.categoria || 'Outros'
      if (!categorias[cat]) categorias[cat] = []
      categorias[cat].push(item)
    })
    return categorias
  }

  if (loadingExistente) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Plano Semanal</h1>
          <p className="text-gray-500">Cardapio personalizado pela IA</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border border-green-100">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-700 font-medium">Plano Inteligente</p>
            <p className="text-sm text-gray-500 mt-1">
              A IA cria um cardapio completo de 7 dias baseado no seu perfil,
              com lista de compras organizada!
            </p>
          </div>
        </div>
      </div>

      {/* Gerar/Atualizar Plano */}
      {!plano ? (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Gerar seu plano personalizado</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              Preferencias ou restricoes (opcional)
            </label>
            <textarea
              value={preferencias}
              onChange={(e) => setPreferencias(e.target.value)}
              placeholder="Ex: Nao gosto de brocolis, prefiro receitas rapidas, sou vegetariana..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />
          </div>

          <div className="bg-green-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-green-700">
              <strong>Seu perfil:</strong> Meta de {metaCalorias} kcal/dia
              {profile?.amamentando && ' (+500 kcal para amamentacao)'}
            </p>
          </div>

          <button
            onClick={gerarNovoPlano}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-teal-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando plano... (pode levar 30s)
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Gerar Plano Semanal
              </>
            )}
          </button>

          {erro && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-700 whitespace-pre-wrap text-sm">{erro}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Botões de ação */}
          <div className="flex gap-3">
            <button
              onClick={() => setMostrarLista(!mostrarLista)}
              className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                mostrarLista
                  ? 'bg-teal-500 text-white'
                  : 'bg-teal-50 text-teal-700 border border-teal-200'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              Lista de Compras
            </button>
            <button
              onClick={gerarNovoPlano}
              disabled={loading}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            </button>
          </div>

          {/* Lista de Compras */}
          {mostrarLista && plano.lista_compras?.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-teal-500" />
                Lista de Compras
              </h2>

              {Object.entries(categorizarCompras(plano.lista_compras)).map(([categoria, itens]) => (
                <div key={categoria} className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase">{categoria}</h3>
                  <div className="space-y-2">
                    {itens.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                        <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center hover:border-teal-500 cursor-pointer">
                          <Check className="w-3 h-3 text-transparent hover:text-teal-500" />
                        </div>
                        <span className="flex-1 text-gray-700">{item.item}</span>
                        <span className="text-sm text-gray-400">{item.quantidade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dias do Plano */}
          <div className="space-y-3">
            {plano.dias?.map((dia, index) => (
              <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setDiaExpandido(diaExpandido === index ? null : index)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl flex items-center justify-center">
                      <span className="text-green-600 font-bold">{index + 1}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">{dia.dia}</p>
                      <p className="text-sm text-gray-500">{dia.refeicoes?.length || 0} refeicoes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="w-4 h-4" />
                        <span className="font-semibold">{getTotalCaloriasDia(dia)}</span>
                      </div>
                      <p className="text-xs text-gray-400">kcal</p>
                    </div>
                    {diaExpandido === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {diaExpandido === index && (
                  <div className="border-t border-gray-100 p-4 space-y-3">
                    {dia.refeicoes?.map((refeicao, refIndex) => (
                      <div key={refIndex} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-800">{refeicao.tipo}</p>
                            <span className="text-sm text-orange-500 font-medium">{refeicao.calorias} kcal</span>
                          </div>
                          <p className="text-sm text-gray-500">{refeicao.horario}</p>
                          <p className="text-sm text-gray-600 mt-1">{refeicao.descricao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Dicas Gerais */}
          {plano.dicas_gerais?.length > 0 && (
            <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-5 text-white">
              <h3 className="font-semibold mb-3">Dicas da Nutri IA</h3>
              <ul className="space-y-2">
                {plano.dicas_gerais.map((dica, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/90 text-sm">
                    <span className="mt-1">•</span>
                    {dica}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
