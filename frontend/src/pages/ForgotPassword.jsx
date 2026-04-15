import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.forgotPassword(email)
      sessionStorage.setItem('resetEmail', email)
      toast.success('Reset code sent! Check your inbox.')
      navigate('/reset-password')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset code')
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
          <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>
            <i className="fas fa-lock" style={{ color: 'var(--sp-gold)' }}></i>
          </div>
          <h2>Forgot your password?</h2>
          <p>Enter your email and we'll send you a 6-digit reset code</p>
        </div>

        <form onSubmit={handleSubmit} className="sp-auth-form">
          <div>
            <label>Email address</label>
            <input type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required disabled={loading} />
          </div>
          <button type="submit" className="sp-auth-submit" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : 'Send Reset Code'}
          </button>
        </form>

        <div className="sp-auth-footer">
          <Link to="/login"><i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i> Back to login</Link>
        </div>
      </div>
    </div>
  )
}
