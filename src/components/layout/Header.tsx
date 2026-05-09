/**
 * Global header — shown on the landing page and public pages.
 * For authenticated app pages, each route group has its own navigation.
 *
 * Server Component — no interactivity needed.
 */
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-bold text-white">P</span>
          </div>
          <span className="font-display text-xl font-bold text-primary">PetPeep</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            How it works
          </Link>
          <Link href="#trust" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Why PetPeep
          </Link>
          <Link href="/sign-up?type=sitter" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Become a sitter
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Find a sitter</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
