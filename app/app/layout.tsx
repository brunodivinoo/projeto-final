import { PrepaMedAuthProvider } from '@/contexts/PrepaMedAuthContext'
import { Sidebar } from '@/components/prepamed/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrepaMedAuthProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </PrepaMedAuthProvider>
  )
}
