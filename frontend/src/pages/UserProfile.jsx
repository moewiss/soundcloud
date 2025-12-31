import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'
import { copyToClipboard } from '../utils/clipboard'

export default function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [tracks, setTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [reposts, setReposts] = useState([])
  const [likedTracks, setLikedTracks] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followChecked, setFollowChecked] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isLoggedIn = !!localStorage.getItem('token')

  const tabs = [
    { id: 'all', label: 'All', icon: 'fa-th-large' },
    { id: 'tracks', label: 'Tracks', icon: 'fa-music' },
    { id: 'likes', label: 'Likes', icon: 'fa-heart' },
    { id: 'playlists', label: 'Playlists', icon: 'fa-list' },
    { id: 'reposts', label: 'Reposts', icon: 'fa-retweet' },
    { id: 'albums', label: 'Albums', icon: 'fa-compact-disc' }
  ]

  useEffect(() => {
    if (id) {
      setFollowChecked(false)
      setIsFollowing(false)
      setActiveTab('all')
      fetchUser()
      fetchTracks()
      fetchPlaylists()
      fetchLikedTracks()
      fetchRepostedTracks()
    }
  }, [id])

  const fetchUser = async () => {
    try {
      const data = await api.getUser(id)
      setUser(data)
      
      if (data.is_followed !== undefined) {
        setIsFollowing(data.is_followed)
        setFollowChecked(true)
      } else if (data.is_following !== undefined) {
        setIsFollowing(data.is_following)
        setFollowChecked(true)
      }
      if (isLoggedIn && currentUser.id && !followChecked) {
        checkFollowStatus()
      }
    } catch (error) {
      toast.error('User not found')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const checkFollowStatus = async () => {
    if (!isLoggedIn || !currentUser.id || followChecked) return
    
    const myId = parseInt(currentUser.id, 10)
    const profileId = parseInt(id, 10)
    
    try {
      const myFollowing = await api.getFollowing(myId).catch(() => null)
      if (myFollowing) {
        const followingList = Array.isArray(myFollowing) ? myFollowing : (myFollowing?.data || [])
        const amFollowingThisUser = followingList.some(f => {
          const followedId = parseInt(f.id || f.following_id || f.followed_id || f.user_id, 10)
          return followedId === profileId
        })
        
        if (amFollowingThisUser) {
          setIsFollowing(true)
          setFollowChecked(true)
          return
        }
      }
      
      const followers = await api.getFollowers(id).catch(() => [])
      const followersList = Array.isArray(followers) ? followers : (followers?.data || [])
      
      const amIInFollowers = followersList.some(f => {
        const odId = parseInt(f.id || f.follower_id || f.user_id, 10)
        return odId === myId
      })
      
      setIsFollowing(amIInFollowers)
      setFollowChecked(true)
    } catch (e) {
      console.error('Error checking follow status:', e)
      setFollowChecked(true)
    }
  }

  const fetchTracks = async () => {
    const userId = parseInt(id, 10)
    
    try {
      const data = await api.getUserTracks(id)
      
      if (Array.isArray(data) && data.length > 0) {
        const filtered = data.filter(track => {
          const trackUserId = track.user_id || track.user?.id
          return parseInt(trackUserId, 10) === userId
        })
        if (filtered.length > 0) {
          setTracks(filtered)
          return
        }
      }
      
      const allTracksRes = await api.getTracks()
      const allTracks = Array.isArray(allTracksRes) ? allTracksRes : (allTracksRes?.data || allTracksRes?.tracks || [])
      const userTracks = allTracks.filter(track => {
        const trackUserId = track.user_id || track.user?.id
        return parseInt(trackUserId, 10) === userId
      })
      setTracks(userTracks)
    } catch (error) {
      console.error('Error fetching tracks:', error)
      setTracks([])
    }
  }

  const fetchLikedTracks = async () => {
    try {
      const data = await api.getUserLikes(id)
      setLikedTracks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching liked tracks:', error)
      setLikedTracks([])
    }
  }

  const fetchRepostedTracks = async () => {
    try {
      const data = await api.getUserReposts(id)
      setReposts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching reposted tracks:', error)
      setReposts([])
    }
  }

  const fetchPlaylists = async () => {
    try {
      // Try user-specific endpoint first
      let userPlaylists = []
      try {
        const data = await api.getUserPlaylists(id)
        userPlaylists = Array.isArray(data) ? data : (data?.data || [])
      } catch (e) {
        // Fallback: get all playlists and filter
        const data = await api.getPlaylists().catch(() => [])
        const allPlaylists = Array.isArray(data) ? data : (data?.data || [])
        userPlaylists = allPlaylists.filter(p => 
          parseInt(p.user_id, 10) === parseInt(id, 10)
        )
      }
      setPlaylists(userPlaylists)
    } catch (error) {
      console.error('Error fetching playlists:', error)
      setPlaylists([])
    }
  }

  const handleFollow = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to follow users')
      navigate('/login')
      return
    }
    
    if (followLoading) return
    
    setFollowLoading(true)
    const wasFollowing = isFollowing
    
    try {
      const result = await api.toggleFollow(id)
      const newFollowState = result?.is_following !== undefined 
        ? result.is_following 
        : !wasFollowing
      
      setIsFollowing(newFollowState)
      
      if (newFollowState !== wasFollowing) {
        setUser(prev => prev ? {
          ...prev,
          followers_count: newFollowState 
            ? (prev.followers_count || 0) + 1 
            : Math.max(0, (prev.followers_count || 0) - 1)
        } : prev)
      }
      
      toast.success(newFollowState ? 'Now following!' : 'Unfollowed')
    } catch (error) {
      toast.error('Failed to update follow status')
    } finally {
      setFollowLoading(false)
    }
  }

  const handlePlay = (track) => {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      playTrack(track)
    }
  }

  const handleLike = async (trackId, e) => {
    e?.stopPropagation()
    try {
      const result = await api.toggleLike(trackId)
      // Update tracks
      setTracks(prev => prev.map(t => 
        t.id === trackId 
          ? { 
              ...t, 
              is_liked: result.is_liked,
              likes_count: result.likes_count
            }
          : t
      ))
      // Update liked tracks list
      setLikedTracks(prev => prev.map(t => 
        t.id === trackId 
          ? { 
              ...t, 
              is_liked: result.is_liked,
              likes_count: result.likes_count
            }
          : t
      ))
      // Update reposts list
      setReposts(prev => prev.map(t => 
        t.id === trackId 
          ? { 
              ...t, 
              is_liked: result.is_liked,
              likes_count: result.likes_count
            }
          : t
      ))
      // If unliked, remove from liked tracks list
      if (!result.is_liked) {
        setLikedTracks(prev => prev.filter(t => t.id !== trackId))
      }
      toast.success(result.is_liked ? 'Added to likes' : 'Removed from likes')
    } catch (error) {
      toast.error('Please login to like tracks')
    }
  }

  const handleRepost = async (trackId, e) => {
    e?.stopPropagation()
    try {
      const result = await api.toggleRepost(trackId)
      // Update tracks
      setTracks(prev => prev.map(t => 
        t.id === trackId 
          ? { ...t, is_reposted: result.is_reposted, reposts_count: result.reposts_count }
          : t
      ))
      // Update liked tracks
      setLikedTracks(prev => prev.map(t => 
        t.id === trackId 
          ? { ...t, is_reposted: result.is_reposted, reposts_count: result.reposts_count }
          : t
      ))
      // Update reposts list - if unreposted, remove from list
      if (!result.is_reposted) {
        setReposts(prev => prev.filter(t => t.id !== trackId))
      } else {
        setReposts(prev => prev.map(t => 
          t.id === trackId 
            ? { ...t, is_reposted: true, reposts_count: result.reposts_count }
            : t
        ))
      }
      toast.success(result.is_reposted ? 'Reposted!' : 'Unreposted')
    } catch (error) {
      toast.error('Please login to repost')
    }
  }

  const handleShare = async (trackId, e) => {
    e?.stopPropagation()
    const trackUrl = `${window.location.origin}/tracks/${trackId}`
    try {
      await copyToClipboard(trackUrl)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      console.error('Copy error:', error)
      toast.error('Failed to copy link. Please copy manually.')
    }
  }

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${id}`
    try {
      await copyToClipboard(profileUrl)
      toast.success('Profile link copied to clipboard!')
    } catch (error) {
      console.error('Copy error:', error)
      toast.error('Failed to copy link. Please copy manually.')
    }
  }

  // Render track card
  const renderTrackCard = (track) => (
    <div key={track.id} className="feed-card">
      <div className="feed-body">
        <div className="feed-artwork" onClick={() => navigate(`/tracks/${track.id}`)}>
          {track.cover_url ? (
            <img src={track.cover_url} alt={track.title} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-secondary)' }}>
              <i className="fas fa-music" style={{ fontSize: '40px', color: 'var(--text-muted)' }}></i>
            </div>
          )}
          <button className="feed-play-btn" onClick={(e) => { e.stopPropagation(); handlePlay(track); }}>
            <i className={`fas fa-${currentTrack?.id === track.id && isPlaying ? 'pause' : 'play'}`}></i>
          </button>
        </div>

        <div className="feed-content">
          <Link to={`/tracks/${track.id}`} className="feed-track-title">
            {track.title}
          </Link>
          {track.category && (
            <span style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '3px',
              fontSize: '11px',
              marginTop: '8px',
              marginBottom: '10px'
            }}>
              # {track.category}
            </span>
          )}

          <div className="feed-waveform" onClick={() => handlePlay(track)}>
            <div className="feed-waveform-progress" style={{ width: currentTrack?.id === track.id ? '35%' : '0%' }}></div>
          </div>

                        <div className="feed-actions">
            <button 
              className={`feed-action-btn ${track.is_liked ? 'active' : ''}`}
              onClick={(e) => handleLike(track.id, e)}
            >
              <i className="fas fa-heart"></i>
              <span>{track.likes_count || 0}</span>
            </button>
            <button 
              className={`feed-action-btn ${track.is_reposted ? 'active' : ''}`}
              onClick={(e) => handleRepost(track.id, e)}
            >
              <i className="fas fa-retweet"></i>
              <span>{track.reposts_count || 0}</span>
            </button>
            <button 
              className="feed-action-btn"
              onClick={(e) => handleShare(track.id, e)}
            >
              <i className="fas fa-share"></i>
            </button>

            <div className="feed-stats">
              <span><i className="fas fa-play"></i> {track.plays_count || 0}</span>
              <span><i className="fas fa-comment"></i> {track.comments_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render playlist card
  const renderPlaylistCard = (playlist) => (
    <div 
      key={playlist.id}
      style={{
        background: 'var(--bg-white)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-light)',
        cursor: 'pointer',
        transition: 'transform 0.2s'
      }}
      onClick={() => navigate(`/playlists/${playlist.id}`)}
    >
      <div style={{
        height: '160px',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {playlist.cover_url ? (
          <img src={playlist.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <i className="fas fa-list" style={{ fontSize: '50px', color: 'rgba(255,255,255,0.5)' }}></i>
        )}
      </div>
      <div style={{ padding: '15px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
          {playlist.name}
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {playlist.tracks_count || 0} tracks
        </p>
      </div>
    </div>
  )

  // Get content based on active tab
  const getTabContent = () => {
    switch (activeTab) {
      case 'all':
        return (
          <>
            {/* Recent Tracks Section */}
            {tracks.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: 'var(--text-primary)' }}>
                  <i className="fas fa-music" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>
                  Recent Tracks
                </h3>
                <div className="feed-list">
                  {tracks.slice(0, 3).map(renderTrackCard)}
                </div>
                {tracks.length > 3 && (
                  <button 
                    className="btn" 
                    style={{ marginTop: '15px' }}
                    onClick={() => setActiveTab('tracks')}
                  >
                    View all {tracks.length} tracks
                  </button>
                )}
              </div>
            )}

            {/* Playlists Section */}
            {playlists.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: 'var(--text-primary)' }}>
                  <i className="fas fa-list" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>
                  Playlists
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                  {playlists.slice(0, 4).map(renderPlaylistCard)}
                </div>
                {playlists.length > 4 && (
                  <button 
                    className="btn" 
                    style={{ marginTop: '15px' }}
                    onClick={() => setActiveTab('playlists')}
                  >
                    View all {playlists.length} playlists
                  </button>
                )}
              </div>
            )}

            {/* Empty state */}
            {tracks.length === 0 && playlists.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-music"></i>
                <h3>No content yet</h3>
                <p>{isOwnProfile ? 'Start by uploading your first track!' : 'This user hasn\'t uploaded any content yet'}</p>
                {isOwnProfile && (
                  <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                    <i className="fas fa-upload"></i> Upload
                  </button>
                )}
              </div>
            )}
          </>
        )

      case 'tracks':
        return tracks.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-music"></i>
            <h3>No tracks yet</h3>
            <p>{isOwnProfile ? 'Upload your first track!' : 'This user hasn\'t uploaded any tracks yet'}</p>
            {isOwnProfile && (
              <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                <i className="fas fa-upload"></i> Upload
              </button>
            )}
          </div>
        ) : (
          <div className="feed-list">
            {tracks.map(renderTrackCard)}
          </div>
        )

      case 'likes':
        return likedTracks.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-heart"></i>
            <h3>No liked tracks yet</h3>
            <p>{isOwnProfile ? 'Like tracks to see them here!' : `${user.name} hasn't liked any tracks yet`}</p>
          </div>
        ) : (
          <div className="feed-list">
            {likedTracks.map(renderTrackCard)}
          </div>
        )

      case 'reposts':
        return reposts.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-retweet"></i>
            <h3>No reposted tracks yet</h3>
            <p>{isOwnProfile ? 'Repost tracks to see them here!' : `${user.name} hasn't reposted any tracks yet`}</p>
          </div>
        ) : (
          <div className="feed-list">
            {reposts.map(renderTrackCard)}
          </div>
        )

      case 'playlists':
        return playlists.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-list"></i>
            <h3>No playlists yet</h3>
            <p>{isOwnProfile ? 'Create your first playlist!' : 'This user hasn\'t created any playlists yet'}</p>
            {isOwnProfile && (
              <button className="btn btn-primary" onClick={() => navigate('/playlists')}>
                <i className="fas fa-plus"></i> Create Playlist
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            {playlists.map(renderPlaylistCard)}
          </div>
        )

      case 'reposts':
        return (
          <div className="empty-state">
            <i className="fas fa-retweet"></i>
            <h3>No reposts yet</h3>
            <p>{isOwnProfile ? 'Repost tracks you love to share them with your followers' : 'This user hasn\'t reposted any tracks yet'}</p>
          </div>
        )

      case 'albums':
        return (
          <div className="empty-state">
            <i className="fas fa-compact-disc"></i>
            <h3>No albums yet</h3>
            <p>{isOwnProfile ? 'Create your first album!' : 'This user hasn\'t created any albums yet'}</p>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const isOwnProfile = currentUser.id && parseInt(currentUser.id, 10) === parseInt(user.id, 10)

  return (
    <div className="page" style={{ padding: 0 }}>
      {/* Profile Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
        padding: '40px 30px',
        marginBottom: '30px',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '30px', alignItems: 'flex-end' }}>
          <div style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '72px',
            fontWeight: '600',
            border: '4px solid white',
            flexShrink: 0,
            color: 'white'
          }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              user.name?.charAt(0) || 'U'
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '36px', marginBottom: '10px', color: 'white' }}>{user.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px' }}>
              {user.bio || 'No bio yet'}
            </p>
            <div style={{ display: 'flex', gap: '30px', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
              <span 
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                onClick={() => navigate(`/profile/${id}/followers`)}
                onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <strong>{user.followers_count || 0}</strong> Followers
              </span>
              <span 
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                onClick={() => navigate(`/profile/${id}/following`)}
                onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <strong>{user.following_count || 0}</strong> Following
              </span>
              <span><strong>{tracks.length}</strong> Tracks</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                style={{
                  padding: '10px 24px',
                  background: isFollowing ? 'var(--primary-dark)' : 'white',
                  border: isFollowing ? '2px solid white' : 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: isFollowing ? 'white' : 'var(--primary)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: followLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: followLoading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  minWidth: '120px',
                  justifyContent: 'center'
                }}
              >
                {followLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i className={`fas fa-${isFollowing ? 'check' : 'user-plus'}`}></i>
                    {isFollowing ? 'Following' : 'Follow'}
                  </>
                )}
              </button>
            )}
            {isOwnProfile && (
              <button 
                className="btn"
                style={{ background: 'white', color: 'var(--primary)' }}
                onClick={() => navigate('/settings')}
              >
                <i className="fas fa-edit"></i> Edit Profile
              </button>
            )}
            <button 
              onClick={handleShareProfile}
              style={{
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'white',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              <i className="fas fa-share"></i>
            </button>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              >
                <i className="fas fa-ellipsis-h"></i>
              </button>
              {showMoreMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '8px',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  padding: '8px 0',
                  minWidth: '200px',
                  zIndex: 1000
                }}>
                  <button
                    onClick={() => {
                      handleShareProfile()
                      setShowMoreMenu(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--primary-soft)'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    <i className="fas fa-share"></i> Share Profile
                  </button>
                  {isLoggedIn && !isOwnProfile && (
                    <button
                      onClick={() => {
                        toast.info('Report feature coming soon')
                        setShowMoreMenu(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--primary-soft)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      <i className="fas fa-flag"></i> Report User
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 30px' }}>
        {/* Tabs */}
        <div className="library-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`library-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '30px' }}>
          {/* Main Content */}
          <div style={{ flex: 1 }}>
            {getTabContent()}
          </div>

          {/* Sidebar */}
          <div style={{ width: '300px', flexShrink: 0 }}>
            {/* Stats */}
            <div style={{
              background: 'var(--bg-white)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid var(--border-light)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px', color: 'var(--text-primary)' }}>Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{user.followers_count || 0}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Followers</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{user.following_count || 0}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Following</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{tracks.length}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Tracks</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {tracks.reduce((sum, t) => sum + (t.plays_count || 0), 0)}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Plays</div>
                </div>
              </div>
            </div>

            {/* Likes */}
            <div 
              onClick={() => setActiveTab('likes')}
              style={{
              background: 'var(--bg-white)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
            >
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: 'var(--text-primary)' }}>
                <i className="fas fa-heart" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                {user.likes_count || 0} Likes
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                See what {user.name} likes
              </p>
            </div>

            {/* Playlists in sidebar */}
            {playlists.length > 0 && (
              <div style={{
                background: 'var(--bg-white)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                border: '1px solid var(--border-light)'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px', color: 'var(--text-primary)' }}>
                  <i className="fas fa-list" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                  Playlists
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {playlists.slice(0, 3).map(playlist => (
                    <div 
                      key={playlist.id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'background 0.2s'
                      }}
                      onClick={() => navigate(`/playlists/${playlist.id}`)}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <i className="fas fa-list" style={{ color: 'white', fontSize: '14px' }}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {playlist.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {playlist.tracks_count || 0} tracks
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {playlists.length > 3 && (
                  <button 
                    className="btn" 
                    style={{ width: '100%', marginTop: '10px', fontSize: '12px' }}
                    onClick={() => setActiveTab('playlists')}
                  >
                    View all playlists
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
