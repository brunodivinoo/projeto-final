'use client'

import { useEffect, useRef, useState, useCallback, memo} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Maximize2,
  Minimize2,
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Info,
  X,
  MousePointer2
} from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface MermaidDiagramProps {
  chart: string
  title?: string
  nodeDescriptions?: Record<string, string>
  disableInternalFullscreen?: boolean
}

interface NodeInfo {
  id: string
  label: string
  description?: string
  x: number
  y: number
  width: number
  height: number
}

interface SelectedNode {
  info: NodeInfo
  element: SVGElement
}

// ============================================================
// VALIDAÇÃO E CORREÇÃO DE CÓDIGO MERMAID
// ============================================================

/**
 * Corrige erros comuns em código Mermaid
 */
function fixMermaidCode(code: string): { fixed: string; wasModified: boolean; fixes: string[] } {
  let fixed = code.trim()
  const fixes: string[] = []
  const original = fixed

  // 1. Garantir que começa com declaração de tipo válida
  const validStarts = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'mindmap', 'timeline', 'gitGraph']
  const firstLine = fixed.split('\n')[0].trim().toLowerCase()
  const hasValidStart = validStarts.some(s => firstLine.startsWith(s.toLowerCase()))

  if (!hasValidStart) {
    fixed = 'flowchart TB\n' + fixed
    fixes.push('Adicionado tipo de diagrama (flowchart TB)')
  }

  // 2. Normalizar direções (TD/TB, LR, RL, BT)
  const directionFixed = fixed.replace(/^(graph|flowchart)\s+(?!TB|TD|LR|RL|BT)/im, '$1 TB ')
  if (directionFixed !== fixed) {
    fixed = directionFixed
    fixes.push('Corrigida direção do diagrama')
  }

  // 3. Corrigir setas mal formatadas
  const arrowsFixed = fixed
    .replace(/---+>/g, '-->')   // --- → -->
    .replace(/(?<!-)(?<!>)(?<!<)(?<!-)>(?!>)/g, '-->') // > sozinho → -->
    .replace(/<---+/g, '<--')   // <--- → <--
    .replace(/===+>/g, '==>')   // === → ==>
    .replace(/\.\.+>/g, '-.->')  // ..> → -.->

  if (arrowsFixed !== fixed) {
    fixed = arrowsFixed
    fixes.push('Corrigidas setas mal formatadas')
  }

  // 4. Corrigir IDs com caracteres especiais
  const lines = fixed.split('\n')
  let idsFixed = false
  const fixedLines = lines.map(line => {
    // Não modificar linhas de declaração de tipo ou subgraph
    if (/^\s*(graph|flowchart|subgraph|end|style|classDef|class|linkStyle)/i.test(line)) {
      return line
    }

    // Corrigir IDs que começam com número
    const numStartFixed = line.replace(/^(\s*)(\d+)(\s*[\[\]{}(])/gm, (match, indent, num, rest) => {
      idsFixed = true
      return indent + 'n' + num + rest
    })

    // Limpar caracteres inválidos em IDs
    return numStartFixed.replace(/^(\s*)([^\[\]{}()"\s:]+)(\s*[\[\]{}(])/gm, (match, indent, id, rest) => {
      const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '_')
      if (cleanId !== id) idsFixed = true
      return indent + cleanId + rest
    })
  })

  if (idsFixed) {
    fixed = fixedLines.join('\n')
    fixes.push('Corrigidos IDs com caracteres inválidos')
  }

  // 5. Remover linhas vazias múltiplas
  const cleanedEmpty = fixed.replace(/\n{3,}/g, '\n\n')
  if (cleanedEmpty !== fixed) {
    fixed = cleanedEmpty
    fixes.push('Removidas linhas vazias extras')
  }

  // 6. Garantir que subgraphs têm 'end'
  const subgraphCount = (fixed.match(/\bsubgraph\b/gi) || []).length
  const endCount = (fixed.match(/^\s*end\s*$/gm) || []).length
  if (subgraphCount > endCount) {
    for (let i = 0; i < subgraphCount - endCount; i++) {
      fixed += '\n    end'
    }
    fixes.push(`Adicionados ${subgraphCount - endCount} end(s) faltantes`)
  }

  // 7. Corrigir comentários (devem começar com %%)
  const commentsFixed = fixed
    .replace(/^\s*\/\/(.*)$/gm, '%% $1')
    .replace(/^\s*#([^#\[].*)?$/gm, '%% $1')

  if (commentsFixed !== fixed) {
    fixed = commentsFixed
    fixes.push('Corrigido formato de comentários')
  }

  // 8. Remover linhas que são apenas pontuação ou caracteres especiais inválidos
  const punctFixed = fixed.replace(/^\s*[.,;:!?]+\s*$/gm, '')
  if (punctFixed !== fixed) {
    fixed = punctFixed
    fixes.push('Removidas linhas com apenas pontuação')
  }

  // 9. Corrigir definições de estilo mal formatadas
  const styleFixed = fixed
    .replace(/style\s+(\w+)\s+fill\s*[:=]\s*/gi, 'style $1 fill:')
    .replace(/style\s+(\w+)\s+stroke\s*[:=]\s*/gi, 'style $1 stroke:')

  if (styleFixed !== fixed) {
    fixed = styleFixed
    fixes.push('Corrigidas definições de estilo')
  }

  // 10. Remover BOM e caracteres invisíveis
  const cleanInvisible = fixed
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')

  if (cleanInvisible !== fixed) {
    fixed = cleanInvisible
    fixes.push('Removidos caracteres invisíveis')
  }

  // 11. Corrigir texto dentro de colchetes/parênteses com aspas não escapadas
  const textFixed = fixed.replace(/\[([^\]]*)"([^\]]*)\]/g, (match, before, after) => {
    return `[${before}'${after}]`
  })
  if (textFixed !== fixed) {
    fixed = textFixed
    fixes.push('Corrigidas aspas em labels')
  }

  // 12. Corrigir nós que estão faltando texto
  const emptyNodesFixed = fixed.replace(/(\w+)\s*\[\s*\]/g, '$1[$1]')
  if (emptyNodesFixed !== fixed) {
    fixed = emptyNodesFixed
    fixes.push('Adicionado texto a nós vazios')
  }

  return {
    fixed: fixed.trim(),
    wasModified: fixed.trim() !== original.trim(),
    fixes
  }
}

