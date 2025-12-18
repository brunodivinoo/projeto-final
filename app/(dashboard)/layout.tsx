'use client'
import { Sidebar } from '@/components/layout/Sidebar'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SidebarProvider } from '@/contexts/SidebarContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
            <Sidebar />
            {/* Main content - margin only on desktop */}
            <main className="lg:ml-64">{children}</main>
          </div>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
