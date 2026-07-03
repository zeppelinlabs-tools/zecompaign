# zecompaign — Database Schema Documentation

**Database:** Supabase (PostgreSQL)  
**Schema Version:** 1.0  
**Last Updated:** July 2026

---

## Overview

The zecompaign database is designed for a **multi-tenant B2B SaaS platform** with:
- **Tenant isolation** via `organization_id` (RLS enforced)
- **Role-based access control** (owner, admin, member, viewer)
- **Secure credential storage** (encrypted SMTP passwords, API keys)
- **Audit trails** for compliance (SOC 2, GDPR)
- **Usage tracking** for billing and analytics

---

## Core Tables

### 1. **organizations** (Tenants)
Multi-tenant isolation layer. Each signup creates one organization.

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',  -- free, team, business, enterprise
    plan_expires_at TIMESTAMPTZ,
    
    -- Usage counters (reset monthly)
    emails_sent_this_month INTEGER DEFAULT 0,
    ai_generations_this_month INTEGER DEFAULT 0,
    smtp_accounts_count INTEGER DEFAULT 0,
    storage_used_mb DECIMAL DEFAULT 0,
    
    -- Stripe integration
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Plan Limits:**
| Plan | SMTP Accounts | AI Generations/mo | Team Members |
|------|--------------|-------------------|--------------|
| free | 3 | 15 | 1 |
| team | 15 | 500 | 5 |
| business | Unlimited | 2,000 | 15 |
| enterprise | Unlimited | Custom | Unlimited |

**Indexes:**
- `idx_organizations_slug` on `slug`
- `idx_organizations_stripe_customer` on `stripe_customer_id`

---

### 2. **profiles** (User Accounts)
User authentication and profile data. Created automatically on signup.

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Triggers:**
- `on_auth_user_created`: Auto-creates profile when user signs up
- `on_profile_created`: Auto-creates first organization and makes user owner

---

### 3. **organization_members** (Many-to-Many: Users ↔ Orgs)
Team membership and roles.

```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',  -- owner, admin, member, viewer
    
    invited_by UUID REFERENCES profiles(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);
```

**Roles:**
| Role | Permissions |
|------|-------------|
| owner | Full control, billing, delete org |
| admin | Manage accounts, keys, users; no billing |
| member | Send emails, use AI, manage own templates |
| viewer | Read-only dashboard |

**Indexes:**
- `idx_organization_members_org` on `organization_id`
- `idx_organization_members_user` on `user_id`

---

## Email Infrastructure Tables

### 4. **sending_accounts** (SMTP Configs)
User's SMTP accounts (Resend, Gmail, SendGrid, etc.)

