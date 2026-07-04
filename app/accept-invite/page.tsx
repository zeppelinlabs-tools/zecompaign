'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getInvitationByToken, acceptInvitation } from '@/lib/actions/organizations'
import { Mail, Building2, Shield, Check, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function loadInvitation() {
      if (!token) {
        setError('Invalid invitation link')
        setLoading(false)
        return
      }

      console.log('🔗 Invitation token from URL:', token?.substring(0, 16) + '...')

      // Check if user is logged in
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      console.log('👤 Current user:', currentUser ? currentUser.email : 'Not logged in')

      // Get invitation details
      const result = await getInvitationByToken(token)
      
      console.log('📧 Invitation lookup result:', result)
      
      if (result.error) {
        setError(result.error)
      } else {
        setInvitation(result.data)
      }
      
      setLoading(false)
    }

    loadInvitation()
  }, [token])

  async function handleAccept() {
    if (!token) return

    setAccepting(true)
    setError(null)

    const result = await acceptInvitation(token)

    if (result.error) {
      setError(result.error)
      setAccepting(false)
    } else {
      // Success - redirect to dashboard
      router.push('/dashboard')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--accent)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading invitation...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !invitation) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        padding: 20
      }}>
        <div className="glass" style={{
          maxWidth: 500,
          width: '100%',
          padding: 40,
          borderRadius: 12,
          textAlign: 'center'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
          }}>
            <AlertCircle size={32} color="var(--red)" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Invalid Invitation
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
            {error}
          </p>
          <Link href="/login" className="btn-primary" style={{ display: 'inline-block' }}>
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // User not logged in - redirect to signup
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        padding: 20
      }}>
        <div className="glass" style={{
          maxWidth: 500,
          width: '100%',
          padding: 40,
          borderRadius: 12
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, var(--accent), #264182)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <Mail size={32} color="white" />
            </div>
            <h1 style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 8,
              fontFamily: 'Fraunces'
            }}>
              You've Been Invited!
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              You've been invited to join <strong>{invitation?.organization?.name}</strong>
            </p>
          </div>

          {/* Invitation Details */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 20,
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Building2 size={18} color="var(--accent)" />
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Organization</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                  {invitation?.organization?.name}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={18} color="var(--stamp-teal)" />
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Role</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>
                  {invitation?.role}
                </p>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>
            Create an account to accept this invitation
          </p>

          <Link
            href={`/signup?token=${token}`}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
          >
            Create Account
          </Link>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href={`/login?token=${token}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Email mismatch warning
  const emailMismatch = user.email !== invitation?.email

  // User is logged in - show accept screen
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: 20
    }}>
      <div className="glass" style={{
        maxWidth: 500,
        width: '100%',
        padding: 40,
        borderRadius: 12
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), #264182)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
          }}>
            <Building2 size={32} color="white" />
          </div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: 8,
            fontFamily: 'Fraunces'
          }}>
            Join {invitation?.organization?.name}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Accept your invitation to join the team
          </p>
        </div>

        {/* Email Mismatch Warning */}
        {emailMismatch && (
          <div style={{
            padding: 12,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10
          }}>
            <AlertCircle size={18} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600, marginBottom: 4 }}>
                Email Mismatch
              </p>
              <p style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>
                This invitation was sent to <strong>{invitation?.email}</strong> but you're logged in as <strong>{user.email}</strong>. 
                Please log out and create an account with the invited email address.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: 12,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            marginBottom: 20,
            color: 'var(--red)',
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        {/* Invitation Details */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 20,
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Mail size={18} color="var(--text-muted)" />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Invited Email</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                {invitation?.email}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={18} color="var(--stamp-teal)" />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Your Role</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>
                {invitation?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {emailMismatch ? (
          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              href="/login"
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center', display: 'flex' }}
            >
              Log Out
            </Link>
            <Link
              href={`/signup?token=${token}`}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', display: 'flex' }}
            >
              Sign Up
            </Link>
          </div>
        ) : (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: 8 }}
          >
            {accepting ? (
              <>
                <Loader2 size={16} className="spin" />
                Accepting...
              </>
            ) : (
              <>
                <Check size={16} />
                Accept Invitation
              </>
            )}
          </button>
        )}

        <p style={{
          marginTop: 20,
          fontSize: 12,
          color: 'var(--text-muted)',
          textAlign: 'center',
          lineHeight: 1.5
        }}>
          By accepting, you'll join {invitation?.organization?.name} with {invitation?.role} access
        </p>
      </div>
    </div>
  )
}


export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--accent)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
