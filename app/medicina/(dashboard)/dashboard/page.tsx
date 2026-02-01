'use client'

/**
 * Nova Página Inicial - Chat Centralizado v2.0
 * TEMA CLARO - Cores padronizadas para fundo claro
 *
 * Melhorias:
 * - Input de chat com textarea expansível
 * - Sugestões completas (não mais truncadas)
 * - Layout mais compacto no mobile
 * - Cores com alto contraste para legibilidade
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMedAuth, LIMITES_PLANO } from '@/contexts/MedAuthContext'
import { useTrialTimer } from '@/hooks/useTrialTimer'
import { supabase } from '@/lib/supabase'
import { QuickActions, generatePersonalizedActions, type QuickAction } from '@/components/chat/QuickActions'
import { ChatHistory, type Conversation, categorizeConversation } from '@/components/chat/ChatHistory'
import { UsageLimits } from '@/components/chat/UsageLimits'
import { ChatInput } from '@/components/chat/ChatInput'
import {
  Sparkles,
  Zap,
  Crown,
  Clock,
  AlertTriangle,
  Gift,
  MessageSquare,
  BookOpen,
  Stethoscope
} from 'lucide-react'

export default function MedicinaDashboardPage() {
  const router = useRouter()
  const { user, profile, plano, limitesPlano, limites, loading: authLoading } = useMedAuth()
  const {
    isTrialActive,
    canStartTrial,
    isTrialExpired,
    tempoRestanteFormatado,
    percentualRestante,
    corBarra,
    mostrarUrgencia,
    iniciarTrial
  } = useTrialTimer()

  const [recentConversations, setRecentConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [iniciandoTrial, setIniciandoTrial] = useState(false)
  const [userTopics, setUserTopics] = useState<string[]>([])

  // Buscar conversas recentes e tópicos do usuário
  const fetchConversations = useCallback(async () => {
    if (authLoading || !user) return

    try {
      setLoading(true)

      // Buscar conversas
      const { data: conversas } = await supabase
        .from('conversas_ia_med')
        .select('id, titulo, ultima_mensagem, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5)

      if (conversas) {
        const formatted: Conversation[] = conversas.map(c => ({
          id: c.id,
          title: c.titulo || 'Conversa sem título',
          lastMessage: c.ultima_mensagem || '',
          updatedAt: new Date(c.updated_at),
          artifactCount: 0,
          category: categorizeConversation(c.titulo || '', c.ultima_mensagem || '')
        }))
        setRecentConversations(formatted)

        // Extrair tópicos das conversas para personalizar sugestões
        const topics = conversas
          .map(c => c.titulo)
          .filter(Boolean)
          .slice(0, 5) as string[]
        setUserTopics(topics)
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error)
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Saudação personalizada baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Ações rápidas personalizadas
  const quickActions = generatePersonalizedActions({
    topicosFrequentes: userTopics,
    ultimoAssuntoEstudado: userTopics[0]
  })

  // Handlers
  const handleNewMessage = useCallback(async (message: string) => {
    const encodedMessage = encodeURIComponent(message)
    router.push(`/medicina/dashboard/ia?m=${encodedMessage}`)
  }, [router])

  const handleQuickAction = useCallback((action: QuickAction) => {
    // Se o prompt termina com espaço, ir para chat com prompt parcial
    if (action.prompt.endsWith(' ')) {
      router.push(`/medicina/dashboard/ia?m=${encodeURIComponent(action.prompt)}`)
    } else {
      handleNewMessage(action.prompt)
    }
  }, [handleNewMessage, router])

  const handleSelectConversation = useCallback((id: string) => {
    router.push(`/medicina/dashboard/ia?c=${id}`)
  }, [router])

  const handleIniciarTrial = async () => {
    setIniciandoTrial(true)
    await iniciarTrial()
    setIniciandoTrial(false)
  }

  // Calcular limites de uso
  const questoesUsadas = limites?.questoes_dia || 0
  const questoesLimite = limitesPlano.questoes_dia
  const iaUsadas = limites?.perguntas_ia_mes || 0
  const iaLimite = limitesPlano.perguntas_ia_mes
  const simuladosUsados = limites?.simulados_mes || 0
  const simuladosLimite = limitesPlano.simulados_mes

  const usageData = {
    mensagens: iaUsadas,
    questoes: questoesUsadas,
    simulados: simuladosUsados,
    flashcards: 0
  }

  const limitsData = {
    mensagens: iaLimite === -1 ? 9999 : iaLimite,
    questoes: questoesLimite === -1 ? 9999 : questoesLimite,
    simulados: simuladosLimite === -1 ? 9999 : simuladosLimite,
    flashcards: plano === 'gratuito' ? 50 : 9999
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-2 md:px-0">
      {/* ============================================ */}
      {/* BANNERS DE TRIAL */}
      {/* ============================================ */}

      {/* Banner para iniciar trial */}
      {plano === 'gratuito' && canStartTrial && (
        <div className="mb-4 md:mb-6 bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 border border-purple-500/30 rounded-xl p-4 md:p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                  Teste GRÁTIS por 4 horas!
                </h3>
                <p className="text-purple-200 text-xs md:text-sm">
                  Acesso completo: IA ilimitada, questões, flashcards e mais!
                </p>
              </div>
            </div>

            <button
              onClick={handleIniciarTrial}
              disabled={iniciandoTrial}
              className="flex-shrink-0 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-2.5 md:py-3 px-5 md:px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
            >
              {iniciandoTrial ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Começar Agora
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Banner de trial ativo */}
      {plano === 'gratuito' && isTrialActive && (
        <div className={`mb-4 md:mb-6 ${mostrarUrgencia ? 'bg-gradient-to-r from-red-900 to-orange-900 border-red-500/30' : 'bg-gradient-to-r from-emerald-900 to-teal-900 border-emerald-500/30'} border rounded-xl p-3 md:p-4`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${mostrarUrgencia ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'} flex items-center justify-center flex-shrink-0`}>
                {mostrarUrgencia ? (
                  <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                ) : (
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-white font-bold flex items-center gap-2 text-sm md:text-base">
                  {mostrarUrgencia ? 'Trial acabando!' : 'Trial Ativo'}
                  <span className={`text-xl md:text-2xl font-bold ${mostrarUrgencia ? 'text-red-300' : 'text-emerald-300'}`}>
                    {tempoRestanteFormatado}
                  </span>
                </h3>
                <p className={`${mostrarUrgencia ? 'text-red-200/70' : 'text-emerald-200/70'} text-xs md:text-sm`}>
                  {mostrarUrgencia ? 'Aproveite os últimos minutos!' : 'Aproveite o acesso completo'}
                </p>
              </div>
            </div>

            <Link
              href="/medicina/dashboard/assinatura"
              className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Crown className="w-4 h-4 md:w-5 md:h-5" />
              Manter Acesso
            </Link>
          </div>

          <div className="mt-2 md:mt-3 h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${corBarra} transition-all duration-1000`}
              style={{ width: `${percentualRestante}%` }}
            />
          </div>
        </div>
      )}

      {/* Banner de trial expirado */}
      {plano === 'gratuito' && isTrialExpired && (
        <div className="mb-4 md:mb-6 bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-200 rounded-xl p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-600 flex items-center justify-center">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm md:text-base">Seu trial expirou</h3>
                <p className="text-slate-400 text-xs md:text-sm">
                  Continue com acesso completo a partir de R$59,90/mês
                </p>
              </div>
            </div>

            <Link
              href="/medicina/dashboard/assinatura"
              className="flex-shrink-0 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Crown className="w-4 h-4 md:w-5 md:h-5" />
              Ver Planos
            </Link>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ÁREA PRINCIPAL DO CHAT */}
      {/* ============================================ */}

      <div className="flex flex-col items-center py-6 md:py-10">
        {/* Logo e Saudação */}
        <div className="w-14 h-14 md:w-16 md:h-16 mb-3 md:mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Stethoscope className="w-8 h-8 md:w-9 md:h-9 text-white" />
        </div>

        <h1 className="text-xl md:text-3xl font-bold text-slate-800 mb-1.5 md:mb-2 text-center">
          {getGreeting()}, {profile?.nome?.split(' ')[0] || 'Estudante'}!
        </h1>
        <p className="text-slate-500 mb-6 md:mb-8 text-center text-sm md:text-base">
          Como posso ajudar nos seus estudos hoje?
        </p>

        {/* Input de Chat Centralizado - Melhorado */}
        <ChatInput
          onSubmit={handleNewMessage}
          placeholder="Pergunte, peça questões, flashcards, resumos..."
          className="w-full max-w-2xl mb-6 md:mb-8 px-2 md:px-0"
        />

        {/* Ações Rápidas - Com labels completos */}
        <QuickActions
          actions={quickActions}
          onSelect={handleQuickAction}
          userTopics={userTopics}
          className="w-full max-w-2xl mb-8 md:mb-10 px-2 md:px-0"
        />

        {/* Histórico de Conversas */}
        {recentConversations.length > 0 && (
          <ChatHistory
            conversations={recentConversations}
            onSelect={handleSelectConversation}
            className="w-full max-w-2xl px-2 md:px-0"
          />
        )}

        {/* Se não tem conversas, mostrar dicas */}
        {recentConversations.length === 0 && (
          <div className="w-full max-w-2xl text-center py-6 md:py-8 px-4">
            <MessageSquare className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-slate-300" />
            <h3 className="text-slate-500 font-medium mb-1.5 md:mb-2 text-sm md:text-base">Primeira vez aqui?</h3>
            <p className="text-slate-400 text-xs md:text-sm mb-3 md:mb-4">
              Experimente pedir: &quot;Crie 5 questões sobre infarto agudo do miocárdio&quot;
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Cardiologia', 'Neurologia', 'Pediatria', 'Cirurgia'].map(tema => (
                <button
                  key={tema}
                  onClick={() => handleNewMessage(`Me explique sobre ${tema}`)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs md:text-sm transition border border-slate-200"
                >
                  {tema}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* FOOTER COM LINKS ÚTEIS */}
      {/* ============================================ */}

      <div className="border-t border-slate-200 pt-4 md:pt-6 mt-6 md:mt-8 pb-4">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm">
          <Link
            href="/medicina/dashboard/biblioteca"
            className="flex items-center gap-1.5 md:gap-2 text-slate-400 hover:text-slate-600 transition"
          >
            <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Biblioteca
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            href="/medicina/dashboard/estatisticas"
            className="flex items-center gap-1.5 md:gap-2 text-slate-400 hover:text-slate-600 transition"
          >
            <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Estatísticas
          </Link>
          <span className="text-slate-300">|</span>
          <UsageLimits
            usage={usageData}
            limits={limitsData}
            plan={plano}
          />
        </div>
      </div>
    </div>
  )
}
