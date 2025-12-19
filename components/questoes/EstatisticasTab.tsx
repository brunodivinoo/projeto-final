'use client'

import { useState, useEffect, useCallback } from 'react'

interface Estatisticas {
  totalRespostas: number
  acertos: number
  erros: number
  taxaAcerto: number
  distribuicao: Record<string, number>
  gabarito: string
  modalidade: string
}

interface EstatisticasTabProps {
  questaoId: string
  modalidade: string
  gabarito: string
}

export function EstatisticasTab({ questaoId, modalidade, gabarito }: EstatisticasTabProps) {
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)

  const isCertoErrado = modalidade === 'certo_errado'
  const gabaritoConvertido = isCertoErrado
    ? (gabarito === 'CERTO' ? 'C' : 'E')
    : gabarito

  const carregarEstatisticas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/questoes/${questaoId}/estatisticas`)
      const data = await res.json()
      setEstatisticas(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }, [questaoId])

  useEffect(() => {
    carregarEstatisticas()
  }, [carregarEstatisticas])

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
      </div>
    )
  }

  if (!estatisticas || estatisticas.totalRespostas === 0) {
    return (
      <div className="p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">bar_chart</span>
        <p className="text-gray-500 dark:text-gray-400">Ainda não há estatísticas para esta questão</p>
      </div>
    )
  }

  const alternativas = isCertoErrado ? ['C', 'E'] : ['A', 'B', 'C', 'D', 'E']
  const nomeAlternativas: Record<string, string> = isCertoErrado
    ? { C: 'Certo', E: 'Errado' }
    : { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' }

  return (
    <div className="p-4 space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-[#161f28] rounded-xl">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{estatisticas.totalRespostas}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total de respostas</p>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{estatisticas.taxaAcerto}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Taxa de acerto</p>
        </div>
        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{100 - estatisticas.taxaAcerto}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Taxa de erro</p>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Distribuição das respostas</h4>
        <div className="space-y-3">
          {alternativas.map((letra) => {
            const porcentagem = estatisticas.distribuicao[letra] || 0
            const isGabarito = letra === gabaritoConvertido

            return (
              <div key={letra} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                  isGabarito
                    ? 'bg-green-500 text-white'
                    : 'border-2 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {isGabarito ? (
                    <span className="material-symbols-outlined text-sm">check</span>
                  ) : (
                    letra
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{nomeAlternativas[letra]}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{porcentagem}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-[#283039] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isGabarito ? 'bg-green-500' : 'bg-primary/50'}`}
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
