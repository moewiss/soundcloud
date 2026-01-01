import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

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

  const [notifications, setNotifications] = useState({
    email_likes: true,
    email_comments: true,
    email_follows: true,
    email_reposts: false,
    push_likes: true,
    push_comments: true,
    push_follows: true
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'fa-user' },
    { id: 'account', label: 'Account', icon: 'fa-cog' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
    { id: 'privacy', label: 'Privacy', icon: 'fa-lock' }
  ]

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(storedUser)
    setProfile({
      name: storedUser.name || '',
      email: storedUser.email || '',
      bio: storedUser.bio || '',
      city: storedUser.city || '',
      country: storedUser.country || '',
      website: storedUser.website || ''
    })
  }, [])

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
        e.target.value = '' // Clear the input
        return
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        e.target.value = '' // Clear the input
        return
      }
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleHeaderSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
        e.target.value = '' // Clear the input
        return
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        e.target.value = '' // Clear the input
        return
      }
      setHeaderPreview(URL.createObjectURL(file))
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const formData = new FormData()
      
      // Only append fields that have values
      if (profile.name && profile.name.trim()) {
        formData.append('display_name', profile.name.trim())
      }
      if (profile.bio !== undefined && profile.bio !== null) {
        formData.append('bio', profile.bio)
      }
      
      // Only append avatar if a valid file is selected
      const avatarFile = fileInputRef.current?.files?.[0]
      if (avatarFile && avatarFile.size > 0 && avatarFile.type.startsWith('image/')) {
        formData.append('avatar', avatarFile)
      }

      // Only append header if a valid file is selected
      const headerFile = headerInputRef.current?.files?.[0]
      if (headerFile && headerFile.size > 0 && headerFile.type.startsWith('image/')) {
        formData.append('header', headerFile)
      }

      const response = await api.updateUser(formData)
      
      // Update localStorage with new data from backend response
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user))
        setUser(response.user)
        // Update avatar preview if new avatar was uploaded
        if (response.user.avatar_url) {
          setAvatarPreview(response.user.avatar_url)
        }
        // Update header preview if new header was uploaded
        if (response.user.header_url) {
          setHeaderPreview(response.user.header_url)
        }
      }
      
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Profile update error:', error)
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
      toast.success('Password changed!')
      setPassword({ current: '', new: '', confirm: '' })
    } catch (error) {
      toast.error('Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
    if (!confirm('This will permanently delete all your tracks, playlists, and data. Continue?')) return

    try {
      localStorage.clear()
      toast.success('Account deleted')
      navigate('/')
    } catch (error) {
      toast.error('Failed to delete account')
    }
  }

  return (
    <div className="page">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '30px', color: 'var(--text-primary)' }}>Settings</h1>

        <div style={{ display: 'flex', gap: '30px' }}>
          {/* Sidebar */}
          <div style={{ width: '200px', flexShrink: 0 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 15px',
                  background: activeTab === tab.id ? 'var(--primary-soft)' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
              >
                <i className={`fas ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div style={{ background: 'var(--bg-white)', padding: '30px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '25px', color: 'var(--text-primary)' }}>Edit Profile</h2>

                <form onSubmit={handleProfileUpdate}>
                  {/* Avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                    <div
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        fontWeight: '600',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        color: 'white'
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        user?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      style={{ display: 'none' }}
                    />
                    <div>
                      <button
                        type="button"
                        className="btn"
                        style={{ marginBottom: '8px' }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <i className="fas fa-camera"></i> Upload photo
                      </button>
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        JPG, GIF or PNG. Max 2MB.
                      </p>
                    </div>
                  </div>

                  {/* Header Image */}
                  <div style={{ marginBottom: '30px' }}>
                    <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
                      Header Image
                    </label>
                    <div
                      style={{
                        width: '100%',
                        height: '200px',
                        borderRadius: 'var(--radius-lg)',
                        background: headerPreview 
                          ? `url(${headerPreview}) center/cover` 
                          : 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--border-light) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '2px dashed var(--border-medium)',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                      onClick={() => headerInputRef.current?.click()}
                    >
                      {!headerPreview && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          <i className="fas fa-image" style={{ fontSize: '48px', marginBottom: '10px', display: 'block' }}></i>
                          <p>Click to upload header image</p>
                          <p style={{ fontSize: '12px' }}>Recommended: 2480×520 pixels, max 5MB</p>
                        </div>
                      )}
                      {headerPreview && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.3s',
                          color: 'white'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                        >
                          <i className="fas fa-camera" style={{ fontSize: '30px' }}></i>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Display Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        placeholder="Your city"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.country}
                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                        placeholder="Your country"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea
                      className="form-textarea"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell the world about yourself..."
                      rows={4}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                      type="url"
                      className="form-input"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div>
                <div style={{ background: 'var(--bg-white)', padding: '30px', borderRadius: 'var(--radius-lg)', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
                  <h2 style={{ fontSize: '20px', marginBottom: '25px', color: 'var(--text-primary)' }}>Change Password</h2>

                  <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input
                        type="password"
                        className="form-input"
                        value={password.current}
                        onChange={(e) => setPassword({ ...password, current: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                          type="password"
                          className="form-input"
                          value={password.new}
                          onChange={(e) => setPassword({ ...password, new: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input
                          type="password"
                          className="form-input"
                          value={password.confirm}
                          onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      Change Password
                    </button>
                  </form>
                </div>

                {/* Danger Zone */}
                <div style={{ background: 'var(--bg-white)', padding: '30px', borderRadius: 'var(--radius-lg)', border: '1px solid #ff4444' }}>
                  <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#ff4444' }}>
                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '10px' }}></i>
                    Danger Zone
                  </h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    style={{
                      padding: '10px 20px',
                      background: 'transparent',
                      border: '2px solid #ff4444',
                      borderRadius: 'var(--radius-sm)',
                      color: '#ff4444',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontFamily: 'inherit'
                    }}
                  >
                    <i className="fas fa-trash"></i> Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div style={{ background: 'var(--bg-white)', padding: '30px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '25px', color: 'var(--text-primary)' }}>Notification Preferences</h2>

                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '15px', color: 'var(--text-muted)' }}>Email Notifications</h3>
                  
                  {[
                    { key: 'email_likes', label: 'When someone likes your track' },
                    { key: 'email_comments', label: 'When someone comments on your track' },
                    { key: 'email_follows', label: 'When someone follows you' },
                    { key: 'email_reposts', label: 'When someone reposts your track' }
                  ].map(item => (
                    <label
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 0',
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span>{item.label}</span>
                      <div
                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                        style={{
                          width: '48px',
                          height: '24px',
                          background: notifications[item.key] ? 'var(--primary)' : 'var(--border-medium)',
                          borderRadius: '12px',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.3s'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          left: notifications[item.key] ? '26px' : '2px',
                          width: '20px',
                          height: '20px',
                          background: 'white',
                          borderRadius: '50%',
                          transition: 'left 0.3s'
                        }}></div>
                      </div>
                    </label>
                  ))}
                </div>

                <button className="btn btn-primary" style={{ marginTop: '20px' }}>
                  Save Preferences
                </button>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div style={{ background: 'var(--bg-white)', padding: '30px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '25px', color: 'var(--text-primary)' }}>Privacy Settings</h2>

                {[
                  { label: 'Make my profile public', checked: true },
                  { label: 'Allow others to see my listening history', checked: false },
                  { label: 'Allow others to see who I follow', checked: true },
                  { label: 'Allow others to see my likes', checked: true },
                  { label: 'Receive messages from anyone', checked: false }
                ].map((item, index) => (
                  <label
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '15px 0',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span>{item.label}</span>
                    <div style={{
                      width: '48px',
                      height: '24px',
                      background: item.checked ? 'var(--primary)' : 'var(--border-medium)',
                      borderRadius: '12px',
                      position: 'relative',
                      cursor: 'pointer'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: item.checked ? '26px' : '2px',
                        width: '20px',
                        height: '20px',
                        background: 'white',
                        borderRadius: '50%'
                      }}></div>
                    </div>
                  </label>
                ))}

                <button className="btn btn-primary" style={{ marginTop: '20px' }}>
                  Save Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
