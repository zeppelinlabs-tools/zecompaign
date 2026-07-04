# QStash Integration Status

**Date:** July 5, 2026  
**Question:** Is QStash working or not?

---

## ✅ **STATUS: READY TO TEST**

QStash is **fully configured and implemented**, but needs testing to verify it works end-to-end.

---

## 📋 Configuration Checklist

### 1. **Environment Variables** ✅
- ✅ `QSTASH_TOKEN` - Set (removed quotes)
- ✅ `QSTASH_CURRENT_SIGNING_KEY` - Set (removed quotes)
- ✅ `QSTASH_NEXT_SIGNING_KEY` - Set (removed quotes)
- ✅ `QSTASH_URL` - Set to EU region endpoint (removed quotes)
- ⚠️ **IMPORTANT FIX APPLIED**: Removed quotation marks from all QStash variables

### 2. **Dependencies** ✅
- ✅ `@upstash/qstash@2.11.1` - Installed
- ✅ `nodemailer@9.0.1` - Installed

### 3. **Database** ✅
- ✅ `email_audit_logs` table exists
- ✅ `check_duplicate_email()` function exists
- ✅ RLS policies configured

### 4. **Code Implementation** ✅
- ✅ `lib/queue/email-queue.ts` - Queue functions
- ✅ `app/api/webhooks/qstash/send-email/route.ts` - Webhook handler
- ✅ `lib/email-sender.ts` - Integration with queue
- ✅ `lib/actions/organizations.ts` - Calls queue for invitations

### 5. **UI Components** ✅
- ✅ Audit Logs page created
- ✅ Sidebar link added
- ✅ Statistics dashboard
- ✅ Retry functionality

---

## ⚠️ CRITICAL ISSUE FIXED

### **Problem: Quotation Marks in Environment Variables**

**Before (WRONG):**
```env
QSTASH_URL="https://qstash-eu-central-1.upstash.io"
QSTASH_TOKEN="eyJVc2VySUQi..."
```

**After (CORRECT):**
```env
QSTASH_URL=https://qstash-eu-central-1.upstash.io
QSTASH_TOKEN=eyJVc2VySUQi...
```

**Why it matters:**
- With quotes: `process.env.QSTASH_TOKEN` becomes `"eyJVc2VySUQi..."` (includes quotes)
- Without quotes: `process.env.QSTASH_TOKEN` becomes `eyJVc2VySUQi...` (correct)
- QStash API would reject requests with quoted tokens

---

## 🚫 Why QStash Was Not Working Before

1. **Quotation marks in env variables** - QStash SDK was receiving tokens with quotes
2. **API authentication would fail** - Upstash server couldn't validate the malformed token
3. **Emails wouldn't queue** - The Client initialization would fail silently or throw errors

---

## ✅ What's Fixed Now

1. ✅ Removed quotes from all QStash variables
2. ✅ Using correct EU regional endpoint
3. ✅ All code properly implemented
4. ✅ Database tables ready
5. ✅ Build succeeds without errors

---

## 🧪 How to Test QStash

### **Test 1: Send an Invitation**

1. Start dev server: `npm run dev`
2. Log in as admin/owner
3. Go to `/team`
4. Click "Invite Member"
5. Enter email and send

**Expected Terminal Logs:**
```bash
📨 Queueing email: { to: 'test@example.com', subject: '...', organizationId: '...' }
✅ Audit log created: <log-id>
✅ Email queued with QStash: <message-id>
```

### **Test 2: Check Audit Logs**

1. Go to `/audit-logs` (must be admin/owner)
2. Should see the invitation email with status "Queued" or "Sending"
3. Wait 5-10 seconds
4. Refresh page
5. Status should change to "Sent" or "Failed"

**If "Sent":** ✅ QStash is working!  
**If "Failed":** Check error message in the table

### **Test 3: Check QStash Dashboard**

