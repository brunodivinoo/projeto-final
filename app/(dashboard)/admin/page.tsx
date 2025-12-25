'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Email autorizado para acessar a página admin
const ADMIN_EMAIL = 'brunodivinoa@gmail.com'

type TabType = 'gerar' | 'ver_geradas' | 'organizar' | 'popular' | 'disciplinas' | 'mesclar' | 'separar'

interface Questao {
  id: string
  disciplina: string
  assunto: string
  subassunto: string
  enunciado: string
  comentario: string
}

interface AssuntoAnalise {
  questaoId: string
  disciplinaAtual: string
  assuntoAtual: string
  subassuntoAtual: string
  disciplinaSugerida: string
  assuntoSugerido: string
  subassuntoSugerido: string
  enunciado: string
  selecionado: boolean
}

interface DisciplinaPopular {
  nome: string
  assuntos: Array<{
    nome: string
    subassuntos: string[]
  }>
}

interface DisciplinaSugestao {
  questaoId: string
  assuntoAtual: string
  subassuntoAtual: string
  enunciado: string
  disciplinaSugerida: string
  confianca: 'alta' | 'media' | 'baixa'
  motivo: string
  selecionado: boolean
}

// Tipos para estrutura hierárquica
interface Subassunto {
  id: string
  nome: string
}

interface Assunto {
  id: string
  nome: string
  subassuntos: Subassunto[]
}

interface Disciplina {
  id: string
  nome: string
  assuntos: Assunto[]
}

interface Banca {
  nome: string
  qtd_questoes: number
}

// Tipos para mesclagem de disciplinas
interface DisciplinaComQtd {
  id: string
  nome: string
  qtd_questoes: number
}

interface SugestaoMesclagem {
  disciplinaPrincipal: DisciplinaComQtd
  disciplinasParaMesclar: DisciplinaComQtd[]
  motivo: string
  confianca: 'alta' | 'media' | 'baixa'
  selecionada: boolean
}

// Tipo para item selecionado na geração
interface ItemSelecionado {
  disciplina: string
  assunto: string | null
  subassunto: string | null
  key: string // para identificar unicamente no React
}

// Tipo para item da fila
interface FilaItem {
  id: string
  status: string
  disciplina: string
  assunto: string | null
  subassunto: string | null
  banca: string
  modalidade: string
  dificuldade: string
  quantidade: number
  geradas: number
  erros: number
  created_at: string
}

// Tipo para questão gerada por IA
interface QuestaoGerada {
  id: string
  disciplina: string
  assunto: string | null
  subassunto: string | null
  banca: string
  modalidade: string
  dificuldade: string
  enunciado: string
  alternativa_a: string | null
  alternativa_b: string | null
  alternativa_c: string | null
  alternativa_d: string | null
  alternativa_e: string | null
  gabarito: string
  comentario: string
  created_at: string
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<TabType>('gerar')

  // ========== ESTADOS DA ABA GERAR (REFORMULADA) ==========
  // Estrutura hierárquica carregada do banco
  const [estrutura, setEstrutura] = useState<Disciplina[]>([])
  const [bancasDisponiveis, setBancasDisponiveis] = useState<Banca[]>([])
  const [carregandoEstrutura, setCarregandoEstrutura] = useState(false)

  // Seleção atual no seletor em cascata
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<string>('')
  const [disciplinasSelecionadasMulti, setDisciplinasSelecionadasMulti] = useState<string[]>([])
  const [modoMultiDisciplina, setModoMultiDisciplina] = useState(false)
  const [assuntoSelecionado, setAssuntoSelecionado] = useState<string>('')
  const [subassuntoSelecionado, setSubassuntoSelecionado] = useState<string>('')

  // Itens selecionados para geração (múltiplos)
  const [itensSelecionados, setItensSelecionados] = useState<ItemSelecionado[]>([])

  // Configurações de geração
  const [bancaSelecionada, setBancaSelecionada] = useState<string>('')
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<'multipla_escolha' | 'certo_errado'>('certo_errado')
  const [dificuldadeSelecionada, setDificuldadeSelecionada] = useState<'facil' | 'media' | 'dificil'>('media')
  const [quantidadePorItem, setQuantidadePorItem] = useState<number>(50)

  // Fila de geração
  const [fila, setFila] = useState<FilaItem[]>([])
  const [processandoFila, setProcessandoFila] = useState(false)
  const geracaoAbortRef = useRef(false)

  // Log de geração
  const [gerarLog, setGerarLog] = useState<string[]>([])

  // Prompt atual (para visualização)
  const [promptAtual, setPromptAtual] = useState<string>('')
  const [mostrarPrompt, setMostrarPrompt] = useState(false)


  // Estado de organização de assuntos
  const [questoesParaAnalisar, setQuestoesParaAnalisar] = useState<Questao[]>([])
  const [analisesAssuntos, setAnalisesAssuntos] = useState<AssuntoAnalise[]>([])
  const [analisando, setAnalisando] = useState(false)
  const [organizarLog, setOrganizarLog] = useState<string[]>([])

  // Estado do processamento em background
  const [bgProcesso, setBgProcesso] = useState<{
    ativo: boolean
    total: number
    atual: number
    sucessos: number
    erros: number
  }>({ ativo: false, total: 0, atual: 0, sucessos: 0, erros: 0 })

  // Estado de popular disciplinas
  const [disciplinasPopular, setDisciplinasPopular] = useState<DisciplinaPopular[]>([])
  const [buscandoDisciplinas, setBuscandoDisciplinas] = useState(false)
  const [popularLog, setPopularLog] = useState<string[]>([])
  const [concursoAlvo, setConcursoAlvo] = useState('')

  // Estado de corrigir disciplinas (questões sem disciplina)
  const [questoesSemDisciplina, setQuestoesSemDisciplina] = useState<Array<{id: string, enunciado: string, assunto: string, subassunto: string | null}>>([])
  const [sugestoesDisciplina, setSugestoesDisciplina] = useState<DisciplinaSugestao[]>([])
  const [buscandoSemDisciplina, setBuscandoSemDisciplina] = useState(false)
  const [analisandoDisciplinas, setAnalisandoDisciplinas] = useState(false)
  const [disciplinaLog, setDisciplinaLog] = useState<string[]>([])
  const [bgProcessoDisciplina, setBgProcessoDisciplina] = useState<{
    ativo: boolean
    total: number
    atual: number
    sucessos: number
    erros: number
  }>({ ativo: false, total: 0, atual: 0, sucessos: 0, erros: 0 })

  // ========== ESTADOS DA ABA VER QUESTÕES GERADAS ==========
  const [questoesGeradas, setQuestoesGeradas] = useState<QuestaoGerada[]>([])
  const [carregandoGeradas, setCarregandoGeradas] = useState(false)
  const [filtroGeradasDisciplina, setFiltroGeradasDisciplina] = useState('')
  const [filtroGeradasBanca, setFiltroGeradasBanca] = useState('')
  const [filtroGeradasModalidade, setFiltroGeradasModalidade] = useState('')
  const [paginaGeradas, setPaginaGeradas] = useState(1)
  const [totalGeradas, setTotalGeradas] = useState(0)
  const [totalPaginasGeradas, setTotalPaginasGeradas] = useState(1)
  const [disciplinasGeradasDisponiveis, setDisciplinasGeradasDisponiveis] = useState<string[]>([])
  const [questoesSelecionadasParaDeletar, setQuestoesSelecionadasParaDeletar] = useState<string[]>([])
  const [deletandoQuestoes, setDeletandoQuestoes] = useState(false)
  const [questaoExpandida, setQuestaoExpandida] = useState<string | null>(null)

  // ========== ESTADOS DA ABA MESCLAR DISCIPLINAS ==========
  const [sugestoesMesclagem, setSugestoesMesclagem] = useState<SugestaoMesclagem[]>([])
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(false)
  const [executandoMesclagem, setExecutandoMesclagem] = useState(false)
  const [mesclagemLog, setMesclagemLog] = useState<string[]>([])
  const [todasDisciplinas, setTodasDisciplinas] = useState<DisciplinaComQtd[]>([])

  // ========== ESTADOS DA ABA SEPARAR DISCIPLINAS ==========
  const [separarDisciplinaOrigem, setSepararDisciplinaOrigem] = useState('')
  const [separarSugestoes, setSepararSugestoes] = useState<{
    novaDisciplina: string
    quantidade: number
    questoes: Array<{
      id: string
      assunto: string | null
      enunciado: string
      termoEncontrado: string
    }>
  }[]>([])
  const [carregandoSeparacao, setCarregandoSeparacao] = useState(false)
  const [executandoSeparacao, setExecutandoSeparacao] = useState(false)
  const [separacaoLog, setSeparacaoLog] = useState<string[]>([])
  const [criarDisciplinaManual, setCriarDisciplinaManual] = useState('')

  // Verificar acesso
  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  // ========== FUNÇÕES DA ABA GERAR (REFORMULADA) ==========

