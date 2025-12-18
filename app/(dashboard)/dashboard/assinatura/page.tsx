'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function AssinaturaPage() {
  const { user, profile } = useAuth()
  const [billingCycle, setBillingCycle] = useState<'mensal' | 'anual'>('mensal')
  const [loading, setLoading] = useState(false)
  const isPro = profile?.plano?.toUpperCase() === 'ESTUDA_PRO'

  const planos = {
    free: {
      nome: 'Free',
      preco: 0,
      descricao: 'Para quem esta comecando',
      recursos: [
        { nome: 'Questoes IA por dia', valor: '5', icon: 'quiz' },
        { nome: 'Questoes por dia', valor: '50', icon: 'help_outline' },
        { nome: 'Resumos por mes', valor: '3', icon: 'summarize' },
        { nome: 'Chat IA (mensagens/dia)', valor: '10', icon: 'chat_bubble' },
        { nome: 'Paginas PDF por mes', valor: '5', icon: 'picture_as_pdf' },
        { nome: 'Flashcards', valor: '50', icon: 'style' },
        { nome: 'Baralhos', valor: '2', icon: 'folder' },
        { nome: 'Simulados por mes', valor: '2', icon: 'assignment' },
        { nome: 'Ciclos de estudo', valor: '1', icon: 'refresh' },
        { nome: 'Planos de estudo', valor: '1', icon: 'calendar_month' },
        { nome: 'Multiplicador XP', valor: '1x', icon: 'stars' },
        { nome: 'Ranking semanal', valor: 'Visualizar', icon: 'leaderboard' },
      ]
    },
    pro: {
      nome: 'Estuda PRO',
      precoMensal: 29.90,
      precoAnual: 239.90,
      descricao: 'Recursos ilimitados para seu sucesso',
      recursos: [
        { nome: 'Questoes IA por dia', valor: '50', icon: 'quiz', destaque: true },
        { nome: 'Questoes por dia', valor: '200', icon: 'help_outline', destaque: true },
        { nome: 'Resumos por mes', valor: '50', icon: 'summarize', destaque: true },
        { nome: 'Chat IA', valor: 'Ilimitado', icon: 'chat_bubble', destaque: true },
        { nome: 'Paginas PDF por mes', valor: '100', icon: 'picture_as_pdf', destaque: true },
        { nome: 'Creditos IA extras/mes', valor: '500', icon: 'token', destaque: true },
        { nome: 'Flashcards', valor: '2.000', icon: 'style' },
        { nome: 'Baralhos', valor: 'Ilimitados', icon: 'folder', destaque: true },
        { nome: 'Simulados por mes', valor: '10', icon: 'assignment' },
        { nome: 'Ciclos de estudo', valor: 'Ilimitados', icon: 'refresh', destaque: true },
        { nome: 'Planos de estudo', valor: 'Ilimitados', icon: 'calendar_month', destaque: true },
        { nome: 'Multiplicador XP', valor: '1.5x', icon: 'stars', destaque: true },
        { nome: 'Ranking semanal', valor: 'Competir', icon: 'leaderboard', destaque: true },
      ]
    }
  }

  const precoAtual = billingCycle === 'mensal' ? planos.pro.precoMensal : planos.pro.precoAnual
  const economia = billingCycle === 'anual' ? Math.round((planos.pro.precoMensal * 12 - planos.pro.precoAnual)) : 0

  // Funcao para iniciar checkout
  const handleCheckout = async () => {
    if (!user) {
      // Redirecionar para login se nao estiver logado
      window.location.href = '/login?redirect=/dashboard/assinatura'
      return
    }

    setLoading(true)

    try {
      // Chamar API para gerar URL de checkout
      const response = await fetch('/api/cakto/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: profile?.nome,
          billingCycle,
        }),
      })

      const data = await response.json()

      if (data.checkoutUrl) {
        // Redirecionar para checkout do Cakto
        window.location.href = data.checkoutUrl
      } else {
        // Se nao tiver URL configurada, mostrar mensagem
        alert('Sistema de pagamentos em configuracao. Tente novamente em breve!')
      }
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error)
      alert('Erro ao processar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
      <Header title="Assinatura" />

      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
            Escolha seu plano
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl mx-auto">
            Desbloqueie todo o potencial do Estuda e acelere seus estudos com recursos ilimitados de IA.
          </p>
        </div>

        {/* Toggle Mensal/Anual */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-[#1c252e] p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 inline-flex">
            <button
              onClick={() => setBillingCycle('mensal')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                billingCycle === 'mensal'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('anual')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                billingCycle === 'anual'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Anual
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                -33%
              </span>
            </button>
          </div>
        </div>

        {/* Planos Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Plano Free */}
          <div className={`bg-white dark:bg-[#1c252e] rounded-2xl border-2 p-6 lg:p-8 transition-all ${
            !isPro ? 'border-primary ring-4 ring-primary/10' : 'border-slate-200 dark:border-slate-700'
          }`}>
            {!isPro && (
              <div className="inline-block bg-primary text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                Seu plano atual
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {planos.free.nome}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {planos.free.descricao}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">R$0</span>
                <span className="text-slate-500 dark:text-slate-400">/mes</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {planos.free.recursos.map((recurso, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-lg">
                    {recurso.icon}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                    {recurso.nome}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {recurso.valor}
                  </span>
                </div>
              ))}
            </div>

            {!isPro ? (
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold cursor-not-allowed"
              >
                Plano Atual
              </button>
            ) : (
              <button className="w-full py-3.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Fazer Downgrade
              </button>
            )}
          </div>

          {/* Plano PRO */}
          <div className={`bg-white dark:bg-[#1c252e] rounded-2xl border-2 p-6 lg:p-8 relative transition-all ${
            isPro ? 'border-primary ring-4 ring-primary/10' : 'border-slate-200 dark:border-slate-700'
          }`}>
            {billingCycle === 'anual' && !isPro && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                Economize R${economia}/ano
              </div>
            )}

            {isPro && (
              <div className="inline-block bg-primary text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                Seu plano atual
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                {planos.pro.nome}
                <span className="material-symbols-outlined text-primary">workspace_premium</span>
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {planos.pro.descricao}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  R${precoAtual.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  /{billingCycle === 'mensal' ? 'mes' : 'ano'}
                </span>
              </div>
              {billingCycle === 'anual' && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Equivale a R${(planos.pro.precoAnual / 12).toFixed(2).replace('.', ',')}/mes
                </p>
              )}
            </div>

            <div className="space-y-3 mb-8">
              {planos.pro.recursos.map((recurso, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-lg ${
                    recurso.destaque ? 'text-primary' : 'text-slate-400'
                  }`}>
                    {recurso.icon}
                  </span>
                  <span className={`text-sm flex-1 ${
                    recurso.destaque
                      ? 'text-slate-900 dark:text-white font-medium'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {recurso.nome}
                  </span>
                  <span className={`text-sm font-bold ${
                    recurso.destaque ? 'text-primary' : 'text-slate-900 dark:text-white'
                  }`}>
                    {recurso.valor}
                  </span>
                </div>
              ))}
            </div>

            {isPro ? (
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold cursor-not-allowed"
              >
                Plano Atual
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                    Processando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">rocket_launch</span>
                    Assinar Agora
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Metodos de Pagamento */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Formas de pagamento aceitas:</p>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white dark:bg-[#1c252e] px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">credit_card</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">Cartao</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-[#1c252e] px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">pix</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">PIX</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-[#1c252e] px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">receipt_long</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">Boleto</span>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
            Perguntas Frequentes
          </h2>

          <div className="space-y-4">
            <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">help</span>
                Posso cancelar a qualquer momento?
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sim! Voce pode cancelar sua assinatura a qualquer momento. Voce continuara tendo acesso ate o final do periodo pago.
              </p>
            </div>

            <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">help</span>
                Os creditos IA acumulam?
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Os creditos sao renovados mensalmente e nao acumulam para o mes seguinte. Use-os para aproveitar ao maximo sua assinatura!
              </p>
            </div>

            <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">help</span>
                Quais formas de pagamento sao aceitas?
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Aceitamos cartao de credito, PIX e boleto bancario. Para planos anuais, oferecemos parcelamento em ate 12x.
              </p>
            </div>

            <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">help</span>
                Tem garantia de satisfacao?
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sim! Oferecemos 7 dias de garantia. Se nao estiver satisfeito, devolvemos 100% do seu dinheiro, sem perguntas.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        {!isPro && (
          <div className="mt-16 text-center bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                Pronto para acelerar seus estudos?
              </h3>
              <p className="text-white/80 mb-6 max-w-lg mx-auto">
                Junte-se a milhares de estudantes que ja estao aproveitando o maximo do Estuda PRO.
              </p>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="bg-white text-primary font-bold py-3.5 px-8 rounded-xl hover:bg-blue-50 transition-colors shadow-lg inline-flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Processando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">rocket_launch</span>
                    Comecar Agora
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Link para Creditos */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard/creditos"
            className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-lg">token</span>
            Gerenciar creditos IA
          </Link>
        </div>
      </div>
    </div>
  )
}
