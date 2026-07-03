# zecompaign — Elevator Pitch

## 30-Second Version

**zecompaign** is Notion for email campaigns — a B2B collaboration platform where marketing teams securely manage all their SMTP accounts, share access without sharing passwords, and send campaigns from one unified dashboard. We're not an email service provider; we're the missing team layer that sits on top of your existing email infrastructure. $49/mo for 5 seats vs $50K to build it yourself.

---

## 1-Minute Version

**Problem:** Marketing teams use 5-10 different email accounts (brands, products, regions, clients). Today, they share SMTP passwords via Slack — a massive security risk. There's no visibility into who sent what, onboarding takes hours, and SOC 2 audits are a nightmare.

**Solution:** zecompaign is a B2B SaaS platform where teams store all SMTP credentials in one vault-encrypted place, share accounts with role-based permissions (no password exposure), and send campaigns from a unified dashboard with full audit trails.

**Market:** 850K US companies with 10+ person marketing teams. We're targeting startups (3-10 marketers) and agencies (managing 10-50 clients).

**Traction:** [Launching Q3 2026]

**Business Model:** B2B SaaS, seat-based pricing. $49/mo for teams, $149/mo for agencies, enterprise custom pricing.

**Ask:** Seeking $500K seed to scale go-to-market.

---

## 2-Minute Version (With ROI Story)

**The Problem (30 seconds):**

Marketing teams today are juggling 5-10 different email accounts:
- Brand 1's Gmail account
- Product 2's Resend account  
- Client 3's SendGrid account
- EU region's SES account

How do they share access? They don't. They share passwords via Slack or spreadsheets.

**The consequences:**
- Security risk: 67% of data breaches involve stolen credentials
- No visibility: "Who sent what from which account?" → chaos
- Compliance nightmare: Can't pass SOC 2 audits with Slack password sharing
- Onboarding hell: 3 hours to manually share credentials with new hires

**The Solution (45 seconds):**

**zecompaign** is a B2B collaboration platform that solves this:

1. **Centralized vault** — All SMTP credentials encrypted in one place (Supabase Vault, AWS KMS-backed)
2. **Team sharing** — Grant access without sharing passwords (role-based permissions)
3. **Unified dashboard** — Send from any account, see all team activity
4. **Audit trails** — Full history of who sent what, when, from which account
5. **AI templates** — Shared template library, AI-generation with Gemini

Think: **Notion for email campaign management** or **1Password + team sending interface**

**What we're NOT:** We're not Mailchimp or SendGrid. We don't send emails. You keep your existing SMTP providers. We're the collaboration layer that sits on top.

**The Market (15 seconds):**
- 850K US companies with 10+ person marketing teams
- $710M total addressable market
- Primary targets: Series A-B startups (3-10 marketers), agencies (10-50 clients)

**The Business Model (15 seconds):**
- B2B SaaS, seat-based pricing
- Team plan: $49/mo (5 seats) — targets startups
- Business plan: $149/mo (15 seats) — targets agencies
- Enterprise: Custom ($499+) — SSO, compliance, white-label

**The Traction (15 seconds):**
[Placeholder for launch metrics]

**Year 1 Goal:** 300 paying organizations, $420K ARR

---

## The ROI Story (3-Minute Deep Dive)

### Customer Example: Startup Marketing Team

**Company:** Series A startup, 50 employees, 5 marketers

**Before zecompaign:**
- 5 people sharing 3 Gmail passwords + 2 Resend API keys
- Credentials in a Google Doc (security audit fail)
- "Who sent the newsletter last Tuesday?" → Slack archaeology
- New hire onboarding: 2-3 hours manually sharing passwords
- Time spent: 10 hours/week managing credential access

**Pain quantified:**
- 10 hrs/week × $30/hr × 52 weeks = **$15,600/year wasted**
- Security risk: Average data breach = **$4.5M cost**
- Compliance blocker: Can't pass SOC 2 audit = can't land enterprise customers

**After zecompaign (Team Plan, $49/mo):**
- All 5 accounts in zecompaign vault
- Each marketer gets role-based access to relevant accounts
- New hire onboarded in 5 minutes (invite link, done)
- Full audit trail for SOC 2 compliance
- Time saved: 10 hours/week → 30 minutes/week

**ROI Calculation:**
- Cost: $588/year ($49/mo × 12)
- Savings: $15,000/year (time saved)
- Risk avoided: $4.5M (breach) + enterprise deal blockers
- **Net benefit: $14,412/year (2,451% ROI)**

### Customer Example: Marketing Agency

**Company:** 15-person agency managing 30 client email campaigns

**Before zecompaign:**
- 30 client SMTP accounts in a spreadsheet (Excel file shared via Dropbox)
- 10 team members need access to different clients
- Lost a client password last quarter → 6 hours to recover
- Client onboarding: 1-2 hours manually setting up credentials
- Security liability: clients asking "how do you store our passwords?"

