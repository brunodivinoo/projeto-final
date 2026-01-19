'use client'

import { useState, useCallback } from 'react'

export interface GeneratedImageResult {
  url: string
  revisedPrompt: string
  estimatedCost: number
}

export interface GenerateImageOptions {
  structure: string
  type?: 'anatomy' | 'histology' | 'radiology' | 'pathology' | 'diagram'
  annotations?: string[]
  view?: string
  additionalDetails?: string
  quality?: 'low' | 'medium' | 'high'
  size?: '1024x1024' | '1024x1536' | '1536x1024'
}

interface UseMedicalImageGenerationOptions {
  userId: string
  onSuccess?: (result: GeneratedImageResult) => void
  onError?: (error: Error) => void
}

export function useMedicalImageGeneration(options: UseMedicalImageGenerationOptions) {
  const { userId, onSuccess, onError } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<GeneratedImageResult | null>(null)
  const [progress, setProgress] = useState<string>('')

  const generate = useCallback(async (generateOptions: GenerateImageOptions) => {
    if (!userId) {
      const err = new Error('Usuário não autenticado')
      setError(err)
      onError?.(err)
      return null
    }

    setIsLoading(true)
    setError(null)
    setProgress('Iniciando geração da imagem...')

    try {
      setProgress('Processando sua solicitação...')

      const response = await fetch('/api/medicina/ia/gerar-imagem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...generateOptions,
        }),
      })

      setProgress('Gerando imagem com IA...')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar imagem')
      }

      const data = await response.json()

      if (!data.success || !data.data) {
        throw new Error('Resposta inválida do servidor')
      }

      const imageResult: GeneratedImageResult = {
        url: data.data.url,
        revisedPrompt: data.data.revisedPrompt,
        estimatedCost: data.data.estimatedCost,
      }

      setResult(imageResult)
      setProgress('Imagem gerada com sucesso!')
      onSuccess?.(imageResult)

      return imageResult

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      setProgress('')
      onError?.(error)
      return null

    } finally {
      setIsLoading(false)
    }
  }, [userId, onSuccess, onError])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setIsLoading(false)
    setProgress('')
  }, [])

  return {
    generate,
    isLoading,
    error,
    result,
    progress,
    reset,
  }
}

// ============================================
// TIPOS DE IMAGENS DISPONÍVEIS
// ============================================

export const IMAGE_TYPES = {
  anatomy: {
    label: 'Anatomia',
    description: 'Ilustração anatômica estilo atlas (Netter/Sobotta)',
    icon: '🫀',
  },
  histology: {
    label: 'Histologia',
    description: 'Fotomicrografia de tecido (H&E)',
    icon: '🔬',
  },
  radiology: {
    label: 'Radiologia',
    description: 'Raio-X, TC ou RM',
    icon: '☢️',
  },
  pathology: {
    label: 'Patologia',
    description: 'Macroscopia ou microscopia de lesões',
    icon: '🦠',
  },
  diagram: {
    label: 'Diagrama',
    description: 'Esquema didático ou fluxograma',
    icon: '📊',
  },
} as const

// ============================================
// ESTRUTURAS ANATÔMICAS SUGERIDAS
// ============================================

export const SUGGESTED_STRUCTURES = {
  cardiovascular: [
    'Coração (vista anterior)',
    'Coração (corte transversal)',
    'Sistema de condução cardíaco',
    'Valvas cardíacas',
    'Circulação coronariana',
  ],
  respiratorio: [
    'Pulmões (vista anterior)',
    'Árvore brônquica',
    'Alvéolos pulmonares',
    'Laringe e traqueia',
  ],
  digestorio: [
    'Estômago (anatomia)',
    'Intestino delgado',
    'Fígado e vias biliares',
    'Pâncreas',
  ],
  nervoso: [
    'Cérebro (vista lateral)',
    'Cérebro (corte sagital)',
    'Medula espinhal',
    'Sistema nervoso autônomo',
  ],
  urinario: [
    'Rim (corte frontal)',
    'Néfron',
    'Sistema urinário completo',
    'Bexiga',
  ],
  musculoesqueletico: [
    'Coluna vertebral',
    'Articulação do joelho',
    'Articulação do ombro',
    'Músculos do braço',
  ],
}
