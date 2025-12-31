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
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Add to Playlist</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            ×
          </button>
        </div>

        {!showCreateForm ? (
          <>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              <i className="fas fa-plus"></i> Create New Playlist
            </button>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
              </div>
            ) : playlists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                No playlists yet. Create one!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {playlists.map(playlist => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--primary-soft)'}
                    onMouseLeave={(e) => e.target.style.background = 'var(--bg-secondary)'}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{playlist.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {playlist.tracks_count || 0} tracks
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleCreateAndAdd}>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                marginBottom: '12px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                disabled={creating || !newPlaylistName.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: creating ? 'wait' : 'pointer',
                  opacity: creating || !newPlaylistName.trim() ? 0.5 : 1
                }}
              >
                {creating ? 'Creating...' : 'Create & Add'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '12px 20px',
                  background: 'var(--bg-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

