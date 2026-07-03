import { createClient } from '@/lib/supabase/server'
import { getPendingPaymentRequests } from '@/lib/actions/admin'
import AdminDashboard from '@/components/AdminDashboard'

export default async function AdminPage() {
  const supabase = await createClient()

  // Get pending payment requests
  const { data: paymentRequests } = await getPendingPaymentRequests()

  // Get platform stats
  const { count: totalOrgs } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: totalAccounts } = await supabase
    .from('sending_accounts')
    .select('*', { count: 'exact', head: true })

  const { count: totalEmails } = await supabase
    .from('sent_emails')
    .select('*', { count: 'exact', head: true })

  return (
    <AdminDashboard 
      paymentRequests={paymentRequests || []}
      stats={{
        totalOrgs: totalOrgs || 0,
        totalUsers: totalUsers || 0,
        totalAccounts: totalAccounts || 0,
        totalEmails: totalEmails || 0,
      }}
    />
  )
}
