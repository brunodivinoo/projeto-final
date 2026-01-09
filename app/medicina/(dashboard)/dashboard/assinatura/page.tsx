'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMedAuth, LIMITES_PLANO } from '@/contexts/MedAuthContext'
import {
  Crown,
  Check,
  X,
  Sparkles,
  Zap,
  Shield,
  CreditCard,
  Calendar,
  AlertCircle,
  ChevronRight
} from 'lucide-react'

const planos = [
  {
    id: 'gratuito',
    nome: 'Gratuito',
    preco: 0,
    periodo: '',
    destaque: false,
    cor: 'slate',
    descricao: 'Para começar seus estudos',
    recursos: [
      { texto: '20 questões por dia', disponivel: true },
      { texto: '2 simulados por mês', disponivel: true },
      { texto: 'Teoria nível básico', disponivel: true },
      { texto: 'Estatísticas básicas', disponivel: true },
      { texto: 'IA Tutora', disponivel: false },
      { texto: 'Flashcards ilimitados', disponivel: false },
      { texto: 'Teoria avançada', disponivel: false },
      { texto: 'Suporte prioritário', disponivel: false },
    ]
  },
  {
    id: 'premium',
    nome: 'Premium',
    preco: 49.90,
    periodo: '/mês',
    destaque: true,
    cor: 'emerald',
    descricao: 'Para quem leva os estudos a sério',
    recursos: [
      { texto: 'Questões ilimitadas', disponivel: true },
      { texto: '10 simulados por mês', disponivel: true },
      { texto: 'Teoria nível avançado', disponivel: true },
      { texto: 'Estatísticas completas', disponivel: true },
      { texto: '100 perguntas IA/mês', disponivel: true },
      { texto: '500 flashcards', disponivel: true },
      { texto: '50 resumos IA/mês', disponivel: true },
      { texto: 'Suporte por e-mail', disponivel: true },
    ]
  },
  {
    id: 'residencia',
    nome: 'Residência',
    preco: 99.90,
    periodo: '/mês',
    destaque: false,
    cor: 'amber',
    descricao: 'Pacote completo para aprovação',
    recursos: [
      { texto: 'Questões ilimitadas', disponivel: true },
      { texto: 'Simulados ilimitados', disponivel: true },
      { texto: 'Teoria nível expert', disponivel: true },
      { texto: 'Estatísticas detalhadas', disponivel: true },
      { texto: 'IA Tutora ilimitada', disponivel: true },
      { texto: 'Flashcards ilimitados', disponivel: true },
      { texto: 'Resumos ilimitados', disponivel: true },
      { texto: 'Suporte prioritário 24h', disponivel: true },
    ]
  }
]

