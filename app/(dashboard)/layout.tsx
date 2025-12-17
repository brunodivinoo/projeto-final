import { Sidebar } from '@/components/layout/Sidebar'
import { AuthProvider } from '@/contexts/AuthContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#101922]">
        <Sidebar />
        <main className="ml-64">{children}</main>
      </div>
    </AuthProvider>
  )
}
