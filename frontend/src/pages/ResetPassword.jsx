import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    token: searchParams.get('token') || '',
    password: '',
    password_confirmation: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (!formData.token || !formData.email) {
      toast.error('Invalid reset link')
      setTimeout(() => navigate('/forgot-password'), 2000)
    }
  }, [formData.token, formData.email, navigate])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match!')
      return
    }

    setLoading(true)
    
    try {
      await api.resetPassword(formData)
      toast.success('Password reset successful! 🎉')
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      const errors = error.response?.data?.errors
      if (errors) {
        Object.values(errors).flat().forEach(err => toast.error(err))
      } else {
        toast.error(error.response?.data?.message || 'Password reset failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container-simple">
        <div className="auth-form-container">
          <div className="auth-header">
            <div className="icon-circle">
              <i className="fas fa-lock"></i>
            </div>
            
            <h2>Reset Password</h2>
            <p>Create a new secure password for your account</p>
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
                className="disabled-input"
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

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Resetting password...
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
            <p>Remember your password? <Link to="/login">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

