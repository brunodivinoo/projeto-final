'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Info,
  AlertTriangle,
  Target,
  Layers,
  SplitSquareHorizontal,
  BookOpen,
  Microscope,
  Activity
} from 'lucide-react'

// Tipos
type ViewMode = 'stacked' | 'crossSection' | 'timeline'

interface Sublayer {
  name: string
  detail?: string
}

interface Layer {
  id: string
  name: string
  sublayers?: (string | Sublayer)[]
  color: string
  invaded?: boolean
  invasionLevel?: 'none' | 'partial' | 'full'
  staging?: string
  stagingName?: string
  details?: string
  marker?: string // Ex: "← Membrana basal ÍNTEGRA"
  depth?: string  // Profundidade anatômica
}

interface LayeredDiagramProps {
  title: string
  layers: Layer[]
  showStaging?: boolean
  showLegend?: boolean // Alias para showStaging (para compatibilidade)
  interactive?: boolean
  theme?: 'histology' | 'anatomy' | 'staging' | 'invasion'
  description?: string
  orientation?: 'vertical' | 'horizontal'
  viewMode?: ViewMode
}

// Paleta de cores por tema - TEMA CLARO
const COLOR_PALETTES: Record<string, Record<string, { bg: string; border: string; text: string; gradient: string }>> = {
  histology: {
    pink: { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-700', gradient: 'from-pink-50 to-pink-100' },
    rose: { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700', gradient: 'from-rose-50 to-rose-100' },
    cream: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', gradient: 'from-amber-50 to-amber-100' },
    beige: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', gradient: 'from-orange-50 to-orange-100' },
    yellow: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', gradient: 'from-yellow-50 to-yellow-100' },
    red: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', gradient: 'from-red-50 to-red-100' },
    orange: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', gradient: 'from-orange-50 to-orange-100' },
    purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', gradient: 'from-purple-50 to-purple-100' },
    blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', gradient: 'from-blue-50 to-blue-100' },
    cyan: { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700', gradient: 'from-cyan-50 to-cyan-100' },
    green: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', gradient: 'from-emerald-50 to-emerald-100' },
    gray: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700', gradient: 'from-slate-50 to-slate-100' },
    teal: { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-700', gradient: 'from-teal-50 to-teal-100' },
  },
  anatomy: {
    muscle: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', gradient: 'from-red-50 to-red-100' },
    mucosa: { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-700', gradient: 'from-pink-50 to-pink-100' },
    serosa: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', gradient: 'from-amber-50 to-amber-100' },
    connective: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', gradient: 'from-orange-50 to-orange-100' },
    epithelium: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', gradient: 'from-purple-50 to-purple-100' },
  },
  staging: {
    tis: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', gradient: 'from-emerald-50 to-emerald-100' },
    t1: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', gradient: 'from-yellow-50 to-yellow-100' },
    t2: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', gradient: 'from-orange-50 to-orange-100' },
    t3: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', gradient: 'from-red-50 to-red-100' },
    t4: { bg: 'bg-red-200', border: 'border-red-400', text: 'text-red-800', gradient: 'from-red-100 to-red-200' },
  },
  invasion: {
    free: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', gradient: 'from-emerald-50 to-emerald-100' },
    invaded: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', gradient: 'from-red-50 to-red-100' },
    partial: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', gradient: 'from-amber-50 to-amber-100' },
  }
}

// Obter cor do tema
function getLayerColors(color: string, theme: string = 'histology') {
  const palette = COLOR_PALETTES[theme] || COLOR_PALETTES.histology
  return palette[color.toLowerCase()] || palette.gray || {
    bg: 'bg-slate-500/30',
    border: 'border-slate-400',
    text: 'text-slate-200',
    gradient: 'from-slate-500/40 to-slate-600/20'
  }
}

// Componente de camada individual
function LayerCard({
  layer,
  index,
  isExpanded,
  onToggle,
  theme,
  showStaging
}: {
  layer: Layer
  index: number
  isExpanded: boolean
  onToggle: () => void
  theme: string
  showStaging: boolean
}) {
  const colors = getLayerColors(layer.color, theme)
  const hasDetails = layer.sublayers?.length || layer.details

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      {/* Linha de conexão com próxima camada */}
      {index > 0 && (
        <div className="absolute -top-2 left-1/2 w-0.5 h-4 bg-slate-200" />
      )}

      <div
        className={`
          relative overflow-hidden rounded-xl border-2 transition-all duration-300
          ${colors.border} ${colors.bg}
          ${hasDetails ? 'cursor-pointer hover:scale-[1.02]' : ''}
          ${layer.invaded ? 'ring-2 ring-red-500/50' : ''}
        `}
        onClick={hasDetails ? onToggle : undefined}
      >
        {/* Gradiente de fundo */}
        <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} opacity-50`} />

        {/* Indicador de invasão */}
        {layer.invaded && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: layer.invasionLevel === 'full' ? '100%' : '50%' }}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
            className="absolute inset-y-0 left-0 bg-red-500/30 border-r-2 border-red-400"
          />
        )}

        {/* Conteúdo */}
        <div className="relative z-10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Número da camada */}
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                ${colors.bg} ${colors.text} border ${colors.border}
              `}>
                {index + 1}
              </div>

              {/* Nome da camada */}
              <div>
                <h4 className="font-bold text-slate-800 text-lg">{layer.name}</h4>
                {layer.invaded && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {layer.invasionLevel === 'full' ? 'Invadida' : 'Parcialmente invadida'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Estadiamento */}
              {showStaging && layer.staging && (
                <div className="flex flex-col items-end">
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-bold
                    ${layer.staging.toLowerCase().includes('tis') ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                      layer.staging.toLowerCase().includes('t1') ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                      layer.staging.toLowerCase().includes('t2') ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                      layer.staging.toLowerCase().includes('t3') ? 'bg-red-100 text-red-700 border border-red-300' :
                      'bg-red-200 text-red-800 border border-red-400'}
                  `}>
                    {layer.staging}
                  </span>
                  {layer.stagingName && (
                    <span className="text-xs text-slate-500 mt-1">{layer.stagingName}</span>
                  )}
                </div>
              )}

              {/* Marcador */}
              {layer.marker && (
                <span className="text-sm text-emerald-600 font-medium">
                  {layer.marker}
                </span>
              )}

              {/* Botão expandir */}
              {hasDetails && (
                <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
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
                <div className="mt-4 pt-4 border-t border-slate-200">
                  {/* Subcamadas */}
                  {layer.sublayers && layer.sublayers.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Componentes:</span>
                      <ul className="space-y-1.5">
                        {layer.sublayers.map((sub, i) => {
                          const subName = typeof sub === 'string' ? sub : sub.name
                          const subDetail = typeof sub === 'string' ? null : sub.detail
                          return (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${colors.bg} ${colors.border} border`} />
                              <div>
                                <span>{subName}</span>
                                {subDetail && (
                                  <span className="block text-xs text-slate-500 mt-0.5">{subDetail}</span>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Detalhes extras */}
                  {layer.details && (
                    <div className="mt-3 p-3 bg-slate-100 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">{layer.details}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// Componente de visualização Corte Transversal (Cross-Section)
function CrossSectionView({
  layers,
  theme,
  onLayerClick,
  selectedLayerId
}: {
  layers: Layer[]
  theme: string
  onLayerClick: (layerId: string) => void
  selectedLayerId: string | null
}) {
  return (
    <div className="relative">
      {/* Indicadores laterais */}
      <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between py-2 pr-2 border-r border-slate-200">
        <div className="text-[10px] text-slate-500 text-center">Lúmen</div>
        <div className="text-[10px] text-slate-500 text-center">Serosa</div>
      </div>

      {/* Visualização de corte */}
      <div className="ml-16 flex flex-col">
        {layers.map((layer, index) => {
          const colors = getLayerColors(layer.color, theme)
          const isSelected = selectedLayerId === layer.id
          const heightClass = layer.sublayers && layer.sublayers.length > 2 ? 'min-h-[80px]' : 'min-h-[50px]'

          return (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className={`
                relative ${heightClass} ${colors.bg} border-b-2 ${colors.border}
                cursor-pointer transition-all duration-300
                ${isSelected ? 'ring-2 ring-white/50 z-10' : ''}
                ${layer.invaded ? 'ring-2 ring-red-500/50' : ''}
              `}
              onClick={() => onLayerClick(layer.id)}
            >
              {/* Gradiente de fundo */}
              <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} opacity-60`} />

              {/* Indicador de invasão */}
              {layer.invaded && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: layer.invasionLevel === 'full' ? '100%' : '60%' }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                  className="absolute inset-y-0 left-0 bg-red-500/40 border-r-2 border-red-500"
                />
              )}

              {/* Conteúdo da camada */}
              <div className="relative z-10 p-3 flex items-center justify-between h-full">
                <div className="flex items-center gap-3">
                  {/* Número */}
                  <span className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${colors.bg} ${colors.text} border ${colors.border}
                  `}>
                    {index + 1}
                  </span>
                  {/* Nome e sublayers */}
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">{layer.name}</h5>
                    {layer.sublayers && layer.sublayers.length > 0 && (
                      <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {layer.sublayers.slice(0, 2).map(s => typeof s === 'string' ? s : s.name).join(' • ')}
                        {layer.sublayers.length > 2 && ` +${layer.sublayers.length - 2}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Estadiamento */}
                {layer.staging && (
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${layer.staging.toLowerCase().includes('tis') ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                      layer.staging.toLowerCase().includes('t1') ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                      layer.staging.toLowerCase().includes('t2') ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                      layer.staging.toLowerCase().includes('t3') ? 'bg-red-100 text-red-700 border border-red-300' :
                      'bg-red-200 text-red-800 border border-red-400'}
                  `}>
                    {layer.staging}
                  </span>
                )}
              </div>

              {/* Marcador de membrana */}
              {layer.marker && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-medium">
                  {layer.marker}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Legenda lateral direita */}
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500/50 via-red-500/50 to-yellow-500/50 rounded-r" />
    </div>
  )
}

// Componente de visualização Timeline (progressão)
function TimelineView({
  layers,
  theme,
  onLayerClick,
  selectedLayerId
}: {
  layers: Layer[]
  theme: string
  onLayerClick: (layerId: string) => void
  selectedLayerId: string | null
}) {
  return (
    <div className="relative px-4">
      {/* Linha central */}
      <div className="absolute left-1/2 top-8 bottom-8 w-1 bg-gradient-to-b from-emerald-500/50 via-yellow-500/50 to-red-500/50 rounded-full" />

      {/* Camadas alternadas */}
      <div className="space-y-4">
        {layers.map((layer, index) => {
          const colors = getLayerColors(layer.color, theme)
          const isSelected = selectedLayerId === layer.id
          const isLeft = index % 2 === 0

          return (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15, duration: 0.4 }}
              className={`flex items-center gap-4 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
            >
              {/* Card da camada */}
              <div
                className={`
                  flex-1 ${colors.bg} ${colors.border} border-2 rounded-xl p-3
                  cursor-pointer transition-all duration-300
                  ${isSelected ? 'ring-2 ring-white/50 scale-[1.02]' : ''}
                  ${layer.invaded ? 'ring-2 ring-red-500/50' : ''}
                  hover:scale-[1.01]
                `}
                onClick={() => onLayerClick(layer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`
                      w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold
                      ${colors.bg} ${colors.text} border ${colors.border}
                    `}>
                      {index + 1}
                    </span>
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">{layer.name}</h5>
                      {layer.staging && (
                        <span className="text-[10px] text-slate-500">{layer.stagingName || layer.staging}</span>
                      )}
                    </div>
                  </div>

                  {layer.staging && (
                    <span className={`
                      px-2 py-1 rounded text-xs font-bold
                      ${layer.staging.toLowerCase().includes('tis') ? 'bg-emerald-500/30 text-emerald-300' :
                        layer.staging.toLowerCase().includes('t1') ? 'bg-yellow-500/30 text-yellow-300' :
                        layer.staging.toLowerCase().includes('t2') ? 'bg-orange-500/30 text-orange-300' :
                        layer.staging.toLowerCase().includes('t3') ? 'bg-red-500/30 text-red-300' :
                        'bg-red-700/30 text-red-300'}
                    `}>
                      {layer.staging}
                    </span>
                  )}
                </div>

                {/* Sublayers resumidas */}
                {layer.sublayers && layer.sublayers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <div className="flex flex-wrap gap-1">
                      {layer.sublayers.slice(0, 3).map((sub, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">
                          {typeof sub === 'string' ? sub : sub.name}
                        </span>
                      ))}
                      {layer.sublayers.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-500">+{layer.sublayers.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Ponto central */}
              <div className={`
                w-4 h-4 rounded-full border-2 flex-shrink-0
                ${layer.invaded ? 'bg-red-500 border-red-400' : `${colors.bg} ${colors.border}`}
              `}>
                {layer.invaded && (
                  <div className="w-full h-full rounded-full bg-red-500 animate-pulse" />
                )}
              </div>

              {/* Espaço do outro lado */}
              <div className="flex-1" />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// Painel de detalhes lateral
function LayerDetailPanel({
  layer,
  theme,
  onClose
}: {
  layer: Layer
  theme: string
  onClose: () => void
}) {
  const colors = getLayerColors(layer.color, theme)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-4 right-4 w-72 z-20"
    >
      <div className="bg-white backdrop-blur-sm border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r ${colors.gradient} border-b border-slate-200`}>
          <div className="flex items-center gap-2">
            <Microscope className="w-4 h-4 text-slate-600" />
            <span className="text-slate-800 font-medium text-sm">Detalhes da Camada</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-4">
          {/* Nome */}
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Camada</span>
            <p className="text-slate-800 font-bold text-lg mt-1">{layer.name}</p>
          </div>

          {/* Estadiamento */}
          {layer.staging && (
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Estadiamento</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`
                  px-3 py-1.5 rounded-lg text-sm font-bold
                  ${layer.staging.toLowerCase().includes('tis') ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                    layer.staging.toLowerCase().includes('t1') ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                    layer.staging.toLowerCase().includes('t2') ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                    layer.staging.toLowerCase().includes('t3') ? 'bg-red-100 text-red-700 border border-red-300' :
                    'bg-red-200 text-red-800 border border-red-400'}
                `}>
                  {layer.staging}
                </span>
                {layer.stagingName && (
                  <span className="text-slate-500 text-sm">{layer.stagingName}</span>
                )}
              </div>
            </div>
          )}

          {/* Status de invasão */}
          {layer.invaded && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 text-sm font-medium">
                  {layer.invasionLevel === 'full' ? 'Camada totalmente invadida' : 'Camada parcialmente invadida'}
                </span>
              </div>
            </div>
          )}

          {/* Sublayers */}
          {layer.sublayers && layer.sublayers.length > 0 && (
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Componentes</span>
              <ul className="mt-2 space-y-1.5">
                {layer.sublayers.map((sub, i) => {
                  const subName = typeof sub === 'string' ? sub : sub.name
                  const subDetail = typeof sub === 'string' ? null : sub.detail
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${colors.bg} ${colors.border} border`} />
                      <div>
                        <span className="text-slate-700">{subName}</span>
                        {subDetail && (
                          <span className="block text-xs text-slate-500 mt-0.5">{subDetail}</span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Detalhes extras */}
          {layer.details && (
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600">{layer.details}</p>
              </div>
            </div>
          )}

          {/* Marcador */}
          {layer.marker && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-emerald-700 text-sm font-medium">{layer.marker}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Componente principal
export default function LayeredDiagram({
  title,
  layers,
  showStaging = false,
  showLegend,
  interactive = true,
  theme = 'histology',
  description,
  orientation = 'vertical',
  viewMode: initialViewMode = 'stacked'
}: LayeredDiagramProps) {
  // showLegend é um alias para showStaging
  const displayStaging = showLegend ?? showStaging
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)

  // Detectar mobile para responsividade do fullscreen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleLayer = useCallback((layerId: string) => {
    if (!interactive) return
    setExpandedLayers(prev => {
      const next = new Set(prev)
      if (next.has(layerId)) {
        next.delete(layerId)
      } else {
        next.add(layerId)
      }
      return next
    })
  }, [interactive])

  const expandAll = useCallback(() => {
    setExpandedLayers(new Set(layers.map(l => l.id)))
  }, [layers])

  const collapseAll = useCallback(() => {
    setExpandedLayers(new Set())
  }, [])

  // Handler para clique em camada nos modos alternativos
  const handleLayerClick = useCallback((layerId: string) => {
    if (!interactive) return
    setSelectedLayerId(prev => prev === layerId ? null : layerId)
  }, [interactive])

  // Obter camada selecionada
  const selectedLayer = layers.find(l => l.id === selectedLayerId)

  // Contar camadas invadidas
  const invadedCount = layers.filter(l => l.invaded).length

  // Definições dos modos de visualização
  const viewModes = [
    { id: 'stacked' as ViewMode, icon: Layers, label: 'Empilhado', description: 'Visão clássica em cards' },
    { id: 'crossSection' as ViewMode, icon: SplitSquareHorizontal, label: 'Corte', description: 'Corte transversal' },
    { id: 'timeline' as ViewMode, icon: Activity, label: 'Timeline', description: 'Progressão visual' },
  ]

  const content = (
    <div className={`
      ${isFullscreen ? 'h-full overflow-y-auto bg-white' : 'bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
              {description && (
                <p className="text-slate-500 text-sm">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Stats */}
            <div className="flex items-center gap-4 mr-2 text-sm">
              <span className="text-slate-500">
                <span className="font-bold text-slate-700">{layers.length}</span> camadas
              </span>
              {invadedCount > 0 && (
                <span className="text-red-500">
                  <span className="font-bold">{invadedCount}</span> invadida{invadedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Seletor de modo de visualização */}
            {interactive && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {viewModes.map((mode) => {
                  const IconComponent = mode.icon
                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setViewMode(mode.id)
                        setSelectedLayerId(null)
                      }}
                      className={`
                        p-1.5 rounded-md transition-all duration-200 relative group
                        ${viewMode === mode.id ? 'bg-purple-500/30 text-purple-300' : 'text-slate-500 hover:text-slate-600 hover:bg-slate-100'}
                      `}
                      title={mode.label}
                    >
                      <IconComponent className="w-4 h-4" />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {mode.label}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Ações do modo stacked */}
            {interactive && viewMode === 'stacked' && (
              <>
                <button
                  onClick={expandAll}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                >
                  Expandir
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                >
                  Recolher
                </button>
              </>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Maximize2 className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Legenda de estadiamento */}
        {displayStaging && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-500">Estadiamento:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: 'Tis', color: 'bg-emerald-100 text-emerald-700 border border-emerald-300' },
                { label: 'T1', color: 'bg-yellow-100 text-yellow-700 border border-yellow-300' },
                { label: 'T2', color: 'bg-orange-100 text-orange-700 border border-orange-300' },
                { label: 'T3', color: 'bg-red-100 text-red-700 border border-red-300' },
                { label: 'T4', color: 'bg-red-200 text-red-800 border border-red-400' },
              ].map(item => (
                <span key={item.label} className={`px-2 py-0.5 rounded text-xs font-medium ${item.color}`}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Camadas - Renderização condicional por viewMode */}
      <div className="relative">
        {viewMode === 'stacked' && (
          <div className={`p-4 space-y-3 ${orientation === 'horizontal' ? 'flex gap-3 overflow-x-auto' : ''}`}>
            {layers.map((layer, index) => (
              <LayerCard
                key={layer.id}
                layer={layer}
                index={index}
                isExpanded={expandedLayers.has(layer.id)}
                onToggle={() => toggleLayer(layer.id)}
                theme={theme}
                showStaging={displayStaging}
              />
            ))}
          </div>
        )}

        {viewMode === 'crossSection' && (
          <div className="p-4">
            <CrossSectionView
              layers={layers}
              theme={theme}
              onLayerClick={handleLayerClick}
              selectedLayerId={selectedLayerId}
            />
          </div>
        )}

        {viewMode === 'timeline' && (
          <div className="p-4">
            <TimelineView
              layers={layers}
              theme={theme}
              onLayerClick={handleLayerClick}
              selectedLayerId={selectedLayerId}
            />
          </div>
        )}

        {/* Painel de detalhes lateral para modos alternativos */}
        <AnimatePresence>
          {selectedLayer && viewMode !== 'stacked' && (
            <LayerDetailPanel
              layer={selectedLayer}
              theme={theme}
              onClose={() => setSelectedLayerId(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer com info dinâmico */}
      {interactive && (
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            {viewMode === 'stacked'
              ? 'Clique nas camadas para ver detalhes'
              : viewMode === 'crossSection'
              ? 'Visão de corte transversal - Clique para detalhes'
              : 'Progressão das camadas - Clique para detalhes'}
          </p>
        </div>
      )}
    </div>
  )

  // Overlay para fullscreen com fundo OPACO
  if (isFullscreen) {
    return (
      <>
        {/* Backdrop OPACO - não deixa ver o conteúdo por trás */}
        <div
          className="fixed inset-0 bg-slate-100 z-40"
          onClick={() => setIsFullscreen(false)}
        />
        {/* Container do conteúdo fullscreen */}
        <div className={`fixed z-50 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-2xl ${
          isMobile ? 'inset-0 rounded-none' : 'inset-4'
        }`}>
          {content}
        </div>
      </>
    )
  }

  return content
}

// Função para parsear JSON de camadas
export function parseLayeredDiagram(content: string): LayeredDiagramProps | null {
  try {
    const data = JSON.parse(content)

    // Validar estrutura mínima
    if (!data.layers || !Array.isArray(data.layers)) {
      return null
    }

    // Garantir IDs únicos
    const layers = data.layers.map((layer: Layer, index: number) => ({
      ...layer,
      id: layer.id || `layer-${index}`
    }))

    return {
      title: data.title || 'Diagrama de Camadas',
      layers,
      showStaging: data.showStaging ?? false,
      showLegend: data.showLegend,
      interactive: data.interactive ?? true,
      theme: data.theme || 'histology',
      description: data.description,
      orientation: data.orientation || 'vertical'
    }
  } catch {
    return null
  }
}
