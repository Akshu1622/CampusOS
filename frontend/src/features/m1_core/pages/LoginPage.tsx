import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button, Alert } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { GraduationCap, BookOpen, Users, BarChart3, Shield, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

type LoginValues = z.infer<typeof loginSchema>

type DemoRole = { role: string; username: string; password: string; color: string; bg: string; icon: React.ReactNode; desc: string }

const DEMO_ROLES: DemoRole[] = [
  {
    role: 'Admin',
    username: 'admin_core',
    password: 'password123',
    color: '#2563EB',
    bg: '#EFF6FF',
    icon: <Shield size={16} />,
    desc: 'Full system access'
  },
  {
    role: 'Faculty',
    username: 'faculty1',
    password: 'password123',
    color: '#7C3AED',
    bg: '#F5F3FF',
    icon: <BookOpen size={16} />,
    desc: 'Teaching & grading'
  },
  {
    role: 'Student',
    username: 'student1',
    password: 'password123',
    color: '#0D9488',
    bg: '#F0FDFA',
    icon: <GraduationCap size={16} />,
    desc: 'Courses & results'
  }
]

const STATS = [
  { label: 'Students', value: '2,400+', icon: <Users size={15} /> },
  { label: 'Faculty', value: '120+', icon: <BookOpen size={15} /> },
  { label: 'Courses', value: '340+', icon: <BarChart3 size={15} /> },
]

const FEATURES = [
  { icon: '🎓', label: 'Role-based dashboards for Admin, Faculty & Students' },
  { icon: '📊', label: 'Real-time attendance, grades and fee tracking' },
  { icon: '🏛️', label: 'Hostel, HR, payroll and leave management' },
]

// ── Colour palette for the baby-blue left panel ──────────────────────────────
const BB = {
  panelBg:     '#E8F4FD',            // very faint baby blue
  panelBg2:    '#D0E8F8',            // slightly deeper for gradient end
  heading:     '#0D2D5E',            // deep navy  – primary text
  subtext:     '#2B4A73',            // medium navy-blue – body text
  muted:       '#4A6FA5',            // muted blue – label / secondary text
  pillBg:      'rgba(37,99,235,0.07)',
  pillBorder:  'rgba(37,99,235,0.18)',
  pillText:    '#1E40AF',
  statValue:   '#0D2D5E',
  statLabel:   '#4A6FA5',
  divider:     'rgba(37,99,235,0.15)',
  logoBg:      'rgba(37,99,235,0.12)',
  logoBorder:  'rgba(37,99,235,0.22)',
  orb1:        'rgba(147,197,253,0.45)',
  orb2:        'rgba(59,130,246,0.12)',
  gridStroke:  '#93C5FD',
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [hoveredRole, setHoveredRole] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginValues) => {
    setError(null)
    try {
      const formData = new URLSearchParams()
      formData.append('username', data.username)
      formData.append('password', data.password)

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || errData.detail || 'Invalid credentials')
      }

      const authData = await response.json()
      authLogin(authData.access_token, authData.refresh_token || '')
      navigate('/admin')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    }
  }

  const fillDemo = (role: DemoRole) => {
    setValue('username', role.username)
    setValue('password', role.password)
    setError(null)
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#F0F7FF',
      fontFamily: 'var(--font-family-base)'
    }}>
      {/* ─── Left Brand Panel ─── */}
      <div
        id="login-brand-panel"
        style={{
          flex: '0 0 52%',
          background: `linear-gradient(150deg, ${BB.panelBg} 0%, ${BB.panelBg2} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 60px',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid rgba(37,99,235,0.12)'
        }}
      >
        {/* Subtle dot/grid pattern */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35, pointerEvents: 'none' }}
          aria-hidden
        >
          <defs>
            <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill={BB.gridStroke} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '420px', height: '420px', borderRadius: '50%',
          background: `radial-gradient(circle, ${BB.orb1} 0%, transparent 68%)`,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-60px',
          width: '340px', height: '340px', borderRadius: '50%',
          background: `radial-gradient(circle, ${BB.orb2} 0%, transparent 68%)`,
          pointerEvents: 'none'
        }} />

        {/* ── Top section ── */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '60px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: BB.logoBg, border: `1.5px solid ${BB.logoBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37,99,235,0.12)'
            }}>
              <GraduationCap size={22} color="#2563EB" />
            </div>
            <div>
              <span style={{ fontSize: '21px', fontWeight: 800, color: BB.heading, letterSpacing: '-0.4px' }}>
                CampusOS
              </span>
              <div style={{ fontSize: '11px', color: BB.muted, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '1px' }}>
                University ERP
              </div>
            </div>
          </div>

          {/* Hero text */}
          <h1 style={{
            fontSize: '40px', fontWeight: 800, lineHeight: 1.18,
            margin: '0 0 18px', letterSpacing: '-0.8px', color: BB.heading
          }}>
            Your campus,<br />
            <span style={{ color: '#2563EB' }}>fully connected.</span>
          </h1>
          <p style={{
            fontSize: '15.5px', color: BB.subtext, lineHeight: 1.75,
            margin: '0 0 44px', maxWidth: '380px'
          }}>
            A unified ERP platform for admissions, academics, attendance, exams, finance, HR and hostel — built for modern universities.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: BB.pillBg, borderRadius: '12px',
                padding: '13px 18px', border: `1px solid ${BB.pillBorder}`
              }}>
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{f.icon}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <CheckCircle2 size={14} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13.5px', color: BB.pillText, lineHeight: 1.4, fontWeight: 500 }}>
                    {f.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', gap: '40px',
          borderTop: `1px solid ${BB.divider}`,
          paddingTop: '28px'
        }}>
          {STATS.map((s, i) => (
            <div key={i}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: BB.statLabel, marginBottom: '5px'
              }}>
                {s.icon}
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s.label}
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', color: BB.statValue }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        overflowY: 'auto',
        background: '#FFFFFF'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            {/* Mobile-only logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }} id="mobile-logo">
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <GraduationCap size={18} color="#2563EB" />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0D2D5E', letterSpacing: '-0.3px' }}>CampusOS</span>
            </div>

            <h2 style={{
              fontSize: '26px', fontWeight: 700, color: 'var(--color-text-primary)',
              margin: '0 0 8px', letterSpacing: '-0.4px'
            }}>
              Welcome back 👋
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14.5px', margin: 0, lineHeight: 1.6 }}>
              Sign in to your CampusOS account to continue
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div style={{ marginBottom: '24px' }}>
              <Alert variant="error" title="Sign in failed" message={error} />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Username or University ID"
              placeholder="e.g. admin_core or STU-2023-000001"
              autoComplete="username"
              {...register('username')}
              error={errors.username?.message}
            />

            <div>
              <div style={{ position: 'relative' }}>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '34px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                  Contact administrator to reset password
                </span>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              style={{
                marginTop: '4px',
                width: '100%',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 4px 14px rgba(37,99,235,0.28)',
                border: 'none',
                fontWeight: 600,
                fontSize: '15px',
                letterSpacing: '0.01em'
              }}
            >
              Sign in to CampusOS
            </Button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            margin: '28px 0', color: 'var(--color-text-muted)', fontSize: '12px'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Quick demo access
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          {/* Demo role cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DEMO_ROLES.map(role => {
              const isHovered = hoveredRole === role.role
              return (
                <button
                  key={role.role}
                  type="button"
                  onClick={() => fillDemo(role)}
                  onMouseEnter={() => setHoveredRole(role.role)}
                  onMouseLeave={() => setHoveredRole(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '13px 16px',
                    borderRadius: '12px',
                    border: `1.5px solid ${isHovered ? role.color : 'var(--color-border)'}`,
                    background: isHovered ? role.bg : 'var(--color-surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms ease',
                    width: '100%',
                    outline: 'none'
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: isHovered ? `${role.color}22` : `${role.color}14`,
                    color: role.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 150ms ease'
                  }}>
                    {role.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                      {role.role}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {role.desc} · <code style={{ fontFamily: 'monospace', fontSize: '11px' }}>{role.username}</code>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px', color: role.color, fontWeight: 600, flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: isHovered ? `${role.color}14` : 'transparent',
                    padding: '4px 10px', borderRadius: '20px',
                    border: `1px solid ${isHovered ? `${role.color}40` : 'transparent'}`,
                    transition: 'all 150ms ease'
                  }}>
                    Use →
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer note */}
          <p style={{
            marginTop: '28px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6
          }}>
            Demo accounts use password:{' '}
            <code style={{
              fontSize: '12px',
              background: '#EFF6FF',
              color: '#1D4ED8',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid #BFDBFE',
              fontWeight: 500
            }}>
              password123
            </code>
          </p>

          {/* Brand footer */}
          <p style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '11.5px',
            color: 'var(--color-text-muted)',
            opacity: 0.7
          }}>
            © 2025 CampusOS · University ERP Platform
          </p>
        </div>
      </div>

      {/* Responsive: hide left panel on small screens, hide mobile logo on large screens */}
      <style>{`
        @media (max-width: 900px) {
          #login-brand-panel { display: none !important; }
        }
        @media (min-width: 901px) {
          #mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  )
}
