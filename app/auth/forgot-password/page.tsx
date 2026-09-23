'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { SCRAMBLE_THEME } from '@/lib/scramble-theme'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.scramblemarketing.co.uk/auth/reset-password',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
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

      <div className="fp-wrap">
        <div className="sc-card fp-card">
          {sent ? (
            <div className="fp-success">
              <div className="fp-icon">✉️</div>
              <h1 className="fp-title">Check your email</h1>
              <p className="fp-sub">We've sent a password reset link to <strong>{email}</strong></p>
              <Link href="/auth/signin" className="sc-btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 24 }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="fp-title">Forgot password?</h1>
              <p className="fp-sub">Enter your email and we'll send you a reset link.</p>

              <form onSubmit={handleSubmit} className="fp-form">
                <div>
                  <label className="sc-label">Email</label>
                  <input
                    className="sc-input"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && <div className="sc-error">{error}</div>}

                <button type="submit" className="sc-btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send reset link →'}
                </button>
              </form>

              <p className="fp-foot">
                Remember it? <Link href="/auth/signin" className="sc-link">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = `
  .fp-wrap { max-width: 440px; margin: 0 auto; padding: 170px 28px 80px; }
  .fp-card { padding: 40px; }
  .fp-title { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
  .fp-sub { font-size: 16px; color: #5a6b82; margin-bottom: 32px; }
  .fp-form { display: flex; flex-direction: column; gap: 20px; }
  .fp-foot { text-align: center; margin-top: 24px; font-size: 15px; color: #5a6b82; }
  .fp-success { text-align: center; }
  .fp-icon { font-size: 48px; margin-bottom: 16px; }
`
