import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ComposeEmail from '@/components/ComposeEmail'
import { mapOrgResponse } from '@/lib/utils/org-mapper'
import { cookies } from 'next/headers'
import { getAccessibleAccounts } from '@/lib/actions/sending-accounts'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ComposePage() {
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

  // Check role permission: viewers cannot compose
  if (currentOrg.role === 'viewer') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need at least Member role to compose emails.</p>
          <p className="text-sm text-gray-500">Current role: {currentOrg.role}</p>
        </div>
      </div>
    )
  }

  // Get accessible SMTP accounts using the action function
  const accountsResult = await getAccessibleAccounts(currentOrg.id)
  const accounts = accountsResult.data || []

  // Get templates
  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .eq('organization_id', currentOrg.id)
    .order('created_at', { ascending: false })

  return (
    <ComposeEmail 
      smtpAccounts={accounts || []}
      templates={templates || []}
      organizationId={currentOrg.id}
    />
  )
}
