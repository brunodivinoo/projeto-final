'use client'
import { useRanking, getCorPodio } from '@/hooks/useRanking'
import { NIVEIS_CONFIG } from '@/hooks/useXP'
import Link from 'next/link'

export function RankingCard() {
  const { ranking, userPosition, userRanking, semanaAtual, loading } = useRanking()

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const top5 = ranking.slice(0, 5)

  return (
    <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-500">leaderboard</span>
            Ranking Semanal
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">{semanaAtual}</span>
        </div>
      </div>

      {/* Sua posição */}
      {userRanking && (
        <div className={`p-4 border-b border-slate-200 dark:border-slate-700 ${
          userPosition && userPosition <= 3 ? 'bg-yellow-500/5' : 'bg-primary/5'
        }`}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: getCorPodio(userRanking.posicao) }}
            >
              #{userRanking.posicao}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Sua posição</p>
              <p className="text-xs text-slate-500">{userRanking.xpSemana.toLocaleString()} XP esta semana</p>
            </div>
            {userPosition && userPosition <= 10 && (
              <span className="material-symbols-outlined text-green-500">trending_up</span>
            )}
          </div>
        </div>
      )}

      {/* Top 5 */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {top5.map((user) => {
          const nivelInfo = NIVEIS_CONFIG.find(n => n.nivel === user.nivel) || NIVEIS_CONFIG[0]
          const isPodio = user.posicao <= 3

          return (
            <div
              key={user.userId}
              className={`flex items-center gap-3 p-3 transition-colors ${
                user.isCurrentUser ? 'bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {/* Posição */}
              {isPodio ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${getCorPodio(user.posicao)}20` }}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: getCorPodio(user.posicao) }}
                  >
                    {user.posicao === 1 ? 'emoji_events' : user.posicao === 2 ? 'military_tech' : 'workspace_premium'}
                  </span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-500">{user.posicao}</span>
                </div>
              )}

              {/* Avatar */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.nome.charAt(0)}
                </div>
                {user.isPro && (
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[8px]">workspace_premium</span>
                  </div>
                )}
              </div>

              {/* Nome */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  user.isCurrentUser ? 'text-primary' : 'text-slate-900 dark:text-white'
                }`}>
                  {user.isCurrentUser ? 'Você' : user.nome}
                </p>
              </div>

              {/* XP */}
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {user.xpSemana.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <Link
          href="/dashboard/ranking"
          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
        >
          Ver ranking completo
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  )
}
