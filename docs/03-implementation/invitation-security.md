# Invitation Security Implementation

## Overview

The team invitation system uses **cryptographically secure tokens** to prevent unauthorized access to organizations. This document explains the security measures in place.

## Security Vulnerabilities Fixed

### ❌ Before (Insecure)

```
Invitation URL: /signup?email=user@example.com&org=abc-123
```

**Problems:**
1. ❌ No token verification - anyone could manipulate URL parameters
2. ❌ Organization ID exposed in URL - can be guessed or brute-forced
3. ❌ Email parameter can be changed - wrong person could join
4. ❌ No cryptographic proof - can't verify invitation legitimacy
5. ❌ Database trigger auto-accepted ANY new user matching email

### ✅ After (Secure)

```
Invitation URL: /accept-invite?token=a3f5e9b2c7d1...
```

**Security Measures:**
1. ✅ **Cryptographic token** (32-byte random, hex-encoded = 64 characters)
2. ✅ **Organization ID hidden** - not exposed in URL
3. ✅ **Email verification** - server validates email matches invitation
4. ✅ **Explicit acceptance** - user must explicitly accept invitation
5. ✅ **Expiration tracking** - invitations expire after 7 days
6. ✅ **Single-use tokens** - token marked as used after acceptance

## Token Generation

```typescript
const crypto = require('crypto')
const token = crypto.randomBytes(32).toString('hex')
// Generates: "a3f5e9b2c7d18f4e6b9a1c5e8d2f7b4a..."
```

- **Entropy**: 256 bits (32 bytes)
- **Format**: Hexadecimal (64 characters)
- **Uniqueness**: Database enforces unique constraint
- **Storage**: Stored in `organization_invitations.token` column

## Invitation Flow

### 1. Invite Team Member (Admin/Owner)

```typescript
inviteTeamMember(orgId, email, role)
↓
1. Validate permissions (owner/admin only)
2. Generate secure token
3. Create invitation record
4. Send email with token URL
```

**Database Record:**
```sql
INSERT INTO organization_invitations (
  organization_id,
  email,
  role,
  token,
  invited_by,
  expires_at
)
```

### 2. User Clicks Invitation Link

```
URL: /accept-invite?token=abc123...
↓
1. Extract token from URL
2. Lookup invitation by token
3. Check status = 'pending'
4. Check expires_at > NOW()
5. Display invitation details
```

### 3. User Accepts Invitation

```typescript
acceptInvitation(token)
↓
1. Verify user is authenticated
2. Call RPC function with token + user_id
3. Function validates:
   - Token exists and is pending
   - Not expired
   - User email matches invitation email
4. Add user to organization_members
5. Mark invitation as 'accepted'
```

## Database Security

### RPC Function: `accept_invitation_with_token`

```sql
CREATE FUNCTION accept_invitation_with_token(
  p_token TEXT,
  p_user_id UUID
)
RETURNS JSON
SECURITY DEFINER
```

**Security Features:**
- ✅ **SECURITY DEFINER** - Runs with elevated privileges to bypass RLS
- ✅ **Row-level locking** - `FOR UPDATE` prevents race conditions
- ✅ **Email verification** - Checks `auth.users.email` matches invitation
- ✅ **Duplicate prevention** - Checks if user already a member
- ✅ **Status update** - Marks invitation as accepted
- ✅ **Transaction safety** - Atomic operation with error handling

### Invitation Table Schema

```sql
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled')),
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookups
CREATE INDEX idx_organization_invitations_token 
ON organization_invitations(token) 
WHERE status = 'pending';
```

## Attack Prevention

### 1. Token Guessing Attack

**Attack**: Try to guess valid tokens by brute force

**Prevention**:
- 256-bit entropy = 2^256 possible values
- Practically impossible to guess
- Rate limiting on invitation endpoints (recommended)

### 2. Token Reuse Attack

**Attack**: Use the same token multiple times

**Prevention**:
- Status changes to 'accepted' after first use
- RPC function checks `status = 'pending'`
- Token becomes invalid after acceptance

### 3. Email Spoofing Attack

**Attack**: Sign up with different email to claim invitation

**Prevention**:
- RPC function verifies `auth.users.email = invitation.email`
- Server-side validation, not client-side
- Cannot be bypassed by manipulating requests

### 4. Invitation Hijacking

**Attack**: Intercept invitation email and accept before recipient

