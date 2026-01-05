import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function VerifyEmail() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (token) {
      verifyEmail()
    }
  }, [token])

  const verifyEmail = async () => {
    try {
      const response = await api.verifyEmail(token)
      setStatus('success')
      setMessage(response.message)
      setEmail(response.email)
      toast.success('Email verified successfully!')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      setStatus('error')
      setMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.')
      toast.error('Verification failed')
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setResending(true)
    try {
      await api.resendVerification(email)
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error) {
      toast.error('Failed to resend verification email')
    } finally {
      setResending(false)
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

        {/* Right Side - Verification Status */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            {status === 'verifying' && (
              <>
                <div className="auth-header">
                  <div className="icon-header">
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#FF5500' }}></i>
                  </div>
                  <h2>Verifying Your Email</h2>
                  <p>Please wait while we verify your email address...</p>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="auth-header">
                  <div className="icon-header">
                    <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#10b981' }}></i>
                  </div>
                  <h2>Email Verified!</h2>
                  <p>{message}</p>
                </div>

                <div style={{ 
                  backgroundColor: '#d1fae5', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #10b981',
                  marginTop: '20px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, color: '#065f46' }}>
                    <i className="fas fa-info-circle"></i> Redirecting to login page in 3 seconds...
                  </p>
                </div>

                <div className="auth-switch" style={{ marginTop: '30px' }}>
                  <Link to="/login" className="btn btn-primary btn-block">
                    <i className="fas fa-sign-in-alt"></i>
                    Go to Login
                  </Link>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="auth-header">
                  <div className="icon-header">
                    <i className="fas fa-times-circle" style={{ fontSize: '3rem', color: '#ef4444' }}></i>
                  </div>
                  <h2>Verification Failed</h2>
                  <p style={{ color: '#ef4444' }}>{message}</p>
                </div>

                <div style={{ 
                  backgroundColor: '#fee2e2', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #ef4444',
                  marginTop: '20px'
                }}>
                  <p style={{ margin: '0 0 15px 0', color: '#991b1b', fontWeight: '600' }}>
                    <i className="fas fa-exclamation-triangle"></i> What to do next:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#991b1b' }}>
                    <li>Check if you clicked an old or expired link</li>
                    <li>Request a new verification email below</li>
                    <li>Make sure you're using the latest email we sent</li>
                  </ul>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleResendVerification(); }} className="auth-form" style={{ marginTop: '30px' }}>
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
                      disabled={resending}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={resending}>
                    {resending ? (
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
                </form>

                <div className="auth-switch" style={{ marginTop: '20px' }}>
                  <Link to="/login" className="back-link">
                    <i className="fas fa-arrow-left"></i>
                    Back to Login
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

