import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'

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
      toast.error('Failed')
    }
  }

  const handlePlayPlaylist = (playlist) => {
    if (playlist.tracks?.length > 0) {
      playTrack(playlist.tracks[0])
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading playlists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '5px', color: 'var(--text-primary)' }}>Playlists</h1>
          <p style={{ color: 'var(--text-muted)' }}>Your curated collections</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <i className="fas fa-plus"></i> Create Playlist
        </button>
      </div>

      {/* Create Playlist Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-white)',
            padding: '30px',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', color: 'var(--text-primary)' }}>Create New Playlist</h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist}>
              <div className="form-group">
                <label className="form-label">Playlist Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPlaylist.name}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                  placeholder="Give your playlist a name"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-textarea"
                  value={newPlaylist.description}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                  placeholder="Add an optional description"
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-list"></i>
          <h3>No playlists yet</h3>
          <p>Create your first playlist to organize your favorite tracks</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <i className="fas fa-plus"></i> Create Playlist
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {playlists.map(playlist => (
            <div
              key={playlist.id}
              style={{
                background: 'var(--bg-white)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                border: '1px solid var(--border-light)'
              }}
              onClick={() => navigate(`/playlists/${playlist.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Cover */}
              <div style={{
                height: '200px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {playlist.cover_url ? (
                  <img src={playlist.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <i className="fas fa-music" style={{ fontSize: '60px', opacity: 0.5, color: 'white' }}></i>
                )}

                {/* Play Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(playlist); }}
                  style={{
                    position: 'absolute',
                    bottom: '15px',
                    right: '15px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                >
                  <i className="fas fa-play" style={{ marginLeft: '2px' }}></i>
                </button>
              </div>

              {/* Info */}
              <div style={{ padding: '15px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                  {playlist.name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '10px' }}>
                  {playlist.tracks_count || 0} tracks
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="action-btn" onClick={(e) => { e.stopPropagation(); }}>
                    <i className="fas fa-heart"></i>
                  </button>
                  <button className="action-btn" onClick={(e) => { e.stopPropagation(); }}>
                    <i className="fas fa-share"></i>
                  </button>
                  <button 
                    className="action-btn" 
                    onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(playlist.id); }}
                    style={{ marginLeft: 'auto' }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
