// ============================================================
// ServiceWorkerRegistration.tsx
// ============================================================
// Componente responsavel por registrar e gerenciar o Service Worker
// Inclui logica de atualizacao, notificacao ao usuario e tratamento de erros
// ============================================================

'use client'

import { useEffect, useState, useCallback } from 'react'

// ============================================================
// CONFIGURACAO
// ============================================================

// Caminho do service worker
const SW_PATH = '/sw.js'

// Intervalo para verificar atualizacoes (em ms)
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000 // 1 hora

// ============================================================
// TIPOS
// ============================================================

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isOnline: boolean
  hasUpdate: boolean
  registration: ServiceWorkerRegistration | null
}

interface ServiceWorkerRegistrationProps {
  // Callback quando SW e registrado com sucesso
  onRegistered?: (registration: ServiceWorkerRegistration) => void
  // Callback quando atualizacao esta disponivel
  onUpdateAvailable?: () => void
  // Callback quando SW assume controle
  onControlling?: () => void
  // Callback de erro
  onError?: (error: Error) => void
  // Mostrar UI de atualizacao (default: true)
  showUpdateUI?: boolean
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function ServiceWorkerRegistration({
  onRegistered,
  onUpdateAvailable,
  onControlling,
  onError,
  showUpdateUI = true
}: ServiceWorkerRegistrationProps) {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    hasUpdate: false,
    registration: null
  })

  const [showUpdateBanner, setShowUpdateBanner] = useState(false)

  // ============================================================
  // FUNCAO DE REGISTRO
  // ============================================================
  const registerServiceWorker = useCallback(async () => {
    // Verifica suporte a Service Workers
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Workers nao suportado neste navegador')
      return
    }

    setState(prev => ({ ...prev, isSupported: true }))

    try {
      // Registra o service worker
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        scope: '/',
        updateViaCache: 'none' // Sempre verifica atualizacoes
      })

      console.log('[PWA] Service Worker registrado com sucesso')
      console.log('[PWA] Escopo:', registration.scope)

      setState(prev => ({
        ...prev,
        isRegistered: true,
        registration
      }))

      // Callback de sucesso
      onRegistered?.(registration)

      // Listener para atualizacoes
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing

        if (newWorker) {
          console.log('[PWA] Nova versao do SW encontrada, instalando...')

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              // Novo SW instalado
              if (navigator.serviceWorker.controller) {
                // Existe um SW antigo, atualizacao disponivel
                console.log('[PWA] Atualizacao disponivel!')
                setState(prev => ({ ...prev, hasUpdate: true }))
                setShowUpdateBanner(true)
                onUpdateAvailable?.()
              } else {
                // Primeira instalacao
                console.log('[PWA] App pronto para uso offline!')
              }
            }
          })
        }
      })

      // Verifica atualizacoes periodicamente
      setInterval(() => {
        registration.update().catch(console.error)
      }, UPDATE_CHECK_INTERVAL)

      // Verifica se ja tem atualizacao pendente
      if (registration.waiting) {
        console.log('[PWA] Atualizacao pendente detectada')
        setState(prev => ({ ...prev, hasUpdate: true }))
        setShowUpdateBanner(true)
        onUpdateAvailable?.()
      }

    } catch (error) {
      console.error('[PWA] Erro ao registrar Service Worker:', error)
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [onRegistered, onUpdateAvailable, onError])

  // ============================================================
  // FUNCAO DE ATUALIZACAO
  // ============================================================
  const applyUpdate = useCallback(() => {
    const { registration } = state

    if (registration?.waiting) {
      // Envia mensagem para o SW ativar imediatamente
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }, [state])

  // ============================================================
  // LISTENERS DE CONEXAO
  // ============================================================
  useEffect(() => {
    const handleOnline = () => {
      console.log('[PWA] Conexao restaurada')
      setState(prev => ({ ...prev, isOnline: true }))
    }

    const handleOffline = () => {
      console.log('[PWA] Conexao perdida')
      setState(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ============================================================
  // LISTENER DE CONTROLE DO SW
  // ============================================================
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleControllerChange = () => {
      console.log('[PWA] Novo SW assumiu controle, recarregando...')
      onControlling?.()
      // Recarrega a pagina para usar o novo SW
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [onControlling])

  // ============================================================
  // REGISTRO INICIAL
  // ============================================================
  useEffect(() => {
    // 🔴 TEMPORARIAMENTE DESABILITADO PARA FIX DE AUTH
    // Service Worker está cacheando bundles JavaScript antigos
    // Causando problema crítico de autenticação
    // TODO: Reabilitar após resolver problema de cache de bundles
    console.log('[PWA] Service Worker DESABILITADO temporariamente (fix de auth)')
    return

    // Aguarda a pagina carregar completamente
    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker)
      return () => window.removeEventListener('load', registerServiceWorker)
    }
  }, [registerServiceWorker])

  // ============================================================
  // LISTENER DE MENSAGENS DO SW
  // ============================================================
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      const { type, version } = event.data || {}

      if (type === 'SW_ACTIVATED') {
        console.log('[PWA] SW ativado, versao:', version)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  // ============================================================
  // RENDER: Banner de Atualizacao
  // ============================================================
  if (!showUpdateUI || !showUpdateBanner) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(99, 102, 241, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 9999,
        maxWidth: '90vw',
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
          Nova versao disponivel!
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Atualize para obter as ultimas melhorias
        </div>
      </div>

      <button
        onClick={() => {
          setShowUpdateBanner(false)
          applyUpdate()
        }}
        style={{
          background: 'white',
          color: '#6366f1',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'transform 0.2s',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        Atualizar
      </button>

      <button
        onClick={() => setShowUpdateBanner(false)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '4px',
          opacity: 0.7
        }}
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  )
}

// ============================================================
// HOOK PARA USO EM COMPONENTES
// ============================================================

export function useServiceWorker() {
  const [state, setState] = useState({
    isSupported: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    registration: null as ServiceWorkerRegistration | null
  })

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    setState(prev => ({ ...prev, isSupported: true }))

    navigator.serviceWorker.ready.then(registration => {
      setState(prev => ({ ...prev, registration }))
    })

    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Funcao para limpar todos os caches
  const clearCaches = useCallback(async () => {
    if (state.registration?.active) {
      const messageChannel = new MessageChannel()
      return new Promise<boolean>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data?.success || false)
        }
        state.registration!.active!.postMessage(
          { type: 'CLEAR_ALL_CACHES' },
          [messageChannel.port2]
        )
      })
    }
    return false
  }, [state.registration])

  // Funcao para obter versao do SW
  const getVersion = useCallback(async () => {
    if (state.registration?.active) {
      const messageChannel = new MessageChannel()
      return new Promise<string>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data?.version || 'unknown')
        }
        state.registration!.active!.postMessage(
          { type: 'GET_VERSION' },
          [messageChannel.port2]
        )
      })
    }
    return 'not-registered'
  }, [state.registration])

  return {
    ...state,
    clearCaches,
    getVersion
  }
}

export default ServiceWorkerRegistration
