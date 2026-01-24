'use client'

import { useState, useEffect } from 'react'
import { useNutriAuth, formatarIdadeBebe } from '@/contexts/NutriAuthContext'
import {
  User,
  Scale,
  Ruler,
  Target,
  Baby,
  Calendar,
  Save,
  Loader2,
  Check,
  Heart,
  Sparkles,
  AlertCircle,
  Clock,
  CalendarDays,
  HeartPulse
} from 'lucide-react'

export default function PerfilPage() {
  const {
    profile,
    updateProfile,
    imc,
    idadeBebeCalculada,
    semanaGestacaoCalculada,
    trimestreGestacao,
    dppCalculada,
    situacaoAtual
  } = useNutriAuth()

  const [formData, setFormData] = useState({
    nome: profile?.nome || '',
    idade: profile?.idade || null,
    altura: profile?.altura || null,
    peso_inicial: profile?.peso_inicial || null,
    peso_atual: profile?.peso_atual || null,
    peso_meta: profile?.peso_meta || null,
    // Novos campos de maternidade
    data_nascimento_bebe: profile?.data_nascimento_bebe || '',
    amamentando: profile?.amamentando || false,
    // Novos campos de gestacao
    gestante: profile?.gestante || false,
    data_ultima_menstruacao: profile?.data_ultima_menstruacao || '',
    // Plano
    plano: profile?.plano || 'normal'
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [secaoAtiva, setSecaoAtiva] = useState<'dados' | 'gestacao' | 'maternidade'>('dados')

  // Atualizar form quando profile carregar
  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || '',
        idade: profile.idade || null,
        altura: profile.altura || null,
        peso_inicial: profile.peso_inicial || null,
        peso_atual: profile.peso_atual || null,
        peso_meta: profile.peso_meta || null,
        data_nascimento_bebe: profile.data_nascimento_bebe || '',
        amamentando: profile.amamentando || false,
        gestante: profile.gestante || false,
        data_ultima_menstruacao: profile.data_ultima_menstruacao || '',
        plano: profile.plano || 'normal'
      })
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)

    // Preparar dados para salvar
    const dadosParaSalvar: Record<string, unknown> = { ...formData }

    // Se marcou que nao esta gestante, limpar DUM
    if (!formData.gestante) {
      dadosParaSalvar.data_ultima_menstruacao = null
      dadosParaSalvar.semana_gestacao = null
      dadosParaSalvar.data_prevista_parto = null
    }

    // Se nao tem data de nascimento do bebe, limpar campo
    if (!formData.data_nascimento_bebe) {
      dadosParaSalvar.data_nascimento_bebe = null
      dadosParaSalvar.idade_bebe = null
    }

    const success = await updateProfile(dadosParaSalvar)
    setSaving(false)

    if (success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const getIMCCategoria = () => {
    if (!imc) return { texto: 'Nao calculado', cor: 'gray', bg: 'bg-gray-50', border: 'border-gray-200' }
    if (imc < 18.5) return { texto: 'Abaixo do peso', cor: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200' }
    if (imc < 25) return { texto: 'Peso normal', cor: 'green', bg: 'bg-green-50', border: 'border-green-200' }
    if (imc < 30) return { texto: 'Sobrepeso', cor: 'orange', bg: 'bg-orange-50', border: 'border-orange-200' }
    return { texto: 'Obesidade', cor: 'red', bg: 'bg-red-50', border: 'border-red-200' }
  }

  const imcInfo = getIMCCategoria()

  const getSituacaoLabel = () => {
    switch (situacaoAtual) {
      case 'gestante': return { texto: 'Gestante', cor: 'text-pink-600', bg: 'bg-pink-100' }
      case 'amamentando': return { texto: 'Amamentando', cor: 'text-purple-600', bg: 'bg-purple-100' }
      case 'pos_parto': return { texto: 'Pos-parto', cor: 'text-blue-600', bg: 'bg-blue-100' }
      default: return { texto: 'Normal', cor: 'text-gray-600', bg: 'bg-gray-100' }
    }
  }

  const situacaoLabel = getSituacaoLabel()

  // Calcular dias restantes para o parto
  const diasParaParto = dppCalculada
    ? Math.ceil((new Date(dppCalculada).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6 pb-20 lg:pb-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 relative">
          <span className="text-3xl text-white font-bold">
            {formData.nome?.[0]?.toUpperCase() || 'M'}
          </span>
          {situacaoAtual !== 'normal' && (
            <div className={`absolute -bottom-1 -right-1 ${situacaoLabel.bg} ${situacaoLabel.cor} text-xs px-2 py-0.5 rounded-full font-medium`}>
              {situacaoLabel.texto}
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{formData.nome || 'Seu Perfil'}</h1>
        <p className="text-gray-500">Configure suas informacoes</p>
      </div>

      {/* Tabs de navegacao */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setSecaoAtiva('dados')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            secaoAtiva === 'dados'
              ? 'bg-white text-pink-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4" />
          Dados
        </button>
        <button
          onClick={() => setSecaoAtiva('gestacao')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            secaoAtiva === 'gestacao'
              ? 'bg-white text-pink-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          Gestacao
        </button>
        <button
          onClick={() => setSecaoAtiva('maternidade')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            secaoAtiva === 'maternidade'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Baby className="w-4 h-4" />
          Maternidade
        </button>
      </div>

      {/* Secao: Dados Pessoais */}
      {secaoAtiva === 'dados' && (
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
          {imc > 0 && (
            <div className={`p-4 ${imcInfo.bg} rounded-xl border ${imcInfo.border}`}>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Seu IMC</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-gray-800">{imc}</span>
                  <p className={`text-sm text-${imcInfo.cor}-600`}>{imcInfo.texto}</p>
                </div>
              </div>
            </div>
          )}

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
      )}

      {/* Secao: Gestacao */}
      {secaoAtiva === 'gestacao' && (
        <div className="space-y-4">
          {/* Toggle Gestante */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <HeartPulse className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Estou gravida</p>
                  <p className="text-xs text-gray-500">Ative para acompanhar sua gestacao</p>
                </div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, gestante: !formData.gestante })}
                className={`w-14 h-8 rounded-full transition-all ${
                  formData.gestante ? 'bg-pink-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  formData.gestante ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {formData.gestante && (
              <div className="space-y-4 pt-4 border-t border-pink-100">
                {/* DUM */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                    <CalendarDays className="w-4 h-4" />
                    Data da Ultima Menstruacao (DUM)
                  </label>
                  <input
                    type="date"
                    value={formData.data_ultima_menstruacao || ''}
                    onChange={(e) => setFormData({ ...formData, data_ultima_menstruacao: e.target.value })}
                    className="w-full px-4 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Primeiro dia da sua ultima menstruacao
                  </p>
                </div>

                {/* Info da Gestacao calculada */}
                {semanaGestacaoCalculada && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-100">
                      <div className="flex items-center gap-2 text-pink-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">Semana</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{semanaGestacaoCalculada}</p>
                      <p className="text-xs text-gray-500">{trimestreGestacao}o trimestre</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">Faltam</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {diasParaParto && diasParaParto > 0 ? diasParaParto : '—'}
                      </p>
                      <p className="text-xs text-gray-500">dias para o parto</p>
                    </div>
                  </div>
                )}

                {/* DPP */}
                {dppCalculada && (
                  <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-500" />
                        <span className="font-medium text-gray-700">Data Prevista do Parto</span>
                      </div>
                      <span className="font-bold text-pink-600">
                        {new Date(dppCalculada).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dica para gestante */}
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Dica para gestantes</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      A IA vai adaptar todas as refeicoes para sua fase da gestacao,
                      evitando alimentos proibidos e priorizando nutrientes essenciais.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card de info se nao estiver gestante */}
          {!formData.gestante && (
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center">
              <HeartPulse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Ative a opcao acima se voce esta gravida para receber acompanhamento personalizado
              </p>
            </div>
          )}
        </div>
      )}

      {/* Secao: Maternidade */}
      {secaoAtiva === 'maternidade' && (
        <div className="space-y-4">
          {/* Card do Bebe */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Baby className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Dados do Bebe</p>
                <p className="text-xs text-gray-500">Para calcular automaticamente a idade</p>
              </div>
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <CalendarDays className="w-4 h-4" />
                Data de Nascimento do Bebe
              </label>
              <input
                type="date"
                value={formData.data_nascimento_bebe || ''}
                onChange={(e) => setFormData({ ...formData, data_nascimento_bebe: e.target.value })}
                className="w-full px-4 py-3 bg-purple-50 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Idade calculada */}
            {idadeBebeCalculada !== null && idadeBebeCalculada >= 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <span className="font-medium text-gray-700">Idade do bebe</span>
                  </div>
                  <span className="font-bold text-purple-600">
                    {formatarIdadeBebe(idadeBebeCalculada)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Amamentando */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Estou amamentando</p>
                  <p className="text-xs text-gray-500">+500 kcal/dia para lactacao</p>
                </div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, amamentando: !formData.amamentando })}
                className={`w-14 h-8 rounded-full transition-all ${
                  formData.amamentando ? 'bg-purple-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  formData.amamentando ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {formData.amamentando && (
              <div className="mt-4 pt-4 border-t border-purple-100">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 flex gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-purple-800 font-medium">Modo amamentacao ativo</p>
                    <p className="text-xs text-purple-700 mt-1">
                      A IA vai priorizar alimentos que auxiliam na producao de leite
                      e ajustar suas calorias automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info se nao tem bebe cadastrado */}
          {!formData.data_nascimento_bebe && !formData.amamentando && (
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center">
              <Baby className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Cadastre a data de nascimento do seu bebe para acompanhar o desenvolvimento
              </p>
            </div>
          )}
        </div>
      )}

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
