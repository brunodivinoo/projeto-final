'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList,
  ChevronRight,
  ChevronDown,
  Check,
  Circle,
  X,
  User,
  FileText,
  Heart,
  Stethoscope,
  Activity,
  Target,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ==========================================
// ESTRUTURA DA FICHA DE ANAMNESE
// ==========================================

export interface DadosFicha {
  // IDENTIFICAÇÃO
  identificacao: {
    nome?: string
    idade?: string
    sexo?: 'masculino' | 'feminino'
    profissao?: string
    naturalidade?: string
  }

  // QUEIXA PRINCIPAL
  queixaPrincipal?: string

  // HISTÓRIA DA DOENÇA ATUAL
  hda?: string

  // INTERROGATÓRIO SINTOMATOLÓGICO (resumido)
  interrogatorio: {
    estadoGeral?: string
    cardiovascular?: string
    respiratorio?: string
    digestorio?: string
    urinario?: string
    nervoso?: string
    outros?: string
  }

  // HISTÓRIAS
  historiaPatologica?: string
  historiaFisiologica?: string
  historiaFamiliar?: string
  habitosVida?: string

  // EXAME FÍSICO
  exameFisico: {
    sinaisVitais?: {
      fc?: string
      fr?: string
      pa?: string
      tax?: string
    }
    ectoscopia?: string
    aparelhoEspecifico?: string // Dependendo da especialidade
  }

  // CONCLUSÃO
  hipotesesDiagnosticas?: string[]
  exameSolicitados?: string[]
  conduta?: string
}

// Seções simplificadas
const SECOES = [
  { id: 'identificacao', label: 'Identificação', icon: User },
  { id: 'queixaPrincipal', label: 'Queixa Principal', icon: FileText },
  { id: 'hda', label: 'História da Doença Atual', icon: FileText },
  { id: 'interrogatorio', label: 'Interrogatório', icon: ClipboardList },
  { id: 'antecedentes', label: 'Antecedentes', icon: Heart },
  { id: 'exameFisico', label: 'Exame Físico', icon: Stethoscope },
  { id: 'conclusao', label: 'Conclusão', icon: Target },
]

// ==========================================
// COMPONENTE INDICADOR DISCRETO
// ==========================================

interface IndicadorProgressoProps {
  itensPreenchidos: number
  totalItens: number
  onClick: () => void
}

export function IndicadorProgresso({ itensPreenchidos, totalItens, onClick }: IndicadorProgressoProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "bg-slate-100 hover:bg-slate-100 border border-slate-200",
        "transition-all text-sm"
      )}
    >
      <ClipboardList className="w-4 h-4 text-emerald-400" />
      <span className="text-slate-600">
        Ficha: <span className="text-white font-medium">{itensPreenchidos}/{totalItens}</span>
      </span>
    </button>
  )
}

// ==========================================
// COMPONENTE FICHA SIMPLES (DRAWER)
// ==========================================

interface FichaDrawerProps {
  isOpen: boolean
  onClose: () => void
  dados: DadosFicha
}

