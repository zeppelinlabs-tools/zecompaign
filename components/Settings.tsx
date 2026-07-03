'use client';
import { useState } from 'react';
import { Users, Key, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Sparkles, ChevronDown, ChevronUp, Check, Shield } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { GeminiKey, User, SmtpConfig, UserRole } from '@/lib/types';

interface Props {
  keys: GeminiKey[];
  onKeysChange: (k: GeminiKey[]) => void;
  users: User[];
  onUsersChange: (u: User[]) => void;
  smtpConfigs: SmtpConfig[];
}

const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.5-live-translate-preview'
];

export default function Settings({ keys, onKeysChange, users, onUsersChange, smtpConfigs }: Props) {
  const [activeTab, setActiveTab] = useState<'users' | 'keys'>('users');
  
  // Gemini Keys States
  const [label, setLabel] = useState('');
  const [keyVal, setKeyVal] = useState('');
  const [model, setModel] = useState('gemini-3.5-flash');
  const [showKey, setShowKey] = useState(false);
  const [revealedKeyIds, setRevealedKeyIds] = useState<string[]>([]);

  // Users States
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Gemini Keys Actions
  function addKey() {
    if (!label.trim() || !keyVal.trim()) return;
    const newKey: GeminiKey = {
      id: uuid(), label: label.trim(), key: keyVal.trim(),
      active: true, priority: keys.length + 1, model: model,
    };
    onKeysChange([...keys, newKey]);
    setLabel(''); setKeyVal(''); setModel('gemini-3.5-flash');
  }

  function removeKey(id: string) { 
    onKeysChange(keys.filter(k => k.id !== id)); 
  }

  function toggleKeyActive(id: string) {
    onKeysChange(keys.map(k => k.id === id ? { ...k, active: !k.active } : k));
  }

  function moveKeyUp(idx: number) {
    if (idx === 0) return;
    const arr = [...keys];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onKeysChange(arr.map((k, i) => ({ ...k, priority: i + 1 })));
  }

  function moveKeyDown(idx: number) {
    if (idx === keys.length - 1) return;
    const arr = [...keys];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onKeysChange(arr.map((k, i) => ({ ...k, priority: i + 1 })));
  }

  function toggleRevealKey(id: string) {
    if (revealedKeyIds.includes(id)) {
      setRevealedKeyIds(revealedKeyIds.filter(x => x !== id));
    } else {
      // Re-auth confirmation simulated
      const confirmReveal = window.confirm("Are you sure you want to reveal this API Key? Credentials should be handled securely.");
      if (confirmReveal) {
        setRevealedKeyIds([...revealedKeyIds, id]);
      }
    }
  }

  function maskKeyString(k: string, id: string) {
    if (revealedKeyIds.includes(id)) return k;
    if (k.length <= 8) return '•'.repeat(k.length);
    return k.slice(0, 6) + '•'.repeat(k.length - 10) + k.slice(-4);
  }

  // Users / Roles & Scoping Actions
  function handleRoleChange(userId: string, newRole: UserRole) {
    const updated = users.map(u => 
      u.id === userId 
        ? { ...u, role: newRole, allowedSmtpIds: newRole === 'admin' ? [] : u.allowedSmtpIds } 
        : u
    );
    onUsersChange(updated);
  }

  function toggleSmtpAccess(userId: string, smtpId: string) {
    const updated = users.map(u => {
      if (u.id === userId) {
        const hasAccess = u.allowedSmtpIds.includes(smtpId);
        const allowedSmtpIds = hasAccess
          ? u.allowedSmtpIds.filter(id => id !== smtpId)
          : [...u.allowedSmtpIds, smtpId];
        return { ...u, allowedSmtpIds };
      }
      return u;
    });
    onUsersChange(updated);
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
              <div style={{ fontWeight: 700, fontSize: 16 }}>Teammates Directory</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Configure roles and SMTP sending access scopes per user</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.map(u => {
              const monogram = u.name.split(' ').map(n => n[0]).join('');
              const isExpanded = expandedUserId === u.id;
              
              return (
                <div key={u.id} style={{ 
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
                  }} onClick={() => setExpandedUserId(isExpanded ? null : u.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: u.avatarColor, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 12, fontFamily: 'Fraunces'
                      }}>
                        {monogram}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {u.email}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} onClick={e => e.stopPropagation()}>
                      {/* Role Selector dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Role:</span>
                        <select 
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                          style={{ padding: '4px 24px 4px 8px', fontSize: 12, width: 'auto', background: '#FFFFFF' }}
                        >
                          <option value="admin">Admin</option>
                          <option value="marketer">Marketer</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>

                      {/* Expand control */}
                      <button 
                        onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
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
                      
                      {u.role === 'admin' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 13, background: 'rgba(31,138,112,0.06)', padding: '10px 14px', borderRadius: 4, border: '1px solid rgba(31,138,112,0.1)' }}>
                          <Shield size={16} />
                          <span><strong>Arthur Admin Role:</strong> Admins implicitly have sending access to all connected SMTP configurations.</span>
                        </div>
                      ) : u.role === 'viewer' ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                          Viewers are restricted to read-only access and cannot send emails from any account.
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                            Select which connected accounts this teammate is authorized to select and send campaigns from:
                          </p>
                          
                          {smtpConfigs.length === 0 ? (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No SMTP accounts have been connected yet. Connect accounts in Sending Accounts to delegate access.
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                              {smtpConfigs.map(cfg => {
                                const isAllowed = u.allowedSmtpIds.includes(cfg.id);
                                return (
                                  <label 
                                    key={cfg.id} 
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 10, 
                                      padding: '10px 14px', 
                                      background: '#FFFFFF', 
                                      borderRadius: 6, 
                                      border: `1px solid ${isAllowed ? 'var(--accent)' : 'var(--border)'}`,
                                      cursor: 'pointer',
                                      margin: 0
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isAllowed}
                                      onChange={() => toggleSmtpAccess(u.id, cfg.id)}
                                      style={{ width: 'auto', cursor: 'pointer' }}
                                    />
                                    <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{cfg.name}</span>
                                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{cfg.fromEmail}</span>
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
                API keys are encrypted and stored securely. Disable keys temporarily, reorder priorities using arrow reordering, and configure backup models (lite/live-translate).
              </div>
            </div>
          </div>

          {/* Add Key Form */}
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
              <label>Backup Model Target</label>
              <select value={model} onChange={e => setModel(e.target.value)}>
                {GEMINI_MODELS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', flex: '1 0 120px' }}>
              <button className="btn-ai" onClick={addKey} disabled={!label.trim() || !keyVal.trim()} style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={14} /> Add API Key
              </button>
            </div>
          </div>

          {/* Keys Listing */}
          {keys.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', background: 'var(--paper-100)', borderRadius: 6, border: '1px dashed var(--border)' }}>
              <Key size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No credentials added yet. Enter a Gemini API Key above.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                Get keys at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>aistudio.google.com</a>
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {keys.map((k, i) => (
                <div key={k.id} className="glass glass-hover" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF' }}>
                  {/* Priority reorder arrows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={() => moveKeyUp(i)} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer', color: i === 0 ? '#C0C5D5' : 'var(--text-muted)', padding: 2 }}>
                      <ArrowUp size={12} />
                    </button>
                    <button onClick={() => moveKeyDown(i)} disabled={i === keys.length - 1} style={{ background: 'none', border: 'none', cursor: i === keys.length - 1 ? 'not-allowed' : 'pointer', color: i === keys.length - 1 ? '#C0C5D5' : 'var(--text-muted)', padding: 2 }}>
                      <ArrowDown size={12} />
                    </button>
                  </div>

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
                      {maskKeyString(k.key, k.id)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--purple)', background: 'var(--purple-glow)', padding: '2px 6px', borderRadius: 3, display: 'inline-block', fontWeight: 600 }}>
                      {k.model || 'gemini-3.5-flash'}
                    </div>
                  </div>

                  <span className={`badge ${k.active ? 'badge-green' : 'badge-red'}`}>
                    {k.active ? 'Active' : 'Disabled'}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 11, minHeight: 30 }} onClick={() => toggleRevealKey(k.id)}>
                      {revealedKeyIds.includes(k.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 11, minHeight: 30 }} onClick={() => toggleKeyActive(k.id)}>
                      {k.active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn-danger" style={{ padding: '6px 10px', minHeight: 30 }} onClick={() => removeKey(k.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
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
                  badge: 'FLAGSHIP',
                  color: 'var(--purple)',
                  text: 'Optimal for text drafting and structured copy extraction — fast, reliable copy generator.' 
                },
                { 
                  model: 'gemini-3.1-flash-lite', 
                  badge: 'EFFICIENT',
                  color: 'var(--accent)',
                  text: 'Super high-speed, cost-optimized backup model for simple outreach templates.' 
                },
                { 
                  model: 'gemini-3.5-live-translate-preview', 
                  badge: 'PREVIEW',
                  color: 'var(--yellow)',
                  text: 'Optimized for live multi-language localized variations and quick translations.' 
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
