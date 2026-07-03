# ZeCompaign — UI/UX Design Document

**Version:** 2.0
**Companion to:** Design.md (architecture) and PRD.md (v2.0)
**Scope:** Visual design system, information architecture, and screen-by-screen UX for the Supabase-backed, team-oriented rebuild

---

## 1. Design Principles

This is an **internal ops tool**, not a marketing site — the design should read as calm, precise, and trustworthy, because it's handling real credentials and real send volume on behalf of a team. Three principles guide every screen:

1. **Account context is always visible.** Since multi-account switching is the core differentiator, the user should never wonder "which account am I about to send from?" That answer is present on every relevant screen, not buried in a dropdown.
2. **Destructive and irreversible actions look different from routine ones.** Sending to 5,000 recipients, deleting a sending account, and revoking a teammate's access all get a visibly heavier UI treatment than "save a template."
3. **State is never ambiguous.** Sending, sent, failed, suppressed, queued — every status has a distinct, consistent visual language used everywhere it appears (dashboard, compose, send log).

---

## 2. Design Tokens

Avoiding the generic AI-dashboard defaults (cream + terracotta, pure dark + neon accent, or sterile all-gray SaaS gray). ZeCompaign's subject is *mail* — envelopes, postal routing, stamps, ledgers of sent items. The palette leans into a **postal/ledger** register: ink, paper, and a wax-seal red reserved only for things that matter.

### Color

| Token | Hex | Use |
|---|---|---|
| `--ink-900` | `#1B1D22` | Primary text, sidebar background |
| `--ink-600` | `#4A4E5A` | Secondary text, icons |
| `--paper-100` | `#FAF9F6` | App background |
| `--paper-200` | `#F0EEE8` | Card / panel background |
| `--line-300` | `#DEDAD0` | Borders, dividers |
| `--route-blue` | `#3457A6` | Primary actions, links, active nav, "sent" status |
| `--stamp-teal` | `#1F8A70` | Success states, connected/active badges |
| `--seal-red` | `#B3392C` | Failed sends, destructive actions, suppression warnings — used sparingly and consistently |
| `--flag-amber` | `#C98A2C` | Queued / pending / rate-limited states |

This is a five-color functional palette, not a brand-marketing palette — every color maps to a specific state or action, which matters more than aesthetic variety in an ops tool.

### Typography

| Role | Face | Notes |
|---|---|---|
| UI / body | **Inter** | Neutral, legible at small sizes, good for dense dashboard tables |
| Headings | **Fraunces** (a slab-ish serif), used sparingly | Only on page titles and empty-state headlines — gives the tool a slightly more considered, less templated feel than an all-sans SaaS dashboard, without going decorative |
| Code / HTML editor / monospace | **JetBrains Mono** | Raw HTML tab, host/port fields, API key display |

Type scale: 12 / 14 / 16 / 20 / 28px, with 14px as the dashboard's dominant body size (data-dense screens need restraint, not large type).

### Layout

- **Radius:** 6px on cards and inputs, 4px on chips/badges. Not zero (too severe for a tool people live in all day), not 16px+ (too soft/consumer for handling credentials).
- **Spacing scale:** 4/8/12/16/24/32/48, standard 8pt-derived rhythm.
- **Sidebar-first layout**, fixed left nav (see §3), content area scrolls independently — this is a tool people keep open in a tab all day, not a page they scroll top to bottom.

### Signature element

Every sending account gets a small generated **wax-seal monogram** (a two-letter mark derived from the account name, rendered as a circular badge in `--route-blue` or a per-account accent) — used in the account switcher, the compose header, and the send log. This is the one memorable visual device: it makes "which account is this?" answerable at a glance, reinforcing the multi-account differentiator visually, not just functionally.

---

## 3. Information Architecture

