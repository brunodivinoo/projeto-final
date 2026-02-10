'use client'

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { ZoomIn, Loader2, ImageOff, Info, AlertCircle, Search, RefreshCw, Languages, ExternalLink } from 'lucide-react'
import type { MedicalImage } from '@/lib/medical-images/service'
import { getCachedImage, cacheImage, cleanOldCache } from '@/lib/hooks/useImageCache'
import { ImageModal } from '@/components/ui/ImageModal'

// Dicionário de tradução EN → PT para termos médicos comuns
const TRANSLATION_EN_PT: Record<string, string> = {
  // Anatomia
  'heart': 'coração', 'lung': 'pulmão', 'lungs': 'pulmões', 'liver': 'fígado',
  'kidney': 'rim', 'kidneys': 'rins', 'brain': 'cérebro', 'stomach': 'estômago',
  'bone': 'osso', 'bones': 'ossos', 'chest': 'tórax', 'abdomen': 'abdome',
  'spine': 'coluna', 'skull': 'crânio', 'pelvis': 'pelve', 'thorax': 'tórax',
  'artery': 'artéria', 'vein': 'veia', 'blood': 'sangue', 'breast': 'mama',
  'colon': 'cólon', 'intestine': 'intestino', 'pancreas': 'pâncreas',
  'spleen': 'baço', 'thyroid': 'tireoide', 'prostate': 'próstata',
  'ovary': 'ovário', 'uterus': 'útero', 'bladder': 'bexiga',
  'esophagus': 'esôfago', 'gallbladder': 'vesícula biliar',
  'aorta': 'aorta', 'ventricle': 'ventrículo', 'atrium': 'átrio',
  'muscle': 'músculo', 'tissue': 'tecido', 'cell': 'célula', 'cells': 'células',

  // Exames
  'x-ray': 'raio-X', 'xray': 'raio-X', 'radiograph': 'radiografia',
  'ct scan': 'tomografia', 'computed tomography': 'tomografia computadorizada',
  'mri': 'ressonância magnética', 'magnetic resonance': 'ressonância magnética',
  'ultrasound': 'ultrassom', 'echocardiogram': 'ecocardiograma',
  'mammogram': 'mamografia', 'biopsy': 'biópsia',
  'histology': 'histologia', 'pathology': 'patologia', 'histological': 'histológico',
  'microscopy': 'microscopia', 'staining': 'coloração', 'immunohistochemistry': 'imunohistoquímica',
  'immunohistochemical': 'imunohistoquímico', 'fluorescence': 'fluorescência',
  'western blot': 'western blot', 'protein': 'proteína', 'expression': 'expressão',

  // Condições e patologias
  'pneumonia': 'pneumonia', 'fracture': 'fratura', 'tumor': 'tumor',
  'cancer': 'câncer', 'carcinoma': 'carcinoma', 'infection': 'infecção',
  'inflammation': 'inflamação', 'hemorrhage': 'hemorragia', 'edema': 'edema',
  'effusion': 'derrame', 'nodule': 'nódulo', 'mass': 'massa', 'lesion': 'lesão',
  'acute': 'agudo', 'chronic': 'crônico', 'bilateral': 'bilateral',
  'normal': 'normal', 'abnormal': 'anormal', 'benign': 'benigno', 'malignant': 'maligno',
  'adenocarcinoma': 'adenocarcinoma', 'metastasis': 'metástase', 'metastatic': 'metastático',
  'necrosis': 'necrose', 'fibrosis': 'fibrose', 'atrophy': 'atrofia',
  'hyperplasia': 'hiperplasia', 'dysplasia': 'displasia', 'neoplasia': 'neoplasia',
  'lymphoma': 'linfoma', 'melanoma': 'melanoma', 'sarcoma': 'sarcoma',
  'adenoma': 'adenoma', 'polyp': 'pólipo', 'cyst': 'cisto',
  'stenosis': 'estenose', 'thrombosis': 'trombose', 'embolism': 'embolia',
  'ischemia': 'isquemia', 'infarction': 'infarto', 'necrotic': 'necrótico',

  // Descrições comuns
  'patient': 'paciente', 'male': 'masculino', 'female': 'feminino',
  'year': 'ano', 'years': 'anos', 'old': 'anos de idade',
  'showing': 'mostrando', 'demonstrates': 'demonstra', 'reveals': 'revela',
  'image': 'imagem', 'figure': 'figura', 'view': 'vista', 'section': 'corte',
  'left': 'esquerdo', 'right': 'direito', 'upper': 'superior', 'lower': 'inferior',
  'anterior': 'anterior', 'posterior': 'posterior', 'lateral': 'lateral',
  'sensitivity': 'sensibilidade', 'correlates': 'correlaciona', 'localization': 'localização',
  'analysis': 'análise', 'representative': 'representativo', 'magnification': 'magnificação',
  'original': 'original', 'positive': 'positivo', 'negative': 'negativo',
  'staining of': 'coloração de', 'using the': 'usando o', 'procedure': 'procedimento',
  'human': 'humano', 'clinical': 'clínico', 'significance': 'significância',
  'superfamily': 'superfamília', 'transmembrane': 'transmembrana',

  // Termos de biologia celular
  'receptor': 'receptor', 'ligand': 'ligante', 'cytoplasm': 'citoplasma',
  'cytoplasmic': 'citoplasmático', 'nuclear': 'nuclear', 'nucleus': 'núcleo',
  'membrane': 'membrana', 'distribution': 'distribuição', 'relative': 'relativo',
  'quantification': 'quantificação', 'ratio': 'razão', 'regression': 'regressão',
  'coefficient': 'coeficiente', 'correlation': 'correlação', 'relationship': 'relação',
  'calculated': 'calculado', 'experiments': 'experimentos', 'different': 'diferentes',
  'loading control': 'controle de carga', 'loading': 'carga',

  // Frases compostas (ordem importa - mais longas primeiro)
  'Open Access': 'Acesso Aberto',
  'PubMed Central': 'PubMed Central',
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
  excludeUrls?: Set<string>
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

// Função para converter URL de imagem para usar o proxy (evita CORS)
function getProxiedImageUrl(url: string): string {
  if (!url) return url
  // Já é uma URL do proxy? Retornar como está
  if (url.startsWith('/api/medicina/imagens/proxy')) return url
  // Converter para usar o proxy
  return `/api/medicina/imagens/proxy?url=${encodeURIComponent(url)}`
}

// Componente de imagem com cache persistente e retry inteligente
interface ImageWithFallbackProps {
  src: string
  fallbackSrc?: string
  alt: string
  className?: string
  onLoadError?: () => void
}

function ImageWithFallback({ src, fallbackSrc, alt, className, onLoadError }: ImageWithFallbackProps) {
  // URLs do proxy
  const proxiedSrc = getProxiedImageUrl(src)
  const proxiedFallback = fallbackSrc ? getProxiedImageUrl(fallbackSrc) : undefined

  const [displaySrc, setDisplaySrc] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const mountedRef = useRef(true)
  const objectUrlRef = useRef<string | null>(null)

  // Cleanup ao desmontar - revogar object URLs
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Revogar object URL para liberar memória
      if (objectUrlRef.current && objectUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  // Verificar cache ao montar/mudar src
  useEffect(() => {
    let cancelled = false

    async function loadImage() {
      setIsLoading(true)
      setHasError(false)

      // Revogar object URL anterior
      if (objectUrlRef.current && objectUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }

      try {
        // Tentar buscar do cache primeiro (usando URL original como chave)
        const cached = await getCachedImage(src)
        if (cached && !cancelled) {
          objectUrlRef.current = cached
          setDisplaySrc(cached)
          setIsLoading(false)
          return
        }
      } catch {
        // Cache não disponível, continuar com fetch normal
      }

      // Não está no cache, usar URL do proxy
      if (!cancelled) {
        setDisplaySrc(proxiedSrc)
      }
    }

    loadImage()
    setRetryCount(0)

    return () => {
      cancelled = true
    }
  }, [src, proxiedSrc])

  // Timeout para loading - 15s
  useEffect(() => {
    if (isLoading && displaySrc) {
      timeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return

        if (imgRef.current && imgRef.current.naturalWidth > 0 && imgRef.current.complete) {
          setIsLoading(false)
        } else if (proxiedFallback && retryCount === 0) {
          setDisplaySrc(proxiedFallback)
          setRetryCount(1)
        } else {
          setHasError(true)
          setIsLoading(false)
          onLoadError?.()
        }
      }, 15000)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isLoading, displaySrc, proxiedFallback, retryCount, onLoadError])

  const handleError = useCallback(() => {
    if (!mountedRef.current) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (retryCount === 0 && proxiedFallback) {
      setDisplaySrc(proxiedFallback)
      setRetryCount(1)
    } else if (retryCount === 1 && displaySrc) {
      const baseUrl = displaySrc.split('&_cb=')[0]
      setDisplaySrc(`${baseUrl}&_cb=${Date.now()}`)
      setRetryCount(2)
    } else {
      setHasError(true)
      setIsLoading(false)
      onLoadError?.()
    }
  }, [displaySrc, proxiedFallback, retryCount, onLoadError])

  const handleLoad = useCallback(async () => {
    if (!mountedRef.current) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Verificar dimensões mínimas
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current
      if (naturalWidth < 10 || naturalHeight < 10) {
        handleError()
        return
      }
    }

    setIsLoading(false)
    setHasError(false)

    // Se carregou do proxy (não do cache), salvar no cache
    if (displaySrc && !displaySrc.startsWith('blob:') && imgRef.current) {
      try {
        // Baixar como blob e cachear
        const response = await fetch(displaySrc)
        if (response.ok) {
          const blob = await response.blob()
          if (blob.type.startsWith('image/') || blob.size > 100) {
            // Usar URL original como chave do cache
            await cacheImage(src, blob)
          }
        }
      } catch {
        // Falha ao cachear não é crítico
      }
    }
  }, [displaySrc, src, handleError])

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
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 z-10">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      )}
      {displaySrc && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          ref={imgRef}
          src={displaySrc}
          alt={alt}
          className={`${className?.includes('object-contain') ? 'object-contain' : 'w-full h-full object-cover'} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          style={{ backgroundColor: 'white' }} // Fundo branco para PNGs com transparência
          loading="eager"
          decoding="async"
          onError={handleError}
          onLoad={handleLoad}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
      )}
    </div>
  )
}

// Componente interno
function MedicalImageGalleryComponent({ searchTerms, userId, excludeUrls }: MedicalImageGalleryProps) {
  const [images, setImages] = useState<MedicalImage[]>([])
  const [loading, setLoading] = useState(false)

  // Limpar cache antigo ao montar (uma vez por sessão)
  useEffect(() => {
    cleanOldCache().catch(() => {})
  }, [])
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
          }
          // Silenciosamente não mostrar nada ao invés de exibir erro
          return
        }

        // Deduplicar imagens por URL para evitar repetições
        // Também excluir imagens que já apareceram inline no markdown (via excludeUrls)
        const uniqueImages: MedicalImage[] = []
        const seenUrls = new Set<string>(excludeUrls || [])
        for (const img of (data.images || [])) {
          if (!seenUrls.has(img.url)) {
            seenUrls.add(img.url)
            uniqueImages.push(img)
          }
        }
        setImages(uniqueImages)
        setSearchInfo({
          queryUsed: data.queryUsed,
          originalQuery: data.originalQuery,
          suggestions: data.suggestions,
          searched: true
        })
      } catch (err) {
        console.error('Erro ao buscar imagens:', err)
        // Silenciosamente não mostrar nada ao invés de exibir erro
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
      <div className="my-4 p-4 bg-slate-800/30 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-sm">Buscando imagens médicas reais...</span>
        </div>
        <p className="text-slate-500 text-xs mt-2">
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
            <p className="text-slate-600 text-xs mt-1">
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

  // Error state - silenciosamente esconder (nunca mostrar erro ao usuário)
  if (error) {
    return null
  }

  // No images found - silenciosamente esconder
  if (images.length === 0 && searchInfo.searched) {
    return null
  }

  // Não pesquisou ainda ou não tem termos
  if (images.length === 0) {
    return null
  }

  // Se todas as imagens falharam, não mostrar nada (sem erro visível)
  if (validImages.length === 0 && images.length > 0) {
    return null
  }

  return (
    <>
      <div className="my-4 p-4 bg-slate-800/30 rounded-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-slate-700 text-sm font-medium">
              Imagens de Referência
            </span>
            <span className="text-slate-500 text-xs">
              ({validImages.length} {validImages.length === 1 ? 'imagem' : 'imagens'})
            </span>
          </div>
        </div>

        {/* Mostrar termo que encontrou resultados (se diferente do original) */}
        {searchInfo.queryUsed && searchInfo.originalQuery &&
         searchInfo.queryUsed.toLowerCase() !== searchInfo.originalQuery.toLowerCase() && (
          <p className="text-slate-500 text-xs mb-3">
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
                alt={img.title || img.titulo || 'Imagem médica'}
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

        {/* Footer - mostra fonte BRASILEIRA */}
        <p className="text-slate-500 text-xs mt-2">
          Clique para ampliar • Fonte: {
            validImages[0]?.siglaInstituicao ? `🇧🇷 ${validImages[0]?.siglaInstituicao}` :
            validImages[0]?.fonte ? `🏛️ ${validImages[0]?.fonte}` :
            validImages[0]?.sourceName ? `📚 ${validImages[0]?.sourceName}` :
            '🇧🇷 Fonte Acadêmica Brasileira'
          }
        </p>
        {/* Referência ABNT se disponível */}
        {validImages[0]?.referenciaABNT && (
          <p className="text-slate-400 text-[10px] mt-1 italic line-clamp-2">
            Ref: {validImages[0].referenciaABNT.substring(0, 100)}...
          </p>
        )}
      </div>

      {/* Modal de visualização ampliada - usando portal para fullscreen */}
      {selectedImage && (
        <ImageModal
          src={getProxiedImageUrl(selectedImage.url)}
          alt={showTranslation ? translateMedicalText(selectedImage.title || selectedImage.titulo || 'Imagem médica') : (selectedImage.title || selectedImage.titulo || 'Imagem médica')}
          isOpen={true}
          onClose={() => setSelectedImage(null)}
          caption={(selectedImage.caption || selectedImage.descricao) ? (showTranslation ? translateMedicalText(selectedImage.caption || selectedImage.descricao || '') : (selectedImage.caption || selectedImage.descricao)) : undefined}
          source={selectedImage.sourceName || selectedImage.fonte || selectedImage.source}
        />
      )}
    </>
  )
}

// Memoizar o componente para evitar re-renders durante streaming
// Só re-renderiza se searchTerms, userId ou excludeUrls realmente mudarem
const MedicalImageGallery = memo(MedicalImageGalleryComponent, (prevProps, nextProps) => {
  // Comparar arrays de searchTerms por valor (não por referência)
  const sameTerms = prevProps.searchTerms.length === nextProps.searchTerms.length &&
    prevProps.searchTerms.every((term, i) => term === nextProps.searchTerms[i])

  // Comparar excludeUrls por tamanho (Set)
  const sameExclude = (prevProps.excludeUrls?.size || 0) === (nextProps.excludeUrls?.size || 0)

  return sameTerms && prevProps.userId === nextProps.userId && sameExclude
})

export default MedicalImageGallery
