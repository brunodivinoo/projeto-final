'use client'

import { useState, useRef } from 'react'
import { Upload, FileImage, Loader2, X, Stethoscope, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useMedAuth } from '@/contexts/MedAuthContext'

const EXAM_TYPES = [
  { id: 'ecg', label: '🫀 ECG', desc: 'Eletrocardiograma' },
  { id: 'raio_x', label: '🦴 Raio-X', desc: 'Radiografias' },
  { id: 'tc', label: '🧠 TC/RM', desc: 'Tomografia e Ressonância' },
  { id: 'laboratorio', label: '🧪 Laboratório', desc: 'Exames de sangue/urina' },
  { id: 'dermatoscopia', label: '🔬 Pele', desc: 'Lesões cutâneas' },
  { id: 'fundoscopia', label: '👁️ Fundo de Olho', desc: 'Retina e nervos' },
  { id: 'geral', label: '📋 Outro', desc: 'Outros exames' },
]

interface ExamAnalyzerProps {
  onAnalysis?: (analysis: string) => void
  onClose?: () => void
  className?: string
}

export function ExamAnalyzer({ onAnalysis, onClose, className = '' }: ExamAnalyzerProps) {
  const { user, plano, podeUsarFuncionalidade } = useMedAuth()
  const [selectedType, setSelectedType] = useState('geral')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Verificar se pode usar
  const podeUsar = podeUsarFuncionalidade('analise_exames')

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamanho
      if (file.size > 10 * 1024 * 1024) {
        setError('Imagem muito grande. Máximo 10MB.')
        return
      }

      // Validar tipo
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setError('Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP.')
        return
      }

      setError(null)
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setAnalysis(null)
    }
  }

  const handleAnalyze = async () => {
    if (!image || !user) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('examType', selectedType)
      formData.append('question', question)
      formData.append('userId', user.id)

      const response = await fetch('/api/medicina/ia/analyze-exam', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar')
      }

      if (data.analysis) {
        setAnalysis(data.analysis)
        onAnalysis?.(data.analysis)
      }
    } catch (err) {
      console.error('Erro:', err)
      setError(err instanceof Error ? err.message : 'Erro ao analisar imagem')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const clearImage = () => {
    setImage(null)
    setPreview(null)
    setAnalysis(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const resetAll = () => {
    clearImage()
    setQuestion('')
    setSelectedType('geral')
  }

  // Se não pode usar, mostrar bloqueio
  if (!podeUsar) {
    return (
      <div className={`bg-slate-800 rounded-xl p-6 text-center ${className}`}>
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Recurso Exclusivo</h3>
        <p className="text-white/60 text-sm mb-4">
          A análise de exames com IA está disponível apenas no plano Residência.
        </p>
        <button
          onClick={() => window.location.href = '/medicina/planos'}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
        >
          Conhecer plano Residência
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-slate-800 rounded-xl p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Stethoscope className="w-5 h-5 text-blue-400" />
          Análise de Exames
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Se já tem análise, mostrar resultado */}
      {analysis ? (
        <div className="space-y-4">
          {/* Imagem analisada */}
          {preview && (
            <div className="relative">
              <img
                src={preview}
                alt="Exame analisado"
                className="w-full max-h-48 object-contain rounded-lg bg-black/20"
              />
              <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/80 rounded-lg text-xs font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Analisado
              </div>
            </div>
          )}

          {/* Resultado da análise */}
          <div className="p-4 bg-slate-700/50 rounded-lg max-h-96 overflow-y-auto">
            <p className="text-white/90 text-sm whitespace-pre-wrap leading-relaxed">
              {analysis}
            </p>
          </div>

          {/* Aviso */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-200/80 text-xs">
                Esta análise é apenas para fins educacionais. Sempre busque orientação de um profissional qualificado para casos reais.
              </p>
            </div>
          </div>

          {/* Botão nova análise */}
          <button
            onClick={resetAll}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Nova Análise
          </button>
        </div>
      ) : (
        <>
          {/* Tipo de exame */}
          <div className="flex flex-wrap gap-2">
            {EXAM_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  selectedType === type.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-white/70 hover:bg-slate-600 hover:text-white'
                }`}
                title={type.desc}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Upload de imagem */}
          {!preview ? (
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-3 text-slate-500" />
              <p className="text-white/70">Clique para enviar imagem do exame</p>
              <p className="text-white/40 text-sm mt-1">PNG, JPG, WebP até 10MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-contain rounded-lg bg-black/20"
              />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Pergunta opcional */}
          {preview && (
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Pergunta específica (opcional)..."
              className="w-full px-4 py-2.5 bg-slate-700 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          )}

          {/* Botão analisar */}
          {preview && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <FileImage className="w-5 h-5" />
                  Analisar Exame
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  )
}

// Versão modal do analisador
interface ExamAnalyzerModalProps {
  isOpen: boolean
  onClose: () => void
  onAnalysis?: (analysis: string) => void
}

export function ExamAnalyzerModal({ isOpen, onClose, onAnalysis }: ExamAnalyzerModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full">
        <ExamAnalyzer
          onAnalysis={onAnalysis}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
