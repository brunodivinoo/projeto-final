'use client'

import dynamic from 'next/dynamic'
import { Brain, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const FlashcardSystem = dynamic(
  () => import('@/components/medicina/FlashcardSystem').then(m => ({ default: m.FlashcardSystem })),
  { ssr: false, loading: () => <div className="flex items-center justify-center p-12"><div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full" /></div> }
)

export default function FlashcardsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/medicina/dashboard"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Flashcards</h1>
              <p className="text-slate-600 text-sm">Estude com repetição espaçada</p>
            </div>
          </div>
        </div>

        <Link
          href="/medicina/dashboard/ia"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Gerar com IA</span>
        </Link>
      </div>

      {/* Sistema de Flashcards */}
      <FlashcardSystem />
    </div>
  )
}
