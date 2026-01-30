'use client'

/**
 * Ações Rápidas - Sugestões personalizadas na tela inicial
 * Versão 2.0 - Com sugestões completas e inteligentes
 * 
 * Melhorias:
 * - Labels completos (não mais "de..." truncado)
 * - Prompts inteligentes baseados em assuntos populares
 * - Animações suaves
 * - Melhor UX no mobile
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export interface QuickAction {
  icon: string
  label: string
  prompt: string
  category: string
  fullLabel?: string // Label completo para tooltip/display
}

interface QuickActionsProps {
  actions: QuickAction[]
  onSelect: (action: QuickAction) => void
  className?: string
  userTopics?: string[] // Assuntos que o usuário mais pesquisa
}

// Lista de assuntos médicos populares para completar sugestões
const POPULAR_TOPICS = [
  'Infarto Agudo do Miocárdio',
  'AVC Isquêmico',
  'Pneumonia Comunitária',
  'Diabetes Mellitus Tipo 2',
  'Hipertensão Arterial',
  'Insuficiência Cardíaca',
  'Asma Brônquica',
  'DPOC',
  'Cirrose Hepática',
  'Insuficiência Renal',
  'Sepse',
  'Meningite Bacteriana',
  'Cetoacidose Diabética',
  'Pancreatite Aguda',
  'Apendicite Aguda',
  'Colecistite Aguda',
  'Trombose Venosa Profunda',
  'Embolia Pulmonar',
  'Choque Séptico',
  'Doença de Crohn'
]

// Especialidades médicas para planos de estudo
const SPECIALTIES = [
  'Clínica Médica',
  'Cirurgia Geral',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Cardiologia',
  'Neurologia',
  'Ortopedia',
  'Dermatologia',
  'Psiquiatria',
  'Emergência'
]

export function QuickActions({ actions, onSelect, className = '', userTopics = [] }: QuickActionsProps) {
  const [enhancedActions, setEnhancedActions] = useState<QuickAction[]>([])

  // Combinar assuntos do usuário com populares
  useEffect(() => {
    const availableTopics = userTopics.length > 0 
      ? [...userTopics, ...POPULAR_TOPICS.filter(t => !userTopics.includes(t))]
      : POPULAR_TOPICS

    // Melhorar as ações com sugestões completas
    const enhanced = actions.map((action, index) => {
      // Se o prompt termina com espaço, completar com um tópico
      if (action.prompt.endsWith(' ')) {
        const topic = availableTopics[index % availableTopics.length]
        const specialty = SPECIALTIES[index % SPECIALTIES.length]
        
        let suggestion = topic
        
        // Sugestões específicas por categoria
        if (action.category === 'plano') {
          suggestion = specialty
        } else if (action.category === 'simulado') {
          suggestion = specialty
        }

        return {
          ...action,
          fullLabel: action.label.replace('...', suggestion),
          // Manter o prompt original para permitir personalização
        }
      }
      return action
    })

    setEnhancedActions(enhanced)
  }, [actions, userTopics])

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 ${className}`}>
      {enhancedActions.map((action, index) => (
        <motion.button
          key={action.category + index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(action)}
          className="quick-action-card flex items-start gap-2.5 md:gap-3 p-3 md:p-4 rounded-xl 
                     bg-white/[0.03] hover:bg-white/[0.08]
                     border border-white/[0.08] hover:border-emerald-500/30 
                     transition-all duration-200
                     text-left group min-h-[72px]"
          title={action.fullLabel || action.label}
        >
          <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform flex-shrink-0 mt-0.5">
            {action.icon}
          </span>
          <div className="flex-1 min-w-0">
            <span className="text-white/80 text-xs md:text-sm group-hover:text-white transition-colors line-clamp-2">
              {action.fullLabel || action.label}
            </span>
            {action.fullLabel && action.fullLabel !== action.label && (
              <span className="block text-[10px] text-emerald-400/60 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Clique para personalizar
              </span>
            )}
          </div>
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
  topicosFrequentes?: string[] // Tópicos mais buscados pelo usuário
  especialidadeFoco?: string
}

export function generatePersonalizedActions(profile?: UserProfileForActions | null): QuickAction[] {
  // Pegar tópico aleatório para variar sugestões
  const getRandomTopic = () => POPULAR_TOPICS[Math.floor(Math.random() * POPULAR_TOPICS.length)]
  const getRandomSpecialty = () => SPECIALTIES[Math.floor(Math.random() * SPECIALTIES.length)]

  const baseActions: QuickAction[] = [
    {
      icon: '📝',
      label: 'Crie questões sobre...',
      fullLabel: `Crie questões sobre ${profile?.topicosFrequentes?.[0] || getRandomTopic()}`,
      prompt: 'Crie 5 questões de múltipla escolha sobre ',
      category: 'questoes'
    },
    {
      icon: '🃏',
      label: 'Gere flashcards de...',
      fullLabel: `Gere flashcards de ${profile?.ultimoAssuntoEstudado || getRandomTopic()}`,
      prompt: 'Crie flashcards para estudar ',
      category: 'flashcards'
    },
    {
      icon: '📊',
      label: 'Monte um simulado de...',
      fullLabel: `Monte um simulado de ${profile?.especialidadeFoco || getRandomSpecialty()}`,
      prompt: 'Monte um simulado com 10 questões sobre ',
      category: 'simulado'
    },
    {
      icon: '📚',
      label: 'Resuma o tema...',
      fullLabel: `Resuma o tema ${profile?.topicosFrequentes?.[1] || getRandomTopic()}`,
      prompt: 'Faça um resumo completo sobre ',
      category: 'resumo'
    },
    {
      icon: '🧠',
      label: 'Explique com imagens...',
      fullLabel: `Explique com imagens ${profile?.topicosFrequentes?.[2] || 'Anatomia do Coração'}`,
      prompt: 'Explique com imagens e detalhes sobre ',
      category: 'explicacao'
    },
    {
      icon: '📅',
      label: 'Crie plano de estudos',
      fullLabel: `Crie plano de estudos para ${profile?.especialidadeFoco || 'Residência Médica'}`,
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
      label: `Continuar: ${assuntoFavorito}`,
      fullLabel: `Continuar estudando ${assuntoFavorito}`,
      prompt: `Quero continuar estudando ${assuntoFavorito}. `,
      category: 'continuar'
    })
  }

  // Se tem último assunto estudado
  if (profile?.ultimoAssuntoEstudado) {
    personalizedActions.push({
      icon: '🔄',
      label: `Revisar: ${profile.ultimoAssuntoEstudado.slice(0, 20)}`,
      fullLabel: `Revisar ${profile.ultimoAssuntoEstudado}`,
      prompt: `Quero revisar ${profile.ultimoAssuntoEstudado}. Crie questões de revisão.`,
      category: 'revisao'
    })
  }

  // Se tem questões pendentes de revisão
  if (profile?.questoesPendentesRevisao && profile.questoesPendentesRevisao > 0) {
    personalizedActions.push({
      icon: '❌',
      label: `Revisar ${profile.questoesPendentesRevisao} questões erradas`,
      fullLabel: `Revisar ${profile.questoesPendentesRevisao} questões que você errou`,
      prompt: 'Quero revisar as questões que errei anteriormente',
      category: 'revisao_erros'
    })
  }

  // Combinar personalizadas com base, limitando a 6
  const allActions = [...personalizedActions, ...baseActions]
  return allActions.slice(0, 6)
}