export function FichaDrawer({ isOpen, onClose, dados }: FichaDrawerProps) {
  const [secaoExpandida, setSecaoExpandida] = useState<string | null>(null)

  // Calcular o que foi preenchido
  const statusSecoes = useMemo(() => {
    return {
      identificacao: !!(dados.identificacao?.idade || dados.identificacao?.sexo),
      queixaPrincipal: !!dados.queixaPrincipal,
      hda: !!dados.hda,
      interrogatorio: !!(dados.interrogatorio?.cardiovascular || dados.interrogatorio?.respiratorio || dados.interrogatorio?.digestorio),
      antecedentes: !!(dados.historiaPatologica || dados.historiaFamiliar || dados.habitosVida),
      exameFisico: !!(dados.exameFisico?.sinaisVitais?.fc || dados.exameFisico?.ectoscopia),
      conclusao: !!(dados.hipotesesDiagnosticas?.length || dados.conduta)
    }
  }, [dados])

  const itensPreenchidos = Object.values(statusSecoes).filter(Boolean).length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed top-0 right-0 h-full z-50",
              "w-full max-w-sm md:w-80",
              "bg-slate-900 border-l border-slate-200",
              "flex flex-col"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
                <span className="text-white font-medium">Ficha de Anamnese</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status geral */}
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Itens investigados</span>
                <span className="text-white font-medium">{itensPreenchidos}/7</span>
              </div>
              <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(itensPreenchidos / 7) * 100}%` }}
                />
              </div>
            </div>

            {/* Lista de seções */}
            <div className="flex-1 overflow-y-auto">
              {SECOES.map(secao => {
                const Icon = secao.icon
                const preenchido = statusSecoes[secao.id as keyof typeof statusSecoes]
                const expandida = secaoExpandida === secao.id

                return (
                  <div key={secao.id} className="border-b border-slate-200">
                    <button
                      onClick={() => setSecaoExpandida(expandida ? null : secao.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 transition-colors"
                    >
                      {/* Indicador */}
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        preenchido ? "bg-emerald-500/20" : "bg-slate-100"
                      )}>
                        {preenchido ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Circle className="w-3 h-3 text-slate-400" />
                        )}
                      </div>

                      {/* Label */}
                      <span className={cn(
                        "flex-1 text-left text-sm",
                        preenchido ? "text-white" : "text-slate-500"
                      )}>
                        {secao.label}
                      </span>

                      {/* Chevron */}
                      <ChevronDown className={cn(
                        "w-4 h-4 text-slate-400 transition-transform",
                        expandida && "rotate-180"
                      )} />
                    </button>

                    {/* Conteúdo */}
                    <AnimatePresence>
                      {expandida && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 text-xs text-slate-600">
                            {renderConteudo(secao.id, dados)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-100">
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>A ficha é preenchida automaticamente durante a conversa.</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Renderizar conteúdo de cada seção
function renderConteudo(secaoId: string, dados: DadosFicha) {
  const Vazio = () => <span className="text-slate-400 italic">Não investigado ainda</span>

  switch (secaoId) {
    case 'identificacao':
      if (!dados.identificacao?.idade && !dados.identificacao?.sexo) return <Vazio />
      return (
        <div className="space-y-1">
          {dados.identificacao?.idade && <div>Idade: {dados.identificacao.idade}</div>}
          {dados.identificacao?.sexo && <div>Sexo: {dados.identificacao.sexo}</div>}
          {dados.identificacao?.profissao && <div>Profissão: {dados.identificacao.profissao}</div>}
        </div>
      )

    case 'queixaPrincipal':
      return dados.queixaPrincipal || <Vazio />

    case 'hda':
      return dados.hda ? (
        <div className="line-clamp-3">{dados.hda}</div>
      ) : <Vazio />

    case 'interrogatorio':
      const inter = dados.interrogatorio
      if (!inter?.cardiovascular && !inter?.respiratorio && !inter?.digestorio) return <Vazio />
      return (
        <div className="space-y-1">
          {inter?.estadoGeral && <div>Estado geral: {inter.estadoGeral}</div>}
          {inter?.cardiovascular && <div>Cardiovascular: {inter.cardiovascular}</div>}
          {inter?.respiratorio && <div>Respiratório: {inter.respiratorio}</div>}
          {inter?.digestorio && <div>Digestório: {inter.digestorio}</div>}
          {inter?.nervoso && <div>Nervoso: {inter.nervoso}</div>}
        </div>
      )

    case 'antecedentes':
      if (!dados.historiaPatologica && !dados.historiaFamiliar && !dados.habitosVida) return <Vazio />
      return (
        <div className="space-y-1">
          {dados.historiaPatologica && <div>HPP: {dados.historiaPatologica}</div>}
          {dados.historiaFamiliar && <div>HF: {dados.historiaFamiliar}</div>}
          {dados.habitosVida && <div>Hábitos: {dados.habitosVida}</div>}
        </div>
      )

    case 'exameFisico':
      const ef = dados.exameFisico
      if (!ef?.sinaisVitais?.fc && !ef?.ectoscopia) return <Vazio />
      return (
        <div className="space-y-1">
          {ef?.sinaisVitais && (
            <div>
              Sinais vitais: FC {ef.sinaisVitais.fc || '?'} | PA {ef.sinaisVitais.pa || '?'} |
              Tax {ef.sinaisVitais.tax || '?'}
            </div>
          )}
          {ef?.ectoscopia && <div>Ectoscopia: {ef.ectoscopia}</div>}
          {ef?.aparelhoEspecifico && <div>Exame específico: {ef.aparelhoEspecifico}</div>}
        </div>
      )

    case 'conclusao':
      if (!dados.hipotesesDiagnosticas?.length && !dados.conduta) return <Vazio />
      return (
        <div className="space-y-1">
          {dados.hipotesesDiagnosticas?.length && (
            <div>Hipóteses: {dados.hipotesesDiagnosticas.join(', ')}</div>
          )}
          {dados.exameSolicitados?.length && (
            <div>Exames: {dados.exameSolicitados.join(', ')}</div>
          )}
          {dados.conduta && <div>Conduta: {dados.conduta}</div>}
        </div>
      )

    default:
      return <Vazio />
  }
}

// ==========================================
// COMPONENTE RESUMO FINAL (sem gamificação)
// ==========================================

interface ResumoFinalProps {
  dados: DadosFicha
  faltou: string[] // Lista do que faltou investigar
  onClose: () => void
}

export function ResumoFinal({ dados, faltou, onClose }: ResumoFinalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 bg-slate-800/50 rounded-xl border border-slate-200"
    >
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="w-5 h-5 text-emerald-400" />
        <h4 className="text-white font-medium">Resumo da Anamnese</h4>
      </div>

      {/* O que foi investigado */}
      <div className="space-y-2 mb-4">
        <p className="text-slate-600 text-sm">Itens investigados:</p>
        <div className="flex flex-wrap gap-2">
          {dados.queixaPrincipal && (
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
              Queixa Principal
            </span>
          )}
          {dados.hda && (
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
              HDA
            </span>
          )}
          {dados.exameFisico?.sinaisVitais?.fc && (
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
              Sinais Vitais
            </span>
          )}
          {dados.hipotesesDiagnosticas?.length && (
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
              Hipóteses
            </span>
          )}
        </div>
      </div>

      {/* O que faltou */}
      {faltou.length > 0 && (
        <div className="space-y-2">
          <p className="text-slate-600 text-sm">Poderia ter investigado:</p>
          <div className="flex flex-wrap gap-2">
            {faltou.map((item, i) => (
              <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-400/70 text-xs rounded">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Estado inicial vazio
export const DADOS_FICHA_VAZIO: DadosFicha = {
  identificacao: {},
  interrogatorio: {},
  exameFisico: {}
}

export default FichaDrawer
