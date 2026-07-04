import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

// Helper function to generate unsubscribe token
function generateUnsubscribeToken(email: string, orgId: string): string {
  const data = {
    email,
    orgId,
    timestamp: Date.now(),
  }
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

// Helper function to inject unsubscribe link into HTML
function injectUnsubscribeLink(html: string, unsubscribeUrl: string): string {
  const unsubscribeFooter = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #DEDAD0; font-size: 12px; color: #999; text-align: center;">
      <p>You received this email because you subscribed to our mailing list.</p>
      <p><a href="${unsubscribeUrl}" style="color: #3457A6; text-decoration: underline;">Unsubscribe from this list</a></p>
    </div>
  `
  
  // Try to inject before closing body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeFooter}</body>`)
  }
  
  // Otherwise append to end
  return html + unsubscribeFooter
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting: 30 emails per minute per user
  const rateLimitResult = checkRateLimit(user.id, {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 30, // 30 emails per minute
  })

  if (rateLimitResult) {
    return rateLimitResult
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

  // Generate unsubscribe token and link
  const unsubscribeToken = generateUnsubscribeToken(to_email, organization_id)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${unsubscribeToken}`

  // Inject unsubscribe link into HTML body (CAN-SPAM compliance)
  const finalBodyHtml = injectUnsubscribeLink(body_html, unsubscribeUrl)

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
    // Send email with unsubscribe header (RFC 8058 compliance)
    const info = await transporter.sendMail({
      from: `${account.name || account.email} <${account.email}>`,
      to: to_name ? `${to_name} <${to_email}>` : to_email,
      subject: subject,
      text: body_text ? `${body_text}\n\n---\nUnsubscribe: ${unsubscribeUrl}` : '',
      html: finalBodyHtml,
      replyTo: reply_to || account.email,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
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
        body_html: finalBodyHtml, // Store the version with unsubscribe link
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
