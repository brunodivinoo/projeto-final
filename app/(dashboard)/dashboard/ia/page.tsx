'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { useCheckLimit, TipoRecurso } from '@/hooks/useCheckLimit'
import { useLimits } from '@/hooks/useLimits'
import { LimitBlockedModal } from '@/components/limits'
import { GeradorQuestoesModal, QuestoesIAList } from '@/components/ia'
import { useQuestoesIA } from '@/hooks/useQuestoesIA'
import Link from 'next/link'

type TabType = 'overview' | 'questoes' | 'chat' | 'pdf'

export default function CentralIAPage() {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['resumo'])
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showGeradorModal, setShowGeradorModal] = useState(false)
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
    refresh
  } = useQuestoesIA()

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

  const toggleOption = (option: string) => {
    setSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    )
  }

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
      // TODO: Navegar para página de resumos ou abrir modal
      console.log('Abrir gerador de resumos')
    })
  }

  const handleIniciarChat = () => {
    handleActionWithLimit('chat_mensagens', 1, () => {
      // TODO: Navegar para página de chat
      console.log('Abrir chat IA')
    })
  }

  const handleAnalisarPDF = () => {
    // Para PDF, verificar limite de páginas (assumindo 1 página por enquanto)
    handleActionWithLimit('pdf_paginas', 1, () => {
      // TODO: Abrir seletor de arquivo
      console.log('Abrir seletor de PDF')
    })
  }

  // Callback quando questões são geradas com sucesso
  const handleQuestoesGeradas = (_quantidade: number) => {
    void _quantidade
    refresh()
    setActiveTab('questoes')
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
                Minhas Questões
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
              onClick={() => setActiveTab('pdf')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'pdf'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-[#283039] text-gray-600 dark:text-[#9dabb9] hover:bg-gray-200 dark:hover:bg-[#333d4a]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                Análise PDF
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
                  className="group relative flex flex-col gap-4 p-5 rounded-xl bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] hover:border-[#137fec]/50 transition-all hover:shadow-lg hover:shadow-[#137fec]/10 cursor-pointer overflow-hidden text-left disabled:opacity-70"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="size-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-[#a855f7] z-10">
                    <span className="material-symbols-outlined text-3xl">summarize</span>
                  </div>
                  <div className="flex flex-col gap-1 z-10">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gerar Resumos</h3>
                    <p className="text-[#9dabb9] text-sm">Transforme textos longos em tópicos digeríveis instantaneamente.</p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center text-[#a855f7] text-sm font-bold group-hover:underline">
                    Gerar resumo <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                  </div>
                </button>

                {/* Chat Tira-Dúvidas */}
                <button
                  onClick={handleIniciarChat}
                  disabled={checkingLimit}
                  className="group relative flex flex-col gap-4 p-5 rounded-xl bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] hover:border-[#137fec]/50 transition-all hover:shadow-lg hover:shadow-[#137fec]/10 cursor-pointer overflow-hidden text-left disabled:opacity-70"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="size-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 z-10">
                    <span className="material-symbols-outlined text-3xl">chat_bubble</span>
                  </div>
                  <div className="flex flex-col gap-1 z-10">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chat Tira-Dúvidas</h3>
                    <p className="text-[#9dabb9] text-sm">Converse com a IA em tempo real para esclarecer conceitos.</p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center text-emerald-400 text-sm font-bold group-hover:underline">
                    Iniciar chat <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                  </div>
                </button>
              </div>

              {/* PDF Analysis Section */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2">
                  <span className="material-symbols-outlined text-[#137fec]">picture_as_pdf</span>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Analisar PDF</h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Upload Area */}
                  <button
                    onClick={handleAnalisarPDF}
                    disabled={checkingLimit}
                    className="flex-1 border-2 border-dashed border-gray-300 dark:border-[#283039] rounded-xl bg-gray-50 dark:bg-[#1C252E]/50 p-8 flex flex-col items-center justify-center gap-4 text-center hover:border-[#137fec]/50 hover:bg-[#137fec]/5 transition-all cursor-pointer group min-h-[250px] disabled:opacity-70"
                  >
                    <div className="size-16 rounded-full bg-gray-200 dark:bg-[#283039] flex items-center justify-center text-[#9dabb9] group-hover:text-[#137fec] transition-colors">
                      <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">Arraste e solte seu PDF aqui</p>
                      <p className="text-[#9dabb9] text-sm">Suporta arquivos PDF até {isPro ? '100' : '50'}MB</p>
                    </div>
                    <span className="mt-2 px-6 py-2.5 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold rounded-lg shadow-lg shadow-[#137fec]/20 transition-all">
                      Selecionar arquivo
                    </span>
                  </button>

                  {/* Sidebar Options */}
                  <div className="w-full lg:w-80 flex flex-col gap-4 bg-white dark:bg-[#1C252E] p-6 rounded-xl border border-gray-200 dark:border-[#283039]">
                    <h3 className="font-bold text-gray-900 dark:text-white">O que você deseja gerar?</h3>

                    {/* Resumo Automático */}
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#283039] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes('resumo')}
                          onChange={() => toggleOption('resumo')}
                          className="peer size-5 cursor-pointer appearance-none rounded border border-[#9dabb9] checked:border-[#137fec] checked:bg-[#137fec] transition-all"
                        />
                        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 material-symbols-outlined text-sm">check</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Resumo Automático</span>
                        <span className="text-xs text-[#9dabb9]">Pontos chave do documento</span>
                      </div>
                    </label>

                    {/* Flashcards */}
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#283039] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes('flashcards')}
                          onChange={() => toggleOption('flashcards')}
                          className="peer size-5 cursor-pointer appearance-none rounded border border-[#9dabb9] checked:border-[#137fec] checked:bg-[#137fec] transition-all"
                        />
                        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 material-symbols-outlined text-sm">check</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Flashcards</span>
                        <span className="text-xs text-[#9dabb9]">Para revisão espaçada</span>
                      </div>
                    </label>

                    {/* Questões de Fixação */}
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#283039] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes('questoes')}
                          onChange={() => toggleOption('questoes')}
                          className="peer size-5 cursor-pointer appearance-none rounded border border-[#9dabb9] checked:border-[#137fec] checked:bg-[#137fec] transition-all"
                        />
                        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 material-symbols-outlined text-sm">check</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Questões de Fixação</span>
                        <span className="text-xs text-[#9dabb9]">Quiz múltipla escolha</span>
                      </div>
                    </label>

                    {/* Generate Button */}
                    <div className="mt-auto pt-2">
                      <p className="text-xs text-[#9dabb9] text-center mb-2">IA consumirá 1 crédito por página</p>
                      <button
                        onClick={handleAnalisarPDF}
                        disabled={selectedOptions.length === 0 || checkingLimit}
                        className={`w-full py-2.5 text-white font-bold rounded-lg transition-all ${
                          selectedOptions.length === 0 || checkingLimit
                            ? 'bg-[#283039] opacity-50 cursor-not-allowed'
                            : 'bg-[#283039] hover:bg-[#333d4a]'
                        }`}
                      >
                        Gerar Conteúdo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Créditos Info Card */}
              <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-xl border border-primary/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">token</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {isPro ? 'Você tem limites expandidos com o Estuda PRO!' : 'Quer mais recursos de IA?'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isPro ? 'Aproveite seus créditos extras mensais' : 'Faça upgrade para o Estuda PRO'}
                    </p>
                  </div>
                </div>
                <Link
                  href={isPro ? '/dashboard/creditos' : '/dashboard/assinatura'}
                  className="px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors whitespace-nowrap"
                >
                  {isPro ? 'Ver Créditos' : 'Ver Planos'}
                </Link>
              </div>

              {/* Recent Activity Section */}
              <div className="flex flex-col gap-4 pb-10">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Atividade Recente</h2>
                  <button className="text-sm font-medium text-[#137fec] hover:underline">Ver tudo</button>
                </div>

                <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] overflow-hidden">
                  {questoes.length > 0 ? (
                    questoes.slice(0, 3).map((questao, index) => (
                      <div
                        key={questao.id}
                        onClick={() => setActiveTab('questoes')}
                        className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#202b36] transition-colors cursor-pointer ${
                          index < Math.min(questoes.length, 3) - 1 ? 'border-b border-gray-100 dark:border-[#283039]' : ''
                        }`}
                      >
                        <div className="size-10 rounded-lg bg-[#137fec]/20 flex items-center justify-center text-[#137fec] shrink-0">
                          <span className="material-symbols-outlined text-xl">quiz</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            Questão: {questao.disciplina} {questao.assunto ? `- ${questao.assunto}` : ''}
                          </h4>
                          <p className="text-xs text-[#9dabb9]">
                            Gerado {new Date(questao.created_at).toLocaleDateString('pt-BR')} • {questao.banca} • {questao.dificuldade}
                          </p>
                        </div>
                        <div className="hidden sm:flex gap-2">
                          {questao.respondida && (
                            <span className={`px-2 py-1 rounded text-xs ${questao.acertou ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {questao.acertou ? 'Acertou' : 'Errou'}
                            </span>
                          )}
                          <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#9dabb9] hover:text-white">
                            <span className="material-symbols-outlined text-lg">arrow_forward_ios</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <span className="material-symbols-outlined text-4xl text-[#9dabb9] mb-2">history</span>
                      <p className="text-sm text-[#9dabb9]">Nenhuma atividade recente</p>
                      <p className="text-xs text-[#9dabb9]">Gere questões para começar</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'questoes' && (
            <div className="flex flex-col gap-4 pb-10">
              {/* Header com botão de gerar */}
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

              {/* Lista de questões */}
              <QuestoesIAList
                questoes={questoes}
                loading={loadingQuestoes}
                onRefresh={refresh}
                onAnswer={responderQuestao}
                onDelete={deletarQuestao}
                filtrosDisponiveis={filtrosDisponiveis}
                onFiltrar={buscarQuestoes}
              />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-5xl text-emerald-400">chat_bubble</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chat Tira-Dúvidas</h2>
              <p className="text-[#9dabb9] max-w-md mb-6">
                Converse com a IA para tirar dúvidas sobre qualquer assunto.
                Suas conversas ficam salvas para consulta futura.
              </p>
              <button
                onClick={handleIniciarChat}
                disabled={checkingLimit}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
              >
                <span className="material-symbols-outlined">add</span>
                Iniciar Nova Conversa
              </button>
              <p className="text-xs text-[#9dabb9] mt-4">Em breve...</p>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-5xl text-purple-400">picture_as_pdf</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Análise de PDF</h2>
              <p className="text-[#9dabb9] max-w-md mb-6">
                Faça upload de PDFs e gere automaticamente resumos, flashcards e questões
                baseados no conteúdo do documento.
              </p>
              <button
                onClick={handleAnalisarPDF}
                disabled={checkingLimit}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
              >
                <span className="material-symbols-outlined">upload_file</span>
                Enviar PDF
              </button>
              <p className="text-xs text-[#9dabb9] mt-4">Em breve...</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Limite Bloqueado */}
      <LimitBlockedModal
        isOpen={blockedModal.isOpen}
        onClose={() => setBlockedModal(prev => ({ ...prev, isOpen: false }))}
        recurso={blockedModal.recurso}
        usado={blockedModal.usado}
        limite={blockedModal.limite}
        tipo={blockedModal.tipo}
        isPro={isPro}
      />

      {/* Modal do Gerador de Questões */}
      <GeradorQuestoesModal
        isOpen={showGeradorModal}
        onClose={() => setShowGeradorModal(false)}
        onSuccess={handleQuestoesGeradas}
      />
    </div>
  )
}
