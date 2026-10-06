import React, { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'subtle'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  icon?: React.ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const effectiveLeftIcon = leftIcon || icon
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2'
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-active',
    secondary: 'bg-white border border-border-strong text-text-primary hover:bg-surface-muted',
    tertiary: 'bg-transparent text-primary hover:underline',
    danger: 'bg-error text-white hover:opacity-90',
    subtle: 'bg-surface-muted text-text-primary hover:bg-border'
  }

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  }

  const disabledStyles = 'opacity-50 cursor-not-allowed'

  // Inline CSS since we aren't using Tailwind
  const styles = {
    primary: { backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' },
    secondary: { backgroundColor: 'white', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' },
    tertiary: { backgroundColor: 'transparent', color: 'var(--color-primary)', border: 'none' },
    danger: { backgroundColor: 'var(--color-error)', color: 'white', border: 'none' },
    subtle: { backgroundColor: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', border: 'none' }
  }

  const heights = { sm: '32px', md: '40px', lg: '48px' }
  const paddings = { sm: '0 12px', md: '0 16px', lg: '0 24px' }

  return (
    <button
      className={`btn ${className}`}
      disabled={isLoading || disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 500,
        borderRadius: 'var(--radius-sm)',
        transition: 'all 120ms',
        height: heights[size],
        padding: paddings[size],
        fontSize: size === 'lg' ? 'var(--font-size-md)' : 'var(--font-size-sm)',
        cursor: (isLoading || disabled) ? 'not-allowed' : 'pointer',
        opacity: (isLoading || disabled) ? 0.5 : 1,
        ...styles[variant],
      }}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin" style={{ marginRight: '8px', display: 'inline-block', width: '16px', height: '16px', border: '2px solid currentColor', borderRightColor: 'transparent', borderRadius: '50%' }}></span>
      ) : effectiveLeftIcon ? (
        <span style={{ marginRight: '8px', display: 'flex' }}>{effectiveLeftIcon}</span>
      ) : null}
      
      {children}
      
      {!isLoading && rightIcon && (
        <span style={{ marginLeft: '8px', display: 'flex' }}>{rightIcon}</span>
      )}
    </button>
  )
}
