# zecompaign Database Migrations

## Applied Migrations

All migrations have been successfully applied to the Supabase database.

### Migration History

1. **create_organizations_and_profiles** (v20260703214044)
   - Core tenant and user tables
   - Organizations table with plan tracking and usage counters
   - Profiles table linked to auth.users
   - Organization members for team management
   - RLS policies for tenant isolation
   - Auto-create triggers for new users

2. **create_sending_accounts_and_keys** (v20260703214116)
   - Sending accounts (SMTP configurations)
   - Gemini keys (AI API keys)
   - Account access permissions
   - Credential encryption functions
   - Account count triggers

3. **create_templates_and_email_tracking** (v20260703214152)
   - Email templates
   - Sent emails audit trail
   - Suppression list (unsubscribe/bounce)
   - Usage logs for billing
   - Audit logs for compliance
   - Email send tracking triggers

4. **create_helper_functions_and_views** (v20260703214322)
   - Dashboard stats view
   - Team activity view
   - User organization functions
   - Access control functions
   - Plan limit checking
   - Audit logging functions
   - User invitation system

5. **add_invoices_table_and_adjustments** (v20260703214500)
   - Invoices table for Stripe billing
   - Invoice management functions
   - Additional RLS policies
   - Vault reference comments

6. **update_plan_limits_match_prd** (v20260703214600)
   - Updated plan limits to match PRD v3.0
   - Fixed BYOS email sending logic
   - Added plan limits helper functions
   - Created organization plan details view

## Database Schema Verification

### All Tables Created ✅

- [x] organizations
- [x] profiles  
- [x] organization_members
- [x] sending_accounts
- [x] account_access
- [x] gemini_keys
- [x] templates
- [x] sent_emails
- [x] suppressed_recipients
- [x] usage_logs
- [x] audit_log
- [x] invoices

### All Views Created ✅

- [x] dashboard_stats
- [x] team_activity
- [x] organization_plan_details

### Row Level Security ✅

All tables have RLS enabled with proper policies.

### Plan Limits (Matching PRD v3.0) ✅

| Plan | SMTP Accounts | Team Members | AI Gen/Month |
|------|--------------|--------------|--------------|
| Free | 3 | 1 | 15 |
| Team | 15 | 5 | 500 |
| Business | Unlimited | 15 | 2,000 |
| Enterprise | Unlimited | Unlimited | Unlimited |

## Verification Queries

Run these queries to verify the database is correctly set up:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check migrations applied
SELECT version, name 
FROM supabase_migrations.schema_migrations 
ORDER BY version;

-- Test plan limits function
SELECT 
    'free' as plan,
    check_plan_limit(gen_random_uuid(), 'smtp_accounts') as can_add_smtp,
    get_plan_limits('free') as limits;

-- Check views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

## Next Steps

### 1. Configure Supabase Auth

Enable authentication providers in Supabase dashboard:
- Email/Password
- Google OAuth
- GitHub OAuth
- Magic Link (passwordless)

### 2. Set Up Stripe Integration

Add Stripe keys to environment variables:
```env
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Configure Supabase Vault (Production)

For production, migrate from pgcrypto to Supabase Vault:
```sql
-- Store credential in Vault
SELECT vault.create_secret('smtp-credential-{id}', 'actual_password');

-- Reference in sending_accounts
UPDATE sending_accounts 
SET credential_ref = 'smtp-credential-{id}'
WHERE id = '{account_id}';
```

### 4. Set Up Scheduled Jobs

Configure pg_cron for monthly counter resets:
```sql
SELECT cron.schedule(
    'reset-monthly-counters',
    '0 0 1 * *',  -- First day of month at midnight
    'SELECT reset_monthly_counters()'
);
```

### 5. Enable Realtime (Optional)

For real-time collaboration features:
```sql
ALTER PUBLICATION supabase_realtime 
ADD TABLE sent_emails, templates, organization_members;
```

## Testing the Database

### Create Test Organization

```sql
-- Will be auto-created when first user signs up via trigger
-- Test manually:
INSERT INTO profiles (id, email, full_name)
VALUES (gen_random_uuid(), 'test@example.com', 'Test User');

-- Organization and membership will be auto-created
```

### Add Test SMTP Account

```sql
INSERT INTO sending_accounts (
    organization_id,
    name,
    provider,
    from_email,
    credential_encrypted,
    created_by
)
VALUES (
    (SELECT id FROM organizations LIMIT 1),
    'Test Gmail',
    'gmail',
    'test@gmail.com',
    encrypt_credential('test_password'),
    (SELECT id FROM profiles LIMIT 1)
);
```

### Check Plan Limits

```sql
SELECT * FROM organization_plan_details;
```

## Troubleshooting

### Issue: RLS blocking queries

**Solution:** Ensure user is authenticated and has proper organization membership:
```sql
SELECT * FROM organization_members WHERE user_id = auth.uid();
```

### Issue: Credential decryption fails

**Solution:** Check encryption key matches:
```sql
SELECT decrypt_credential(credential_encrypted) 
FROM sending_accounts 
WHERE id = '{account_id}';
```

### Issue: Plan limits not working

**Solution:** Verify plan limits function:
```sql
SELECT get_plan_limits('team');
SELECT check_plan_limit('{org_id}', 'smtp_accounts');
```

## Database Maintenance

### Backup Strategy

- Supabase automatic daily backups (7-30 days retention)
- Manual backups before major migrations
- Export critical data regularly

### Performance Monitoring

Monitor these queries:
- Slow RLS policy evaluations
- High row counts in sent_emails, usage_logs
- Index usage on foreign keys

### Data Retention

Consider implementing:
- Archive sent_emails older than 1 year
- Purge usage_logs older than 2 years
- Keep audit_log indefinitely (compliance)

## Security Checklist

- [x] RLS enabled on all tables
- [x] Credentials encrypted
- [x] Audit logging implemented
- [x] Tenant isolation enforced
- [ ] Supabase Vault configured (production)
- [ ] Backup strategy documented
- [ ] Disaster recovery tested
- [ ] Rate limiting configured
- [ ] Database encryption at rest verified

---

**Database Status:** ✅ Ready for Development

Next: Implement API routes and authentication flows.
