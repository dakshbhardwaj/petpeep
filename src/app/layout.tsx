import type { Metadata, Viewport } from "next"
import { Inter, Quicksand } from "next/font/google"
import "./globals.css"

// Load Inter for body text
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

// Load Quicksand for headings/display text
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "PetPeep — Your pet, always in safe paws",
    template: "%s | PetPeep",
  },
  description:
    "Find verified, vetted pet sitters in Mumbai and Pune. Drop-in visits for dogs and cats — no kennels, just home-like care.",
  keywords: ["pet sitter", "dog sitter", "cat sitter", "Mumbai", "Pune", "pet care India"],
  authors: [{ name: "PetPeep" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://petpeep.in",
    siteName: "PetPeep",
    title: "PetPeep — Your pet, always in safe paws",
    description:
      "Find verified, vetted pet sitters in Mumbai and Pune. Drop-in visits for dogs and cats.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PetPeep — Your pet, always in safe paws",
    description:
      "Find verified, vetted pet sitters in Mumbai and Pune. Drop-in visits for dogs and cats.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#005a71",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${quicksand.variable}`}>
      <body className="min-h-screen bg-background">{children}</body>
    </html>
  )
}
