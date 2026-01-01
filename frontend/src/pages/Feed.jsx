import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'
import { copyToClipboard } from '../utils/clipboard'
import AddToPlaylistModal from '../components/AddToPlaylistModal'

export default function Feed() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState(null)
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      const data = await api.getTracks()
      // Handle different response formats
      const tracks = Array.isArray(data) ? data : (data?.data || data?.tracks || [])
      setTracks(tracks)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
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
    e.stopPropagation()
    try {
      const result = await api.toggleLike(trackId)
      // Update track locally with API response
      setTracks(prev => prev.map(t => 
        t.id === trackId 
          ? { 
              ...t, 
              is_liked: result.is_liked,
              likes_count: result.likes_count
            }
          : t
      ))
      toast.success(result.is_liked ? 'Added to likes' : 'Removed from likes')
    } catch (error) {
      toast.error('Please login to like tracks')
    }
  }

  const handleRepost = async (trackId, e) => {
    e?.stopPropagation()
    try {
      const result = await api.toggleRepost(trackId)
      setTracks(prev => prev.map(t => 
        t.id === trackId 
          ? { ...t, is_reposted: result.is_reposted, reposts_count: result.reposts_count }
          : t
      ))
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

  const handleAddToPlaylist = (trackId, e) => {
    e.stopPropagation()
    if (!user?.id) {
      toast.error('Please login to add tracks to playlists')
      return
    }
    setSelectedTrackForPlaylist(trackId)
    setShowPlaylistModal(true)
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading your feed...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-with-sidebar">
      <div className="page-main">
        <div className="feed-intro" style={{
          background: 'var(--bg-white)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--border-light)'
        }}>
          <div>
            <h3 style={{ fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>This is your feed</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Follow your favorite artists and see every track they post right here.
            </p>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Hear the latest posts from people you follow:</h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Reposts
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
            </label>
          </div>

          <div className="feed-list">
            {tracks.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-rss"></i>
                <h3>Your feed is empty</h3>
                <p>Follow artists to see their tracks here!</p>
                <button className="btn btn-primary" onClick={() => navigate('/search')}>
                  Discover Artists
                </button>
              </div>
            ) : (
              tracks.map(track => (
                <div key={track.id} className="feed-card">
                  <div className="feed-header">
                    <Link to={`/users/${track.user?.id}`} className="feed-avatar">
                      {track.user?.name?.charAt(0) || 'U'}
                    </Link>
                    <div className="feed-meta">
                      <Link to={`/users/${track.user?.id}`} className="feed-username">
                        {track.user?.name}
                      </Link>
                      <span className="feed-action-text"> posted a track</span>
                    </div>
                    <span className="feed-time">
                      {new Date(track.created_at).toLocaleDateString()}
                    </span>
                  </div>

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
                      <Link to={`/users/${track.user?.id}`} className="feed-track-artist">
                        {track.user?.name}
                      </Link>
                      <Link to={`/tracks/${track.id}`} className="feed-track-title">
                        {track.title}
                      </Link>

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
                          <span>Share</span>
                        </button>
                        <button 
                          className="feed-action-btn"
                          onClick={(e) => handleAddToPlaylist(track.id, e)}
                          title="Add to playlist"
                        >
                          <i className="fas fa-list-music"></i>
                        </button>

                        <div className="feed-stats">
                          <span><i className="fas fa-play"></i> {track.plays_count || 0}</span>
                          <span><i className="fas fa-comment"></i> {track.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <aside className="page-sidebar">
        <div style={{
          background: 'var(--bg-white)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Who to follow</span>
            <Link to="/search" style={{ fontSize: '12px', color: 'var(--primary)' }}>Refresh</Link>
          </div>
          <div className="artist-list">
            <div className="artist-item">
              <div className="artist-avatar" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                <i className="fas fa-search"></i>
              </div>
              <div className="artist-info">
                <div className="artist-name">Discover more artists</div>
                <div className="artist-stats">on the search page</div>
              </div>
              <button className="btn-follow" onClick={() => navigate('/search')}>Browse</button>
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-white)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Listening history</span>
            <Link to="/library?tab=history" style={{ fontSize: '12px', color: 'var(--primary)' }}>View all</Link>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Tracks you've played will appear here
          </p>
        </div>
      </aside>

      {/* Add to Playlist Modal */}
      {showPlaylistModal && selectedTrackForPlaylist && (
        <AddToPlaylistModal
          trackId={selectedTrackForPlaylist}
          onClose={() => {
            setShowPlaylistModal(false)
            setSelectedTrackForPlaylist(null)
          }}
        />
      )}
    </div>
  )
}
