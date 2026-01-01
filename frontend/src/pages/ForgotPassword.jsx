import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [resetInfo, setResetInfo] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await api.forgotPassword(email)
      setResetInfo(response)
      setSubmitted(true)
      toast.success('Password reset instructions sent!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email')
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

        {/* Right Side - Forgot Password Form */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            <div className="auth-header">
              <div className="icon-header">
                <i className="fas fa-key" style={{ fontSize: '2.5rem', color: '#FF5500' }}></i>
              </div>
              <h2>Forgot Password?</h2>
              <p>No worries! We'll send you reset instructions 📧</p>
            </div>

            {!submitted ? (
              <>
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
                    <small className="form-hint">
                      Enter the email associated with your account
                    </small>
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

                <div className="auth-switch">
                  <Link to="/login" className="back-link">
                    <i className="fas fa-arrow-left"></i>
                    Back to Sign In
                  </Link>
                </div>
              </>
            ) : (
              <div className="success-message">
                <div className="success-icon">
                  <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#10b981' }}></i>
                </div>
                <h3>Check Your Email!</h3>
                <p>We've sent password reset instructions to:</p>
                <p style={{ fontWeight: 'bold', color: '#FF5500', marginBottom: '1.5rem' }}>{email}</p>
                
                {/* Development Info - Remove in production */}
                {resetInfo?.reset_url && (
                  <div style={{ 
                    backgroundColor: '#fff3cd', 
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem'
                  }}>
                    <strong>🔧 Development Mode:</strong>
                    <p style={{ margin: '0.5rem 0 0 0' }}>
                      <a 
                        href={resetInfo.reset_url}
                        style={{ color: '#0066cc', wordBreak: 'break-all' }}
                      >
                        Click here to reset password
                      </a>
                    </p>
                  </div>
                )}
                
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Didn't receive the email? Check your spam folder or try again.
                </p>

                <div className="button-group">
                  <button 
                    onClick={() => {
                      setSubmitted(false)
                      setEmail('')
                      setResetInfo(null)
                    }}
                    className="btn btn-outline"
                  >
                    <i className="fas fa-redo"></i>
                    Try Again
                  </button>
                  <Link to="/login" className="btn btn-primary">
                    <i className="fas fa-arrow-left"></i>
                    Back to Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
