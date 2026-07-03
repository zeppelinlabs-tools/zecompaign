// Database types matching Supabase schema

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'team' | 'business' | 'enterprise';
  plan_expires_at?: string;
  emails_sent_this_month: number;
  ai_generations_this_month: number;
  smtp_accounts_count: number;
  storage_used_mb: number;
  billing_status: 'trial' | 'pending_payment' | 'active' | 'suspended' | 'cancelled';
  billing_notes?: string;
  billing_contact_email?: string;
  billing_contact_name?: string;
  plan_requested?: string;
  plan_approved_by?: string;
  plan_approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invited_by?: string;
  joined_at: string;
}

export interface SendingAccount {
  id: string;
  organization_id: string;
  name: string;
  provider: 'resend' | 'gmail' | 'sendgrid' | 'mailgun' | 'ses' | 'custom';
  from_email: string;
  from_name?: string;
  credential_encrypted: string;
  host?: string;
  port?: number;
  use_tls: boolean;
  active: boolean;
  is_default: boolean;
  daily_send_limit?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GeminiKey {
  id: string;
  organization_id: string;
  label: string;
  key_encrypted: string;
  model: 'gemini-3.5-flash' | 'gemini-3.5-pro' | 'gemini-3.1-flash-lite';
  active: boolean;
  priority: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  organization_id: string;
  name: string;
  subject?: string;
  body_html?: string;
  body_text?: string;
  category?: string;
  tags?: string[];
  is_public: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SentEmail {
  id: string;
  organization_id: string;
  user_id: string;
  account_id?: string;
  recipients: Array<{ email: string; name?: string; type: 'to' | 'cc' | 'bcc' }>;
  subject: string;
  body_html?: string;
  body_text?: string;
  account_name?: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at: string;
  opened: boolean;
  clicked: boolean;
  bounced: boolean;
}

export interface SuppressedRecipient {
  id: string;
  organization_id: string;
  email: string;
  reason: 'unsubscribed' | 'bounced' | 'spam_complaint' | 'manual';
  suppressed_at: string;
  suppressed_by?: string;
}

export interface PaymentRequest {
  id: string;
  organization_id: string;
  plan_requested: 'team' | 'business' | 'enterprise';
  billing_period: 'monthly' | 'annual';
  amount_requested: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  payment_method?: string;
  payment_reference?: string;
  payment_proof_url?: string;
  payment_date?: string;
  requested_by: string;
  requested_at: string;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  organization_id: string;
  user_id?: string;
  event_type: 'email_sent' | 'ai_generated' | 'account_added' | 'user_invited';
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  role: 'super_admin' | 'admin' | 'support';
  permissions: string[];
  created_by?: string;
  created_at: string;
}

// Dashboard views
export interface DashboardStats {
  organization_id: string;
  organization_name: string;
  plan: string;
  emails_sent_this_month: number;
  ai_generations_this_month: number;
  smtp_accounts_count: number;
  team_members_count: number;
  successful_sends: number;
  failed_sends: number;
  template_count: number;
}

export interface TeamActivity {
  id: string;
  organization_id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

// Function return types
export interface UserOrganization {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  user_role: 'owner' | 'admin' | 'member' | 'viewer';
  plan: string;
  member_count: number;
}

export interface AccessibleAccount {
  account_id: string;
  account_name: string;
  provider: string;
  from_email: string;
  from_name?: string;
  active: boolean;
  is_default: boolean;
}

export interface PlanLimits {
  smtp_accounts: number;
  team_members: number;
  ai_generations_monthly: number;
  templates: number;
  features: string[];
}

export interface PlanPricing {
  team: {
    monthly: number;
    annual: number;
    annual_monthly_equivalent: number;
  };
  business: {
    monthly: number;
    annual: number;
    annual_monthly_equivalent: number;
  };
  enterprise: {
    monthly: number;
    annual: string;
    note: string;
  };
}
