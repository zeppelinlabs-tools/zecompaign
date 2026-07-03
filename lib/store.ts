import { AppSettings, SmtpConfig, GeminiKey, SentEmail, EmailTemplate, User } from './types';

const STORAGE_KEY = 'zecompaign_settings';

const defaultSettings: AppSettings = {
  smtpConfigs: [],
  geminiKeys: [],
  sentEmails: [],
  templates: [],
  users: [
    {
      id: 'usr-1',
      name: 'Arthur Admin',
      email: 'admin@company.com',
      role: 'admin',
      allowedSmtpIds: [], // Admins have implicit access to all configs
      avatarColor: '#B3392C',
    },
    {
      id: 'usr-2',
      name: 'Jane Marketer',
      email: 'marketer@company.com',
      role: 'marketer',
      allowedSmtpIds: [], // Will be configured
      avatarColor: '#3457A6',
    },
    {
      id: 'usr-3',
      name: 'Jack Viewer',
      email: 'viewer@company.com',
      role: 'viewer',
      allowedSmtpIds: [],
      avatarColor: '#1F8A70',
    },
    {
      id: 'usr-4',
      name: 'Peggy Platform Admin',
      email: 'platform@company.com',
      role: 'platform_admin',
      allowedSmtpIds: [], // Platform admins have full access as well
      avatarColor: '#C98A2C',
    }
  ],
};

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Save default settings if empty
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    const parsed = JSON.parse(raw);
    return { 
      ...defaultSettings, 
      ...parsed,
      // Ensure users exists
      users: parsed.users && parsed.users.length > 0 ? parsed.users : defaultSettings.users 
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function updateSmtpConfigs(configs: SmtpConfig[]): void {
  const s = getSettings();
  saveSettings({ ...s, smtpConfigs: configs });
}

export function updateGeminiKeys(keys: GeminiKey[]): void {
  const s = getSettings();
  saveSettings({ ...s, geminiKeys: keys });
}

export function addSentEmail(email: SentEmail): void {
  const s = getSettings();
  saveSettings({ ...s, sentEmails: [email, ...s.sentEmails].slice(0, 100) });
}

export function updateTemplates(templates: EmailTemplate[]): void {
  const s = getSettings();
  saveSettings({ ...s, templates });
}

export function updateUsers(users: User[]): void {
  const s = getSettings();
  saveSettings({ ...s, users });
}

export function getCurrentUserSession(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zecompaign_session');
}

export function setCurrentUserSession(email: string | null): void {
  if (typeof window === 'undefined') return;
  if (email === null) {
    localStorage.removeItem('zecompaign_session');
  } else {
    localStorage.setItem('zecompaign_session', email);
  }
}

