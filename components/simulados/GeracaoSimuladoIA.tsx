'use client'
import { useState, useEffect } from 'react'
import {
  useSimulados,
  ResultadoPesquisaConcurso,
  DisciplinaEstrutura,
  ItemFilaGeracao,
  Simulado
} from '@/hooks/useSimulados'
import { useSimuladoGeracao } from '@/contexts/SimuladoGeracaoContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCheckLimit } from '@/hooks/useCheckLimit'
import { supabase } from '@/lib/supabase'

interface Props {
  onSimuladoCriado?: (simulado: Simulado) => void
  onVoltar?: () => void
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

// Bancas de concursos mais comuns
const BANCAS_COMUNS = [
  'CESPE/CEBRASPE',
  'FCC',
  'FGV',
  'VUNESP',
  'CESGRANRIO',
  'IBFC',
  'IADES',
  'IDECAN',
  'AOCP',
  'QUADRIX',
  'FUNCAB',
  'CONSULPLAN',
  'FUNDATEC',
  'ESAF'
]

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

// Assuntos comuns por disciplina para sugestões rápidas
const ASSUNTOS_POR_DISCIPLINA: Record<string, string[]> = {
  'Língua Portuguesa': [
    'Interpretação de Texto',
    'Gramática',
    'Morfologia',
    'Sintaxe',
    'Semântica',
    'Pontuação',
    'Concordância Verbal e Nominal',
    'Regência Verbal e Nominal',
    'Crase',
    'Colocação Pronominal',
    'Redação Oficial',
    'Tipologia Textual'
  ],
  'Raciocínio Lógico': [
    'Proposições e Conectivos',
    'Tabelas-Verdade',
    'Equivalências Lógicas',
    'Negação de Proposições',
    'Diagramas Lógicos',
    'Sequências Lógicas',
    'Análise Combinatória',
    'Probabilidade',
    'Conjuntos'
  ],
  'Informática': [
    'Hardware',
    'Software',
    'Sistemas Operacionais',
    'Microsoft Office',
    'LibreOffice',
    'Internet e Navegadores',
    'Segurança da Informação',
    'Redes de Computadores',
    'Banco de Dados',
    'Cloud Computing'
  ],
  'Direito Constitucional': [
    'Princípios Fundamentais',
    'Direitos e Garantias Fundamentais',
    'Direitos Sociais',
    'Nacionalidade',
    'Direitos Políticos',
    'Organização do Estado',
    'Organização dos Poderes',
    'Poder Legislativo',
    'Poder Executivo',
    'Poder Judiciário',
    'Controle de Constitucionalidade',
    'Administração Pública'
  ],
  'Direito Administrativo': [
    'Princípios da Administração Pública',
    'Poderes da Administração',
    'Atos Administrativos',
    'Licitações',
    'Contratos Administrativos',
    'Serviços Públicos',
    'Servidores Públicos',
    'Responsabilidade Civil do Estado',
    'Processo Administrativo',
    'Improbidade Administrativa',
    'Bens Públicos'
  ],
  'Direito Penal': [
    'Princípios do Direito Penal',
    'Aplicação da Lei Penal',
    'Teoria do Crime',
    'Tipicidade',
    'Ilicitude',
    'Culpabilidade',
    'Concurso de Pessoas',
    'Crimes contra a Pessoa',
    'Crimes contra o Patrimônio',
    'Crimes contra a Administração Pública'
  ],
  'Direito Processual Penal': [
    'Princípios Processuais',
    'Inquérito Policial',
    'Ação Penal',
    'Jurisdição e Competência',
    'Prisão e Liberdade Provisória',
    'Provas',
    'Procedimentos',
    'Recursos'
  ],
  'Direito Civil': [
    'Lei de Introdução às Normas',
    'Pessoas Naturais',
    'Pessoas Jurídicas',
    'Bens',
    'Fatos Jurídicos',
    'Negócio Jurídico',
    'Prescrição e Decadência',
    'Obrigações',
    'Contratos',
    'Responsabilidade Civil',
    'Direito das Coisas',
    'Família',
    'Sucessões'
  ],
  'Direito Tributário': [
    'Sistema Tributário Nacional',
    'Competência Tributária',
    'Limitações ao Poder de Tributar',
    'Impostos',
    'Taxas e Contribuições',
    'Obrigação Tributária',
    'Crédito Tributário',
    'Administração Tributária'
  ],
  'Contabilidade Geral': [
    'Patrimônio',
    'Escrituração Contábil',
    'Demonstrações Contábeis',
    'Balanço Patrimonial',
    'DRE',
    'DMPL',
    'DFC',
    'Análise das Demonstrações'
  ],
  'AFO (Administração Financeira e Orçamentária)': [
    'Orçamento Público',
    'PPA, LDO e LOA',
    'Princípios Orçamentários',
    'Receita Pública',
    'Despesa Pública',
    'Créditos Adicionais',
    'LRF',
    'Ciclo Orçamentário'
  ],
  'Administração Pública': [
    'Evolução da Administração Pública',
    'Modelos de Gestão Pública',
    'Governança Pública',
    'Gestão por Resultados',
    'Gestão de Processos',
    'Gestão de Projetos',
    'Planejamento Estratégico'
  ]
}

export function GeracaoSimuladoIA({ onSimuladoCriado, onVoltar }: Props) {
  const { user } = useAuth()
  const { loading, pesquisarConcurso, iniciarGeracaoAvancada } = useSimulados()
  const { iniciarGeracao, geracaoAtiva } = useSimuladoGeracao()
  const { checkLimit } = useCheckLimit()

  // Estados
  const [etapa, setEtapa] = useState<'pesquisa' | 'selecao' | 'config'>('pesquisa')
  const [queryPesquisa, setQueryPesquisa] = useState('')
  const [resultadoPesquisa, setResultadoPesquisa] = useState<ResultadoPesquisaConcurso | null>(null)
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<DisciplinaComSelecao[]>([])
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set())
  const [erro, setErro] = useState<string | null>(null)

