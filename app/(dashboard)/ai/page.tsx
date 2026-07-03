import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AITemplateGenerator from '@/components/AITemplateGenerator'

export default async function AIPage() {
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

  // Get Gemini keys
  const { data: geminiKeys } = await supabase
    .from('gemini_keys')
    .select('*')
    .eq('organization_id', currentOrg.id)
    .order('created_at', { ascending: false })

  // Get templates
  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .eq('organization_id', currentOrg.id)
    .order('created_at', { ascending: false })

  return (
    <AITemplateGenerator 
      geminiKeys={geminiKeys || []}
      templates={templates || []}
      organizationId={currentOrg.id}
      userRole={currentOrg.role}
    />
  )
}
