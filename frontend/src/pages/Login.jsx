import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState(null)
  const [resending, setResending] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/b0b46084-7934-4818-98a5-24948a8c68b4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.jsx:16',message:'Login attempt started',data:{email:formData.email,passwordLength:formData.password?.length,formDataKeys:Object.keys(formData)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3'})}).catch(()=>{});
    // #endregion
    
    try {
      const response = await api.login(formData)
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/b0b46084-7934-4818-98a5-24948a8c68b4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.jsx:20',message:'Login successful',data:{hasToken:!!response.token,hasUser:!!response.user},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3'})}).catch(()=>{});
      // #endregion
      
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      toast.success('Welcome back! 🎉')
      
      // Redirect back to where user came from, or home
      const redirectTo = localStorage.getItem('redirectAfterLogin') || '/'
      localStorage.removeItem('redirectAfterLogin')
      window.location.href = redirectTo
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/b0b46084-7934-4818-98a5-24948a8c68b4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.jsx:28',message:'Login failed',data:{status:error.response?.status,errorData:error.response?.data,errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3,H4'})}).catch(()=>{});
      // #endregion
      
      // Handle unverified email
      if (error.response?.status === 403 && error.response?.data?.requires_verification) {
        setUnverifiedEmail(error.response.data.email)
        toast.error('Please verify your email before logging in')
      } else {
        toast.error(error.response?.data?.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResending(true)
    try {
      await api.resendVerification(unverifiedEmail || formData.email)
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error) {
      toast.error('Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

  const handleGuestLogin = async () => {
    setLoading(true)
    try {
      const response = await api.guest()
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('is_guest', 'true')
      toast.success('Welcome, Guest! 👋')
      window.location.href = '/'
    } catch (error) {
      toast.error('Guest login failed')
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

        {/* Right Side - Login Form */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            <div className="auth-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue your journey 🚀</p>
              <small style={{ color: '#666', fontSize: '0.85rem' }}>Auto-Deploy v2.0 - Updated from Cursor!</small>
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
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
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
              </div>

              <div className="form-footer">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>

            {unverifiedEmail && (
              <div style={{ 
                backgroundColor: '#fef3c7', 
                padding: '15px', 
                borderRadius: '8px',
                border: '1px solid #f59e0b',
                marginTop: '20px'
              }}>
                <p style={{ margin: '0 0 10px 0', color: '#92400e', fontWeight: '600' }}>
                  <i className="fas fa-exclamation-triangle"></i> Email Not Verified
                </p>
                <p style={{ margin: '0 0 15px 0', color: '#92400e', fontSize: '14px' }}>
                  Please check your email and click the verification link to activate your account.
                </p>
                <button 
                  onClick={handleResendVerification} 
                  className="btn btn-outline btn-block"
                  disabled={resending}
                >
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
              </div>
            )}

            <div className="divider">
              <span>or</span>
            </div>

            <button 
              onClick={handleGuestLogin} 
              className="btn btn-outline btn-block"
              disabled={loading}
            >
              <i className="fas fa-user"></i>
              Continue as Guest
            </button>

            <div className="auth-switch">
              <p>Don't have an account? <Link to="/register">Sign Up</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

