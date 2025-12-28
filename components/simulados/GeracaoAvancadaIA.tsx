'use client'
import { useState } from 'react'
import {
  useSimulados,
  ResultadoPesquisaConcurso,
  DisciplinaEstrutura,
  ItemFilaGeracao
} from '@/hooks/useSimulados'
import { useSimuladoGeracao } from '@/contexts/SimuladoGeracaoContext'

interface Props {
  onSimuladoCriado?: (simuladoId: string) => void
}

export function GeracaoAvancadaIA({ onSimuladoCriado }: Props) {
  const { loading, pesquisarConcurso, iniciarGeracaoAvancada } = useSimulados()
  const { iniciarGeracao, geracaoAtiva } = useSimuladoGeracao()

  // Estados
  const [etapa, setEtapa] = useState<'pesquisa' | 'selecao' | 'config'>('pesquisa')
  const [queryPesquisa, setQueryPesquisa] = useState('')
  const [resultadoPesquisa, setResultadoPesquisa] = useState<ResultadoPesquisaConcurso | null>(null)
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<DisciplinaEstrutura[]>([])
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set())
  const [erro, setErro] = useState<string | null>(null)

  // Configurações
  const [titulo, setTitulo] = useState('')
  const [quantidade, setQuantidade] = useState(30)
  const [modalidade, setModalidade] = useState<'multipla_escolha' | 'certo_errado' | 'mista'>('multipla_escolha')
  const [dificuldades, setDificuldades] = useState<string[]>(['media'])
  const [tempoLimite, setTempoLimite] = useState<number | undefined>(undefined)

  // Pesquisar concurso
  const handlePesquisar = async () => {
    if (!queryPesquisa.trim()) {
      setErro('Digite o cargo ou concurso que deseja')
      return
    }

    setErro(null)
    const resultado = await pesquisarConcurso(queryPesquisa)

    if (resultado) {
      setResultadoPesquisa(resultado)
      // Marcar todas disciplinas como selecionadas por padrão
      const disciplinasComSelecao = resultado.estrutura.map(d => ({
        ...d,
        selecionada: true,
        assuntos: d.assuntos.map(a => ({ ...a, selecionado: true }))
      }))
      setDisciplinasSelecionadas(disciplinasComSelecao)
      setTitulo(`Simulado - ${resultado.concurso.nome}`)
      setEtapa('selecao')
    } else {
      setErro('Não foi possível pesquisar o concurso. Tente novamente.')
    }
  }

  // Toggle disciplina
  const toggleDisciplina = (index: number) => {
    setDisciplinasSelecionadas(prev => {
      const novas = [...prev]
      novas[index] = {
        ...novas[index],
        selecionada: !novas[index].selecionada,
        assuntos: novas[index].assuntos.map(a => ({
          ...a,
          selecionado: !novas[index].selecionada
        }))
      }
      return novas
    })
  }

  // Toggle assunto
  const toggleAssunto = (discIndex: number, assuntoIndex: number) => {
    setDisciplinasSelecionadas(prev => {
      const novas = [...prev]
      novas[discIndex] = {
        ...novas[discIndex],
        assuntos: novas[discIndex].assuntos.map((a, i) =>
          i === assuntoIndex ? { ...a, selecionado: !a.selecionado } : a
        )
      }
      // Se todos assuntos desmarcados, desmarcar disciplina
      const todosAssuntosDesmarcados = novas[discIndex].assuntos.every(a => !a.selecionado)
      novas[discIndex].selecionada = !todosAssuntosDesmarcados
      return novas
    })
  }

  // Expandir/colapsar disciplina
  const toggleExpandida = (disciplina: string) => {
    setExpandidas(prev => {
      const novas = new Set(prev)
      if (novas.has(disciplina)) {
        novas.delete(disciplina)
      } else {
        novas.add(disciplina)
      }
      return novas
    })
  }

  // Toggle dificuldade
  const toggleDificuldade = (dif: string) => {
    setDificuldades(prev => {
      if (prev.includes(dif)) {
        if (prev.length === 1) return prev // Manter pelo menos uma
        return prev.filter(d => d !== dif)
      }
      return [...prev, dif]
    })
  }

  // Iniciar geração
  const handleIniciarGeracao = async () => {
    const selecionadas = disciplinasSelecionadas.filter(d => d.selecionada)
    if (selecionadas.length === 0) {
      setErro('Selecione pelo menos uma disciplina')
      return
    }

    // Montar itens para geração
    const itens: ItemFilaGeracao[] = []
    const banca = resultadoPesquisa?.concurso.banca_provavel || 'CESPE/CEBRASPE'

    selecionadas.forEach(disc => {
      const assuntosSelecionados = disc.assuntos.filter(a => a.selecionado)

      if (assuntosSelecionados.length === 0) {
        // Se nenhum assunto selecionado, adicionar apenas disciplina
        itens.push({
          disciplina: disc.disciplina,
          banca,
          modalidade,
          dificuldade: dificuldades[0]
        })
      } else {
        // Adicionar cada assunto selecionado
        assuntosSelecionados.forEach(assunto => {
          if (assunto.subassuntos.length === 0) {
            itens.push({
              disciplina: disc.disciplina,
              assunto: assunto.nome,
              banca,
              modalidade,
              dificuldade: dificuldades[0]
            })
          } else {
            // Adicionar cada subassunto
            assunto.subassuntos.forEach(sub => {
              itens.push({
                disciplina: disc.disciplina,
                assunto: assunto.nome,
                subassunto: sub,
                banca,
                modalidade,
                dificuldade: dificuldades[0]
              })
            })
          }
        })
      }
    })

    setErro(null)

    const resultado = await iniciarGeracaoAvancada({
      titulo: titulo || `Simulado IA - ${new Date().toLocaleDateString('pt-BR')}`,
      quantidade_questoes: quantidade,
      tempo_limite_minutos: tempoLimite,
      modalidade,
      dificuldades,
      itens
    })

    if (resultado) {
      // Iniciar processamento em background
      iniciarGeracao(resultado.simulado_id, titulo, resultado.total)
      onSimuladoCriado?.(resultado.simulado_id)

      // Resetar estado
      setEtapa('pesquisa')
      setQueryPesquisa('')
      setResultadoPesquisa(null)
      setDisciplinasSelecionadas([])
    } else {
      setErro('Erro ao iniciar geração. Tente novamente.')
    }
  }

  // Se já tem geração ativa, mostrar aviso
  if (geracaoAtiva && !geracaoAtiva.pausado) {
    return (
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 text-center">
        <svg className="w-12 h-12 mx-auto text-purple-500 mb-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
          Geração em Andamento
        </h3>
        <p className="text-purple-600 dark:text-purple-300">
          Aguarde a conclusão do simulado atual antes de criar outro.
        </p>
        <p className="text-sm text-purple-500 dark:text-purple-400 mt-2">
          {geracaoAtiva.geradas}/{geracaoAtiva.total} questões geradas
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold">Geração Inteligente com IA</h2>
            <p className="text-white/80 text-sm">
              Pesquise seu concurso e gere simulados personalizados
            </p>
          </div>
        </div>
      </div>

      {/* Etapa 1: Pesquisa */}
      {etapa === 'pesquisa' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Qual concurso ou cargo você está estudando?
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={queryPesquisa}
              onChange={(e) => setQueryPesquisa(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePesquisar()}
              placeholder="Ex: Auditor Fiscal da Receita Federal, Analista TRT, ENEM..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handlePesquisar}
              disabled={loading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Pesquisando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Pesquisar
                </>
              )}
            </button>
          </div>
          {erro && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{erro}</p>
          )}
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            A IA irá pesquisar as disciplinas e conteúdos mais cobrados neste concurso.
          </p>
        </div>
      )}

      {/* Etapa 2: Seleção de disciplinas */}
      {etapa === 'selecao' && resultadoPesquisa && (
        <div className="space-y-4">
          {/* Info do concurso */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {resultadoPesquisa.concurso.nome}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {resultadoPesquisa.concurso.orgao}
                </p>
              </div>
              <button
                onClick={() => setEtapa('pesquisa')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                Nova pesquisa
              </button>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                Banca: {resultadoPesquisa.concurso.banca_provavel}
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                Última prova: {resultadoPesquisa.concurso.ultima_prova}
              </span>
              {resultadoPesquisa.fonte && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  Fonte: {resultadoPesquisa.fonte === 'gemini_web_search' ? 'Pesquisa Web' : 'Base IA'}
                </span>
              )}
            </div>

            {/* Análise de tendências */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
                Ver análise de tendências
              </summary>
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {resultadoPesquisa.analise_tendencias}
              </div>
            </details>
          </div>

          {/* Lista de disciplinas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-800 dark:text-white">
                Disciplinas e Conteúdos
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selecione as disciplinas e assuntos para incluir no simulado
              </p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {disciplinasSelecionadas.map((disc, discIndex) => (
                <div key={disc.disciplina} className="p-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={disc.selecionada}
                        onChange={() => toggleDisciplina(discIndex)}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-800 dark:text-white">
                          {disc.disciplina}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            disc.importancia === 'alta' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                            disc.importancia === 'media' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {disc.importancia === 'alta' ? 'Alta importância' :
                             disc.importancia === 'media' ? 'Média importância' : 'Baixa importância'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {disc.assuntos.length} assuntos
                          </span>
                        </div>
                      </div>
                    </label>
                    <button
                      onClick={() => toggleExpandida(disc.disciplina)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${expandidas.has(disc.disciplina) ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Assuntos expandidos */}
                  {expandidas.has(disc.disciplina) && (
                    <div className="mt-3 ml-8 space-y-2">
                      {disc.assuntos.map((assunto, assuntoIndex) => (
                        <div key={assunto.nome} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={assunto.selecionado}
                              onChange={() => toggleAssunto(discIndex, assuntoIndex)}
                              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {assunto.nome}
                            </span>
                          </label>
                          {assunto.subassuntos.length > 0 && (
                            <div className="mt-2 ml-6 flex flex-wrap gap-1">
                              {assunto.subassuntos.map(sub => (
                                <span
                                  key={sub}
                                  className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botão próximo */}
          <div className="flex justify-end">
            <button
              onClick={() => setEtapa('config')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Próximo: Configurar Simulado
            </button>
          </div>
        </div>
      )}

      {/* Etapa 3: Configurações */}
      {etapa === 'config' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800 dark:text-white">
                Configurar Simulado
              </h4>
              <button
                onClick={() => setEtapa('selecao')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                Voltar
              </button>
            </div>

            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título do Simulado
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Simulado focado em Direito Constitucional"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantidade de Questões
                </label>
                <select
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  {[5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150].map(n => (
                    <option key={n} value={n}>{n} questões</option>
                  ))}
                </select>
              </div>

              {/* Modalidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Modalidade
                </label>
                <select
                  value={modalidade}
                  onChange={(e) => setModalidade(e.target.value as typeof modalidade)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  <option value="multipla_escolha">Múltipla Escolha</option>
                  <option value="certo_errado">Certo ou Errado</option>
                  <option value="mista">Mista</option>
                </select>
              </div>

              {/* Dificuldades */}
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
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        dificuldades.includes(dif.value)
                          ? dif.color === 'green' ? 'bg-green-500 text-white' :
                            dif.color === 'yellow' ? 'bg-yellow-500 text-white' :
                            'bg-red-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {dif.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tempo limite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tempo Limite (opcional)
                </label>
                <select
                  value={tempoLimite || ''}
                  onChange={(e) => setTempoLimite(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  <option value="">Sem limite</option>
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1h 30min</option>
                  <option value="120">2 horas</option>
                  <option value="180">3 horas</option>
                  <option value="240">4 horas</option>
                </select>
              </div>
            </div>

            {erro && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">{erro}</p>
            )}

            {/* Resumo */}
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                Resumo do Simulado
              </h5>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <li>{disciplinasSelecionadas.filter(d => d.selecionada).length} disciplinas selecionadas</li>
                <li>{quantidade} questões serão geradas</li>
                <li>Tempo estimado: ~{Math.ceil(quantidade * 2 / 60)} minutos para gerar</li>
              </ul>
            </div>

            {/* Botão iniciar */}
            <button
              onClick={handleIniciarGeracao}
              disabled={loading}
              className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-purple-400 disabled:to-indigo-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Iniciando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  Gerar Simulado com IA
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
