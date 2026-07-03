'use client';
import { LayoutDashboard, Server, Send, Sparkles, BookMarked, Settings, Users, CreditCard, Mail, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from '@/lib/actions/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface SidebarProps {
  user?: SupabaseUser | null
  profile?: any
  currentOrg?: any
}

interface NavItem { 
  id: string
  icon: React.ElementType
  label: string
  ai?: boolean
}

const NAV: NavItem[] = [
  { id: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: '/compose',   icon: Send,            label: 'Compose' },
  { id: '/ai',        icon: Sparkles,        label: 'AI Generator', ai: true },
  { id: '/templates', icon: BookMarked,      label: 'Templates' },
  { id: '/smtp',      icon: Server,          label: 'Sending Accounts' },
  { id: '/team',      icon: Users,           label: 'Team' },
  { id: '/billing',   icon: CreditCard,      label: 'Billing' },
  { id: '/settings',  icon: Settings,        label: 'Settings' },
];

export default function Sidebar({ user, profile, currentOrg }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await signOut()
  }

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside style={{
      width: 230,
      minHeight: '100vh',
      background: 'var(--ink-900)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Brand Header */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 6, 
            background: 'var(--route-blue)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Mail size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', fontFamily: 'Fraunces' }}>zecompaign</div>
            <div style={{ fontSize: 10, color: '#A0A5B5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign Platform</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '20px 10px' }}>
        <div className="section-title" style={{ paddingLeft: 10, marginBottom: 12, fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Navigation
        </div>
        {NAV.map(item => {
          const isActive = pathname === item.id
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.id)}
              style={{
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10,
                padding: '10px 12px', 
                borderRadius: 6, 
                border: 'none', 
                cursor: 'pointer', 
                marginBottom: 4,
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#A0A5B5',
                fontWeight: isActive ? 600 : 500, 
                fontSize: 13, 
                textAlign: 'left', 
                transition: 'all 0.15s ease',
              }}
              onMouseOver={e => {
                if (!isActive) e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseOut={e => {
                if (!isActive) e.currentTarget.style.color = '#A0A5B5';
              }}
            >
              <item.icon size={16} color={isActive ? 'var(--route-blue)' : '#A0A5B5'} />
              {item.label}
              {item.ai && (
                <span style={{ 
                  marginLeft: 'auto', 
                  fontSize: 8, 
                  fontWeight: 700, 
                  background: 'var(--route-blue)', 
                  color: 'white',
                  padding: '2px 4px',
                  borderRadius: 3
                }}>AI</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: '#3B82F6',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
            fontFamily: 'Fraunces',
            flexShrink: 0
          }}>
            {userInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </div>
            <div style={{ fontSize: 11, color: '#A0A5B5', textTransform: 'capitalize' }}>
              {currentOrg?.role || 'member'}
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            title="Log out" 
            style={{
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: '#A0A5B5', 
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              transition: 'all 0.15s'
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseOut={e => (e.currentTarget.style.color = '#A0A5B5')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

