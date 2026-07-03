import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user has an organization
      const { data: orgs } = await supabase.rpc('get_user_organizations', {
        user_uuid: data.user.id
      })

      // If no organization, create one
      if (!orgs || orgs.length === 0) {
        const { data: newOrg } = await supabase
          .from('organizations')
          .insert({
            name: `${data.user.user_metadata?.full_name || 'My'} Organization`,
            owner_id: data.user.id,
            plan: 'free',
            billing_status: 'trial',
          })
          .select()
          .single()

        // Add user as owner member
        if (newOrg) {
          await supabase
            .from('organization_members')
            .insert({
              organization_id: newOrg.id,
              user_id: data.user.id,
              role: 'owner',
            })
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
