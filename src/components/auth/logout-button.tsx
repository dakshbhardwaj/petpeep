"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut } from "lucide-react"

interface Props {
  className?: string
  variant?: "button" | "link"
}

export function LogoutButton({ className, variant = "button" }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === "link") {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 ${className ?? ""}`}
      >
        <LogOut className="h-4 w-4" />
        {isLoading ? "Signing out…" : "Sign out"}
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`flex w-full items-center gap-3 rounded-xl border border-destructive/20 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50 ${className ?? ""}`}
    >
      <LogOut className="h-4 w-4" />
      {isLoading ? "Signing out…" : "Sign out"}
    </button>
  )
}
