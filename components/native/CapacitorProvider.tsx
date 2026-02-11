'use client'

import { useEffect, createContext, useContext, useState, ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'

interface CapacitorContextValue {
  isNative: boolean
  platform: 'web' | 'ios' | 'android'
}

const CapacitorContext = createContext<CapacitorContextValue>({
  isNative: false,
  platform: 'web',
})

export function useCapacitorContext() {
  return useContext(CapacitorContext)
}

/**
 * Provider que inicializa o Capacitor e plugins nativos.
 * Adicionar no layout principal para que todos componentes tenham acesso.
 */
export function CapacitorProvider({ children }: { children: ReactNode }) {
  const [isNative, setIsNative] = useState(false)
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web')

  useEffect(() => {
    const native = Capacitor.isNativePlatform()
    setIsNative(native)
    setPlatform(Capacitor.getPlatform() as 'web' | 'ios' | 'android')

    if (!native) return

    initNativePlugins()
  }, [])

  return (
    <CapacitorContext.Provider value={{ isNative, platform }}>
      {/* Safe area padding para notch/barra do iOS */}
      {isNative && (
        <style>{`
          :root {
            --safe-area-top: env(safe-area-inset-top);
            --safe-area-bottom: env(safe-area-inset-bottom);
            --safe-area-left: env(safe-area-inset-left);
            --safe-area-right: env(safe-area-inset-right);
          }
          body {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
            -webkit-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            overscroll-behavior: none;
          }
          /* Permitir selecao de texto em areas de conteudo */
          .prose, .selectable, input, textarea {
            -webkit-user-select: text;
            user-select: text;
          }
        `}</style>
      )}
      {children}
    </CapacitorContext.Provider>
  )
}

async function initNativePlugins() {
  try {
    // Status Bar
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#0f172a' })

    // Keyboard
    const { Keyboard } = await import('@capacitor/keyboard')
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.paddingBottom = `${info.keyboardHeight}px`
      document.body.style.transition = 'padding-bottom 0.25s ease'
    })
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.paddingBottom = '0px'
    })

    // App - Back button handler
    const { App } = await import('@capacitor/app')
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        App.exitApp()
      }
    })

    // Deep links
    App.addListener('appUrlOpen', (event) => {
      const slug = event.url.split('preparamed://').pop()
      if (slug) {
        window.location.href = `/medicina/${slug}`
      }
    })

    // Splash Screen - esconder
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide({ fadeOutDuration: 500 })

    console.log('[Capacitor] Plugins nativos inicializados com sucesso')
  } catch (error) {
    console.error('[Capacitor] Erro ao inicializar plugins:', error)
  }
}
