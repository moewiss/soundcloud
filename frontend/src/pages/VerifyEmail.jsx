import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const email = sessionStorage.getItem('pendingEmail') || ''
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef([])

  useEffect(() => { if (!email) navigate('/register', { replace: true }) }, [])
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const code = digits.join('')

  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
  }
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus()
  }
  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length < 6) { toast.error('Please enter the full 6-digit code'); return }
    setLoading(true)
    try {
      const res = await api.verifyEmail({ email, code })
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      localStorage.removeItem('is_guest')
      sessionStorage.removeItem('pendingEmail')
      if (res.onboarding_state === 'not_started' || res.onboarding_state === 'in_progress') {
        localStorage.setItem('onboarding_state', res.onboarding_state)
        toast.success('Email verified! Let\'s set up your feed.')
        window.location.href = '/onboarding'
        return
      }
      localStorage.setItem('onboarding_state', res.onboarding_state || 'completed')
      toast.success('Email verified! Welcome to Nashidify')
      window.location.href = '/'
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed')
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setResending(true)
    try {
      await api.resendVerification(email)
      toast.success('New code sent! Check your inbox.')
      setCountdown(60)
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code')
    } finally { setResending(false) }
  }

  return (
    <div className="sp-auth-page">
      <div className="sp-auth-glow" />
      <div className="sp-auth-container">
        <div className="sp-auth-logo">
          <div className="sp-auth-logo-wrap">
            <img src="/logo.png" alt="Nashidify" className="sp-auth-logo-img" />
            <div className="sp-auth-logo-ring" />
          </div>
        </div>

        <div className="sp-auth-heading">
          <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>
            <i className="fas fa-envelope-open-text" style={{ color: 'var(--sp-gold)' }}></i>
          </div>
          <h2>Verify your email</h2>
          <p>We sent a 6-digit code to</p>
          <p style={{ color: 'var(--sp-green)', fontWeight: 600, fontSize: '0.95rem', marginTop: '4px' }}>{email}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sp-auth-otp">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                disabled={loading}
              />
            ))}
          </div>

          <button type="submit" className="sp-auth-submit" disabled={loading || code.length < 6}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : 'Verify Code'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <p style={{ color: 'var(--sp-text-sub)', fontSize: '0.82rem', marginBottom: '10px' }}>
            Didn't receive it? Check your spam folder, or
          </p>
          <button onClick={handleResend} disabled={resending || countdown > 0} className="sp-auth-resend">
            {resending
              ? <><i className="fas fa-spinner fa-spin"></i> Sending...</>
              : countdown > 0
                ? `Resend in ${countdown}s`
                : 'Resend code'}
          </button>
        </div>

        <div className="sp-auth-footer">
          <Link to="/login"><i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i> Back to login</Link>
        </div>
      </div>
    </div>
  )
}
