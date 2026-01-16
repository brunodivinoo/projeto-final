'use client'

import { useState } from 'react'
import { useTrialTimer } from '@/hooks/useTrialTimer'
import { useMedAuth } from '@/contexts/MedAuthContext'
import {
  Clock,
  Zap,
  X,
  Crown,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Gift
} from 'lucide-react'
import Link from 'next/link'

interface TrialBannerProps {
  variant?: 'full' | 'compact' | 'floating'
  onClose?: () => void
  showUpgradeButton?: boolean
}

export function TrialBanner({
  variant = 'full',
  onClose,
  showUpgradeButton = true
}: TrialBannerProps) {
  const { plano } = useMedAuth()
  const {
    isTrialActive,
    isTrialExpired,
    canStartTrial,
    tempoRestanteFormatado,
    percentualRestante,
    corBarra,
    mostrarUrgencia,
    iniciarTrial
  } = useTrialTimer()

  const [iniciando, setIniciando] = useState(false)
  const [mostrar, setMostrar] = useState(true)

  // Não mostrar para planos pagos
  if (plano !== 'gratuito') return null

  // Se fechou o banner
  if (!mostrar) return null

  const handleIniciarTrial = async () => {
    setIniciando(true)
    await iniciarTrial()
    setIniciando(false)
  }

  const handleClose = () => {
    setMostrar(false)
    onClose?.()
  }

  // ==========================================
  // BANNER: Pode iniciar trial (ainda não usou)
  // ==========================================
  if (canStartTrial) {
    if (variant === 'compact') {
      return (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            <span className="text-sm font-medium">4 horas grátis de acesso total!</span>
          </div>
          <button
            onClick={handleIniciarTrial}
            disabled={iniciando}
            className="bg-white text-purple-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            {iniciando ? 'Ativando...' : 'Ativar Trial'}
          </button>
        </div>
      )
    }

    return (
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 border border-purple-500/30 rounded-xl p-4 md:p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  Experimente GRÁTIS por 4 horas!
                </h3>
                <p className="text-purple-200 text-sm">
                  Acesso completo a TODAS as funcionalidades
                </p>
              </div>
            </div>
            {onClose && (
              <button onClick={handleClose} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { icon: '🤖', text: 'IA Ilimitada' },
              { icon: '📝', text: 'Questões' },
              { icon: '🃏', text: 'Flashcards' },
              { icon: '📚', text: 'Biblioteca' }
            ].map((item, i) => (
              <div key={i} className="bg-white/10 rounded-lg px-3 py-2 text-center">
                <span className="text-xl">{item.icon}</span>
                <p className="text-white text-xs mt-1">{item.text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleIniciarTrial}
            disabled={iniciando}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {iniciando ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Ativando...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Começar Trial Agora
              </>
            )}
          </button>

          <p className="text-purple-300 text-xs text-center mt-2">
            Sem cartão de crédito • Acesso imediato
          </p>
        </div>
      </div>
    )
  }

  // ==========================================
  // BANNER: Trial ativo (contagem regressiva)
  // ==========================================
  if (isTrialActive) {
    if (variant === 'compact') {
      return (
        <div className={`${mostrarUrgencia ? 'bg-gradient-to-r from-red-600 to-orange-600 animate-pulse' : 'bg-gradient-to-r from-emerald-600 to-teal-600'} text-white px-4 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Trial: {tempoRestanteFormatado} restantes
            </span>
          </div>
          {showUpgradeButton && (
            <Link
              href="/medicina/dashboard/assinatura"
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-bold transition-colors"
            >
              Assinar
            </Link>
          )}
        </div>
      )
    }

    if (variant === 'floating') {
      return (
        <div className={`fixed bottom-4 right-4 z-50 ${mostrarUrgencia ? 'animate-bounce' : ''}`}>
          <div className={`${mostrarUrgencia ? 'bg-red-600' : 'bg-slate-800'} border ${mostrarUrgencia ? 'border-red-500' : 'border-white/10'} rounded-xl p-3 shadow-lg`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${mostrarUrgencia ? 'bg-red-500' : 'bg-emerald-500'} flex items-center justify-center`}>
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Trial Ativo</p>
                <p className={`${mostrarUrgencia ? 'text-red-200' : 'text-emerald-400'} text-lg font-bold`}>
                  {tempoRestanteFormatado}
                </p>
              </div>
              {showUpgradeButton && (
                <Link
                  href="/medicina/dashboard/assinatura"
                  className="ml-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  Assinar
                </Link>
              )}
            </div>
            {/* Barra de progresso */}
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${corBarra} transition-all duration-1000`}
                style={{ width: `${percentualRestante}%` }}
              />
            </div>
          </div>
        </div>
      )
    }

    // Full variant
    return (
      <div className={`${mostrarUrgencia ? 'bg-gradient-to-r from-red-900 to-orange-900 border-red-500/30' : 'bg-gradient-to-r from-emerald-900 to-teal-900 border-emerald-500/30'} border rounded-xl p-4 relative`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${mostrarUrgencia ? 'bg-red-500' : 'bg-emerald-500'} flex items-center justify-center`}>
              {mostrarUrgencia ? (
                <AlertTriangle className="w-6 h-6 text-white" />
              ) : (
                <Clock className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-white font-bold flex items-center gap-2">
                {mostrarUrgencia ? (
                  <>Trial acabando!</>
                ) : (
                  <>Trial Ativo</>
                )}
              </h3>
              <p className={`${mostrarUrgencia ? 'text-red-200' : 'text-emerald-200'} text-2xl font-bold`}>
                {tempoRestanteFormatado}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Barra de progresso circular */}
            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-white/10"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={`${percentualRestante * 1.76} 176`}
                  className={mostrarUrgencia ? 'text-red-500' : 'text-emerald-500'}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                {percentualRestante}%
              </span>
            </div>

            {showUpgradeButton && (
              <Link
                href="/medicina/dashboard/assinatura"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Assinar
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${corBarra} transition-all duration-1000`}
            style={{ width: `${percentualRestante}%` }}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // BANNER: Trial expirado
  // ==========================================
  if (isTrialExpired) {
    if (variant === 'compact') {
      return (
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">Trial expirado</span>
          </div>
          <Link
            href="/medicina/dashboard/assinatura"
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-full text-xs font-bold transition-colors"
          >
            Assinar agora
          </Link>
        </div>
      )
    }

    return (
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border border-white/10 rounded-xl p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-600 flex items-center justify-center">
              <Clock className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Seu trial expirou</h3>
              <p className="text-slate-400 text-sm">
                Você experimentou todas as funcionalidades!
              </p>
            </div>
          </div>
          {onClose && (
            <button onClick={handleClose} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mt-4 p-4 bg-purple-900/30 border border-purple-500/20 rounded-lg">
          <p className="text-purple-200 text-sm mb-3">
            Continue com acesso completo a partir de <span className="text-white font-bold">R$60/mês</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/medicina/dashboard/assinatura"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Ver Planos
            </Link>
            <Link
              href="/medicina/dashboard"
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-medium transition-all flex items-center justify-center"
            >
              Continuar Grátis
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Componente separado para exibir apenas o timer
export function TrialTimer() {
  const { isTrialActive, tempoRestanteFormatado, corBarra, percentualRestante } = useTrialTimer()

  if (!isTrialActive) return null

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-white/60" />
      <span className="text-white font-medium text-sm">{tempoRestanteFormatado}</span>
      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${corBarra}`}
          style={{ width: `${percentualRestante}%` }}
        />
      </div>
    </div>
  )
}
