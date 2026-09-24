'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { SCRAMBLE_THEME } from '@/lib/scramble-theme'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Supabase puts tokens in the URL hash: #access_token=...&refresh_token=...&type=recovery
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', ''))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (accessToken && type === 'recovery') {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      }).then(({ error }) => {
        if (error) {
          setError('Reset link is invalid or expired. Please request a new one.')
        } else {
          setSessionReady(true)
        }
        setChecking(false)
      })
    } else {
      // Check if already have a valid session
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setSessionReady(true)
        } else {
          setError('Reset link is invalid or expired. Please request a new one.')
        }
        setChecking(false)
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/auth/signin'), 2000)
    }
  }

  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{styles}</style>

      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/landing" className="sc-logo">
            <div className="sc-logo-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 12.5H11L9 22L18.5 10.5H12L13 2Z" fill="white" />
              </svg>
            </div>
            <span className="sc-logo-text">Scramble</span>
          </Link>
        </div>
      </nav>

      <div className="rp-wrap">
        <div className="sc-card rp-card">
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h1 className="rp-title">Password updated!</h1>
              <p className="rp-sub">Taking you to sign in...</p>
            </div>
          ) : checking ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p className="rp-sub">Verifying your link...</p>
            </div>
          ) : !sessionReady ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h1 className="rp-title">Link expired</h1>
              <p className="rp-sub">This reset link has expired or already been used.</p>
              <Link href="/auth/forgot-password" className="sc-btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 24 }}>
                Request a new link →
              </Link>
            </div>
          ) : (
            <>
              <h1 className="rp-title">Set new password</h1>
              <p className="rp-sub">Enter your new password below.</p>
              <form onSubmit={handleSubmit} className="rp-form">
                <div>
                  <label className="sc-label">New password</label>
                  <input
                    className="sc-input"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="sc-label">Confirm password</label>
                  <input
                    className="sc-input"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="sc-error">{error}</div>}
                <button type="submit" className="sc-btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}

const styles = `
  .rp-wrap { max-width: 440px; margin: 0 auto; padding: 170px 28px 80px; }
  .rp-card { padding: 40px; }
  .rp-title { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
  .rp-sub { font-size: 16px; color: #5a6b82; margin-bottom: 32px; }
  .rp-form { display: flex; flex-direction: column; gap: 20px; }
`
