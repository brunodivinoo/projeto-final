'use client'

import { Crown, Lock, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface GabaritoBlurProps {
  children: React.ReactNode
  mostrarBlur: boolean
  tipo: 'gabarito' | 'explicacao'
}

export function GabaritoBlur({ children, mostrarBlur, tipo }: GabaritoBlurProps) {
  if (!mostrarBlur) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {/* Conteudo com blur */}
      <div className="blur-md select-none pointer-events-none">
        {children}
      </div>

      {/* Overlay com CTA */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6 max-w-sm">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <h4 className="text-lg font-semibold text-white mb-2">
            {tipo === 'gabarito' ? 'Gabarito Bloqueado' : 'Explicacao Bloqueada'}
          </h4>

          <p className="text-white/70 text-sm mb-4">
            Faca upgrade para ver {tipo === 'gabarito' ? 'o gabarito' : 'a explicacao completa'} e
            acelere seus estudos!
          </p>

          <Link
            href="/medicina/dashboard/assinatura"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-amber-500/25"
          >
            <Crown className="w-5 h-5" />
            Desbloquear Agora
          </Link>

          <p className="text-white/50 text-xs mt-3">
            A partir de R$ 29,90/mes
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente para feedback apos responder questao (usuario FREE sem trial)
interface UpgradeFeedbackProps {
  show: boolean
}

export function UpgradeFeedback({ show }: UpgradeFeedbackProps) {
  if (!show) return null

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-200 font-medium">
            Resposta registrada!
          </p>
          <p className="text-amber-200/70 text-sm mt-1">
            Faca upgrade para ver se acertou e acessar a explicacao completa.
          </p>
          <Link
            href="/medicina/dashboard/assinatura"
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Crown className="w-4 h-4" />
            Ver planos
          </Link>
        </div>
      </div>
    </div>
  )
}
