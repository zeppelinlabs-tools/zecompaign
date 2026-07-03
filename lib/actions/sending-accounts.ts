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

  const { data, error } = await supabase.rpc('get_user_sending_accounts', {
    org_uuid: orgId,
    user_uuid: user.id
  })

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
}) {
  const supabase = await createClient()
  
  const { data: account, error } = await supabase
    .from('sending_accounts')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
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
  
  const { error } = await supabase
    .from('sending_accounts')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
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
    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: account.use_tls,
      auth: {
        user: account.smtp_username,
        pass: account.smtp_password, // In production, decrypt this
      },
    })

    await transporter.verify()

    // Update last tested
    await supabase
      .from('sending_accounts')
      .update({ last_tested_at: new Date().toISOString() })
      .eq('id', accountId)

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