```sql
CREATE TABLE sending_accounts (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    provider TEXT NOT NULL,  -- resend, gmail, sendgrid, mailgun, ses, custom
    from_email TEXT NOT NULL,
    from_name TEXT,
    
    credential_encrypted TEXT NOT NULL,  -- Encrypted password/API key
    
    -- Custom SMTP settings
    host TEXT,
    port INTEGER,
    use_tls BOOLEAN DEFAULT true,
    
    active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    daily_send_limit INTEGER,
    
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Encryption:**
- Credentials encrypted using `pgcrypto` with `encrypt_credential()` function
- Never exposed to browser; decrypted server-side only during sending

**Triggers:**
- `trigger_update_smtp_account_count`: Updates `organizations.smtp_accounts_count`

**Indexes:**
- `idx_sending_accounts_org` on `organization_id`
- `idx_sending_accounts_active` on `active` WHERE `active = true`

---

### 5. **account_access** (Granular Permissions)
Which users can access which SMTP accounts.

```sql
CREATE TABLE account_access (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES sending_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    granted_by UUID REFERENCES profiles(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(account_id, user_id)
);
```

**Access Logic:**
- Owners/admins: See all org accounts automatically
- Members/viewers: Only see accounts with explicit `account_access` entry

---

### 6. **gemini_keys** (AI API Keys)
Google Gemini API keys for template generation.

```sql
CREATE TABLE gemini_keys (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    label TEXT NOT NULL,
    key_encrypted TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'gemini-3.5-flash',
    
    active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,  -- Auto-failover order
    
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Supported Models:**
- `gemini-3.5-flash` (default, fastest)
- `gemini-3.5-pro` (higher quality)
- `gemini-3.1-flash-lite` (cost-efficient)

---

## Content & Campaign Tables

### 7. **templates** (Email Templates)
Saved email templates, shared across team.

```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    
    category TEXT,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,  -- For future marketplace
    
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS:** Users can view all templates in their org, edit own templates, admins can edit all

---

### 8. **sent_emails** (Audit Trail)
Complete history of all emails sent.

```sql
CREATE TABLE sent_emails (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    account_id UUID REFERENCES sending_accounts(id) ON DELETE SET NULL,
    
    recipients JSONB NOT NULL,  -- [{email, name, type: 'to'|'cc'|'bcc'}]
    subject TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT,
    
    account_name TEXT,  -- Cached for display
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, sent, failed
    error_message TEXT,
    
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Analytics
    opened BOOLEAN DEFAULT false,
    clicked BOOLEAN DEFAULT false,
    bounced BOOLEAN DEFAULT false
);
```

**Triggers:**
- `trigger_log_email_send`: Increments `organizations.emails_sent_this_month`, creates usage log

**Indexes:**
- `idx_sent_emails_org` on `organization_id`
- `idx_sent_emails_user` on `user_id`
- `idx_sent_emails_sent_at` on `sent_at DESC`

---

### 9. **suppressed_recipients** (Unsubscribe/Bounce List)
Org-scoped suppression list.

```sql
CREATE TABLE suppressed_recipients (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    email TEXT NOT NULL,
    reason TEXT NOT NULL,  -- unsubscribed, bounced, spam_complaint, manual
    
    suppressed_at TIMESTAMPTZ DEFAULT NOW(),
    suppressed_by UUID REFERENCES profiles(id),
    
    UNIQUE(organization_id, email)
);
```

**Usage:** Checked before every send; suppressed emails are automatically excluded

---

## Tracking & Compliance Tables

### 10. **usage_logs** (Billing Transparency)
Detailed activity log for billing and analytics.

```sql
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    
    event_type TEXT NOT NULL,  -- email_sent, ai_generated, account_added, user_invited
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_usage_logs_org` on `organization_id`
- `idx_usage_logs_created_at` on `created_at DESC`

---

### 11. **audit_log** (Compliance & Security)
Full audit trail for SOC 2, GDPR compliance.

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS:** Only owners and admins can view audit logs

**Indexes:**
- `idx_audit_log_org` on `organization_id`
- `idx_audit_log_created_at` on `created_at DESC`

---

## Helper Functions

### Authentication & Organization Setup

```sql
-- Auto-create profile on signup
handle_new_user() TRIGGER

-- Auto-create organization on profile creation
handle_new_organization() TRIGGER
```

### Encryption

```sql
-- Encrypt credentials (server-side only)
encrypt_credential(credential TEXT) RETURNS TEXT

-- Decrypt credentials (server-side only)
decrypt_credential(encrypted_credential TEXT) RETURNS TEXT
```

### Usage Tracking

```sql
-- Log AI generation, increment counter
log_ai_generation(org_id UUID, usr_id UUID) RETURNS VOID

-- Check if user can send (plan limits)
can_user_send_email(org_id UUID) RETURNS BOOLEAN

-- Reset monthly counters (cron job)
reset_monthly_counters() RETURNS VOID
```

### Access Control

```sql
-- Check plan limits before action
check_plan_limit(org_id UUID, limit_type TEXT) RETURNS BOOLEAN
-- limit_type: 'smtp_accounts', 'ai_generations', 'team_members'

-- Get user's organizations
get_user_organizations(user_uuid UUID) RETURNS TABLE(...)

-- Get accounts accessible by user
get_user_accessible_accounts(user_uuid UUID, org_id UUID) RETURNS TABLE(...)

-- Invite user to organization
invite_user_to_organization(org_id UUID, inviter_id UUID, invitee_email TEXT, user_role TEXT) RETURNS UUID
```

### Audit Logging

```sql
-- Log audit event
log_audit_event(
    org_id UUID,
    usr_id UUID,
    evt_action TEXT,
    evt_resource_type TEXT,
    evt_resource_id UUID DEFAULT NULL,
    evt_details JSONB DEFAULT NULL,
    evt_ip_address INET DEFAULT NULL,
    evt_user_agent TEXT DEFAULT NULL
) RETURNS VOID
```

---

## Views

### dashboard_stats
Pre-aggregated dashboard metrics per organization.

```sql
SELECT 
    organization_id,
    organization_name,
    plan,
    emails_sent_this_month,
    ai_generations_this_month,
    smtp_accounts_count,
    team_members_count,
    successful_sends,
    failed_sends,
    template_count
FROM dashboard_stats
WHERE organization_id = :current_org_id;
```

### team_activity
Recent team activity feed with user details.

```sql
SELECT 
    user_name,
    user_email,
    action,
    resource_type,
    details,
    created_at
FROM team_activity
WHERE organization_id = :current_org_id
ORDER BY created_at DESC
LIMIT 50;
```

---

## Row Level Security (RLS)

**ALL tables have RLS enabled.** Access is enforced at the database level, not just the UI.

### Key RLS Policies

**Organizations:**
```sql
-- Users can only view organizations they belong to
WHERE id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())

-- Only owners can update organization
WHERE role = 'owner'
```

**Sending Accounts:**
```sql
-- Users can view accounts in their organizations
WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())

