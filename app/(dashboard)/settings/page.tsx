import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Settings from '@/components/Settings'
import { mapOrgResponse } from '@/lib/utils/org-mapper'
import { cookies } from 'next/headers'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SettingsPage() {
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

  // Check role permission: only admin and owner can manage settings
  if (currentOrg.role !== 'admin' && currentOrg.role !== 'owner') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need Admin or Owner role to manage settings.</p>
          <p className="text-sm text-gray-500">Current role: {currentOrg.role}</p>
        </div>
      </div>
    )
  }

  // Get Gemini keys
  const { data: geminiKeys } = await supabase
    .from('gemini_keys')
    .select('*')
    .eq('organization_id', currentOrg.id)
    .order('priority', { ascending: true })

  // Get team members with profiles
  const { data: membersRaw } = await supabase
    .from('organization_members')
    .select(`
      id,
      user_id,
      role,
      profiles!inner (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('organization_id', currentOrg.id)
    .order('joined_at', { ascending: true })

  // Transform the data to match the expected type
  const members = membersRaw?.map((m: any) => ({
    ...m,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
  })) || []

  // Get sending accounts
  const { data: sendingAccountsRaw } = await supabase
    .from('sending_accounts')
    .select('id, name, from_email')
    .eq('organization_id', currentOrg.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  const sendingAccounts = sendingAccountsRaw?.map((acc: any) => ({
    id: acc.id,
    name: acc.name,
    email: acc.from_email
  })) || []

  // Get account access mappings
  const { data: accountAccess } = await supabase
    .from('account_access')
    .select('user_id, account_id')
    .eq('organization_id', currentOrg.id)

  return (
    <Settings 
      geminiKeys={geminiKeys || []}
      members={members as any}
      sendingAccounts={sendingAccounts as any}
      accountAccess={accountAccess || []}
      organizationId={currentOrg.id}
      currentUserId={user.id}
      userRole={currentOrg.role}
    />
  )
}
