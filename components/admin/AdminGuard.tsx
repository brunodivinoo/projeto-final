'use client'

import { useEffect, useState, useRef } from 'react'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldX, ShieldCheck } from 'lucide-react'
import { isAdmin } from '@/lib/admin/auth'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading: authLoading } = useMedAuth()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'admin' | 'denied' | 'unauthenticated'>('loading')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Timeout de segurança - após 8 segundos
    timeoutRef.current = setTimeout(() => {
      if (status === 'loading') {
        if (!user) {
          setStatus('unauthenticated')
        } else {
          // Verificar admin status diretamente
          const adminStatus = isAdmin(user.email)
          setStatus(adminStatus ? 'admin' : 'denied')
        }
      }
    }, 8000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [status, user])

  useEffect(() => {
    // Aguardar auth carregar
    if (authLoading) {
      return
    }

    // Limpar timeout se completou normalmente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Sem usuário = não autenticado
    if (!user) {
      setStatus('unauthenticated')
      return
    }

    // Verificar se é admin
    const adminStatus = isAdmin(user.email)
    console.log('[AdminGuard] Verificando admin:', { email: user.email, isAdmin: adminStatus })
    setStatus(adminStatus ? 'admin' : 'denied')
  }, [user, authLoading])

  // Redirecionar se não autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/medicina/login')
    }
  }, [status, router])

  // Redirecionar se não é admin (com delay)
  useEffect(() => {
    if (status === 'denied') {
      const timer = setTimeout(() => {
        router.push('/medicina/dashboard')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [status, router])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Não autenticado (redirecionando)
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-600">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  // Não é admin
  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
          <ShieldX className="w-12 h-12 text-red-500" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-slate-600 max-w-md">
            Você não tem permissão para acessar esta área.
            Esta seção é restrita a administradores.
          </p>
          {user && (
            <p className="text-slate-500 text-xs mt-2">
              Logado como: {user.email}
            </p>
          )}
        </div>
        <p className="text-slate-500 text-sm">
          Redirecionando em alguns segundos...
        </p>
      </div>
    )
  }

  // É admin - renderizar children
  return <>{children}</>
}

// Badge de admin verificado para exibir no header
export function AdminBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full">
      <ShieldCheck className="w-4 h-4 text-amber-400" />
      <span className="text-sm font-medium text-amber-300">Admin</span>
    </div>
  )
}
