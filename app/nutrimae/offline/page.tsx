'use client'

import { WifiOff, RefreshCw, Heart } from 'lucide-react'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-rose-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Voce esta offline</h1>
        <p className="text-gray-500 mb-6">
          Parece que voce nao esta conectada a internet. Verifique sua conexao e tente novamente.
        </p>

        <button
          onClick={handleRetry}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:from-pink-600 hover:to-purple-600 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          Tentar novamente
        </button>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 text-pink-500">
            <Heart className="w-5 h-5" />
            <span className="font-medium">NutriMae</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Sua jornada fitness continua quando voce voltar!
          </p>
        </div>
      </div>
    </div>
  )
}
