'use client'

import { useState } from 'react'
import { Building2, X, Loader2 } from 'lucide-react'
import { createOrganization } from '@/lib/actions/organizations'
import toast from 'react-hot-toast'

interface CreateOrgModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateOrgModal({ onClose, onSuccess }: CreateOrgModalProps) {
  const [orgName, setOrgName] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim()) return

    setCreating(true)
    const result = await createOrganization(orgName.trim())

    if (result.error) {
      toast.error(result.error)
      setCreating(false)
    } else {
      toast.success('Organization created successfully!')
      onSuccess()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          animation: 'slideUp 0.3s ease'
        }}
      >
        <div className="glass" style={{
          width: '500px',
          maxWidth: '90vw',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent), #264182)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={24} color="white" />
              </div>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--ink-900)',
                  marginBottom: '4px',
                  fontFamily: 'Fraunces, Georgia, serif'
                }}>
                  Create Organization
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--ink-600)' }}>
                  Set up a new workspace for your team
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--ink-500)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--paper-200)'
                e.currentTarget.style.color = 'var(--ink-900)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--ink-500)'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
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
                placeholder="e.g., Acme Inc, Marketing Team, Product Division"
                autoFocus
                maxLength={100}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '2px solid var(--border)',
                  background: 'var(--bg-base)',
                  color: 'var(--ink-900)',
                  fontSize: '15px',
                  fontWeight: 500,
                  transition: 'border-color 0.15s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              <p style={{ fontSize: '13px', color: 'var(--text-subtle)', marginTop: '8px' }}>
                You'll be the owner with full control over settings and billing
              </p>
            </div>

            {/* Info Box */}
            <div style={{
              padding: '16px',
              background: 'var(--paper-200)',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              marginBottom: '24px'
            }}>
              <p style={{ fontSize: '13px', color: 'var(--ink-700)', lineHeight: 1.6, margin: 0 }}>
                <strong>What's included:</strong> Free plan with 3 SMTP accounts, 10 templates, and 15 AI generations per month. You can upgrade anytime.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={creating}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: '2px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--ink-700)',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                  opacity: creating ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !orgName.trim()}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  fontSize: '15px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {creating && <Loader2 size={18} className="spin" />}
                {creating ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate(-50%, -45%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}</style>
      </div>
    </>
  )
}
