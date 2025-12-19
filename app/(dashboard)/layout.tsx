'use client'
import { Sidebar } from '@/components/layout/Sidebar'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { XPProvider } from '@/contexts/XPContext'
import { LimitsProvider } from '@/contexts/LimitsContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { GenerationToast } from '@/components/notifications'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <SidebarProvider>
            <XPProvider>
              <LimitsProvider>
                <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
                  <Sidebar />
                  {/* Main content - margin only on desktop */}
                  <main className="lg:ml-64">{children}</main>
                  {/* Toast global para geracoes em background */}
                  <GenerationToast />
                </div>
              </LimitsProvider>
            </XPProvider>
          </SidebarProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
