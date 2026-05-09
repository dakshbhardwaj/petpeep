/**
 * Global footer — Server Component.
 */
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
                <span className="text-xs font-bold text-white">P</span>
              </div>
              <span className="font-display text-lg font-bold text-primary">PetPeep</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your pet, always in safe paws.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Mumbai &amp; Pune
            </p>
          </div>

          {/* Pet Parents */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Pet Parents</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/sign-up" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Find a sitter
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="#trust" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Safety &amp; trust
                </Link>
              </li>
            </ul>
          </div>

          {/* Sitters */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Sitters</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/sign-up?type=sitter" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Become a sitter
                </Link>
              </li>
              <li>
                <Link href="#sitter-requirements" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Requirements
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} PetPeep. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ❤️ for Indian pet parents
          </p>
        </div>
      </div>
    </footer>
  )
}
