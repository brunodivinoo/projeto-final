'use client'

import { useState } from 'react'
import { useBadges } from '@/hooks/useBadges'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { Trophy, Flame, Target, Star, Lock, X, ChevronRight } from 'lucide-react'

// Componente de exibição de badges do usuário
export function BadgeDisplay() {
  const { meusBadges, badges, ranking, loading } = useBadges()
  const { plano } = useMedAuth()

  const planoBadge = plano === 'residencia' ? '👑' : plano === 'premium' ? '💎' : '🆓'
  const planoNome = plano === 'residencia' ? 'Residência' : plano === 'premium' ? 'Premium' : 'Gratuito'

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-4 animate-pulse">
        <div className="h-12 bg-slate-700 rounded-lg mb-4" />
        <div className="h-16 bg-slate-700 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      {/* Plano Badge */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{planoBadge}</span>
        <div>
          <p className="font-semibold text-white">{planoNome}</p>
          <p className="text-white/50 text-xs">Seu plano atual</p>
        </div>
      </div>

      {/* Sequência */}
      {ranking && (
        <div className="mb-4 p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/30 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">{ranking.sequencia_atual} dias</p>
              <p className="text-xs text-white/50">Sequência atual</p>
            </div>
            {ranking.maior_sequencia > ranking.sequencia_atual && (
              <div className="text-right">
                <p className="text-white/70 text-sm">Recorde: {ranking.maior_sequencia}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estatísticas rápidas */}
      {ranking && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 bg-slate-700/50 rounded-lg text-center">
            <p className="text-lg font-bold text-white">{ranking.questoes_total}</p>
            <p className="text-[10px] text-white/50">Questões</p>
          </div>
          <div className="p-2 bg-slate-700/50 rounded-lg text-center">
            <p className="text-lg font-bold text-purple-400">{ranking.pontos_total}</p>
            <p className="text-[10px] text-white/50">Pontos</p>
          </div>
          <div className="p-2 bg-slate-700/50 rounded-lg text-center">
            <p className="text-lg font-bold text-emerald-400">{meusBadges.length}</p>
            <p className="text-[10px] text-white/50">Badges</p>
          </div>
        </div>
      )}

      {/* Badges conquistados */}
      <h3 className="text-sm text-white/50 mb-2 font-medium">Conquistas</h3>
      <div className="flex flex-wrap gap-2">
        {meusBadges.map((badge) => (
          <div
            key={badge.id}
            className="p-2 bg-slate-700 rounded-lg text-center hover:bg-slate-600 transition-colors cursor-help"
            title={`${badge.nome}: ${badge.descricao}`}
          >
            <span className="text-xl">{badge.icone}</span>
          </div>
        ))}

        {/* Badges não conquistados (próximos) */}
        {badges
          .filter(b => !meusBadges.find(mb => mb.id === b.id))
          .slice(0, 3)
          .map((badge) => (
            <div
              key={badge.id}
              className="p-2 bg-slate-900/50 rounded-lg text-center opacity-50 cursor-help"
              title={`${badge.nome}: ${badge.descricao}`}
            >
              <span className="text-xl grayscale">🔒</span>
            </div>
          ))}
      </div>
    </div>
  )
}

// Componente de ranking
interface RankingDisplayProps {
  tipo?: 'semana' | 'mes' | 'total'
  limite?: number
}

export function RankingDisplay({ tipo = 'semana', limite = 10 }: RankingDisplayProps) {
  const { rankingGeral, fetchRankingGeral, loading } = useBadges()
  const { user } = useMedAuth()
  const [tipoAtivo, setTipoAtivo] = useState(tipo)

  // Buscar ranking ao montar ou trocar tipo
  useState(() => {
    fetchRankingGeral(tipoAtivo)
  })

  const handleTipoChange = (novoTipo: 'semana' | 'mes' | 'total') => {
    setTipoAtivo(novoTipo)
    fetchRankingGeral(novoTipo)
  }

  const tiposLabel = {
    semana: 'Semanal',
    mes: 'Mensal',
    total: 'Geral'
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      {/* Header com tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-white">Ranking</h3>
        </div>

        <div className="flex gap-1">
          {(['semana', 'mes', 'total'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTipoChange(t)}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                tipoAtivo === t
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tiposLabel[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de ranking */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {rankingGeral.slice(0, limite).map((item) => {
            const isMe = item.user_id === user?.id
            const medalha = item.posicao === 1 ? '🥇' : item.posicao === 2 ? '🥈' : item.posicao === 3 ? '🥉' : null

            return (
              <div
                key={item.user_id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isMe ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-slate-700/50'
                }`}
              >
                {/* Posição */}
                <div className="w-8 text-center">
                  {medalha ? (
                    <span className="text-lg">{medalha}</span>
                  ) : (
                    <span className="text-white/50 text-sm">#{item.posicao}</span>
                  )}
                </div>

                {/* Avatar e nome */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm">
                    {item.avatar_url ? (
                      <img src={item.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white/50">{item.nome.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className={`truncate ${isMe ? 'text-white font-medium' : 'text-white/80'}`}>
                    {isMe ? 'Você' : item.nome}
                  </span>
                </div>

                {/* Pontos */}
                <div className="text-right">
                  <span className={`font-bold ${isMe ? 'text-purple-400' : 'text-amber-400'}`}>
                    {item.pontos}
                  </span>
                  <span className="text-white/40 text-xs ml-1">pts</span>
                </div>
              </div>
            )
          })}

          {rankingGeral.length === 0 && (
            <p className="text-center text-white/50 py-4">Nenhum dado disponível</p>
          )}
        </div>
      )}
    </div>
  )
}

// Notificação de novo badge conquistado
interface BadgeNotificationProps {
  badge: {
    nome: string
    descricao: string
    icone: string
    pontos: number
  }
  onClose: () => void
}

export function BadgeNotification({ badge, onClose }: BadgeNotificationProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-4 shadow-2xl max-w-sm">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white/70 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-3xl">{badge.icone}</span>
          </div>
          <div className="flex-1">
            <p className="text-white/70 text-xs">Nova conquista!</p>
            <p className="text-white font-bold">{badge.nome}</p>
            <p className="text-white/80 text-sm">{badge.descricao}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
          <span className="text-white/70 text-sm">+{badge.pontos} pontos</span>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-white text-sm font-medium hover:underline"
          >
            Continuar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Mini widget para sidebar/header
export function BadgeMiniWidget() {
  const { ranking, meusBadges } = useBadges()
  const { plano } = useMedAuth()

  const planoBadge = plano === 'residencia' ? '👑' : plano === 'premium' ? '💎' : '🆓'

  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{planoBadge}</span>
      {ranking && (
        <>
          <div className="flex items-center gap-1 text-orange-400">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-medium">{ranking.sequencia_atual}</span>
          </div>
          <div className="flex items-center gap-1 text-purple-400">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">{ranking.pontos_total}</span>
          </div>
        </>
      )}
    </div>
  )
}
