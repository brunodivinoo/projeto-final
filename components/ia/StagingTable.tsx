'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
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
  prognosticFactors?: string[]
  clinicalNotes?: string
}

interface StagingTableProps {
  title: string
  rows: StagingRow[]
  highlightStage?: string
  cancerType?: string
  source?: string
}

// Cores por prognóstico - TEMA CLARO
function getPrognosisColors(percent: number): {
  bg: string
  border: string
  text: string
  bar: string
  icon: 'check' | 'info' | 'alert'
} {
  if (percent >= 90) {
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-600',
      bar: 'bg-emerald-500',
      icon: 'check'
    }
  }
  if (percent >= 70) {
    return {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600',
      bar: 'bg-green-500',
      icon: 'check'
    }
  }
  if (percent >= 50) {
    return {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
      bar: 'bg-yellow-500',
      icon: 'info'
    }
  }
  if (percent >= 30) {
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-600',
      bar: 'bg-orange-500',
      icon: 'alert'
    }
  }
  return {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-600',
    bar: 'bg-red-500',
    icon: 'alert'
  }
}

// Cor do estádio - TEMA CLARO
function getStageColor(stage: string): string {
  const s = stage.toLowerCase()
  if (s === '0' || s === 'i' || s === 'ia' || s === 'ib') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-300'
  }
  if (s === 'ii' || s === 'iia' || s === 'iib' || s === 'iic') {
    return 'bg-yellow-100 text-yellow-700 border-yellow-300'
  }
  if (s === 'iii' || s === 'iiia' || s === 'iiib' || s === 'iiic') {
    return 'bg-orange-100 text-orange-700 border-orange-300'
  }
  if (s.startsWith('iv')) {
    return 'bg-red-100 text-red-700 border-red-300'
  }
  return 'bg-slate-100 text-slate-700 border-slate-300'
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
        border rounded-xl overflow-hidden transition-all duration-300 bg-white
        ${isHighlighted ? 'ring-2 ring-purple-500 scale-[1.02]' : ''}
        ${colors.border}
        ${hasDetails ? 'cursor-pointer hover:shadow-md' : ''}
      `}
      onClick={hasDetails ? onToggle : undefined}
    >
      {/* Linha principal */}
      <div className={`p-3 md:p-4 ${colors.bg}`}>
        {/* Layout Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {/* Estádio */}
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0
            border ${getStageColor(row.stage)}
          `}>
            {row.stage}
          </div>

          {/* TNM em colunas separadas */}
          <div className="flex items-center gap-6 flex-1">
            <div className="text-center min-w-[50px]">
              <span className="text-xs text-slate-400 uppercase font-medium block">T</span>
              <p className="text-slate-700 font-semibold text-base">{row.t}</p>
            </div>
            <div className="text-center min-w-[50px]">
              <span className="text-xs text-slate-400 uppercase font-medium block">N</span>
              <p className="text-slate-700 font-semibold text-base">{row.n}</p>
            </div>
            <div className="text-center min-w-[50px]">
              <span className="text-xs text-slate-400 uppercase font-medium block">M</span>
              <p className="text-slate-700 font-semibold text-base">{row.m}</p>
            </div>
          </div>

          {/* Sobrevida */}
          <div className="w-40 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Sobrevida 5 anos</span>
              <span className={`text-sm font-bold ${colors.text}`}>{row.survival5y}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${row.survivalPercent}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`h-full ${colors.bar} rounded-full`}
              />
            </div>
          </div>

          {/* Ícone de prognóstico */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg} border ${colors.border}`}>
            {colors.icon === 'check' && <CheckCircle2 className={`w-4 h-4 ${colors.text}`} />}
            {colors.icon === 'info' && <Info className={`w-4 h-4 ${colors.text}`} />}
            {colors.icon === 'alert' && <AlertCircle className={`w-4 h-4 ${colors.text}`} />}
          </div>

          {/* Botão expandir */}
          {hasDetails && (
            <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              )}
            </button>
          )}
        </div>

        {/* Layout Mobile - empilhado */}
        <div className="md:hidden">
          {/* Primeira linha: Estádio + TNM compacto + seta */}
          <div className="flex items-center gap-3">
            {/* Estádio */}
            <div className={`
              w-11 h-11 rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0
              border ${getStageColor(row.stage)}
            `}>
              {row.stage}
            </div>

            {/* TNM compacto */}
            <div className="flex-1">
              <p className="text-slate-700 font-semibold text-sm">
                T{row.t} N{row.n} M{row.m}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                Tumor • Linfonodo • Metástase
              </p>
            </div>

            {/* Seta */}
            {hasDetails && (
              <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>
            )}
          </div>

          {/* Segunda linha: Sobrevida */}
          <div className="mt-3 pt-3 border-t border-slate-200/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Sobrevida em 5 anos</span>
              <span className={`text-sm font-bold ${colors.text}`}>{row.survival5y}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${row.survivalPercent}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`h-full ${colors.bar} rounded-full`}
              />
            </div>
          </div>
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
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Tratamento */}
                {row.treatment && (
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <span className="text-xs text-slate-400 uppercase block mb-1.5 font-medium">Tratamento</span>
                    <p className="text-slate-700 text-sm">{row.treatment}</p>
                  </div>
                )}

                {/* Observações */}
                {row.notes && (
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <span className="text-xs text-slate-400 uppercase block mb-1.5 font-medium">Observações</span>
                    <p className="text-slate-600 text-sm">{row.notes}</p>
                  </div>
                )}

                {/* Fatores Prognósticos */}
                {row.prognosticFactors && row.prognosticFactors.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <span className="text-xs text-slate-400 uppercase block mb-1.5 font-medium">Fatores Prognósticos</span>
                    <ul className="text-slate-600 text-xs space-y-1">
                      {row.prognosticFactors.map((factor, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Notas Clínicas */}
                {row.clinicalNotes && !row.prognosticFactors?.length && (
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <span className="text-xs text-slate-400 uppercase block mb-1.5 font-medium">Notas Clínicas</span>
                    <p className="text-slate-600 text-sm">{row.clinicalNotes}</p>
                  </div>
                )}
              </div>

              {/* Dica de estudo */}
              {!row.prognosticFactors?.length && !row.clinicalNotes && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-600 text-xs flex items-center gap-2">
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base md:text-lg">{title}</h3>
              {cancerType && (
                <p className="text-slate-500 text-xs md:text-sm">{cancerType}</p>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-1 bg-white/80 rounded-lg p-1 border border-slate-200">
            <Filter className="w-3 h-3 md:w-4 md:h-4 text-slate-400 ml-1" />
            <button
              onClick={() => setFilter(null)}
              className={`px-2 py-1 text-[10px] md:text-xs rounded transition-colors ${
                filter === null ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>
            {uniqueStages.sort().map(stage => (
              <button
                key={stage}
                onClick={() => setFilter(stage === filter ? null : stage)}
                className={`px-2 py-1 text-[10px] md:text-xs rounded transition-colors ${
                  filter === stage ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-2 md:gap-4 mt-4 pt-3 border-t border-slate-200/50 overflow-x-auto">
          <span className="text-[10px] md:text-xs text-slate-400 flex-shrink-0">Prognóstico:</span>
          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
            {[
              { label: '>90%', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
              { label: '70-90%', color: 'bg-green-100 text-green-700 border-green-300' },
              { label: '50-70%', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
              { label: '30-50%', color: 'bg-orange-100 text-orange-700 border-orange-300' },
              { label: '<30%', color: 'bg-red-100 text-red-700 border-red-300' },
            ].map(item => (
              <span key={item.label} className={`px-1.5 md:px-2 py-0.5 rounded text-[9px] md:text-xs border ${item.color}`}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="p-3 md:p-4 space-y-2 md:space-y-3 bg-slate-50">
        {filteredRows.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
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
        <div className="p-3 border-t border-slate-200 bg-white">
          <p className="text-xs text-slate-400 text-center">
            Fonte: {source}
          </p>
        </div>
      )}
    </div>
  )
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