  // Carregar estrutura hierárquica e bancas
  const carregarEstrutura = useCallback(async () => {
    setCarregandoEstrutura(true)
    try {
      // Carregar estrutura e bancas em paralelo
      const [estruturaRes, bancasRes] = await Promise.all([
        fetch('/api/admin/filtros-completos?tipo=estrutura'),
        fetch('/api/admin/filtros-completos?tipo=bancas')
      ])

      if (estruturaRes.ok) {
        const { estrutura: est } = await estruturaRes.json()
        setEstrutura(est || [])
      }

      if (bancasRes.ok) {
        const { bancas } = await bancasRes.json()
        setBancasDisponiveis(bancas || [])
        // Setar primeira banca como padrão
        if (bancas?.length > 0 && !bancaSelecionada) {
          setBancaSelecionada(bancas[0].nome)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar estrutura:', err)
      setGerarLog(prev => [...prev, `❌ Erro ao carregar estrutura: ${err}`])
    }
    setCarregandoEstrutura(false)
  }, [bancaSelecionada])

  // Carregar fila do usuário
  const carregarFila = useCallback(async () => {
    if (!user?.id) return

    try {
      const res = await fetch(`/api/admin/geracao-fila?user_id=${user.id}`)
      if (res.ok) {
        const { fila: filaData } = await res.json()
        setFila(filaData || [])
      }
    } catch (err) {
      console.error('Erro ao carregar fila:', err)
    }
  }, [user?.id])

  // Carregar estrutura quando a tab gerar estiver ativa
  useEffect(() => {
    if (tab === 'gerar' && estrutura.length === 0 && !carregandoEstrutura) {
      carregarEstrutura()
    }
  }, [tab, estrutura.length, carregandoEstrutura, carregarEstrutura])

  // Carregar fila ao montar e periodicamente
  useEffect(() => {
    if (user?.id) {
      carregarFila()
    }
  }, [user?.id, carregarFila])

  // Obter assuntos da disciplina selecionada
  const assuntosDaDisciplina = disciplinaSelecionada
    ? estrutura.find(d => d.nome === disciplinaSelecionada)?.assuntos || []
    : []

  // Obter subassuntos do assunto selecionado
  const subassuntosDoAssunto = assuntoSelecionado
    ? assuntosDaDisciplina.find(a => a.nome === assuntoSelecionado)?.subassuntos || []
    : []

  // Adicionar item à seleção
  const adicionarItem = () => {
    if (!disciplinaSelecionada) return

    const novoItem: ItemSelecionado = {
      disciplina: disciplinaSelecionada,
      assunto: assuntoSelecionado || null,
      subassunto: subassuntoSelecionado || null,
      key: `${disciplinaSelecionada}-${assuntoSelecionado || 'geral'}-${subassuntoSelecionado || 'geral'}-${Date.now()}`
    }

    // Verificar se já existe item idêntico
    const jaExiste = itensSelecionados.some(
      item => item.disciplina === novoItem.disciplina &&
              item.assunto === novoItem.assunto &&
              item.subassunto === novoItem.subassunto
    )

    if (jaExiste) {
      setGerarLog(prev => [...prev, '⚠️ Este item já foi adicionado'])
      return
    }

    setItensSelecionados(prev => [...prev, novoItem])
    // Limpar seleção após adicionar
    setSubassuntoSelecionado('')
  }

  // Remover item da seleção
  const removerItem = (key: string) => {
    setItensSelecionados(prev => prev.filter(item => item.key !== key))
  }

  // Adicionar todos os assuntos da disciplina
  const adicionarTodosDaDisciplina = () => {
    if (!disciplinaSelecionada) return

    const disc = estrutura.find(d => d.nome === disciplinaSelecionada)
    if (!disc) return

    const novosItens: ItemSelecionado[] = []

    if (disc.assuntos.length === 0) {
      // Disciplina sem assuntos - adicionar apenas disciplina
      novosItens.push({
        disciplina: disc.nome,
        assunto: null,
        subassunto: null,
        key: `${disc.nome}-geral-geral-${Date.now()}`
      })
    } else {
      // Adicionar cada assunto
      disc.assuntos.forEach(ass => {
        if (ass.subassuntos.length === 0) {
          novosItens.push({
            disciplina: disc.nome,
            assunto: ass.nome,
            subassunto: null,
            key: `${disc.nome}-${ass.nome}-geral-${Date.now()}-${Math.random()}`
          })
        } else {
          // Adicionar cada subassunto
          ass.subassuntos.forEach(sub => {
            novosItens.push({
              disciplina: disc.nome,
              assunto: ass.nome,
              subassunto: sub.nome,
              key: `${disc.nome}-${ass.nome}-${sub.nome}-${Date.now()}-${Math.random()}`
            })
          })
        }
      })
    }

    // Filtrar itens que já existem
    const itensFiltrados = novosItens.filter(novo =>
      !itensSelecionados.some(
        item => item.disciplina === novo.disciplina &&
                item.assunto === novo.assunto &&
                item.subassunto === novo.subassunto
      )
    )

    setItensSelecionados(prev => [...prev, ...itensFiltrados])
    setGerarLog(prev => [...prev, `✅ ${itensFiltrados.length} itens adicionados de ${disc.nome}`])
  }

  // Toggle seleção de disciplina no modo multi
  const toggleDisciplinaMulti = (nomeDisciplina: string) => {
    setDisciplinasSelecionadasMulti(prev =>
      prev.includes(nomeDisciplina)
        ? prev.filter(d => d !== nomeDisciplina)
        : [...prev, nomeDisciplina]
    )
  }

  // Selecionar todas as disciplinas
  const selecionarTodasDisciplinas = () => {
    setDisciplinasSelecionadasMulti(estrutura.map(d => d.nome))
  }

  // Desselecionar todas as disciplinas
  const desselecionarTodasDisciplinas = () => {
    setDisciplinasSelecionadasMulti([])
  }

  // Adicionar itens das disciplinas selecionadas no modo multi
  const adicionarDisciplinasMulti = () => {
    if (disciplinasSelecionadasMulti.length === 0) return

    const novosItens: ItemSelecionado[] = []

    for (const nomeDisciplina of disciplinasSelecionadasMulti) {
      const disc = estrutura.find(d => d.nome === nomeDisciplina)
      if (!disc) continue

      if (disc.assuntos.length === 0) {
        // Disciplina sem assuntos - adicionar apenas disciplina
        novosItens.push({
          disciplina: disc.nome,
          assunto: null,
          subassunto: null,
          key: `${disc.nome}-geral-geral-${Date.now()}-${Math.random()}`
        })
      } else {
        // Adicionar cada assunto
        disc.assuntos.forEach(ass => {
          if (ass.subassuntos.length === 0) {
            novosItens.push({
              disciplina: disc.nome,
              assunto: ass.nome,
              subassunto: null,
              key: `${disc.nome}-${ass.nome}-geral-${Date.now()}-${Math.random()}`
            })
          } else {
            // Adicionar cada subassunto
            ass.subassuntos.forEach(sub => {
              novosItens.push({
                disciplina: disc.nome,
                assunto: ass.nome,
                subassunto: sub.nome,
                key: `${disc.nome}-${ass.nome}-${sub.nome}-${Date.now()}-${Math.random()}`
              })
            })
          }
        })
      }
    }

    // Filtrar itens que já existem
    const itensFiltrados = novosItens.filter(novo =>
      !itensSelecionados.some(
        item => item.disciplina === novo.disciplina &&
                item.assunto === novo.assunto &&
                item.subassunto === novo.subassunto
      )
    )

    setItensSelecionados(prev => [...prev, ...itensFiltrados])
    setGerarLog(prev => [...prev, `✅ ${itensFiltrados.length} itens adicionados de ${disciplinasSelecionadasMulti.length} disciplinas`])
    setDisciplinasSelecionadasMulti([])
    setModoMultiDisciplina(false)
  }

  // Calcular total de questões a gerar
  const totalQuestoes = itensSelecionados.length * quantidadePorItem

  // Gerar prompt para visualização
  const gerarPromptVisualizacao = () => {
    const item = itensSelecionados[0]
    if (!item) return ''

    if (modalidadeSelecionada === 'certo_errado') {
      return `Você é um especialista em elaborar questões de concursos públicos brasileiros.

Crie APENAS 1 questão no estilo ${bancaSelecionada.toUpperCase()} (Certo ou Errado).

CONFIGURAÇÃO:
- Disciplina: ${item.disciplina}
- Assunto: ${item.assunto || 'Geral'}
${item.subassunto ? `- Subassunto/Tema específico: ${item.subassunto}` : ''}
- Dificuldade: ${dificuldadeSelecionada}

INSTRUÇÕES IMPORTANTES:
1. A questão deve ser uma AFIRMAÇÃO que pode ser julgada como CERTA ou ERRADA
2. Use linguagem técnica e formal de concursos
3. Base-se em legislação, doutrina ou jurisprudência ATUALIZADAS
4. O comentário deve explicar DETALHADAMENTE o porquê da resposta
5. NÃO repita questões genéricas - seja ESPECÍFICO sobre o tema

RESPONDA EM JSON:
{
  "enunciado": "afirmação completa para julgar",
  "gabarito": "CERTO" ou "ERRADO",
  "comentario": "explicação detalhada com fundamentação"
}

Retorne APENAS o JSON, sem markdown.`
    } else {
      return `Você é um especialista em elaborar questões de concursos públicos brasileiros.

Crie APENAS 1 questão de múltipla escolha no estilo ${bancaSelecionada.toUpperCase()}.

CONFIGURAÇÃO:
- Disciplina: ${item.disciplina}
- Assunto: ${item.assunto || 'Geral'}
${item.subassunto ? `- Subassunto/Tema específico: ${item.subassunto}` : ''}
- Dificuldade: ${dificuldadeSelecionada}
- Modalidade: Múltipla Escolha (5 alternativas: A, B, C, D, E)

INSTRUÇÕES IMPORTANTES:
1. Crie um enunciado completo e contextualizado
2. As 5 alternativas devem ser PLAUSÍVEIS, com apenas UMA correta
3. Use linguagem técnica e formal de concursos
4. Base-se em legislação, doutrina ou jurisprudência ATUALIZADAS
5. O comentário deve explicar CADA alternativa (por que está certa/errada)
6. NÃO repita questões genéricas - seja ESPECÍFICO sobre o tema

RESPONDA EM JSON:
{
  "enunciado": "texto completo do enunciado com contexto",
  "alternativa_a": "texto da alternativa A",
  "alternativa_b": "texto da alternativa B",
  "alternativa_c": "texto da alternativa C",
  "alternativa_d": "texto da alternativa D",
  "alternativa_e": "texto da alternativa E",
  "gabarito": "A" (ou B, C, D, E),
  "comentario": "explicação detalhada de cada alternativa"
}

Retorne APENAS o JSON, sem markdown.`
    }
  }

  // Iniciar geração - adicionar itens à fila
  const iniciarGeracao = async () => {
    if (!user?.id || itensSelecionados.length === 0) return

    setGerarLog(prev => [...prev, `🚀 Adicionando ${itensSelecionados.length} itens à fila (${totalQuestoes} questões total)...`])

    const itensParaFila = itensSelecionados.map(item => ({
      disciplina: item.disciplina,
      assunto: item.assunto,
      subassunto: item.subassunto,
      banca: bancaSelecionada,
      modalidade: modalidadeSelecionada,
      dificuldade: dificuldadeSelecionada,
      quantidade: quantidadePorItem
    }))

    try {
      const res = await fetch('/api/admin/geracao-fila', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          itens: itensParaFila
        })
      })

      if (res.ok) {
        const { inseridos } = await res.json()
        setGerarLog(prev => [...prev, `✅ ${inseridos} itens adicionados à fila!`])
        setItensSelecionados([])
        await carregarFila()
        iniciarProcessamentoFila()
      } else {
        const { error } = await res.json()
        setGerarLog(prev => [...prev, `❌ Erro: ${error}`])
      }
    } catch (err) {
      setGerarLog(prev => [...prev, `❌ Erro: ${err}`])
    }
  }

  // Iniciar processamento da fila
  const iniciarProcessamentoFila = useCallback(async () => {
    if (processandoFila || !user?.id) return

    setProcessandoFila(true)
    geracaoAbortRef.current = false
    setGerarLog(prev => [...prev, '⚡ Iniciando processamento da fila...'])

    // Processar questões uma a uma
    const processarProximaQuestao = async () => {
      if (geracaoAbortRef.current) {
        setProcessandoFila(false)
        setGerarLog(prev => [...prev, '⏹️ Geração cancelada pelo usuário'])
        return
      }

      // Buscar fila atualizada
      const res = await fetch(`/api/admin/geracao-fila?user_id=${user.id}`)
      if (!res.ok) {
        setProcessandoFila(false)
        return
      }

      const { fila: filaAtual } = await res.json()
      setFila(filaAtual || [])

      // Encontrar próximo item a processar
      const itemPendente = filaAtual?.find((f: FilaItem) =>
        (f.status === 'pendente' || f.status === 'processando') && f.geradas < f.quantidade
      )

      if (!itemPendente) {
        setProcessandoFila(false)
        setGerarLog(prev => [...prev, '🎉 Fila concluída!'])
        return
      }

      // Gerar uma questão
      try {
        const gerarRes = await fetch('/api/admin/gerar-questao-unica', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fila_id: itemPendente.id,
            user_id: user.id
          })
        })

        const resultado = await gerarRes.json()

        if (resultado.sucesso) {
          setGerarLog(prev => {
            const newLog = [...prev, `✅ Questão ${resultado.geradas}/${resultado.total}: ${resultado.questao?.disciplina} - ${resultado.questao?.assunto || 'Geral'}`]
            // Manter apenas últimos 100 logs
            return newLog.slice(-100)
          })
        } else if (resultado.concluido) {
          setGerarLog(prev => [...prev, `✓ Item concluído: ${itemPendente.disciplina}`])
        } else if (resultado.cancelado) {
          setGerarLog(prev => [...prev, `⏹️ Item cancelado`])
        } else if (resultado.erro) {
          setGerarLog(prev => [...prev, `⚠️ Erro (tentando novamente): ${resultado.message}`])
        }

        // Atualizar fila local
        setFila(prev => prev.map(f =>
          f.id === itemPendente.id
            ? { ...f, geradas: resultado.geradas || f.geradas, status: resultado.concluido ? 'concluido' : f.status }
            : f
        ))
      } catch (err) {
        setGerarLog(prev => [...prev, `⚠️ Erro de rede, tentando novamente...`])
      }

      // Continuar processamento após delay
      setTimeout(processarProximaQuestao, 1500)
    }

    processarProximaQuestao()
  }, [processandoFila, user?.id])

  // Cancelar geração
  const cancelarGeracao = async () => {
    if (!user?.id) return

    geracaoAbortRef.current = true
    setGerarLog(prev => [...prev, '⏹️ Cancelando geração...'])

    try {
      await fetch(`/api/admin/geracao-fila?user_id=${user.id}`, {
        method: 'DELETE'
      })
      await carregarFila()
    } catch (err) {
      console.error('Erro ao cancelar:', err)
    }
  }

  // ========== FUNÇÕES DA ABA VER QUESTÕES GERADAS ==========

  // Carregar questões geradas por IA
  const carregarQuestoesGeradas = useCallback(async () => {
    setCarregandoGeradas(true)
    try {
      const params = new URLSearchParams({
        page: paginaGeradas.toString(),
        limit: '20'
      })

      if (filtroGeradasDisciplina) params.append('disciplina', filtroGeradasDisciplina)
      if (filtroGeradasBanca) params.append('banca', filtroGeradasBanca)
      if (filtroGeradasModalidade) params.append('modalidade', filtroGeradasModalidade)

      const res = await fetch(`/api/admin/questoes-geradas?${params}`)
      if (res.ok) {
        const data = await res.json()
        setQuestoesGeradas(data.questoes || [])
        setTotalGeradas(data.total || 0)
        setTotalPaginasGeradas(data.totalPages || 1)
        setDisciplinasGeradasDisponiveis(data.filtrosDisponiveis?.disciplinas || [])
      }
    } catch (err) {
      console.error('Erro ao carregar questões geradas:', err)
    }
    setCarregandoGeradas(false)
  }, [paginaGeradas, filtroGeradasDisciplina, filtroGeradasBanca, filtroGeradasModalidade])

  // Carregar questões quando a tab estiver ativa ou filtros mudarem
  useEffect(() => {
    if (tab === 'ver_geradas') {
      carregarQuestoesGeradas()
    }
  }, [tab, carregarQuestoesGeradas])

  // Toggle seleção de questão para deletar
  const toggleSelecionarQuestao = (id: string) => {
    setQuestoesSelecionadasParaDeletar(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    )
  }

  // Selecionar/deselecionar todas as questões da página
  const toggleSelecionarTodas = () => {
    if (questoesSelecionadasParaDeletar.length === questoesGeradas.length) {
      setQuestoesSelecionadasParaDeletar([])
    } else {
      setQuestoesSelecionadasParaDeletar(questoesGeradas.map(q => q.id))
    }
  }

  // Deletar questões selecionadas
  const deletarQuestoesSelecionadas = async () => {
    if (questoesSelecionadasParaDeletar.length === 0) return

    if (!confirm(`Tem certeza que deseja deletar ${questoesSelecionadasParaDeletar.length} questão(ões)?`)) {
      return
    }

    setDeletandoQuestoes(true)
    try {
      const res = await fetch(`/api/admin/questoes-geradas?ids=${questoesSelecionadasParaDeletar.join(',')}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        const { deletadas } = await res.json()
        alert(`${deletadas} questão(ões) deletada(s) com sucesso!`)
        setQuestoesSelecionadasParaDeletar([])
        carregarQuestoesGeradas()
      } else {
        const { error } = await res.json()
        alert(`Erro: ${error}`)
      }
    } catch (err) {
      alert('Erro ao deletar questões')
    }
    setDeletandoQuestoes(false)
  }

  // Deletar uma questão específica
  const deletarQuestao = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta questão?')) return

    try {
      const res = await fetch(`/api/admin/questoes-geradas?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        carregarQuestoesGeradas()
      }
    } catch (err) {
      alert('Erro ao deletar questão')
    }
  }

  // Carregar questões com assuntos problemáticos
  const carregarQuestoesProblematicas = async () => {
    setOrganizarLog(prev => [...prev, '🔍 Buscando questões com assuntos problemáticos...'])

    const { data, error } = await supabase
      .from('questoes')
      .select('id, disciplina, assunto, subassunto, enunciado, comentario')
      .or('assunto.ilike.%sumula%,assunto.ilike.%stf%,assunto.ilike.%stj%,assunto.ilike.%repercussao%,assunto.ilike.%processad%')
      .limit(500)

    if (error) {
      setOrganizarLog(prev => [...prev, `❌ Erro: ${error.message}`])
      return
    }

    setQuestoesParaAnalisar(data || [])
    setOrganizarLog(prev => [...prev, `✅ ${data?.length || 0} questões encontradas com assuntos problemáticos`])
  }

  // Analisar questões com IA (em background, 1 a 1)
  const analisarQuestoesComIA = async () => {
    if (questoesParaAnalisar.length === 0) {
      setOrganizarLog(prev => [...prev, '⚠️ Nenhuma questão para analisar. Clique em "Buscar Questões" primeiro.'])
      return
    }

    if (bgProcesso.ativo) {
      setOrganizarLog(prev => [...prev, '⚠️ Já existe um processamento em andamento.'])
      return
    }

    // Iniciar processamento em background
    setAnalisando(true)
    setBgProcesso({
      ativo: true,
      total: questoesParaAnalisar.length,
      atual: 0,
      sucessos: 0,
      erros: 0
    })
    setOrganizarLog(prev => [...prev, `🤖 Iniciando análise de ${questoesParaAnalisar.length} questões em segundo plano...`])

    // Processar em background (não bloqueia a UI)
    processarQuestoesBackground()
  }

  // Função que processa em background
  const processarQuestoesBackground = async () => {
    const analises: AssuntoAnalise[] = []
    let sucessos = 0
    let erros = 0

    // Processar 1 a 1
    for (let i = 0; i < questoesParaAnalisar.length; i++) {
      const questao = questoesParaAnalisar[i]
      let sucesso = false
      let tentativas = 0
      const maxTentativas = 3

      while (!sucesso && tentativas < maxTentativas) {
        tentativas++

        try {
          const response = await fetch('/api/admin/analisar-assuntos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questoes: [questao] })
          })

          if (response.ok) {
            const resultado = await response.json()
            if (resultado.analises?.length > 0) {
              analises.push(...resultado.analises)
              setAnalisesAssuntos(prev => [...prev, ...resultado.analises])
            }
            sucesso = true
            sucessos++
          } else {
            if (tentativas < maxTentativas) {
              await new Promise(r => setTimeout(r, 5000 * tentativas))
            } else {
              erros++
            }
          }
        } catch {
          if (tentativas >= maxTentativas) {
            erros++
          } else {
            await new Promise(r => setTimeout(r, 3000))
          }
        }
      }

      // Atualizar progresso
      setBgProcesso(prev => ({
        ...prev,
        atual: i + 1,
        sucessos,
        erros
      }))

      // Pausa entre questões (2 segundos)
      if (i < questoesParaAnalisar.length - 1) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    // Finalizar
    setBgProcesso(prev => ({ ...prev, ativo: false }))
    setAnalisando(false)
    setOrganizarLog(prev => [...prev, `🎉 Análise completa! ${sucessos} sucessos, ${erros} erros.`])
  }

  // Aplicar correções selecionadas
  const aplicarCorrecoes = async () => {
    const selecionados = analisesAssuntos.filter(a => a.selecionado)

    if (selecionados.length === 0) {
      setOrganizarLog(prev => [...prev, '⚠️ Nenhuma correção selecionada'])
      return
    }

    setOrganizarLog(prev => [...prev, `📝 Aplicando ${selecionados.length} correções...`])

    // Preparar correções para a API
    const correcoes = selecionados.map(analise => ({
      questaoId: analise.questaoId,
      disciplina: analise.disciplinaSugerida || undefined,
      assunto: analise.assuntoSugerido,
      subassunto: analise.subassuntoSugerido || undefined
    }))

    try {
      const response = await fetch('/api/admin/aplicar-correcoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correcoes })
      })

      const resultado = await response.json()

      if (response.ok) {
        setOrganizarLog(prev => [...prev, `✅ ${resultado.sucesso} questões atualizadas (disciplina, assunto e subassunto)!`])
        if (resultado.erros > 0) {
          setOrganizarLog(prev => [...prev, `⚠️ ${resultado.erros} erros ao atualizar`])
        }
      } else {
        setOrganizarLog(prev => [...prev, `❌ Erro: ${resultado.error}`])
      }
    } catch (err) {
      setOrganizarLog(prev => [...prev, `❌ Erro de rede: ${err instanceof Error ? err.message : 'Desconhecido'}`])
    }

    // Limpar selecionados
    setAnalisesAssuntos(prev => prev.filter(a => !a.selecionado))
  }

  // Buscar disciplinas/assuntos de concursos
  const buscarDisciplinasConcursos = async () => {
    setBuscandoDisciplinas(true)
    setPopularLog(prev => [...prev, `🔍 Buscando disciplinas e assuntos de concursos ${concursoAlvo || 'em geral'}...`])

    try {
      const response = await fetch('/api/admin/popular-disciplinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurso: concursoAlvo })
      })

      if (response.ok) {
        const resultado = await response.json()
        setDisciplinasPopular(resultado.disciplinas)
        setPopularLog(prev => [...prev, `✅ ${resultado.disciplinas.length} disciplinas encontradas!`])
      } else {
        const erro = await response.json()
        setPopularLog(prev => [...prev, `❌ Erro: ${erro.error}`])
      }
    } catch (err) {
      setPopularLog(prev => [...prev, `❌ Erro: ${err}`])
    }

    setBuscandoDisciplinas(false)
  }

  // Inserir disciplinas no banco
  const inserirDisciplinasNoBanco = async () => {
    if (disciplinasPopular.length === 0) {
      setPopularLog(prev => [...prev, '⚠️ Nenhuma disciplina para inserir'])
      return
    }

    setPopularLog(prev => [...prev, `📝 Inserindo ${disciplinasPopular.length} disciplinas no banco...`])

    try {
      const response = await fetch('/api/admin/inserir-disciplinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplinas: disciplinasPopular })
      })

      if (response.ok) {
        const resultado = await response.json()
        setPopularLog(prev => [...prev, `✅ Inserido: ${resultado.disciplinas} disciplinas, ${resultado.assuntos} assuntos, ${resultado.subassuntos} subassuntos`])
      } else {
        const erro = await response.json()
        setPopularLog(prev => [...prev, `❌ Erro: ${erro.error}`])
      }
    } catch (err) {
      setPopularLog(prev => [...prev, `❌ Erro: ${err}`])
    }
  }

  // Toggle seleção de análise
  const toggleAnalise = (questaoId: string) => {
    setAnalisesAssuntos(prev => prev.map(a =>
      a.questaoId === questaoId ? { ...a, selecionado: !a.selecionado } : a
    ))
  }

  // Selecionar todos
  const selecionarTodos = () => {
    setAnalisesAssuntos(prev => prev.map(a => ({ ...a, selecionado: true })))
  }

  // Desselecionar todos
  const desselecionarTodos = () => {
    setAnalisesAssuntos(prev => prev.map(a => ({ ...a, selecionado: false })))
  }

  // ========== FUNÇÕES PARA CORRIGIR DISCIPLINAS ==========

  // Buscar questões sem disciplina
  const buscarQuestoesSemDisciplina = async () => {
    setBuscandoSemDisciplina(true)
    setDisciplinaLog(prev => [...prev, '🔍 Buscando questões sem disciplina...'])

    const { data, error } = await supabase
      .from('questoes')
      .select('id, enunciado, assunto, subassunto')
      .or('disciplina.is.null,disciplina.eq.')
      .limit(500)

    if (error) {
      setDisciplinaLog(prev => [...prev, `❌ Erro: ${error.message}`])
      setBuscandoSemDisciplina(false)
      return
    }

    setQuestoesSemDisciplina(data || [])
    setDisciplinaLog(prev => [...prev, `✅ ${data?.length || 0} questões encontradas sem disciplina`])
    setBuscandoSemDisciplina(false)
  }

  // Analisar questões sem disciplina com IA (em background, 1 a 1)
  const analisarDisciplinasComIA = async () => {
    if (questoesSemDisciplina.length === 0) {
      setDisciplinaLog(prev => [...prev, '⚠️ Nenhuma questão para analisar. Clique em "Buscar Questões" primeiro.'])
      return
    }

    if (bgProcessoDisciplina.ativo) {
      setDisciplinaLog(prev => [...prev, '⚠️ Já existe um processamento em andamento.'])
      return
    }

    // Iniciar processamento em background
    setAnalisandoDisciplinas(true)
    setBgProcessoDisciplina({
      ativo: true,
      total: questoesSemDisciplina.length,
      atual: 0,
      sucessos: 0,
      erros: 0
    })
    setDisciplinaLog(prev => [...prev, `🤖 Iniciando análise de ${questoesSemDisciplina.length} questões em segundo plano...`])

    // Processar em background
    processarDisciplinasBackground()
  }

  // Função que processa disciplinas em background
  const processarDisciplinasBackground = async () => {
    let sucessos = 0
    let erros = 0

    // Processar 1 a 1
    for (let i = 0; i < questoesSemDisciplina.length; i++) {
      const questao = questoesSemDisciplina[i]
      let sucesso = false
      let tentativas = 0
      const maxTentativas = 3

      while (!sucesso && tentativas < maxTentativas) {
        tentativas++

        try {
          const response = await fetch('/api/admin/corrigir-disciplinas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questoes: [questao] })
          })

          if (response.ok) {
            const resultado = await response.json()
            if (resultado.sugestoes?.length > 0) {
              setSugestoesDisciplina(prev => [...prev, ...resultado.sugestoes])
            }
            sucesso = true
            sucessos++
          } else {
            if (tentativas < maxTentativas) {
              await new Promise(r => setTimeout(r, 5000 * tentativas))
            } else {
              erros++
            }
          }
        } catch {
          if (tentativas >= maxTentativas) {
            erros++
          } else {
            await new Promise(r => setTimeout(r, 3000))
          }
        }
      }

      // Atualizar progresso
      setBgProcessoDisciplina(prev => ({
        ...prev,
        atual: i + 1,
        sucessos,
        erros
      }))

      // Pausa entre questões (2 segundos)
      if (i < questoesSemDisciplina.length - 1) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    // Finalizar
    setBgProcessoDisciplina(prev => ({ ...prev, ativo: false }))
    setAnalisandoDisciplinas(false)
    setDisciplinaLog(prev => [...prev, `🎉 Análise completa! ${sucessos} sucessos, ${erros} erros.`])
  }

  // Aplicar correções de disciplinas selecionadas
  const aplicarCorrecoesDisciplinas = async () => {
    const selecionados = sugestoesDisciplina.filter(s => s.selecionado)

    if (selecionados.length === 0) {
      setDisciplinaLog(prev => [...prev, '⚠️ Nenhuma correção selecionada'])
      return
    }

    setDisciplinaLog(prev => [...prev, `📝 Aplicando ${selecionados.length} correções de disciplina...`])

    // Preparar correções para a API
    const correcoes = selecionados.map(sugestao => ({
      questaoId: sugestao.questaoId,
      disciplina: sugestao.disciplinaSugerida
    }))

    try {
      const response = await fetch('/api/admin/aplicar-correcoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correcoes })
      })

      const resultado = await response.json()

      if (response.ok) {
        setDisciplinaLog(prev => [...prev, `✅ ${resultado.sucesso} questões atualizadas com a disciplina correta!`])
        if (resultado.erros > 0) {
          setDisciplinaLog(prev => [...prev, `⚠️ ${resultado.erros} erros ao atualizar`])
        }
      } else {
        setDisciplinaLog(prev => [...prev, `❌ Erro: ${resultado.error}`])
      }
    } catch (err) {
      setDisciplinaLog(prev => [...prev, `❌ Erro de rede: ${err instanceof Error ? err.message : 'Desconhecido'}`])
    }

    // Limpar selecionados
    setSugestoesDisciplina(prev => prev.filter(s => !s.selecionado))
  }

  // Toggle seleção de sugestão de disciplina
  const toggleSugestaoDisciplina = (questaoId: string) => {
    setSugestoesDisciplina(prev => prev.map(s =>
      s.questaoId === questaoId ? { ...s, selecionado: !s.selecionado } : s
    ))
  }

  // Selecionar todos disciplinas
  const selecionarTodosDisciplinas = () => {
    setSugestoesDisciplina(prev => prev.map(s => ({ ...s, selecionado: true })))
  }

  // Desselecionar todos disciplinas
  const desselecionarTodosDisciplinas = () => {
    setSugestoesDisciplina(prev => prev.map(s => ({ ...s, selecionado: false })))
  }

  // ========== FUNÇÕES DA ABA MESCLAR DISCIPLINAS ==========

  // Buscar sugestões de mesclagem com IA
  const buscarSugestoesMesclagem = async () => {
    setCarregandoSugestoes(true)
    setMesclagemLog(['🔍 Buscando disciplinas duplicadas/similares com IA...'])

    try {
      const res = await fetch('/api/admin/mesclar-disciplinas')
      const data = await res.json()

      if (!res.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error
        throw new Error(errorMsg || 'Erro ao buscar sugestões')
      }

      // Adicionar campo selecionada às sugestões
      const sugestoesComSelecao = (data.sugestoes || []).map((s: Omit<SugestaoMesclagem, 'selecionada'>) => ({
        ...s,
        selecionada: false
      }))

      setSugestoesMesclagem(sugestoesComSelecao)
      setTodasDisciplinas(data.disciplinas || [])

      if (sugestoesComSelecao.length === 0) {
        setMesclagemLog(prev => [...prev, '✅ Nenhuma duplicata encontrada! Suas disciplinas estão organizadas.'])
      } else {
        setMesclagemLog(prev => [
          ...prev,
          `✅ Encontradas ${sugestoesComSelecao.length} sugestões de mesclagem`,
          `📊 Total de ${data.totalDisciplinas} disciplinas no banco`
        ])
      }
    } catch (err) {
      setMesclagemLog(prev => [...prev, `❌ Erro: ${err}`])
    }

    setCarregandoSugestoes(false)
  }

  // Toggle seleção de uma sugestão
  const toggleSugestaoMesclagem = (index: number) => {
    setSugestoesMesclagem(prev => prev.map((s, i) =>
      i === index ? { ...s, selecionada: !s.selecionada } : s
    ))
  }

  // Selecionar todas sugestões de alta confiança
  const selecionarAltaConfianca = () => {
    setSugestoesMesclagem(prev => prev.map(s => ({
      ...s,
      selecionada: s.confianca === 'alta'
    })))
  }

  // Executar mesclagem das sugestões selecionadas
  const executarMesclagem = async () => {
    const selecionadas = sugestoesMesclagem.filter(s => s.selecionada)

    if (selecionadas.length === 0) {
      setMesclagemLog(prev => [...prev, '⚠️ Selecione ao menos uma sugestão para mesclar'])
      return
    }

    setExecutandoMesclagem(true)
    setMesclagemLog(prev => [...prev, `🔄 Iniciando mesclagem de ${selecionadas.length} grupos...`])

    let sucessos = 0
    let erros = 0

    for (const sugestao of selecionadas) {
      try {
        setMesclagemLog(prev => [...prev, `→ Mesclando para "${sugestao.disciplinaPrincipal.nome}"...`])

        const res = await fetch('/api/admin/mesclar-disciplinas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            disciplinaPrincipalId: sugestao.disciplinaPrincipal.id,
            disciplinasParaMesclarIds: sugestao.disciplinasParaMesclar.map(d => d.id)
          })
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Erro na mesclagem')
        }

        const r = data.resultados
        setMesclagemLog(prev => [
          ...prev,
          `  ✅ ${r.questoesAtualizadas} questões atualizadas`,
          `  ✅ ${r.assuntosMesclados} assuntos movidos`,
          `  ✅ ${r.disciplinasRemovidas} disciplinas removidas`
        ])

        if (r.erros?.length > 0) {
          setMesclagemLog(prev => [...prev, `  ⚠️ ${r.erros.length} erros menores`])
        }

        sucessos++
      } catch (err) {
        setMesclagemLog(prev => [...prev, `  ❌ Erro: ${err}`])
        erros++
      }
    }

    setMesclagemLog(prev => [
      ...prev,
      '',
      `🏁 Mesclagem concluída: ${sucessos} grupos mesclados, ${erros} erros`
    ])

    // Remover sugestões que foram executadas
    setSugestoesMesclagem(prev => prev.filter(s => !s.selecionada))

    // Recarregar estrutura se estiver na aba gerar
    if (estrutura.length > 0) {
      carregarEstrutura()
    }

    setExecutandoMesclagem(false)
  }

  // ========== FUNÇÕES DA ABA SEPARAR DISCIPLINAS ==========

  // Buscar sugestões de separação
  const buscarSugestoesSeparacao = async () => {
    if (!separarDisciplinaOrigem) {
      setSeparacaoLog(['⚠️ Selecione uma disciplina de origem'])
      return
    }

    setCarregandoSeparacao(true)
    setSeparacaoLog([`🔍 Analisando questões de "${separarDisciplinaOrigem}"...`])

    try {
      const res = await fetch(`/api/admin/separar-disciplinas?disciplina=${encodeURIComponent(separarDisciplinaOrigem)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao buscar sugestões')
      }

      setSepararSugestoes(data.sugestoes || [])

      if (data.questoesParaSeparar === 0) {
        setSeparacaoLog(prev => [
          ...prev,
          `✅ Analisadas ${data.totalQuestoes} questões`,
          '📋 Nenhuma questão precisa ser separada'
        ])
      } else {
        setSeparacaoLog(prev => [
          ...prev,
          `✅ Analisadas ${data.totalQuestoes} questões`,
          `📋 ${data.questoesParaSeparar} questões podem ser separadas`,
          ...data.sugestoes.map((s: { novaDisciplina: string; quantidade: number }) =>
            `  → ${s.quantidade} questões para "${s.novaDisciplina}"`
          )
        ])
      }
    } catch (err) {
      setSeparacaoLog(prev => [...prev, `❌ Erro: ${err}`])
    }

    setCarregandoSeparacao(false)
  }

  // Executar separação
  const executarSeparacao = async (novaDisciplina: string) => {
    setExecutandoSeparacao(true)
    setSeparacaoLog(prev => [...prev, `🔄 Separando questões para "${novaDisciplina}"...`])

    try {
      const res = await fetch('/api/admin/separar-disciplinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disciplinaOrigem: separarDisciplinaOrigem,
          novaDisciplina
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao separar')
      }

      const r = data.resultados
      setSeparacaoLog(prev => [
        ...prev,
        r.disciplinaCriada ? `✅ Disciplina "${novaDisciplina}" criada` : `✅ Usando disciplina existente`,
        `✅ ${r.questoesMovidas} questões movidas`
      ])

      // Remover sugestão executada
      setSepararSugestoes(prev => prev.filter(s => s.novaDisciplina !== novaDisciplina))

      // Recarregar estrutura
      if (estrutura.length > 0) {
        carregarEstrutura()
      }
    } catch (err) {
      setSeparacaoLog(prev => [...prev, `❌ Erro: ${err}`])
    }

    setExecutandoSeparacao(false)
  }

  // Criar disciplina manualmente
  const criarDisciplinaManualmente = async () => {
    if (!criarDisciplinaManual.trim()) {
      setSeparacaoLog(prev => [...prev, '⚠️ Digite o nome da disciplina'])
      return
    }

    setSeparacaoLog(prev => [...prev, `🔄 Criando disciplina "${criarDisciplinaManual}"...`])

    try {
      const res = await fetch('/api/admin/separar-disciplinas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: criarDisciplinaManual.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar')
      }

      setSeparacaoLog(prev => [...prev, `✅ ${data.mensagem}`])
      setCriarDisciplinaManual('')

      // Recarregar estrutura
      if (estrutura.length > 0) {
        carregarEstrutura()
      }
    } catch (err) {
      setSeparacaoLog(prev => [...prev, `❌ Erro: ${err}`])
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined text-4xl text-[#137fec] animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return null
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500">admin_panel_settings</span>
          Painel Admin (Temporário)
        </h1>
        <p className="text-sm text-[#9dabb9] mt-1">
          Ferramentas para alimentar e organizar o banco de questões
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[#283039]">
        <button
          onClick={() => setTab('gerar')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'gerar'
              ? 'border-[#137fec] text-[#137fec]'
              : 'border-transparent text-[#9dabb9] hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm mr-1">auto_awesome</span>
          Gerar Questões
        </button>
        <button
          onClick={() => setTab('ver_geradas')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'ver_geradas'
              ? 'border-[#137fec] text-[#137fec]'
              : 'border-transparent text-[#9dabb9] hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm mr-1">visibility</span>
          Ver Geradas ({totalGeradas})
        </button>
        <button
          onClick={() => setTab('organizar')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'organizar'
              ? 'border-[#137fec] text-[#137fec]'
              : 'border-transparent text-[#9dabb9] hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm mr-1">edit_note</span>
          Organizar Assuntos
        </button>
        <button
          onClick={() => setTab('popular')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'popular'
              ? 'border-[#137fec] text-[#137fec]'
              : 'border-transparent text-[#9dabb9] hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm mr-1">cloud_download</span>
          Popular Disciplinas
        </button>
        <button
          onClick={() => setTab('disciplinas')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'disciplinas'
              ? 'border-[#137fec] text-[#137fec]'
              : 'border-transparent text-[#9dabb9] hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm mr-1">find_replace</span>
          Corrigir Disciplinas
        </button>
        <button
          onClick={() => setTab('mesclar')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'mesclar'
              ? 'border-[#137fec] text-[#137fec]'
              : 'border-transparent text-[#9dabb9] hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm mr-1">merge</span>
          Mesclar Disciplinas
        </button>
        <button
          onClick={() => setTab('separar')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'separar'
              ? 'border-[#137fec] text-[#137fec]'
              : 'border-transparent text-[#9dabb9] hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm mr-1">call_split</span>
          Separar Disciplinas
        </button>
      </div>

      {/* Tab: Gerar Questões (REFORMULADA) */}
      {tab === 'gerar' && (
        <div className="space-y-6">
          {/* Seletor em Cascata */}
          <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Selecionar Conteúdo</h2>
              <div className="flex items-center gap-3">
                {carregandoEstrutura && (
                  <span className="material-symbols-outlined text-[#137fec] animate-spin">progress_activity</span>
                )}
                {/* Toggle modo multi */}
                <button
                  onClick={() => {
                    setModoMultiDisciplina(!modoMultiDisciplina)
                    setDisciplinasSelecionadasMulti([])
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                    modoMultiDisciplina
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 dark:bg-[#283039] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3a4550]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {modoMultiDisciplina ? 'checklist' : 'list'}
                  </span>
                  {modoMultiDisciplina ? 'Multi-Seleção' : 'Seleção Única'}
                </button>
              </div>
            </div>

            {/* Modo Multi-Seleção */}
            {modoMultiDisciplina ? (
              <div>
                {/* Botões de ação multi */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={selecionarTodasDisciplinas}
                    className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">select_all</span>
                    Selecionar Todas ({estrutura.length})
                  </button>
                  <button
                    onClick={desselecionarTodasDisciplinas}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-[#283039] hover:bg-gray-300 dark:hover:bg-[#3a4550] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">deselect</span>
                    Limpar
                  </button>
                  {disciplinasSelecionadasMulti.length > 0 && (
                    <button
                      onClick={adicionarDisciplinasMulti}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">playlist_add</span>
                      Adicionar {disciplinasSelecionadasMulti.length} Disciplinas
                    </button>
                  )}
                </div>

                {/* Grid de disciplinas com checkboxes */}
                <div className="max-h-[300px] overflow-y-auto border border-gray-200 dark:border-[#283039] rounded-lg p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {estrutura.map(disc => {
                      const isSelected = disciplinasSelecionadasMulti.includes(disc.nome)
                      const totalItens = disc.assuntos.reduce((acc, ass) =>
                        acc + (ass.subassuntos.length || 1), 0) || 1
                      return (
                        <label
                          key={disc.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                              : 'bg-gray-50 dark:bg-[#141A21] border border-gray-200 dark:border-[#283039] hover:bg-gray-100 dark:hover:bg-[#1a2028]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDisciplinaMulti(disc.nome)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-medium truncate block ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                              {disc.nome}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {disc.assuntos.length} assuntos, ~{totalItens} itens
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {disciplinasSelecionadasMulti.length > 0 && (
                  <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      <strong>{disciplinasSelecionadasMulti.length}</strong> disciplinas selecionadas.
                      Clique em &quot;Adicionar&quot; para criar itens de geração para todos os assuntos e subassuntos.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Seletores em cascata (modo único) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Disciplina */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Disciplina
                    </label>
                    <select
                      value={disciplinaSelecionada}
                      onChange={(e) => {
                        setDisciplinaSelecionada(e.target.value)
                        setAssuntoSelecionado('')
                        setSubassuntoSelecionado('')
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                    >
                      <option value="">Selecione...</option>
                      {estrutura.map(disc => (
                        <option key={disc.id} value={disc.nome}>
                          {disc.nome} ({disc.assuntos.length} assuntos)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assunto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assunto {disciplinaSelecionada && `(${assuntosDaDisciplina.length})`}
                    </label>
                    <select
                      value={assuntoSelecionado}
                      onChange={(e) => {
                        setAssuntoSelecionado(e.target.value)
                        setSubassuntoSelecionado('')
                      }}
                      disabled={!disciplinaSelecionada}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="">Todos os assuntos</option>
                      {assuntosDaDisciplina.map(ass => (
                        <option key={ass.id} value={ass.nome}>
                          {ass.nome} ({ass.subassuntos.length} sub.)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subassunto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subassunto {assuntoSelecionado && `(${subassuntosDoAssunto.length})`}
                    </label>
                    <select
                      value={subassuntoSelecionado}
                      onChange={(e) => setSubassuntoSelecionado(e.target.value)}
                      disabled={!assuntoSelecionado}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="">Todos os subassuntos</option>
                      {subassuntosDoAssunto.map(sub => (
                        <option key={sub.id} value={sub.nome}>
                          {sub.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={adicionarItem}
                    disabled={!disciplinaSelecionada}
                    className="px-4 py-2 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-medium rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Adicionar Item
                  </button>
                  <button
                    onClick={adicionarTodosDaDisciplina}
                    disabled={!disciplinaSelecionada}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">playlist_add</span>
                    Add Todos da Disciplina
                  </button>
                  {itensSelecionados.length > 0 && (
                    <button
                      onClick={() => setItensSelecionados([])}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Limpar Seleção
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Itens Selecionados */}
          {itensSelecionados.length > 0 && (
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Itens Selecionados ({itensSelecionados.length})
              </h2>
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {itensSelecionados.map(item => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-[#141A21] border border-gray-200 dark:border-[#283039]"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[#137fec] font-medium truncate">{item.disciplina}</span>
                      {item.assunto && (
                        <>
                          <span className="text-[#9dabb9]">/</span>
                          <span className="text-gray-700 dark:text-gray-300 truncate">{item.assunto}</span>
                        </>
                      )}
                      {item.subassunto && (
                        <>
                          <span className="text-[#9dabb9]">/</span>
                          <span className="text-gray-500 dark:text-gray-400 truncate text-sm">{item.subassunto}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => removerItem(item.key)}
                      className="text-red-400 hover:text-red-500 p-1"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configurações de Geração */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuração */}
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Configuração de Geração</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banca</label>
                    <select
                      value={bancaSelecionada}
                      onChange={(e) => setBancaSelecionada(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                    >
                      {bancasDisponiveis.map(b => (
                        <option key={b.nome} value={b.nome}>
                          {b.nome} ({b.qtd_questoes} questões)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qtd por Item</label>
                    <input
                      type="number"
                      value={quantidadePorItem}
                      onChange={(e) => setQuantidadePorItem(parseInt(e.target.value) || 10)}
                      min={1}
                      max={500}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modalidade</label>
                    <select
                      value={modalidadeSelecionada}
                      onChange={(e) => setModalidadeSelecionada(e.target.value as typeof modalidadeSelecionada)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                    >
                      <option value="certo_errado">Certo/Errado</option>
                      <option value="multipla_escolha">Múltipla Escolha</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dificuldade</label>
                    <select
                      value={dificuldadeSelecionada}
                      onChange={(e) => setDificuldadeSelecionada(e.target.value as typeof dificuldadeSelecionada)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                    >
                      <option value="facil">Fácil</option>
                      <option value="media">Média</option>
                      <option value="dificil">Difícil</option>
                    </select>
                  </div>
                </div>

                {/* Preview do total */}
                {itensSelecionados.length > 0 && (
                  <div className="p-4 rounded-lg bg-[#137fec]/10 border border-[#137fec]/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#9dabb9]">Total a gerar:</p>
                        <p className="text-2xl font-bold text-[#137fec]">
                          {totalQuestoes.toLocaleString()} questões
                        </p>
                        <p className="text-xs text-[#9dabb9]">
                          ({itensSelecionados.length} itens × {quantidadePorItem} questões)
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-4xl text-[#137fec]/50">quiz</span>
                    </div>
                  </div>
                )}

                {/* Botão Ver Prompt */}
                <button
                  onClick={() => {
                    setPromptAtual(gerarPromptVisualizacao())
                    setMostrarPrompt(true)
                  }}
                  disabled={itensSelecionados.length === 0}
                  className="w-full py-2 bg-gray-200 dark:bg-[#283039] hover:bg-gray-300 dark:hover:bg-[#3a4550] text-gray-700 dark:text-gray-300 font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">code</span>
                  Ver Prompt que será usado
                </button>

                {/* Botão Iniciar Geração */}
                <button
                  onClick={iniciarGeracao}
                  disabled={itensSelecionados.length === 0 || processandoFila}
                  className="w-full py-3 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processandoFila ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Processando Fila...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">auto_awesome</span>
                      Iniciar Geração ({totalQuestoes} questões)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Log */}
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Log de Execução</h2>
              <div className="bg-gray-900 rounded-lg p-4 h-[350px] overflow-y-auto font-mono text-sm">
                {gerarLog.length === 0 ? (
                  <p className="text-gray-500">Aguardando execução...</p>
                ) : (
                  gerarLog.map((log, i) => (
                    <p key={i} className="text-green-400">{log}</p>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Modal do Prompt */}
          {mostrarPrompt && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Prompt de Geração</h3>
                  <button
                    onClick={() => setMostrarPrompt(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <pre className="bg-gray-900 rounded-lg p-4 text-sm text-green-400 whitespace-pre-wrap font-mono overflow-x-auto">
                  {promptAtual}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Ver Questões Geradas */}
      {tab === 'ver_geradas' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Questões Geradas por IA ({totalGeradas})
              </h2>
              {carregandoGeradas && (
                <span className="material-symbols-outlined text-[#137fec] animate-spin">progress_activity</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Filtro Disciplina */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disciplina</label>
                <select
                  value={filtroGeradasDisciplina}
                  onChange={(e) => { setFiltroGeradasDisciplina(e.target.value); setPaginaGeradas(1) }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                >
                  <option value="">Todas</option>
                  {disciplinasGeradasDisponiveis.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Modalidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modalidade</label>
                <select
                  value={filtroGeradasModalidade}
                  onChange={(e) => { setFiltroGeradasModalidade(e.target.value); setPaginaGeradas(1) }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                >
                  <option value="">Todas</option>
                  <option value="certo_errado">Certo/Errado</option>
                  <option value="multipla_escolha_5">Múltipla Escolha</option>
                </select>
              </div>

              {/* Filtro Banca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banca</label>
                <input
                  type="text"
                  value={filtroGeradasBanca}
                  onChange={(e) => { setFiltroGeradasBanca(e.target.value); setPaginaGeradas(1) }}
                  placeholder="Ex: CESPE"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                />
              </div>

              {/* Botão Atualizar */}
              <div className="flex items-end">
                <button
                  onClick={carregarQuestoesGeradas}
                  className="px-4 py-2 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Atualizar
                </button>
              </div>
            </div>

            {/* Ações em massa */}
            {questoesGeradas.length > 0 && (
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-[#283039]">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={questoesSelecionadasParaDeletar.length === questoesGeradas.length && questoesGeradas.length > 0}
                    onChange={toggleSelecionarTodas}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  Selecionar todas da página
                </label>

                {questoesSelecionadasParaDeletar.length > 0 && (
                  <button
                    onClick={deletarQuestoesSelecionadas}
                    disabled={deletandoQuestoes}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {deletandoQuestoes ? (
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">delete</span>
                    )}
                    Deletar Selecionadas ({questoesSelecionadasParaDeletar.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Lista de Questões */}
          <div className="space-y-4">
            {questoesGeradas.length === 0 ? (
              <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4">quiz</span>
                <p className="text-[#9dabb9]">Nenhuma questão gerada por IA encontrada</p>
                <p className="text-sm text-[#9dabb9] mt-1">Use a aba &quot;Gerar Questões&quot; para criar novas questões</p>
              </div>
            ) : (
              questoesGeradas.map((questao) => (
                <div
                  key={questao.id}
                  className={`bg-white dark:bg-[#1C252E] rounded-xl border ${
                    questoesSelecionadasParaDeletar.includes(questao.id)
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                      : 'border-gray-200 dark:border-[#283039]'
                  } p-4`}
                >
                  {/* Header da questão */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={questoesSelecionadasParaDeletar.includes(questao.id)}
                      onChange={() => toggleSelecionarQuestao(questao.id)}
                      className="w-4 h-4 rounded border-gray-300 mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#137fec]/10 text-[#137fec]">
                          {questao.disciplina}
                        </span>
                        {questao.assunto && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-[#283039] text-gray-700 dark:text-gray-300">
                            {questao.assunto}
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          {questao.banca}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                          {questao.modalidade === 'certo_errado' ? 'C/E' : 'ME'}
                        </span>
                      </div>

                      {/* Enunciado */}
                      <p className={`text-gray-900 dark:text-white ${questaoExpandida === questao.id ? '' : 'line-clamp-2'}`}>
                        {questao.enunciado}
                      </p>

                      {/* Conteúdo expandido */}
                      {questaoExpandida === questao.id && (
                        <div className="mt-4 space-y-4">
                          {/* Alternativas (se múltipla escolha) */}
                          {questao.alternativa_a && (
                            <div className="space-y-2">
                              <p className={`text-sm ${questao.gabarito === 'A' ? 'text-green-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                A) {questao.alternativa_a}
                              </p>
                              <p className={`text-sm ${questao.gabarito === 'B' ? 'text-green-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                B) {questao.alternativa_b}
                              </p>
                              <p className={`text-sm ${questao.gabarito === 'C' ? 'text-green-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                C) {questao.alternativa_c}
                              </p>
                              <p className={`text-sm ${questao.gabarito === 'D' ? 'text-green-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                D) {questao.alternativa_d}
                              </p>
                              <p className={`text-sm ${questao.gabarito === 'E' ? 'text-green-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                E) {questao.alternativa_e}
                              </p>
                            </div>
                          )}

                          {/* Gabarito */}
                          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                              Gabarito: {questao.gabarito}
                            </p>
                          </div>

                          {/* Comentário */}
                          <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#141A21]">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentário:</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{questao.comentario}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuestaoExpandida(questaoExpandida === questao.id ? null : questao.id)}
                        className="p-2 text-[#9dabb9] hover:text-[#137fec] hover:bg-gray-100 dark:hover:bg-[#283039] rounded-lg"
                        title={questaoExpandida === questao.id ? 'Recolher' : 'Expandir'}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {questaoExpandida === questao.id ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                      <button
                        onClick={() => deletarQuestao(questao.id)}
                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Deletar questão"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Paginação */}
          {totalPaginasGeradas > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPaginaGeradas(p => Math.max(1, p - 1))}
                disabled={paginaGeradas === 1}
                className="px-3 py-2 bg-gray-100 dark:bg-[#283039] text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>

              <span className="text-sm text-gray-700 dark:text-gray-300">
                Página {paginaGeradas} de {totalPaginasGeradas}
              </span>

              <button
                onClick={() => setPaginaGeradas(p => Math.min(totalPaginasGeradas, p + 1))}
                disabled={paginaGeradas === totalPaginasGeradas}
                className="px-3 py-2 bg-gray-100 dark:bg-[#283039] text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Organizar Assuntos */}
      {tab === 'organizar' && (
        <div className="space-y-6">
          {/* Controles */}
          <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Organizar Assuntos com IA</h2>
            <p className="text-sm text-[#9dabb9] mb-4">
              A IA vai analisar o enunciado e comentário de cada questão para sugerir o assunto correto.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={carregarQuestoesProblematicas}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">search</span>
                Buscar Questões Problemáticas
              </button>

              <button
                onClick={analisarQuestoesComIA}
                disabled={analisando || questoesParaAnalisar.length === 0}
                className="px-4 py-2 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {analisando ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Analisando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">psychology</span>
                    Analisar com IA ({questoesParaAnalisar.length})
                  </>
                )}
              </button>

              {analisesAssuntos.length > 0 && (
                <>
                  <button
                    onClick={selecionarTodos}
                    className="px-4 py-2 bg-gray-200 dark:bg-[#283039] hover:bg-gray-300 dark:hover:bg-[#3a4550] text-gray-700 dark:text-gray-300 font-medium rounded-lg"
                  >
                    Selecionar Todos
                  </button>
                  <button
                    onClick={desselecionarTodos}
                    className="px-4 py-2 bg-gray-200 dark:bg-[#283039] hover:bg-gray-300 dark:hover:bg-[#3a4550] text-gray-700 dark:text-gray-300 font-medium rounded-lg"
                  >
                    Desselecionar
                  </button>
                  <button
                    onClick={aplicarCorrecoes}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    Aplicar Selecionados ({analisesAssuntos.filter(a => a.selecionado).length})
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Log e Análises */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Log */}
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Log</h3>
              <div className="bg-gray-900 rounded-lg p-4 h-[300px] overflow-y-auto font-mono text-sm">
                {organizarLog.map((log, i) => (
                  <p key={i} className="text-green-400">{log}</p>
                ))}
              </div>
            </div>

            {/* Análises */}
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                Sugestões ({analisesAssuntos.length})
              </h3>
              <div className="h-[300px] overflow-y-auto space-y-2">
                {analisesAssuntos.map((analise) => (
                  <label
                    key={analise.questaoId}
                    className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                      analise.selecionado
                        ? 'border-[#137fec] bg-[#137fec]/10'
                        : 'border-gray-200 dark:border-[#283039] hover:bg-gray-50 dark:hover:bg-[#283039]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={analise.selecionado}
                        onChange={() => toggleAnalise(analise.questaoId)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        {/* Disciplina */}
                        <p className="text-xs mb-1">
                          <span className="text-[#9dabb9]">Disciplina: </span>
                          {analise.disciplinaSugerida && analise.disciplinaSugerida !== analise.disciplinaAtual ? (
                            <>
                              {analise.disciplinaAtual ? (
                                <span className="text-red-400 line-through">{analise.disciplinaAtual}</span>
                              ) : (
                                <span className="text-red-400 italic">(vazia)</span>
                              )}
                              <span className="mx-1 text-[#9dabb9]">→</span>
                              <span className="text-emerald-400">{analise.disciplinaSugerida}</span>
                            </>
                          ) : analise.disciplinaAtual ? (
                            <span className="text-white">{analise.disciplinaAtual}</span>
                          ) : analise.disciplinaSugerida ? (
                            <>
                              <span className="text-red-400 italic">(vazia)</span>
                              <span className="mx-1 text-[#9dabb9]">→</span>
                              <span className="text-emerald-400">{analise.disciplinaSugerida}</span>
                            </>
                          ) : (
                            <span className="text-red-400 italic">(não identificada)</span>
                          )}
                        </p>

                        {/* Assunto */}
                        <p className="text-sm">
                          <span className="text-[#9dabb9]">Assunto: </span>
                          <span className="text-red-400 line-through">{analise.assuntoAtual}</span>
                          <span className="mx-2 text-[#9dabb9]">→</span>
                          <span className="text-emerald-400 font-medium">{analise.assuntoSugerido}</span>
                        </p>

                        {/* Subassunto */}
                        {analise.subassuntoSugerido && (
                          <p className="text-xs mt-1">
                            <span className="text-[#9dabb9]">Subassunto: </span>
                            <span className="text-cyan-400">{analise.subassuntoSugerido}</span>
                          </p>
                        )}

                        <p className="text-xs text-[#9dabb9] truncate mt-2">{analise.enunciado.slice(0, 100)}...</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Popular Disciplinas */}
      {tab === 'popular' && (
        <div className="space-y-6">
          {/* Controles */}
          <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Popular Disciplinas/Assuntos</h2>
            <p className="text-sm text-[#9dabb9] mb-4">
              A IA vai pesquisar disciplinas, assuntos e subassuntos que caem nos concursos públicos do Brasil (2025).
            </p>

            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Concurso Específico (opcional)
                </label>
                <input
                  type="text"
                  value={concursoAlvo}
                  onChange={(e) => setConcursoAlvo(e.target.value)}
                  placeholder="Ex: TRF, TRT, Polícia Federal, Receita Federal..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                />
              </div>

              <button
                onClick={buscarDisciplinasConcursos}
                disabled={buscandoDisciplinas}
                className="px-4 py-2 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {buscandoDisciplinas ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Buscando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">cloud_download</span>
                    Buscar Disciplinas
                  </>
                )}
              </button>

              {disciplinasPopular.length > 0 && (
                <button
                  onClick={inserirDisciplinasNoBanco}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">database</span>
                  Inserir no Banco
                </button>
              )}
            </div>
          </div>

          {/* Log e Disciplinas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Log */}
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Log</h3>
              <div className="bg-gray-900 rounded-lg p-4 h-[400px] overflow-y-auto font-mono text-sm">
                {popularLog.map((log, i) => (
                  <p key={i} className="text-green-400">{log}</p>
                ))}
              </div>
            </div>

            {/* Disciplinas encontradas */}
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                Disciplinas Encontradas ({disciplinasPopular.length})
              </h3>
              <div className="h-[400px] overflow-y-auto space-y-3">
                {disciplinasPopular.map((disc, i) => (
                  <div key={i} className="p-3 rounded-lg border border-gray-200 dark:border-[#283039]">
                    <p className="font-medium text-[#137fec]">{disc.nome}</p>
                    <div className="mt-2 space-y-1">
                      {disc.assuntos.slice(0, 5).map((ass, j) => (
                        <div key={j} className="text-sm">
                          <span className="text-gray-700 dark:text-gray-300">• {ass.nome}</span>
                          {ass.subassuntos.length > 0 && (
                            <span className="text-xs text-[#9dabb9] ml-2">
                              ({ass.subassuntos.length} subassuntos)
                            </span>
                          )}
                        </div>
                      ))}
                      {disc.assuntos.length > 5 && (
                        <p className="text-xs text-[#9dabb9]">
                          +{disc.assuntos.length - 5} assuntos...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Corrigir Disciplinas */}
      {tab === 'disciplinas' && (
        <div className="space-y-6">
          {/* Controles */}
          <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Corrigir Disciplinas Vazias</h2>
            <p className="text-sm text-[#9dabb9] mb-4">
              A IA vai analisar o enunciado, assunto e subassunto de cada questão sem disciplina para sugerir a disciplina correta.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={buscarQuestoesSemDisciplina}
                disabled={buscandoSemDisciplina}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {buscandoSemDisciplina ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Buscando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">search</span>
                    Buscar Questões sem Disciplina
                  </>
                )}
              </button>

              <button
                onClick={analisarDisciplinasComIA}
                disabled={analisandoDisciplinas || questoesSemDisciplina.length === 0}
                className="px-4 py-2 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {analisandoDisciplinas ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Analisando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">psychology</span>
                    Analisar com IA ({questoesSemDisciplina.length})
                  </>
                )}
              </button>

              {sugestoesDisciplina.length > 0 && (
                <>
                  <button
                    onClick={selecionarTodosDisciplinas}
                    className="px-4 py-2 bg-gray-200 dark:bg-[#283039] hover:bg-gray-300 dark:hover:bg-[#3a4550] text-gray-700 dark:text-gray-300 font-medium rounded-lg"
                  >
                    Selecionar Todos
                  </button>
                  <button
                    onClick={desselecionarTodosDisciplinas}
                    className="px-4 py-2 bg-gray-200 dark:bg-[#283039] hover:bg-gray-300 dark:hover:bg-[#3a4550] text-gray-700 dark:text-gray-300 font-medium rounded-lg"
                  >
                    Desselecionar
                  </button>
                  <button
                    onClick={aplicarCorrecoesDisciplinas}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    Aplicar Selecionados ({sugestoesDisciplina.filter(s => s.selecionado).length})
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Log e Sugestões */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Log */}
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Log</h3>
              <div className="bg-gray-900 rounded-lg p-4 h-[300px] overflow-y-auto font-mono text-sm">
                {disciplinaLog.length === 0 ? (
                  <p className="text-gray-500">Clique em &quot;Buscar Questões sem Disciplina&quot; para começar...</p>
                ) : (
                  disciplinaLog.map((log, i) => (
                    <p key={i} className="text-green-400">{log}</p>
                  ))
                )}
              </div>
            </div>

            {/* Sugestões */}
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                Sugestões de Disciplina ({sugestoesDisciplina.length})
              </h3>
              <div className="h-[300px] overflow-y-auto space-y-2">
                {sugestoesDisciplina.length === 0 ? (
                  <p className="text-[#9dabb9] text-sm">Nenhuma sugestão ainda. Execute a análise com IA.</p>
                ) : (
                  sugestoesDisciplina.map((sugestao) => (
                    <label
                      key={sugestao.questaoId}
                      className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                        sugestao.selecionado
                          ? 'border-[#137fec] bg-[#137fec]/10'
                          : 'border-gray-200 dark:border-[#283039] hover:bg-gray-50 dark:hover:bg-[#283039]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={sugestao.selecionado}
                          onChange={() => toggleSugestaoDisciplina(sugestao.questaoId)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          {/* Disciplina sugerida */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-emerald-400 font-medium">{sugestao.disciplinaSugerida}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              sugestao.confianca === 'alta' ? 'bg-green-500/20 text-green-400' :
                              sugestao.confianca === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {sugestao.confianca}
                            </span>
                          </div>

                          {/* Assunto atual */}
                          {sugestao.assuntoAtual && (
                            <p className="text-xs text-[#9dabb9]">
                              <span className="text-gray-500">Assunto: </span>
                              {sugestao.assuntoAtual}
                            </p>
                          )}

                          {/* Motivo */}
                          <p className="text-xs text-cyan-400 mt-1">{sugestao.motivo}</p>

                          {/* Enunciado truncado */}
                          <p className="text-xs text-[#9dabb9] truncate mt-2">{sugestao.enunciado.slice(0, 100)}...</p>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Mesclar Disciplinas */}
      {tab === 'mesclar' && (
        <div className="space-y-6">
          {/* Controles */}
          <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Mesclar Disciplinas Duplicadas</h2>
            <p className="text-sm text-[#9dabb9] mb-4">
              A IA analisa suas disciplinas e identifica duplicatas ou similares (ex: &quot;Raciocínio Lógico&quot; e &quot;Raciocínio Lógico-Matemático&quot;).
              Você pode revisar as sugestões e aprovar apenas as que desejar mesclar.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={buscarSugestoesMesclagem}
                disabled={carregandoSugestoes}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {carregandoSugestoes ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Analisando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">psychology</span>
                    Detectar Duplicatas com IA
                  </>
                )}
              </button>

              {sugestoesMesclagem.length > 0 && (
                <>
                  <button
                    onClick={selecionarAltaConfianca}
                    className="px-4 py-2 bg-gray-200 dark:bg-[#283039] hover:bg-gray-300 dark:hover:bg-[#3a4550] text-gray-700 dark:text-gray-300 font-medium rounded-lg"
                  >
                    Selecionar Alta Confiança
                  </button>
                  <button
                    onClick={() => setSugestoesMesclagem(prev => prev.map(s => ({ ...s, selecionada: false })))}
                    className="px-4 py-2 bg-gray-200 dark:bg-[#283039] hover:bg-gray-300 dark:hover:bg-[#3a4550] text-gray-700 dark:text-gray-300 font-medium rounded-lg"
                  >
                    Desselecionar Todos
                  </button>
                  <button
                    onClick={executarMesclagem}
                    disabled={executandoMesclagem || sugestoesMesclagem.filter(s => s.selecionada).length === 0}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {executandoMesclagem ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        Mesclando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">merge</span>
                        Mesclar Selecionadas ({sugestoesMesclagem.filter(s => s.selecionada).length})
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Log e Sugestões */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Log */}
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Log</h3>
              <div className="bg-gray-900 rounded-lg p-4 h-[400px] overflow-y-auto font-mono text-sm">
                {mesclagemLog.length === 0 ? (
                  <p className="text-gray-500">Clique em &quot;Detectar Duplicatas com IA&quot; para começar...</p>
                ) : (
                  mesclagemLog.map((log, i) => (
                    <p key={i} className={`${
                      log.startsWith('❌') ? 'text-red-400' :
                      log.startsWith('✅') ? 'text-green-400' :
                      log.startsWith('⚠️') ? 'text-yellow-400' :
                      log.startsWith('🔍') || log.startsWith('🔄') ? 'text-cyan-400' :
                      log.startsWith('→') ? 'text-blue-400' :
                      log.startsWith('🏁') ? 'text-emerald-400' :
                      log.startsWith('📊') ? 'text-purple-400' :
                      'text-gray-400'
                    }`}>{log}</p>
                  ))
                )}
              </div>
            </div>

            {/* Sugestões de Mesclagem */}
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                Sugestões de Mesclagem ({sugestoesMesclagem.length})
              </h3>
              <div className="h-[400px] overflow-y-auto space-y-3">
                {sugestoesMesclagem.length === 0 ? (
                  <p className="text-[#9dabb9] text-sm">Nenhuma sugestão ainda. Execute a análise com IA.</p>
                ) : (
                  sugestoesMesclagem.map((sugestao, index) => (
                    <label
                      key={index}
                      className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                        sugestao.selecionada
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-200 dark:border-[#283039] hover:bg-gray-50 dark:hover:bg-[#283039]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={sugestao.selecionada}
                          onChange={() => toggleSugestaoMesclagem(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          {/* Principal */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-emerald-400 font-bold text-sm">
                              {sugestao.disciplinaPrincipal.nome}
                            </span>
                            <span className="text-xs text-[#9dabb9]">
                              ({sugestao.disciplinaPrincipal.qtd_questoes} questões)
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              sugestao.confianca === 'alta' ? 'bg-green-500/20 text-green-400' :
                              sugestao.confianca === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {sugestao.confianca}
                            </span>
                          </div>

                          {/* Para mesclar */}
                          <div className="text-xs text-[#9dabb9] mb-2">
                            <span className="text-gray-500">Mesclar: </span>
                            {sugestao.disciplinasParaMesclar.map((d, i) => (
                              <span key={d.id}>
                                <span className="text-red-400">{d.nome}</span>
                                <span className="text-gray-600"> ({d.qtd_questoes})</span>
                                {i < sugestao.disciplinasParaMesclar.length - 1 && ', '}
                              </span>
                            ))}
                          </div>

                          {/* Motivo */}
                          <p className="text-xs text-cyan-400">{sugestao.motivo}</p>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Info sobre disciplinas */}
          {todasDisciplinas.length > 0 && (
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                Todas as Disciplinas ({todasDisciplinas.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {todasDisciplinas.slice(0, 50).map(d => (
                  <span
                    key={d.id}
                    className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-[#283039] text-gray-700 dark:text-gray-300"
                  >
                    {d.nome} <span className="text-[#9dabb9]">({d.qtd_questoes})</span>
                  </span>
                ))}
                {todasDisciplinas.length > 50 && (
                  <span className="text-xs text-[#9dabb9]">
                    +{todasDisciplinas.length - 50} mais...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Separar Disciplinas */}
      {tab === 'separar' && (
        <div className="space-y-6">
          {/* Descrição */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-yellow-500">warning</span>
              <div>
                <h3 className="text-sm font-bold text-yellow-500 mb-1">Ferramenta de Correção</h3>
                <p className="text-sm text-[#9dabb9]">
                  Use esta ferramenta para separar questões que foram mescladas incorretamente.
                  Por exemplo, separar &quot;Direito Penal Militar&quot; de &quot;Direito Penal&quot;.
                </p>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Analisar Disciplina</h2>

            <div className="flex gap-4 items-end">
              {/* Seletor de disciplina origem */}
              <div className="flex-1">
                <label className="block text-sm text-[#9dabb9] mb-2">Disciplina de Origem</label>
                <select
                  value={separarDisciplinaOrigem}
                  onChange={(e) => setSepararDisciplinaOrigem(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-[#283039] text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-[#137fec]"
                >
                  <option value="">Selecione a disciplina...</option>
                  {estrutura.map((d) => (
                    <option key={d.id} value={d.nome}>{d.nome}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={buscarSugestoesSeparacao}
                disabled={carregandoSeparacao || !separarDisciplinaOrigem}
                className="px-6 py-2.5 bg-[#137fec] text-white rounded-lg font-medium hover:bg-[#0f6fd3] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {carregandoSeparacao ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">search</span>
                )}
                Analisar
              </button>
            </div>
          </div>

          {/* Sugestões de separação */}
          {separarSugestoes.length > 0 && (
            <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">
                Questões para Separar ({separarSugestoes.reduce((acc, s) => acc + s.quantidade, 0)})
              </h3>

              <div className="space-y-4">
                {separarSugestoes.map((sugestao) => (
                  <div
                    key={sugestao.novaDisciplina}
                    className="bg-gray-50 dark:bg-[#283039] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-white font-medium">{sugestao.novaDisciplina}</span>
                        <span className="text-[#9dabb9] ml-2">({sugestao.quantidade} questões)</span>
                      </div>
                      <button
                        onClick={() => executarSeparacao(sugestao.novaDisciplina)}
                        disabled={executandoSeparacao}
                        className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">call_split</span>
                        Separar
                      </button>
                    </div>

                    {/* Exemplos de questões */}
                    <div className="space-y-2">
                      {sugestao.questoes.slice(0, 3).map((q) => (
                        <div key={q.id} className="text-xs text-[#9dabb9] border-l-2 border-[#137fec] pl-2">
                          <span className="text-cyan-400">[{q.termoEncontrado}]</span>{' '}
                          {q.enunciado}
                        </div>
                      ))}
                      {sugestao.questoes.length > 3 && (
                        <p className="text-xs text-[#9dabb9]">
                          +{sugestao.questoes.length - 3} questões mais...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Criar disciplina manualmente */}
          <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
            <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">
              Criar Disciplina Manualmente
            </h3>
            <p className="text-sm text-[#9dabb9] mb-4">
              Se a disciplina que você precisa não existe, crie-a aqui primeiro.
            </p>

            <div className="flex gap-4">
              <input
                type="text"
                value={criarDisciplinaManual}
                onChange={(e) => setCriarDisciplinaManual(e.target.value)}
                placeholder="Ex: Direito Penal Militar"
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-[#283039] text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-[#137fec]"
              />
              <button
                onClick={criarDisciplinaManualmente}
                disabled={!criarDisciplinaManual.trim()}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Criar
              </button>
            </div>
          </div>

          {/* Log de operações */}
          {separacaoLog.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#9dabb9]">Log de operações</span>
                <button
                  onClick={() => setSeparacaoLog([])}
                  className="text-xs text-[#9dabb9] hover:text-white"
                >
                  Limpar
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {separacaoLog.map((log, i) => (
                  <div key={i} className="text-gray-300">{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notificação flutuante de processamento em background (Organizar/Disciplinas) */}
      {(bgProcesso.ativo || bgProcessoDisciplina.ativo) && (
        <div className="fixed bottom-4 right-4 bg-[#1a1f25] border border-[#283039] rounded-lg shadow-xl p-4 min-w-[280px] z-50">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-[#137fec] animate-spin">progress_activity</span>
            <span className="text-sm font-medium text-white">
              {bgProcesso.ativo ? 'Analisando assuntos...' : 'Identificando disciplinas...'}
            </span>
          </div>

          {/* Barra de progresso */}
          <div className="w-full bg-[#283039] rounded-full h-2 mb-2">
            <div
              className="bg-[#137fec] h-2 rounded-full transition-all duration-300"
              style={{
                width: `${bgProcesso.ativo
                  ? (bgProcesso.atual / bgProcesso.total) * 100
                  : (bgProcessoDisciplina.atual / bgProcessoDisciplina.total) * 100}%`
              }}
            />
          </div>

          {/* Contadores */}
          <div className="flex justify-between text-xs text-[#9dabb9]">
            <span>
              {bgProcesso.ativo
                ? `${bgProcesso.atual} / ${bgProcesso.total}`
                : `${bgProcessoDisciplina.atual} / ${bgProcessoDisciplina.total}`}
            </span>
            <span className="flex gap-2">
              <span className="text-green-400">
                ✓ {bgProcesso.ativo ? bgProcesso.sucessos : bgProcessoDisciplina.sucessos}
              </span>
              {(bgProcesso.ativo ? bgProcesso.erros : bgProcessoDisciplina.erros) > 0 && (
                <span className="text-red-400">
                  ✗ {bgProcesso.ativo ? bgProcesso.erros : bgProcessoDisciplina.erros}
                </span>
              )}
            </span>
          </div>

          {/* Estimativa de tempo */}
          <div className="text-xs text-[#9dabb9] mt-1">
            ~{Math.ceil(((bgProcesso.ativo
              ? bgProcesso.total - bgProcesso.atual
              : bgProcessoDisciplina.total - bgProcessoDisciplina.atual) * 2) / 60)} min restantes
          </div>
        </div>
      )}

      {/* Notificação flutuante de geração movida para GeracaoFilaGlobal no layout */}
    </div>
  )
}
