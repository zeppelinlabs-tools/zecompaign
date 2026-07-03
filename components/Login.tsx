'use client';
import { useState } from 'react';
import { Mail, Sparkles, AlertCircle } from 'lucide-react';
import { User } from '@/lib/types';

interface Props {
  users: User[];
  onLogin: (user: User) => void;
}

export default function Login({ users, onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      onLogin(matchedUser);
    } else {
      setErrorMsg('This account needs to be invited by an admin. Contact your ZeCompaign admin to get access.');
    }
  }

  function quickSelect(user: User) {
    setEmail(user.email);
    setErrorMsg(null);
    onLogin(user);
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--paper-100)',
      padding: 20
    }}>
      <div className="glass fade-in" style={{
        width: '100%',
        maxWidth: 420,
        padding: 36,
        boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
        background: '#FFFFFF'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--route-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Mail size={22} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 6 }}>
            ZeCompaign
          </h1>
          <p style={{ color: 'var(--ink-600)', fontSize: 13, fontFamily: 'Fraunces', fontStyle: 'italic' }}>
            Internal email tool for company marketing
          </p>
        </div>

        {errorMsg ? (
          <div style={{
            padding: '12px 14px',
            background: 'rgba(179,57,44,0.08)',
            border: '1px solid rgba(179,57,44,0.15)',
            borderRadius: 6,
            color: 'var(--seal-red)',
            fontSize: 13,
            marginBottom: 20,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            lineHeight: 1.4
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        <form onSubmit={handleLoginSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="login-email" style={{ marginBottom: 8, fontSize: 12 }}>
              Work Email Address
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                fontSize: 15,
                padding: '12px 16px',
                borderColor: errorMsg ? 'var(--seal-red)' : 'var(--border)'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px',
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 24
            }}
          >
            Request Magic Link
          </button>
        </form>

        <div style={{ position: 'relative', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--line-300)', zIndex: 1 }} />
          <span style={{
            position: 'relative',
            background: '#FFFFFF',
            padding: '0 12px',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--ink-600)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            zIndex: 2
          }}>
            Demo Session Login
          </span>
        </div>

        {/* Demo Quick Select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => quickSelect(u)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                border: '1px solid var(--border)',
                background: 'var(--paper-100)',
                borderRadius: 6,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'var(--paper-100)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: u.avatarColor,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
                fontFamily: 'Fraunces',
                flexShrink: 0
              }}>
                {u.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-600)' }}>{u.email}</div>
              </div>
              <span className={`badge ${
                u.role === 'admin' ? 'badge-red' : u.role === 'marketer' ? 'badge-blue' : 'badge-green'
              }`} style={{ fontSize: 9 }}>
                {u.role}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
