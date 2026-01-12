'use client'

import { useState } from 'react'
import { Loader2, Image as ImageIcon, Download, RefreshCw, AlertCircle } from 'lucide-react'

interface ImageGeneratorProps {
  prompt: string
  onGenerate?: (imageData: string) => void
}

const ESTILOS = [
  { value: 'anatomico', label: 'Anatômico', desc: 'Ilustração de atlas anatômico' },
  { value: 'fluxograma', label: 'Fluxograma', desc: 'Algoritmo de decisão clínica' },
  { value: 'diagrama', label: 'Diagrama', desc: 'Diagrama médico educativo' },
  { value: 'fisiopatologia', label: 'Fisiopatologia', desc: 'Mecanismos celulares' },
  { value: 'procedimento', label: 'Procedimento', desc: 'Técnica passo-a-passo' },
  { value: 'histologia', label: 'Histologia', desc: 'Estruturas celulares' },
  { value: 'radiologia', label: 'Radiologia', desc: 'Achados radiológicos' },
  { value: 'educativo', label: 'Educativo', desc: 'Ilustração geral' }
]

export default function ImageGenerator({ prompt, onGenerate }: ImageGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageData, setImageData] = useState<string | null>(null)
  const [estilo, setEstilo] = useState('educativo')

  const gerarImagem = async () => {
    setLoading(true)
    setError(null)

    try {
      // Obter user_id do localStorage ou contexto
      const userId = localStorage.getItem('user_id') || ''

      if (!userId) {
        setError('Usuário não autenticado. Faça login para gerar imagens.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/medicina/ia/imagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          prompt,
          estilo,
          titulo: `Ilustração: ${prompt.substring(0, 50)}`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar imagem')
      }

      if (data.imagem_base64) {
        const imageUrl = `data:image/png;base64,${data.imagem_base64}`
        setImageData(imageUrl)
        onGenerate?.(imageUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar imagem')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!imageData) return

    const link = document.createElement('a')
    link.href = imageData
    link.download = `ilustracao-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="my-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-purple-500/10 border-b border-purple-500/20">
        <ImageIcon className="w-5 h-5 text-purple-400" />
        <span className="text-white font-medium">Gerador de Imagens Médicas</span>
      </div>

      <div className="p-4">
        {/* Prompt */}
        <div className="mb-4">
          <label className="text-white/60 text-xs font-medium mb-1 block">Solicitação:</label>
          <p className="text-white/80 text-sm bg-slate-800/50 rounded-lg p-3">{prompt}</p>
        </div>

        {/* Seletor de estilo */}
        {!imageData && (
          <div className="mb-4">
            <label className="text-white/60 text-xs font-medium mb-2 block">Estilo da ilustração:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ESTILOS.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setEstilo(e.value)}
                  className={`p-2 rounded-lg text-left transition-colors ${
                    estilo === e.value
                      ? 'bg-purple-500/30 border-purple-500/50'
                      : 'bg-slate-800/50 border-white/5 hover:bg-slate-700/50'
                  } border`}
                >
                  <span className="text-white text-sm font-medium">{e.label}</span>
                  <span className="text-white/40 text-xs block">{e.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-medium">Erro ao gerar imagem</p>
              <p className="text-red-300/70 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Imagem gerada */}
        {imageData && (
          <div className="mb-4">
            <div className="relative rounded-lg overflow-hidden bg-slate-900/50">
              <img
                src={imageData}
                alt={prompt}
                className="w-full h-auto max-h-[500px] object-contain"
              />
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-2">
          {!imageData ? (
            <button
              onClick={gerarImagem}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gerando imagem...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  <span>Gerar Ilustração</span>
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Baixar</span>
              </button>
              <button
                onClick={() => {
                  setImageData(null)
                  setError(null)
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-700/50 text-white/70 rounded-lg hover:bg-slate-600/50 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Nova</span>
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <p className="text-white/40 text-xs mt-3 text-center">
          Imagens geradas com Gemini Imagen para fins educacionais
        </p>
      </div>
    </div>
  )
}
