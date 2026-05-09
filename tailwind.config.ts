import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── PetPeep Brand Palette ──────────────────────────────────────────
        primary: {
          DEFAULT: "#005a71",
          container: "#0e7490",
          foreground: "#ffffff",
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#005a71",
          900: "#0c4a6e",
        },
        secondary: {
          DEFAULT: "#855300",
          container: "#fea619",
          foreground: "#ffffff",
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#855300",
        },
        // ── Surface Scale ──────────────────────────────────────────────────
        surface: {
          DEFAULT: "#f8f9ff",
          low: "#eff4ff",
          container: "#e5eeff",
          high: "#dce9ff",
        },
        // ── Semantic ───────────────────────────────────────────────────────
        success: {
          DEFAULT: "#005f40",
          light: "#dcfce7",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#92400e",
          light: "#fef3c7",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        // ── Background & Borders ───────────────────────────────────────────
        background: "#f8f9ff",
        foreground: "#0f172a",
        border: "#e2e8f0",
        input: "#e2e8f0",
        ring: "#005a71",
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
        },
        accent: {
          DEFAULT: "#f1f5f9",
          foreground: "#0f172a",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
      },
      fontFamily: {
        display: ["var(--font-quicksand)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      borderRadius: {
        card: "1rem",
        button: "0.5rem",
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 90, 113, 0.08)",
        "card-hover": "0 8px 24px rgba(0, 90, 113, 0.16)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}

export default config
