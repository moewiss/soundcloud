import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function AddToPlaylistModal({ trackId, onClose }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      const data = await api.getPlaylists()
      setPlaylists(Array.isArray(data) ? data : (data?.data || []))
    } catch (error) {
      toast.error('Failed to load playlists')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToPlaylist = async (playlistId) => {
    try {
      await api.addToPlaylist(playlistId, trackId)
      toast.success('Added to playlist!')
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to playlist')
    }
  }

  const handleCreateAndAdd = async (e) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) return

    setCreating(true)
    try {
      const result = await api.createPlaylist({ name: newPlaylistName, is_public: true })
      const playlistId = result.playlist?.id || result.id
      await api.addToPlaylist(playlistId, trackId)
      toast.success('Playlist created and track added!')
      onClose()
    } catch (error) {
      toast.error('Failed to create playlist')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="sp-modal-header">
          <h2 className="sp-modal-title">Add to Playlist</h2>
          <button className="sp-btn-icon" onClick={onClose} style={{ borderRadius: '50%', background: 'rgba(142,142,147,0.1)', border: 'none' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {!showCreateForm ? (
          <>
            {/* Create New Playlist Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="sp-btn sp-btn-primary"
              style={{ width: '100%', marginBottom: '16px', justifyContent: 'center' }}
            >
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
              Create New Playlist
            </button>

            {/* Playlist List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--sp-text-sub)' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px', marginBottom: '8px', display: 'block' }}></i>
                Loading playlists...
              </div>
            ) : playlists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--sp-text-muted)', fontSize: '14px' }}>
                No playlists yet. Create one above!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                {playlists.map(playlist => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '0.5px solid rgba(60,60,67,0.06)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s',
                      width: '100%',
                      color: 'var(--sp-white)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sp-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '4px',
                      background: 'var(--sp-bg-highlight)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {playlist.cover_url ? (
                        <img src={playlist.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <i className="fas fa-music" style={{ color: 'var(--sp-text-muted)', fontSize: '14px' }}></i>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 500,
                        fontSize: '14px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '2px'
                      }}>
                        {playlist.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--sp-text-muted)' }}>
                        {playlist.tracks_count || 0} tracks
                      </div>
                    </div>
                    <i className="fas fa-plus" style={{ color: 'var(--sp-text-muted)', fontSize: '12px' }}></i>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleCreateAndAdd}>
            <div className="sp-form-group">
              <label className="sp-form-label">Playlist name</label>
              <input
                type="text"
                className="sp-form-input"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Enter playlist name"
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                className="sp-btn sp-btn-primary"
                disabled={creating || !newPlaylistName.trim()}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {creating ? (
                  <><i className="fas fa-spinner fa-spin"></i> Creating...</>
                ) : (
                  'Create & Add'
                )}
              </button>
              <button
                type="button"
                className="sp-btn sp-btn-ghost"
                onClick={() => { setShowCreateForm(false); setNewPlaylistName('') }}
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
