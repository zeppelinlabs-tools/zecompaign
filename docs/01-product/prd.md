# zecompaign — Product Requirements Document

**Version:** 3.0
**Date:** July 2026
**Status:** In Design
**Supersedes:** v2.0 (team-focused Supabase backend)

---

## 1. Product Overview

**zecompaign** is a **B2B SaaS collaboration platform** for marketing teams and agencies to centralize, share, and manage email campaign operations. Built with Next.js 16 and Supabase, zecompaign transforms fragmented email workflows into a unified workspace where teams can securely manage SMTP credentials, collaborate on campaigns, generate AI-powered templates, and maintain visibility across all email activities.

**Product Category:** B2B SaaS Collaboration Tool (Email Campaign Management)

**The Problem We Solve:**
Marketing teams and agencies face critical collaboration challenges:
- 🔐 **Credential Chaos** — SMTP passwords shared via Slack, email, or spreadsheets (massive security risk)
- 👥 **No Team Visibility** — Can't see who sent what, from which account, or why
- 🔀 **Context Switching** — Logging into 5+ different email platforms daily
- 🚫 **Access Control Nightmare** — Can't grant partial access (it's all-or-nothing password sharing)
- 📊 **Fragmented Analytics** — No unified view across all email accounts
- ⏱️ **Duplicate Work** — Each team member recreating the same templates

**The zecompaign Solution:**
A **collaborative workspace** where teams:
- Store all SMTP accounts securely in one vault (Supabase Vault encryption)
- Share accounts with teammates via role-based permissions (no password exposure)
- Send campaigns from a unified interface
- Generate templates with AI (shared across the team)
- Track all activity in one dashboard with full audit trails
- Maintain compliance and security without sacrificing productivity

**Critical Distinction:** zecompaign is **NOT an email sending provider** (like Mailchimp or SendGrid). We're a **collaboration layer** that sits on top of your existing email infrastructure — think Notion for email operations, or Slack for campaign management.

### Core Value Proposition (B2B Focus)

| User Type | Before zecompaign | After zecompaign | Business Impact |
|-----------|------------------|------------------|-----------------|
| **Marketing Team** | 5 people sharing 1 Gmail password via Slack | Secure account sharing, role-based access, audit logs | Eliminated security risk, 3x faster onboarding |
| **Agency** | Managing 20 client SMTP accounts in spreadsheet | All accounts in one workspace, scoped by client | 10 hours/week saved on credential management |
| **Enterprise** | No visibility into who sent what campaign | Full audit trail, team analytics, compliance reporting | Passed SOC 2 audit, reduced compliance overhead |
| **Startup** | Marketing lead manually sending all emails | Distributed sending, templates shared, AI-generated content | Marketing lead freed up 15 hours/week |

---

## 2. Target Users & Market Segments (B2B Focus)

zecompaign serves **B2B teams and organizations** that need collaborative email campaign management with security, visibility, and control.

### Primary B2B Segments

| Segment | Company Profile | Team Size | Pain Points | zecompaign Solution | Annual Contract Value |
|---------|----------------|-----------|-------------|-------------------|---------------------|
| **Startup Marketing Teams** | Series A-B startups, 10-50 employees | 3-8 marketers | Sharing Gmail passwords, no budget for Mailchimp's $350/mo plan, need team collaboration | Secure SMTP sharing, AI templates, unified dashboard at $19-49/mo | $228-588/year |
| **Mid-Market Companies** | 50-500 employees, multiple brands/products | 10-30 marketers | Managing 10+ email accounts across brands, compliance requirements, onboarding friction | Unlimited accounts, role-based access, audit logs, SSO at $49-199/mo | $588-2,388/year |
| **Marketing Agencies** | 5-100 employees serving 10-50 clients | 5-20 team members | Managing 30+ client SMTP accounts, credential security risk, client data isolation | Client workspaces, granular permissions, white-label at $49-199/mo | $588-2,388/year |
| **Enterprise** | 500+ employees, global operations | 30-100+ marketers | Compliance (SOC 2, GDPR), security policies, audit requirements, global team coordination | Enterprise security, SSO, dedicated support, SLA at $199-999+/mo | $2,388-12K+/year |

### Ideal Customer Profile (ICP)

**Primary ICP:**
- **Company Size:** 10-200 employees
- **Team Size:** 3-20 marketing/ops team members
- **Current State:** Using 5+ separate email accounts, sharing credentials insecurely
- **Budget:** $500-2,000/year for email workflow tools
- **Pain:** "Our team wastes 10 hours/week managing SMTP access and we're terrified of a security breach"
- **Buying Trigger:** Security audit, team scaling, new compliance requirements, or "that was the last straw" moment

**Secondary ICP (Agency):**
- **Agency Size:** 5-50 employees
- **Client Count:** 10-50 active clients
- **Service:** Email marketing, campaign management, fractional CMO services
- **Pain:** "Managing client SMTP credentials is a nightmare; we need a better system before we scale to 100 clients"
- **Buying Trigger:** Losing a client password, onboarding delays, compliance requirements from enterprise clients

### B2B Buyer Personas

| Persona | Role | Budget Authority | Goals | Objections | How We Win |
|---------|------|-----------------|-------|-----------|------------|
| **Marketing Director** | Decision maker | $5K-50K/year | Team productivity, security, visibility | "Why not just use 1Password?" | Show audit logs, role-based access, unified analytics |
| **VP Marketing** | Economic buyer | $50K-500K/year | ROI, scalability, compliance | "Can we build this internally?" | $49/mo vs $10K+ dev cost; live in 1 day vs 3 months build |
| **IT/Security Lead** | Influencer | N/A | Security, compliance, data protection | "Is Vault-encrypted storage sufficient?" | Supabase Vault = AWS KMS-backed; SOC 2 Type II certified |
| **Marketing Ops Manager** | End user/champion | Recommends | Efficiency, less tool-switching, onboarding speed | "Learning curve for the team?" | 5-minute onboarding; looks like email tools they already know |

### Market Opportunity

| Market Segment | Addressable Companies (US) | Avg Deal Size | Market Size |
|----------------|---------------------------|---------------|-------------|
| Startups (10-50 employees) | ~200,000 | $300/year | $60M TAM |
| SMB (50-200 employees) | ~500,000 | $800/year | $400M TAM |
| Mid-Market (200-1,000 employees) | ~100,000 | $2,000/year | $200M TAM |
| Agencies (all sizes) | ~50,000 | $1,000/year | $50M TAM |
| **Total Addressable Market** | **~850K companies** | | **~$710M TAM** |

**Serviceable Obtainable Market (SOM):** Target 0.1% penetration in Year 1 = 850 customers = $400K-600K ARR

### Primary B2B Segments

#### 🏢 Marketing Teams (3-50 people)
**Profile:** Startups, scale-ups, SMBs with dedicated marketing teams  
**Team Structure:** Marketing Manager, Content Marketers, Product Marketers, Growth Marketers  
**Email Accounts:** 3-10 SMTP accounts (product newsletters, promotional, transactional, regional)

**Pain Points:**
- Marketing Manager set up all SMTP accounts with her Gmail login — everyone needs access
- Credentials shared in Slack threads or 1Password (but 1Password has no sending UI)
- When someone leaves, need to rotate all passwords
- Can't see who sent what campaign or when
- No way to prevent junior marketer from sending from CEO's email account

**zecompaign Solution:**
- **Pro Plan ($19/mo)** — 15 SMTP accounts, 3 team members included
- Secure credential vault with role-based access (admin, sender, viewer)
- Shared template library (no more duplicate work)
- Activity log shows who sent what, when, from which account
- Onboard new team member in 2 minutes (no password sharing needed)

**ROI Calculation:**
- Save 5 hours/month on credential management: **$250/mo** (@ $50/hr)
- Eliminate security risk of password sharing: **Priceless** (but also reduces insurance costs)
- Faster template creation with AI: **3 hours/month saved** = $150/mo
- **Total value: $400+/mo for $19/mo cost = 20x ROI**

---

#### 🎨 Digital Agencies (5-100 people)
**Profile:** Marketing agencies, freelancer collectives, white-label service providers  
**Team Structure:** Account managers, designers, copywriters, strategists (multiple clients per person)  
**Email Accounts:** 20-100+ SMTP accounts (one or more per client)

**Pain Points:**
- Managing 30 client SMTP accounts is a nightmare (spreadsheet hell)
- Junior team members shouldn't have access to all clients
- When account manager leaves, what accounts do they still have access to?
- Client asks "who sent that campaign?" — no audit trail
- Billing clients for email work is hard without usage tracking

