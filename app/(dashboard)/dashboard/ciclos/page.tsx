'use client'
import { Header } from '@/components/layout/Header'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useEstudo } from '@/contexts/EstudoContext'
import { useCiclosEstudo, CicloItem } from '@/hooks/useCiclosEstudo'
import { IniciarSessaoModal, SeletorDisciplina } from '@/components/estudo'

// Cores para os itens do ciclo
const CORES = ['blue', 'purple', 'green', 'orange', 'pink', 'teal', 'red', 'yellow']
const ICONES = ['menu_book', 'functions', 'science', 'biotech', 'public', 'history_edu', 'gavel', 'psychology']

export default function CiclosPage() {
  const { user, loading: authLoading } = useAuth()
  const { temSessaoAtiva, sessaoAtiva, tempoDecorrido, formatarTempo } = useEstudo()
  const {
    ciclos,
    cicloAtual,
    loading,
    buscarCiclos,
    buscarCicloEmProgresso,
    criarCiclo,
    excluirCiclo,
    pausarCiclo,
    retomarCiclo,
    concluirCiclo,
    calcularProgressoCiclo,
    calcularDiasRestantes
  } = useCiclosEstudo()

  const [showCriarModal, setShowCriarModal] = useState(false)
  const [showIniciarSessao, setShowIniciarSessao] = useState(false)
  const [itemSelecionado, setItemSelecionado] = useState<CicloItem | null>(null)

  // Form state para criar ciclo
  const [formNome, setFormNome] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formDuracaoDias, setFormDuracaoDias] = useState(7)
  const [formHorasPlanejadas, setFormHorasPlanejadas] = useState(40)
  const [formItens, setFormItens] = useState<{
    disciplina_id: string
    disciplina_nome?: string
    assunto_id?: string
    assunto_nome?: string
    horas_meta: number
    cor: string
    icone: string
  }[]>([])

  // Carregar dados
  useEffect(() => {
    if (!authLoading && user) {
      buscarCicloEmProgresso()
      buscarCiclos()
    }
  }, [authLoading, user, buscarCicloEmProgresso, buscarCiclos])

  const handleIniciarSessao = (item: CicloItem) => {
    setItemSelecionado(item)
    setShowIniciarSessao(true)
  }

  const handleAdicionarItem = (selecao: { disciplina_id?: string; disciplina_nome?: string; assunto_id?: string; assunto_nome?: string }) => {
    if (!selecao.disciplina_id) return

    // Verificar se já existe
    const existe = formItens.find(i =>
      i.disciplina_id === selecao.disciplina_id &&
      i.assunto_id === selecao.assunto_id
    )
    if (existe) return

    setFormItens([...formItens, {
      disciplina_id: selecao.disciplina_id,
      disciplina_nome: selecao.disciplina_nome,
      assunto_id: selecao.assunto_id,
      assunto_nome: selecao.assunto_nome,
      horas_meta: 10,
      cor: CORES[formItens.length % CORES.length],
      icone: ICONES[formItens.length % ICONES.length]
    }])
  }

  const handleRemoverItem = (index: number) => {
    setFormItens(formItens.filter((_, i) => i !== index))
  }

  const handleCriarCiclo = async () => {
    if (!formNome || formItens.length === 0) return

    const novoCiclo = await criarCiclo({
      nome: formNome,
      descricao: formDescricao,
      duracao_dias: formDuracaoDias,
      horas_planejadas: formHorasPlanejadas,
      itens: formItens.map((item, index) => ({
        disciplina_id: item.disciplina_id,
        assunto_id: item.assunto_id,
        nome_display: item.disciplina_nome + (item.assunto_nome ? ` - ${item.assunto_nome}` : ''),
        cor: item.cor,
        icone: item.icone,
        horas_meta: item.horas_meta,
        ordem: index
      }))
    })

    if (novoCiclo) {
      setShowCriarModal(false)
      setFormNome('')
      setFormDescricao('')
      setFormItens([])
    }
  }

  const progressoGeral = cicloAtual ? calcularProgressoCiclo(cicloAtual) : 0
  const diasRestantes = cicloAtual ? calcularDiasRestantes(cicloAtual) : 0

  // Encontrar próximo item a estudar (menor progresso)
  const proximoItem = cicloAtual?.ciclo_itens
    ?.filter(i => i.progresso < 100)
    .sort((a, b) => a.progresso - b.progresso)[0]

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Header title="Ciclos de Estudo" />
        <div className="p-6 lg:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            <p className="text-slate-500 dark:text-slate-400">Carregando ciclos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="Ciclos de Estudo" />

      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto pb-20">
        {/* Header Section */}
        {cicloAtual ? (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  cicloAtual.status === 'em_progresso'
                    ? 'bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20'
                    : cicloAtual.status === 'pausado'
                    ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20'
                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-500 border border-slate-500/20'
                }`}>
                  {cicloAtual.status === 'em_progresso' ? 'Em Progresso' : cicloAtual.status === 'pausado' ? 'Pausado' : 'Concluído'}
                </span>
                {diasRestantes > 0 && (
                  <span className="text-slate-400 text-sm">Restam {diasRestantes} dias</span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Ciclo #{cicloAtual.numero}: {cicloAtual.nome}
              </h1>
              {cicloAtual.descricao && (
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  {cicloAtual.descricao}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {cicloAtual.status === 'em_progresso' && (
                <button
                  onClick={() => pausarCiclo(cicloAtual.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#232d3b] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">pause</span>
                  Pausar
                </button>
              )}
              {cicloAtual.status === 'pausado' && (
                <button
                  onClick={() => retomarCiclo(cicloAtual.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  Retomar
                </button>
              )}
              <button
                onClick={() => concluirCiclo(cicloAtual.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#232d3b] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Ciclos de Estudo
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Organize seu estudo em ciclos baseados em tempo, como o método Gran Cursos.
              </p>
            </div>
            <button
              onClick={() => setShowCriarModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Novo Ciclo
            </button>
          </div>
        )}

        {cicloAtual && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Horas Planejadas</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{cicloAtual.horas_planejadas}h</h3>
                  </div>
                  <div className="p-2 rounded bg-blue-500/10 text-primary">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Horas Estudadas</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {Number(cicloAtual.horas_estudadas || 0).toFixed(1)}h
                    </h3>
                  </div>
                  <div className="p-2 rounded bg-purple-500/10 text-purple-500">
                    <span className="material-symbols-outlined">timer</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Progresso Geral</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{progressoGeral}%</h3>
                  </div>
                  <div className="p-2 rounded bg-green-500/10 text-green-500">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progressoGeral}%` }}></div>
                </div>
              </div>
            </div>

            {/* Próxima Sessão Sugerida */}
            {proximoItem && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Próxima Sessão Sugerida</h3>
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-[#0b5cb6] p-6 md:p-8 text-white shadow-lg">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <span className="material-symbols-outlined text-[180px]">{proximoItem.icone || 'auto_stories'}</span>
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold mb-3 border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        {proximoItem.prioridade >= 4 ? 'Prioridade Alta' : proximoItem.prioridade >= 3 ? 'Prioridade Média' : 'Continuar Estudando'}
                      </div>
                      <h2 className="text-3xl font-bold mb-2">
                        {proximoItem.nome_display || proximoItem.disciplina?.nome}
                      </h2>
                      <p className="text-blue-100 max-w-lg text-sm md:text-base">
                        Progresso atual: {proximoItem.progresso}% ({Number(proximoItem.horas_estudadas || 0).toFixed(1)}h de {proximoItem.horas_meta}h)
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 min-w-[200px]">
                      <button
                        onClick={() => handleIniciarSessao(proximoItem)}
                        disabled={temSessaoAtiva}
                        className="flex items-center justify-center gap-2 w-full bg-white text-primary hover:bg-blue-50 font-bold py-3 px-6 rounded-lg shadow-sm transition-all transform hover:scale-[1.02] disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined filled">play_arrow</span>
                        {temSessaoAtiva ? 'Sessão em Andamento' : 'Iniciar Sessão'}
                      </button>
                      <div className="text-center text-xs text-blue-100 font-medium">
                        Meta: {(proximoItem.horas_meta - (proximoItem.horas_estudadas || 0)).toFixed(1)}h restantes
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Matérias do Ciclo */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Matérias do Ciclo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cicloAtual.ciclo_itens?.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-4 transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`p-2.5 rounded-lg bg-${item.cor}-500/10 text-${item.cor}-500 group-hover:bg-${item.cor}-500 group-hover:text-white transition-colors`}>
                        <span className="material-symbols-outlined">{item.icone || 'menu_book'}</span>
                      </div>
                      <button
                        onClick={() => handleIniciarSessao(item)}
                        disabled={temSessaoAtiva}
                        className="text-slate-400 hover:text-primary disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">play_circle</span>
                      </button>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      {item.nome_display || item.disciplina?.nome}
                    </h4>
                    {item.assunto && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{item.assunto.nome}</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500 dark:text-slate-400">Progresso</span>
                        <span className="text-slate-900 dark:text-white">{item.progresso}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className={`bg-${item.cor}-500 h-2 rounded-full transition-all`}
                          style={{ width: `${item.progresso}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-2 text-slate-500 dark:text-slate-400">
                        <span>{Number(item.horas_estudadas || 0).toFixed(1)}h estudadas</span>
                        <span>Meta: {item.horas_meta}h</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Adicionar Matéria */}
                <button
                  onClick={() => setShowCriarModal(true)}
                  className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-transparent p-4 min-h-[180px] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary mb-3 transition-colors">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Adicionar Matéria</span>
                </button>
              </div>
            </section>
          </>
        )}

        {/* Sem ciclo ativo */}
        {!cicloAtual && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-primary">cycle</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhum ciclo ativo</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
              Crie um novo ciclo de estudos para organizar suas matérias e acompanhar seu progresso.
            </p>
            <button
              onClick={() => setShowCriarModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
              Criar Novo Ciclo
            </button>
          </div>
        )}

        {/* Lista de ciclos anteriores */}
        {ciclos.filter(c => c.id !== cicloAtual?.id).length > 0 && (
          <section className="mt-12">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Ciclos Anteriores</h3>
            <div className="space-y-3">
              {ciclos.filter(c => c.id !== cicloAtual?.id).map((ciclo) => (
                <div
                  key={ciclo.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d]"
                >
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      Ciclo #{ciclo.numero}: {ciclo.nome}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(ciclo.data_inicio).toLocaleDateString('pt-BR')} - {ciclo.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {Number(ciclo.horas_estudadas || 0).toFixed(1)}h / {ciclo.horas_planejadas}h
                    </span>
                    <button
                      onClick={() => excluirCiclo(ciclo.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Timer Widget (Fixed Bottom Right) - se tiver sessão ativa */}
      {temSessaoAtiva && sessaoAtiva && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="bg-white dark:bg-[#1c242d] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 flex items-center pr-4 cursor-pointer hover:border-primary transition-colors">
            <div className="bg-primary/10 text-primary p-2 rounded-md mr-3">
              <span className="material-symbols-outlined text-[20px]">hourglass_bottom</span>
            </div>
            <div className="flex flex-col mr-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {sessaoAtiva.disciplina?.nome}
              </span>
              <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {formatarTempo(tempoDecorrido)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Ciclo */}
      {showCriarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#1c242d] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Criar Novo Ciclo</h3>
              <button
                onClick={() => setShowCriarModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Ciclo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white text-sm"
                    placeholder="Ex: Foco em Exatas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Duração (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formDuracaoDias}
                    onChange={(e) => setFormDuracaoDias(parseInt(e.target.value) || 7)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white text-sm resize-none"
                  placeholder="Descreva o foco deste ciclo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Horas Planejadas
                </label>
                <input
                  type="number"
                  min="1"
                  value={formHorasPlanejadas}
                  onChange={(e) => setFormHorasPlanejadas(parseInt(e.target.value) || 40)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white text-sm"
                />
              </div>

              {/* Adicionar matérias */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Matérias do Ciclo <span className="text-red-500">*</span>
                </label>
                <SeletorDisciplina
                  onSelecao={handleAdicionarItem}
                  mostrarSubassunto={false}
                />
              </div>

              {/* Lista de matérias adicionadas */}
              {formItens.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Matérias Adicionadas ({formItens.length})
                  </label>
                  {formItens.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-lg bg-${item.cor}-500/20 text-${item.cor}-500 flex items-center justify-center`}>
                          <span className="material-symbols-outlined text-lg">{item.icone}</span>
                        </div>
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {item.disciplina_nome}
                          {item.assunto_nome && <span className="text-slate-500"> - {item.assunto_nome}</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Meta:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.horas_meta}
                            onChange={(e) => {
                              const newItens = [...formItens]
                              newItens[index].horas_meta = parseInt(e.target.value) || 10
                              setFormItens(newItens)
                            }}
                            className="w-16 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] text-sm text-center"
                          />
                          <span className="text-xs text-slate-500">h</span>
                        </div>
                        <button
                          onClick={() => handleRemoverItem(index)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => setShowCriarModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarCiclo}
                disabled={!formNome || formItens.length === 0 || loading}
                className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Ciclo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Iniciar Sessão */}
      <IniciarSessaoModal
        isOpen={showIniciarSessao}
        onClose={() => setShowIniciarSessao(false)}
        cicloId={cicloAtual?.id}
        cicloItemId={itemSelecionado?.id}
        disciplinaInicial={itemSelecionado?.disciplina_id}
        assuntoInicial={itemSelecionado?.assunto_id || undefined}
        subassuntoInicial={itemSelecionado?.subassunto_id || undefined}
      />
    </div>
  )
}
