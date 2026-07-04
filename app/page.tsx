'use client'

import Link from 'next/link'
import { Mail, Lock, Users, Sparkles, Check, ArrowRight, Shield, Zap, BarChart3, Clock, Globe } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        window.location.href = '/dashboard'
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => new Set(prev).add(entry.target.id))
        }
      })
    }, observerOptions)

    const sections = document.querySelectorAll('[data-animate]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [loading])

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-base)'
      }}>
        <div className="pulse" style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background pattern */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '800px',
        background: 'radial-gradient(circle at 30% 20%, rgba(52, 87, 166, 0.04) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(31, 138, 112, 0.03) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      {/* Navigation */}
      <nav className="glass" style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        borderBottom: '1px solid var(--border)',
        borderRadius: 0,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 1px 3px rgba(27, 29, 34, 0.04)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '72px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="monogram" style={{
                width: 42,
                height: 42,
                fontSize: 17,
                background: 'linear-gradient(135deg, var(--accent) 0%, #264182 100%)',
                color: 'white',
                border: 'none',
                boxShadow: '0 2px 8px rgba(52, 87, 166, 0.15)'
              }}>
                ZC
              </div>
              <h1 style={{ 
                fontSize: 26, 
                fontWeight: 700, 
                fontFamily: 'Fraunces, Georgia, serif',
                color: 'var(--ink-900)',
                letterSpacing: '-0.02em'
              }}>
                zecompaign
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/login" style={{ 
                padding: '10px 20px', 
                color: 'var(--text-muted)', 
                fontWeight: 500,
                fontSize: 14,
                textDecoration: 'none',
                transition: 'all 0.2s',
                borderRadius: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--paper-200)'
                e.currentTarget.style.color = 'var(--ink-900)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}>
                Log In
              </Link>
              <Link href="/signup" className="btn-primary" style={{
                padding: '10px 22px',
                boxShadow: '0 2px 8px rgba(52, 87, 166, 0.15)'
              }}>
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        data-animate
        id="hero"
        style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '100px 24px 80px',
          position: 'relative',
          zIndex: 1,
          opacity: visibleSections.has('hero') ? 1 : 0,
          transform: visibleSections.has('hero') ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease'
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '920px', margin: '0 auto' }}>
          <div className="badge badge-blue" style={{ 
            marginBottom: 28, 
            display: 'inline-flex',
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(52, 87, 166, 0.12)'
          }}>
            <Sparkles size={13} /> B2B SaaS Collaboration Tool
          </div>
          
          <h1 style={{ 
            fontSize: 64, 
            fontWeight: 700, 
            lineHeight: 1.08,
            marginBottom: 28,
            fontFamily: 'Fraunces, Georgia, serif',
            color: 'var(--ink-900)',
            letterSpacing: '-0.04em'
          }}>
            Email Collaboration for
            <br />
            <span style={{ 
              background: 'linear-gradient(135deg, var(--accent) 0%, #264182 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Marketing Teams
            </span>
          </h1>
          
          <p style={{ 
            fontSize: 21, 
            color: 'var(--ink-600)', 
            marginBottom: 44, 
            lineHeight: 1.7,
            maxWidth: 720,
            margin: '0 auto 44px',
            fontWeight: 400
          }}>
            Stop sharing SMTP passwords in Slack. Centralize email accounts, collaborate with your team, 
            and maintain full audit trails. Secure, organized, AI-powered.
          </p>
          
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            <Link href="/signup" className="btn-primary" style={{ 
              padding: '16px 36px', 
              fontSize: 16,
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(52, 87, 166, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(52, 87, 166, 0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(52, 87, 166, 0.2)'
            }}>
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link href="#features" className="btn-secondary" style={{ 
              padding: '16px 36px', 
              fontSize: 16,
              fontWeight: 500
            }}>
              See How It Works
            </Link>
          </div>
          
          <p style={{ 
            fontSize: 14, 
            color: 'var(--text-subtle)', 
            marginTop: 24,
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} color="var(--stamp-teal)" /> No credit card required
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} color="var(--stamp-teal)" /> 3 SMTP accounts free
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} color="var(--stamp-teal)" /> 2 minute setup
            </span>
          </p>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 32,
          maxWidth: 900,
          margin: '80px auto 0',
          textAlign: 'center'
        }}>
          <StatCard icon={<Shield size={24} />} label="Enterprise Security" value="Bank-Level" />
          <StatCard icon={<Zap size={24} />} label="Setup Time" value="< 2 Minutes" />
          <StatCard icon={<Users size={24} />} label="Team Collaboration" value="Built-In" />
          <StatCard icon={<Globe size={24} />} label="SMTP Providers" value="Any Provider" />
        </div>
      </section>

      {/* Social Proof */}
      <section 
        data-animate
        id="social-proof"
        style={{ 
          background: 'linear-gradient(to bottom, transparent 0%, var(--paper-200) 20%, var(--paper-200) 80%, transparent 100%)', 
          borderTop: '1px solid var(--border-light)',
          borderBottom: '1px solid var(--border-light)',
          padding: '48px 24px',
          position: 'relative',
          zIndex: 1,
          opacity: visibleSections.has('social-proof') ? 1 : 0,
          transform: visibleSections.has('social-proof') ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ 
            fontSize: 12, 
            color: 'var(--text-muted)', 
            marginBottom: 28, 
            fontWeight: 600, 
            textTransform: 'uppercase', 
            letterSpacing: '0.12em' 
          }}>
            Built for Teams That Value Security & Collaboration
          </p>
          <div style={{ 
            display: 'flex', 
            gap: 48, 
            justifyContent: 'center', 
            alignItems: 'center', 
            flexWrap: 'wrap' 
          }}>
            <TrustBadge icon={<Shield size={20} />} label="Supabase Vault Encrypted" />
            <TrustBadge icon={<Check size={20} />} label="CAN-SPAM Compliant" />
            <TrustBadge icon={<Zap size={20} />} label="Rate Limited & Secure" />
            <TrustBadge icon={<Lock size={20} />} label="Role-Based Access Control" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        data-animate
        id="features" 
        style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '100px 24px',
          position: 'relative',
          zIndex: 1,
          opacity: visibleSections.has('features') ? 1 : 0,
          transform: visibleSections.has('features') ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 70 }}>
          <h2 style={{ 
            fontSize: 48, 
            fontWeight: 700, 
            marginBottom: 18,
            fontFamily: 'Fraunces, Georgia, serif',
            color: 'var(--ink-900)',
            letterSpacing: '-0.03em'
          }}>
            Why Teams Choose zecompaign
          </h2>
          <p style={{ 
            fontSize: 19, 
            color: 'var(--ink-600)', 
            maxWidth: 640, 
            margin: '0 auto',
            lineHeight: 1.7
          }}>
            The collaboration platform for email campaign management. Think Notion, but for emails.
          </p>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
          gap: 28,
          marginBottom: 60
        }}>
          <FeatureCard
            icon={<Lock size={26} />}
            title="Secure Credential Vault"
            description="Stop sharing SMTP passwords via Slack or email. Store credentials in an encrypted vault and share access with role-based permissions. No password exposure, ever."
            color="var(--accent)"
            delay={0.1}
          />

          <FeatureCard
            icon={<Users size={26} />}
            title="Team Collaboration"
            description="Multiple team members can send emails from shared accounts. Full audit trail shows who sent what, when, from which account. Perfect for agencies and marketing teams."
            color="var(--stamp-teal)"
            delay={0.2}
          />

          <FeatureCard
            icon={<Sparkles size={26} />}
            title="AI Template Generator"
            description="Generate professional email templates with Google Gemini. Describe your email, choose tone and length, get HTML + plain text instantly. Bring your own API key."
            color="var(--purple)"
            delay={0.3}
          />

          <FeatureCard
            icon={<Mail size={26} />}
            title="Bring Your Own SMTP"
            description="Use your existing email infrastructure. Works with Gmail, Resend, SendGrid, Mailgun, AWS SES, or any SMTP provider. Unlimited sending through your accounts."
            color="var(--flag-amber)"
            delay={0.4}
          />

          <FeatureCard
            icon={<Check size={26} />}
            title="Compliance Built-In"
            description="CAN-SPAM & RFC 8058 compliant unsubscribe links in every email. Suppression list management. Rate limiting to prevent abuse. Security-first architecture."
            color="var(--accent)"
            delay={0.5}
          />

          <FeatureCard
            icon={<BarChart3 size={26} />}
            title="Full Audit Trail"
            description="Know exactly who sent what, when, from which account. Complete activity logs for compliance and debugging. Perfect for enterprise security requirements."
            color="var(--stamp-teal)"
            delay={0.6}
          />
        </div>

        {/* Use Cases */}
        <div style={{ 
          marginTop: 80,
          padding: '60px 40px',
          background: 'linear-gradient(135deg, rgba(52, 87, 166, 0.04) 0%, rgba(31, 138, 112, 0.04) 100%)',
          borderRadius: '12px',
          border: '1px solid var(--border-light)'
        }}>
          <h3 style={{
            fontSize: 32,
            fontWeight: 700,
            fontFamily: 'Fraunces, Georgia, serif',
            textAlign: 'center',
            marginBottom: 48,
            color: 'var(--ink-900)'
          }}>
            Perfect For
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32
          }}>
            <UseCase
              title="Marketing Agencies"
              description="Manage campaigns for multiple clients from a single dashboard. Each client gets their own sending accounts with full isolation."
            />
            <UseCase
              title="SaaS Teams"
              description="Transactional + marketing emails in one place. Product, marketing, and support can all send from their designated accounts."
            />
            <UseCase
              title="Enterprise Teams"
              description="Role-based access, audit logs, and encrypted credentials meet enterprise security requirements out of the box."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section 
        data-animate
        id="pricing"
        style={{ 
          background: 'var(--paper-200)', 
          padding: '100px 24px', 
          borderTop: '1px solid var(--border)',
          position: 'relative',
          zIndex: 1,
          opacity: visibleSections.has('pricing') ? 1 : 0,
          transform: visibleSections.has('pricing') ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 70 }}>
            <h2 style={{ 
              fontSize: 48, 
              fontWeight: 700, 
              marginBottom: 18,
              fontFamily: 'Fraunces, Georgia, serif',
              color: 'var(--ink-900)',
              letterSpacing: '-0.03em'
            }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{ fontSize: 19, color: 'var(--ink-600)', lineHeight: 1.7 }}>
              No hidden fees. No per-email charges. Unlimited sending through your SMTP.
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', 
            gap: 24, 
            maxWidth: 1140, 
            margin: '0 auto' 
          }}>
            {/* Free Plan */}
            <PricingCard
              name="Free"
              price="$0"
              features={[
                '1 team member',
                '3 SMTP accounts',
                '10 templates',
                '15 AI generations/month',
                'Email support'
              ]}
              cta="Start Free"
              ctaStyle="secondary"
              delay={0.1}
            />

            {/* Starter Plan */}
            <PricingCard
              name="Starter"
              price="$9"
              badge="Most Popular"
              features={[
                '1 team member',
                '5 SMTP accounts',
                '50 templates',
                '100 AI generations/month',
                'Priority support'
              ]}
              cta="Get Started"
              ctaStyle="primary"
              delay={0.2}
            />

            {/* Pro Plan */}
            <PricingCard
              name="Pro"
              price="$19"
              features={[
                '3 team members',
                '15 SMTP accounts',
                '200 templates',
                '500 AI generations/month',
                'Priority support'
              ]}
              cta="Get Started"
              ctaStyle="secondary"
              delay={0.3}
            />

            {/* Business Plan */}
            <PricingCard
              name="Business"
              price="$49"
              features={[
                '10 team members',
                'Unlimited accounts',
                'Unlimited templates',
                '2,000 AI generations/month',
                '24/7 support'
              ]}
              cta="Get Started"
              ctaStyle="secondary"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        data-animate
        id="cta"
        style={{ 
          background: 'linear-gradient(135deg, var(--accent) 0%, #264182 100%)',
          padding: '100px 24px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
          opacity: visibleSections.has('cta') ? 1 : 0,
          transform: visibleSections.has('cta') ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s'
        }}
      >
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-40%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ 
            fontSize: 44, 
            fontWeight: 700, 
            marginBottom: 20,
            fontFamily: 'Fraunces, Georgia, serif',
            letterSpacing: '-0.02em'
          }}>
            Ready to streamline your team's email campaigns?
          </h2>
          <p style={{ fontSize: 20, marginBottom: 40, opacity: 0.96, lineHeight: 1.7, fontWeight: 400 }}>
            Join teams who've stopped sharing passwords in Slack. Start free, upgrade anytime. No credit card required.
          </p>
          <Link href="/signup" className="btn-primary" style={{ 
            background: 'white',
            color: 'var(--accent)',
            padding: '16px 40px',
            fontSize: 17,
            fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            Get Started Free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        background: 'var(--paper-100)', 
        borderTop: '1px solid var(--border)',
        padding: '48px 24px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div className="monogram" style={{
                width: 32,
                height: 32,
                fontSize: 14,
                background: 'var(--accent)',
                color: 'white',
                border: 'none'
              }}>
                ZC
              </div>
              <span style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                fontFamily: 'Fraunces, Georgia, serif',
                color: 'var(--ink-900)'
              }}>
                zecompaign
              </span>
            </div>
            <p style={{ marginBottom: 10, fontSize: 14, color: 'var(--ink-600)' }}>
              B2B SaaS Collaboration Tool for Email Campaign Management
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-subtle)' }}>
              &copy; 2026 zecompaign. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, label, value }: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--accent-glow)',
        border: '2px solid var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent)'
      }}>
        {icon}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'Fraunces, Georgia, serif',
          color: 'var(--ink-900)',
          marginBottom: 4
        }}>
          {value}
        </div>
        <div style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          fontWeight: 500
        }}>
          {label}
        </div>
      </div>
    </div>
  )
}

