import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'
import { copyToClipboard } from '../utils/clipboard'

export default function Playlists() {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' })
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const navigate = useNavigate()

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      const data = await api.getPlaylists()
      setPlaylists(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
      setPlaylists([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlaylist = async (e) => {
    e.preventDefault()
    if (!newPlaylist.name.trim()) {
      toast.error('Please enter a name')
      return
    }

    try {
      await api.createPlaylist(newPlaylist)
      toast.success('Playlist created!')
      setShowCreate(false)
      setNewPlaylist({ name: '', description: '' })
      fetchPlaylists()
    } catch (error) {
      toast.error('Failed to create playlist')
    }
  }

  const handleDeletePlaylist = async (id) => {
    if (!confirm('Delete this playlist?')) return
    try {
      await api.deletePlaylist(id)
      toast.success('Playlist deleted')
      fetchPlaylists()
    } catch (error) {
      toast.error('Failed to delete playlist')
    }
  }

  const handlePlayPlaylist = (playlist) => {
    if (playlist.tracks?.length > 0) {
      playTrack(playlist.tracks[0])
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center', color: 'var(--sp-text-sub)' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '12px', display: 'block' }}></i>
          Loading playlists...
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--sp-white)', marginBottom: '4px' }}>
            Playlists
          </h1>
          <p style={{ color: 'var(--sp-text-sub)', fontSize: '14px', fontWeight: 500, letterSpacing: '-0.01em' }}>Your curated collections</p>
        </div>
        <button className="sp-btn sp-btn-primary" onClick={() => setShowCreate(true)}>
          <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Create Playlist
        </button>
      </div>

      {/* Create Playlist Modal */}
      {showCreate && (
        <div className="sp-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '20px' }}>
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Create New Playlist</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="sp-btn-icon"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist}>
              <div className="sp-form-group">
                <label className="sp-form-label">Playlist Title *</label>
                <input
                  type="text"
                  className="sp-form-input"
                  value={newPlaylist.name}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                  placeholder="Give your playlist a name"
                  autoFocus
                />
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Description (optional)</label>
                <textarea
                  className="sp-form-textarea"
                  value={newPlaylist.description}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                  placeholder="Add an optional description"
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="sp-btn sp-btn-ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="sp-btn sp-btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="fas fa-list" style={{ fontSize: '48px', color: 'var(--sp-text-muted)', marginBottom: '16px', display: 'block' }}></i>
          <h3 style={{ color: 'var(--sp-white)', fontSize: '18px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.01em' }}>No playlists yet</h3>
          <p style={{ color: 'var(--sp-text-sub)', fontSize: '14px', marginBottom: '20px', fontWeight: 500, letterSpacing: '-0.01em' }}>
            Create your first playlist to organize your favorite tracks
          </p>
          <button className="sp-btn sp-btn-primary" onClick={() => setShowCreate(true)}>
            <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Create Playlist
          </button>
        </div>
      ) : (
        <div className="sp-card-grid">
          {playlists.map(playlist => (
            <div
              key={playlist.id}
              className="sp-card"
              onClick={() => navigate(`/playlists/${playlist.id}`)}
            >
              {/* Cover */}
              <div className="sp-card-img">
                {playlist.cover_url ? (
                  <img src={playlist.cover_url} alt={playlist.name} />
                ) : (
                  <i className="fas fa-music"></i>
                )}
                <button
                  className="sp-card-play"
                  onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(playlist) }}
                >
                  <i className="fas fa-play"></i>
                </button>
              </div>

              {/* Info */}
              <div className="sp-card-title">{playlist.name}</div>
              <div className="sp-card-sub">
                {playlist.tracks_count || 0} tracks
              </div>

              {/* Delete action */}
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button
                  className="sp-btn-icon"
                  style={{ fontSize: '12px' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(`${window.location.origin}/playlists/${playlist.id}`)
                    toast.success('Link copied!')
                  }}
                >
                  <i className="fas fa-share"></i>
                </button>
                <button
                  className="sp-btn-icon"
                  style={{ fontSize: '12px' }}
                  onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(playlist.id) }}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
