'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

/**
 * Revokes all other user sessions except the current one
 * Implements single session policy for enhanced security
 */
async function revokeOtherSessions(userId: string) {
  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const adminClient = createServiceRoleClient()

    // Get current session info
    const regularClient = await createClient()
    const { data: { session: currentSession } } = await regularClient.auth.getSession()
    
    if (!currentSession) {
      console.log('No current session found, skipping revocation')
      return
    }

    // Use access token as session identifier (first 32 chars for uniqueness)
    const sessionToken = currentSession.access_token.substring(0, 32)

    // Record the new session
    const { error: insertError } = await adminClient
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        expires_at: new Date(currentSession.expires_at! * 1000).toISOString(),
        device_info: currentSession.user?.user_metadata?.device || 'Unknown',
        user_agent: currentSession.user?.user_metadata?.user_agent || 'Unknown'
      })

    if (insertError && insertError.code !== '23505') { // Ignore duplicate key errors
      console.error('Error recording session:', insertError)
    }

    // Revoke all other active sessions for this user
    const { data: revokedCount, error: revokeError } = await adminClient
      .rpc('revoke_old_sessions', {
        p_user_id: userId,
        p_current_session_token: sessionToken
      })

    if (revokeError) {
      console.error('Error revoking other sessions:', revokeError)
    } else if (revokedCount && revokedCount > 0) {
      console.log(`✅ Revoked ${revokedCount} other session(s) for user ${userId}`)
    } else {
      console.log(`ℹ️ No other sessions to revoke for user ${userId}`)
    }
  } catch (error) {
    console.error('Exception while managing sessions:', error)
    // Don't fail the login if session management fails
  }
}


export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { 
    success: true, 
    message: 'Check your email to verify your account!',
    requiresVerification: true 
  }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Revoke all other sessions (single session policy)
  if (data.user) {
    await revokeOtherSessions(data.user.id)
  }

  redirect('/dashboard')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signInWithGithub() {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function sendMagicLink(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { 
    success: true, 
    message: 'Check your email for the magic link!' 
  }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { 
    success: true, 
    message: 'Check your email for password reset instructions!' 
  }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function getUser() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}

export async function getUserOrganizations() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data, error } = await supabase.rpc('get_user_organizations', {
    user_uuid: user.id
  })

  if (error) {
    console.error('Error fetching organizations:', error)
    return []
  }

  return data
}

export async function updateProfile(profileData: { full_name: string; avatar_url: string }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Update profile in profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: profileData.full_name,
      avatar_url: profileData.avatar_url,
    })
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  // Also update user metadata in auth
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: profileData.full_name,
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  return { success: true }
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const file = formData.get('avatar') as File
  
  if (!file) {
    return { error: 'No file provided' }
  }

  console.log('Upload started:', { fileName: file.name, fileSize: file.size, fileType: file.type })

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    return { error: 'Invalid file type. Please upload a JPG, PNG, WebP, or GIF image.' }
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { error: 'File too large. Maximum size is 5MB.' }
  }

  // Create unique file name
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  console.log('Uploading to:', filePath)

  // Upload to Supabase Storage
  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: uploadError.message }
  }

  console.log('Upload successful:', uploadData)

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  console.log('Public URL:', publicUrl)

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (updateError) {
    console.error('Profile update error:', updateError)
    // Delete uploaded file if profile update fails
    await supabase.storage.from('avatars').remove([filePath])
    return { error: updateError.message }
  }

  console.log('Profile updated successfully with avatar URL:', publicUrl)

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true, url: publicUrl }
}
