'use client'

import { useState } from 'react'
import { BookOpen, Send, Trash2, Copy, CheckCircle, Eye, X } from 'lucide-react'
import { deleteTemplate, duplicateTemplate } from '@/lib/actions/templates'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Template {
  id: string
  name: string
  subject: string
  body_html: string
  body_text: string
  category: string | null
  tags: string[] | null
  created_at: string
}

interface Props {
  initialTemplates: Template[]
  organizationId: string
  userRole: string
}

export default function SavedTemplates({ initialTemplates, organizationId, userRole }: Props) {
  const router = useRouter()
  const [templates] = useState(initialTemplates)
  const [preview, setPreview] = useState<Template | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const isViewer = userRole === 'member' && initialTemplates.length === 0

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return

    const result = await deleteTemplate(id)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Template deleted')
      if (preview?.id === id) {
        setPreview(null)
      }
      router.refresh()
    }
  }

  async function handleDuplicate(id: string) {
    const result = await duplicateTemplate(id)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Template duplicated')
      router.refresh()
    }
  }

  function handleCopy(t: Template) {
    navigator.clipboard.writeText(t.body_html)
    setCopied(t.id)
    toast.success('HTML copied to clipboard')
    setTimeout(() => setCopied(null), 2000)
  }

  function handleUseInCompose(t: Template) {
    // Store in sessionStorage for compose page to pick up
    sessionStorage.setItem('selectedTemplate', JSON.stringify(t))
    router.push('/compose')
  }

  function handlePreviewClick(t: Template) {
    if (preview?.id === t.id) {
      setPreview(null)
    } else {
      setPreview(t)
    }
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Templates</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {templates.length === 0 ? 'No templates saved' : `${templates.length} template${templates.length !== 1 ? 's' : ''} in library`}
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="glass" style={{ padding: 60, textAlign: 'center', background: '#FFFFFF' }}>
          <BookOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 4, fontFamily: 'Fraunces', fontWeight: 600 }}>
            Template library empty
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Generate templates in the AI Generator to save them here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 1fr' : '1fr', gap: 20 }}>
          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {templates.map(t => (
              <div
                key={t.id}
                className="glass"
                style={{
                  padding: 18,
                  cursor: 'pointer',
                  border: `1px solid ${preview?.id === t.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: '#FFFFFF',
                  transition: 'all 0.15s',
                }}
                onClick={() => handlePreviewClick(t)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{t.subject}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {t.category && (
                        <span className="badge badge-blue" style={{ fontSize: 10 }}>{t.category}</span>
                      )}
                      {t.tags && t.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="badge badge-purple" style={{ fontSize: 10 }}>{tag}</span>
                      ))}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '6px 10px', fontSize: 12, minHeight: 30 }} 
                      onClick={() => handlePreviewClick(t)}
                    >
                      <Eye size={12} />
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '6px 10px', fontSize: 12, minHeight: 30 }} 
                      onClick={() => handleUseInCompose(t)}
                    >
                      <Send size={12} /> Use
                    </button>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '6px 10px', fontSize: 12, minHeight: 30 }} 
                      onClick={() => handleCopy(t)}
                    >
                      {copied === t.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                    </button>
                    <button 
                      className="btn-danger" 
                      style={{ padding: '6px 10px', minHeight: 30 }} 
                      onClick={() => handleDelete(t.id)}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview Panel */}
          {preview && (
            <div className="glass fade-in" style={{ overflow: 'hidden', height: 'fit-content', position: 'sticky', top: 20, background: '#FFFFFF' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{preview.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {preview.subject}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 12, flexShrink: 0 }}>
                  <button 
                    className="btn-primary" 
                    style={{ padding: '6px 12px', fontSize: 12 }} 
                    onClick={() => handleUseInCompose(preview)}
                  >
                    <Send size={12} /> Use
                  </button>
                  <button 
                    onClick={() => setPreview(null)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div style={{ padding: 18, maxHeight: 500, overflowY: 'auto', background: 'var(--paper-100)' }}>
                <div style={{
                  background: '#ffffff',
                  padding: '20px',
                  borderRadius: '6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid var(--border)'
                }}>
                  <div 
                    style={{ fontSize: 14, lineHeight: 1.7, color: '#000000' }} 
                    dangerouslySetInnerHTML={{ __html: preview.body_html }} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
