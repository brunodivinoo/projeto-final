'use client'

import { useState } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import {
  User,
  Scale,
  Ruler,
  Target,
  Baby,
  Calendar,
  Save,
  Loader2,
  Check
} from 'lucide-react'

export default function PerfilPage() {
  const { profile, updateProfile, imc } = useNutriAuth()
  const [formData, setFormData] = useState({
    nome: profile?.nome || '',
    idade: profile?.idade || null,
    altura: profile?.altura || null,
    peso_inicial: profile?.peso_inicial || null,
    peso_atual: profile?.peso_atual || null,
    peso_meta: profile?.peso_meta || null,
    idade_bebe: profile?.idade_bebe || null,
    amamentando: profile?.amamentando || false,
    plano: profile?.plano || 'normal'
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const success = await updateProfile(formData)
    setSaving(false)

    if (success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const getIMCCategoria = () => {
    if (!imc) return { texto: 'Nao calculado', cor: 'gray' }
    if (imc < 18.5) return { texto: 'Abaixo do peso', cor: 'yellow' }
    if (imc < 25) return { texto: 'Peso normal', cor: 'green' }
    if (imc < 30) return { texto: 'Sobrepeso', cor: 'orange' }
    return { texto: 'Obesidade', cor: 'red' }
  }

  const imcInfo = getIMCCategoria()

  return (
    <div className="space-y-6 pb-20 lg:pb-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-white font-bold">
            {formData.nome?.[0]?.toUpperCase() || 'M'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{formData.nome || 'Seu Perfil'}</h1>
        <p className="text-gray-500">Configure suas informacoes</p>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100 space-y-5">
        {/* Nome */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
            <User className="w-4 h-4" />
            Nome
          </label>
          <input
            type="text"
            value={formData.nome || ''}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full px-4 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
            placeholder="Seu nome"
          />
        </div>

        {/* Idade e Altura */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Calendar className="w-4 h-4" />
              Idade
            </label>
            <input
              type="number"
              value={formData.idade || ''}
              onChange={(e) => setFormData({ ...formData, idade: Number(e.target.value) || null })}
              className="w-full px-4 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="Anos"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Ruler className="w-4 h-4" />
              Altura (m)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.altura || ''}
              onChange={(e) => setFormData({ ...formData, altura: Number(e.target.value) || null })}
              className="w-full px-4 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="1.65"
            />
          </div>
        </div>

        {/* Pesos */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-600 mb-2">
              <Scale className="w-4 h-4" />
              Inicial
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.peso_inicial || ''}
              onChange={(e) => setFormData({ ...formData, peso_inicial: Number(e.target.value) || null })}
              className="w-full px-3 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-center"
              placeholder="kg"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-600 mb-2">
              <Scale className="w-4 h-4" />
              Atual
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.peso_atual || ''}
              onChange={(e) => setFormData({ ...formData, peso_atual: Number(e.target.value) || null })}
              className="w-full px-3 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-center"
              placeholder="kg"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-600 mb-2">
              <Target className="w-4 h-4" />
              Meta
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.peso_meta || ''}
              onChange={(e) => setFormData({ ...formData, peso_meta: Number(e.target.value) || null })}
              className="w-full px-3 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-center"
              placeholder="kg"
            />
          </div>
        </div>

        {/* IMC Info */}
        {imc && (
          <div className={`p-4 bg-${imcInfo.cor}-50 rounded-xl border border-${imcInfo.cor}-200`}>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Seu IMC</span>
              <div className="text-right">
                <span className="text-xl font-bold text-gray-800">{imc}</span>
                <p className={`text-sm text-${imcInfo.cor}-600`}>{imcInfo.texto}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bebe */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
            <Baby className="w-4 h-4" />
            Idade do bebe (dias)
          </label>
          <input
            type="number"
            value={formData.idade_bebe || ''}
            onChange={(e) => setFormData({ ...formData, idade_bebe: Number(e.target.value) || null })}
            className="w-full px-4 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
            placeholder="Dias desde o nascimento"
          />
        </div>

        {/* Amamentando */}
        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Baby className="w-5 h-5 text-purple-500" />
            <span className="font-medium text-gray-700">Esta amamentando?</span>
          </div>
          <button
            onClick={() => setFormData({ ...formData, amamentando: !formData.amamentando })}
            className={`w-12 h-7 rounded-full transition-all ${
              formData.amamentando ? 'bg-purple-500' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              formData.amamentando ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Plano */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-3">Seu Plano</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormData({ ...formData, plano: 'normal' })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                formData.plano === 'normal'
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-300'
              }`}
            >
              <p className="font-semibold text-gray-800">Equilibrado</p>
              <p className="text-xs text-gray-500 mt-1">1900 kcal/dia</p>
              <p className="text-xs text-pink-500">2-3 kg/mes</p>
            </button>
            <button
              onClick={() => setFormData({ ...formData, plano: 'restritivo' })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                formData.plano === 'restritivo'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <p className="font-semibold text-gray-800">Acelerado</p>
              <p className="text-xs text-gray-500 mt-1">1300 kcal/dia</p>
              <p className="text-xs text-purple-500">ate 5 kg/mes</p>
            </button>
          </div>
        </div>
      </div>

      {/* Botao Salvar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
        }`}
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Salvando...
          </>
        ) : saved ? (
          <>
            <Check className="w-5 h-5" />
            Salvo!
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Salvar Alteracoes
          </>
        )}
      </button>
    </div>
  )
}
