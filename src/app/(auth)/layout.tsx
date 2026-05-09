/**
 * Auth route group layout — minimal chrome, centered card.
 * Wraps /login, /sign-up, /sign-up/verify, /login/verify
 */
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-low">
      {/* Simple header */}
      <header className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
            <span className="text-xs font-bold text-white">P</span>
          </div>
          <span className="font-display text-lg font-bold text-primary">PetPeep</span>
        </Link>
      </header>

      {/* Centered card area */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} PetPeep
      </footer>
    </div>
  )
}
