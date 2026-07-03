'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestPlanUpgrade(data: {
  organization_id: string
  requested_plan: 'starter' | 'pro' | 'business' | 'enterprise'
  billing_period: 'monthly' | 'annual'
  amount_paid: number
  billing_contact: string
  payment_proof_url?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: request, error } = await supabase
    .from('payment_requests')
    .insert({
      ...data,
      requested_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log usage
  await supabase.from('usage_logs').insert({
    organization_id: data.organization_id,
    user_id: user.id,
    action: 'payment_request_created',
    metadata: {
      request_id: request.id,
      plan: data.requested_plan,
    },
  })

  revalidatePath('/dashboard')
  return { data: request }
}

export async function getPaymentRequests(orgId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('payment_requests')
    .select(`
      *,
      profiles:requested_by (
        full_name,
        email
      )
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function getPaymentRequestStatus(requestId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function getPlanLimits(plan: string) {
  const limits = {
    free: {
      accounts: 3,
      teamMembers: 1,
      templates: 10,
      aiGenerations: 5,
    },
    starter: {
      accounts: 10,
      teamMembers: 3,
      templates: 50,
      aiGenerations: 50,
    },
    pro: {
      accounts: 50,
      teamMembers: 10,
      templates: 200,
      aiGenerations: 200,
    },
    business: {
      accounts: 999999, // unlimited
      teamMembers: 50,
      templates: 999999,
      aiGenerations: 999999,
    },
    enterprise: {
      accounts: 999999,
      teamMembers: 999999,
      templates: 999999,
      aiGenerations: 999999,
    },
  }

  return limits[plan as keyof typeof limits] || limits.free
}

export async function checkPlanLimit(orgId: string, limitType: 'accounts' | 'teamMembers' | 'templates') {
  const supabase = await createClient()
  
  // Get organization plan
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single()

  if (orgError || !org) {
    return { error: 'Organization not found' }
  }

  const limits = await getPlanLimits(org.plan)

  // Get current usage
  let currentUsage = 0

  if (limitType === 'accounts') {
    const { count } = await supabase
      .from('sending_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
    currentUsage = count || 0
  } else if (limitType === 'teamMembers') {
    const { count } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
    currentUsage = count || 0
  } else if (limitType === 'templates') {
    const { count } = await supabase
      .from('templates')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
    currentUsage = count || 0
  }

  const maxLimit = limits[limitType]
  const isAtLimit = currentUsage >= maxLimit

  return {
    data: {
      current: currentUsage,
      limit: maxLimit,
      isAtLimit,
      remaining: maxLimit - currentUsage,
    },
  }
}

export async function cancelSubscription(orgId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('organizations')
    .update({
      billing_status: 'cancelled',
    })
    .eq('id', orgId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