// Trust Badge Component
function TrustBadge({ icon, label }: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 10,
      padding: '12px 20px',
      background: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '8px',
      border: '1px solid var(--border-light)',
      boxShadow: '0 2px 8px rgba(27, 29, 34, 0.04)',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(27, 29, 34, 0.08)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(27, 29, 34, 0.04)'
    }}>
      <span style={{ color: 'var(--stamp-teal)', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>
        {label}
      </span>
    </div>
  )
}

// Use Case Component
function UseCase({ title, description }: {
  title: string
  description: string
}) {
  return (
    <div style={{
      padding: 28,
      background: 'rgba(255, 255, 255, 0.6)',
      borderRadius: '8px',
      border: '1px solid var(--border-light)'
    }}>
      <h4 style={{
        fontSize: 18,
        fontWeight: 700,
        fontFamily: 'Fraunces, Georgia, serif',
        marginBottom: 12,
        color: 'var(--ink-900)'
      }}>
        {title}
      </h4>
      <p style={{
        fontSize: 15,
        color: 'var(--ink-600)',
        lineHeight: 1.7
      }}>
        {description}
      </p>
    </div>
  )
}

// Feature Card Component
function FeatureCard({ icon, title, description, color, delay }: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  delay: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className="glass" 
      style={{ 
        padding: 36,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        borderColor: isHovered ? color : 'var(--border)',
        boxShadow: isHovered ? `0 12px 32px ${color}15` : '0 2px 8px rgba(27, 29, 34, 0.04)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="monogram" 
        style={{
          width: 56,
          height: 56,
          fontSize: 22,
          background: isHovered ? color : `${color}12`,
          color: isHovered ? 'white' : color,
          border: isHovered ? 'none' : `2px solid ${color}`,
          marginBottom: 24,
          transition: 'all 0.3s ease'
        }}
      >
        {icon}
      </div>
      <h3 style={{ 
        fontSize: 21, 
        fontWeight: 700, 
        marginBottom: 14, 
        fontFamily: 'Fraunces, Georgia, serif',
        color: 'var(--ink-900)'
      }}>
        {title}
      </h3>
      <p style={{ fontSize: 15, color: 'var(--ink-600)', lineHeight: 1.7 }}>
        {description}
      </p>
    </div>
  )
}

// Pricing Card Component
function PricingCard({ name, price, badge, features, cta, ctaStyle, delay }: {
  name: string
  price: string
  badge?: string
  features: string[]
  cta: string
  ctaStyle: 'primary' | 'secondary'
  delay: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className="glass" 
      style={{ 
        padding: 32, 
        background: '#FFFFFF', 
        position: 'relative',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 12px 32px rgba(52, 87, 166, 0.12)' : '0 2px 8px rgba(27, 29, 34, 0.04)',
        borderColor: isHovered ? 'var(--accent)' : 'var(--border)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {badge && (
        <div 
          className="badge badge-blue" 
          style={{ 
            position: 'absolute', 
            top: -14, 
            left: '50%', 
            transform: 'translateX(-50%)',
            padding: '5px 12px',
            fontSize: 11,
            boxShadow: '0 2px 8px rgba(52, 87, 166, 0.15)'
          }}
        >
          {badge}
        </div>
      )}
      <h3 style={{ 
        fontSize: 22, 
        fontWeight: 700, 
        marginBottom: 10, 
        fontFamily: 'Fraunces, Georgia, serif',
        color: 'var(--ink-900)'
      }}>
        {name}
      </h3>
      <div style={{ marginBottom: 24 }}>
        <span style={{ 
          fontSize: 44, 
          fontWeight: 700, 
          fontFamily: 'Fraunces, Georgia, serif',
          color: 'var(--ink-900)'
        }}>
          {price}
        </span>
        <span style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 500 }}>/month</span>
      </div>
      <ul style={{ 
        listStyle: 'none', 
        fontSize: 14, 
        color: 'var(--ink-600)', 
        lineHeight: 2.2, 
        marginBottom: 28 
      }}>
        {features.map((feature, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={16} color="var(--stamp-teal)" style={{ flexShrink: 0 }} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link 
        href="/signup" 
        className={ctaStyle === 'primary' ? 'btn-primary' : 'btn-secondary'} 
        style={{ 
          width: '100%', 
          justifyContent: 'center',
          padding: '12px 24px',
          fontSize: 15,
          fontWeight: 600
        }}
      >
        {cta}
      </Link>
    </div>
  )
}
