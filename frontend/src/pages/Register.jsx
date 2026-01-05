import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

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
  const navigate = useNavigate()

  // Password strength calculator
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
  const strengthColors = ['', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981']

  const [registered, setRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match!')
      return
    }

    setLoading(true)
    
    try {
      const response = await api.register(formData)
      setRegisteredEmail(response.email || formData.email)
      setRegistered(true)
      toast.success('Account created! Please check your email 📧')
    } catch (error) {
      const errors = error.response?.data?.errors
      if (errors) {
        Object.values(errors).flat().forEach(err => toast.error(err))
      } else {
        toast.error(error.response?.data?.message || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setLoading(true)
    try {
      await api.resendVerification(registeredEmail)
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error) {
      toast.error('Failed to resend verification email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <i className="fas fa-mosque"></i>
            </div>
            <h1>Join Our Community</h1>
            <p>Start your spiritual journey with Islamic Soundcloud</p>
            
            <div className="features-list">
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Upload your recitations</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Create playlists</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Connect with scholars</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Track your listening history</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            {!registered ? (
              <>
                <div className="auth-header">
                  <h2>Create Account</h2>
                  <p>Fill in your details to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="name">
                  <i className="fas fa-user"></i>
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  minLength={3}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <i className="fas fa-envelope"></i>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <i className="fas fa-lock"></i>
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
                
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill"
                        style={{ 
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: strengthColors[passwordStrength]
                        }}
                      ></div>
                    </div>
                    <span style={{ color: strengthColors[passwordStrength] }}>
                      {strengthLabels[passwordStrength]}
                    </span>
                  </div>
                )}
                
                <div className="password-requirements">
                  <div className={formData.password.length >= 8 ? 'valid' : ''}>
                    <i className="fas fa-check-circle"></i>
                    At least 8 characters
                  </div>
                  <div className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>
                    <i className="fas fa-check-circle"></i>
                    One uppercase letter
                  </div>
                  <div className={/[a-z]/.test(formData.password) ? 'valid' : ''}>
                    <i className="fas fa-check-circle"></i>
                    One lowercase letter
                  </div>
                  <div className={/[0-9]/.test(formData.password) ? 'valid' : ''}>
                    <i className="fas fa-check-circle"></i>
                    One number
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password_confirmation">
                  <i className="fas fa-lock"></i>
                  Confirm Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
                {formData.password_confirmation && (
                  <div className={`match-indicator ${formData.password === formData.password_confirmation ? 'match' : 'no-match'}`}>
                    <i className={`fas fa-${formData.password === formData.password_confirmation ? 'check' : 'times'}-circle`}></i>
                    {formData.password === formData.password_confirmation ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>

              <label className="checkbox-label terms-checkbox">
                <input type="checkbox" required />
                <span>I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a></span>
              </label>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Creating account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="auth-switch">
              <p>Already have an account? <Link to="/login">Sign In</Link></p>
            </div>
          </>
            ) : (
              <>
                <div className="auth-header">
                  <div className="icon-header">
                    <i className="fas fa-envelope-open-text" style={{ fontSize: '3rem', color: '#FF5500' }}></i>
                  </div>
                  <h2>Check Your Email!</h2>
                  <p>We've sent a verification link to:</p>
                  <p style={{ fontWeight: 'bold', color: '#FF5500', fontSize: '1.1rem' }}>{registeredEmail}</p>
                </div>

                <div style={{ 
                  backgroundColor: '#e0f2fe', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #0284c7',
                  marginTop: '20px'
                }}>
                  <p style={{ margin: '0 0 15px 0', color: '#075985', fontWeight: '600' }}>
                    <i className="fas fa-info-circle"></i> Next Steps:
                  </p>
                  <ol style={{ margin: 0, paddingLeft: '20px', color: '#075985' }}>
                    <li>Open your email inbox</li>
                    <li>Find our verification email (check spam/junk if needed)</li>
                    <li>Click the verification link</li>
                    <li>Return here to log in</li>
                  </ol>
                </div>

                <button 
                  onClick={handleResendVerification} 
                  className="btn btn-outline btn-block"
                  disabled={loading}
                  style={{ marginTop: '20px' }}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Resend Verification Email
                    </>
                  )}
                </button>

                <div className="auth-switch" style={{ marginTop: '20px' }}>
                  <Link to="/login" className="back-link">
                    <i className="fas fa-arrow-left"></i>
                    Go to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