**Pain quantified:**
- 20 hrs/week credential management × $50/hr × 52 weeks = **$52,000/year**
- Custom solution to build: **$50,000+ dev cost** + 6 months
- Churn risk: Losing clients over security concerns

**After zecompaign (Business Plan, $149/mo):**
- All 30 clients in separate workspaces
- Team members assigned per client (granular permissions)
- New client onboarded in 10 minutes (create workspace, add account)
- White-label: send on behalf of clients professionally
- Security story: "We use vault-encrypted credential storage" (wins deals)

**ROI Calculation:**
- Cost: $1,788/year ($149/mo × 12)
- Savings: $52,000/year (time saved)
- Avoided: $50,000 (custom build cost)
- Enabled: New enterprise client contracts (security requirement met)
- **Net benefit: $100K+ in year 1**

---

## Competitive Landscape (Quick Hits)

### We're NOT competing with:
- ❌ Mailchimp / SendGrid (ESPs) — they own infrastructure, we don't
- ❌ Resend / Postmark (APIs) — they provide sending, we provide collaboration

### We're COMPLEMENTING:
- ✅ Users keep using Mailchimp/Resend/SendGrid for actual email sending
- ✅ We add the team collaboration layer they don't provide

### We're REPLACING:
- ✅ Google Docs with passwords
- ✅ Slack messages with credentials
- ✅ Custom-built internal tools ($50K to develop)

### Closest Comparisons:
- **1Password** — secure vault, but no sending interface or team workflow
- **Front** — team collaboration, but for support tickets, not campaigns
- **Notion** — team workspace, but for docs, not email operations

**Our position:** We're the missing category — "**B2B collaboration platform for email operations**"

---

## Why Now? (Market Timing)

| Trend | Impact on zecompaign |
|-------|---------------------|
| **Remote work explosion** | More distributed teams = more credential sharing problems |
| **SOC 2 / GDPR compliance** | Every B2B SaaS needs auditable security = demand for our product |
| **AI expectations** | Every tool needs AI now = we deliver with Gemini templates |
| **VC slowdown** | Startups cutting costs = demand for cheaper Mailchimp alternatives |
| **BYOS trend** | "Bring your own X" (database, auth, SMTP) = we fit the zeitgeist |

---

## The Vision (Where We're Going)

**Year 1:** Become the go-to platform for startups and agencies managing multiple email accounts (300 customers, $420K ARR)

**Year 2-3:** Enterprise adoption via security/compliance features (1,500 customers, $1.8M ARR)

**Year 5:** Category leader in "email collaboration platforms" — like Notion for docs, Slack for chat, **zecompaign for email campaigns**

**Long-term:** API platform for programmatic email operations, white-label for agencies, mobile app for on-the-go campaign management

---

## The Team (If Applicable)

[Placeholder — fill in your founding team, advisors, key hires]

Example:
- **CEO:** [Name] — Ex-[Company], built [previous product] to $Xm ARR
- **CTO:** [Name] — Ex-[Company], [years] experience scaling B2B SaaS infrastructure
- **Advisors:** [Names] — [Relevant background in B2B SaaS, security, marketing automation]

---

## The Ask (If Fundraising)

**Seeking:** $500K seed round

**Use of Funds:**
- $200K — Engineering (2 full-time devs, 12 months)
- $150K — Go-to-market (content marketing, Product Hunt, paid ads)
- $100K — First sales hire (enterprise AE, Month 9)
- $50K — Operations (Supabase, Vercel, Stripe, legal, compliance)

**Milestones:**
- Month 6: 1,000 signups, 50 paying customers, $8K MRR
- Month 12: 10,000 signups, 300 paying customers, $35K MRR
- Month 18: Break-even cash flow, enterprise pipeline established

**Exit Opportunities:**
- Acquisition by ESP (Mailchimp, SendGrid) as collaboration add-on
- Acquisition by security/compliance tool (1Password, Vanta) as workflow extension
- Standalone IPO (if we hit $100M+ ARR)

---

## One-Sentence Pitches (Twitter / LinkedIn)

- "Notion for email campaign management — secure collaboration for marketing teams managing multiple SMTP accounts"

- "Stop sharing SMTP passwords via Slack. zecompaign is the B2B collaboration platform for email operations"

- "1Password + team sending interface + AI templates = zecompaign. $49/mo for 5-person marketing teams"

- "We're not Mailchimp (we don't send emails). We're the team layer that sits on top of your existing email infrastructure"

- "Marketing teams waste 10 hours/week managing SMTP access. We save that time + eliminate security risks. $49/mo"

---

*zecompaign — Secure Email Collaboration for Modern Marketing Teams*

**Website:** zecompaign.com (placeholder)  
**Demo:** [Book a demo](mailto:founders@zecompaign.com)  
**Docs:** [Documentation](https://docs.zecompaign.com) (placeholder)
