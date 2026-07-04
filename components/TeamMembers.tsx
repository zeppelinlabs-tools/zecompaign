'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { inviteTeamMember, removeTeamMember, updateMemberRole, cancelInvitation, resendInvitation } from '@/lib/actions/organizations'
import toast from 'react-hot-toast'
import { UserPlus, Shield, Mail, Calendar, Crown, Trash2, ChevronDown, Send } from 'lucide-react'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joined_at: string
  profiles: Profile
}

interface PendingInvite {
  id: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  created_at: string
  expires_at: string
  invited_by_profile: {
    full_name: string | null
    email: string
  }
}

interface Organization {
  id: string
  name: string
  plan: string
}

interface TeamMembersProps {
  organization: Organization | null
  members: Member[]
  pendingInvites: PendingInvite[]
  currentUserId: string
  userRole: string
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  return email[0].toUpperCase();
}

function getRoleColor(role: string) {
  switch (role) {
    case 'owner': return { bg: 'var(--seal-red)', text: 'white', border: 'var(--seal-red)' };
    case 'admin': return { bg: 'var(--route-blue)', text: 'white', border: 'var(--route-blue)' };
    case 'member': return { bg: 'var(--stamp-teal)', text: 'white', border: 'var(--stamp-teal)' };
    case 'viewer': return { bg: 'var(--ink-600)', text: 'white', border: 'var(--ink-600)' };
    default: return { bg: 'var(--ink-200)', text: 'var(--text)', border: 'var(--border)' };
  }
}

