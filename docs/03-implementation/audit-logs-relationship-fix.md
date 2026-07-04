# Audit Logs Relationship Fix

**Date:** July 5, 2026  
**Issue:** "Could not find a relationship between 'email_audit_logs' and 'sent_by' in the schema cache"

---

## 🐛 Problem

The `email_audit_logs` table had a `sent_by` column that referenced `auth.users`, but the query was trying to join it directly with the `profiles` table using Supabase's automatic relationship syntax:

```typescript
.select(`
  *,
  sent_by_profile:sent_by(full_name, email, avatar_url),
  smtp_account:smtp_account_id(from_name, from_email)
`)
```

This failed because there was no foreign key relationship from `sent_by` to `profiles`.

---

## ✅ Solution

### 1. **Created a Database View**

Instead of trying to fix the foreign key chain, we created a view that pre-joins the data:

```sql
CREATE VIEW email_audit_logs_with_profiles AS
SELECT 
  eal.*,
  p.full_name as sent_by_name,
  p.email as sent_by_email,
  p.avatar_url as sent_by_avatar,
  sa.from_name as smtp_from_name,
  sa.from_email as smtp_from_email
FROM email_audit_logs eal
LEFT JOIN profiles p ON eal.sent_by = p.id
LEFT JOIN sending_accounts sa ON eal.smtp_account_id = sa.id;
```

**Benefits:**
- Simpler queries (no complex joins in application code)
- Better performance (view can be optimized by PostgreSQL)
- Easier to maintain

### 2. **Updated Query to Use View**

**Before:**
```typescript
supabase
  .from('email_audit_logs')
  .select(`
    *,
    sent_by_profile:sent_by(full_name, email, avatar_url),
    smtp_account:smtp_account_id(from_name, from_email)
  `)
```

**After:**
```typescript
supabase
  .from('email_audit_logs_with_profiles')
  .select('*')
```

### 3. **Updated Component Data Access**

**Before:**
```typescript
{log.sent_by_profile?.full_name || log.sent_by_profile?.email || 'Unknown'}
{log.smtp_account?.from_name || 'Platform'}
```

**After:**
```typescript
{log.sent_by_name || log.sent_by_email || 'Unknown'}
{log.smtp_from_name || 'Platform'}
```

### 4. **Added RLS Policies**

Added proper Row-Level Security policies for the audit logs table:

1. **View Policy**: Admins/owners can view their org's audit logs
2. **Insert Policy**: Authenticated users can insert audit logs for their orgs
3. **Update Policy**: Admins/owners can update their org's audit logs
4. **Service Role Policy**: Full access for QStash webhook operations

---

## 📝 Files Modified

1. **lib/actions/audit.ts**
   - Changed query to use `email_audit_logs_with_profiles` view
   - Updated CSV export to use view columns

2. **components/AuditLogs.tsx**
   - Changed `log.sent_by_profile?.full_name` to `log.sent_by_name`
   - Changed `log.smtp_account?.from_name` to `log.smtp_from_name`

3. **Database Migrations**
   - `fix_email_audit_logs_foreign_keys` - Added foreign key to auth.users
   - `update_email_audit_logs_view_with_smtp` - Created comprehensive view
   - `add_rls_for_audit_logs_proper` - Added RLS policies

---

## 🧪 Testing

After these changes, the audit logs page should:

✅ Load without errors  
✅ Display sender names correctly  
✅ Display SMTP account names correctly  
✅ Export CSV with correct data  
✅ Respect organization access (admin/owner only)  

---

## 🔍 Verification Steps

1. **Check view exists:**
```sql
SELECT * FROM email_audit_logs_with_profiles LIMIT 1;
```

2. **Check RLS policies:**
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'email_audit_logs';
```

3. **Test the page:**
- Navigate to `/audit-logs`
- Should load without errors
- If no data, send a test invitation first

---

## 💡 Why This Approach?

**Alternative 1: Fix Foreign Key Chain**
- Would require `sent_by` → `profiles` FK
- But `sent_by` already references `auth.users`
- Would need to change schema significantly

**Alternative 2: Manual Joins in Code**
- More complex application code
- Multiple database queries
- Harder to maintain

**Our Approach: Database View** ✅
- Simple application code
- Single query
- PostgreSQL optimizes the join
- Easy to extend with more columns

---

## 🚀 Status

**FIXED** ✅ - Audit logs page should now work correctly.

---

**Last Updated:** July 5, 2026  
**Status:** Resolved
