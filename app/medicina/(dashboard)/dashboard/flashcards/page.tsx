'use client'

import { FlashcardSystem } from '@/components/medicina/FlashcardSystem'
import { Brain, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function FlashcardsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/medicina/dashboard"
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Flashcards</h1>
              <p className="text-white/60 text-sm">Estude com repetição espaçada</p>
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
