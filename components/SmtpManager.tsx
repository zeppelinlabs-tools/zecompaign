'use client';
import { useState } from 'react';
import { Plus, Trash2, CheckCircle, XCircle, Star, Server, RefreshCw, Eye, EyeOff, Shield } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { SmtpConfig, SmtpProvider, User } from '@/lib/types';

const PROVIDER_PRESETS: Record<SmtpProvider, Partial<SmtpConfig>> = {
  gmail:  { host: 'smtp.gmail.com',   port: 587, secure: false },
  resend: { host: 'smtp.resend.com',  port: 465, secure: true  },
  custom: { host: '',                  port: 587, secure: false },
};

const PROVIDER_LABELS: Record<SmtpProvider, string> = {
  gmail: 'Gmail',
  resend: 'Resend API',
  custom: 'Custom SMTP',
};

interface Props {
  configs: SmtpConfig[];
  onChange: (c: SmtpConfig[]) => void;
  currentUser: User;
  users: User[];
}

function getMonogram(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (name[0] || '?').toUpperCase();
}

export default function SmtpManager({ configs, onChange, currentUser, users }: Props) {
  const [form, setForm] = useState<Partial<SmtpConfig> & { provider: SmtpProvider }>({
    provider: 'resend', name: '', user: '', password: '', fromName: '', fromEmail: '',
    host: 'smtp.resend.com', port: 465, secure: true, isDefault: false, active: true,
  });
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, 'ok' | 'fail' | null>>({});
  const [testErrors, setTestErrors] = useState<Record<string, string | null>>({});
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Two-step delete states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  function applyPreset(p: SmtpProvider) {
    setForm(f => ({ ...f, provider: p, ...PROVIDER_PRESETS[p] }));
  }

  async function handleAdd() {
    if (!form.name || !form.password || !form.fromEmail) return;
    setSaving(true);
    const newCfg: SmtpConfig = {
      id: uuid(),
      name: form.name!,
      provider: form.provider,
      host: form.host || '',
      port: form.port || 587,
      secure: form.secure || false,
      user: form.user || '',
      password: form.password!,
      fromName: form.fromName || '',
      fromEmail: form.fromEmail!,
      isDefault: configs.length === 0,
      active: true,
      createdAt: new Date().toISOString(),
    };
    let updated = [...configs, newCfg];
    if (newCfg.isDefault) updated = updated.map(c => ({ ...c, isDefault: c.id === newCfg.id }));
    
    // Automatically add access to creator if marketer
    let updatedUsers = [...users];
    if (currentUser.role === 'marketer') {
      updatedUsers = users.map(u => 
        u.id === currentUser.id 
          ? { ...u, allowedSmtpIds: [...u.allowedSmtpIds, newCfg.id] } 
          : u
      );
    }
    
    onChange(updated);
    setForm({ provider: 'resend', name: '', user: '', password: '', fromName: '', fromEmail: '', host: 'smtp.resend.com', port: 465, secure: true, isDefault: false, active: true });
    setShowAdd(false);
    setSaving(false);
  }

  async function testSmtp(cfg: SmtpConfig) {
    setTesting(cfg.id);
    setTestErrors(e => ({ ...e, [cfg.id]: null }));
    try {
      const res = await fetch('/api/test-smtp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) });
      const data = await res.json();
      setTestResult(r => ({ ...r, [cfg.id]: data.success ? 'ok' : 'fail' }));
      if (!data.success) {
        setTestErrors(e => ({ ...e, [cfg.id]: data.error || 'Connection failed' }));
      }
    } catch {
      setTestResult(r => ({ ...r, [cfg.id]: 'fail' }));
      setTestErrors(e => ({ ...e, [cfg.id]: 'Network connection error' }));
    }
    setTesting(null);
  }

  function setDefault(id: string) {
    onChange(configs.map(c => ({ ...c, isDefault: c.id === id })));
  }

  function toggleActive(id: string) {
    onChange(configs.map(c => c.id === id ? { ...c, active: !c.active } : c));
  }

  function startDelete(cfg: SmtpConfig) {
    setDeletingId(cfg.id);
    setDeleteConfirmName('');
  }

  function confirmDelete(id: string) {
    onChange(configs.filter(c => c.id !== id));
    setDeletingId(null);
    setDeleteConfirmName('');
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Sending Accounts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Connect and share outbound email credentials securely</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={15} /> Add Account
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="glass fade-in" style={{ padding: 24, marginBottom: 28, background: '#FFFFFF' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18, fontFamily: 'Fraunces' }}>New Sending Account</h3>

          {/* Provider Selector */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12 }}>SMTP Infrastructure Provider</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['gmail', 'resend', 'custom'] as SmtpProvider[]).map(p => (
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
                >{PROVIDER_LABELS[p]}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label>Friendly Name *</label>
              <input placeholder="e.g. Product Newsletters" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label>{form.provider === 'resend' ? 'Resend API Key *' : 'Username / Email *'}</label>
              <input
                placeholder={form.provider === 'resend' ? 're_xxxxxxxxxxxx' : 'hello@company.com'}
                value={form.provider === 'resend' ? form.password : form.user}
                onChange={e => form.provider === 'resend'
                  ? setForm(f => ({ ...f, password: e.target.value }))
                  : setForm(f => ({ ...f, user: e.target.value }))}
              />
            </div>
            {form.provider !== 'resend' && (
              <div>
                <label>Password / App Password *</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={{ paddingRight: 40 }} />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}
            <div>
              <label>From Display Name</label>
              <input placeholder="Arthur from Company" value={form.fromName} onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))} />
            </div>
            <div>
              <label>Sender Email Address *</label>
              <input placeholder="news@company.com" value={form.fromEmail} onChange={e => setForm(f => ({ ...f, fromEmail: e.target.value }))} />
            </div>
            {form.provider === 'custom' && (
              <>
                <div>
                  <label>SMTP Host</label>
                  <input placeholder="smtp.mailgun.org" value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} />
                </div>
                <div>
                  <label>Port</label>
                  <input type="number" value={form.port} onChange={e => setForm(f => ({ ...f, port: parseInt(e.target.value) || 587 }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: 'span 2', marginTop: 6 }}>
                  <input type="checkbox" id="secure" checked={form.secure} onChange={e => setForm(f => ({ ...f, secure: e.target.checked }))} style={{ width: 'auto', cursor: 'pointer' }} />
                  <label htmlFor="secure" style={{ margin: 0, cursor: 'pointer' }}>Use SSL/TLS secure connection</label>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn-primary" onClick={handleAdd} disabled={saving || !form.name || !form.fromEmail}>
              {saving ? <RefreshCw size={14} className="spin" /> : <Plus size={14} />}
              Save Account
            </button>
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Grid List */}
      {configs.length === 0 ? (
        <div className="glass" style={{ padding: 48, textAlign: 'center', background: '#FFFFFF' }}>
          <Server size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 16, fontFamily: 'Fraunces', fontWeight: 600 }}>No sending accounts connected</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Add your first SMTP configuration to start sending campaigns.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {configs.map(cfg => {
            const monogram = getMonogram(cfg.name);
            const testingActive = testing === cfg.id;
            const status = testResult[cfg.id];
            const testError = testErrors[cfg.id];
            
            // Access list: who has access (admins + anyone whose allowedSmtpIds includes this ID)
            const allowedUsers = users.filter(u => u.role === 'admin' || u.allowedSmtpIds.includes(cfg.id));

            return (
              <div key={cfg.id} className="glass fade-in" style={{ 
                padding: 20, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                background: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                position: 'relative'
              }}>
                <div>
                  {/* Top Line */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                    {/* Monogram Seal */}
                    <div className="monogram" style={{
                      width: 38, height: 38,
                      fontSize: 14,
                      background: 'var(--accent-glow)',
                      color: 'var(--accent)',
                      border: '1.5px solid var(--accent)',
                      flexShrink: 0
                    }}>
                      {monogram}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cfg.name}
                        </span>
                        {cfg.isDefault && <span className="badge badge-purple" style={{ fontSize: 9 }}><Star size={8} /> Default</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                        {cfg.fromEmail}
                      </div>
                    </div>
                  </div>

                  {/* Provider Info */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    <span className="badge badge-blue">{PROVIDER_LABELS[cfg.provider]}</span>
                    <span className={`badge ${cfg.active ? 'badge-green' : 'badge-red'}`}>
                      {cfg.active ? 'Active' : 'Disabled'}
                    </span>
                    {status === 'ok' && <span className="badge badge-green"><CheckCircle size={8} /> Connected</span>}
                    {status === 'fail' && <span className="badge badge-red"><XCircle size={8} /> Connection Failed</span>}
                  </div>

                  {/* Connection error panel */}
                  {testError && (
                    <div style={{ 
                      padding: '8px 10px', 
                      background: 'rgba(179,57,44,0.06)', 
                      border: '1px solid rgba(179,57,44,0.15)', 
                      borderRadius: 4, 
                      fontSize: 11, 
                      color: 'var(--red)', 
                      marginBottom: 12,
                      lineHeight: 1.3
                    }}>
                      <strong>Error:</strong> {testError}
                    </div>
                  )}

                  {/* Access grants avatars */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      Who has access
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {allowedUsers.length === 0 ? (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No members granted access</span>
                      ) : (
                        allowedUsers.map(u => (
                          <div
                            key={u.id}
                            title={`${u.name} (${u.role})`}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: u.avatarColor,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 9,
                              fontWeight: 700,
                              fontFamily: 'Fraunces',
                              boxShadow: '0 0 0 1px #FFFFFF, 0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          >
                            {u.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  
                  {/* Two-step Delete State */}
                  {deletingId === cfg.id ? (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--paper-100)', padding: 10, borderRadius: 6, border: '1px dashed var(--red)' }}>
                      <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>
                        Type "{cfg.name}" to delete:
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
                          onClick={() => confirmDelete(cfg.id)}
                          disabled={deleteConfirmName !== cfg.name}
                          style={{ padding: '6px 12px', opacity: deleteConfirmName === cfg.name ? 1 : 0.5 }}
                        >
                          Confirm
                        </button>
                        <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setDeletingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12, minHeight: 30 }} onClick={() => testSmtp(cfg)} disabled={testingActive}>
                          {testingActive ? <RefreshCw size={12} className="spin" /> : <CheckCircle size={12} />}
                          {testingActive ? 'Testing...' : 'Test Connection'}
                        </button>
                        {!cfg.isDefault && (
                          <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12, minHeight: 30 }} onClick={() => setDefault(cfg.id)}>
                            Set Default
                          </button>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12, minHeight: 30 }} onClick={() => toggleActive(cfg.id)}>
                          {cfg.active ? 'Disable' : 'Enable'}
                        </button>
                        <button className="btn-danger" style={{ padding: '6px 10px', minHeight: 30 }} onClick={() => startDelete(cfg)} title="Delete Account">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

