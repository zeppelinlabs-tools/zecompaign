'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Briefcase, Loader2, Building2, Mail, ArrowRight } from 'lucide-react'
import { createOrganization } from '@/lib/actions/organizations'
import { acceptInvitation } from '@/lib/actions/organizations'

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgName, setOrgName] = useState('')
  const [pendingInvite, setPendingInvite] = useState<any>(null)
  const [showChoice, setShowChoice] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkOnboardingStatus() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Check if user already has an organization
      const { data: orgs } = await supabase.rpc('get_user_organizations', {
        user_uuid: user.id
      })

      if (orgs && orgs.length > 0) {
        // User already has organization, skip onboarding
        router.push('/dashboard')
        return
      }

      // Check for pending invitations
      const { data: invites } = await supabase
        .from('organization_invitations')
        .select('*, organization:organization_id(id, name)')
        .eq('email', user.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

      if (invites && invites.length > 0) {
        console.log('Found pending invitation:', invites[0])
        setPendingInvite(invites[0])
        setShowChoice(true)
      }

      // Get user's profile to pre-fill organization name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      if (profile) {
        // Pre-fill with user's name or email prefix
        const suggestedName = profile.full_name 
          ? `${profile.full_name}'s Organization` 
          : `${profile.email.split('@')[0]}'s Organization`
        setOrgName(suggestedName)
      }

      setLoading(false)
    }

    checkOnboardingStatus()
  }, [router])

  async function handleAcceptInvite() {
    if (!pendingInvite?.token) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await acceptInvitation(pendingInvite.token)

      if (result.error) {
        setError(result.error)
        setSubmitting(false)
        return
      }

      // Success! Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Accept invitation error:', err)
      setError(err.message || 'Failed to accept invitation')
      setSubmitting(false)
    }
  }

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Use server action which uses service role to bypass RLS
      const result = await createOrganization(orgName.trim())

      if (result.error) {
        setError(result.error)
        setSubmitting(false)
        return
      }

      // Success! Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Onboarding error:', err)
      setError(err.message || 'Failed to create organization')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-base)'
      }}>
        <div className="pulse" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Loading...
        </div>
      </div>
    )
  }

  // Show invitation choice if user has pending invite
  if (showChoice && pendingInvite) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-base)',
        padding: '20px'
      }}>
        <div className="glass" style={{ 
          maxWidth: '600px', 
          width: '100%', 
          padding: '40px',
          borderRadius: '12px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '16px', 
              background: 'linear-gradient(135deg, var(--accent), #264182)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Mail size={32} color="white" />
            </div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 700, 
              color: 'var(--ink-900)', 
              marginBottom: '8px',
              fontFamily: 'Fraunces, Georgia, serif'
            }}>
              You've Been Invited!
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--ink-600)', lineHeight: 1.6 }}>
              Choose how you want to get started with zecompaign
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ 
              padding: '12px 16px', 
              background: 'rgba(179, 57, 44, 0.1)', 
              border: '1px solid rgba(179, 57, 44, 0.3)',
              borderRadius: '8px',
              marginBottom: '20px',
              color: 'var(--red)',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Options */}
          <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
            {/* Option 1: Accept Invitation */}
            <button
              onClick={handleAcceptInvite}
              disabled={submitting}
              className="glass"
              style={{
                padding: '24px',
                borderRadius: '12px',
                border: '2px solid var(--accent)',
                background: 'rgba(52, 87, 166, 0.05)',
                cursor: submitting ? 'wait' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Building2 size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink-900)', marginBottom: '4px' }}>
                    Join {pendingInvite.organization?.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--ink-600)', marginBottom: '6px' }}>
                    Accept invitation as <strong style={{ textTransform: 'capitalize' }}>{pendingInvite.role}</strong>
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>
                    Recommended →
                  </p>
                </div>
                {submitting && (
                  <Loader2 size={24} className="spin" style={{ color: 'var(--accent)' }} />
                )}
              </div>
            </button>

            {/* Option 2: Create Own Organization */}
            <button
              onClick={() => setShowChoice(false)}
              disabled={submitting}
              className="glass"
              style={{
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'white',
                cursor: submitting ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                opacity: submitting ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--paper-200)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Briefcase size={24} color="var(--ink-600)" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink-900)', marginBottom: '4px' }}>
                    Create My Own Organization
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--ink-600)' }}>
                    Start fresh with your own workspace
                  </p>
                </div>
                <ArrowRight size={20} color="var(--ink-400)" />
              </div>
            </button>
          </div>

          <p style={{ 
            fontSize: '13px', 
            color: 'var(--text-subtle)',
            textAlign: 'center',
            lineHeight: 1.5
          }}>
            You can join multiple organizations later from your profile
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '20px'
    }}>
      <div className="glass" style={{ 
        maxWidth: '500px', 
        width: '100%', 
        padding: '40px',
        borderRadius: '12px'
      }}>
        {/* Logo/Icon */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, var(--accent), #264182)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Building2 size={32} color="white" />
          </div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: 'var(--ink-900)', 
            marginBottom: '8px',
            fontFamily: 'Fraunces, Georgia, serif'
          }}>
            Create Your Organization
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--ink-600)', lineHeight: 1.6 }}>
            Set up your workspace to start collaborating with your team on email campaigns.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            padding: '12px 16px', 
            background: 'rgba(179, 57, 44, 0.1)', 
            border: '1px solid rgba(179, 57, 44, 0.3)',
            borderRadius: '8px',
            marginBottom: '20px',
            color: 'var(--red)',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Onboarding Form */}
        <form onSubmit={handleCreateOrg}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 600, 
              color: 'var(--ink-900)',
              marginBottom: '8px'
            }}>
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              placeholder="My Company"
              maxLength={100}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-base)',
                color: 'var(--ink-900)',
                fontSize: '15px',
                fontWeight: 500
              }}
            />
            <p style={{ 
              fontSize: '13px', 
              color: 'var(--text-subtle)', 
              marginTop: '6px' 
            }}>
              You can change this later in settings
            </p>
          </div>

          {/* Info Cards */}
          <div style={{ 
            display: 'grid', 
            gap: '12px', 
            marginBottom: '28px' 
          }}>
            <InfoCard 
              icon={<Briefcase size={18} />}
              title="You'll be the owner"
              description="Full control over team, billing, and settings"
            />
            <InfoCard 
              icon={<Building2 size={18} />}
              title="Free plan included"
              description="3 SMTP accounts, 10 templates, 15 AI generations/month"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !orgName.trim()}
            className="btn-primary"
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 600
            }}
          >
            {submitting && <Loader2 size={18} className="spin" />}
            {submitting ? 'Creating...' : 'Create Organization'}
          </button>
        </form>

        {/* Footer Note */}
        <p style={{ 
          marginTop: '20px', 
          fontSize: '13px', 
          color: 'var(--text-subtle)',
          textAlign: 'center',
          lineHeight: 1.5
        }}>
          By creating an organization, you agree to manage it according to our{' '}
          <a href="/terms" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  )
}

function InfoCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '12px', 
      padding: '12px',
      background: 'var(--paper-200)',
      borderRadius: '8px',
      border: '1px solid var(--border-light)'
    }}>
      <div style={{ 
        flexShrink: 0,
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        background: 'rgba(52, 87, 166, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent)'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: 'var(--ink-900)',
          marginBottom: '2px'
        }}>
          {title}
        </p>
        <p style={{ 
          fontSize: '13px', 
          color: 'var(--ink-600)',
          lineHeight: 1.4
        }}>
          {description}
        </p>
      </div>
    </div>
  )
}
