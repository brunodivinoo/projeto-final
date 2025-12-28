'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { useSimulados, Simulado } from '@/hooks/useSimulados'
import { CriarSimuladoModal } from '@/components/simulados/CriarSimuladoModal'
import { ListaSimulados } from '@/components/simulados/ListaSimulados'
import { ExecutarSimulado } from '@/components/simulados/ExecutarSimulado'
import { ResultadoSimulado } from '@/components/simulados/ResultadoSimulado'
import { EstatisticasSimulados } from '@/components/simulados/EstatisticasSimulados'
import { SimuladosAvancadoPRO } from '@/components/simulados/SimuladosAvancadoPRO'

type ViewMode = 'lista' | 'executar' | 'resultado'

export default function SimuladosPage() {
  const { obterSimulado } = useSimulados()

  // Estados
  const [viewMode, setViewMode] = useState<ViewMode>('lista')
  const [showCriarModal, setShowCriarModal] = useState(false)
  const [simuladoAtual, setSimuladoAtual] = useState<Simulado | null>(null)
  const [estatisticasAtual, setEstatisticasAtual] = useState<Record<string, unknown> | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState<'simulados' | 'estatisticas' | 'avancado'>('simulados')

  // Handler para criar simulado
  const handleCriarSimulado = (simuladoId: string) => {
    setRefreshTrigger(prev => prev + 1)
    // Opcionalmente iniciar o simulado automaticamente
    handleIniciarSimulado(simuladoId)
  }

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
    // Buscar simulado com detalhes completos
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

  // Handler para refazer simulado (criar similar)
  const handleRefazer = () => {
    setShowCriarModal(true)
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
        onRefazer={handleRefazer}
      />
    )
  }

  // Tela principal
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Simulados Inteligentes" />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Header com título e botão */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Simulados Inteligentes
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Pratique com simulados personalizados e acompanhe seu progresso
            </p>
          </div>
          <button
            onClick={() => setShowCriarModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/25"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Simulado
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('simulados')}
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
              activeTab === 'simulados'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Meus Simulados
          </button>
          <button
            onClick={() => setActiveTab('estatisticas')}
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
              activeTab === 'estatisticas'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Estatísticas
          </button>
          <button
            onClick={() => setActiveTab('avancado')}
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === 'avancado'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="text-xs bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-1.5 py-0.5 rounded font-bold">PRO</span>
            Avançado
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
              <EstatisticasSimulados onCreateSimulado={() => setShowCriarModal(true)} />
            </div>
          </div>
        )}

        {activeTab === 'estatisticas' && (
          <EstatisticasSimulados onCreateSimulado={() => setShowCriarModal(true)} />
        )}

        {activeTab === 'avancado' && (
          <SimuladosAvancadoPRO
            onSimuladoCriado={(simulado) => {
              setRefreshTrigger(prev => prev + 1)
              handleIniciarSimulado(simulado.id)
            }}
          />
        )}
      </div>

      {/* Modal de criação */}
      <CriarSimuladoModal
        isOpen={showCriarModal}
        onClose={() => setShowCriarModal(false)}
        onSuccess={handleCriarSimulado}
      />
    </div>
  )
}
