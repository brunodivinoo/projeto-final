'use client'

import { useState, useRef } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import {
  Camera,
  Upload,
  Loader2,
  Sparkles,
  Apple,
  Flame,
  Beef,
  Wheat,
  Droplets,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Star,
  ImageIcon
} from 'lucide-react'

interface AnalisePrato {
  alimentos: string[]
  calorias_total: number
  proteinas: number
  carboidratos: number
  gorduras: number
  fibras?: number
  pontos_positivos?: string[]
  pontos_negativos?: string[]
  dica: string
  nota_saude: number
}

export default function AnalisePratoPage() {
  const { user } = useNutriAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagem, setImagem] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analise, setAnalise] = useState<AnalisePrato | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Preview da imagem
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagem(reader.result as string)
      }
      reader.readAsDataURL(file)
      setAnalise(null)
      setErro(null)
    }
  }

  const analisarPrato = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setErro('Selecione uma imagem primeiro')
      return
    }

    setLoading(true)
    setErro(null)

    try {
      const formData = new FormData()
      formData.append('image', fileInputRef.current.files[0])
      if (user?.id) {
        formData.append('userId', user.id)
      }

      const response = await fetch('/api/nutrivida/analise-prato', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.error) {
        setErro(data.error)
      } else {
        setAnalise(data.analise)
      }
    } catch (err) {
      console.error('Erro ao analisar:', err)
      setErro('Erro ao analisar imagem. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const getNotaColor = (nota: number) => {
    if (nota >= 8) return 'text-green-500'
    if (nota >= 6) return 'text-yellow-500'
    if (nota >= 4) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analise seu Prato</h1>
          <p className="text-gray-500">Tire uma foto e a IA analisa os nutrientes</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-700 font-medium">IA Vision</p>
            <p className="text-sm text-gray-500 mt-1">
              Nossa IA identifica os alimentos na sua foto e calcula automaticamente calorias, proteinas, carboidratos e gorduras!
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {!imagem ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-12 border-2 border-dashed border-purple-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-purple-400 hover:bg-purple-50 transition-all"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-purple-500" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-700">Toque para tirar ou enviar foto</p>
              <p className="text-sm text-gray-400 mt-1">JPG, PNG ou HEIC</p>
            </div>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={imagem}
                alt="Prato para análise"
                className="w-full h-64 object-cover rounded-xl"
              />
              <button
                onClick={() => {
                  setImagem(null)
                  setAnalise(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
              >
                <span className="text-gray-600">✕</span>
              </button>
            </div>

            <button
              onClick={analisarPrato}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analisar com IA
                </>
              )}
            </button>
          </div>
        )}

        {erro && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {erro}
          </div>
        )}
      </div>

      {/* Resultado da Análise */}
      {analise && (
        <div className="space-y-4">
          {/* Nota e Alimentos */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-lg">Resultado</h2>
              <div className="flex items-center gap-2">
                <Star className={`w-5 h-5 ${getNotaColor(analise.nota_saude)}`} fill="currentColor" />
                <span className={`text-2xl font-bold ${getNotaColor(analise.nota_saude)}`}>
                  {analise.nota_saude}/10
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Alimentos identificados:</p>
              <div className="flex flex-wrap gap-2">
                {analise.alimentos.map((alimento, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {alimento}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Calorias</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{analise.calorias_total}</p>
              <p className="text-xs text-gray-400">kcal</p>
            </div>

            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-1">
                <Beef className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600">Proteinas</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{analise.proteinas}g</p>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
              <div className="flex items-center gap-2 mb-1">
                <Wheat className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-gray-600">Carboidratos</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{analise.carboidratos}g</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Gorduras</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{analise.gorduras}g</p>
            </div>
          </div>

          {/* Pontos positivos e negativos */}
          {(analise.pontos_positivos?.length || analise.pontos_negativos?.length) && (
            <div className="grid md:grid-cols-2 gap-4">
              {analise.pontos_positivos?.length ? (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-green-700">Pontos Positivos</span>
                  </div>
                  <ul className="space-y-2">
                    {analise.pontos_positivos.map((ponto, i) => (
                      <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        {ponto}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {analise.pontos_negativos?.length ? (
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsDown className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-700">Pode Melhorar</span>
                  </div>
                  <ul className="space-y-2">
                    {analise.pontos_negativos.map((ponto, i) => (
                      <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        {ponto}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {/* Dica */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">Dica da Nutri IA</p>
                <p className="text-white/90 text-sm">{analise.dica}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
