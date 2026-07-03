'use client';
import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Sparkles, Key } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { GeminiKey } from '@/lib/types';

interface Props { keys: GeminiKey[]; onChange: (k: GeminiKey[]) => void; }

const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.5-live-translate-preview'
];

export default function GeminiSettings({ keys, onChange }: Props) {
  const [label, setLabel] = useState('');
  const [keyVal, setKeyVal] = useState('');
  const [model, setModel] = useState('gemini-3.5-flash');
  const [showKey, setShowKey] = useState(false);

  function add() {
    if (!label.trim() || !keyVal.trim()) return;
    const newKey: GeminiKey = {
      id: uuid(), label: label.trim(), key: keyVal.trim(),
      active: true, priority: keys.length + 1, model: model,
    };
    onChange([...keys, newKey]);
    setLabel(''); setKeyVal(''); setModel('gemini-3.5-flash');
  }

  function remove(id: string) { onChange(keys.filter(k => k.id !== id)); }

  function toggleActive(id: string) {
    onChange(keys.map(k => k.id === id ? { ...k, active: !k.active } : k));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const arr = [...keys];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr.map((k, i) => ({ ...k, priority: i + 1 })));
  }

  function moveDown(idx: number) {
    if (idx === keys.length - 1) return;
    const arr = [...keys];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr.map((k, i) => ({ ...k, priority: i + 1 })));
  }

  function maskKey(k: string) {
    if (k.length <= 8) return '•'.repeat(k.length);
    return k.slice(0, 6) + '•'.repeat(k.length - 10) + k.slice(-4);
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Settings</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage Gemini API keys for AI email generation</p>
      </div>

      {/* Gemini Keys Section */}
      <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--purple-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={15} color="var(--purple)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Google Gemini API Keys</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Keys are tried in priority order — if one fails, the next is used automatically</div>
          </div>
        </div>

        {/* Auto-failover info */}
        <div style={{ padding: '12px 16px', background: 'var(--purple-glow)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, marginBottom: 20, display: 'flex', gap: 10 }}>
          <div style={{ fontSize: 20 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--purple)', marginBottom: 2 }}>Auto-Failover Enabled</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              When a key hits a rate limit or fails, the system automatically switches to the next available key. 
              Drag to reorder priority. Disable keys temporarily without deleting them.
            </div>
          </div>
        </div>

        {/* Add key form */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: '0 0 180px' }}>
            <label>Key Label</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Primary Key" />
          </div>
          <div style={{ flex: 1 }}>
            <label>Gemini API Key</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={keyVal}
                onChange={e => setKeyVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && add()}
                placeholder="AIzaSy..."
                style={{ paddingRight: 42 }}
              />
              <button onClick={() => setShowKey(!showKey)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div style={{ flex: '0 0 180px' }}>
            <label>Model</label>
            <select value={model} onChange={e => setModel(e.target.value)}>
              {GEMINI_MODELS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn-ai" onClick={add} disabled={!label.trim() || !keyVal.trim()}>
              <Plus size={14} /> Add Key
            </button>
          </div>
        </div>

        {keys.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 8, border: '1px dashed var(--border)' }}>
            <Key size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No API keys yet. Add your first Gemini key above.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Get keys at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>aistudio.google.com</a></p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {keys.map((k, i) => (
              <div key={k.id} className="glass glass-hover" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Priority reorder */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button onClick={() => moveUp(i)} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer', color: i === 0 ? 'var(--text-muted)' : 'var(--text-subtle)', padding: 2 }}>
                    <ArrowUp size={12} />
                  </button>
                  <button onClick={() => moveDown(i)} disabled={i === keys.length - 1} style={{ background: 'none', border: 'none', cursor: i === keys.length - 1 ? 'not-allowed' : 'pointer', color: i === keys.length - 1 ? 'var(--text-muted)' : 'var(--text-subtle)', padding: 2 }}>
                    <ArrowDown size={12} />
                  </button>
                </div>

                {/* Priority badge */}
                <div style={{ width: 28, height: 28, borderRadius: 6, background: k.active ? 'var(--purple-glow)' : 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: k.active ? 'var(--purple)' : 'var(--text-muted)', flexShrink: 0 }}>
                  #{i + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{k.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 2 }}>{maskKey(k.key)}</div>
                  <div style={{ fontSize: 11, color: 'var(--purple)', background: 'var(--purple-glow)', padding: '2px 8px', borderRadius: 4, display: 'inline-block' }}>
                    {k.model || 'gemini-3.5-flash'}
                  </div>
                </div>

                <span className={`badge ${k.active ? 'badge-green' : 'badge-red'}`}>
                  {k.active ? 'Active' : 'Disabled'}
                </span>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => toggleActive(k.id)}>
                    {k.active ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn-danger" onClick={() => remove(k.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="glass" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Available Gemini Models</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { 
              model: 'gemini-3.5-flash', 
              badge: 'FLAGSHIP',
              badgeColor: 'var(--purple)',
              text: 'The flagship free model (Google I/O May 2026) — most intelligent model built for speed, combining frontier intelligence with superior search and grounding. Best for email generation.' 
            },
            { 
              model: 'gemini-3.1-flash-lite', 
              badge: 'EFFICIENT',
              badgeColor: 'var(--accent)',
              text: 'Most cost-efficient model — optimized for high-volume agentic tasks, translation, and simple data processing. Great for bulk operations.' 
            },
            { 
              model: 'gemini-3.5-live-translate-preview', 
              badge: 'PREVIEW',
              badgeColor: 'var(--yellow)',
              text: 'Low-latency real-time translation model supporting 70+ languages. Experimental preview for translation-focused emails.' 
            },
          ].map(({ model, badge, badgeColor, text }) => (
            <div key={model} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ minWidth: 8, height: 8, borderRadius: '50%', background: badgeColor, marginTop: 6, flexShrink: 0 }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{model}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: `${badgeColor}20`, color: badgeColor }}>{badge}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--accent-glow)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          💡 All models are <strong style={{ color: 'var(--accent)' }}>free</strong> on the Google AI free tier. Different keys can use different models based on your needs.
        </div>
      </div>

      {/* How Auto-Failover Works */}
      <div className="glass" style={{ padding: 20, marginTop: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>How Auto-Failover Works</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { step: '1', text: 'Keys are tried in priority order (top = highest priority)' },
            { step: '2', text: 'If a key fails (rate limited, invalid, expired), the next active key is tried' },
            { step: '3', text: 'The successful key is shown in the generation result' },
            { step: '4', text: 'Disable keys temporarily without losing them' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
