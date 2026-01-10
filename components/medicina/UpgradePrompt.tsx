'use client'

import Link from 'next/link'
import { Crown, Sparkles, Zap, TrendingUp, Lock, Star, Rocket, Gift } from 'lucide-react'

interface UpgradePromptProps {
  tipo: 'questoes' | 'simulados' | 'ia' | 'biblioteca' | 'anotacoes' | 'geral'
  planoAtual: 'gratuito' | 'premium' | 'residencia'
  compact?: boolean
}

const mensagens = {
  questoes: {
    titulo: 'Desbloqueie Questoes Ilimitadas!',
    subtitulo: 'Voce atingiu o limite diario de questoes',
    beneficios: [
      'Questoes ilimitadas por dia',
      'Acesso a questoes de todas as bancas',
      'Comentarios detalhados com explicacoes',
      'Filtros avancados e estatisticas'
    ],
    urgencia: 'Seus colegas estao resolvendo 3x mais questoes que voce!',
    cta: 'Quero Questoes Ilimitadas',
    icon: Zap
  },
  simulados: {
    titulo: 'Faca Mais Simulados!',
    subtitulo: 'Voce atingiu o limite mensal de simulados',
    beneficios: [
      'Ate 10 simulados por mes (Premium)',
      'Simulados ilimitados (Residencia)',
      'Ate 200 questoes por simulado',
      'Analise detalhada de desempenho'
    ],
    urgencia: 'Quem faz mais simulados tem 2x mais chance de aprovacao!',
    cta: 'Desbloquear Mais Simulados',
    icon: TrendingUp
  },
  ia: {
    titulo: 'IA Tutora Exclusiva!',
    subtitulo: 'Este recurso esta disponivel apenas para assinantes',
    beneficios: [
      'Tire duvidas 24/7 com IA especializada',
      'Explicacoes personalizadas',
      'Resumos automaticos de conteudo',
      'Flashcards gerados por IA'
    ],
    urgencia: 'Estudar com IA aumenta em 40% a retencao do conteudo!',
    cta: 'Desbloquear IA Tutora',
    icon: Sparkles
  },
  biblioteca: {
    titulo: 'Acesso Completo a Biblioteca!',
    subtitulo: 'Conteudo premium bloqueado',
    beneficios: [
      'Teoria avancada e expert',
      'Conteudo de 6 anos de provas',
      'Macetes e pegadinhas exclusivas',
      'Referencias bibliograficas completas'
    ],
    urgencia: 'Domine todo o conteudo que cai nas provas!',
    cta: 'Acessar Biblioteca Completa',
    icon: Star
  },
  anotacoes: {
    titulo: 'Mais Espaco para Anotacoes!',
    subtitulo: 'Voce atingiu o limite de anotacoes',
    beneficios: [
      'Ate 100 anotacoes (Premium)',
      'Anotacoes ilimitadas (Residencia)',
      'Organizacao por disciplina',
      'Exportacao em PDF'
    ],
    urgencia: 'Organize seus estudos sem limites!',
    cta: 'Expandir Anotacoes',
    icon: Rocket
  },
  geral: {
    titulo: 'Eleve Seus Estudos!',
    subtitulo: 'Desbloqueie todo o potencial da plataforma',
    beneficios: [
      'Questoes e simulados ilimitados',
      'IA Tutora 24/7',
      'Biblioteca completa',
      'Estatisticas avancadas'
    ],
    urgencia: '93% dos aprovados usam recursos premium!',
    cta: 'Ver Planos',
    icon: Crown
  }
}

const planoRecomendado = {
  gratuito: {
    nome: 'Premium',
    preco: 'R$ 49,90/mes',
    destaque: 'Mais Popular'
  },
  premium: {
    nome: 'Residencia',
    preco: 'R$ 79,90/mes',
    destaque: 'Completo'
  },
  residencia: null
}

export default function UpgradePrompt({ tipo, planoAtual, compact = false }: UpgradePromptProps) {
  const config = mensagens[tipo]
  const IconComponent = config.icon
  const proximo = planoRecomendado[planoAtual]

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold">{config.titulo}</h4>
            <p className="text-amber-200/70 text-sm truncate">{config.subtitulo}</p>
          </div>
          <Link
            href="/medicina/dashboard/assinatura"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 rounded-2xl p-8 text-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/25">
          <IconComponent className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-2">{config.titulo}</h3>
        <p className="text-amber-200/80 mb-6">{config.subtitulo}</p>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-w-lg mx-auto">
          {config.beneficios.map((beneficio, i) => (
            <div key={i} className="flex items-center gap-2 text-left">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/80 text-sm">{beneficio}</span>
            </div>
          ))}
        </div>

        {/* Urgencia / Social proof */}
        <div className="bg-white/5 rounded-lg px-4 py-3 mb-6 inline-block">
          <p className="text-amber-300 text-sm font-medium flex items-center gap-2">
            <Gift className="w-4 h-4" />
            {config.urgencia}
          </p>
        </div>

        {/* Plano recomendado */}
        {proximo && (
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full mb-2">
              {proximo.destaque}
            </span>
            <p className="text-white/60 text-sm">
              Plano <span className="text-white font-semibold">{proximo.nome}</span> por apenas{' '}
              <span className="text-amber-400 font-bold">{proximo.preco}</span>
            </p>
          </div>
        )}

        {/* CTA */}
        <Link
          href="/medicina/dashboard/assinatura"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
        >
          <Crown className="w-5 h-5" />
          {config.cta}
        </Link>

        {/* Garantia */}
        <p className="text-white/40 text-xs mt-4">
          Garantia de 7 dias ou seu dinheiro de volta
        </p>
      </div>
    </div>
  )
}
