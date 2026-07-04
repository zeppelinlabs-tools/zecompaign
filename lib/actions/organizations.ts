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

export async function inviteTeamMember(orgId: string, email: string, role: 'admin' | 'member' | 'viewer') {
  const supabase = await createClient()
  
  // Validate current user has permission
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  console.log('Inviting member:', { orgId, email, role })

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email address' }
  }

  // Check if current user is owner or admin
  const { data: currentMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
    return { error: 'Only owners and admins can invite team members' }
  }

  // Get organization name for the invitation email
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single()

  // Check if user already exists
  const { data: existingUser, error: userError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('email', email)
    .single()

  console.log('User lookup result:', { existingUser, userError })

  if (existingUser) {
    // User exists - check if already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', existingUser.id)
      .single()

    if (existingMember) {
      return { error: 'User is already a member of this organization' }
    }

    // Add existing user directly using service role
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()
    
    const { error } = await serviceClient
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: existingUser.id,
        role,
      })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/team')
    revalidatePath('/dashboard')
    revalidatePath('/organizations')
    return { success: true, message: `${existingUser.full_name || email} added to organization` }
  }

  // User doesn't exist - create invitation
  const { data: existingInvite } = await supabase
    .from('organization_invitations')
    .select('id, status, expires_at')
    .eq('organization_id', orgId)
    .eq('email', email)
    .single()

  if (existingInvite) {
    if (existingInvite.status === 'pending' && new Date(existingInvite.expires_at) > new Date()) {
      return { error: 'An invitation has already been sent to this email' }
    }
    
    // Update expired or accepted invitation with new secure token
    const token = require('crypto').randomBytes(32).toString('hex')
    
    // Use service role to ensure update succeeds
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()
    
    const { error: updateError } = await serviceClient
      .from('organization_invitations')
      .update({
        role,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        invited_by: user.id,
        token
      })
      .eq('id', existingInvite.id)

    if (updateError) {
      return { error: updateError.message }
    }
  } else {
    // Create new invitation with secure token
    const token = require('crypto').randomBytes(32).toString('hex')
    
    // Use service role to ensure insert succeeds
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()
    
    const { error: inviteError } = await serviceClient
      .from('organization_invitations')
      .insert({
        organization_id: orgId,
        email,
        role,
        invited_by: user.id,
        token
      })

    if (inviteError) {
      return { error: inviteError.message }
    }
  }

  // Send invitation email using nodemailer
  try {
    const { sendInvitationEmail } = await import('@/lib/email-sender')
    const inviterProfile = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Get the invitation token
    const { data: invitation } = await supabase
      .from('organization_invitations')
      .select('token')
      .eq('organization_id', orgId)
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (!invitation?.token) {
      console.error('⚠️ No invitation token found')
      return { error: 'Failed to create secure invitation' }
    }

    const inviterName = inviterProfile.data?.full_name || inviterProfile.data?.email || 'A team member'
    // Use secure token-based URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?token=${invitation.token}`

    const emailResult = await sendInvitationEmail({
      to: email,
      organizationName: org?.name || 'the organization',
      inviterName,
      role,
      inviteUrl,
      expiresInDays: 7,
      organizationId: orgId,
      sentBy: user.id,
      smtpAccountId: undefined // Will use platform SMTP or org's first account
    })

    if (emailResult.duplicate) {
      console.log('⚠️ Invitation email already sent recently')
      // Still return success since invitation is created
    } else if (emailResult.success) {
      console.log('✅ Invitation email queued successfully:', emailResult.messageId)
    } else {
      console.error('⚠️ Email queueing failed:', emailResult.error)
      console.log('📝 Invitation created in database, but email was not queued.')
    }

  } catch (emailError) {
    console.error('❌ Email sending exception:', emailError)
    // Don't fail the invitation if email sending fails
  }

  console.log('Invitation created for:', email, 'to join', org?.name)

  revalidatePath('/team')
  revalidatePath('/dashboard')
  revalidatePath('/organizations')
  return { 
    success: true, 
    message: `Invitation sent to ${email}. They will be added automatically when they sign up.`,
    isPending: true
  }
}

