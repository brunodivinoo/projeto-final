'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react'
import { useSpeech } from '@/hooks/useSpeech'

interface VoiceButtonProps {
  onTranscription: (text: string) => void
  textToSpeak?: string
  disabled?: boolean
  showSpeakButton?: boolean
  className?: string
  variant?: 'default' | 'compact' | 'inline'
}

export function VoiceButton({
  onTranscription,
  textToSpeak,
  disabled,
  showSpeakButton = true,
  className = '',
  variant = 'default'
}: VoiceButtonProps) {
  const {
    isRecording,
    isPlaying,
    isTranscribing,
    isSynthesizing,
    error,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking
  } = useSpeech()

  const [recordingTime, setRecordingTime] = useState(0)

  // Timer de gravação
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      setRecordingTime(0)
      interval = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const handleMicClick = async () => {
    if (disabled) return

    if (isRecording) {
      const text = await stopRecording()
      if (text) onTranscription(text)
    } else {
      startRecording()
    }
  }

  const handleSpeakClick = () => {
    if (disabled) return

    if (isPlaying) {
      stopSpeaking()
    } else if (textToSpeak) {
      speak(textToSpeak)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Variante compacta (apenas ícones)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <button
          onClick={handleMicClick}
          disabled={disabled || isTranscribing}
          className={`p-2 rounded-lg transition-all ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
        >
          {isTranscribing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        {showSpeakButton && textToSpeak && (
          <button
            onClick={handleSpeakClick}
            disabled={disabled || isSynthesizing}
            className={`p-2 rounded-lg transition-all ${
              isPlaying
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isPlaying ? 'Parar áudio' : 'Ouvir resposta'}
          >
            {isSynthesizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    )
  }

  // Variante inline (para dentro do input)
  if (variant === 'inline') {
    return (
      <button
        onClick={handleMicClick}
        disabled={disabled || isTranscribing}
        className={`p-1.5 rounded-lg transition-all ${
          isRecording
            ? 'bg-red-500 text-white animate-pulse'
            : 'text-white/40 hover:text-white hover:bg-white/5'
        } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
      >
        {isTranscribing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
    )
  }

  // Variante padrão (completa)
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Botão Microfone */}
        <button
          onClick={handleMicClick}
          disabled={disabled || isTranscribing}
          className={`p-3 rounded-full transition-all ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
              : 'bg-slate-700 text-white/80 hover:bg-slate-600 hover:text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isTranscribing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Timer de gravação */}
        {isRecording && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-mono text-sm">{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Status */}
        {isTranscribing && (
          <span className="text-white/60 text-sm">Transcrevendo...</span>
        )}

        {/* Botão Ouvir */}
        {showSpeakButton && textToSpeak && !isRecording && (
          <button
            onClick={handleSpeakClick}
            disabled={disabled || isSynthesizing}
            className={`p-3 rounded-full transition-all ${
              isPlaying
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-700 text-white/80 hover:bg-slate-600 hover:text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSynthesizing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        )}

        {isSynthesizing && (
          <span className="text-white/60 text-sm">Gerando áudio...</span>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// Componente para ouvir uma mensagem específica
interface SpeakButtonProps {
  text: string
  disabled?: boolean
  className?: string
}

export function SpeakButton({ text, disabled, className = '' }: SpeakButtonProps) {
  const { isPlaying, isSynthesizing, speak, stopSpeaking } = useSpeech()

  const handleClick = () => {
    if (isPlaying) {
      stopSpeaking()
    } else {
      speak(text)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isSynthesizing || !text}
      className={`p-1.5 rounded-lg transition-all ${
        isPlaying
          ? 'bg-blue-500/20 text-blue-400'
          : 'text-white/40 hover:text-white hover:bg-white/5'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isPlaying ? 'Parar áudio' : 'Ouvir'}
    >
      {isSynthesizing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </button>
  )
}
