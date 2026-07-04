import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { mapOrgResponse } from '@/lib/utils/org-mapper'
import { cookies } from 'next/headers'
import OrganizationsManager from '@/components/OrganizationsManager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrganizationsPage() {
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

  if (allOrgs.length === 0) {
    redirect('/onboarding')
  }

  // Get selected org from cookie
  const cookieStore = await cookies()
  const selectedOrgId = cookieStore.get('selectedOrgId')?.value
  const currentOrg = allOrgs.find((org: any) => org.id === selectedOrgId) || allOrgs[0]

  // Get organization details including member count
  const { data: orgDetails } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', currentOrg.id)
    .single()

  // Get organization members with profile info
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
    .order('created_at', { ascending: true })

  return (
    <OrganizationsManager
      currentOrg={currentOrg}
      allOrgs={allOrgs}
      orgDetails={orgDetails}
      members={members || []}
      userId={user.id}
    />
  )
}
