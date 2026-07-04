# Next Steps - Pending Features

## 1. QStash Integration for Email Queueing

### Requirements
- Use QStash (Upstash) for reliable email delivery queue
- Retry failed emails automatically
- Track email delivery status

### Implementation Tasks
- [ ] Add QStash SDK to project
- [ ] Create email queue handler
- [ ] Update `sendInvitationEmail()` to use QStash
- [ ] Create QStash webhook endpoint for callbacks
- [ ] Add retry logic for failed deliveries

### Environment Variables Needed
```env
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token_here
QSTASH_CURRENT_SIGNING_KEY=your_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key
```

### Files to Create/Modify
- `lib/queue/email-queue.ts` - QStash email queue wrapper
- `app/api/webhooks/qstash/route.ts` - Webhook handler
- Update `lib/email-sender.ts` to use queue
- Update `lib/actions/emails.ts` for campaign emails

---

## 2. Audit Logs for Admins

### Requirements
- Track all emails sent by organization
- Display in sidebar for admin/owner roles
- Show: recipient, subject, status, timestamp, sender

### Database Schema
```sql
CREATE TABLE email_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sent_by UUID NOT NULL REFERENCES auth.users(id),
  recipient_email TEXT NOT NULL,
  subject TEXT,
  template_id UUID REFERENCES templates(id),
  status TEXT NOT NULL, -- 'queued', 'sent', 'delivered', 'failed', 'bounced'
  smtp_account_id UUID REFERENCES sending_accounts(id),
  error_message TEXT,
  metadata JSONB, -- Additional data (headers, message_id, etc.)
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_org ON email_audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_email_logs_status ON email_audit_logs(status);
CREATE INDEX idx_email_logs_recipient ON email_audit_logs(recipient_email);
```

### Implementation Tasks
- [ ] Create `email_audit_logs` table migration
- [ ] Add RLS policies for audit logs
- [ ] Create server actions for fetching logs
- [ ] Update email sending to log all sends
- [ ] Create Audit Logs component
- [ ] Add "Audit Logs" to sidebar (admin/owner only)
- [ ] Create audit logs page `/dashboard/audit-logs`
- [ ] Add filtering (by status, date range, recipient)
- [ ] Add export to CSV functionality

### Files to Create/Modify
- Migration: `add_email_audit_logs.sql`
- `lib/actions/audit.ts` - Server actions for logs
- `components/AuditLogs.tsx` - Log viewer component
- `app/(dashboard)/audit-logs/page.tsx` - Audit logs page
- `components/Sidebar.tsx` - Add audit logs link
- Update `lib/email-sender.ts` to log sends
- Update `lib/actions/emails.ts` to log campaign sends

### UI Design
```
Audit Logs
├─ Filters
│  ├─ Date Range Picker
│  ├─ Status Filter (All, Sent, Failed, Bounced)
│  ├─ Search by Recipient
│  └─ Export CSV Button
└─ Logs Table
   ├─ Timestamp
   ├─ Recipient
   ├─ Subject
   ├─ Status Badge
   ├─ Sent By (user avatar + name)
   ├─ SMTP Account
   └─ Actions (View Details, Retry if failed)
```

---

## 3. Current Status Summary

### ✅ Completed Features
- Secure invitation system with cryptographic tokens
- Single session policy (revoke other sessions on login)
- Email sending with nodemailer
- Organization management
- Team member invitation with resend capability
- RLS policies for security
- Avatar upload
- Profile management

### 🔧 Issues Fixed
- RLS blocking anonymous users from viewing invitations
- Missing UPDATE policy for resending invitations
- Organization data not loading in invitation page
- Session revocation error in OAuth callback
- Token mismatch between database and email URLs

### 📋 Priority Order
1. **Fix callback error** - ✅ DONE
2. **QStash Integration** - NEXT (for reliable email delivery)
3. **Audit Logs** - AFTER QStash (need logging infrastructure)

---

## QStash Implementation Plan

### Step 1: Install Dependencies
```bash
npm install @upstash/qstash
```

### Step 2: Create Queue Wrapper
```typescript
// lib/queue/email-queue.ts
import { Client } from '@upstash/qstash'

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!
})

export async function queueEmail(emailData: {
  to: string
  subject: string
  html: string
  text: string
  organizationId: string
  userId: string
}) {
  // Queue email for sending
  const response = await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/qstash`,
    body: emailData,
    retries: 3,
    delay: 0
  })
  
  return response.messageId
}
```

### Step 3: Create Webhook Handler
```typescript
// app/api/webhooks/qstash/route.ts
import { verifySignature } from '@upstash/qstash/nextjs'
import nodemailer from 'nodemailer'

async function handler(req: Request) {
  const emailData = await req.json()
  
  // Send email using nodemailer
  // Log to audit_logs table
  // Return success/failure
  
  return new Response('OK', { status: 200 })
}

export const POST = verifySignature(handler)
```

### Step 4: Update Email Sender
- Replace direct nodemailer calls with QStash queue
- Add audit logging
- Handle callbacks from QStash

---

## Audit Logs Implementation Plan

### Step 1: Database Setup
- Run migration to create `email_audit_logs` table
- Add RLS policies
- Create indexes

### Step 2: Server Actions
```typescript
// lib/actions/audit.ts
export async function getAuditLogs(orgId: string, filters?: {
  status?: string
  startDate?: string
  endDate?: string
  recipient?: string
}) {
  // Query with filters
  // Return paginated results
}

export async function logEmailSend(data: {
  organization_id: string
  sent_by: string
  recipient_email: string
  subject: string
  status: string
  // ...
}) {
  // Insert into email_audit_logs
}
```

### Step 3: UI Component
- Create filterable data table
- Add status badges (green=sent, red=failed, yellow=pending)
- Show user avatars
- Add detail modal for viewing email content
- Export to CSV functionality

### Step 4: Sidebar Integration
- Add "Audit Logs" menu item (shield icon)
- Only show for admin/owner roles
- Badge showing failed email count

---

## Environment Variables Summary

### Required for QStash
```env
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_token
QSTASH_CURRENT_SIGNING_KEY=your_key
QSTASH_NEXT_SIGNING_KEY=your_next_key
```

### Already Configured
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

---

**Ready to implement QStash or Audit Logs next! Which should we tackle first?**
