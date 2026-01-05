'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { useSimulados, Simulado } from '@/hooks/useSimulados'
import { ListaSimulados } from '@/components/simulados/ListaSimulados'
import { ExecutarSimulado } from '@/components/simulados/ExecutarSimulado'
import { ResultadoSimulado } from '@/components/simulados/ResultadoSimulado'
import { EstatisticasSimulados } from '@/components/simulados/EstatisticasSimulados'
import { GeracaoSimuladoIA } from '@/components/simulados/GeracaoSimuladoIA'

type ViewMode = 'lista' | 'executar' | 'resultado' | 'criar'

export default function SimuladosPage() {
  const { obterSimulado } = useSimulados()

  // Estados
  const [viewMode, setViewMode] = useState<ViewMode>('lista')
  const [simuladoAtual, setSimuladoAtual] = useState<Simulado | null>(null)
  const [estatisticasAtual, setEstatisticasAtual] = useState<Record<string, unknown> | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState<'simulados' | 'estatisticas'>('simulados')

  // Handler para iniciar/continuar simulado
  const handleIniciarSimulado = async (simuladoId: string) => {
    const simulado = await obterSimulado(simuladoId)
    if (simulado) {
      setSimuladoAtual(simulado)
      setViewMode('executar')
    }
  }

  // Handler para ver resultado
  const handleVerResultado = async (simulado: Simulado) => {
    const simuladoCompleto = await obterSimulado(simulado.id)
    if (simuladoCompleto) {
      setSimuladoAtual(simuladoCompleto)
      setViewMode('resultado')
    }
  }

  // Handler para finalizar simulado
  const handleFinalizarSimulado = (resultado: { simulado: Simulado; estatisticas: Record<string, unknown> }) => {
    setSimuladoAtual(resultado.simulado)
    setEstatisticasAtual(resultado.estatisticas)
    setViewMode('resultado')
    setRefreshTrigger(prev => prev + 1)
  }

  // Handler para voltar à lista
  const handleVoltar = () => {
    setViewMode('lista')
    setSimuladoAtual(null)
    setEstatisticasAtual(null)
    setRefreshTrigger(prev => prev + 1)
  }

  // Handler para criar novo simulado
  const handleCriarSimulado = () => {
    setViewMode('criar')
  }

  // Handler quando simulado é criado com sucesso
  const handleSimuladoCriado = () => {
    setRefreshTrigger(prev => prev + 1)
    // Volta para lista - a geração acontece em background
    setViewMode('lista')
  }

  // Se estiver executando um simulado
  if (viewMode === 'executar' && simuladoAtual) {
    return (
      <ExecutarSimulado
        simuladoId={simuladoAtual.id}
        onFinalizar={handleFinalizarSimulado}
        onVoltar={handleVoltar}
      />
    )
  }

  // Se estiver vendo resultado
  if (viewMode === 'resultado' && simuladoAtual) {
    return (
      <ResultadoSimulado
        simulado={simuladoAtual}
        estatisticas={estatisticasAtual || undefined}
        onVoltar={handleVoltar}
        onRefazer={handleCriarSimulado}
      />
    )
  }

  // Se estiver criando simulado
  if (viewMode === 'criar') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0F1419]">
        <Header title="Criar Simulado" />

        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
          {/* Header com voltar */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleVoltar}
              className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-[#3a4552] transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Criar Novo Simulado
              </h1>
              <p className="text-sm text-gray-500 dark:text-[#9dabb9]">
                Pesquise seu concurso e gere questões com IA
              </p>
            </div>
          </div>

          {/* Componente de geração */}
          <GeracaoSimuladoIA
            onSimuladoCriado={handleSimuladoCriado}
            onVoltar={handleVoltar}
          />
        </div>
      </div>
    )
  }

  // Tela principal
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1419]">
      <Header title="Simulados" />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Header com título e botão */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Simulados com IA
            </h1>
            <p className="text-gray-500 dark:text-[#9dabb9] mt-1">
              Pratique com simulados personalizados gerados por inteligência artificial
            </p>
          </div>
          <button
            onClick={handleCriarSimulado}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/25"
          >
            <span className="material-symbols-outlined">add</span>
            Novo Simulado
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[#283039] overflow-x-auto">
          <button
            onClick={() => setActiveTab('simulados')}
            className={`flex-shrink-0 px-4 py-2.5 font-medium text-sm transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'simulados'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="material-symbols-outlined text-lg">quiz</span>
            Meus Simulados
          </button>
          <button
            onClick={() => setActiveTab('estatisticas')}
            className={`flex-shrink-0 px-4 py-2.5 font-medium text-sm transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'estatisticas'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="material-symbols-outlined text-lg">analytics</span>
            Estatísticas
          </button>
        </div>

        {/* Conteúdo */}
        {activeTab === 'simulados' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de simulados (2/3) */}
            <div className="lg:col-span-2">
              <ListaSimulados
                onSelectSimulado={handleVerResultado}
                onIniciarSimulado={handleIniciarSimulado}
                onExcluirSimulado={() => setRefreshTrigger(prev => prev + 1)}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* Resumo de estatísticas (1/3) */}
            <div className="lg:col-span-1">
              <EstatisticasSimulados onCreateSimulado={handleCriarSimulado} />
            </div>
          </div>
        )}

        {activeTab === 'estatisticas' && (
          <EstatisticasSimulados onCreateSimulado={handleCriarSimulado} />
        )}
      </div>
    </div>
  )
}
