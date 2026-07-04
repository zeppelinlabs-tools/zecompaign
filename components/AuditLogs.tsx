'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuditLogs, getAuditLogStats, retryEmail, exportAuditLogs } from '@/lib/actions/audit'
import toast from 'react-hot-toast'
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Download,
  Search,
  Filter,
  Calendar,
  User,
  Server
} from 'lucide-react'

interface AuditLogsProps {
  organizationId: string
  initialLogs: any[]
  initialStats: any
  initialPagination: any
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'sent':
    case 'delivered':
      return <CheckCircle size={16} color="var(--green)" />
    case 'failed':
    case 'bounced':
      return <XCircle size={16} color="var(--red)" />
    case 'queued':
      return <Clock size={16} color="var(--stamp-teal)" />
    case 'sending':
      return <RefreshCw size={16} color="var(--accent)" className="spin" />
    default:
      return <AlertCircle size={16} color="var(--ink-500)" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'sent':
    case 'delivered':
      return { bg: 'rgba(34, 197, 94, 0.1)', border: 'var(--green)', text: 'var(--green)' }
    case 'failed':
    case 'bounced':
      return { bg: 'rgba(239, 68, 68, 0.1)', border: 'var(--red)', text: 'var(--red)' }
    case 'queued':
      return { bg: 'rgba(76, 175, 162, 0.1)', border: 'var(--stamp-teal)', text: 'var(--stamp-teal)' }
    case 'sending':
      return { bg: 'rgba(52, 87, 166, 0.1)', border: 'var(--accent)', text: 'var(--accent)' }
    default:
      return { bg: 'var(--ink-100)', border: 'var(--ink-400)', text: 'var(--ink-600)' }
  }
}

export default function AuditLogs({ organizationId, initialLogs, initialStats, initialPagination }: AuditLogsProps) {
  const router = useRouter()
  const [logs, setLogs] = useState(initialLogs)
  const [stats, setStats] = useState(initialStats)
  const [pagination, setPagination] = useState(initialPagination)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [recipientSearch, setRecipientSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  async function loadLogs(page = 1) {
    setLoading(true)
    const result = await getAuditLogs(organizationId, {
      status: statusFilter || undefined,
      recipient: recipientSearch || undefined,
      page,
      pageSize: 50
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      setLogs(result.data || [])
      setPagination(result.pagination)
    }
    setLoading(false)
  }

  async function handleRetry(logId: string, recipient: string) {
    const toastId = toast.loading(`Retrying email to ${recipient}...`)
    
    const result = await retryEmail(logId)
    
    if (result.error) {
      toast.error(result.error, { id: toastId })
    } else {
      toast.success('Email queued for retry!', { id: toastId })
      loadLogs(pagination.page)
    }
  }

  async function handleExport() {
    setExporting(true)
    const toastId = toast.loading('Exporting audit logs...')

    const result = await exportAuditLogs(organizationId, {
      status: statusFilter || undefined,
      recipient: recipientSearch || undefined
    })

    if (result.error) {
      toast.error(result.error, { id: toastId })
    } else if (result.data) {
      // Download CSV
      const blob = new Blob([result.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `email-audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Audit logs exported!', { id: toastId })
    } else {
      toast.error('No data to export', { id: toastId })
    }

    setExporting(false)
  }

  useEffect(() => {
    loadLogs(1)
  }, [statusFilter, recipientSearch])

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: 4,
          fontFamily: 'Fraunces'
        }}>
          Email Audit Logs
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Track all emails sent by your organization
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Sent" value={stats.total} icon={<Mail size={20} />} color="var(--accent)" />
        <StatCard label="Delivered" value={stats.sent + stats.delivered} icon={<CheckCircle size={20} />} color="var(--green)" />
        <StatCard label="In Queue" value={stats.queued + stats.sending} icon={<Clock size={20} />} color="var(--stamp-teal)" />
        <StatCard label="Failed" value={stats.failed + stats.bounced} icon={<XCircle size={20} />} color="var(--red)" />
      </div>

      {/* Filters and Actions */}
      <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 300 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by recipient email..."
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  fontSize: 14,
                  color: 'var(--text)',
                  background: 'white'
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                fontSize: 14,
                color: 'var(--text)',
                background: 'white',
                cursor: 'pointer',
                minWidth: 120
              }}
            >
              <option value="">All Status</option>
              <option value="queued">Queued</option>
              <option value="sending">Sending</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: 12 }} />
            <p>Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Mail size={48} color="var(--ink-300)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>No emails found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {statusFilter || recipientSearch ? 'Try adjusting your filters' : 'Emails will appear here when sent'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr 150px 150px 100px',
              padding: '16px 24px',
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>Date & Time</div>
              <div>Recipient & Subject</div>
              <div>Sent By</div>
              <div>SMTP Account</div>
              <div>Status</div>
            </div>

            {/* Table Rows */}
            {logs.map((log: any, index: number) => {
              const statusColors = getStatusColor(log.status)
              const date = new Date(log.created_at)

              return (
                <div
                  key={log.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr 150px 150px 100px',
                    padding: '20px 24px',
                    borderBottom: index < logs.length - 1 ? '1px solid var(--border)' : 'none',
                    background: '#FFFFFF',
                    transition: 'background 0.15s ease',
                    alignItems: 'center'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#FFFFFF'}
                >
                  {/* Date */}
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>
                    <div style={{ fontWeight: 600 }}>{date.toLocaleDateString()}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{date.toLocaleTimeString()}</div>
                  </div>

                  {/* Recipient & Subject */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text)',
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {log.recipient_email}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {log.subject || '(No subject)'}
                    </div>
                    {log.error_message && (
                      <div style={{
                        fontSize: 11,
                        color: 'var(--red)',
                        marginTop: 4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        Error: {log.error_message}
                      </div>
                    )}
                  </div>

                  {/* Sent By */}
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>
                    {log.sent_by_name || log.sent_by_email || 'Unknown'}
                  </div>

                  {/* SMTP */}
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {log.smtp_from_name || 'Platform'}
                  </div>

                  {/* Status & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: statusColors.bg,
                      border: `1px solid ${statusColors.border}`,
                      color: statusColors.text,
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flex: 1
                    }}>
                      {getStatusIcon(log.status)}
                      {log.status}
                    </div>

                    {/* Retry Button */}
                    {(log.status === 'failed' || log.status === 'bounced') && (
                      <button
                        onClick={() => handleRetry(log.id, log.recipient_email)}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          border: '1px solid var(--accent)',
                          background: 'transparent',
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'var(--accent)'
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--accent)'
                        }}
                        title="Retry sending"
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
          <button
            onClick={() => loadLogs(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            className="btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            Previous
          </button>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => loadLogs(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
            className="btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="glass" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 8, 
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color
        }}>
          {icon}
        </div>
        <div style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          color: 'var(--text)',
          fontFamily: 'Fraunces'
        }}>
          {value.toLocaleString()}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  )
}