export async function getPendingInvitations(orgId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('organization_invitations')
    .select('*, invited_by_profile:invited_by(full_name, email)')
    .eq('organization_id', orgId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function cancelInvitation(invitationId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('organization_invitations')
    .delete()
    .eq('id', invitationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/team')
  revalidatePath('/organizations')
  return { success: true }
}

export async function resendInvitation(invitationId: string) {
  const supabase = await createClient()
  
  // Validate current user has permission
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get invitation details
  const { data: invitation, error: fetchError } = await supabase
    .from('organization_invitations')
    .select('*, organization:organization_id(name)')
    .eq('id', invitationId)
    .single()

  if (fetchError || !invitation) {
    return { error: 'Invitation not found' }
  }

  // Check if current user is owner or admin of the organization
  const { data: currentMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', invitation.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
    return { error: 'Only owners and admins can resend invitations' }
  }

  // Generate new token and extend expiration
  const newToken = require('crypto').randomBytes(32).toString('hex')
  const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Use service role to ensure update succeeds
  const { createServiceRoleClient } = await import('@/lib/supabase/server')
  const serviceClient = createServiceRoleClient()

  const { error: updateError } = await serviceClient
    .from('organization_invitations')
    .update({
      token: newToken,
      expires_at: newExpiry,
      status: 'pending'
    })
    .eq('id', invitationId)

  if (updateError) {
    console.error('Error updating invitation token:', updateError)
    return { error: updateError.message }
  }

  console.log('✅ Updated invitation with new token:', newToken.substring(0, 16) + '...')

  // Resend the email
  try {
    const { sendInvitationEmail } = await import('@/lib/email-sender')
    
    const inviterProfile = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const inviterName = inviterProfile.data?.full_name || inviterProfile.data?.email || 'A team member'
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?token=${newToken}`

    const emailResult = await sendInvitationEmail({
      to: invitation.email,
      organizationName: invitation.organization?.name || 'the organization',
      inviterName,
      role: invitation.role,
      inviteUrl,
      expiresInDays: 7,
      organizationId: invitation.organization_id,
      sentBy: user.id,
      smtpAccountId: undefined
    })

    if (emailResult.duplicate) {
      return { error: 'An invitation email was already sent recently. Please wait before resending.' }
    } else if (emailResult.success) {
      console.log('✅ Invitation email resent successfully:', invitation.email)
    } else {
      console.error('⚠️ Email resending failed:', emailResult.error)
      return { error: 'Failed to send email. Please try again.' }
    }

  } catch (emailError) {
    console.error('❌ Email resending exception:', emailError)
    return { error: 'Failed to send email. Please try again.' }
  }

  revalidatePath('/team')
  revalidatePath('/organizations')
  return { success: true, message: `Invitation resent to ${invitation.email}` }
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

export async function updateMemberRole(orgId: string, userId: string, role: 'admin' | 'member' | 'viewer') {
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

export async function createOrganization(name: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Create slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

  // Use service role client to bypass RLS during organization creation
  // This is necessary because the user doesn't have org membership yet
  const { createServiceRoleClient } = await import('@/lib/supabase/server')
  const serviceClient = createServiceRoleClient()

  // Create organization
  const { data: org, error: orgError } = await serviceClient
    .from('organizations')
    .insert({
      name: name.trim(),
      slug: slug + '-' + Math.random().toString(36).substring(2, 8),
      plan: 'free',
      billing_status: 'active'
    })
    .select()
    .single()

  if (orgError) {
    return { error: orgError.message }
  }

  // Add user as owner using service role (bypasses RLS)
  const { error: memberError } = await serviceClient
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner'
    })

  if (memberError) {
    // Rollback: delete the organization if member creation fails
    await serviceClient.from('organizations').delete().eq('id', org.id)
    return { error: memberError.message }
  }

  revalidatePath('/dashboard')
  return { success: true, organization: org }
}

export async function switchOrganization(orgId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user has access to this organization
  const { data: orgs } = await supabase.rpc('get_user_organizations', {
    user_uuid: user.id
  })

  const hasAccess = orgs?.some((org: any) => org.organization_id === orgId)
  
  if (!hasAccess) {
    return { error: 'Organization not found or access denied' }
  }

  revalidatePath('/dashboard')
  return { success: true, organizationId: orgId }
}

export async function deleteOrganization(orgId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is owner
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (membershipError) {
    console.error('Delete org - membership check error:', membershipError)
    return { error: `Failed to verify ownership: ${membershipError.message}` }
  }

  if (!membership || membership.role !== 'owner') {
    return { error: 'Only organization owners can delete organizations' }
  }

  // Check if user has other organizations
  const { data: orgs, error: orgsError } = await supabase.rpc('get_user_organizations', {
    user_uuid: user.id
  })

  if (orgsError) {
    console.error('Delete org - get orgs error:', orgsError)
    return { error: `Failed to check organizations: ${orgsError.message}` }
  }

  if (!orgs || orgs.length <= 1) {
    return { error: 'Cannot delete your only organization. You must belong to at least one organization.' }
  }

  // Remove all other members first (except the owner)
  const { error: removeMembersError } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .neq('user_id', user.id)

  if (removeMembersError) {
    console.error('Delete org - remove members error:', removeMembersError)
    return { error: `Failed to remove members: ${removeMembersError.message}` }
  }

  // Delete organization (cascade will handle the owner's membership and other data)
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', orgId)

  if (error) {
    console.error('Delete org - delete error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function leaveOrganization(orgId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check user's role
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (membershipError) {
    console.error('Membership check error:', membershipError)
    return { error: `Failed to verify membership: ${membershipError.message}` }
  }

  if (!membership) {
    return { error: 'You are not a member of this organization' }
  }

  if (membership.role === 'owner') {
    return { error: 'Owners cannot leave. Transfer ownership or delete the organization instead.' }
  }

  // Check if user has other organizations
  const { data: orgs, error: orgsError } = await supabase.rpc('get_user_organizations', {
    user_uuid: user.id
  })

  if (orgsError) {
    console.error('Get orgs error:', orgsError)
    return { error: `Failed to check organizations: ${orgsError.message}` }
  }

  if (!orgs || orgs.length <= 1) {
    return { error: 'Cannot leave your only organization. You must belong to at least one organization.' }
  }

  // Remove user from organization
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Delete membership error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getInvitationByToken(token: string) {
  const supabase = await createClient()
  
  console.log('🔍 Looking up invitation with token:', token?.substring(0, 16) + '...')
  
  // Use service role to bypass RLS for reading organization details
  const { createServiceRoleClient } = await import('@/lib/supabase/server')
  const serviceClient = createServiceRoleClient()
  
  // First get the invitation
  const { data: invitation, error } = await serviceClient
    .from('organization_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error) {
    console.error('❌ Invitation lookup error:', {
      code: error.code,
      message: error.message,
      hint: error.hint,
      details: error.details
    })
    return { error: 'Invalid or expired invitation' }
  }

  // Then get the organization details
  const { data: organization } = await serviceClient
    .from('organizations')
    .select('name, slug')
    .eq('id', invitation.organization_id)
    .single()

  const data = {
    ...invitation,
    organization
  }

  console.log('✅ Found invitation:', {
    email: data.email,
    role: data.role,
    organization: data.organization,
    expires_at: data.expires_at
  })

  return { data }
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Call the secure RPC function
  const { data, error } = await supabase.rpc('accept_invitation_with_token', {
    p_token: token,
    p_user_id: user.id
  })

  if (error) {
    console.error('Accept invitation error:', error)
    return { error: error.message }
  }

  const result = data as { success: boolean; error?: string; organization_id?: string; role?: string; already_member?: boolean }

  if (!result.success) {
    return { error: result.error || 'Failed to accept invitation' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/team')
  revalidatePath('/organizations')

  return { 
    success: true, 
    organizationId: result.organization_id,
    role: result.role,
    alreadyMember: result.already_member
  }
}
