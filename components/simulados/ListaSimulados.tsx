'use client'
import { useState, useEffect } from 'react'
import { useSimulados, Simulado } from '@/hooks/useSimulados'

interface Props {
  onSelectSimulado: (simulado: Simulado) => void
  onIniciarSimulado: (simuladoId: string) => void
  onExcluirSimulado?: (simuladoId: string) => void
  refreshTrigger?: number
}

export function ListaSimulados({ onSelectSimulado, onIniciarSimulado, onExcluirSimulado, refreshTrigger }: Props) {
  const { listarSimulados, excluirSimulado, loading } = useSimulados()
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const porPagina = 10

  useEffect(() => {
    carregarSimulados()
  }, [filtroStatus, pagina, refreshTrigger])

  const carregarSimulados = async () => {
    const { simulados: data, total: totalSimulados } = await listarSimulados(
      filtroStatus || undefined,
      pagina,
      porPagina
    )
    setSimulados(data)
    setTotal(totalSimulados)
  }

  const handleExcluir = async (id: string) => {
    const sucesso = await excluirSimulado(id)
    if (sucesso) {
      setConfirmDelete(null)
      carregarSimulados()
      onExcluirSimulado?.(id)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
            Pendente
          </span>
        )
      case 'em_andamento':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
            Em Andamento
          </span>
        )
      case 'finalizado':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
            Finalizado
          </span>
        )
      default:
        return null
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalPaginas = Math.ceil(total / porPagina)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header com filtros */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Meus Simulados
          </h3>
          <div className="flex gap-2">
            <select
              value={filtroStatus}
              onChange={(e) => {
                setFiltroStatus(e.target.value)
                setPagina(1)
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="finalizado">Finalizados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <svg className="w-8 h-8 animate-spin mx-auto text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Carregando simulados...</p>
          </div>
        ) : simulados.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              {filtroStatus ? 'Nenhum simulado encontrado com este filtro' : 'Você ainda não criou nenhum simulado'}
            </p>
          </div>
        ) : (
          simulados.map((simulado) => (
            <div
              key={simulado.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-800 dark:text-white truncate">
                      {simulado.titulo}
                    </h4>
                    {getStatusBadge(simulado.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>{simulado.quantidade_questoes} questões</span>
                    <span className="capitalize">
                      {simulado.modalidade === 'multipla_escolha' ? 'Múltipla Escolha' : 'Certo/Errado'}
                    </span>
                    {simulado.status === 'finalizado' && simulado.pontuacao !== undefined && (
                      <span className={`font-medium ${
                        simulado.pontuacao >= 70 ? 'text-green-600 dark:text-green-400' :
                        simulado.pontuacao >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {simulado.pontuacao.toFixed(1)}% de acerto
                      </span>
                    )}
                    <span>{formatarData(simulado.created_at)}</span>
                  </div>
                  {/* Disciplinas */}
                  {simulado.simulado_disciplinas && simulado.simulado_disciplinas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {simulado.simulado_disciplinas.slice(0, 3).map((d, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                        >
                          {d.disciplina_nome}
                        </span>
                      ))}
                      {simulado.simulado_disciplinas.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                          +{simulado.simulado_disciplinas.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  {simulado.status === 'pendente' && (
                    <>
                      <button
                        onClick={() => onIniciarSimulado(simulado.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Iniciar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(simulado.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                  {simulado.status === 'em_andamento' && (
                    <button
                      onClick={() => onIniciarSimulado(simulado.id)}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Continuar
                    </button>
                  )}
                  {simulado.status === 'finalizado' && (
                    <>
                      <button
                        onClick={() => onSelectSimulado(simulado)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        Ver Resultado
                      </button>
                      <button
                        onClick={() => setConfirmDelete(simulado.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Modal de confirmação de exclusão */}
              {confirmDelete === simulado.id && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    Tem certeza que deseja excluir este simulado? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExcluir(simulado.id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {((pagina - 1) * porPagina) + 1} - {Math.min(pagina * porPagina, total)} de {total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
              {pagina} / {totalPaginas}
            </span>
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
