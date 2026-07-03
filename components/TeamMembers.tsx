'use client'

import { useState } from 'react'
import { inviteTeamMember, removeTeamMember, updateMemberRole } from '@/lib/actions/organizations'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  profiles: Profile
}

interface Organization {
  id: string
  name: string
  plan: string
}

interface TeamMembersProps {
  organization: Organization | null
  members: Member[]
  currentUserId: string
  userRole: string
}

export default function TeamMembers({ organization, members, currentUserId, userRole }: TeamMembersProps) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [loading, setLoading] = useState(false)

  const canManageTeam = userRole === 'owner' || userRole === 'admin'

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!organization) return

    setLoading(true)
    const result = await inviteTeamMember(organization.id, inviteEmail, inviteRole)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Team member invited successfully!')
      setInviteEmail('')
      window.location.reload()
    }
    setLoading(false)
  }

  async function handleRemove(userId: string) {
    if (!organization) return
    if (!confirm('Are you sure you want to remove this team member?')) return

    const result = await removeTeamMember(organization.id, userId)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Team member removed')
      window.location.reload()
    }
  }

  async function handleRoleChange(userId: string, newRole: 'admin' | 'member') {
    if (!organization) return

    const result = await updateMemberRole(organization.id, userId, newRole)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Role updated')
      window.location.reload()
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Members</h1>
        <p className="text-gray-600">Manage your team and their permissions</p>
      </div>

      {canManageTeam && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Invite Team Member</h2>
          <form onSubmit={handleInvite} className="flex gap-4">
            <input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Inviting...' : 'Invite'}
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-2">
            Note: The user must sign up first before they can be invited.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Team Members ({members.length})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {members.map((member) => (
            <div key={member.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {member.profiles.full_name?.[0]?.toUpperCase() || member.profiles.email[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {member.profiles.full_name || 'No name'}
                  </p>
                  <p className="text-sm text-gray-600">{member.profiles.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {canManageTeam && member.role !== 'owner' ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user_id, e.target.value as 'admin' | 'member')}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium capitalize">
                    {member.role}
                  </span>
                )}
                
                {canManageTeam && member.role !== 'owner' && member.user_id !== currentUserId && (
                  <button
                    onClick={() => handleRemove(member.user_id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
