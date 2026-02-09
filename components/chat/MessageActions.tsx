'use client'

import { useState, useRef, useCallback, memo} from 'react'
import { Copy, CheckCircle2, RotateCcw, Volume2, VolumeX, Settings2 } from 'lucide-react'

interface MessageActionsProps {
  messageId: string
  conteudo: string
  onRetry?: () => void
  tokens?: number
}

// Vozes disponíveis Kokoro pt-BR
const VOICES = [
  { id: 'pf_dora', label: 'Dora', gender: 'F' },
  { id: 'pm_alex', label: 'Alex', gender: 'M' },
  { id: 'pm_santa', label: 'Santa', gender: 'M' },
]

function MessageActions({ messageId, conteudo, onRetry, tokens }: MessageActionsProps) {
  const [copiado, setCopiado] = useState(false)
  const [reproduzindo, setReproduzindo] = useState(false)
  const [carregandoAudio, setCarregandoAudio] = useState(false)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState('pf_dora')
  const [speed, setSpeed] = useState(1.0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const copiarTexto = useCallback(async () => {
    try {
      // Limpar markdown para copiar texto puro
      const textoLimpo = conteudo
        .replace(/```[\s\S]*?```/g, '')
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .trim()

      await navigator.clipboard.writeText(textoLimpo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = conteudo
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }, [conteudo])

  const pararAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (utteranceRef.current) {
      window.speechSynthesis.cancel()
      utteranceRef.current = null
    }
    setReproduzindo(false)
  }, [])

  const reproduzirTexto = useCallback(async () => {
    if (reproduzindo) {
      pararAudio()
      return
    }

    setCarregandoAudio(true)

    try {
      // Tentar Kokoro TTS via API
      const res = await fetch('/api/medicina/ia/speech/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: conteudo,
          voice: selectedVoice,
          speed
        })
      })

      if (res.ok) {
        const contentType = res.headers.get('Content-Type')

        if (contentType?.includes('audio')) {
          // Kokoro retornou áudio
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audioRef.current = audio

          audio.onended = () => {
            setReproduzindo(false)
            URL.revokeObjectURL(url)
          }
          audio.onerror = () => {
            setReproduzindo(false)
            URL.revokeObjectURL(url)
          }

          await audio.play()
          setReproduzindo(true)
          setCarregandoAudio(false)
          return
        }

        // Fallback response
        const data = await res.json()
        if (data.fallback && data.text) {
          usarWebSpeech(data.text)
          return
        }
      }

      // Se tudo falhar, usar Web Speech API direto
      usarWebSpeech(conteudo)

    } catch {
      // Fallback final: Web Speech API
      usarWebSpeech(conteudo)
    }
  }, [conteudo, reproduzindo, pararAudio, selectedVoice, speed])

  const usarWebSpeech = useCallback((texto: string) => {
    setCarregandoAudio(false)

    if (!('speechSynthesis' in window)) {
      alert('Seu navegador não suporta síntese de voz.')
      return
    }

    // Limpar texto para Web Speech
    const limpo = texto
      .replace(/```[\s\S]*?```/g, '')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .slice(0, 2000)

    const utterance = new SpeechSynthesisUtterance(limpo)
    utterance.lang = 'pt-BR'
    utterance.rate = speed

    // Tentar encontrar voz pt-BR
    const voices = window.speechSynthesis.getVoices()
    const ptVoice = voices.find(v => v.lang.startsWith('pt'))
    if (ptVoice) utterance.voice = ptVoice

    utterance.onend = () => setReproduzindo(false)
    utterance.onerror = () => setReproduzindo(false)
    utteranceRef.current = utterance

    window.speechSynthesis.speak(utterance)
    setReproduzindo(true)
  }, [speed])

  return (
    <div className="flex items-center gap-1 mt-1.5 ml-1 relative">
      {/* Copiar */}
      <button
        onClick={copiarTexto}
        className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-all"
        title="Copiar resposta"
      >
        {copiado ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      {/* Refazer */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-all"
          title="Gerar nova resposta"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Ouvir */}
      <button
        onClick={reproduzirTexto}
        disabled={carregandoAudio}
        className={`p-1 rounded transition-all ${
          reproduzindo
            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
        } ${carregandoAudio ? 'opacity-50 cursor-wait' : ''}`}
        title={reproduzindo ? 'Parar áudio' : 'Ouvir resposta'}
      >
        {reproduzindo ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>

      {/* Config de voz (discreto) */}
      <button
        onClick={() => setShowVoiceSettings(!showVoiceSettings)}
        className="text-slate-300 hover:text-slate-500 p-1 rounded hover:bg-slate-50 transition-all"
        title="Configurar voz"
      >
        <Settings2 className="w-3 h-3" />
      </button>

      {/* Tokens */}
      {tokens && (
        <span className="text-slate-300 text-[10px] ml-1">
          {tokens.toLocaleString()} tokens
        </span>
      )}

      {/* Menu de configurações de voz */}
      {showVoiceSettings && (
        <div className="absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-2">Configurações de Voz</p>

          {/* Seletor de voz */}
          <div className="space-y-1 mb-3">
            {VOICES.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVoice(v.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all ${
                  selectedVoice === v.id
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-[10px] bg-slate-200 rounded px-1">{v.gender}</span>
                {v.label}
              </button>
            ))}
          </div>

          {/* Velocidade */}
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Velocidade: {speed.toFixed(1)}x</p>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(MessageActions)
