import { createClient } from '@/lib/supabase/server'
import Dashboard from '@/components/Dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user organizations
  const { data: organizations } = await supabase.rpc('get_user_organizations', {
    user_uuid: user.id
  })

  const currentOrg = organizations?.[0]

  return <Dashboard user={user} profile={profile} currentOrg={currentOrg} />
}
