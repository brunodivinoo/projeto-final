'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowser } from '@/lib/supabase'
import type { PrepaMedProfile } from '@/types/prepamed'

interface PrepaMedAuthContextType {
  user: User | null
  profile: PrepaMedProfile | null
  loading: boolean
  isOnboardingComplete: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const PrepaMedAuthContext = createContext<PrepaMedAuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isOnboardingComplete: false,
  refreshProfile: async () => {},
  signOut: async () => {},
})

function isProfileComplete(profile: PrepaMedProfile | null): boolean {
  if (!profile) return false
  return !!(profile.exam_type && profile.full_name)
}

export function PrepaMedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<PrepaMedProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowser()
    const { data } = await supabase
      .from('prepamed_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    setProfile(data ?? null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) await fetchProfile(currentUser.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  return (
    <PrepaMedAuthContext.Provider value={{
      user,
      profile,
      loading,
      isOnboardingComplete: isProfileComplete(profile),
      refreshProfile,
      signOut,
    }}>
      {children}
    </PrepaMedAuthContext.Provider>
  )
}

export function usePrepaMedAuth() {
  return useContext(PrepaMedAuthContext)
}
