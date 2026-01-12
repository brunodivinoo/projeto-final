'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, ZoomIn, Loader2, ImageOff, Info } from 'lucide-react'
import type { MedicalImage } from '@/lib/medical-images/service'

interface MedicalImageGalleryProps {
  searchTerms: string[]
  userId?: string
}

export default function MedicalImageGallery({ searchTerms, userId }: MedicalImageGalleryProps) {
  const [images, setImages] = useState<MedicalImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<MedicalImage | null>(null)
  const [needsUpgrade, setNeedsUpgrade] = useState(false)

  useEffect(() => {
    if (searchTerms.length === 0 || !userId) return

    const fetchImages = async () => {
      setLoading(true)
      setError(null)
      setNeedsUpgrade(false)

      try {
        const response = await fetch('/api/medicina/imagens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queries: searchTerms,
            user_id: userId
          })
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.upgrade) {
            setNeedsUpgrade(true)
          } else {
            setError(data.error || 'Erro ao buscar imagens')
          }
          return
        }

        setImages(data.images || [])
      } catch (err) {
        console.error('Erro ao buscar imagens:', err)
        setError('Erro de conexão')
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [searchTerms, userId])

  // Loading state
  if (loading) {
    return (
      <div className="my-4 p-4 bg-slate-800/30 rounded-xl border border-white/10">
        <div className="flex items-center gap-3 text-white/60">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-sm">Buscando imagens médicas...</span>
        </div>
      </div>
    )
  }

  // Needs upgrade
  if (needsUpgrade) {
    return (
      <div className="my-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <ImageOff className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="text-white font-medium text-sm">Imagens Médicas Reais</h4>
            <p className="text-white/60 text-xs mt-1">
              Acesse imagens de atlas médicos como PubMed e Radiopaedia com os planos Premium ou Residência.
            </p>
            <a
              href="/medicina/dashboard/assinatura"
              className="inline-flex items-center gap-1 text-purple-400 text-xs mt-2 hover:text-purple-300"
            >
              Ver planos <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="my-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  // No images found
  if (images.length === 0) {
    return null
  }

  return (
    <>
      <div className="my-4 p-4 bg-slate-800/30 rounded-xl border border-white/10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-400" />
          <span className="text-white/80 text-sm font-medium">
            Imagens de Referência
          </span>
          <span className="text-white/40 text-xs">
            ({images.length} {images.length === 1 ? 'imagem' : 'imagens'})
          </span>
        </div>

        {/* Image Grid */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className="group relative flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all bg-slate-900/50"
            >
              <img
                src={img.thumbUrl}
                alt={img.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* Modality badge */}
              {img.modality && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                  {img.modality}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-white/40 text-xs mt-2">
          Clique para ampliar • Fonte: {images[0]?.source === 'openi' ? 'OpenI/NIH' : 'Wikimedia Commons'}
        </p>
      </div>

      {/* Modal de visualização ampliada */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 rounded-xl overflow-hidden border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Image */}
            <div className="relative bg-black min-h-[300px] max-h-[60vh] flex items-center justify-center">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              <h3 className="text-white font-semibold">{selectedImage.title}</h3>

              {selectedImage.caption && (
                <p
                  className="text-white/70 text-sm"
                  dangerouslySetInnerHTML={{ __html: selectedImage.caption }}
                />
              )}

              {/* Modality badge */}
              {selectedImage.modality && (
                <span className="inline-block text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                  {selectedImage.modality}
                </span>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-white/40 text-xs">
                  {selectedImage.license}
                </span>
                <a
                  href={selectedImage.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                >
                  Ver fonte original
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
