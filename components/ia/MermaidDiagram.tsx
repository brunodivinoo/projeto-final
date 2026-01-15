'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
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

interface MermaidDiagramProps {
  chart: string
  title?: string
  nodeDescriptions?: Record<string, string>
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

export default function MermaidDiagram({ chart, title, nodeDescriptions = {} }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Estados para zoom e pan
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Estados para interatividade de nós
  const [hoveredNode, setHoveredNode] = useState<NodeInfo | null>(null)
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [highlightedPaths, setHighlightedPaths] = useState<Set<string>>(new Set())
  const [interactiveMode, setInteractiveMode] = useState(true)

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return

      try {
        // Importar mermaid dinamicamente (client-side only)
        const mermaid = (await import('mermaid')).default

        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          suppressErrorRendering: false,
          themeVariables: {
            // Cores principais - todas escuras para melhor contraste de texto
            primaryColor: '#1e3a5f',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#10b981',
            lineColor: '#94a3b8',
            secondaryColor: '#1e293b',
            tertiaryColor: '#334155',
            background: '#0f172a',
            mainBkg: '#1e293b',

            // Nós e bordas
            nodeBorder: '#10b981',
            nodeTextColor: '#ffffff',

            // Clusters/subgraphs - fundo escuro sempre
            clusterBkg: '#1e293b',
            clusterBorder: '#475569',

            // Títulos e labels
            titleColor: '#ffffff',
            edgeLabelBackground: '#1e293b',

            // Atores (sequence diagrams)
            actorTextColor: '#ffffff',
            actorBkg: '#1e3a5f',
            actorBorder: '#10b981',

            // Sinais
            signalColor: '#ffffff',
            signalTextColor: '#ffffff',

            // Labels
            labelBoxBkgColor: '#1e293b',
            labelBoxBorderColor: '#475569',
            labelTextColor: '#ffffff',
            loopTextColor: '#ffffff',

            // Notas
            noteBkgColor: '#334155',
            noteTextColor: '#ffffff',
            noteBorderColor: '#64748b',

            // Ativação
            activationBkgColor: '#1e293b',
            sequenceNumberColor: '#10b981',

            // Seções
            sectionBkgColor: '#1e293b',
            altSectionBkgColor: '#334155',
            sectionBkgColor2: '#1e293b',

            // Tasks (gantt)
            taskBkgColor: '#1e3a5f',
            taskTextColor: '#ffffff',
            taskTextLightColor: '#ffffff',
            taskTextOutsideColor: '#ffffff',
            taskTextClickableColor: '#10b981',
            activeTaskBorderColor: '#10b981',
            gridColor: '#475569',
            doneTaskBkgColor: '#064e3b',
            doneTaskBorderColor: '#10b981',
            critBkgColor: '#7f1d1d',
            critBorderColor: '#ef4444',
            todayLineColor: '#f59e0b',

            // Flowchart específico
            defaultLinkColor: '#94a3b8',

            // Mindmap - cores escuras para contraste
            mindmapBranchColor: '#94a3b8',

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
        const { svg: renderedSvg } = await mermaid.render(id, chart)
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

      // Handler de hover
      const handleMouseEnter = (e: Event) => {
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

        // Destacar o nó
        nodeElement.classList.add('node-hovered')
      }

      const handleMouseLeave = () => {
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

      // Cleanup
      return () => {
        nodeElement.removeEventListener('mouseenter', handleMouseEnter)
        nodeElement.removeEventListener('mouseleave', handleMouseLeave)
        nodeElement.removeEventListener('click', handleClick)
      }
    })

    // Clique fora para deselecionar
    const handleContainerClick = () => {
      setSelectedNode(null)
      setHighlightedPaths(new Set())
      svgElement.querySelectorAll('.node-selected').forEach(n => n.classList.remove('node-selected'))
      svgElement.querySelectorAll('.edge-highlighted').forEach(e => e.classList.remove('edge-highlighted'))
    }

    container.addEventListener('click', handleContainerClick)

    return () => {
      container.removeEventListener('click', handleContainerClick)
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
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
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
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 my-4">
        <p className="text-red-400 text-sm">{error}</p>
        <pre className="mt-2 text-xs text-white/60 overflow-x-auto">
          {chart}
        </pre>
      </div>
    )
  }

  return (
    <div className={`my-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900/95 p-8 overflow-hidden' : ''}`}>
      <div className={`bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-slate-800/80 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-base">🔀</span>
            </div>
            <div className="min-w-0">
              <span className="text-white/90 text-sm font-medium block truncate">
                {title || 'Diagrama'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-purple-400 text-xs font-medium">Fluxograma</span>
                <span className="text-white/30 text-xs">Preview</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Zoom controls - hidden em mobile para economizar espaço */}
            <div className="hidden sm:flex items-center gap-0.5">
              <button
                onClick={zoomOut}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors active:bg-white/20"
                title="Diminuir zoom (-)"
              >
                <ZoomOut className="w-4 h-4 text-white/60" />
              </button>
              <button
                onClick={resetView}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors active:bg-white/20"
                title="Resetar visualização (0)"
              >
                <RotateCcw className="w-4 h-4 text-white/60" />
              </button>
              <button
                onClick={zoomIn}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors active:bg-white/20"
                title="Aumentar zoom (+)"
              >
                <ZoomIn className="w-4 h-4 text-white/60" />
              </button>

              <div className="w-px h-5 bg-white/10 mx-1" />
            </div>

            {/* Toggle modo interativo - hidden em mobile */}
            <button
              onClick={() => setInteractiveMode(!interactiveMode)}
              className={`hidden sm:flex p-2 rounded-lg transition-colors ${
                interactiveMode ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-white/60'
              }`}
              title={interactiveMode ? 'Desativar modo interativo' : 'Ativar modo interativo'}
            >
              <MousePointer2 className="w-4 h-4" />
            </button>

            <div className="hidden sm:block w-px h-5 bg-white/10 mx-1" />

            {/* Copiar - hidden em mobile */}
            <button
              onClick={handleCopy}
              className="hidden sm:flex p-2 hover:bg-white/10 rounded-lg transition-colors active:bg-white/20"
              title="Copiar código"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-white/60" />
              )}
            </button>

            {/* Download - hidden em mobile */}
            <button
              onClick={handleDownload}
              className="hidden sm:flex p-2 hover:bg-white/10 rounded-lg transition-colors active:bg-white/20"
              title="Baixar SVG"
            >
              <Download className="w-4 h-4 text-white/60" />
            </button>

            {/* Fullscreen - sempre visível com área maior para touch */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2.5 hover:bg-white/10 rounded-lg transition-colors active:bg-purple-500/20 ml-1"
              title={isFullscreen ? 'Sair da tela cheia (ESC)' : 'Expandir diagrama'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-white/70" />
              ) : (
                <Maximize2 className="w-5 h-5 text-white/70" />
              )}
            </button>
          </div>
        </div>

        {/* Diagrama */}
        <div
          ref={containerRef}
          className={`relative overflow-hidden ${isFullscreen ? 'flex-1' : 'min-h-[200px]'}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : (isFullscreen || scale > 1 ? 'grab' : 'default') }}
        >
          <div
            ref={svgContainerRef}
            className="p-6 flex items-center justify-center transition-transform duration-100"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              minHeight: isFullscreen ? 'calc(100vh - 12rem)' : '200px'
            }}
          >
            {svg ? (
              <div
                className="mermaid-container w-full overflow-visible"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <div className="flex items-center gap-2 text-white/40">
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
                <div className="bg-slate-800 border border-white/20 rounded-lg px-3 py-2 shadow-xl">
                  <p className="text-white font-medium text-sm">{hoveredNode.label}</p>
                  {hoveredNode.description && (
                    <p className="text-white/60 text-xs mt-1 max-w-[200px]">
                      {hoveredNode.description}
                    </p>
                  )}
                  {!hoveredNode.description && (
                    <p className="text-white/40 text-xs mt-1 italic">
                      Clique para ver mais
                    </p>
                  )}
                </div>
                {/* Arrow */}
                <div className="w-3 h-3 bg-slate-800 border-r border-b border-white/20 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5" />
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
                <div className="bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                  {/* Header do painel */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-emerald-400" />
                      <span className="text-white font-medium text-sm">Detalhes do Nó</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        closeDetails()
                      }}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4 space-y-4">
                    {/* Nome/Label principal */}
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Elemento</span>
                      <p className="text-white font-bold text-lg mt-1">{selectedNode.info.label}</p>
                    </div>

                    {/* Tipo de nó (detectado automaticamente) */}
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Tipo</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedNode.info.label.includes('?')
                            ? 'bg-amber-500/20 text-amber-300'
                            : selectedNode.info.id.toLowerCase().includes('start') || selectedNode.info.id.toLowerCase().includes('inicio')
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : selectedNode.info.id.toLowerCase().includes('end') || selectedNode.info.id.toLowerCase().includes('fim')
                                ? 'bg-red-500/20 text-red-300'
                                : selectedNode.info.label.toLowerCase().includes('t1') || selectedNode.info.label.toLowerCase().includes('t2') || selectedNode.info.label.toLowerCase().includes('t3') || selectedNode.info.label.toLowerCase().includes('t4') || selectedNode.info.label.toLowerCase().includes('tis')
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : 'bg-blue-500/20 text-blue-300'
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
                      <span className="text-xs text-white/40 uppercase tracking-wider">ID</span>
                      <p className="text-emerald-400 font-mono text-sm mt-1">{selectedNode.info.id}</p>
                    </div>

                    {/* Descrição contextual */}
                    {selectedNode.info.description ? (
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <span className="text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          📚 Explicação
                        </span>
                        <p className="text-white/80 text-sm mt-2 leading-relaxed">
                          {selectedNode.info.description}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                        <p className="text-amber-200/80 text-xs leading-relaxed">
                          💡 Este nó representa um passo no algoritmo. Clique em outros nós para entender o fluxo completo de decisões.
                        </p>
                      </div>
                    )}

                    {/* Conexões */}
                    {highlightedPaths.size > 0 && (
                      <div>
                        <span className="text-xs text-white/40 uppercase tracking-wider">Conexões</span>
                        <p className="text-cyan-400 text-sm mt-1 flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          {highlightedPaths.size} caminho(s) destacado(s)
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                          Siga as linhas destacadas para ver o fluxo
                        </p>
                      </div>
                    )}

                    {/* Dica de uso */}
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-white/40 text-xs flex items-center gap-2">
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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-slate-800/80 rounded-lg text-white/40 text-xs">
              <Move className="w-3 h-3" />
              <span>Arraste para mover</span>
              <span className="text-white/20">|</span>
              <span>Ctrl + Scroll para zoom</span>
              <span className="text-white/20">|</span>
              <span>ESC para sair</span>
            </div>
          )}

          {/* Indicador de modo interativo */}
          {interactiveMode && !isFullscreen && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <MousePointer2 className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 text-xs">Clique nos nós</span>
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
