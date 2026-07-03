# zecompaign Test Checklist

Use this checklist to verify your zecompaign installation is working correctly.

## ✅ Pre-Testing Setup

- [ ] Node.js 18+ installed
- [ ] Supabase project created
- [ ] Environment variables configured in `.env.local`
- [ ] `npm install` completed successfully
- [ ] Development server running (`npm run dev`)

## 🔐 Authentication Tests

### Email/Password Authentication
- [ ] Navigate to `/signup`
- [ ] Create account with email/password
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Redirected to `/dashboard`
- [ ] Organization auto-created
- [ ] User profile created

### Login
- [ ] Navigate to `/login`
- [ ] Login with credentials
- [ ] Successfully reach dashboard
- [ ] User data displays correctly

### Password Reset
- [ ] Navigate to `/forgot-password`
- [ ] Request password reset
- [ ] Receive reset email
- [ ] Click reset link
- [ ] Set new password at `/auth/reset-password`
- [ ] Login with new password works

### OAuth (if configured)
- [ ] Click "Continue with Google" button
- [ ] Redirected to Google login
- [ ] Successfully authenticated
- [ ] Redirected back to dashboard
- [ ] Organization auto-created (if first login)

## 📧 SMTP Account Tests

### Add SMTP Account
- [ ] Navigate to `/smtp`
- [ ] Click "Add Account" or similar
- [ ] Fill in SMTP details:
  - Name
  - Email
  - Host (e.g., smtp.gmail.com)
  - Port (587 or 465)
  - Username
  - Password
  - TLS setting
- [ ] Click "Test Connection"
- [ ] Connection successful message
- [ ] Save account
- [ ] Account appears in list

### Test SMTP Connection
- [ ] Select existing account
- [ ] Click "Test" button
- [ ] Success message shown
- [ ] `last_tested_at` timestamp updated

## ✉️ Email Sending Tests

### Compose and Send Email
- [ ] Navigate to `/compose`
- [ ] Select SMTP account from dropdown
- [ ] Add recipient email (use your own email for testing)
- [ ] Enter subject
- [ ] Write email body (HTML or plain text)
- [ ] Preview looks correct
- [ ] Click "Send Outbound Campaign"
- [ ] Success toast notification
- [ ] Email received in inbox
- [ ] Email appears in dashboard recent activity

### Send with Template
- [ ] Navigate to `/templates`
- [ ] Create a template
- [ ] Navigate to `/compose`
- [ ] Load template
- [ ] Template content fills subject and body
- [ ] Send email successfully

## 🤖 AI Template Generation Tests (Optional)

### Add Gemini Key
- [ ] Navigate to `/settings`
- [ ] Add Gemini API key section visible
- [ ] Enter API key
- [ ] Set monthly quota (optional)
- [ ] Save successfully

### Generate Template
- [ ] Navigate to `/ai`
- [ ] Enter prompt (e.g., "Product launch email")
- [ ] Select tone (professional/casual/friendly)
- [ ] Select length (short/medium/long)
- [ ] Click "Generate"
- [ ] Template generated successfully
- [ ] Subject and body populated
- [ ] Can save template
- [ ] Can use in composer

## 👥 Team Management Tests

### Invite Team Member
- [ ] Navigate to `/team`
- [ ] Enter team member email
- [ ] Select role (admin or member)
- [ ] Click "Invite"
- [ ] Success message (or error if user not signed up)
- [ ] Member appears in list

### Grant SMTP Access
- [ ] Navigate to `/smtp`
- [ ] Select account
- [ ] Grant access to team member
- [ ] Access granted successfully
- [ ] Team member can see account when logged in

### Update Member Role
- [ ] Navigate to `/team`
- [ ] Change member role from member to admin
- [ ] Role updated successfully
- [ ] Member has admin permissions

### Remove Team Member
- [ ] Navigate to `/team`
- [ ] Click "Remove" on team member
- [ ] Confirm removal
- [ ] Member removed from list
- [ ] Member no longer has access

## 💳 Billing Tests

### View Current Plan
- [ ] Navigate to `/billing`
- [ ] Current plan displays correctly (Free)
- [ ] Usage stats show correctly:
  - SMTP accounts count
  - Team members count
  - Templates count
- [ ] Usage bars display correctly

