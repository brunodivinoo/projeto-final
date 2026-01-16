'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMedAuth } from '@/contexts/MedAuthContext'

export type ModalTipo =
  | 'trial_expirado'
  | 'limite_questoes'
  | 'limite_chat'
  | 'feature_bloqueada'
  | 'conquista'
  | 'trial_disponivel'

interface Conquista {
  nome: string
  descricao: string
  icone: string
  pontos: number
}

interface UpgradePromptState {
  showModal: boolean
  modalTipo: ModalTipo
  modalFeature: string
  conquista: Conquista | null
}

export function useUpgradePrompt() {
  const { plano, trialStatus, verificarLimite } = useMedAuth()

  const [state, setState] = useState<UpgradePromptState>({
    showModal: false,
    modalTipo: 'feature_bloqueada',
    modalFeature: '',
    conquista: null,
  })

  // Mostrar modal (com controle de sessão)
  const mostrarModal = useCallback((tipo: ModalTipo, feature?: string, conquista?: Conquista) => {
    // Verificar se já mostrou nesta sessão (exceto limites que sempre mostram)
    const key = `modal_${tipo}_shown`
    const tiposSemprePermitidos: ModalTipo[] = ['limite_questoes', 'limite_chat', 'conquista']

    if (!tiposSemprePermitidos.includes(tipo)) {
      if (typeof window !== 'undefined' && sessionStorage.getItem(key)) {
        return // Já mostrou nesta sessão
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(key, 'true')
      }
    }

    setState({
      showModal: true,
      modalTipo: tipo,
      modalFeature: feature || '',
      conquista: conquista || null,
    })
  }, [])

  // Fechar modal
  const fecharModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showModal: false,
    }))
  }, [])

  // Verificar e mostrar modal de trial expirado
  const verificarTrialExpirado = useCallback(() => {
    if (plano === 'gratuito' && trialStatus.expirado && !trialStatus.ativo) {
      // Só mostrar se já usou o trial antes
      mostrarModal('trial_expirado')
      return true
    }
    return false
  }, [plano, trialStatus, mostrarModal])

  // Verificar limite de questões
  const verificarLimiteQuestoes = useCallback(() => {
    const limite = verificarLimite('questoes_dia')
    if (!limite.permitido) {
      mostrarModal('limite_questoes')
      return true
    }
    return false
  }, [verificarLimite, mostrarModal])

  // Verificar limite de chat
  const verificarLimiteChat = useCallback(() => {
    const limite = verificarLimite('perguntas_ia_mes')
    if (!limite.permitido) {
      mostrarModal('limite_chat')
      return true
    }
    return false
  }, [verificarLimite, mostrarModal])

  // Mostrar feature bloqueada
  const mostrarFeatureBloqueada = useCallback((feature: string) => {
    mostrarModal('feature_bloqueada', feature)
  }, [mostrarModal])

  // Mostrar conquista
  const mostrarConquista = useCallback((conquista: Conquista) => {
    mostrarModal('conquista', undefined, conquista)
  }, [mostrarModal])

  // Mostrar oferta de trial
  const mostrarOfertaTrial = useCallback(() => {
    if (plano === 'gratuito' && !trialStatus.ativo && !trialStatus.expirado) {
      mostrarModal('trial_disponivel')
      return true
    }
    return false
  }, [plano, trialStatus, mostrarModal])

  // Verificar trial expirado ao carregar (uma vez por sessão)
  useEffect(() => {
    const key = 'trial_expired_checked'
    if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, 'true')
      // Dar um delay para o contexto carregar
      const timer = setTimeout(() => {
        verificarTrialExpirado()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [verificarTrialExpirado])

  return {
    // Estado
    showModal: state.showModal,
    modalTipo: state.modalTipo,
    modalFeature: state.modalFeature,
    conquista: state.conquista,

    // Ações
    mostrarModal,
    fecharModal,

    // Verificações
    verificarTrialExpirado,
    verificarLimiteQuestoes,
    verificarLimiteChat,
    mostrarFeatureBloqueada,
    mostrarConquista,
    mostrarOfertaTrial,
  }
}

// Hook simplificado para usar em qualquer componente
export function useFeatureGate(feature: string) {
  const { podeUsarFuncionalidade, trialStatus, plano } = useMedAuth()
  const { mostrarFeatureBloqueada, mostrarOfertaTrial } = useUpgradePrompt()

  const verificarAcesso = useCallback((): boolean => {
    // Se pode usar a funcionalidade, libera
    if (podeUsarFuncionalidade(feature as 'ia' | 'simulados' | 'flashcards' | 'casos_clinicos' | 'analise_exames' | 'voz' | 'biblioteca')) {
      return true
    }

    // Se é gratuito e ainda não usou trial, oferece trial
    if (plano === 'gratuito' && !trialStatus.ativo && !trialStatus.expirado) {
      mostrarOfertaTrial()
      return false
    }

    // Senão, mostra que está bloqueado
    mostrarFeatureBloqueada(feature)
    return false
  }, [feature, podeUsarFuncionalidade, plano, trialStatus, mostrarFeatureBloqueada, mostrarOfertaTrial])

  return {
    verificarAcesso,
    podeUsar: podeUsarFuncionalidade(feature as 'ia' | 'simulados' | 'flashcards' | 'casos_clinicos' | 'analise_exames' | 'voz' | 'biblioteca'),
  }
}
