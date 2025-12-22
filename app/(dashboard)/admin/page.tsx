'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Email autorizado para acessar a página admin
const ADMIN_EMAIL = 'brunodivinoa@gmail.com'

type TabType = 'gerar' | 'organizar' | 'popular' | 'disciplinas'

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

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<TabType>('gerar')

  // Estado de geração de questões
  const [gerarConfig, setGerarConfig] = useState({
    disciplina: '',
    assunto: '',
    banca: 'CESPE',
    quantidade: 10,
    modalidade: 'multipla_escolha' as 'multipla_escolha' | 'certo_errado' | 'mista',
    dificuldade: 'media' as 'facil' | 'media' | 'dificil'
  })
  const [gerando, setGerando] = useState(false)
  const [gerarLog, setGerarLog] = useState<string[]>([])

  // Estado de organização de assuntos
  const [questoesParaAnalisar, setQuestoesParaAnalisar] = useState<Questao[]>([])
  const [analisesAssuntos, setAnalisesAssuntos] = useState<AssuntoAnalise[]>([])
  const [analisando, setAnalisando] = useState(false)
  const [filtroAssunto, setFiltroAssunto] = useState('')
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

  // Verificar acesso
  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

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

    let sucesso = 0
    for (const analise of selecionados) {
      // Atualizar disciplina, assunto e subassunto
      const updateData: Record<string, string> = {
        assunto: analise.assuntoSugerido
      }

      // Atualizar disciplina se foi sugerida (mesmo se atual estiver vazia)
      if (analise.disciplinaSugerida) {
        updateData.disciplina = analise.disciplinaSugerida
      }

      // Atualizar subassunto se foi sugerido
      if (analise.subassuntoSugerido) {
        updateData.subassunto = analise.subassuntoSugerido
      }

      const { error } = await supabase
        .from('questoes')
        .update(updateData)
        .eq('id', analise.questaoId)

      if (!error) sucesso++
    }

    setOrganizarLog(prev => [...prev, `✅ ${sucesso} questões atualizadas (disciplina, assunto e subassunto)!`])

    // Limpar selecionados
    setAnalisesAssuntos(prev => prev.filter(a => !a.selecionado))
  }

  // Gerar questões em massa
  const gerarQuestoesEmMassa = async () => {
    if (!gerarConfig.disciplina) {
      setGerarLog(prev => [...prev, '⚠️ Selecione uma disciplina'])
      return
    }

    setGerando(true)
    setGerarLog(prev => [...prev, `🤖 Gerando ${gerarConfig.quantidade} questões de ${gerarConfig.disciplina}...`])

    try {
      const response = await fetch('/api/admin/gerar-questoes-massa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gerarConfig)
      })

      if (response.ok) {
        const resultado = await response.json()
        setGerarLog(prev => [...prev, `✅ ${resultado.inseridas} questões geradas e inseridas!`])
      } else {
        const erro = await response.json()
        setGerarLog(prev => [...prev, `❌ Erro: ${erro.error}`])
      }
    } catch (err) {
      setGerarLog(prev => [...prev, `❌ Erro: ${err}`])
    }

    setGerando(false)
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

    let sucesso = 0
    for (const sugestao of selecionados) {
      const { error } = await supabase
        .from('questoes')
        .update({ disciplina: sugestao.disciplinaSugerida })
        .eq('id', sugestao.questaoId)

      if (!error) sucesso++
    }

    setDisciplinaLog(prev => [...prev, `✅ ${sucesso} questões atualizadas com a disciplina correta!`])

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
      </div>

      {/* Tab: Gerar Questões */}
      {tab === 'gerar' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuração */}
          <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Configuração</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disciplina</label>
                <input
                  type="text"
                  value={gerarConfig.disciplina}
                  onChange={(e) => setGerarConfig(prev => ({ ...prev, disciplina: e.target.value }))}
                  placeholder="Ex: Direito Constitucional"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assunto (opcional)</label>
                <input
                  type="text"
                  value={gerarConfig.assunto}
                  onChange={(e) => setGerarConfig(prev => ({ ...prev, assunto: e.target.value }))}
                  placeholder="Ex: Princípios Fundamentais"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banca</label>
                  <select
                    value={gerarConfig.banca}
                    onChange={(e) => setGerarConfig(prev => ({ ...prev, banca: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                  >
                    <option value="CESPE">CESPE/CEBRASPE</option>
                    <option value="FCC">FCC</option>
                    <option value="FGV">FGV</option>
                    <option value="VUNESP">VUNESP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade</label>
                  <input
                    type="number"
                    value={gerarConfig.quantidade}
                    onChange={(e) => setGerarConfig(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 10 }))}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modalidade</label>
                  <select
                    value={gerarConfig.modalidade}
                    onChange={(e) => setGerarConfig(prev => ({ ...prev, modalidade: e.target.value as typeof gerarConfig.modalidade }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                  >
                    <option value="multipla_escolha">Múltipla Escolha</option>
                    <option value="certo_errado">Certo/Errado</option>
                    <option value="mista">Mista</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dificuldade</label>
                  <select
                    value={gerarConfig.dificuldade}
                    onChange={(e) => setGerarConfig(prev => ({ ...prev, dificuldade: e.target.value as typeof gerarConfig.dificuldade }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white"
                  >
                    <option value="facil">Fácil</option>
                    <option value="media">Média</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>

              <button
                onClick={gerarQuestoesEmMassa}
                disabled={gerando}
                className="w-full py-3 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {gerando ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Gerando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    Gerar Questões
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Log */}
          <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Log de Execução</h2>
            <div className="bg-gray-900 rounded-lg p-4 h-[400px] overflow-y-auto font-mono text-sm">
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

      {/* Notificação flutuante de processamento em background */}
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
    </div>
  )
}
