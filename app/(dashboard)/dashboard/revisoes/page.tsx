'use client'
import { Header } from '@/components/layout/Header'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRevisoes } from '@/hooks/useRevisoes'
import { SeletorDisciplina, CardRevisao } from '@/components/estudo'

const METODO_ICONS: Record<string, string> = {
  questoes: 'quiz',
  leitura: 'auto_stories',
  video: 'play_circle',
  resumo: 'edit_note',
  flashcard: 'style',
  aula: 'school',
  pdf: 'picture_as_pdf',
  revisao: 'refresh',
  outro: 'more_horiz'
}

export default function RevisoesPage() {
  const { user, loading: authLoading } = useAuth()
  const {
    revisoes,
    revisoesHoje,
    loading,
    buscarRevisoes,
    buscarRevisoesHoje,
    criarRevisao,
    registrarRevisao,
    arquivarRevisao,
    excluirRevisao,
    getEstatisticas
  } = useRevisoes()

  const [filtroStatus, setFiltroStatus] = useState<string>('todas')
  const [showCriarModal, setShowCriarModal] = useState(false)

  // Form state para criar revisão
  const [formSelecao, setFormSelecao] = useState<Record<string, string | null>>({})
  const [formTitulo, setFormTitulo] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formPrioridade, setFormPrioridade] = useState(3)

  // Carregar dados
  useEffect(() => {
    if (!authLoading && user) {
      buscarRevisoesHoje()
      buscarRevisoes()
    }
  }, [authLoading, user, buscarRevisoesHoje, buscarRevisoes])

  const handleRegistrarRevisao = async (id: string, qualidade: number) => {
    await registrarRevisao(id, qualidade)
    // Recarregar dados
    await buscarRevisoesHoje()
    await buscarRevisoes()
  }

  const handleArquivarRevisao = async (id: string) => {
    await arquivarRevisao(id)
    await buscarRevisoes()
  }

  const handleCriarRevisao = async () => {
    if (!formSelecao.disciplina_id) return

    const novaRevisao = await criarRevisao({
      disciplina_id: formSelecao.disciplina_id,
      assunto_id: formSelecao.assunto_id || undefined,
      subassunto_id: formSelecao.subassunto_id || undefined,
      titulo: formTitulo || undefined,
      descricao: formDescricao || undefined,
      prioridade: formPrioridade
    })

    if (novaRevisao) {
      setShowCriarModal(false)
      setFormSelecao({})
      setFormTitulo('')
      setFormDescricao('')
      setFormPrioridade(3)
    }
  }

  const stats = getEstatisticas()

  // Filtrar revisões
  const revisoesFiltradas = revisoes.filter(r => {
    if (filtroStatus === 'todas') return r.status !== 'arquivada'
    if (filtroStatus === 'pendentes') return r.status === 'pendente'
    if (filtroStatus === 'atrasadas') return r.status === 'atrasada'
    if (filtroStatus === 'concluidas') return r.status === 'concluida'
    if (filtroStatus === 'arquivadas') return r.status === 'arquivada'
    return true
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Header title="Revisões" />
        <div className="p-6 lg:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            <p className="text-slate-500 dark:text-slate-400">Carregando revisões...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="Revisões" />

      <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Sistema de Revisões
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Revisão espaçada (SM-2) para memorização de longo prazo
            </p>
          </div>
          <button
            onClick={() => setShowCriarModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nova Revisão
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">calendar_today</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{revisoesHoje.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Para Hoje</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.atrasadas}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Atrasadas</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendentes}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pendentes</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.concluidas}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Concluídas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revisões para Hoje */}
        {revisoesHoje.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">today</span>
                Revisar Hoje ({revisoesHoje.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {revisoesHoje.slice(0, 4).map((revisao) => (
                <CardRevisao
                  key={revisao.id}
                  revisao={revisao}
                  onRevisar={handleRegistrarRevisao}
                  onArquivar={handleArquivarRevisao}
                />
              ))}
            </div>
            {revisoesHoje.length > 4 && (
              <button
                onClick={() => setFiltroStatus('todas')}
                className="mt-4 text-sm text-primary font-medium hover:text-primary/80"
              >
                Ver todas as {revisoesHoje.length} revisões
              </button>
            )}
          </section>
        )}

        {/* Banner se não há revisões para hoje */}
        {revisoesHoje.length === 0 && stats.total > 0 && (
          <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-white/20">
                <span className="material-symbols-outlined text-3xl">celebration</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Parabéns!</h3>
                <p className="text-green-100">Você está em dia com suas revisões. Continue assim!</p>
              </div>
            </div>
          </div>
        )}

        {/* Todas as Revisões */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Todas as Revisões
            </h2>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'todas', label: 'Todas' },
                { value: 'pendentes', label: 'Pendentes' },
                { value: 'atrasadas', label: 'Atrasadas' },
                { value: 'concluidas', label: 'Concluídas' },
                { value: 'arquivadas', label: 'Arquivadas' }
              ].map((filtro) => (
                <button
                  key={filtro.value}
                  onClick={() => setFiltroStatus(filtro.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filtroStatus === filtro.value
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {filtro.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de revisões */}
          {revisoesFiltradas.length > 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#151c24]">
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Conteúdo
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                        Método
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Próxima
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                        Repetições
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {revisoesFiltradas.map((revisao) => {
                      const isAtrasada = revisao.status === 'atrasada'
                      const diasAtraso = isAtrasada
                        ? Math.floor((new Date().getTime() - new Date(revisao.proxima_revisao).getTime()) / (1000 * 60 * 60 * 24))
                        : 0

                      return (
                        <tr key={revisao.id} className="hover:bg-slate-50 dark:hover:bg-[#1a232d]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`size-10 rounded-lg flex items-center justify-center ${
                                isAtrasada ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                              }`}>
                                <span className="material-symbols-outlined text-xl">
                                  {METODO_ICONS[revisao.metodo_original || 'outro']}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {revisao.disciplina?.nome}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {revisao.assunto?.nome || revisao.titulo || 'Revisão geral'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                              {revisao.metodo_original || 'Outro'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${
                              isAtrasada ? 'text-red-500' : 'text-slate-900 dark:text-white'
                            }`}>
                              {isAtrasada
                                ? `${diasAtraso}d atraso`
                                : new Date(revisao.proxima_revisao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                              }
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center hidden sm:table-cell">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                              {revisao.repeticoes}x
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                              revisao.status === 'pendente'
                                ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                                : revisao.status === 'atrasada'
                                ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                                : revisao.status === 'concluida'
                                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                              {revisao.status === 'pendente' ? 'Pendente'
                                : revisao.status === 'atrasada' ? 'Atrasada'
                                : revisao.status === 'concluida' ? 'Concluída'
                                : 'Arquivada'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {revisao.status !== 'arquivada' && revisao.status !== 'concluida' && (
                                <button
                                  onClick={() => handleRegistrarRevisao(revisao.id, 4)}
                                  className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                                  title="Marcar como revisada"
                                >
                                  <span className="material-symbols-outlined text-lg">check</span>
                                </button>
                              )}
                              {revisao.status !== 'arquivada' && (
                                <button
                                  onClick={() => handleArquivarRevisao(revisao.id)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                  title="Arquivar"
                                >
                                  <span className="material-symbols-outlined text-lg">archive</span>
                                </button>
                              )}
                              <button
                                onClick={() => excluirRevisao(revisao.id)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"
                                title="Excluir"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d]">
              <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-400">inbox</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                Nenhuma revisão encontrada
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md mb-4">
                {filtroStatus !== 'todas'
                  ? 'Não há revisões com este filtro.'
                  : 'Crie uma nova revisão ou finalize uma sessão de estudo para gerar revisões automaticamente.'}
              </p>
              <button
                onClick={() => setShowCriarModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Criar Revisão
              </button>
            </div>
          )}
        </section>

        {/* Explicação do Sistema SM-2 */}
        <section className="mt-8 p-6 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">psychology</span>
            Como funciona o Sistema SM-2
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-1">1. Avaliação</h4>
              <p className="text-slate-600 dark:text-slate-400">
                Ao revisar, você avalia de 0 a 5 quão bem lembrou do conteúdo.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-1">2. Intervalo</h4>
              <p className="text-slate-600 dark:text-slate-400">
                Quanto melhor sua lembrança, maior o intervalo até a próxima revisão.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-1">3. Memorização</h4>
              <p className="text-slate-600 dark:text-slate-400">
                Com o tempo, os intervalos crescem e o conteúdo fica na memória de longo prazo.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Modal Criar Revisão */}
      {showCriarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#1c242d] rounded-xl shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Criar Nova Revisão</h3>
              <button
                onClick={() => setShowCriarModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <SeletorDisciplina
                onSelecao={setFormSelecao}
                required
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white text-sm"
                  placeholder="Ex: Conceitos básicos de funções"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white text-sm resize-none"
                  placeholder="Anotações sobre o que revisar..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Prioridade
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormPrioridade(p)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formPrioridade === p
                          ? p <= 2
                            ? 'bg-green-500 text-white'
                            : p === 3
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Baixa</span>
                  <span>Alta</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => setShowCriarModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarRevisao}
                disabled={!formSelecao.disciplina_id || loading}
                className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Revisão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
