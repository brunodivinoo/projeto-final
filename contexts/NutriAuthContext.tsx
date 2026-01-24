'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Tipos específicos do NutriVida (App de saude feminina)
export interface ProfileNUTRI {
  id: string
  nome: string | null
  email: string | null
  idade: number | null
  peso_inicial: number | null
  peso_atual: number | null
  peso_meta: number | null
  altura: number | null
  // Campos de maternidade - agora com datas para calculo automatico
  idade_bebe: number | null // Mantido para compatibilidade (calculado automaticamente)
  data_nascimento_bebe: string | null // Nova! Data de nascimento do bebe (YYYY-MM-DD)
  amamentando: boolean
  // Campos de gestacao
  semana_gestacao: number | null // Mantido para compatibilidade (calculado automaticamente)
  data_ultima_menstruacao: string | null // Nova! DUM para calcular semana de gestacao
  data_prevista_parto: string | null // Nova! DPP calculada (DUM + 280 dias)
  gestante: boolean // Nova! Flag explicita se esta gravida
  // Restricoes e preferencias
  restricoes: string[] | null
  preferencias: string[] | null
  plano: 'normal' | 'restritivo'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// Funcoes auxiliares para calculos de datas
export function calcularIdadeBebe(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null
  const nascimento = new Date(dataNascimento)
  const hoje = new Date()
  const diffTime = hoje.getTime() - nascimento.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays >= 0 ? diffDays : null
}

export function calcularSemanaGestacao(dum: string | null): number | null {
  if (!dum) return null
  const dataUltimaMenstruacao = new Date(dum)
  const hoje = new Date()
  const diffTime = hoje.getTime() - dataUltimaMenstruacao.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const semanas = Math.floor(diffDays / 7)
  // Gestacao valida: entre 1 e 42 semanas
  return semanas >= 1 && semanas <= 42 ? semanas : null
}

export function calcularDPP(dum: string | null): string | null {
  if (!dum) return null
  const dataUltimaMenstruacao = new Date(dum)
  // DPP = DUM + 280 dias (40 semanas)
  const dpp = new Date(dataUltimaMenstruacao)
  dpp.setDate(dpp.getDate() + 280)
  return dpp.toISOString().split('T')[0]
}

export function calcularTrimestreGestacao(semana: number | null): 1 | 2 | 3 | null {
  if (!semana) return null
  if (semana <= 12) return 1
  if (semana <= 26) return 2
  return 3
}

export function formatarIdadeBebe(dias: number | null): string {
  if (!dias || dias < 0) return ''
  if (dias < 30) return `${dias} dias`
  if (dias < 365) {
    const meses = Math.floor(dias / 30)
    const diasRestantes = dias % 30
    return diasRestantes > 0 ? `${meses} mes(es) e ${diasRestantes} dias` : `${meses} mes(es)`
  }
  const anos = Math.floor(dias / 365)
  const mesesRestantes = Math.floor((dias % 365) / 30)
  return mesesRestantes > 0 ? `${anos} ano(s) e ${mesesRestantes} mes(es)` : `${anos} ano(s)`
}

export interface MacrosDia {
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}

export interface MetasMacros {
  calorias: number
  proteinas: { min: number; max: number }
  carboidratos: { min: number; max: number }
  gorduras: { min: number; max: number }
}

type NutriAuthContextType = {
  user: User | null
  profile: ProfileNUTRI | null
  loading: boolean
  profileLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (data: Partial<ProfileNUTRI>) => Promise<boolean>
  // Cálculos
  imc: number
  pesoAPerdido: number
  pesoRestante: number
  progressoPercentual: number
  metaCalorias: number
  metaProteinas: number
  metasMacros: MetasMacros
  // Novos calculos automaticos
  idadeBebeCalculada: number | null
  semanaGestacaoCalculada: number | null
  trimestreGestacao: 1 | 2 | 3 | null
  dppCalculada: string | null
  situacaoAtual: 'gestante' | 'amamentando' | 'pos_parto' | 'normal'
}

const NutriAuthContext = createContext<NutriAuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => false,
  imc: 0,
  pesoAPerdido: 0,
  pesoRestante: 0,
  progressoPercentual: 0,
  metaCalorias: 1900,
  metaProteinas: 80,
  metasMacros: {
    calorias: 1900,
    proteinas: { min: 70, max: 100 },
    carboidratos: { min: 150, max: 250 },
    gorduras: { min: 50, max: 70 }
  },
  idadeBebeCalculada: null,
  semanaGestacaoCalculada: null,
  trimestreGestacao: null,
  dppCalculada: null,
  situacaoAtual: 'normal'
})

