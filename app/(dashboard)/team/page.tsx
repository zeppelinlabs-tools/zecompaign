import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeamMembers from '@/components/TeamMembers'
import { mapOrgResponse } from '@/lib/utils/org-mapper'
import { cookies } from 'next/headers'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  const allOrgs = organizations?.map(mapOrgResponse) || []
  
  // Get selected org from cookie
  const cookieStore = await cookies()
  const selectedOrgId = cookieStore.get('selectedOrgId')?.value
  
  // Find selected organization or use first one
  const currentOrg = allOrgs.find((org: any) => org.id === selectedOrgId) || allOrgs[0]

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

  // Check role permission: only admin and owner can manage team
  if (currentOrg.role !== 'admin' && currentOrg.role !== 'owner') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need Admin or Owner role to manage team members.</p>
          <p className="text-sm text-gray-500">Current role: {currentOrg.role}</p>
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

  // Get pending invitations
  const { data: pendingInvites, error: invitesError } = await supabase
    .from('organization_invitations')
    .select('*, invited_by_profile:invited_by(full_name, email)')
    .eq('organization_id', currentOrg.id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (invitesError) {
    console.error('Error fetching invitations:', invitesError)
  }

  return (
    <TeamMembers 
      organization={orgDetails}
      members={members || []}
      pendingInvites={pendingInvites || []}
      currentUserId={user.id}
      userRole={currentOrg.role}
    />
  )
}
