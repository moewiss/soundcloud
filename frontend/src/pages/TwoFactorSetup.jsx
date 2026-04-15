import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function TwoFactorSetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState('loading') // loading | scan | recovery | done
  const [setupData, setSetupData] = useState(null)
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState([])
  const [loading, setLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user?.is_admin
  const isArtist = !!user?.artist_verified_at

  useEffect(() => {
    startSetup()
  }, [])

  const startSetup = async () => {
    try {
      const data = await api.twoFactorSetup()
      setSetupData(data)
      setStep('scan')
    } catch {
      toast.error('Failed to start 2FA setup. Please try again.')
    }
  }

  const handleConfirm = async () => {
    if (code.length !== 6) { toast.error('Enter the 6-digit code'); return }
    setLoading(true)
    try {
      const data = await api.twoFactorConfirm(code)
      setRecoveryCodes(data.recovery_codes)
      setStep('recovery')

      // Update user in localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      stored.two_factor_confirmed_at = new Date().toISOString()
      localStorage.setItem('user', JSON.stringify(stored))
      localStorage.removeItem('requires_2fa_setup')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid code. Try again.')
      setCode('')
    } finally { setLoading(false) }
  }

  const handleDone = () => {
    const redirectTo = localStorage.getItem('redirectAfterLogin') || '/home'
    localStorage.removeItem('redirectAfterLogin')
    window.location.href = redirectTo
  }

  return (
    <div className="sp-auth-page">
      <div className="sp-auth-glow" />
      <div className="sp-auth-container" style={{ maxWidth: '480px' }}>
        <div className="sp-auth-logo">
          <div className="sp-auth-logo-wrap">
            <img src="/logo.png" alt="Nashidify" className="sp-auth-logo-img" />
            <div className="sp-auth-logo-ring" />
          </div>
        </div>

        {/* Header */}
        <div className="sp-auth-heading">
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
            <i className="fas fa-shield-alt" style={{ color: 'var(--sp-green)' }}></i>
          </div>
          <h2>Two-Factor Authentication Required</h2>
          <p style={{ color: 'var(--sp-text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
            {isAdmin ? 'Admin accounts' : 'Verified artist accounts'} must have 2FA enabled for security.
          </p>
        </div>

        {/* Step: Scan QR */}
        {step === 'scan' && setupData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--sp-text-muted)', fontSize: '0.82rem', marginBottom: '16px', lineHeight: 1.6 }}>
                1. Open <strong>Google Authenticator</strong> or <strong>Authy</strong><br />
                2. Scan the QR code below<br />
                3. Enter the 6-digit code to confirm
              </p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupData.qr_url)}`}
                alt="2FA QR Code"
                style={{ width: '180px', height: '180px', borderRadius: '12px', background: '#fff', padding: '8px' }}
              />
              <p style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--sp-text-muted)' }}>Or enter this key manually:</p>
              <code style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', letterSpacing: '0.1em', display: 'inline-block', marginTop: '4px' }}>
                {setupData.secret}
              </code>
            </div>

            <div className="sp-auth-form" style={{ gap: '12px' }}>
              <div>
                <label>Verification Code</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.25em', fontWeight: 600 }}
                />
              </div>
              <button
                className="sp-auth-submit"
                onClick={handleConfirm}
                disabled={loading || code.length !== 6}
              >
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : 'Verify & Enable 2FA'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Save recovery codes */}
        {step === 'recovery' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <div style={{ background: 'rgba(201,162,77,0.08)', border: '1px solid rgba(201,162,77,0.3)', borderRadius: '12px', padding: '16px' }}>
              <p style={{ color: '#C9A84C', fontWeight: 600, marginBottom: '8px' }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>Save your recovery codes
              </p>
              <p style={{ color: 'var(--sp-text-muted)', fontSize: '0.82rem', marginBottom: '12px' }}>
                Store these somewhere safe. If you lose your authenticator app, these are the only way to recover your account.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {recoveryCodes.map(c => (
                  <code key={c} style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.82rem', textAlign: 'center' }}>{c}</code>
                ))}
              </div>
            </div>
            <button className="sp-auth-submit" onClick={handleDone}>
              <i className="fas fa-check"></i> I've saved my codes — Continue
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--sp-green)' }}></i>
          </div>
        )}
      </div>
    </div>
  )
}
