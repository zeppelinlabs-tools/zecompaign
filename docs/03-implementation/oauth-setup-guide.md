# OAuth Configuration Guide for zecompaign

**Last Updated:** July 4, 2026  
**Purpose:** Step-by-step guide to configure Google and GitHub OAuth in Supabase

---

## Overview

zecompaign supports three OAuth providers for authentication:
1. **Google OAuth** - Primary provider for most users
2. **GitHub OAuth** - For developer-focused users
3. **Magic Link** - Passwordless email authentication (works out-of-the-box)

This guide covers the setup for Google and GitHub OAuth.

---

## Prerequisites

Before configuring OAuth, ensure you have:
- ✅ Supabase project created
- ✅ Production domain or localhost for testing
- ✅ Admin access to Supabase dashboard
- ✅ Google Cloud Console access (for Google OAuth)
- ✅ GitHub account (for GitHub OAuth)

---

## Part 1: Google OAuth Setup

### Step 1: Create Google OAuth App

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name: `zecompaign` or `zecompaign-production`
   - Click "Create"

3. **Enable Google+ API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: **External** (for public use) or **Internal** (for workspace only)
   - Click "Create"
   
   **App Information:**
   - App name: `zecompaign`
   - User support email: `your-email@example.com`
   - Developer contact: `your-email@example.com`
   - Click "Save and Continue"
   
   **Scopes:**
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `userinfo.email`
     - `userinfo.profile`
   - Click "Update" → "Save and Continue"
   
   **Test Users** (if External):
   - Add test email addresses during development
   - Click "Save and Continue"

5. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `zecompaign Web Client`
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:3000/auth/callback
   https://your-production-domain.com/auth/callback
   https://[your-supabase-project-id].supabase.co/auth/v1/callback
   ```
   
   - Click "Create"
   - **Save the Client ID and Client Secret** - you'll need these!

### Step 2: Configure in Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your zecompaign project

2. **Navigate to Authentication Settings**
   - Click "Authentication" in sidebar
   - Click "Providers"
   - Find "Google" in the list

3. **Enable Google Provider**
   - Toggle "Enable Google Provider" to ON
   - Enter your Google OAuth credentials:
     - **Client ID**: Paste from Google Cloud Console
     - **Client Secret**: Paste from Google Cloud Console
   - Click "Save"

4. **Test the Integration**
   - Go to your app: `http://localhost:3000/login`
   - Click "Continue with Google"
   - Verify the OAuth flow works
   - Check that user is created in Supabase Authentication

---

## Part 2: GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/developers
   - Or: GitHub → Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"

2. **Register a New Application**
   **Application name:** `zecompaign`
   
   **Homepage URL:**
   ```
   http://localhost:3000                           (for development)
   https://your-production-domain.com              (for production)
   ```
   
   **Application description:** (optional)
   ```
   zecompaign - B2B email campaign collaboration platform
   ```
   
   **Authorization callback URL:**
   ```
   https://[your-supabase-project-id].supabase.co/auth/v1/callback
   ```
   
   - Click "Register application"

3. **Generate Client Secret**
   - On the OAuth app page, click "Generate a new client secret"
   - **Save the Client ID and Client Secret** - you'll need these!

### Step 2: Configure in Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your zecompaign project

2. **Navigate to Authentication Settings**
   - Click "Authentication" in sidebar
   - Click "Providers"
   - Find "GitHub" in the list

3. **Enable GitHub Provider**
   - Toggle "Enable GitHub Provider" to ON
   - Enter your GitHub OAuth credentials:
     - **Client ID**: Paste from GitHub OAuth App
     - **Client Secret**: Paste from GitHub OAuth App
   - Click "Save"

4. **Test the Integration**
   - Go to your app: `http://localhost:3000/login`
   - Click "Continue with GitHub"
   - Verify the OAuth flow works
   - Check that user is created in Supabase Authentication

---

## Part 3: Environment Variables

