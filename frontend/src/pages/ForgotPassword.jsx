import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [resetToken, setResetToken] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await api.forgotPassword({ email })
      toast.success('Password reset link sent! 📧')
      setSent(true)
      if (response.reset_token) {
        setResetToken(response.reset_token)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container-simple">
        <div className="auth-form-container">
          <div className="auth-header">
            <div className="back-button">
              <Link to="/login">
                <i className="fas fa-arrow-left"></i>
                Back to Login
              </Link>
            </div>
            
            <div className="icon-circle">
              <i className="fas fa-key"></i>
            </div>
            
            <h2>Forgot Password?</h2>
            <p>No worries! Enter your email and we'll send you reset instructions.</p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">
                  <i className="fas fa-envelope"></i>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Send Reset Link
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="success-message">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>Email Sent!</h3>
              <p>We've sent password reset instructions to <strong>{email}</strong></p>
              
              {resetToken && (
                <div className="dev-token">
                  <p><strong>🔧 Development Mode:</strong></p>
                  <Link to={`/reset-password?token=${resetToken}&email=${email}`} className="btn btn-outline">
                    <i className="fas fa-link"></i>
                    Use Reset Link
                  </Link>
                </div>
              )}
              
              <div className="email-tips">
                <p><i className="fas fa-info-circle"></i> Didn't receive the email?</p>
                <ul>
                  <li>Check your spam folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Try requesting a new link</li>
                </ul>
              </div>
              
              <button 
                onClick={() => setSent(false)} 
                className="btn btn-outline btn-block"
              >
                <i className="fas fa-redo"></i>
                Try Another Email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

