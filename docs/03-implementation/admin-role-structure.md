# zecompaign Admin Role Structure

## Date
2026-07-04

## Overview
zecompaign has **two separate role systems**:
1. **Organization Roles** - For team members within an organization
2. **Platform Admin Roles** - For platform-level administration

---

## 1. Organization Roles (Team-Level)

These roles apply to **users within an organization** and control what team members can do.

### Role Hierarchy

| Role | Level | Permissions | Use Case |
|------|-------|-------------|----------|
| **owner** | Highest | Full control including billing, delete org, manage all members | Organization creator, founder |
| **admin** | High | Manage accounts, keys, users; NO billing access | Team lead, operations manager |
| **member** | Standard | Send emails, use AI, manage own templates | Marketing team members |
| **viewer** | Lowest | Read-only dashboard access | Stakeholders, observers |

### Detailed Permissions Matrix

| Permission | owner | admin | member | viewer |
|------------|-------|-------|--------|--------|
| **Billing & Organization** |
| View billing page | ✅ | ✅ | ✅ | ✅ |
| Request plan upgrade | ✅ | ✅ | ✅ | ❌ |
| View payment history | ✅ | ✅ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |
| Update org settings | ✅ | ❌ | ❌ | ❌ |
| **Team Management** |
| Invite team members | ✅ | ✅ | ❌ | ❌ |
| Remove team members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅ | ❌ | ❌ |
| View team members | ✅ | ✅ | ✅ | ✅ |
| **SMTP Accounts** |
| Add SMTP accounts | ✅ | ✅ | ❌ | ❌ |
| Edit SMTP accounts | ✅ | ✅ | ❌ | ❌ |
| Delete SMTP accounts | ✅ | ✅ | ❌ | ❌ |
| View SMTP accounts | ✅ | ✅ | ✅* | ✅* |
| Test SMTP connections | ✅ | ✅ | ❌ | ❌ |
| **Sending Emails** |
| Compose emails | ✅ | ✅ | ✅ | ❌ |
| Send emails | ✅ | ✅ | ✅ | ❌ |
| View sent emails | ✅ | ✅ | ✅ | ✅ |
| **AI & Templates** |
| Generate AI templates | ✅ | ✅ | ✅ | ❌ |
| Save templates | ✅ | ✅ | ✅ | ❌ |
| Edit own templates | ✅ | ✅ | ✅ | ❌ |
| Edit any template | ✅ | ✅ | ❌ | ❌ |
| Delete templates | ✅ | ✅ | ❌ | ❌ |
| View templates | ✅ | ✅ | ✅ | ✅ |
| **Gemini Keys** |
| Add Gemini keys | ✅ | ✅ | ❌ | ❌ |
| Edit/Delete keys | ✅ | ✅ | ❌ | ❌ |
| Use Gemini AI | ✅ | ✅ | ✅ | ❌ |
| **Analytics** |
| View dashboard | ✅ | ✅ | ✅ | ✅ |
| View team analytics | ✅ | ✅ | ❌ | ❌ |
| Export reports | ✅ | ✅ | ❌ | ❌ |

*\* Members and viewers only see accounts they have explicit access to via `account_access` table*

