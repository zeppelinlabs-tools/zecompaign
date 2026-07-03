'use client'

import { useState } from 'react'
import { Sparkles, Save, RefreshCw, CheckCircle, Wand2, Send } from 'lucide-react'
import { createTemplate } from '@/lib/actions/templates'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface GeminiKey {
  id: string
  name: string
  is_active: boolean
  usage_count: number
  monthly_quota: number | null
}

interface Template {
  id: string
  name: string
  subject: string
  body_html: string
  body_text: string
}

interface Props {
  geminiKeys: GeminiKey[]
  templates: Template[]
  organizationId: string
  userRole: string
}

const EMAIL_TYPES = ['Promotional', 'Welcome', 'Newsletter', 'Follow-up', 'Cold Outreach', 'Announcement', 'Thank You', 'Invitation']
const TONES = ['Professional', 'Friendly', 'Formal', 'Casual', 'Urgent', 'Enthusiastic']

export default function AITemplateGenerator({ geminiKeys, templates, organizationId, userRole }: Props) {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [type, setType] = useState('Promotional')
  const [tone, setTone] = useState('Professional')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ subject: string; body_html: string; body_text: string } | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'html'>('preview')

  const activeKeys = geminiKeys.filter(k => k.is_active)

  async function generate() {
    if (!prompt.trim()) {
      toast.error('Please describe your email')
      return
    }
    
    if (activeKeys.length === 0) {
      toast.error('No active Gemini API keys. Please add one in Settings.')
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organization_id: organizationId,
          prompt, 
          tone, 
          length: 'medium'
        }),
      })
      
      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
      } else if (data.template) {
        setResult({
          subject: data.template.subject,
          body_html: data.template.body_html,
          body_text: data.template.body_text
        })
        setTemplateName(`${type} - ${new Date().toLocaleDateString()}`)
        toast.success('Template generated!')
      }
    } catch (err) {
      toast.error('Network error. Please try again.')
    }
    setGenerating(false)
  }

  async function saveTemplate() {
    if (!result || !templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    setSaving(true)
    const saveResult = await createTemplate({
      organization_id: organizationId,
      name: templateName,
      subject: result.subject,
      body_html: result.body_html,
      body_text: result.body_text,
      category: type,
      tags: [type, tone],
    })

    if (saveResult.error) {
      toast.error(saveResult.error)
    } else {
      toast.success('Template saved!')
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>AI Generator</h1>
          <span className="badge badge-purple"><Sparkles size={10} /> Google Gemini</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Create professional email templates with AI
          {activeKeys.length > 0
            ? ` · ${activeKeys.length} active key(s) ready`
            : ' · No API keys configured'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
        {/* Left Controls */}
        <div>
          <div className="glass" style={{ padding: 20, background: '#FFFFFF' }}>
            
            <div style={{ marginBottom: 16 }}>
              <label>Email Type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EMAIL_TYPES.map(t => (
                  <button 
                    key={t} 
                    onClick={() => setType(t)} 
                    style={{
                      padding: '6px 12px', 
                      borderRadius: 4, 
                      fontSize: 11, 
                      border: `1px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
                      background: type === t ? 'var(--accent-glow)' : 'transparent',
                      color: type === t ? 'var(--accent)' : 'var(--text-muted)', 
                      cursor: 'pointer', 
                      fontWeight: type === t ? 600 : 500,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Tone</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TONES.map(t => (
                  <button 
                    key={t} 
                    onClick={() => setTone(t)} 
                    style={{
                      padding: '6px 12px', 
                      borderRadius: 4, 
                      fontSize: 11, 
                      border: `1px solid ${tone === t ? 'var(--purple)' : 'var(--border)'}`,
                      background: tone === t ? 'var(--purple-glow)' : 'transparent',
                      color: tone === t ? 'var(--purple)' : 'var(--text-muted)', 
                      cursor: 'pointer', 
                      fontWeight: tone === t ? 600 : 500,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label>Describe Your Email *</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={5}
                placeholder="e.g., Write a newsletter about our new summer collection with 20% off discount code"
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              className="btn-ai"
              onClick={generate}
              disabled={generating || !prompt.trim() || activeKeys.length === 0}
              style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 15 }}
            >
              {generating ? <RefreshCw size={15} className="spin" /> : <Wand2 size={15} />}
              {generating ? 'Generating...' : 'Generate Template'}
            </button>

            {activeKeys.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--yellow)', marginTop: 10, textAlign: 'center', fontWeight: 600 }}>
                ⚠ Add Gemini API keys in Settings
              </p>
            )}
          </div>

          {/* Recent Templates */}
          {templates.length > 0 && (
            <div className="glass" style={{ padding: 16, marginTop: 16, background: '#FFFFFF' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                Recent Templates
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {templates.slice(0, 4).map(t => (
                  <div 
                    key={t.id}
                    style={{ 
                      padding: '8px 12px', 
                      background: 'var(--paper-100)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 6
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.subject}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Output */}
        <div>
          {!result && !generating && (
            <div className="glass" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', background: '#FFFFFF' }}>
              <Sparkles size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: 16, marginBottom: 6, fontFamily: 'Fraunces', fontWeight: 600 }}>
                Your template will appear here
              </p>
              <p style={{ fontSize: 13 }}>Fill in the options and click generate</p>
            </div>
          )}

          {generating && (
            <div className="glass" style={{ padding: '40px 30px', background: '#FFFFFF', textAlign: 'center' }}>
              <RefreshCw size={40} className="spin" style={{ margin: '0 auto 20px', color: 'var(--purple)' }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--purple)' }}>Generating with AI...</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>This may take a few seconds</p>
            </div>
          )}

          {result && !generating && (
            <div className="glass fade-in" style={{ overflow: 'hidden', background: '#FFFFFF' }}>
              {/* Header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={16} color="var(--green)" />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Template Generated</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setActiveTab('preview')}
                    style={{ 
                      padding: '5px 12px', 
                      borderRadius: 4, 
                      border: `1px solid ${activeTab === 'preview' ? 'var(--accent)' : 'var(--border)'}`, 
                      background: activeTab === 'preview' ? 'var(--accent-glow)' : 'transparent', 
                      color: activeTab === 'preview' ? 'var(--accent)' : 'var(--text-muted)', 
                      cursor: 'pointer', 
                      fontSize: 12 
                    }}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('html')}
                    style={{ 
                      padding: '5px 12px', 
                      borderRadius: 4, 
                      border: `1px solid ${activeTab === 'html' ? 'var(--accent)' : 'var(--border)'}`, 
                      background: activeTab === 'html' ? 'var(--accent-glow)' : 'transparent', 
                      color: activeTab === 'html' ? 'var(--accent)' : 'var(--text-muted)', 
                      cursor: 'pointer', 
                      fontSize: 12 
                    }}
                  >
                    HTML
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8, fontWeight: 700 }}>Subject:</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{result.subject}</span>
              </div>

              {/* Body */}
              <div style={{ padding: 18, background: 'var(--paper-100)', minHeight: 400 }}>
                {activeTab === 'preview' ? (
                  <div style={{ 
                    background: '#ffffff',
                    padding: '24px',
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    minHeight: 350,
                    border: '1px solid var(--border)'
                  }}>
                    <div 
                      style={{ fontSize: 14, lineHeight: 1.7, color: '#000000' }} 
                      dangerouslySetInnerHTML={{ __html: result.body_html }} 
                    />
                  </div>
                ) : (
                  <textarea 
                    readOnly 
                    value={result.body_html} 
                    rows={14} 
                    style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical', width: '100%' }} 
                  />
                )}
              </div>

              {/* Actions */}
              <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
                <div style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--purple-glow)', border: '1px solid rgba(109,40,217,0.15)', borderRadius: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', marginBottom: 6, display: 'block' }}>
                    Template Name
                  </label>
                  <input
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="e.g. Summer Promo 2026"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button 
                    className="btn-primary" 
                    onClick={saveTemplate} 
                    disabled={saving || !templateName.trim()}
                  >
                    {saving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                  <button className="btn-secondary" onClick={generate}>
                    <RefreshCw size={14} /> Regenerate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
