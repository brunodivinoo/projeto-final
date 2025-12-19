'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { useEstatisticas, DesempenhoDisciplina, Atividade } from '@/hooks/useEstatisticas'
import { useXP, NIVEIS_CONFIG, XP_ACOES } from '@/hooks/useXP'
import { useLimits } from '@/hooks/useLimits'
import Link from 'next/link'

type TabDesempenho = 'disciplinas' | 'dificuldade'
type PeriodoAtividade = 'dia' | 'semana' | 'mes' | 'custom'

export default function ProgressoPage() {
  const {
    questoesTotal,
    taxaAcertoGeral,
    horasEstudadas,
    desempenhoDisciplinas,
    desempenhoDificuldade,
    evolucao30Dias,
    atividades,
    loading: loadingEstat,
    filtrarAtividades
  } = useEstatisticas()

  const {
    xpTotal,
    xpHoje,
    nivel,
    nivelInfo,
    proximoNivel,
    progressoNivel,
    xpParaProximoNivel,
    sequenciaDias,
    maiorSequencia,
    multiplicador,
    loading: loadingXP
  } = useXP()

  const { isPro } = useLimits()

  // Estados locais
  const [tabDesempenho, setTabDesempenho] = useState<TabDesempenho>('disciplinas')
  const [disciplinaExpandida, setDisciplinaExpandida] = useState<string | null>(null)
  const [assuntoExpandido, setAssuntoExpandido] = useState<string | null>(null)
  const [periodoAtividade, setPeriodoAtividade] = useState<PeriodoAtividade>('semana')
  const [atividadesFiltradas, setAtividadesFiltradas] = useState<Atividade[]>([])
  const [filtrandoAtividades, setFiltrandoAtividades] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const loading = loadingEstat || loadingXP

  // Filtrar atividades por periodo
  const handleFiltrarAtividades = async (periodo: PeriodoAtividade) => {
    setPeriodoAtividade(periodo)
    setFiltrandoAtividades(true)

    const resultado = await filtrarAtividades(
      periodo,
      periodo === 'custom' ? dataInicio : undefined,
      periodo === 'custom' ? dataFim : undefined
    )

    setAtividadesFiltradas(resultado)
    setFiltrandoAtividades(false)
  }

  // Formatar data para exibicao
  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr)
    const agora = new Date()
    const diffMs = agora.getTime() - data.getTime()
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHoras < 1) return 'Agora'
    if (diffHoras < 24) return `Há ${diffHoras}h`
    if (diffDias === 1) return 'Ontem'
    if (diffDias < 7) return `Há ${diffDias} dias`
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  // Obter cor da barra de progresso baseada na taxa
  const getCorTaxa = (taxa: number): string => {
    if (taxa >= 80) return 'bg-green-500'
    if (taxa >= 60) return 'bg-yellow-500'
    if (taxa >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  // Atividades a mostrar
  const atividadesParaMostrar = atividadesFiltradas.length > 0 ? atividadesFiltradas : atividades

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
        <Header title="Estatísticas" />
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
      <Header title="Estatísticas" />

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            Seu Progresso
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            Acompanhe sua evolução e conquistas na plataforma.
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500">quiz</span>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Questões</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{questoesTotal.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">Total respondidas</p>
          </div>

          <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-500">check_circle</span>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Taxa de Acerto</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{taxaAcertoGeral}%</p>
            <p className="text-sm text-slate-500 mt-1">Média geral</p>
          </div>

          <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-500">assignment</span>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Simulados</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">0</p>
            <p className="text-sm text-slate-500 mt-1">Realizados</p>
          </div>

          <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-500">schedule</span>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tempo</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{horasEstudadas}h</p>
            <p className="text-sm text-slate-500 mt-1">Estudadas</p>
          </div>
        </div>

        {/* Grafico de Evolucao */}
        <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">trending_up</span>
              Gráfico de Evolução
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">Últimos 30 dias</span>
          </div>

          {/* Mini legenda */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-slate-500">Questões/dia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-slate-500">Taxa de acerto</span>
            </div>
          </div>

          {/* Grafico de barras */}
          <div className="h-48 flex items-end gap-1 overflow-x-auto pb-2">
            {evolucao30Dias.map((dia, index) => {
              const maxQuestoes = Math.max(...evolucao30Dias.map(d => d.questoes), 1)
              const altura = (dia.questoes / maxQuestoes) * 100

              return (
                <div
                  key={index}
                  className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <p className="font-medium">{new Date(dia.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                    <p>{dia.questoes} questões</p>
                    <p>{dia.taxa}% acerto</p>
                  </div>

                  {/* Barra */}
                  <div className="w-full h-40 flex items-end">
                    <div
                      className={`w-full rounded-t transition-all ${
                        index === evolucao30Dias.length - 1
                          ? 'bg-primary'
                          : 'bg-blue-200 dark:bg-blue-900/50 hover:bg-blue-300 dark:hover:bg-blue-800/50'
                      }`}
                      style={{ height: `${Math.max(altura, 5)}%` }}
                    />
                  </div>

                  {/* Label - mostrar apenas alguns dias */}
                  {(index % 5 === 0 || index === evolucao30Dias.length - 1) && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(dia.data).toLocaleDateString('pt-BR', { day: '2-digit' })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Grid: Desempenho por Area e por Dificuldade */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Desempenho por Disciplina/Assunto/Subassunto */}
          <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                Desempenho por Área
              </h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTabDesempenho('disciplinas')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tabDesempenho === 'disciplinas'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Disciplinas
              </button>
              <button
                onClick={() => setTabDesempenho('dificuldade')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tabDesempenho === 'dificuldade'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Dificuldade
              </button>
            </div>

            {/* Conteudo das tabs */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {tabDesempenho === 'disciplinas' ? (
                desempenhoDisciplinas.map((disc) => (
                  <DisciplinaItem
                    key={disc.disciplina}
                    disciplina={disc}
                    expandida={disciplinaExpandida === disc.disciplina}
                    assuntoExpandido={assuntoExpandido}
                    onToggle={() => setDisciplinaExpandida(
                      disciplinaExpandida === disc.disciplina ? null : disc.disciplina
                    )}
                    onToggleAssunto={(assunto) => setAssuntoExpandido(
                      assuntoExpandido === assunto ? null : assunto
                    )}
                    getCorTaxa={getCorTaxa}
                  />
                ))
              ) : (
                desempenhoDificuldade.map((dif) => (
                  <div
                    key={dif.dificuldade}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900 dark:text-white">{dif.dificuldade}</span>
                      <span className={`text-sm font-bold ${
                        dif.taxa >= 70 ? 'text-green-500' : dif.taxa >= 50 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {dif.taxa}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getCorTaxa(dif.taxa)}`}
                        style={{ width: `${dif.taxa}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {dif.acertos} de {dif.total} questões
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Historico de Atividades */}
          <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Histórico de Atividades
              </h2>
            </div>

            {/* Filtros de periodo */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(['dia', 'semana', 'mes'] as PeriodoAtividade[]).map((periodo) => (
                <button
                  key={periodo}
                  onClick={() => handleFiltrarAtividades(periodo)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    periodoAtividade === periodo
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {periodo === 'dia' ? 'Hoje' : periodo === 'semana' ? 'Semana' : 'Mês'}
                </button>
              ))}
              <button
                onClick={() => setPeriodoAtividade('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  periodoAtividade === 'custom'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Personalizado
              </button>
            </div>

            {/* Campos de data custom */}
            {periodoAtividade === 'custom' && (
              <div className="flex gap-2 mb-4">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => handleFiltrarAtividades('custom')}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                >
                  Filtrar
                </button>
              </div>
            )}

            {/* Lista de atividades */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
              {filtrandoAtividades ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
                </div>
              ) : atividadesParaMostrar.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2 block">event_busy</span>
                  <p>Nenhuma atividade encontrada</p>
                </div>
              ) : (
                atividadesParaMostrar.map((atividade) => (
                  <div
                    key={atividade.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${atividade.cor}20` }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ color: atividade.cor }}
                      >
                        {atividade.icone}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                        {atividade.titulo}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{atividade.descricao}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatarData(atividade.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Card de Nivel e XP */}
        <div
          className="relative rounded-2xl p-6 lg:p-8 mb-8 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${nivelInfo.cor}30, ${nivelInfo.cor}10)` }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: nivelInfo.cor }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Icone do nivel */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center relative"
              style={{ backgroundColor: `${nivelInfo.cor}40` }}
            >
              <span
                className="material-symbols-outlined text-6xl"
                style={{ color: nivelInfo.cor }}
              >
                {nivelInfo.icone}
              </span>
              <span
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full text-lg font-bold flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: nivelInfo.cor }}
              >
                {nivel}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Nível {nivel}</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{nivelInfo.nome}</h2>
              <p className="text-2xl font-bold mb-4" style={{ color: nivelInfo.cor }}>
                {xpTotal.toLocaleString()} XP
              </p>

              {proximoNivel && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500 dark:text-slate-400">Progresso para Nível {proximoNivel.nivel}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{progressoNivel}%</span>
                  </div>
                  <div className="h-4 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressoNivel}%`, backgroundColor: nivelInfo.cor }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Faltam <span className="font-bold" style={{ color: nivelInfo.cor }}>{xpParaProximoNivel.toLocaleString()} XP</span> para {proximoNivel.nome}
                  </p>
                </div>
              )}
            </div>

            {/* Stats rapidos */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:w-40">
              <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{xpHoje}</p>
                <p className="text-xs text-slate-500">XP Hoje</p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-orange-500">{sequenciaDias}</p>
                <p className="text-xs text-slate-500">Dias Seguidos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid: Multiplicador e Sequencia */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Multiplicador PRO */}
          <div className={`rounded-2xl p-6 border ${
            isPro
              ? 'bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20'
              : 'bg-white dark:bg-[#1c252e] border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isPro ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                <span className={`material-symbols-outlined text-2xl ${isPro ? 'text-primary' : 'text-slate-400'}`}>
                  bolt
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Multiplicador XP</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isPro ? 'Bônus PRO ativo!' : 'Ganhe mais XP com PRO'}
                </p>
              </div>
              <span className={`text-3xl font-black ml-auto ${isPro ? 'text-primary' : 'text-slate-300 dark:text-slate-600'}`}>
                {multiplicador}x
              </span>
            </div>

            {!isPro && (
              <Link
                href="/dashboard/assinatura"
                className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                Ativar Multiplicador 1.5x
              </Link>
            )}

            {isPro && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Você ganha <span className="font-bold text-primary">50% mais XP</span> em todas as ações!
              </p>
            )}
          </div>

          {/* Sequencia de dias */}
          <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-500 text-2xl">local_fire_department</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sequência de Estudos</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Continue estudando todo dia!</p>
              </div>
            </div>

            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <p className="text-4xl font-black text-orange-500">{sequenciaDias}</p>
                <p className="text-sm text-slate-500">Dias atuais</p>
              </div>
              <div className="h-16 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <p className="text-4xl font-black text-slate-900 dark:text-white">{maiorSequencia}</p>
                <p className="text-sm text-slate-500">Recorde</p>
              </div>
            </div>

            {/* Mensagem motivacional */}
            <div className="bg-orange-100 dark:bg-orange-500/20 rounded-xl p-3 mt-2">
              <p className="text-sm text-orange-700 dark:text-orange-300 text-center font-medium">
                Estude 7 dias seguidos para ganhar <span className="font-bold">+100 XP bônus</span>!
              </p>
            </div>
          </div>
        </div>

        {/* Jornada de Niveis */}
        <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">trending_up</span>
            Jornada de Níveis
          </h3>

          <div className="relative">
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-4">
              {NIVEIS_CONFIG.map((n) => {
                const isAtual = n.nivel === nivel
                const isCompleto = n.nivel < nivel
                const isBloqueado = n.nivel > nivel

                return (
                  <div
                    key={n.nivel}
                    className={`relative flex items-center gap-4 p-3 rounded-xl transition-all ${
                      isAtual ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-primary/30' : ''
                    } ${isBloqueado ? 'opacity-50' : ''}`}
                  >
                    <div
                      className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center ${
                        isCompleto ? 'bg-green-500/20' : ''
                      }`}
                      style={{ backgroundColor: isCompleto ? undefined : `${n.cor}20` }}
                    >
                      {isCompleto ? (
                        <span className="material-symbols-outlined text-green-500 text-2xl">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-2xl" style={{ color: n.cor }}>
                          {n.icone}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-white">
                          Nível {n.nivel} - {n.nome}
                        </p>
                        {isAtual && (
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            Atual
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {n.xpMin.toLocaleString()} - {n.xpMax === 999999 ? '∞' : n.xpMax.toLocaleString()} XP
                      </p>
                    </div>

                    {isCompleto && <span className="text-xs font-bold text-green-500">Completo</span>}
                    {isBloqueado && <span className="material-symbols-outlined text-slate-400">lock</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Como ganhar XP */}
        <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lightbulb</span>
            Como Ganhar XP
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { acao: 'questao_correta', nome: 'Acertar questão', icone: 'check_circle', cor: '#22c55e' },
              { acao: 'questao_errada', nome: 'Tentar questão', icone: 'cancel', cor: '#ef4444' },
              { acao: 'simulado_completo', nome: 'Completar simulado', icone: 'assignment', cor: '#3b82f6' },
              { acao: 'resumo_criado', nome: 'Criar resumo', icone: 'summarize', cor: '#a855f7' },
              { acao: 'flashcard_revisado', nome: 'Revisar flashcard', icone: 'style', cor: '#14b8a6' },
              { acao: 'flashcard_criado', nome: 'Criar flashcard', icone: 'add_card', cor: '#0ea5e9' },
              { acao: 'chat_mensagem', nome: 'Chat IA', icone: 'chat', cor: '#10b981' },
              { acao: 'pdf_analisado', nome: 'Analisar PDF', icone: 'picture_as_pdf', cor: '#f59e0b' },
              { acao: 'login_diario', nome: 'Login diário', icone: 'login', cor: '#6366f1' },
            ].map((item) => (
              <div
                key={item.acao}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${item.cor}20` }}
                >
                  <span className="material-symbols-outlined" style={{ color: item.cor }}>
                    {item.icone}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{item.nome}</p>
                </div>
                <span className="text-sm font-bold text-green-500">
                  +{XP_ACOES[item.acao as keyof typeof XP_ACOES]}
                </span>
              </div>
            ))}
          </div>

          {!isPro && (
            <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Com o <span className="font-bold text-primary">Estuda PRO</span>, todos esses valores são multiplicados por <span className="font-bold text-primary">1.5x</span>!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente para item de disciplina com expansao
function DisciplinaItem({
  disciplina,
  expandida,
  assuntoExpandido,
  onToggle,
  onToggleAssunto,
  getCorTaxa
}: {
  disciplina: DesempenhoDisciplina
  expandida: boolean
  assuntoExpandido: string | null
  onToggle: () => void
  onToggleAssunto: (assunto: string) => void
  getCorTaxa: (taxa: number) => string
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden">
      {/* Header da disciplina */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-slate-900 dark:text-white">{disciplina.disciplina}</span>
            {disciplina.assuntos.length > 0 && (
              <span className="material-symbols-outlined text-slate-400 text-sm">
                {expandida ? 'expand_less' : 'expand_more'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getCorTaxa(disciplina.taxa)}`}
                style={{ width: `${disciplina.taxa}%` }}
              />
            </div>
            <span className={`text-sm font-bold min-w-[40px] text-right ${
              disciplina.taxa >= 70 ? 'text-green-500' : disciplina.taxa >= 50 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {disciplina.taxa}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {disciplina.acertos} de {disciplina.total} questões
          </p>
        </div>
      </button>

      {/* Assuntos expandidos */}
      {expandida && disciplina.assuntos.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/30">
          {disciplina.assuntos.map((assunto) => (
            <div key={assunto.assunto}>
              {/* Header do assunto */}
              <button
                onClick={() => onToggleAssunto(assunto.assunto)}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{assunto.assunto}</span>
                    {assunto.subassuntos.length > 0 && (
                      <span className="material-symbols-outlined text-slate-400 text-xs">
                        {assuntoExpandido === assunto.assunto ? 'expand_less' : 'expand_more'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getCorTaxa(assunto.taxa)}`}
                        style={{ width: `${assunto.taxa}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{assunto.taxa}%</span>
                  </div>
                </div>
              </button>

              {/* Subassuntos expandidos */}
              {assuntoExpandido === assunto.assunto && assunto.subassuntos.length > 0 && (
                <div className="bg-slate-200/30 dark:bg-slate-900/50 px-8 py-2">
                  {assunto.subassuntos.map((sub) => (
                    <div key={sub.subassunto} className="py-2 flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-slate-400">{sub.subassunto}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1 bg-slate-300 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getCorTaxa(sub.taxa)}`}
                            style={{ width: `${sub.taxa}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500">{sub.taxa}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
