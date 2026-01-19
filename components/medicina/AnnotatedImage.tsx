'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Loader2, Tag, Eye, EyeOff, ZoomIn, Download, Maximize2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

// Helper para juntar classes condicionalmente
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ============================================
// TIPOS
// ============================================

export interface ImageAnnotation {
  id: string
  label: string
  labelEn?: string
  position: {
    x: number
    y: number
  }
  pointer?: {
    x: number
    y: number
  }
  color?: string
  importance?: 'primary' | 'secondary' | 'tertiary'
}

interface AnnotatedImageProps {
  src: string
  alt: string
  annotations?: ImageAnnotation[]
  imageType?: 'anatomy' | 'histology' | 'radiology' | 'pathology' | 'diagram'
  context?: string
  className?: string
  showAnnotationsDefault?: boolean
  allowAnnotationToggle?: boolean
  allowFullscreen?: boolean
  onAnnotationsLoaded?: (annotations: ImageAnnotation[]) => void
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function AnnotatedImage({
  src,
  alt,
  annotations: initialAnnotations,
  imageType = 'anatomy',
  context,
  className,
  showAnnotationsDefault = true,
  allowAnnotationToggle = true,
  allowFullscreen = true,
  onAnnotationsLoaded,
}: AnnotatedImageProps) {
  const [annotations, setAnnotations] = useState<ImageAnnotation[]>(initialAnnotations || [])
  const [showAnnotations, setShowAnnotations] = useState(showAnnotationsDefault)
  const [loadingAnnotations, setLoadingAnnotations] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null)

  // Carregar anotações da API
  const loadAnnotations = useCallback(async () => {
    if (annotations.length > 0 || loadingAnnotations) return

    setLoadingAnnotations(true)
    try {
      const response = await fetch('/api/medicina/ia/imagem/anotar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: src,
          imageType,
          context,
          maxAnnotations: 10,
          language: 'pt',
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao carregar anotações')
      }

      const data = await response.json()
      setAnnotations(data.annotations || [])
      onAnnotationsLoaded?.(data.annotations || [])
    } catch (error) {
      console.error('Erro ao carregar anotações:', error)
    } finally {
      setLoadingAnnotations(false)
    }
  }, [src, imageType, context, annotations.length, loadingAnnotations, onAnnotationsLoaded])

