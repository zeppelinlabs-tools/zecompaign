'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'

export async function getSentEmails(orgId: string, filters?: {
  accountId?: string
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('sent_emails')
    .select(`
      *,
      sending_accounts:account_id (
        name,
        email
      ),
      profiles:sent_by (
        full_name,
        email
      )
    `)
    .eq('organization_id', orgId)
    .order('sent_at', { ascending: false })

  if (filters?.accountId) {
    query = query.eq('account_id', filters.accountId)
  }

  if (filters?.startDate) {
    query = query.gte('sent_at', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('sent_at', filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function sendEmail(draft: {
  organization_id: string
  account_id: string
  to_email: string
  to_name?: string
  subject: string
  body_html: string
  body_text?: string
  reply_to?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check suppression list
  const { data: suppressed } = await supabase
    .from('suppressed_recipients')
    .select('id')
    .eq('organization_id', draft.organization_id)
    .eq('email', draft.to_email)
    .single()

  if (suppressed) {
    return { error: 'Recipient is on the suppression list' }
  }

  // Get sending account
  const { data: account, error: accountError } = await supabase
    .from('sending_accounts')
    .select('*')
    .eq('id', draft.account_id)
    .single()

  if (accountError || !account) {
    return { error: 'Sending account not found' }
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: account.smtp_host,
    port: account.smtp_port,
    secure: account.use_tls,
    auth: {
      user: account.smtp_username,
      pass: account.smtp_password, // In production, decrypt this
    },
  })

  try {
    // Send email
    const info = await transporter.sendMail({
      from: `${account.name || account.email} <${account.email}>`,
      to: draft.to_name ? `${draft.to_name} <${draft.to_email}>` : draft.to_email,
      subject: draft.subject,
      text: draft.body_text,
      html: draft.body_html,
      replyTo: draft.reply_to || account.email,
    })

    // Log sent email
    const { data: sentEmail } = await supabase
      .from('sent_emails')
      .insert({
        organization_id: draft.organization_id,
        account_id: draft.account_id,
        to_email: draft.to_email,
        to_name: draft.to_name,
        subject: draft.subject,
        body_html: draft.body_html,
        body_text: draft.body_text,
        sent_by: user.id,
        message_id: info.messageId,
        status: 'sent',
      })
      .select()
      .single()

    // Log usage
    await supabase.from('usage_logs').insert({
      organization_id: draft.organization_id,
      user_id: user.id,
      action: 'email_sent',
      metadata: {
        account_id: draft.account_id,
        email_id: sentEmail?.id,
      },
    })

    revalidatePath('/dashboard')
    return { success: true, messageId: info.messageId }
  } catch (err: any) {
    // Log failed email
    await supabase
      .from('sent_emails')
      .insert({
        organization_id: draft.organization_id,
        account_id: draft.account_id,
        to_email: draft.to_email,
        to_name: draft.to_name,
        subject: draft.subject,
        body_html: draft.body_html,
        body_text: draft.body_text,
        sent_by: user.id,
        status: 'failed',
        error_message: err.message,
      })

    return { error: err.message || 'Failed to send email' }
  }
}

export async function getEmailStats(orgId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sent_emails')
    .select('status')
    .eq('organization_id', orgId)

  if (error) {
    return { error: error.message }
  }

  const stats = {
    total: data.length,
    sent: data.filter(e => e.status === 'sent').length,
    failed: data.filter(e => e.status === 'failed').length,
  }

  return { data: stats }
}

export async function addToSuppressionList(orgId: string, email: string, reason: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('suppressed_recipients')
    .insert({
      organization_id: orgId,
      email,
      reason,
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function removeFromSuppressionList(orgId: string, email: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('suppressed_recipients')
    .delete()
    .eq('organization_id', orgId)
    .eq('email', email)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
