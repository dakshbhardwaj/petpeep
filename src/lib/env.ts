/**
 * Environment variable validation using Zod.
 * Import from here — never use process.env directly outside this file.
 * This ensures all required env vars are present at startup.
 */
import { z } from "zod"

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Database
  DATABASE_URL: z.string().min(1),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_EMAIL: z.string().email().optional(),

  // Runtime
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

// Validate on first import — fails fast at startup if anything is missing
const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error("❌ Invalid environment variables:")
  console.error(_env.error.flatten().fieldErrors)
  // In production, throw to prevent startup
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment variables — check server logs.")
  }
}

export const env = _env.success ? _env.data : (process.env as z.infer<typeof envSchema>)
