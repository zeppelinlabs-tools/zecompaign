import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

/**
 * Public Unsubscribe Handler
 * 
 * This route handles unsubscribe requests from email recipients.
 * The token is a base64-encoded JSON containing: { email, organizationId, timestamp }
 * 
 * Example URL: https://zecompaign.com/api/unsubscribe/eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJvcmdJZCI6IjEyMyJ9
 */

interface UnsubscribeToken {
  email: string
  orgId: string
  timestamp: number
}

function decodeToken(token: string): UnsubscribeToken | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    const data = JSON.parse(decoded) as UnsubscribeToken
    
    // Validate token structure
    if (!data.email || !data.orgId || !data.timestamp) {
      return null
    }
    
    // Check token age (valid for 90 days)
    const tokenAge = Date.now() - data.timestamp
    const maxAge = 90 * 24 * 60 * 60 * 1000 // 90 days in milliseconds
    
    if (tokenAge > maxAge) {
      return null
    }
    
    return data
  } catch (err) {
    return null
  }
}

export function generateUnsubscribeToken(email: string, orgId: string): string {
  const data: UnsubscribeToken = {
    email,
    orgId,
    timestamp: Date.now(),
  }
  
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const supabase = await createClient()
  const { token } = await params

  // Rate limiting by IP to prevent abuse
  const clientIP = getClientIP(request)
  const rateLimitResult = checkRateLimit(`unsubscribe_${clientIP}`, {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10, // 10 unsubscribes per minute per IP
  })

  if (rateLimitResult) {
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Too Many Requests - zecompaign</title>
        <style>
          body { font-family: Inter, system-ui, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
          h1 { color: #B3392C; }
          p { color: #4A4E5A; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>⚠️ Too Many Requests</h1>
        <p>Please wait a moment before trying again.</p>
      </body>
      </html>
      `,
      {
        status: 429,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  }

  // Decode and validate token
  const tokenData = decodeToken(token)

  if (!tokenData) {
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invalid Link - zecompaign</title>
        <style>
          body { font-family: Inter, system-ui, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
          h1 { color: #B3392C; }
          p { color: #4A4E5A; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>❌ Invalid Unsubscribe Link</h1>
        <p>This unsubscribe link is invalid or has expired. If you continue to receive unwanted emails, please contact the sender directly.</p>
      </body>
      </html>
      `,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  }

  try {
    // Check if already unsubscribed
    const { data: existing } = await supabase
      .from('suppressed_recipients')
      .select('id')
      .eq('organization_id', tokenData.orgId)
      .eq('email', tokenData.email)
      .single()

    if (existing) {
      return new Response(
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Already Unsubscribed - zecompaign</title>
          <style>
            body { font-family: Inter, system-ui, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
            h1 { color: #1F8A70; }
            p { color: #4A4E5A; line-height: 1.6; }
            .email { background: #FAF9F6; padding: 10px; border-radius: 6px; font-family: monospace; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>✅ Already Unsubscribed</h1>
          <p>The email address:</p>
          <div class="email">${tokenData.email}</div>
          <p>was already unsubscribed from this organization. You will not receive any more emails.</p>
        </body>
        </html>
        `,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      )
    }

    // Add to suppression list
    const { error } = await supabase
      .from('suppressed_recipients')
      .insert({
        organization_id: tokenData.orgId,
        email: tokenData.email,
        reason: 'User unsubscribe via link',
        unsubscribed_at: new Date().toISOString(),
      })

    if (error) {
      throw error
    }

    // Success page
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed Successfully - zecompaign</title>
        <style>
          body { font-family: Inter, system-ui, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
          h1 { color: #1F8A70; }
          p { color: #4A4E5A; line-height: 1.6; }
          .email { background: #FAF9F6; padding: 10px; border-radius: 6px; font-family: monospace; margin: 20px 0; }
          .info { background: #F0F7F5; padding: 15px; border-radius: 8px; border-left: 4px solid #1F8A70; margin: 20px 0; text-align: left; }
        </style>
      </head>
      <body>
        <h1>✓ Successfully Unsubscribed</h1>
        <p>The email address:</p>
        <div class="email">${tokenData.email}</div>
        <p>has been successfully removed from this mailing list.</p>
        <div class="info">
          <strong>What happens now?</strong>
          <ul style="margin: 10px 0; padding-left: 20px; text-align: left;">
            <li>You will no longer receive emails from this sender</li>
            <li>It may take up to 48 hours for the change to take effect</li>
            <li>If you continue to receive emails, please contact the sender directly</li>
          </ul>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          This unsubscribe was processed by <strong>zecompaign</strong> on behalf of the sender.
        </p>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  } catch (err: any) {
    console.error('Unsubscribe error:', err)
    
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - zecompaign</title>
        <style>
          body { font-family: Inter, system-ui, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
          h1 { color: #B3392C; }
          p { color: #4A4E5A; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>⚠️ Something Went Wrong</h1>
        <p>We encountered an error while processing your unsubscribe request. Please try again later or contact the sender directly.</p>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  }
}

// Also support POST for HTML forms
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  return GET(request, { params })
}
