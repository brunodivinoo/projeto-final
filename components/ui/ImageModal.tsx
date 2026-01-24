'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ZoomIn, ZoomOut, ExternalLink, Download } from 'lucide-react'

interface ImageModalProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
  caption?: string
  source?: string
}

export function ImageModal({ src, alt, isOpen, onClose, caption, source }: ImageModalProps) {
  const [zoom, setZoom] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Montar apenas no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fechar com ESC e controlar zoom com teclado
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 3))
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5))
      if (e.key === '0') setZoom(1)
    }

    document.addEventListener('keydown', handleKeyDown)
    // Prevenir scroll do body quando modal está aberto
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Reset zoom quando mudar imagem
  useEffect(() => {
    setZoom(1)
    setIsLoading(true)
  }, [src])

  // Handler para zoom com scroll do mouse
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      setZoom(z => Math.min(z + 0.1, 3))
    } else {
      setZoom(z => Math.max(z - 0.1, 0.5))
    }
  }, [])

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Controles superiores */}
      <div className="fixed top-4 right-4 z-[10000] flex items-center gap-2">
        {/* Zoom out */}
        <button
          onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(z - 0.25, 0.5)) }}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
          title="Diminuir zoom (-)"
        >
          <ZoomOut className="w-5 h-5 text-white" />
        </button>

        {/* Indicador de zoom */}
        <span className="text-white/80 text-sm min-w-[60px] text-center font-medium bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
          {Math.round(zoom * 100)}%
        </span>

        {/* Zoom in */}
        <button
          onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(z + 0.25, 3)) }}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
          title="Aumentar zoom (+)"
        >
          <ZoomIn className="w-5 h-5 text-white" />
        </button>

        {/* Abrir em nova aba */}
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
          title="Abrir em nova aba"
        >
          <ExternalLink className="w-5 h-5 text-white" />
        </a>

        {/* Download */}
        <a
          href={src}
          download={alt || 'imagem'}
          onClick={(e) => e.stopPropagation()}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
          title="Baixar imagem"
        >
          <Download className="w-5 h-5 text-white" />
        </a>

        {/* Fechar */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="p-2.5 bg-white/10 hover:bg-red-500/50 rounded-full transition-colors ml-2 backdrop-blur-sm"
          title="Fechar (ESC)"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Container da imagem - centralizado na tela */}
      <div
        className="flex items-center justify-center w-full h-full p-16"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
      >
        <div className="relative max-w-[90vw] max-h-[85vh] overflow-auto">
          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 rounded-lg min-w-[200px] min-h-[200px]">
              <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}

          {/* Imagem */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-w-none transition-transform duration-200 rounded-lg shadow-2xl"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              maxHeight: zoom === 1 ? '80vh' : 'none',
              maxWidth: zoom === 1 ? '85vw' : 'none'
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            draggable={false}
          />
        </div>
      </div>

      {/* Informações inferiores (caption e fonte) */}
      {(caption || source) && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-2xl px-6 py-3 bg-black/80 backdrop-blur-sm rounded-xl text-center">
          {caption && (
            <p className="text-white/90 text-sm mb-1">{caption}</p>
          )}
          {source && (
            <p className="text-white/50 text-xs">Fonte: {source}</p>
          )}
        </div>
      )}

      {/* Instrução de uso */}
      <div className="fixed bottom-4 right-4 text-white/40 text-xs bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
        ESC para fechar • +/- ou scroll para zoom • 0 para resetar
      </div>
    </div>
  )

  // Renderizar via portal no body
  return createPortal(modalContent, document.body)
}

// Hook para gerenciar o estado do modal globalmente
export function useImageModal() {
  const [modalState, setModalState] = useState<{
    src: string
    alt: string
    caption?: string
    source?: string
  } | null>(null)

  const openModal = useCallback((src: string, alt: string, caption?: string, source?: string) => {
    setModalState({ src, alt, caption, source })
  }, [])

  const closeModal = useCallback(() => {
    setModalState(null)
  }, [])

  return {
    isOpen: modalState !== null,
    modalState,
    openModal,
    closeModal
  }
}
