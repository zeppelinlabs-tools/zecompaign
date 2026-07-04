'use client'

import { useState } from 'react'
import { Building2, Edit2, Trash2, Users, Calendar, Crown, Shield, Eye, Save, X, Loader2, Plus } from 'lucide-react'
import { updateOrganization, deleteOrganization, removeTeamMember, updateMemberRole, inviteTeamMember } from '@/lib/actions/organizations'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface OrganizationsManagerProps {
  currentOrg: any
  allOrgs: any[]
  orgDetails: any
  members: any[]
  userId: string
}

export default function OrganizationsManager({ 
  currentOrg, 
  allOrgs, 
  orgDetails, 
  members,
  userId 
}: OrganizationsManagerProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [orgName, setOrgName] = useState(orgDetails?.name || '')
  const [saving, setSaving] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [inviting, setInviting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isOwner = currentOrg.role === 'owner'
  const isAdmin = currentOrg.role === 'admin' || currentOrg.role === 'owner'
  const canManageMembers = isAdmin

  async function handleSaveName() {
    if (!orgName.trim() || orgName === orgDetails?.name) {
      setEditing(false)
      return
    }

    setSaving(true)
    const result = await updateOrganization(currentOrg.id, { name: orgName.trim() })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Organization name updated')
      setEditing(false)
      router.refresh()
    }
    setSaving(false)
  }

  async function handleDeleteOrg() {
    const canDelete = allOrgs.length > 1
    
    if (!canDelete) {
      toast.error('Cannot delete your only organization')
      return
    }

    if (!confirm(`Are you sure you want to delete "${orgDetails?.name}"? This will remove all data and cannot be undone.`)) {
      return
    }

    const result = await deleteOrganization(currentOrg.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Organization deleted successfully')
      localStorage.removeItem('selectedOrgId')
      window.location.href = '/dashboard'
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from this organization?`)) {
      return
    }

    setActionLoading(memberId)
    const result = await removeTeamMember(currentOrg.id, memberId)

    if (result.error) {
      toast.error(result.error)
      setActionLoading(null)
    } else {
      toast.success('Member removed successfully')
      router.refresh()
    }
  }

  async function handleChangeRole(memberId: string, newRole: 'admin' | 'member' | 'viewer') {
    setActionLoading(memberId)
    const result = await updateMemberRole(currentOrg.id, memberId, newRole)

    if (result.error) {
      toast.error(result.error)
      setActionLoading(null)
    } else {
      toast.success('Role updated successfully')
      router.refresh()
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    
    setInviting(true)
    const result = await inviteTeamMember(currentOrg.id, inviteEmail, inviteRole)

    if (result.error) {
      toast.error(result.error)
      setInviting(false)
    } else {
      toast.success('Team member invited successfully')
      setInviteEmail('')
      setInviteRole('member')
      setShowInvite(false)
      router.refresh()
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'owner': return <Crown size={14} color="var(--stamp-teal)" />
      case 'admin': return <Shield size={14} color="var(--route-blue)" />
      case 'member': return <Users size={14} color="var(--ink-600)" />
      case 'viewer': return <Eye size={14} color="var(--ink-500)" />
      default: return null
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'owner': return 'var(--stamp-teal)'
      case 'admin': return 'var(--route-blue)'
      case 'member': return 'var(--ink-600)'
      case 'viewer': return 'var(--ink-500)'
      default: return 'var(--ink-500)'
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 700, 
          color: 'var(--ink-900)',
          fontFamily: 'Fraunces, Georgia, serif',
          marginBottom: '8px'
        }}>
          Organization Settings
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--ink-600)' }}>
          Manage your organization, team members, and settings
        </p>
      </div>

      {/* Organization Details Card */}
      <div className="glass" style={{ 
        padding: '32px', 
        borderRadius: '12px', 
        marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent), #264182)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Building2 size={28} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              {!editing ? (
                <>
                  <h2 style={{ 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    color: 'var(--ink-900)',
                    marginBottom: '8px',
                    fontFamily: 'Fraunces, Georgia, serif'
                  }}>
                    {orgDetails?.name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      background: `${getRoleBadgeColor(currentOrg.role)}15`,
                      border: `1px solid ${getRoleBadgeColor(currentOrg.role)}30`
                    }}>
                      {getRoleIcon(currentOrg.role)}
                      <span style={{ 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: getRoleBadgeColor(currentOrg.role),
                        textTransform: 'capitalize'
                      }}>
                        {currentOrg.role}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--ink-600)' }}>
                      <Users size={14} />
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '2px solid var(--border)',
                      background: 'var(--bg-base)',
                      color: 'var(--ink-900)',
                      fontSize: '16px',
                      fontWeight: 600,
                      width: '300px'
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="btn-primary"
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setOrgName(orgDetails?.name || '')
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '2px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--ink-700)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
          {!editing && isOwner && (
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '2px solid var(--border)',
                background: 'transparent',
                color: 'var(--ink-700)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              <Edit2 size={16} />
              Edit Name
            </button>
          )}
        </div>

        {/* Organization Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          padding: '20px',
          background: 'var(--paper-200)',
          borderRadius: '8px',
          border: '1px solid var(--border-light)'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Plan
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink-900)', textTransform: 'capitalize' }}>
              {orgDetails?.plan || 'Free'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--stamp-teal)', textTransform: 'capitalize' }}>
              {orgDetails?.billing_status || 'Active'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Created
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink-900)' }}>
              {orgDetails?.created_at ? new Date(orgDetails.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="glass" style={{ 
        padding: '32px', 
        borderRadius: '12px', 
        marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              color: 'var(--ink-900)',
              marginBottom: '4px',
              fontFamily: 'Fraunces, Georgia, serif'
            }}>
              Team Members
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--ink-600)' }}>
              Manage who has access to this organization
            </p>
          </div>
          {canManageMembers && (
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} />
              Invite Member
            </button>
          )}
        </div>

        {/* Invite Form */}
        {showInvite && (
          <form onSubmit={handleInvite} style={{
            padding: '20px',
            background: 'var(--paper-200)',
            borderRadius: '8px',
            border: '1px solid var(--border-light)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-900)', display: 'block', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '2px solid var(--border)',
                    background: 'var(--bg-base)',
                    color: 'var(--ink-900)',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-900)', display: 'block', marginBottom: '6px' }}>
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '2px solid var(--border)',
                    background: 'var(--bg-base)',
                    color: 'var(--ink-900)',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="btn-primary"
                style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {inviting ? <Loader2 size={16} className="spin" /> : null}
                {inviting ? 'Inviting...' : 'Invite'}
              </button>
            </div>
          </form>
        )}

        {/* Members List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {members.map((member: any) => {
            const profile = member.profiles
            const isCurrentUser = member.user_id === userId
            const canEdit = canManageMembers && !isCurrentUser && member.role !== 'owner'
            const loading = actionLoading === member.user_id

            return (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: isCurrentUser ? 'var(--paper-200)' : 'transparent',
                  borderRadius: '8px',
                  border: `1px solid ${isCurrentUser ? 'var(--border)' : 'var(--border-light)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {/* Avatar */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${getRoleBadgeColor(member.role)}, ${getRoleBadgeColor(member.role)}80)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}>
                    {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || '?'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink-900)' }}>
                        {profile?.full_name || profile?.email || 'Unknown User'}
                      </span>
                      {isCurrentUser && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'var(--route-blue)15',
                          color: 'var(--route-blue)',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          You
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--ink-600)' }}>
                      {profile?.email}
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: `${getRoleBadgeColor(member.role)}15`,
                    border: `1px solid ${getRoleBadgeColor(member.role)}30`
                  }}>
                    {getRoleIcon(member.role)}
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 600,
                      color: getRoleBadgeColor(member.role),
                      textTransform: 'capitalize'
                    }}>
                      {member.role}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {canEdit && (
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    {member.role !== 'owner' && (
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.user_id, e.target.value as any)}
                        disabled={loading}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-base)',
                          color: 'var(--ink-900)',
                          fontSize: '13px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.5 : 1
                        }}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    <button
                      onClick={() => handleRemoveMember(member.user_id, profile?.full_name || profile?.email)}
                      disabled={loading}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--seal-red)15',
                        color: 'var(--seal-red)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: loading ? 0.5 : 1
                      }}
                    >
                      {loading ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="glass" style={{ 
          padding: '32px', 
          borderRadius: '12px',
          border: '2px solid var(--seal-red)30'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            color: 'var(--seal-red)',
            marginBottom: '8px',
            fontFamily: 'Fraunces, Georgia, serif'
          }}>
            Danger Zone
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--ink-600)', marginBottom: '20px' }}>
            Irreversible actions that permanently affect your organization
          </p>
          
          <div style={{
            padding: '16px',
            background: 'var(--seal-red)05',
            borderRadius: '8px',
            border: '1px solid var(--seal-red)20',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink-900)', marginBottom: '4px' }}>
                Delete Organization
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ink-600)' }}>
                Permanently delete this organization and all its data. This cannot be undone.
              </div>
            </div>
            <button
              onClick={handleDeleteOrg}
              disabled={allOrgs.length <= 1}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '2px solid var(--seal-red)',
                background: 'var(--seal-red)',
                color: 'white',
                cursor: allOrgs.length <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: allOrgs.length <= 1 ? 0.5 : 1
              }}
            >
              <Trash2 size={16} />
              Delete Organization
            </button>
          </div>
          {allOrgs.length <= 1 && (
            <p style={{ fontSize: '12px', color: 'var(--ink-600)', marginTop: '8px', fontStyle: 'italic' }}>
              Cannot delete your only organization. Create another organization first.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
