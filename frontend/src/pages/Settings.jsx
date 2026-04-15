import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

/* ─── Islamic geometric patterns (matching Home.jsx) ───────────────────── */
const S8 = "10,1 11.42,6.58 16.36,3.64 13.42,8.58 19,10 13.42,11.42 16.36,16.36 11.42,13.42 10,19 8.58,13.42 3.64,16.36 6.58,11.42 1,10 6.58,8.58 3.64,3.64 8.58,6.58"

function SettingsHeroPattern() {
  return (
    <svg className="stg-hero-pattern" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <pattern id="settings-8star" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <polygon points="40,22 42.85,33.16 52.73,27.27 47.27,37.15 58,40 47.27,42.85 52.73,52.73 42.85,47.27 40,58 37.15,47.27 27.27,52.73 32.73,42.85 22,40 32.73,37.15 27.27,27.27 37.15,32.73"
            fill="none" stroke="rgba(201,162,77,0.18)" strokeWidth="0.6" strokeLinejoin="round" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#settings-8star)" />
    </svg>
  )
}

function SettingsRosette() {
  return (
    <svg className="stg-hero-rosette" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 - 90) * Math.PI / 180
        const r = 72, cx = 100 + r * Math.cos(a), cy = 100 + r * Math.sin(a)
        return <g key={i} transform={`translate(${cx - 8},${cy - 8})`}><polygon points={S8} fill="none" stroke="rgba(201,162,77,0.35)" strokeWidth="0.7" /></g>
      })}
      <g transform="translate(58,58)">
        <svg width="84" height="84" viewBox="0 0 20 20">
          <polygon points={S8} fill="none" stroke="rgba(201,162,77,0.4)" strokeWidth="0.6" />
        </svg>
      </g>
    </svg>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const headerInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [headerPreview, setHeaderPreview] = useState(null)

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    city: '',
    country: '',
    website: ''
  })

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  // 2FA state
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)
  const [twoFaSetup, setTwoFaSetup] = useState(null) // { secret, qr_url }
  const [twoFaCode, setTwoFaCode] = useState('')
  const [twoFaLoading, setTwoFaLoading] = useState(false)
  const [twoFaStep, setTwoFaStep] = useState('idle') // idle | setup | recovery
  const [recoveryCodes, setRecoveryCodes] = useState([])

  const [notifications, setNotifications] = useState({
    email_likes: true,
    email_comments: true,
    email_follows: true,
    email_reposts: false,
    push_likes: true,
    push_comments: true,
    push_follows: true
  })

  const [privacy, setPrivacy] = useState(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    try {
      const saved = JSON.parse(localStorage.getItem('privacy_settings'))
      if (saved) return { ...saved, public_profile: u.is_private === undefined ? true : !u.is_private }
    } catch {}
    return {
      public_profile: u.is_private === undefined ? true : !u.is_private,
      show_history: false,
      show_following: true,
      show_likes: true,
      allow_messages: false
    }
  })
  const [privacySaving, setPrivacySaving] = useState(false)

  const [planFeatures, setPlanFeatures] = useState(null)

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'fa-user' },
    { id: 'account', label: 'Account', icon: 'fa-cog' },
    { id: 'preferences', label: 'Preferences', icon: 'fa-sliders-h' },
    { id: 'subscription', label: 'Subscription', icon: 'fa-crown' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
    { id: 'privacy', label: 'Privacy', icon: 'fa-lock' }
  ]

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(storedUser)
    setTwoFaEnabled(!!storedUser.two_factor_confirmed_at)
    setProfile({
      name: storedUser.name || '',
      email: storedUser.email || '',
      bio: storedUser.bio || '',
      city: storedUser.city || '',
      country: storedUser.country || '',
      website: storedUser.website || ''
    })
    if (storedUser.avatar_url) setAvatarPreview(storedUser.avatar_url)
    if (storedUser.header_url) setHeaderPreview(storedUser.header_url)

    if (storedUser.id) {
      api.getUser(storedUser.id).then(freshUser => {
        setUser(prev => ({ ...prev, ...freshUser }))
        setProfile(prev => ({
          ...prev,
          name: freshUser.display_name || freshUser.name || prev.name,
          bio: freshUser.bio || '',
        }))
        if (freshUser.avatar_url) setAvatarPreview(freshUser.avatar_url)
        else setAvatarPreview(null)
        if (freshUser.header_url) setHeaderPreview(freshUser.header_url)
        else setHeaderPreview(null)
        const updated = { ...storedUser, ...freshUser, name: freshUser.display_name || freshUser.name || storedUser.name }
        localStorage.setItem('user', JSON.stringify(updated))
        // Sync privacy state with fresh is_private from API
        if (freshUser.is_private !== undefined) {
          setPrivacy(prev => ({ ...prev, public_profile: !freshUser.is_private }))
        }
      }).catch(() => {})
    }

    api.getSubscriptionStatus().then(data => setPlanFeatures(data.features || null)).catch(() => {})
    api.getNotificationPreferences().then(data => setNotifications(data)).catch(() => {})
  }, [])

  const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return false
    }
    return true
  }

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0]
    if (file && validateImage(file)) {
      setAvatarPreview(URL.createObjectURL(file))
    } else {
      e.target.value = ''
    }
  }

  const handleHeaderSelect = (e) => {
    const file = e.target.files[0]
    if (file && validateImage(file)) {
      setHeaderPreview(URL.createObjectURL(file))
    } else {
      e.target.value = ''
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      if (profile.name && profile.name.trim()) formData.append('display_name', profile.name.trim())
      if (profile.bio !== undefined && profile.bio !== null) formData.append('bio', profile.bio)

      const avatarFile = fileInputRef.current?.files?.[0]
      if (avatarFile && avatarFile.size > 0 && avatarFile.type.startsWith('image/')) {
        formData.append('avatar', avatarFile)
      }

      const headerFile = headerInputRef.current?.files?.[0]
      if (headerFile && headerFile.size > 0 && headerFile.type.startsWith('image/')) {
        formData.append('header', headerFile)
      }

      const response = await api.updateUser(formData)

      if (response.user) {
        const existing = JSON.parse(localStorage.getItem('user') || '{}')
        const merged = { ...existing, ...response.user }
        localStorage.setItem('user', JSON.stringify(merged))
        setUser(merged)
        setAvatarPreview(response.user.avatar_url || null)
        setHeaderPreview(response.user.header_url || null)
      }

      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (password.new !== password.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (password.new.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await api.changePassword(password.current, password.new, password.confirm)
      toast.success('Password changed!')
      setPassword({ current: '', new: '', confirm: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handle2FASetup = async () => {
    setTwoFaLoading(true)
    try {
      const data = await api.twoFactorSetup()
      setTwoFaSetup(data)
      setTwoFaStep('setup')
      setTwoFaCode('')
    } catch { toast.error('Failed to start 2FA setup') }
    finally { setTwoFaLoading(false) }
  }

  const handle2FAConfirm = async () => {
    if (!twoFaCode || twoFaCode.length !== 6) { toast.error('Enter the 6-digit code'); return }
    setTwoFaLoading(true)
    try {
      const data = await api.twoFactorConfirm(twoFaCode)
      setTwoFaEnabled(true)
      setRecoveryCodes(data.recovery_codes)
      setTwoFaStep('recovery')
      setTwoFaSetup(null)
      setTwoFaCode('')
      toast.success('2FA enabled!')
    } catch (e) { toast.error(e.response?.data?.message || 'Invalid code') }
    finally { setTwoFaLoading(false) }
  }

  const handle2FADisable = async () => {
    const isSocialOnly = !!user?.social_provider
    let pwd = null
    if (!isSocialOnly) {
      pwd = prompt('Enter your password to disable 2FA:')
      if (!pwd) return
    } else {
      if (!confirm('Disable two-factor authentication?')) return
    }
    setTwoFaLoading(true)
    try {
      await api.twoFactorDisable(pwd)
      setTwoFaEnabled(false)
      setTwoFaStep('idle')
      toast.success('2FA disabled')
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to disable 2FA') }
    finally { setTwoFaLoading(false) }
  }

  const handleDeleteAccount = async () => {
    const isSocialOnly = !!user?.social_provider
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
    let pwd = null
    if (!isSocialOnly) {
      pwd = prompt('Enter your password to confirm account deletion:')
      if (!pwd) return
    }

    try {
      await api.deleteAccount(pwd)
      localStorage.clear()
      toast.success('Account deleted')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account')
    }
  }

  const Toggle = ({ value, onChange }) => (
    <div
      className={`sp-toggle ${value ? 'on' : 'off'}`}
      onClick={onChange}
      role="switch"
      aria-checked={value}
    >
      <div className="sp-toggle-knob" />
    </div>
  )

  return (
    <div className="stg-page">
      {/* ── Hero header with Islamic patterns ── */}
      <div className="stg-hero">
        <SettingsHeroPattern />
        <div className="stg-hero-rosette-wrap">
          <SettingsRosette />
        </div>
        <div className="stg-hero-content">
          <div className="stg-hero-icon">
            <i className="fas fa-cog"></i>
          </div>
          <h1 className="stg-hero-title">Settings</h1>
          <p className="stg-hero-subtitle">Customize your experience</p>
          <div className="stg-hero-divider">
            <svg width="16" height="16" viewBox="0 0 20 20"><polygon points={S8} fill="none" stroke="rgba(201,162,77,0.6)" strokeWidth="1" /></svg>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="stg-layout">
        {/* Sidebar Nav */}
        <nav className="stg-nav">
          <div className="stg-nav-inner">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`stg-nav-item${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="stg-nav-icon">
                  <i className={`fas ${tab.icon}`}></i>
                </div>
                <span>{tab.label}</span>
                {activeTab === tab.id && <div className="stg-nav-indicator" />}
              </button>
            ))}
          </div>
        </nav>

        {/* Content Panel */}
        <main className="stg-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="stg-panel">
              <div className="stg-panel-header">
                <div className="stg-panel-icon"><i className="fas fa-user"></i></div>
                <div>
                  <h2 className="stg-panel-title">Edit Profile</h2>
                  <p className="stg-panel-desc">Your public identity on the platform</p>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate}>
                {/* Avatar */}
                <div className="stg-avatar-section">
                  <div className="stg-avatar-container" onClick={() => fileInputRef.current?.click()}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="stg-avatar-img" />
                    ) : (
                      <span className="stg-avatar-letter">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                    <div className="stg-avatar-overlay">
                      <i className="fas fa-camera"></i>
                    </div>
                    <div className="stg-avatar-ring" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    style={{ display: 'none' }}
                  />
                  <div className="stg-avatar-info">
                    <button
                      type="button"
                      className="stg-btn stg-btn-outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fas fa-camera"></i> Upload photo
                    </button>
                    <span className="stg-hint">JPG, PNG, GIF or WebP. Max 5MB.</span>
                  </div>
                </div>

                {/* Header Image */}
                <div className="stg-field-group">
                  <label className="stg-label">Header Image</label>
                  <div
                    className="stg-header-upload"
                    style={headerPreview ? { backgroundImage: `url(${headerPreview})` } : {}}
                    onClick={() => headerInputRef.current?.click()}
                  >
                    {!headerPreview && (
                      <div className="stg-header-placeholder">
                        <i className="fas fa-image"></i>
                        <p>Click to upload header image</p>
                        <span>Recommended: 2480 x 520</span>
                      </div>
                    )}
                    {headerPreview && (
                      <div className="stg-header-overlay">
                        <i className="fas fa-camera"></i>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={headerInputRef}
                    accept="image/*"
                    onChange={handleHeaderSelect}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="stg-field-row">
                  <div className="stg-field-group">
                    <label className="stg-label">Display Name</label>
                    <input
                      type="text"
                      className="stg-input"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="stg-field-group">
                    <label className="stg-label">Email</label>
                    <input
                      type="email"
                      className="stg-input stg-input-disabled"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      disabled
                    />
                  </div>
                </div>

                <div className="stg-field-group">
                  <label className="stg-label">Bio</label>
                  <textarea
                    className="stg-textarea"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell the world about yourself..."
                    rows={4}
                  />
                </div>

                <button type="submit" className="stg-btn stg-btn-primary" disabled={loading}>
                  {loading ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="stg-tab-sections">
              {user?.social_provider && (
                <div className="stg-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px' }}>
                  <i className="fab fa-google" style={{ color: '#4285F4', fontSize: '1.2rem' }}></i>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Signed in with Google</div>
                    <div style={{ color: 'var(--sp-text-muted)', fontSize: '0.8rem' }}>Password management is handled by Google</div>
                  </div>
                </div>
              )}
              {!user?.social_provider && <div className="stg-panel">
                <div className="stg-panel-header">
                  <div className="stg-panel-icon"><i className="fas fa-key"></i></div>
                  <div>
                    <h2 className="stg-panel-title">Change Password</h2>
                    <p className="stg-panel-desc">Keep your account secure</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange}>
                  <div className="stg-field-group">
                    <label className="stg-label">Current Password</label>
                    <input
                      type="password"
                      className="stg-input"
                      value={password.current}
                      onChange={(e) => setPassword({ ...password, current: e.target.value })}
                      required
                    />
                  </div>

                  <div className="stg-field-row">
                    <div className="stg-field-group">
                      <label className="stg-label">New Password</label>
                      <input
                        type="password"
                        className="stg-input"
                        value={password.new}
                        onChange={(e) => setPassword({ ...password, new: e.target.value })}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="stg-field-group">
                      <label className="stg-label">Confirm New Password</label>
                      <input
                        type="password"
                        className="stg-input"
                        value={password.confirm}
                        onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="stg-btn stg-btn-primary" disabled={loading}>
                    Change Password
                  </button>
                </form>
              </div>}

              {/* Two-Factor Authentication */}
              <div className="stg-panel">
                <div className="stg-panel-header">
                  <div className="stg-panel-icon"><i className="fas fa-shield-alt"></i></div>
                  <div>
                    <h2 className="stg-panel-title">Two-Factor Authentication</h2>
                    <p className="stg-panel-desc">
                      {twoFaEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security to your account'}
                    </p>
                  </div>
                  {twoFaEnabled && (
                    <span style={{ marginLeft: 'auto', background: 'rgba(26,112,80,0.15)', color: 'var(--sp-green)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 600 }}>
                      <i className="fas fa-check-circle" style={{ marginRight: '4px' }}></i>Active
                    </span>
                  )}
                </div>

                {/* Idle — not enabled */}
                {!twoFaEnabled && twoFaStep === 'idle' && (
                  <div>
                    <p style={{ color: 'var(--sp-text-muted)', fontSize: '0.88rem', marginBottom: '16px', lineHeight: 1.6 }}>
                      Use an authenticator app like <strong>Google Authenticator</strong> or <strong>Authy</strong> to generate one-time codes when you sign in.
                    </p>
                    <button className="stg-btn stg-btn-primary" onClick={handle2FASetup} disabled={twoFaLoading}>
                      {twoFaLoading ? <><i className="fas fa-spinner fa-spin"></i> Loading...</> : <><i className="fas fa-shield-alt"></i> Enable 2FA</>}
                    </button>
                  </div>
                )}

                {/* Step 1: Scan QR */}
                {twoFaStep === 'setup' && twoFaSetup && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                      <p style={{ color: 'var(--sp-text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                        1. Open your authenticator app<br />
                        2. Scan the QR code or enter the key manually<br />
                        3. Enter the 6-digit code below
                      </p>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFaSetup.qr_url)}`}
                        alt="2FA QR Code"
                        style={{ width: '180px', height: '180px', borderRadius: '12px', background: '#fff', padding: '8px' }}
                      />
                      <p style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--sp-text-muted)' }}>Or enter this key manually:</p>
                      <code style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', letterSpacing: '0.1em', display: 'inline-block', marginTop: '4px' }}>
                        {twoFaSetup.secret}
                      </code>
                    </div>

                    <div className="stg-field-group">
                      <label className="stg-label">Verification Code</label>
                      <input
                        type="text"
                        className="stg-input"
                        placeholder="000000"
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        style={{ textAlign: 'center', fontSize: '1.3rem', letterSpacing: '0.25em', fontWeight: 600 }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="stg-btn stg-btn-primary" onClick={handle2FAConfirm} disabled={twoFaLoading || twoFaCode.length !== 6}>
                        {twoFaLoading ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : 'Verify & Enable'}
                      </button>
                      <button className="stg-btn" onClick={() => setTwoFaStep('idle')} disabled={twoFaLoading}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Step 2: Show recovery codes */}
                {twoFaStep === 'recovery' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: 'rgba(201,162,77,0.08)', border: '1px solid rgba(201,162,77,0.25)', borderRadius: '12px', padding: '16px' }}>
                      <p style={{ color: '#C9A84C', fontWeight: 600, marginBottom: '8px' }}><i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>Save your recovery codes</p>
                      <p style={{ color: 'var(--sp-text-muted)', fontSize: '0.83rem', marginBottom: '12px' }}>If you lose access to your authenticator app, use these codes to log in. Each code can only be used once.</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {recoveryCodes.map(code => (
                          <code key={code} style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>{code}</code>
                        ))}
                      </div>
                    </div>
                    <button className="stg-btn stg-btn-primary" onClick={() => setTwoFaStep('idle')}>
                      <i className="fas fa-check"></i> Done
                    </button>
                  </div>
                )}

                {/* Enabled — disable option */}
                {twoFaEnabled && twoFaStep === 'idle' && (
                  <div style={{ marginTop: '4px' }}>
                    <button className="stg-btn stg-btn-danger" onClick={handle2FADisable} disabled={twoFaLoading}>
                      {twoFaLoading ? <><i className="fas fa-spinner fa-spin"></i> Disabling...</> : <><i className="fas fa-times-circle"></i> Disable 2FA</>}
                    </button>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="stg-panel stg-panel-danger">
                <div className="stg-panel-header">
                  <div className="stg-panel-icon stg-panel-icon-danger"><i className="fas fa-exclamation-triangle"></i></div>
                  <div>
                    <h2 className="stg-panel-title stg-text-danger">Danger Zone</h2>
                    <p className="stg-panel-desc">Once you delete your account, there is no going back. Please be certain.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="stg-btn stg-btn-danger"
                  onClick={handleDeleteAccount}
                >
                  <i className="fas fa-trash"></i> Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <PreferencesPanel />
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="stg-panel">
              <div className="stg-panel-header">
                <div className="stg-panel-icon"><i className="fas fa-bell"></i></div>
                <div>
                  <h2 className="stg-panel-title">Notifications</h2>
                  <p className="stg-panel-desc">Control how you get notified</p>
                </div>
              </div>

              <div className="stg-toggle-section">
                <h3 className="stg-section-label">Email Notifications</h3>
                <div className="stg-toggle-list">
                  {[
                    { key: 'email_likes', label: 'When someone likes your track', icon: 'fa-heart' },
                    { key: 'email_comments', label: 'When someone comments on your track', icon: 'fa-comment' },
                    { key: 'email_follows', label: 'When someone follows you', icon: 'fa-user-plus' },
                    { key: 'email_reposts', label: 'When someone reposts your track', icon: 'fa-retweet' }
                  ].map(item => (
                    <div key={item.key} className="stg-toggle-row">
                      <div className="stg-toggle-row-left">
                        <div className="stg-toggle-row-icon"><i className={`fas ${item.icon}`}></i></div>
                        <span>{item.label}</span>
                      </div>
                      <Toggle
                        value={notifications[item.key]}
                        onChange={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="stg-toggle-section">
                <h3 className="stg-section-label">Push Notifications</h3>
                <div className="stg-toggle-list">
                  {[
                    { key: 'push_likes', label: 'Likes', icon: 'fa-heart' },
                    { key: 'push_comments', label: 'Comments', icon: 'fa-comment' },
                    { key: 'push_follows', label: 'New followers', icon: 'fa-user-plus' }
                  ].map(item => (
                    <div key={item.key} className="stg-toggle-row">
                      <div className="stg-toggle-row-left">
                        <div className="stg-toggle-row-icon"><i className={`fas ${item.icon}`}></i></div>
                        <span>{item.label}</span>
                      </div>
                      <Toggle
                        value={notifications[item.key]}
                        onChange={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button className="stg-btn stg-btn-primary"
                onClick={async () => {
                  try {
                    await api.updateNotificationPreferences(notifications)
                    toast.success('Notification preferences saved!')
                  } catch {
                    toast.error('Failed to save notification preferences')
                  }
                }}>
                Save Preferences
              </button>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="stg-panel">
              <div className="stg-panel-header">
                <div className="stg-panel-icon stg-panel-icon-gold"><i className="fas fa-crown"></i></div>
                <div>
                  <h2 className="stg-panel-title">Subscription</h2>
                  <p className="stg-panel-desc">Manage your plan and usage</p>
                </div>
              </div>

              {planFeatures ? (
                <div className="stg-sub-content">
                  {/* Current plan card */}
                  <div className={`stg-plan-card${planFeatures.is_premium ? ' stg-plan-card-premium' : ''}`}>
                    <div className="stg-plan-card-top">
                      <div>
                        <div className="stg-plan-label">Current Plan</div>
                        <div className="stg-plan-name">
                          <i className={`fas ${planFeatures.is_premium ? 'fa-crown' : 'fa-seedling'}`}></i>
                          {planFeatures.plan_name}
                        </div>
                      </div>
                      {!planFeatures.is_premium && (
                        <button onClick={() => navigate('/pricing')} className="stg-btn stg-btn-gold">
                          Upgrade
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Usage stats */}
                  <div className="stg-usage-grid">
                    <div className="stg-usage-card">
                      <div className="stg-usage-label">Uploads</div>
                      <div className="stg-usage-value">
                        {planFeatures.uploads_remaining === null ? 'Unlimited' : `${planFeatures.uploads_remaining} left`}
                      </div>
                    </div>
                    <div className="stg-usage-card">
                      <div className="stg-usage-label">Audio Quality</div>
                      <div className="stg-usage-value">
                        {planFeatures.audio_quality === 'lossless' ? 'Lossless FLAC' : planFeatures.audio_quality + 'kbps'}
                      </div>
                    </div>
                    <div className="stg-usage-card">
                      <div className="stg-usage-label">Downloads</div>
                      <div className="stg-usage-value">
                        {!planFeatures.can_download ? 'Not available' : planFeatures.downloads_remaining === null ? 'Unlimited' : `${planFeatures.downloads_remaining} left`}
                      </div>
                    </div>
                    <div className="stg-usage-card">
                      <div className="stg-usage-label">Playlists</div>
                      <div className="stg-usage-value">
                        {planFeatures.playlist_limit === null ? 'Unlimited' : `${planFeatures.playlist_limit} max`}
                      </div>
                    </div>
                    <div className="stg-usage-card">
                      <div className="stg-usage-label">Max File Size</div>
                      <div className="stg-usage-value">{planFeatures.max_file_size_mb}MB</div>
                    </div>
                    <div className="stg-usage-card">
                      <div className="stg-usage-label">Tip Commission</div>
                      <div className="stg-usage-value">
                        {planFeatures.tip_commission_percent != null ? `${planFeatures.tip_commission_percent}%` : '20%'}
                      </div>
                    </div>
                  </div>

                  {/* Feature highlights */}
                  <div className="stg-features-card">
                    <h3 className="stg-features-title">Plan Features</h3>
                    <div className="stg-features-list">
                      {[
                        { label: 'Ad-free listening', active: !planFeatures.has_ads },
                        { label: 'Track downloads', active: planFeatures.can_download },
                        { label: 'Priority approval', active: planFeatures.has_priority_approval },
                        { label: 'Auto-approval (instant publish)', active: planFeatures.has_auto_approval },
                        { label: 'Advanced analytics', active: planFeatures.has_advanced_analytics },
                        { label: 'Custom branding', active: planFeatures.has_custom_branding },
                        { label: 'Verified badge', active: planFeatures.has_verified_badge },
                        { label: 'Track promotions', active: planFeatures.can_promote },
                        { label: `Free promotions (${planFeatures.promoted_tracks_monthly || 0}/month)`, active: (planFeatures.promoted_tracks_monthly || 0) > 0 },
                        { label: `Spotlight pins (${planFeatures.spotlight_pins || 0})`, active: (planFeatures.spotlight_pins || 0) > 0 },
                      ].map((f, i) => (
                        <div key={i} className={`stg-feature-item${f.active ? ' active' : ''}`}>
                          <i className={`fas ${f.active ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                          <span>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => navigate('/pricing')} className="stg-btn stg-btn-outline stg-btn-full">
                    View All Plans
                  </button>
                </div>
              ) : (
                <div className="stg-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
              )}
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="stg-panel">
              <div className="stg-panel-header">
                <div className="stg-panel-icon"><i className="fas fa-shield-alt"></i></div>
                <div>
                  <h2 className="stg-panel-title">Privacy</h2>
                  <p className="stg-panel-desc">Control who can see your activity</p>
                </div>
              </div>

              <div className="stg-toggle-list">
                {[
                  { key: 'public_profile', label: 'Make my profile public', desc: 'Anyone can view your profile', icon: 'fa-globe' },
                  { key: 'show_history', label: 'Show listening history', desc: 'Others can see what you listen to', icon: 'fa-history' },
                  { key: 'show_following', label: 'Show who I follow', desc: 'Others can see your following list', icon: 'fa-users' },
                  { key: 'show_likes', label: 'Show my likes', desc: 'Others can see tracks you liked', icon: 'fa-heart' },
                  { key: 'allow_messages', label: 'Receive messages from anyone', desc: 'Let non-followers message you', icon: 'fa-envelope' }
                ].map(item => (
                  <div key={item.key} className="stg-toggle-row stg-toggle-row-rich">
                    <div className="stg-toggle-row-left">
                      <div className="stg-toggle-row-icon"><i className={`fas ${item.icon}`}></i></div>
                      <div>
                        <span className="stg-toggle-row-label">{item.label}</span>
                        <span className="stg-toggle-row-desc">{item.desc}</span>
                      </div>
                    </div>
                    <Toggle
                      value={privacy[item.key]}
                      onChange={() => setPrivacy({ ...privacy, [item.key]: !privacy[item.key] })}
                    />
                  </div>
                ))}
              </div>

              <button className="stg-btn stg-btn-primary"
                disabled={privacySaving}
                onClick={async () => {
                  setPrivacySaving(true)
                  try {
                    await api.updateUser({ is_private: !privacy.public_profile })
                    localStorage.setItem('privacy_settings', JSON.stringify(privacy))
                    const u = JSON.parse(localStorage.getItem('user') || '{}')
                    u.is_private = !privacy.public_profile
                    localStorage.setItem('user', JSON.stringify(u))
                    toast.success('Privacy settings saved!')
                  } catch { toast.error('Failed to save privacy settings') }
                  finally { setPrivacySaving(false) }
                }}>
                {privacySaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ─── Preferences Panel (edit onboarding answers) ─────────────────────────

const STYLE_LABELS = {
  vocals_only: 'Vocals only',
  acappella: 'A cappella',
  light_percussion: 'Light percussion',
  full_instrumentation: 'Full instrumentation',
  no_preference: 'No preference',
}

const CONTENT_TYPE_LABELS = {
  classical_nasheeds: 'Classical nasheeds',
  modern_nasheeds: 'Modern nasheeds',
  children_nasheeds: "Children's nasheeds",
  full_recitations: 'Full recitations',
  short_surahs: 'Short surahs',
  tafsir: 'Tafsir',
  aqeedah: 'Aqeedah',
  seerah: 'Seerah',
  fiqh: 'Fiqh',
  tarbiyah: 'Tarbiyah',
  islamic_podcasts: 'Islamic podcasts',
  muslim_lifestyle: 'Muslim lifestyle',
}

const MOOD_LABELS = {
  worship: 'Worship',
  focus: 'Focus',
  calm: 'Calm',
  learning: 'Learning',
  meditation: 'Meditation',
}

const CONTEXT_LABELS = {
  commute: 'On my commute',
  prayer: 'Before/after prayer',
  night: 'Winding down at night',
  family: 'With my family',
  work_study: 'During work or study',
  home: 'Around the house',
}

function PreferencesPanel() {
  const [prefs, setPrefs] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadPrefs()
  }, [])

  const loadPrefs = async () => {
    try {
      const data = await api.getOnboardingState()
      setPrefs(data.answers)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="stg-panel">
        <div className="stg-loading">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
      </div>
    )
  }

  if (!prefs) {
    return (
      <div className="stg-panel">
        <div className="stg-panel-header">
          <div className="stg-panel-icon"><i className="fas fa-sliders-h"></i></div>
          <div>
            <h2 className="stg-panel-title">Listening Preferences</h2>
            <p className="stg-panel-desc">You haven't set up your preferences yet. Complete the onboarding to personalize your feed.</p>
          </div>
        </div>
        <button
          className="stg-btn stg-btn-primary"
          onClick={() => {
            localStorage.setItem('onboarding_state', 'not_started')
            navigate('/onboarding')
          }}
        >
          Set Up Preferences
        </button>
      </div>
    )
  }

  const PrefRow = ({ label, value, icon }) => (
    <div className="stg-pref-row">
      <div className="stg-pref-row-label">
        {icon && <i className={`fas ${icon}`}></i>}
        {label}
      </div>
      <div className="stg-pref-row-value">{value || '\u2014'}</div>
    </div>
  )

  return (
    <div className="stg-panel">
      <div className="stg-panel-header">
        <div className="stg-panel-icon"><i className="fas fa-sliders-h"></i></div>
        <div>
          <h2 className="stg-panel-title">Listening Preferences</h2>
          <p className="stg-panel-desc">These preferences shape your home feed recommendations.</p>
        </div>
      </div>

      <div className="stg-prefs-list">
        <PrefRow icon="fa-language" label="Languages" value={prefs.languages?.map(l => l === 'ar' ? 'Arabic' : 'English').join(', ')} />
        <PrefRow icon="fa-list" label="Content Types" value={prefs.content_types?.map(t => CONTENT_TYPE_LABELS[t] || t).join(', ')} />
        <PrefRow icon="fa-music" label="Nasheed Style" value={STYLE_LABELS[prefs.style_preference] || prefs.style_preference} />
        <PrefRow icon="fa-palette" label="Moods" value={prefs.moods?.map(m => MOOD_LABELS[m] || m).join(', ')} />
        <PrefRow icon="fa-headphones" label="Listening Context" value={prefs.contexts?.map(c => CONTEXT_LABELS[c] || c).join(', ')} />
        <PrefRow icon="fa-user-friends" label="Followed Artists" value={prefs.seed_artist_ids?.length ? `${prefs.seed_artist_ids.length} artists` : '\u2014'} />
      </div>

      <button
        className="stg-btn stg-btn-outline"
        onClick={() => {
          localStorage.setItem('onboarding_state', 'in_progress')
          navigate('/onboarding')
        }}
      >
        <i className="fas fa-edit"></i> Redo Onboarding
      </button>
    </div>
  )
}
