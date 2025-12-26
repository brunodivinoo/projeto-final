'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { useCheckLimit, TipoRecurso } from '@/hooks/useCheckLimit'
import { useLimits } from '@/hooks/useLimits'
import { LimitBlockedModal } from '@/components/limits'
import {
  GeradorQuestoesModal,
  QuestoesIAList,
  ChatIA,
  GeradorResumosModal,
  AnalisePdfModal
} from '@/components/ia'
import VisualizadorResumoPanel from '@/components/ia/VisualizadorResumoPanel'
import { useQuestoesIA } from '@/hooks/useQuestoesIA'
import { useResumosIA } from '@/hooks/useResumosIA'
import { usePdfIA } from '@/hooks/usePdfIA'
import Link from 'next/link'

type TabType = 'overview' | 'questoes' | 'chat' | 'resumos' | 'pdf'

export default function CentralIAPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showGeradorModal, setShowGeradorModal] = useState(false)
  const [showResumosModal, setShowResumosModal] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [resumoSelecionado, setResumoSelecionado] = useState<{
    id: string
    user_id: string
    titulo: string
    resumo: string
    disciplina: string | null
    assunto: string | null
    created_at: string
    compartilhado?: boolean
  } | null>(null)
  const [painelResumoAberto, setPainelResumoAberto] = useState(false)
  const { checkLimit, loading: checkingLimit } = useCheckLimit()
  const { isPro } = useLimits()

  // Hook de questões
  const {
    questoes,
    totalQuestoes,
    loading: loadingQuestoes,
    filtrosDisponiveis,
    responderQuestao,
    deletarQuestao,
    buscarQuestoes,
    refresh: refreshQuestoes
  } = useQuestoesIA()

  // Hook de resumos
  const { resumos, carregarResumos } = useResumosIA()

  // Hook de PDFs
  const { pdfs, carregarPdfs } = usePdfIA()

  // Estado do modal de bloqueio
  const [blockedModal, setBlockedModal] = useState<{
    isOpen: boolean
    recurso: TipoRecurso
    usado: number
    limite: number
    tipo: 'diario' | 'mensal'
  }>({
    isOpen: false,
    recurso: 'questoes_ia',
    usado: 0,
    limite: 0,
    tipo: 'diario'
  })

  // Função para verificar limite antes de ação
  const handleActionWithLimit = async (recurso: TipoRecurso, quantidade: number = 1, onSuccess: () => void) => {
    const result = await checkLimit(recurso, quantidade)

    if (!result.canUse && !result.isIlimitado) {
      setBlockedModal({
        isOpen: true,
        recurso,
        usado: result.usado,
        limite: result.limite,
        tipo: result.tipo
      })
      return
    }

    onSuccess()
  }

  // Handlers para cada ação
  const handleGerarQuestoes = () => {
    handleActionWithLimit('questoes_ia', 1, () => {
      setShowGeradorModal(true)
    })
  }

  const handleGerarResumo = () => {
    handleActionWithLimit('resumos', 1, () => {
      setShowResumosModal(true)
    })
  }

  const handleIniciarChat = () => {
    setActiveTab('chat')
  }

  const handleAnalisarPDF = () => {
    handleActionWithLimit('pdf_paginas', 1, () => {
      setShowPdfModal(true)
    })
  }

  // Callbacks de sucesso
  const handleQuestoesGeradas = () => {
    refreshQuestoes()
    setActiveTab('questoes')
  }

  const handleResumoGerado = () => {
    carregarResumos()
    setActiveTab('resumos')
  }

  const handlePdfAnalisado = () => {
    carregarPdfs()
    refreshQuestoes()
  }

  // Função para visualizar um resumo
  const handleVisualizarResumo = (resumo: typeof resumoSelecionado) => {
    setResumoSelecionado(resumo)
    setPainelResumoAberto(true)
  }

  // Função para compartilhar um resumo
  const handleCompartilharResumo = async (resumoId: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/ia/resumos/compartilhar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumo_id: resumoId })
      })

      if (!response.ok) throw new Error('Erro ao compartilhar')

      const data = await response.json()

      // Atualizar o resumo selecionado com o status de compartilhado
      if (resumoSelecionado && resumoSelecionado.id === resumoId) {
        setResumoSelecionado({ ...resumoSelecionado, compartilhado: true })
      }

      return data.link
    } catch (error) {
      console.error('Erro ao compartilhar resumo:', error)
      return null
    }
  }

  // Formatar data relativa
  const formatarDataRelativa = (data: string) => {
    const d = new Date(data)
    const agora = new Date()
    const diff = agora.getTime() - d.getTime()
    const horas = Math.floor(diff / (1000 * 60 * 60))
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (horas < 1) return 'Agora há pouco'
    if (horas < 24) return `Há ${horas} hora${horas > 1 ? 's' : ''}`
    if (dias === 1) return 'Ontem'
    if (dias < 7) return `Há ${dias} dias`
    return d.toLocaleDateString('pt-BR')
  }

  return (
    <div className="min-h-screen">
      <Header title="Central IA" />

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#137fec] text-white'
                  : 'bg-gray-100 dark:bg-[#283039] text-gray-600 dark:text-[#9dabb9] hover:bg-gray-200 dark:hover:bg-[#333d4a]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">dashboard</span>
                Visão Geral
              </span>
            </button>
            <button
              onClick={() => setActiveTab('questoes')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'questoes'
                  ? 'bg-[#137fec] text-white'
                  : 'bg-gray-100 dark:bg-[#283039] text-gray-600 dark:text-[#9dabb9] hover:bg-gray-200 dark:hover:bg-[#333d4a]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">quiz</span>
                Questões
                {totalQuestoes > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{totalQuestoes}</span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'chat'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-[#283039] text-gray-600 dark:text-[#9dabb9] hover:bg-gray-200 dark:hover:bg-[#333d4a]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">chat_bubble</span>
                Chat IA
              </span>
            </button>
            <button
              onClick={() => setActiveTab('resumos')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'resumos'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-[#283039] text-gray-600 dark:text-[#9dabb9] hover:bg-gray-200 dark:hover:bg-[#333d4a]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">summarize</span>
                Resumos
                {resumos.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{resumos.length}</span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'pdf'
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 dark:bg-[#283039] text-gray-600 dark:text-[#9dabb9] hover:bg-gray-200 dark:hover:bg-[#333d4a]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                PDFs
                {pdfs.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{pdfs.length}</span>
                )}
              </span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* AI Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                {/* Gerador de Questões */}
                <button
                  onClick={handleGerarQuestoes}
                  disabled={checkingLimit}
                  className="group relative flex flex-col gap-4 p-5 rounded-xl bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] hover:border-[#137fec]/50 transition-all hover:shadow-lg hover:shadow-[#137fec]/10 cursor-pointer overflow-hidden text-left disabled:opacity-70"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#137fec]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="size-12 rounded-lg bg-[#137fec]/20 flex items-center justify-center text-[#137fec] z-10">
                    <span className="material-symbols-outlined text-3xl">quiz</span>
                  </div>
                  <div className="flex flex-col gap-1 z-10">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gerador de Questões</h3>
                    <p className="text-[#9dabb9] text-sm">Crie simulados personalizados baseados em qualquer tópico.</p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center text-[#137fec] text-sm font-bold group-hover:underline">
                    Começar agora <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                  </div>
                </button>

                {/* Gerar Resumos */}
                <button
                  onClick={handleGerarResumo}
                  disabled={checkingLimit}
                  className="group relative flex flex-col gap-4 p-5 rounded-xl bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer overflow-hidden text-left disabled:opacity-70"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="size-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500 z-10">
                    <span className="material-symbols-outlined text-3xl">summarize</span>
                  </div>
                  <div className="flex flex-col gap-1 z-10">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gerar Resumos</h3>
                    <p className="text-[#9dabb9] text-sm">Transforme textos longos em tópicos digeríveis instantaneamente.</p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center text-purple-500 text-sm font-bold group-hover:underline">
                    Gerar resumo <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                  </div>
                </button>

                {/* Chat Tira-Dúvidas */}
                <button
                  onClick={handleIniciarChat}
                  disabled={checkingLimit}
                  className="group relative flex flex-col gap-4 p-5 rounded-xl bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer overflow-hidden text-left disabled:opacity-70"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="size-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 z-10">
                    <span className="material-symbols-outlined text-3xl">chat_bubble</span>
                  </div>
                  <div className="flex flex-col gap-1 z-10">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chat Tira-Dúvidas</h3>
                    <p className="text-[#9dabb9] text-sm">Converse com a IA em tempo real para esclarecer conceitos.</p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center text-emerald-500 text-sm font-bold group-hover:underline">
                    Iniciar chat <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                  </div>
                </button>
              </div>

              {/* PDF Analysis Section */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2">
                  <span className="material-symbols-outlined text-rose-500">picture_as_pdf</span>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Analisar PDF</h2>
                </div>

                <button
                  onClick={handleAnalisarPDF}
                  disabled={checkingLimit}
                  className="w-full border-2 border-dashed border-gray-300 dark:border-[#283039] rounded-xl bg-gray-50 dark:bg-[#1C252E]/50 p-8 flex flex-col items-center justify-center gap-4 text-center hover:border-rose-500/50 hover:bg-rose-500/5 transition-all cursor-pointer group disabled:opacity-70"
                >
                  <div className="size-16 rounded-full bg-gray-200 dark:bg-[#283039] flex items-center justify-center text-[#9dabb9] group-hover:text-rose-500 transition-colors">
                    <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Arraste e solte seu PDF aqui</p>
                    <p className="text-[#9dabb9] text-sm">Suporta arquivos PDF até {isPro ? '100' : '50'}MB • Gera resumos, flashcards e questões</p>
                  </div>
                  <span className="mt-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg shadow-lg shadow-rose-500/20 transition-all">
                    Selecionar arquivo
                  </span>
                </button>
              </div>

              {/* Créditos Info Card */}
              <div className="bg-gradient-to-r from-[#137fec]/5 to-purple-500/5 rounded-xl border border-[#137fec]/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#137fec]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#137fec]">token</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {isPro ? 'Você tem limites expandidos com o Estuda PRO!' : 'Quer mais recursos de IA?'}
                    </p>
                    <p className="text-xs text-[#9dabb9]">
                      {isPro ? 'Aproveite seus créditos extras mensais' : 'Faça upgrade para o Estuda PRO'}
                    </p>
                  </div>
                </div>
                <Link
                  href={isPro ? '/dashboard/creditos' : '/dashboard/assinatura'}
                  className="px-4 py-2 bg-[#137fec] hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors whitespace-nowrap"
                >
                  {isPro ? 'Ver Créditos' : 'Ver Planos'}
                </Link>
              </div>

              {/* Recent Activity Section */}
              <div className="flex flex-col gap-4 pb-10">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Atividade Recente</h2>
                </div>

                <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] overflow-hidden">
                  {(questoes.length > 0 || resumos.length > 0 || pdfs.length > 0) ? (
                    <>
                      {/* Questões recentes */}
                      {questoes.slice(0, 2).map((questao) => (
                        <div
                          key={questao.id}
                          onClick={() => setActiveTab('questoes')}
                          className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-[#283039] hover:bg-gray-50 dark:hover:bg-[#202b36] transition-colors cursor-pointer"
                        >
                          <div className="size-10 rounded-lg bg-[#137fec]/20 flex items-center justify-center text-[#137fec] shrink-0">
                            <span className="material-symbols-outlined text-xl">quiz</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              Questão: {questao.disciplina}
                            </h4>
                            <p className="text-xs text-[#9dabb9]">
                              {formatarDataRelativa(questao.created_at)} • {questao.banca}
                            </p>
                          </div>
                          {questao.respondida && (
                            <span className={`px-2 py-1 rounded text-xs ${questao.acertou ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {questao.acertou ? 'Acertou' : 'Errou'}
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Resumos recentes */}
                      {resumos.slice(0, 1).map((resumo) => (
                        <div
                          key={resumo.id}
                          onClick={() => setActiveTab('resumos')}
                          className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-[#283039] hover:bg-gray-50 dark:hover:bg-[#202b36] transition-colors cursor-pointer"
                        >
                          <div className="size-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                            <span className="material-symbols-outlined text-xl">summarize</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {resumo.titulo}
                            </h4>
                            <p className="text-xs text-[#9dabb9]">
                              {formatarDataRelativa(resumo.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* PDFs recentes */}
                      {pdfs.slice(0, 1).map((pdf) => (
                        <div
                          key={pdf.id}
                          onClick={() => setActiveTab('pdf')}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#202b36] transition-colors cursor-pointer"
                        >
                          <div className="size-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                            <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {pdf.nome_arquivo}
                            </h4>
                            <p className="text-xs text-[#9dabb9]">
                              {formatarDataRelativa(pdf.created_at)} • {pdf.flashcards_gerados} flashcards • {pdf.questoes_geradas} questões
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <span className="material-symbols-outlined text-4xl text-[#9dabb9] mb-2">history</span>
                      <p className="text-sm text-[#9dabb9]">Nenhuma atividade recente</p>
                      <p className="text-xs text-[#9dabb9]">Use os recursos de IA para começar</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'questoes' && (
            <div className="flex flex-col gap-4 pb-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Minhas Questões</h2>
                  <p className="text-sm text-[#9dabb9]">{totalQuestoes} questões geradas</p>
                </div>
                <button
                  onClick={handleGerarQuestoes}
                  disabled={checkingLimit}
                  className="px-4 py-2 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold rounded-lg shadow-lg shadow-[#137fec]/20 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Gerar Questões
                </button>
              </div>

              <QuestoesIAList
                questoes={questoes}
                loading={loadingQuestoes}
                onRefresh={refreshQuestoes}
                onAnswer={responderQuestao}
                onDelete={deletarQuestao}
                filtrosDisponiveis={filtrosDisponiveis}
                onFiltrar={buscarQuestoes}
              />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="pb-10">
              <ChatIA />
            </div>
          )}

          {activeTab === 'resumos' && (
            <div className="flex flex-col gap-4 pb-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meus Resumos</h2>
                  <p className="text-sm text-[#9dabb9]">{resumos.length} resumos gerados</p>
                </div>
                <button
                  onClick={handleGerarResumo}
                  disabled={checkingLimit}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Novo Resumo
                </button>
              </div>

              {resumos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039]">
                  <div className="size-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-4xl text-purple-500">summarize</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhum resumo ainda</h3>
                  <p className="text-sm text-[#9dabb9] max-w-sm mb-4">
                    Crie resumos a partir de textos e organize seus estudos.
                  </p>
                  <button
                    onClick={handleGerarResumo}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg transition-colors"
                  >
                    Criar primeiro resumo
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {resumos.map((resumo) => (
                    <div
                      key={resumo.id}
                      onClick={() => handleVisualizarResumo(resumo)}
                      className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-4 hover:border-purple-500/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="size-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                            <span className="material-symbols-outlined">summarize</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{resumo.titulo}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {resumo.disciplina && (
                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-500 text-xs">
                                  {resumo.disciplina}
                                </span>
                              )}
                              {resumo.assunto && (
                                <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 text-xs">
                                  {resumo.assunto}
                                </span>
                              )}
                              <span className="text-xs text-[#9dabb9]">
                                {formatarDataRelativa(resumo.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[#9dabb9] hover:text-purple-500 transition-colors">
                          open_in_new
                        </span>
                      </div>
                      <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-[#141A21] max-h-32 overflow-hidden">
                        <p className="text-sm text-[#9dabb9] line-clamp-4 whitespace-pre-wrap">
                          {resumo.resumo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="flex flex-col gap-4 pb-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">PDFs Analisados</h2>
                  <p className="text-sm text-[#9dabb9]">{pdfs.length} arquivos processados</p>
                </div>
                <button
                  onClick={handleAnalisarPDF}
                  disabled={checkingLimit}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  <span className="material-symbols-outlined text-lg">upload_file</span>
                  Novo PDF
                </button>
              </div>

              {pdfs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039]">
                  <div className="size-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-4xl text-rose-500">picture_as_pdf</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhum PDF analisado</h3>
                  <p className="text-sm text-[#9dabb9] max-w-sm mb-4">
                    Faça upload de PDFs e gere resumos, flashcards e questões automaticamente.
                  </p>
                  <button
                    onClick={handleAnalisarPDF}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-colors"
                  >
                    Enviar primeiro PDF
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pdfs.map((pdf) => (
                    <div
                      key={pdf.id}
                      className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="size-12 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                          <span className="material-symbols-outlined text-2xl">description</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">{pdf.nome_arquivo}</h3>
                          <p className="text-xs text-[#9dabb9] mt-1">
                            {(pdf.tamanho_bytes / (1024 * 1024)).toFixed(2)} MB • {formatarDataRelativa(pdf.created_at)}
                          </p>
                          {pdf.disciplinas_detectadas && pdf.disciplinas_detectadas.length > 0 && (
                            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 text-xs">
                              {pdf.disciplinas_detectadas[0]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-[#283039]">
                        {pdf.resumo_gerado && (
                          <div className="flex items-center gap-1 text-xs text-purple-500">
                            <span className="material-symbols-outlined text-sm">summarize</span>
                            Resumo
                          </div>
                        )}
                        {pdf.flashcards_gerados > 0 && (
                          <div className="flex items-center gap-1 text-xs text-[#137fec]">
                            <span className="material-symbols-outlined text-sm">style</span>
                            {pdf.flashcards_gerados} flashcards
                          </div>
                        )}
                        {pdf.questoes_geradas > 0 && (
                          <div className="flex items-center gap-1 text-xs text-emerald-500">
                            <span className="material-symbols-outlined text-sm">quiz</span>
                            {pdf.questoes_geradas} questões
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LimitBlockedModal
        isOpen={blockedModal.isOpen}
        onClose={() => setBlockedModal(prev => ({ ...prev, isOpen: false }))}
        recurso={blockedModal.recurso}
        usado={blockedModal.usado}
        limite={blockedModal.limite}
        tipo={blockedModal.tipo}
        isPro={isPro}
      />

      <GeradorQuestoesModal
        isOpen={showGeradorModal}
        onClose={() => setShowGeradorModal(false)}
        onSuccess={handleQuestoesGeradas}
      />

      <GeradorResumosModal
        isOpen={showResumosModal}
        onClose={() => setShowResumosModal(false)}
        onSuccess={handleResumoGerado}
      />

      <AnalisePdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        onSuccess={handlePdfAnalisado}
      />

      <VisualizadorResumoPanel
        resumo={resumoSelecionado}
        isOpen={painelResumoAberto}
        onClose={() => setPainelResumoAberto(false)}
        onCompartilhar={handleCompartilharResumo}
      />
    </div>
  )
}