/**
 * Valida se o código Mermaid é sintaticamente correto
 * Retorna null se válido, ou mensagem de erro se inválido
 */
function validateMermaidSyntax(code: string): string | null {
  const lines = code.trim().split('\n')

  if (lines.length === 0) {
    return 'Código vazio'
  }

  // Verificar primeira linha
  const firstLine = lines[0].trim().toLowerCase()
  const validTypes = ['graph', 'flowchart', 'sequencediagram', 'classdiagram', 'statediagram', 'erdiagram', 'journey', 'gantt', 'pie', 'mindmap', 'timeline', 'gitgraph']

  if (!validTypes.some(t => firstLine.startsWith(t))) {
    return `Tipo de diagrama inválido. Linha: "${lines[0]}"`
  }

  // Verificar balanceamento de colchetes e chaves
  let brackets = 0
  let braces = 0
  let parens = 0
  let inString = false

  for (const char of code) {
    if (char === '"' && !inString) inString = true
    else if (char === '"' && inString) inString = false

    if (!inString) {
      if (char === '[') brackets++
      if (char === ']') brackets--
      if (char === '{') braces++
      if (char === '}') braces--
      if (char === '(') parens++
      if (char === ')') parens--
    }
  }

  if (brackets !== 0) return `Colchetes não balanceados (${brackets > 0 ? 'faltam ]' : 'sobram ]'})`
  if (braces !== 0) return `Chaves não balanceadas (${braces > 0 ? 'faltam }' : 'sobram }'})`
  if (parens !== 0) return `Parênteses não balanceados (${parens > 0 ? 'faltam )' : 'sobram )'})`

  // Verificar subgraphs
  const subgraphCount = (code.match(/\bsubgraph\b/gi) || []).length
  const endCount = (code.match(/^\s*end\s*$/gm) || []).length
  if (subgraphCount !== endCount) {
    return `Subgraphs não fechados: ${subgraphCount} subgraph(s), ${endCount} end(s)`
  }

  return null
}

