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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Usage</h1>
        <p className="text-gray-600">Manage your subscription and view usage</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold capitalize">{currentPlan} Plan</h2>
            <p className="text-gray-600 text-sm">Status: {organization.billing_status}</p>
          </div>
          {currentPlan !== 'business' && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Upgrade Plan
            </button>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-2">SMTP Accounts</p>
          <p className="text-3xl font-bold text-gray-900">
            {usage.accounts} <span className="text-lg text-gray-500">/ {limits.accounts === 999999 ? '∞' : limits.accounts}</span>
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${Math.min((usage.accounts / limits.accounts) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-2">Team Members</p>
          <p className="text-3xl font-bold text-gray-900">
            {usage.members} <span className="text-lg text-gray-500">/ {limits.members === 999999 ? '∞' : limits.members}</span>
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${Math.min((usage.members / limits.members) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-2">Templates</p>
          <p className="text-3xl font-bold text-gray-900">
            {usage.templates} <span className="text-lg text-gray-500">/ {limits.templates === 999999 ? '∞' : limits.templates}</span>
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full"
              style={{ width: `${Math.min((usage.templates / limits.templates) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Payment Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Payment Requests</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {paymentRequests.length === 0 ? (
            <p className="p-6 text-gray-500 text-center">No payment requests yet</p>
          ) : (
            paymentRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{request.requested_plan} Plan - {request.billing_period}</p>
                    <p className="text-sm text-gray-600">${request.amount_paid} • {new Date(request.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'approved' ? 'bg-green-100 text-green-700' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {request.status}
                  </span>
                </div>
                {request.admin_notes && (
                  <p className="mt-2 text-sm text-gray-600">Admin notes: {request.admin_notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-2xl font-bold mb-6">Upgrade Your Plan</h2>
            
            <form onSubmit={handleUpgradeRequest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan</label>
                <div className="grid grid-cols-3 gap-4">
                  {(['starter', 'pro', 'business'] as const).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-4 border-2 rounded-lg text-center ${
                        selectedPlan === plan ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <p className="font-semibold capitalize">{plan}</p>
                      <p className="text-2xl font-bold mt-2">${PLAN_PRICES[plan].monthly}</p>
                      <p className="text-sm text-gray-600">/month</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billing Period</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('monthly')}
                    className={`p-4 border-2 rounded-lg ${
                      billingPeriod === 'monthly' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('annual')}
                    className={`p-4 border-2 rounded-lg ${
                      billingPeriod === 'annual' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    Annual (Save 17%)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billing Contact Email</label>
                <input
                  type="email"
                  value={billingContact}
                  onChange={(e) => setBillingContact(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold mb-2">Total Amount: ${PLAN_PRICES[selectedPlan][billingPeriod]}</p>
                <p className="text-sm text-gray-700">
                  After submitting, you'll receive payment instructions via email. Your plan will be activated once an admin verifies your payment.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
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
