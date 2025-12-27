'use client'
import { useState, useMemo } from 'react'
import { Simulado } from '@/hooks/useSimulados'

interface Props {
  simulado: Simulado
  estatisticas?: Record<string, unknown>
  onVoltar: () => void
  onRefazer?: () => void
}

type TabType = 'resumo' | 'questoes' | 'analise'
type FiltroQuestoes = 'todas' | 'corretas' | 'incorretas' | 'branco'

interface DesempenhoPorArea {
  nome: string
  total: number
  acertos: number
  erros: number
  percentual: number
  tempos?: number[]
}

export function ResultadoSimulado({ simulado, estatisticas, onVoltar, onRefazer }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('resumo')
  const [filtroQuestoes, setFiltroQuestoes] = useState<FiltroQuestoes>('todas')
  const [questaoExpandida, setQuestaoExpandida] = useState<string | null>(null)
  const [showCompartilhar, setShowCompartilhar] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [ordenarPor, setOrdenarPor] = useState<'ordem' | 'dificuldade' | 'tempo'>('ordem')

  // Dados básicos
  const pontuacao = simulado.pontuacao || 0
  const acertos = simulado.acertos || 0
  const erros = simulado.erros || 0
  const total = simulado.quantidade_questoes || 0
  const naoRespondidas = total - acertos - erros

  const tempoGasto = simulado.tempo_gasto_segundos || 0
  const tempoMedioPorQuestao = total > 0 ? Math.round(tempoGasto / total) : 0

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600)
    const min = Math.floor((segundos % 3600) / 60)
    const seg = segundos % 60

    if (horas > 0) {
      return `${horas}h ${min}min ${seg}s`
    } else if (min > 0) {
      return `${min}min ${seg}s`
    }
    return `${seg}s`
  }

  // Determinar performance
  const performance = pontuacao >= 80 ? 'excelente' :
                      pontuacao >= 60 ? 'bom' :
                      pontuacao >= 40 ? 'regular' : 'baixo'

  const performanceConfig = {
    excelente: {
      cor: 'text-green-600 dark:text-green-400',
      bg: 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30',
      ringColor: 'ring-green-500',
      texto: 'Excelente!',
      subtexto: 'Continue assim, você está no caminho certo!',
      icon: (
        <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    bom: {
      cor: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30',
      ringColor: 'ring-blue-500',
      texto: 'Bom trabalho!',
      subtexto: 'Você está progredindo bem!',
      icon: (
        <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      )
    },
    regular: {
      cor: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30',
      ringColor: 'ring-yellow-500',
      texto: 'Continue praticando!',
      subtexto: 'Com mais prática, você vai melhorar!',
      icon: (
        <svg className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    baixo: {
      cor: 'text-red-600 dark:text-red-400',
      bg: 'bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30',
      ringColor: 'ring-red-500',
      texto: 'Não desista!',
      subtexto: 'Todo expert já foi iniciante. Continue estudando!',
      icon: (
        <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  }

  const config = performanceConfig[performance]

  // Dados de desempenho
  const desempenhoDisciplinas = (estatisticas?.desempenho_por_disciplina as DesempenhoPorArea[]) || []
  const desempenhoAssuntos = (estatisticas?.desempenho_por_assunto as DesempenhoPorArea[]) || []
  const pontosFortes = (estatisticas?.pontos_fortes as string[]) || []
  const pontosFracos = (estatisticas?.pontos_fracos as string[]) || []

  // Filtrar e ordenar questões
  const questoesFiltradas = useMemo(() => {
    if (!simulado.simulado_questoes) return []

    let questoes = [...simulado.simulado_questoes]

    // Aplicar filtro
    switch (filtroQuestoes) {
      case 'corretas':
        questoes = questoes.filter(q => q.esta_correta === true)
        break
      case 'incorretas':
        questoes = questoes.filter(q => q.esta_correta === false)
        break
      case 'branco':
        questoes = questoes.filter(q => !q.resposta_usuario)
        break
    }

    // Aplicar ordenação
    switch (ordenarPor) {
      case 'dificuldade':
        const ordemDificuldade = { 'dificil': 0, 'medio': 1, 'facil': 2 }
        questoes.sort((a, b) => {
          const dA = ordemDificuldade[a.questao?.dificuldade as keyof typeof ordemDificuldade] ?? 3
          const dB = ordemDificuldade[b.questao?.dificuldade as keyof typeof ordemDificuldade] ?? 3
          return dA - dB
        })
        break
      case 'tempo':
        questoes.sort((a, b) => (b.tempo_resposta_segundos || 0) - (a.tempo_resposta_segundos || 0))
        break
      default:
        questoes.sort((a, b) => a.ordem - b.ordem)
    }

    return questoes
  }, [simulado.simulado_questoes, filtroQuestoes, ordenarPor])

  // Gerar texto para compartilhar
  const textoCompartilhar = `
Acabei de fazer um simulado e acertei ${pontuacao.toFixed(1)}%!
${acertos} acertos de ${total} questões
Tempo: ${formatarTempo(tempoGasto)}

#EstudoConquista #Simulados
  `.trim()

  const copiarResultado = () => {
    navigator.clipboard.writeText(textoCompartilhar)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // Calcular estatísticas adicionais
  const questoesMaisDemoradas = useMemo(() => {
    if (!simulado.simulado_questoes) return []
    return [...simulado.simulado_questoes]
      .filter(q => q.tempo_resposta_segundos)
      .sort((a, b) => (b.tempo_resposta_segundos || 0) - (a.tempo_resposta_segundos || 0))
      .slice(0, 3)
  }, [simulado.simulado_questoes])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header fixo */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onVoltar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-semibold text-gray-800 dark:text-white truncate max-w-[200px] sm:max-w-none">
                  Resultado do Simulado
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px] sm:max-w-none">
                  {simulado.titulo}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCompartilhar(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Compartilhar"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              {onRefazer && (
                <button
                  onClick={onRefazer}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Novo Simulado
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Card de Pontuação Principal */}
        <div className={`${config.bg} rounded-2xl p-6 sm:p-8 mb-6 shadow-sm`}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Círculo de Pontuação */}
            <div className="relative">
              <svg className="w-36 h-36 sm:w-44 sm:h-44 transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${pontuacao * 2.83} 283`}
                  strokeLinecap="round"
                  className={config.cor}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl sm:text-5xl font-bold ${config.cor}`}>
                  {pontuacao.toFixed(0)}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {acertos}/{total}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                {config.icon}
                <h2 className={`text-2xl sm:text-3xl font-bold ${config.cor}`}>
                  {config.texto}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {config.subtexto}
              </p>

              {/* Stats rápidos */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{acertos}</p>
                  <p className="text-xs text-gray-500">Corretas</p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{erros}</p>
                  <p className="text-xs text-gray-500">Incorretas</p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{formatarTempo(tempoGasto)}</p>
                  <p className="text-xs text-gray-500">Tempo Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {[
            { key: 'resumo', label: 'Resumo', icon: '📊' },
            { key: 'questoes', label: 'Questões', icon: '📝' },
            { key: 'analise', label: 'Análise', icon: '📈' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span className="hidden sm:inline mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Resumo */}
        {activeTab === 'resumo' && (
          <div className="space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Tempo Médio</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {formatarTempo(tempoMedioPorQuestao)}
                </p>
                <p className="text-xs text-gray-400">por questão</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Taxa Acerto</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {total > 0 ? ((acertos / total) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-gray-400">{acertos} de {total}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Disciplinas</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {desempenhoDisciplinas.length}
                </p>
                <p className="text-xs text-gray-400">abordadas</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Em Branco</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {naoRespondidas}
                </p>
                <p className="text-xs text-gray-400">questões</p>
              </div>
            </div>

            {/* Pontos Fortes e Fracos */}
            {(pontosFortes.length > 0 || pontosFracos.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pontosFortes.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Pontos Fortes
                    </h3>
                    <ul className="space-y-3">
                      {pontosFortes.map((ponto, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">{ponto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {pontosFracos.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Pontos a Melhorar
                    </h3>
                    <ul className="space-y-3">
                      {pontosFracos.map((ponto, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                            </svg>
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">{ponto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Questões mais demoradas */}
            {questoesMaisDemoradas.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Questões que Levaram Mais Tempo
                </h3>
                <div className="space-y-3">
                  {questoesMaisDemoradas.map((q) => (
                    <div key={q.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                      <span className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-sm font-medium text-orange-600">
                        {q.ordem}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {q.questao?.enunciado?.substring(0, 60)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {q.questao?.disciplina}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                          {formatarTempo(q.tempo_resposta_segundos || 0)}
                        </p>
                        {q.esta_correta !== undefined && (
                          <span className={`text-xs ${q.esta_correta ? 'text-green-600' : 'text-red-600'}`}>
                            {q.esta_correta ? 'Correta' : 'Incorreta'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Questões */}
        {activeTab === 'questoes' && (
          <div className="space-y-4">
            {/* Filtros e Ordenação */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2 flex-1">
                {[
                  { key: 'todas', label: `Todas (${simulado.simulado_questoes?.length || 0})` },
                  { key: 'corretas', label: `Corretas (${acertos})`, color: 'text-green-600' },
                  { key: 'incorretas', label: `Incorretas (${erros})`, color: 'text-red-600' },
                  { key: 'branco', label: `Em branco (${naoRespondidas})`, color: 'text-gray-500' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFiltroQuestoes(f.key as FiltroQuestoes)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filtroQuestoes === f.key
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : `bg-gray-100 dark:bg-gray-700 ${f.color || 'text-gray-600 dark:text-gray-400'} hover:bg-gray-200 dark:hover:bg-gray-600`
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value as 'ordem' | 'dificuldade' | 'tempo')}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0"
              >
                <option value="ordem">Ordenar por ordem</option>
                <option value="dificuldade">Ordenar por dificuldade</option>
                <option value="tempo">Ordenar por tempo</option>
              </select>
            </div>

            {/* Lista de Questões */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {questoesFiltradas.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Nenhuma questão encontrada com o filtro selecionado.
                </div>
              ) : (
                questoesFiltradas.map((sq) => (
                  <div key={sq.id} className="p-4">
                    <button
                      onClick={() => setQuestaoExpandida(questaoExpandida === sq.id ? null : sq.id)}
                      className="w-full flex items-center gap-3 text-left"
                    >
                      <span className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium flex-shrink-0 ${
                        sq.esta_correta === true
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : sq.esta_correta === false
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {sq.ordem}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {sq.questao?.enunciado?.substring(0, 150)}...
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {sq.questao?.disciplina && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
                              {sq.questao.disciplina}
                            </span>
                          )}
                          {sq.questao?.dificuldade && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              sq.questao.dificuldade === 'facil' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                              sq.questao.dificuldade === 'medio' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                              'bg-red-100 dark:bg-red-900/30 text-red-600'
                            }`}>
                              {sq.questao.dificuldade === 'facil' ? 'Fácil' :
                               sq.questao.dificuldade === 'medio' ? 'Médio' : 'Difícil'}
                            </span>
                          )}
                          {sq.tempo_resposta_segundos && (
                            <span className="text-xs text-gray-400">
                              {formatarTempo(sq.tempo_resposta_segundos)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sq.esta_correta === true && (
                          <span className="text-green-600 dark:text-green-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                        {sq.esta_correta === false && (
                          <span className="text-red-600 dark:text-red-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </span>
                        )}
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${questaoExpandida === sq.id ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Questão expandida */}
                    {questaoExpandida === sq.id && sq.questao && (
                      <div className="mt-4 pl-13 space-y-4">
                        {/* Enunciado completo */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
                          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                            {sq.questao.enunciado}
                          </p>
                        </div>

                        {/* Alternativas */}
                        {sq.questao.alternativas && (
                          <div className="space-y-2">
                            {Object.entries(sq.questao.alternativas).map(([letra, texto]) => {
                              const isCorreta = letra === sq.questao?.resposta_correta
                              const isRespostaUsuario = letra === sq.resposta_usuario
                              const isErrada = isRespostaUsuario && !sq.esta_correta

                              return (
                                <div
                                  key={letra}
                                  className={`p-3 rounded-lg flex items-start gap-3 ${
                                    isCorreta
                                      ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                                      : isErrada
                                        ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                                        : 'bg-gray-50 dark:bg-gray-750'
                                  }`}
                                >
                                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                                    isCorreta
                                      ? 'bg-green-500 text-white'
                                      : isErrada
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                  }`}>
                                    {letra}
                                  </span>
                                  <span className={`pt-1 ${
                                    isCorreta ? 'text-green-700 dark:text-green-300' :
                                    isErrada ? 'text-red-700 dark:text-red-300' :
                                    'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {texto}
                                  </span>
                                  {isCorreta && (
                                    <svg className="w-5 h-5 text-green-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Para certo/errado */}
                        {!sq.questao.alternativas && (
                          <div className="flex gap-3">
                            {['C', 'E'].map((opcao) => {
                              const label = opcao === 'C' ? 'CERTO' : 'ERRADO'
                              const isCorreta = sq.questao?.resposta_correta?.toUpperCase() === opcao
                              const isRespostaUsuario = sq.resposta_usuario?.toUpperCase() === opcao
                              const isErrada = isRespostaUsuario && !sq.esta_correta

                              return (
                                <div
                                  key={opcao}
                                  className={`flex-1 py-3 px-4 rounded-lg text-center font-medium ${
                                    isCorreta
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                                      : isErrada
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {label}
                                  {isCorreta && ' ✓'}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Explicação */}
                        {sq.questao.explicacao && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Explicação
                            </h4>
                            <p className="text-blue-700 dark:text-blue-300 text-sm whitespace-pre-wrap">
                              {sq.questao.explicacao}
                            </p>
                          </div>
                        )}

                        {/* Metadados */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {sq.questao.assunto && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
                              {sq.questao.assunto}
                            </span>
                          )}
                          {sq.questao.subassunto && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
                              {sq.questao.subassunto}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab Análise */}
        {activeTab === 'analise' && (
          <div className="space-y-6">
            {/* Desempenho por Disciplina */}
            {desempenhoDisciplinas.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Desempenho por Disciplina
                </h3>
                <div className="space-y-4">
                  {desempenhoDisciplinas
                    .sort((a, b) => b.percentual - a.percentual)
                    .map((disc, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            disc.percentual >= 70 ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                            disc.percentual >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                            'bg-red-100 dark:bg-red-900/30 text-red-600'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {disc.nome}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {disc.acertos}/{disc.total}
                          </span>
                          <span className={`text-sm font-bold ${
                            disc.percentual >= 70 ? 'text-green-600 dark:text-green-400' :
                            disc.percentual >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {disc.percentual.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            disc.percentual >= 70 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                            disc.percentual >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                            'bg-gradient-to-r from-red-400 to-red-500'
                          }`}
                          style={{ width: `${disc.percentual}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desempenho por Assunto */}
            {desempenhoAssuntos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Desempenho por Assunto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {desempenhoAssuntos
                    .sort((a, b) => b.percentual - a.percentual)
                    .slice(0, 10)
                    .map((assunto, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg flex items-center justify-between ${
                        assunto.percentual >= 70 ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' :
                        assunto.percentual >= 50 ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800' :
                        'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                          {assunto.nome}
                        </p>
                        <p className="text-xs text-gray-500">
                          {assunto.acertos}/{assunto.total} questões
                        </p>
                      </div>
                      <span className={`text-lg font-bold ${
                        assunto.percentual >= 70 ? 'text-green-600' :
                        assunto.percentual >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {assunto.percentual.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Distribuição de Dificuldade */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Desempenho por Dificuldade
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {['facil', 'medio', 'dificil'].map((dif) => {
                  const questoesDif = simulado.simulado_questoes?.filter(q => q.questao?.dificuldade === dif) || []
                  const acertosDif = questoesDif.filter(q => q.esta_correta).length
                  const percentDif = questoesDif.length > 0 ? (acertosDif / questoesDif.length) * 100 : 0

                  return (
                    <div
                      key={dif}
                      className={`p-4 rounded-xl text-center ${
                        dif === 'facil' ? 'bg-green-50 dark:bg-green-900/10' :
                        dif === 'medio' ? 'bg-yellow-50 dark:bg-yellow-900/10' :
                        'bg-red-50 dark:bg-red-900/10'
                      }`}
                    >
                      <p className={`text-sm font-medium mb-1 ${
                        dif === 'facil' ? 'text-green-600' :
                        dif === 'medio' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {dif === 'facil' ? 'Fácil' : dif === 'medio' ? 'Médio' : 'Difícil'}
                      </p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">
                        {percentDif.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {acertosDif}/{questoesDif.length}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Ações Mobile */}
        <div className="sm:hidden mt-6">
          {onRefazer && (
            <button
              onClick={onRefazer}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Criar Novo Simulado
            </button>
          )}
        </div>
      </div>

      {/* Modal de Compartilhar */}
      {showCompartilhar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Compartilhar Resultado
              </h3>
              <button
                onClick={() => setShowCompartilhar(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 mb-4">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {textoCompartilhar}
              </pre>
            </div>

            <button
              onClick={copiarResultado}
              className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                copiado
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copiado ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar Texto
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