function MermaidDiagram({ chart, title, nodeDescriptions = {}, disableInternalFullscreen = false }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [codeWasFixed, setCodeWasFixed] = useState(false)
  const [appliedFixes, setAppliedFixes] = useState<string[]>([])

  // Estados para zoom e pan
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Estados para interatividade de nós
  const [hoveredNode, setHoveredNode] = useState<NodeInfo | null>(null)
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [highlightedPaths, setHighlightedPaths] = useState<Set<string>>(new Set())
  const [interactiveMode, setInteractiveMode] = useState(false) // Desabilitado por padrão para evitar travamento

  // Ref para throttle do mouse move
  const mouseMoveThrottleRef = useRef<number | null>(null)
  const lastPositionRef = useRef({ x: 0, y: 0 })

  // Detectar se é mobile
  const isMobile = useIsMobile()

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return

      try {
        // 1. VALIDAÇÃO E CORREÇÃO AUTOMÁTICA
        const validationError = validateMermaidSyntax(chart)
        let chartToRender = chart

        if (validationError) {
          console.log('[MermaidDiagram] Erro de validação detectado:', validationError)

          // Tentar corrigir automaticamente
          const { fixed, wasModified, fixes } = fixMermaidCode(chart)

          if (wasModified) {
            console.log('[MermaidDiagram] Código corrigido automaticamente:', fixes)
            chartToRender = fixed
            setCodeWasFixed(true)
            setAppliedFixes(fixes)

            // Validar novamente após correção
            const postFixError = validateMermaidSyntax(fixed)
            if (postFixError) {
              console.error('[MermaidDiagram] Ainda há erros após correção:', postFixError)
              setError(`Não foi possível corrigir o diagrama: ${postFixError}`)
              return
            }
          } else {
            // Não conseguiu corrigir
            setError(`Erro no código do diagrama: ${validationError}`)
            return
          }
        } else {
          setCodeWasFixed(false)
          setAppliedFixes([])
        }

        // Importar mermaid dinamicamente (client-side only)
        const mermaid = (await import('mermaid')).default

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'loose',
          suppressErrorRendering: false,
          themeVariables: {
            // TEMA CLARO - Cores vibrantes e legíveis
            // Cores principais
            primaryColor: '#10b981', // Verde esmeralda
            primaryTextColor: '#1e293b', // Texto escuro
            primaryBorderColor: '#10b981',
            lineColor: '#64748b',
            secondaryColor: '#3b82f6', // Azul
            tertiaryColor: '#8b5cf6', // Roxo
            background: '#ffffff',
            mainBkg: '#ffffff',

            // Nós e bordas - cores vibrantes com texto escuro
            nodeBorder: '#10b981',
            nodeTextColor: '#1e293b',

            // Clusters/subgraphs - fundo claro
            clusterBkg: '#f8fafc',
            clusterBorder: '#e2e8f0',

            // Títulos e labels
            titleColor: '#1e293b',
            edgeLabelBackground: '#ffffff',

            // Atores (sequence diagrams)
            actorTextColor: '#1e293b',
            actorBkg: '#10b981',
            actorBorder: '#059669',

            // Sinais
            signalColor: '#1e293b',
            signalTextColor: '#1e293b',

            // Labels
            labelBoxBkgColor: '#ffffff',
            labelBoxBorderColor: '#e2e8f0',
            labelTextColor: '#1e293b',
            loopTextColor: '#1e293b',

            // Notas
            noteBkgColor: '#fef3c7',
            noteTextColor: '#1e293b',
            noteBorderColor: '#fbbf24',

            // Ativação
            activationBkgColor: '#dbeafe',
            sequenceNumberColor: '#3b82f6',

            // Seções
            sectionBkgColor: '#f0fdf4',
            altSectionBkgColor: '#eff6ff',
            sectionBkgColor2: '#faf5ff',

            // Tasks (gantt)
            taskBkgColor: '#10b981',
            taskTextColor: '#ffffff',
            taskTextLightColor: '#1e293b',
            taskTextOutsideColor: '#1e293b',
            taskTextClickableColor: '#3b82f6',
            activeTaskBorderColor: '#059669',
            gridColor: '#e2e8f0',
            doneTaskBkgColor: '#86efac',
            doneTaskBorderColor: '#10b981',
            critBkgColor: '#fecaca',
            critBorderColor: '#ef4444',
            todayLineColor: '#f59e0b',

            // Flowchart específico
            defaultLinkColor: '#64748b',

            // Mindmap
            mindmapBranchColor: '#64748b',

            // Fonte
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSize: '14px'
          },
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            padding: 15,
            nodeSpacing: 80,
            rankSpacing: 80,
            useMaxWidth: true,
            wrappingWidth: 200
          },
          sequence: {
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 50,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
            mirrorActors: true,
            useMaxWidth: true,
            wrap: true
          },
          mindmap: {
            useMaxWidth: true,
            padding: 25,
            maxNodeWidth: 200
          }
        })

        // Gerar ID único para o diagrama
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`

        // Renderizar o diagrama
        const { svg: renderedSvg } = await mermaid.render(id, chartToRender)
        setSvg(renderedSvg)
        setError(null)
      } catch (err) {
        console.error('Erro ao renderizar Mermaid:', err)
        setError('Erro ao renderizar diagrama')
      }
    }

    renderDiagram()
  }, [chart])

  // Extrair descrições dos nós do próprio código Mermaid
  const extractNodeDescriptions = useCallback((chartCode: string): Record<string, string> => {
    const descriptions: Record<string, string> = { ...nodeDescriptions }

    // Procurar por comentários no formato %% NodeId: Descrição
    const commentRegex = /%%\s*(\w+):\s*(.+)/g
    let match
    while ((match = commentRegex.exec(chartCode)) !== null) {
      descriptions[match[1]] = match[2].trim()
    }

    return descriptions
  }, [nodeDescriptions])

  // Adicionar interatividade aos nós após renderização
  useEffect(() => {
    if (!svg || !svgContainerRef.current || !interactiveMode) return

    const container = svgContainerRef.current
    const svgElement = container.querySelector('svg')
    if (!svgElement) return

    const descriptions = extractNodeDescriptions(chart)
    
    // Array para armazenar cleanups
    const cleanupFns: Array<() => void> = []

    // Selecionar todos os nós (flowchart nodes)
    const nodes = svgElement.querySelectorAll('.node, .nodeLabel, [id^="flowchart-"]')

    nodes.forEach((node) => {
      const nodeElement = node as SVGElement

      // Encontrar o elemento pai que contém o ID do nó
      let nodeId = nodeElement.id || ''
      let parentNode: Element | null = nodeElement

      // Procurar o ID no elemento ou pai
      while (parentNode && !nodeId.includes('flowchart-')) {
        parentNode = parentNode.parentElement
        if (parentNode) {
          nodeId = parentNode.id || ''
        }
      }

      // Extrair ID limpo
      const cleanId = nodeId.replace('flowchart-', '').replace(/-\d+$/, '')

      // Encontrar o texto do nó
      const labelElement = nodeElement.querySelector('.nodeLabel') || nodeElement
      const label = labelElement.textContent || cleanId

      // Adicionar cursor pointer
      nodeElement.style.cursor = 'pointer'

      // Handler de hover com throttle
      let hoverTimeout: NodeJS.Timeout | null = null
      const handleMouseEnter = () => {
        if (hoverTimeout) clearTimeout(hoverTimeout)
        hoverTimeout = setTimeout(() => {
          const rect = nodeElement.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()

          setHoveredNode({
            id: cleanId,
            label: label,
            description: descriptions[cleanId],
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height
          })
          nodeElement.classList.add('node-hovered')
        }, 100) // 100ms debounce
      }

      const handleMouseLeave = () => {
        if (hoverTimeout) clearTimeout(hoverTimeout)
        setHoveredNode(null)
        nodeElement.classList.remove('node-hovered')
      }

      // Handler de clique
      const handleClick = (e: Event) => {
        e.stopPropagation()

        const rect = nodeElement.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()

        const nodeInfo: NodeInfo = {
          id: cleanId,
          label: label,
          description: descriptions[cleanId],
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height
        }

        setSelectedNode({ info: nodeInfo, element: nodeElement })

        // Destacar paths conectados
        highlightConnectedPaths(svgElement, cleanId)

        // Adicionar classe de selecionado
        svgElement.querySelectorAll('.node-selected').forEach(n => n.classList.remove('node-selected'))
        nodeElement.classList.add('node-selected')
      }

      nodeElement.addEventListener('mouseenter', handleMouseEnter)
      nodeElement.addEventListener('mouseleave', handleMouseLeave)
      nodeElement.addEventListener('click', handleClick)

      // Armazenar cleanup
      cleanupFns.push(() => {
        if (hoverTimeout) clearTimeout(hoverTimeout)
        nodeElement.removeEventListener('mouseenter', handleMouseEnter)
        nodeElement.removeEventListener('mouseleave', handleMouseLeave)
        nodeElement.removeEventListener('click', handleClick)
      })
    })

    // Clique fora para deselecionar
    const handleContainerClick = () => {
      setSelectedNode(null)
      setHighlightedPaths(new Set())
      svgElement.querySelectorAll('.node-selected').forEach(n => n.classList.remove('node-selected'))
      svgElement.querySelectorAll('.edge-highlighted').forEach(e => e.classList.remove('edge-highlighted'))
    }

    container.addEventListener('click', handleContainerClick)

    // Cleanup correto de todos os event listeners
    return () => {
      container.removeEventListener('click', handleContainerClick)
      cleanupFns.forEach(fn => fn())
    }
  }, [svg, interactiveMode, chart, extractNodeDescriptions])

  // Melhorar contraste de texto em nós claros após renderização
  useEffect(() => {
    if (!svg || !svgContainerRef.current) return

    const svgElement = svgContainerRef.current.querySelector('svg')
    if (!svgElement) return

    // Função para verificar se uma cor é clara
    const isLightColor = (fill: string): boolean => {
      // Cores claras conhecidas do Mermaid (amarelos, verdes claros, etc.)
      const lightColorPatterns = [
        '#fef08a', '#fde047', '#facc15', '#fbbf24', '#f59e0b', // Amarelos
        '#bef264', '#a3e635', '#84cc16', '#86efac', '#6ee7b7', // Verdes claros
        '#99f6e4', '#5eead4', '#2dd4bf', // Teals
        '#a5f3fc', '#67e8f9', // Cyans claros
        '#fca5a5', '#f87171', // Vermelhos claros
        '#fdba74', '#fb923c', // Laranjas
        '#fcd34d', '#fde68a', // Mais amarelos
        '#d9f99d', '#ecfccb', // Verde limão
        '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', // Brancos/cinzas claros
      ]

      const fillLower = fill.toLowerCase()
      return lightColorPatterns.some(c => fillLower.includes(c.slice(1).toLowerCase()))
    }

    // Encontrar todos os nós e ajustar contraste
    const nodes = svgElement.querySelectorAll('.node')
    nodes.forEach(node => {
      const shapes = node.querySelectorAll('rect, polygon, circle, ellipse, path')
      const textElements = node.querySelectorAll('.nodeLabel, text, tspan')

      shapes.forEach(shape => {
        const fill = shape.getAttribute('fill') || ''

        if (isLightColor(fill)) {
          // Aplicar texto escuro para fundos claros
          textElements.forEach(text => {
            const textEl = text as SVGElement
            textEl.style.fill = '#1e293b'
            textEl.style.fontWeight = '600'
          })
        }
      })
    })

    // Também verificar elementos com classes específicas de cor clara
    const yellowElements = svgElement.querySelectorAll('[fill*="fef"], [fill*="fde"], [fill*="fbc"], [fill*="facc"]')
    yellowElements.forEach(el => {
      const parentNode = el.closest('.node')
      if (parentNode) {
        const texts = parentNode.querySelectorAll('.nodeLabel, text, tspan')
        texts.forEach(text => {
          const textEl = text as SVGElement
          textEl.style.fill = '#1e293b'
          textEl.style.fontWeight = '600'
        })
      }
    })

  }, [svg])

  // Otimização para Mobile - Garantir visibilidade do SVG
  useEffect(() => {
    if (!svg || !svgContainerRef.current) return

    const svgElement = svgContainerRef.current.querySelector('svg')
    if (!svgElement) return

    if (isMobile) {
      // Forçar SVG responsivo no mobile
      svgElement.setAttribute('width', '100%')
      svgElement.setAttribute('height', 'auto')
      svgElement.style.maxWidth = '100%'
      svgElement.style.height = 'auto'

      // Ajustar viewBox para caber na tela
      const bbox = svgElement.getBBox?.()
      if (bbox) {
        const padding = 20
        svgElement.setAttribute(
          'viewBox',
          `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`
        )
      }

      // Desabilitar interatividade no mobile por padrão (performance)
      if (interactiveMode) {
        setInteractiveMode(false)
      }

      console.log('[MermaidDiagram] Otimizado para mobile')
    }
  }, [svg, isMobile, interactiveMode])

  // Destacar caminhos conectados a um nó
  const highlightConnectedPaths = (svgElement: SVGSVGElement, nodeId: string) => {
    const paths = new Set<string>()

    // Procurar todas as edges/links
    const edges = svgElement.querySelectorAll('.edge, .link, [class*="edge"], path[id*="L-"]')

    edges.forEach((edge) => {
      const edgeId = edge.id || ''

      // Verificar se a edge conecta ao nó
      if (edgeId.toLowerCase().includes(nodeId.toLowerCase())) {
        paths.add(edgeId)
        edge.classList.add('edge-highlighted')
      } else {
        edge.classList.remove('edge-highlighted')
      }
    })

    setHighlightedPaths(paths)
  }

  // Fechar painel de detalhes
  const closeDetails = useCallback(() => {
    setSelectedNode(null)
    setHighlightedPaths(new Set())
    const svgElement = svgContainerRef.current?.querySelector('svg')
    if (svgElement) {
      svgElement.querySelectorAll('.node-selected').forEach(n => n.classList.remove('node-selected'))
      svgElement.querySelectorAll('.edge-highlighted').forEach(e => e.classList.remove('edge-highlighted'))
    }
  }, [])

  // Reset zoom e posição
  const resetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Zoom in
  const zoomIn = useCallback(() => {
    setScale(s => Math.min(s + 0.25, 3))
  }, [])

  // Zoom out
  const zoomOut = useCallback(() => {
    setScale(s => Math.max(s - 0.25, 0.5))
  }, [])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setScale(s => Math.max(0.5, Math.min(3, s + delta)))
    }
  }, [])

  // Pan com mouse drag - funciona sempre em fullscreen ou quando scale > 1
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && (isFullscreen || e.ctrlKey || e.metaKey || scale > 1)) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }, [position, scale, isFullscreen])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    
    // Throttle: só atualiza a cada 16ms (~60fps) para evitar travamento
    if (mouseMoveThrottleRef.current) return
    
    mouseMoveThrottleRef.current = window.requestAnimationFrame(() => {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      
      // Só atualiza se houver mudança significativa (>2px)
      if (Math.abs(newX - lastPositionRef.current.x) > 2 || 
          Math.abs(newY - lastPositionRef.current.y) > 2) {
        lastPositionRef.current = { x: newX, y: newY }
        setPosition({ x: newX, y: newY })
      }
      
      mouseMoveThrottleRef.current = null
    })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    // Limpar throttle pendente
    if (mouseMoveThrottleRef.current) {
      cancelAnimationFrame(mouseMoveThrottleRef.current)
      mouseMoveThrottleRef.current = null
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsFullscreen(false)
          break
        case '+':
        case '=':
          zoomIn()
          break
        case '-':
          zoomOut()
          break
        case '0':
          resetView()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, zoomIn, zoomOut, resetView])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chart)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const handleDownload = () => {
    if (!svg) return

    // Criar blob com o SVG
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    // Criar link de download
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'diagrama'}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 my-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-500 text-sm">⚠</span>
          </div>
          <p className="text-red-700 font-medium text-sm">Erro ao renderizar diagrama</p>
        </div>
        <p className="text-red-600 text-sm mb-3">{error}</p>
        <details className="group">
          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
            Ver código original
          </summary>
          <pre className="mt-2 text-xs text-slate-600 overflow-x-auto bg-slate-100 p-3 rounded-lg max-h-40">
            {chart}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div className={`my-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-8 overflow-hidden' : ''}`}>
      <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-slate-200">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-base">🔀</span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-800 text-sm font-medium block truncate">
                {title || 'Diagrama'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-purple-600 text-xs font-medium">Fluxograma</span>
                {codeWasFixed && (
                  <span className="text-amber-600 text-xs flex items-center gap-1" title={`Correções: ${appliedFixes.join(', ')}`}>
                    ⚡ Auto-corrigido
                  </span>
                )}
                {!codeWasFixed && <span className="text-slate-400 text-xs">Preview</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Zoom controls - hidden em mobile para economizar espaço */}
            <div className="hidden sm:flex items-center gap-0.5">
              <button
                onClick={zoomOut}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors active:bg-slate-200"
                title="Diminuir zoom (-)"
              >
                <ZoomOut className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={resetView}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors active:bg-slate-200"
                title="Resetar visualização (0)"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={zoomIn}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors active:bg-slate-200"
                title="Aumentar zoom (+)"
              >
                <ZoomIn className="w-4 h-4 text-slate-600" />
              </button>

              <div className="w-px h-5 bg-slate-100 mx-1" />
            </div>

            {/* Toggle modo interativo - hidden em mobile */}
            <button
              onClick={() => setInteractiveMode(!interactiveMode)}
              className={`hidden sm:flex p-2 rounded-lg transition-colors ${
                interactiveMode ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-100 text-slate-600'
              }`}
              title={interactiveMode ? 'Desativar modo interativo' : 'Ativar modo interativo'}
            >
              <MousePointer2 className="w-4 h-4" />
            </button>

            <div className="hidden sm:block w-px h-5 bg-slate-100 mx-1" />

            {/* Copiar - hidden em mobile */}
            <button
              onClick={handleCopy}
              className="hidden sm:flex p-2 hover:bg-slate-100 rounded-lg transition-colors active:bg-slate-200"
              title="Copiar código"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Download - hidden em mobile */}
            <button
              onClick={handleDownload}
              className="hidden sm:flex p-2 hover:bg-slate-100 rounded-lg transition-colors active:bg-slate-200"
              title="Baixar SVG"
            >
              <Download className="w-4 h-4 text-slate-600" />
            </button>

            {/* Fullscreen - SEMPRE visível (essencial para mobile), oculto quando já está em sidebar/modal */}
            {!disableInternalFullscreen && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors active:bg-slate-200"
                title={isFullscreen ? 'Sair do fullscreen (ESC)' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-slate-600" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-slate-600" />
                )}
              </button>
            )}

          </div>
        </div>

        {/* Diagrama */}
        <div
          ref={containerRef}
          className={`relative ${isMobile && !isFullscreen ? 'overflow-x-auto' : 'overflow-hidden'} ${isFullscreen ? 'flex-1' : 'min-h-[200px]'}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : (isFullscreen || scale > 1 ? 'grab' : 'default') }}
        >
          <div
            ref={svgContainerRef}
            className={`${isMobile && !isFullscreen ? 'p-4 min-w-max' : 'p-6'} flex items-center justify-center ${isDragging ? '' : 'transition-transform duration-100'}`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              minHeight: isFullscreen ? 'calc(100vh - 12rem)' : '200px',
              willChange: isDragging ? 'transform' : 'auto'
            }}
          >
            {svg ? (
              <div
                className={`mermaid-container ${isMobile && !isFullscreen ? 'min-w-[600px]' : 'w-full'} overflow-visible`}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                <span>Renderizando diagrama...</span>
              </div>
            )}
          </div>

          {/* Tooltip flutuante no hover */}
          <AnimatePresence>
            {hoveredNode && !selectedNode && interactiveMode && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute z-20 pointer-events-none"
                style={{
                  left: hoveredNode.x,
                  top: hoveredNode.y - 10,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-xl">
                  <p className="text-slate-800 font-medium text-sm">{hoveredNode.label}</p>
                  {hoveredNode.description && (
                    <p className="text-slate-500 text-xs mt-1 max-w-[200px]">
                      {hoveredNode.description}
                    </p>
                  )}
                  {!hoveredNode.description && (
                    <p className="text-slate-400 text-xs mt-1 italic">
                      Clique para ver mais
                    </p>
                  )}
                </div>
                {/* Arrow */}
                <div className="w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Painel de detalhes do nó selecionado */}
          <AnimatePresence>
            {selectedNode && interactiveMode && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-4 right-4 z-30 w-80"
              >
                <div className="bg-white backdrop-blur-sm border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                  {/* Header do painel */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-cyan-50 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-emerald-600" />
                      <span className="text-slate-800 font-medium text-sm">Detalhes do Nó</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        closeDetails()
                      }}
                      className="p-1 hover:bg-slate-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4 space-y-4">
                    {/* Nome/Label principal */}
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Elemento</span>
                      <p className="text-slate-800 font-bold text-lg mt-1">{selectedNode.info.label}</p>
                    </div>

                    {/* Tipo de nó (detectado automaticamente) */}
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Tipo</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedNode.info.label.includes('?')
                            ? 'bg-amber-100 text-amber-700'
                            : selectedNode.info.id.toLowerCase().includes('start') || selectedNode.info.id.toLowerCase().includes('inicio')
                              ? 'bg-emerald-100 text-emerald-700'
                              : selectedNode.info.id.toLowerCase().includes('end') || selectedNode.info.id.toLowerCase().includes('fim')
                                ? 'bg-red-100 text-red-700'
                                : selectedNode.info.label.toLowerCase().includes('t1') || selectedNode.info.label.toLowerCase().includes('t2') || selectedNode.info.label.toLowerCase().includes('t3') || selectedNode.info.label.toLowerCase().includes('t4') || selectedNode.info.label.toLowerCase().includes('tis')
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedNode.info.label.includes('?') ? '⬥ Decisão' :
                           selectedNode.info.id.toLowerCase().includes('start') || selectedNode.info.id.toLowerCase().includes('inicio') ? '▶ Início' :
                           selectedNode.info.id.toLowerCase().includes('end') || selectedNode.info.id.toLowerCase().includes('fim') ? '■ Fim' :
                           selectedNode.info.label.toLowerCase().includes('t1') || selectedNode.info.label.toLowerCase().includes('t2') || selectedNode.info.label.toLowerCase().includes('t3') || selectedNode.info.label.toLowerCase().includes('t4') || selectedNode.info.label.toLowerCase().includes('tis') ? '📊 Estadiamento' :
                           '▢ Processo'}
                        </span>
                      </div>
                    </div>

                    {/* ID técnico */}
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider">ID</span>
                      <p className="text-emerald-600 font-mono text-sm mt-1">{selectedNode.info.id}</p>
                    </div>

                    {/* Descrição contextual */}
                    {selectedNode.info.description ? (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <span className="text-xs text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                          📚 Explicação
                        </span>
                        <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                          {selectedNode.info.description}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-amber-700 text-xs leading-relaxed">
                          💡 Este nó representa um passo no algoritmo. Clique em outros nós para entender o fluxo completo de decisões.
                        </p>
                      </div>
                    )}

                    {/* Conexões */}
                    {highlightedPaths.size > 0 && (
                      <div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Conexões</span>
                        <p className="text-cyan-600 text-sm mt-1 flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                          {highlightedPaths.size} caminho(s) destacado(s)
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          Siga as linhas destacadas para ver o fluxo
                        </p>
                      </div>
                    )}

                    {/* Dica de uso */}
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-slate-400 text-xs flex items-center gap-2">
                        <MousePointer2 className="w-3 h-3" />
                        Clique em outros nós para ver suas conexões
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint para zoom/pan em fullscreen */}
          {isFullscreen && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-white/90 border border-slate-200 rounded-lg text-slate-500 text-xs shadow-sm">
              <Move className="w-3 h-3" />
              <span>{isMobile ? 'Arraste para mover' : 'Arraste para mover'}</span>
              {!isMobile && (
                <>
                  <span className="text-slate-300">|</span>
                  <span>Ctrl + Scroll para zoom</span>
                </>
              )}
              <span className="text-slate-300">|</span>
              <span>{isMobile ? 'Toque para fechar' : 'ESC para sair'}</span>
            </div>
          )}

          {/* Hint para scroll horizontal no mobile */}
          {isMobile && !isFullscreen && svg && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 bg-purple-50 border border-purple-200 rounded-lg">
              <span className="text-purple-600 text-xs">← Deslize para ver mais →</span>
            </div>
          )}

          {/* Indicador de modo interativo */}
          {interactiveMode && !isFullscreen && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
              <MousePointer2 className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-600 text-xs">Clique nos nós</span>
            </div>
          )}
        </div>
      </div>

      {/* Estilos CSS para interatividade */}
      <style jsx global>{`
        .node-hovered rect,
        .node-hovered polygon,
        .node-hovered circle,
        .node-hovered ellipse {
          filter: brightness(1.3) drop-shadow(0 0 8px rgba(16, 185, 129, 0.5));
          transition: all 0.2s ease;
        }

        .node-selected rect,
        .node-selected polygon,
        .node-selected circle,
        .node-selected ellipse {
          stroke: #10b981 !important;
          stroke-width: 3px !important;
          filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.7));
        }

        .edge-highlighted path {
          stroke: #06b6d4 !important;
          stroke-width: 3px !important;
          filter: drop-shadow(0 0 6px rgba(6, 182, 212, 0.6));
        }

        .mermaid-container .node {
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  )
}

export default memo(MermaidDiagram)