export default function TeamMembers({ organization, members, pendingInvites = [], currentUserId, userRole }: TeamMembersProps) {
  const router = useRouter()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [loading, setLoading] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)

  const canManageTeam = userRole === 'owner' || userRole === 'admin'

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!organization) return

    setLoading(true)
    const result = await inviteTeamMember(organization.id, inviteEmail, inviteRole)
    
    console.log('Invite result:', result)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      // Show the specific message from the server
      const message = result.message || 'Team member invited successfully!'
      console.log('Showing success toast:', message)
      toast.success(message, { duration: 5000 })
      setInviteEmail('')
      setShowInviteForm(false)
      
      // Only reload if user was added immediately (not pending)
      if (!result.isPending) {
        window.location.reload()
      } else {
        // For pending invitations, just refresh the page data
        router.refresh()
      }
      setLoading(false)
    }
  }

  async function handleCancelInvite(inviteId: string, email: string) {
    if (!confirm(`Cancel invitation for ${email}?`)) return

    const result = await cancelInvitation(inviteId)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Invitation cancelled')
      router.refresh()
    }
  }

  async function handleResendInvite(inviteId: string, email: string) {
    const toastId = toast.loading(`Resending invitation to ${email}...`)
    
    const result = await resendInvitation(inviteId)
    
    if (result.error) {
      toast.error(result.error, { id: toastId })
    } else {
      toast.success(result.message || 'Invitation resent successfully!', { id: toastId, duration: 4000 })
      router.refresh()
    }
  }

  async function handleRemove(userId: string, memberName: string) {
    if (!organization) return
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return

    const result = await removeTeamMember(organization.id, userId)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Team member removed')
      window.location.reload()
    }
  }

  async function handleRoleChange(userId: string, newRole: 'admin' | 'member' | 'viewer') {
    if (!organization) return

    const result = await updateMemberRole(organization.id, userId, newRole)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Role updated successfully')
      window.location.reload()
    }
  }

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
          Team Members
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Manage your team and their permissions
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showInviteForm ? '1fr 400px' : '1fr', gap: 24 }}>
        {/* Main Team List */}
        <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header with Count and Invite Button */}
          <div style={{ 
            padding: '20px 24px', 
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={18} color="var(--accent)" />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'Fraunces' }}>
                Team Members
              </h2>
              <span style={{
                padding: '4px 10px',
                borderRadius: 12,
                background: 'var(--accent-glow)',
                border: '1px solid var(--accent)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--accent)'
              }}>
                {members.length}
              </span>
            </div>

            {canManageTeam && (
              <button 
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="btn-primary"
                style={{ padding: '8px 16px' }}
              >
                <UserPlus size={14} />
                {showInviteForm ? 'Cancel' : 'Invite Member'}
              </button>
            )}
          </div>

          {/* Members List */}
          <div>
            {members.map((member, index) => {
              // Skip members with deleted profiles
              if (!member.profiles) {
                console.warn('Skipping member with missing profile:', member.user_id)
                return null
              }
              
              const roleColors = getRoleColor(member.role);
              const initials = getInitials(member.profiles.full_name, member.profiles.email);
              const isCurrentUser = member.user_id === currentUserId;
              const isOwner = member.role === 'owner';

              return (
                <div 
                  key={member.id} 
                  style={{ 
                    padding: '20px 24px',
                    borderBottom: index < members.length - 1 ? '1px solid var(--border)' : 'none',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#FFFFFF'}
                >
                  {/* Left: Avatar + Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                    {/* Avatar */}
                    {member.profiles.avatar_url ? (
                      <img 
                        src={member.profiles.avatar_url} 
                        alt={member.profiles.full_name || 'User'}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--border)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: isOwner ? 'linear-gradient(135deg, var(--seal-red), var(--purple))' : 
                                    'linear-gradient(135deg, var(--accent), var(--stamp-teal))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'white',
                        border: '2px solid var(--border)',
                        fontFamily: 'Fraunces'
                      }}>
                        {initials}
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <p style={{ 
                          fontSize: 15, 
                          fontWeight: 600, 
                          color: 'var(--text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {member.profiles.full_name || 'No name'}
                        </p>
                        {isCurrentUser && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--accent)',
                            background: 'var(--accent-glow)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            You
                          </span>
                        )}
                        {isOwner && (
                          <Crown size={14} color="var(--seal-red)" />
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={11} color="var(--text-muted)" />
                        <p style={{ 
                          fontSize: 13, 
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {member.profiles.email}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Calendar size={11} color="var(--text-muted)" />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Joined {new Date(member.joined_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Role + Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Role Selector/Badge */}
                    {canManageTeam && !isOwner && !isCurrentUser ? (
                      <div style={{ position: 'relative' }}>
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.user_id, e.target.value as 'admin' | 'member' | 'viewer')}
                          style={{
                            appearance: 'none',
                            padding: '8px 32px 8px 12px',
                            borderRadius: 6,
                            border: `1.5px solid ${roleColors.border}`,
                            background: `${roleColors.bg}15`,
                            color: roleColors.bg,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            minWidth: 110
                          }}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <ChevronDown 
                          size={14} 
                          color={roleColors.bg}
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{
                        padding: '8px 14px',
                        borderRadius: 6,
                        background: roleColors.bg,
                        color: roleColors.text,
                        fontSize: 13,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        minWidth: 110,
                        justifyContent: 'center'
                      }}>
                        <Shield size={12} />
                        {member.role}
                      </div>
                    )}

                    {/* Remove Button */}
                    {canManageTeam && !isOwner && !isCurrentUser && (
                      <button
                        onClick={() => handleRemove(member.user_id, member.profiles.full_name || member.profiles.email)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1.5px solid var(--red)',
                          background: 'transparent',
                          color: 'var(--red)',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'var(--red)';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--red)';
                        }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending Invitations */}
          {pendingInvites.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ 
                fontSize: 16, 
                fontWeight: 700, 
                color: 'var(--ink-700)', 
                marginBottom: 12,
                fontFamily: 'Fraunces',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <Mail size={16} color="var(--stamp-teal)" />
                Pending Invitations ({pendingInvites.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingInvites.map((invite) => {
                  const roleColors = getRoleColor(invite.role);
                  const expiresDate = new Date(invite.expires_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <div
                      key={invite.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 8,
                        border: '1.5px dashed var(--stamp-teal)',
                        background: 'rgba(76, 175, 162, 0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        {/* Pending Icon */}
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: 'var(--stamp-teal)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 13,
                          fontWeight: 700
                        }}>
                          <Mail size={18} />
                        </div>

                        {/* Email & Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: 14, 
                            fontWeight: 600, 
                            color: 'var(--text)',
                            marginBottom: 3
                          }}>
                            {invite.email}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Invited by {invite.invited_by_profile.full_name || invite.invited_by_profile.email} • Expires {expiresDate}
                          </div>
                        </div>

                        {/* Role Badge */}
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          background: roleColors.bg,
                          color: roleColors.text,
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <Shield size={11} />
                          {invite.role}
                        </div>

                        {/* Action Buttons */}
                        {canManageTeam && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            {/* Resend Button */}
                            <button
                              onClick={() => handleResendInvite(invite.id, invite.email)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 6,
                                border: '1.5px solid var(--stamp-teal)',
                                background: 'transparent',
                                color: 'var(--stamp-teal)',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = 'var(--stamp-teal)';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--stamp-teal)';
                              }}
                              title="Resend invitation email"
                            >
                              <Send size={13} />
                              Resend
                            </button>

                            {/* Cancel Button */}
                            <button
                              onClick={() => handleCancelInvite(invite.id, invite.email)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 6,
                                border: '1.5px solid var(--red)',
                                background: 'transparent',
                                color: 'var(--red)',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = 'var(--red)';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--red)';
                              }}
                              title="Cancel invitation"
                            >
                              <Trash2 size={13} />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Invite Form Sidebar */}
        {showInviteForm && canManageTeam && (
          <div className="glass" style={{ padding: 24, height: 'fit-content', position: 'sticky', top: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ 
                fontSize: 18, 
                fontWeight: 700, 
                color: 'var(--text)', 
                marginBottom: 6,
                fontFamily: 'Fraunces'
              }}>
                Invite Team Member
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Send an invitation to join your organization
              </p>
            </div>

            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Email Input */}
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: 'var(--text)',
                  marginBottom: 8
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    fontSize: 14,
                    color: 'var(--text)',
                    background: 'white'
                  }}
                />
              </div>

              {/* Role Selector */}
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: 'var(--text)',
                  marginBottom: 8
                }}>
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    fontSize: 14,
                    color: 'var(--text)',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="viewer">Viewer - Read-only access</option>
                  <option value="member">Member - Can compose & send</option>
                  <option value="admin">Admin - Full management</option>
                </select>
              </div>

              {/* Info Box */}
              <div style={{
                padding: 12,
                borderRadius: 6,
                background: 'var(--accent-glow)',
                border: '1px solid var(--accent)',
                fontSize: 12,
                color: 'var(--text-muted)',
                lineHeight: 1.5
              }}>
                <strong style={{ color: 'var(--text)' }}>Note:</strong> If the user exists, they'll be added immediately. Otherwise, they'll receive an invitation email to sign up and join your organization.
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <UserPlus size={14} />
                {loading ? 'Sending Invite...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
