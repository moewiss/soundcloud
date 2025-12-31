import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { usePlayer } from '../context/PlayerContext'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import { copyToClipboard } from '../utils/clipboard'

export default function PlaylistDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playTrack } = usePlayer()
  const [playlist, setPlaylist] = useState(null)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isOwner = user.id === playlist?.user_id

  useEffect(() => {
    fetchPlaylist()
  }, [id])

  const fetchPlaylist = async () => {
    try {
      const data = await api.getPlaylist(id)
      setPlaylist(data)
      setTracks(data.tracks || [])
    } catch (error) {
      console.error('Error fetching playlist:', error)
      toast.error('Failed to load playlist')
      navigate('/library')
    } finally {
      setLoading(false)
    }
  }

  const handlePlay = (track) => {
    playTrack(track, tracks)
  }

  const handleRemoveTrack = async (trackId) => {
    if (!isOwner) {
      toast.error('You can only remove tracks from your own playlists')
      return
    }

    try {
      await api.removeFromPlaylist(id, trackId)
      setTracks(prev => prev.filter(t => t.id !== trackId))
      toast.success('Track removed from playlist')
    } catch (error) {
      toast.error('Failed to remove track')
    }
  }

  const handleDeletePlaylist = async () => {
    try {
      await api.deletePlaylist(id)
      toast.success('Playlist deleted')
      navigate('/library')
    } catch (error) {
      toast.error('Failed to delete playlist')
    }
  }

  const handleShare = async () => {
    const playlistUrl = `${window.location.origin}/playlists/${id}`
    try {
      await copyToClipboard(playlistUrl)
      toast.success('Playlist link copied to clipboard!')
    } catch (error) {
      console.error('Copy error:', error)
      toast.error('Failed to copy link')
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading playlist...</p>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="empty-state">
        <i className="fas fa-list"></i>
        <h3>Playlist not found</h3>
        <Link to="/library" className="btn btn-primary">Back to Library</Link>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '40px auto' }}>
      {/* Playlist Header */}
      <div style={{ 
        display: 'flex', 
        gap: '30px', 
        marginBottom: '40px',
        background: 'var(--bg-card)',
        padding: '30px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{
          width: '200px',
          height: '200px',
          background: 'var(--primary-soft)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <i className="fas fa-list" style={{ fontSize: '60px', color: 'var(--primary)' }}></i>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
            Playlist
          </div>
          <h1 style={{ fontSize: '42px', marginBottom: '15px', color: 'var(--text-primary)' }}>
            {playlist.name}
          </h1>
          
          {playlist.description && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              {playlist.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
            <Link to={`/users/${playlist.user_id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'var(--primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {playlist.user?.name?.charAt(0) || 'U'}
              </div>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                {playlist.user?.name || 'Unknown'}
              </span>
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '15px' }}>
            {tracks.length > 0 && (
              <button 
                className="btn btn-primary"
                onClick={() => handlePlay(tracks[0])}
                style={{ padding: '12px 30px', fontSize: '16px', fontWeight: '600' }}
              >
                <i className="fas fa-play"></i> Play All
              </button>
            )}
            
            <button 
              className="btn"
              onClick={handleShare}
              style={{ padding: '12px 20px' }}
            >
              <i className="fas fa-share"></i> Share
            </button>

            {isOwner && (
              <button 
                className="btn"
                onClick={() => setShowDeleteConfirm(true)}
                style={{ padding: '12px 20px', background: '#ff4444', color: 'white' }}
              >
                <i className="fas fa-trash"></i> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tracks List */}
      {tracks.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-music"></i>
          <h3>No tracks in this playlist</h3>
          <p>Add tracks to get started</p>
          {isOwner && (
            <Link to="/library" className="btn btn-primary">Browse Tracks</Link>
          )}
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Tracks</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {tracks.map((track, index) => (
              <div 
                key={track.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px 20px',
                  background: 'var(--bg-card)',
                  transition: 'background 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
              >
                {/* Track Number */}
                <div style={{ 
                  width: '30px', 
                  textAlign: 'center', 
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {index + 1}
                </div>

                {/* Cover */}
                <div 
                  onClick={() => handlePlay(track)}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: track.cover_url ? 'transparent' : 'var(--primary-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  {track.cover_url ? (
                    <img src={track.cover_url} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="fas fa-music" style={{ color: 'var(--primary)', fontSize: '18px' }}></i>
                  )}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                  >
                    <i className="fas fa-play" style={{ color: 'white', fontSize: '16px' }}></i>
                  </div>
                </div>

                {/* Track Info */}
                <div style={{ flex: 1 }} onClick={() => navigate(`/tracks/${track.id}`)}>
                  <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {track.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {track.user?.name || 'Unknown Artist'}
                  </div>
                </div>

                {/* Duration */}
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', width: '60px', textAlign: 'right' }}>
                  {track.duration || '0:00'}
                </div>

                {/* Remove Button (only for owner) */}
                {isOwner && (
                  <button
                    onClick={() => handleRemoveTrack(track.id)}
                    style={{
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#ff444420'
                      e.target.style.color = '#ff4444'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'none'
                      e.target.style.color = 'var(--text-muted)'
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Playlist?</h3>
            <p>Are you sure you want to delete "{playlist.name}"? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={handleDeletePlaylist}
                style={{ background: '#ff4444' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

