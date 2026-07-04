'use client';
import { useState, useRef } from 'react';
import { User, Mail, Building2, Shield, Calendar, Camera, Save, X, Crown, LogOut, Trash2, Upload, Loader2 } from 'lucide-react';
import { updateProfile, uploadAvatar } from '@/lib/actions/auth';
import { leaveOrganization, deleteOrganization } from '@/lib/actions/organizations';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface UserProfileProps {
  user: SupabaseUser;
  profile: any;
  currentOrg: any;
  allOrgs: any[];
}

export default function UserProfile({ user, profile, currentOrg, allOrgs }: UserProfileProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || '',
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    setUploading(true);
    
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const result = await uploadAvatar(formData);
      
      console.log('Upload result:', result);
      
      if (result.success) {
        toast.success('Avatar uploaded successfully!');
        // Force hard reload to clear all caches
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Upload exception:', error);
      toast.error('An error occurred while uploading');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(formData);
      
      if (result.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveOrg = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to leave "${orgName}"? You will lose access to all its data.`)) {
      return;
    }

    setActionLoading(orgId);
    const result = await leaveOrganization(orgId);
    
    if (result.error) {
      toast.error(result.error);
      setActionLoading(null);
    } else {
      toast.success(`Left ${orgName} successfully`);
      // Clear localStorage and reload
      localStorage.removeItem('selectedOrgId');
      window.location.href = '/dashboard';
    }
  };

  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to delete "${orgName}"? This action cannot be undone and will delete all data.`)) {
      return;
    }

    setActionLoading(orgId);
    const result = await deleteOrganization(orgId);
    
    if (result.error) {
      toast.error(result.error);
      setActionLoading(null);
    } else {
      toast.success(`Deleted ${orgName} successfully`);
      // Reload to show remaining organizations
      window.location.href = '/dashboard';
    }
  };

  const handleSwitchOrg = (orgId: string) => {
    if (orgId === currentOrg?.id) return;
    
    // Store selected org in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedOrgId', orgId);
      
      // Set cookie with proper encoding
      const cookieValue = `selectedOrgId=${encodeURIComponent(orgId)}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = cookieValue;
      
      // Force hard reload to bypass cache
      window.location.replace('/dashboard');
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (name[0] || '?').toUpperCase();
  };

  // Format date consistently for SSR (avoids hydration mismatch)
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  };

  const initials = getInitials(formData.full_name || user.email || 'User');
  const joinedDate = formatDate(user.created_at);
  const lastSignIn = user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never';

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Manage your personal information and account settings
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Left Column: Avatar & Basic Info */}
        <div className="glass" style={{ padding: 24, height: 'fit-content' }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ 
              position: 'relative', 
              display: 'inline-block',
              marginBottom: 16
            }}>
              {formData.avatar_url ? (
                <img 
                  src={formData.avatar_url} 
                  alt={formData.full_name}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid var(--border)'
                  }}
                />
              ) : (
                <div style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  fontWeight: 700,
                  color: 'white',
                  border: '4px solid var(--border)',
                  fontFamily: 'Fraunces'
                }}>
                  {initials}
                </div>
              )}
              
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: uploading ? 'var(--ink-600)' : 'var(--accent)',
                  border: '3px solid white',
                  color: 'white',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                title="Upload avatar"
              >
                {uploading ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
              </button>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            <h2 style={{ 
              fontSize: 20, 
              fontWeight: 700, 
              color: 'var(--text)', 
              marginBottom: 4,
              fontFamily: 'Fraunces'
            }}>
              {formData.full_name || 'User'}
            </h2>
            <p style={{ 
              fontSize: 13, 
              color: 'var(--text-muted)',
              marginBottom: 8
            }}>
              {user.email}
            </p>
            
            {/* Role Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--accent)',
              textTransform: 'capitalize'
            }}>
              <Shield size={12} />
              {currentOrg?.role || 'member'}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ 
            borderTop: '1px solid var(--border)', 
            paddingTop: 20,
            marginTop: 20 
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                marginBottom: 4
              }}>
                <Building2 size={14} color="var(--text-muted)" />
                <span style={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Organization
                </span>
              </div>
              <p style={{ 
                fontSize: 14, 
                color: 'var(--text)', 
                fontWeight: 600,
                paddingLeft: 22
              }}>
                {currentOrg?.name || 'No organization'}
              </p>
            </div>

            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                marginBottom: 4
              }}>
                <Calendar size={14} color="var(--text-muted)" />
                <span style={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Member Since
                </span>
              </div>
              <p style={{ 
                fontSize: 14, 
                color: 'var(--text)', 
                fontWeight: 600,
                paddingLeft: 22
              }}>
                {joinedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Info */}
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: '1px solid var(--border)'
          }}>
            <h3 style={{ 
              fontSize: 16, 
              fontWeight: 700, 
              color: 'var(--text)',
              fontFamily: 'Fraunces'
            }}>
              Personal Information
            </h3>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      full_name: profile?.full_name || '',
                      avatar_url: profile?.avatar_url || '',
                    });
                  }}
                  className="btn-secondary"
                  style={{ padding: '8px 16px' }}
                  disabled={loading}
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-primary"
                  style={{ padding: '8px 16px' }}
                  disabled={loading}
                >
                  <Save size={14} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Full Name */}
              <div>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: 'var(--text)',
                  marginBottom: 8
                }}>
                  <User size={14} color="var(--text-muted)" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    fontSize: 14,
                    color: 'var(--text)',
                    background: isEditing ? 'white' : 'var(--bg-surface)',
                    cursor: isEditing ? 'text' : 'not-allowed'
                  }}
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: 'var(--text)',
                  marginBottom: 8
                }}>
                  <Mail size={14} color="var(--text-muted)" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    fontSize: 14,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-surface)',
                    cursor: 'not-allowed'
                  }}
                />
                <p style={{ 
                  fontSize: 12, 
                  color: 'var(--text-muted)', 
                  marginTop: 6,
                  fontStyle: 'italic'
                }}>
                  Email address cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Account Info (Read-only) */}
              <div style={{ 
                marginTop: 20,
                padding: 16,
                background: 'var(--bg-surface)',
                borderRadius: 6,
                border: '1px solid var(--border)'
              }}>
                <h4 style={{ 
                  fontSize: 13, 
                  fontWeight: 700, 
                  color: 'var(--text)',
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Account Information
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>User ID</span>
                    <span style={{ 
                      fontSize: 11, 
                      color: 'var(--text)', 
                      fontFamily: 'monospace'
                    }}>
                      {user.id.slice(0, 8)}...
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Email Verified</span>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                      {user.email_confirmed_at ? (
                        <span style={{ color: 'var(--green)' }}>✓ Verified</span>
                      ) : (
                        <span style={{ color: 'var(--red)' }}>✗ Not Verified</span>
                      )}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Last Sign In</span>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>
                      {lastSignIn}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Organizations Section */}
      {allOrgs && allOrgs.length > 0 && (
        <div className="glass" style={{ padding: 24, marginTop: 24 }}>
          <div style={{ 
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: '1px solid var(--border)'
          }}>
            <h3 style={{ 
              fontSize: 16, 
              fontWeight: 700, 
              color: 'var(--text)',
              fontFamily: 'Fraunces',
              marginBottom: 4
            }}>
              Your Organizations
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Manage your organization memberships
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {allOrgs.map((org) => {
              const isCurrentOrg = org.id === currentOrg?.id;
              const isOwner = org.role === 'owner';
              const canLeave = !isOwner && allOrgs.length > 1;
              const canDelete = isOwner && allOrgs.length > 1;
              const isActionLoading = actionLoading === org.id;

              return (
                <div
                  key={org.id}
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    border: `2px solid ${isCurrentOrg ? 'var(--accent)' : 'var(--border)'}`,
                    background: isCurrentOrg ? 'var(--accent-glow)' : 'white',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                    {/* Org Icon */}
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Building2 size={24} color="white" />
                    </div>

                    {/* Org Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h4 style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--text)',
                          fontFamily: 'Fraunces'
                        }}>
                          {org.name}
                        </h4>
                        {isOwner && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'white',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            <Crown size={10} />
                            Owner
                          </div>
                        )}
                        {isCurrentOrg && (
                          <div style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: 'var(--accent)',
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'white',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Current
                          </div>
                        )}
                      </div>

                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        marginBottom: 8
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 4 
                        }}>
                          <Shield size={12} />
                          <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                            {org.role}
                          </span>
                        </div>
                        <div style={{ 
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: 'var(--bg-surface)',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {org.plan}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        {!isCurrentOrg && (
                          <button
                            onClick={() => handleSwitchOrg(org.id)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: 12 }}
                          >
                            Switch to this org
                          </button>
                        )}

                        {canLeave && (
                          <button
                            onClick={() => handleLeaveOrg(org.id, org.name)}
                            disabled={isActionLoading}
                            style={{
                              padding: '6px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 6,
                              border: '1px solid #FFA500',
                              background: 'transparent',
                              color: '#FFA500',
                              cursor: isActionLoading ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              opacity: isActionLoading ? 0.5 : 1,
                              transition: 'all 0.15s ease'
                            }}
                            onMouseOver={(e) => {
                              if (!isActionLoading) {
                                e.currentTarget.style.background = 'rgba(255,165,0,0.1)';
                              }
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <LogOut size={12} />
                            {isActionLoading ? 'Leaving...' : 'Leave'}
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteOrg(org.id, org.name)}
                            disabled={isActionLoading}
                            style={{
                              padding: '6px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 6,
                              border: '1px solid var(--red)',
                              background: 'transparent',
                              color: 'var(--red)',
                              cursor: isActionLoading ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              opacity: isActionLoading ? 0.5 : 1,
                              transition: 'all 0.15s ease'
                            }}
                            onMouseOver={(e) => {
                              if (!isActionLoading) {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                              }
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <Trash2 size={12} />
                            {isActionLoading ? 'Deleting...' : 'Delete'}
                          </button>
                        )}

                        {!canLeave && !canDelete && isCurrentOrg && (
                          <p style={{ 
                            fontSize: 11, 
                            color: 'var(--text-muted)',
                            fontStyle: 'italic',
                            marginTop: 4
                          }}>
                            {isOwner 
                              ? 'Cannot delete your only organization'
                              : 'Cannot leave your only organization'
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
