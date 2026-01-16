'use client'

import { useState, useRef, useCallback } from 'react'

export function useSpeech() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Iniciar gravação
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(100) // Capturar em chunks de 100ms
      setIsRecording(true)
    } catch (err) {
      console.error('Erro ao acessar microfone:', err)
      setError('Não foi possível acessar o microfone. Verifique as permissões.')
    }
  }, [])

  // Parar gravação e transcrever
  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve('')
        return
      }

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false)
        setIsTranscribing(true)

        // Parar todas as tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }

        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })

        // Converter para formato compatível se necessário
        const formData = new FormData()
        const extension = mimeType.includes('webm') ? 'webm' : 'mp4'
        formData.append('audio', audioBlob, `audio.${extension}`)

        try {
          const response = await fetch('/api/medicina/ia/speech/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error('Erro na transcrição')
          }

          const data = await response.json()
          resolve(data.text || '')
        } catch (err) {
          console.error('Erro na transcrição:', err)
          setError('Erro ao transcrever áudio. Tente novamente.')
          resolve('')
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorderRef.current.stop()
    })
  }, [])

  // Cancelar gravação
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      setIsRecording(false)
      audioChunksRef.current = []
    }
  }, [isRecording])

  // Reproduzir texto como áudio
  const speak = useCallback(async (text: string, voice: string = 'nova') => {
    if (!text.trim()) return

    try {
      setError(null)
      setIsSynthesizing(true)

      const response = await fetch('/api/medicina/ia/speech/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      })

      if (!response.ok) {
        throw new Error('Erro na síntese')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // Parar áudio anterior se existir
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
      audioRef.current.onerror = () => {
        setIsPlaying(false)
        setError('Erro ao reproduzir áudio')
        URL.revokeObjectURL(audioUrl)
      }

      setIsSynthesizing(false)
      setIsPlaying(true)
      await audioRef.current.play()
    } catch (err) {
      console.error('Erro ao sintetizar voz:', err)
      setError('Erro ao gerar áudio. Tente novamente.')
      setIsPlaying(false)
      setIsSynthesizing(false)
    }
  }, [])

  // Parar reprodução
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [])

  // Pausar/Retomar reprodução
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  return {
    // Estados
    isRecording,
    isPlaying,
    isTranscribing,
    isSynthesizing,
    error,

    // Gravação
    startRecording,
    stopRecording,
    cancelRecording,

    // Reprodução
    speak,
    stopSpeaking,
    togglePlayback,
  }
}
