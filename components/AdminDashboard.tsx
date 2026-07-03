'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Users, Building2, Server, Mail, Clock, DollarSign } from 'lucide-react'
import { approvePaymentRequest, rejectPaymentRequest } from '@/lib/actions/admin'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface PaymentRequest {
  id: string
  organization_id: string
  requested_plan: string
  billing_period: string
  amount_paid: number
  billing_contact: string
  status: string
  created_at: string
  organizations: {
    id: string
    name: string
    billing_email: string | null
  }
  profiles: {
    full_name: string | null
    email: string
  }
}

interface Stats {
  totalOrgs: number
  totalUsers: number
  totalAccounts: number
  totalEmails: number
}

interface Props {
  paymentRequests: PaymentRequest[]
  stats: Stats
}

export default function AdminDashboard({ paymentRequests, stats }: Props) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})

  async function handleApprove(requestId: string) {
    if (!confirm('Are you sure you want to approve this payment request?')) return

    setProcessing(requestId)
    const result = await approvePaymentRequest(requestId, adminNotes[requestId])

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Payment approved! Plan activated.')
      router.refresh()
    }
    setProcessing(null)
  }

  async function handleReject(requestId: string) {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setProcessing(requestId)
    const result = await rejectPaymentRequest(requestId, rejectionReason)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Payment request rejected')
      setRejectingId(null)
      setRejectionReason('')
      router.refresh()
    }
    setProcessing(null)
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrgs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Server size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">SMTP Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAccounts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Emails Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmails}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payment Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-900">Pending Payment Requests</h2>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
              {paymentRequests.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {paymentRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CheckCircle size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No pending requests</p>
              <p className="text-sm mt-2">All payment requests have been processed</p>
            </div>
          ) : (
            paymentRequests.map(request => (
              <div key={request.id} className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.organizations.name}
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full capitalize">
                        {request.requested_plan}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                        {request.billing_period}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Requested by:</span> {request.profiles.full_name || request.profiles.email}
                      </div>
                      <div>
                        <span className="font-medium">Billing contact:</span> {request.billing_contact}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span> ${request.amount_paid}
                      </div>
                      <div>
                        <span className="font-medium">Requested:</span> {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Admin Notes Input */}
                    {rejectingId !== request.id && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Admin Notes (optional)
                        </label>
                        <input
                          type="text"
                          value={adminNotes[request.id] || ''}
                          onChange={e => setAdminNotes({ ...adminNotes, [request.id]: e.target.value })}
                          placeholder="e.g., Payment verified via bank transfer"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    )}

                    {/* Rejection Form */}
                    {rejectingId === request.id && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <label className="block text-sm font-medium text-red-700 mb-2">
                          Rejection Reason *
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          placeholder="e.g., Payment not received, incorrect amount, etc."
                          rows={3}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm"
                        />
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processing === request.id || !rejectionReason.trim()}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                          >
                            Confirm Rejection
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null)
                              setRejectionReason('')
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {rejectingId !== request.id && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processing === request.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectingId(request.id)}
                        disabled={processing === request.id}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
