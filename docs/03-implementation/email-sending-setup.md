# Email Sending Setup for zecompaign

## Overview

zecompaign sends transactional emails (like team invitations) using **nodemailer** with SMTP accounts. The system follows the "dogfooding" philosophy by using your own SMTP accounts configured in the platform.

## Email Sending Priority

The email sender checks for SMTP configuration in this order:

1. **Organization SMTP Account** (preferred) - Uses the organization's configured SMTP account
2. **Platform SMTP** (fallback) - Uses platform-level SMTP from environment variables
3. **Error** - No SMTP available

## Setup Options

### Option 1: Use Organization SMTP (Recommended)

1. Go to **SMTP Settings** in your organization dashboard
2. Click "Add SMTP Account"
3. Configure your SMTP details:
   - **SMTP Host**: e.g., `smtp.gmail.com`, `smtp.sendgrid.net`
   - **SMTP Port**: Usually `587` (TLS) or `465` (SSL)
   - **Username**: Your SMTP username/email
   - **Password**: Your SMTP password or app password
   - **From Name**: Display name for emails
   - **From Email**: Email address to send from
4. Test the connection
5. Mark as verified

Once configured, all transactional emails (invitations, notifications) will be sent from this account.

### Option 2: Platform-Level SMTP (Fallback)

Add these environment variables to `.env.local`:

```bash
# Platform SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@zecompaign.com
```

**Note**: This is a fallback and will only be used if the organization doesn't have an SMTP account configured.

## Common SMTP Providers

### Gmail

- **Host**: `smtp.gmail.com`
- **Port**: `587` (TLS) or `465` (SSL)
- **Note**: You need an [App Password](https://support.google.com/accounts/answer/185833)

### SendGrid

- **Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **Username**: `apikey`
- **Password**: Your SendGrid API key

### Mailgun

- **Host**: `smtp.mailgun.org`
- **Port**: `587`
- **Username**: Your Mailgun SMTP username
- **Password**: Your Mailgun SMTP password

### AWS SES

- **Host**: `email-smtp.us-east-1.amazonaws.com` (region-specific)
- **Port**: `587`
- **Username**: Your AWS SES SMTP username
- **Password**: Your AWS SES SMTP password

## Testing Email Sending

1. Go to **Team Settings** in your organization
2. Click "Invite Member"
3. Enter an email address that doesn't exist on the platform yet
4. Click "Send Invitation"
5. Check your server logs for email sending status:
   - ✅ Success: `Invitation email sent successfully!`
   - ❌ Failure: Error details will be logged

## Troubleshooting

### No SMTP Configuration Available

**Error**: `No SMTP configuration available. Please configure an SMTP account.`

**Solution**: Add an SMTP account in your organization settings or configure platform-level SMTP in `.env.local`.

### Authentication Failed

**Error**: `Invalid login`, `535 Authentication failed`

**Solutions**:
- Verify username and password are correct
- For Gmail: Use an App Password, not your regular password
- Check if 2FA is enabled on your email account
- Verify the SMTP host and port are correct

### Connection Timeout

**Error**: `Connection timeout`, `ETIMEDOUT`

**Solutions**:
- Check firewall settings
- Verify the SMTP port is correct (587 for TLS, 465 for SSL)
- Try using port 587 with TLS instead of port 465

### Email Not Received

**Possible Issues**:
- Check spam/junk folder
- Verify the "From Email" is properly configured
- Check SMTP provider logs for delivery status
- Some providers require email verification

## Email Templates

The invitation email includes:
- zecompaign branding
- Organization name
- Inviter name
- Role assignment
- Call-to-action button
- Expiration date (7 days)

Templates are located in `lib/email-sender.ts` and can be customized.

## Security Best Practices

1. **Never commit SMTP credentials** to version control
2. **Use App Passwords** for Gmail instead of account passwords
3. **Store credentials securely** in environment variables or Supabase Vault
4. **Use TLS/SSL** for SMTP connections (port 587 or 465)
5. **Limit SMTP permissions** to send-only if possible

## Future Enhancements

- [ ] Add email delivery tracking
- [ ] Support multiple SMTP accounts per organization
- [ ] Add email rate limiting
- [ ] Support custom email templates per organization
- [ ] Add email queue for better reliability
- [ ] Integration with transactional email services (Resend, Postmark)
