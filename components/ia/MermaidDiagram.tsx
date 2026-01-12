'use client'

import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2, Download, Copy, Check } from 'lucide-react'

interface MermaidDiagramProps {
  chart: string
  title?: string
}

export default function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)

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
            primaryColor: '#10b981',
            primaryTextColor: '#fff',
            primaryBorderColor: '#059669',
            lineColor: '#6b7280',
            secondaryColor: '#1f2937',
            tertiaryColor: '#374151',
            background: '#111827',
            mainBkg: '#1f2937',
            nodeBorder: '#10b981',
            clusterBkg: '#1f2937',
            clusterBorder: '#374151',
            titleColor: '#f3f4f6',
            edgeLabelBackground: '#1f2937',
            actorTextColor: '#f3f4f6',
            actorBkg: '#1f2937',
            actorBorder: '#10b981',
            signalColor: '#f3f4f6',
            signalTextColor: '#f3f4f6',
            labelBoxBkgColor: '#1f2937',
            labelBoxBorderColor: '#374151',
            labelTextColor: '#f3f4f6',
            loopTextColor: '#f3f4f6',
            noteBkgColor: '#374151',
            noteTextColor: '#f3f4f6',
            noteBorderColor: '#4b5563',
            activationBkgColor: '#1f2937',
            sequenceNumberColor: '#10b981',
            sectionBkgColor: '#1f2937',
            altSectionBkgColor: '#374151',
            sectionBkgColor2: '#1f2937',
            taskBkgColor: '#10b981',
            taskTextColor: '#fff',
            taskTextLightColor: '#fff',
            taskTextOutsideColor: '#f3f4f6',
            taskTextClickableColor: '#10b981',
            activeTaskBorderColor: '#059669',
            gridColor: '#374151',
            doneTaskBkgColor: '#065f46',
            doneTaskBorderColor: '#047857',
            critBkgColor: '#dc2626',
            critBorderColor: '#b91c1c',
            todayLineColor: '#f59e0b',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif'
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
    <div className={`my-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900/95 p-8 overflow-auto' : ''}`}>
      <div className={`bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden ${isFullscreen ? 'h-full' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-white/80 text-sm font-medium">
              {title || 'Diagrama'}
            </span>
          </div>
          <div className="flex items-center gap-2">
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
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
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
          className={`p-6 flex items-center justify-center ${isFullscreen ? 'min-h-[calc(100vh-12rem)]' : 'min-h-[200px]'}`}
        >
          {svg ? (
            <div
              className="mermaid-container w-full overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="flex items-center gap-2 text-white/40">
              <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
              <span>Renderizando diagrama...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
