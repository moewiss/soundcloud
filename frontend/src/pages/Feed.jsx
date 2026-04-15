import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'

export default function Feed() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const navigate = useNavigate()

  useEffect(() => { fetchFeed() }, [])

  const fetchFeed = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // Authenticated: get personalized feed from followed artists
        const data = await api.getFeed()
        setTracks(Array.isArray(data) ? data : (data?.data || []))
      } else {
        // Not logged in: show latest tracks
        const data = await api.getTracks()
        setTracks(Array.isArray(data) ? data : (data?.data || []))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handlePlay = (track) => {
    if (currentTrack?.id === track.id) togglePlay()
    else playTrack(track, tracks)
  }

  const handleLike = async (trackId, e) => {
    e.stopPropagation()
    try {
      const r = await api.toggleLike(trackId)
      setTracks(p => p.map(t => t.id === trackId ? { ...t, is_liked: r.is_liked, likes_count: r.likes_count } : t))
      toast.success(r.is_liked ? 'Added to Liked Songs' : 'Removed')
    } catch { toast.error('Log in to like songs') }
  }

  if (loading) return <div className="sp-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading feed...</p></div>

  return (
    <div className="sp-page">
      <h1 className="sp-section-title" style={{ marginBottom: '8px' }}>Your Feed</h1>
      <p style={{ color: 'var(--sp-text-sub)', marginBottom: '24px', fontWeight: 500, letterSpacing: '-0.01em' }}>Latest from artists you follow</p>

      {tracks.length === 0 ? (
        <div className="sp-empty">
          <i className="fas fa-podcast"></i>
          <h3>Your feed is empty</h3>
          <p>Follow artists to see their tracks here</p>
          <button className="sp-btn sp-btn-primary" onClick={() => navigate('/search')}>Discover</button>
        </div>
      ) : (
        <div className="sp-track-list">
          <div className="sp-track-list-header">
            <span>#</span><span>Title</span><span>Category</span><span><i className="fas fa-clock"></i></span>
          </div>
          {tracks.map((track, i) => (
            <div key={track.id} className="sp-track-row" onClick={() => navigate(`/tracks/${track.id}`)}>
              <div className="sp-track-num">
                <span className="num-text">{i + 1}</span>
                <span className="play-icon" onClick={(e) => { e.stopPropagation(); handlePlay(track) }}>
                  <i className={`fas fa-${currentTrack?.id === track.id && isPlaying ? 'pause' : 'play'}`}></i>
                </span>
              </div>
              <div className="sp-track-main">
                <div className="sp-track-cover">
                  {track.cover_url ? <img src={track.cover_url} alt="" /> : <i className="fas fa-music"></i>}
                </div>
                <div className="sp-track-name-col">
                  <div className={`sp-track-title ${currentTrack?.id === track.id ? 'playing' : ''}`}>{track.title}</div>
                  <div className="sp-track-artist">
                    <Link to={`/users/${track.user?.id}`} onClick={e => e.stopPropagation()}>{track.user?.name}</Link>
                    <span style={{ color: 'var(--sp-text-muted)', margin: '0 4px' }}>·</span>
                    <span style={{ color: 'var(--sp-text-muted)' }}>{new Date(track.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="sp-track-album">{track.category || '-'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
                <button className={`sp-btn-icon ${track.is_liked ? 'active' : ''}`} onClick={(e) => handleLike(track.id, e)} style={{ opacity: track.is_liked ? 1 : undefined }}>
                  <i className={`${track.is_liked ? 'fas' : 'far'} fa-heart`} style={{ fontSize: '0.85rem' }}></i>
                </button>
                <span className="sp-track-duration">{track.duration || '0:00'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
