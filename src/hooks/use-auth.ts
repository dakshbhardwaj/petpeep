"use client"
// Needs "use client" — uses useState, useEffect, and browser Supabase client

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

type AuthState = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

/**
 * Hook to get the current authenticated Supabase user.
 *
 * For the database user profile (name, userType, etc.), use the
 * /api/auth/me endpoint or pass user data from a Server Component.
 *
 * @example
 * const { user, isLoading, isAuthenticated } = useAuth()
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsLoading(false)
    })

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  }
}
