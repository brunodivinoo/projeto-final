'use client'

import { supabase } from '@/lib/supabase'

// =============================================
// GERENCIADOR DE SESSÃO ÚNICA
// =============================================
// Garante que apenas um dispositivo pode estar
// logado por vez para evitar compartilhamento
// =============================================

const SESSION_KEY = 'preparamed_session_token'

// Gerar token único para esta sessão
function generateSessionToken(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  const browserInfo = typeof navigator !== 'undefined'
    ? navigator.userAgent.substring(0, 10).replace(/\s/g, '')
    : 'server'
  return `${timestamp}-${randomPart}-${browserInfo}`
}

// Obter ou criar token de sessão local
export function getLocalSessionToken(): string {
  if (typeof window === 'undefined') return ''

  let token = localStorage.getItem(SESSION_KEY)
  if (!token) {
    token = generateSessionToken()
    localStorage.setItem(SESSION_KEY, token)
  }
  return token
}

// Registrar sessão ativa no servidor
export async function registrarSessao(userId: string): Promise<{ sucesso: boolean; deslogado?: boolean }> {
  try {
    const sessionToken = getLocalSessionToken()

    // Verificar sessão atual no banco
    const { data: sessaoAtual, error: fetchError } = await supabase
      .from('sessoes_ativas')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao verificar sessão:', fetchError)
      return { sucesso: false }
    }

    // Se existe uma sessão diferente ativa
    if (sessaoAtual && sessaoAtual.session_token !== sessionToken) {
      // Verificar se a sessão anterior ainda é recente (últimos 5 minutos)
      const ultimaAtividade = new Date(sessaoAtual.ultima_atividade).getTime()
      const agora = Date.now()
      const cincoMinutos = 5 * 60 * 1000

      if (agora - ultimaAtividade < cincoMinutos) {
        // Sessão anterior ainda ativa - deslogar a anterior
        // Atualizar para esta nova sessão
        await supabase
          .from('sessoes_ativas')
          .update({
            session_token: sessionToken,
            dispositivo: getDeviceInfo(),
            ultima_atividade: new Date().toISOString(),
            ip_address: await getClientIP()
          })
          .eq('user_id', userId)

        return { sucesso: true, deslogado: true }
      }
    }

    // Criar ou atualizar sessão
    const { error: upsertError } = await supabase
      .from('sessoes_ativas')
      .upsert({
        user_id: userId,
        session_token: sessionToken,
        dispositivo: getDeviceInfo(),
        ultima_atividade: new Date().toISOString(),
        ip_address: await getClientIP()
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      console.error('Erro ao registrar sessão:', upsertError)
      return { sucesso: false }
    }

    return { sucesso: true }
  } catch (error) {
    console.error('Erro no gerenciador de sessão:', error)
    return { sucesso: false }
  }
}

// Verificar se esta sessão ainda é válida
export async function verificarSessaoValida(userId: string): Promise<boolean> {
  try {
    const sessionToken = getLocalSessionToken()

    const { data: sessaoAtual, error } = await supabase
      .from('sessoes_ativas')
      .select('session_token')
      .eq('user_id', userId)
      .single()

    if (error || !sessaoAtual) {
      return true // Sem sessão registrada, permitir
    }

    return sessaoAtual.session_token === sessionToken
  } catch {
    return true // Em caso de erro, não bloquear
  }
}

// Atualizar última atividade (heartbeat)
export async function atualizarAtividade(userId: string): Promise<void> {
  try {
    const sessionToken = getLocalSessionToken()

    await supabase
      .from('sessoes_ativas')
      .update({
        ultima_atividade: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('session_token', sessionToken)
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error)
  }
}

// Limpar sessão ao fazer logout
export async function limparSessao(userId: string): Promise<void> {
  try {
    const sessionToken = getLocalSessionToken()

    await supabase
      .from('sessoes_ativas')
      .delete()
      .eq('user_id', userId)
      .eq('session_token', sessionToken)

    localStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('Erro ao limpar sessão:', error)
  }
}

// Obter informações do dispositivo
function getDeviceInfo(): string {
  if (typeof navigator === 'undefined') return 'Unknown'

  const ua = navigator.userAgent
  let device = 'Desktop'

  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    if (/iPad/i.test(ua)) {
      device = 'iPad'
    } else if (/iPhone/i.test(ua)) {
      device = 'iPhone'
    } else if (/Android/i.test(ua)) {
      device = 'Android'
    } else {
      device = 'Mobile'
    }
  }

  // Tentar identificar o navegador
  let browser = 'Unknown'
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) {
    browser = 'Chrome'
  } else if (/Firefox/i.test(ua)) {
    browser = 'Firefox'
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari'
  } else if (/Edge/i.test(ua)) {
    browser = 'Edge'
  }

  return `${device} - ${browser}`
}

// Obter IP do cliente (simplificado)
async function getClientIP(): Promise<string> {
  try {
    // Usar serviço externo para pegar IP
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || 'unknown'
  } catch {
    return 'unknown'
  }
}
