'use client';
import { CheckCircle, XCircle, Server, Sparkles, Send, Clock, Settings, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';

function StatCard({ icon: Icon, label, value, color, trend }: {
  icon: React.ElementType; label: string; value: string | number; color: string; trend?: string;
}) {
  return (
    <div className="glass" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
        <div style={{
          width: 36, height: 36, borderRadius: 6,
          background: `${color}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${color}20`
        }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{value}</span>
        {trend && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingUp size={10} /> {trend}
          </span>
        )}
      </div>
    </div>
  );
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

interface DashboardProps {
  user: SupabaseUser
  profile: any
  currentOrg: any
}

export default function Dashboard({ user, profile, currentOrg }: DashboardProps) {
  const router = useRouter()
  
  // TODO: Fetch these stats from API
  const sent = 0
  const failed = 0
  const activeSmtp = 0
  const activeGemini = 0
  const recent: any[] = []

  // Role-based permissions
  const role = currentOrg?.role || 'viewer'
  const canCompose = role !== 'viewer' // member, admin, owner can compose
  const canUseAI = role !== 'viewer' // member, admin, owner can use AI
  const canManageSmtp = role === 'admin' || role === 'owner' // only admin and owner
  const canManageTeam = role === 'admin' || role === 'owner' // only admin and owner
  const canManageSettings = role === 'admin' || role === 'owner' // only admin and owner

  return (
    <div style={{ padding: 28 }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Welcome back, {profile?.full_name || user.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard icon={Send} label="Emails Sent" value={sent} color="var(--green)" trend="+4% this wk" />
        <StatCard 
          icon={XCircle} 
          label="Failed" 
          value={failed} 
          color={failed > 0 ? "var(--red)" : "var(--ink-600)"} 
          trend={failed > 0 ? "needs attention" : "healthy"}
        />
        <StatCard icon={Server} label="Active SMTPs" value={activeSmtp} color="var(--accent)" />
        <StatCard icon={Sparkles} label="Gemini Keys" value={activeGemini} color="var(--purple)" />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-title">Quick Actions</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {canCompose && (
            <button className="btn-primary" onClick={() => router.push('/compose')}>
              <Send size={15} /> Compose Email
            </button>
          )}
          {canCompose && (
            <button className="btn-ai" onClick={() => router.push('/ai')}>
              <Sparkles size={15} /> Generate with AI
            </button>
          )}
          {canManageSmtp && (
            <button className="btn-secondary" onClick={() => router.push('/smtp')}>
              <Server size={15} /> Add Sending Account
            </button>
          )}
          {canManageSmtp && (
            <button className="btn-secondary" onClick={() => router.push('/settings')}>
              <Settings size={15} /> Open Settings
            </button>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={15} color="var(--text-muted)" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Recent Sent Log</span>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: '#FFFFFF' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, fontFamily: 'Fraunces', fontWeight: 600, marginBottom: 12 }}>
              Nothing sent yet. Add a sending account to get started.
            </p>
            <button className="btn-primary" onClick={() => router.push(canManageSmtp ? '/smtp' : '/dashboard')}>
              {canManageSmtp ? 'Add Sending Account' : 'Back to Dashboard'}
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                {['Account Used', 'Sender', 'Recipients', 'Subject', 'Status', 'Sent At'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((email, i) => {
                const acctMonogram = getMonogram(email.smtpName);
                const senderName = email.senderName || 'Teammate';
                const senderMonogram = senderName.split(' ').map((n: string) => n[0]).join('');

                return (
                  <tr key={email.id} style={{ borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none', background: '#FFFFFF' }}>
                    {/* Account Used */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="monogram" style={{
                          width: 24, height: 24, fontSize: 10,
                          background: 'var(--accent-glow)', color: 'var(--accent)',
                          border: '1px solid var(--border)'
                        }}>
                          {acctMonogram}
                        </div>
                        <span style={{ fontWeight: 600 }}>{email.smtpName}</span>
                      </div>
                    </td>
                    
                    {/* Sender */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: '#E2E8F0', color: 'var(--text-muted)',
                          fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                        }}>
                          {senderMonogram}
                        </div>
                        <span style={{ fontSize: 12 }}>{senderName}</span>
                      </div>
                    </td>

                    {/* Recipients */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text)' }}>
                      {email.to.slice(0, 2).map((r: any) => r.name || r.email).join(', ')}
                      {email.to.length > 2 && <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}> +{email.to.length - 2} more</span>}
                    </td>

                    {/* Subject */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text)', maxWidth: 220 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{email.subject}</span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      {email.status === 'sent'
                        ? <span className="badge badge-green"><CheckCircle size={10} /> Sent</span>
                        : <span className="badge badge-red"><XCircle size={10} /> Failed</span>}
                    </td>

                    {/* Sent At */}
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(email.sentAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

