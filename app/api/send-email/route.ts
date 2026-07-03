import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    organization_id,
    account_id,
    to_email,
    to_name,
    subject,
    body_html,
    body_text,
    reply_to,
  } = body

  // Validate required fields
  if (!organization_id || !account_id || !to_email || !subject || !body_html) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check suppression list
  const { data: suppressed } = await supabase
    .from('suppressed_recipients')
    .select('id')
    .eq('organization_id', organization_id)
    .eq('email', to_email)
    .single()

  if (suppressed) {
    return NextResponse.json({ error: 'Recipient is on the suppression list' }, { status: 400 })
  }

  // Get sending account
  const { data: account, error: accountError } = await supabase
    .from('sending_accounts')
    .select('*')
    .eq('id', account_id)
    .single()

  if (accountError || !account) {
    return NextResponse.json({ error: 'Sending account not found' }, { status: 404 })
  }

  // Check if user has access to this account
  const { data: hasAccess } = await supabase
    .from('account_access')
    .select('id')
    .eq('account_id', account_id)
    .eq('user_id', user.id)
    .single()

  // Check if user is org owner/admin
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organization_id)
    .eq('user_id', user.id)
    .single()

  if (!hasAccess && membership?.role !== 'owner' && membership?.role !== 'admin') {
    return NextResponse.json({ error: 'No access to this sending account' }, { status: 403 })
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: account.smtp_host,
    port: account.smtp_port,
    secure: account.use_tls,
    auth: {
      user: account.smtp_username,
      pass: account.smtp_password, // TODO: Decrypt in production
    },
  })

  try {
    // Send email
    const info = await transporter.sendMail({
      from: `${account.name || account.email} <${account.email}>`,
      to: to_name ? `${to_name} <${to_email}>` : to_email,
      subject: subject,
      text: body_text || '',
      html: body_html,
      replyTo: reply_to || account.email,
    })

    // Log sent email
    const { data: sentEmail } = await supabase
      .from('sent_emails')
      .insert({
        organization_id,
        account_id,
        to_email,
        to_name,
        subject,
        body_html,
        body_text,
        sent_by: user.id,
        message_id: info.messageId,
        status: 'sent',
      })
      .select()
      .single()

    // Log usage
    await supabase.from('usage_logs').insert({
      organization_id,
      user_id: user.id,
      action: 'email_sent',
      metadata: {
        account_id,
        email_id: sentEmail?.id,
      },
    })

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      emailId: sentEmail?.id
    })
  } catch (err: any) {
    // Log failed email
    await supabase
      .from('sent_emails')
      .insert({
        organization_id,
        account_id,
        to_email,
        to_name,
        subject,
        body_html,
        body_text,
        sent_by: user.id,
        status: 'failed',
        error_message: err.message,
      })

    return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 })
  }
}
