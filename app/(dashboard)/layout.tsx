import { Sidebar } from '@/components/layout/Sidebar'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
          <Sidebar />
          <main className="ml-64">{children}</main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
}
