'use client'
import { useState, useEffect } from 'react'
import {
  useSimulados,
  ResultadoPesquisaConcurso,
  DisciplinaEstrutura,
  ItemFilaGeracao
} from '@/hooks/useSimulados'
import { useSimuladoGeracao } from '@/contexts/SimuladoGeracaoContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface Props {
  onSimuladoCriado?: (simuladoId: string) => void
}

interface AssuntoComSelecao {
  nome: string
  peso: number
  subassuntos: string[]
  selecionado: boolean
}

interface DisciplinaComSelecao extends Omit<DisciplinaEstrutura, 'assuntos'> {
  selecionada: boolean
  assuntos: AssuntoComSelecao[]
}

interface PreferenciasSalvas {
  id: string
  nome_preferencia: string
  concurso: string
  disciplinas: DisciplinaComSelecao[]
}

// Disciplinas comuns para adicionar rapidamente
const DISCIPLINAS_COMUNS = [
  'Língua Portuguesa',
  'Raciocínio Lógico',
  'Informática',
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Penal',
  'Direito Processual Penal',
  'Direito Civil',
  'Direito Processual Civil',
  'Direito Tributário',
  'Direito Previdenciário',
  'Legislação Específica',
  'Contabilidade Geral',
  'Administração Pública',
  'Matemática Financeira',
  'Estatística',
  'Economia',
  'AFO (Administração Financeira e Orçamentária)',
  'Auditoria',
  'Gestão de Pessoas',
  'Ética no Serviço Público',
  'Atualidades',
  'Inglês',
  'Espanhol',
  'Redação Oficial'
]

