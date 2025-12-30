import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'

export default function Home() {
  const [tracks, setTracks] = useState([])
  const [trendingTracks, setTrendingTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const categories = [
    { id: 1, name: 'Quran', icon: 'fa-book-quran', color: '#0D7377' },
    { id: 2, name: 'Nasheeds', icon: 'fa-music', color: '#14919B' },
    { id: 3, name: 'Lectures', icon: 'fa-microphone', color: '#C9A227' },
    { id: 4, name: 'Podcasts', icon: 'fa-podcast', color: '#0A5C5F' },
    { id: 5, name: 'Duas', icon: 'fa-hands-praying', color: '#14919B' },
    { id: 6, name: 'Stories', icon: 'fa-book-open', color: '#A68523' }
  ]

  const featuredPlaylists = [
    { id: 1, name: 'Top 50 Nasheeds', tracks: 50, gradient: 'linear-gradient(135deg, #0D7377 0%, #14919B 100%)' },
    { id: 2, name: 'Ramadan Collection', tracks: 30, gradient: 'linear-gradient(135deg, #C9A227 0%, #E8D48A 100%)' },
    { id: 3, name: 'Best of Quran', tracks: 114, gradient: 'linear-gradient(135deg, #0A5C5F 0%, #0D7377 100%)' },
    { id: 4, name: 'Friday Vibes', tracks: 25, gradient: 'linear-gradient(135deg, #1A2332 0%, #243044 100%)' }
  ]

  useEffect(() => {
    fetchTracks()
  }, [])

  const fetchTracks = async () => {
    try {
      const data = await api.getTracks()
      // Handle different response formats
      const allTracks = Array.isArray(data) ? data : (data?.data || data?.tracks || [])
      setTracks(allTracks.slice(0, 12))
      const sorted = [...allTracks].sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0))
      setTrendingTracks(sorted.slice(0, 6))
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
      await api.toggleLike(trackId)
      fetchTracks()
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            {user.name ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Connect with the Words of Allah'}
          </h1>
          <p className="hero-subtitle">
            Explore thousands of Quran recitations, nasheeds, lectures, and more. 
            Start your spiritual journey today.
          </p>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '16px 32px', fontSize: '15px' }}
              onClick={() => navigate('/search')}
            >
              <i className="fas fa-play"></i> Start Listening
            </button>
            <button 
              className="btn" 
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '16px 32px' }}
              onClick={() => navigate('/upload')}
            >
              <i className="fas fa-upload"></i> Upload Your Track
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            <i className="fas fa-compass"></i>
            Browse Categories
          </h2>
        </div>
        <div className="categories-grid">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="category-card"
              onClick={() => navigate(`/search?q=${cat.name}`)}
            >
              <div className="category-icon" style={{ color: cat.color }}>
                <i className={`fas ${cat.icon}`}></i>
              </div>
              <div className="category-name">{cat.name}</div>
              <div className="category-count">Explore collection</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Playlists */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            <i className="fas fa-star"></i>
            Featured Playlists
          </h2>
          <Link to="/playlists" className="section-link">
            See all <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '22px' }}>
          {featuredPlaylists.map(playlist => (
            <div
              key={playlist.id}
              style={{
                background: playlist.gradient,
                borderRadius: '16px',
                padding: '28px',
                cursor: 'pointer',
                position: 'relative',
                minHeight: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
              }}
              onClick={() => navigate('/playlists')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '50px',
                height: '50px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-play" style={{ color: 'white', fontSize: '18px' }}></i>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: 'white' }}>
                {playlist.name}
              </h3>
              <p style={{ fontSize: '14px', opacity: 0.85, color: 'white' }}>{playlist.tracks} tracks</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Tracks */}
      {trendingTracks.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">
              <i className="fas fa-fire"></i>
              Trending Now
            </h2>
            <Link to="/search" className="section-link">
              See all <i className="fas fa-chevron-right"></i>
            </Link>
          </div>
          <div className="track-grid">
            {trendingTracks.map((track, index) => (
              <div 
                key={track.id} 
                className="track-card"
                onClick={() => navigate(`/tracks/${track.id}`)}
              >
                <div className="track-artwork">
                  {track.cover_url ? (
                    <img src={track.cover_url} alt={track.title} />
                  ) : (
                    <i className="fas fa-music"></i>
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '13px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(13, 115, 119, 0.4)'
                  }}>
                    #{index + 1}
                  </div>
                  <button 
                    className="track-play-btn"
                    onClick={(e) => { e.stopPropagation(); handlePlay(track); }}
                  >
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
        </section>
      )}

      {/* Recently Uploaded */}
      {tracks.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">
              <i className="fas fa-clock"></i>
              Recently Uploaded
            </h2>
            <Link to="/search" className="section-link">
              See all <i className="fas fa-chevron-right"></i>
            </Link>
          </div>
          <div className="feed-list">
            {tracks.slice(0, 4).map(track => (
              <div key={track.id} className="feed-card">
                <div className="feed-header">
                  <div className="feed-user-avatar">
                    {track.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="feed-user-info">
                    <Link to={`/users/${track.user?.id}`} className="feed-user-name">
                      {track.user?.name}
                    </Link>
                    <div className="feed-action-label">
                      posted a track · {new Date(track.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="feed-body">
                  <div className="feed-artwork" onClick={() => navigate(`/tracks/${track.id}`)}>
                    {track.cover_url ? (
                      <img src={track.cover_url} alt={track.title} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <i className="fas fa-music" style={{ fontSize: '50px', color: 'var(--border-medium)' }}></i>
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
                    {track.category && (
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 14px',
                        background: 'var(--primary-soft)',
                        borderRadius: '20px',
                        fontSize: '12px',
                        color: 'var(--primary)',
                        fontWeight: '500',
                        marginBottom: '12px'
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
                      <button className="feed-action-btn">
                        <i className="fas fa-retweet"></i>
                      </button>
                      <button className="feed-action-btn">
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
            ))}
          </div>
        </section>
      )}

      {/* Inspirational Quote */}
      <section className="section">
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-dark-secondary) 100%)',
          borderRadius: '20px',
          padding: '50px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0L60 30L30 60L0 30L30 0z\' fill=\'none\' stroke=\'%230D7377\' stroke-width=\'0.5\' opacity=\'0.2\'/%3E%3C/svg%3E")',
            pointerEvents: 'none'
          }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <i className="fas fa-quote-left" style={{ fontSize: '30px', color: 'var(--accent-gold)', marginBottom: '20px' }}></i>
            <h3 style={{ 
              fontFamily: "'Playfair Display', serif",
              fontSize: '28px',
              marginBottom: '15px',
              lineHeight: 1.5,
              color: 'white'
            }}>
              "Indeed, with hardship comes ease."
            </h3>
            <p style={{ color: 'var(--accent-gold)', fontSize: '14px', fontWeight: '500' }}>
              — Surah Ash-Sharh 94:6
            </p>
          </div>
        </div>
      </section>

      {/* Empty State */}
      {tracks.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-music"></i>
          <h3>No tracks yet</h3>
          <p>Be the first to upload a track!</p>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            <i className="fas fa-upload"></i> Upload Track
          </button>
        </div>
      )}
    </div>
  )
}
