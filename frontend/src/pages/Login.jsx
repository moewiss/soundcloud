import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await api.login(formData)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      toast.success('Welcome back! 🎉')
      
      // Redirect back to where user came from, or home
      const redirectTo = localStorage.getItem('redirectAfterLogin') || '/'
      localStorage.removeItem('redirectAfterLogin')
      window.location.href = redirectTo
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
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

