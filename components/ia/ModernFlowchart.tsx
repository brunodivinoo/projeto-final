'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Maximize2,
  X,
  ChevronDown,
  Download,
  GitBranch
} from 'lucide-react'

// Tipos de nós
type NodeType = 'start' | 'process' | 'decision' | 'end'

interface FlowNode {
  id: string
  label: string
  type?: NodeType
  description?: string
}

interface FlowEdge {
  from: string
  to: string
  label?: string
  condition?: string // Para decisões: "Sim", "Não"
}

interface ModernFlowchartProps {
  title: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  description?: string
  showLegend?: boolean
}

// Cores por tipo de nó
const NODE_COLORS: Record<NodeType, { bg: string; border: string; text: string; icon: string }> = {
  start: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-600',
    text: 'text-white',
    icon: '▶'
  },
  process: {
    bg: 'bg-blue-500',
    border: 'border-blue-600',
    text: 'text-white',
    icon: '⚙'
  },
  decision: {
    bg: 'bg-amber-500',
    border: 'border-amber-600',
    text: 'text-white',
    icon: '◆'
  },
  end: {
    bg: 'bg-red-500',
    border: 'border-red-600',
    text: 'text-white',
    icon: '■'
  }
}

// Detectar tipo de nó automaticamente
function detectNodeType(node: FlowNode, edges: FlowEdge[], allNodes: FlowNode[]): NodeType {
  if (node.type) return node.type

  const label = node.label.toLowerCase()
  const id = node.id.toLowerCase()

  // Verificar se é início
  const hasIncoming = edges.some(e => e.to === node.id)
  if (!hasIncoming || label.includes('início') || label.includes('inicio') || id.includes('start')) {
    return 'start'
  }

  // Verificar se é fim
  const hasOutgoing = edges.some(e => e.from === node.id)
  if (!hasOutgoing || label.includes('fim') || label.includes('final') || id.includes('end')) {
    return 'end'
  }

  // Verificar se é decisão (tem ? ou múltiplas saídas)
  const outgoingCount = edges.filter(e => e.from === node.id).length
  if (label.includes('?') || outgoingCount > 1) {
    return 'decision'
  }

  return 'process'
}

// Componente de nó individual
function FlowNodeComponent({
  node,
  type,
  index,
  isSelected,
  onClick
}: {
  node: FlowNode
  type: NodeType
  index: number
  isSelected: boolean
  onClick: () => void
}) {
  const colors = NODE_COLORS[type]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      onClick={onClick}
      className={`
        relative cursor-pointer transition-all duration-200
        ${isSelected ? 'scale-105 z-10' : 'hover:scale-102'}
      `}
    >
      <div
        className={`
          px-5 py-3 rounded-2xl border-2 shadow-lg
          ${colors.bg} ${colors.border} ${colors.text}
          ${isSelected ? 'ring-4 ring-white/50 shadow-xl' : ''}
          ${type === 'decision' ? 'rotate-0' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg opacity-80">{colors.icon}</span>
          <span className="font-semibold text-sm whitespace-nowrap">{node.label}</span>
        </div>
      </div>
    </motion.div>
  )
}

// Componente de seta
function ArrowDown({ label, delay = 0 }: { label?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center py-1"
    >
      <div className="w-0.5 h-6 bg-slate-300" />
      {label && (
        <span className="text-xs text-slate-500 bg-white px-2 -my-1 relative z-10">
          {label}
        </span>
      )}
      <div className="w-0.5 h-3 bg-slate-300" />
      <ChevronDown className="w-5 h-5 text-slate-400 -mt-2" />
    </motion.div>
  )
}

// Componente principal
export default function ModernFlowchart({
  title,
  nodes,
  edges,
  description,
  showLegend = true
}: ModernFlowchartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Ordenar nós pelo fluxo
  const orderedNodes = useCallback(() => {
    const result: FlowNode[] = []
    const visited = new Set<string>()

    // Encontrar nó inicial
    let currentId = nodes.find(n => {
      const type = detectNodeType(n, edges, nodes)
      return type === 'start'
    })?.id || nodes[0]?.id

    // Seguir o fluxo
    while (currentId && !visited.has(currentId)) {
      const node = nodes.find(n => n.id === currentId)
      if (node) {
        result.push(node)
        visited.add(currentId)
      }

      // Encontrar próximo nó
      const nextEdge = edges.find(e => e.from === currentId)
      currentId = nextEdge?.to || ''
    }

    // Adicionar nós não visitados
    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        result.push(n)
      }
    })

    return result
  }, [nodes, edges])

  const sortedNodes = orderedNodes()
  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null

  const content = (
    <div className={`
      ${isFullscreen ? 'h-full overflow-auto' : ''}
      bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden
    `}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-sm">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
              {description && (
                <p className="text-slate-500 text-sm">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Maximize2 className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Fluxograma */}
      <div className="p-6 flex flex-col items-center min-h-[300px]">
        {sortedNodes.map((node, index) => {
          const type = detectNodeType(node, edges, nodes)
          const edge = edges.find(e => e.from === node.id)
          const isLast = index === sortedNodes.length - 1

          return (
            <div key={node.id} className="flex flex-col items-center">
              <FlowNodeComponent
                node={node}
                type={type}
                index={index}
                isSelected={selectedNode === node.id}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              />

              {!isLast && (
                <ArrowDown
                  label={edge?.label || edge?.condition}
                  delay={index * 0.1 + 0.05}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Painel de detalhes do nó selecionado */}
      <AnimatePresence>
        {selectedNodeData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-200 bg-slate-50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800">{selectedNodeData.label}</h4>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-slate-200 rounded"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              {selectedNodeData.description && (
                <p className="text-sm text-slate-600">{selectedNodeData.description}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span>Tipo:</span>
                <span className={`px-2 py-0.5 rounded ${NODE_COLORS[detectNodeType(selectedNodeData, edges, nodes)].bg} ${NODE_COLORS[detectNodeType(selectedNodeData, edges, nodes)].text}`}>
                  {detectNodeType(selectedNodeData, edges, nodes)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legenda */}
      {showLegend && (
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {Object.entries(NODE_COLORS).map(([type, colors]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${colors.bg}`} />
                <span className="text-xs text-slate-600 capitalize">
                  {type === 'start' ? 'Início' :
                   type === 'process' ? 'Processo' :
                   type === 'decision' ? 'Decisão' : 'Fim'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (isFullscreen) {
    return (
      <>
        <div
          className="fixed inset-0 bg-slate-100 z-40"
          onClick={() => setIsFullscreen(false)}
        />
        <div className="fixed inset-4 z-50 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-2xl">
          {content}
        </div>
      </>
    )
  }

  return <div className="my-4">{content}</div>
}

// Parser para JSON de fluxograma
export function parseModernFlowchart(content: string): ModernFlowchartProps | null {
  try {
    const data = JSON.parse(content)

    if (!data.nodes || !Array.isArray(data.nodes)) {
      return null
    }

    return {
      title: data.title || 'Fluxograma',
      nodes: data.nodes,
      edges: data.edges || [],
      description: data.description,
      showLegend: data.showLegend ?? true
    }
  } catch {
    return null
  }
}
