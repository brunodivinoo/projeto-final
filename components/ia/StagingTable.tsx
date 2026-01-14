'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react'

// Tipos
interface StagingRow {
  stage: string
  t: string
  n: string
  m: string
  survival5y: string
  survivalPercent: number
  treatment?: string
  notes?: string
  prognosis?: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical'
  prognosticFactors?: string[]  // Fatores prognósticos adicionais
  clinicalNotes?: string         // Notas clínicas adicionais
}

interface StagingTableProps {
  title: string
  rows: StagingRow[]
  highlightStage?: string
  cancerType?: string
  source?: string
}

// Cores por prognóstico
function getPrognosisColors(percent: number): {
  bg: string
  border: string
  text: string
  bar: string
  icon: 'check' | 'info' | 'alert'
} {
  if (percent >= 90) {
    return {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      bar: 'bg-emerald-500',
      icon: 'check'
    }
  }
  if (percent >= 70) {
    return {
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      bar: 'bg-green-500',
      icon: 'check'
    }
  }
  if (percent >= 50) {
    return {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      bar: 'bg-yellow-500',
      icon: 'info'
    }
  }
  if (percent >= 30) {
    return {
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      bar: 'bg-orange-500',
      icon: 'alert'
    }
  }
  return {
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    bar: 'bg-red-500',
    icon: 'alert'
  }
}

// Cor do estádio
function getStageColor(stage: string): string {
  const s = stage.toLowerCase()
  if (s === '0' || s === 'i' || s === 'ia' || s === 'ib') {
    return 'bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
  }
  if (s === 'ii' || s === 'iia' || s === 'iib' || s === 'iic') {
    return 'bg-yellow-500/30 text-yellow-300 border-yellow-500/30'
  }
  if (s === 'iii' || s === 'iiia' || s === 'iiib' || s === 'iiic') {
    return 'bg-orange-500/30 text-orange-300 border-orange-500/30'
  }
  if (s.startsWith('iv')) {
    return 'bg-red-500/30 text-red-300 border-red-500/30'
  }
  return 'bg-slate-500/30 text-slate-300 border-slate-500/30'
}

