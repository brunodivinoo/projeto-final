'use client'

import { useState, useEffect } from 'react'
import { X, Crown, Zap, Check, Clock, Lock, Sparkles, ArrowRight } from 'lucide-react'
import { useMedAuth, LIMITES_PLANO, PRECOS_PLANO } from '@/contexts/MedAuthContext'

export type ModalTipo =
  | 'trial_expirado'
  | 'limite_questoes'
  | 'limite_chat'
  | 'feature_bloqueada'
  | 'conquista'
  | 'trial_disponivel'

interface UpgradeModalProps {
  tipo: ModalTipo
  feature?: string
  conquista?: {
    nome: string
    descricao: string
    icone: string
    pontos: number
  }
  onClose: () => void
}

const MODAL_CONTENT: Record<ModalTipo, {
  titulo: string
  subtitulo: string
  icone: React.ReactNode
  corGradiente: string
  corIcone: string
}> = {
  trial_expirado: {
    titulo: 'Seu período de teste acabou',
    subtitulo: 'Continue sua jornada de estudos com um plano',
    icone: <Clock className="w-8 h-8" />,
    corGradiente: 'from-amber-500 to-orange-600',
    corIcone: 'text-amber-400 bg-amber-500/20',
  },
  limite_questoes: {
    titulo: 'Limite de questões atingido',
    subtitulo: 'Você completou suas questões de hoje',
    icone: <Check className="w-8 h-8" />,
    corGradiente: 'from-blue-500 to-cyan-600',
    corIcone: 'text-blue-400 bg-blue-500/20',
  },
  limite_chat: {
    titulo: 'Mensagens esgotadas',
    subtitulo: 'Você usou todas as mensagens do mês',
    icone: <Zap className="w-8 h-8" />,
    corGradiente: 'from-purple-500 to-pink-600',
    corIcone: 'text-purple-400 bg-purple-500/20',
  },
  feature_bloqueada: {
    titulo: 'Recurso Premium',
    subtitulo: 'Desbloqueie para acessar',
    icone: <Lock className="w-8 h-8" />,
    corGradiente: 'from-emerald-500 to-teal-600',
    corIcone: 'text-emerald-400 bg-emerald-500/20',
  },
  conquista: {
    titulo: 'Parabéns!',
    subtitulo: 'Você desbloqueou uma conquista',
    icone: <Crown className="w-8 h-8" />,
    corGradiente: 'from-amber-400 to-yellow-500',
    corIcone: 'text-amber-400 bg-amber-500/20',
  },
  trial_disponivel: {
    titulo: 'Teste grátis disponível!',
    subtitulo: 'Experimente 4 horas de acesso completo',
    icone: <Sparkles className="w-8 h-8" />,
    corGradiente: 'from-violet-500 to-purple-600',
    corIcone: 'text-violet-400 bg-violet-500/20',
  },
}

export function UpgradeModal({ tipo, feature, conquista, onClose }: UpgradeModalProps) {
  const { plano, iniciarTrial, trialStatus } = useMedAuth()
  const [iniciandoTrial, setIniciandoTrial] = useState(false)
  const content = MODAL_CONTENT[tipo]

  // Para conquistas, fechar automaticamente após 5 segundos
  useEffect(() => {
    if (tipo === 'conquista') {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [tipo, onClose])

  const handleIniciarTrial = async () => {
    setIniciandoTrial(true)
    const sucesso = await iniciarTrial()
    setIniciandoTrial(false)
    if (sucesso) {
      onClose()
    }
  }

  const planoSugerido = plano === 'gratuito' ? 'premium' : 'residencia'
  const planoSugeridoNome = plano === 'gratuito' ? 'Premium' : 'Residência'
  const precoSugerido = PRECOS_PLANO[planoSugerido]
  const limitesSugeridos = LIMITES_PLANO[planoSugerido]

  // Modal de conquista (diferente)
  if (tipo === 'conquista' && conquista) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl max-w-sm w-full p-6 relative shadow-2xl animate-scaleIn">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">{conquista.icone}</div>
            <p className="text-white/70 text-sm mb-1">Nova conquista!</p>
            <h2 className="text-2xl font-bold text-white mb-2">{conquista.nome}</h2>
            <p className="text-white/80 mb-4">{conquista.descricao}</p>
            <div className="inline-block px-4 py-2 bg-white/20 rounded-full">
              <span className="text-white font-bold">+{conquista.pontos} pontos</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl animate-scaleIn">
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone */}
        <div className={`w-16 h-16 rounded-2xl ${content.corIcone} flex items-center justify-center mx-auto mb-4`}>
          {content.icone}
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-white text-center mb-2">
          {content.titulo}
        </h2>
        <p className="text-white/60 text-center mb-6">
          {content.subtitulo}
          {feature && (
            <span className="block mt-1 text-blue-400 font-medium">{feature}</span>
          )}
        </p>

        {/* Opção de Trial (se disponível) */}
        {plano === 'gratuito' && !trialStatus.ativo && !trialStatus.expirado && tipo !== 'trial_expirado' && (
          <div className="mb-4 p-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <span className="font-medium text-white">Experimente grátis!</span>
            </div>
            <p className="text-white/60 text-sm mb-3">
              Teste todas as funcionalidades premium por 4 horas, sem compromisso.
            </p>
            <button
              onClick={handleIniciarTrial}
              disabled={iniciandoTrial}
              className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {iniciandoTrial ? 'Ativando...' : 'Ativar Trial de 4h'}
            </button>
          </div>
        )}

        {/* Benefícios do plano */}
        <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-white/70 mb-3">
            Com o plano <span className="font-bold text-white">{planoSugeridoNome}</span> você tem:
          </p>
          <ul className="space-y-2 text-sm">
            {plano === 'gratuito' ? (
              <>
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {limitesSugeridos.questoes_dia} questões por dia
                </li>
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {limitesSugeridos.perguntas_ia_mes} mensagens de IA por mês
                </li>
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Simulados e flashcards
                </li>
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Gabarito comentado completo
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Questões e chat ILIMITADOS
                </li>
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Casos clínicos por voz
                </li>
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Análise de exames com IA
                </li>
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Claude Opus (IA mais avançada)
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors text-white"
          >
            {tipo === 'limite_questoes' ? 'Volto amanhã' : 'Agora não'}
          </button>
          <button
            onClick={() => window.location.href = '/medicina/planos'}
            className={`flex-1 py-3 bg-gradient-to-r ${content.corGradiente} hover:opacity-90 rounded-xl font-medium transition-all text-white flex items-center justify-center gap-2`}
          >
            Ver planos
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Preço */}
        <p className="text-center text-white/40 text-xs mt-4">
          {planoSugeridoNome} a partir de R${precoSugerido}/mês
        </p>
      </div>
    </div>
  )
}

// CSS para animações (adicionar ao globals.css ou usar aqui com style jsx)
export const upgradeModalStyles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

.animate-scaleIn {
  animation: scaleIn 0.2s ease-out;
}
`
