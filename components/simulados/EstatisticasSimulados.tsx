'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSimulados, Estatisticas } from '@/hooks/useSimulados'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  onCreateSimulado?: () => void
}

export function EstatisticasSimulados({ onCreateSimulado }: Props) {
  const { user, loading: authLoading } = useAuth()
  const { buscarEstatisticas } = useSimulados()
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [carregado, setCarregado] = useState(false)

  const carregarEstatisticas = useCallback(async () => {
    if (!user || carregado) return

    setLoading(true)
    try {
      const data = await buscarEstatisticas()
      setEstatisticas(data)
      setCarregado(true)
    } finally {
      setLoading(false)
    }
  }, [user, carregado, buscarEstatisticas])

  useEffect(() => {
    // Só carrega quando auth terminar e user existir
    if (!authLoading && user && !carregado) {
      carregarEstatisticas()
    }
  }, [authLoading, user, carregado, carregarEstatisticas])

  // Mostra loading enquanto auth está carregando ou dados estão sendo buscados
  if (authLoading || loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    )
  }

  // Se não tem user após auth carregar, não mostra nada
  if (!user) {
    return null
  }

  if (!estatisticas) {
    return null
  }

  const { resumo, uso_mensal, evolucao, desempenho_por_disciplina, pontos_fortes, pontos_fracos, sugestoes } = estatisticas

  return (
    <div className="space-y-6">
      {/* Uso Mensal */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Limite Mensal</h3>
          <span className="text-sm opacity-80">
            {uso_mensal.simulados_realizados}/{uso_mensal.limite} simulados
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 mb-2">
          <div
            className="bg-white h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (uso_mensal.simulados_realizados / uso_mensal.limite) * 100)}%` }}
          />
        </div>
        <p className="text-sm opacity-80">
          {uso_mensal.restantes > 0
            ? `Você ainda pode criar ${uso_mensal.restantes} simulado(s) este mês`
            : 'Limite mensal atingido'
          }
        </p>
      </div>

      {/* Resumo Geral */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">
          Resumo Geral
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
              {resumo.total_simulados}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Simulados</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
            <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
              {resumo.total_acertos}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Acertos</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
              {resumo.media_geral.toFixed(1)}%
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Média</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
            <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400 truncate">
              {resumo.tempo_total_formatado}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Tempo</div>
          </div>
        </div>
      </div>

      {/* Evolução */}
      {evolucao.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Evolução
          </h3>
          <div className="flex items-end gap-2 h-32">
            {evolucao.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    item.pontuacao >= 70 ? 'bg-green-500' :
                    item.pontuacao >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ height: `${Math.max(10, item.pontuacao)}%` }}
                  title={`${item.pontuacao.toFixed(1)}%`}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                  {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desempenho por Disciplina */}
      {desempenho_por_disciplina.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Desempenho por Disciplina
          </h3>
          <div className="space-y-3">
            {desempenho_por_disciplina.slice(0, 6).map((disc, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                    {disc.nome}
                  </span>
                  <span className={`font-medium ${
                    disc.percentual >= 70 ? 'text-green-600 dark:text-green-400' :
                    disc.percentual >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {disc.percentual}% ({disc.acertos}/{disc.total_questoes})
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      disc.percentual >= 70 ? 'bg-green-500' :
                      disc.percentual >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${disc.percentual}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pontos Fortes e Fracos lado a lado */}
      {(pontos_fortes.length > 0 || pontos_fracos.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pontos_fortes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Pontos Fortes
              </h3>
              <ul className="space-y-2">
                {pontos_fortes.map((ponto, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                    <span className="truncate">{ponto.nome}</span>
                    <span className="text-green-600 dark:text-green-400 font-medium ml-auto">
                      {ponto.percentual}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pontos_fracos.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Pontos a Melhorar
              </h3>
              <ul className="space-y-2">
                {pontos_fracos.map((ponto, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                    <span className="truncate">{ponto.nome}</span>
                    <span className="text-red-600 dark:text-red-400 font-medium ml-auto">
                      {ponto.percentual}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sugestões */}
      {sugestoes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Sugestões da IA
          </h3>
          <div className="space-y-3">
            {sugestoes.map((sugestao, index) => (
              <div
                key={index}
                className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
              >
                <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                  {sugestao.titulo}
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {sugestao.descricao}
                </p>
                {sugestao.config_sugerida && onCreateSimulado && (
                  <button
                    onClick={onCreateSimulado}
                    className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Criar simulado sugerido →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {resumo.total_simulados === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            Nenhuma estatística ainda
          </h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Complete alguns simulados para ver suas estatísticas de desempenho aqui.
          </p>
          {onCreateSimulado && (
            <button
              onClick={onCreateSimulado}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Criar Primeiro Simulado
            </button>
          )}
        </div>
      )}
    </div>
  )
}
