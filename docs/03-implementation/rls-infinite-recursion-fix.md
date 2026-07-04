# RLS Infinite Recursion Fix - Critical Database Issue

## Date
2026-07-04 (Updated: Multiple fixes throughout the day)

## Severity
**CRITICAL** - App was failing on billing page, organization creation, and other operations

## Issues Found

### Issue 1: SELECT Policies (Morning)
Infinite recursion error in Row Level Security (RLS) policies during SELECT operations

### Issue 2: INSERT Policies (Afternoon)  
Infinite recursion error during organization creation (onboarding) when inserting first organization member

## Root Causes

### Issue 1: Circular SELECT Policy Dependencies

**organizations** table SELECT policy:
```sql
-- Checked organization_members to see if user is a member
WHERE id IN (
  SELECT organization_id FROM organization_members 
  WHERE user_id = auth.uid()
)
```

**organization_members** table SELECT policy:
```sql
-- Also checked organization_members (itself!)
WHERE organization_id IN (
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid()
)
```

### Issue 2: INSERT Policy Recursion (Onboarding)

**Problem During Onboarding**:
```sql
-- INSERT policy checked if user is owner/admin
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
)
```

**The Catch-22**:
- User tries to create first organization
- System tries to INSERT first row into organization_members
- INSERT policy checks: "Is user already owner/admin?"
- Queries organization_members table (which is empty!)
- Causes recursion when trying to validate against itself

**Result**: Cannot create organizations - onboarding fails

## Solutions Applied

### Solution 1: Fix SELECT Policies (Morning) ✅

[Previous content remains the same...]

### Solution 2: Use Service Role Client for Organization Creation (Afternoon) ✅

**The Real Problem**: During onboarding, we have a chicken-and-egg problem:
- User needs to INSERT a row into `organization_members` to become an owner
- But INSERT policy checks if user is already an owner/admin
- User isn't an owner yet because the row doesn't exist!
- This causes infinite recursion

**Why SECURITY DEFINER Functions Failed**:
- Even with SECURITY DEFINER, the function still had to query `organization_members`
- That query triggered RLS policies
- RLS policies triggered the function again → infinite loop

**The Solution**: Bypass RLS entirely during organization creation
1. Created `createServiceRoleClient()` in `lib/supabase/server.ts`
2. Service role client uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses all RLS
3. Updated `createOrganization()` server action to use service role client
4. Updated onboarding page to call server action instead of direct client insert
5. Added rollback logic to delete org if member creation fails

**Security Considerations**:
- Service role client is only used server-side (never exposed to client)
- User authentication is still validated via `supabase.auth.getUser()`
- Only used for the specific use case of creating first organization + membership
- Added clear documentation warnings about service role usage

**Code Changes**:
```typescript
// lib/supabase/server.ts
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// lib/actions/organizations.ts  
export async function createOrganization(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser() // Still validate auth
  
  const serviceClient = createServiceRoleClient() // Bypass RLS
  
  // Create org and add user as owner using service client
  const { data: org } = await serviceClient.from('organizations').insert(...)
  await serviceClient.from('organization_members').insert(...)
}

// app/onboarding/page.tsx
async function handleSubmit(e: React.FormEvent) {
  const result = await createOrganization(orgName.trim()) // Server action
  if (result.error) setError(result.error)
  else router.push('/dashboard')
}
```

### Organizations Table Policies

1. **SELECT**: Users can view organizations they are members of
   - Uses simple `EXISTS` clause
   - No nested subqueries

2. **INSERT**: Users can create organizations
   - Allows anyone to create (they become owner via org_members)

3. **UPDATE**: Only owners can update
   - Direct EXISTS check on organization_members

4. **DELETE**: Only owners can delete
   - Direct EXISTS check on organization_members

### Organization Members Table Policies

1. **SELECT**: Users can view members of their organizations
   - Simple IN clause with single-level subquery

2. **INSERT**: Users can add themselves OR owners/admins can add others
   - Handles organization creation and invitations

3. **UPDATE**: Owners and admins can update member roles
   - Part of ALL policy

4. **DELETE**: Users can remove themselves OR owners/admins can remove others
   - Handles leaving and member management

5. **ALL**: Owners and admins have full access
   - Covers INSERT, UPDATE, DELETE for admin operations

## Migration Applied

**File**: `20260704_fix_rls_infinite_recursion.sql`

**Changes**:
- Dropped 4 problematic policies
- Created 10 new, properly structured policies
- Added missing INSERT and DELETE policies
- Used simple EXISTS and IN clauses instead of complex nested queries

## Testing Performed

- ✅ Billing page loads without errors
- ✅ Organization switching works
- ✅ Can create new organizations (onboarding)
- ✅ Can delete organizations (owners only)
- ✅ Can leave organizations (non-owners)
- ✅ Team management still works
- ✅ First-time user onboarding creates organization successfully
- ✅ Service role client properly bypasses RLS during org creation
- ✅ User authentication still validated before organization creation

## Impact

**Before (Issue 1 - Morning)**: 
- Billing page showed empty/failed
- Any query touching organizations table could fail
- Potential cascade failures across app

**After (Issue 1 Fixed)**:
- All pages load correctly
- RLS properly enforces permissions
- No performance degradation

**Before (Issue 2 - Afternoon)**:
- New users could not complete onboarding
- Organization creation failed with infinite recursion
- App was completely unusable for new signups

**After (Issue 2 Fixed)**:
- Onboarding works perfectly
- New users automatically become owners
- Service role client safely bypasses RLS for this specific use case
- Security still maintained via server-side auth validation

## Key Learnings

1. **Avoid Policy Self-References**: Never have a policy query the same table it's protecting
2. **Use Simple Conditions**: EXISTS and simple subqueries are better than complex joins in policies
3. **Test RLS Thoroughly**: Always test policies with real data to catch recursion
4. **Complete Policy Set**: Ensure all operations (SELECT, INSERT, UPDATE, DELETE) have policies
5. **Service Role for Bootstrapping**: Use service role client (with caution!) for operations that happen before user has proper permissions (like onboarding)
6. **SECURITY DEFINER Limitations**: Even SECURITY DEFINER functions can't escape RLS if they query the same tables protected by RLS
7. **Server-Side Service Role Only**: Never expose service role key to client - only use in server actions

## Related Issues

This fixes:
- Empty billing page
- Organization data not loading
- Potential failures on other organization-dependent pages

## Prevention

To prevent this in future:
1. Review policies for circular dependencies before applying
2. Use RPC functions for complex queries that need to bypass RLS
3. Keep policies simple and focused
4. Test with `explain analyze` to spot recursion early

## Files Modified

- Database migration: Applied via Supabase MCP (Issue 1)
- `app/(dashboard)/billing/page.tsx`: Removed debug logs, kept fallback (Issue 1)
- `lib/supabase/server.ts`: Added `createServiceRoleClient()` function (Issue 2)
- `lib/actions/organizations.ts`: Updated `createOrganization()` to use service role client (Issue 2)
- `app/onboarding/page.tsx`: Changed from direct client insert to server action call (Issue 2)
- `docs/03-implementation/rls-infinite-recursion-fix.md`: Updated documentation (Both issues)

## Documentation References

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Database Schema](../02-design/database-schema.md)
