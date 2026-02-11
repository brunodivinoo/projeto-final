'use client'

import { useEffect } from 'react'
import { useCapacitor } from '@/hooks/useCapacitor'
import { initializeNativeApp, addAppListeners } from '@/lib/capacitor'

/**
 * Componente que inicializa features nativas do Capacitor.
 * Deve ser incluido no layout principal do app.
 * No browser (PWA), nao faz nada.
 */
export function NativeInitializer() {
  const { isNative, platform } = useCapacitor()

  useEffect(() => {
    if (!isNative) return

    // Inicializa app nativo (status bar, splash, push)
    initializeNativeApp()

    // Listeners de lifecycle
    addAppListeners({
      onStateChange: (isActive) => {
        if (isActive) {
          console.log('[Native] App retornou ao foreground')
        }
      },
      onBackButton: () => {
        // No Android, voltar na navegacao
        if (window.history.length > 1) {
          window.history.back()
        }
      },
      onUrlOpen: (url) => {
        // Deep linking - navegar para a rota interna
        const path = new URL(url).pathname
        if (path) {
          window.location.href = path
        }
      },
    })
  }, [isNative, platform])

  return null
}