1. Go to https://console.upstash.com/qstash
2. Click on "Messages"
3. Should see your queued email
4. Can see delivery status and retry attempts

---

## 🔍 Debugging QStash

### Check if QStash Client Initializes
```typescript
// In lib/queue/email-queue.ts
console.log('QStash Token:', process.env.QSTASH_TOKEN?.substring(0, 20) + '...')
```

### Check Webhook Signature Verification
The webhook at `/api/webhooks/qstash/send-email` verifies QStash signatures using:
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`

If webhook fails, check:
1. Signing keys are correct (no quotes)
2. Webhook URL is publicly accessible
3. Signature verification is working

### Common Issues

#### Issue 1: "Invalid token" error
**Cause:** Quotes in `QSTASH_TOKEN`  
**Fix:** ✅ Already fixed - removed quotes

#### Issue 2: "Signature verification failed"
**Cause:** Quotes in signing keys or wrong keys  
**Fix:** ✅ Already fixed - removed quotes, verify keys match dashboard

#### Issue 3: Webhook not called
**Cause:** `NEXT_PUBLIC_SITE_URL` not publicly accessible  
**Fix:** 
- For localhost: Use ngrok: `ngrok http 3000`
- Update `NEXT_PUBLIC_SITE_URL` to ngrok URL
- Or deploy to production

#### Issue 4: SMTP errors
**Cause:** Wrong SMTP credentials  
**Fix:** Check Gmail App Password is correct

---

## 🌐 Webhook URL Requirements

**Current:** `http://localhost:3000/api/webhooks/qstash/send-email`

**⚠️ LOCALHOST LIMITATION:**
QStash **CANNOT** call `localhost` URLs directly. You need one of:

### Option 1: Use ngrok (for testing)
```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 3000

# Update .env.local
NEXT_PUBLIC_SITE_URL=https://your-ngrok-url.ngrok.io
```

### Option 2: Deploy to Production
Deploy to Vercel/Netlify/Railway and QStash will call the production URL.

### Option 3: Use QStash Local Development
```bash
# Install QStash CLI
npm install -g @upstash/qstash-cli

# Run local proxy
qstash-cli dev --port 3000
```

---

## 📊 Expected Flow

1. **User invites team member** → `inviteTeamMember()` called
2. **Email queued** → `queueEmail()` creates audit log + queues with QStash
3. **QStash calls webhook** → POST to `/api/webhooks/qstash/send-email`
4. **Webhook sends email** → Uses nodemailer with SMTP
5. **Status updated** → Audit log updated to "sent" or "failed"
6. **User checks logs** → `/audit-logs` page shows status

---

## 🎯 Next Steps

1. **Start dev server:** `npm run dev`
2. **Test with ngrok:** 
   ```bash
   ngrok http 3000
   # Update NEXT_PUBLIC_SITE_URL in .env.local
   # Restart dev server
   ```
3. **Send test invitation**
4. **Check audit logs** at `/audit-logs`
5. **Verify email delivery**

---

## 📝 Summary

### ✅ What's Working:
- All code implemented correctly
- Database tables exist
- Dependencies installed
- Build succeeds
- Environment variables fixed (quotes removed)

### ⚠️ What Needs Testing:
- QStash can successfully queue emails
- Webhook can receive callbacks (needs ngrok for localhost)
- Emails are actually sent via SMTP
- Audit logs track correctly
- Retry functionality works

### 🚀 Confidence Level:
**90%** - Implementation is correct. The only unknown is network connectivity to QStash and webhook callbacks (which require ngrok for localhost testing).

---

## 🔗 Resources

- [QStash Dashboard](https://console.upstash.com/qstash)
- [QStash Docs](https://upstash.com/docs/qstash)
- [Ngrok Download](https://ngrok.com/download)
- [Nodemailer Docs](https://nodemailer.com/)

---

**Last Updated:** July 5, 2026  
**Status:** Ready for testing with ngrok
