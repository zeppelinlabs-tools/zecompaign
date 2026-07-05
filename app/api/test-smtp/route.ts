import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting: 10 connection tests per minute per user
  const rateLimitResult = checkRateLimit(user.id, {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10, // 10 tests per minute
  })

  if (rateLimitResult) {
    return rateLimitResult
  }

  const body = await request.json()
  const { account_id } = body

  if (!account_id) {
    return NextResponse.json({ error: 'Missing account_id' }, { status: 400 })
  }

  // Get account details
  const { data: account, error } = await supabase
    .from('sending_accounts')
    .select('*')
    .eq('id', account_id)
    .single()

  if (error || !account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  // Check if user has access to this account
  const { data: hasAccess } = await supabase
    .from('account_access')
    .select('id')
    .eq('account_id', account_id)
    .eq('user_id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', account.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!hasAccess && membership?.role !== 'owner' && membership?.role !== 'admin') {
    return NextResponse.json({ error: 'No access to this account' }, { status: 403 })
  }

  try {
    // Parse credentials from encrypted JSON
    let credentials
    try {
      credentials = JSON.parse(account.credential_encrypted)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid account credentials format' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host: account.host,
      port: account.port,
      secure: account.use_tls,
      auth: {
        user: credentials.username,
        pass: credentials.password,
      },
    })

    await transporter.verify()

    return NextResponse.json({ 
      success: true, 
      message: 'SMTP connection successful!' 
    })
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message || 'Connection failed',
      details: err.code || 'UNKNOWN_ERROR'
    }, { status: 400 })
  }
}
