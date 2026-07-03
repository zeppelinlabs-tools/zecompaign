'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function isAdmin() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return !error && !!data
}

export async function getPendingPaymentRequests() {
  const supabase = await createClient()
  
  // Check admin access
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('payment_requests')
    .select(`
      *,
      organizations:organization_id (
        id,
        name,
        billing_email
      ),
      profiles:requested_by (
        full_name,
        email
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function approvePaymentRequest(requestId: string, adminNotes?: string) {
  const supabase = await createClient()
  
  // Check admin access
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Unauthorized' }
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Get request details
  const { data: request, error: fetchError } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) {
    return { error: 'Payment request not found' }
  }

  // Update request status
  const { error: updateError } = await supabase
    .from('payment_requests')
    .update({
      status: 'approved',
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
    })
    .eq('id', requestId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Update organization plan
  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      plan: request.requested_plan,
      billing_period: request.billing_period,
      billing_status: 'active',
      billing_start_date: new Date().toISOString(),
    })
    .eq('id', request.organization_id)

  if (orgError) {
    return { error: orgError.message }
  }

  // Log audit
  await supabase.from('audit_log').insert({
    organization_id: request.organization_id,
    user_id: user?.id,
    action: 'payment_approved',
    resource_type: 'payment_request',
    resource_id: requestId,
    changes: {
      from_plan: 'free',
      to_plan: request.requested_plan,
      amount: request.amount_paid,
    },
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function rejectPaymentRequest(requestId: string, rejectionReason: string) {
  const supabase = await createClient()
  
  // Check admin access
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Unauthorized' }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('payment_requests')
    .update({
      status: 'rejected',
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      admin_notes: rejectionReason,
    })
    .eq('id', requestId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function getAllOrganizations(filters?: {
  plan?: string
  billingStatus?: string
}) {
  const supabase = await createClient()
  
  // Check admin access
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Unauthorized' }
  }

  let query = supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.plan) {
    query = query.eq('plan', filters.plan)
  }

  if (filters?.billingStatus) {
    query = query.eq('billing_status', filters.billingStatus)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function suspendOrganization(orgId: string, reason: string) {
  const supabase = await createClient()
  
  // Check admin access
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Unauthorized' }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('organizations')
    .update({
      billing_status: 'suspended',
    })
    .eq('id', orgId)

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await supabase.from('audit_log').insert({
    organization_id: orgId,
    user_id: user?.id,
    action: 'organization_suspended',
    resource_type: 'organization',
    resource_id: orgId,
    changes: {
      reason,
    },
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function activateOrganization(orgId: string) {
  const supabase = await createClient()
  
  // Check admin access
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      billing_status: 'active',
    })
    .eq('id', orgId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}
