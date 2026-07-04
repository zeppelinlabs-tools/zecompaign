'use client';
import { LayoutDashboard, Server, Send, Sparkles, BookMarked, Settings, Users, CreditCard, Mail, LogOut, UserCircle, Building2, Plus, ChevronDown, Check, Trash2, LogOutIcon, FileText } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from '@/lib/actions/auth';
import { createOrganization, leaveOrganization } from '@/lib/actions/organizations';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { CreateOrgModal } from './CreateOrgModal';

interface SidebarProps {
  user?: SupabaseUser | null
  profile?: any
  currentOrg?: any
  allOrgs?: any[]
}

interface NavItem { 
  id: string
  icon: React.ElementType
  label: string
  ai?: boolean
  minRole?: 'viewer' | 'member' | 'admin' | 'owner' // minimum role required
}

const NAV: NavItem[] = [
  { id: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: '/compose',   icon: Send,            label: 'Compose', minRole: 'member' },
  { id: '/ai',        icon: Sparkles,        label: 'AI Generator', ai: true, minRole: 'member' },
  { id: '/templates', icon: BookMarked,      label: 'Templates' },
  { id: '/smtp',      icon: Server,          label: 'Sending Accounts', minRole: 'admin' },
  { id: '/team',      icon: Users,           label: 'Team', minRole: 'admin' },
  { id: '/audit-logs', icon: FileText,       label: 'Audit Logs', minRole: 'admin' },
  { id: '/billing',   icon: CreditCard,      label: 'Billing' },
  { id: '/organizations', icon: Building2,   label: 'Organizations' },
  { id: '/profile',   icon: UserCircle,      label: 'Profile' },
  { id: '/settings',  icon: Settings,        label: 'Settings', minRole: 'admin' },
];

// Role hierarchy helper
function hasPermission(userRole: string | undefined, requiredRole: string | undefined): boolean {
  if (!requiredRole) return true // no restriction
  if (!userRole) return false // no role = no access

  const hierarchy = ['viewer', 'member', 'admin', 'owner']
  const userLevel = hierarchy.indexOf(userRole)
  const requiredLevel = hierarchy.indexOf(requiredRole)
  
  return userLevel >= requiredLevel
}

