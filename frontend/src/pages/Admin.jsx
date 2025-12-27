import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function Admin() {
  const navigate = useNavigate()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 })
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    // Check if user is admin
    if (!user.is_admin) {
      toast.error('Access denied. Admins only.')
      navigate('/')
      return
    }
    
    fetchTracks()
    fetchStats()
  }, [filter])

  const fetchTracks = async () => {
    try {
      setLoading(true)
      const data = filter === 'pending' 
        ? await api.getPendingTracks()
        : await api.getAdminTracks()
      
      const trackList = Array.isArray(data) ? data : (data?.data || [])
      const filteredTracks = filter === 'all' ? trackList : trackList.filter(t => t.status === filter)
      setTracks(filteredTracks)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load tracks')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await api.getAdminTracks()
      const trackList = Array.isArray(data) ? data : (data?.data || [])
      setStats({
        pending: trackList.filter(t => t.status === 'pending').length,
        approved: trackList.filter(t => t.status === 'approved').length,
        rejected: trackList.filter(t => t.status === 'rejected').length,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleApprove = async (trackId) => {
    try {
      await api.approveTrack(trackId)
      toast.success('Track approved! ✅')
      fetchTracks()
      fetchStats()
    } catch (error) {
      toast.error('Failed to approve track')
    }
  }

  const handleReject = async (trackId) => {
    if (!confirm('Are you sure you want to reject this track?')) return
    
    try {
      await api.rejectTrack(trackId)
      toast.success('Track rejected')
      fetchTracks()
      fetchStats()
    } catch (error) {
      toast.error('Failed to reject track')
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  return (
    <div className="page">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <i className="fas fa-shield-halved" style={{ color: 'var(--primary)' }}></i>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage and moderate uploaded tracks</p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            border: filter === 'pending' ? '3px solid white' : 'none'
          }}
          onClick={() => setFilter('pending')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>⏳ Pending Review</div>
            <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.pending}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            border: filter === 'approved' ? '3px solid white' : 'none'
          }}
          onClick={() => setFilter('approved')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>✅ Approved</div>
            <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.approved}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            border: filter === 'rejected' ? '3px solid white' : 'none'
          }}
          onClick={() => setFilter('rejected')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>❌ Rejected</div>
            <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.rejected}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            border: filter === 'all' ? '3px solid white' : 'none'
          }}
          onClick={() => setFilter('all')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>📊 Total Tracks</div>
            <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.pending + stats.approved + stats.rejected}</div>
          </div>
        </div>

        {/* Filter Info */}
        <div style={{ 
          padding: '15px 20px', 
          background: 'var(--bg-secondary)', 
          borderRadius: '12px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-filter" style={{ color: 'var(--primary)' }}></i>
            <span style={{ fontWeight: '600' }}>
              Showing: <span style={{ color: 'var(--primary)' }}>{filter.charAt(0).toUpperCase() + filter.slice(1)}</span> tracks
            </span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
          </span>
        </div>

        {/* Tracks List */}
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading tracks...</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No {filter} tracks</h3>
            <p>There are no tracks with status: {filter}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {tracks.map(track => (
              <div 
                key={track.id}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid var(--border-light)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  {/* Track Cover */}
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {track.cover_url ? (
                      <img src={track.cover_url} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className="fas fa-music" style={{ fontSize: '40px', color: 'white', opacity: 0.5 }}></i>
                    )}
                  </div>

                  {/* Track Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                          {track.title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            <i className="fas fa-user"></i> {track.user?.name || 'Unknown'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            <i className="fas fa-clock"></i> {formatDate(track.created_at)}
                          </span>
                          {track.category && (
                            <span style={{
                              background: 'var(--primary-soft)',
                              color: 'var(--primary)',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {track.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        background: 
                          track.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' :
                          track.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' :
                          'rgba(245, 158, 11, 0.1)',
                        color:
                          track.status === 'approved' ? '#10b981' :
                          track.status === 'rejected' ? '#ef4444' :
                          '#f59e0b'
                      }}>
                        {track.status === 'approved' && '✅ Approved'}
                        {track.status === 'rejected' && '❌ Rejected'}
                        {track.status === 'pending' && '⏳ Pending'}
                      </div>
                    </div>

                    {track.description && (
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        marginBottom: '12px',
                        fontSize: '14px',
                        lineHeight: 1.6
                      }}>
                        {track.description}
                      </p>
                    )}

                    {/* Track Stats */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '20px', 
                      marginBottom: '16px',
                      padding: '12px',
                      background: 'var(--bg-primary)',
                      borderRadius: '8px'
                    }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        <i className="fas fa-play"></i> {track.plays_count || 0} plays
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        <i className="fas fa-heart"></i> {track.likes_count || 0} likes
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        <i className="fas fa-file-audio"></i> {formatFileSize(track.file_size)}
                      </span>
                      {track.duration && (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          <i className="fas fa-clock"></i> {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {track.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          className="btn"
                          onClick={() => handleApprove(track.id)}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <i className="fas fa-check"></i>
                          Approve Track
                        </button>
                        <button 
                          className="btn"
                          onClick={() => handleReject(track.id)}
                          style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <i className="fas fa-times"></i>
                          Reject Track
                        </button>
                        <button 
                          className="btn"
                          onClick={() => navigate(`/tracks/${track.id}`)}
                          style={{
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-medium)',
                            padding: '10px 24px'
                          }}
                        >
                          <i className="fas fa-eye"></i> View Details
                        </button>
                      </div>
                    )}

                    {track.status !== 'pending' && (
                      <button 
                        className="btn"
                        onClick={() => navigate(`/tracks/${track.id}`)}
                        style={{
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-medium)',
                          padding: '10px 20px'
                        }}
                      >
                        <i className="fas fa-eye"></i> View Track
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

