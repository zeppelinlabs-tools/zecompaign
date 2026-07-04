# zecompaign

> Team Email Campaign Collaboration Platform

**zecompaign** is a B2B SaaS platform that helps marketing teams manage SMTP credentials, compose emails, and collaborate on campaigns. Users bring their own SMTP accounts (BYOS model) - we handle secure credential management, team access control, and audit trails.

## 🎯 Positioning

- **NOT** an email service provider (we don't send emails on our infrastructure)
- **NOT** charging for email volume (unlimited sending through your SMTP)
- **YES** to secure credential management (like 1Password for SMTP)
- **YES** to team collaboration (like Notion for email campaigns)

## ✨ Features

### Core Features
- 🔐 **Secure SMTP Management** - Store and share SMTP credentials with your team
- 📧 **Email Composer** - Rich email editor with templates and preview
- 🤖 **AI Template Generator** - Generate email templates with Google Gemini
- 👥 **Team Collaboration** - Role-based access control (owner, admin, member)
- 📊 **Usage Tracking** - Monitor sent emails, templates, and team activity
- 🔍 **Audit Logs** - Complete audit trail of all actions
- 🛡️ **Rate Limiting** - Protection against abuse (30/min emails, 10/min tests, 20/min AI)
- ✉️ **Unsubscribe Compliance** - CAN-SPAM & RFC 8058 compliant unsubscribe links
- 🔒 **SMTP Encryption** - Supabase Vault integration for password encryption (infrastructure ready)

### Authentication
- ✅ Email/Password
- ✅ Google OAuth (requires configuration)
- ✅ GitHub OAuth (requires configuration)
- ✅ Magic Link (passwordless)
- ✅ Email verification
- ✅ Password reset

### Billing
- 💳 **Manual Billing System** - Request plan upgrades, admin approves
- 📈 **Usage Limits** - Plan-based limits on accounts, members, templates
- 🎯 **4 Tiers**: Free, Starter ($9), Pro ($19), Business ($49)

## 🏗️ Tech Stack

- **Framework**: Next.js 16.2.9 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Email**: Nodemailer (user's SMTP)
- **AI**: Google Gemini API
- **Styling**: TailwindCSS + Custom CSS
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Google Gemini API key (optional, for AI features)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd zecompaign
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from Settings → API
3. Copy `.env.local.example` to `.env.local` and update:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

The database schema is already created via Supabase MCP. You can view the migrations in `supabase/migrations/`.

**Database includes:**
- ✅ Organizations and members
- ✅ User profiles
- ✅ SMTP accounts with access control
- ✅ Email templates
- ✅ Sent email logs
- ✅ Gemini API keys
- ✅ Manual billing (payment requests)
- ✅ Admin users
- ✅ Usage and audit logs
- ✅ Row Level Security (RLS) policies

### 4. Configure Authentication Providers (Optional)

To enable OAuth login:

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable and configure:
   - **Google OAuth**: Add Client ID and Secret
   - **GitHub OAuth**: Add Client ID and Secret
3. Set callback URL: `http://localhost:3000/auth/callback`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📖 User Guide

### First Time Setup

1. **Sign Up** at `/signup`
   - Create account with email/password or OAuth
   - Verify email (check spam folder)
   - An organization is automatically created

2. **Add SMTP Account** at `/smtp`
   - Name your account (e.g., "Gmail Marketing")
   - Enter SMTP details:
     - Host: `smtp.gmail.com`
     - Port: `587` or `465`
     - Username: your email
     - Password: app password (not regular password)
   - Test connection
   - Save

3. **Compose Email** at `/compose`
   - Select SMTP account
   - Add recipients
   - Write subject and body
   - Preview and send

### Team Collaboration

1. **Invite Members** at `/team`
   - Enter team member email
   - Choose role: Admin or Member
   - They must sign up first

2. **Grant SMTP Access** at `/smtp`
   - Click on an account
   - Grant access to specific team members
   - They can now send using that account

### AI Template Generation

1. **Add Gemini Key** at `/settings`
   - Get free API key: https://makersuite.google.com/app/apikey
   - Add to zecompaign with usage quota

2. **Generate Templates** at `/ai`
   - Describe your email
   - Choose tone and length
   - Generate and save

### Upgrade Plan

1. **Request Upgrade** at `/billing`
   - View current plan and usage
   - Click "Upgrade Plan"
   - Select plan and billing period
   - Submit request with billing email

2. **Admin Approval** (requires admin user)
   - Admin reviews request
   - Approves or rejects
   - Plan activated on approval

## 🗂️ Project Structure

```
zecompaign/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── dashboard/        # Main dashboard
│   │   ├── smtp/             # SMTP management
│   │   ├── compose/          # Email composer
│   │   ├── ai/               # AI template generator
│   │   ├── templates/        # Template library
│   │   ├── team/             # Team management
│   │   ├── billing/          # Billing & upgrades
│   │   └── settings/         # User settings
│   ├── api/                  # API routes
│   │   ├── send-email/       # Send email via SMTP
│   │   ├── test-smtp/        # Test SMTP connection
│   │   └── generate-template/# AI template generation
│   ├── auth/                 # Auth callbacks
│   ├── login/                # Login page
│   ├── signup/               # Signup page
│   ├── forgot-password/      # Password reset request
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── Dashboard.tsx
│   ├── Sidebar.tsx
│   ├── ComposeEmail.tsx
│   ├── TeamMembers.tsx
│   ├── BillingPanel.tsx
│   └── ...
├── lib/
│   ├── actions/              # Server actions
│   │   ├── auth.ts
│   │   ├── organizations.ts
│   │   ├── sending-accounts.ts
│   │   ├── templates.ts
│   │   ├── emails.ts
│   │   ├── billing.ts
│   │   ├── gemini-keys.ts
│   │   └── admin.ts
│   ├── supabase/             # Supabase clients
│   │   ├── client.ts         # Browser client
│   │   ├── server.ts         # Server client
│   │   └── middleware.ts     # Auth middleware
│   └── database.types.ts     # TypeScript types
├── docs/                     # Documentation (organized)
│   ├── 01-product/           # Product & business docs
│   │   ├── prd.md            # Product requirements
│   │   ├── positioning.md    # Market positioning
│   │   └── elevator-pitch.md # Sales pitches
│   ├── 02-design/            # Design specifications
│   │   ├── ui-ux-design.md   # Design system
│   │   └── database-schema.md# Database schema
│   ├── 03-implementation/    # Development docs
│   │   ├── implementation-plan.md
│   │   ├── implementation-status.md
│   │   └── test-checklist.md
│   ├── project-summary.md    # Project overview
│   └── README.md             # Documentation guide
└── supabase/
    └── migrations/           # Database migrations
```

## 🔐 Security

- ✅ Row Level Security (RLS) on all tables
- ✅ Server-side auth checks
- ✅ Rate limiting on all API routes (30/min emails, 10/min tests, 20/min AI)
- ✅ Unsubscribe compliance (CAN-SPAM & RFC 8058)
- ✅ SMTP encryption infrastructure ready (Supabase Vault)
- ✅ CSRF protection via Next.js
- ✅ Secure session management via Supabase
- ✅ Multi-tenant isolation at database level

See [`docs/03-implementation/security-compliance-update.md`](docs/03-implementation/security-compliance-update.md) for implementation details.

## 📚 Documentation

Complete documentation is available in the `docs/` folder:

**Product & Design:**
- **Product**: [`docs/01-product/prd.md`](docs/01-product/prd.md) - Product Requirements Document
- **Design**: [`docs/02-design/ui-ux-design.md`](docs/02-design/ui-ux-design.md) - UI/UX Design System
- **Database**: [`docs/02-design/database-schema.md`](docs/02-design/database-schema.md) - Complete Schema

**Implementation:**
- **Status**: [`docs/03-implementation/implementation-status.md`](docs/03-implementation/implementation-status.md) - Current Progress
- **Plan**: [`docs/03-implementation/implementation-plan.md`](docs/03-implementation/implementation-plan.md) - Development Roadmap
- **Testing**: [`docs/03-implementation/test-checklist.md`](docs/03-implementation/test-checklist.md) - Test Guide

**Security & Compliance:**
- **Security**: [`docs/03-implementation/security-compliance-update.md`](docs/03-implementation/security-compliance-update.md) - Security Features
- **OAuth Setup**: [`docs/03-implementation/oauth-setup-guide.md`](docs/03-implementation/oauth-setup-guide.md) - OAuth Configuration

**Deployment:**
- **Production Checklist**: [`PRODUCTION-CHECKLIST.md`](PRODUCTION-CHECKLIST.md) - Pre-Launch Checklist

See [`docs/README.md`](docs/README.md) for complete documentation structure.

**Key tables:**
- `profiles` - User profiles
- `organizations` - Organizations with plan limits
- `organization_members` - Team memberships with roles
- `sending_accounts` - SMTP credentials
- `account_access` - Who can use which SMTP account
- `templates` - Email templates
- `sent_emails` - Email log with status
- `gemini_keys` - AI API keys with quotas
- `payment_requests` - Manual billing requests
- `admin_users` - Super admins
- `usage_logs` - Audit trail
- `audit_log` - Action logs

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# Site URL (required for OAuth and unsubscribe links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional
GEMINI_PLATFORM_KEY=          # Platform-wide Gemini key
SYSTEM_EMAIL_FROM=            # System notification emails
```

## 🚢 Deployment

### Quick Start

See [`PRODUCTION-CHECKLIST.md`](PRODUCTION-CHECKLIST.md) for complete pre-launch checklist.

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your production domain)
4. Deploy

### Post-Deployment

1. **Apply Database Migrations**
   ```bash
   supabase db push
   ```

2. **Create First Admin User**
   ```sql
   INSERT INTO admin_users (user_id, role, added_by) 
   VALUES ('[your-user-id]', 'super_admin', '[your-user-id]');
   ```

3. **Configure OAuth Providers**
   - Follow [`docs/03-implementation/oauth-setup-guide.md`](docs/03-implementation/oauth-setup-guide.md)
   - Update callback URLs to production domain
   - Test Google and GitHub OAuth

4. **Test Complete Flow**
   - Signup → Verify → Login
   - Add SMTP → Test → Send
   - Check unsubscribe link works
   - Request upgrade → Admin approve

## 📝 Roadmap

See `docs/03-implementation/implementation-plan.md` for detailed roadmap.

### Phase 1: MVP ✅ (Complete)
- [x] Authentication system
- [x] Database schema
- [x] Server actions
- [x] API routes (send, test, generate, unsubscribe)
- [x] Dashboard pages
- [x] Core components
- [x] Rate limiting
- [x] Unsubscribe compliance

### Phase 2: Polish 🚧 (In Progress)
- [x] Component integration ✅
- [x] Admin panel ✅
- [ ] OAuth configuration (manual setup required)
- [ ] End-to-end testing
- [ ] Error monitoring

### Phase 3: Advanced ⏳
- [ ] Email scheduling
- [ ] Bulk email queue
- [ ] Email attachments
- [ ] A/B testing
- [ ] Analytics dashboard
- [ ] Webhook integrations
- [ ] API access

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, email support@zecompaign.com or open an issue.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a service
- [Nodemailer](https://nodemailer.com/) - Email sending
- [Google Gemini](https://ai.google.dev/) - AI generation
- [Lucide Icons](https://lucide.dev/) - Icon library

---

Built with ❤️ for marketing teams everywhere
