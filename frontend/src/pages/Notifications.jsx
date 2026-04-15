import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { Bell, Heart, MessageCircle, UserPlus, Repeat2, CheckCheck, BellOff } from 'lucide-react'

const S8 = "10,1 11.42,6.58 16.36,3.64 13.42,8.58 19,10 13.42,11.42 16.36,16.36 11.42,13.42 10,19 8.58,13.42 3.64,16.36 6.58,11.42 1,10 6.58,8.58 3.64,3.64 8.58,6.58"

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(date).toLocaleDateString()
}

const NOTIF_META = {
  like:    { icon: Heart, color: '#FF3B30', bg: 'rgba(255,59,48,0.08)' },
  follow:  { icon: UserPlus, color: 'var(--sp-green)', bg: 'rgba(45,155,110,0.08)' },
  comment: { icon: MessageCircle, color: '#4a9eed', bg: 'rgba(74,158,237,0.08)' },
  repost:  { icon: Repeat2, color: '#b659e0', bg: 'rgba(182,89,224,0.08)' },
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const navigate = useNavigate()

  const filters = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'likes', label: 'Likes', icon: Heart },
    { id: 'comments', label: 'Comments', icon: MessageCircle },
    { id: 'follows', label: 'Follows', icon: UserPlus },
    { id: 'reposts', label: 'Reposts', icon: Repeat2 },
  ]

  useEffect(() => { fetchNotifications() }, [])

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications()
      setNotifications(data.notifications || [])
    } catch {
      toast.error('Failed to load notifications')
      setNotifications([])
    } finally { setLoading(false) }
  }

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead()
      setNotifications(notifications.map(n => ({ ...n, read: true })))
      toast.success('All marked as read')
    } catch { toast.error('Failed to mark all as read') }
  }

  const renderText = (n) => {
    const userName = <Link to={`/users/${n.user?.id}`} className="ntf-user-link">{n.user?.name}</Link>
    const trackName = n.track?.id ? <Link to={`/tracks/${n.track.id}`} className="ntf-track-link">{n.track.title}</Link> : null
    switch (n.type) {
      case 'like': return <>{userName} liked {trackName}</>
      case 'follow': return <>{userName} started following you</>
      case 'comment': return (
        <>
          {userName} commented on {trackName}
          {n.comment && (
            <div className="ntf-comment-preview">
              "{typeof n.comment === 'string' ? n.comment : n.comment.body}"
            </div>
          )}
        </>
      )
      case 'repost': return <>{userName} reposted {trackName}</>
      default: return 'New notification'
    }
  }

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter.slice(0, -1))
  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) return (
    <div className="ntf-page">
      <div className="ntf-loading"><i className="fas fa-spinner fa-spin"></i></div>
    </div>
  )

  return (
    <div className="ntf-page">
      {/* Hero */}
      <div className="ntf-hero">
        <div className="ntf-hero-pattern">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ntf-stars" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <polygon points="40,22 42.85,33.16 52.73,27.27 47.27,37.15 58,40 47.27,42.85 52.73,52.73 42.85,47.27 40,58 37.15,47.27 27.27,52.73 32.73,42.85 22,40 32.73,37.15 27.27,27.27 37.15,32.73"
                  fill="none" stroke="rgba(201,162,77,0.15)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ntf-stars)" />
          </svg>
        </div>
        <div className="ntf-hero-content">
          <div className="ntf-hero-icon">
            <Bell size={24} />
          </div>
          <h1 className="ntf-hero-title">
            Notifications
            {unreadCount > 0 && <span className="ntf-badge">{unreadCount}</span>}
          </h1>
          <p className="ntf-hero-sub">Stay updated with your activity</p>
        </div>
      </div>

      <div className="ntf-content">
        {/* Toolbar */}
        <div className="ntf-toolbar">
          <div className="ntf-filters">
            {filters.map(f => {
              const Icon = f.icon
              return (
                <button key={f.id} className={`ntf-filter${activeFilter === f.id ? ' active' : ''}`}
                  onClick={() => setActiveFilter(f.id)}>
                  <Icon size={14} />
                  {f.label}
                </button>
              )
            })}
          </div>
          {unreadCount > 0 && (
            <button className="ntf-mark-read" onClick={markAllAsRead}>
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="ntf-empty">
            <div className="ntf-empty-icon"><BellOff size={32} /></div>
            <h3>No notifications</h3>
            <p>When you get notifications, they'll show up here</p>
          </div>
        ) : (
          <div className="ntf-list">
            {filtered.map(n => {
              const meta = NOTIF_META[n.type] || NOTIF_META.follow
              const Icon = meta.icon
              return (
                <div key={n.id} className={`ntf-item${!n.read ? ' ntf-item--unread' : ''}`}
                  onClick={() => {
                    if (n.track?.id) navigate(`/tracks/${n.track.id}`)
                    else if (n.user?.id) navigate(`/users/${n.user.id}`)
                  }}>
                  {/* Avatar */}
                  <Link to={`/users/${n.user?.id}`} className="ntf-avatar" onClick={e => e.stopPropagation()}>
                    {n.user?.avatar_url
                      ? <img src={n.user.avatar_url} alt="" />
                      : <span>{n.user?.name?.[0] || '?'}</span>}
                    <div className="ntf-type-badge" style={{ background: meta.bg }}>
                      <Icon size={10} style={{ color: meta.color }} />
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="ntf-body">
                    <div className="ntf-text">{renderText(n)}</div>
                    <span className="ntf-time">{timeAgo(n.created_at)}</span>
                  </div>

                  {/* Unread dot */}
                  {!n.read && <div className="ntf-dot" />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
