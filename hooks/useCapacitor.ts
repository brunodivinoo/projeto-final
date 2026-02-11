'use client'

import { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'

export type Platform = 'web' | 'ios' | 'android'

interface CapacitorState {
  isNative: boolean
  platform: Platform
  isReady: boolean
}

/**
 * Hook para detectar se o app esta rodando em modo nativo (Capacitor)
 * ou no browser (PWA). Fornece informacoes sobre a plataforma.
 */
export function useCapacitor(): CapacitorState {
  const [state, setState] = useState<CapacitorState>({
    isNative: false,
    platform: 'web',
    isReady: false,
  })

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform()
    const platform = Capacitor.getPlatform() as Platform

    setState({
      isNative,
      platform,
      isReady: true,
    })
  }, [])

  return state
}

/**
 * Verifica se um plugin especifico do Capacitor esta disponivel
 */
export function useCapacitorPlugin(pluginName: string): boolean {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    setAvailable(Capacitor.isPluginAvailable(pluginName))
  }, [pluginName])

  return available
}

/**
 * Hook para gerenciar o estado de rede (online/offline)
 * Usa o plugin Network do Capacitor quando nativo, fallback para navigator.onLine
 */
export function useNetworkStatus() {
  const { isNative } = useCapacitor()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (isNative && Capacitor.isPluginAvailable('Network')) {
      import('@capacitor/network').then(({ Network }) => {
        Network.getStatus().then(status => setIsOnline(status.connected))

        const listener = Network.addListener('networkStatusChange', status => {
          setIsOnline(status.connected)
        })

        return () => {
          listener.then(l => l.remove())
        }
      })
    } else {
      setIsOnline(navigator.onLine)

      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [isNative])

  return isOnline
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
          const data = action.notification.data
          if (data?.route) {
            window.location.href = data.route as string
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
    } catch { /* noop */ }
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
    } catch { /* noop */ }
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
    } catch { /* noop */ }
  }, [])

  return { share }
}