  // Limite de simulados
  const [limiteInfo, setLimiteInfo] = useState<{ canUse: boolean; restante: number; limite: number } | null>(null)
  const [loadingLimite, setLoadingLimite] = useState(true)

  // Modal de adicionar disciplina/assunto
  const [showAddDisciplina, setShowAddDisciplina] = useState(false)
  const [showAddAssunto, setShowAddAssunto] = useState<number | null>(null)
  const [novaDisciplina, setNovaDisciplina] = useState('')
  const [novoAssunto, setNovoAssunto] = useState('')
  const [novosSubassuntos, setNovosSubassuntos] = useState('')
  const [feedbackAdd, setFeedbackAdd] = useState<string | null>(null)

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
  const [bancaSelecionada, setBancaSelecionada] = useState<string>('CESPE/CEBRASPE')
  const [bancaPersonalizada, setBancaPersonalizada] = useState('')
  const [showBancaPersonalizada, setShowBancaPersonalizada] = useState(false)

  // Verificar limite de simulados
  useEffect(() => {
    const verificarLimite = async () => {
      setLoadingLimite(true)
      const info = await checkLimit('simulados')
      setLimiteInfo({
        canUse: info.canUse,
        restante: info.restante,
        limite: info.limite
      })
      setLoadingLimite(false)
    }
    verificarLimite()
  }, [checkLimit])

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

