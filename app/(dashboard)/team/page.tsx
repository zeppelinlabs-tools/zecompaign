import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeamMembers from '@/components/TeamMembers'

export default async function TeamPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user organizations
  const { data: organizations } = await supabase.rpc('get_user_organizations', {
    user_uuid: user.id
  })

  const currentOrg = organizations?.[0]

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Organization Found</h2>
          <p className="text-gray-600">Please contact support.</p>
        </div>
      </div>
    )
  }

  // Get organization details
  const { data: orgDetails } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', currentOrg.id)
    .single()

  // Get team members
  const { data: members } = await supabase
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
    .eq('organization_id', currentOrg.id)

  return (
    <TeamMembers 
      organization={orgDetails}
      members={members || []}
      currentUserId={user.id}
      userRole={currentOrg.role}
    />
  )
}