```
┌─ Sidebar (fixed) ──────────┐
│ ZeCompaign                 │
│                             │
│ ● Dashboard                 │
│ ● Compose                   │
│ ● AI Generator               │
│ ● Templates                  │
│ ● Sending Accounts            │
│ ─────────────               │
│ ● Settings (admin: Users,     │
│   Gemini Keys)                │
│                             │
│ [Avatar] Name, role          │
└─────────────────────────────┘
```

Five primary nav items plus role-gated Settings. `viewer` role sees Dashboard and Templates only (read access); `marketer` sees everything except admin Settings panels; `admin` sees all.

---

## 4. Screen-by-Screen Design

### 4.1 Login

- Centered card on `--paper-100`, no marketing copy — just product name, email/magic-link input, and a one-line description ("Internal email tool for [Company] marketing").
- No sign-up link (invite-only). If someone lands here without an invite, the empty state reads: *"This account needs to be invited by an admin. Contact your ZeCompaign admin to get access."* — plain, no dead-end frustration.

### 4.2 Dashboard

**Layout:** 4 stat cards in a row (Emails Sent, Failed, Active Accounts, Active Gemini Keys), each showing team-wide totals with a small trend indicator (vs. last 7 days). Below: a filterable send log table.

- Stat cards use `--stamp-teal` for the Sent count, `--seal-red` accent only if Failed > 0 (otherwise neutral ink) — the color itself communicates "something needs attention" without extra copy.
- Send log table columns: account seal-monogram + name, sender avatar, recipients (truncated with "+N more"), subject, status badge, timestamp. Filterable by account and by sender — this is where "who sent what from which account" becomes visible, directly serving the audit-trail requirement from the PRD.
- Empty state (brand-new instance, nothing sent yet): *"Nothing sent yet. Add a sending account to get started."* with a direct button to Sending Accounts — not a generic illustration, a next action.

### 4.3 Sending Accounts

**Layout:** Card grid, one card per account, each showing its seal-monogram, name, provider icon, from-address, active/inactive toggle, and a row of avatars for who has access.

- **Access grants are visible on the card itself**, not hidden in a settings sub-page — reinforcing that this screen is about *who can use what*, which is the core differentiator, not just credential storage.
- "Add Account" opens a form; provider selection (Resend / Gmail / Custom) conditionally reveals only the relevant fields, matching the PRD's field table.
- Connection Test button shows a live badge transition: neutral → testing (subtle pulse) → `--stamp-teal` connected or `--seal-red` failed with the actual error message surfaced, not a generic "failed."
- Deleting an account is a two-step confirm (type the account name to confirm) — this is the one genuinely destructive, hard-to-undo action in the accounts screen, so it gets deliberately more friction than toggling active/inactive.

### 4.4 Compose

**Layout:** Two-column — editor on the left, live preview on the right, matching v1.1's proven layout.

- **Account selector sits at the very top, large, with the seal-monogram** — impossible to compose without first confirming which account you're sending as. This is the single most important UI decision in the whole product, since sending from the wrong account (wrong brand voice, wrong domain) is the costliest mistake this tool could enable.
- Recipient chips (To/CC/BCC) as specified in the PRD — chip input, paste-to-bulk-add, RFC name format support.
- **Suppression warnings inline:** if a pasted recipient is on the suppression list, its chip renders with a `--seal-red` outline and a small "unsubscribed" label instead of silently dropping it — the user should see and understand why someone won't receive the email, not just notice a lower count later.
- Body format toggle (HTML / Plain / Both) as tabs above the editor, not a dropdown — since it changes the editor's shape, a tab makes that visible before they start typing.
- Send button: for sends over a threshold (e.g. 50+ recipients), a confirm step shows "Sending to 214 recipients from Product X — EU. This can't be undone." — small friction proportional to blast radius, per Principle 2.
- Post-send: inline result banner (not a toast that disappears) showing exact success/fail counts, since bulk sends can partially fail and the user needs that to persist on screen, not vanish after 3 seconds.

