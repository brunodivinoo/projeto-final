'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  userId?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enviar erro para o servidor
    this.logError(error, errorInfo)
  }

  async logError(error: Error, errorInfo: ErrorInfo) {
    try {
      await fetch('/api/medicina/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.props.userId,
          errorType: 'react_error',
          errorMessage: error.message,
          errorStack: error.stack,
          componentStack: errorInfo.componentStack,
          pagina: typeof window !== 'undefined' ? window.location.pathname : null,
          url: typeof window !== 'undefined' ? window.location.href : null,
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : null
        })
      })
    } catch (e) {
      console.error('Erro ao registrar erro:', e)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Ops! Algo deu errado</h2>
            <p className="text-slate-600 mb-6">
              Encontramos um problema inesperado. O erro já foi registrado e nossa equipe será notificada.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar
              </button>
              <a
                href="/medicina/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Voltar ao início
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
