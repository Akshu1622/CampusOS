import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button, Alert } from '@/components/ui'
import { apiClient } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [error, setError] = useState<string | null>(null)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginValues) => {
    setError(null)
    try {
      // Backend uses OAuth2PasswordRequestForm so we send URLSearchParams
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
        throw new Error(errData.message || 'Invalid credentials')
      }
      
      const authData = await response.json()
      authLogin(authData.access_token, authData.refresh_token || '') // Handle backend potentially omitting refresh token
      
      // We assume user info is fetched in context, then protected route redirects
      navigate('/admin') // We'll navigate to admin temporarily, ProtectedRoute will redirect based on role
    } catch (err: any) {
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Left Banner */}
      <div style={{ 
        flex: 1, 
        backgroundColor: 'var(--color-primary)', 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract decoration */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ maxWidth: '480px', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 700, marginBottom: '24px' }}>
            CampusOS
          </h1>
          <p style={{ fontSize: 'var(--font-size-xl)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            The unified educational ERP platform for modern institutions.
          </p>
        </div>
      </div>

      {/* Right Form */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, marginBottom: '8px' }}>
              Welcome back
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: '24px' }}>
              <Alert variant="error" title="Sign in failed" message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Username"
              placeholder="Enter your university ID or email"
              {...register('username')}
              error={errors.username?.message}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <a href="#" style={{ fontSize: 'var(--font-size-sm)' }}>Forgot password?</a>
              </div>
            </div>

            <Button type="submit" size="lg" isLoading={isSubmitting} style={{ marginTop: '12px' }}>
              Sign in
            </Button>
          </form>
          
          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <p>Demo accounts:</p>
            <p>admin_core / password123</p>
            <p>demo_faculty / password123</p>
            <p>demo_student / password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
