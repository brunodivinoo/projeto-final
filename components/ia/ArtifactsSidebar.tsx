'use client'

import { useEffect, useCallback } from 'react'
import { X, PanelRightClose, PanelRightOpen, Trash2, Maximize2, Download, Copy, Check, ExternalLink } from 'lucide-react'
import { useArtifactsStore, ARTIFACT_ICONS, ARTIFACT_LABELS, type Artifact } from '@/stores/artifactsStore'
import { useState } from 'react'
import dynamic from 'next/dynamic'

// Importar MermaidDiagram dinamicamente
const MermaidDiagram = dynamic(() => import('./MermaidDiagram'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  )
})

interface ArtifactsSidebarProps {
  className?: string
}

// Componente para renderizar conteúdo do artefato
function ArtifactContent({ artifact }: { artifact: Artifact }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(artifact.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [artifact.content])

  // Renderização baseada no tipo
  switch (artifact.type) {
    case 'diagram':
    case 'flowchart':
      return (
        <div className="relative">
          <MermaidDiagram chart={artifact.content} title={artifact.title} />
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
            title="Copiar código"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/60" />}
          </button>
        </div>
      )

    case 'ecg':
      return (
        <div className="p-4 bg-slate-900 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💓</span>
            <h4 className="text-white font-medium">{artifact.title}</h4>
          </div>
          {/* ECG Visualization */}
          <div className="relative h-32 bg-black rounded-lg overflow-hidden">
            <svg viewBox="0 0 400 100" className="w-full h-full">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a3d2e" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* ECG Line - Normal Sinus Rhythm */}
              <path
                d="M0,50 L20,50 L25,50 L30,30 L35,70 L40,50 L60,50 L65,50 L70,10 L75,90 L80,50 L100,50 L120,50 L125,50 L130,30 L135,70 L140,50 L160,50 L165,50 L170,10 L175,90 L180,50 L200,50 L220,50 L225,50 L230,30 L235,70 L240,50 L260,50 L265,50 L270,10 L275,90 L280,50 L300,50 L320,50 L325,50 L330,30 L335,70 L340,50 L360,50 L365,50 L370,10 L375,90 L380,50 L400,50"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                className="animate-pulse"
              />
            </svg>
          </div>
          <div className="mt-3 text-white/60 text-sm whitespace-pre-wrap">
            {artifact.content}
          </div>
        </div>
      )

    case 'comparison':
      return (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚖️</span>
            <h4 className="text-white font-medium">{artifact.title}</h4>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-white/80">{artifact.content}</div>
          </div>
        </div>
      )

    case 'checklist':
      return (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">✅</span>
            <h4 className="text-white font-medium">{artifact.title}</h4>
          </div>
          <div className="space-y-2">
            {artifact.content.split('\n').map((line, i) => {
              const isChecked = line.includes('[x]')
              const text = line.replace(/\[[ x]\]/g, '').trim()
              if (!text) return null
              return (
                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    defaultChecked={isChecked}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className={`text-sm ${isChecked ? 'text-white/40 line-through' : 'text-white/80'}`}>
                    {text}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )

    case 'timeline':
      return (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📅</span>
            <h4 className="text-white font-medium">{artifact.title}</h4>
          </div>
          <div className="relative border-l-2 border-emerald-500/30 pl-4 space-y-4">
            {artifact.content.split('\n').filter(l => l.trim()).map((line, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                <p className="text-white/80 text-sm">{line}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'table':
      return (
        <div className="p-4 overflow-x-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📋</span>
            <h4 className="text-white font-medium">{artifact.title}</h4>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="text-white/80 text-sm whitespace-pre-wrap">{artifact.content}</pre>
          </div>
        </div>
      )

    case 'code':
      return (
        <div className="relative">
          <pre className="p-4 bg-slate-900 rounded-lg overflow-x-auto text-sm font-mono text-white/80">
            {artifact.content}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
            title="Copiar código"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/60" />}
          </button>
        </div>
      )

    default:
      return (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{ARTIFACT_ICONS[artifact.type]}</span>
            <h4 className="text-white font-medium">{artifact.title}</h4>
          </div>
          <div className="text-white/80 text-sm whitespace-pre-wrap">{artifact.content}</div>
        </div>
      )
  }
}

// Componente principal da Sidebar
export default function ArtifactsSidebar({ className = '' }: ArtifactsSidebarProps) {
  const {
    artifacts,
    selectedArtifactId,
    isSidebarOpen,
    selectArtifact,
    removeArtifact,
    clearArtifacts,
    toggleSidebar,
    setSidebarOpen
  } = useArtifactsStore()

  const selectedArtifact = artifacts.find(a => a.id === selectedArtifactId)

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen, setSidebarOpen])

  // Se não há artefatos, mostrar apenas o botão toggle
  if (artifacts.length === 0) {
    return null
  }

  return (
    <>
      {/* Botão toggle quando sidebar está fechada */}
      {!isSidebarOpen && artifacts.length > 0 && (
        <button
          onClick={toggleSidebar}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
          title="Abrir artefatos"
        >
          <PanelRightOpen className="w-5 h-5" />
          {artifacts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
              {artifacts.length}
            </span>
          )}
        </button>
      )}

      {/* Sidebar Desktop */}
      <div
        className={`fixed top-0 right-0 h-full bg-slate-900/95 backdrop-blur-sm border-l border-white/10 transition-all duration-300 z-50 hidden md:flex flex-col ${
          isSidebarOpen ? 'w-96' : 'w-0'
        } ${className}`}
      >
        {isSidebarOpen && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-lg">📦</span>
                <h3 className="text-white font-semibold">Artefatos</h3>
                <span className="text-white/40 text-sm">({artifacts.length})</span>
              </div>
              <div className="flex items-center gap-2">
                {artifacts.length > 0 && (
                  <button
                    onClick={clearArtifacts}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Limpar todos"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Fechar sidebar"
                >
                  <PanelRightClose className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista de artefatos */}
            <div className="flex-1 overflow-y-auto">
              {/* Tabs dos artefatos */}
              <div className="p-2 border-b border-white/10 flex gap-1 overflow-x-auto">
                {artifacts.map((artifact) => (
                  <button
                    key={artifact.id}
                    onClick={() => selectArtifact(artifact.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                      selectedArtifactId === artifact.id
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{ARTIFACT_ICONS[artifact.type]}</span>
                    <span className="max-w-[100px] truncate">{artifact.title}</span>
                  </button>
                ))}
              </div>

              {/* Conteúdo do artefato selecionado */}
              {selectedArtifact ? (
                <div className="p-4">
                  {/* Header do artefato */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                        {ARTIFACT_LABELS[selectedArtifact.type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Expandir"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeArtifact(selectedArtifact.id)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-white/5">
                    <ArtifactContent artifact={selectedArtifact} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                  <span className="text-4xl mb-3">📦</span>
                  <p className="text-white/60 text-sm">
                    Selecione um artefato para visualizar
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-2xl border-t border-white/10 transition-transform duration-300 z-50 md:hidden ${
          isSidebarOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '80vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <h3 className="text-white font-semibold">Artefatos</h3>
            <span className="text-white/40 text-sm">({artifacts.length})</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 100px)' }}>
          {/* Tabs */}
          <div className="p-2 border-b border-white/10 flex gap-1 overflow-x-auto">
            {artifacts.map((artifact) => (
              <button
                key={artifact.id}
                onClick={() => selectArtifact(artifact.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  selectedArtifactId === artifact.id
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{ARTIFACT_ICONS[artifact.type]}</span>
                <span className="max-w-[80px] truncate">{artifact.title}</span>
              </button>
            ))}
          </div>

          {/* Conteúdo do artefato */}
          {selectedArtifact && (
            <div className="p-4">
              <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-white/5">
                <ArtifactContent artifact={selectedArtifact} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Componente de botão flutuante para abrir artefatos
export function ArtifactsFloatingButton() {
  const { artifacts, toggleSidebar, isSidebarOpen } = useArtifactsStore()

  if (artifacts.length === 0 || isSidebarOpen) return null

  return (
    <button
      onClick={toggleSidebar}
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-105 md:hidden"
    >
      <span className="text-lg">📦</span>
      <span className="text-sm font-medium">Artefatos</span>
      <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">
        {artifacts.length}
      </span>
    </button>
  )
}
