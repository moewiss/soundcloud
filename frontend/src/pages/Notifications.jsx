import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const navigate = useNavigate()

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'likes', label: 'Likes' },
    { id: 'reposts', label: 'Reposts' },
    { id: 'comments', label: 'Comments' },
    { id: 'follows', label: 'Follows' }
  ]

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load notifications')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      setNotifications(notifications.map(n => ({ ...n, read: true })))
      toast.success('All marked as read')
    } catch (error) {
      toast.error('Failed')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return { icon: 'fa-heart', color: '#ff5555' }
      case 'follow': return { icon: 'fa-user-plus', color: '#4CAF50' }
      case 'comment': return { icon: 'fa-comment', color: '#2196F3' }
      case 'repost': return { icon: 'fa-retweet', color: '#9C27B0' }
      default: return { icon: 'fa-bell', color: 'var(--primary)' }
    }
  }

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'like':
        return (
          <>
            <Link to={`/users/${notification.user?.id}`} style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {notification.user?.name}
            </Link>
            {' liked your track '}
            <Link to={`/tracks/${notification.track?.id}`} style={{ color: 'var(--primary)' }}>
              {notification.track?.title}
            </Link>
          </>
        )
      case 'follow':
        return (
          <>
            <Link to={`/users/${notification.user?.id}`} style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {notification.user?.name}
            </Link>
            {' started following you'}
          </>
        )
      case 'comment':
        return (
          <>
            <Link to={`/users/${notification.user?.id}`} style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {notification.user?.name}
            </Link>
            {' commented on '}
            <Link to={`/tracks/${notification.track?.id}`} style={{ color: 'var(--primary)' }}>
              {notification.track?.title}
            </Link>
            {notification.comment && (
              <div style={{ 
                marginTop: '8px', 
                padding: '10px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                color: 'var(--text-secondary)'
              }}>
                "{notification.comment}"
              </div>
            )}
          </>
        )
      case 'repost':
        return (
          <>
            <Link to={`/users/${notification.user?.id}`} style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {notification.user?.name}
            </Link>
            {' reposted your track '}
            <Link to={`/tracks/${notification.track?.id}`} style={{ color: 'var(--primary)' }}>
              {notification.track?.title}
            </Link>
          </>
        )
      default:
        return 'New notification'
    }
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    return new Date(date).toLocaleDateString()
  }

  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === activeFilter.slice(0, -1))

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '5px', color: 'var(--text-primary)' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: '12px',
                  padding: '4px 10px',
                  background: 'var(--primary)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: 'white'
                }}>
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Stay updated with your activity</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn" onClick={markAllAsRead}>
              <i className="fas fa-check-double"></i> Mark all as read
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-bell-slash"></i>
            <h3>No notifications</h3>
            <p>When you get notifications, they'll show up here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {filteredNotifications.map(notification => {
              const { icon, color } = getNotificationIcon(notification.type)
              return (
                <div
                  key={notification.id}
                  style={{
                    display: 'flex',
                    gap: '15px',
                    padding: '20px',
                    background: notification.read ? 'var(--bg-white)' : 'var(--primary-soft)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => {
                    if (notification.track?.id) {
                      navigate(`/tracks/${notification.track.id}`)
                    } else if (notification.user?.id) {
                      navigate(`/users/${notification.user.id}`)
                    }
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <i className={`fas ${icon}`} style={{ color, fontSize: '18px' }}></i>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '5px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                      {getNotificationText(notification)}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {getTimeAgo(notification.created_at)}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      flexShrink: 0,
                      marginTop: '5px'
                    }}></div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
