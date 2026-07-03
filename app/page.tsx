'use client';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import SmtpManager from '@/components/SmtpManager';
import ComposeEmail from '@/components/ComposeEmail';
import AITemplateGenerator from '@/components/AITemplateGenerator';
import SavedTemplates from '@/components/SavedTemplates';
import Settings from '@/components/Settings'; // TS-trigger-refresh
import Login from '@/components/Login';
import PlatformControls from '@/components/PlatformControls';
import { getSettings, saveSettings, getCurrentUserSession, setCurrentUserSession } from '@/lib/store';
import { AppSettings, SentEmail, EmailTemplate, SmtpConfig, GeminiKey, User } from '@/lib/types';

type Tab = 'dashboard' | 'smtp' | 'compose' | 'ai' | 'templates' | 'settings' | 'platform';

const ALLOWED_TABS: Record<'admin' | 'marketer' | 'viewer' | 'platform_admin', Tab[]> = {
  platform_admin: ['dashboard', 'smtp', 'compose', 'ai', 'templates', 'settings', 'platform'],
  admin: ['dashboard', 'smtp', 'compose', 'ai', 'templates', 'settings'],
  marketer: ['dashboard', 'smtp', 'compose', 'ai', 'templates'],
  viewer: ['dashboard', 'templates'],
};

export default function Home() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [settings, setSettings] = useState<AppSettings>({
    smtpConfigs: [], geminiKeys: [], sentEmails: [], templates: [], users: []
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    const activeSettings = getSettings();
    setSettings(activeSettings);
    
    // Retrieve session
    const sessionEmail = getCurrentUserSession();
    if (sessionEmail) {
      const user = activeSettings.users.find(u => u.email.toLowerCase() === sessionEmail.toLowerCase());
      if (user) {
        setCurrentUser(user);
        // Ensure default tab is allowed
        const allowed = ALLOWED_TABS[user.role];
        if (!allowed.includes('dashboard')) {
          setTab(allowed[0]);
        }
      }
    }
    setMounted(true);
  }, []);

  const persist = useCallback((s: AppSettings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  // Sync current user with updated settings
  useEffect(() => {
    if (currentUser && settings.users.length > 0) {
      const updatedUser = settings.users.find(u => u.id === currentUser.id);
      if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(updatedUser);
        // Check if current tab is still allowed
        const allowed = ALLOWED_TABS[updatedUser.role];
        if (!allowed.includes(tab)) {
          setTab(allowed.includes('dashboard') ? 'dashboard' : allowed[0]);
        }
      }
    }
  }, [settings.users, currentUser, tab]);

  function handleLogin(user: User) {
    setCurrentUser(user);
    setCurrentUserSession(user.email);
    const allowed = ALLOWED_TABS[user.role];
    setTab(allowed.includes('dashboard') ? 'dashboard' : allowed[0]);
  }

  function handleLogout() {
    setCurrentUser(null);
    setCurrentUserSession(null);
    setTab('dashboard');
  }

  function handleSmtpChange(configs: SmtpConfig[]) {
    // If a marketer adds an account, we should automatically grant them access
    let updatedUsers = [...settings.users];
    if (currentUser && currentUser.role === 'marketer') {
      const currentConfigIds = settings.smtpConfigs.map(c => c.id);
      const addedConfig = configs.find(c => !currentConfigIds.includes(c.id));
      if (addedConfig) {
        updatedUsers = settings.users.map(u => 
          u.id === currentUser.id 
            ? { ...u, allowedSmtpIds: [...u.allowedSmtpIds, addedConfig.id] } 
            : u
        );
      }
    }
    persist({ ...settings, smtpConfigs: configs, users: updatedUsers });
  }

  function handleGeminiChange(keys: GeminiKey[]) {
    persist({ ...settings, geminiKeys: keys });
  }

  function handleUsersChange(users: User[]) {
    persist({ ...settings, users });
  }

  function handleEmailSent(e: SentEmail) {
    const updated = { ...settings, sentEmails: [e, ...settings.sentEmails].slice(0, 100) };
    persist(updated);
  }

  function handleSaveTemplate(t: EmailTemplate) {
    persist({ ...settings, templates: [t, ...settings.templates] });
  }

  function handleTemplatesChange(templates: EmailTemplate[]) {
    persist({ ...settings, templates });
  }

  function useInCompose(t: EmailTemplate) {
    persist({ ...settings, templates: settings.templates.some(x => x.id === t.id) ? settings.templates : [t, ...settings.templates] });
    setSelectedTemplate(t);
    setTab('compose');
  }

  if (!mounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading zecompaign...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login users={settings.users} onLogin={handleLogin} />;
  }

  const role = currentUser.role;
  const allowed = ALLOWED_TABS[role];

  // Filter sending configs and email logs based on roles
  const visibleSmtpConfigs = role === 'admin' || role === 'platform_admin'
    ? settings.smtpConfigs
    : settings.smtpConfigs.filter(cfg => currentUser.allowedSmtpIds.includes(cfg.id));

  const visibleSentEmails = role === 'admin' || role === 'platform_admin' || role === 'viewer'
    ? settings.sentEmails
    : settings.sentEmails.filter(email => currentUser.allowedSmtpIds.includes(email.smtpId));

  const filteredSettings: AppSettings = {
    ...settings,
    smtpConfigs: visibleSmtpConfigs,
    sentEmails: visibleSentEmails,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        active={tab} 
        onChange={(t) => {
          if (allowed.includes(t as Tab)) {
            setTab(t as Tab);
          }
        }} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh', background: 'var(--bg-base)' }}>
        {tab === 'dashboard' && allowed.includes('dashboard') && (
          <Dashboard settings={filteredSettings} onNavigate={(t) => setTab(t as Tab)} currentUser={currentUser} />
        )}
        {tab === 'smtp' && allowed.includes('smtp') && (
          <SmtpManager 
            configs={filteredSettings.smtpConfigs} 
            onChange={handleSmtpChange} 
            currentUser={currentUser}
            users={settings.users}
          />
        )}
        {tab === 'compose' && allowed.includes('compose') && (
          <ComposeEmail
            smtpConfigs={filteredSettings.smtpConfigs}
            templates={settings.templates}
            selectedTemplate={selectedTemplate}
            onEmailSent={handleEmailSent}
            onTemplateUsed={() => setSelectedTemplate(null)}
          />
        )}
        {tab === 'ai' && allowed.includes('ai') && (
          <AITemplateGenerator
            geminiKeys={settings.geminiKeys}
            templates={settings.templates}
            onSaveTemplate={handleSaveTemplate}
            onUseInCompose={useInCompose}
          />
        )}
        {tab === 'templates' && allowed.includes('templates') && (
          <SavedTemplates
            templates={settings.templates}
            onChange={handleTemplatesChange}
            onUseInCompose={useInCompose}
            currentUser={currentUser}
          />
        )}
        {tab === 'settings' && allowed.includes('settings') && (
          <Settings 
            keys={settings.geminiKeys} 
            onKeysChange={handleGeminiChange}
            users={settings.users}
            onUsersChange={handleUsersChange}
            smtpConfigs={settings.smtpConfigs}
          />
        )}
        {tab === 'platform' && allowed.includes('platform') && (
          <PlatformControls />
        )}
      </main>
    </div>
  );
}

