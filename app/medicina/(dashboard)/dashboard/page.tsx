'use client'

/**
 * Nova Página Inicial - Chat Centralizado
 * Inspirado na interface da Meta AI
 *
 * Esta página agora é o ponto central do PREPARAMED, onde o estudante
 * interage via chat para gerar questões, flashcards, resumos, etc.
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

  // Buscar conversas recentes
  const fetchConversations = useCallback(async () => {
    if (authLoading || !user) return

    try {
      setLoading(true)

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
          artifactCount: 0, // TODO: Contar artefatos
          category: categorizeConversation(c.titulo || '', c.ultima_mensagem || '')
        }))
        setRecentConversations(formatted)
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
  // TODO: Quando implementar tracking de assuntos, buscar do banco
  const quickActions = generatePersonalizedActions(null)

  // Handlers
  const handleNewMessage = useCallback(async (message: string) => {
    // Navegar para a página de chat com a mensagem inicial
    const encodedMessage = encodeURIComponent(message)
    router.push(`/medicina/dashboard/ia?m=${encodedMessage}`)
  }, [router])

  const handleQuickAction = useCallback((action: QuickAction) => {
    // Se a ação tem um prompt incompleto (termina com espaço), focar no input
    // Caso contrário, enviar diretamente
    if (action.prompt.endsWith(' ')) {
      // Focar no input com o prompt parcial - navegamos com o prompt
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
    flashcards: 0 // TODO: Implementar tracking de flashcards
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
    <div className="max-w-4xl mx-auto">
      {/* ============================================ */}
      {/* BANNERS DE TRIAL */}
      {/* ============================================ */}

      {/* Banner para iniciar trial */}
      {plano === 'gratuito' && canStartTrial && (
        <div className="mb-6 bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 border border-purple-500/30 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  Teste GRÁTIS por 4 horas!
                </h3>
                <p className="text-purple-200 text-sm">
                  Acesso completo: IA ilimitada, questões, flashcards e mais!
                </p>
              </div>
            </div>

            <button
              onClick={handleIniciarTrial}
              disabled={iniciandoTrial}
              className="flex-shrink-0 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
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
        <div className={`mb-6 ${mostrarUrgencia ? 'bg-gradient-to-r from-red-900 to-orange-900 border-red-500/30' : 'bg-gradient-to-r from-emerald-900 to-teal-900 border-emerald-500/30'} border rounded-xl p-4`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${mostrarUrgencia ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'} flex items-center justify-center flex-shrink-0`}>
                {mostrarUrgencia ? (
                  <AlertTriangle className="w-6 h-6 text-white" />
                ) : (
                  <Clock className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-white font-bold flex items-center gap-2">
                  {mostrarUrgencia ? 'Trial acabando!' : 'Trial Ativo'}
                  <span className={`text-2xl font-bold ${mostrarUrgencia ? 'text-red-300' : 'text-emerald-300'}`}>
                    {tempoRestanteFormatado}
                  </span>
                </h3>
                <p className={`${mostrarUrgencia ? 'text-red-200/70' : 'text-emerald-200/70'} text-sm`}>
                  {mostrarUrgencia ? 'Aproveite os últimos minutos!' : 'Aproveite o acesso completo'}
                </p>
              </div>
            </div>

            <Link
              href="/medicina/dashboard/assinatura"
              className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <Crown className="w-5 h-5" />
              Manter Acesso
            </Link>
          </div>

          <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${corBarra} transition-all duration-1000`}
              style={{ width: `${percentualRestante}%` }}
            />
          </div>
        </div>
      )}

      {/* Banner de trial expirado */}
      {plano === 'gratuito' && isTrialExpired && (
        <div className="mb-6 bg-gradient-to-r from-slate-800 to-slate-700 border border-white/10 rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-600 flex items-center justify-center">
                <Clock className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Seu trial expirou</h3>
                <p className="text-slate-400 text-sm">
                  Continue com acesso completo a partir de R$59,90/mês
                </p>
              </div>
            </div>

            <Link
              href="/medicina/dashboard/assinatura"
              className="flex-shrink-0 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <Crown className="w-5 h-5" />
              Ver Planos
            </Link>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ÁREA PRINCIPAL DO CHAT */}
      {/* ============================================ */}

      <div className="flex flex-col items-center py-8 md:py-12">
        {/* Logo e Saudação */}
        <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Stethoscope className="w-9 h-9 text-white" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
          {getGreeting()}, {profile?.nome?.split(' ')[0] || 'Estudante'}!
        </h1>
        <p className="text-white/50 mb-8 text-center">
          Como posso ajudar nos seus estudos hoje?
        </p>

        {/* Input de Chat Centralizado */}
        <ChatInput
          onSubmit={handleNewMessage}
          placeholder="Pergunte, peça questões, flashcards, resumos..."
          className="w-full max-w-2xl mb-8"
        />

        {/* Ações Rápidas */}
        <QuickActions
          actions={quickActions}
          onSelect={handleQuickAction}
          className="w-full max-w-2xl mb-10"
        />

        {/* Histórico de Conversas */}
        {recentConversations.length > 0 && (
          <ChatHistory
            conversations={recentConversations}
            onSelect={handleSelectConversation}
            className="w-full max-w-2xl"
          />
        )}

        {/* Se não tem conversas, mostrar dicas */}
        {recentConversations.length === 0 && (
          <div className="w-full max-w-2xl text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-white/40 font-medium mb-2">Primeira vez aqui?</h3>
            <p className="text-white/30 text-sm mb-4">
              Experimente pedir: &quot;Crie 5 questões sobre infarto agudo do miocárdio&quot;
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Cardiologia', 'Neurologia', 'Pediatria', 'Cirurgia'].map(tema => (
                <button
                  key={tema}
                  onClick={() => handleNewMessage(`Me explique sobre ${tema}`)}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 text-sm transition"
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

      <div className="border-t border-white/10 pt-6 mt-8">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link
            href="/medicina/dashboard/biblioteca"
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition"
          >
            <BookOpen className="w-4 h-4" />
            Biblioteca
          </Link>
          <span className="text-white/20">|</span>
          <Link
            href="/medicina/dashboard/estatisticas"
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition"
          >
            <Sparkles className="w-4 h-4" />
            Estatísticas
          </Link>
          <span className="text-white/20">|</span>
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