export default function AssinaturaPage() {
  const router = useRouter()
  const { user, plano: planoAtual, assinatura } = useMedAuth()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSelectPlan = async (planoId: string) => {
    if (planoId === planoAtual) return

    setSelectedPlan(planoId)
    setLoading(true)

    // Simular redirecionamento para gateway de pagamento
    setTimeout(() => {
      alert(`Redirecionando para pagamento do plano ${planoId}...\n\nEm produção, aqui seria integrado com Stripe, PagSeguro, etc.`)
      setLoading(false)
      setSelectedPlan(null)
    }, 1500)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Escolha seu Plano
        </h1>
        <p className="text-emerald-200/70 mt-2 max-w-xl mx-auto">
          Invista no seu futuro e conquiste sua vaga na residência médica
        </p>
      </div>

      {/* Current Subscription Card */}
      {assinatura && planoAtual !== 'gratuito' && (
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-6 border border-emerald-500/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-white font-semibold">Assinatura Ativa</span>
              </div>
              <p className="text-emerald-200/80 text-sm">
                Plano {planoAtual.charAt(0).toUpperCase() + planoAtual.slice(1)} •
                Próximo pagamento: {formatDate(assinatura.proximo_pagamento)}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 text-white/60 hover:text-white transition-colors text-sm">
                Gerenciar
              </button>
              <button className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {planos.map((plano) => {
          const isCurrentPlan = plano.id === planoAtual
          const isLoading = loading && selectedPlan === plano.id

          return (
            <div
              key={plano.id}
              className={`relative rounded-2xl p-6 border transition-all ${
                plano.destaque
                  ? 'bg-gradient-to-b from-emerald-500/20 to-teal-500/10 border-emerald-500/50 scale-105'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              {/* Badge */}
              {plano.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold rounded-full">
                    Mais Popular
                  </span>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                    Seu Plano
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <div className={`w-14 h-14 mx-auto rounded-xl mb-4 flex items-center justify-center ${
                  plano.id === 'residencia' ? 'bg-amber-500/20' :
                  plano.id === 'premium' ? 'bg-emerald-500/20' :
                  'bg-white/10'
                }`}>
                  {plano.id === 'residencia' ? (
                    <Crown className="w-7 h-7 text-amber-400" />
                  ) : plano.id === 'premium' ? (
                    <Sparkles className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <Zap className="w-7 h-7 text-white/60" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white">{plano.nome}</h3>
                <p className="text-white/60 text-sm mt-1">{plano.descricao}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-white/60">R$</span>
                  <span className="text-4xl font-bold text-white">
                    {plano.preco === 0 ? '0' : plano.preco.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-white/60">{plano.periodo}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plano.recursos.map((recurso, i) => (
                  <li key={i} className="flex items-center gap-3">
                    {recurso.disponivel ? (
                      <Check className={`w-5 h-5 ${
                        plano.id === 'residencia' ? 'text-amber-400' :
                        plano.id === 'premium' ? 'text-emerald-400' :
                        'text-emerald-400'
                      }`} />
                    ) : (
                      <X className="w-5 h-5 text-white/30" />
                    )}
                    <span className={recurso.disponivel ? 'text-white/80' : 'text-white/40'}>
                      {recurso.texto}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => handleSelectPlan(plano.id)}
                disabled={isCurrentPlan || isLoading}
                className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : plano.destaque
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
                    : plano.id === 'residencia'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                    Processando...
                  </>
                ) : isCurrentPlan ? (
                  'Plano Atual'
                ) : plano.id === 'gratuito' ? (
                  'Usar Gratuito'
                ) : (
                  <>
                    Assinar Agora
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Features Comparison */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-6 text-center">
          Comparação Detalhada
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/60 py-3 px-4">Recurso</th>
                <th className="text-center text-white/60 py-3 px-4">Gratuito</th>
                <th className="text-center text-white/60 py-3 px-4">Premium</th>
                <th className="text-center text-white/60 py-3 px-4">Residência</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="text-white/80 py-3 px-4">Questões por dia</td>
                <td className="text-center text-white/60 py-3 px-4">20</td>
                <td className="text-center text-emerald-400 py-3 px-4">Ilimitadas</td>
                <td className="text-center text-amber-400 py-3 px-4">Ilimitadas</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="text-white/80 py-3 px-4">Simulados por mês</td>
                <td className="text-center text-white/60 py-3 px-4">2</td>
                <td className="text-center text-emerald-400 py-3 px-4">10</td>
                <td className="text-center text-amber-400 py-3 px-4">Ilimitados</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="text-white/80 py-3 px-4">Perguntas IA</td>
                <td className="text-center text-white/40 py-3 px-4">-</td>
                <td className="text-center text-emerald-400 py-3 px-4">100/mês</td>
                <td className="text-center text-amber-400 py-3 px-4">Ilimitadas</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="text-white/80 py-3 px-4">Flashcards</td>
                <td className="text-center text-white/60 py-3 px-4">50</td>
                <td className="text-center text-emerald-400 py-3 px-4">500</td>
                <td className="text-center text-amber-400 py-3 px-4">Ilimitados</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="text-white/80 py-3 px-4">Nível de teoria</td>
                <td className="text-center text-white/60 py-3 px-4">Básico</td>
                <td className="text-center text-emerald-400 py-3 px-4">Avançado</td>
                <td className="text-center text-amber-400 py-3 px-4">Expert</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="text-white/80 py-3 px-4">Anotações</td>
                <td className="text-center text-white/60 py-3 px-4">10</td>
                <td className="text-center text-emerald-400 py-3 px-4">100</td>
                <td className="text-center text-amber-400 py-3 px-4">Ilimitadas</td>
              </tr>
              <tr>
                <td className="text-white/80 py-3 px-4">Suporte</td>
                <td className="text-center text-white/40 py-3 px-4">-</td>
                <td className="text-center text-emerald-400 py-3 px-4">E-mail</td>
                <td className="text-center text-amber-400 py-3 px-4">Prioritário 24h</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-6">Perguntas Frequentes</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Como funciona o pagamento?</h4>
            <p className="text-white/60 text-sm">
              Aceitamos cartões de crédito, débito, PIX e boleto bancário. O pagamento é processado de forma segura através do nosso gateway de pagamento.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Posso cancelar a qualquer momento?</h4>
            <p className="text-white/60 text-sm">
              Sim! Você pode cancelar sua assinatura a qualquer momento. Você continuará tendo acesso até o final do período pago.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Existe garantia de reembolso?</h4>
            <p className="text-white/60 text-sm">
              Oferecemos garantia de 7 dias. Se você não estiver satisfeito, devolvemos 100% do valor pago.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Como faço upgrade do plano?</h4>
            <p className="text-white/60 text-sm">
              Basta escolher o novo plano e pagar a diferença proporcional. O upgrade é imediato.
            </p>
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-4 text-white/40 text-sm">
        <Shield className="w-5 h-5" />
        <span>Pagamento 100% seguro</span>
        <span>•</span>
        <CreditCard className="w-5 h-5" />
        <span>Dados criptografados</span>
      </div>
    </div>
  )
}
