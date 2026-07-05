/**
 * QStash Webhook Handler for Sending Emails
 * 
 * This endpoint is called by QStash to actually send queued emails
 * Includes signature verification for security
 */

import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createServiceRoleClient } from '@/lib/supabase/server'

async function handler(req: NextRequest) {
  console.log('📬 QStash webhook received')

  try {
    const body = await req.json()
    const { logId, organizationId, to, subject, html, text, smtpAccountId } = body

    console.log('📧 Processing email send:', { logId, to, subject })

    const supabase = createServiceRoleClient()

    // Get SMTP configuration
    let smtpConfig: any

    if (smtpAccountId) {
      // Use organization's SMTP account
      const { data: smtp } = await supabase
        .from('sending_accounts')
        .select('*')
        .eq('id', smtpAccountId)
        .eq('active', true)
        .single()

      if (smtp) {
        // Parse credentials from encrypted JSON
        const credentials = JSON.parse(smtp.credential_encrypted)
        
        smtpConfig = {
          host: smtp.host,
          port: smtp.port,
          secure: smtp.use_tls,
          auth: {
            user: credentials.username,
            pass: credentials.password
          },
          fromName: smtp.from_name,
          fromEmail: smtp.from_email
        }
      }
    }

    // Fallback to platform SMTP
    if (!smtpConfig && process.env.SMTP_HOST) {
      smtpConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!
        },
        fromName: 'zecompaign',
        fromEmail: process.env.SMTP_FROM || 'noreply@zecompaign.com'
      }
    }

    if (!smtpConfig) {
      throw new Error('No SMTP configuration available')
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth
    })

    // Send email
    const info = await transporter.sendMail({
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to,
      subject,
      text,
      html
    })

    console.log('✅ Email sent successfully:', info.messageId)

    // Update audit log
    await supabase
      .from('email_audit_logs')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          message_id: info.messageId,
          response: info.response
        }
      })
      .eq('id', logId)

    return NextResponse.json({
      success: true,
      messageId: info.messageId
    })

  } catch (error: any) {
    console.error('❌ Email send failed:', error)

    // Try to update log with error
    try {
      const body = await req.json()
      const supabase = createServiceRoleClient()

      await supabase
        .from('email_audit_logs')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', body.logId)
    } catch (logError) {
      console.error('Failed to update error log:', logError)
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Wrap with QStash signature verification
export const POST = verifySignatureAppRouter(handler)

// Metadata for better monitoring
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds timeout
