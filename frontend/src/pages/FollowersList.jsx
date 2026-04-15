import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { ChevronLeft, Users, UserCheck, UserPlus, Loader2 } from 'lucide-react'

export default function FollowersList() {
  const { id } = useParams()
  const location = useLocation()
  const type = location.pathname.includes('following') ? 'following' : 'followers'
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileUser, setProfileUser] = useState(null)
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

  useEffect(() => { fetchData() }, [id, type])

  const fetchData = async () => {
    setLoading(true)
    try {
      const userInfo = await api.getUser(id)
      setProfileUser(userInfo)
      const data = type === 'followers' ? await api.getFollowers(id) : await api.getFollowing(id)
      setUsers(Array.isArray(data) ? data : (data?.data || []))
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const handleFollow = async (userId) => {
    if (!currentUser) { navigate('/login'); return }
    try {
      await api.toggleFollow(userId)
      setUsers(p => p.map(u => u.id === userId ? { ...u, is_following: !u.is_following } : u))
    } catch { toast.error('Failed') }
  }

  if (loading) return (
    <div className="fol-page">
      <div className="fol-loading"><Loader2 size={24} className="fol-spin" /></div>
    </div>
  )

  return (
    <div className="fol-page">
      {/* Header */}
      <div className="fol-header">
        <button className="fol-back" onClick={() => navigate(`/users/${id}`)}>
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="fol-title">
            {profileUser?.display_name || profileUser?.name || 'User'}'s {type === 'followers' ? 'Followers' : 'Following'}
          </h1>
          <p className="fol-count">{users.length} {users.length === 1 ? 'person' : 'people'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="fol-tabs">
        <button className={`fol-tab${type === 'followers' ? ' active' : ''}`}
          onClick={() => navigate(`/users/${id}/followers`)}>
          <Users size={14} /> Followers
          {profileUser?.followers_count > 0 && <span className="fol-tab-count">{profileUser.followers_count}</span>}
        </button>
        <button className={`fol-tab${type === 'following' ? ' active' : ''}`}
          onClick={() => navigate(`/users/${id}/following`)}>
          <UserCheck size={14} /> Following
          {profileUser?.following_count > 0 && <span className="fol-tab-count">{profileUser.following_count}</span>}
        </button>
      </div>

      {/* List */}
      {users.length === 0 ? (
        <div className="fol-empty">
          <div className="fol-empty-icon"><Users size={32} /></div>
          <h3>No {type} yet</h3>
          <p>{type === 'followers' ? 'When people follow this user, they\'ll appear here' : 'This user isn\'t following anyone yet'}</p>
        </div>
      ) : (
        <div className="fol-list">
          {users.map(user => (
            <div key={user.id} className="fol-item" onClick={() => navigate(`/users/${user.id}`)}>
              <div className="fol-avatar">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" />
                  : <span>{user.name?.[0]?.toUpperCase() || '?'}</span>}
              </div>
              <div className="fol-info">
                <span className="fol-name">{user.display_name || user.name}</span>
                <span className="fol-meta">{user.tracks_count || 0} tracks · {user.followers_count || 0} followers</span>
              </div>
              {currentUser && user.id !== currentUser.id && (
                <button className={`fol-follow${user.is_following ? ' following' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleFollow(user.id) }}>
                  {user.is_following ? <><UserCheck size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
