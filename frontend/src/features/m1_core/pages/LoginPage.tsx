import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button, Alert } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { GraduationCap, BookOpen, Users, BarChart3, Shield, Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

type LoginValues = z.infer<typeof loginSchema>

type DemoRole = { role: string; username: string; password: string; color: string; icon: React.ReactNode; desc: string }

const DEMO_ROLES: DemoRole[] = [
  {
    role: 'Admin',
    username: 'admin_core',
    password: 'password123',
    color: '#3B4FE0',
    icon: <Shield size={16} />,
    desc: 'Full system access'
  },
  {
    role: 'Faculty',
    username: 'faculty1',
    password: 'password123',
    color: '#7C3AED',
    icon: <BookOpen size={16} />,
    desc: 'Teaching & grading'
  },
  {
    role: 'Student',
    username: 'student1',
    password: 'password123',
    color: '#0D9488',
    icon: <GraduationCap size={16} />,
    desc: 'Courses & results'
  }
]

const STATS = [
  { label: 'Students', value: '2,400+', icon: <Users size={14} /> },
  { label: 'Faculty', value: '120+', icon: <BookOpen size={14} /> },
  { label: 'Courses', value: '340+', icon: <BarChart3 size={14} /> },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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
      backgroundColor: 'var(--color-bg)',
      fontFamily: 'var(--font-family-base)'
    }}>
      {/* ─── Left Brand Panel ─── */}
      <div style={{
        flex: '0 0 52%',
        background: 'linear-gradient(135deg, #1e2fa8 0%, #3B4FE0 45%, #4f6ef7 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract grid pattern */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06, pointerEvents: 'none' }} aria-hidden>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '56px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <GraduationCap size={22} color="white" />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>CampusOS</span>
          </div>

          {/* Hero text */}
          <h1 style={{ fontSize: '38px', fontWeight: 700, lineHeight: 1.2, margin: '0 0 20px', letterSpacing: '-0.5px' }}>
            Your campus,<br />
            <span style={{ color: 'rgba(255,255,255,0.75)' }}>fully connected.</span>
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: '0 0 48px', maxWidth: '380px' }}>
            A unified ERP platform for admissions, academics, attendance, exams, finance, HR and hostel — built for modern universities.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { icon: '🎓', label: 'Role-based dashboards for Admin, Faculty & Students' },
              { icon: '📊', label: 'Real-time attendance, grades and fee tracking' },
              { icon: '🏛️', label: 'Hostel, HR, payroll and leave management' },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(255,255,255,0.1)', borderRadius: '10px',
                padding: '12px 16px', border: '1px solid rgba(255,255,255,0.15)'
              }}>
                <span style={{ fontSize: '18px' }}>{f.icon}</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', gap: '32px',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          paddingTop: '28px'
        }}>
          {STATS.map((s, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                {s.icon}
                <span style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}>{s.value}</div>
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
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
              Welcome back
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', margin: 0 }}>
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
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Contact administrator to reset password
                </span>
              </div>
            </div>

            <Button type="submit" size="lg" isLoading={isSubmitting} style={{ marginTop: '4px', width: '100%' }}>
              Sign in to CampusOS
            </Button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            margin: '28px 0', color: 'var(--color-text-muted)', fontSize: '12px'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Quick demo access</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          {/* Demo role cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DEMO_ROLES.map(role => (
              <button
                key={role.role}
                type="button"
                onClick={() => fillDemo(role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '13px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 120ms ease',
                  width: '100%'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = role.color
                  ;(e.currentTarget as HTMLButtonElement).style.background = `${role.color}08`
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)'
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: `${role.color}18`,
                  color: role.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {role.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                    {role.role}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {role.desc} · {role.username}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: role.color, fontWeight: 500, flexShrink: 0 }}>
                  Use →
                </div>
              </button>
            ))}
          </div>

          {/* Footer note */}
          <p style={{
            marginTop: '32px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6
          }}>
            Demo accounts use password: <code style={{ fontSize: '12px', background: 'var(--color-surface-muted)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>password123</code>
          </p>
        </div>
      </div>

      {/* Mobile-only: hide left panel styles via inline media */}
      <style>{`
        @media (max-width: 900px) {
          #login-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}