### Request Plan Upgrade
- [ ] Click "Upgrade Plan"
- [ ] Select plan (Starter/Pro/Business)
- [ ] Select billing period (monthly/annual)
- [ ] Enter billing contact email
- [ ] Submit request
- [ ] Success message shown
- [ ] Request appears in payment requests list
- [ ] Status shows "pending"

### Admin Approval (if admin configured)
- [ ] Login as admin user
- [ ] Navigate to admin panel (to be created)
- [ ] See pending payment request
- [ ] Approve request
- [ ] Organization plan updated
- [ ] User sees active plan

## 📊 Dashboard Tests

### Dashboard Display
- [ ] Navigate to `/dashboard`
- [ ] Statistics display correctly:
  - Emails sent count
  - Failed emails count
  - Active SMTP accounts
  - Active Gemini keys
- [ ] Recent activity shows sent emails
- [ ] Quick action buttons work
- [ ] Navigation to other pages works

## 🔍 Edge Cases & Error Handling

### Authentication Errors
- [ ] Try login with wrong password → error shown
- [ ] Try signup with existing email → error shown
- [ ] Try accessing `/dashboard` without login → redirected to `/login`

### SMTP Errors
- [ ] Try invalid SMTP credentials → test fails with error
- [ ] Try sending without recipient → validation error
- [ ] Try sending without subject → validation error
- [ ] Try sending without body → validation error

### Rate Limiting (Future)
- [ ] Rapid API calls don't crash server
- [ ] Proper error messages for rate limits

### Plan Limits
- [ ] Try adding more accounts than plan allows → error message
- [ ] Try inviting more members than plan allows → error message
- [ ] Usage bars show red when at limit

## 🔒 Security Tests

### Row Level Security
- [ ] Create two different user accounts
- [ ] User A cannot see User B's SMTP accounts
- [ ] User A cannot see User B's templates
- [ ] User A cannot see User B's sent emails
- [ ] Shared organization data is visible to both

### Access Control
- [ ] Member cannot access admin settings
- [ ] Member cannot approve payment requests
- [ ] Non-owner cannot delete organization
- [ ] User without SMTP access cannot use account

### SQL Injection Protection
- [ ] Try SQL injection in email fields → properly escaped
- [ ] Try SQL injection in subject → properly escaped
- [ ] Try XSS in email body → properly sanitized

## 📱 UI/UX Tests

### Responsiveness
- [ ] Desktop view (1920x1080) looks good
- [ ] Tablet view (768x1024) looks good
- [ ] Mobile view (375x667) looks good
- [ ] Sidebar responsive on mobile

### Navigation
- [ ] All links work correctly
- [ ] Back button works as expected
- [ ] Breadcrumbs accurate (if implemented)
- [ ] Active nav item highlighted

### Forms
- [ ] All form validations work
- [ ] Error messages display clearly
- [ ] Success messages show appropriately
- [ ] Loading states display during operations

## 🐛 Bug Testing

### Known Issues to Test
- [ ] Email sending only supports single recipient (by design for now)
- [ ] Attachments not implemented yet
- [ ] Bulk sending needs queue system
- [ ] OAuth providers need configuration

### Common Issues
- [ ] Page refreshes after form submissions work correctly
- [ ] Toast notifications don't stack incorrectly
- [ ] Modal overlays close properly
- [ ] Date formatting consistent

## 📈 Performance Tests

### Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] SMTP list loads in < 1 second
- [ ] Email composer opens instantly
- [ ] Template list loads quickly

### API Response Times
- [ ] `/api/send-email` responds in < 5 seconds
- [ ] `/api/test-smtp` responds in < 3 seconds
- [ ] `/api/generate-template` responds in < 10 seconds

## ✅ Final Checks

- [ ] No console errors in browser
- [ ] No TypeScript errors in terminal
- [ ] All environment variables set correctly
- [ ] Supabase project healthy
- [ ] Database tables all present
- [ ] RLS policies active on all tables

## 📝 Test Results

**Date Tested:** _______________

**Tester:** _______________

**Environment:**
- Node Version: _______________
- Browser: _______________
- OS: _______________

**Pass Rate:** ___ / ___ tests passed

**Critical Issues Found:**
1. 
2. 
3. 

**Non-Critical Issues Found:**
1. 
2. 
3. 

**Notes:**

---

## Next Steps After Testing

1. Fix any critical issues found
2. Document any known limitations
3. Update README with special setup notes
4. Prepare for deployment
5. Set up monitoring and error tracking
