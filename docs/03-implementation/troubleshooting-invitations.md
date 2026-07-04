# Troubleshooting Invitation Issues

## Problem: "Invalid or expired invitation" on first open

### Symptoms
- User clicks invitation link for the first time
- Gets "Invalid or expired invitation" error
- Invitation shows as pending in Team Members page

### Possible Causes

#### 1. **Old Invitation Link (Pre-Token Migration)**
If the invitation was created before the security improvements were deployed, it uses the old URL format:
```
❌ OLD: /signup?email=user@example.com&org=123-456-789
✅ NEW: /accept-invite?token=abc123...
```

**Solution:**
1. Go to Team Members page
2. Find the pending invitation
3. Click **"Resend"** button
4. This generates a new secure token and sends fresh email

#### 2. **Email Client Modified the URL**
Some email clients or security scanners modify URLs by:
- Adding tracking parameters
- Removing characters
- URL encoding the token differently

**Solution:**
1. Copy the URL from email
2. Check if token parameter is intact: `/accept-invite?token=LONG_HEX_STRING`
3. Try opening in different browser or incognito mode

#### 3. **Token Mismatch in Database**
The invitation exists but token doesn't match.

**Check logs:**
```
🔍 Looking up invitation with token: c1a8085b3b31b98b...
❌ Invitation lookup error: { code: 'PGRST116', ... }
```

**Solution:**
Run this SQL to check invitation:
```sql
SELECT email, token, status, expires_at 
FROM organization_invitations 
WHERE email = 'user@example.com' 
AND status = 'pending';
```

Then compare the token in URL with database token.

#### 4. **RLS Policy Blocking Access**
Row Level Security might be preventing unauthenticated users from reading invitations.

**Check policies:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'organization_invitations';
```

**Solution:**
Ensure there's a policy allowing public read access to pending invitations:
```sql
CREATE POLICY "Anyone can view pending invitations by token"
  ON organization_invitations FOR SELECT
  TO anon, authenticated
  USING (status = 'pending' AND expires_at > NOW());
```

#### 5. **Invitation Already Accepted/Expired**
The invitation was used or expired.

**Check status:**
```sql
SELECT status, expires_at, accepted_at 
FROM organization_invitations 
WHERE token = 'TOKEN_FROM_URL';
```

**Solution:**
- If accepted: User is already a member
- If expired: Use "Resend" to create fresh invitation

---

## Debugging Steps

### Step 1: Check Server Logs
When you open the invitation link, check logs for:
```
🔍 Looking up invitation with token: ...
✅ Found invitation: { email: ..., role: ..., organization: ... }
```

Or error:
```
❌ Invitation lookup error: { code: ..., message: ... }
```

### Step 2: Verify Token in Database
```sql
-- Find invitation by email
SELECT id, email, token, status, expires_at, created_at
FROM organization_invitations
WHERE email = 'YOUR_EMAIL'
ORDER BY created_at DESC;

-- Copy the token and check if it matches URL
```

### Step 3: Test Query Manually
```sql
-- Use actual token from URL
SELECT *, organization:organization_id(name, slug)
FROM organization_invitations
WHERE token = 'TOKEN_FROM_URL'
  AND status = 'pending'
  AND expires_at > NOW();
```

### Step 4: Check RLS Policies
```sql
-- Check if anon users can access
SET ROLE anon;
SELECT * FROM organization_invitations WHERE token = 'TOKEN_FROM_URL';
RESET ROLE;
```

---

## Quick Fixes

### Fix 1: Resend Invitation (Recommended)
1. Admin/Owner goes to Team Members
2. Finds pending invitation
3. Clicks "Resend" button
4. User receives new email with secure token

### Fix 2: Cancel and Recreate
1. Admin/Owner cancels old invitation
2. Creates new invitation with same email
3. New token generated automatically

### Fix 3: Manual Token Update (Advanced)
```sql
-- Generate new token for existing invitation
UPDATE organization_invitations
SET token = encode(gen_random_bytes(32), 'hex'),
    expires_at = NOW() + INTERVAL '7 days'
WHERE email = 'user@example.com'
  AND status = 'pending';

-- Get the new token
SELECT email, token FROM organization_invitations
WHERE email = 'user@example.com' AND status = 'pending';

-- Share new URL: /accept-invite?token=NEW_TOKEN
```

---

## Prevention

### For Admins:
- Always use "Resend" instead of sharing old links
- Check invitation status before troubleshooting
- Clean up expired invitations regularly

### For Developers:
- Monitor server logs for invitation errors
- Set up alerts for high error rates
- Run cleanup job for expired invitations:
```sql
SELECT cleanup_expired_sessions();
```

---

## Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `PGRST116` | No rows found | Token not in database or wrong token |
| `23505` | Duplicate key | User already invited (use Resend) |
| `42501` | Insufficient privileges | RLS blocking access |

---

## Support Checklist

When user reports invitation issues, ask for:
- [ ] Screenshot of error page
- [ ] Full invitation URL (redact sensitive parts)
- [ ] User's email address
- [ ] When invitation was sent
- [ ] Browser and device info
- [ ] Server logs (timestamp of access)

Then:
1. Check invitation exists: `SELECT * FROM organization_invitations WHERE email = '...'`
2. Verify token matches
3. Check expiration: `expires_at > NOW()`
4. Verify status is 'pending'
5. Test RLS policies
6. If all fails: Resend invitation

---

## Related Documentation
- [Invitation Security Improvements](./invitation-security-improvements.md)
- [Email Sending Setup](./email-sending-setup.md)
