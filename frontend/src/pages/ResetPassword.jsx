import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function ResetPassword() {
  const navigate = useNavigate()
  const email = sessionStorage.getItem('resetEmail') || ''

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('code')
  const inputRefs = useRef([])

  useEffect(() => { if (!email) navigate('/forgot-password', { replace: true }) }, [])

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
    if (step === 'code') {
      if (code.length < 6) { toast.error('Please enter the full 6-digit code'); return }
      setStep('password')
      return
    }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await api.resetPassword({ email, code, password, password_confirmation: confirm })
      sessionStorage.removeItem('resetEmail')
      toast.success('Password reset! Please log in.')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
      if (error.response?.data?.expired || error.response?.status === 400) {
        setStep('code')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      }
    } finally { setLoading(false) }
  }

  const passwordsMatch = confirm.length > 0 && password === confirm

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
            <i className="fas fa-key" style={{ color: 'var(--sp-gold)' }}></i>
          </div>
          <h2>{step === 'code' ? 'Enter reset code' : 'Set new password'}</h2>
          {step === 'code' && (
            <>
              <p>We sent a 6-digit code to</p>
              <p style={{ color: 'var(--sp-green)', fontWeight: 600, fontSize: '0.95rem', marginTop: '4px' }}>{email}</p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 'code' ? (
            <>
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
                  />
                ))}
              </div>
              <button type="submit" className="sp-auth-submit" disabled={code.length < 6}>
                Continue
              </button>
            </>
          ) : (
            <div className="sp-auth-form">
              <div>
                <label>New password</label>
                <div className="sp-password-wrapper">
                  <input type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" value={password}
                    onChange={e => setPassword(e.target.value)} required minLength={8} disabled={loading} />
                  <button type="button" className="sp-password-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    <i className={`fas fa-eye${showPw ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>
              <div>
                <label>Confirm new password</label>
                <input type="password" placeholder="Confirm your password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} required disabled={loading} />
                {confirm.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: passwordsMatch ? 'var(--sp-green)' : '#FF3B30' }}>
                    <i className={`fas fa-${passwordsMatch ? 'check' : 'times'}-circle`}></i>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>
              <button type="submit" className="sp-auth-submit" disabled={loading || !passwordsMatch}>
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Resetting...</> : 'Reset Password'}
              </button>
            </div>
          )}
        </form>

        {step === 'password' && (
          <button onClick={() => setStep('code')} className="sp-auth-forgot" style={{ marginTop: '14px' }}>
            <i className="fas fa-arrow-left" style={{ marginRight: '4px' }}></i> Back to code entry
          </button>
        )}

        <div className="sp-auth-footer">
          <Link to="/login"><i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i> Back to login</Link>
        </div>
      </div>
    </div>
  )
}
