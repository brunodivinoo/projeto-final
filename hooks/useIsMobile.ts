'use client'

import { useState, useEffect } from 'react'

/**
 * Hook para detectar se o dispositivo é mobile
 * Considera mobile: viewport < 768px (tailwind md breakpoint)
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Verificação inicial
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Verificar ao montar
    checkIsMobile()

    // Adicionar listener de resize com debounce
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkIsMobile, 150)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [breakpoint])

  return isMobile
}
