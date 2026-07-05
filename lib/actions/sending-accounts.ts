'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'

export async function getAccessibleAccounts(orgId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get user's organization membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Not a member of this organization' }
  }

  // Owners and admins see all accounts
  if (membership.role === 'owner' || membership.role === 'admin') {
    const { data, error } = await supabase
      .from('sending_accounts')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return { data }
  }

  // Members/viewers see only accounts they have access to
  const { data, error } = await supabase
    .from('sending_accounts')
    .select(`
      *,
      account_access!inner(user_id)
    `)
    .eq('organization_id', orgId)
    .eq('account_access.user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function createSendingAccount(data: {
  organization_id: string
  name: string
  email: string
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  use_tls: boolean
  provider?: string // Add optional provider field
}) {
  const supabase = await createClient()
  
  // Determine provider from host or use provided value
  let provider = data.provider || 'custom'
  if (!data.provider) {
    if (data.smtp_host.includes('gmail')) provider = 'gmail'
    else if (data.smtp_host.includes('sendgrid')) provider = 'sendgrid'
    else if (data.smtp_host.includes('mailgun')) provider = 'mailgun'
    else if (data.smtp_host.includes('resend')) provider = 'resend'
    else if (data.smtp_host.includes('ses') || data.smtp_host.includes('amazonaws')) provider = 'ses'
  }
  
  const insertData = {
    organization_id: data.organization_id,
    name: data.name,
    provider: provider,
    from_email: data.email, // Map email to from_email
    from_name: data.name, // Use name as from_name
    credential_encrypted: JSON.stringify({ // Map credentials to encrypted JSON
      username: data.smtp_username,
      password: data.smtp_password
    }),
    host: data.smtp_host, // Map smtp_host to host
    port: data.smtp_port, // Map smtp_port to port
    use_tls: data.use_tls,
    active: true // Set as active by default
  }
  
  // Map to correct database columns
  const { data: account, error } = await supabase
    .from('sending_accounts')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard')
  revalidatePath('/smtp')
  return { data: account }
}

export async function updateSendingAccount(
  id: string, 
  updates: {
    name?: string
    email?: string
    smtp_host?: string
    smtp_port?: number
    smtp_username?: string
    smtp_password?: string
    use_tls?: boolean
  }
) {
  const supabase = await createClient()
  
  // Map to correct database columns
  const dbUpdates: any = {}
  if (updates.name !== undefined) {
    dbUpdates.name = updates.name
    dbUpdates.from_name = updates.name // Also update from_name
  }
  if (updates.email !== undefined) dbUpdates.from_email = updates.email
  if (updates.smtp_host !== undefined) dbUpdates.host = updates.smtp_host
  if (updates.smtp_port !== undefined) dbUpdates.port = updates.smtp_port
  if (updates.use_tls !== undefined) dbUpdates.use_tls = updates.use_tls
  
  // If username or password is updated, update the credential_encrypted JSON
  if (updates.smtp_username !== undefined || updates.smtp_password !== undefined) {
    // Get current credentials
    const { data: current } = await supabase
      .from('sending_accounts')
      .select('credential_encrypted')
      .eq('id', id)
      .single()
    
    const currentCreds = current?.credential_encrypted ? JSON.parse(current.credential_encrypted) : {}
    
    dbUpdates.credential_encrypted = JSON.stringify({
      username: updates.smtp_username !== undefined ? updates.smtp_username : currentCreds.username,
      password: updates.smtp_password !== undefined ? updates.smtp_password : currentCreds.password
    })
  }
  
  const { error } = await supabase
    .from('sending_accounts')
    .update(dbUpdates)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/smtp')
  return { success: true }
}

export async function deleteSendingAccount(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('sending_accounts')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/smtp')
  return { success: true }
}

export async function testSMTPConnection(accountId: string) {
  const supabase = await createClient()
  
  // Get account details
  const { data: account, error } = await supabase
    .from('sending_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error || !account) {
    return { error: 'Account not found' }
  }

  try {
    // Parse credentials from encrypted JSON
    const credentials = JSON.parse(account.credential_encrypted)
    
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

    // Update last tested - no column exists for this, so skip
    // await supabase
    //   .from('sending_accounts')
    //   .update({ last_tested_at: new Date().toISOString() })
    //   .eq('id', accountId)

    return { success: true, message: 'Connection successful!' }
  } catch (err: any) {
    return { error: err.message || 'Connection failed' }
  }
}

export async function grantAccountAccess(accountId: string, userId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('account_access')
    .insert({
      account_id: accountId,
      user_id: userId,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function revokeAccountAccess(accountId: string, userId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('account_access')
    .delete()
    .eq('account_id', accountId)
    .eq('user_id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getAccountAccessList(accountId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('account_access')
    .select(`
      *,
      profiles:user_id (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('account_id', accountId)

  if (error) {
    return { error: error.message }
  }

  return { data }
}
