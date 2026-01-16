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

  // Handler de scroll do usuário - versão menos agressiva
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const atBottom = checkIfAtBottom()

    // Simplesmente atualizar o estado - sem forçar comportamentos
    setIsAtBottom(atBottom)

    // Se não está no fundo, marcar como scroll manual
    if (!atBottom) {
      setIsUserScrolling(true)

      // Reset do timeout - após 3s sem interação, libera auto-scroll
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current)
      }

      userScrollTimeoutRef.current = setTimeout(() => {
        // Só libera se realmente chegou no fundo
        if (checkIfAtBottom()) {
          setIsUserScrolling(false)
          setIsAtBottom(true)
        }
      }, 3000)
    } else {
      // Chegou no fundo naturalmente
      setIsUserScrolling(false)
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current)
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

  // Auto-scroll quando novo conteúdo é adicionado - versão suave
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new MutationObserver(() => {
      // IMPORTANTE: Só auto-scroll se:
      // 1. Usuário estava no fundo E
      // 2. Não está scrollando manualmente
      if (isAtBottom && !isUserScrolling) {
        // Usar setTimeout para não interferir com o scroll do usuário
        setTimeout(() => {
          // Verificar novamente antes de scrollar
          if (isAtBottom && !isUserScrolling) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'auto' // 'auto' é mais suave que forçar scrollTop
            })
          }
        }, 50)
      }
    })

    observer.observe(container, {
      childList: true,
      subtree: true
      // REMOVER characterData para reduzir frequência de triggers
      // characterData: true
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