Make sure these are set in your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site URL (for OAuth redirects and unsubscribe links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000                    # Development
# NEXT_PUBLIC_SITE_URL=https://your-production-domain.com    # Production
```

For production deployment on Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_SITE_URL` with your production domain
3. Redeploy the application

---

## Part 4: Testing OAuth Flows

### Test Checklist

**Google OAuth:**
- [ ] Click "Continue with Google" on login page
- [ ] Consent screen appears with correct app name
- [ ] After authorization, redirects to dashboard
- [ ] User profile created in Supabase
- [ ] Organization auto-created for user
- [ ] Can sign out and sign back in

**GitHub OAuth:**
- [ ] Click "Continue with GitHub" on login page
- [ ] GitHub authorization page appears
- [ ] After authorization, redirects to dashboard
- [ ] User profile created in Supabase
- [ ] Organization auto-created for user
- [ ] Can sign out and sign back in

**Email Verification:**
- [ ] OAuth users don't need email verification
- [ ] Email/password users receive verification email
- [ ] Verification link works correctly

---

## Part 5: Production Deployment

### Update OAuth Redirect URIs

When deploying to production, you must update redirect URIs in both providers:

**Google Cloud Console:**
1. Go to OAuth credentials
2. Add production redirect URI:
   ```
   https://your-production-domain.com/auth/callback
   ```

**GitHub OAuth App:**
1. Go to OAuth app settings
2. Update Authorization callback URL to:
   ```
   https://[your-supabase-project-id].supabase.co/auth/v1/callback
   ```
3. Add production Homepage URL:
   ```
   https://your-production-domain.com
   ```

### Verify Production Environment

1. **Check Supabase Configuration**
   - Ensure Site URL is set to production domain
   - Go to: Authentication → URL Configuration
   - Site URL: `https://your-production-domain.com`
   - Redirect URLs: Add `https://your-production-domain.com/**`

2. **Test OAuth in Production**
   - Visit: `https://your-production-domain.com/login`
   - Test both Google and GitHub OAuth
   - Verify redirects work correctly
   - Check that users are created in production database

---

## Troubleshooting

### Common Issues

**Error: "Redirect URI mismatch"**
- **Cause:** The redirect URI in your OAuth app doesn't match the one Supabase is using
- **Fix:** Make sure the callback URL includes your Supabase project ID:
  ```
  https://[your-supabase-project-id].supabase.co/auth/v1/callback
  ```

**Error: "Access blocked: This app's request is invalid"**
- **Cause:** OAuth consent screen not configured or missing scopes
- **Fix:** Complete the OAuth consent screen setup in Google Cloud Console
- **Fix:** Ensure `userinfo.email` and `userinfo.profile` scopes are added

**Error: "User already registered"**
- **Cause:** User signed up with email/password, now trying OAuth with same email
- **Fix:** This is expected behavior - user should sign in with the original method
- **Note:** Supabase links accounts automatically if email is verified

**OAuth works locally but not in production**
- **Cause:** Redirect URIs not updated for production domain
- **Fix:** Add production redirect URIs to both OAuth apps
- **Fix:** Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables

**Users not getting redirected after OAuth**
- **Cause:** Callback route not working or missing
- **Fix:** Verify `app/auth/callback/route.ts` exists and is deployed
- **Fix:** Check browser console for errors

---

## Security Best Practices

1. **Never Commit OAuth Credentials**
   - Keep Client IDs and Secrets in environment variables only
   - Add `.env.local` to `.gitignore`
   - Use Vercel environment variables for production

2. **Restrict OAuth App Access**
   - Use "Internal" consent screen for workspace-only access
   - Limit test users during development
   - Request minimal scopes (only email and profile)

3. **Monitor OAuth Usage**
   - Check Google Cloud Console for quota usage
   - Monitor Supabase Authentication logs
   - Set up alerts for unusual activity

4. **Rotate Secrets Periodically**
   - Regenerate OAuth secrets every 6-12 months
   - Update in Supabase dashboard immediately
   - Test thoroughly after rotation

---

## Additional Resources

**Google OAuth Documentation:**
- https://developers.google.com/identity/protocols/oauth2

**GitHub OAuth Documentation:**
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps

**Supabase OAuth Documentation:**
- https://supabase.com/docs/guides/auth/social-login

**Next.js Environment Variables:**
- https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

---

## Quick Reference

### Redirect URIs (Copy-Paste Ready)

**For Supabase Project ID: `your-project-id`**

```
Development:
http://localhost:3000/auth/callback
https://your-project-id.supabase.co/auth/v1/callback

Production:
https://your-production-domain.com/auth/callback
https://your-project-id.supabase.co/auth/v1/callback
```

### Required Scopes

**Google:**
- `userinfo.email`
- `userinfo.profile`
- `openid` (added automatically)

**GitHub:**
- `user:email` (default, covers email and profile)

---

**Status:** Once OAuth is configured, users can sign up and log in using Google or GitHub in addition to email/password and magic link methods.
