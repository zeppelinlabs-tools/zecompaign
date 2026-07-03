export type SmtpProvider = 'gmail' | 'resend' | 'custom';

export interface SmtpConfig {
  id: string;
  name: string;
  provider: SmtpProvider;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string; // API key for Resend
  fromName: string;
  fromEmail: string;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
}

export interface GeminiKey {
  id: string;
  label: string;
  key: string;
  active: boolean;
  priority: number;
  model: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailDraft {
  smtpId: string;
  to: EmailRecipient[];
  cc: EmailRecipient[];
  bcc: EmailRecipient[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  contentType: string;
  size: number;
}

export interface SentEmail {
  id: string;
  smtpId: string;
  smtpName: string;
  to: EmailRecipient[];
  cc: EmailRecipient[];
  subject: string;
  status: 'sent' | 'failed';
  error?: string;
  sentAt: string;
  senderName?: string;
}


export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  createdAt: string;
  tags: string[];
}

export type UserRole = 'admin' | 'marketer' | 'viewer' | 'platform_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  allowedSmtpIds: string[]; // SmtpConfig IDs they have access to
  avatarColor: string; // Background color for their monogram avatar
}

export interface AppSettings {
  smtpConfigs: SmtpConfig[];
  geminiKeys: GeminiKey[];
  sentEmails: SentEmail[];
  templates: EmailTemplate[];
  users: User[];
}