  // Adicionar nova disciplina (pode receber múltiplas separadas por vírgula)
  const adicionarDisciplina = (nome: string, manterPainelAberto = true) => {
    if (!nome.trim()) return

    // Suporte para múltiplas disciplinas separadas por vírgula
    const nomes = nome.split(',').map(n => n.trim()).filter(n => n.length > 0)
    let adicionadas = 0

    nomes.forEach(nomeDisc => {
      const jaExiste = disciplinasSelecionadas.some(
        d => d.disciplina.toLowerCase() === nomeDisc.toLowerCase()
      )
      if (jaExiste) return

      const novaDisciplinaObj: DisciplinaComSelecao = {
        disciplina: nomeDisc,
        peso_estimado: 5,
        importancia: 'media',
        selecionada: true,
        assuntos: []
      }

      setDisciplinasSelecionadas(prev => [...prev, novaDisciplinaObj])
      adicionadas++
    })

    setNovaDisciplina('')
    setErro(null)

    // Feedback visual
    if (adicionadas > 0) {
      setFeedbackAdd(`${adicionadas} disciplina${adicionadas > 1 ? 's' : ''} adicionada${adicionadas > 1 ? 's' : ''}!`)
      setTimeout(() => setFeedbackAdd(null), 2000)
    } else if (nomes.length > 0) {
      setErro('Disciplina(s) já existe(m) na lista')
    }

    // NÃO fecha o painel - permite adicionar mais
    if (!manterPainelAberto) {
      setShowAddDisciplina(false)
    }
  }

