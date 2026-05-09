/**
 * src/lib/email.ts
 *
 * Resend email helpers for PetPeep transactional emails.
 * Only called from server-side API routes — never imported client-side.
 */

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// Sender address — use resend.dev for development; custom domain in production
const FROM = `PetPeep <${process.env.EMAIL_FROM ?? "onboarding@resend.dev"}>`
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@petpeep.in"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

// ─── Email: Sitter application received ──────────────────────────────────────

export async function sendApplicationReceived(opts: {
  to: string
  name: string
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Your PetPeep sitter application has been received",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #005a71; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">PetPeep</h1>
        </div>
        <div style="padding: 32px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <h2 style="font-size: 20px; color: #005a71; margin-top: 0;">Hi ${opts.name}, we've received your application!</h2>
          <p style="line-height: 1.6; color: #444;">
            Thank you for applying to become a PetPeep sitter. Our team will carefully review your application
            and get back to you within <strong>3–5 business days</strong>.
          </p>
          <p style="line-height: 1.6; color: #444;"><strong>What happens next:</strong></p>
          <ul style="color: #444; line-height: 2;">
            <li>Our team will review your application and ID documents</li>
            <li>We may reach out if we have questions</li>
            <li>You'll receive an email once a decision has been made</li>
          </ul>
          <p style="line-height: 1.6; color: #444;">
            You can check your application status anytime on your
            <a href="${APP_URL}/sitter/dashboard" style="color: #005a71;">sitter dashboard</a>.
          </p>
          <p style="color: #888; font-size: 13px; margin-top: 32px;">
            Questions? Reply to this email or write to us at support@petpeep.in
          </p>
        </div>
      </div>
    `,
  })
}

// ─── Email: New application alert to admin ────────────────────────────────────

export async function sendNewApplicationToAdmin(opts: {
  sitterName: string
  sitterEmail: string
  applicationId: string
}) {
  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New sitter application: ${opts.sitterName}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #005a71;">New Sitter Application</h2>
        <p><strong>Name:</strong> ${opts.sitterName}</p>
        <p><strong>Email:</strong> ${opts.sitterEmail}</p>
        <p>
          <a href="${APP_URL}/admin/vetting/${opts.applicationId}"
             style="display: inline-block; background: #005a71; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Review Application
          </a>
        </p>
      </div>
    `,
  })
}

// ─── Email: Application approved ─────────────────────────────────────────────

export async function sendApplicationApproved(opts: {
  to: string
  name: string
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Welcome to PetPeep — you're approved! 🎉",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #005a71; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">PetPeep</h1>
        </div>
        <div style="padding: 32px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <h2 style="font-size: 20px; color: #005a71; margin-top: 0;">Congratulations, ${opts.name}! You're approved 🐾</h2>
          <p style="line-height: 1.6; color: #444;">
            Your PetPeep sitter application has been reviewed and <strong>approved</strong>.
            Your profile is now live and pet parents can start booking you!
          </p>
          <p style="line-height: 1.6; color: #444;"><strong>What's next:</strong></p>
          <ul style="color: #444; line-height: 2;">
            <li>Set your availability on your dashboard</li>
            <li>Complete your profile with a great bio and photo</li>
            <li>Start receiving booking requests from pet parents</li>
          </ul>
          <a href="${APP_URL}/sitter/dashboard"
             style="display: inline-block; background: #005a71; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            Go to your dashboard
          </a>
          <p style="color: #888; font-size: 13px; margin-top: 32px;">
            Welcome to the PetPeep family! 🐶🐱
          </p>
        </div>
      </div>
    `,
  })
}

// ─── Email: Application rejected ─────────────────────────────────────────────

export async function sendApplicationRejected(opts: {
  to: string
  name: string
  notes?: string
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Your PetPeep sitter application — an update",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #005a71; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">PetPeep</h1>
        </div>
        <div style="padding: 32px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <h2 style="font-size: 20px; margin-top: 0;">Hi ${opts.name}, an update on your application</h2>
          <p style="line-height: 1.6; color: #444;">
            Thank you for your interest in joining PetPeep as a sitter. After careful review,
            we're unable to move forward with your application at this time.
          </p>
          ${
            opts.notes
              ? `<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 4px; margin: 20px 0;">
                   <p style="margin: 0; color: #444;"><strong>Reviewer notes:</strong></p>
                   <p style="margin: 8px 0 0; color: #444;">${opts.notes}</p>
                 </div>`
              : ""
          }
          <p style="line-height: 1.6; color: #444;">
            We appreciate your time and encourage you to apply again in the future.
          </p>
          <p style="color: #888; font-size: 13px; margin-top: 32px;">
            Questions? Reply to this email or write to us at support@petpeep.in
          </p>
        </div>
      </div>
    `,
  })
}
