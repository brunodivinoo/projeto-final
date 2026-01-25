'use client'

/**
 * Indicador de Limites de Uso
 * Mostra uso atual vs limite do plano de forma não intrusiva
 * Inspirado na Meta AI: transparente e justo, não frustrante
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Sparkles, ChevronDown, Zap, MessageSquare, FileText, Brain } from 'lucide-react'
import Link from 'next/link'

export interface UsageLimitsProps {
  usage: {
    mensagens: number
    questoes: number
    simulados: number
    flashcards: number
  }
  limits: {
    mensagens: number
    questoes: number
    simulados: number
    flashcards: number
  }
  plan: 'gratuito' | 'premium' | 'residencia'
  className?: string
}

export function UsageLimits({ usage, limits, plan, className = '' }: UsageLimitsProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Calcular porcentagem de uso geral (baseado em mensagens como principal)
  const usagePercent = limits.mensagens > 0
    ? Math.round((usage.mensagens / limits.mensagens) * 100)
    : 0
  const isNearLimit = usagePercent >= 80
  const isAtLimit = usagePercent >= 100

  // Cor baseada no uso
  const getColor = () => {
    if (isAtLimit) return 'text-red-400'
    if (isNearLimit) return 'text-amber-400'
    return 'text-emerald-400'
  }

  const getBarColor = () => {
    if (isAtLimit) return 'bg-red-500'
    if (isNearLimit) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  // Ícone do plano
  const getPlanIcon = () => {
    switch (plan) {
      case 'residencia': return <Crown className="w-4 h-4 text-amber-400" />
      case 'premium': return <Sparkles className="w-4 h-4 text-emerald-400" />
      default: return <Zap className="w-4 h-4 text-white/60" />
    }
  }

  const getPlanLabel = () => {
    switch (plan) {
      case 'residencia': return 'Residência'
      case 'premium': return 'Premium'
      default: return 'Gratuito'
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10
                   border border-white/10 hover:border-white/20 transition-all"
      >
        {getPlanIcon()}

        {plan === 'gratuito' && limits.mensagens > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor()} transition-all`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${getColor()}`}>
              {usage.mensagens}/{limits.mensagens}
            </span>
          </div>
        )}

        {plan !== 'gratuito' && (
          <span className="text-xs text-white/70 font-medium">{getPlanLabel()}</span>
        )}

        <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown com detalhes */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 p-4 rounded-xl border border-white/10
                       shadow-xl shadow-black/50 z-50"
            style={{ backgroundColor: '#0f172a' }}
          >
            <div className="flex items-center gap-2 mb-4">
              {getPlanIcon()}
              <h4 className="text-white font-semibold">
                Plano {getPlanLabel()}
              </h4>
            </div>

            <div className="space-y-3">
              <UsageBar
                icon={<MessageSquare className="w-4 h-4" />}
                label="Mensagens hoje"
                current={usage.mensagens}
                max={limits.mensagens}
                unlimited={plan !== 'gratuito'}
              />
              <UsageBar
                icon={<FileText className="w-4 h-4" />}
                label="Questões geradas"
                current={usage.questoes}
                max={limits.questoes}
                unlimited={plan !== 'gratuito'}
              />
              <UsageBar
                icon={<Brain className="w-4 h-4" />}
                label="Simulados"
                current={usage.simulados}
                max={limits.simulados}
                unlimited={plan === 'residencia'}
              />
              <UsageBar
                icon={<Sparkles className="w-4 h-4" />}
                label="Flashcards"
                current={usage.flashcards}
                max={limits.flashcards}
                unlimited={plan !== 'gratuito'}
              />
            </div>

            {plan === 'gratuito' && (
              <Link
                href="/medicina/dashboard/assinatura"
                className="flex items-center justify-center gap-2 w-full mt-4 py-2.5 rounded-lg
                           bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700
                           text-white text-sm font-semibold transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Fazer upgrade
              </Link>
            )}

            {plan === 'premium' && (
              <Link
                href="/medicina/dashboard/assinatura"
                className="flex items-center justify-center gap-2 w-full mt-4 py-2.5 rounded-lg
                           bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700
                           text-white text-sm font-semibold transition-all"
              >
                <Crown className="w-4 h-4" />
                Upgrade para Residência
              </Link>
            )}

            {/* Dica para plano gratuito */}
            {plan === 'gratuito' && isNearLimit && (
              <p className="mt-3 text-xs text-white/40 text-center">
                Você está chegando no limite diário.
                <br />Faça upgrade para acesso ilimitado!
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay para fechar */}
      {showDetails && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  )
}

interface UsageBarProps {
  icon: React.ReactNode
  label: string
  current: number
  max: number
  unlimited?: boolean
}

function UsageBar({ icon, label, current, max, unlimited }: UsageBarProps) {
  const percent = unlimited ? 0 : max > 0 ? Math.round((current / max) * 100) : 0
  const isHigh = percent >= 80
  const isFull = percent >= 100

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-2 text-white/60">
          {icon}
          <span>{label}</span>
        </div>
        <span className={`font-medium ${
          unlimited ? 'text-emerald-400' :
          isFull ? 'text-red-400' :
          isHigh ? 'text-amber-400' : 'text-white/80'
        }`}>
          {unlimited ? '∞ ilimitado' : `${current}/${max}`}
        </span>
      </div>
      {!unlimited && (
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all rounded-full ${
              isFull ? 'bg-red-500' :
              isHigh ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
