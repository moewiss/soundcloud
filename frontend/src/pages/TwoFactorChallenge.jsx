import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function TwoFactorChallenge() {
  const location = useLocation()
  const navigate = useNavigate()
  const twoFaToken = location.state?.two_fa_token || sessionStorage.getItem('two_fa_token')

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [useRecovery, setUseRecovery] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!twoFaToken) { navigate('/login', { replace: true }); return }
    sessionStorage.removeItem('two_fa_token')
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    try {
      const response = await api.twoFactorChallenge({ two_fa_token: twoFaToken, code: code.trim() })
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('onboarding_state', response.onboarding_state ?? 'completed')
      localStorage.removeItem('is_guest')
      toast.success('Welcome back!')
      const redirectTo = localStorage.getItem('redirectAfterLogin') || '/home'
      localStorage.removeItem('redirectAfterLogin')
      window.location.href = redirectTo
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid code. Try again.')
      setCode('')
      inputRef.current?.focus()
    } finally {
      setLoading(false)
    }
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
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
            <i className="fas fa-shield-alt" style={{ color: 'var(--sp-green)' }}></i>
          </div>
          <h2>Two-Factor Authentication</h2>
          <p>{useRecovery ? 'Enter a recovery code' : 'Enter the 6-digit code from your authenticator app'}</p>
        </div>

        <form onSubmit={handleSubmit} className="sp-auth-form">
          <div>
            <label>{useRecovery ? 'Recovery code' : 'Authentication code'}</label>
            <input
              ref={inputRef}
              type="text"
              placeholder={useRecovery ? 'XXXX-XXXX' : '000000'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={useRecovery ? 9 : 6}
              autoComplete="one-time-code"
              inputMode={useRecovery ? 'text' : 'numeric'}
              disabled={loading}
              style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.2em', fontWeight: 600 }}
            />
          </div>

          <button type="submit" className="sp-auth-submit" disabled={loading || !code.trim()}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : 'Verify'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setUseRecovery(!useRecovery); setCode('') }}
          style={{ background: 'none', border: 'none', color: 'var(--sp-green)', cursor: 'pointer', fontSize: '0.85rem', marginTop: '8px' }}
        >
          {useRecovery ? 'Use authenticator app instead' : 'Use a recovery code instead'}
        </button>

        <div className="sp-auth-footer">
          <Link to="/login"><i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i> Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