### Database Table
```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES profiles(id),
    role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    invited_by UUID REFERENCES profiles(id),
    joined_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Platform Admin Roles (Platform-Level)

These roles apply to **platform administrators** who manage the entire zecompaign platform across all organizations.

### Role Hierarchy

| Role | Level | Purpose | Access |
|------|-------|---------|--------|
| **super_admin** | Highest | Platform owner, full system access | Everything |
| **admin** | High | Platform operations, support | Most features except critical system settings |
| **support** | Standard | Customer support, troubleshooting | Read-only access, limited actions |

### Detailed Permissions Matrix

| Permission | super_admin | admin | support |
|------------|-------------|-------|---------|
| **Payment Management** |
| Approve payment requests | ✅ | ✅ | ❌ |
| Reject payment requests | ✅ | ✅ | ❌ |
| Activate plans manually | ✅ | ✅ | ❌ |
| View payment history | ✅ | ✅ | ✅ |
| **User Management** |
| View all users | ✅ | ✅ | ✅ |
| Suspend users | ✅ | ✅ | ❌ |
| Delete users | ✅ | ❌ | ❌ |
| Impersonate users (support) | ✅ | ✅ | ❌ |
| **Organization Management** |
| View all organizations | ✅ | ✅ | ✅ |
| Edit organization details | ✅ | ✅ | ❌ |
| Suspend organizations | ✅ | ✅ | ❌ |
| Delete organizations | ✅ | ❌ | ❌ |
| **System Management** |
| Manage admin users | ✅ | ❌ | ❌ |
| View system logs | ✅ | ✅ | ✅ |
| Modify system settings | ✅ | ❌ | ❌ |
| Access database console | ✅ | ❌ | ❌ |
| **Platform Analytics** |
| View platform stats | ✅ | ✅ | ✅ |
| Export analytics | ✅ | ✅ | ❌ |
| View revenue metrics | ✅ | ✅ | ❌ |

### Database Table
```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES profiles(id),
    role TEXT CHECK (role IN ('super_admin', 'admin', 'support')),
    permissions JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Current Admin Users

Currently, there is **1 super_admin** in the system:

```json
{
  "id": "a1200c7a-6243-4390-87cf-23a18b78a16d",
  "role": "super_admin",
  "permissions": [
    "manage_users",
    "approve_payments",
    "view_all_organizations",
    "system_settings"
  ],
  "created_by": null,
  "created_at": "2026-07-04 12:36:29.745051+00"
}
```

---

## 3. How the Two Systems Work Together

### Access Pattern Example

**User: John Doe**
- **Email**: john@example.com
- **Profile ID**: abc-123-def

**Organization Roles**:
- **Acme Corp** (org_id: org-1) → Role: `owner`
- **Beta Inc** (org_id: org-2) → Role: `member`

**Platform Role**:
- **admin_users** → Role: `admin`

**Access**:
1. **Within Acme Corp**: John has full owner permissions (billing, team management, etc.)
2. **Within Beta Inc**: John has limited member permissions (send emails, use AI)
3. **Platform-Wide**: John can approve payment requests for ANY organization via `/admin` dashboard

### Route Protection

#### Organization Routes (`/dashboard/*`)
```typescript
// Check organization membership
const { data: orgMember } = await supabase
  .from('organization_members')
  .select('role')
  .eq('organization_id', orgId)
  .eq('user_id', userId)
  .single()

// Check permission based on role
if (orgMember.role === 'viewer' && requiredRole === 'member') {
  return <AccessDenied />
}
```

#### Admin Routes (`/admin/*`)
```typescript
// Check if user is platform admin
const { data: adminUser } = await supabase
  .from('admin_users')
  .select('role')
  .eq('id', userId)
  .single()

if (!adminUser) {
  redirect('/dashboard') // Not an admin
}
```

---

## 4. Current Implementation Status

### ✅ Implemented

**Organization Roles**:
- ✅ Role-based sidebar navigation
- ✅ Page-level access control
- ✅ Permission checks in components
- ✅ Database RLS policies
- ✅ Role display in UI (badges, labels)

**Platform Admin**:
- ✅ Admin users table
- ✅ Admin dashboard at `/admin`
- ✅ Payment request approval
- ✅ Platform stats
- ✅ Middleware protection

### 🔄 Partial / Needs Enhancement

**Organization Roles**:
- ⚠️ Custom roles (currently fixed: owner, admin, member, viewer)
- ⚠️ Fine-grained permissions per role
- ⚠️ Role change notifications

**Platform Admin**:
- ⚠️ User management UI
- ⚠️ Organization management UI
- ⚠️ System settings UI
- ⚠️ Audit log viewer
- ⚠️ Multi-admin management

### ❌ Not Implemented

