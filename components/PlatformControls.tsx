'use client';
import { useState } from 'react';
import { Globe, Cpu, Database, Activity, Sliders, ShieldAlert, List, Server, CheckCircle, RefreshCw, Key, Plus, Trash2 } from 'lucide-react';
import { v4 as uuid } from 'uuid';

interface GlobalKey {
  id: string;
  label: string;
  key: string;
  model: string;
  active: boolean;
}

export default function PlatformControls() {
  // Global limit parameters
  const [freeQuota, setFreeQuota] = useState(100);
  const [warmupLimit, setWarmupLimit] = useState(50);
  const [spamScanner, setSpamScanner] = useState(true);
  const [globalKeys, setGlobalKeys] = useState<GlobalKey[]>([
    { id: 'gkey-1', label: 'Platform Fallback Key Primary', key: 'AIzaSySystemPrimaryFallbackKey99201', model: 'gemini-3.5-flash', active: true }
  ]);
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newModel, setNewModel] = useState('gemini-3.5-flash');

  // Simulated live logs list
  const [logs, setLogs] = useState([
    { time: '10:42:15', tenant: 'Acme Corp', event: 'Upgraded to Team Plan ($99/mo) via Stripe Checkout', type: 'billing' },
    { time: '10:38:09', tenant: 'Alpha Group', event: 'SMTP connection test succeeded for host smtp.gmail.com', type: 'smtp' },
    { time: '10:25:30', tenant: 'BetaLab', event: 'Rate limit hit (100 sends/hr exceeded). Delivery throttled.', type: 'warn' },
    { time: '10:14:45', tenant: 'GlobalReach', event: 'Engaged platform backup fallback Gemini key due to quota limit', type: 'ai' },
    { time: '09:55:12', tenant: 'System', event: 'Automated cleanup task pruned 1,482 expired sent email logs', type: 'system' }
  ]);

  function addGlobalKey() {
    if (!newLabel.trim() || !newKey.trim()) return;
    const key: GlobalKey = {
      id: uuid(),
      label: newLabel.trim(),
      key: newKey.trim(),
      model: newModel,
      active: true
    };
    setGlobalKeys([...globalKeys, key]);
    setNewLabel('');
    setNewKey('');
  }

  function removeGlobalKey(id: string) {
    setGlobalKeys(globalKeys.filter(k => k.id !== id));
  }

  function addSimulatedLog(eventText: string, tenant = 'System', type = 'system') {
    const timeStr = new Date().toTimeString().split(' ')[0];
    setLogs(l => [{ time: timeStr, tenant, event: eventText, type }, ...l]);
  }

  return (
    <div style={{ padding: 28 }}>
      {/* Title */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Platform Operations</h1>
            <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Globe size={10} /> Super Admin Mode
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Global SaaS controls, platform fallback credentials, and system-wide telemetry logs
          </p>
        </div>
        <button className="btn-secondary" onClick={() => addSimulatedLog('Triggered manual cache clean & DB optimization', 'System', 'system')}>
          <RefreshCw size={14} /> Optimize DB
        </button>
      </div>

      {/* Grid of Platform Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 24 }}>
        {[
          { label: 'Total Tenants Registered', val: '14 Orgs', change: '+3 this week', icon: Database, color: 'var(--route-blue)' },
          { label: 'System-wide Volume', val: '18,482 sends', change: '99.8% delivery rate', icon: Activity, color: 'var(--green)' },
          { label: 'Gemini Quota Fallback', val: '2 Keys Active', change: '84 requests this month', icon: Cpu, color: 'var(--purple)' },
          { label: 'Compliance Health', val: '0 Suspended', change: 'Spam filters active', icon: ShieldAlert, color: 'var(--red)' }
        ].map((stat, i) => (
          <div key={i} className="glass" style={{ padding: 18, background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{stat.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: `${stat.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={16} color={stat.color} style={{ margin: '0 auto' }} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{stat.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: stat.color }}>●</span> {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
        {/* Left Side: System Fallbacks and Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Global Fallback Keys */}
          <div className="glass" style={{ padding: 20, background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Key size={18} color="var(--purple)" />
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Global Gemini Fallback Vault</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              These keys are shared system-wide. If an organization does not supply their own API key, the platform will automatically fall back to these credentials to avoid generation dropouts (subject to plans).
            </p>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {globalKeys.map(k => (
                <div key={k.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--paper-100)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{k.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {k.key.slice(0, 8)}••••••••••••••••{k.key.slice(-4)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-purple" style={{ fontSize: 10 }}>{k.model}</span>
                    <button className="btn-danger" style={{ padding: '6px 8px', minHeight: 28 }} onClick={() => removeGlobalKey(k.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add form */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: 'var(--paper-100)', padding: 14, borderRadius: 6, border: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, marginBottom: 4 }}>Key Label</label>
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Master Fallback Key" style={{ padding: '6px 10px', fontSize: 12 }} />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 11, marginBottom: 4 }}>Gemini API Secret</label>
                <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="AIzaSy..." style={{ padding: '6px 10px', fontSize: 12 }} type="password" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, marginBottom: 4 }}>Model Target</label>
                <select value={newModel} onChange={e => setNewModel(e.target.value)} style={{ padding: '5px 8px', fontSize: 12 }}>
                  <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                </select>
              </div>
              <button className="btn-ai" onClick={addGlobalKey} disabled={!newLabel.trim() || !newKey.trim()} style={{ height: 32, fontSize: 12, padding: '0 12px' }}>
                <Plus size={12} /> Add
              </button>
            </div>
          </div>

          {/* Compliance and Limits Settings */}
          <div className="glass" style={{ padding: 20, background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sliders size={18} color="var(--route-blue)" />
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>System Rate Limits & Quotas</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontWeight: 600 }}>Free Plan Hourly Rate Limit</label>
                <input 
                  type="number" 
                  value={freeQuota} 
                  onChange={e => {
                    setFreeQuota(Number(e.target.value));
                    addSimulatedLog(`Updated Free Plan hourly limit to ${e.target.value} emails`, 'System', 'system');
                  }}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Max emails a free tenant can send per hour.</span>
              </div>

              <div>
                <label style={{ fontWeight: 600 }}>Initial SMTP Warmup Limit</label>
                <input 
                  type="number" 
                  value={warmupLimit} 
                  onChange={e => {
                    setWarmupLimit(Number(e.target.value));
                    addSimulatedLog(`Updated initial SMTP warmup limit to ${e.target.value} emails/day`, 'System', 'system');
                  }}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Daily email sending cap for unverified SMTP accounts.</span>
              </div>
            </div>

            <div style={{ marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0 }}>
                <input 
                  type="checkbox" 
                  checked={spamScanner} 
                  onChange={e => {
                    setSpamScanner(e.target.checked);
                    addSimulatedLog(`${e.target.checked ? 'Enabled' : 'Disabled'} platform-wide anti-abuse AI spam scanner`, 'System', 'system');
                  }}
                  style={{ width: 'auto' }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Enable Platform-wide Spam & Abuse Scanner</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Scans bulk outbound email headers using Gemini content moderation before delivery.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Side: Platform Activity Logs */}
        <div className="glass" style={{ padding: 20, background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <List size={18} color="var(--red)" />
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Tenant Operations Log</h2>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            Real-time feed of multi-tenant billing events, quota limits, and system health checks.
          </p>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
            {logs.map((log, idx) => {
              const bg = log.type === 'warn' 
                ? 'rgba(179,57,44,0.06)' 
                : log.type === 'billing' 
                ? 'rgba(31,138,112,0.06)' 
                : 'var(--paper-100)';
              const border = log.type === 'warn' 
                ? 'rgba(179,57,44,0.15)' 
                : log.type === 'billing' 
                ? 'rgba(31,138,112,0.15)' 
                : 'var(--border)';
              const labelColor = log.type === 'warn' 
                ? 'var(--red)' 
                : log.type === 'billing' 
                ? 'var(--green)' 
                : 'var(--text-muted)';
              
              return (
                <div key={idx} className="fade-in" style={{ padding: '10px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: labelColor }}>
                      {log.tenant}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {log.time}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>
                    {log.event}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
