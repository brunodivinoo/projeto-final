'use client'

import { useState, useEffect } from 'react'
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
  ChevronRight,
  Clock,
  Award,
  TrendingUp,
  Users,
  Star,
  Gift,
  Rocket,
  ArrowRight,
  BadgeCheck,
  Timer,
  Flame
} from 'lucide-react'

// URLs de checkout do Cakto - substituir pelos links reais
const CHECKOUT_URLS = {
  premium: process.env.NEXT_PUBLIC_CAKTO_CHECKOUT_PREMIUM || '#',
  residencia: process.env.NEXT_PUBLIC_CAKTO_CHECKOUT_RESIDENCIA || '#'
}

const planos = [
  {
    id: 'gratuito',
    nome: 'Gratuito',
    preco: 0,
    precoOriginal: 0,
    periodo: '',
    destaque: false,
    cor: 'slate',
    badge: 'BÁSICO',
    badgeCor: 'bg-white/10 text-white/60',
    descricao: 'Para conhecer a plataforma',
    economia: null,
    recursos: [
      { texto: '10 questões por dia', disponivel: true, destaque: false },
      { texto: 'Teoria nível básico', disponivel: true, destaque: false },
      { texto: 'Estatísticas básicas', disponivel: true, destaque: false },
      { texto: 'Simulados', disponivel: false, destaque: false },
      { texto: 'IA Tutora', disponivel: false, destaque: false },
      { texto: 'Flashcards', disponivel: false, destaque: false },
      { texto: 'Resumos IA', disponivel: false, destaque: false },
      { texto: 'Suporte prioritário', disponivel: false, destaque: false },
    ]
  },
  {
    id: 'premium',
    nome: 'Premium',
    preco: 59.90,
    precoOriginal: 79.90,
    periodo: '/mês',
    destaque: true,
    cor: 'emerald',
    badge: '⭐ MAIS ESCOLHIDO',
    badgeCor: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
    desconto: '-25%',
    descricao: 'Para quem leva os estudos a sério',
    economia: 'R$240/ano',
    recursos: [
      { texto: 'Questões ilimitadas', disponivel: true, destaque: true },
      { texto: '5 simulados por mês', disponivel: true, destaque: false },
      { texto: 'Teoria nível avançado', disponivel: true, destaque: false },
      { texto: 'Estatísticas completas', disponivel: true, destaque: false },
      { texto: '100 perguntas IA/mês', disponivel: true, destaque: true },
      { texto: '50 flashcards', disponivel: true, destaque: false },
      { texto: '15 resumos IA/mês', disponivel: true, destaque: false },
      { texto: 'Suporte por e-mail', disponivel: true, destaque: false },
    ]
  },
  {
    id: 'residencia',
    nome: 'Residência',
    preco: 149.90,
    precoOriginal: 249.90,
    periodo: '/mês',
    destaque: false,
    cor: 'amber',
    badge: '👑 COMPLETO',
    badgeCor: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    desconto: '-40%',
    descricao: 'Pacote definitivo para aprovação',
    economia: 'R$1.200/ano',
    recursos: [
      { texto: 'Tudo do Premium +', disponivel: true, destaque: true },
      { texto: 'Simulados ilimitados', disponivel: true, destaque: true },
      { texto: 'Teoria nível expert', disponivel: true, destaque: false },
      { texto: 'Estatísticas avançadas', disponivel: true, destaque: false },
      { texto: 'IA Tutora ilimitada', disponivel: true, destaque: true },
      { texto: 'Flashcards ilimitados', disponivel: true, destaque: false },
      { texto: 'Resumos ilimitados', disponivel: true, destaque: false },
      { texto: 'Suporte prioritário 24h', disponivel: true, destaque: true },
    ]
  }
]

