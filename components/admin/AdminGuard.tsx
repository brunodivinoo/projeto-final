'use client'

import { useEffect, useState } from 'react'
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
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/medicina/login')
      return
    }

    const adminStatus = isAdmin(user.email)
    setIsAdminUser(adminStatus)
    setChecking(false)

    if (!adminStatus) {
      // Opcional: redirecionar após delay
      const timer = setTimeout(() => {
        router.push('/medicina/dashboard')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [user, authLoading, router])

  // Loading state
  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-white/60">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Não é admin
  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
          <ShieldX className="w-12 h-12 text-red-500" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-white/60 max-w-md">
            Você não tem permissão para acessar esta área.
            Esta seção é restrita a administradores.
          </p>
        </div>
        <p className="text-white/40 text-sm">
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
