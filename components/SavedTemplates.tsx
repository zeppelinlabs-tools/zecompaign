'use client';
import { useState, useRef } from 'react';
import { BookOpen, Send, Trash2, Copy, CheckCircle, Eye, X, Edit2, Save } from 'lucide-react';
import { EmailTemplate, User } from '@/lib/types';

interface Props {
  templates: EmailTemplate[];
  onChange: (t: EmailTemplate[]) => void;
  onUseInCompose: (t: EmailTemplate) => void;
  currentUser: User;
}

export default function SavedTemplates({ templates, onChange, onUseInCompose, currentUser }: Props) {
  const [preview, setPreview] = useState<EmailTemplate | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState<EmailTemplate | null>(null);
  const editableRef = useRef<HTMLDivElement>(null);

  const isViewer = currentUser.role === 'viewer';

  function remove(id: string) {
    if (isViewer) return;
    onChange(templates.filter(t => t.id !== id));
    if (preview?.id === id) {
      setPreview(null);
      setEditMode(false);
    }
  }

  function copy(t: EmailTemplate) {
    navigator.clipboard.writeText(t.bodyHtml);
    setCopied(t.id);
    setTimeout(() => setCopied(null), 2000);
  }

  function startEdit(t: EmailTemplate) {
    if (isViewer) return;
    setEditedTemplate({ ...t });
    setEditMode(true);
    // Set content after render
    setTimeout(() => {
      if (editableRef.current) {
        editableRef.current.innerHTML = t.bodyHtml;
      }
    }, 0);
  }

  function cancelEdit() {
    setEditedTemplate(null);
    setEditMode(false);
  }

  function saveEdit() {
    if (!editedTemplate || isViewer) return;
    onChange(templates.map(t => t.id === editedTemplate.id ? editedTemplate : t));
    setPreview(editedTemplate);
    setEditMode(false);
  }

  function handlePreviewClick(t: EmailTemplate) {
    if (preview?.id === t.id) {
      setPreview(null);
      setEditMode(false);
      setEditedTemplate(null);
    } else {
      setPreview(t);
      setEditMode(false);
      setEditedTemplate(null);
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
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 4, fontFamily: 'Fraunces', fontWeight: 600 }}>Template library empty</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {isViewer ? 'Ask an admin or marketer to generate email templates.' : 'Generate templates in the AI Generator to save them here.'}
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
                      {t.tags.map(tag => (
                        <span key={tag} className="badge badge-blue" style={{ fontSize: 10 }}>{tag}</span>
                      ))}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12, minHeight: 30 }} onClick={() => handlePreviewClick(t)}>
                      <Eye size={12} />
                    </button>
                    {!isViewer && (
                      <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12, minHeight: 30 }} onClick={() => { setPreview(t); startEdit(t); }}>
                        <Edit2 size={12} />
                      </button>
                    )}
                    {!isViewer && (
                      <button className="btn-primary" style={{ padding: '6px 10px', fontSize: 12, minHeight: 30 }} onClick={() => onUseInCompose(t)}>
                        <Send size={12} /> Use
                      </button>
                    )}
                    <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12, minHeight: 30 }} onClick={() => copy(t)}>
                      {copied === t.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                    </button>
                    {!isViewer && (
                      <button className="btn-danger" style={{ padding: '6px 10px', minHeight: 30 }} onClick={() => remove(t.id)}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview panel */}
          {preview && (
            <div className="glass fade-in" style={{ overflow: 'hidden', height: 'fit-content', position: 'sticky', top: 20, background: '#FFFFFF' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editMode && editedTemplate ? (
                    <input
                      value={editedTemplate.name}
                      onChange={e => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
                      style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, width: '100%', padding: '4px 6px', border: '1px solid var(--accent)', borderRadius: 4 }}
                    />
                  ) : (
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{preview.name}</div>
                  )}
                  {editMode && editedTemplate ? (
                    <input
                      value={editedTemplate.subject}
                      onChange={e => setEditedTemplate({ ...editedTemplate, subject: e.target.value })}
                      style={{ fontSize: 12, color: 'var(--text-muted)', width: '100%', padding: '4px 6px', border: '1px solid var(--accent)', borderRadius: 4, marginTop: 4 }}
                    />
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.subject}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 12, flexShrink: 0 }}>
                  {editMode ? (
                    <>
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={saveEdit}>
                        <Save size={12} /> Save
                      </button>
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={cancelEdit}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {!isViewer && (
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => startEdit(preview)}>
                          <Edit2 size={12} /> Edit
                        </button>
                      )}
                      {!isViewer && (
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => onUseInCompose(preview)}>
                          <Send size={12} /> Use
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={() => { setPreview(null); setEditMode(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div style={{ padding: 18, maxHeight: 500, overflowY: 'auto', background: 'var(--paper-100)' }}>
                {editMode && editedTemplate ? (
                  <div style={{
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '2px solid var(--accent)',
                    minHeight: 350
                  }}>
                    <div
                      ref={editableRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={e => {
                        if (editedTemplate) {
                          setEditedTemplate({ ...editedTemplate, bodyHtml: e.currentTarget.innerHTML });
                        }
                      }}
                      style={{ 
                        fontSize: 14, 
                        lineHeight: 1.7, 
                        color: '#000000',
                        outline: 'none',
                        cursor: 'text'
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
                      Editing Template: Changes will save to the shared library.
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: '#000000' }} dangerouslySetInnerHTML={{ __html: preview.bodyHtml }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

