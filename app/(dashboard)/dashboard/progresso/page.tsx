'use client'
import { Header } from '@/components/layout/Header'
import { useXP, NIVEIS_CONFIG, XP_ACOES } from '@/hooks/useXP'
import { useLimits } from '@/hooks/useLimits'
import Link from 'next/link'

export default function ProgressoPage() {
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
    loading
  } = useXP()

  const { isPro } = useLimits()

  // Estatísticas mock (depois serão do Supabase)
  const estatisticas = {
    questoesRespondidas: 342,
    questoesCorretas: 278,
    simuladosCompletos: 12,
    resumosCriados: 8,
    flashcardsRevisados: 156,
    horasEstudadas: 47
  }

  const taxaAcerto = Math.round((estatisticas.questoesCorretas / estatisticas.questoesRespondidas) * 100)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
        <Header title="Progresso" />
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
      <Header title="Progresso" />

      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            Seu Progresso
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            Acompanhe sua evolução e conquistas na plataforma.
          </p>
        </div>

        {/* Card Principal - Nível */}
        <div
          className="relative rounded-2xl p-6 lg:p-8 mb-8 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${nivelInfo.cor}30, ${nivelInfo.cor}10)` }}
        >
          {/* Decorações */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: nivelInfo.cor }}
          />
          <div
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 blur-2xl"
            style={{ backgroundColor: nivelInfo.cor }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Ícone do nível */}
            <div
              className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl flex items-center justify-center relative"
              style={{ backgroundColor: `${nivelInfo.cor}40` }}
            >
              <span
                className="material-symbols-outlined text-6xl lg:text-7xl"
                style={{ color: nivelInfo.cor }}
              >
                {nivelInfo.icone}
              </span>
              <span
                className="absolute -bottom-2 -right-2 w-10 h-10 lg:w-12 lg:h-12 rounded-full text-lg lg:text-xl font-bold flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: nivelInfo.cor }}
              >
                {nivel}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Nível {nivel}</p>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-2">{nivelInfo.nome}</h2>
              <p className="text-2xl font-bold mb-4" style={{ color: nivelInfo.cor }}>
                {xpTotal.toLocaleString()} XP
              </p>

              {/* Barra de progresso */}
              {proximoNivel && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500 dark:text-slate-400">Progresso para Nível {proximoNivel.nivel}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{progressoNivel}%</span>
                  </div>
                  <div className="h-4 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressoNivel}%`,
                        backgroundColor: nivelInfo.cor
                      }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Faltam <span className="font-bold" style={{ color: nivelInfo.cor }}>{xpParaProximoNivel.toLocaleString()} XP</span> para alcançar {proximoNivel.nome}
                  </p>
                </div>
              )}
            </div>

            {/* Stats rápidos */}
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

        {/* Grid de estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{taxaAcerto}%</p>
            <p className="text-sm text-slate-500">Taxa de Acerto</p>
          </div>

          <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-blue-500">quiz</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{estatisticas.questoesRespondidas}</p>
            <p className="text-sm text-slate-500">Questões</p>
          </div>

          <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-purple-500">assignment</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{estatisticas.simuladosCompletos}</p>
            <p className="text-sm text-slate-500">Simulados</p>
          </div>

          <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-amber-500">schedule</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{estatisticas.horasEstudadas}h</p>
            <p className="text-sm text-slate-500">Estudadas</p>
          </div>
        </div>

        {/* Grid duas colunas */}
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
                Você ganha <span className="font-bold text-primary">50% mais XP</span> em todas as ações como assinante PRO!
              </p>
            )}
          </div>

          {/* Sequência de dias */}
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

            <div className="mt-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <p className="text-sm text-orange-600 dark:text-orange-400 text-center">
                {sequenciaDias >= 7
                  ? `Incrível! ${sequenciaDias} dias seguidos! Continue assim!`
                  : `Estude ${7 - sequenciaDias} dias seguidos para ganhar +100 XP bônus!`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Jornada de Níveis */}
        <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">trending_up</span>
            Jornada de Níveis
          </h3>

          <div className="relative">
            {/* Linha conectora */}
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
                      isAtual
                        ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-primary/30'
                        : ''
                    } ${isBloqueado ? 'opacity-50' : ''}`}
                  >
                    {/* Ícone do nível */}
                    <div
                      className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center ${
                        isCompleto ? 'bg-green-500/20' : ''
                      }`}
                      style={{
                        backgroundColor: isCompleto ? undefined : `${n.cor}20`
                      }}
                    >
                      {isCompleto ? (
                        <span className="material-symbols-outlined text-green-500 text-2xl">check_circle</span>
                      ) : (
                        <span
                          className="material-symbols-outlined text-2xl"
                          style={{ color: n.cor }}
                        >
                          {n.icone}
                        </span>
                      )}
                    </div>

                    {/* Info */}
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

                    {/* Status */}
                    {isCompleto && (
                      <span className="text-xs font-bold text-green-500">Completo</span>
                    )}
                    {isBloqueado && (
                      <span className="material-symbols-outlined text-slate-400">lock</span>
                    )}
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
              { acao: 'sequencia_7_dias', nome: 'Sequência 7 dias', icone: 'local_fire_department', cor: '#f97316' },
              { acao: 'sequencia_30_dias', nome: 'Sequência 30 dias', icone: 'whatshot', cor: '#dc2626' },
            ].map((item) => (
              <div
                key={item.acao}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${item.cor}20` }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: item.cor }}
                  >
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
