'use client'

import { useEffect, useState, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Hook para detectar se estamos rodando dentro do Capacitor (app nativo)
 * e inicializar plugins nativos automaticamente.
 */
export function useCapacitor() {
  const [isNative, setIsNative] = useState(false)
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web')
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const native = Capacitor.isNativePlatform()
    setIsNative(native)
    setPlatform(Capacitor.getPlatform() as 'web' | 'ios' | 'android')

    if (!native) return

    // Inicializar plugins nativos apenas no app
    initNativePlugins()
  }, [])

  return { isNative, platform, isOnline }
}

async function initNativePlugins() {
  try {
    // Status Bar - tema escuro
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#0f172a' })

    // Keyboard - ajustar scroll quando teclado abre
    const { Keyboard } = await import('@capacitor/keyboard')
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.paddingBottom = `${info.keyboardHeight}px`
    })
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.paddingBottom = '0px'
    })

    // App - handler de deep links e back button
    const { App } = await import('@capacitor/app')
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        App.exitApp()
      }
    })

    // Network - monitorar conectividade
    const { Network } = await import('@capacitor/network')
    Network.addListener('networkStatusChange', (status) => {
      document.dispatchEvent(
        new CustomEvent('network-change', { detail: status })
      )
    })

    // Splash Screen - esconder apos carregamento
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide({ fadeOutDuration: 500 })

    console.log('[Capacitor] Plugins nativos inicializados')
  } catch (error) {
    console.error('[Capacitor] Erro ao inicializar plugins:', error)
  }
}

/**
 * Hook para push notifications (usar apenas em componentes que precisam)
 */
export function usePushNotifications() {
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  const requestPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const result = await PushNotifications.requestPermissions()

      if (result.receive === 'granted') {
        await PushNotifications.register()
        setPermissionGranted(true)

        PushNotifications.addListener('registration', (tokenData) => {
          setToken(tokenData.value)
          console.log('[Push] Token:', tokenData.value)
        })

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[Push] Recebida:', notification.title)
        })

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('[Push] Acao:', action.notification.title)
          // Navegar para a rota relevante
          const data = action.notification.data
          if (data?.route) {
            window.location.href = data.route
          }
        })

        return true
      }
      return false
    } catch (error) {
      console.error('[Push] Erro:', error)
      return false
    }
  }, [])

  return { permissionGranted, token, requestPermission }
}

/**
 * Hook para haptics (vibracoes)
 */
export function useHaptics() {
  const vibrate = useCallback(async (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!Capacitor.isNativePlatform()) return

    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      const styles = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      }
      await Haptics.impact({ style: styles[type] })
    } catch {}
  }, [])

  const notification = useCallback(async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (!Capacitor.isNativePlatform()) return

    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics')
      const types = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      }
      await Haptics.notification({ type: types[type] })
    } catch {}
  }, [])

  return { vibrate, notification }
}

/**
 * Hook para share nativo
 */
export function useNativeShare() {
  const share = useCallback(async (opts: { title: string; text?: string; url?: string }) => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback web
      if (navigator.share) {
        await navigator.share(opts)
      }
      return
    }

    try {
      const { Share } = await import('@capacitor/share')
      await Share.share(opts)
    } catch {}
  }, [])

  return { share }
}
