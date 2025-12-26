'use client'
import { Sidebar } from '@/components/layout/Sidebar'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { XPProvider } from '@/contexts/XPContext'
import { LimitsProvider } from '@/contexts/LimitsContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ResumosProvider } from '@/contexts/ResumosContext'
import { GenerationToast } from '@/components/notifications'
import GeracaoFilaGlobal from '@/components/admin/GeracaoFilaGlobal'
import ResumosGlobalPanel from '@/components/ia/ResumosGlobalPanel'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <SidebarProvider>
            <XPProvider>
              <LimitsProvider>
                <ResumosProvider>
                  <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
                    <Sidebar />
                    {/* Main content - margin only on desktop */}
                    <main className="lg:ml-64">{children}</main>
                    {/* Toast global para geracoes em background */}
                    <GenerationToast />
                    {/* Componente global de geração de questões (admin) */}
                    <GeracaoFilaGlobal />
                    {/* Painel global de resumos (acessível de qualquer página) */}
                    <ResumosGlobalPanel />
                  </div>
                </ResumosProvider>
              </LimitsProvider>
            </XPProvider>
          </SidebarProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
