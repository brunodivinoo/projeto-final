'use client'
import { Sidebar } from '@/components/layout/Sidebar'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { XPProvider } from '@/contexts/XPContext'
import { LimitsProvider } from '@/contexts/LimitsContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <XPProvider>
            <LimitsProvider>
              <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
                <Sidebar />
                {/* Main content - margin only on desktop */}
                <main className="lg:ml-64">{children}</main>
              </div>
            </LimitsProvider>
          </XPProvider>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
