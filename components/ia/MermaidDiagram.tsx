'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Maximize2, Minimize2, Download, Copy, Check, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react'

interface MermaidDiagramProps {
  chart: string
  title?: string
}

export default function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
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

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return

      try {
        // Importar mermaid dinamicamente (client-side only)
        const mermaid = (await import('mermaid')).default

        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            // Cores principais - melhor contraste
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

            // Clusters/subgraphs
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

            // Fonte
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSize: '14px'
          },
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            padding: 15
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
            useMaxWidth: true
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
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-white/80 text-sm font-medium">
              {title || 'Diagrama'}
            </span>
            {scale !== 1 && (
              <span className="text-white/40 text-xs ml-2">
                {Math.round(scale * 100)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Zoom controls */}
            <button
              onClick={zoomOut}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Diminuir zoom (-)"
            >
              <ZoomOut className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Resetar visualização (0)"
            >
              <RotateCcw className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={zoomIn}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Aumentar zoom (+)"
            >
              <ZoomIn className="w-4 h-4 text-white/60" />
            </button>

            <div className="w-px h-4 bg-white/10 mx-1" />

            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Copiar código"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-white/60" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Baixar SVG"
            >
              <Download className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title={isFullscreen ? 'Sair da tela cheia (ESC)' : 'Tela cheia'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-white/60" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white/60" />
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
        </div>
      </div>
    </div>
  )
}
