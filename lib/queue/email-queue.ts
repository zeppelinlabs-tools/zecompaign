/**
 * Email Queue with QStash Integration
 * 
 * Provides reliable email delivery with:
 * - Automatic retries
 * - Status tracking
 * - Duplicate prevention
 */

import { Client } from '@upstash/qstash'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Validate QStash token
if (!process.env.QSTASH_TOKEN) {
  console.error('❌ QSTASH_TOKEN is not configured!')
}

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!
})

export interface QueueEmailParams {
  organizationId: string
  sentBy: string
  to: string
  subject: string
  html: string
  text: string
  templateId?: string
  smtpAccountId?: string
  metadata?: Record<string, any>
}

/**
 * Queue an email for sending via QStash
 * Includes duplicate prevention
 */
export async function queueEmail(params: QueueEmailParams) {
  const {
    organizationId,
    sentBy,
    to,
    subject,
    html,
    text,
    templateId,
    smtpAccountId,
    metadata = {}
  } = params

  console.log('📨 Queueing email:', { to, subject, organizationId })

  const supabase = createServiceRoleClient()

  // Check for duplicates
  const { data: isDuplicate } = await supabase.rpc('check_duplicate_email', {
    p_organization_id: organizationId,
    p_recipient_email: to,
    p_subject: subject,
    p_hours_ago: 24
  })

  if (isDuplicate) {
    console.log('⚠️ Duplicate email detected, skipping send:', { to, subject })
    return {
      success: false,
      error: 'Email already sent recently',
      duplicate: true
    }
  }

  try {
    // Create audit log entry with 'queued' status
    const { data: logEntry, error: logError } = await supabase
      .from('email_audit_logs')
      .insert({
        organization_id: organizationId,
        sent_by: sentBy,
        recipient_email: to,
        subject,
        template_id: templateId,
        smtp_account_id: smtpAccountId,
        status: 'queued',
        metadata: {
          ...metadata,
          html_length: html.length,
          text_length: text.length
        }
      })
      .select()
      .single()

    if (logError) {
      console.error('❌ Failed to create audit log:', logError)
      
      // Check if it's a duplicate key error
      if (logError.code === '23505') {
        return {
          success: false,
          error: 'Email already queued',
          duplicate: true
        }
      }
      
      return {
        success: false,
        error: logError.message
      }
    }

    console.log('✅ Audit log created:', logEntry.id)

    // Queue email with QStash
    console.log('📤 Queueing with QStash to:', `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/qstash/send-email`)
    
    try {
      const response = await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/qstash/send-email`,
        body: {
          logId: logEntry.id,
          organizationId,
          to,
          subject,
          html,
          text,
          smtpAccountId
        },
        retries: 3,
        delay: 0,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ QStash response:', response)

      // Update log with QStash message ID
      await supabase
        .from('email_audit_logs')
        .update({
          qstash_message_id: response.messageId,
          status: 'sending'
        })
        .eq('id', logEntry.id)

      console.log('✅ Email queued with QStash:', {
        messageId: response.messageId,
        logId: logEntry.id
      })

      return {
        success: true,
        messageId: response.messageId,
        logId: logEntry.id
      }
    } catch (qstashError: any) {
      console.error('❌ QStash error:', qstashError)
      
      // Update audit log with error
      await supabase
        .from('email_audit_logs')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: `QStash error: ${qstashError.message || 'Unknown error'}`
        })
        .eq('id', logEntry.id)
      
      return {
        success: false,
        error: `Failed to queue with QStash: ${qstashError.message || 'Unknown error'}`,
        logId: logEntry.id
      }
    }

  } catch (error: any) {
    console.error('❌ Failed to queue email:', error)
    return {
      success: false,
      error: error.message || 'Failed to queue email'
    }
  }
}

/**
 * Get email delivery status from audit logs
 */
export async function getEmailStatus(logId: string) {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('email_audit_logs')
    .select('*')
    .eq('id', logId)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

/**
 * Retry a failed email
 */
export async function retryFailedEmail(logId: string) {
  const supabase = createServiceRoleClient()

  const { data: log, error: fetchError } = await supabase
    .from('email_audit_logs')
    .select('*')
    .eq('id', logId)
    .single()

  if (fetchError || !log) {
    return { error: 'Email log not found' }
  }

  if (log.status !== 'failed') {
    return { error: 'Can only retry failed emails' }
  }

  // Queue again
  const response = await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/qstash/send-email`,
    body: {
      logId: log.id,
      organizationId: log.organization_id,
      to: log.recipient_email,
      subject: log.subject,
      html: log.metadata.html || '',
      text: log.metadata.text || '',
      smtpAccountId: log.smtp_account_id
    },
    retries: 3,
    delay: 0
  })

  // Update status
  await supabase
    .from('email_audit_logs')
    .update({
      status: 'queued',
      qstash_message_id: response.messageId,
      error_message: null
    })
    .eq('id', logId)

  return { success: true, messageId: response.messageId }
}