export function GeracaoAvancadaIA({ onSimuladoCriado }: Props) {
  const { user } = useAuth()
  const { loading, pesquisarConcurso, iniciarGeracaoAvancada } = useSimulados()
  const { iniciarGeracao, geracaoAtiva } = useSimuladoGeracao()

  // Estados
  const [etapa, setEtapa] = useState<'pesquisa' | 'selecao' | 'config'>('pesquisa')
  const [queryPesquisa, setQueryPesquisa] = useState('')
  const [resultadoPesquisa, setResultadoPesquisa] = useState<ResultadoPesquisaConcurso | null>(null)
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<DisciplinaComSelecao[]>([])
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set())
  const [erro, setErro] = useState<string | null>(null)

  // Modal de adicionar disciplina/assunto
  const [showAddDisciplina, setShowAddDisciplina] = useState(false)
  const [showAddAssunto, setShowAddAssunto] = useState<number | null>(null)
  const [novaDisciplina, setNovaDisciplina] = useState('')
  const [novoAssunto, setNovoAssunto] = useState('')
  const [novosSubassuntos, setNovosSubassuntos] = useState('')

  // Preferências salvas
  const [preferencias, setPreferencias] = useState<PreferenciasSalvas[]>([])
  const [showSalvarPreferencia, setShowSalvarPreferencia] = useState(false)
  const [nomePreferencia, setNomePreferencia] = useState('')

  // Configurações
  const [titulo, setTitulo] = useState('')
  const [quantidade, setQuantidade] = useState(30)
  const [modalidade, setModalidade] = useState<'multipla_escolha' | 'certo_errado' | 'mista'>('multipla_escolha')
  const [dificuldades, setDificuldades] = useState<string[]>(['media'])
  const [tempoLimite, setTempoLimite] = useState<number | undefined>(undefined)

  // Carregar preferências salvas
  useEffect(() => {
    if (user) {
      carregarPreferencias()
    }
  }, [user])

  const carregarPreferencias = async () => {
    if (!user) return
    const { data } = await supabase
      .from('usuario_preferencias_concurso')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setPreferencias(data as PreferenciasSalvas[])
    }
  }

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
      const disciplinasComSelecao: DisciplinaComSelecao[] = resultado.estrutura.map(d => ({
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

  // Carregar preferência salva
  const carregarPreferenciaSalva = (pref: PreferenciasSalvas) => {
    setDisciplinasSelecionadas(pref.disciplinas)
    setResultadoPesquisa({
      concurso: {
        nome: pref.concurso || pref.nome_preferencia,
        orgao: '',
        banca_provavel: 'CESPE/CEBRASPE',
        ultima_prova: ''
      },
      analise_tendencias: 'Preferência carregada do seu histórico.',
      estrutura: pref.disciplinas
    })
    setTitulo(`Simulado - ${pref.nome_preferencia}`)
    setEtapa('selecao')
  }

  // Salvar preferência atual
  const salvarPreferenciaAtual = async () => {
    if (!user || !nomePreferencia.trim()) return

    await supabase
      .from('usuario_preferencias_concurso')
      .insert({
        user_id: user.id,
        nome_preferencia: nomePreferencia,
        concurso: resultadoPesquisa?.concurso.nome || '',
        disciplinas: disciplinasSelecionadas
      })

    setShowSalvarPreferencia(false)
    setNomePreferencia('')
    carregarPreferencias()
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

  // Adicionar nova disciplina
  const adicionarDisciplina = (nome: string) => {
    if (!nome.trim()) return

    const jaExiste = disciplinasSelecionadas.some(
      d => d.disciplina.toLowerCase() === nome.toLowerCase()
    )
    if (jaExiste) {
      setErro('Esta disciplina já existe na lista')
      return
    }

    const novaDisciplinaObj: DisciplinaComSelecao = {
      disciplina: nome,
      peso_estimado: 5,
      importancia: 'media',
      selecionada: true,
      assuntos: []
    }

    setDisciplinasSelecionadas(prev => [...prev, novaDisciplinaObj])
    setNovaDisciplina('')
    setShowAddDisciplina(false)
    setErro(null)
  }

  // Adicionar várias disciplinas de uma vez
  const adicionarDisciplinasRapido = (nomes: string[]) => {
    const novasDisciplinas: DisciplinaComSelecao[] = []

    nomes.forEach(nome => {
      const jaExiste = disciplinasSelecionadas.some(
        d => d.disciplina.toLowerCase() === nome.toLowerCase()
      )
      if (!jaExiste) {
        novasDisciplinas.push({
          disciplina: nome,
          peso_estimado: 5,
          importancia: 'media',
          selecionada: true,
          assuntos: []
        })
      }
    })

    if (novasDisciplinas.length > 0) {
      setDisciplinasSelecionadas(prev => [...prev, ...novasDisciplinas])
    }
    setShowAddDisciplina(false)
  }

  // Adicionar assunto a uma disciplina
  const adicionarAssunto = (discIndex: number) => {
    if (!novoAssunto.trim()) return

    const subassuntosList = novosSubassuntos
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    setDisciplinasSelecionadas(prev => {
      const novas = [...prev]
      novas[discIndex] = {
        ...novas[discIndex],
        assuntos: [
          ...novas[discIndex].assuntos,
          {
            nome: novoAssunto,
            peso: 5,
            subassuntos: subassuntosList,
            selecionado: true
          }
        ]
      }
      return novas
    })

    setNovoAssunto('')
    setNovosSubassuntos('')
    setShowAddAssunto(null)
  }

  // Remover disciplina
  const removerDisciplina = (index: number) => {
    setDisciplinasSelecionadas(prev => prev.filter((_, i) => i !== index))
  }

  // Remover assunto
  const removerAssunto = (discIndex: number, assuntoIndex: number) => {
    setDisciplinasSelecionadas(prev => {
      const novas = [...prev]
      novas[discIndex] = {
        ...novas[discIndex],
        assuntos: novas[discIndex].assuntos.filter((_, i) => i !== assuntoIndex)
      }
      return novas
    })
  }

  // Toggle dificuldade
  const toggleDificuldade = (dif: string) => {
    setDificuldades(prev => {
      if (prev.includes(dif)) {
        if (prev.length === 1) return prev
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

    const itens: ItemFilaGeracao[] = []
    const banca = resultadoPesquisa?.concurso.banca_provavel || 'CESPE/CEBRASPE'

    selecionadas.forEach(disc => {
      const assuntosSelecionados = disc.assuntos.filter(a => a.selecionado)

      if (assuntosSelecionados.length === 0) {
        itens.push({
          disciplina: disc.disciplina,
          banca,
          modalidade,
          dificuldade: dificuldades[0]
        })
      } else {
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
      iniciarGeracao(resultado.simulado_id, titulo, resultado.total)
      onSimuladoCriado?.(resultado.simulado_id)

      setEtapa('pesquisa')
      setQueryPesquisa('')
      setResultadoPesquisa(null)
      setDisciplinasSelecionadas([])
    } else {
      setErro('Erro ao iniciar geração. Tente novamente.')
    }
  }

  // Se já tem geração ativa
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
        <div className="space-y-4">
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
              A IA irá pesquisar TODAS as disciplinas e conteúdos cobrados neste concurso.
            </p>
          </div>

          {/* Preferências salvas */}
          {preferencias.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                Suas preferências salvas
              </h4>
              <div className="flex flex-wrap gap-2">
                {preferencias.map(pref => (
                  <button
                    key={pref.id}
                    onClick={() => carregarPreferenciaSalva(pref)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg text-sm transition-colors"
                  >
                    {pref.nome_preferencia}
                  </button>
                ))}
              </div>
            </div>
          )}
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
              {resultadoPesquisa.concurso.ultima_prova && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  Última prova: {resultadoPesquisa.concurso.ultima_prova}
                </span>
              )}
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
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Disciplinas e Conteúdos ({disciplinasSelecionadas.length})
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Selecione, adicione ou remova disciplinas
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSalvarPreferencia(true)}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  Salvar para depois
                </button>
                <button
                  onClick={() => setShowAddDisciplina(true)}
                  className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar
                </button>
              </div>
            </div>

            {/* Modal de adicionar disciplina */}
            {showAddDisciplina && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                <h5 className="font-medium text-gray-800 dark:text-white mb-3">Adicionar Disciplinas</h5>

                {/* Adição rápida */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Clique para adicionar rapidamente:</p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {DISCIPLINAS_COMUNS.filter(
                      d => !disciplinasSelecionadas.some(ds => ds.disciplina.toLowerCase() === d.toLowerCase())
                    ).map(disc => (
                      <button
                        key={disc}
                        onClick={() => adicionarDisciplina(disc)}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                      >
                        + {disc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Adição personalizada */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novaDisciplina}
                    onChange={(e) => setNovaDisciplina(e.target.value)}
                    placeholder="Ou digite uma disciplina personalizada..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    onKeyDown={(e) => e.key === 'Enter' && adicionarDisciplina(novaDisciplina)}
                  />
                  <button
                    onClick={() => adicionarDisciplina(novaDisciplina)}
                    disabled={!novaDisciplina.trim()}
                    className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setShowAddDisciplina(false)}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    Fechar
                  </button>
                </div>

                {/* Adicionar todas de uma vez */}
                <button
                  onClick={() => adicionarDisciplinasRapido(DISCIPLINAS_COMUNS.filter(
                    d => !disciplinasSelecionadas.some(ds => ds.disciplina.toLowerCase() === d.toLowerCase())
                  ))}
                  className="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Adicionar todas as disciplinas comuns de uma vez
                </button>
              </div>
            )}

            {/* Modal de salvar preferência */}
            {showSalvarPreferencia && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700">
                <h5 className="font-medium text-gray-800 dark:text-white mb-3">Salvar Preferência</h5>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nomePreferencia}
                    onChange={(e) => setNomePreferencia(e.target.value)}
                    placeholder="Nome para esta configuração (ex: Auditor Federal)"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                  <button
                    onClick={salvarPreferenciaAtual}
                    disabled={!nomePreferencia.trim()}
                    className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setShowSalvarPreferencia(false)}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
              {disciplinasSelecionadas.map((disc, discIndex) => (
                <div key={`${disc.disciplina}-${discIndex}`} className="p-4">
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
                            {disc.importancia === 'alta' ? 'Alta' :
                             disc.importancia === 'media' ? 'Média' : 'Baixa'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {disc.assuntos.length} assuntos
                          </span>
                        </div>
                      </div>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowAddAssunto(showAddAssunto === discIndex ? null : discIndex)}
                        className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                        title="Adicionar assunto"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removerDisciplina(discIndex)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Remover disciplina"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
                  </div>

                  {/* Form adicionar assunto */}
                  {showAddAssunto === discIndex && (
                    <div className="mt-3 ml-8 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={novoAssunto}
                          onChange={(e) => setNovoAssunto(e.target.value)}
                          placeholder="Nome do assunto"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        />
                        <input
                          type="text"
                          value={novosSubassuntos}
                          onChange={(e) => setNovosSubassuntos(e.target.value)}
                          placeholder="Subassuntos (separados por vírgula)"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => adicionarAssunto(discIndex)}
                            disabled={!novoAssunto.trim()}
                            className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg"
                          >
                            Adicionar
                          </button>
                          <button
                            onClick={() => setShowAddAssunto(null)}
                            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assuntos expandidos */}
                  {expandidas.has(disc.disciplina) && (
                    <div className="mt-3 ml-8 space-y-2">
                      {disc.assuntos.map((assunto, assuntoIndex) => (
                        <div key={`${assunto.nome}-${assuntoIndex}`} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer flex-1">
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
                            <button
                              onClick={() => removerAssunto(discIndex, assuntoIndex)}
                              className="p-1 text-red-400 hover:text-red-600"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          {assunto.subassuntos.length > 0 && (
                            <div className="mt-2 ml-6 flex flex-wrap gap-1">
                              {assunto.subassuntos.map((sub, subIndex) => (
                                <span
                                  key={`${sub}-${subIndex}`}
                                  className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {disc.assuntos.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          Nenhum assunto. Clique no + para adicionar.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {disciplinasSelecionadas.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma disciplina. Clique em &quot;Adicionar&quot; para começar.
                  </p>
                </div>
              )}
            </div>
          </div>

          {erro && (
            <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
          )}

          {/* Botão próximo */}
          <div className="flex justify-end">
            <button
              onClick={() => setEtapa('config')}
              disabled={disciplinasSelecionadas.filter(d => d.selecionada).length === 0}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
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
                <li>{disciplinasSelecionadas.filter(d => d.selecionada).reduce((acc, d) => acc + d.assuntos.filter(a => a.selecionado).length, 0)} assuntos selecionados</li>
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
