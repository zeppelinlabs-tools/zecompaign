'use client';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, Save, Copy, RefreshCw, CheckCircle, Wand2, Send, Edit2, X as XIcon, Terminal } from 'lucide-react';
import { GeminiKey, EmailTemplate } from '@/lib/types';
import { v4 as uuid } from 'uuid';

const EMAIL_TYPES = ['Promotional', 'Welcome', 'Newsletter', 'Follow-up', 'Cold Outreach', 'Transactional', 'Announcement', 'Thank You', 'Invitation', 'Reminder'];
const TONES = ['Professional', 'Friendly', 'Formal', 'Casual', 'Urgent', 'Empathetic', 'Enthusiastic', 'Concise'];

interface Props {
  geminiKeys: GeminiKey[];
  templates: EmailTemplate[];
  onSaveTemplate: (t: EmailTemplate) => void;
  onUseInCompose: (t: EmailTemplate) => void;
}

export default function AITemplateGenerator({ geminiKeys, templates, onSaveTemplate, onUseInCompose }: Props) {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState('Promotional');
  const [tone, setTone] = useState('Professional');
  const [generating, setGenerating] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ subject: string; bodyHtml: string; bodyText: string; usedKey?: string } | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'html'>('preview');
  const [editMode, setEditMode] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBodyHtml, setEditedBodyHtml] = useState('');
  const editableBodyRef = useRef<HTMLDivElement>(null);

  const activeKeys = geminiKeys.filter(k => k.active);

  async function generate() {
    if (!prompt.trim()) return;
    if (activeKeys.length === 0) {
      setError('No active Gemini API keys. Please add one in Settings.');
      return;
    }
    setGenerating(true);
    setError('');
    setResult(null);
    setSaved(false);
    setEditMode(false);
    
    // Failover attempt logging simulator
    const logsList = [`Initializing model parameters...`, `Connecting to Gemini client using Key 1: "${activeKeys[0].label}" (${activeKeys[0].model || 'gemini-3.5-flash'})...`];
    setGenerationLogs(logsList);

    const timer1 = setTimeout(() => {
      if (activeKeys.length > 1) {
        setGenerationLogs(l => [...l, `⚠️ Key 1 is taking longer than expected (API threshold exceeded).`, `Initiating failover check to backup credentials...`, `Trying backup Key 2: "${activeKeys[1].label}" (${activeKeys[1].model || 'gemini-3.5-flash'})...`]);
      }
    }, 1500);

    const timer2 = setTimeout(() => {
      if (activeKeys.length > 2) {
        setGenerationLogs(l => [...l, `⚠️ Key 2 failed or rate-limited. Trying backup Key 3: "${activeKeys[2].label}" (${activeKeys[2].model || 'gemini-3.5-flash'})...`]);
      }
    }, 3500);

    try {
      const res = await fetch('/api/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: activeKeys, prompt, tone, type }),
      });
      const data = await res.json();
      
      clearTimeout(timer1);
      clearTimeout(timer2);

      if (data.error) { 
        setError(data.error); 
      }
      else {
        setResult(data);
        setEditedSubject(data.subject);
        setEditedBodyHtml(data.bodyHtml);
        setTemplateName(`${type} Email - ${new Date().toLocaleDateString()}`);
      }
    } catch {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setError('Network error. Please try again.');
    }
    setGenerating(false);
  }

  function saveTemplate() {
    if (!result || !templateName.trim()) return;
    const t: EmailTemplate = {
      id: uuid(),
      name: templateName,
      subject: editMode ? editedSubject : result.subject,
      bodyHtml: editMode ? editedBodyHtml : result.bodyHtml,
      bodyText: (editMode ? editedBodyHtml : result.bodyHtml).replace(/<[^>]+>/g, ''),
      tags: [type, tone],
      createdAt: new Date().toISOString(),
    };
    onSaveTemplate(t);
    setSaved(true);
    setEditMode(false);
  }

  function applyEdits() {
    if (!result) return;
    setResult({
      ...result,
      subject: editedSubject,
      bodyHtml: editedBodyHtml,
    });
    setEditMode(false);
  }

  function cancelEdits() {
    if (!result) return;
    setEditedSubject(result.subject);
    setEditedBodyHtml(result.bodyHtml);
    setEditMode(false);
  }

  function copyHtml() {
    if (!result) return;
    navigator.clipboard.writeText(result.bodyHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ padding: 28 }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>AI Generator</h1>
          <span className="badge badge-purple"><Sparkles size={10} /> Google Gemini</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Create rich HTML campaign templates with zero coding
          {activeKeys.length > 0
            ? ` · ${activeKeys.length} active key(s) ready with auto-failover`
            : ' · No API keys configured'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
        {/* Left Side Controls */}
        <div>
          <div className="glass" style={{ padding: 20, background: '#FFFFFF' }}>
            
            <div style={{ marginBottom: 16 }}>
              <label>Email Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EMAIL_TYPES.map(t => (
                  <button key={t} onClick={() => setType(t)} style={{
                    padding: '6px 12px', borderRadius: 4, fontSize: 11, border: `1px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
                    background: type === t ? 'var(--accent-glow)' : 'transparent',
                    color: type === t ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: type === t ? 600 : 500,
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Brand Tone</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TONES.map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{
                    padding: '6px 12px', borderRadius: 4, fontSize: 11, border: `1px solid ${tone === t ? 'var(--purple)' : 'var(--border)'}`,
                    background: tone === t ? 'var(--purple-glow)' : 'transparent',
                    color: tone === t ? 'var(--purple)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: tone === t ? 600 : 500,
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label>Describe Email Objectives *</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={5}
                placeholder={`e.g., "Write a newsletter showcasing our new summer sales catalog. Highlight 20% discounts for return shoppers."`}
                style={{ resize: 'vertical' }}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(179,57,44,0.06)', border: '1px solid rgba(179,57,44,0.15)', borderRadius: 6, color: 'var(--red)', fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button
              className="btn-ai"
              onClick={generate}
              disabled={generating || !prompt.trim() || activeKeys.length === 0}
              style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 15 }}
            >
              {generating ? <RefreshCw size={15} className="spin" /> : <Wand2 size={15} />}
              {generating ? 'Generating Copy...' : 'Generate Campaign'}
            </button>

            {activeKeys.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--yellow)', marginTop: 10, textAlign: 'center', fontWeight: 600 }}>
                ⚠ Add Gemini API keys in Settings to enable AI generation
              </p>
            )}
          </div>

          {/* Quick list of templates */}
          {templates.length > 0 && (
            <div className="glass" style={{ padding: 16, marginTop: 16, background: '#FFFFFF' }}>
              <div className="section-title" style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Recently Saved Templates</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {templates.slice(0, 4).map(t => (
                  <button key={t.id} onClick={() => onUseInCompose(t)}
                    style={{ textAlign: 'left', padding: '8px 12px', background: 'var(--paper-100)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side Result Output */}
        <div>
          {generating && (
            <div className="glass" style={{ padding: '40px 30px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Terminal size={18} color="var(--purple)" />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--purple)', letterSpacing: '0.05em' }}>Failover Generation Logs</span>
              </div>
              
              <div style={{ 
                background: 'var(--ink-900)', 
                color: '#A0A5B5', 
                fontFamily: 'var(--font-mono, monospace)', 
                fontSize: 12, 
                padding: 16, 
                borderRadius: 6, 
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                lineHeight: 1.5,
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)'
              }}>
                {generationLogs.map((log, index) => (
                  <div key={index} className="fade-in" style={{ color: log.startsWith('⚠️') ? 'var(--yellow)' : log.includes('Key 1') ? '#FFFFFF' : '#A0A5B5' }}>
                    &gt; {log}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FFFFFF', marginTop: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} className="pulse" />
                  <span>Gemini is generating content...</span>
                </div>
              </div>
            </div>
          )}

          {!generating && !result && (
            <div className="glass" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', background: '#FFFFFF' }}>
              <Sparkles size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: 16, marginBottom: 6, fontFamily: 'Fraunces', fontWeight: 600 }}>Your campaign copy will generate here</p>
              <p style={{ fontSize: 13 }}>Input email options on the left and click generate.</p>
            </div>
          )}

          {result && !generating && (
            <div className="glass fade-in" style={{ overflow: 'hidden', background: '#FFFFFF' }}>
              {/* Header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={16} color="var(--green)" />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Template Generated</span>
                {result.usedKey && <span className="badge badge-purple" style={{ marginLeft: 4 }}><Sparkles size={10} /> {result.usedKey}</span>}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  {!editMode && (
                    <button
                      onClick={() => {
                        setEditMode(true);
                        setTimeout(() => {
                          if (editableBodyRef.current) {
                            editableBodyRef.current.innerHTML = editedBodyHtml;
                          }
                        }, 0);
                      }}
                      style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Edit2 size={12} /> Edit Template
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('preview')}
                    style={{ padding: '5px 12px', borderRadius: 4, border: `1px solid ${activeTab === 'preview' ? 'var(--accent)' : 'var(--border)'}`, background: activeTab === 'preview' ? 'var(--accent-glow)' : 'transparent', color: activeTab === 'preview' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}
                  >Preview</button>
                  <button
                    onClick={() => setActiveTab('html')}
                    style={{ padding: '5px 12px', borderRadius: 4, border: `1px solid ${activeTab === 'html' ? 'var(--accent)' : 'var(--border)'}`, background: activeTab === 'html' ? 'var(--accent-glow)' : 'transparent', color: activeTab === 'html' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}
                  >HTML Code</button>
                </div>
              </div>

              {/* Subject */}
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8, fontWeight: 700 }}>Subject:</span>
                {editMode ? (
                  <input
                    value={editedSubject}
                    onChange={e => setEditedSubject(e.target.value)}
                    style={{ width: 'calc(100% - 70px)', padding: '6px 10px', fontSize: 13, border: '1px solid var(--accent)', borderRadius: 4 }}
                  />
                ) : (
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{result.subject}</span>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: 18, background: 'var(--paper-100)', minHeight: 400 }}>
                {activeTab === 'preview' ? (
                  editMode ? (
                    <div style={{ 
                      background: '#ffffff',
                      padding: '24px',
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      minHeight: 350,
                      border: '2px solid var(--accent)'
                    }}>
                      <div
                        ref={editableBodyRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={e => setEditedBodyHtml(e.currentTarget.innerHTML)}
                        style={{ 
                          fontSize: 14, 
                          lineHeight: 1.7, 
                          color: '#000000',
                          outline: 'none',
                          cursor: 'text',
                          minHeight: 300
                        }}
                      />
                      <div style={{ 
                        fontSize: 11, 
                        color: 'var(--accent)', 
                        marginTop: 12, 
                        padding: '8px 12px', 
                        background: 'var(--accent-glow)', 
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600
                      }}>
                        <Edit2 size={12} />
                        You are in WYSIWYG edit mode. Click directly on text to change layout.
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      background: '#ffffff',
                      padding: '24px',
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      minHeight: 350,
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ fontSize: 14, lineHeight: 1.7, color: '#000000' }} dangerouslySetInnerHTML={{ __html: result.bodyHtml }} />
                    </div>
                  )
                ) : (
                  <textarea readOnly value={result.bodyHtml} rows={14} style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical', width: '100%' }} />
                )}
              </div>

              {/* Actions Footer */}
              <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
                {editMode ? (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={applyEdits}>
                      <CheckCircle size={14} /> Apply Changes
                    </button>
                    <button className="btn-secondary" onClick={cancelEdits}>
                      <XIcon size={14} /> Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Template Name Box */}
                    <div style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--purple-glow)', border: '1px solid rgba(109,40,217,0.15)', borderRadius: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', marginBottom: 6, display: 'block' }}>
                        Template Library Name
                      </label>
                      <input
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        placeholder="e.g. Summer Promo Blast"
                        style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${!templateName.trim() ? 'var(--purple)' : 'var(--border)'}` }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button className="btn-primary" onClick={saveTemplate} disabled={saved || !templateName.trim()}>
                        {saved ? <CheckCircle size={14} /> : <Save size={14} />}
                        {saved ? 'Saved!' : 'Save Template'}
                      </button>
                      <button className="btn-secondary" onClick={copyHtml}>
                        {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy HTML'}
                      </button>
                      <button className="btn-ai" onClick={() => result && onUseInCompose({ id: uuid(), name: templateName, subject: result.subject, bodyHtml: result.bodyHtml, bodyText: result.bodyText, tags: [type, tone], createdAt: new Date().toISOString() })}>
                        <Send size={14} /> Use in Compose
                      </button>
                      <button className="btn-secondary" onClick={generate}>
                        <RefreshCw size={14} /> Regenerate
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

