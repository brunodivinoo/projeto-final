'use client'

import React, { useState } from 'react'
import {
  useMedicalImageGeneration,
  IMAGE_TYPES,
  SUGGESTED_STRUCTURES,
} from '@/hooks/useMedicalImageGeneration'
import { Image as ImageIcon, Download, Copy, Loader2, Plus, X, Sparkles } from 'lucide-react'

type ImageType = 'anatomy' | 'histology' | 'radiology' | 'pathology' | 'diagram'

interface Props {
  userId: string
  onImageGenerated?: (imageUrl: string) => void
  onClose?: () => void
  embedded?: boolean // Se true, mostra versão compacta para embed no chat
}

export function MedicalImageGenerator({ userId, onImageGenerated, onClose, embedded = false }: Props) {
  // Estados do formulário
  const [imageType, setImageType] = useState<ImageType>('anatomy')
  const [structure, setStructure] = useState('')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [annotations, setAnnotations] = useState<string[]>([])
  const [customAnnotation, setCustomAnnotation] = useState('')
  const [view, setView] = useState('')
  const [additionalDetails, setAdditionalDetails] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Hook de geração
  const { generate, isLoading, error, result, progress, reset } = useMedicalImageGeneration({
    userId,
    onSuccess: (data) => {
      if (onImageGenerated && data.url) {
        onImageGenerated(data.url)
      }
    },
  })

  // Adicionar anotação
  const addAnnotation = () => {
    if (customAnnotation.trim() && annotations.length < 8) {
      setAnnotations([...annotations, customAnnotation.trim()])
      setCustomAnnotation('')
    }
  }

  // Remover anotação
  const removeAnnotation = (index: number) => {
    setAnnotations(annotations.filter((_, i) => i !== index))
  }

  // Gerar imagem
  const handleGenerate = async () => {
    if (!structure.trim()) {
      alert('Por favor, informe a estrutura/tema da imagem')
      return
    }

    await generate({
      structure,
      type: imageType,
      annotations: annotations.length > 0 ? annotations : undefined,
      view: view || undefined,
      additionalDetails: additionalDetails || undefined,
      quality,
    })
  }

  // Copiar URL
  const copyUrl = () => {
    if (result?.url) {
      navigator.clipboard.writeText(result.url)
    }
  }

  // Download
  const downloadImage = () => {
    if (result?.url) {
      const link = document.createElement('a')
      link.href = result.url
      link.download = `imagem-medica-${Date.now()}.png`
      link.click()
    }
  }

  // Nova geração
  const handleNewGeneration = () => {
    reset()
    setStructure('')
    setAnnotations([])
    setView('')
    setAdditionalDetails('')
  }

  // Custo estimado
  const costs = { low: 0.011, medium: 0.042, high: 0.167 }

  if (embedded) {
    // Versão compacta para embed no chat
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-white">Gerar Imagem Médica</span>
          {onClose && (
            <button onClick={onClose} className="ml-auto text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {result?.url ? (
          <div>
            <img
              src={result.url}
              alt="Imagem médica gerada"
              className="w-full rounded-lg mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={downloadImage}
                className="flex-1 py-2 px-3 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                <Download className="w-4 h-4 inline mr-1" />
                Download
              </button>
              <button
                onClick={handleNewGeneration}
                className="py-2 px-3 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500"
              >
                Nova
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              placeholder="Ex: coração, rim, cérebro..."
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm mb-2"
              disabled={isLoading}
            />
            <div className="flex gap-2 mb-2">
              <select
                value={imageType}
                onChange={(e) => setImageType(e.target.value as ImageType)}
                className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                disabled={isLoading}
              >
                {Object.entries(IMAGE_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.icon} {value.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !structure.trim()}
              className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {progress || 'Gerando...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Imagem
                </>
              )}
            </button>
            {error && (
              <p className="mt-2 text-red-400 text-xs">{error.message}</p>
            )}
          </div>
        )}
      </div>
    )
  }

  // Versão completa (modal ou página)
  return (
    <div className="bg-gray-900 rounded-xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-7 h-7 text-purple-400" />
          Gerador de Imagens Médicas
        </h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {result?.url ? (
        // Resultado
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-gray-700">
            <img
              src={result.url}
              alt="Imagem médica gerada"
              className="w-full h-auto"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadImage}
              className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              onClick={copyUrl}
              className="py-3 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Copiar URL
            </button>
            <button
              onClick={handleNewGeneration}
              className="py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Nova Imagem
            </button>
          </div>

          <p className="text-sm text-gray-400 text-center">
            Custo: ~${result.estimatedCost.toFixed(3)}
          </p>
        </div>
      ) : (
        // Formulário
        <div className="space-y-5">
          {/* Tipo de Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Imagem
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(IMAGE_TYPES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setImageType(key as ImageType)}
                  disabled={isLoading}
                  className={`py-3 px-4 rounded-lg border-2 transition-all text-left ${
                    imageType === key
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-gray-700 hover:border-gray-600 text-gray-300'
                  }`}
                >
                  <span className="text-xl mr-2">{value.icon}</span>
                  <span className="font-medium">{value.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Estrutura Anatômica */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estrutura / Tema *
            </label>
            <input
              type="text"
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              placeholder="Ex: coração, rim, pulmão, cérebro, coluna vertebral..."
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              disabled={isLoading}
            />
            {/* Sugestões */}
            <div className="mt-2 flex flex-wrap gap-1">
              {SUGGESTED_STRUCTURES.cardiovascular.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => setStructure(s)}
                  className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Qualidade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Qualidade (Custo: ~${costs[quality].toFixed(3)})
            </label>
            <div className="flex gap-3">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  disabled={isLoading}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                    quality === q
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-gray-700 hover:border-gray-600 text-gray-400'
                  }`}
                >
                  {q === 'low' && '🟢 Baixa'}
                  {q === 'medium' && '🟡 Média'}
                  {q === 'high' && '🔴 Alta'}
                </button>
              ))}
            </div>
          </div>

          {/* Anotações */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Anotações / Legendas (opcional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {annotations.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm"
                >
                  {a}
                  <button
                    onClick={() => removeAnnotation(i)}
                    className="ml-1 text-purple-400 hover:text-purple-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customAnnotation}
                onChange={(e) => setCustomAnnotation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAnnotation()}
                placeholder="Ex: Ventrículo esquerdo, Aorta..."
                className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                disabled={isLoading || annotations.length >= 8}
              />
              <button
                onClick={addAnnotation}
                disabled={isLoading || !customAnnotation.trim() || annotations.length >= 8}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Opções Avançadas */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              {showAdvanced ? '▼' : '▶'} Opções avançadas
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-3 p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Vista/Perspectiva
                  </label>
                  <input
                    type="text"
                    value={view}
                    onChange={(e) => setView(e.target.value)}
                    placeholder="Ex: anterior, posterior, lateral, corte sagital..."
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Detalhes adicionais
                  </label>
                  <textarea
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder="Instruções específicas para a imagem..."
                    rows={2}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botão Gerar */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !structure.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {progress || 'Gerando imagem...'}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Gerar Imagem Médica
              </>
            )}
          </button>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              <strong>Erro:</strong> {error.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MedicalImageGenerator
