// Supabase Admin Client - Lazy initialization para evitar erros durante build
// Use este cliente em todas as API routes

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseAdmin: SupabaseClient | null = null

/**
 * Retorna o cliente Supabase com Service Role Key
 * Usa lazy initialization para evitar erros durante o build do Next.js
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not configured')
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  return _supabaseAdmin
}

/**
 * Alias para compatibilidade
 */
export const supabaseAdmin = {
  get client() {
    return getSupabaseAdmin()
  }
}

export default getSupabaseAdmin
