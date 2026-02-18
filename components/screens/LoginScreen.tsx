import React, { useState } from 'react'
import { useAuthStore } from '../../lib/store/authStore'
import { useUIStore } from '../../lib/store/uiStore'
import { authService } from '../../lib/services/auth'
import styles from './LoginScreen.module.css'

type Mode = 'login' | 'register'

export const LoginScreen: React.FC = () => {
  const { setUser } = useAuthStore()
  const { setScreen } = useUIStore()

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const switchMode = (next: Mode) => {
    setMode(next)
    setLocalError('')
    setSuccessMsg('')
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setSuccessMsg('')

    if (mode === 'register') {
      if (!name.trim()) return setLocalError('Please enter your full name.')
      if (password.length < 6) return setLocalError('Password must be at least 6 characters.')
      if (password !== confirmPassword) return setLocalError('Passwords do not match.')
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const user = await authService.login(email, password)
        setUser(user)
        setScreen('EXAM_CODE')
      } else {
        const user = await authService.register(name.trim(), email, password)
        setUser(user)
        setSuccessMsg('Account created! Redirecting…')
        setTimeout(() => setScreen('EXAM_CODE'), 1200)
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Something went wrong.'
      const friendly: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Incorrect email or password.'
      }
      const code = Object.keys(friendly).find((k) => raw.includes(k))
      setLocalError(code ? friendly[code] : raw)
    } finally {
      setLoading(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className={styles.container}>
      <div className={styles.bgGrid} aria-hidden />
      
      {/* Decorative background shapes */}
      <div className={styles.bgDecor} aria-hidden />
      <div className={styles.bgDecor2} aria-hidden />

      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>V</div>
          <h1 className={styles.title}>Veridict</h1>
          <p className={styles.subtitle}>Secure Examination Client</p>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`${styles.tab} ${isLogin ? styles.tabActive : ''}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`${styles.tab} ${!isLogin ? styles.tabActive : ''}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder="Jane Smith"
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="student@institution.edu"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder={isLogin ? 'Enter your password' : 'Min. 6 characters'}
              required
              disabled={loading}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder="Re-enter your password"
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          )}

          {localError && (
            <div className={styles.errorBanner} role="alert">
              <span className={styles.errorIcon}>⚠</span>
              {localError}
            </div>
          )}

          {successMsg && (
            <div className={styles.successBanner} role="status">
              <span>✓</span>
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className={styles.loginBtn}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : isLogin ? (
              'Sign In to Exam Portal'
            ) : (
              'Create Student Account'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <div className={styles.securityBadge}>
            <span className={styles.lockIcon}>🔒</span>
            This session will be monitored
          </div>
        </div>
      </div>
    </div>
  )
}