-- Owners and admins can manage accounts
WHERE role IN ('owner', 'admin')
```

**Sent Emails:**
```sql
-- Users can view sent emails in their organizations
WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
```

**Audit Logs:**
```sql
-- Only owners and admins can view audit logs
WHERE role IN ('owner', 'admin')
```

---

## Migrations Applied

1. **create_organizations_and_profiles** — Core tenant and user tables
2. **create_sending_accounts_and_keys** — SMTP accounts, Gemini keys, access control
3. **create_templates_and_email_tracking** — Templates, sent emails, suppression, usage tracking
4. **create_helper_functions_and_views** — Helper functions, views, utilities

---

## Usage Examples

### Create New Organization (Auto-triggered)
```sql
-- Happens automatically on signup via triggers
-- User signs up → profile created → organization created → user added as owner
```

### Add SMTP Account
```sql
INSERT INTO sending_accounts (
    organization_id,
    name,
    provider,
    from_email,
    credential_encrypted,
    created_by
) VALUES (
    :org_id,
    'Newsletter Account',
    'resend',
    'news@example.com',
    encrypt_credential('re_apikey_xyz'),
    :user_id
);
```

### Check Plan Limits Before Action
```sql
SELECT check_plan_limit(:org_id, 'smtp_accounts');
-- Returns true if can add more accounts, false if at limit
```

### Get User's Accessible Accounts
```sql
SELECT * FROM get_user_accessible_accounts(:user_id, :org_id);
-- Returns only accounts user has access to (via role or explicit grant)
```

### Send Email (With Tracking)
```sql
INSERT INTO sent_emails (
    organization_id,
    user_id,
    account_id,
    recipients,
    subject,
    body_html,
    status
) VALUES (
    :org_id,
    :user_id,
    :account_id,
    '[{"email": "user@example.com", "name": "John", "type": "to"}]'::jsonb,
    'Welcome to zecompaign',
    '<h1>Hello!</h1>',
    'sent'
);
-- Trigger automatically increments emails_sent_this_month and creates usage log
```

### Log Audit Event
```sql
SELECT log_audit_event(
    :org_id,
    :user_id,
    'account_created',
    'sending_account',
    :account_id,
    '{"provider": "resend", "from_email": "news@example.com"}'::jsonb,
    :ip_address::inet,
    :user_agent
);
```

---

## Security Considerations

### ✅ Implemented
- **Row Level Security** on all tables
- **Credential encryption** via pgcrypto
- **Audit trails** for all sensitive actions
- **Tenant isolation** enforced at DB level
- **Role-based access control**
- **Secure functions** with `SECURITY DEFINER`

### 🔄 TODO (Production)
- Migrate to **Supabase Vault** for credential storage (more secure than pgcrypto)
- Implement **API key rotation** system
- Add **rate limiting** at database level
- Implement **backup and disaster recovery**
- Add **database encryption at rest**
- Set up **automated monthly counter reset** (cron job)

---

## Performance Optimization

### Indexes Created
- All foreign keys indexed
- Common query patterns indexed (org_id, user_id, created_at)
- Partial indexes on active records only
- Unique constraints on critical fields

### Future Optimizations
- **Partitioning** for large tables (sent_emails, usage_logs, audit_log)
- **Materialized views** for dashboard stats
- **Query caching** for frequently accessed data
- **Connection pooling** via Supabase

---

## Backup & Recovery

**Supabase Automated Backups:**
- Daily backups (retained 7 days on free, 30+ days on paid)
- Point-in-time recovery (PITR) on paid plans
- Manual backups via `pg_dump`

**Critical Data:**
- Organizations, profiles, organization_members
- Sending accounts (encrypted credentials)
- Sent emails (audit trail)
- Audit logs (compliance)

---

## Monitoring & Alerts

**Key Metrics to Monitor:**
- Row counts per organization (detect data leaks)
- RLS policy performance (slow queries)
- Failed email sends (status = 'failed')
- Credential decryption failures
- Plan limit violations

**Alerts:**
- Organization approaching plan limits
- Unusual spike in emails sent
- Failed authentication attempts
- Credential decryption errors

---

## Database Schema Diagram (ERD)

```
organizations (tenant)
    ├── organization_members (roles)
    │   └── profiles (users)
    ├── sending_accounts (SMTP)
    │   └── account_access (permissions)
    ├── gemini_keys (AI)
    ├── templates (content)
    ├── sent_emails (audit trail)
    ├── suppressed_recipients (compliance)
    ├── usage_logs (billing)
    └── audit_log (security)
```

---

**zecompaign Database v1.0 — Designed for B2B SaaS Scale**
