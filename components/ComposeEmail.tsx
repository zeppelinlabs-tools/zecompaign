'use client';
import { useState, useEffect } from 'react';
import { Send, X, Plus, RefreshCw, CheckCircle, ChevronDown, ChevronUp, Eye, Paperclip, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface EmailRecipient {
  email: string
  name?: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body_html: string
  body_text: string
}

interface SmtpAccount {
  id: string
  name: string
  from_email: string
  from_name: string | null
  host: string
  port: number
  use_tls: boolean
  active: boolean
  provider: string
}

interface Props {
  smtpAccounts: SmtpAccount[]
  templates: EmailTemplate[]
  organizationId: string
}

function getMonogram(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (name[0] || '?').toUpperCase();
}

function isSuppressed(email: string): boolean {
  const clean = email.trim().toLowerCase();
  return clean.includes('suppressed') || 
         clean.includes('unsubscribe') || 
         ['optout@example.com', 'banned@example.com', 'blacklist@company.com'].includes(clean);
}

function RecipientInput({ label, recipients, onChange }: {
  label: string;
  recipients: EmailRecipient[];
  onChange: (r: EmailRecipient[]) => void;
}) {
  const [input, setInput] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  function addRecipient() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const isMultiple = trimmed.includes(',');
    if (isMultiple) {
      const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      const newOnes = parts.map(p => {
        const m = p.match(/^"?([^"<]+)"?\s*<([^>]+)>$/);
        return m ? { name: m[1].trim(), email: m[2].trim() } : { email: p };
      });
      onChange([...recipients, ...newOnes]);
    } else {
      const m = trimmed.match(/^"?([^"<]+)"?\s*<([^>]+)>$/);
      onChange([...recipients, m ? { name: m[1].trim(), email: m[2].trim() } : { email: trimmed }]);
    }
    setInput('');
  }

  function addCustomRecipient() {
    if (!customEmail.trim()) return;
    onChange([...recipients, { 
      email: customEmail.trim(), 
      name: customName.trim() || undefined 
    }]);
    setCustomName('');
    setCustomEmail('');
    setShowNameInput(false);
  }

  function cancelCustomInput() {
    setCustomName('');
    setCustomEmail('');
    setShowNameInput(false);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{label}</span>
        {!showNameInput && (
          <button 
            onClick={() => setShowNameInput(true)}
            style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
          >
            + Add with name
          </button>
        )}
      </label>
      
      {showNameInput ? (
        <div style={{ padding: '10px', background: 'var(--bg-surface)', border: '2px solid var(--accent)', borderRadius: 6, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Name (optional)"
              style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
            />
            <input
              value={customEmail}
              onChange={e => setCustomEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomRecipient()}
              placeholder="Email *"
              style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button 
              className="btn-secondary" 
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={cancelCustomInput}
            >
              Cancel
            </button>
            <button 
              className="btn-primary" 
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={addCustomRecipient}
              disabled={!customEmail.trim()}
            >
              Add Recipient
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px', background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 6, minHeight: 44, alignItems: 'center' }}>
        {recipients.map((r, i) => {
          const suppressed = isSuppressed(r.email);
          return (
            <span 
              key={i} 
              className="tag"
              style={suppressed ? {
                borderColor: 'var(--seal-red)',
                background: 'rgba(179,57,44,0.06)',
                color: 'var(--seal-red)',
                fontWeight: 600
              } : undefined}
            >
              {r.name ? `${r.name} <${r.email}>` : r.email}
              {suppressed && (
                <span style={{ 
                  fontSize: 9, 
                  marginLeft: 4, 
                  background: 'var(--seal-red)', 
                  color: 'white', 
                  padding: '1px 4px', 
                  borderRadius: 3 
                }}>unsubscribed</span>
              )}
              <button onClick={() => onChange(recipients.filter((_, j) => j !== i))}><X size={10} /></button>
            </span>
          );
        })}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addRecipient())}
          onBlur={addRecipient}
          placeholder={recipients.length === 0 ? 'Type email and press Enter (comma-separated for bulk)' : 'Add more...'}
          style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, minWidth: 200, fontSize: 13, color: 'var(--text)', padding: '2px 4px' }}
        />
      </div>
    </div>
  );
}

