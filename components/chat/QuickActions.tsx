'use client'

/**
 * Ações Rápidas - Sugestões personalizadas na tela inicial
 * Inspirado na Meta AI
 */

import { motion } from 'framer-motion'

export interface QuickAction {
  icon: string
  label: string
  prompt: string
  category: string
}

interface QuickActionsProps {
  actions: QuickAction[]
  onSelect: (action: QuickAction) => void
  className?: string
}

export function QuickActions({ actions, onSelect, className = '' }: QuickActionsProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${className}`}>
      {actions.map((action, index) => (
        <motion.button
          key={action.category + index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          onClick={() => onSelect(action)}
          className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10
                     border border-white/10 hover:border-emerald-500/30 transition-all
                     text-left group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">
            {action.icon}
          </span>
          <span className="text-white/80 text-sm group-hover:text-white transition-colors">
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  )
}

// Função para gerar ações rápidas personalizadas baseado no perfil do usuário
export interface UserProfileForActions {
  assuntosInteresse?: string[]
  questoesPendentesRevisao?: number
  ultimoAssuntoEstudado?: string
  plano?: string
}

export function generatePersonalizedActions(profile?: UserProfileForActions | null): QuickAction[] {
  const baseActions: QuickAction[] = [
    {
      icon: '📝',
      label: 'Crie questões sobre...',
      prompt: 'Crie 5 questões de múltipla escolha sobre ',
      category: 'questoes'
    },
    {
      icon: '🃏',
      label: 'Gere flashcards de...',
      prompt: 'Crie flashcards para estudar ',
      category: 'flashcards'
    },
    {
      icon: '📊',
      label: 'Monte um simulado de...',
      prompt: 'Monte um simulado com 10 questões sobre ',
      category: 'simulado'
    },
    {
      icon: '📚',
      label: 'Resuma o tema...',
      prompt: 'Faça um resumo completo sobre ',
      category: 'resumo'
    },
    {
      icon: '🧠',
      label: 'Explique com imagens...',
      prompt: 'Explique com imagens e detalhes sobre ',
      category: 'explicacao'
    },
    {
      icon: '📅',
      label: 'Crie plano de estudos',
      prompt: 'Crie um plano de estudos personalizado para ',
      category: 'plano'
    }
  ]

  const personalizedActions: QuickAction[] = []

  // Personalizar baseado no perfil (assuntos de interesse, histórico)
  if (profile?.assuntosInteresse && profile.assuntosInteresse.length > 0) {
    const assuntoFavorito = profile.assuntosInteresse[0]
    personalizedActions.push({
      icon: '⭐',
      label: `Continuar: ${assuntoFavorito.slice(0, 20)}...`,
      prompt: `Quero continuar estudando ${assuntoFavorito}. `,
      category: 'continuar'
    })
  }

  // Se tem último assunto estudado
  if (profile?.ultimoAssuntoEstudado) {
    personalizedActions.push({
      icon: '🔄',
      label: `Revisar: ${profile.ultimoAssuntoEstudado.slice(0, 18)}`,
      prompt: `Quero revisar ${profile.ultimoAssuntoEstudado}. Crie questões de revisão.`,
      category: 'revisao'
    })
  }

  // Se tem questões pendentes de revisão
  if (profile?.questoesPendentesRevisao && profile.questoesPendentesRevisao > 0) {
    personalizedActions.push({
      icon: '❌',
      label: `Revisar ${profile.questoesPendentesRevisao} questões erradas`,
      prompt: 'Quero revisar as questões que errei anteriormente',
      category: 'revisao_erros'
    })
  }

  // Combinar personalizadas com base, limitando a 6
  const allActions = [...personalizedActions, ...baseActions]
  return allActions.slice(0, 6)
}
