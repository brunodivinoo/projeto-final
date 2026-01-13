'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

interface UseSmartScrollOptions {
  threshold?: number // Distance from bottom to consider "at bottom"
  smoothScroll?: boolean
}

interface UseSmartScrollReturn {
  containerRef: React.RefObject<HTMLDivElement | null>
  isAtBottom: boolean
  isUserScrolling: boolean
  scrollToBottom: (smooth?: boolean) => void
}

/**
 * Hook inteligente para gerenciar scroll em chat com streaming
 * - Permite scroll manual durante streaming
 * - Auto-scroll apenas quando usuário está no fundo
 * - Botão de "voltar ao final" quando necessário
 */
export function useSmartScroll(options: UseSmartScrollOptions = {}): UseSmartScrollReturn {
  const { threshold = 100, smoothScroll = true } = options

  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollTopRef = useRef(0)

  // Verificar se está no fundo
  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    return distanceFromBottom <= threshold
  }, [threshold])

  // Handler de scroll do usuário
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const currentScrollTop = container.scrollTop
    const scrollingUp = currentScrollTop < lastScrollTopRef.current
    lastScrollTopRef.current = currentScrollTop

    // Se usuário scrollou para cima, marcar como scroll manual
    if (scrollingUp) {
      setIsUserScrolling(true)
      setIsAtBottom(false)

      // Reset do timeout
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current)
      }

      // Após 2s sem scroll, verificar posição
      userScrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false)
        setIsAtBottom(checkIfAtBottom())
      }, 2000)
    } else {
      // Scrollou para baixo ou ficou parado
      const atBottom = checkIfAtBottom()

      if (atBottom) {
        setIsUserScrolling(false)
        setIsAtBottom(true)

        if (userScrollTimeoutRef.current) {
          clearTimeout(userScrollTimeoutRef.current)
        }
      }
    }
  }, [checkIfAtBottom])

  // Scroll para o fundo
  const scrollToBottom = useCallback((smooth = smoothScroll) => {
    const container = containerRef.current
    if (!container) return

    setIsUserScrolling(false)
    setIsAtBottom(true)

    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    })
  }, [smoothScroll])

  // Adicionar listener de scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current)
      }
    }
  }, [handleScroll])

  // Auto-scroll quando novo conteúdo é adicionado (via MutationObserver)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new MutationObserver(() => {
      // Só auto-scroll se usuário estiver no fundo e não estiver scrollando manualmente
      if (isAtBottom && !isUserScrolling) {
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight
        })
      }
    })

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    })

    return () => observer.disconnect()
  }, [isAtBottom, isUserScrolling])

  return {
    containerRef,
    isAtBottom,
    isUserScrolling,
    scrollToBottom
  }
}

export default useSmartScroll
