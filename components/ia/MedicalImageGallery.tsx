'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { X, ExternalLink, ZoomIn, Loader2, ImageOff, Info, AlertCircle, Search, RefreshCw, Languages } from 'lucide-react'
import type { MedicalImage } from '@/lib/medical-images/service'

// Dicionário de tradução EN → PT para termos médicos comuns
const TRANSLATION_EN_PT: Record<string, string> = {
  // Anatomia
  'heart': 'coração', 'lung': 'pulmão', 'lungs': 'pulmões', 'liver': 'fígado',
  'kidney': 'rim', 'kidneys': 'rins', 'brain': 'cérebro', 'stomach': 'estômago',
  'bone': 'osso', 'bones': 'ossos', 'chest': 'tórax', 'abdomen': 'abdome',
  'spine': 'coluna', 'skull': 'crânio', 'pelvis': 'pelve', 'thorax': 'tórax',
  'artery': 'artéria', 'vein': 'veia', 'blood': 'sangue', 'breast': 'mama',

  // Exames
  'x-ray': 'raio-X', 'xray': 'raio-X', 'radiograph': 'radiografia',
  'ct scan': 'tomografia', 'computed tomography': 'tomografia computadorizada',
  'mri': 'ressonância magnética', 'magnetic resonance': 'ressonância magnética',
  'ultrasound': 'ultrassom', 'echocardiogram': 'ecocardiograma',
  'mammogram': 'mamografia', 'biopsy': 'biópsia',

  // Condições
  'pneumonia': 'pneumonia', 'fracture': 'fratura', 'tumor': 'tumor',
  'cancer': 'câncer', 'carcinoma': 'carcinoma', 'infection': 'infecção',
  'inflammation': 'inflamação', 'hemorrhage': 'hemorragia', 'edema': 'edema',
  'effusion': 'derrame', 'nodule': 'nódulo', 'mass': 'massa', 'lesion': 'lesão',
  'acute': 'agudo', 'chronic': 'crônico', 'bilateral': 'bilateral',
  'normal': 'normal', 'abnormal': 'anormal', 'benign': 'benigno', 'malignant': 'maligno',

  // Descrições comuns
  'patient': 'paciente', 'male': 'masculino', 'female': 'feminino',
  'year': 'ano', 'years': 'anos', 'old': 'anos de idade',
  'showing': 'mostrando', 'demonstrates': 'demonstra', 'reveals': 'revela',
  'image': 'imagem', 'figure': 'figura', 'view': 'vista', 'section': 'corte',
  'left': 'esquerdo', 'right': 'direito', 'upper': 'superior', 'lower': 'inferior',
  'anterior': 'anterior', 'posterior': 'posterior', 'lateral': 'lateral',
}

// Função para traduzir texto médico EN → PT
function translateMedicalText(text: string): string {
  if (!text) return text

  let translated = text

  // Ordenar por tamanho decrescente para evitar substituições parciais
  const sortedTerms = Object.entries(TRANSLATION_EN_PT).sort((a, b) => b[0].length - a[0].length)

  for (const [en, pt] of sortedTerms) {
    // Usar regex case-insensitive
    const regex = new RegExp(`\\b${en}\\b`, 'gi')
    translated = translated.replace(regex, pt)
  }

  return translated
}

interface MedicalImageGalleryProps {
  searchTerms: string[]
  userId?: string
}

interface SearchResponse {
  images: MedicalImage[]
  total: number
  queryUsed?: string
  originalQuery?: string
  suggestions?: string[]
  error?: string
  upgrade?: boolean
}

// Sanitizar HTML básico (remover scripts e eventos)
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
}

// Componente de imagem com tratamento de erro e retry
interface ImageWithFallbackProps {
  src: string
  fallbackSrc?: string
  alt: string
  className?: string
  onLoadError?: () => void
}