**zecompaign Solution:**
- **Business Plan ($49/mo)** — Unlimited SMTP accounts, 10 team members, $8/mo per additional
- Client workspace organization (group accounts by client)
- Granular access control (assign team members to specific clients only)
- Full audit log (who sent what, when, for which client)
- Usage reports for client billing (white-label)

**ROI Calculation:**
- Save 10 hours/month on account management: **$1,000/mo** (@ $100/hr agency rate)
- Eliminate onboarding/offboarding friction: **5 hours/month** = $500/mo
- Win more clients due to better security posture: **1 new client/year** = $24K+/year
- **Total value: $1,500+/mo for $49-129/mo cost = 12-30x ROI**

---

#### 🏛️ Enterprise Marketing (50-500 people)
**Profile:** Fortune 500 companies, enterprises with complex org structures  
**Team Structure:** Multiple product lines, regional teams, brands — each with own email accounts  
**Email Accounts:** 50-500+ SMTP accounts (per product, per region, per brand)

**Pain Points:**
- Compliance requirements (SOC 2, GDPR, HIPAA) — can't share passwords via Slack
- IT security demands audit trails for all outbound communications
- Need SSO integration (Okta, Azure AD) for user management
- Different teams in different regions need different access scopes
- Legal requires proof of "who authorized this campaign"

**zecompaign Solution:**
- **Enterprise Plan ($199+/mo)** — Unlimited everything, SSO, SLA, dedicated support
- SAML/LDAP SSO integration (centralized user management)
- Advanced audit logging (tamper-proof, export for compliance)
- Role-based access control with custom roles
- White-label platform (enterprise.yourcompany.com)
- Priority support + dedicated account manager

**ROI Calculation:**
- Avoid building in-house solution: **$100K+ dev cost** + $30K/yr maintenance
- Pass compliance audits faster: **40 hours saved/year** = $10K+ (@ $250/hr consultant rate)
- Reduce security incidents: **Priceless** (1 breach = $4.45M average cost)
- Improve team productivity: **20 hours/month saved** across team = $50K+/year
- **Total value: $100K+ first year savings for $2,400-10K/yr cost = 10-40x ROI**

---

### Secondary Segments (Future Expansion)

#### 🚀 SaaS Companies (Transactional Email Teams)
**Profile:** Product teams managing transactional emails (onboarding, notifications, alerts)  
**Opportunity:** Extend platform to transactional email management + API access  
**Timeline:** v3.2 (Q2 2027)

#### 📚 Educational Institutions
**Profile:** Universities, online course platforms with multiple departments sending emails  
**Opportunity:** Department-scoped access, student data compliance (FERPA)  
**Timeline:** v3.3 (Q3 2027)

---

### Anti-Persona (Who We DON'T Serve)

