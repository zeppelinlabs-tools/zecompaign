/**
 * Email Sender Utility
 * 
 * Sends transactional emails using zecompaign's own SMTP accounts (dogfooding!)
 * Falls back to platform SMTP if organization doesn't have an account configured.
 */

import nodemailer from 'nodemailer'
import { createServiceRoleClient } from '@/lib/supabase/server'

interface InvitationEmailParams {
  to: string
  organizationName: string
  inviterName: string
  role: string
  inviteUrl: string
  expiresInDays: number
  organizationId?: string
}

/**
 * Get SMTP configuration for sending emails
 * Prioritizes: Organization SMTP > Platform SMTP > throws error
 */
async function getSmtpConfig(organizationId?: string) {
  const supabase = createServiceRoleClient()

  // Try to get organization's SMTP account first
  if (organizationId) {
    const { data: orgSmtp } = await supabase
      .from('sending_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_verified', true)
      .limit(1)
      .single()

    if (orgSmtp) {
      return {
        host: orgSmtp.smtp_host,
        port: orgSmtp.smtp_port,
        secure: orgSmtp.smtp_port === 465,
        auth: {
          user: orgSmtp.smtp_username,
          pass: orgSmtp.smtp_password
        },
        fromName: orgSmtp.from_name,
        fromEmail: orgSmtp.from_email
      }
    }
  }

  // Fall back to platform SMTP from environment
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      fromName: 'zecompaign',
      fromEmail: process.env.SMTP_FROM || 'noreply@zecompaign.com'
    }
  }

  throw new Error('No SMTP configuration available. Please configure an SMTP account.')
}

export async function sendInvitationEmail(params: InvitationEmailParams) {
  const { to, organizationName, inviterName, role, inviteUrl, expiresInDays, organizationId } = params

  try {
    // Get SMTP configuration
    const smtpConfig = await getSmtpConfig(organizationId)

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth
    })

    // Email subject and template
    const subject = `You've been invited to join ${organizationName} on zecompaign`
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3457A6 0%, #264182 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">zecompaign</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Campaign Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1F2937; font-size: 24px; font-weight: 700;">You've been invited!</h2>
              
              <p style="margin: 0 0 16px; color: #4B5563; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on zecompaign.
              </p>

              <!-- Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #F3F4F6; border-radius: 6px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: 600;">Organization:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-size: 14px; text-align: right;">${organizationName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: 600;">Role:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-size: 14px; text-align: right; text-transform: capitalize;">${role}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: 600;">Expires:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-size: 14px; text-align: right;">In ${expiresInDays} days</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3457A6 0%, #264182 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                Once you sign up, you'll automatically be added to the organization with ${role} access.
              </p>

              <p style="margin: 16px 0 0; color: #9CA3AF; font-size: 12px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #3457A6; word-break: break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #6B7280; font-size: 12px;">
                This invitation was sent by ${organizationName}<br>
                Powered by <strong>zecompaign</strong> Campaign Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    const textBody = `
You've been invited to join ${organizationName} on zecompaign!

${inviterName} has invited you to join their team.

Organization: ${organizationName}
Role: ${role}
Expires: In ${expiresInDays} days

To accept this invitation, please visit:
${inviteUrl}

Once you sign up, you'll automatically be added to the organization with ${role} access.

---
zecompaign Campaign Platform
${process.env.NEXT_PUBLIC_SITE_URL}
    `

    // Send email
    const info = await transporter.sendMail({
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to,
      subject,
      text: textBody,
      html: htmlBody
    })

    console.log('✅ Invitation email sent successfully!')
    console.log(`   To: ${to}`)
    console.log(`   Message ID: ${info.messageId}`)

    return { success: true, messageId: info.messageId }

  } catch (error) {
    console.error('❌ Failed to send invitation email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
