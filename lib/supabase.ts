import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization para evitar erros durante SSG/SSR
let _supabase: SupabaseClient | null = null

function getSupabaseBrowser(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key must be configured')
    }

    _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }
  return _supabase
}

// Export getter function for use in components
export { getSupabaseBrowser }

// Export supabase as a getter-backed object for backwards compatibility
// This will be lazily initialized when first accessed
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return Reflect.get(getSupabaseBrowser(), prop)
  }
})

export type Profile = {
  id: string
  email: string
  nome: string
  avatar_url?: string
  bio?: string
  plano: 'free' | 'pro' | 'premium'
  instituicao?: string
  curso?: string
  created_at: string
}

export type Estatisticas = {
  questoes_hoje: number
  taxa_acerto: number
  horas_estudadas: number
  sequencia_dias: number
  ranking: number
  flashcards_revisados: number
}
