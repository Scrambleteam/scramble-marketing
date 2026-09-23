'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Handle both hash-based tokens (older Supabase) and query param tokens
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')
    const tokenHash = searchParams.get('token_hash')
    const queryType = searchParams.get('type')

    if (accessToken && type === 'recovery') {
      // Set the session from the hash tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      }).then(() => setReady(true))
    } else if (tokenHash && queryType === 'recovery') {
      // Verify the token hash
      supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery'
      }).then(({ error }) => {
        if (error) setError('Invalid or expired reset link. Please request a new one.')
        else setReady(true)
      })
    } else {
      // Try listening for the auth event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setReady(true)
      })
      // Give it 2 seconds, if no event assume direct navigation
      setTimeout(() => setReady(true), 2000)
      return () => subscription.unsubscribe()
    }
  }, [searchParams])

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
      setTimeout(() => router.push('/auth/signin'), 3000)
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
              <p className="rp-sub">Redirecting you to sign in...</p>
            </div>
          ) : !ready ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p className="rp-sub">Verifying your reset link...</p>
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
                  <label className="sc-label">Confirm new password</label>
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
