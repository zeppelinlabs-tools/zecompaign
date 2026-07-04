import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuditLogs from '@/components/AuditLogs'
import { mapOrgResponse } from '@/lib/utils/org-mapper'
import { cookies } from 'next/headers'
import { getAuditLogs, getAuditLogStats } from '@/lib/actions/audit'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AuditLogsPage() {
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

  // Check role permission: only admin and owner can view audit logs
  if (currentOrg.role !== 'admin' && currentOrg.role !== 'owner') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need Admin or Owner role to view audit logs.</p>
          <p className="text-sm text-gray-500">Current role: {currentOrg.role}</p>
        </div>
      </div>
    )
  }

  // Get initial audit logs
  const logsResult = await getAuditLogs(currentOrg.id, {
    page: 1,
    pageSize: 50
  })

  // Get statistics
  const statsResult = await getAuditLogStats(currentOrg.id)

  if (logsResult.error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Logs</h2>
          <p className="text-gray-600">{logsResult.error}</p>
        </div>
      </div>
    )
  }

  return (
    <AuditLogs
      organizationId={currentOrg.id}
      initialLogs={logsResult.data || []}
      initialStats={statsResult.data || { total: 0, queued: 0, sent: 0, failed: 0, delivered: 0 }}
      initialPagination={logsResult.pagination || { page: 1, pageSize: 50, total: 0, totalPages: 0 }}
    />
  )
}
