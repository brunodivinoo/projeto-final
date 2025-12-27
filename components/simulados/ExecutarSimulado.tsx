'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSimulados, Simulado, SimuladoQuestao, RespostaResultado } from '@/hooks/useSimulados'

interface Props {
  simuladoId: string
  onFinalizar: (resultado: { simulado: Simulado; estatisticas: Record<string, unknown> }) => void
  onVoltar: () => void
}

type FilterType = 'todas' | 'respondidas' | 'nao_respondidas' | 'corretas' | 'incorretas' | 'revisao'

export function ExecutarSimulado({ simuladoId, onFinalizar, onVoltar }: Props) {
  const { iniciarSimulado, responderQuestao, marcarRevisao, finalizarSimulado, loading } = useSimulados()

  // Estados principais
  const [simulado, setSimulado] = useState<Simulado | null>(null)
  const [questoes, setQuestoes] = useState<SimuladoQuestao[]>([])
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostas, setRespostas] = useState<Map<string, { resposta: string; resultado?: RespostaResultado }>>(new Map())

  // Estados do cronômetro
  const [tempoRestante, setTempoRestante] = useState<number | null>(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [tempoInicio, setTempoInicio] = useState<number>(Date.now())
  const [tempoQuestaoInicio, setTempoQuestaoInicio] = useState<number>(Date.now())
  const [pausado, setPausado] = useState(false)

  // Estados de UI
  const [showConfirmFinalizar, setShowConfirmFinalizar] = useState(false)
  const [showConfirmSair, setShowConfirmSair] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false)
  const [showNavigator, setShowNavigator] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>('todas')
  const [respondendo, setRespondendo] = useState(false)
  const [tempoAlerta, setTempoAlerta] = useState(false)
  const [showAtalhos, setShowAtalhos] = useState(false)
  const [modoFoco, setModoFoco] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timerDecorridoRef = useRef<NodeJS.Timeout | null>(null)

  // Carregar simulado
  const carregarSimulado = useCallback(async () => {
    const data = await iniciarSimulado(simuladoId)
    if (data) {
      setSimulado(data)
      setQuestoes(data.simulado_questoes || [])
      setTempoInicio(Date.now())
      setTempoQuestaoInicio(Date.now())

      // Configurar tempo limite
      if (data.tempo_limite_minutos) {
        const tempoDecorridoCalc = data.iniciado_em
          ? Math.floor((Date.now() - new Date(data.iniciado_em).getTime()) / 1000)
          : 0
        const tempoTotal = data.tempo_limite_minutos * 60
        setTempoRestante(Math.max(0, tempoTotal - tempoDecorridoCalc))
        setTempoDecorrido(tempoDecorridoCalc)
      }

      // Carregar respostas já dadas
      const respostasMap = new Map<string, { resposta: string; resultado?: RespostaResultado }>()
      data.simulado_questoes?.forEach((sq: SimuladoQuestao) => {
        if (sq.resposta_usuario) {
          respostasMap.set(sq.questao_id, {
            resposta: sq.resposta_usuario,
            resultado: sq.esta_correta !== null && sq.esta_correta !== undefined ? {
              esta_correta: sq.esta_correta,
              resposta_usuario: sq.resposta_usuario,
              resposta_correta: sq.questao?.resposta_correta || ''
            } : undefined
          })
        }
      })
      setRespostas(respostasMap)
    }
  }, [iniciarSimulado, simuladoId])

  useEffect(() => {
    carregarSimulado()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (timerDecorridoRef.current) clearInterval(timerDecorridoRef.current)
    }
  }, [carregarSimulado])

  // Timer de contagem regressiva
  useEffect(() => {
    if (simulado?.tempo_limite_minutos && tempoRestante !== null && tempoRestante > 0 && !pausado) {
      timerRef.current = setInterval(() => {
        setTempoRestante(prev => {
          if (prev !== null && prev <= 1) {
            handleFinalizarAuto()
            return 0
          }
          // Alerta quando faltam 5 minutos
          if (prev !== null && prev === 300) {
            setTempoAlerta(true)
            setTimeout(() => setTempoAlerta(false), 5000)
          }
          return prev !== null ? prev - 1 : null
        })
      }, 1000)

      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulado, tempoRestante, pausado])

  // Timer de tempo decorrido (para simulados sem limite)
  useEffect(() => {
    if (!simulado?.tempo_limite_minutos && !pausado) {
      timerDecorridoRef.current = setInterval(() => {
        setTempoDecorrido(prev => prev + 1)
      }, 1000)

      return () => {
        if (timerDecorridoRef.current) clearInterval(timerDecorridoRef.current)
      }
    }
  }, [simulado, pausado])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Não processar se estiver em um input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          questaoAnterior()
          break
        case 'ArrowRight':
          e.preventDefault()
          proximaQuestao()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          handleMarcarRevisao()
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          e.preventDefault()
          const opcoes = simulado?.modalidade === 'multipla_escolha'
            ? ['A', 'B', 'C', 'D', 'E']
            : ['C', 'E']
          const idx = parseInt(e.key) - 1
          if (idx < opcoes.length && !respostaAtual?.resultado) {
            handleResponder(opcoes[idx])
          }
          break
        case 'c':
        case 'C':
          if (simulado?.modalidade === 'certo_errado' && !respostaAtual?.resultado) {
            e.preventDefault()
            handleResponder('C')
          }
          break
        case 'e':
        case 'E':
          if (simulado?.modalidade === 'certo_errado' && !respostaAtual?.resultado) {
            e.preventDefault()
            handleResponder('E')
          }
          break
        case 'f':
        case 'F':
          e.preventDefault()
          setModoFoco(prev => !prev)
          break
        case 'Escape':
          if (showConfirmFinalizar) setShowConfirmFinalizar(false)
          if (showConfirmSair) setShowConfirmSair(false)
          if (showNavigator) setShowNavigator(false)
          break
        case '?':
          e.preventDefault()
          setShowAtalhos(prev => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulado, respostas, questaoAtual, questoes, showConfirmFinalizar, showConfirmSair, showNavigator])

  const questaoAtualData = questoes[questaoAtual]
  const questaoInfo = questaoAtualData?.questao
  const respostaAtual = questaoInfo ? respostas.get(questaoInfo.id) : undefined

  // Filtrar questões
  const questoesFiltradas = questoes.filter((q) => {
    const resposta = q.questao ? respostas.get(q.questao.id) : undefined
    switch (filterType) {
      case 'respondidas':
        return !!resposta?.resposta
      case 'nao_respondidas':
        return !resposta?.resposta
      case 'corretas':
        return resposta?.resultado?.esta_correta === true
      case 'incorretas':
        return resposta?.resultado?.esta_correta === false
      case 'revisao':
        return q.marcada_revisao
      default:
        return true
    }
  })

  const handleResponder = async (resposta: string) => {
    if (!questaoInfo || respondendo) return

    setRespondendo(true)
    const tempoResposta = Math.floor((Date.now() - tempoQuestaoInicio) / 1000)

    // Atualizar estado local imediatamente
    setRespostas(prev => {
      const novo = new Map(prev)
      novo.set(questaoInfo.id, { resposta })
      return novo
    })

    // Enviar resposta
    const resultado = await responderQuestao(
      simuladoId,
      questaoInfo.id,
      resposta,
      tempoResposta
    )

    if (resultado) {
      setRespostas(prev => {
        const novo = new Map(prev)
        novo.set(questaoInfo.id, { resposta, resultado })
        return novo
      })
      setMostrarExplicacao(true)
    }
    setRespondendo(false)
  }

  const handleMarcarRevisao = async () => {
    if (!questaoInfo) return
    const questao = questoes[questaoAtual]
    const novoValor = !questao.marcada_revisao

    await marcarRevisao(simuladoId, questaoInfo.id, novoValor)

    setQuestoes(prev => prev.map((q, i) =>
      i === questaoAtual ? { ...q, marcada_revisao: novoValor } : q
    ))
  }

  const irParaQuestao = (index: number) => {
    if (index >= 0 && index < questoes.length) {
      setQuestaoAtual(index)
      setTempoQuestaoInicio(Date.now())
      setMostrarExplicacao(false)
    }
  }

  const proximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      irParaQuestao(questaoAtual + 1)
    }
  }

  const questaoAnterior = () => {
    if (questaoAtual > 0) {
      irParaQuestao(questaoAtual - 1)
    }
  }

  const proximaNaoRespondida = () => {
    for (let i = questaoAtual + 1; i < questoes.length; i++) {
      const q = questoes[i]
      const resposta = q.questao ? respostas.get(q.questao.id) : undefined
      if (!resposta?.resposta) {
        irParaQuestao(i)
        return
      }
    }
    // Se não encontrou depois, procura do início
    for (let i = 0; i < questaoAtual; i++) {
      const q = questoes[i]
      const resposta = q.questao ? respostas.get(q.questao.id) : undefined
      if (!resposta?.resposta) {
        irParaQuestao(i)
        return
      }
    }
  }

  const handleFinalizarAuto = async () => {
    setFinalizando(true)
    const tempoTotal = Math.floor((Date.now() - tempoInicio) / 1000)
    const resultado = await finalizarSimulado(simuladoId, tempoTotal)

    if (resultado) {
      onFinalizar(resultado)
    }
    setFinalizando(false)
  }

  const handleFinalizar = async () => {
    setFinalizando(true)
    setShowConfirmFinalizar(false)
    const tempoTotal = Math.floor((Date.now() - tempoInicio) / 1000)
    const resultado = await finalizarSimulado(simuladoId, tempoTotal)

    if (resultado) {
      onFinalizar(resultado)
    }
    setFinalizando(false)
  }

  const handleSair = () => {
    setShowConfirmSair(false)
    onVoltar()
  }

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600)
    const min = Math.floor((segundos % 3600) / 60)
    const seg = segundos % 60

    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`
    }
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`
  }

  // Estatísticas em tempo real
  const questoesRespondidas = Array.from(respostas.values()).filter(r => r.resposta).length
  const questoesCorretas = Array.from(respostas.values()).filter(r => r.resultado?.esta_correta === true).length
  const questoesIncorretas = Array.from(respostas.values()).filter(r => r.resultado?.esta_correta === false).length
  const questoesRevisao = questoes.filter(q => q.marcada_revisao).length
  const progressoPercent = Math.round((questoesRespondidas / questoes.length) * 100)

  if (loading && !simulado) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg className="w-16 h-16 animate-spin mx-auto text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">Carregando simulado...</p>
          <p className="mt-2 text-gray-400 dark:text-gray-500 text-sm">Preparando suas questões</p>
        </div>
      </div>
    )
  }

  if (!simulado || !questaoInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Erro ao carregar simulado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Não foi possível carregar as questões do simulado. Tente novamente.
          </p>
          <button
            onClick={onVoltar}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Voltar aos Simulados
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${modoFoco ? 'modo-foco' : ''}`}>
      {/* Alerta de tempo */}
      {tempoAlerta && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Atenção! Restam apenas 5 minutos!</span>
          </div>
        </div>
      )}

      {/* Header fixo */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Lado esquerdo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmSair(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Sair do simulado"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-semibold text-gray-800 dark:text-white truncate max-w-[150px] sm:max-w-[300px]">
                  {simulado.titulo}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{questoesRespondidas}/{questoes.length}</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="text-green-600 dark:text-green-400">{questoesCorretas}</span>
                  <span className="text-gray-300 dark:text-gray-600">/</span>
                  <span className="text-red-600 dark:text-red-400">{questoesIncorretas}</span>
                </div>
              </div>
            </div>

            {/* Centro - Timer e Progresso */}
            <div className="hidden md:flex items-center gap-4">
              {/* Timer */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
                tempoRestante !== null
                  ? tempoRestante < 60 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' :
                    tempoRestante < 300 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                    tempoRestante < 600 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {tempoRestante !== null ? formatarTempo(tempoRestante) : formatarTempo(tempoDecorrido)}
              </div>

              {/* Barra de progresso */}
              <div className="w-32">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                    style={{ width: `${progressoPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {progressoPercent}% concluído
                </p>
              </div>

              {/* Pausar (só se tiver limite de tempo) */}
              {simulado.tempo_limite_minutos && (
                <button
                  onClick={() => setPausado(!pausado)}
                  className={`p-2 rounded-lg transition-colors ${
                    pausado
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
                  }`}
                  title={pausado ? 'Retomar' : 'Pausar'}
                >
                  {pausado ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {/* Lado direito */}
            <div className="flex items-center gap-2">
              {/* Timer mobile */}
              <div className={`md:hidden px-3 py-1 rounded-lg font-mono text-sm ${
                tempoRestante !== null
                  ? tempoRestante < 300 ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
              }`}>
                {tempoRestante !== null ? formatarTempo(tempoRestante) : formatarTempo(tempoDecorrido)}
              </div>

              {/* Navegador */}
              <button
                onClick={() => setShowNavigator(!showNavigator)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
                title="Navegador de questões"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>

              {/* Modo foco */}
              <button
                onClick={() => setModoFoco(!modoFoco)}
                className={`p-2 rounded-lg transition-colors hidden sm:block ${
                  modoFoco
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
                }`}
                title="Modo foco (F)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>

              {/* Atalhos */}
              <button
                onClick={() => setShowAtalhos(!showAtalhos)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden sm:block"
                title="Atalhos de teclado (?)"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              <button
                onClick={() => setShowConfirmFinalizar(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Área da questão */}
          <div className={`lg:col-span-3 space-y-4 ${modoFoco ? 'lg:col-span-4 max-w-3xl mx-auto' : ''}`}>
            {/* Card da questão */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header da questão */}
              <div className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                      {questaoAtual + 1}
                    </span>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Questão {questaoAtual + 1} de {questoes.length}
                      </p>
                      {questaoInfo.disciplina && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {questaoInfo.disciplina}
                          {questaoInfo.assunto && ` • ${questaoInfo.assunto}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {questaoInfo.dificuldade && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        questaoInfo.dificuldade === 'facil' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        questaoInfo.dificuldade === 'medio' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {questaoInfo.dificuldade === 'facil' ? 'Fácil' :
                         questaoInfo.dificuldade === 'medio' ? 'Médio' : 'Difícil'}
                      </span>
                    )}
                    <button
                      onClick={handleMarcarRevisao}
                      className={`p-2 rounded-lg transition-colors ${
                        questaoAtualData.marcada_revisao
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
                      }`}
                      title="Marcar para revisão (R)"
                    >
                      <svg className="w-5 h-5" fill={questaoAtualData.marcada_revisao ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Enunciado */}
              <div className="p-6">
                <div className="prose dark:prose-invert max-w-none mb-8">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-lg leading-relaxed">
                    {questaoInfo.enunciado}
                  </p>
                </div>

                {/* Alternativas */}
                <div className="space-y-3">
                  {simulado.modalidade === 'multipla_escolha' && questaoInfo.alternativas ? (
                    Object.entries(questaoInfo.alternativas).map(([letra, texto], idx) => {
                      const isSelected = respostaAtual?.resposta === letra
                      const isCorrect = respostaAtual?.resultado?.resposta_correta === letra
                      const isWrong = isSelected && respostaAtual?.resultado && !respostaAtual.resultado.esta_correta

                      return (
                        <button
                          key={letra}
                          onClick={() => !respostaAtual?.resultado && handleResponder(letra)}
                          disabled={!!respostaAtual?.resultado || respondendo}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all group ${
                            respostaAtual?.resultado
                              ? isCorrect
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : isWrong
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                  : 'border-gray-200 dark:border-gray-600 opacity-60'
                              : isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                          } ${respondendo ? 'cursor-wait' : ''}`}
                        >
                          <div className="flex items-start gap-4">
                            <span className={`w-10 h-10 flex items-center justify-center rounded-full font-medium flex-shrink-0 transition-colors ${
                              respostaAtual?.resultado
                                ? isCorrect
                                  ? 'bg-green-500 text-white'
                                  : isWrong
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                : isSelected
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600'
                            }`}>
                              {letra}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300 pt-2">{texto}</span>
                            {!respostaAtual?.resultado && (
                              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                Pressione {idx + 1}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {['C', 'E'].map((opcao) => {
                        const isSelected = respostaAtual?.resposta === opcao
                        const isCorrect = respostaAtual?.resultado?.resposta_correta?.toUpperCase() === opcao
                        const isWrong = isSelected && respostaAtual?.resultado && !respostaAtual.resultado.esta_correta
                        const label = opcao === 'C' ? 'CERTO' : 'ERRADO'

                        return (
                          <button
                            key={opcao}
                            onClick={() => !respostaAtual?.resultado && handleResponder(opcao)}
                            disabled={!!respostaAtual?.resultado || respondendo}
                            className={`py-6 px-8 rounded-xl border-2 font-bold text-xl transition-all ${
                              respostaAtual?.resultado
                                ? isCorrect
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                  : isWrong
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                    : 'border-gray-200 dark:border-gray-600 opacity-60 text-gray-400'
                                : isSelected
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                  : opcao === 'C'
                                    ? 'border-gray-200 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 text-gray-700 dark:text-gray-300'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-700 dark:text-gray-300'
                            } ${respondendo ? 'cursor-wait' : ''}`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              {respostaAtual?.resultado && isCorrect && (
                                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {respostaAtual?.resultado && isWrong && (
                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              {label}
                              <span className="text-xs font-normal text-gray-400">
                                Pressione {opcao}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Feedback e Explicação */}
                {respostaAtual?.resultado && (
                  <div className={`mt-6 p-4 rounded-xl border ${
                    respostaAtual.resultado.esta_correta
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      {respostaAtual.resultado.esta_correta ? (
                        <>
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="font-bold text-green-700 dark:text-green-300 text-lg">Resposta Correta!</span>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-bold text-red-700 dark:text-red-300 text-lg">Resposta Incorreta</span>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              Gabarito: {respostaAtual.resultado.resposta_correta}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {questaoInfo.explicacao && (
                      <div>
                        <button
                          onClick={() => setMostrarExplicacao(!mostrarExplicacao)}
                          className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          <svg className={`w-4 h-4 transition-transform ${mostrarExplicacao ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          {mostrarExplicacao ? 'Ocultar explicação' : 'Ver explicação'}
                        </button>
                        {mostrarExplicacao && (
                          <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                              {questaoInfo.explicacao}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Navegação */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <button
                onClick={questaoAnterior}
                disabled={questaoAtual === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={proximaNaoRespondida}
                  className="px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Próxima não respondida
                </button>
              </div>

              {questaoAtual < questoes.length - 1 ? (
                <button
                  onClick={proximaQuestao}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <span className="hidden sm:inline">Próxima</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmFinalizar(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <span className="hidden sm:inline">Finalizar</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Painel lateral - Navegação por questões */}
          {!modoFoco && (
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Estatísticas rápidas */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-800 dark:text-white mb-3">Progresso</h3>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-2">
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">{questoesRespondidas}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Respondidas</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-2">
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">{questoes.length - questoesRespondidas}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Restantes</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{questoesCorretas}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Corretas</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{questoesIncorretas}</p>
                      <p className="text-xs text-red-600 dark:text-red-400">Incorretas</p>
                    </div>
                  </div>
                </div>

                {/* Navegador de questões */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-800 dark:text-white">Questões</h3>
                    {questoesRevisao > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full">
                        {questoesRevisao} para revisar
                      </span>
                    )}
                  </div>

                  {/* Filtros */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {[
                      { key: 'todas', label: 'Todas' },
                      { key: 'nao_respondidas', label: 'Pendentes' },
                      { key: 'revisao', label: 'Revisão' },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setFilterType(f.key as FilterType)}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                          filterType === f.key
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 max-h-[300px] overflow-y-auto">
                    {questoes.map((q, index) => {
                      const resposta = q.questao ? respostas.get(q.questao.id) : undefined
                      const isRespondida = !!resposta?.resposta
                      const isAtual = index === questaoAtual
                      const marcadaRevisao = q.marcada_revisao

                      // Filtrar
                      if (filterType === 'respondidas' && !isRespondida) return null
                      if (filterType === 'nao_respondidas' && isRespondida) return null
                      if (filterType === 'corretas' && resposta?.resultado?.esta_correta !== true) return null
                      if (filterType === 'incorretas' && resposta?.resultado?.esta_correta !== false) return null
                      if (filterType === 'revisao' && !marcadaRevisao) return null

                      return (
                        <button
                          key={q.id}
                          onClick={() => irParaQuestao(index)}
                          className={`w-full aspect-square flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                            isAtual
                              ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                              : ''
                          } ${
                            isRespondida
                              ? resposta?.resultado?.esta_correta
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : resposta?.resultado?.esta_correta === false
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          } ${marcadaRevisao ? 'ring-2 ring-orange-400' : ''}`}
                        >
                          {index + 1}
                        </button>
                      )
                    })}
                  </div>

                  {/* Legenda */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded" />
                      <span className="text-gray-600 dark:text-gray-400">Não respondida</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/30 rounded" />
                      <span className="text-gray-600 dark:text-gray-400">Aguardando resultado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded" />
                      <span className="text-gray-600 dark:text-gray-400">Correta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 rounded" />
                      <span className="text-gray-600 dark:text-gray-400">Incorreta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded ring-2 ring-orange-400" />
                      <span className="text-gray-600 dark:text-gray-400">Marcada revisão</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Navegador Mobile */}
      {showNavigator && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 lg:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl p-6 w-full max-h-[70vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">Navegação</h3>
              <button
                onClick={() => setShowNavigator(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-4 gap-2 mb-4 text-center text-sm">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                <p className="font-bold">{questoesRespondidas}</p>
                <p className="text-xs text-gray-500">Resp.</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                <p className="font-bold">{questoes.length - questoesRespondidas}</p>
                <p className="text-xs text-gray-500">Rest.</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
                <p className="font-bold text-green-600">{questoesCorretas}</p>
                <p className="text-xs text-green-600">Certas</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
                <p className="font-bold text-red-600">{questoesIncorretas}</p>
                <p className="text-xs text-red-600">Erradas</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: 'todas', label: 'Todas', count: questoes.length },
                { key: 'nao_respondidas', label: 'Pendentes', count: questoes.length - questoesRespondidas },
                { key: 'corretas', label: 'Corretas', count: questoesCorretas },
                { key: 'incorretas', label: 'Incorretas', count: questoesIncorretas },
                { key: 'revisao', label: 'Revisão', count: questoesRevisao },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterType(f.key as FilterType)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filterType === f.key
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* Grid de questões */}
            <div className="grid grid-cols-8 gap-2">
              {questoesFiltradas.map((q) => {
                const index = questoes.indexOf(q)
                const resposta = q.questao ? respostas.get(q.questao.id) : undefined
                const isRespondida = !!resposta?.resposta
                const isAtual = index === questaoAtual
                const marcadaRevisao = q.marcada_revisao

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      irParaQuestao(index)
                      setShowNavigator(false)
                    }}
                    className={`aspect-square flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                      isAtual
                        ? 'ring-2 ring-blue-500'
                        : ''
                    } ${
                      isRespondida
                        ? resposta?.resultado?.esta_correta
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700'
                          : resposta?.resultado?.esta_correta === false
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                    } ${marcadaRevisao ? 'ring-2 ring-orange-400' : ''}`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação finalizar */}
      {showConfirmFinalizar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Finalizar Simulado?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Você respondeu <span className="font-bold">{questoesRespondidas}</span> de <span className="font-bold">{questoes.length}</span> questões.
              </p>
            </div>

            {/* Resumo */}
            <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{questoesCorretas}</p>
                  <p className="text-xs text-gray-500">Corretas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{questoesIncorretas}</p>
                  <p className="text-xs text-gray-500">Incorretas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-500">{questoes.length - questoesRespondidas}</p>
                  <p className="text-xs text-gray-500">Em branco</p>
                </div>
              </div>
            </div>

            {questoesRespondidas < questoes.length && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Você ainda tem <strong>{questoes.length - questoesRespondidas}</strong> questões não respondidas. Questões em branco serão contabilizadas como erros.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmFinalizar(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
              >
                Continuar
              </button>
              <button
                onClick={handleFinalizar}
                disabled={finalizando}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {finalizando ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Finalizando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Finalizar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação sair */}
      {showConfirmSair && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Sair do Simulado?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Seu progresso será salvo e você poderá continuar depois.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Suas respostas já enviadas foram salvas. O tempo continuará correndo se houver limite.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSair(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
              >
                Continuar Simulado
              </button>
              <button
                onClick={handleSair}
                className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de atalhos */}
      {showAtalhos && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Atalhos de Teclado
              </h3>
              <button
                onClick={() => setShowAtalhos(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Questão anterior</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">←</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Próxima questão</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">→</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Selecionar alternativa</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">1</kbd>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">2</kbd>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">3</kbd>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">4</kbd>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">5</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Certo / Errado</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">C</kbd>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">E</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Marcar para revisão</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">R</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Modo foco</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">F</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Ver atalhos</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">?</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Fechar modal</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de pausa */}
      {pausado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <svg className="w-12 h-12 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Simulado Pausado</h3>
            <p className="text-gray-400 mb-6">O cronômetro está parado</p>
            <button
              onClick={() => setPausado(false)}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Continuar
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .modo-foco .lg\\:col-span-1 {
          display: none;
        }
      `}</style>
    </div>
  )
}
