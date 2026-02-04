'use client'

import { memo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Search,
  FileText,
  CheckCircle,
  Loader2,
  Brain,
  Sparkles,
  Users,
  ClipboardList,
  Pencil,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

// Tipos de agentes disponíveis
export type AgentType =
  | 'researcher'
  | 'planner'
  | 'creator'
  | 'reviewer'
  | 'study_plan'
  | 'content_complex'

// Status possíveis do agente
export type AgentStatus =
  | 'starting'
  | 'researching'
  | 'planning'
  | 'creating'
  | 'reviewing'
  | 'completed'
  | 'error'

// Interface para o evento de status do agente
export interface AgentStatusEvent {
  type: 'agent_status'
  status: AgentStatus
  taskType?: AgentType
  message?: string
  agent?: string
  progress?: number
  currentStep?: number
  totalSteps?: number
}

// Configuração visual dos agentes
const AGENT_CONFIG: Record<string, {
  icon: React.ElementType
  label: string
  color: string
  bgColor: string
}> = {
  researcher: {
    icon: Search,
    label: 'Pesquisador',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  planner: {
    icon: ClipboardList,
    label: 'Planejador',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  creator: {
    icon: Pencil,
    label: 'Criador',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  reviewer: {
    icon: Eye,
    label: 'Revisor',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  },
  study_plan: {
    icon: FileText,
    label: 'Plano de Estudos',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10'
  },
  content_complex: {
    icon: Brain,
    label: 'Conteudo Complexo',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10'
  }
}

// Configuração visual dos status
const STATUS_CONFIG: Record<AgentStatus, {
  icon: React.ElementType
  label: string
  color: string
  animate: boolean
}> = {
  starting: {
    icon: Loader2,
    label: 'Iniciando',
    color: 'text-slate-400',
    animate: true
  },
  researching: {
    icon: Search,
    label: 'Pesquisando',
    color: 'text-blue-500',
    animate: true
  },
  planning: {
    icon: ClipboardList,
    label: 'Planejando',
    color: 'text-purple-500',
    animate: true
  },
  creating: {
    icon: Pencil,
    label: 'Criando',
    color: 'text-emerald-500',
    animate: true
  },
  reviewing: {
    icon: Eye,
    label: 'Revisando',
    color: 'text-amber-500',
    animate: true
  },
  completed: {
    icon: CheckCircle,
    label: 'Concluido',
    color: 'text-emerald-500',
    animate: false
  },
  error: {
    icon: Bot,
    label: 'Erro',
    color: 'text-red-500',
    animate: false
  }
}

interface AgentProgressIndicatorProps {
  status: AgentStatus
  taskType?: AgentType
  message?: string
  currentStep?: number
  totalSteps?: number
  executionLog?: string[]
  showDetails?: boolean
  onToggleDetails?: () => void
}

// Componente de passo individual
const AgentStep = memo(function AgentStep({
  step,
  isActive,
  isCompleted,
  label
}: {
  step: number
  isActive: boolean
  isCompleted: boolean
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
        transition-all duration-300
        ${isCompleted ? 'bg-emerald-500 text-white' :
          isActive ? 'bg-emerald-500/20 text-emerald-500 ring-2 ring-emerald-500/50' :
          'bg-slate-200 dark:bg-slate-700 text-slate-500'}
      `}>
        {isCompleted ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          step
        )}
      </div>
      <span className={`text-xs ${
        isActive ? 'text-emerald-600 dark:text-emerald-400 font-medium' :
        isCompleted ? 'text-slate-600 dark:text-slate-400' :
        'text-slate-400'
      }`}>
        {label}
      </span>
    </div>
  )
})

// Componente principal
export const AgentProgressIndicator = memo(function AgentProgressIndicator({
  status,
  taskType,
  message,
  currentStep = 0,
  totalSteps = 4,
  executionLog = [],
  showDetails = false,
  onToggleDetails
}: AgentProgressIndicatorProps) {
  const [showLog, setShowLog] = useState(false)
  const statusConfig = STATUS_CONFIG[status]
  const agentConfig = taskType ? AGENT_CONFIG[taskType] : null
  const StatusIcon = statusConfig.icon
  const AgentIcon = agentConfig?.icon || Bot

  // Passos padrao para multi-agentes
  const defaultSteps = [
    'Pesquisar',
    'Planejar',
    'Criar',
    'Revisar'
  ]

  const isCompleted = status === 'completed'
  const hasError = status === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        rounded-xl border p-4 mb-4
        ${hasError ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
          isCompleted ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' :
          'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Icone do agente */}
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${agentConfig?.bgColor || 'bg-emerald-500/10'}
          `}>
            <AgentIcon className={`w-5 h-5 ${agentConfig?.color || 'text-emerald-500'}`} />
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                Multi-Agentes
              </span>
              {agentConfig && (
                <span className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${agentConfig.bgColor} ${agentConfig.color}
                `}>
                  {agentConfig.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color} ${statusConfig.animate ? 'animate-spin' : ''}`} />
              <span className={`text-xs ${statusConfig.color}`}>
                {message || statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Botao de expandir */}
        {(executionLog.length > 0 || totalSteps > 1) && (
          <button
            onClick={() => onToggleDetails?.() || setShowLog(!showLog)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {showLog || showDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
        <motion.div
          className={`h-full rounded-full ${
            hasError ? 'bg-red-500' :
            isCompleted ? 'bg-emerald-500' :
            'bg-emerald-500'
          }`}
          initial={{ width: 0 }}
          animate={{
            width: isCompleted ? '100%' :
                   hasError ? '100%' :
                   `${((currentStep + 1) / totalSteps) * 100}%`
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Passos */}
      <AnimatePresence>
        {(showLog || showDetails) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Timeline de passos */}
            <div className="grid grid-cols-4 gap-2 mb-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              {defaultSteps.map((step, index) => (
                <AgentStep
                  key={step}
                  step={index + 1}
                  isActive={currentStep === index && !isCompleted}
                  isCompleted={currentStep > index || isCompleted}
                  label={step}
                />
              ))}
            </div>

            {/* Log de execucao */}
            {executionLog.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 mb-2">Log de Execucao</p>
                <div className="max-h-32 overflow-y-auto space-y-1 text-xs font-mono">
                  {executionLog.map((log, i) => (
                    <div key={i} className="text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <span className="text-slate-400 select-none">{String(i + 1).padStart(2, '0')}.</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

// Componente compacto para uso inline
export const AgentProgressBadge = memo(function AgentProgressBadge({
  status,
  taskType,
  message
}: {
  status: AgentStatus
  taskType?: AgentType
  message?: string
}) {
  const statusConfig = STATUS_CONFIG[status]
  const agentConfig = taskType ? AGENT_CONFIG[taskType] : null
  const StatusIcon = statusConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
    >
      <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color} ${statusConfig.animate ? 'animate-spin' : ''}`} />
      <span className="text-xs text-slate-600 dark:text-slate-400">
        {message || agentConfig?.label || statusConfig.label}
      </span>
      {status !== 'completed' && status !== 'error' && (
        <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
      )}
    </motion.div>
  )
})

// Hook para gerenciar estado dos agentes
export function useAgentProgress() {
  const [agentStatus, setAgentStatus] = useState<AgentStatusEvent | null>(null)
  const [executionLog, setExecutionLog] = useState<string[]>([])
  const [isActive, setIsActive] = useState(false)

  const handleAgentEvent = (event: AgentStatusEvent) => {
    setAgentStatus(event)
    setIsActive(event.status !== 'completed' && event.status !== 'error')

    if (event.message) {
      setExecutionLog(prev => [...prev, `[${event.status}] ${event.message}`])
    }
  }

  const reset = () => {
    setAgentStatus(null)
    setExecutionLog([])
    setIsActive(false)
  }

  return {
    agentStatus,
    executionLog,
    isActive,
    handleAgentEvent,
    reset
  }
}

export default AgentProgressIndicator
