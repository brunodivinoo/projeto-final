'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronDown,
  Maximize2,
  X,
  Users,
  Circle
} from 'lucide-react'

// Tipos
interface TreeNode {
  id: string
  name: string
  description?: string
  children?: TreeNode[]
  icon?: string
  color?: string
}

interface TreeDiagramProps {
  title: string
  data: TreeNode
  description?: string
  defaultExpanded?: boolean
  showChildCount?: boolean
}

// Cores para níveis
const LEVEL_COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
]

// Componente de nó da árvore
function TreeNodeComponent({
  node,
  level = 0,
  isExpanded,
  onToggle,
  expandedNodes,
  onNodeToggle,
  showChildCount
}: {
  node: TreeNode
  level?: number
  isExpanded: boolean
  onToggle: () => void
  expandedNodes: Set<string>
  onNodeToggle: (id: string) => void
  showChildCount: boolean
}) {
  const hasChildren = node.children && node.children.length > 0
  const colors = LEVEL_COLORS[level % LEVEL_COLORS.length]
  const childCount = node.children?.length || 0

  return (
    <div className="relative">
      {/* Linha conectora vertical */}
      {level > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-slate-200"
          style={{ marginLeft: `${(level - 1) * 24 + 12}px` }}
        />
      )}

      {/* Nó */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: level * 0.05 }}
        className="relative"
        style={{ paddingLeft: `${level * 24}px` }}
      >
        {/* Linha horizontal conectora */}
        {level > 0 && (
          <div
            className="absolute top-1/2 w-4 h-px bg-slate-200"
            style={{ left: `${(level - 1) * 24 + 12}px` }}
          />
        )}

        <div
          onClick={hasChildren ? onToggle : undefined}
          className={`
            flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-200
            ${hasChildren ? 'cursor-pointer hover:bg-slate-50' : ''}
            ${isExpanded && hasChildren ? 'bg-slate-50' : ''}
          `}
        >
          {/* Ícone de expansão ou bullet */}
          <div className="flex-shrink-0 w-5">
            {hasChildren ? (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </motion.div>
            ) : (
              <div className="w-5 flex justify-center">
                <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
              </div>
            )}
          </div>

          {/* Ícone do nó */}
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
            ${colors.bg}
          `}>
            {node.icon ? (
              <span className="text-lg">{node.icon}</span>
            ) : (
              <Circle className="w-5 h-5 text-white fill-white" />
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-800 truncate">{node.name}</h4>
              {showChildCount && hasChildren && (
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-medium
                  ${colors.light} ${colors.text}
                `}>
                  {childCount}
                </span>
              )}
            </div>
            {node.description && (
              <p className="text-sm text-slate-500 truncate">{node.description}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filhos */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children!.map((child) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                level={level + 1}
                isExpanded={expandedNodes.has(child.id)}
                onToggle={() => onNodeToggle(child.id)}
                expandedNodes={expandedNodes}
                onNodeToggle={onNodeToggle}
                showChildCount={showChildCount}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Componente principal
export default function TreeDiagram({
  title,
  data,
  description,
  defaultExpanded = true,
  showChildCount = true
}: TreeDiagramProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Coletar todos os IDs para expansão inicial
  const collectAllIds = useCallback((node: TreeNode): string[] => {
    const ids = [node.id]
    if (node.children) {
      node.children.forEach(child => {
        ids.push(...collectAllIds(child))
      })
    }
    return ids
  }, [])

  // Estado de nós expandidos
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    if (defaultExpanded) {
      // Expandir apenas o primeiro nível por padrão
      const firstLevelIds = [data.id]
      if (data.children) {
        data.children.forEach(child => firstLevelIds.push(child.id))
      }
      return new Set(firstLevelIds)
    }
    return new Set([data.id])
  })

  const toggleNode = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedNodes(new Set(collectAllIds(data)))
  }, [data, collectAllIds])

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set([data.id]))
  }, [data.id])

  // Contar total de nós
  const countNodes = useCallback((node: TreeNode): number => {
    let count = 1
    if (node.children) {
      node.children.forEach(child => {
        count += countNodes(child)
      })
    }
    return count
  }, [])

  const totalNodes = countNodes(data)

  const content = (
    <div className={`
      ${isFullscreen ? 'h-full overflow-auto' : ''}
      bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden
    `}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
              {description && (
                <p className="text-slate-500 text-sm">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{totalNodes}</span> itens
            </span>

            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              Expandir
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              Recolher
            </button>

          </div>
        </div>
      </div>

      {/* Árvore */}
      <div className="p-4">
        <TreeNodeComponent
          node={data}
          isExpanded={expandedNodes.has(data.id)}
          onToggle={() => toggleNode(data.id)}
          expandedNodes={expandedNodes}
          onNodeToggle={toggleNode}
          showChildCount={showChildCount}
        />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500 text-center">
          Clique nos itens para expandir/recolher
        </p>
      </div>
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

// Parser para JSON de árvore
export function parseTreeDiagram(content: string): TreeDiagramProps | null {
  try {
    const data = JSON.parse(content)

    // Verificar se tem a estrutura de árvore
    if (!data.data && !data.root && !data.tree) {
      // Tentar usar o próprio objeto como nó raiz
      if (data.name || data.label) {
        return {
          title: data.title || 'Organograma',
          data: normalizeTreeNode(data),
          description: data.description,
          defaultExpanded: data.defaultExpanded ?? true,
          showChildCount: data.showChildCount ?? true
        }
      }
      return null
    }

    const rootData = data.data || data.root || data.tree

    return {
      title: data.title || 'Organograma',
      data: normalizeTreeNode(rootData),
      description: data.description,
      defaultExpanded: data.defaultExpanded ?? true,
      showChildCount: data.showChildCount ?? true
    }
  } catch {
    return null
  }
}

// Normalizar estrutura de nó
function normalizeTreeNode(node: Record<string, unknown>, index: number = 0): TreeNode {
  const name = (node.name || node.label || node.title || `Item ${index + 1}`) as string
  const children = (node.children || node.items || node.nodes) as Record<string, unknown>[] | undefined

  return {
    id: (node.id as string) || `node-${index}-${Date.now()}`,
    name,
    description: node.description as string | undefined,
    icon: node.icon as string | undefined,
    color: node.color as string | undefined,
    children: children?.map((child, i) => normalizeTreeNode(child, i))
  }
}
