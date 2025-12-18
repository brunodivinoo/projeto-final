'use client'
import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useLimits, calcularPorcentagem, getCorPorcentagem } from '@/hooks/useLimits'
import Link from 'next/link'

interface HistoricoItem {
  id: string
  tipo: string
  descricao: string
  quantidade: number
  data: string
  icone: string
  cor: string
}

export default function CreditosPage() {
  const { profile } = useAuth()
  const { limites, plano, isPro, loading } = useLimits()

  // Mock de histórico - depois será do Supabase
  const historico: HistoricoItem[] = [
    {
      id: '1',
      tipo: 'questoes_ia',
      descricao: 'Gerou 5 questões de Matemática',
      quantidade: -5,
      data: 'Hoje, 14:30',
      icone: 'quiz',
      cor: '#137fec'
    },
    {
      id: '2',
      tipo: 'resumo',
      descricao: 'Gerou resumo de História',
      quantidade: -1,
      data: 'Hoje, 11:20',
      icone: 'summarize',
      cor: '#a855f7'
    },
    {
      id: '3',
      tipo: 'chat',
      descricao: 'Chat sobre Física Quântica',
      quantidade: -3,
      data: 'Ontem, 19:45',
      icone: 'chat_bubble',
      cor: '#10b981'
    },
    {
      id: '4',
      tipo: 'pdf',
      descricao: 'Analisou PDF de Biologia (8 páginas)',
      quantidade: -8,
      data: 'Ontem, 15:30',
      icone: 'picture_as_pdf',
      cor: '#f59e0b'
    },
    {
      id: '5',
      tipo: 'renovacao',
      descricao: 'Renovação mensal de créditos',
      quantidade: 500,
      data: '01/12/2024',
      icone: 'autorenew',
      cor: '#22c55e'
    }
  ]

  // Calcular totais de créditos
  const creditosIA = limites.find(l => l.id === 'questoes_ia')
  const creditosPDF = limites.find(l => l.id === 'pdf_paginas')
  const creditosResumo = limites.find(l => l.id === 'resumos')
  const creditosChat = limites.find(l => l.id === 'chat_mensagens')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
      <Header title="Créditos IA" />

      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
              Seus Créditos IA
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              Acompanhe o uso dos seus recursos de inteligência artificial.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              isPro
                ? 'bg-primary/10 text-primary'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              {isPro ? 'Estuda PRO' : 'Plano Free'}
            </span>
            {!isPro && (
              <Link
                href="/dashboard/assinatura"
                className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">rocket_launch</span>
                Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* Cards de Créditos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            // Skeleton loading
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
                <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              </div>
            ))
          ) : (
            limites.map((limite) => {
              const porcentagem = calcularPorcentagem(limite.usado, limite.limite)
              const corBarra = getCorPorcentagem(porcentagem)

              return (
                <div
                  key={limite.id}
                  className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-slate-700 p-5"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${limite.cor}20` }}
                  >
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ color: limite.cor }}
                    >
                      {limite.icone}
                    </span>
                  </div>

                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {limite.nome}
                  </h3>

                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {limite.limite - limite.usado}
                    </span>
                    <span className="text-sm text-slate-400">
                      / {limite.limite} restantes
                    </span>
                  </div>

                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${corBarra} transition-all duration-500`}
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-400">
                      {limite.tipo === 'diario' ? 'Renova hoje' : 'Renova em 30 dias'}
                    </span>
                    <span className={`text-xs font-bold ${porcentagem >= 90 ? 'text-red-500' : 'text-slate-500'}`}>
                      {porcentagem}% usado
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Seção PRO */}
        {isPro && (
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl border border-primary/20 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">token</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Créditos IA Extras
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Como assinante PRO, você tem 500 créditos extras por mês para usar em qualquer recurso de IA.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <span className="text-3xl font-bold text-primary">478</span>
                  <p className="text-xs text-slate-500">disponíveis</p>
                </div>
                <div className="h-12 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">500</span>
                  <p className="text-xs text-slate-500">total/mês</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Histórico de Uso */}
        <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Histórico de Uso
              </h2>
              <button className="text-sm text-primary font-medium hover:underline">
                Ver tudo
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {historico.map((item) => (
              <div
                key={item.id}
                className="p-4 lg:px-6 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${item.cor}20` }}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: item.cor }}
                  >
                    {item.icone}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {item.descricao}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.data}
                  </p>
                </div>

                <span className={`text-sm font-bold ${
                  item.quantidade > 0 ? 'text-green-500' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {item.quantidade > 0 ? '+' : ''}{item.quantidade}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Upgrade */}
        {!isPro && (
          <div className="mt-8 bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">
                  Precisa de mais créditos?
                </h3>
                <p className="text-white/80 text-sm lg:text-base">
                  Faça upgrade para o Estuda PRO e ganhe 500 créditos IA extras por mês, além de limites muito maiores em todos os recursos.
                </p>
              </div>
              <Link
                href="/dashboard/assinatura"
                className="bg-white text-primary font-bold py-3 px-6 rounded-xl hover:bg-blue-50 transition-colors shadow-lg inline-flex items-center gap-2 justify-center shrink-0"
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                Ver Planos
              </Link>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            Os créditos diários renovam à meia-noite (horário de Brasília).
            <br />
            Os créditos mensais renovam no primeiro dia de cada mês.
          </p>
        </div>
      </div>
    </div>
  )
}
