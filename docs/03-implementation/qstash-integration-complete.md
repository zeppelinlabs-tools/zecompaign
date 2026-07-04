# QStash Integration - Implementation Complete

## ✅ Features Implemented

### 1. **Email Queue with QStash**
- Reliable email delivery with automatic retries (3 attempts)
- Status tracking (queued, sending, sent, delivered, failed, bounced)
- QStash message ID tracking
- Asynchronous processing

### 2. **Duplicate Prevention**
- Checks if same email was sent to same recipient with same subject in last 24 hours
- Database-level duplicate check via RPC function
- Prevents spam and accidental re-sends

### 3. **Email Audit Logs**
- Complete tracking of all emails sent
- Stores: recipient, subject, status, SMTP account, sender, timestamps
- Metadata storage for additional data (message IDs, responses, etc.)
- RLS policies for security

### 4. **Retry Mechanism**
- Failed emails can be retried manually
- Automatic retry via QStash (3 attempts with exponential backoff)
- Updates audit log with each attempt

---

## 📁 Files Created/Modified

### New Files:
1. `lib/queue/email-queue.ts` - QStash email queue wrapper
2. `app/api/webhooks/qstash/send-email/route.ts` - Webhook handler
3. `lib/actions/audit.ts` - Server actions for audit logs

### Modified Files:
1. `lib/email-sender.ts` - Updated to use QStash queue
2. `lib/actions/organizations.ts` - Updated invitation functions
3. `.env.local.example` - Added QStash variables

### Database:
1. `email_audit_logs` table - Tracks all sent emails
2. `check_duplicate_email()` function - Prevents duplicates

---

## 🗄️ Database Schema

```sql
CREATE TABLE email_audit_logs (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  sent_by UUID REFERENCES auth.users(id),
  recipient_email TEXT,
  subject TEXT,
  template_id UUID REFERENCES templates(id),
  status TEXT CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'bounced')),
  smtp_account_id UUID REFERENCES sending_accounts(id),
  qstash_message_id TEXT,
  error_message TEXT,
  metadata JSONB,
  queued_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 🔄 Email Flow

### 1. **Queue Email**
```typescript
import { queueEmail } from '@/lib/queue/email-queue'

const result = await queueEmail({
  organizationId: 'org-uuid',
  sentBy: 'user-uuid',
  to: 'recipient@example.com',
  subject: 'Hello',
  html: '<p>HTML content</p>',
  text: 'Plain text',
  smtpAccountId: 'smtp-uuid' // optional
})
```

### 2. **Duplicate Check**
- Checks if email with same org + recipient + subject sent in last 24h
- Returns `{ duplicate: true }` if found
- Skips sending to prevent spam

### 3. **Create Audit Log**
- Status: `queued`
- Stores email details
- Returns log ID

### 4. **Queue with QStash**
- Sends to webhook URL with retry config
- Gets QStash message ID
- Updates log with message ID
- Status: `sending`

### 5. **Webhook Processing**
- QStash calls `/api/webhooks/qstash/send-email`
- Verifies signature for security
- Gets SMTP config (org SMTP or platform SMTP)
- Sends email via nodemailer
- Updates log: Status `sent` or `failed`

### 6. **Retry on Failure**
- QStash automatically retries 3 times
- Manual retry available via `retryFailedEmail(logId)`
- Exponential backoff between retries

---

## 🔐 Security Features

### 1. **Signature Verification**
```typescript
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'

export const POST = verifySignatureAppRouter(handler)
```
- Prevents unauthorized webhook calls
- Uses QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY
- Rejects requests without valid signature

### 2. **RLS Policies**
- Only org members can view their org's logs
- Only admin/owner can access audit logs
- Service role can manage all logs (for QStash webhook)

### 3. **Duplicate Prevention**
- Prevents accidental spam
- 24-hour window (configurable)
- Database-level enforcement

---

## 📊 Audit Log Features

### Available Functions:

#### 1. Get Audit Logs
```typescript
import { getAuditLogs } from '@/lib/actions/audit'

const result = await getAuditLogs(orgId, {
  status: 'failed',           // optional filter
  startDate: '2026-01-01',    // optional
  endDate: '2026-12-31',      // optional
  recipient: 'example.com',   // optional search
  page: 1,                    // pagination
  pageSize: 50                // results per page
})
```

#### 2. Get Statistics
```typescript
import { getAuditLogStats } from '@/lib/actions/audit'

