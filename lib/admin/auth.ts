// lib/admin/auth.ts
// Sistema de autenticação admin para o PREPARAMED

import { createClient } from '@supabase/supabase-js'

// Lista de emails com acesso admin
const ADMIN_EMAILS = ['brunodivinoa@gmail.com']

/**
 * Verifica se um email é de admin
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Verifica se um usuário é admin pelo ID
 */
export async function verificarAdminPorId(
  userId: string,
  supabase: ReturnType<typeof createClient>
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles_med')
      .select('email')
      .eq('id', userId)
      .single()

    if (error || !data) return false
    return isAdmin(data.email)
  } catch {
    return false
  }
}

/**
 * Verifica se o usuário atual é admin (client-side)
 */
export async function verificarAdminAtual(
  supabase: ReturnType<typeof createClient>
): Promise<{ isAdmin: boolean; userId: string | null }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { isAdmin: false, userId: null }
    }

    return {
      isAdmin: isAdmin(user.email),
      userId: user.id
    }
  } catch {
    return { isAdmin: false, userId: null }
  }
}

/**
 * Middleware de verificação de admin para APIs
 */
export async function requireAdmin(
  supabase: ReturnType<typeof createClient>
): Promise<{ authorized: boolean; userId: string | null; error?: string }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { authorized: false, userId: null, error: 'Não autenticado' }
    }

    if (!isAdmin(user.email)) {
      return { authorized: false, userId: user.id, error: 'Acesso negado - não é admin' }
    }

    return { authorized: true, userId: user.id }
  } catch (err) {
    return { authorized: false, userId: null, error: 'Erro ao verificar permissões' }
  }
}

export { ADMIN_EMAILS }
