'use client'

import { Crown, Lock, Eye, ChevronDown, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface GabaritoBlurProps {
  children: React.ReactNode
  mostrarBlur: boolean
  tipo: 'gabarito' | 'explicacao'
  textoPreview?: string // Texto para mostrar como teaser
}

export function GabaritoBlur({ children, mostrarBlur, tipo, textoPreview }: GabaritoBlurProps) {
  if (!mostrarBlur) {
    return <>{children}</>
  }

  // Extrair preview do texto (primeiras 150 caracteres)
  const preview = textoPreview
    ? textoPreview.substring(0, 150) + (textoPreview.length > 150 ? '...' : '')
    : null

  return (
    <div className="relative">
      {/* Preview/Teaser - Mostra uma parte do conteúdo */}
      {tipo === 'explicacao' && preview && (
        <div className="mb-4 p-4 bg-slate-100 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Prévia da Explicação</span>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            {preview}
          </p>
          <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs">
            <ChevronDown className="w-3 h-3" />
            <span>Continue lendo abaixo...</span>
          </div>
        </div>
      )}

      {/* Conteúdo com blur gradiente */}
      <div className="relative">
        <div className="blur-[6px] select-none pointer-events-none opacity-60">
          {children}
        </div>

        {/* Gradiente de fade suave */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/70 to-slate-900" />
      </div>

      {/* CTA para desbloquear */}
      <div className="relative -mt-8 pt-4 flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
          <Lock className="w-7 h-7 text-white" />
        </div>

        <h4 className="text-lg font-semibold text-white mb-2">
          {tipo === 'gabarito' ? 'Gabarito Completo Bloqueado' : 'Explicação Completa Bloqueada'}
        </h4>

        <p className="text-slate-600 text-sm mb-4 max-w-sm">
          {tipo === 'gabarito'
            ? 'Faça upgrade para ver o gabarito e conferir sua resposta!'
            : 'Desbloqueie para entender a lógica completa da questão e acelerar seu aprendizado!'
          }
        </p>

        <Link
          href="/medicina/dashboard/assinatura"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-amber-500/25 hover:scale-105"
        >
          <Crown className="w-5 h-5" />
          <span>Desbloquear Agora</span>
        </Link>

        <p className="text-slate-500 text-xs mt-3">
          A partir de R$59,90/mês • 7 dias de garantia
        </p>
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