const stats = await getAuditLogStats(orgId)
// Returns: { total, queued, sending, sent, delivered, failed, bounced }
```

#### 3. Retry Failed Email
```typescript
import { retryEmail } from '@/lib/actions/audit'

const result = await retryEmail(logId)
```

#### 4. Export to CSV
```typescript
import { exportAuditLogs } from '@/lib/actions/audit'

const { data: csv } = await exportAuditLogs(orgId, filters)
```

---

## 🧪 Testing

### Test Email Queue
```bash
# 1. Send a test invitation
- Go to Team Members
- Click "Invite Member"
- Enter email and send

# 2. Check logs in terminal
✅ Audit log created: <log-id>
✅ Email queued with QStash: <message-id>

# 3. QStash will call webhook in ~1 second
📬 QStash webhook received
📧 Processing email send: <log-id>
✅ Email sent successfully: <message-id>
```

### Test Duplicate Prevention
```bash
# 1. Send invitation to same email
# 2. Try to resend immediately
# 3. Should see:
⚠️ Duplicate email detected, skipping send
📧 Invitation email already sent recently, skipping

# 4. Wait 24 hours or change subject to send again
```

### Test Retry
```bash
# 1. Cause a failure (wrong SMTP password)
# 2. Email status becomes 'failed'
# 3. Call retryEmail(logId)
# 4. Email re-queued with new QStash message ID
```

---

## 🔧 Configuration

### Environment Variables Required:
```env
# QStash
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_token
QSTASH_CURRENT_SIGNING_KEY=your_key
QSTASH_NEXT_SIGNING_KEY=your_next_key

# SMTP (fallback if org doesn't have SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App URL (for webhook callback)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### QStash Dashboard
- View queued messages: https://console.upstash.com/qstash
- See retry attempts
- Monitor webhook failures
- View dead letter queue

---

## 📈 Monitoring & Debugging

### Check Queue Status
```typescript
import { getEmailStatus } from '@/lib/queue/email-queue'

const status = await getEmailStatus(logId)
// Returns audit log with current status
```

### Common Issues:

#### 1. **Webhook Not Receiving Calls**
- Check NEXT_PUBLIC_SITE_URL is publicly accessible
- For localhost, use ngrok: `ngrok http 3000`
- Update QStash webhook URL

#### 2. **Signature Verification Failed**
- Verify QSTASH_CURRENT_SIGNING_KEY is correct
- Check QSTASH_NEXT_SIGNING_KEY during key rotation
- Ensure environment variables are loaded

#### 3. **Emails Not Sending**
- Check SMTP credentials
- Verify organization has SMTP account or platform SMTP configured
- Check email_audit_logs for error_message

#### 4. **Duplicate Detection Too Aggressive**
- Adjust hours_ago parameter in check_duplicate_email
- Current: 24 hours
- Can be changed per call

---

## 🚀 Next Steps

### To Implement UI for Audit Logs:
1. Create `/app/(dashboard)/audit-logs/page.tsx`
2. Add "Audit Logs" to sidebar (admin/owner only)
3. Show table with filters
4. Add export CSV button
5. Show retry button for failed emails
6. Display status badges

### Suggested UI Features:
- Real-time status updates (polling or SSE)
- Charts for email volume over time
- Success rate percentage
- Failed email alerts
- Retry queue management
- Email preview modal

---

## ✨ Benefits

1. **Reliability**: Automatic retries ensure emails get delivered
2. **Transparency**: Complete audit trail of all emails
3. **Performance**: Async queue doesn't block user actions
4. **Security**: Signature verification prevents abuse
5. **Compliance**: Audit logs for regulatory requirements
6. **User Experience**: Duplicate prevention reduces spam
7. **Debugging**: Error messages help diagnose issues
8. **Scalability**: QStash handles high volume efficiently

---

## 📝 Summary

QStash integration is **fully functional**:
- ✅ Email queue implemented
- ✅ Duplicate prevention working
- ✅ Audit logs created
- ✅ Retry mechanism ready
- ✅ Security in place
- ✅ Server actions created

**Ready for UI implementation!** 

The backend is complete. Next step is to create the audit logs page and add it to the sidebar for admins/owners.
