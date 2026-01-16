'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

interface UseSmartScrollOptions {
  threshold?: number
  smoothScroll?: boolean
}

interface UseSmartScrollReturn {
  containerRef: React.RefObject<HTMLDivElement | null>
  isAtBottom: boolean
  scrollToBottom: (smooth?: boolean) => void
}

/**
 * Hook SIMPLIFICADO para gerenciar scroll em chat
 * - NÃO força auto-scroll durante streaming
 * - Permite 100% scroll manual do usuário
 * - Botão flutuante para voltar ao final
 */
export function useSmartScroll(options: UseSmartScrollOptions = {}): UseSmartScrollReturn {
  const { threshold = 100, smoothScroll = true } = options

  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Flag para saber se o usuário está scrollando manualmente
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Verificar se está no fundo
  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    return distanceFromBottom <= threshold
  }, [threshold])

  // Handler de scroll - APENAS atualiza estado, não força nada
  const handleScroll = useCallback(() => {
    // Marcar que o usuário está scrollando
    isUserScrollingRef.current = true

    // Limpar timeout anterior
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Após 500ms sem scroll, liberar
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
    }, 500)

    // Atualizar estado de "está no fundo"
    setIsAtBottom(checkIfAtBottom())
  }, [checkIfAtBottom])

  // Scroll para o fundo - APENAS quando chamado explicitamente pelo usuário
  const scrollToBottom = useCallback((smooth = smoothScroll) => {
    const container = containerRef.current
    if (!container) return

    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    })
    setIsAtBottom(true)
  }, [smoothScroll])

  // Adicionar listener de scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [handleScroll])

  // REMOVER o MutationObserver completamente - ele causa o travamento!
  // O scroll automático será controlado apenas pelo botão flutuante

  return {
    containerRef,
    isAtBottom,
    scrollToBottom
  }
}

export default useSmartScroll
