'use client'

import { useState } from 'react'
import { signIn, signInWithGoogle, signInWithGithub, sendMagicLink } from '@/lib/actions/auth'
import Link from 'next/link'
import { Mail, GitBranch as Github, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mode, setMode] = useState<'password' | 'magic'>('password')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)

    try {
      if (mode === 'password') {
        const result = await signIn(formData)
        if (result?.error) {
          setError(result.error)
        }
      } else {
        const result = await sendMagicLink(formData)
        if (result?.error) {
          setError(result.error)
        } else if (result?.success) {
          setSuccess(result.message)
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuthSignIn(provider: 'google' | 'github') {
    setLoading(true)
    setError(null)

    try {
      if (provider === 'google') {
        await signInWithGoogle()
      } else {
        await signInWithGithub()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
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
        maxWidth: '400px', 
        width: '100%', 
        padding: '32px',
        borderRadius: '12px'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Mail size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
            Welcome to zecompaign
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Sign in to your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            padding: '12px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            marginBottom: '16px',
            color: 'var(--red)',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{ 
            padding: '12px', 
            background: 'rgba(34, 197, 94, 0.1)', 
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            marginBottom: '16px',
            color: 'var(--green)',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading}
            className="btn-secondary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.167.282-1.707V4.96H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.04l3.007-2.333z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.959L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            onClick={() => handleOAuthSignIn('github')}
            disabled={loading}
            className="btn-secondary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Github size={18} />
            GitHub
          </button>
        </div>

        {/* Divider */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          margin: '20px 0',
          color: 'var(--text-muted)',
          fontSize: '14px'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          OR
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Mode Toggle */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '16px',
          padding: '4px',
          background: 'var(--bg-surface)',
          borderRadius: '8px'
        }}>
          <button
            onClick={() => setMode('password')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'password' ? 'var(--accent-glow)' : 'transparent',
              color: mode === 'password' ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: mode === 'password' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Password
          </button>
          <button
            onClick={() => setMode('magic')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'magic' ? 'var(--accent-glow)' : 'transparent',
              color: mode === 'magic' ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: mode === 'magic' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Magic Link
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 500, 
              color: 'var(--text)',
              marginBottom: '6px'
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-base)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>

          {mode === 'password' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-base)',
                  color: 'var(--text)',
                  fontSize: '14px'
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'password' ? 'Sign In' : 'Send Magic Link'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div style={{ 
          marginTop: '20px', 
          textAlign: 'center', 
          fontSize: '14px', 
          color: 'var(--text-muted)' 
        }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
