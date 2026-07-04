import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