### 4.5 AI Generator

**Layout:** Left panel — Email Type chips, Tone chips, prompt textarea, Generate button. Right panel — output (Preview / HTML tabs), subject line, action row (Edit, Save Template, Copy HTML, Use in Compose, Regenerate).

- While generating, the right panel shows which key/model is currently being attempted if failover kicks in (e.g. "Trying backup key 2 of 3…") — this was a v1.1 feature (showing which key succeeded); making the *attempt* visible during failover, not just the result, builds trust that the system is working rather than hanging.
- Edit mode: contentEditable directly in the preview, exactly as specified in the PRD — no code exposure unless the user deliberately switches to the HTML tab.
- Save panel uses the `--flag-amber`-adjacent warm highlight described in the original PRD (purple/amber accent zone) with the pre-filled name pattern `[Type] Email – [Date]`.

### 4.6 Saved Templates

**Layout:** Grid of template cards (name, subject preview, tags, date, author avatar — new: shows who created it, since it's now a shared library). Clicking a card opens a side-by-side preview panel.

- Tags render as small pills using `--route-blue` for Type and `--ink-600` outline for Tone, so scanning the grid for "all Welcome emails" is a quick color-scan, not a read-every-label task.
- Author avatar matters more here than in v1.1 precisely because it's now a shared library — knowing who wrote a template helps a teammate know who to ask about it.

### 4.7 Settings (Admin only)

Two tabs: **Users** and **Gemini Keys**.

- **Users tab:** list of teammates, role dropdown per user (admin/marketer/viewer), and — critically — an inline expandable row showing which sending accounts each user currently has access to, editable right there. This keeps `account_access` management close to the user list rather than requiring an admin to go account-by-account.
- **Gemini Keys tab:** matches the PRD's field set (label, masked key, model, priority reorder via up/down arrows, active toggle). Masked key reveal requires a re-auth-style confirm click, not just a hover.

---

## 5. Component States (used consistently everywhere)

| State | Visual treatment |
|---|---|
| Sent / Connected / Active | `--stamp-teal` dot + label |
| Failed / Disconnected | `--seal-red` dot + label, error message on hover/expand — never just "Failed" with no detail |
| Queued / Rate-limited | `--flag-amber` dot, small animated pulse (respecting `prefers-reduced-motion`) |
| Suppressed recipient | `--seal-red` outline on the chip, not a solid fill — distinguishes "this recipient has a problem" from "this send failed" |
| Loading | Skeleton blocks matching final content shape, not a generic spinner, on data-heavy screens (Dashboard, Templates grid) |

---

## 6. Copy & Voice Guidelines

Following plain, active-voice conventions throughout:

- Buttons name the action's result, not the mechanism: **"Send"** not "Submit," **"Save template"** not "Confirm," **"Revoke access"** not "Update."
- A button's label matches its confirmation: "Send" → banner reads "Sent to 214 recipients," never a mismatched "Success!"
- Errors state what happened and what to do, in the product's voice: *"This account's password was rejected by Gmail. Re-enter it in Sending Accounts."* — not "SMTP Error 535."
- Empty states are invitations with a direct next action, never just an illustration and a sentence.

---

## 7. Responsive & Accessibility Baseline

- Sidebar collapses to icon-only under 1024px, to a bottom nav under 640px — this is a tool people may check from a phone (e.g. approving/checking a send), even though composing is primarily a desktop task.
- All interactive elements keyboard-navigable with a visible focus ring in `--route-blue`.
- Status is never color-only: every status dot pairs with a text label (colorblind-safe by default, not an afterthought).
- `prefers-reduced-motion` respected on all pulse/skeleton animations.

---

*This document defines the visual and interaction layer on top of the architecture in Design.md — build components against these tokens directly rather than reaching for default shadcn/Tailwind grays, so the "who can send what, from where" story stays visually legible everywhere it matters.*
