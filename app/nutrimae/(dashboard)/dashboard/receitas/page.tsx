'use client'

import { useState } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import {
  ChefHat,
  Sparkles,
  Clock,
  Flame,
  Loader2,
  RefreshCw
} from 'lucide-react'

const TIPOS_RECEITA = [
  { id: 'cafe', label: 'Cafe da Manha', icon: '☀️' },
  { id: 'lanche', label: 'Lanche', icon: '🍎' },
  { id: 'almoco', label: 'Almoco/Jantar', icon: '🍽️' },
  { id: 'sobremesa', label: 'Sobremesa Fit', icon: '🍨' },
  { id: 'smoothie', label: 'Smoothie', icon: '🥤' },
  { id: 'sopa', label: 'Sopa', icon: '🥣' }
]

export default function ReceitasPage() {
  const { user } = useNutriAuth()
  const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null)
  const [receita, setReceita] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const gerarReceita = async (tipo: string) => {
    setTipoSelecionado(tipo)
    setLoading(true)
    setReceita(null)

    try {
      const response = await fetch('/api/nutrimae/ia', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          userId: user?.id
        })
      })

      const data = await response.json()
      if (data.receita) {
        setReceita(data.receita)
      }
    } catch (err) {
      console.error('Erro ao gerar receita:', err)
      setReceita('Erro ao gerar receita. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center">
          <ChefHat className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Receitas IA</h1>
          <p className="text-gray-500">Receitas personalizadas para voce</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-4 border border-orange-100">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-700 font-medium">Receitas feitas pela IA</p>
            <p className="text-sm text-gray-500 mt-1">
              Escolha um tipo de refeicao e a IA vai criar uma receita nutritiva, rapida e deliciosa para voce!
            </p>
          </div>
        </div>
      </div>

      {/* Tipos de Receita */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">O que voce quer fazer?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TIPOS_RECEITA.map((tipo) => (
            <button
              key={tipo.id}
              onClick={() => gerarReceita(tipo.id)}
              disabled={loading}
              className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md disabled:opacity-50 ${
                tipoSelecionado === tipo.id
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-100 bg-white hover:border-orange-200'
              }`}
            >
              <span className="text-2xl mb-2 block">{tipo.icon}</span>
              <p className="font-medium text-gray-800">{tipo.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Criando sua receita...</p>
          <p className="text-sm text-gray-400 mt-1">Isso pode levar alguns segundos</p>
        </div>
      )}

      {/* Receita Gerada */}
      {receita && !loading && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-lg">Sua Receita</h2>
            <button
              onClick={() => tipoSelecionado && gerarReceita(tipoSelecionado)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Gerar outra receita"
            >
              <RefreshCw className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">
              {receita}
            </pre>
          </div>
        </div>
      )}

      {/* Dicas */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-3">Dicas para suas receitas</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 font-medium">Prepare com antecedencia</p>
              <p className="text-xs text-gray-500">Deixe ingredientes cortados e organizados</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Flame className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 font-medium">Congele porcoes</p>
              <p className="text-xs text-gray-500">Faca em quantidade e congele para a semana</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 font-medium">Adapte ao seu gosto</p>
              <p className="text-xs text-gray-500">Substitua ingredientes conforme disponibilidade</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
