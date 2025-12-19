import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
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