  // Download da imagem
  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `imagem-medica-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar imagem:', error)
    }
  }

  return (
    <>
      <div className={cn('relative group', className)}>
        {/* Imagem principal */}
        <div className="relative overflow-hidden rounded-lg bg-gray-900">
          <Image
            src={src}
            alt={alt}
            width={1024}
            height={1024}
            className="w-full h-auto object-contain"
            unoptimized
          />

          {/* Overlay de anotações */}
          {showAnnotations && annotations.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {/* SVG para linhas de conexão */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {annotations
                  .filter((ann) => ann.pointer)
                  .map((ann) => (
                    <line
                      key={`line-${ann.id}`}
                      x1={`${ann.position.x}%`}
                      y1={`${ann.position.y}%`}
                      x2={`${ann.pointer!.x}%`}
                      y2={`${ann.pointer!.y}%`}
                      stroke={ann.color || '#FFFFFF'}
                      strokeWidth="0.3"
                      opacity={hoveredAnnotation === ann.id ? 1 : 0.6}
                      className="transition-opacity duration-200"
                    />
                  ))}
              </svg>

              {/* Labels */}
              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  className={cn(
                    'absolute transform -translate-x-1/2 -translate-y-1/2',
                    'px-2 py-1 rounded text-xs font-medium',
                    'transition-all duration-200 pointer-events-auto cursor-pointer',
                    hoveredAnnotation === ann.id
                      ? 'scale-110 z-50'
                      : 'z-10 hover:scale-105'
                  )}
                  style={{
                    left: `${ann.position.x}%`,
                    top: `${ann.position.y}%`,
                    backgroundColor: `${ann.color || '#333'}CC`,
                    color: '#FFFFFF',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    fontSize: ann.importance === 'primary' ? '13px' : '11px',
                    fontWeight: ann.importance === 'primary' ? 600 : 400,
                  }}
                  onMouseEnter={() => setHoveredAnnotation(ann.id)}
                  onMouseLeave={() => setHoveredAnnotation(null)}
                >
                  {ann.label}
                </div>
              ))}
            </div>
          )}

          {/* Loading de anotações */}
          {loadingAnnotations && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analisando imagem...</span>
              </div>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {allowAnnotationToggle && (
            <>
              {annotations.length === 0 && !loadingAnnotations ? (
                <Button
                                    variant="secondary"
                  className="h-8 gap-1"
                  onClick={loadAnnotations}
                >
                  <Tag className="w-4 h-4" />
                  <span className="text-xs">Anotar</span>
                </Button>
              ) : annotations.length > 0 ? (
                <Button
                                    variant="secondary"
                  className="h-8 gap-1"
                  onClick={() => setShowAnnotations(!showAnnotations)}
                >
                  {showAnnotations ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span className="text-xs">Ocultar</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span className="text-xs">Mostrar</span>
                    </>
                  )}
                </Button>
              ) : null}
            </>
          )}

          {allowFullscreen && (
            <Button
                            variant="secondary"
              className="h-8 w-8 p-0"
              onClick={() => setFullscreenOpen(true)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}

          <Button
                        variant="secondary"
            className="h-8 w-8 p-0"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* Indicador de anotações */}
        {annotations.length > 0 && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
            {annotations.length} anotações
          </div>
        )}
      </div>

      {/* Modal fullscreen */}
      {fullscreenOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setFullscreenOpen(false)}
        >
          {/* Header */}
          <div className="absolute top-4 left-4 z-50 bg-black/60 rounded px-3 py-1">
            <span className="text-white text-sm">{alt}</span>
          </div>

          {/* Botão fechar */}
          <button
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            onClick={() => setFullscreenOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-[95vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={1920}
              height={1920}
              className="max-w-full max-h-[90vh] object-contain"
              unoptimized
            />

            {/* Anotações no fullscreen */}
            {showAnnotations && annotations.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {annotations
                    .filter((ann) => ann.pointer)
                    .map((ann) => (
                      <line
                        key={`line-fs-${ann.id}`}
                        x1={`${ann.position.x}%`}
                        y1={`${ann.position.y}%`}
                        x2={`${ann.pointer!.x}%`}
                        y2={`${ann.pointer!.y}%`}
                        stroke={ann.color || '#FFFFFF'}
                        strokeWidth="0.2"
                        opacity="0.7"
                      />
                    ))}
                </svg>

                {annotations.map((ann) => (
                  <div
                    key={`fs-${ann.id}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded"
                    style={{
                      left: `${ann.position.x}%`,
                      top: `${ann.position.y}%`,
                      backgroundColor: `${ann.color || '#333'}DD`,
                      color: '#FFFFFF',
                      textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                      fontSize: ann.importance === 'primary' ? '14px' : '12px',
                      fontWeight: ann.importance === 'primary' ? 600 : 400,
                    }}
                  >
                    {ann.label}
                    {ann.labelEn && (
                      <span className="block text-[10px] opacity-70">{ann.labelEn}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controles no fullscreen */}
          <div className="absolute bottom-4 right-4 flex gap-2 z-50">
            {annotations.length > 0 && (
              <Button
                                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAnnotations(!showAnnotations)
                }}
              >
                {showAnnotations ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    Mostrar
                  </>
                )}
              </Button>
            )}

            <Button
                            variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                handleDownload()
              }}
            >
              <Download className="w-4 h-4 mr-1" />
              Baixar
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================
// COMPONENTE SIMPLES (sem anotações)
// ============================================

interface MedicalImageProps {
  src: string
  alt: string
  className?: string
  allowFullscreen?: boolean
}

export function MedicalImage({
  src,
  alt,
  className,
  allowFullscreen = true,
}: MedicalImageProps) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false)

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreenOpen(false)
    }
    if (fullscreenOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [fullscreenOpen])

  return (
    <>
      <div className={cn('relative group cursor-pointer', className)} onClick={() => allowFullscreen && setFullscreenOpen(true)}>
        <Image
          src={src}
          alt={alt}
          width={1024}
          height={1024}
          className="w-full h-auto object-contain rounded-lg"
          unoptimized
        />

        {allowFullscreen && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
            <ZoomIn className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {fullscreenOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreenOpen(false)}
        >
          <button
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            onClick={() => setFullscreenOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          <Image
            src={src}
            alt={alt}
            width={1920}
            height={1920}
            className="max-w-full max-h-[90vh] object-contain"
            unoptimized
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
