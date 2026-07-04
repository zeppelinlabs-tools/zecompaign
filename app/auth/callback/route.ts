import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Import revokeOtherSessions from auth actions
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

    if (insertError && insertError.code !== '23505') {
      console.error('Error recording session:', insertError)
    }

    // Revoke all other active sessions
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
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth/Magic Link errors
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || 'Authentication failed')}`
    )
  }

  // No code provided
  if (!code) {
    console.error('No code provided in callback')
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
  }

  try {
    const supabase = await createClient()
    
    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=exchange_failed&description=${encodeURIComponent(exchangeError.message)}`
      )
    }

    if (!data?.user) {
      console.error('No user data after code exchange')
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_user`)
    }

    // Revoke other sessions (single session policy)
    await revokeOtherSessions(data.user.id)

    // Check for pending invitations for this user's email
    const { data: pendingInvites } = await supabase
      .from('organization_invitations')
      .select('*, organization:organization_id(id, name)')
      .eq('email', data.user.email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    // If there's a pending invitation, auto-accept it
    if (pendingInvites && pendingInvites.length > 0) {
      const invite = pendingInvites[0]
      console.log(`✉️ Found pending invitation for ${data.user.email} to join ${invite.organization?.name}`)
      
      try {
        // Accept the invitation using the RPC function
        const { error: acceptError } = await supabase.rpc('accept_invitation_with_token', {
          p_token: invite.token,
          p_user_email: data.user.email
        })

        if (acceptError) {
          console.error('Failed to auto-accept invitation:', acceptError)
        } else {
          console.log(`✅ Auto-accepted invitation to ${invite.organization?.name}`)
          // Redirect to dashboard after successful invitation acceptance
          return NextResponse.redirect(`${origin}/dashboard`)
        }
      } catch (err) {
        console.error('Exception while auto-accepting invitation:', err)
      }
    }

    // Check if user has an organization
    const { data: orgs, error: orgsError } = await supabase.rpc('get_user_organizations', {
      user_uuid: data.user.id
    })

    // If no organization, redirect to onboarding
    if (!orgsError && (!orgs || orgs.length === 0)) {
      console.log('New user without organization, redirecting to onboarding')
      return NextResponse.redirect(`${origin}/onboarding`)
    }

    // Successful authentication - redirect to dashboard
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      return NextResponse.redirect(`${origin}${next}`)
    }
  } catch (err: any) {
    console.error('Unexpected callback error:', err)
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=unexpected&description=${encodeURIComponent(err.message || 'An unexpected error occurred')}`
    )
  }
}
