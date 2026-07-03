'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserOrganizations() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase.rpc('get_user_organizations', {
    user_uuid: user.id
  })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function getCurrentOrganization() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get first organization (we can add org switching later)
  const { data: orgs } = await supabase.rpc('get_user_organizations', {
    user_uuid: user.id
  })

  if (!orgs || orgs.length === 0) {
    return { error: 'No organization found' }
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgs[0].id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function updateOrganization(orgId: string, updates: {
  name?: string
  billing_email?: string
  billing_contact?: string
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function inviteTeamMember(orgId: string, email: string, role: 'admin' | 'member') {
  const supabase = await createClient()
  
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (!existingUser) {
    return { error: 'User not found. They need to sign up first.' }
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', orgId)
    .eq('user_id', existingUser.id)
    .single()

  if (existingMember) {
    return { error: 'User is already a member of this organization' }
  }

  // Add member
  const { error } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgId,
      user_id: existingUser.id,
      role,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function removeTeamMember(orgId: string, userId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateMemberRole(orgId: string, userId: string, role: 'admin' | 'member') {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('organization_id', orgId)
    .eq('user_id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getOrganizationMembers(orgId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      profiles:user_id (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('organization_id', orgId)

  if (error) {
    return { error: error.message }
  }

  return { data }
}