export default function Sidebar({ user, profile, currentOrg, allOrgs = [] }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showOrgMenu, setShowOrgMenu] = useState(false)
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [newOrgName, setNewOrgName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [switching, setSwitching] = useState(false)

  console.log('Sidebar render - showCreateOrg:', showCreateOrg, 'showOrgMenu:', showOrgMenu)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-org-menu]')) {
        setShowOrgMenu(false)
        setShowCreateOrg(false)
      }
    }

    if (showOrgMenu || showCreateOrg) {
      // Delay adding the listener to avoid immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 0)
      
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showOrgMenu, showCreateOrg])

  async function handleLogout() {
    await signOut()
  }

  async function handleSwitchOrg(orgId: string) {
    if (orgId === currentOrg?.id) {
      setShowOrgMenu(false)
      return
    }

    setSwitching(true)
    setShowOrgMenu(false) // Close menu immediately
    
    // Store selected org in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedOrgId', orgId)
      
      // Set cookie with proper encoding
      const cookieValue = `selectedOrgId=${encodeURIComponent(orgId)}; path=/; max-age=31536000; SameSite=Lax`
      document.cookie = cookieValue
      
      // Force hard reload to bypass cache
      window.location.replace('/dashboard')
    }
  }

  async function handleDeleteOrg(orgId: string) {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      setShowDeleteConfirm(null)
      return
    }

    setDeleting(true)
    const { deleteOrganization } = await import('@/lib/actions/organizations')
    const result = await deleteOrganization(orgId)
    
    if (result.error) {
      toast.error(result.error)
      setDeleting(false)
    } else {
      toast.success('Organization deleted successfully')
      setShowDeleteConfirm(null)
      setShowOrgMenu(false)
      // Reload to show remaining organizations
      window.location.href = '/dashboard'
    }
  }

  async function handleLeaveOrg(orgId: string, orgName: string) {
    if (!confirm(`Are you sure you want to leave "${orgName}"? You will lose access to all its data.`)) {
      return
    }

    setDeleting(true)
    const result = await leaveOrganization(orgId)
    
    if (result.error) {
      toast.error(result.error)
      setDeleting(false)
    } else {
      toast.success(`Left ${orgName} successfully`)
      setShowOrgMenu(false)
      // Clear localStorage and reload
      localStorage.removeItem('selectedOrgId')
      window.location.href = '/dashboard'
    }
  }

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const userRole = currentOrg?.role

  return (
    <aside style={{
      width: 230,
      height: '100vh',
      background: 'var(--ink-900)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      overflowY: 'auto',
      overflowX: 'hidden'
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

      {/* Organization Switcher */}
      {currentOrg && (
        <div style={{ padding: '16px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative' }} data-org-menu>
          <button
            onClick={() => setShowOrgMenu(!showOrgMenu)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 6,
              border: 'none',
              background: 'rgba(255,255,255,0.05)',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'background 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <Building2 size={16} color="#A0A5B5" />
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div style={{ 
                fontSize: 13, 
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {currentOrg.name}
              </div>
              {allOrgs.length > 1 && (
                <div style={{ fontSize: 10, color: '#A0A5B5' }}>
                  {allOrgs.length} organizations
                </div>
              )}
            </div>
            <ChevronDown 
              size={14} 
              color="#A0A5B5"
              style={{
                transform: showOrgMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease'
              }}
            />
          </button>

          {/* Organization Menu Dropdown */}
          {showOrgMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 10,
              right: 10,
              marginTop: 4,
              background: '#1F2937', // Solid dark gray instead of var(--ink-800)
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 50,
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {/* Current Organizations */}
              <div style={{ padding: '8px 0' }}>
                {allOrgs.map((org) => {
                  const isCurrentOrg = org.id === currentOrg.id
                  const canDelete = org.role === 'owner' && allOrgs.length > 1

                  return (
                    <div key={org.id} style={{ position: 'relative' }}>
                      <button
                        onClick={() => handleSwitchOrg(org.id)}
                        disabled={switching}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          paddingRight: canDelete ? 40 : 12,
                          border: 'none',
                          background: isCurrentOrg ? 'rgba(255,255,255,0.08)' : 'transparent',
                          color: '#FFFFFF',
                          cursor: switching ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          textAlign: 'left',
                          transition: 'background 0.15s ease',
                          opacity: switching ? 0.5 : 1
                        }}
                        onMouseOver={(e) => {
                          if (!isCurrentOrg && !switching) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isCurrentOrg) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <Building2 size={14} color="#A0A5B5" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontSize: 13, 
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {org.name}
                          </div>
                          <div style={{ fontSize: 10, color: '#A0A5B5', textTransform: 'capitalize' }}>
                            {org.role} · {org.plan}
                          </div>
                        </div>
                        {isCurrentOrg && (
                          <Check size={14} color="var(--route-blue)" />
                        )}
                      </button>

                      {/* Delete/Leave Button */}
                      {!isCurrentOrg && (
                        canDelete ? (
                          // Delete button for owners
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteOrg(org.id)
                            }}
                            disabled={deleting}
                            style={{
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--red)',
                              cursor: deleting ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: deleting ? 0.5 : 0.7,
                              transition: 'all 0.15s ease'
                            }}
                            title="Delete organization"
                            onMouseOver={(e) => {
                              e.currentTarget.style.opacity = '1'
                              e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.opacity = '0.7'
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        ) : allOrgs.length > 1 ? (
                          // Leave button for non-owners (if they have multiple orgs)
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLeaveOrg(org.id, org.name)
                            }}
                            disabled={deleting}
                            style={{
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                              border: 'none',
                              background: 'transparent',
                              color: '#FFA500',
                              cursor: deleting ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: deleting ? 0.5 : 0.7,
                              transition: 'all 0.15s ease'
                            }}
                            title="Leave organization"
                            onMouseOver={(e) => {
                              e.currentTarget.style.opacity = '1'
                              e.currentTarget.style.background = 'rgba(255,165,0,0.1)'
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.opacity = '0.7'
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <LogOutIcon size={12} />
                          </button>
                        ) : null
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

              {/* Create New Organization */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Create Organization button clicked');
                  setShowCreateOrg(true);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--route-blue)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'background 0.15s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Plus size={14} />
                Create Organization
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateOrg && (
        <CreateOrgModal
          onClose={() => setShowCreateOrg(false)}
          onSuccess={() => {
            setShowCreateOrg(false)
            setShowOrgMenu(false)
            window.location.href = '/dashboard'
          }}
        />
      )}

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '20px 10px' }}>
        <div className="section-title" style={{ paddingLeft: 10, marginBottom: 12, fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Navigation
        </div>
        {NAV.filter(item => hasPermission(userRole, item.minRole)).map(item => {
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