// Componente de linha da tabela
function TableRow({
  row,
  index,
  isExpanded,
  onToggle,
  isHighlighted
}: {
  row: StagingRow
  index: number
  isExpanded: boolean
  onToggle: () => void
  isHighlighted: boolean
}) {
  const colors = getPrognosisColors(row.survivalPercent)
  const hasDetails = row.treatment || row.notes || row.prognosticFactors?.length || row.clinicalNotes

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        border rounded-xl overflow-hidden transition-all duration-300
        ${isHighlighted ? 'ring-2 ring-purple-500 scale-[1.02]' : ''}
        ${colors.border} ${colors.bg}
        ${hasDetails ? 'cursor-pointer hover:scale-[1.01]' : ''}
      `}
      onClick={hasDetails ? onToggle : undefined}
    >
      {/* Linha principal */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Estádio */}
          <div className={`
            w-16 h-16 rounded-xl flex items-center justify-center font-bold text-xl
            border ${getStageColor(row.stage)}
          `}>
            {row.stage}
          </div>

          {/* TNM */}
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="text-center">
              <span className="text-xs text-white/40 uppercase">T</span>
              <p className="text-white font-medium">{row.t}</p>
            </div>
            <div className="text-center">
              <span className="text-xs text-white/40 uppercase">N</span>
              <p className="text-white font-medium">{row.n}</p>
            </div>
            <div className="text-center">
              <span className="text-xs text-white/40 uppercase">M</span>
              <p className="text-white font-medium">{row.m}</p>
            </div>
          </div>

          {/* Sobrevida */}
          <div className="w-40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/40">Sobrevida 5 anos</span>
              <span className={`text-sm font-bold ${colors.text}`}>{row.survival5y}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${row.survivalPercent}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`h-full ${colors.bar} rounded-full`}
              />
            </div>
          </div>

          {/* Ícone de prognóstico */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg}`}>
            {colors.icon === 'check' && <CheckCircle2 className={`w-5 h-5 ${colors.text}`} />}
            {colors.icon === 'info' && <Info className={`w-5 h-5 ${colors.text}`} />}
            {colors.icon === 'alert' && <AlertCircle className={`w-5 h-5 ${colors.text}`} />}
          </div>

          {/* Botão expandir */}
          {hasDetails && (
            <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-white/60" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/60" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Detalhes expandidos */}
      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tratamento */}
                {row.treatment && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <span className="text-xs text-white/40 uppercase block mb-2">Tratamento</span>
                    <p className="text-white text-sm">{row.treatment}</p>
                  </div>
                )}

                {/* Observações */}
                {row.notes && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <span className="text-xs text-white/40 uppercase block mb-2">Observações</span>
                    <p className="text-white/80 text-sm">{row.notes}</p>
                  </div>
                )}

                {/* Fatores Prognósticos */}
                {row.prognosticFactors && row.prognosticFactors.length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <span className="text-xs text-white/40 uppercase block mb-2">Fatores Prognósticos</span>
                    <ul className="text-white/70 text-xs space-y-1">
                      {row.prognosticFactors.map((factor, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Notas Clínicas (caso existam e não haja fatores prognósticos) */}
                {row.clinicalNotes && !row.prognosticFactors?.length && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <span className="text-xs text-white/40 uppercase block mb-2">Notas Clínicas</span>
                    <p className="text-white/70 text-sm">{row.clinicalNotes}</p>
                  </div>
                )}
              </div>

              {/* Se tem apenas 1 ou 2 itens, adicionar dica de estudo */}
              {!row.prognosticFactors?.length && !row.clinicalNotes && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-300/80 text-xs flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    Clique em outros estádios para comparar tratamentos e prognósticos
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Componente principal
export default function StagingTable({
  title,
  rows,
  highlightStage,
  cancerType,
  source
}: StagingTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)

  const toggleRow = useCallback((index: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  // Filtrar por estádio
  const filteredRows = filter
    ? rows.filter(r => r.stage.toLowerCase().startsWith(filter.toLowerCase()))
    : rows

  // Estádios únicos para filtro
  const uniqueStages = [...new Set(rows.map(r => {
    const s = r.stage.toLowerCase()
    if (s.startsWith('iv')) return 'IV'
    if (s.startsWith('iii')) return 'III'
    if (s.startsWith('ii')) return 'II'
    if (s.startsWith('i') && s !== 'iv') return 'I'
    return '0'
  }))]

  const content = (
    <div className={`
      ${isFullscreen ? 'h-full overflow-y-auto' : 'bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{title}</h3>
              {cancerType && (
                <p className="text-white/60 text-sm">{cancerType}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtros */}
            <div className="flex items-center gap-1 mr-2">
              <Filter className="w-4 h-4 text-white/40" />
              <button
                onClick={() => setFilter(null)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  filter === null ? 'bg-purple-500/30 text-purple-300' : 'text-white/40 hover:text-white/60'
                }`}
              >
                Todos
              </button>
              {uniqueStages.sort().map(stage => (
                <button
                  key={stage}
                  onClick={() => setFilter(stage === filter ? null : stage)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    filter === stage ? 'bg-purple-500/30 text-purple-300' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <X className="w-5 h-5 text-white/60" />
              ) : (
                <Maximize2 className="w-5 h-5 text-white/60" />
              )}
            </button>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
          <span className="text-xs text-white/50">Prognóstico:</span>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: 'Excelente (>90%)', color: 'bg-emerald-500/30 text-emerald-300' },
              { label: 'Bom (70-90%)', color: 'bg-green-500/30 text-green-300' },
              { label: 'Moderado (50-70%)', color: 'bg-yellow-500/30 text-yellow-300' },
              { label: 'Reservado (30-50%)', color: 'bg-orange-500/30 text-orange-300' },
              { label: 'Grave (<30%)', color: 'bg-red-500/30 text-red-300' },
            ].map(item => (
              <span key={item.label} className={`px-2 py-0.5 rounded text-xs ${item.color}`}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="p-4 space-y-3">
        {filteredRows.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            Nenhum estádio encontrado para o filtro selecionado
          </div>
        ) : (
          filteredRows.map((row, index) => (
            <TableRow
              key={index}
              row={row}
              index={index}
              isExpanded={expandedRows.has(index)}
              onToggle={() => toggleRow(index)}
              isHighlighted={highlightStage?.toLowerCase() === row.stage.toLowerCase()}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {source && (
        <div className="p-3 border-t border-white/10 bg-white/5">
          <p className="text-xs text-white/40 text-center">
            Fonte: {source}
          </p>
        </div>
      )}
    </div>
  )

  // Overlay para fullscreen com fundo OPACO
  if (isFullscreen) {
    return (
      <>
        {/* Backdrop OPACO */}
        <div
          className="fixed inset-0 bg-slate-950 z-40"
          onClick={() => setIsFullscreen(false)}
        />
        {/* Container fullscreen */}
        <div className="fixed inset-4 z-50 bg-slate-900 rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
          {content}
        </div>
      </>
    )
  }

  return content
}

// Função para parsear JSON de staging table
export function parseStagingTable(content: string): StagingTableProps | null {
  try {
    const data = JSON.parse(content)

    // Validar estrutura mínima
    if (!data.rows || !Array.isArray(data.rows)) {
      return null
    }

    return {
      title: data.title || 'Estadiamento TNM',
      rows: data.rows,
      highlightStage: data.highlightStage,
      cancerType: data.cancerType,
      source: data.source
    }
  } catch {
    return null
  }
}