**Prevention**:
- Email verification required (only invited email can accept)
- HTTPS protects email content in transit
- Email provider security is user's responsibility

### 5. Expired Invitation Attack

**Attack**: Use old invitation after expiration

**Prevention**:
- RPC function checks `expires_at > NOW()`
- 7-day expiration window
- Admins can resend invitations with new tokens

### 6. Organization ID Enumeration

**Attack**: Discover organization IDs to target

**Prevention**:
- Organization IDs not exposed in invitation URLs
- Token is the only public identifier
- Cannot derive organization from token

## Email Security

### Invitation Email Content

- ✅ **Token embedded in URL** - `/accept-invite?token=...`
- ✅ **No sensitive data** - Organization name only (not ID)
- ✅ **Clear expiration** - "Expires in 7 days"
- ✅ **Single-use notice** - User informed token is one-time
- ✅ **Support contact** - Help if invitation seems suspicious

### SMTP Security

- ✅ **TLS/SSL encryption** - Protects email in transit
- ✅ **Authenticated sending** - SMTP credentials required
- ✅ **SPF/DKIM/DMARC** - Prevents email spoofing (user's responsibility)

## Best Practices

### For Administrators

1. **Verify email addresses** before sending invitations
2. **Cancel unused invitations** when team member won't join
3. **Monitor pending invitations** in team settings
4. **Use strong SMTP passwords** for email security
5. **Enable 2FA** on admin accounts

### For Recipients

1. **Verify sender** - Check email is from legitimate domain
2. **Check organization name** - Ensure it matches expectation
3. **Don't share invitation links** - They're unique to your email
4. **Accept promptly** - Invitations expire after 7 days
5. **Report suspicious invitations** to support

### For Developers

1. **Never log tokens** in production
2. **Use HTTPS only** - No HTTP in production
3. **Implement rate limiting** on invitation endpoints
4. **Monitor for unusual patterns** (mass invitations, etc.)
5. **Regular security audits** of invitation flow

## Compliance

### GDPR Considerations

- Email addresses stored with consent (invitation implies consent)
- Users can request invitation deletion (cancel invitation)
- Personal data (email) encrypted in transit and at rest
- Right to be forgotten: Delete invitation records

### Security Standards

- ✅ **OWASP Top 10** - Prevents broken access control
- ✅ **CWE-639** - Authorization bypass prevention
- ✅ **NIST 800-63B** - Authenticator and verifier requirements

## Testing Security

### Manual Tests

1. **Token validation**:
   ```bash
   # Try to accept with invalid token
   curl /accept-invite?token=invalid
   # Should return: Invalid or expired invitation
   ```

2. **Email mismatch**:
   ```bash
   # Sign up with different email than invited
   # Should return: Email does not match invitation
   ```

3. **Expired invitation**:
   ```bash
   # Try to accept invitation after 7 days
   # Should return: Invalid or expired invitation
   ```

4. **Duplicate acceptance**:
   ```bash
   # Try to accept same invitation twice
   # Should return: Invalid or expired invitation
   ```

### Automated Tests (TODO)

- [ ] Test token generation uniqueness
- [ ] Test token expiration logic
- [ ] Test email verification
- [ ] Test duplicate prevention
- [ ] Test RLS policies don't leak data
- [ ] Test rate limiting on invitation endpoints

## Monitoring

### Metrics to Track

- **Invitation acceptance rate** - % of invitations accepted
- **Time to acceptance** - How long users take to accept
- **Expired invitations** - Count of unused invitations
- **Failed acceptance attempts** - Invalid tokens, email mismatches
- **Suspicious patterns** - Multiple failed attempts, unusual timing

### Alerts to Configure

- 🚨 **High failure rate** - Many invalid token attempts
- 🚨 **Mass invitations** - Single user inviting many people quickly
- 🚨 **Unusual acceptance patterns** - Acceptances from unexpected locations
- 🚨 **Email delivery failures** - SMTP errors

## Future Enhancements

- [ ] Add rate limiting (max 10 invitations per hour per admin)
- [ ] Add invitation analytics dashboard
- [ ] Support for invitation templates
- [ ] Bulk invitation feature with CSV upload
- [ ] Invitation reminder emails (after 3 days, 6 days)
- [ ] Custom expiration periods per organization
- [ ] Webhook notifications for invitation events
- [ ] Two-factor verification for sensitive organizations