**Organization Roles**:
- ❌ Role templates
- ❌ Permission delegation
- ❌ Temporary role elevation

**Platform Admin**:
- ❌ Admin activity logs
- ❌ Admin permission customization
- ❌ Support ticket system
- ❌ User impersonation (for support)

---

## 5. Common Questions

### Q: Can a platform admin access all organizations?

**A**: Yes and no:
- **Yes**: Platform admins can VIEW all organizations via `/admin` dashboard
- **No**: Platform admins do NOT automatically have owner/admin role in those organizations
- **Access**: To manage an organization, a platform admin must be added as a member (owner/admin/member) to that specific organization

### Q: What's the difference between organization owner and platform super_admin?

| Aspect | Organization Owner | Platform Super Admin |
|--------|-------------------|---------------------|
| **Scope** | Single organization | Entire platform |
| **Data Access** | Own org data only | All org data (read-only) |
| **Billing** | Manage own org billing | Approve all payment requests |
| **Users** | Invite to own org | View all users across platform |
| **Permissions** | Highest within org | Highest across platform |
| **Route** | `/dashboard` | `/admin` |

### Q: Can there be multiple owners per organization?

**A**: Currently no. There's one owner per organization. However:
- Multiple `admin` roles can have near-owner permissions
- Ownership can be transferred (future feature)
- In the database, role is enforced but not unique (could be changed)

### Q: How do I become a platform admin?

**A**: 
1. **Super Admin Creation**: Direct database insert (first admin)
2. **Admin Creation**: Existing super_admin creates new admins via admin UI
3. **Support Creation**: Super_admin or admin creates support users

### Q: What happens when organization owner leaves?

**Current Behavior**: 
- Owner cannot leave organization (must delete or transfer)
- Trying to leave returns error: "Owners cannot leave. Transfer ownership or delete the organization instead."

**Future Enhancement**:
- Ownership transfer feature
- Automatic promotion of oldest admin to owner
- Grace period before org deletion

---

## 6. Security Considerations

### Organization-Level Security

1. **RLS Policies**: All organization data protected by Row Level Security
2. **Role Checks**: Server-side role verification on all mutations
3. **Audit Logging**: All role changes logged to `audit_log` table
4. **Cookie-Based Org Selection**: Selected org stored in secure HTTP-only cookie

### Platform Admin Security

1. **Separate Table**: Admin roles stored in dedicated `admin_users` table
2. **Middleware Protection**: `/admin` routes protected at Next.js middleware level
3. **No Auto-Elevation**: Being an admin doesn't grant org-level access
4. **Permission-Based**: Actions check specific permissions, not just role

---

## 7. Future Enhancements

### Short-Term (v1.1)
- [ ] Organization ownership transfer
- [ ] Multi-admin role UI
- [ ] Admin activity audit log
- [ ] User management in admin dashboard

### Medium-Term (v1.2)
- [ ] Custom organization roles
- [ ] Role-based email templates
- [ ] Support ticket system
- [ ] User impersonation for support

### Long-Term (v2.0)
- [ ] Enterprise SSO integration
- [ ] Advanced RBAC with custom permissions
- [ ] Role expiration/time-boxing
- [ ] Compliance reporting per role

---

## Summary

**zecompaign has a two-tier role system**:

1. **Organization Roles** (owner, admin, member, viewer)
   - Control access within a team/organization
   - Enforced by RLS and application logic
   - Visible in team pages and sidebar

2. **Platform Admin Roles** (super_admin, admin, support)
   - Control platform-level operations
   - Separate from organization membership
   - Access via `/admin` dashboard

**Current Admin**: You (user ID: `a1200c7a-6243-4390-87cf-23a18b78a16d`) are a **super_admin** with full platform access.

**Access Pattern**: 
- As a super_admin, you can approve payments, view stats, manage the platform
- To manage a specific organization's accounts/templates, you need to be added as a member to that organization

This separation ensures that platform admins can't accidentally interfere with user data and maintains proper access control boundaries.
