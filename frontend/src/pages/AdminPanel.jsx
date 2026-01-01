import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { copyToClipboard } from '../utils/clipboard'

export default function AdminPanel() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Dashboard State
  const [stats, setStats] = useState({})
  const [activity, setActivity] = useState([])

  // Users State
  const [users, setUsers] = useState([])
  const [usersPage, setUsersPage] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [usersFilter, setUsersFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({ password: '', password_confirmation: '' })
  const [resetMode, setResetMode] = useState('direct') // 'direct' or 'link'

  // Tracks State
  const [tracks, setTracks] = useState([])
  const [tracksFilter, setTracksFilter] = useState('pending')

  // Comments State
  const [comments, setComments] = useState([])
  const [commentsPage, setCommentsPage] = useState(1)
  const [commentsSearch, setCommentsSearch] = useState('')

  useEffect(() => {
    if (!user.is_admin) {
      toast.error('Access denied. Admins only.')
      navigate('/')
      return
    }
    
    loadDashboard()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'tracks') loadTracks()
    if (activeTab === 'content') loadComments()
  }, [activeTab, usersSearch, usersFilter, tracksFilter, commentsSearch])

  // Dashboard Functions
  const loadDashboard = async () => {
    try {
      setLoading(true)
      const [statsData, activityData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminActivity()
      ])
      setStats(statsData)
      setActivity(activityData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Users Functions
  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await api.getAdminUsers({
        search: usersSearch,
        filter: usersFilter,
        page: usersPage
      })
      setUsers(data.data || data)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async (userId) => {
    if (!confirm('Are you sure?')) return
    try {
      await api.banUser(userId)
      toast.success('User status updated')
      loadUsers()
    } catch (error) {
      toast.error('Failed to update user')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('This will delete the user and all their content. Continue?')) return
    try {
      await api.deleteAdminUser(userId)
      toast.success('User deleted')
      loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleResetPassword = async () => {
    if (resetMode === 'direct') {
      if (passwordData.password !== passwordData.password_confirmation) {
        toast.error('Passwords do not match')
        return
      }
      try {
        await api.resetUserPassword(selectedUser.id, passwordData)
        toast.success('Password reset successfully')
        setShowPasswordModal(false)
        setPasswordData({ password: '', password_confirmation: '' })
      } catch (error) {
        toast.error('Failed to reset password')
      }
    } else {
      try {
        const data = await api.generateResetLink(selectedUser.id)
        await copyToClipboard(data.reset_url)
        toast.success('Reset link copied to clipboard!')
        setShowPasswordModal(false)
      } catch (error) {
        toast.error('Failed to generate reset link')
      }
    }
  }

  // Tracks Functions
  const loadTracks = async () => {
    try {
      setLoading(true)
      const data = tracksFilter === 'pending' 
        ? await api.getPendingTracks()
        : await api.getAdminTracks()
      
      const trackList = Array.isArray(data) ? data : (data?.data || [])
      const filtered = tracksFilter === 'all' ? trackList : trackList.filter(t => t.status === tracksFilter)
      setTracks(filtered)
    } catch (error) {
      console.error('Error loading tracks:', error)
      toast.error('Failed to load tracks')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTrack = async (trackId) => {
    try {
      await api.approveTrack(trackId)
      toast.success('Track approved')
      loadTracks()
    } catch (error) {
      toast.error('Failed to approve track')
    }
  }

  const handleRejectTrack = async (trackId) => {
    if (!confirm('Reject this track?')) return
    try {
      await api.rejectTrack(trackId)
      toast.success('Track rejected')
      loadTracks()
    } catch (error) {
      toast.error('Failed to reject track')
    }
  }

  const handleDeleteTrack = async (trackId) => {
    if (!confirm('Delete this track permanently?')) return
    try {
      await api.adminDeleteTrack(trackId)
      toast.success('Track deleted')
      loadTracks()
    } catch (error) {
      toast.error('Failed to delete track')
    }
  }

  // Comments Functions
  const loadComments = async () => {
    try {
      setLoading(true)
      const data = await api.getAdminComments({
        search: commentsSearch,
        page: commentsPage
      })
      setComments(data.data || data)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    try {
      await api.deleteAdminComment(commentId)
      toast.success('Comment deleted')
      loadComments()
    } catch (error) {
      toast.error('Failed to delete comment')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <div style={{
        width: '240px',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
        borderRight: '1px solid var(--border-light)',
        padding: '20px 0',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '0 20px', marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--primary)', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-shield-halved"></i>
            Admin Panel
          </h2>
        </div>

        <nav>
          {[
            { id: 'dashboard', icon: 'chart-line', label: 'Dashboard' },
            { id: 'users', icon: 'users', label: 'Users' },
            { id: 'tracks', icon: 'music', label: 'Tracks' },
            { id: 'content', icon: 'comments', label: 'Content' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: activeTab === tab.id ? 'rgba(255, 85, 0, 0.1)' : 'transparent',
                border: 'none',
                borderLeft: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400'
              }}
            >
              <i className={`fas fa-${tab.icon}`} style={{ marginRight: '10px', width: '20px' }}></i>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: '240px', flex: 1, padding: '30px', maxWidth: 'calc(100% - 240px)' }}>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '30px', color: 'var(--text-primary)' }}>
              Dashboard
            </h1>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <StatsCard 
                title="Total Users" 
                value={stats.total_users || 0} 
                growth={stats.users_growth}
                icon="users"
                color="#3b82f6"
              />
              <StatsCard 
                title="Total Tracks" 
                value={stats.total_tracks || 0} 
                growth={stats.tracks_growth}
                icon="music"
                color="#10b981"
              />
              <StatsCard 
                title="Pending Tracks" 
                value={stats.pending_tracks || 0} 
                icon="clock"
                color="#f59e0b"
                badge={stats.pending_tracks > 0}
              />
              <StatsCard 
                title="Total Plays" 
                value={stats.total_plays || 0} 
                icon="play"
                color="#8b5cf6"
              />
            </div>

            {/* Recent Activity */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border-light)'
            }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--text-primary)' }}>
                Recent Activity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activity.slice(0, 10).map((item, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <i className={`fas fa-${item.type === 'user_registration' ? 'user-plus' : 'upload'}`} 
                       style={{ color: 'var(--primary)', fontSize: '16px' }}></i>
                    <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {item.type === 'user_registration' 
                        ? `${item.user.name} joined` 
                        : `${item.user.name} uploaded "${item.track.title}"`}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h1 style={{ fontSize: '28px', color: 'var(--text-primary)' }}>User Management</h1>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search users..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '10px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
              />
              {['all', 'active', 'banned', 'admin'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setUsersFilter(filter)}
                  style={{
                    padding: '10px 20px',
                    background: usersFilter === filter ? 'var(--primary)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    color: usersFilter === filter ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Users Table */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid var(--border-light)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>USER</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>EMAIL</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>TRACKS</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>JOINED</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>STATUS</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(usr => (
                    <tr key={usr.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600'
                          }}>
                            {usr.display_name?.charAt(0).toUpperCase() || usr.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{usr.display_name || usr.name}</div>
                            {usr.is_admin && <span style={{ fontSize: '11px', color: 'var(--primary)' }}>Admin</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{usr.email}</td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{usr.tracks_count}</td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {new Date(usr.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: usr.is_banned ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: usr.is_banned ? '#ef4444' : '#10b981'
                        }}>
                          {usr.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => {
                              setSelectedUser(usr)
                              setShowPasswordModal(true)
                            }}
                            style={{
                              padding: '6px 12px',
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-medium)',
                              borderRadius: '6px',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="Reset Password"
                          >
                            <i className="fas fa-key"></i>
                          </button>
                          <button
                            onClick={() => handleBanUser(usr.id)}
                            style={{
                              padding: '6px 12px',
                              background: usr.is_banned ? 'var(--bg-primary)' : 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid var(--border-medium)',
                              borderRadius: '6px',
                              color: usr.is_banned ? 'var(--text-primary)' : '#ef4444',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title={usr.is_banned ? 'Unban' : 'Ban'}
                          >
                            <i className={`fas fa-${usr.is_banned ? 'check' : 'ban'}`}></i>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(usr.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid #ef4444',
                              borderRadius: '6px',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="Delete User"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tracks Tab */}
        {activeTab === 'tracks' && (
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '30px', color: 'var(--text-primary)' }}>Track Management</h1>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              {['pending', 'approved', 'rejected', 'all'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setTracksFilter(filter)}
                  style={{
                    padding: '10px 20px',
                    background: tracksFilter === filter ? 'var(--primary)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    color: tracksFilter === filter ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Tracks List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tracks.map(track => (
                <div key={track.id} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {track.cover_url ? (
                      <img src={track.cover_url} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      <i className="fas fa-music" style={{ color: 'white', fontSize: '24px' }}></i>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '16px', marginBottom: '6px', color: 'var(--text-primary)' }}>{track.title}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{track.user?.name}</p>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: track.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : track.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: track.status === 'approved' ? '#10b981' : track.status === 'rejected' ? '#ef4444' : '#f59e0b'
                    }}>
                      {track.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {track.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveTrack(track.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#10b981',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <i className="fas fa-check"></i> Approve
                        </button>
                        <button
                          onClick={() => handleRejectTrack(track.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <i className="fas fa-times"></i> Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteTrack(track.id)}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '30px', color: 'var(--text-primary)' }}>Content Moderation</h1>

            <input
              type="text"
              placeholder="Search comments..."
              value={commentsSearch}
              onChange={(e) => setCommentsSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                marginBottom: '20px'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {comments.map(comment => (
                <div key={comment.id} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{comment.user?.name || 'Unknown'}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: '12px' }}>
                        on "{comment.track?.title}"
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{comment.body}</p>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(comment.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid var(--border-light)'
          }}>
            <h3 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--text-primary)' }}>
              Reset Password for {selectedUser?.display_name || selectedUser?.name}
            </h3>

            {/* Mode Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                onClick={() => setResetMode('direct')}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: resetMode === 'direct' ? 'var(--primary)' : 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: resetMode === 'direct' ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Direct Reset
              </button>
              <button
                onClick={() => setResetMode('link')}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: resetMode === 'link' ? 'var(--primary)' : 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: resetMode === 'link' ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Generate Link
              </button>
            </div>

            {resetMode === 'direct' ? (
              <div>
                <input
                  type="password"
                  placeholder="New password"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    marginBottom: '12px'
                  }}
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={passwordData.password_confirmation}
                  onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    marginBottom: '20px'
                  }}
                />
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
                A reset link will be generated and copied to your clipboard. You can then send it to the user.
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleResetPassword}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--primary)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {resetMode === 'direct' ? 'Reset Password' : 'Generate Link'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordData({ password: '', password_confirmation: '' })
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatsCard({ title, value, growth, icon, color, badge }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid var(--border-light)',
      position: 'relative'
    }}>
      {badge && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: '#ef4444',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          Action Required
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {title}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {value.toLocaleString()}
          </div>
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className={`fas fa-${icon}`} style={{ fontSize: '20px', color }}></i>
        </div>
      </div>
      {growth !== undefined && (
        <div style={{ fontSize: '13px', color: growth > 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
          <i className={`fas fa-arrow-${growth > 0 ? 'up' : 'down'}`}></i> {Math.abs(growth)}% last 30 days
        </div>
      )}
    </div>
  )
}

