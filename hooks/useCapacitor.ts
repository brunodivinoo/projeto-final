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