export default function AssinaturaPage() {
  const router = useRouter()
  const { user, plano: planoAtual, assinatura, limites } = useMedAuth()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 })

  // Countdown timer para urgência - PERSISTENTE no localStorage
  useEffect(() => {
    const STORAGE_KEY = 'preparamed_oferta_expira'
    const DURACAO_OFERTA = 24 * 60 * 60 * 1000 // 24 horas em ms

    // Verificar se já existe uma data de expiração salva
    let dataExpiracao: number
    const salvo = localStorage.getItem(STORAGE_KEY)

    if (salvo) {
      dataExpiracao = parseInt(salvo, 10)
    } else {
      // Primeira visita - criar data de expiração
      dataExpiracao = Date.now() + DURACAO_OFERTA
      localStorage.setItem(STORAGE_KEY, dataExpiracao.toString())
    }

    const calcularTempoRestante = () => {
      const agora = Date.now()
      const restante = Math.max(0, dataExpiracao - agora)

      if (restante <= 0) {
        // Oferta expirou - renovar para criar nova urgência
        const novaExpiracao = Date.now() + DURACAO_OFERTA
        localStorage.setItem(STORAGE_KEY, novaExpiracao.toString())
        return { hours: 23, minutes: 59, seconds: 59 }
      }

      const hours = Math.floor(restante / (60 * 60 * 1000))
      const minutes = Math.floor((restante % (60 * 60 * 1000)) / (60 * 1000))
      const seconds = Math.floor((restante % (60 * 1000)) / 1000)

      return { hours, minutes, seconds }
    }

    // Definir tempo inicial
    setTimeLeft(calcularTempoRestante())

    // Atualizar a cada segundo
    const timer = setInterval(() => {
      setTimeLeft(calcularTempoRestante())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleSelectPlan = async (planoId: string) => {
    if (planoId === planoAtual || planoId === 'gratuito') return

    setSelectedPlan(planoId)
    setLoading(true)

    // Redirecionar para checkout do Cakto
    const checkoutUrl = CHECKOUT_URLS[planoId as keyof typeof CHECKOUT_URLS]

    if (checkoutUrl && checkoutUrl !== '#') {
      // Adicionar utm_content com user_id para associar pagamento
      const urlWithUserId = `${checkoutUrl}${checkoutUrl.includes('?') ? '&' : '?'}utm_content=${user?.id}`
      window.location.href = urlWithUserId
    } else {
      // Fallback se URL não configurada
      setTimeout(() => {
        alert(`Configure a variável NEXT_PUBLIC_CAKTO_CHECKOUT_${planoId.toUpperCase()} com o link de checkout do Cakto`)
        setLoading(false)
        setSelectedPlan(null)
      }, 1000)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const planoAtualData = planos.find(p => p.id === planoAtual)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header com urgência */}
      <div className="text-center">
        {/* Timer de urgência */}
        {planoAtual === 'gratuito' && (
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-full mb-6">
            <Flame className="w-5 h-5 text-red-400 animate-pulse" />
            <span className="text-red-300 text-sm font-medium">Oferta expira em:</span>
            <div className="flex items-center gap-1 font-mono font-bold text-white">
              <span className="bg-red-500/30 px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-red-400">:</span>
              <span className="bg-red-500/30 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-red-400">:</span>
              <span className="bg-red-500/30 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>
        )}

        <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">
          {planoAtual === 'gratuito' ? (
            <>Desbloqueie todo o <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">potencial</span></>
          ) : (
            <>Seu Plano <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{planoAtualData?.nome}</span></>
          )}
        </h1>
        <p className="text-emerald-200/70 max-w-xl mx-auto">
          {planoAtual === 'gratuito'
            ? 'Junte-se a milhares de estudantes que já estão acelerando seus estudos'
            : 'Gerencie sua assinatura e aproveite todos os recursos'
          }
        </p>

        {/* Social proof */}
        {planoAtual === 'gratuito' && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="flex -space-x-2">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-emerald-950 flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
              ))}
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-medium">+2.847 novos assinantes</p>
              <p className="text-emerald-400/60 text-xs">nos últimos 7 dias</p>
            </div>
          </div>
        )}
      </div>

      {/* Current Subscription Card - Para assinantes */}
      {assinatura && planoAtual !== 'gratuito' && (
        <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 rounded-2xl p-6 border border-emerald-500/30 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                planoAtual === 'residencia' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
              }`}>
                {planoAtual === 'residencia' ? (
                  <Crown className="w-7 h-7 text-amber-400" />
                ) : (
                  <Sparkles className="w-7 h-7 text-emerald-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-lg">Plano {planoAtualData?.nome}</span>
                  <BadgeCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-emerald-200/70 text-sm">
                  Próximo pagamento: <span className="text-white">{formatDate(assinatura.proximo_pagamento)}</span>
                </p>
                <p className="text-emerald-200/50 text-xs mt-1">
                  Assinante desde {formatDate(assinatura.data_inicio)}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button className="px-5 py-2.5 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all text-sm font-medium">
                Ver histórico
              </button>
              <button className="px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all text-sm font-medium">
                Cancelar assinatura
              </button>
            </div>
          </div>

          {/* Usage stats */}
          {limites && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-emerald-500/20">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{limites.questoes_dia || 0}</p>
                <p className="text-emerald-200/50 text-xs">Questões hoje</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{limites.simulados_mes || 0}</p>
                <p className="text-emerald-200/50 text-xs">Simulados este mês</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{limites.perguntas_ia_mes || 0}</p>
                <p className="text-emerald-200/50 text-xs">Perguntas IA</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{limites.resumos_ia_mes || 0}</p>
                <p className="text-emerald-200/50 text-xs">Resumos IA</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {planos.map((plano) => {
          const isCurrentPlan = plano.id === planoAtual
          const isLoading = loading && selectedPlan === plano.id
          const isUpgrade = planos.findIndex(p => p.id === plano.id) > planos.findIndex(p => p.id === planoAtual)

          return (
            <div
              key={plano.id}
              className={`relative rounded-2xl p-6 transition-all ${
                plano.destaque
                  ? 'bg-gradient-to-b from-emerald-500/30 via-emerald-500/20 to-teal-500/10 border-2 border-emerald-400 md:scale-105 md:-translate-y-4 shadow-2xl shadow-emerald-500/20'
                  : plano.id === 'residencia'
                  ? 'bg-gradient-to-b from-amber-500/20 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
            >
              {/* Badge principal */}
              {(plano.destaque || plano.id === 'residencia') && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className={`px-4 py-1.5 ${plano.badgeCor} text-sm font-bold rounded-full shadow-lg whitespace-nowrap`}>
                    {plano.badge}
                  </span>
                </div>
              )}

              {/* Desconto badge */}
              {plano.desconto && (
                <div className="absolute -right-2 top-8 rotate-12">
                  <span className="px-3 py-1 bg-red-500 rounded-full text-white text-xs font-bold shadow-lg">
                    {plano.desconto}
                  </span>
                </div>
              )}

              {/* Current plan badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Seu Plano
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6 pt-2">
                {plano.id === 'gratuito' && (
                  <span className={`inline-block px-3 py-1 ${plano.badgeCor} rounded-full text-xs font-medium mb-4`}>
                    {plano.badge}
                  </span>
                )}

                <div className={`w-16 h-16 mx-auto rounded-2xl mb-4 flex items-center justify-center ${
                  plano.id === 'residencia' ? 'bg-amber-500/20' :
                  plano.id === 'premium' ? 'bg-emerald-500/20' :
                  'bg-white/10'
                }`}>
                  {plano.id === 'residencia' ? (
                    <Crown className="w-8 h-8 text-amber-400" />
                  ) : plano.id === 'premium' ? (
                    <Rocket className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <Zap className="w-8 h-8 text-white/60" />
                  )}
                </div>

                <h3 className="text-2xl font-bold text-white">{plano.nome}</h3>
                <p className="text-white/50 text-sm mt-1">{plano.descricao}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                {plano.precoOriginal > plano.preco && (
                  <div className="mb-1">
                    <span className="text-white/40 line-through text-lg">
                      R${plano.precoOriginal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-white/60 text-xl">R$</span>
                  <span className="text-5xl font-black text-white">
                    {plano.preco === 0 ? '0' : Math.floor(plano.preco)}
                  </span>
                  {plano.preco > 0 && (
                    <span className="text-white/60 text-xl">
                      ,{(plano.preco % 1).toFixed(2).slice(2)}
                    </span>
                  )}
                  <span className={`text-sm ${
                    plano.id === 'residencia' ? 'text-amber-300' :
                    plano.id === 'premium' ? 'text-emerald-300' :
                    'text-white/50'
                  }`}>{plano.periodo}</span>
                </div>
                {plano.economia && (
                  <p className={`text-sm mt-2 font-medium ${
                    plano.id === 'residencia' ? 'text-amber-300' : 'text-emerald-300'
                  }`}>
                    💰 Economia de {plano.economia}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plano.recursos.map((recurso, i) => (
                  <li key={i} className="flex items-center gap-3">
                    {recurso.disponivel ? (
                      <Check className={`w-5 h-5 flex-shrink-0 ${
                        plano.id === 'residencia' ? 'text-amber-400' :
                        plano.id === 'premium' ? 'text-emerald-400' :
                        'text-emerald-400/50'
                      }`} />
                    ) : (
                      <X className="w-5 h-5 text-white/20 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${
                      recurso.disponivel
                        ? recurso.destaque
                          ? 'text-white font-medium'
                          : 'text-white/70'
                        : 'text-white/30'
                    }`}>
                      {recurso.texto}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => handleSelectPlan(plano.id)}
                disabled={isCurrentPlan || isLoading || plano.id === 'gratuito'}
                className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-base ${
                  isCurrentPlan || plano.id === 'gratuito'
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : plano.destaque
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/30'
                    : plano.id === 'residencia'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/30'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                    Redirecionando...
                  </>
                ) : isCurrentPlan ? (
                  <>
                    <Check className="w-5 h-5" />
                    Plano Atual
                  </>
                ) : plano.id === 'gratuito' ? (
                  'Plano Gratuito'
                ) : (
                  <>
                    {plano.id === 'premium' ? '🚀' : '👑'} {isUpgrade ? 'Fazer Upgrade' : 'Assinar Agora'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Garantia */}
              {plano.preco > 0 && (
                <div className={`mt-4 pt-4 border-t text-center ${
                  plano.id === 'residencia' ? 'border-amber-500/20' :
                  plano.id === 'premium' ? 'border-emerald-500/20' :
                  'border-white/10'
                }`}>
                  <p className={`text-xs flex items-center justify-center gap-1 ${
                    plano.id === 'residencia' ? 'text-amber-300/70' :
                    plano.id === 'premium' ? 'text-emerald-300/70' :
                    'text-white/40'
                  }`}>
                    <Shield className="w-4 h-4" />
                    7 dias de garantia ou dinheiro de volta
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Comparison Table */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-6 text-center">
          Comparação Completa
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/60 py-4 px-4 font-medium">Recurso</th>
                <th className="text-center text-white/60 py-4 px-4 font-medium">Gratuito</th>
                <th className="text-center text-emerald-400 py-4 px-4 font-medium">Premium</th>
                <th className="text-center text-amber-400 py-4 px-4 font-medium">Residência</th>
              </tr>
            </thead>
            <tbody>
              {[
                { recurso: 'Questões por dia', gratuito: '10', premium: '∞ Ilimitadas', residencia: '∞ Ilimitadas' },
                { recurso: 'Simulados por mês', gratuito: '—', premium: '5', residencia: '∞ Ilimitados' },
                { recurso: 'Perguntas IA', gratuito: '—', premium: '100/mês', residencia: '∞ Ilimitadas' },
                { recurso: 'Resumos IA', gratuito: '—', premium: '15/mês', residencia: '∞ Ilimitados' },
                { recurso: 'Flashcards', gratuito: '—', premium: '50', residencia: '∞ Ilimitados' },
                { recurso: 'Anotações', gratuito: '10', premium: '100', residencia: '∞ Ilimitadas' },
                { recurso: 'Nível de teoria', gratuito: 'Básico', premium: 'Avançado', residencia: 'Expert' },
                { recurso: 'Suporte', gratuito: '—', premium: 'E-mail', residencia: 'Prioritário 24h' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="text-white/80 py-4 px-4 font-medium">{row.recurso}</td>
                  <td className="text-center text-white/50 py-4 px-4">{row.gratuito}</td>
                  <td className="text-center text-emerald-400 py-4 px-4 font-medium">{row.premium}</td>
                  <td className="text-center text-amber-400 py-4 px-4 font-medium">{row.residencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Testimonials */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { nome: 'Dra. Marina S.', texto: 'Passei na USP usando o PreparedMed! A IA tutora fez toda diferença.', nota: 5 },
          { nome: 'Dr. Pedro L.', texto: 'Melhor investimento que fiz. As questões comentadas são excelentes.', nota: 5 },
          { nome: 'Dra. Ana C.', texto: 'Os simulados me prepararam perfeitamente para a prova real.', nota: 5 },
        ].map((depo, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex gap-1 mb-3">
              {Array(depo.nota).fill(0).map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-white/70 text-sm mb-3 italic">&quot;{depo.texto}&quot;</p>
            <p className="text-emerald-400 text-sm font-medium">{depo.nome}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-6">Perguntas Frequentes</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { p: 'Como funciona o pagamento?', r: 'Pagamento seguro via cartão de crédito com cobrança recorrente mensal. Você pode cancelar a qualquer momento.' },
            { p: 'Posso cancelar quando quiser?', r: 'Sim! Cancele a qualquer momento sem multas. Você mantém acesso até o fim do período pago.' },
            { p: 'Tem garantia de reembolso?', r: 'Sim! 7 dias de garantia incondicional. Se não gostar, devolvemos 100% do valor.' },
            { p: 'Como faço upgrade de plano?', r: 'Basta escolher o novo plano. O upgrade é imediato e você paga apenas a diferença proporcional.' },
          ].map((faq, i) => (
            <div key={i}>
              <h4 className="text-white font-medium mb-2">{faq.p}</h4>
              <p className="text-white/50 text-sm">{faq.r}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm pb-8">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Pagamento 100% seguro
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          Dados criptografados
        </div>
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          7 dias de garantia
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-400" />
          Cancele quando quiser
        </div>
      </div>
    </div>
  )
}
