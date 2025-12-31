import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  const [tracks, setTracks] = useState([])
  const [likedTracks, setLikedTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [following, setFollowing] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const navigate = useNavigate()

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'likes', label: 'Likes' },
    { id: 'playlists', label: 'Playlists' },
    { id: 'albums', label: 'Albums' },
    { id: 'stations', label: 'Stations' },
    { id: 'following', label: 'Following' },
    { id: 'history', label: 'History' }
  ]

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    
    try {
      if (activeTab === 'overview' || activeTab === 'likes') {
        const liked = await api.getLikedTracks().catch(() => [])
        setLikedTracks(Array.isArray(liked) ? liked : [])
      }
      if (activeTab === 'overview' || activeTab === 'playlists') {
        const lists = await api.getPlaylists().catch(() => [])
        setPlaylists(Array.isArray(lists) ? lists : [])
      }
      if (activeTab === 'overview' || activeTab === 'history') {
        const hist = await api.getRecentHistory().catch(() => [])
        setHistory(Array.isArray(hist) ? hist : [])
      }
      if (activeTab === 'overview' || activeTab === 'following') {
        // Fetch users the current user is following
        try {
          // Try getting from /user/following first (current user's following)
          let followingList = await api.getMyFollowing().catch(() => null)
          
          // Fallback to /users/:id/following
          if (!followingList && currentUser.id) {
            followingList = await api.getFollowing(currentUser.id).catch(() => [])
          }
          
          // Parse the result
          let users = []
          if (Array.isArray(followingList)) {
            users = followingList
          } else if (followingList?.data) {
            users = followingList.data
          }
          
          // Enrich user data with full stats by fetching each user
          const enrichedUsers = await Promise.all(
            users.map(async (u) => {
              try {
                const fullUser = await api.getUser(u.id || u.following_id || u.user_id)
                return fullUser
              } catch (e) {
                return u // Return original if fetch fails
              }
            })
          )
          
          setFollowing(enrichedUsers.filter(u => u && u.id))
        } catch (e) {
          console.error('Error fetching following:', e)
          setFollowing([])
        }
      }
      const allTracksData = await api.getTracks().catch(() => [])
      const allTracks = Array.isArray(allTracksData) ? allTracksData : (allTracksData?.data || allTracksData?.tracks || [])
      setTracks(allTracks)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const handlePlay = (track) => {
    if (!track) return
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      playTrack(track)
    }
  }

  const handleClearHistory = async () => {
    try {
      await api.clearHistory()
      setHistory([])
      toast.success('History cleared')
    } catch (error) {
      toast.error('Failed to clear history')
    }
  }

  const handleLike = async (trackId, e) => {
    e?.stopPropagation()
    try {
      const result = await api.toggleLike(trackId)
      
      // Update tracks state (for Overview section)
      setTracks(prev => prev.map(t => 
        t.id === trackId 
          ? { ...t, is_liked: result.is_liked, likes_count: result.likes_count }
          : t
      ))
      
      // Update liked tracks state (for Likes section)
      if (!result.is_liked) {
        setLikedTracks(prev => prev.filter(t => t.id !== trackId))
        toast.success('Removed from likes')
      } else {
        setLikedTracks(prev => prev.map(t => 
          t.id === trackId 
            ? { ...t, likes_count: result.likes_count, is_liked: true }
            : t
        ))
        toast.success('Added to likes')
      }
    } catch (error) {
      toast.error('Please login to like tracks')
    }
  }

  const handleUnfollow = async (userId) => {
    try {
      await api.toggleFollow(userId)
      // Remove from following list
      setFollowing(prev => prev.filter(u => u.id !== userId))
      toast.success('Unfollowed')
    } catch (error) {
      toast.error('Failed to unfollow')
    }
  }

  return (
    <div className="page">
      {/* Tabs */}
      <div className="library-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`library-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Recently Played */}
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">Recently played</h2>
                  <span className="section-link" onClick={() => handleTabChange('history')}>View all</span>
                </div>
                <div className="track-grid">
                  {tracks.slice(0, 6).map(track => (
                    <div key={track.id} className="track-card" onClick={() => navigate(`/tracks/${track.id}`)}>
                      <div className="track-artwork">
                        {track.cover_url ? (
                          <img src={track.cover_url} alt={track.title} />
                        ) : (
                          <i className="fas fa-music"></i>
                        )}
                        <button className="track-play-btn" onClick={(e) => { e.stopPropagation(); handlePlay(track); }}>
                          <i className={`fas fa-${currentTrack?.id === track.id && isPlaying ? 'pause' : 'play'}`}></i>
                        </button>
                        <button 
                          className={`track-like-btn ${track.is_liked ? 'active' : ''}`}
                          onClick={(e) => handleLike(track.id, e)}
                        >
                          <i className="fas fa-heart"></i>
                        </button>
                      </div>
                      <div className="track-info">
                        <div className="track-title">{track.title}</div>
                        <div className="track-artist">{track.user?.name}</div>
                        <div className="track-stats">
                          <span><i className="fas fa-play"></i> {track.plays_count || 0}</span>
                          <button 
                            className={`like-stat-btn ${track.is_liked ? 'active' : ''}`}
                            onClick={(e) => handleLike(track.id, e)}
                          >
                            <i className="fas fa-heart"></i> {track.likes_count || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Likes */}
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">Likes</h2>
                  <span className="section-link" onClick={() => handleTabChange('likes')}>Browse trending playlists</span>
                </div>
                {likedTracks.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px' }}>
                    <p>You haven't liked any tracks yet</p>
                  </div>
                ) : (
                  <div className="track-grid">
                    {likedTracks.slice(0, 6).map(item => (
                      <div key={item.id} className="track-card" onClick={() => navigate(`/tracks/${item.track?.id}`)}>
                        <div className="track-artwork">
                          {item.track?.cover_url ? (
                            <img src={item.track.cover_url} alt="" />
                          ) : (
                            <i className="fas fa-music"></i>
                          )}
                          <button className="track-play-btn" onClick={(e) => { e.stopPropagation(); handlePlay(item.track); }}>
                            <i className="fas fa-play"></i>
                          </button>
                        </div>
                        <div className="track-info">
                          <div className="track-title">
                            <i className="fas fa-heart" style={{ color: 'var(--primary)', marginRight: '6px', fontSize: '11px' }}></i>
                            {item.track?.title}
                          </div>
                          <div className="track-artist">{item.track?.user?.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Likes Tab */}
          {activeTab === 'likes' && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Hear the tracks you've liked:</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>View</span>
                  <button style={{ padding: '6px 10px', background: 'var(--bg-white)', border: '1px solid var(--border-light)', borderRadius: '3px', color: 'var(--text-primary)' }}>
                    <i className="fas fa-th"></i>
                  </button>
                  <button style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '3px', color: 'var(--text-muted)' }}>
                    <i className="fas fa-list"></i>
                  </button>
                </div>
              </div>
              {likedTracks.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-heart"></i>
                  <h3>No liked tracks yet</h3>
                  <p>Like tracks to see them here</p>
                </div>
              ) : (
                <div className="track-grid">
                  {likedTracks.map(item => (
                    <div key={item.id} className="track-card" onClick={() => navigate(`/tracks/${item.id}`)}>
                      <div className="track-artwork">
                        {item.cover_url ? (
                          <img src={item.cover_url} alt="" />
                        ) : (
                          <i className="fas fa-music"></i>
                        )}
                        <button className="track-play-btn" onClick={(e) => { e.stopPropagation(); handlePlay(item); }}>
                          <i className="fas fa-play"></i>
                        </button>
                      </div>
                      <div className="track-info">
                        <div className="track-title">
                          <i className="fas fa-heart" style={{ color: 'var(--primary)', marginRight: '6px', fontSize: '11px' }}></i>
                          {item.title}
                        </div>
                        <div className="track-artist">{item.user?.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Playlists Tab */}
          {activeTab === 'playlists' && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Hear your own playlists and the playlists you've liked:</h2>
              </div>
              {playlists.length === 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
                  <div 
                    className="track-card" 
                    style={{ border: '2px dashed var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', aspectRatio: '1', cursor: 'pointer' }}
                    onClick={() => navigate('/playlists')}
                  >
                    <i className="fas fa-plus" style={{ fontSize: '32px', color: 'var(--text-muted)', marginBottom: '10px' }}></i>
                    <span style={{ color: 'var(--text-secondary)' }}>Create playlist</span>
                  </div>
                </div>
              ) : (
                <div className="track-grid">
                  {playlists.map(playlist => (
                    <div key={playlist.id} className="track-card">
                      <div className="track-artwork" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
                        <i className="fas fa-list" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '40px', color: 'white' }}></i>
                      </div>
                      <div className="track-info">
                        <div className="track-title">{playlist.name}</div>
                        <div className="track-artist">{playlist.tracks_count || 0} tracks</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Albums Tab */}
          {activeTab === 'albums' && (
            <div className="empty-state">
              <i className="fas fa-compact-disc"></i>
              <h3>You haven't liked any albums yet</h3>
            </div>
          )}

          {/* Stations Tab */}
          {activeTab === 'stations' && (
            <div className="empty-state">
              <i className="fas fa-broadcast-tower"></i>
              <h3>No stations yet</h3>
              <p>Create stations based on your favorite tracks</p>
            </div>
          )}

          {/* Following Tab */}
          {activeTab === 'following' && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Artists you follow:</h2>
              </div>
              
              {following.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-user-friends"></i>
                  <h3>You aren't following anyone yet</h3>
                  <p>Follow artists to see their updates</p>
                  <button className="btn btn-primary" onClick={() => navigate('/search')}>Find artists</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                  {following.map(user => (
                    <div 
                      key={user.id} 
                      style={{
                        background: 'var(--bg-white)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        textAlign: 'center',
                        border: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onClick={() => navigate(`/users/${user.id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        fontWeight: '600',
                        color: 'white',
                        margin: '0 auto 15px'
                      }}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          user.name?.charAt(0) || 'U'
                        )}
                      </div>
                      
                      {/* Name */}
                      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                        {user.name}
                      </h3>
                      
                      {/* Stats */}
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '15px' }}>
                        {user.tracks_count || 0} tracks · {user.followers_count || 0} followers
                      </p>
                      
                      {/* Unfollow Button */}
                      <button 
                        className="btn"
                        style={{ 
                          padding: '8px 20px',
                          fontSize: '13px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-light)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUnfollow(user.id)
                        }}
                      >
                        <i className="fas fa-user-check" style={{ marginRight: '6px' }}></i>
                        Following
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Recently played:</h2>
                {history.length > 0 && (
                  <button className="section-link" onClick={handleClearHistory}>Clear all history</button>
                )}
              </div>
              
              {/* Recent Carousel */}
              <div style={{ marginBottom: '30px' }}>
                <div className="track-grid">
                  {tracks.slice(0, 6).map(track => (
                    <div key={track.id} className="track-card" onClick={() => navigate(`/tracks/${track.id}`)}>
                      <div className="track-artwork">
                        {track.cover_url ? (
                          <img src={track.cover_url} alt="" />
                        ) : (
                          <i className="fas fa-music"></i>
                        )}
                        <button className="track-play-btn" onClick={(e) => { e.stopPropagation(); handlePlay(track); }}>
                          <i className="fas fa-play"></i>
                        </button>
                      </div>
                      <div className="track-info">
                        <div className="track-title">{track.title}</div>
                        <div className="track-artist">{track.user?.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h3 style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--text-primary)' }}>Hear the tracks you've played:</h3>
              
              {history.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-history"></i>
                  <h3>No listening history</h3>
                  <p>Tracks you play will appear here</p>
                </div>
              ) : (
                <div className="feed-list">
                  {history.map(item => (
                    <div key={item.id} className="feed-card">
                      <div className="feed-body">
                        <div className="feed-artwork" style={{ width: '120px', height: '120px' }}>
                          {item.track?.cover_url ? (
                            <img src={item.track.cover_url} alt="" />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-secondary)' }}>
                              <i className="fas fa-music" style={{ fontSize: '30px', color: 'var(--text-muted)' }}></i>
                            </div>
                          )}
                          <button className="feed-play-btn" onClick={() => handlePlay(item.track)}>
                            <i className="fas fa-play"></i>
                          </button>
                        </div>
                        <div className="feed-content">
                          <div className="feed-track-artist">{item.track?.user?.name}</div>
                          <Link to={`/tracks/${item.track?.id}`} className="feed-track-title">{item.track?.title}</Link>
                          <div className="feed-waveform"></div>
                          <div className="feed-actions">
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                              Played {new Date(item.played_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
