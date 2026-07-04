'use client'

import { useState } from 'react'
import { requestPlanUpgrade } from '@/lib/actions/billing'
import toast from 'react-hot-toast'

interface Organization {
  id: string
  name: string
  plan: string
  billing_period: string | null
  billing_status: string
  billing_start_date: string | null
}

interface PaymentRequest {
  id: string
  requested_plan: string
  billing_period: string
  amount_paid: number
  status: string
  created_at: string
  reviewed_at: string | null
  admin_notes: string | null
}

interface Usage {
  accounts: number
  members: number
  templates: number
}

interface BillingPanelProps {
  organization: Organization | null
  paymentRequests: PaymentRequest[]
  usage: Usage
  userRole: string
}

const PLAN_LIMITS = {
  free: { accounts: 3, members: 1, templates: 10 },
  starter: { accounts: 10, members: 3, templates: 50 },
  pro: { accounts: 50, members: 10, templates: 200 },
  business: { accounts: 999999, members: 50, templates: 999999 },
}

const PLAN_PRICES = {
  starter: { monthly: 9, annual: 90 },
  pro: { monthly: 19, annual: 190 },
  business: { monthly: 49, annual: 490 },
}

export default function BillingPanel({ organization, paymentRequests, usage, userRole }: BillingPanelProps) {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'business'>('starter')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [billingContact, setBillingContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  if (!organization) return null

  const currentPlan = organization.plan
  const limits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free

  async function handleUpgradeRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!organization) return
    
    setLoading(true)

    const amount = PLAN_PRICES[selectedPlan][billingPeriod]

    const result = await requestPlanUpgrade({
      organization_id: organization.id,
      requested_plan: selectedPlan,
      billing_period: billingPeriod,
      amount_paid: amount,
      billing_contact: billingContact,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Upgrade request submitted! Please check your email for payment instructions.')
      setShowUpgradeModal(false)
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4, fontFamily: 'Fraunces' }}>
          Billing & Usage
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Manage your subscription and view usage
        </p>
      </div>

      {/* Current Plan */}
      <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, textTransform: 'capitalize', fontFamily: 'Fraunces', color: 'var(--text)' }}>
              {currentPlan} Plan
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              Status: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{organization.billing_status}</span>
            </p>
          </div>
          {currentPlan !== 'business' && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="btn-primary"
              style={{ padding: '10px 20px' }}
            >
              Upgrade Plan
            </button>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="glass" style={{ padding: 24 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            SMTP Accounts
          </p>
          <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', fontFamily: 'Fraunces' }}>
            {usage.accounts} <span style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 500 }}>/ {limits.accounts === 999999 ? '∞' : limits.accounts}</span>
          </p>
          <div style={{ marginTop: 12, width: '100%', background: 'var(--border)', borderRadius: 4, height: 8 }}>
            <div 
              style={{ 
                background: 'linear-gradient(90deg, var(--route-blue), var(--purple))', 
                height: 8, 
                borderRadius: 4,
                width: `${Math.min((usage.accounts / limits.accounts) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Team Members
          </p>
          <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', fontFamily: 'Fraunces' }}>
            {usage.members} <span style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 500 }}>/ {limits.members === 999999 ? '∞' : limits.members}</span>
          </p>
          <div style={{ marginTop: 12, width: '100%', background: 'var(--border)', borderRadius: 4, height: 8 }}>
            <div 
              style={{ 
                background: 'linear-gradient(90deg, var(--stamp-teal), var(--route-blue))', 
                height: 8, 
                borderRadius: 4,
                width: `${Math.min((usage.members / limits.members) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Templates
          </p>
          <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', fontFamily: 'Fraunces' }}>
            {usage.templates} <span style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 500 }}>/ {limits.templates === 999999 ? '∞' : limits.templates}</span>
          </p>
          <div style={{ marginTop: 12, width: '100%', background: 'var(--border)', borderRadius: 4, height: 8 }}>
            <div 
              style={{ 
                background: 'linear-gradient(90deg, var(--purple), var(--accent))', 
                height: 8, 
                borderRadius: 4,
                width: `${Math.min((usage.templates / limits.templates) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* Payment Requests */}
      <div className="glass" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Fraunces', color: 'var(--text)' }}>
            Payment Requests
          </h2>
        </div>
        <div>
          {paymentRequests.length === 0 ? (
            <p style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center', fontSize: 14 }}>
              No payment requests yet
            </p>
          ) : (
            paymentRequests.map((request) => (
              <div key={request.id} style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--text)', fontSize: 15 }}>
                      {request.requested_plan} Plan - {request.billing_period}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      ${request.amount_paid} • {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    ...(request.status === 'approved' ? { background: 'var(--green-glow)', color: 'var(--green)' } :
                      request.status === 'rejected' ? { background: 'var(--red-glow)', color: 'var(--red)' } :
                      { background: 'var(--accent-glow)', color: 'var(--accent)' })
                  }}>
                    {request.status}
                  </span>
                </div>
                {request.admin_notes && (
                  <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Admin notes: {request.admin_notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: 16
        }}>
          <div className="glass" style={{
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 32
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, fontFamily: 'Fraunces', color: 'var(--text)' }}>
              Upgrade Your Plan
            </h2>
            
            <form onSubmit={handleUpgradeRequest} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                  Select Plan
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {(['starter', 'pro', 'business'] as const).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      style={{
                        padding: 16,
                        border: `2px solid ${selectedPlan === plan ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 8,
                        textAlign: 'center',
                        background: selectedPlan === plan ? 'var(--accent-glow)' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <p style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: 14, color: 'var(--text)' }}>{plan}</p>
                      <p style={{ fontSize: 24, fontWeight: 700, marginTop: 8, fontFamily: 'Fraunces', color: 'var(--text)' }}>
                        ${PLAN_PRICES[plan].monthly}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>/month</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                  Billing Period
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('monthly')}
                    style={{
                      padding: 16,
                      border: `2px solid ${billingPeriod === 'monthly' ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 8,
                      background: billingPeriod === 'monthly' ? 'var(--accent-glow)' : 'white',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('annual')}
                    style={{
                      padding: 16,
                      border: `2px solid ${billingPeriod === 'annual' ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 8,
                      background: billingPeriod === 'annual' ? 'var(--accent-glow)' : 'white',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Annual (Save 17%)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  Billing Contact Email
                </label>
                <input
                  type="email"
                  value={billingContact}
                  onChange={(e) => setBillingContact(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 14,
                    color: 'var(--text)'
                  }}
                  required
                />
              </div>

              <div style={{
                background: 'var(--accent-glow)',
                border: '1px solid var(--accent)',
                borderRadius: 8,
                padding: 16
              }}>
                <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 15, color: 'var(--text)' }}>
                  Total Amount: ${PLAN_PRICES[selectedPlan][billingPeriod]}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  After submitting, you'll receive payment instructions via email. Your plan will be activated once an admin verifies your payment.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px 24px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px 24px' }}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
