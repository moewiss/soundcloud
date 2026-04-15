import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { getRecaptchaToken } from '../utils/recaptcha'

function socialLogin(provider) {
  window.location.href = `/auth/${provider}/redirect`
}

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const navigate = useNavigate()

  const getPasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  const strengthColors = ['', '#FF3B30', '#FF9500', '#FF9500', 'var(--sp-green)', 'var(--sp-green-light)']

  const passwordsMatch = formData.password_confirmation.length > 0 &&
    formData.password === formData.password_confirmation

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.password_confirmation) { toast.error('Passwords do not match!'); return }
    if (!agreeTerms) { toast.error('Please agree to the Terms of Service'); return }
    setLoading(true)
    try {
      const recaptcha_token = await getRecaptchaToken('register')
      const response = await api.register({ ...formData, recaptcha_token })
      sessionStorage.setItem('pendingEmail', response.email || formData.email)
      toast.success('Account created! Check your email for the code.')
      navigate('/verify-email')
    } catch (error) {
      const errors = error.response?.data?.errors
      if (errors) Object.values(errors).flat().forEach(err => toast.error(err))
      else toast.error(error.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const handleResendVerification = async () => {
    setLoading(true)
    try { await api.resendVerification(registeredEmail); toast.success('Verification email sent!') }
    catch { toast.error('Failed to resend verification email') }
    finally { setLoading(false) }
  }

  if (registered) {
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
              <i className="fas fa-envelope-open-text" style={{ color: 'var(--sp-green)' }}></i>
            </div>
            <h2>Check Your Email</h2>
            <p>We sent a verification code to</p>
            <p style={{ color: 'var(--sp-green)', fontWeight: 600, fontSize: '1rem', marginTop: '4px' }}>{registeredEmail}</p>
          </div>

          <div className="sp-auth-info">
            <strong><i className="fas fa-info-circle" style={{ marginRight: '6px', color: 'var(--sp-green)' }}></i> Next Steps:</strong>
            <ol style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: 1.8 }}>
              <li>Open your email inbox</li>
              <li>Find the verification code (check spam)</li>
              <li>Enter the 6-digit code</li>
            </ol>
          </div>

          <button onClick={handleResendVerification} disabled={loading} className="sp-auth-resend" style={{ width: '100%', marginTop: '16px' }}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Resend Email</>}
          </button>

          <div className="sp-auth-footer">
            <Link to="/login"><i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i> Back to Login</Link>
          </div>
        </div>
      </div>
    )
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
          <h2>Create your account</h2>
          <p>Start your Islamic audio journey</p>
        </div>

        <form onSubmit={handleSubmit} className="sp-auth-form">
          <div>
            <label>Your name</label>
            <input type="text" placeholder="Enter your name" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} required minLength={3} disabled={loading} />
          </div>

          <div>
            <label>Email address</label>
            <input type="email" placeholder="your@email.com" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={loading} />
          </div>

          <div>
            <label>Password</label>
            <div className="sp-password-wrapper">
              <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} disabled={loading} />
              <button type="button" className="sp-password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
              </button>
            </div>
            {formData.password && (
              <>
                <div className="sp-password-strength">
                  <div className="sp-password-strength-bar">
                    <div style={{ width: `${(passwordStrength / 5) * 100}%`, height: '100%', borderRadius: '100px', background: strengthColors[passwordStrength], transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  <span style={{ color: strengthColors[passwordStrength], fontSize: '12px', fontWeight: 500 }}>{strengthLabels[passwordStrength]}</span>
                </div>
                <div className="sp-password-reqs">
                  <div className={formData.password.length >= 8 ? 'valid' : ''}><i className="fas fa-check-circle"></i> At least 8 characters</div>
                  <div className={/[A-Z]/.test(formData.password) ? 'valid' : ''}><i className="fas fa-check-circle"></i> One uppercase letter</div>
                  <div className={/[a-z]/.test(formData.password) ? 'valid' : ''}><i className="fas fa-check-circle"></i> One lowercase letter</div>
                  <div className={/[0-9]/.test(formData.password) ? 'valid' : ''}><i className="fas fa-check-circle"></i> One number</div>
                </div>
              </>
            )}
          </div>

          <div>
            <label>Confirm password</label>
            <div className="sp-password-wrapper">
              <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password" value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })} required disabled={loading} />
              <button type="button" className="sp-password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''}`}></i>
              </button>
            </div>
            {formData.password_confirmation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: passwordsMatch ? 'var(--sp-green)' : '#FF3B30' }}>
                <i className={`fas fa-${passwordsMatch ? 'check' : 'times'}-circle`}></i>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}
          </div>

          <div className="sp-auth-terms">
            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
            <span>
              I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
            </span>
          </div>

          <button type="submit" className="sp-auth-submit" disabled={loading || !agreeTerms}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Creating account...</> : 'Sign Up'}
          </button>
        </form>

        <div className="sp-auth-divider"><span>or sign up with</span></div>

        <div className="sp-auth-social">
            <button type="button" className="sp-social-btn google" onClick={() => socialLogin('google')}>
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
        </div>

        <div className="sp-auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