export default function ComposeEmail({ smtpAccounts, templates, organizationId }: Props) {
  const router = useRouter()
  const [smtpId, setSmtpId] = useState(smtpAccounts[0]?.id || '');
  const [to, setTo] = useState<EmailRecipient[]>([]);
  const [cc, setCc] = useState<EmailRecipient[]>([]);
  const [bcc, setBcc] = useState<EmailRecipient[]>([]);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [showCC, setShowCC] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadTemplate, setLoadTemplate] = useState(false);
  const [bodyType, setBodyType] = useState<'html' | 'text' | 'both'>('html');
  const [bodyText, setBodyText] = useState('');
  
  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const smtp = smtpAccounts.find(s => s.id === smtpId);

  // Set default SMTP when smtpAccounts loads
  useEffect(() => {
    if (smtpAccounts.length > 0 && !smtpId) {
      setSmtpId(smtpAccounts[0].id);
    }
  }, [smtpAccounts, smtpId]);

  function applyTemplate(t: EmailTemplate) {
    setSubject(t.subject);
    setBodyHtml(t.body_html);
    setBodyText(t.body_text);
    setBodyType('html');
    setLoadTemplate(false);
  }

  async function handleSend(skipConfirm = false) {
    if (!smtp || to.length === 0 || !subject) return;
    
    if (bodyType === 'html' && !bodyHtml) return;
    if (bodyType === 'text' && !bodyText) return;
    if (bodyType === 'both' && (!bodyHtml || !bodyText)) return;

    // Filter out suppressed recipients
    const suppressedTo = to.filter(r => isSuppressed(r.email));
    const cleanTo = to.filter(r => !isSuppressed(r.email));
    const cleanCc = cc.filter(r => !isSuppressed(r.email));
    const cleanBcc = bcc.filter(r => !isSuppressed(r.email));

    const totalCleanRecipients = cleanTo.length + cleanCc.length + cleanBcc.length;
    
    // Check 50+ threshold safety confirm
    if (totalCleanRecipients >= 50 && !skipConfirm) {
      setShowConfirmModal(true);
      return;
    }

    setSending(true);
    setShowConfirmModal(false);

    // If all recipients are suppressed, halt send
    if (totalCleanRecipients === 0) {
      toast.error('Send Aborted: All recipients were automatically excluded due to suppression/unsubscribed tags.')
      setSending(false);
      return;
    }

    // Send to first recipient only for now (bulk sending would need queue)
    const firstRecipient = cleanTo[0];

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          account_id: smtpId,
          to_email: firstRecipient.email,
          to_name: firstRecipient.name,
          subject,
          body_html: bodyType === 'text' ? `<p>${bodyText.replace(/\n/g, '<br>')}</p>` : bodyHtml,
          body_text: bodyType === 'html' ? bodyHtml.replace(/<[^>]+>/g, '') : bodyText,
          reply_to: replyTo || undefined,
        }),
      });
      
      console.log('[ComposeEmail] Send response status:', res.status);
      
      const data = await res.json();
      console.log('[ComposeEmail] Send response data:', data);

      if (data.success) {
        let finalMessage = `Email sent successfully to ${firstRecipient.email} via ${smtp.name}.`;
        if (cleanTo.length > 1) {
          finalMessage += ` Note: Bulk sending is currently limited - only first recipient sent.`;
        }
        if (suppressedTo.length > 0) {
          finalMessage += ` Skipped ${suppressedTo.length} unsubscribed recipient(s).`;
        }
        
        toast.success(finalMessage);
        
        // Reset form
        setTo([]);
        setCc([]);
        setBcc([]);
        setSubject('');
        setBodyHtml('');
        setBodyText('');
        setReplyTo('');
        
        // Refresh page to show updated stats
        router.refresh();
      } else {
        console.error('[ComposeEmail] Send failed:', data.error);
        toast.error(data.error || 'Failed to send email');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      console.error('[ComposeEmail] Send exception:', e);
      toast.error(msg);
    }
    setSending(false);
  }

  return (
    <div style={{ padding: 28 }}>
      {/* 50+ Confirmation Dialog */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(27,29,34,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div className="glass fade-in" style={{ padding: 24, maxWidth: 440, background: '#FFFFFF', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, color: 'var(--red)' }}>
              <AlertCircle size={20} />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'Fraunces' }}>Confirm Campaign Blast</h3>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
              You are about to send this email to <strong style={{ color: 'var(--text)' }}>{to.length + cc.length + bcc.length} recipients</strong> from account <strong style={{ color: 'var(--text)' }}>{smtp?.name}</strong>. 
              This bulk send is irreversible. Make sure all content is correct before proceeding.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ background: 'var(--red)' }} onClick={() => handleSend(true)}>Confirm & Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Compose Email</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Send transactional or promotional email campaigns</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {templates.length > 0 && (
            <button className="btn-secondary" onClick={() => setLoadTemplate(!loadTemplate)}>
              <Plus size={14} /> Load Template
            </button>
          )}
          <button className="btn-secondary" onClick={() => setShowPreview(!showPreview)}>
            <Eye size={14} /> {showPreview ? 'Editor' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Account Selector (Top Seal Monogram Banner) */}
      <div className="glass" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, background: '#FFFFFF' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sending Account
        </div>
        {smtpAccounts.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>
            No sending accounts connected. Add one to compose.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div className="monogram" style={{
              width: 30, height: 30, fontSize: 11,
              background: 'var(--accent-glow)', color: 'var(--accent)',
              border: '1.5px solid var(--accent)',
              flexShrink: 0
            }}>
              {smtp ? getMonogram(smtp.name) : '?'}
            </div>
            <select 
              value={smtpId} 
              onChange={e => setSmtpId(e.target.value)}
              style={{ 
                width: 'auto', 
                fontWeight: 600, 
                border: 'none', 
                background: 'transparent',
                fontSize: 15,
                padding: '4px 28px 4px 8px',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
            >
              {smtpAccounts.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.from_email})</option>
              ))}
            </select>
            {smtp && (
              <span className="badge badge-blue" style={{ fontSize: 10 }}>
                SMTP Active
              </span>
            )}
          </div>
        )}
      </div>

      {/* Template Picker */}
      {loadTemplate && (
        <div className="glass fade-in" style={{ padding: 16, marginBottom: 20, background: '#FFFFFF' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>Choose a template</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map(t => (
              <button key={t.id} onClick={() => applyTemplate(t)} style={{ textAlign: 'left', padding: '10px 14px', background: 'var(--paper-100)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.subject}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results banner - Removed, using toast instead */}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left - Form */}
        <div className="glass" style={{ padding: 20, background: '#FFFFFF' }}>
          
          <RecipientInput label="To Recipients *" recipients={to} onChange={setTo} />

          <div style={{ marginBottom: 12 }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
              onClick={() => setShowCC(!showCC)}>
              {showCC ? <ChevronUp size={13} /> : <ChevronDown size={13} />} CC / BCC options
            </button>
          </div>

          {showCC && (
            <div className="fade-in">
              <RecipientInput label="CC" recipients={cc} onChange={setCc} />
              <RecipientInput label="BCC" recipients={bcc} onChange={setBcc} />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label>Email Subject *</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Weekly Updates - July 2026" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label>Reply-To Override</label>
            <input value={replyTo} onChange={e => setReplyTo(e.target.value)} placeholder="e.g. replies@yourdomain.com" />
          </div>

          {/* Body Type Toggle */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ marginBottom: 8 }}>Body Format</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['html', 'text', 'both'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setBodyType(type)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${bodyType === type ? 'var(--accent)' : 'var(--border)'}`,
                    background: bodyType === type ? 'var(--accent-glow)' : 'transparent',
                    color: bodyType === type ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: bodyType === type ? 600 : 500,
                    textTransform: 'uppercase'
                  }}
                >
                  {type === 'both' ? 'HTML + Plain Text' : type}
                </button>
              ))}
            </div>
          </div>

          {/* HTML Body */}
          {(bodyType === 'html' || bodyType === 'both') && (
            <div style={{ marginBottom: 16 }}>
              <label>HTML Content {bodyType === 'both' ? '' : '*'}</label>
              <textarea
                value={bodyHtml}
                onChange={e => setBodyHtml(e.target.value)}
                placeholder="<p>Hello world!</p>"
                rows={bodyType === 'both' ? 7 : 11}
                style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, resize: 'vertical' }}
              />
            </div>
          )}

          {/* Plain Text Body */}
          {(bodyType === 'text' || bodyType === 'both') && (
            <div style={{ marginBottom: 16 }}>
              <label>Plain Text Content {bodyType === 'both' ? '' : '*'}</label>
              <textarea
                value={bodyText}
                onChange={e => setBodyText(e.target.value)}
                placeholder="Hello world!"
                rows={bodyType === 'both' ? 7 : 11}
                style={{ fontSize: 13, resize: 'vertical' }}
              />
            </div>
          )}

          {/* Attachments - Removed for now, can be added later */}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-primary"
              onClick={() => handleSend(false)}
              disabled={sending || !smtp || to.length === 0 || !subject || 
                (bodyType === 'html' && !bodyHtml) || 
                (bodyType === 'text' && !bodyText) || 
                (bodyType === 'both' && (!bodyHtml || !bodyText))}
              style={{ flex: 1, padding: '12px 20px', fontSize: 15 }}
            >
              {sending ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
              {sending ? 'Sending Campaign...' : `Send Outbound Campaign`}
            </button>
          </div>
        </div>

        {/* Right - Preview */}
        <div className="glass" style={{ padding: 0, overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={14} color="var(--text-muted)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Real-time Delivery Preview</span>
            {smtp && <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{smtp.name}</span>}
          </div>
          <div style={{ padding: 16, background: 'var(--paper-100)', minHeight: 500 }}>
            {subject && <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#1a1a1a', background: '#ffffff', padding: '12px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontFamily: 'Fraunces' }}>{subject}</div>}
            {to.length > 0 && (
              <div style={{ fontSize: 12, color: '#666666', marginBottom: 12, background: '#ffffff', padding: '8px 12px', borderRadius: '6px' }}>
                To: {to.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(', ')}
              </div>
            )}
            <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />
            {(bodyHtml || bodyText) ? (
              <div style={{
                background: '#ffffff',
                padding: '20px',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                minHeight: 350,
                border: '1px solid var(--border)'
              }}>
                {bodyType === 'text' || (bodyType === 'both' && !bodyHtml) ? (
                  <div style={{ fontSize: 14, color: '#000000', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {bodyText}
                  </div>
                ) : (
                  <div
                    style={{ fontSize: 14, color: '#000000', lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', paddingTop: 40, background: '#ffffff', padding: '60px 20px', borderRadius: '6px', border: '1px dashed var(--border)' }}>
                Start writing your message to see a live preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

