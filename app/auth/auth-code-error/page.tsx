'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, XCircle } from 'lucide-react'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')
  const description = searchParams?.get('description')

  // Map error codes to user-friendly messages
  const getErrorMessage = () => {
    switch (error) {
      case 'no_code':
        return {
          title: 'Missing Authentication Code',
          message: 'The authentication link is incomplete. Please request a new magic link or try signing in again.'
        }
      case 'exchange_failed':
        return {
          title: 'Authentication Failed',
          message: description || 'We couldn\'t verify your authentication code. The link may have expired or been used already.'
        }
      case 'no_user':
        return {
          title: 'User Not Found',
          message: 'We couldn\'t find your user account. Please try signing up or contact support if you believe this is an error.'
        }
      case 'unexpected':
        return {
          title: 'Something Went Wrong',
          message: description || 'An unexpected error occurred during authentication. Please try again.'
        }
      default:
        return {
          title: 'Authentication Error',
          message: description || 'Sorry, we couldn\'t verify your authentication. The link may have expired or been used already.'
        }
    }
  }

  const { title, message } = getErrorMessage()

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-base)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 24
    }}>
      <div className="glass" style={{ 
        maxWidth: 480, 
        width: '100%', 
        padding: 40,
        borderRadius: 12,
        textAlign: 'center'
      }}>
        {/* Error Icon */}
        <div className="monogram" style={{
          width: 64,
          height: 64,
          fontSize: 24,
          background: 'rgba(179,57,44,0.1)',
          color: 'var(--seal-red)',
          border: '2px solid var(--seal-red)',
          margin: '0 auto 24px',
          display: 'inline-flex'
        }}>
          <XCircle size={32} />
        </div>

        {/* Error Title */}
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          marginBottom: 12,
          fontFamily: 'Fraunces, Georgia, serif',
          color: 'var(--ink-900)'
        }}>
          {title}
        </h1>

        {/* Error Message */}
        <p style={{ 
          fontSize: 16, 
          color: 'var(--text-muted)', 
          marginBottom: 32,
          lineHeight: 1.6
        }}>
          {message}
        </p>

        {/* Error Details (if any) */}
        {error && (
          <div style={{
            background: 'var(--paper-200)',
            padding: 16,
            borderRadius: 8,
            marginBottom: 32,
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertCircle size={16} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Error Code
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/login" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Try Signing In Again
          </Link>
          
          <Link href="/signup" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            Create New Account
          </Link>
        </div>

        {/* Help Text */}
        <p style={{ 
          fontSize: 13, 
          color: 'var(--text-subtle)', 
          marginTop: 24 
        }}>
          Still having trouble? <Link href="mailto:support@zecompaign.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Contact Support</Link>
        </p>
      </div>
    </div>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--bg-base)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div className="pulse" style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}

