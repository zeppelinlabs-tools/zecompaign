'use server'

import { createClient } from '@/lib/supabase/server'
import { retryFailedEmail } from '@/lib/queue/email-queue'

export async function getAuditLogs(
  orgId: string,
  filters?: {
    status?: string
    startDate?: string
    endDate?: string
    recipient?: string
    page?: number
    pageSize?: number
  }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user has access to this organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Access denied' }
  }

  // Only admin/owner can view audit logs
  if (!['owner', 'admin'].includes(membership.role)) {
    return { error: 'Only owners and admins can view audit logs' }
  }

  // Build query - use view with profiles joined
  let query = supabase
    .from('email_audit_logs_with_profiles')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }

  if (filters?.recipient) {
    query = query.ilike('recipient_email', `%${filters.recipient}%`)
  }

  // Pagination
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 50
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  query = query
    .order('created_at', { ascending: false })
    .range(start, end)

  const { data, error, count } = await query

  if (error) {
    return { error: error.message }
  }

  return {
    data,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }
}

export async function getAuditLogStats(orgId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check access
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Access denied' }
  }

  // Get stats
  const { data: logs } = await supabase
    .from('email_audit_logs')
    .select('status')
    .eq('organization_id', orgId)

  if (!logs) {
    return {
      data: {
        total: 0,
        queued: 0,
        sent: 0,
        failed: 0,
        delivered: 0
      }
    }
  }

  const stats = {
    total: logs.length,
    queued: logs.filter(l => l.status === 'queued').length,
    sending: logs.filter(l => l.status === 'sending').length,
    sent: logs.filter(l => l.status === 'sent').length,
    delivered: logs.filter(l => l.status === 'delivered').length,
    failed: logs.filter(l => l.status === 'failed').length,
    bounced: logs.filter(l => l.status === 'bounced').length
  }

  return { data: stats }
}

export async function retryEmail(logId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get log details
  const { data: log } = await supabase
    .from('email_audit_logs')
    .select('organization_id')
    .eq('id', logId)
    .single()

  if (!log) {
    return { error: 'Email log not found' }
  }

  // Check access
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', log.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Access denied' }
  }

  // Retry the email
  const result = await retryFailedEmail(logId)

  if (result.error) {
    return { error: result.error }
  }

  return { success: true, messageId: result.messageId }
}

export async function exportAuditLogs(orgId: string, filters?: any) {
  // Get all logs (no pagination)
  const result = await getAuditLogs(orgId, { ...filters, pageSize: 10000 })

  if (result.error || !result.data) {
    return { error: result.error || 'Failed to fetch logs' }
  }

  // Convert to CSV
  const headers = ['Date', 'Recipient', 'Subject', 'Status', 'Sent By', 'SMTP Account', 'Error']
  const rows = result.data.map((log: any) => [
    new Date(log.created_at).toLocaleString(),
    log.recipient_email,
    log.subject || '',
    log.status,
    log.sent_by_name || log.sent_by_email || 'Unknown',
    log.smtp_from_name || 'Platform SMTP',
    log.error_message || ''
  ])

  const csv = [
    headers.join(','),
    ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return { data: csv }
}