❌ **Solo bloggers** — Free tier is fine, but they won't upgrade (no team to collaborate with)  
❌ **Consumers** — This is B2B software, not a Gmail replacement  
❌ **Spammers** — Content filtering + abuse detection will catch them  
❌ **Price-only shoppers** — If they only care about cost-per-email, they should use Mailchimp (we're selling collaboration, not cheap sending)

---

## 3. Monetization Strategy (B2B SaaS Model)

### 3.1 Subscription Tiers (Team Collaboration Platform)

**Pricing Philosophy:** B2B SaaS pricing focused on **team size** and **collaboration features**. The more people who need to work together, the more value we deliver, the more we charge. Not based on email volume (that's commodity pricing).

**Pricing Tiers:**

| Tier | Monthly Price | Annual Price (Save 25%) | Target Segment | Seats Included | Key Differentiator |
|------|--------------|------------------------|----------------|----------------|-------------------|
| **Free** | $0 | $0 | Individual trial, proof-of-concept | 1 | Try before buying |
| **Starter** | $9 | $81/year ($6.75/mo) | Solo power users, consultants | 1 | Organize personal workflow |
| **Pro** | **$19** | **$171/year ($14.25/mo)** | **Small teams (target segment)** | **3** | Team collaboration unlocked |
| **Business** | **$49** | **$441/year ($36.75/mo)** | **Agencies, growing teams** | **10** | Multi-client management |
| **Enterprise** | Custom ($199+) | Custom (negotiated) | Large enterprises | Unlimited | SSO, compliance, white-label |

### Feature Matrix (B2B Collaboration Focus)

| Feature | Free | Starter | Pro | Business | Enterprise |
|---------|------|---------|-----|----------|------------|
| **COLLABORATION** |
| Team Members | 1 (you) | 1 (you) | **3 included** | **10 included** | **Unlimited** |
| Role-Based Access | ❌ | ❌ | ✅ Admin, Sender, Viewer | ✅ Custom roles | ✅ Advanced RBAC |
| Shared Account Access | ❌ Solo only | ❌ Solo only | ✅ Share with team | ✅ Share with team | ✅ Share with team |
| Team Activity Audit Log | ❌ | ❌ | ✅ 30 days | ✅ 1 year | ✅ Unlimited + export |
| Workspaces/Client Folders | ❌ | ❌ | ❌ | ✅ Organize by client | ✅ + white-label |
| Team Template Library | ❌ | ❌ | ✅ Shared templates | ✅ Shared + folders | ✅ + version control |
| Comments/Annotations | ❌ | ❌ | ❌ | ✅ Collaborate on drafts | ✅ Advanced |
| **ACCOUNT MANAGEMENT** |
| SMTP Accounts | 3 | 5 | 15 | **Unlimited** | **Unlimited** |
| Account Sharing Controls | ❌ | ❌ | ✅ Basic | ✅ Granular | ✅ Advanced |
| Credential Vault | ✅ | ✅ | ✅ | ✅ | ✅ + compliance |
| Connection Health Monitoring | ❌ | ✅ | ✅ | ✅ | ✅ + alerts |
| **AI & AUTOMATION** |
| AI Template Generation | 15/month | 100/month | 500/month | 2,000/month | Custom |
| AI Model Selection | Flash only | Flash + Pro | All models | All models | All + fine-tuned |
| Email Scheduling | ❌ | ✅ | ✅ | ✅ | ✅ + timezone smart |
| Email Sequences | ❌ | ❌ | ✅ Basic | ✅ Advanced | ✅ + triggers |
| A/B Testing | ❌ | ❌ | ✅ | ✅ | ✅ + multivariate |
| **ANALYTICS & REPORTING** |
| Send History | 30 days | 90 days | 1 year | Unlimited | Unlimited |
| Basic Analytics | ✅ | ✅ | ✅ | ✅ | ✅ |
| Team Analytics | ❌ | ❌ | ✅ | ✅ | ✅ + custom dashboards |
| Export Reports | ❌ | CSV | CSV + PDF | CSV + PDF + API | All + scheduled |
| **SECURITY & COMPLIANCE** |
| Email Verification | ✅ Required | ✅ Required | ✅ | ✅ | ✅ |
| 2FA | ✅ | ✅ | ✅ | ✅ | ✅ + enforced |
| SSO (SAML/LDAP) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | Basic | Advanced | Full + tamper-proof |
| Compliance Certifications | ❌ | ❌ | ❌ | ❌ | SOC 2, GDPR, HIPAA |
| **SUPPORT** |
| Support Level | Email (48hr) | Email (24hr) | Email (4hr) | Email + Chat (2hr) | Phone + Slack (1hr) |
| Onboarding | Self-service | Self-service | Video call | Dedicated setup | White-glove |
| Account Manager | ❌ | ❌ | ❌ | ✅ | ✅ Dedicated |
| SLA | ❌ | ❌ | ❌ | 99% uptime | 99.9% + penalties |

### Per-Seat Pricing (Business & Enterprise)

| Plan | Included Seats | Extra Seat Cost | Example: 20 Users |
|------|---------------|----------------|------------------|
| Pro | 3 | N/A (max 3 users) | Upgrade to Business |
| Business | 10 | **$8/month per seat** | $49 + (10 × $8) = **$129/mo** |
| Enterprise | Unlimited | Included | $199+/mo (negotiated) |

**Pricing Psychology:**
- **Pro tier ($19)** hits the "team" threshold — unlocks collaboration, natural upgrade from solo use
- **Business tier ($49)** targets agencies (10 seats included = perfect for small agency)
- **Per-seat pricing on Business** makes scaling predictable ($8/seat is industry-standard)
- **Enterprise** pricing is "call us" to qualify leads and negotiate based on company size

### 3.2 B2B Sales Strategy

#### Self-Service (Free → Pro)
**Target:** Small teams (3-10 people), startups, SMBs  
**Motion:** Product-led growth, free trial → upgrade  
**Conversion Triggers:**
- Hit 3 SMTP account limit on Free tier → "Add 2 more for $9/mo"
- Need to share account with teammate → "Unlock team features for $19/mo"
- Run out of AI generations → "Upgrade for 500/month"

**Tactics:**
- In-app upgrade prompts at limit points
- Email drip campaign highlighting collaboration features
- Comparison page showing Free vs Pro vs Business

---

#### Sales-Assisted (Business)
**Target:** Agencies (5-30 people), mid-size teams  
**Motion:** Lead qualification → demo → trial → close  
**Qualification Criteria:**
- Managing 5+ clients or 15+ SMTP accounts
- 5+ team members need access
- Mentions "compliance" or "audit trail" in signup

**Tactics:**
- Automated qualification email if they hit Business-tier indicators
- Offer 30-min onboarding call
- 14-day Business trial (no credit card)
- Case studies from similar agencies

---

#### Enterprise Sales (Enterprise)
**Target:** Fortune 500, large enterprises (50+ employees)  
**Motion:** Inbound lead → discovery call → POC → procurement  
**Deal Size:** $2,400-$50K+/year  
**Sales Cycle:** 3-9 months

**Qualification Criteria:**
- 50+ employees in marketing/email function
- Mentions SSO, SOC 2, HIPAA, or custom integration
- Procurement process (RFP, security review, legal)

**Tactics:**
- Dedicated sales rep (hire at $500K ARR)
- Custom POC environment (white-label preview)
- Security documentation package
- Executive sponsor program
- Annual/multi-year contracts with discounts

---

### 3.3 Revenue Model Mechanics

**Primary Revenue Streams:**
1. **Subscription MRR** (95% of revenue)
   - Pro: $19/mo × users
   - Business: $49/mo + $8/seat × extra users
   - Enterprise: Custom ($199-2K+/mo)

2. **Add-Ons** (3% of revenue)
   - Extra SMTP accounts: $2/mo each
   - Extra AI generations: $5/100
   - Premium templates: $29 one-time

3. **Professional Services** (2% of revenue, Enterprise only)
   - Custom integrations: $5K-50K
   - White-label setup: $10K
   - Migration assistance: $2K-10K

**Unit Economics (Pro Plan Example):**
```
Monthly Price: $19
COGS (Supabase + Vercel + Support): $3
Gross Margin: $16 (84%)
CAC (blended): $40
Payback Period: 2.5 months
LTV (24 month avg retention): $456
LTV:CAC Ratio: 11:1
```

**Churn Assumptions:**
- Free → Paid conversion: 5-8%
- Monthly churn: 5% (Pro/Starter), 3% (Business), 1% (Enterprise)
- Negative churn target: Upsells offset gross churn
- Annual plans: 50% lower churn (2.5% → 1.5%)

### 3.3 Annual Pricing (25% Discount)

Lock in lower rates and improve cash flow with annual commitments:

| Tier | Monthly | Annual (save 25%) | Effective Monthly | Competitor Annual |
|------|---------|-------------------|-------------------|-------------------|
| Starter | $9/mo | **$81/year** | **$6.75/mo** | Mailchimp: $11/mo |
| Pro | $19/mo | **$171/year** | **$14.25/mo** | SendGrid: $72/mo (still higher) |
| Business | $49/mo | **$441/year** | **$36.75/mo** | Mailchimp: $280/mo |

**Annual Incentive:** 2 months free + priority onboarding + free SMTP warmup service ($49 value)

### 3.4 Revenue Projections (B2B SaaS Growth Model)

**Growth Assumptions:**
- Product-led growth for Pro tier (self-service)
- Sales-assisted for Business tier (demo → trial → close)
- Enterprise via dedicated sales rep (hire at $500K ARR)

#### Year 1 Projections (Moderate Growth Scenario)

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| **Total Signups** | 800 | 3,500 | 12,000 |
| Free Users | 640 | 2,625 | 9,000 |
| Starter Users | 80 | 438 | 1,200 |
| Pro Users (teams) | 64 | 350 | 1,500 |
| Business Users | 8 | 70 | 250 |
| Enterprise Clients | 0 | 2 | 8 |
| **Free → Paid Conversion** | 5% | 6% | 7% |
| **MRR** | $4,588 | $21,560 | $65,830 |
| **ARR** | $55K | $259K | $790K |

#### Revenue Breakdown (Month 12)

| Plan | Customers | Avg Revenue/Customer | Monthly Revenue | % of Total |
|------|-----------|---------------------|-----------------|-----------|
| Starter | 1,200 | $9 | $10,800 | 16% |
| Pro | 1,500 | $19 (base) + ~$5 (avg add-ons) | $36,000 | 55% |
| Business | 250 | $49 + $32 (avg 4 extra seats) | $20,250 | 31% |
| Enterprise | 8 | $350 (avg) | $2,800 | 4% |
| **Total** | **2,958** | **$22 blended ARPU** | **$69,850** | **106%** |

*Note: Totals include add-on revenue (extra seats, AI, etc.)*

#### 3-Year Projection (Moderate Scenario)

| Year | ARR | Paid Customers | Team ARPU | Growth Rate |
|------|-----|----------------|-----------|-------------|
| **Year 1** | $790K | 2,958 | $22 | N/A |
| **Year 2** | $2.1M | 7,500 | $28 | 166% |
| **Year 3** | $4.8M | 15,000 | $32 | 129% |

**Key Drivers:**
- Expansion revenue from Pro → Business upgrades
- Per-seat expansion within Business accounts
- Enterprise deals (8 → 25 → 60 clients)
- Negative churn from upsells

---

### 3.5 Competitive Positioning (B2B Collaboration Category)

### 3.5 Competitive Positioning (B2B Collaboration Category)

**Primary Positioning:** *"The collaboration platform for email campaign management. Stop sharing SMTP passwords. Start working as a team."*

**Product Category:** B2B SaaS Collaboration Tool (not an ESP, not email sending infrastructure)

#### We Compete With (Collaboration Tools):

| Competitor | Category | Price | What They Do | Why We're Different |
|-----------|----------|-------|--------------|-------------------|
| **Notion** | Workspace collaboration | $0-$15/user | Document collaboration, wikis | We're Notion **for email operations** — same collaboration model, email-specific |
| **Slack** | Team communication | $0-$12/user | Chat, channels, integrations | We're async email collaboration, not real-time chat |
| **1Password / Dashlane** | Credential management | $8-$20/user | Password vault, sharing | We're 1Password **+ sending UI + AI** for email accounts only |
| **Front / Help Scout** | Shared inbox | $19-$79/user | Support email collaboration | We're for **marketing campaigns**, not support tickets |
| **Monday.com / Asana** | Project management | $8-$16/user | Task collaboration | We're campaign collaboration, not task management |

**Key Insight:** We're **NOT competing with email sending providers** (Mailchimp, SendGrid, Resend). We're competing with generic collaboration tools by being **vertical-specific for email marketing teams**.

#### We DON'T Compete With (Infrastructure Providers):

| Provider | Category | Why We're Complementary |
|----------|----------|------------------------|
| **Mailchimp / SendGrid** | Email Service Providers | Users can keep using them + add our team layer |
| **Resend / Postmark** | Transactional Email APIs | We integrate WITH them, add UI + collaboration |
| **AWS SES / Mailgun** | Email Infrastructure | Users connect these accounts to our platform |

---

### 3.6 Value Proposition by Competitor Category

#### vs. Generic Collaboration Tools (Notion, Slack)
**Them:** Generic, need custom workflows for email  
**Us:** Purpose-built for email collaboration — account sharing, template library, send history, audit logs out-of-the-box

**Win Message:** *"You could build email workflows in Notion + store passwords in 1Password + send via Resend API... or just use zecompaign."*

---

#### vs. Credential Managers (1Password, LastPass)
**Them:** Secure password sharing, no sending UI  
**Us:** Password vault + sending interface + AI + analytics — complete email collaboration platform

**Win Message:** *"1Password shares the password. zecompaign eliminates the need to share it (role-based access)."*

---

#### vs. Shared Inbox Tools (Front, Help Scout)
**Them:** Support-focused, shared inboxes for customer service  
**Us:** Campaign-focused, shared accounts for outbound marketing

**Win Message:** *"Front is for support tickets. zecompaign is for marketing campaigns. Different workflows, different tools."*

---

#### vs. Building In-House
**Them:** $100K+ dev cost, 6-12 months to build, ongoing maintenance  
**Us:** $19-49/mo, ready today, we handle updates/security

**Win Message:** *"Your eng team should build your product, not rebuild Gmail + 1Password + Notion for emails."*

---

### 3.7 Go-to-Market Messaging (B2B Focus)

**Primary Headline:** *"Email collaboration for marketing teams. Secure, organized, AI-powered."*

**Secondary Headlines (by segment):**
- **Startups:** *"Your marketing team is sharing Gmail passwords in Slack. There's a better way."*
- **Agencies:** *"Manage 50 client email accounts without the spreadsheet nightmare."*
- **Enterprises:** *"Email campaign collaboration that passes SOC 2 audits."*

**Key Messages:**
1. **Security:** Stop sharing SMTP passwords → role-based access + encrypted vault
2. **Visibility:** Know who sent what, when, from which account → full audit trail
3. **Efficiency:** One dashboard for all accounts → stop switching between 5 platforms
4. **Collaboration:** Shared templates, AI generation, team workflows → stop duplicating work
5. **Compliance:** Audit logs, SSO, GDPR tools → pass enterprise security reviews

**Proof Points:**
- *"10 hours/month saved on credential management"* (agency case study)
- *"Zero password-related security incidents since switching"* (enterprise testimonial)
- *"3x faster team member onboarding"* (startup case study)
- *"20x ROI in first 6 months"* (SMB case study)

### 3.8 Monetization Principles (B2B SaaS Model)

1. **Charge for Collaboration, Not Commodity** — Revenue from team features and workflow automation, NOT from email infrastructure (which is commoditized)

2. **Per-Seat Pricing at Scale** — Free/Starter for individuals, Pro unlocks teams (3 seats), Business scales per-seat ($8/seat beyond 10)

3. **Value-Based Tiers** — Each tier solves a specific team size/complexity: Solo → Small Team → Agency → Enterprise

4. **Land & Expand** — Start with free tier or Pro ($19), expand via:
   - Adding team members (hit 3-seat limit → upgrade to Business)
   - Adding accounts (hit 15-account limit → upgrade to Business)
   - Needing enterprise features (SSO, audit logs → upgrade to Enterprise)

5. **High-Touch Enterprise** — Custom pricing, annual contracts, security reviews — this is where margins expand

6. **Product-Led Growth for SMB** — Self-service free → paid, in-app prompts, no sales rep needed under $49/mo

7. **Negative Churn via Expansion** — Upsells (more seats, more features) offset gross churn → net revenue retention >100%

8. **Transparent, Predictable Pricing** — No per-email surprises, no hidden fees — build trust with B2B buyers

9. **Annual Commitment Discount** — 25% off for annual (improve cash flow, reduce churn, reward commitment)

10. **Complement, Don't Compete** — We work WITH Resend/SendGrid/Mailchimp, not against them — makes us easier to buy ("keep your current stack, add zecompaign for team features")

---

## 4. Public User Signup & Onboarding

### 4.1 Sign-Up Flow

**zecompaign is now a public platform** — anyone can create an account and start using it immediately.

#### Registration Options
1. **Email + Password** — Standard Supabase Auth
2. **Social Login** — Google OAuth (priority), GitHub OAuth (for developers)
3. **Magic Link** — Passwordless email login

#### Required Fields (Minimal Friction)
- Email address
- Full name
- Password (if not using social/magic link)
- Agree to Terms of Service + Privacy Policy

#### Optional Fields (Captured Later)
- Company name
- Use case (dropdown: Marketing, Agency, E-commerce, SaaS, Other)
- Team size
- Referral source

### 4.2 Onboarding Sequence

**Goal:** Get users to their first successful email send within 5 minutes.

#### Step 1: Welcome Screen (Skippable)
- "Welcome to zecompaign! Let's get you set up in under 3 minutes."
- Option to start guided tour or skip to dashboard

#### Step 2: Add First SMTP Account (Required)
- **Simplified form with provider quick-select** (Resend, Gmail, SendGrid, Mailgun, AWS SES, Custom)
- **Inline help:** "Already have an SMTP account? Add it here. Don't have one? [Sign up for Resend](https://resend.com) — 3K free emails/month."
- **What we store:** SMTP credentials (encrypted in Vault), from email, display name
- **What we DON'T do:** We don't send emails ourselves; we use YOUR account to send on your behalf
- Connection test required before proceeding
- Pre-fill "from email" based on SMTP account

#### Step 3: Optional Gemini API Key
- "Want AI-powered templates? Add your Google Gemini API key"
- Inline link: "Get free key at [aistudio.google.com](https://aistudio.google.com)"
- Skip option: "I'll add this later"

#### Step 4: Send First Email (Guided)
- Pre-filled template: "Hello from zecompaign!"
- User only needs to add recipient email and click Send
- **Clarification:** Email sends through YOUR SMTP account (e.g., Resend), not our servers
- Success message: "Great! Email sent via [Account Name]. You have 2 more SMTP accounts available on Free plan. [Upgrade](…) to add more."

#### Step 5: Quick Tour (Interactive)
- Highlight key features: Dashboard, AI Generator, Templates, Analytics
- "You're all set! Need help? Check our [docs](…) or [contact support](…)"

### 4.3 Email Verification
- Required for Free tier before sending emails (prevent spam abuse)
- Automated email with magic link: "Verify your email to start sending"
- Paid plans can send immediately (payment verification is sufficient)

### 4.4 Tenant Isolation
- Each signup creates a new **organization** (tenant)
- All data (accounts, templates, emails, users) scoped to `organization_id`
- Row Level Security enforces tenant boundaries at database level
- User can create/join multiple organizations (but not on Free tier)

---

## 5. Feature Specifications (Updated for Multi-Tenant SaaS)

---

## 5. Feature Specifications (Updated for Multi-Tenant SaaS)

### 5.1 Authentication & User Management

**Purpose:** Public signup with secure tenant isolation and plan-based feature gating.

#### User Registration
- **Public Sign-Up** — Anyone can create an account via email/password, Google OAuth, or GitHub OAuth
- **Email Verification** — Required for Free tier before first send
- **Organization Creation** — Each signup automatically creates a new organization (tenant)
- **Invited Users** — Team/Enterprise plans can invite additional users to their organization

#### Roles (Per Organization)
| Role | Permissions | Available On |
|------|-------------|--------------|
| `owner` | Full control, billing, invite users, delete org | All paid plans |
| `admin` | Manage accounts, keys, users; cannot access billing | Pro, Business, Enterprise |
| `member` | Compose/send, use AI, manage own templates | Pro, Business, Enterprise |
| `viewer` | Read-only dashboard and history | Business, Enterprise |

#### Plan Enforcement
- **Hard Limits** — API endpoints check plan limits before execution (emails/month, SMTP accounts, AI generations)
- **Soft Warnings** — At 80% of limit, show upgrade prompt
- **Grace Period** — 7 days after limit exceeded before blocking (with persistent upgrade banner)
- **Feature Flags** — Database-driven feature access by plan (e.g., `team_collaboration`, `custom_branding`, `api_access`)

#### Billing Integration
- **Stripe** — Subscription management, payment processing
- **Customer Portal** — Self-service plan upgrades, downgrades, cancellations
- **Usage Tracking** — Real-time counters for emails sent, AI generations, SMTP accounts
- **Invoice History** — Automatic PDF receipts via Stripe

---

### 5.2 Sending Account Manager

**Purpose:** Store and manage multiple email-sending accounts with plan-based limits and tenant isolation.

**Supported Providers:**
- **Resend** — Recommended for Free tier users (generous free tier)
- **Gmail** — App password auth
- **SendGrid** — API key-based
- **Mailgun** — API key-based  
- **AWS SES** — Access key + secret
- **Custom SMTP** — Full control over host, port, SSL, credentials

**Plan Limits:**
| Plan | Max SMTP Accounts |
|------|-------------------|
| Free | 3 |
| Starter | 5 |
| Pro | 15 |
| Business | Unlimited |
| Enterprise | Unlimited |

**Fields per account:** (unchanged structure)
| Field | Required | Notes |
|-------|----------|-------|
| Name | ✅ | Friendly label (e.g. "Newsletter Account") |
| Provider | ✅ | resend / gmail / sendgrid / mailgun / ses / custom |
| From Email | ✅ | Must match verified sender |
| From Name | | Display name in email client |
| Credential | ✅ | Stored encrypted in Supabase Vault |
| Host / Port / TLS | Custom only | Auto-filled for known providers |
| Daily Send Limit | | Optional self-imposed throttle |

**Behaviors:**
- **Tenant Scoping** — All accounts scoped to `organization_id`, enforced by RLS
- **Connection Test** — Server validates credentials via `nodemailer.verify()` or provider API health check
- **Default Account** — User can set personal default for quick compose
- **Enable / Disable** — Soft delete without losing history
- **Account Health** — Track bounce rates, spam complaints; auto-disable if threshold exceeded

---

### 5.3 Compose Email

**Purpose:** Send emails through user's connected SMTP accounts, with team-based sharing and access control.

**Critical Flow:** 
1. User composes email in zecompaign UI
2. Selects which SMTP account to send from (from their accessible accounts)
3. zecompaign retrieves encrypted credentials from Vault (server-side only)
4. Sends email via that SMTP account using Nodemailer or provider SDK
5. Logs the send to `sent_emails` for audit trail
6. **zecompaign NEVER sends from our own infrastructure** — always through user's accounts

**Plan Limits (NOT email volume, but account access):**
| Plan | Max SMTP Accounts | Team Members | Account Sharing |
|------|-------------------|--------------|-----------------|
| Free | 3 | 1 (you) | No sharing |
| Starter | 5 | 1 (you) | No sharing |
| Pro | 15 | 3 included | Share accounts with team |
| Business | Unlimited | 10 included | Full team sharing + roles |
| Enterprise | Unlimited | Unlimited | Full team sharing + roles |

**Note on "Email Quotas":** Unlike Mailchimp, we DON'T limit how many emails you can send per month, because you're sending through YOUR accounts (Resend, Gmail, etc.). Your sending limits are determined by YOUR SMTP provider, not us. We only limit how many SMTP accounts you can connect and how many team members can access them.

**Enhanced Features:**
- **Account Selection** — Dropdown shows all SMTP accounts you have access to (owned or shared with you)
- **Rate Limiting** — Respects rate limits of the underlying SMTP provider (e.g., Gmail: 500/day)
- **Send Later** — Schedule emails (Pro+ only)
- **A/B Testing** — Split recipients between variants (Pro+ only)
- **Personalization Variables** — `{{firstName}}`, `{{company}}` merge tags (Pro+ only)

**Compliance (All Plans):**
- **Suppression List** — Org-scoped unsubscribe/bounce list, checked before every send
- **Unsubscribe Link** — Auto-appended footer with one-click unsubscribe (CAN-SPAM, GDPR compliant)
- **Double Opt-In Tracking** — Log consent timestamp (Business+ feature)

**Send Flow:**
1. User submits via `/api/send-email` with `account_id` (which SMTP account to use)
2. Server verifies:
   - User has access to that account (RLS check)
   - Recipients not in suppression list
3. Decrypts account credentials from Vault (server-side only)
4. Builds Nodemailer transport with user's SMTP config
5. Sends email through **user's SMTP server** (not ours)
6. Logs to `sent_emails` with `organization_id`, `user_id`, `account_id`
7. Returns success/error

**What We DON'T Do:**
- ❌ Track or limit monthly email send volume (that's your SMTP provider's job)
- ❌ Charge per-email fees (we're not the sending infrastructure)
- ❌ Impose artificial sending caps beyond what your SMTP provider allows

---

### 5.4 AI Template Generator

**Purpose:** Generate professional email templates with Google Gemini, with plan-based limits and team collaboration.

**Plan Limits:**
| Plan | Monthly AI Generations | Model Access |
|------|----------------------|--------------|
| Free | 15 | Flash 3.5 only |
| Starter | 100 | Flash 3.5 + Pro 3.5 |
| Pro | 500 | All models |
| Business | 2,000 | All models + priority |
| Enterprise | Custom | All models + fine-tuned |

**Enhanced Features:**
- **Usage Counter** — "7 / 10 AI generations used this month. [Upgrade](…)"
- **Model Selection** — Free tier locked to `gemini-3.5-flash`; paid tiers choose model
- **Tone Presets** — Extended with "Sales", "Educational", "Apologetic" (Pro+)
- **Brand Voice Training** — Upload brand guidelines, templates; AI learns style (Enterprise)
- **Multi-Language** — Generate in 50+ languages (Team+ only)

**API Key Management:**
- **User-Provided Keys** — Users can add own Gemini API keys (all plans)
- **Platform Keys** — zecompaign-managed keys with auto-failover (Pro+ backup option)
- **Priority** — User keys used first; platform keys as fallback (prevents abuse)

**Generation Flow:**
1. Check org's AI generation quota
2. Attempt with user's active Gemini key (if any)
3. On failure/rate-limit, fall back to platform key (Pro+ only)
4. Decrement org's generation counter
5. Save to shared `templates` table (org-scoped)
6. Return result with model used + remaining quota

---

### 5.5 Saved Templates

**Purpose:** Shared template library with team collaboration and marketplace.

**Plan Limits:**
| Plan | Max Saved Templates | Sharing |
|------|-------------------|---------|
| Free | 50 | Private only |
| Starter | 200 | Private only |
| Pro | Unlimited | Share within org |
| Business | Unlimited | Share + publish to marketplace |
| Enterprise | Unlimited | Share + publish + white-label |

**Enhanced Features:**
- **Template Folders** — Organize by campaign, client, type (Pro+)
- **Version History** — Track edits, restore previous versions (Team+)
- **Template Marketplace** — Browse/purchase community templates (Pro+, rev-share with creators)
- **Template Analytics** — Track usage, open rates, conversions (Team+)
- **Duplicate Protection** — Warn if similar template exists

**Marketplace Monetization (Future):**
- Creators publish templates for $5-50 each
- zecompaign takes 30% transaction fee
- Enterprise plans get marketplace templates included

---

### 5.6 Dashboard

**Purpose:** Real-time analytics and usage insights with plan-appropriate detail level.

**All Plans:**
- Emails sent/failed this month
- Active SMTP accounts count
- AI generations used
- Quick actions (Compose, Generate AI, Add SMTP)

**Starter+ Features:**
- Open rate tracking (via tracking pixel)
- Click tracking (via link rewrites)
- Bounce/complaint rates per account
- Send volume chart (7d, 30d, all time)

**Pro+ Features:**
- Team activity feed (who sent what, when)
- Per-user analytics
- Per-account performance comparison
- Deliverability score

**Business+ Features:**
- Custom date ranges
- Export to CSV/PDF
- Scheduled reports (daily/weekly email)
- API access for custom dashboards

---

## 6. Usage Tracking & Billing

### 3.1 Authentication & Access Control

**Purpose:** Ensure only invited company teammates can access the dashboard, and that account access is scoped appropriately.

- **Supabase Auth** — email/password or magic link. No public sign-up; users are provisioned by an admin.
- **Roles:**
  | Role | Permissions |
  |------|-------------|
  | `admin` | Manage users, all sending accounts, all Gemini keys, full dashboard visibility |
  | `marketer` | Compose/send, use AI generator and templates; sending-account access limited to explicit grants |
  | `viewer` | Read-only dashboard and send history |
- **Row Level Security (RLS)** enforced on every table at the database level — access control isn't just a UI convenience, it's enforced server-side regardless of client behavior.

---

### 3.2 Sending Account Manager (formerly "SMTP Configuration Manager")

**Purpose:** Store and manage multiple email-sending accounts, shared across the team, with scoped access.

**Supported Providers:**
- **Resend** — API key-based, `smtp.resend.com:465`
- **Gmail** — App password auth
- **Custom SMTP** — Full control over host, port, SSL, credentials

**Fields per account:**
| Field | Required | Notes |
|-------|----------|-------|
| Name | ✅ | Friendly label (e.g. "Product X — EU") |
| Provider | ✅ | gmail / resend / custom |
| From Email | ✅ | Must match verified sender |
| From Name | | Display name in email client |
| Credential (API key / password) | ✅ | Stored encrypted in Supabase Vault, never in a plaintext column, never sent to the browser |
| Host / Port / TLS | Custom only | Auto-filled for Resend and Gmail |
| Access grants | ✅ | Which teammates (beyond admins) can use this account |

**Behaviors:**
- **Default account** — Each user can mark a personal default among the accounts they're granted access to.
- **Enable / Disable** — Toggle an account off without deleting it (e.g. rotating credentials).
- **Connection Test** — Server route runs `nodemailer.verify()` against the live server; credential is decrypted server-side only for this check.
- **Scoped visibility** — A user's account dropdown (in Compose, Dashboard filters, etc.) only ever shows accounts they've been granted access to. Admins see all accounts.
- **Persistence** — Stored in Supabase Postgres (`sending_accounts`, `account_access`), shared across the whole team in real time.

---

### 3.3 Compose Email

**Purpose:** Send one email to single or multiple recipients using any sending account the user has access to.

**Recipient handling:** (unchanged from v1.1)
- **To / CC / BCC** fields each accept free-form email entry
- Press `Enter` or `,` to add a recipient tag
- Paste comma-separated list to bulk-add
- Supports RFC format: `"Alice Smith" <alice@example.com>`
- Each recipient appears as a removable chip tag

**New in v2:**
- **Suppression check** — before sending, recipients are checked against the team's `suppressed_recipients` list (unsubscribed, bounced, or manually suppressed); suppressed addresses are flagged and excluded automatically.
- **Unsubscribe footer** — bulk sends automatically append a signed, one-click unsubscribe link.
- **Rate-limited send queue** — sends are queued and paced per account rather than fired synchronously, to protect sending reputation.

**Fields:** (unchanged from v1.1)
| Field | Notes |
|-------|-------|
| Sending Account | Dropdown, scoped to the user's `account_access` grants |
| To | One or many recipients |
| CC / BCC | Collapsed by default, expand on click |
| Reply-To | Optional override |
| Subject | Plain text |
| Body Format | Toggle between HTML, Plain Text, or Both |
| Attachments | Multiple file upload, max 10MB per file, 25MB total, stored in Supabase Storage |

**Send flow (updated):**
1. Client submits draft to `/api/send-email` with `account_id` (not raw credentials)
2. Server verifies the caller has `account_access` to that account via RLS
3. Server checks recipients against `suppressed_recipients`
4. Server decrypts the account's credential from Vault, builds a `nodemailer` transport
5. Send is queued/paced, then executed
6. Result logged to `sent_emails` with `sent_by` and `account_id` for audit history
7. Inline result shown (success or error)

---

### 3.4 AI Template Generator

**Purpose:** Generate professional HTML email templates using Google Gemini, with automatic multi-key failover, shared across the team.

**Inputs:** (unchanged from v1.1)
| Input | Type | Options |
|-------|------|---------|
| Email Type | Chip selector | Promotional, Welcome, Newsletter, Follow-up, Cold Outreach, Transactional, Announcement, Thank You, Invitation, Reminder |
| Tone | Chip selector | Professional, Friendly, Formal, Casual, Urgent, Empathetic, Enthusiastic, Concise |
| Prompt | Textarea | Free-form description of the email goal |

**Generation flow:** (unchanged logic, keys now team-shared)
1. Active Gemini keys (managed by admins) sorted by priority
2. Server iterates keys: tries key #1 → on error, tries key #2 → … until success
3. Gemini returns `{ subject, bodyHtml, bodyText }`
4. Result displayed with which key/model was used

**Output panel & editing:** unchanged from v1.1 — preview/HTML tabs, inline WYSIWYG-style editing, Save Template, Copy HTML, Use in Compose, Regenerate.

**Saving:** Templates save to the shared `templates` table — visible to the whole team immediately, not just the author's browser.

---

### 3.5 Gemini API Key Manager (Admin Settings)

**Purpose:** Add, prioritize, enable/disable multiple Gemini API keys with model selection, managed by admins on behalf of the team.

**Key fields:** (unchanged from v1.1)
- Label, masked API key (toggle reveal, admin-only), Model, Active/Inactive, Priority order

**Supported Models:**
- `gemini-3.5-flash` — default, optimized for speed
- `gemini-3.1-flash-lite` — cost-efficient, high-volume tasks
- `gemini-3.5-live-translate-preview` — real-time speech translation (preview, likely unused in this product but available)

**Change from v1.1:** Keys are stored Vault-encrypted in Supabase, managed only by `admin` role, and shared across every team member's AI generation requests — no more per-browser key sprawl.

---

### 3.6 Saved Templates

**Purpose:** Browse, preview, edit, and reuse templates — now a genuine shared team library instead of a per-browser cache.

Feature set unchanged from v1.1 (grid view, preview panel, visual WYSIWYG editing, Use in Compose, Copy HTML, Delete), with the underlying change that every template is visible and reusable by the whole team the moment it's saved.

---

### 3.7 Dashboard

**Purpose:** At-a-glance summary of team-wide system state (not just the current browser's activity).

**Stats cards:**
- Emails Sent (team-wide total)
- Emails Failed
- Active Sending Accounts
- Active Gemini Keys

**Recent Emails table:**
- Team-wide send history, filterable by account and by sender
- Columns: Sender, Recipients, Subject, Account Used, Status, Timestamp
- Failed emails show error badge

**Quick Actions:** Compose Email, Generate with AI, Add Sending Account (admin only)

---

## 6. Usage Tracking & Billing

### 6.1 What We Track (Platform Features, Not Email Volume)

**Per-Organization Counters:**
- `smtp_accounts_count` — How many SMTP accounts connected (checked against plan limit)
- `team_members_count` — How many users in the org (checked against plan limit)
- `ai_generations_this_month` — Incremented on each AI request (reset monthly)
- `storage_used_mb` — Attachments + templates in Supabase Storage
- `templates_count` — Total saved templates (checked against plan limit on Free/Starter)

**What We DON'T Track:**
- ❌ Emails sent per month (that's not our business model)
- ❌ Per-contact charges (we don't manage contact lists)
- ❌ Email delivery metrics (that's your SMTP provider's responsibility)

**Enforcement:**
- Hard limits at API level: Can't add 4th SMTP account on Free tier
- Soft limits with upgrade prompts: "You've used 14/15 AI generations. [Upgrade](…)"
- Real-time display: "2 / 3 SMTP accounts connected. [Add another](…)"

### 6.2 Subscription Management (Stripe)

**Checkout Flow:**
1. User clicks "Upgrade to Pro" → lands on pricing page
2. Selects plan → Stripe Checkout session
3. Payment → Webhook updates `organizations.plan` and `plan_expires_at`
4. Instant feature unlock (no page refresh needed)

**Plan Changes:**
- **Upgrade** — Proration credit, instant access to new limits
- **Downgrade** — Takes effect at end of billing period, features gradually disabled
- **Cancellation** — Access until period end, then downgrade to Free (data retained)

**Invoicing:**
- Automatic monthly/annual invoices via Stripe
- PDF receipts emailed automatically
- Self-service customer portal for invoice history

### 6.3 Usage-Based Add-Ons

**One-Time Purchases (Per-Org):**
- Extra emails, extra AI generations (tracked separately from monthly quota)
- Purchased via Stripe, credited immediately
- No expiration (use anytime)

**Recurring Add-Ons:**
- Priority Queue ($20/mo) — flag on `organizations` table
- Dedicated IP ($50/mo) — custom SMTP routing logic
- Billed alongside main subscription

---

## 7. Data Architecture (Multi-Tenant)

---

## 7. Data Architecture (Multi-Tenant)

All data persisted in **cloud-hosted Supabase** with strict tenant isolation via Row Level Security.

### Core Tables (Updated for Multi-Tenancy)

**`organizations`** — Each signup creates one org (tenant)
```sql
id, name, slug, plan, plan_expires_at, emails_sent_this_month, 
ai_generations_this_month, smtp_accounts_count, storage_used_mb,
stripe_customer_id, stripe_subscription_id, created_at
```

**`profiles`** — User accounts (can belong to multiple orgs)
```sql
id, email, full_name, avatar_url, created_at
```

**`organization_members`** — Many-to-many: users ↔ orgs
```sql
id, organization_id, user_id, role (owner/admin/member/viewer), invited_by, joined_at
```

**`sending_accounts`** — SMTP configs (tenant-scoped)
```sql
id, organization_id, name, provider, from_email, from_name, 
credential_ref (Vault), host, port, tls, active, daily_limit, created_by, created_at
```

**`gemini_keys`** — AI API keys (tenant-scoped)
```sql
id, organization_id, label, key_ref (Vault), model, active, priority, created_by, created_at
```

**`templates`** — Email templates (tenant-scoped)
```sql
id, organization_id, name, subject, body_html, body_text, 
is_public (for marketplace), created_by, created_at, updated_at
```

**`sent_emails`** — Send log (tenant-scoped, audit trail)
```sql
id, organization_id, user_id, account_id, recipients (jsonb), 
subject, body_html, status, error, sent_at
```

**`suppressed_recipients`** — Unsubscribe/bounce list (tenant-scoped)
```sql
id, organization_id, email, reason (unsubscribed/bounced/spam), suppressed_at
```

**`usage_logs`** — Detailed usage tracking (for billing transparency)
```sql
id, organization_id, user_id, event_type (email_sent/ai_generated), 
metadata (jsonb), created_at
```

**`invoices`** — Stripe invoice mirror (for quick lookups)
```sql
id, organization_id, stripe_invoice_id, amount_cents, status, period_start, period_end, pdf_url
```

### Security Model
- **Row Level Security (RLS)** on every table enforces `organization_id` matching
- **Credentials via Supabase Vault** — SMTP passwords, API keys never in plaintext columns
- **Attachments in Supabase Storage** — Scoped to `organizations/{org_id}/attachments/`
- **Audit Logging** — All sensitive actions (invite user, change plan, delete account) logged to `audit_log` table

---

## 8. API Routes & Server Actions

---

## 8. API Routes & Server Actions

### Public API Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/auth/signup` | POST | Create account + organization | Public |
| `/api/auth/signin` | POST | Login with email/password | Public |
| `/api/auth/oauth` | GET | Google/GitHub OAuth callback | Public |
| `/api/auth/magic-link` | POST | Send passwordless login email | Public |
| `/api/unsubscribe` | POST | Public unsubscribe endpoint (signed token) | Public |

### Authenticated API Routes (Require session)

| Route | Method | Purpose | Plan Required |
|-------|--------|---------|---------------|
| `/api/send-email` | POST | Send email, checks quota + suppression | All |
| `/api/test-smtp` | POST | Verify SMTP connection | All |
| `/api/generate-template` | POST | AI template generation, checks quota | All |
| `/api/webhooks/stripe` | POST | Handle subscription events | System |
| `/api/webhooks/email-status` | POST | Delivery notifications (Resend, SendGrid, etc.) | System |

### Server Actions (RSC via Next.js)

- **Account Management** — CRUD for `sending_accounts`, enforces plan limits
- **Key Management** — CRUD for `gemini_keys`, admin-only
- **Template Management** — CRUD for `templates`, org-scoped
- **User Management** — Invite/remove users (Team+ only)
- **Billing Actions** — `createCheckoutSession()`, `createPortalSession()`, `cancelSubscription()`

---

## 9. Tech Stack (Updated)

---

## 9. Tech Stack (Updated)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router, Turbopack) | Server components, server actions |
| Language | TypeScript | Full type safety |
| Backend | Supabase (Cloud) | Postgres, Auth, Vault, Storage, Realtime |
| Payments | Stripe | Subscriptions, invoices, customer portal |
| Styling | CSS custom properties + Tailwind | Consistent theming |
| Icons | Lucide React | Lightweight, tree-shakeable |
| Email Sending | Nodemailer + Provider SDKs | Resend SDK, SendGrid API, etc. |
| AI | @google/generative-ai | Gemini 3.x models |
| Analytics | PostHog (self-hosted) | User behavior, feature usage |
| Monitoring | Sentry | Error tracking, performance |
| Hosting | Vercel | Edge functions, global CDN |

---

## 10. Setup & Configuration (SaaS Deployment)

---

## 10. Setup & Configuration (SaaS Deployment)

### Prerequisites
- Supabase Cloud project (or self-hosted instance)
- Stripe account (live + test mode keys)
- Vercel account (or alternative Next.js host)
- Google Gemini API key(s) for platform fallback (optional but recommended)
- Domain + SSL certificate

### Initial Deployment
1. Deploy Supabase schema (migrations in `/supabase/migrations/`)
2. Configure Supabase Auth providers (email, Google OAuth, GitHub OAuth)
3. Set environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   STRIPE_PUBLIC_KEY=
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   GEMINI_PLATFORM_KEY= (optional platform fallback)
   SENTRY_DSN=
   POSTHOG_KEY=
   ```
4. Deploy to Vercel: `vercel --prod`
5. Configure Stripe webhook endpoint: `https://zecompaign.com/api/webhooks/stripe`
6. Set up custom domain + SSL via Vercel

### First Admin User
- Sign up via `/signup` — first user automatically gets `owner` role
- Or manually create via Supabase SQL:
  ```sql
  INSERT INTO profiles (id, email, full_name) VALUES (...);
  INSERT INTO organizations (name, plan) VALUES ('Admin Org', 'enterprise');
  INSERT INTO organization_members (organization_id, user_id, role) VALUES (..., 'owner');
  ```

---

## 11. Anti-Abuse & Compliance

---

## 11. Anti-Abuse & Compliance

### Spam Prevention
- **Email Verification Required** — Free tier must verify email before sending
- **Rate Limiting** — Max 100 sends/hour per org on Free tier; graduated limits on paid
- **SMTP Warmup** — New accounts start with daily send limits (50/day → 500/day over 2 weeks)
- **Content Filtering** — AI scans outgoing emails for spam keywords; flags suspicious patterns
- **Abuse Reporting** — Public `/report-abuse` endpoint; auto-suspend after 3 reports pending review

### CAN-SPAM & GDPR Compliance
- **Unsubscribe Link** — Automatically appended to all bulk emails
- **Sender Identity** — Physical address required for bulk sends (enforced on Team+ plans)
- **Suppression List** — Org-scoped, automatically enforced
- **Data Retention** — 90-day auto-purge of `sent_emails` for Free tier; configurable on paid
- **GDPR Data Export** — Users can export all their data as JSON
- **Right to Deletion** — Account deletion permanently removes all org data after 30-day grace period

### Payment Fraud
- **Stripe Radar** — Built-in fraud detection
- **Trial Abuse Protection** — Max 1 free account per email domain
- **Disposable Email Blocking** — Block known temporary email providers on signup

---

## 12. Constraints & Limitations

---

## 12. Constraints & Limitations

| Constraint | Detail | Mitigation |
|-----------|--------|-----------|
| SMTP credential security | Users must provide own SMTP credentials | Vault-encrypted storage, never exposed to browser |
| Gmail 2FA required | Gmail accounts must use App Password | Clear docs + onboarding guide |
| HTML email only (v3.0) | No rich WYSIWYG source editor yet | contentEditable preview; full editor in v3.1 |
| Attachment size limits | 10MB per file, 25MB total per email | Use link sharing for larger files |
| Send rate limiting | Sends queued/paced to protect deliverability | Paid plans get higher throughput |
| AI cost | Gemini API usage not included in plan price | Users provide own keys; platform fallback (Pro+) as convenience |
| No native list management | No built-in contact/segment management | Integrate with CRMs via API (v3.2) |

---

## 13. Roadmap (Future Versions)

### v3.1 (Q4 2026)
- **Rich WYSIWYG Editor** — TipTap or Unlayer for visual email building
- **CSV Contact Import** — Upload lists with custom fields for personalization
- **Email Scheduling** — Send at specific date/time
- **Inline Image Upload** — Embed images directly in email body

### v3.2 (Q1 2027)
- **Email Sequences** — Drip campaigns with triggers (opened, clicked, waited X days)
- **A/B Testing** — Split test subjects, content, send times
- **Deliverability Analytics** — Spam score checker, domain reputation monitoring
- **CRM Integrations** — Two-way sync with HubSpot, Salesforce, Pipedrive

### v3.3 (Q2 2027)
- **Template Marketplace Launch** — Creators sell templates, rev-share model
- **Zapier / Make Integration** — Pre-built automation recipes
- **API for Developers** — Programmatic sending, template management
- **White-Label for Enterprise** — Custom domain, logo, colors

### v4.0 (2028+)
- **SMS Campaigns** — Multi-channel with Twilio integration
- **Landing Page Builder** — Create pages for email CTAs
- **Advanced Segmentation** — Behavioral triggers, predictive scoring
- **Mobile App** — iOS/Android for on-the-go campaign management

---

## 14. Success Metrics (KPIs)

---

## 14. Success Metrics (KPIs)

### Growth Metrics
| Metric | Target (Month 6) | Target (Month 12) |
|--------|------------------|-------------------|
| Total Signups | 5,000 | 20,000 |
| Active Users (MAU) | 3,000 | 14,000 |
| Free → Paid Conversion | 5% | 7% |
| Monthly Churn Rate | <8% | <5% |

### Revenue Metrics
| Metric | Target (Month 6) | Target (Month 12) |
|--------|------------------|-------------------|
| MRR | $18,000 | $58,000 |
| ARPU | $32 | $38 |
| LTV:CAC Ratio | 2.5:1 | 4:1 |

### Engagement Metrics
| Metric | Definition | Target |
|--------|-----------|--------|
| Emails Sent per Org | Monthly average | 1,500 |
| AI Generations per Org | Monthly average | 25 |
| Templates Created | Team avg | 15 |
| Session Length | Avg per visit | 8 minutes |
| Weekly Active Rate | % of MAU active weekly | 45% |

### Quality Metrics
| Metric | Definition | Target |
|--------|-----------|--------|
| Email Deliverability | % not bounced/spam | >98% |
| Platform Uptime | SLA | 99.9% |
| Support Response Time | First reply | <4 hours |
| NPS Score | Customer satisfaction | >50 |

---

## 15. Go-to-Market Strategy (B2B SaaS Motion)

### Launch Plan (B2B Product-Led Growth)

#### Phase 1: Private Beta (Month 1-2) — Qualify ICP
- **Goal:** Validate product-market fit with ideal customer profile (marketing teams, agencies)
- **Target:** 50 high-quality teams (not just individuals)
- **Qualification:** Must have 3+ people who need email collaboration OR manage 5+ SMTP accounts
- **Incentive:** Lifetime 50% off Pro/Business tier (lock in early advocates)
- **Activities:**
  - Invite marketing teams from YC companies, indie hacker communities
  - Personal outreach to agency owners on Twitter/LinkedIn
  - Closed beta signup with qualification questions
  - Weekly user interviews (15-20 calls)
- **Success Metric:** 80% of beta users are teams (not solopreneurs), 60% active weekly

---

#### Phase 2: Public Beta (Month 3-4) — Build Pipeline
- **Goal:** Generate 500+ signups, prove free → paid conversion
- **Target:** Early adopter marketing teams, tech-savvy agencies
- **Activities:**
  - **Product Hunt launch** (ship on Tuesday, prep 100+ upvotes from beta users)
  - **Content:** Publish "How we solve SMTP credential sharing" case study
  - **SEO:** Optimize for "shared email account management", "team email collaboration"
  - **Partnerships:** Reach out to Resend, Supabase for co-marketing
  - **Community:** Active in r/SaaS, r/marketing, Indie Hackers
- **Success Metric:** 500 signups, 5% → paid conversion, 10 paying teams

---

#### Phase 3: Official Launch + Growth (Month 5-12) — Scale Acquisition
- **Goal:** $65K MRR by Month 12, 250+ paying teams
- **Activities:**
  - **Content marketing:** 2 posts/week on email operations, team collaboration, security
  - **Comparison pages:** "zecompaign vs Mailchimp", "Notion for email vs zecompaign"
  - **Google Ads:** Target "email collaboration tool", "SMTP management", "agency email tools"
  - **Affiliate program:** 25% recurring for agencies who refer other agencies
  - **Case studies:** 1 per month showcasing ROI (hours saved, security improved)
  - **Webinars:** "How to secure your marketing team's email operations" (lead gen)
  - **Integration partnerships:** Listed in Resend marketplace, Supabase partners
- **Success Metric:** $65K MRR, 2,958 paid users, <5% monthly churn

---

### Marketing Channels (B2B Focus)

| Channel | Strategy | Budget (Mo 6-12) | Lead Source % | CAC Target |
|---------|----------|------------------|---------------|------------|
| **Content Marketing (SEO)** | Blog posts on "email team collaboration", "SMTP security", comparison guides | $3,000 (writers) | 35% | $25 |
| **Product Hunt & Communities** | Launch + active participation in indie hacker, r/SaaS, r/marketing | $500 (assets) | 15% | $15 |
| **Google Ads (Search)** | "Email collaboration tool", "SMTP team management", "Mailchimp alternative for teams" | $5,000 | 25% | $60 |
| **Partnerships (Co-marketing)** | Featured in Resend, Supabase, Vercel partner directories | $0 (mutual) | 10% | $0 |
| **Affiliate Program** | 25% recurring for agencies, SaaS influencers, course creators | Variable (25% LTV) | 10% | $100 |
| **LinkedIn Outreach (Enterprise)** | Target VPs of Marketing, agency owners (sales-assisted) | $2,000 (tools+ads) | 5% | $500 |
| **Total** | | **$10,500/mo** | **100%** | **$40 blended** |

---

### Positioning Campaigns

#### Campaign 1: "No More Shared Passwords" (Security Angle)
**Target:** Security-conscious teams, enterprises  
**Message:** *"Your team shares Gmail passwords in Slack. HR would freak out. IT would fire you. We built a better way."*  
**CTA:** "See how zecompaign secures your email operations →"  
**Landing Page:** Security features (vault, audit logs, SSO), compliance badges

---

#### Campaign 2: "Notion for Email" (Collaboration Angle)  
**Target:** Modern SaaS teams who use Notion/Slack  
**Message:** *"You use Notion for docs, Slack for chat. What about email campaigns? Introducing zecompaign."*  
**CTA:** "Organize your email operations →"  
**Landing Page:** Collaboration features (shared accounts, templates, team analytics)

---

#### Campaign 3: "Agency Command Center" (Agency Angle)
**Target:** Digital marketing agencies, white-label providers  
**Message:** *"Managing 20 client email accounts in a spreadsheet? That's insane. Here's the agency command center."*  
**CTA:** "See how agencies use zecompaign →"  
**Landing Page:** Client workspace features, unlimited accounts, usage reports for billing

---

#### Campaign 4: "Ditch Mailchimp's Markup" (Value Angle)
**Target:** Cost-conscious teams currently using Mailchimp/SendGrid  
**Message:** *"Mailchimp charges $350/mo for features you can get for $49 + your own SMTP. Do the math."*  
**CTA:** "Calculate your savings →"  
**Landing Page:** ROI calculator, migration guide, comparison table

---

## 16. Open Questions

---

## 16. Open Questions

- **Freemium Abuse:** How to prevent users creating unlimited free accounts? (Current: 1 per email domain, email verification, rate limiting)
- **AI Cost Management:** Should platform-provided Gemini keys have hard per-org limits to prevent runaway costs? (Proposed: Yes, 50 generations/day per org on platform keys)
- **GDPR Data Export:** Auto-generate or manual support ticket? (Proposed: Self-service dashboard button)
- **Affiliate Payouts:** Monthly automatic via Stripe Connect or manual PayPal? (Proposed: Stripe Connect for scale)
- **Template Marketplace:** Launch in v3.0 or wait until v3.3? (Depends on creator interest during beta)
- **Multi-Org Support:** Should single user be able to switch between multiple orgs (agency use case)? (Proposed: Yes, Free tier = 1 org, Paid = unlimited)

---

## 17. Version History

### v3.0 (This version — In Design)
- **Transformed to public SaaS platform** with freemium monetization
- Added public signup, email verification, social auth (Google, GitHub)
- Implemented multi-tenant architecture with strict tenant isolation
- Added 4-tier pricing: Free, Pro ($29), Team ($99), Enterprise (custom)
- Integrated Stripe for subscription management and usage-based add-ons
- Added plan-based feature gating and quota enforcement
- Implemented onboarding flow optimized for first email within 5 minutes
- Added usage tracking, analytics, and billing transparency
- Designed go-to-market strategy with content marketing, Product Hunt, affiliates
- Projected revenue: $60K-$600K Year 1 depending on conversion rates

### v2.0 (Superseded)
- Replaced `localStorage` prototype with self-hosted Supabase backend
- Added Supabase Auth with role-based access (`admin` / `marketer` / `viewer`)
- Added Row Level Security across all tables
- Moved all credentials to Supabase Vault (encrypted, server-side only)
- Added scoped multi-account access (`account_access`)
- Added suppression list and unsubscribe handling
- Added rate-limited send queue
- Added team-wide audit trail
- Migrated attachments to Supabase Storage
- **Target:** Internal team tool (single organization)

### v1.1 (Shipped, June 2026)
- Multi-SMTP management (Resend, Gmail, Custom) — per-browser, localStorage-based
- Bulk email composition and sending
- AI template generation with Gemini, multi-key auto-failover
- Saved template library (per-browser)
- Dashboard with stats and activity log (per-browser)
- **Target:** Solo users, proof of concept

---

## 18. Appendix: Competitive Analysis

| Competitor | Pricing | Type | Strengths | Weaknesses | zecompaign Advantage |
|-----------|---------|------|-----------|-----------|---------------------|
| **Mailchimp** | $13-$350/mo | All-in-one ESP | Brand recognition, templates, easy UI | Expensive at scale, locks you into their infrastructure | **We're not competing** — users keep their Mailchimp if they want, or use cheaper alternatives + our platform for team management |
| **SendGrid** | $20-$90/mo | Transactional ESP | Reliable delivery, good API | No UI, developer-focused | **Complementary** — use SendGrid for sending + zecompaign for team collaboration |
| **Resend** | Pay-per-send | Modern transactional API | Developer-first, great DX, modern API | No UI, no team features, no templates | **Perfect combo** — Resend ($0.10/email) + zecompaign ($19/mo) = best of both worlds |
| **Front / Help Scout** | $19-49/user/mo | Shared inbox | Team email collaboration | Only for support emails, not campaigns | We do shared SMTP management for marketing, not inbox management |
| **1Password / Vault** | $8-20/user/mo | Credential management | Secure password sharing | No sending UI, no email features | We're "1Password for SMTP" + a sending platform |
| **Agency-built solutions** | Custom/freelance | Bespoke | Tailored to needs | Expensive to build, hard to maintain | Off-the-shelf solution for $49/mo vs $5K+ custom build |

**zecompaign's Unique Position:** 
- **Not competing with ESPs** — We don't send emails, we manage accounts that send emails
- **Complementary to Resend/SendGrid/SES** — Users keep using their preferred provider, add our management layer
- **Closest comparison:** "Notion for email accounts" or "1Password for SMTP + team collaboration + AI"
- **Unique value:** Secure SMTP credential sharing with team features, AI generation, unified analytics — for a fraction of building it in-house

---

*zecompaign v3.0 — AI-powered email campaigns for everyone, from solopreneurs to enterprises.*