'use client'

import { useEffect } from 'react'

interface ErrorTrackingOptions {
  userId?: string
  enabled?: boolean
}

export function useErrorTracking({ userId, enabled = true }: ErrorTrackingOptions = {}) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const logError = async (
      errorType: string,
      errorMessage: string,
      errorStack?: string,
      metadata?: Record<string, unknown>
    ) => {
      try {
        await fetch('/api/medicina/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            errorType,
            errorMessage,
            errorStack,
            pagina: window.location.pathname,
            url: window.location.href,
            userAgent: navigator.userAgent,
            metadata
          })
        })
      } catch (e) {
        // Silenciosamente falha para não criar loop
        console.error('Erro ao registrar:', e)
      }
    }

    // Capturar erros globais
    const handleError = (event: ErrorEvent) => {
      logError(
        'window_error',
        event.message,
        event.error?.stack,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      )
    }

    // Capturar promessas não tratadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      logError(
        'unhandled_rejection',
        error?.message || String(error),
        error?.stack
      )
    }

    // Capturar erros de fetch
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)

        // Logar erros de API (5xx)
        if (response.status >= 500) {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.toString()
          logError(
            'api_error',
            `API Error ${response.status}: ${url}`,
            undefined,
            { status: response.status, url }
          )
        }

        return response
      } catch (error) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.toString()
        logError(
          'fetch_error',
          error instanceof Error ? error.message : 'Fetch failed',
          error instanceof Error ? error.stack : undefined,
          { url }
        )
        throw error
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.fetch = originalFetch
    }
  }, [userId, enabled])
}
