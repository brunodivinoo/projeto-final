'use client'
import { Header } from '@/components/layout/Header'
import { useRanking, getCorPodio, getIconePodio } from '@/hooks/useRanking'
import { useLimits } from '@/hooks/useLimits'
import { NIVEIS_CONFIG } from '@/hooks/useXP'
import Link from 'next/link'

export default function RankingPage() {
  const { ranking, userPosition, userRanking, totalParticipantes, semanaAtual, loading } = useRanking()
  const { isPro } = useLimits()

  // Separar top 3 do resto
  const podio = ranking.slice(0, 3)
  const resto = ranking.slice(3)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
        <Header title="Ranking" />
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/2" />
            <div className="flex justify-center gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-32 h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
      <Header title="Ranking" />

      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
              Ranking Semanal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              {semanaAtual}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {totalParticipantes} participantes
            </span>
            {userPosition && (
              <span className="px-4 py-2 rounded-full text-sm font-bold bg-primary/10 text-primary">
                Você está em #{userPosition}
              </span>
            )}
          </div>
        </div>

        {/* Card de posição do usuário */}
        {userRanking && (
          <div className={`rounded-2xl p-5 mb-8 border-2 ${
            userRanking.posicao <= 3
              ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
              : 'bg-white dark:bg-[#1c252e] border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black text-white"
                style={{ backgroundColor: getCorPodio(userRanking.posicao) }}
              >
                #{userRanking.posicao}
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-slate-900 dark:text-white">Sua Posição</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {userRanking.xpSemana.toLocaleString()} XP esta semana
                </p>
              </div>
              {userRanking.posicao <= 10 ? (
                <div className="text-center">
                  <span className="material-symbols-outlined text-3xl text-green-500">trending_up</span>
                  <p className="text-xs text-green-500 font-bold">Top 10!</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-slate-500">Faltam</p>
                  <p className="text-lg font-bold text-primary">
                    {ranking[9] ? (ranking[9].xpSemana - userRanking.xpSemana).toLocaleString() : 0} XP
                  </p>
                  <p className="text-xs text-slate-500">para o Top 10</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pódio - Top 3 */}
        <div className="flex justify-center items-end gap-3 lg:gap-6 mb-8">
          {/* 2º Lugar */}
          {podio[1] && (
            <div className="flex flex-col items-center">
              <div className={`relative mb-3 ${podio[1].isCurrentUser ? 'ring-4 ring-primary/50 rounded-full' : ''}`}>
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xl lg:text-2xl font-bold">
                  {podio[1].nome.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-400 flex items-center justify-center border-2 border-white dark:border-[#101922]">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                {podio[1].isPro && (
                  <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs">workspace_premium</span>
                  </div>
                )}
              </div>
              <div className="bg-slate-400/20 rounded-t-xl p-3 w-24 lg:w-32 h-24 lg:h-28 flex flex-col items-center justify-end">
                <p className="text-xs lg:text-sm font-bold text-slate-900 dark:text-white text-center truncate w-full">
                  {podio[1].nome}
                </p>
                <p className="text-xs text-slate-500">{podio[1].xpSemana.toLocaleString()} XP</p>
                <span className="material-symbols-outlined text-slate-400 text-2xl mt-1">military_tech</span>
              </div>
            </div>
          )}

          {/* 1º Lugar */}
          {podio[0] && (
            <div className="flex flex-col items-center -mt-4">
              <div className={`relative mb-3 ${podio[0].isCurrentUser ? 'ring-4 ring-primary/50 rounded-full' : ''}`}>
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shadow-lg shadow-yellow-500/30">
                  {podio[0].nome.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center border-2 border-white dark:border-[#101922]">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                {podio[0].isPro && (
                  <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs">workspace_premium</span>
                  </div>
                )}
              </div>
              <div className="bg-yellow-500/20 rounded-t-xl p-3 w-28 lg:w-36 h-32 lg:h-36 flex flex-col items-center justify-end">
                <p className="text-sm lg:text-base font-bold text-slate-900 dark:text-white text-center truncate w-full">
                  {podio[0].nome}
                </p>
                <p className="text-xs lg:text-sm text-slate-500">{podio[0].xpSemana.toLocaleString()} XP</p>
                <span className="material-symbols-outlined text-yellow-500 text-3xl mt-1">emoji_events</span>
              </div>
            </div>
          )}

          {/* 3º Lugar */}
          {podio[2] && (
            <div className="flex flex-col items-center">
              <div className={`relative mb-3 ${podio[2].isCurrentUser ? 'ring-4 ring-primary/50 rounded-full' : ''}`}>
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center text-white text-xl lg:text-2xl font-bold">
                  {podio[2].nome.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-700 flex items-center justify-center border-2 border-white dark:border-[#101922]">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                {podio[2].isPro && (
                  <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs">workspace_premium</span>
                  </div>
                )}
              </div>
              <div className="bg-orange-700/20 rounded-t-xl p-3 w-24 lg:w-32 h-20 lg:h-24 flex flex-col items-center justify-end">
                <p className="text-xs lg:text-sm font-bold text-slate-900 dark:text-white text-center truncate w-full">
                  {podio[2].nome}
                </p>
                <p className="text-xs text-slate-500">{podio[2].xpSemana.toLocaleString()} XP</p>
                <span className="material-symbols-outlined text-orange-700 text-2xl mt-1">workspace_premium</span>
              </div>
            </div>
          )}
        </div>

        {/* Lista do resto do ranking */}
        <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">leaderboard</span>
              Classificação Geral
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {resto.map((user) => {
              const nivelInfo = NIVEIS_CONFIG.find(n => n.nivel === user.nivel) || NIVEIS_CONFIG[0]

              return (
                <div
                  key={user.userId}
                  className={`flex items-center gap-4 p-4 transition-colors ${
                    user.isCurrentUser
                      ? 'bg-primary/5 border-l-4 border-primary'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {/* Posição */}
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className={`font-bold ${
                      user.posicao <= 10 ? 'text-primary' : 'text-slate-500'
                    }`}>
                      #{user.posicao}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                      {user.nome.charAt(0)}
                    </div>
                    {user.isPro && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[10px]">workspace_premium</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${
                      user.isCurrentUser ? 'text-primary' : 'text-slate-900 dark:text-white'
                    }`}>
                      {user.isCurrentUser ? `${user.nome} (você)` : user.nome}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${nivelInfo.cor}20`,
                          color: nivelInfo.cor
                        }}
                      >
                        Nv. {user.nivel}
                      </span>
                      {user.isPro && (
                        <span className="text-xs text-primary font-medium">PRO</span>
                      )}
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {user.xpSemana.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">XP</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Info sobre PRO */}
        {!isPro && (
          <div className="mt-8 bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined">bolt</span>
                  Ganhe 1.5x mais XP!
                </h3>
                <p className="text-white/80 text-sm">
                  Assinantes PRO ganham 50% mais XP em todas as ações e sobem mais rápido no ranking.
                </p>
              </div>
              <Link
                href="/dashboard/assinatura"
                className="bg-white text-primary font-bold py-3 px-6 rounded-xl hover:bg-blue-50 transition-colors shadow-lg inline-flex items-center gap-2 justify-center shrink-0"
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                Fazer Upgrade
              </Link>
            </div>
          </div>
        )}

        {/* Regras */}
        <div className="mt-8 bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">info</span>
            Como funciona o Ranking
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <p>O ranking é reiniciado toda segunda-feira à meia-noite</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <p>Apenas o XP ganho na semana atual conta para o ranking</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <p>Top 3 ganham badges especiais no perfil</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <p>Assinantes PRO ganham 1.5x mais XP</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