  // Adicionar assunto a uma disciplina (suporta múltiplos separados por vírgula)
  const adicionarAssunto = (discIndex: number, nomeAssunto?: string, manterAberto = true) => {
    const assuntoParaAdicionar = nomeAssunto || novoAssunto
    if (!assuntoParaAdicionar.trim()) return

    // Suporte para múltiplos assuntos separados por vírgula
    const nomes = assuntoParaAdicionar.split(',').map(n => n.trim()).filter(n => n.length > 0)

    const subassuntosList = novosSubassuntos
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    let adicionados = 0

    setDisciplinasSelecionadas(prev => {
      const novas = [...prev]
      const assuntosExistentes = new Set(
        novas[discIndex].assuntos.map(a => a.nome.toLowerCase())
      )

      const novosAssuntos = nomes
        .filter(nome => !assuntosExistentes.has(nome.toLowerCase()))
        .map(nome => ({
          nome,
          peso: 5,
          subassuntos: subassuntosList,
          selecionado: true
        }))

      adicionados = novosAssuntos.length

      novas[discIndex] = {
        ...novas[discIndex],
        assuntos: [...novas[discIndex].assuntos, ...novosAssuntos]
      }
      return novas
    })

    // Limpar campos apenas se veio do input manual
    if (!nomeAssunto) {
      setNovoAssunto('')
      setNovosSubassuntos('')
    }

    // Feedback visual
    if (adicionados > 0) {
      setFeedbackAdd(`${adicionados} assunto${adicionados > 1 ? 's' : ''} adicionado${adicionados > 1 ? 's' : ''}!`)
      setTimeout(() => setFeedbackAdd(null), 2000)

      // Expandir a disciplina para mostrar os assuntos adicionados
      setExpandidas(prev => new Set([...prev, disciplinasSelecionadas[discIndex]?.disciplina]))
    }

    // NÃO fecha o painel por padrão - permite adicionar mais
    if (!manterAberto) {
      setShowAddAssunto(null)
    }
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
    if (!limiteInfo?.canUse) {
      setErro('Você atingiu o limite de simulados do seu plano este mês')
      return
    }

    const selecionadas = disciplinasSelecionadas.filter(d => d.selecionada)
    if (selecionadas.length === 0) {
      setErro('Selecione pelo menos uma disciplina')
      return
    }

    const itens: ItemFilaGeracao[] = []
    // Usar a banca selecionada pelo usuário, ou a da pesquisa, ou padrão
    const bancaFinal = showBancaPersonalizada && bancaPersonalizada.trim()
      ? bancaPersonalizada.trim()
      : bancaSelecionada || resultadoPesquisa?.concurso.banca_provavel || 'CESPE/CEBRASPE'

    selecionadas.forEach(disc => {
      const assuntosSelecionados = disc.assuntos.filter(a => a.selecionado)

      if (assuntosSelecionados.length === 0) {
        itens.push({
          disciplina: disc.disciplina,
          banca: bancaFinal,
          modalidade,
          dificuldade: dificuldades[0]
        })
      } else {
        assuntosSelecionados.forEach(assunto => {
          if (assunto.subassuntos.length === 0) {
            itens.push({
              disciplina: disc.disciplina,
              assunto: assunto.nome,
              banca: bancaFinal,
              modalidade,
              dificuldade: dificuldades[0]
            })
          } else {
            assunto.subassuntos.forEach(sub => {
              itens.push({
                disciplina: disc.disciplina,
                assunto: assunto.nome,
                subassunto: sub,
                banca: bancaFinal,
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

      // Criar objeto de simulado para callback
      const simuladoCriado: Simulado = {
        id: resultado.simulado_id,
        user_id: user?.id || '',
        titulo: titulo || `Simulado IA - ${new Date().toLocaleDateString('pt-BR')}`,
        fonte: 'ia',
        status: 'gerando',
        quantidade_questoes: quantidade,
        questoes_respondidas: 0,
        modalidade: modalidade === 'mista' ? 'multipla_escolha' : modalidade,
        created_at: new Date().toISOString(),
        gerado_por_ia: true
      }

      onSimuladoCriado?.(simuladoCriado)
    } else {
      setErro('Erro ao iniciar geração. Tente novamente.')
    }
  }

  // Se já tem geração ativa
  if (geracaoAtiva && !geracaoAtiva.pausado) {
    return (
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 text-center">
        <div className="size-12 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
          <span className="material-symbols-outlined text-purple-500 animate-spin">progress_activity</span>
        </div>
        <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
          Geração em Andamento
        </h3>
        <p className="text-purple-600 dark:text-purple-300">
          Aguarde a conclusão do simulado atual antes de criar outro.
        </p>
        <div className="mt-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-purple-700 dark:text-purple-300">{geracaoAtiva.titulo}</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {geracaoAtiva.geradas}/{geracaoAtiva.total}
            </span>
          </div>
          <div className="h-2 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${(geracaoAtiva.geradas / geracaoAtiva.total) * 100}%` }}
            />
          </div>
        </div>
        <button
          onClick={onVoltar}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Voltar para Lista
        </button>
      </div>
    )
  }

  // Loading inicial
  if (loadingLimite) {
    return (
      <div className="bg-white dark:bg-[#1C252E] rounded-xl p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="size-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-[#9dabb9]">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info de limite */}
      {limiteInfo && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          limiteInfo.canUse
            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <span className={`material-symbols-outlined ${limiteInfo.canUse ? 'text-blue-500' : 'text-red-500'}`}>
            {limiteInfo.canUse ? 'info' : 'warning'}
          </span>
          <p className={`text-sm ${limiteInfo.canUse ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
            {limiteInfo.canUse
              ? `Você pode criar mais ${limiteInfo.restante} simulado(s) este mês (${limiteInfo.limite} no total)`
              : 'Você atingiu o limite de simulados do seu plano este mês. Faça upgrade para criar mais!'}
          </p>
        </div>
      )}

      {/* Etapa 1: Pesquisa */}
      {etapa === 'pesquisa' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1C252E] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-[#283039]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Qual concurso ou cargo você está estudando?
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={queryPesquisa}
                onChange={(e) => setQueryPesquisa(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePesquisar()}
                placeholder="Ex: Auditor Fiscal da Receita Federal, Analista TRT..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-[#283039] rounded-xl bg-white dark:bg-[#141A21] text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-base"
              />
              <button
                onClick={handlePesquisar}
                disabled={loading || !limiteInfo?.canUse}
                className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span className="sm:inline">Pesquisando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">search</span>
                    <span>Pesquisar</span>
                  </>
                )}
              </button>
            </div>
            {erro && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">error</span>
                {erro}
              </p>
            )}
            <p className="mt-3 text-sm text-gray-500 dark:text-[#9dabb9]">
              A IA irá pesquisar TODAS as disciplinas e conteúdos cobrados neste concurso.
            </p>
          </div>

          {/* Preferências salvas */}
          {preferencias.length > 0 && (
            <div className="bg-white dark:bg-[#1C252E] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-[#283039]">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-500">bookmark</span>
                Suas preferências salvas
              </h4>
              <div className="flex flex-wrap gap-2">
                {preferencias.map(pref => (
                  <button
                    key={pref.id}
                    onClick={() => carregarPreferenciaSalva(pref)}
                    disabled={!limiteInfo?.canUse}
                    className="px-4 py-2 bg-gray-100 dark:bg-[#283039] hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg text-sm transition-colors disabled:opacity-50"
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
          <div className="bg-white dark:bg-[#1C252E] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-[#283039]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {resultadoPesquisa.concurso.nome}
                </h3>
                {resultadoPesquisa.concurso.orgao && (
                  <p className="text-sm text-gray-500 dark:text-[#9dabb9]">
                    {resultadoPesquisa.concurso.orgao}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEtapa('pesquisa')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Nova pesquisa
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-base">apartment</span>
                {resultadoPesquisa.concurso.banca_provavel}
              </span>
              {resultadoPesquisa.concurso.ultima_prova && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  Última: {resultadoPesquisa.concurso.ultima_prova}
                </span>
              )}
            </div>

            {/* Análise de tendências */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">insights</span>
                Ver análise de tendências
              </summary>
              <div className="mt-3 p-4 bg-gray-50 dark:bg-[#141A21] rounded-lg text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {resultadoPesquisa.analise_tendencias}
              </div>
            </details>
          </div>

          {/* Lista de disciplinas */}
          <div className="bg-white dark:bg-[#1C252E] rounded-xl shadow-sm border border-gray-200 dark:border-[#283039]">
            <div className="p-4 border-b border-gray-200 dark:border-[#283039] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Disciplinas e Conteúdos ({disciplinasSelecionadas.length})
                </h4>
                <p className="text-sm text-gray-500 dark:text-[#9dabb9]">
                  Selecione, adicione ou remova disciplinas
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSalvarPreferencia(true)}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-[#283039] hover:bg-gray-200 dark:hover:bg-[#3a4552] text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">bookmark_add</span>
                  Salvar
                </button>
                <button
                  onClick={() => setShowAddDisciplina(true)}
                  className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Adicionar
                </button>
              </div>
            </div>

            {/* Modal de adicionar disciplina */}
            {showAddDisciplina && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-b border-gray-200 dark:border-[#283039]">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-500">add_circle</span>
                    Adicionar Disciplinas
                  </h5>
                  {feedbackAdd && (
                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 animate-pulse">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      {feedbackAdd}
                    </span>
                  )}
                </div>

                {/* Adição rápida - grid organizado */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-[#9dabb9] mb-2">
                    Clique para adicionar (pode adicionar várias de uma vez):
                  </p>
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                    {DISCIPLINAS_COMUNS.filter(
                      d => !disciplinasSelecionadas.some(ds => ds.disciplina.toLowerCase() === d.toLowerCase())
                    ).map(disc => (
                      <button
                        key={disc}
                        onClick={() => adicionarDisciplina(disc)}
                        className="px-3 py-2 text-sm bg-white dark:bg-[#283039] hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-gray-300 dark:border-[#3a4552] hover:border-purple-400 dark:hover:border-purple-500 text-gray-700 dark:text-gray-300 rounded-lg transition-all text-left truncate flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-purple-400 text-sm">add</span>
                        <span className="truncate">{disc}</span>
                      </button>
                    ))}
                  </div>
                  {DISCIPLINAS_COMUNS.filter(
                    d => !disciplinasSelecionadas.some(ds => ds.disciplina.toLowerCase() === d.toLowerCase())
                  ).length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-2">
                      Todas as disciplinas comuns já foram adicionadas
                    </p>
                  )}
                </div>

                {/* Adição personalizada */}
                <div className="border-t border-purple-200 dark:border-purple-800 pt-3">
                  <p className="text-sm text-gray-600 dark:text-[#9dabb9] mb-2">
                    Ou digite disciplinas personalizadas (separe por vírgula para adicionar várias):
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={novaDisciplina}
                      onChange={(e) => setNovaDisciplina(e.target.value)}
                      placeholder="Ex: Direito Eleitoral, Direito Empresarial..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-[#283039] rounded-lg bg-white dark:bg-[#141A21] text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      onKeyDown={(e) => e.key === 'Enter' && adicionarDisciplina(novaDisciplina)}
                    />
                    <button
                      onClick={() => adicionarDisciplina(novaDisciplina)}
                      disabled={!novaDisciplina.trim()}
                      className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Adicionar
                    </button>
                    <button
                      onClick={() => setShowAddDisciplina(false)}
                      className="px-4 py-2 text-sm bg-gray-200 dark:bg-[#283039] hover:bg-gray-300 dark:hover:bg-[#3a4552] text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de salvar preferência */}
            {showSalvarPreferencia && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-[#283039]">
                <h5 className="font-medium text-gray-800 dark:text-white mb-3">Salvar Preferência</h5>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nomePreferencia}
                    onChange={(e) => setNomePreferencia(e.target.value)}
                    placeholder="Nome para esta configuração (ex: Auditor Federal)"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-[#283039] rounded-lg bg-white dark:bg-[#141A21] text-gray-800 dark:text-white"
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
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-[#283039] text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-gray-200 dark:divide-[#283039] max-h-[400px] overflow-y-auto">
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
                            'bg-gray-100 dark:bg-[#283039] text-gray-700 dark:text-gray-300'
                          }`}>
                            {disc.importancia === 'alta' ? 'Alta' :
                             disc.importancia === 'media' ? 'Média' : 'Baixa'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-[#9dabb9]">
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
                        <span className="material-symbols-outlined text-lg">add</span>
                      </button>
                      <button
                        onClick={() => removerDisciplina(discIndex)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Remover disciplina"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                      <button
                        onClick={() => toggleExpandida(disc.disciplina)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <span className={`material-symbols-outlined text-lg transition-transform ${expandidas.has(disc.disciplina) ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Form adicionar assunto */}
                  {showAddAssunto === discIndex && (
                    <div className="mt-3 ml-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="font-medium text-gray-800 dark:text-white text-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-purple-500 text-base">topic</span>
                          Adicionar Assuntos em {disc.disciplina}
                        </h6>
                        {feedbackAdd && (
                          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            {feedbackAdd}
                          </span>
                        )}
                      </div>

                      {/* Sugestões de assuntos comuns */}
                      {ASSUNTOS_POR_DISCIPLINA[disc.disciplina] && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 dark:text-[#9dabb9] mb-2">
                            Sugestões para {disc.disciplina}:
                          </p>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {ASSUNTOS_POR_DISCIPLINA[disc.disciplina]
                              .filter(a => !disc.assuntos.some(as => as.nome.toLowerCase() === a.toLowerCase()))
                              .map(assunto => (
                                <button
                                  key={assunto}
                                  onClick={() => adicionarAssunto(discIndex, assunto)}
                                  className="px-2 py-1 text-xs bg-white dark:bg-[#283039] hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-gray-300 dark:border-[#3a4552] hover:border-purple-400 text-gray-600 dark:text-gray-300 rounded transition-colors flex items-center gap-0.5"
                                >
                                  <span className="material-symbols-outlined text-purple-400 text-xs">add</span>
                                  {assunto}
                                </button>
                              ))}
                            {ASSUNTOS_POR_DISCIPLINA[disc.disciplina]
                              .filter(a => !disc.assuntos.some(as => as.nome.toLowerCase() === a.toLowerCase()))
                              .length === 0 && (
                              <span className="text-xs text-gray-400 italic">Todos os assuntos sugeridos já foram adicionados</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Campo para adicionar assunto personalizado */}
                      <div className="space-y-2 border-t border-purple-200 dark:border-purple-700 pt-3">
                        <p className="text-xs text-gray-500 dark:text-[#9dabb9]">
                          Ou digite assuntos personalizados (separe por vírgula):
                        </p>
                        <input
                          type="text"
                          value={novoAssunto}
                          onChange={(e) => setNovoAssunto(e.target.value)}
                          placeholder="Ex: Assunto 1, Assunto 2, Assunto 3..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#283039] rounded-lg bg-white dark:bg-[#141A21] text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          onKeyDown={(e) => e.key === 'Enter' && adicionarAssunto(discIndex)}
                        />
                        <input
                          type="text"
                          value={novosSubassuntos}
                          onChange={(e) => setNovosSubassuntos(e.target.value)}
                          placeholder="Subassuntos opcionais (separados por vírgula)"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#283039] rounded-lg bg-white dark:bg-[#141A21] text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => adicionarAssunto(discIndex)}
                            disabled={!novoAssunto.trim()}
                            className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Adicionar
                          </button>
                          <button
                            onClick={() => setShowAddAssunto(null)}
                            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-[#283039] hover:bg-gray-300 dark:hover:bg-[#3a4552] text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assuntos expandidos */}
                  {expandidas.has(disc.disciplina) && (
                    <div className="mt-3 ml-8 space-y-2">
                      {disc.assuntos.map((assunto, assuntoIndex) => (
                        <div key={`${assunto.nome}-${assuntoIndex}`} className="p-3 bg-gray-50 dark:bg-[#141A21] rounded-lg">
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
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          </div>
                          {assunto.subassuntos.length > 0 && (
                            <div className="mt-2 ml-6 flex flex-wrap gap-1">
                              {assunto.subassuntos.map((sub, subIndex) => (
                                <span
                                  key={`${sub}-${subIndex}`}
                                  className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-[#283039] text-gray-600 dark:text-gray-300 rounded"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {disc.assuntos.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-[#9dabb9] italic">
                          Nenhum assunto. Clique no + para adicionar.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {disciplinasSelecionadas.length === 0 && (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">school</span>
                  <p className="text-gray-500 dark:text-[#9dabb9]">
                    Nenhuma disciplina. Clique em &quot;Adicionar&quot; para começar.
                  </p>
                </div>
              )}
            </div>
          </div>

          {erro && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-base">error</span>
              {erro}
            </p>
          )}

          {/* Botão próximo */}
          <div className="flex justify-end">
            <button
              onClick={() => setEtapa('config')}
              disabled={disciplinasSelecionadas.filter(d => d.selecionada).length === 0}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              Próximo: Configurar
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Etapa 3: Configurações */}
      {etapa === 'config' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1C252E] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-[#283039]">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-semibold text-gray-800 dark:text-white text-lg">
                Configurar Simulado
              </h4>
              <button
                onClick={() => setEtapa('selecao')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Voltar
              </button>
            </div>

            <div className="space-y-5">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Título do Simulado
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Simulado focado em Direito Constitucional"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#283039] rounded-xl bg-white dark:bg-[#141A21] text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Quantidade e Modalidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Quantidade de Questões
                  </label>
                  <select
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#283039] rounded-xl bg-white dark:bg-[#141A21] text-gray-800 dark:text-white appearance-none cursor-pointer text-base"
                  >
                    {[5, 10, 15, 20, 25, 30, 40, 50, 75, 100].map(n => (
                      <option key={n} value={n}>{n} questões</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Tipo de Questões
                  </label>
                  <select
                    value={modalidade}
                    onChange={(e) => setModalidade(e.target.value as typeof modalidade)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#283039] rounded-xl bg-white dark:bg-[#141A21] text-gray-800 dark:text-white appearance-none cursor-pointer text-base"
                  >
                    <option value="multipla_escolha">Múltipla Escolha</option>
                    <option value="certo_errado">Certo ou Errado</option>
                    <option value="mista">Mista</option>
                  </select>
                </div>
              </div>

              {/* Seleção de Banca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Estilo da Banca
                </label>
                <p className="text-xs text-gray-500 dark:text-[#9dabb9] mb-2">
                  As questões serão geradas no estilo da banca selecionada
                </p>
                {!showBancaPersonalizada ? (
                  <div className="space-y-2">
                    <select
                      value={bancaSelecionada}
                      onChange={(e) => setBancaSelecionada(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#283039] rounded-xl bg-white dark:bg-[#141A21] text-gray-800 dark:text-white appearance-none cursor-pointer"
                    >
                      {BANCAS_COMUNS.map(banca => (
                        <option key={banca} value={banca}>{banca}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowBancaPersonalizada(true)}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      Outra banca (digitar)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={bancaPersonalizada}
                      onChange={(e) => setBancaPersonalizada(e.target.value)}
                      placeholder="Digite o nome da banca..."
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#283039] rounded-xl bg-white dark:bg-[#141A21] text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => {
                        setShowBancaPersonalizada(false)
                        setBancaPersonalizada('')
                      }}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-base">arrow_back</span>
                      Escolher da lista
                    </button>
                  </div>
                )}
              </div>

              {/* Dificuldades */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dificuldade
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  {[
                    { value: 'facil', label: 'Fácil', color: 'green' },
                    { value: 'media', label: 'Média', color: 'yellow' },
                    { value: 'dificil', label: 'Difícil', color: 'red' }
                  ].map(dif => (
                    <button
                      key={dif.value}
                      onClick={() => toggleDificuldade(dif.value)}
                      className={`flex-1 px-4 py-3 sm:py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                        dificuldades.includes(dif.value)
                          ? dif.color === 'green' ? 'bg-green-500 text-white' :
                            dif.color === 'yellow' ? 'bg-yellow-500 text-white' :
                            'bg-red-500 text-white'
                          : 'bg-gray-100 dark:bg-[#283039] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a4552]'
                      }`}
                    >
                      {dificuldades.includes(dif.value) && (
                        <span className="material-symbols-outlined text-base">check</span>
                      )}
                      {dif.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tempo limite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Tempo Limite <span className="text-gray-400">(opcional)</span>
                </label>
                <select
                  value={tempoLimite || ''}
                  onChange={(e) => setTempoLimite(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#283039] rounded-xl bg-white dark:bg-[#141A21] text-gray-800 dark:text-white appearance-none cursor-pointer"
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
              <p className="mt-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">error</span>
                {erro}
              </p>
            )}

            {/* Resumo */}
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
              <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined">summarize</span>
                Resumo do Simulado
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <span className="material-symbols-outlined text-base flex-shrink-0">school</span>
                  <span className="truncate">{disciplinasSelecionadas.filter(d => d.selecionada).length} disc.</span>
                </div>
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <span className="material-symbols-outlined text-base flex-shrink-0">topic</span>
                  <span className="truncate">{disciplinasSelecionadas.filter(d => d.selecionada).reduce((acc, d) => acc + d.assuntos.filter(a => a.selecionado).length, 0)} assuntos</span>
                </div>
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <span className="material-symbols-outlined text-base flex-shrink-0">quiz</span>
                  <span className="truncate">{quantidade} questões</span>
                </div>
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <span className="material-symbols-outlined text-base flex-shrink-0">schedule</span>
                  <span className="truncate">~{Math.ceil(quantidade * 2 / 60)} min</span>
                </div>
              </div>
            </div>

            {/* Botão iniciar */}
            <button
              onClick={handleIniciarGeracao}
              disabled={loading || !limiteInfo?.canUse}
              className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Iniciando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">auto_awesome</span>
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
