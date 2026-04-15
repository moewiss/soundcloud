import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { getRecaptchaToken } from '../utils/recaptcha'

function socialLogin(provider) {
  window.location.href = `/auth/${provider}/redirect`
}

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const recaptcha_token = await getRecaptchaToken('login')
      const response = await api.login({ ...formData, recaptcha_token })

      // 2FA required
      if (response.requires_2fa) {
        navigate('/2fa', { state: { two_fa_token: response.two_fa_token } })
        return
      }

      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.removeItem('is_guest')

      if (response.onboarding_state === 'not_started' || response.onboarding_state === 'in_progress') {
        localStorage.setItem('onboarding_state', response.onboarding_state)
        toast.success('Welcome! Let\'s personalize your experience.')
        window.location.href = '/onboarding'
        return
      }

      localStorage.setItem('onboarding_state', response.onboarding_state || 'completed')

      if (response.requires_2fa_setup) {
        toast('Please set up two-factor authentication to continue.', { icon: '🔐' })
        window.location.href = '/setup-2fa'
        return
      }

      toast.success('Welcome back!')
      const redirectTo = localStorage.getItem('redirectAfterLogin') || '/'
      localStorage.removeItem('redirectAfterLogin')
      window.location.href = redirectTo
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.requires_verification) {
        sessionStorage.setItem('pendingEmail', error.response.data.email)
        toast('Please verify your email first', { icon: '\u{1F4E7}' })
        navigate('/verify-email')
      } else {
        toast.error(error.response?.data?.message || 'Login failed')
      }
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
      toast.success('Welcome, Guest!')
      window.location.href = '/'
    } catch (error) {
      toast.error('Guest login failed')
    } finally {
      setLoading(false)
    }
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
          <h2>Welcome back</h2>
          <p>Sign in to continue your journey</p>
        </div>

        <form onSubmit={handleSubmit} className="sp-auth-form">
          <div>
            <label>Email address</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label>Password</label>
            <div className="sp-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="sp-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="sp-auth-submit" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <Link to="/forgot-password" className="sp-auth-forgot">
          Forgot your password?
        </Link>

        <div className="sp-auth-divider"><span>or continue with</span></div>

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

        <div className="sp-auth-divider"><span>or</span></div>

        <button onClick={handleGuestLogin} disabled={loading} className="sp-auth-guest">
          <i className="fas fa-user"></i>
          Continue as Guest
        </button>

        <div className="sp-auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  )
}
