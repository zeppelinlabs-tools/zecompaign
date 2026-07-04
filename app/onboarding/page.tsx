'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Briefcase, Loader2, Building2 } from 'lucide-react'
import { createOrganization } from '@/lib/actions/organizations'

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgName, setOrgName] = useState('')
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

  async function handleSubmit(e: React.FormEvent) {
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
        <form onSubmit={handleSubmit}>
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
