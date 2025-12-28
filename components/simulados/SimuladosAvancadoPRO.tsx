'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  useSimulados,
  ConfigGeracaoIA,
  AnaliseIA,
  ResultadoComparacao,
  DadosEvolucao,
  AnaliseDetalhada,
  Simulado
} from '@/hooks/useSimulados'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  onSimuladoCriado?: (simulado: Simulado) => void
  onClose?: () => void
}

type TabType = 'gerar-ia' | 'sugestoes' | 'comparar' | 'evolucao' | 'analise'
type PeriodoEvolucao = '7d' | '30d' | '90d' | '6m' | '1a' | 'all'

export function SimuladosAvancadoPRO({ onSimuladoCriado, onClose }: Props) {
  const { user } = useAuth()
  const {
    loading,
    gerarSimuladoIA,
    buscarSugestoesIA,
    compararSimulados,
    buscarEvolucao,
    buscarAnaliseDetalhada,
    listarSimulados
  } = useSimulados()

  const [activeTab, setActiveTab] = useState<TabType>('gerar-ia')
  const [isPro, setIsPro] = useState(false)

  // Estado para geração com IA
  const [configIA, setConfigIA] = useState<ConfigGeracaoIA>({
    titulo: '',
    modalidade: 'multipla_escolha',
    quantidade_questoes: 15,
    tempo_limite_minutos: 30,
    dificuldades: ['media'],
    disciplinas: [],
    bancas: ['CESPE/CEBRASPE'],
    foco_pontos_fracos: true
  })
  const [gerando, setGerando] = useState(false)

  // Estado para sugestões
  const [sugestoesData, setSugestoesData] = useState<AnaliseIA | null>(null)
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(false)

  // Estado para comparação
  const [comparacaoData, setComparacaoData] = useState<ResultadoComparacao | null>(null)
  const [simuladosParaComparar, setSimuladosParaComparar] = useState<string[]>([])
  const [simuladosDisponiveis, setSimuladosDisponiveis] = useState<Simulado[]>([])

  // Estado para evolução
  const [evolucaoData, setEvolucaoData] = useState<DadosEvolucao | null>(null)
  const [periodoEvolucao, setPeriodoEvolucao] = useState<PeriodoEvolucao>('30d')

  // Estado para análise detalhada
  const [analiseData, setAnaliseData] = useState<AnaliseDetalhada | null>(null)

  // Verificar se é PRO
  useEffect(() => {
    // Em produção, verificar plano do usuário
    setIsPro(true) // Para desenvolvimento
  }, [user])

  // Carregar dados ao mudar de tab
  useEffect(() => {
    if (!isPro) return

    switch (activeTab) {
      case 'sugestoes':
        carregarSugestoes()
        break
      case 'comparar':
        carregarSimuladosDisponiveis()
        break
      case 'evolucao':
        carregarEvolucao()
        break
      case 'analise':
        carregarAnalise()
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isPro])

  const carregarSugestoes = async () => {
    setCarregandoSugestoes(true)
    const data = await buscarSugestoesIA()
    setSugestoesData(data)
    setCarregandoSugestoes(false)
  }

  const carregarSimuladosDisponiveis = async () => {
    const { simulados } = await listarSimulados('finalizado', 1, 20)
    setSimuladosDisponiveis(simulados)
  }

  const carregarComparacao = async () => {
    if (simuladosParaComparar.length < 2) return
    const data = await compararSimulados(simuladosParaComparar)
    setComparacaoData(data)
  }

  const carregarEvolucao = useCallback(async () => {
    const data = await buscarEvolucao(periodoEvolucao)
    setEvolucaoData(data)
  }, [buscarEvolucao, periodoEvolucao])

  const carregarAnalise = async () => {
    const data = await buscarAnaliseDetalhada(true)
    setAnaliseData(data)
  }

  // Atualizar evolução quando mudar período
  useEffect(() => {
    if (activeTab === 'evolucao' && isPro) {
      carregarEvolucao()
    }
  }, [periodoEvolucao, activeTab, isPro, carregarEvolucao])

  const handleGerarSimulado = async () => {
    if (configIA.disciplinas.length === 0) {
      alert('Selecione pelo menos uma disciplina')
      return
    }

    setGerando(true)
    const resultado = await gerarSimuladoIA({
      ...configIA,
      titulo: configIA.titulo || `Simulado IA - ${new Date().toLocaleDateString('pt-BR')}`
    })

    if (resultado) {
      onSimuladoCriado?.(resultado.simulado)
    }
    setGerando(false)
  }

  const toggleDisciplina = (nome: string) => {
    setConfigIA(prev => {
      const existe = prev.disciplinas.find(d => d.nome === nome)
      if (existe) {
        return {
          ...prev,
          disciplinas: prev.disciplinas.filter(d => d.nome !== nome)
        }
      } else {
        return {
          ...prev,
          disciplinas: [...prev.disciplinas, { nome, peso: 1 }]
        }
      }
    })
  }

  const toggleDificuldade = (dif: string) => {
    setConfigIA(prev => {
      if (prev.dificuldades.includes(dif)) {
        return {
          ...prev,
          dificuldades: prev.dificuldades.filter(d => d !== dif)
        }
      } else {
        return {
          ...prev,
          dificuldades: [...prev.dificuldades, dif]
        }
      }
    })
  }

  const toggleSimuladoComparacao = (id: string) => {
    setSimuladosParaComparar(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id)
      }
      if (prev.length >= 5) {
        return prev
      }
      return [...prev, id]
    })
  }

  // Disciplinas comuns para seleção rápida
  const disciplinasComuns = [
    'Direito Constitucional',
    'Direito Administrativo',
    'Língua Portuguesa',
    'Raciocínio Lógico',
    'Direito Penal',
    'Direito Civil',
    'Informática',
    'Legislação Específica'
  ]

  if (!isPro) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Recurso Exclusivo PRO
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Acesse simulados com IA, análise avançada de desempenho, gráficos de evolução e muito mais.
        </p>
        <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-all">
          Fazer Upgrade para PRO
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Recursos Avançados PRO</h2>
              <p className="text-purple-200 text-sm">IA, Análise e Evolução</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex overflow-x-auto">
          {[
            { id: 'gerar-ia', label: 'Gerar com IA', icon: '🤖' },
            { id: 'sugestoes', label: 'Sugestões', icon: '💡' },
            { id: 'comparar', label: 'Comparar', icon: '📊' },
            { id: 'evolucao', label: 'Evolução', icon: '📈' },
            { id: 'analise', label: 'Análise', icon: '🎯' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        {/* Tab: Gerar com IA */}
        {activeTab === 'gerar-ia' && (
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-medium text-purple-900 dark:text-purple-100">
                    Geração Inteligente com IA
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    A IA gera questões personalizadas focando nos seus pontos fracos para otimizar seus estudos.
                  </p>
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Título */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título do Simulado (opcional)
                </label>
                <input
                  type="text"
                  value={configIA.titulo}
                  onChange={e => setConfigIA(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Simulado focado em Direito Constitucional"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Disciplinas */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Disciplinas *
                </label>
                <div className="flex flex-wrap gap-2">
                  {disciplinasComuns.map(disc => (
                    <button
                      key={disc}
                      onClick={() => toggleDisciplina(disc)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        configIA.disciplinas.find(d => d.nome === disc)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {disc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantidade de Questões
                </label>
                <select
                  value={configIA.quantidade_questoes}
                  onChange={e => setConfigIA(prev => ({ ...prev, quantidade_questoes: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {[5, 10, 15, 20, 25, 30].map(n => (
                    <option key={n} value={n}>{n} questões</option>
                  ))}
                </select>
              </div>

              {/* Tempo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tempo Limite
                </label>
                <select
                  value={configIA.tempo_limite_minutos || 0}
                  onChange={e => setConfigIA(prev => ({ ...prev, tempo_limite_minutos: Number(e.target.value) || undefined }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={0}>Sem limite</option>
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1h 30min</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>

              {/* Modalidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Modalidade
                </label>
                <select
                  value={configIA.modalidade}
                  onChange={e => setConfigIA(prev => ({ ...prev, modalidade: e.target.value as ConfigGeracaoIA['modalidade'] }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="multipla_escolha">Múltipla Escolha</option>
                  <option value="certo_errado">Certo ou Errado</option>
                  <option value="mista">Mista</option>
                </select>
              </div>

              {/* Dificuldade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dificuldade
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'facil', label: 'Fácil', color: 'green' },
                    { value: 'media', label: 'Média', color: 'yellow' },
                    { value: 'dificil', label: 'Difícil', color: 'red' }
                  ].map(dif => (
                    <button
                      key={dif.value}
                      onClick={() => toggleDificuldade(dif.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        configIA.dificuldades.includes(dif.value)
                          ? dif.color === 'green' ? 'bg-green-600 text-white' :
                            dif.color === 'yellow' ? 'bg-yellow-500 text-white' :
                            'bg-red-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {dif.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opções avançadas */}
              <div className="md:col-span-2 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configIA.foco_pontos_fracos}
                    onChange={e => setConfigIA(prev => ({ ...prev, foco_pontos_fracos: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Focar em pontos fracos
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configIA.baseado_em_erros}
                    onChange={e => setConfigIA(prev => ({ ...prev, baseado_em_erros: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Baseado nos meus erros
                  </span>
                </label>
              </div>
            </div>

            {/* Botão Gerar */}
            <button
              onClick={handleGerarSimulado}
              disabled={gerando || configIA.disciplinas.length === 0}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {gerando ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Gerando questões...
                </>
              ) : (
                <>
                  <span>🤖</span>
                  Gerar Simulado com IA
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab: Sugestões */}
        {activeTab === 'sugestoes' && (
          <div className="space-y-6">
            {carregandoSugestoes || loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">Analisando seu desempenho...</p>
              </div>
            ) : sugestoesData ? (
              <>
                {/* Análise Resumida */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{sugestoesData.analise.total_simulados}</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">Simulados</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{sugestoesData.analise.media_geral.toFixed(0)}%</div>
                    <div className="text-xs text-green-700 dark:text-green-300">Média Geral</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {sugestoesData.analise.tendencia === 'melhorando' ? '📈' :
                       sugestoesData.analise.tendencia === 'piorando' ? '📉' : '➡️'}
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300 capitalize">
                      {sugestoesData.analise.tendencia}
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{sugestoesData.analise.tempo_medio_por_questao}s</div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">Tempo/Questão</div>
                  </div>
                </div>

                {/* Lista de Sugestões */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>💡</span> Sugestões Personalizadas
                  </h3>
                  {sugestoesData.sugestoes.map((sugestao, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        sugestao.prioridade === 'alta'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                          : sugestao.prioridade === 'media'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                          : 'bg-green-50 dark:bg-green-900/20 border-green-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {sugestao.tipo === 'alerta' ? '⚠️' :
                               sugestao.tipo === 'foco_estudo' ? '📚' :
                               sugestao.tipo === 'simulado_recomendado' ? '📝' :
                               sugestao.tipo === 'dica' ? '💡' : '🔄'}
                            </span>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {sugestao.titulo}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {sugestao.descricao}
                          </p>
                          {sugestao.disciplinas_relacionadas && sugestao.disciplinas_relacionadas.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {sugestao.disciplinas_relacionadas.map(d => (
                                <span key={d} className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                                  {d}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {sugestao.acao_sugerida?.tipo === 'criar_simulado' && (
                          <button
                            onClick={() => {
                              if (sugestao.disciplinas_relacionadas) {
                                setConfigIA(prev => ({
                                  ...prev,
                                  disciplinas: sugestao.disciplinas_relacionadas!.map(d => ({ nome: d, peso: 1 }))
                                }))
                                setActiveTab('gerar-ia')
                              }
                            }}
                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                          >
                            Aplicar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhuma sugestão disponível ainda</p>
                <button
                  onClick={carregarSugestoes}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Gerar Sugestões
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Comparar */}
        {activeTab === 'comparar' && (
          <div className="space-y-6">
            {/* Seleção de Simulados */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Selecione 2-5 simulados para comparar
              </h3>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {simuladosDisponiveis.map(sim => (
                  <label
                    key={sim.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      simuladosParaComparar.includes(sim.id)
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                        : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={simuladosParaComparar.includes(sim.id)}
                      onChange={() => toggleSimuladoComparacao(sim.id)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{sim.titulo}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(sim.finalizado_em || '').toLocaleDateString('pt-BR')} • {sim.pontuacao?.toFixed(0)}%
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <button
                onClick={carregarComparacao}
                disabled={simuladosParaComparar.length < 2 || loading}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Comparar Selecionados
              </button>
            </div>

            {/* Resultado da Comparação */}
            {comparacaoData && (
              <div className="space-y-6">
                {/* Insights */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Insights da Comparação</h4>
                  <ul className="space-y-2">
                    {comparacaoData.analise_comparativa.insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span>•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cards de métricas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow text-center">
                    <div className={`text-2xl font-bold ${
                      comparacaoData.analise_comparativa.evolucao_percentual > 0 ? 'text-green-600' :
                      comparacaoData.analise_comparativa.evolucao_percentual < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {comparacaoData.analise_comparativa.evolucao_percentual > 0 ? '+' : ''}
                      {comparacaoData.analise_comparativa.evolucao_percentual.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Evolução</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow text-center">
                    <div className={`text-2xl font-bold ${
                      comparacaoData.analise_comparativa.consistencia === 'alta' ? 'text-green-600' :
                      comparacaoData.analise_comparativa.consistencia === 'baixa' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {comparacaoData.analise_comparativa.consistencia === 'alta' ? '⬆️' :
                       comparacaoData.analise_comparativa.consistencia === 'baixa' ? '⬇️' : '➡️'}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      Consistência {comparacaoData.analise_comparativa.consistencia}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {comparacaoData.analise_comparativa.disciplinas_melhoraram.length}
                    </div>
                    <div className="text-xs text-gray-500">Melhoraram</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {comparacaoData.analise_comparativa.disciplinas_pioraram.length}
                    </div>
                    <div className="text-xs text-gray-500">Pioraram</div>
                  </div>
                </div>

                {/* Tabela de Simulados */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Simulado</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Pontuação</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Acertos</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Tempo/Q</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparacaoData.simulados.map(sim => (
                        <tr key={sim.id} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-2 px-3">
                            <div className="font-medium text-gray-900 dark:text-white">{sim.titulo}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(sim.data).toLocaleDateString('pt-BR')}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`font-bold ${
                              sim.pontuacao >= 70 ? 'text-green-600' :
                              sim.pontuacao >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {sim.pontuacao.toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-gray-600 dark:text-gray-400">
                            {sim.acertos}/{sim.total_questoes}
                          </td>
                          <td className="py-2 px-3 text-center text-gray-600 dark:text-gray-400">
                            {sim.tempo_medio_por_questao}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Evolução */}
        {activeTab === 'evolucao' && (
          <div className="space-y-6">
            {/* Seletor de Período */}
            <div className="flex gap-2 overflow-x-auto">
              {[
                { value: '7d', label: '7 dias' },
                { value: '30d', label: '30 dias' },
                { value: '90d', label: '3 meses' },
                { value: '6m', label: '6 meses' },
                { value: '1a', label: '1 ano' },
                { value: 'all', label: 'Tudo' }
              ].map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriodoEvolucao(p.value as PeriodoEvolucao)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    periodoEvolucao === p.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : evolucaoData ? (
              <>
                {/* Resumo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{evolucaoData.resumo.total_simulados}</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">Simulados</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{evolucaoData.resumo.media_geral.toFixed(0)}%</div>
                    <div className="text-xs text-green-700 dark:text-green-300">Média</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {evolucaoData.resumo.tendencia === 'melhorando' ? '📈' :
                       evolucaoData.resumo.tendencia === 'piorando' ? '📉' : '➡️'}
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300 capitalize">
                      {evolucaoData.resumo.tendencia}
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-orange-600 truncate">
                      {evolucaoData.resumo.melhor_disciplina?.disciplina || '-'}
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">Melhor Área</div>
                  </div>
                </div>

                {/* Gráfico Simplificado (barras) */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Evolução das Pontuações</h4>
                  <div className="flex items-end gap-2 h-48">
                    {evolucaoData.evolucao_geral.slice(-15).map((ponto, index) => {
                      const altura = Math.max(10, (ponto.pontuacao / 100) * 100)
                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {ponto.pontuacao.toFixed(0)}%
                          </span>
                          <div
                            className={`w-full rounded-t transition-all ${
                              ponto.pontuacao >= 70 ? 'bg-green-500' :
                              ponto.pontuacao >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ height: `${altura}%` }}
                            title={`${ponto.titulo} - ${ponto.pontuacao.toFixed(0)}%`}
                          />
                          <span className="text-xs text-gray-400 truncate max-w-full">
                            {ponto.data_formatada}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Evolução por Disciplina */}
                {evolucaoData.evolucao_por_disciplina.length > 0 && (
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Evolução por Disciplina</h4>
                    <div className="space-y-3">
                      {evolucaoData.evolucao_por_disciplina.slice(0, 5).map(disc => {
                        const ultimoPercentual = disc.pontos[disc.pontos.length - 1]?.percentual || 0
                        return (
                          <div key={disc.disciplina} className="flex items-center gap-3">
                            <div className="w-40 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                              {disc.disciplina}
                            </div>
                            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  ultimoPercentual >= 70 ? 'bg-green-500' :
                                  ultimoPercentual >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${ultimoPercentual}%` }}
                              />
                            </div>
                            <div className="w-16 text-right">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {ultimoPercentual.toFixed(0)}%
                              </span>
                              <span className="ml-1 text-xs">
                                {disc.tendencia === 'melhorando' ? '📈' :
                                 disc.tendencia === 'piorando' ? '📉' : ''}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Nenhum dado de evolução disponível
              </div>
            )}
          </div>
        )}

        {/* Tab: Análise */}
        {activeTab === 'analise' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">Analisando seu perfil...</p>
              </div>
            ) : analiseData ? (
              <>
                {/* Resumo da IA */}
                {analiseData.resumo_ia && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🤖</span>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Análise da IA</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{analiseData.resumo_ia}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pontos Fortes e Fracos */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Pontos Fortes */}
                  <div>
                    <h4 className="font-medium text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                      <span>💪</span> Pontos Fortes
                    </h4>
                    <div className="space-y-2">
                      {analiseData.pontos_fortes.slice(0, 5).map((ponto, i) => (
                        <div key={i} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-green-900 dark:text-green-100 text-sm">
                              {ponto.area}
                            </span>
                            <span className="text-green-600 font-bold">{ponto.percentual_acerto}%</span>
                          </div>
                          <div className="text-xs text-green-700 dark:text-green-300">
                            {ponto.recomendacao}
                          </div>
                        </div>
                      ))}
                      {analiseData.pontos_fortes.length === 0 && (
                        <p className="text-sm text-gray-500">Responda mais questões para identificar seus pontos fortes</p>
                      )}
                    </div>
                  </div>

                  {/* Pontos Fracos */}
                  <div>
                    <h4 className="font-medium text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                      <span>🎯</span> Pontos a Melhorar
                    </h4>
                    <div className="space-y-2">
                      {analiseData.pontos_fracos.slice(0, 5).map((ponto, i) => (
                        <div key={i} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-red-900 dark:text-red-100 text-sm">
                              {ponto.area}
                            </span>
                            <span className="text-red-600 font-bold">{ponto.percentual_acerto}%</span>
                          </div>
                          <div className="text-xs text-red-700 dark:text-red-300">
                            {ponto.recomendacao}
                          </div>
                        </div>
                      ))}
                      {analiseData.pontos_fracos.length === 0 && (
                        <p className="text-sm text-gray-500">Nenhum ponto fraco significativo identificado</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Análise por Dificuldade */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Desempenho por Dificuldade</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {analiseData.analise_por_dificuldade.map(dif => (
                      <div key={dif.dificuldade} className="text-center">
                        <div className={`text-3xl font-bold ${
                          dif.percentual >= 70 ? 'text-green-600' :
                          dif.percentual >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {dif.percentual}%
                        </div>
                        <div className="text-sm text-gray-500 capitalize">{dif.dificuldade}</div>
                        <div className="text-xs text-gray-400">{dif.acertos}/{dif.total}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Padrões Identificados */}
                {analiseData.padroes_identificados.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                      <span>🔍</span> Padrões Identificados
                    </h4>
                    <ul className="space-y-2">
                      {analiseData.padroes_identificados.map((padrao, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
                          <span>•</span>
                          {padrao}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Plano de Estudo */}
                {analiseData.plano_estudo_sugerido.length > 0 && (
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span>📋</span> Plano de Estudo Sugerido
                    </h4>
                    <div className="space-y-3">
                      {analiseData.plano_estudo_sugerido.map((item, i) => (
                        <div key={i} className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 font-bold">
                            {item.prioridade}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{item.area}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{item.acao}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              ⏱️ {item.tempo_sugerido}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhuma análise disponível</p>
                <button
                  onClick={carregarAnalise}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Gerar Análise
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
