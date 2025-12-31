import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function FollowersList() {
  const { id, type } = useParams() // type: 'followers' or 'following'
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileUser, setProfileUser] = useState(null)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isLoggedIn = !!localStorage.getItem('token')

  useEffect(() => {
    fetchData()
  }, [id, type])

  const fetchData = async () => {
    try {
      // Get profile user info
      const userInfo = await api.getUser(id)
      setProfileUser(userInfo)

      // Get followers or following list
      const data = type === 'followers' 
        ? await api.getFollowers(id)
        : await api.getFollowing(id)
      
      setUsers(Array.isArray(data) ? data : (data?.data || []))
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId) => {
    if (!isLoggedIn) {
      toast.error('Please login to follow users')
      navigate('/login')
      return
    }

    try {
      await api.toggleFollow(userId)
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, is_following: !u.is_following }
          : u
      ))
    } catch (error) {
      toast.error('Failed to update follow status')
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 30px', textAlign: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '60px 30px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button 
          onClick={() => navigate(`/profile/${id}`)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fas fa-arrow-left"></i> Back to Profile
        </button>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
          {profileUser?.name}'s {type === 'followers' ? 'Followers' : 'Following'}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {users.length} {users.length === 1 ? 'user' : 'users'}
        </p>
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <i className={`fas fa-${type === 'followers' ? 'users' : 'user-friends'}`} style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }}></i>
          <h3>No {type} yet</h3>
          <p>{type === 'followers' ? 'No one is following this user yet' : 'This user isn\'t following anyone yet'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {users.map(user => (
            <div 
              key={user.id}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <Link 
                to={`/profile/${user.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flex: 1,
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'white'
                }}>
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    marginBottom: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user.name}
                  </h3>
                  {user.bio && (
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user.bio}
                    </p>
                  )}
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <span><i className="fas fa-music"></i> {user.tracks_count || 0} tracks</span>
                    <span><i className="fas fa-users"></i> {user.followers_count || 0} followers</span>
                  </div>
                </div>
              </Link>
              {isLoggedIn && user.id !== currentUser.id && (
                <button
                  onClick={() => handleFollow(user.id)}
                  style={{
                    padding: '10px 20px',
                    background: user.is_following ? 'var(--primary-dark)' : 'var(--primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  {user.is_following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

