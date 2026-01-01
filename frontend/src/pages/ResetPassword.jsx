import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    token: searchParams.get('token') || '',
    password: '',
    password_confirmation: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ strength: '', color: '' })
  const navigate = useNavigate()

  useEffect(() => {
    // If no token or email in URL, redirect to forgot password
    if (!formData.token || !formData.email) {
      toast.error('Invalid or missing reset token')
      navigate('/forgot-password')
    }
  }, [formData.token, formData.email, navigate])

  useEffect(() => {
    // Calculate password strength
    const password = formData.password
    if (!password) {
      setPasswordStrength({ strength: '', color: '' })
      return
    }

    if (password.length < 8) {
      setPasswordStrength({ strength: 'Too short', color: '#ef4444' })
    } else if (password.length < 12) {
      setPasswordStrength({ strength: 'Weak', color: '#f59e0b' })
    } else if (password.length < 16) {
      setPasswordStrength({ strength: 'Good', color: '#10b981' })
    } else {
      setPasswordStrength({ strength: 'Strong', color: '#059669' })
    }
  }, [formData.password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    
    try {
      await api.resetPassword(formData)
      toast.success('Password reset successfully! 🎉')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
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
            <h1>Islamic Soundcloud</h1>
            <p>Listen to Quran, Nasheeds, and Islamic content from around the world</p>
            
            <div className="features-list">
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>High quality audio</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Verified reciters & scholars</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Ad-free experience</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Reset Password Form */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            <div className="auth-header">
              <div className="icon-header">
                <i className="fas fa-lock-open" style={{ fontSize: '2.5rem', color: '#FF5500' }}></i>
              </div>
              <h2>Reset Your Password</h2>
              <p>Enter your new password below 🔐</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">
                  <i className="fas fa-envelope"></i>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <i className="fas fa-lock"></i>
                  New Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 8 characters)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
                {passwordStrength.strength && (
                  <small 
                    className="form-hint" 
                    style={{ color: passwordStrength.color, fontWeight: '600' }}
                  >
                    Password strength: {passwordStrength.strength}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password_confirmation">
                  <i className="fas fa-lock"></i>
                  Confirm New Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
                {formData.password_confirmation && formData.password !== formData.password_confirmation && (
                  <small className="form-hint" style={{ color: '#ef4444' }}>
                    Passwords do not match
                  </small>
                )}
                {formData.password_confirmation && formData.password === formData.password_confirmation && (
                  <small className="form-hint" style={{ color: '#10b981' }}>
                    Passwords match ✓
                  </small>
                )}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block" 
                disabled={loading || formData.password !== formData.password_confirmation}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Reset Password
                  </>
                )}
              </button>
            </form>

            <div className="auth-switch">
              <Link to="/login" className="back-link">
                <i className="fas fa-arrow-left"></i>
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
