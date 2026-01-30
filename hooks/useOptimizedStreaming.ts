'use client'

import { useCallback, useRef, useState } from 'react'

interface StreamingState {
  content: string
  isStreaming: boolean
  error: string | null
}

interface UseOptimizedStreamingOptions {
  batchInterval?: number // ms entre atualizações de UI (default: 50ms)
  onChunk?: (chunk: string) => void
  onComplete?: (fullContent: string) => void
  onError?: (error: Error) => void
}

/**
 * Hook otimizado para streaming de respostas de IA
 * Usa batching e requestAnimationFrame para evitar flickering
 */
export function useOptimizedStreaming(options: UseOptimizedStreamingOptions = {}) {
  const {
    batchInterval = 50,
    onChunk,
    onComplete,
    onError
  } = options

  const [state, setState] = useState<StreamingState>({
    content: '',
    isStreaming: false,
    error: null
  })

  // Refs para evitar re-renders desnecessários
  const contentBufferRef = useRef('')
  const lastUpdateRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Função para atualizar UI de forma otimizada
  const flushBuffer = useCallback(() => {
    const now = performance.now()
    
    // Só atualiza se passou o intervalo mínimo ou se não está mais em streaming
    if (now - lastUpdateRef.current >= batchInterval) {
      lastUpdateRef.current = now
      
      if (contentBufferRef.current) {
        setState(prev => ({
          ...prev,
          content: contentBufferRef.current
        }))
      }
    }

    // Agenda próxima atualização se ainda estiver em streaming
    if (state.isStreaming && rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        flushBuffer()
      })
    }
  }, [batchInterval, state.isStreaming])

  // Adicionar conteúdo ao buffer (não causa re-render imediato)
  const appendContent = useCallback((chunk: string) => {
    contentBufferRef.current += chunk
    onChunk?.(chunk)
    
    // Agenda atualização via requestAnimationFrame
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        flushBuffer()
      })
    }
  }, [flushBuffer, onChunk])

  // Iniciar streaming
  const startStreaming = useCallback(() => {
    contentBufferRef.current = ''
    lastUpdateRef.current = 0
    
    // Cancelar RAF anterior
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController()

    setState({
      content: '',
      isStreaming: true,
      error: null
    })
  }, [])

  // Finalizar streaming
  const finishStreaming = useCallback(() => {
    // Cancelar RAF pendente
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    // Atualização final com todo o conteúdo
    const finalContent = contentBufferRef.current
    setState({
      content: finalContent,
      isStreaming: false,
      error: null
    })

    onComplete?.(finalContent)
  }, [onComplete])

  // Definir erro
  const setError = useCallback((error: Error | string) => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    const errorMessage = error instanceof Error ? error.message : error
    
    setState(prev => ({
      ...prev,
      isStreaming: false,
      error: errorMessage
    }))

    if (error instanceof Error) {
      onError?.(error)
    }
  }, [onError])

  // Abortar streaming
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    finishStreaming()
  }, [finishStreaming])

  // Obter AbortSignal para requisição
  const getSignal = useCallback(() => {
    return abortControllerRef.current?.signal
  }, [])

  // Processar stream SSE
  const processSSEStream = useCallback(async (
    response: Response,
    handlers: {
      onText?: (text: string) => void
      onConversa?: (data: { conversa_id: string; titulo?: string }) => void
      onDone?: (data: { conversa_id: string; tokens?: { input: number; output: number } }) => void
      onThinking?: (text: string) => void
      onImageGenerated?: (data: { url: string; descricao: string }) => void
    }
  ) => {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) throw new Error('Stream não disponível')

    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // Processar linhas completas
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Manter linha incompleta no buffer

        for (const line of lines) {
          const trimmedLine = line.trim()
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.slice(6))
              
              switch (data.type) {
                case 'text':
                  appendContent(data.content)
                  handlers.onText?.(data.content)
                  break
                  
                case 'conversa_created':
                  handlers.onConversa?.({
                    conversa_id: data.conversa_id,
                    titulo: data.titulo
                  })
                  break
                  
                case 'thinking':
                  handlers.onThinking?.(data.content)
                  break
                  
                case 'image_generated':
                  handlers.onImageGenerated?.(data)
                  break
                  
                case 'done':
                  handlers.onDone?.(data)
                  break
              }
            } catch {
              // Ignorar erros de parsing silenciosamente
            }
          }
        }
      }

      // Processar qualquer conteúdo restante no buffer
      if (buffer.trim().startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.trim().slice(6))
          if (data.type === 'text') {
            appendContent(data.content)
          }
        } catch {
          // Ignorar
        }
      }

      finishStreaming()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Streaming foi cancelado pelo usuário
        finishStreaming()
      } else {
        setError(error instanceof Error ? error : new Error('Erro no streaming'))
      }
    }
  }, [appendContent, finishStreaming, setError])

  return {
    // Estado
    content: state.content,
    isStreaming: state.isStreaming,
    error: state.error,
    
    // Ações
    startStreaming,
    appendContent,
    finishStreaming,
    setError,
    abort,
    getSignal,
    processSSEStream,
    
    // Refs para acesso direto quando necessário
    contentBufferRef,
    abortControllerRef
  }
}

/**
 * Componente para renderizar streaming de forma otimizada
 * Usa CSS para suavizar transições
 */
export function StreamingText({ 
  content, 
  isStreaming,
  className = ''
}: { 
  content: string
  isStreaming: boolean
  className?: string 
}) {
  return (
    <div 
      className={`transition-opacity duration-75 ${className}`}
      style={{
        // Previne layout shift durante streaming
        minHeight: isStreaming ? '1.5em' : undefined,
        // Suaviza renderização de texto
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased'
      }}
    >
      {content}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-0.5 bg-current opacity-75 animate-pulse" />
      )}
    </div>
  )
}

export default useOptimizedStreaming
