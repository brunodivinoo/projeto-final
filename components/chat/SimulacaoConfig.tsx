'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope,
  Heart,
  Brain,
  Baby,
  Bone,
  Eye,
  Syringe,
  Activity,
  Shield,
  Thermometer,
  Play,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Clock,
  Target,
  GraduationCap,
  Hospital,
  Ambulance,
  Bed,
  X,
  Info,
  ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Especialidades disponíveis
export const ESPECIALIDADES = [
  { id: 'clinica_medica', label: 'Clínica Médica', icon: Stethoscope, emoji: '🩺', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { id: 'cardiologia', label: 'Cardiologia', icon: Heart, emoji: '❤️', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  { id: 'neurologia', label: 'Neurologia', icon: Brain, emoji: '🧠', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { id: 'pediatria', label: 'Pediatria', icon: Baby, emoji: '👶', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  { id: 'ortopedia', label: 'Ortopedia', icon: Bone, emoji: '🦴', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  { id: 'pneumologia', label: 'Pneumologia', icon: Activity, emoji: '🫁', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  { id: 'gastroenterologia', label: 'Gastroenterologia', icon: Thermometer, emoji: '🫃', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { id: 'nefrologia', label: 'Nefrologia', icon: Syringe, emoji: '💧', color: 'text-teal-400', bgColor: 'bg-teal-500/20' },
  { id: 'infectologia', label: 'Infectologia', icon: Shield, emoji: '🦠', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { id: 'dermatologia', label: 'Dermatologia', icon: Eye, emoji: '🔬', color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
  { id: 'psiquiatria', label: 'Psiquiatria', icon: Brain, emoji: '🧘', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  { id: 'ginecologia', label: 'Ginecologia', icon: Heart, emoji: '🩷', color: 'text-fuchsia-400', bgColor: 'bg-fuchsia-500/20' },
  { id: 'emergencia', label: 'Emergência', icon: Ambulance, emoji: '🚑', color: 'text-red-500', bgColor: 'bg-red-600/20' },
  { id: 'aleatorio', label: 'Aleatório', icon: Sparkles, emoji: '🎲', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
] as const

// Níveis de dificuldade
export const DIFICULDADES = [
  {
    id: 'facil',
    label: 'Fácil',
    description: 'Casos mais comuns, diagnósticos clássicos',
    icon: GraduationCap,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30'
  },
  {
    id: 'medio',
    label: 'Médio',
    description: 'Casos frequentes com algumas variações',
    icon: Target,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30'
  },
  {
    id: 'dificil',
    label: 'Difícil',
    description: 'Diagnósticos diferenciais complexos',
    icon: AlertTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30'
  },
  {
    id: 'r4',
    label: 'R4/Especialista',
    description: 'Casos raros, nível de residência avançada',
    icon: Sparkles,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30'
  },
] as const

// Cenários de atendimento
export const CENARIOS = [
  {
    id: 'ambulatorio',
    label: 'Ambulatório',
    description: 'Consulta eletiva em consultório',
    icon: Stethoscope,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
  {
    id: 'emergencia',
    label: 'Pronto-Socorro',
    description: 'Atendimento de urgência/emergência',
    icon: Ambulance,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20'
  },
  {
    id: 'internacao',
    label: 'Enfermaria',
    description: 'Paciente internado na enfermaria',
    icon: Bed,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20'
  },
  {
    id: 'uti',
    label: 'UTI',
    description: 'Unidade de Terapia Intensiva',
    icon: Activity,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20'
  },
] as const

export interface SimulacaoConfigData {
  especialidade: typeof ESPECIALIDADES[number]['id']
  dificuldade: typeof DIFICULDADES[number]['id']
  cenario: typeof CENARIOS[number]['id']
  comExames: boolean
  pacienteJaTrazExames: boolean
  usarFichaAnamnese: boolean
}

interface SimulacaoConfigProps {
  onStart: (config: SimulacaoConfigData) => void
  onCancel: () => void
}

export function SimulacaoConfig({ onStart, onCancel }: SimulacaoConfigProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [config, setConfig] = useState<SimulacaoConfigData>({
    especialidade: 'clinica_medica',
    dificuldade: 'medio',
    cenario: 'ambulatorio',
    comExames: true,
    pacienteJaTrazExames: false,
    usarFichaAnamnese: false
  })

  const especialidadeSelecionada = ESPECIALIDADES.find(e => e.id === config.especialidade)
  const dificuldadeSelecionada = DIFICULDADES.find(d => d.id === config.dificuldade)
  const cenarioSelecionado = CENARIOS.find(c => c.id === config.cenario)

  const handleStart = () => {
    onStart(config)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-2xl border border-emerald-500/20 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-emerald-500/20 bg-emerald-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Hospital className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Simulação de Atendimento</h2>
                <p className="text-xs text-emerald-300/70">Configure sua simulação clínica</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-slate-500 hover:text-white hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  s < step ? "bg-emerald-500 text-white" :
                  s === step ? "bg-emerald-500/30 text-emerald-400 ring-2 ring-emerald-500" :
                  "bg-slate-100 text-slate-500"
                )}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={cn(
                    "w-12 h-0.5 mx-1",
                    s < step ? "bg-emerald-500" : "bg-slate-100"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Especialidade */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-medium">Escolha a Especialidade</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ESPECIALIDADES.map((esp) => {
                    const Icon = esp.icon
                    const isSelected = config.especialidade === esp.id
                    return (
                      <button
                        key={esp.id}
                        onClick={() => setConfig(prev => ({ ...prev, especialidade: esp.id }))}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                          isSelected
                            ? cn(esp.bgColor, esp.color, "border-current ring-2 ring-current/30")
                            : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-white"
                        )}
                      >
                        <span className="text-lg">{esp.emoji}</span>
                        <span className="text-sm font-medium truncate">{esp.label}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Dificuldade */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-medium">Nível de Dificuldade</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {DIFICULDADES.map((dif) => {
                    const Icon = dif.icon
                    const isSelected = config.dificuldade === dif.id
                    return (
                      <button
                        key={dif.id}
                        onClick={() => setConfig(prev => ({ ...prev, dificuldade: dif.id }))}
                        className={cn(
                          "flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left",
                          isSelected
                            ? cn(dif.bgColor, dif.borderColor, "ring-2 ring-current/30")
                            : "bg-slate-100 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={cn("w-5 h-5", isSelected ? dif.color : "text-slate-600")} />
                          <span className={cn("font-medium", isSelected ? dif.color : "text-white")}>{dif.label}</span>
                        </div>
                        <span className="text-xs text-slate-500">{dif.description}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3: Cenário e Opções */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Hospital className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-medium">Cenário do Atendimento</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {CENARIOS.map((cen) => {
                    const Icon = cen.icon
                    const isSelected = config.cenario === cen.id
                    return (
                      <button
                        key={cen.id}
                        onClick={() => setConfig(prev => ({ ...prev, cenario: cen.id }))}
                        className={cn(
                          "flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left",
                          isSelected
                            ? cn(cen.bgColor, "border-current ring-2 ring-current/30", cen.color)
                            : "bg-slate-100 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={cn("w-5 h-5", isSelected ? cen.color : "text-slate-600")} />
                          <span className={cn("font-medium", isSelected ? cen.color : "text-white")}>{cen.label}</span>
                        </div>
                        <span className="text-xs text-slate-500">{cen.description}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Opções adicionais */}
                <div className="mt-4 space-y-3 pt-4 border-t border-slate-200">
                  <label className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.comExames}
                      onChange={(e) => setConfig(prev => ({ ...prev, comExames: e.target.checked }))}
                      className="w-5 h-5 rounded border-slate-300 bg-slate-100 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-white font-medium">Incluir exames no caso</span>
                      <p className="text-xs text-slate-500">A IA trará exames reais para você analisar</p>
                    </div>
                  </label>

                  {config.comExames && (
                    <label className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors ml-4">
                      <input
                        type="checkbox"
                        checked={config.pacienteJaTrazExames}
                        onChange={(e) => setConfig(prev => ({ ...prev, pacienteJaTrazExames: e.target.checked }))}
                        className="w-5 h-5 rounded border-slate-300 bg-slate-100 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-white font-medium">Paciente já traz exames</span>
                        <p className="text-xs text-slate-500">O paciente chega com exames prévios para análise</p>
                      </div>
                    </label>
                  )}

                  <label className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.usarFichaAnamnese}
                      onChange={(e) => setConfig(prev => ({ ...prev, usarFichaAnamnese: e.target.checked }))}
                      className="w-5 h-5 rounded border-slate-300 bg-slate-100 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-white font-medium">Acompanhar ficha de anamnese</span>
                        <p className="text-xs text-slate-500">Visualize o progresso da sua investigação clínica</p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Resumo */}
                <div className="mt-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">Resumo da Simulação</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className={cn("px-2 py-1 rounded-lg", especialidadeSelecionada?.bgColor, especialidadeSelecionada?.color)}>
                      {especialidadeSelecionada?.emoji} {especialidadeSelecionada?.label}
                    </span>
                    <span className={cn("px-2 py-1 rounded-lg", dificuldadeSelecionada?.bgColor, dificuldadeSelecionada?.color)}>
                      {dificuldadeSelecionada?.label}
                    </span>
                    <span className={cn("px-2 py-1 rounded-lg", cenarioSelecionado?.bgColor, cenarioSelecionado?.color)}>
                      {cenarioSelecionado?.label}
                    </span>
                    {config.usarFichaAnamnese && (
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" /> Ficha
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as 1 | 2) : onCancel()}
            className="px-4 py-2 text-slate-600 hover:text-white transition-colors"
          >
            {step > 1 ? 'Voltar' : 'Cancelar'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as 2 | 3)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-4 h-4" />
              Iniciar Simulação
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Função para gerar o prompt de simulação baseado na configuração
export function gerarPromptSimulacao(config: SimulacaoConfigData): string {
  const especialidade = ESPECIALIDADES.find(e => e.id === config.especialidade)
  const dificuldade = DIFICULDADES.find(d => d.id === config.dificuldade)
  const cenario = CENARIOS.find(c => c.id === config.cenario)

  const especialidadeTexto = config.especialidade === 'aleatorio'
    ? 'uma especialidade aleatória (surpreenda-me!)'
    : especialidade?.label

  const fichaTexto = config.usarFichaAnamnese
    ? '\n**Ficha de Anamnese:** Sim, acompanharei o progresso da minha investigação clínica'
    : ''

  return `Inicie uma simulação de atendimento médico com as seguintes configurações:

**Especialidade:** ${especialidadeTexto}
**Dificuldade:** ${dificuldade?.label} - ${dificuldade?.description}
**Cenário:** ${cenario?.label} - ${cenario?.description}
**Incluir exames:** ${config.comExames ? 'Sim' : 'Não'}
**Paciente já traz exames:** ${config.pacienteJaTrazExames ? 'Sim, o paciente chega com exames prévios para eu analisar' : 'Não, eu solicitarei os exames'}${fichaTexto}

Por favor, inicie a simulação apresentando o paciente no cenário escolhido.`
}

export default SimulacaoConfig
