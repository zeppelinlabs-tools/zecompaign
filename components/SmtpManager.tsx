'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle, XCircle, Star, Server, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { createSendingAccount, updateSendingAccount, deleteSendingAccount, testSMTPConnection } from '@/lib/actions/sending-accounts'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface SendingAccount {
  id: string
  name: string
  email: string
  smtp_host: string
  smtp_port: number
  smtp_username: string
  use_tls: boolean
  created_at: string
  last_tested_at: string | null
}

interface Member {
  id: string
  user_id: string
  role: string
  profiles: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface Props {
  initialAccounts: SendingAccount[]
  organizationId: string
  members: Member[]
  userRole: string
}

const PROVIDER_PRESETS = {
  gmail: { host: 'smtp.gmail.com', port: 587, use_tls: true },
  sendgrid: { host: 'smtp.sendgrid.net', port: 587, use_tls: true },
  mailgun: { host: 'smtp.mailgun.org', port: 587, use_tls: true },
  resend: { host: 'smtp.resend.com', port: 465, use_tls: true },
  custom: { host: '', port: 587, use_tls: true },
}

function getMonogram(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (name[0] || '?').toUpperCase()
}

export default function SmtpManager({ initialAccounts, organizationId, members, userRole }: Props) {
  const router = useRouter()
  const [accounts] = useState(initialAccounts)
  const [form, setForm] = useState({
    provider: 'gmail',
    name: '',
    email: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    use_tls: true,
  })
  const [showAdd, setShowAdd] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, 'ok' | 'fail' | null>>({})
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  const canManage = userRole === 'owner' || userRole === 'admin'

  function applyPreset(provider: keyof typeof PROVIDER_PRESETS) {
    const preset = PROVIDER_PRESETS[provider]
    setForm(f => ({ ...f, provider, ...preset }))
  }

  async function handleAdd() {
    if (!form.name || !form.email || !form.smtp_password) {
      toast.error('Please fill all required fields')
      return
    }

    setSaving(true)
    const result = await createSendingAccount({
      organization_id: organizationId,
      name: form.name,
      email: form.email,
      smtp_host: form.smtp_host,
      smtp_port: form.smtp_port,
      smtp_username: form.smtp_username || form.email,
      smtp_password: form.smtp_password,
      use_tls: form.use_tls,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('SMTP account added successfully!')
      setForm({
        provider: 'gmail',
        name: '',
        email: '',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        use_tls: true,
      })
      setShowAdd(false)
      router.refresh()
    }
    setSaving(false)
  }

  async function testSmtp(accountId: string) {
    setTesting(accountId)
    const result = await testSMTPConnection(accountId)

    if (result.error) {
      setTestResult(r => ({ ...r, [accountId]: 'fail' }))
      toast.error(result.error)
    } else {
      setTestResult(r => ({ ...r, [accountId]: 'ok' }))
      toast.success('Connection successful!')
      router.refresh()
    }
    setTesting(null)
  }

  function startDelete(account: SendingAccount) {
    setDeletingId(account.id)
    setDeleteConfirmName('')
  }

  async function confirmDelete(id: string) {
    const result = await deleteSendingAccount(id)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Account deleted')
      setDeletingId(null)
      setDeleteConfirmName('')
      router.refresh()
    }
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Sending Accounts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Connect and share outbound email credentials securely</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={15} /> Add Account
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAdd && canManage && (
        <div className="glass fade-in" style={{ padding: 24, marginBottom: 28, background: '#FFFFFF' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18, fontFamily: 'Fraunces' }}>New Sending Account</h3>

          {/* Provider Selector */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12 }}>SMTP Provider</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(['gmail', 'sendgrid', 'mailgun', 'resend', 'custom'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 6,
                    border: `1px solid ${form.provider === p ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.provider === p ? 'var(--accent-glow)' : '#FFFFFF',
                    color: form.provider === p ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: form.provider === p ? 600 : 500,
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.15s',
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label>Account Name *</label>
              <input 
                placeholder="e.g. Gmail Marketing" 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
              />
            </div>
            <div>
              <label>From Email *</label>
              <input 
                placeholder="hello@company.com" 
                type="email"
                value={form.email} 
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
              />
            </div>
            <div>
              <label>SMTP Username</label>
              <input 
                placeholder="Usually same as email" 
                value={form.smtp_username} 
                onChange={e => setForm(f => ({ ...f, smtp_username: e.target.value }))} 
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Leave blank to use email as username</p>
            </div>
            <div>
              <label>SMTP Password *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPass ? 'text' : 'password'} 
                  placeholder="App password or API key"
                  value={form.smtp_password} 
                  onChange={e => setForm(f => ({ ...f, smtp_password: e.target.value }))} 
                  style={{ paddingRight: 40 }} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)} 
                  style={{ 
                    position: 'absolute', 
                    right: 12, 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: 'var(--text-muted)' 
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {form.provider === 'custom' && (
              <>
                <div>
                  <label>SMTP Host</label>
                  <input 
                    placeholder="smtp.example.com" 
                    value={form.smtp_host} 
                    onChange={e => setForm(f => ({ ...f, smtp_host: e.target.value }))} 
                  />
                </div>
                <div>
                  <label>SMTP Port</label>
                  <input 
                    type="number" 
                    value={form.smtp_port} 
                    onChange={e => setForm(f => ({ ...f, smtp_port: parseInt(e.target.value) || 587 }))} 
                  />
                </div>
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: 'span 2', marginTop: 6 }}>
              <input 
                type="checkbox" 
                id="use_tls" 
                checked={form.use_tls} 
                onChange={e => setForm(f => ({ ...f, use_tls: e.target.checked }))} 
                style={{ width: 'auto', cursor: 'pointer' }} 
              />
              <label htmlFor="use_tls" style={{ margin: 0, cursor: 'pointer' }}>Use TLS/SSL secure connection</label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button 
              className="btn-primary" 
              onClick={handleAdd} 
              disabled={saving || !form.name || !form.email || !form.smtp_password}
            >
              {saving ? <RefreshCw size={14} className="spin" /> : <Plus size={14} />}
              Save Account
            </button>
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="glass" style={{ padding: 48, textAlign: 'center', background: '#FFFFFF' }}>
          <Server size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 16, fontFamily: 'Fraunces', fontWeight: 600 }}>No sending accounts connected</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {canManage ? 'Add your first SMTP configuration to start sending campaigns.' : 'Ask an admin to add SMTP accounts.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {accounts.map(account => {
            const monogram = getMonogram(account.name)
            const testingActive = testing === account.id
            const status = testResult[account.id]

            return (
              <div 
                key={account.id} 
                className="glass fade-in" 
                style={{ 
                  padding: 20, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div>
                  {/* Header */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                    <div className="monogram" style={{
                      width: 38, 
                      height: 38,
                      fontSize: 14,
                      background: 'var(--accent-glow)',
                      color: 'var(--accent)',
                      border: '1.5px solid var(--accent)',
                      flexShrink: 0
                    }}>
                      {monogram}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>
                        {account.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {account.email}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    <span className="badge badge-blue">{account.smtp_host}</span>
                    {status === 'ok' && <span className="badge badge-green"><CheckCircle size={8} /> Tested</span>}
                    {status === 'fail' && <span className="badge badge-red"><XCircle size={8} /> Failed</span>}
                  </div>

                  {/* Last Tested */}
                  {account.last_tested_at && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                      Last tested: {new Date(account.last_tested_at).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {deletingId === account.id ? (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--paper-100)', padding: 10, borderRadius: 6, border: '1px dashed var(--red)' }}>
                      <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>
                        Type "{account.name}" to delete:
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          value={deleteConfirmName}
                          onChange={e => setDeleteConfirmName(e.target.value)}
                          placeholder="Confirm name"
                          style={{ padding: '6px 10px', fontSize: 12, flex: 1, borderColor: 'var(--red)' }}
                        />
                        <button 
                          className="btn-danger" 
                          onClick={() => confirmDelete(account.id)}
                          disabled={deleteConfirmName !== account.name}
                          style={{ padding: '6px 12px', opacity: deleteConfirmName === account.name ? 1 : 0.5 }}
                        >
                          Confirm
                        </button>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '6px 10px', fontSize: 12 }} 
                          onClick={() => setDeletingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: 12, minHeight: 30 }} 
                        onClick={() => testSmtp(account.id)} 
                        disabled={testingActive}
                      >
                        {testingActive ? <RefreshCw size={12} className="spin" /> : <CheckCircle size={12} />}
                        {testingActive ? 'Testing...' : 'Test'}
                      </button>
                      
                      {canManage && (
                        <button 
                          className="btn-danger" 
                          style={{ padding: '6px 10px', minHeight: 30 }} 
                          onClick={() => startDelete(account)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
