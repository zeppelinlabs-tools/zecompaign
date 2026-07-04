import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { mapOrgResponse } from '@/lib/utils/org-mapper'
import { cookies } from 'next/headers'
import { OrgSwitcher } from '@/components/OrgSwitcher'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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

  // Map all organizations
  const allOrgs = organizations?.map(mapOrgResponse) || []
  
  if (allOrgs.length === 0) {
    redirect('/onboarding')
  }

  // Get selected org from cookie or default to first
  const cookieStore = await cookies()
  const selectedOrgId = cookieStore.get('selectedOrgId')?.value
  
  console.log('Layout - All org IDs:', allOrgs.map((o: any) => o.id))
  console.log('Layout - Selected from cookie:', selectedOrgId)
  
  // Find selected organization or use first one
  let currentOrg = allOrgs.find((org: any) => org.id === selectedOrgId) || allOrgs[0]
  
  console.log('Layout - Current org:', currentOrg.id, currentOrg.name)
  
  // If cookie has wrong org, update it
  if (selectedOrgId && !allOrgs.find((org: any) => org.id === selectedOrgId)) {
    // Selected org not found, clear cookie and use first org
    console.log('Layout - Cookie org not found, using first org')
    currentOrg = allOrgs[0]
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <OrgSwitcher defaultOrgId={currentOrg.id} />
      <Sidebar user={user} profile={profile} currentOrg={currentOrg} allOrgs={allOrgs} />
      <main style={{ marginLeft: 230, flex: 1, overflowY: 'auto', height: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
