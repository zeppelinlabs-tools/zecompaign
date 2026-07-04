# Supabase SMTP Configuration for Auth Emails

**Problem:** Magic links and verification emails are being sent from Supabase's default email service (`noreply@mail.app.supabase.io`), which:
- Often lands in spam folders
- Has rate limits
- Not suitable for production

**Solution:** Configure a custom SMTP provider for authentication emails.

---

## Step 1: Choose an SMTP Provider

### Recommended Providers
1. **Resend** (easiest, recommended for this project)
   - https://resend.com
   - Free tier: 3,000 emails/month
   - Excellent deliverability
   - Simple setup

2. **SendGrid**
   - Free tier: 100 emails/day
   - More configuration needed

3. **Gmail SMTP** (for testing only)
   - Free
   - Very limited, not for production

---

## Step 2: Get SMTP Credentials

### For Resend (Recommended)
1. Sign up at https://resend.com
2. Verify your domain or use their test domain
3. Go to "API Keys" → Create API Key
4. Copy the API key (it's your SMTP password)

### SMTP Details for Resend:
```
Host: smtp.resend.com
Port: 587 (or 465 for SSL)
Username: resend
Password: re_xxxxxxxxxxxxx (your API key)
```

---

## Step 3: Configure Supabase SMTP

### Via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/rfrojhdjyilpxhgcowrk

2. **Open Settings → Auth**
   - Click "Authentication" in sidebar
   - Scroll to "SMTP Settings"

3. **Enable Custom SMTP**
   - Toggle "Enable Custom SMTP"

4. **Enter SMTP Details**
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP Username: resend
   SMTP Password: re_xxxxxxxxxxxxx
   Sender Email: noreply@yourdomain.com
   Sender Name: zecompaign
   ```

5. **Test Configuration**
   - Click "Send Test Email"
   - Check your inbox

6. **Save Changes**

---

## Step 4: Update Email Templates (Optional)

### Customize Email Content

1. **Go to Auth → Email Templates**
2. **Customize:**
   - Confirmation email (signup verification)
   - Magic link email
   - Password reset email
   - Email change confirmation

### Example Template Variables:
```html
{{ .ConfirmationURL }}  <!-- Verification link -->
{{ .Token }}            <!-- OTP code -->
{{ .SiteURL }}          <!-- Your site URL -->
{{ .Email }}            <!-- User's email -->
```

---

## Step 5: Test the Setup

### Test Signup Flow
```bash
# Visit your signup page
http://localhost:3000/signup

# Enter test email
# Check inbox (not spam!)
```

### Test Magic Link
```bash
# Visit login page
http://localhost:3000/login

# Click "Send magic link"
# Check inbox for magic link
```

---

## Alternative: Use Supabase CLI (Advanced)

If you prefer CLI configuration:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref rfrojhdjyilpxhgcowrk

# Update auth config
supabase secrets set SMTP_HOST=smtp.resend.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=resend
supabase secrets set SMTP_PASS=re_xxxxxxxxxxxxx
supabase secrets set SMTP_SENDER_NAME=zecompaign
```

---

## Troubleshooting

### Emails Still Not Arriving

1. **Check Spam Folder**
   - Always check spam first
   - May take 2-3 minutes

2. **Verify SMTP Credentials**
   - Test SMTP manually with a tool
   - Ensure API key is active

3. **Check Supabase Logs**
   ```bash
   # View auth logs
   Visit: https://supabase.com/dashboard/project/rfrojhdjyilpxhgcowrk/logs/auth
   ```

4. **Domain Verification**
   - For production, verify your domain
   - Add SPF, DKIM, DMARC records
   - Improves deliverability

5. **Rate Limits**
   - Check provider's rate limits
   - Resend: 3,000/month free
   - SendGrid: 100/day free

---

## For Development Only: Disable Email Confirmation

**⚠️ NOT RECOMMENDED FOR PRODUCTION**

If you just want to test without email verification:

1. Go to Supabase Dashboard → Auth → Providers
2. Toggle off "Confirm email"
3. Users will be auto-confirmed on signup

**Security Warning:** This allows anyone to sign up without verification. Only use for local testing!

---

## Production Checklist

Before going live:

- [ ] Configure custom SMTP with verified domain
- [ ] Enable email confirmation
- [ ] Set up SPF/DKIM/DMARC records
- [ ] Customize email templates with branding
- [ ] Test all email flows (signup, magic link, password reset)
- [ ] Monitor email delivery rates
- [ ] Set up email bounce handling

---

## Current Status

✅ **Emails ARE being sent** (verified in logs)
❌ **Using default Supabase SMTP** (likely landing in spam)
⏳ **Custom SMTP needed** for production

**Next Steps:**
1. Check spam folder for current emails
2. Configure Resend or another SMTP provider
3. Test email delivery
4. Customize email templates

---

## Environment Variables

Your current config:
```env
NEXT_PUBLIC_SUPABASE_URL=https://rfrojhdjyilpxhgcowrk.supabase.co
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SYSTEM_EMAIL_FROM=noreply@zecompaign.com
```

**Note:** `SYSTEM_EMAIL_FROM` is for your app's sending accounts, NOT for Supabase auth emails. Auth email sender is configured in Supabase dashboard.

---

**Last Updated:** July 4, 2026
