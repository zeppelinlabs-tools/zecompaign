import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BillingPanel from '@/components/BillingPanel'
import { mapOrgResponse } from '@/lib/utils/org-mapper'
import { cookies } from 'next/headers'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BillingPage() {
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

  // Get organization details
  const { data: orgDetails, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', currentOrg.id)
    .single()

  // If orgDetails is null, use currentOrg data as fallback
  const organization = orgDetails || {
    id: currentOrg.id,
    name: currentOrg.name,
    plan: currentOrg.plan,
    billing_period: null,
    billing_status: 'active',
    billing_start_date: null,
  }

  // Get payment requests
  const { data: paymentRequests } = await supabase
    .from('payment_requests')
    .select(`
      *,
      profiles:requested_by (
        full_name,
        email
      )
    `)
    .eq('organization_id', currentOrg.id)
    .order('created_at', { ascending: false })

  // Get current usage
  const { count: accountsCount } = await supabase
    .from('sending_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', currentOrg.id)

  const { count: membersCount } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', currentOrg.id)

  const { count: templatesCount } = await supabase
    .from('templates')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', currentOrg.id)

  return (
    <BillingPanel 
      organization={organization}
      paymentRequests={paymentRequests || []}
      usage={{
        accounts: accountsCount || 0,
        members: membersCount || 0,
        templates: templatesCount || 0,
      }}
      userRole={currentOrg.role}
    />
  )
}