function ImageWithFallback({ src, fallbackSrc, alt, className, onLoadError }: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Reset state when src changes
    setCurrentSrc(src)
    setHasError(false)
    setIsLoading(true)
    setRetryCount(0)
  }, [src])

  const handleError = useCallback(() => {
    if (retryCount < 2 && fallbackSrc && currentSrc !== fallbackSrc) {
      // Tentar fallback (usar URL completa ao invés de thumb)
      setCurrentSrc(fallbackSrc)
      setRetryCount(prev => prev + 1)
    } else if (retryCount < 3) {
      // Tentar adicionar proxy ou forçar HTTPS
      const httpsUrl = currentSrc.replace('http://', 'https://')
      if (httpsUrl !== currentSrc) {
        setCurrentSrc(httpsUrl)
        setRetryCount(prev => prev + 1)
      } else {
        setHasError(true)
        setIsLoading(false)
        onLoadError?.()
      }
    } else {
      setHasError(true)
      setIsLoading(false)
      onLoadError?.()
    }
  }, [currentSrc, fallbackSrc, retryCount, onLoadError])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-slate-800/50 ${className}`}>
        <ImageOff className="w-8 h-8 text-white/20" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        loading="lazy"
        onError={handleError}
        onLoad={handleLoad}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}

export default function MedicalImageGallery({ searchTerms, userId }: MedicalImageGalleryProps) {
  const [images, setImages] = useState<MedicalImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<MedicalImage | null>(null)
  const [needsUpgrade, setNeedsUpgrade] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [searchInfo, setSearchInfo] = useState<{
    queryUsed?: string
    originalQuery?: string
    suggestions?: string[]
    searched: boolean
  }>({ searched: false })

  // Estabilizar a referência do array para evitar re-renders
  const termsKey = useMemo(() => searchTerms.join('|'), [searchTerms])

  // Filtrar imagens que falharam ao carregar
  const validImages = useMemo(() =>
    images.filter(img => !failedImages.has(img.id)),
    [images, failedImages]
  )

  // Marcar imagem como falhou
  const handleImageLoadError = useCallback((imageId: string) => {
    setFailedImages(prev => new Set([...prev, imageId]))
  }, [])

  useEffect(() => {
    if (searchTerms.length === 0 || !userId) return

    const fetchImages = async () => {
      setLoading(true)
      setError(null)
      setNeedsUpgrade(false)
      setSearchInfo({ searched: false })

      try {
        const response = await fetch('/api/medicina/imagens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queries: searchTerms,
            user_id: userId
          })
        })

        const data: SearchResponse = await response.json()

        if (!response.ok) {
          if (data.upgrade) {
            setNeedsUpgrade(true)
          } else {
            setError(data.error || 'Erro ao buscar imagens')
          }
          return
        }

        setImages(data.images || [])
        setSearchInfo({
          queryUsed: data.queryUsed,
          originalQuery: data.originalQuery,
          suggestions: data.suggestions,
          searched: true
        })
      } catch (err) {
        console.error('Erro ao buscar imagens:', err)
        setError('Erro de conexão')
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termsKey, userId])

  // Loading state
  if (loading) {
    return (
      <div className="my-4 p-4 bg-slate-800/30 rounded-xl border border-white/10">
        <div className="flex items-center gap-3 text-white/60">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-sm">Buscando imagens médicas reais...</span>
        </div>
        <p className="text-white/40 text-xs mt-2">
          Traduzindo termos e pesquisando em bancos médicos...
        </p>
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

  // No images found - mostrar feedback útil
  if (images.length === 0 && searchInfo.searched) {
    return (
      <div className="my-4 p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Search className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-white/80 font-medium text-sm">
              Imagem não encontrada
            </h4>
            <p className="text-white/50 text-xs mt-1">
              Não encontramos imagens médicas para os termos buscados.
            </p>

            {/* Mostrar o que foi buscado */}
            {searchInfo.queryUsed && (
              <p className="text-white/40 text-xs mt-2">
                Termo buscado: <span className="text-white/60">{searchInfo.queryUsed}</span>
              </p>
            )}

            {/* Sugestões */}
            {searchInfo.suggestions && searchInfo.suggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-amber-400/80 text-xs font-medium mb-1">Sugestões:</p>
                <ul className="space-y-1">
                  {searchInfo.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-white/50 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400/60" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dicas gerais */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-white/40 text-xs">
                Dica: Use termos em inglês como &quot;chest xray pneumonia&quot; ou &quot;ct scan liver&quot; para melhores resultados.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Não pesquisou ainda ou não tem termos
  if (images.length === 0) {
    return null
  }

  // Se todas as imagens falharam
  if (validImages.length === 0 && images.length > 0) {
    return (
      <div className="my-4 p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
        <div className="flex items-center gap-3">
          <ImageOff className="w-5 h-5 text-amber-400" />
          <p className="text-white/60 text-sm">
            As imagens não puderam ser carregadas. Tente novamente mais tarde.
          </p>
          <button
            onClick={() => setFailedImages(new Set())}
            className="ml-auto flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <RefreshCw className="w-3 h-3" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="my-4 p-4 bg-slate-800/30 rounded-xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-white/80 text-sm font-medium">
              Imagens de Referência
            </span>
            <span className="text-white/40 text-xs">
              ({validImages.length} {validImages.length === 1 ? 'imagem' : 'imagens'})
            </span>
          </div>
        </div>

        {/* Mostrar termo que encontrou resultados (se diferente do original) */}
        {searchInfo.queryUsed && searchInfo.originalQuery &&
         searchInfo.queryUsed.toLowerCase() !== searchInfo.originalQuery.toLowerCase() && (
          <p className="text-white/40 text-xs mb-3">
            Buscado como: <span className="text-emerald-400/80">{searchInfo.queryUsed}</span>
          </p>
        )}

        {/* Image Grid */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {validImages.map((img) => (
            <button
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className="group relative flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all bg-slate-900/50"
            >
              <ImageWithFallback
                src={img.thumbUrl}
                fallbackSrc={img.url}
                alt={img.title}
                className="w-full h-full"
                onLoadError={() => handleImageLoadError(img.id)}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* Modality badge */}
              {img.modality && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded z-10">
                  {img.modality}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-white/40 text-xs mt-2">
          Clique para ampliar • Fonte: {validImages[0]?.source === 'openi' ? 'OpenI/NIH' : 'Wikimedia Commons'}
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
              <ImageWithFallback
                src={selectedImage.url}
                fallbackSrc={selectedImage.thumbUrl}
                alt={selectedImage.title}
                className="max-w-full max-h-[60vh] flex items-center justify-center"
              />
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-white font-semibold">
                  {showTranslation ? translateMedicalText(selectedImage.title) : selectedImage.title}
                </h3>
                {/* Toggle de tradução */}
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    showTranslation
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                  title={showTranslation ? 'Ver texto original (EN)' : 'Traduzir para português'}
                >
                  <Languages className="w-3.5 h-3.5" />
                  {showTranslation ? 'PT' : 'EN'}
                </button>
              </div>

              {selectedImage.caption && (
                <p
                  className="text-white/70 text-sm"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(
                      showTranslation
                        ? translateMedicalText(selectedImage.caption)
                        : selectedImage.caption
                    )
                  }}
                />
              )}

              {/* Modality badge */}
              {selectedImage.modality && (
                <span className="inline-block text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                  {showTranslation ? translateMedicalText(selectedImage.modality) : selectedImage.modality}
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