export function NutriAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileNUTRI | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  const fetchingRef = useRef(false)
  const lastFetchedUserIdRef = useRef<string | null>(null)

  // Cálculos baseados no perfil
  const imc = profile?.peso_atual && profile?.altura
    ? Number((profile.peso_atual / Math.pow(profile.altura, 2)).toFixed(1))
    : 0

  const pesoAPerdido = profile?.peso_inicial && profile?.peso_atual
    ? Number((profile.peso_inicial - profile.peso_atual).toFixed(1))
    : 0

  const pesoRestante = profile?.peso_atual && profile?.peso_meta
    ? Number((profile.peso_atual - profile.peso_meta).toFixed(1))
    : 0

  const progressoPercentual = profile?.peso_inicial && profile?.peso_atual && profile?.peso_meta
    ? Math.max(0, Math.round(((profile.peso_inicial - profile.peso_atual) / (profile.peso_inicial - profile.peso_meta)) * 100))
    : 0

  const metaCalorias = profile?.plano === 'restritivo' ? 1300 : 1900
  const metaProteinas = profile?.plano === 'restritivo' ? 90 : 80

  // Metas de macros baseadas no plano
  const metasMacros: MetasMacros = profile?.plano === 'restritivo'
    ? {
        calorias: 1300,
        proteinas: { min: 80, max: 110 },
        carboidratos: { min: 50, max: 100 },
        gorduras: { min: 50, max: 70 }
      }
    : {
        calorias: 1900,
        proteinas: { min: 70, max: 100 },
        carboidratos: { min: 180, max: 280 },
        gorduras: { min: 50, max: 80 }
      }

  // Calculos automaticos de gestacao e maternidade
  const idadeBebeCalculada = calcularIdadeBebe(profile?.data_nascimento_bebe || null)
    || profile?.idade_bebe || null

  const semanaGestacaoCalculada = calcularSemanaGestacao(profile?.data_ultima_menstruacao || null)
    || profile?.semana_gestacao || null

  const trimestreGestacao = calcularTrimestreGestacao(semanaGestacaoCalculada)

  const dppCalculada = calcularDPP(profile?.data_ultima_menstruacao || null)
    || profile?.data_prevista_parto || null

  // Determinar situacao atual da usuaria
  const situacaoAtual: 'gestante' | 'amamentando' | 'pos_parto' | 'normal' =
    (profile?.gestante || semanaGestacaoCalculada) ? 'gestante' :
    profile?.amamentando ? 'amamentando' :
    idadeBebeCalculada && idadeBebeCalculada <= 365 ? 'pos_parto' :
    'normal'

  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userName?: string, forceRefresh = false) => {
    if (fetchingRef.current) return
    if (!forceRefresh && lastFetchedUserIdRef.current === userId) {
      setProfileLoading(false)
      return
    }

    fetchingRef.current = true
    setProfileLoading(true)

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles_nutri')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile não existe - criar novo
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles_nutri')
          .insert({
            id: userId,
            nome: userName || userEmail?.split('@')[0] || 'Usuaria',
            email: userEmail,
            plano: 'normal',
            amamentando: false
          })
          .select()
          .single()

        if (insertError) {
          console.error('Erro ao criar perfil:', insertError)
        } else if (newProfile) {
          setProfile(newProfile as ProfileNUTRI)
        }
      } else if (profileError) {
        console.error('Erro ao buscar perfil:', profileError)
      } else if (profileData) {
        setProfile(profileData as ProfileNUTRI)
      }

      lastFetchedUserIdRef.current = userId
    } catch (error) {
      console.error('Erro ao buscar perfil NUTRI:', error)
    } finally {
      fetchingRef.current = false
      setProfileLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.email || undefined, user.user_metadata?.nome, true)
    }
  }, [user, fetchProfile])

  const updateProfile = useCallback(async (data: Partial<ProfileNUTRI>): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('profiles_nutri')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) {
        console.error('Erro ao atualizar perfil:', error)
        return false
      }

      await refreshProfile()
      return true
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err)
      return false
    }
  }, [user, refreshProfile])

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!mounted) return

        if (sessionError) {
          console.error('Erro na sessão:', sessionError)
          setProfileLoading(false)
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          try {
            await fetchProfile(
              session.user.id,
              session.user.email || undefined,
              session.user.user_metadata?.nome
            )
          } catch (profileErr) {
            console.error('Erro ao carregar perfil:', profileErr)
            setProfileLoading(false)
          }
        } else {
          setProfileLoading(false)
        }
      } catch (error) {
        console.error('Erro ao buscar sessão:', error)
        setProfileLoading(false)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (session?.user) {
          if (session.user.id !== lastFetchedUserIdRef.current) {
            setUser(session.user)
            await fetchProfile(
              session.user.id,
              session.user.email || undefined,
              session.user.user_metadata?.nome
            )
          }
        } else {
          setUser(null)
          setProfile(null)
          lastFetchedUserIdRef.current = null
          setProfileLoading(false)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    lastFetchedUserIdRef.current = null
  }

  return (
    <NutriAuthContext.Provider value={{
      user,
      profile,
      loading,
      profileLoading,
      signOut,
      refreshProfile,
      updateProfile,
      imc,
      pesoAPerdido,
      pesoRestante,
      progressoPercentual,
      metaCalorias,
      metaProteinas,
      metasMacros,
      idadeBebeCalculada,
      semanaGestacaoCalculada,
      trimestreGestacao,
      dppCalculada,
      situacaoAtual
    }}>
      {children}
    </NutriAuthContext.Provider>
  )
}

export const useNutriAuth = () => useContext(NutriAuthContext)
