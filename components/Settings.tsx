'use client';
import { useState } from 'react';
import { Users, Key, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Sparkles, ChevronDown, ChevronUp, Shield, RefreshCw } from 'lucide-react';
import { createGeminiKey, updateGeminiKey, deleteGeminiKey } from '@/lib/actions/gemini-keys';
import { updateMemberRole } from '@/lib/actions/organizations';
import { grantAccountAccess, revokeAccountAccess } from '@/lib/actions/sending-accounts';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface GeminiKey {
  id: string;
  label: string;
  key_encrypted: string;
  model: string;
  active: boolean;
  priority: number;
}

interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface SendingAccount {
  id: string;
  name: string;
  email: string;
}

interface AccountAccess {
  user_id: string;
  account_id: string;
}

interface Props {
  geminiKeys: GeminiKey[];
  members: Member[];
  sendingAccounts: SendingAccount[];
  accountAccess: AccountAccess[];
  organizationId: string;
  currentUserId: string;
  userRole: string;
}

const GEMINI_MODELS = [
  { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { value: 'gemini-3.5-pro', label: 'Gemini 3.5 Pro' },
  { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
];

export default function Settings({ geminiKeys, members, sendingAccounts, accountAccess, organizationId, currentUserId, userRole }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'keys'>('users');
  
  // Gemini Keys States
  const [label, setLabel] = useState('');
  const [keyVal, setKeyVal] = useState('');
  const [model, setModel] = useState('gemini-3.5-flash');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  // Users States
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const canManage = userRole === 'owner' || userRole === 'admin';

  // Gemini Keys Actions
  async function addKey() {
    if (!label.trim() || !keyVal.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSavingKey(true);
    const result = await createGeminiKey({
      organization_id: organizationId,
      label: label.trim(),
      api_key: keyVal.trim(),
      model: model,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('API key added successfully');
      setLabel('');
      setKeyVal('');
      setModel('gemini-3.5-flash');
      router.refresh();
    }
    setSavingKey(false);
  }

  async function removeKey(id: string) {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    const result = await deleteGeminiKey(id);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('API key deleted');
      router.refresh();
    }
  }

  async function toggleKeyActive(id: string, currentActive: boolean) {
    const result = await updateGeminiKey(id, { active: !currentActive });
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`API key ${!currentActive ? 'enabled' : 'disabled'}`);
      router.refresh();
    }
  }

  function maskKeyString(k: string) {
    // Always mask - keys are encrypted in database
    return '••••••••••••••••' + (k.length > 16 ? k.slice(-4) : '');
  }

  // Users / Roles & Scoping Actions
  async function handleRoleChange(memberId: string, userId: string, newRole: 'owner' | 'admin' | 'member' | 'viewer') {
    if (!canManage) {
      toast.error('You do not have permission to change roles');
      return;
    }

    setUpdatingRole(memberId);
    const result = await updateMemberRole(organizationId, userId, newRole as 'admin' | 'member');
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Role updated successfully');
      router.refresh();
    }
    setUpdatingRole(null);
  }

  async function toggleSmtpAccess(userId: string, accountId: string) {
    const hasAccess = accountAccess.some(a => a.user_id === userId && a.account_id === accountId);
    
    if (hasAccess) {
      const result = await revokeAccountAccess(accountId, userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Access revoked');
        router.refresh();
      }
    } else {
      const result = await grantAccountAccess(accountId, userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Access granted');
        router.refresh();
      }
    }
  }

  function getUserAccountAccess(userId: string): string[] {
    return accountAccess
      .filter(a => a.user_id === userId)
      .map(a => a.account_id);
  }

  return (
    <div style={{ padding: 28 }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Configure team access controls and LLM integrations
        </p>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: `2px solid ${activeTab === 'users' ? 'var(--accent)' : 'transparent'}`,
            color: activeTab === 'users' ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s'
          }}
        >
          <Users size={16} /> Team & Access Scopes
        </button>
        <button
          onClick={() => setActiveTab('keys')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: `2px solid ${activeTab === 'keys' ? 'var(--accent)' : 'transparent'}`,
            color: activeTab === 'keys' ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s'
          }}
        >
          <Key size={16} /> Gemini API Keys
        </button>
      </div>

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="glass fade-in" style={{ padding: 24, background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Team Members Directory</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Configure roles and SMTP sending access scopes per user</div>
            </div>
          </div>

          {!canManage && (
            <div style={{ padding: '10px 14px', background: 'var(--yellow-glow)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 6, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              ⚠️ You need admin permissions to manage team member roles and access
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map(member => {
              const profile = member.profiles;
              const monogram = profile.full_name 
                ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : profile.email.slice(0, 2).toUpperCase();
              const isExpanded = expandedUserId === member.user_id;
              const userAccountIds = getUserAccountAccess(member.user_id);
              const isCurrentUser = member.user_id === currentUserId;
              
              return (
                <div key={member.id} style={{ 
                  border: '1px solid var(--border)', 
                  borderRadius: 6, 
                  background: 'var(--paper-100)', 
                  overflow: 'hidden' 
                }}>
                  {/* Row Summary */}
                  <div style={{ 
                    padding: '14px 18px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: '#FFFFFF'
                  }} onClick={() => setExpandedUserId(isExpanded ? null : member.user_id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--accent)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 12, fontFamily: 'Fraunces'
                      }}>
                        {monogram}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {profile.full_name || profile.email}
                          {isCurrentUser && <span className="badge badge-blue" style={{ fontSize: 9 }}>YOU</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {profile.email}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} onClick={e => e.stopPropagation()}>
                      {/* Role Selector dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Role:</span>
                        <select 
                          value={member.role}
                          onChange={e => handleRoleChange(member.id, member.user_id, e.target.value as any)}
                          disabled={!canManage || updatingRole === member.id || isCurrentUser}
                          style={{ padding: '4px 24px 4px 8px', fontSize: 12, width: 'auto', background: '#FFFFFF', opacity: (!canManage || isCurrentUser) ? 0.6 : 1 }}
                          title={isCurrentUser ? 'You cannot change your own role' : ''}
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>

                      {/* Expand control */}
                      <button 
                        onClick={() => setExpandedUserId(isExpanded ? null : member.user_id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Access configuration panel */}
                  {isExpanded && (
                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--paper-100)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Sending Account Access Scopes
                      </div>
                      
                      {member.role === 'owner' || member.role === 'admin' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 13, background: 'rgba(31,138,112,0.06)', padding: '10px 14px', borderRadius: 4, border: '1px solid rgba(31,138,112,0.1)' }}>
                          <Shield size={16} />
                          <span><strong>{member.role === 'owner' ? 'Owner' : 'Admin'} Role:</strong> {member.role === 'owner' ? 'Owners' : 'Admins'} have sending access to all connected SMTP configurations.</span>
                        </div>
                      ) : member.role === 'viewer' ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                          Viewers are restricted to read-only access and cannot send emails from any account.
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                            Select which connected accounts this teammate is authorized to use for sending campaigns:
                          </p>
                          
                          {sendingAccounts.length === 0 ? (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No SMTP accounts have been connected yet. Connect accounts in Sending Accounts to delegate access.
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                              {sendingAccounts.map(account => {
                                const isAllowed = userAccountIds.includes(account.id);
                                return (
                                  <label 
                                    key={account.id} 
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 10, 
                                      padding: '10px 14px', 
                                      background: '#FFFFFF', 
                                      borderRadius: 6, 
                                      border: `1px solid ${isAllowed ? 'var(--accent)' : 'var(--border)'}`,
                                      cursor: canManage ? 'pointer' : 'not-allowed',
                                      margin: 0,
                                      opacity: canManage ? 1 : 0.6
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isAllowed}
                                      onChange={() => toggleSmtpAccess(member.user_id, account.id)}
                                      disabled={!canManage}
                                      style={{ width: 'auto', cursor: canManage ? 'pointer' : 'not-allowed' }}
                                    />
                                    <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{account.name}</span>
                                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{account.email}</span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gemini Keys Tab */}
      {activeTab === 'keys' && (
        <div className="glass fade-in" style={{ padding: 24, background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--purple-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="var(--purple)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Google Gemini API Credentials</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>API keys are tried sequentially — if priority key fails, next backup is used</div>
            </div>
          </div>

          {!canManage && (
            <div style={{ padding: '10px 14px', background: 'var(--yellow-glow)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 6, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              ⚠️ You need admin permissions to manage Gemini API keys
            </div>
          )}

          {/* Failover Alert */}
          <div style={{ 
            padding: '12px 16px', 
            background: 'var(--purple-glow)', 
            border: '1px solid rgba(109,40,217,0.15)', 
            borderRadius: 6, 
            marginBottom: 20, 
            display: 'flex', 
            gap: 10 
          }}>
            <div style={{ fontSize: 18 }}>⚡</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--purple)', marginBottom: 2 }}>Auto-Failover Vault</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                API keys are encrypted and stored securely in Supabase Vault. When a key fails or hits rate limits, the system automatically tries the next active key.
              </div>
            </div>
          </div>

          {/* Add Key Form */}
          {canManage && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 0 180px' }}>
                <label>Credentials Name</label>
                <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Primary Key - Production" />
              </div>
              <div style={{ flex: '2 0 240px' }}>
                <label>Gemini API Key</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyVal}
                    onChange={e => setKeyVal(e.target.value)}
                    placeholder="AIzaSy..."
                    style={{ paddingRight: 42 }}
                  />
                  <button onClick={() => setShowKey(!showKey)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div style={{ flex: '1 0 180px' }}>
                <label>Model</label>
                <select value={model} onChange={e => setModel(e.target.value)}>
                  {GEMINI_MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', flex: '1 0 120px' }}>
                <button className="btn-ai" onClick={addKey} disabled={!label.trim() || !keyVal.trim() || savingKey} style={{ width: '100%', justifyContent: 'center' }}>
                  {savingKey ? <RefreshCw size={14} className="spin" /> : <Plus size={14} />}
                  {savingKey ? 'Adding...' : 'Add Key'}
                </button>
              </div>
            </div>
          )}

          {/* Keys Listing */}
          {geminiKeys.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', background: 'var(--paper-100)', borderRadius: 6, border: '1px dashed var(--border)' }}>
              <Key size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No API keys configured yet. {canManage ? 'Add your first Gemini key above.' : 'Ask an admin to add keys.'}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                Get keys at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>aistudio.google.com</a>
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {geminiKeys
                .sort((a, b) => a.priority - b.priority)
                .map((k, i) => (
                <div key={k.id} className="glass glass-hover" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF' }}>
                  {/* Priority rank badge */}
                  <div style={{ 
                    width: 28, height: 28, borderRadius: 4, 
                    background: k.active ? 'var(--purple-glow)' : 'var(--paper-200)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: 11, fontWeight: 700, color: k.active ? 'var(--purple)' : 'var(--text-muted)', 
                    flexShrink: 0 
                  }}>
                    #{i + 1}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{k.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {maskKeyString(k.key_encrypted)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--purple)', background: 'var(--purple-glow)', padding: '2px 6px', borderRadius: 3, display: 'inline-block', fontWeight: 600 }}>
                      {k.model}
                    </div>
                  </div>

                  <span className={`badge ${k.active ? 'badge-green' : 'badge-red'}`}>
                    {k.active ? 'Active' : 'Disabled'}
                  </span>

                  {/* Actions */}
                  {canManage && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 11, minHeight: 30 }} onClick={() => toggleKeyActive(k.id, k.active)}>
                        {k.active ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn-danger" style={{ padding: '6px 10px', minHeight: 30 }} onClick={() => removeKey(k.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Model info panel */}
          <div className="glass" style={{ padding: 20, marginTop: 24, background: '#FFFFFF' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, fontFamily: 'Fraunces' }}>Available Gemini Models</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { 
                  model: 'gemini-3.5-flash', 
                  badge: 'RECOMMENDED',
                  color: 'var(--purple)',
                  text: 'Fast and efficient model for email generation with excellent quality.' 
                },
                { 
                  model: 'gemini-3.5-pro', 
                  badge: 'ADVANCED',
                  color: 'var(--accent)',
                  text: 'Most capable model for complex email templates and detailed content generation.' 
                },
                { 
                  model: 'gemini-3.1-flash-lite', 
                  badge: 'EFFICIENT',
                  color: 'var(--green)',
                  text: 'Lightweight model optimized for simple templates and high-volume generation.' 
                },
              ].map(({ model, badge, color, text }) => (
                <div key={model} style={{ display: 'flex', gap: 8, padding: 10, background: 'var(--paper-100)', borderRadius: 6, border: '1px solid var(--border)', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 6, height: 6, borderRadius: '50%', background: color, marginTop: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{model}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 2, background: `${color}12`, color: color }}>{badge}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
