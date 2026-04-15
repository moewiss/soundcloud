import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { requireAuth } from '../utils/auth'

const STATUS_STYLE = {
  approved: { bg: 'rgba(26,112,80,0.15)', color: '#1A7050', label: 'Approved', icon: 'fa-check-circle' },
  pending:  { bg: 'rgba(255,149,0,0.15)',  color: '#FF9500', label: 'Pending Review', icon: 'fa-clock' },
  rejected: { bg: 'rgba(255,59,48,0.15)',  color: '#FF3B30', label: 'Rejected', icon: 'fa-times-circle' },
}

export default function MyTracks() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromUpload = location.state?.fromUpload || false

  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!requireAuth(navigate, 'Please login to view your tracks')) return
    loadTracks()
  }, [])

  const loadTracks = async () => {
    setLoading(true)
    try {
      const res = await api.getMyTracks()
      setTracks(Array.isArray(res) ? res : res?.data || [])
    } catch {
      toast.error('Failed to load tracks')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (trackId, e) => {
    e.stopPropagation()
    if (!confirm('Delete this track?')) return
    try {
      await api.deleteTrack(trackId)
      setTracks(prev => prev.filter(t => t.id !== trackId))
      toast.success('Track deleted')
    } catch {
      toast.error('Failed to delete track')
    }
  }

  const approved = tracks.filter(t => t.status === 'approved')
  const pending  = tracks.filter(t => t.status === 'pending')
  const rejected = tracks.filter(t => t.status === 'rejected')

  return (
    <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>

      {/* Success banner after upload */}
      {fromUpload && (
        <div style={{
          background: 'rgba(26,112,80,0.12)',
          border: 'none',
          borderRadius: '20px',
          padding: '20px 24px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <i className="fas fa-check-circle" style={{ fontSize: '28px', color: '#1A7050', flexShrink: 0 }}></i>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--sp-white)', fontSize: '16px', letterSpacing: '-0.01em' }}>Upload successful!</div>
            <div style={{ color: 'var(--sp-text-sub)', fontSize: '14px', marginTop: '2px', letterSpacing: '-0.01em' }}>
              Your track(s) are now live and ready to play.
            </div>
          </div>
          <button
            className="sp-btn sp-btn-primary"
            style={{ marginLeft: 'auto', flexShrink: 0 }}
            onClick={() => navigate('/upload')}
          >
            <i className="fas fa-upload" style={{ marginRight: '8px' }}></i>Upload More
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--sp-white)', marginBottom: '6px' }}>My Tracks</h1>
          <p style={{ color: 'var(--sp-text-sub)', letterSpacing: '-0.01em' }}>{tracks.length} track{tracks.length !== 1 ? 's' : ''} total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="sp-btn" onClick={() => navigate('/promote')} style={{
            background: 'linear-gradient(135deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563))',
            color: '#111', fontWeight: 600, border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
          }}>
            <i className="fas fa-rocket" style={{ marginRight: '8px' }}></i>Promote
          </button>
          {!fromUpload && (
            <button className="sp-btn sp-btn-primary" onClick={() => navigate('/upload')}>
              <i className="fas fa-upload" style={{ marginRight: '8px' }}></i>Upload
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="sp-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading your tracks...</p></div>
      ) : tracks.length === 0 ? (
        <div className="sp-empty">
          <i className="fas fa-music"></i>
          <h3>No tracks yet</h3>
          <p>Start sharing your audio with the world</p>
          <button className="sp-btn sp-btn-primary" onClick={() => navigate('/upload')}>Upload a track</button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
            {[
              { label: 'Approved', count: approved.length, ...STATUS_STYLE.approved },
              { label: 'Pending Review', count: pending.length, ...STATUS_STYLE.pending },
              { label: 'Rejected', count: rejected.length, ...STATUS_STYLE.rejected },
            ].map(s => (
              <div key={s.label} style={{
                background: s.bg,
                border: 'none',
                borderRadius: '20px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <i className={`fas ${s.icon}`} style={{ fontSize: '28px', color: s.color }}></i>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.count}</div>
                  <div style={{ fontSize: '13px', color: 'var(--sp-text-sub)', marginTop: '4px', letterSpacing: '-0.01em' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Track sections */}
          {[
            { title: 'Approved', list: approved, status: 'approved' },
            { title: 'Pending Review', list: pending, status: 'pending' },
            { title: 'Rejected', list: rejected, status: 'rejected' },
          ].filter(section => section.list.length > 0).map(section => (
            <div key={section.status} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <i
                  className={`fas ${STATUS_STYLE[section.status].icon}`}
                  style={{ color: STATUS_STYLE[section.status].color, fontSize: '18px' }}
                ></i>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--sp-white)' }}>{section.title}</h2>
                <span style={{
                  background: STATUS_STYLE[section.status].bg,
                  color: STATUS_STYLE[section.status].color,
                  padding: '2px 10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600
                }}>{section.list.length}</span>
              </div>

              <div className="sp-track-list">
                <div className="sp-track-list-header">
                  <span>#</span>
                  <span>Title</span>
                  <span>Category</span>
                  <span><i className="fas fa-clock"></i></span>
                </div>
                {section.list.map((track, i) => (
                  <div
                    key={track.id}
                    className="sp-track-row"
                    onClick={() => navigate(`/tracks/${track.id}`)}
                  >
                    <div className="sp-track-num">
                      <span className="num-text">{i + 1}</span>
                    </div>
                    <div className="sp-track-main">
                      <div className="sp-track-cover">
                        {track.cover_url
                          ? <img src={track.cover_url} alt="" />
                          : <i className="fas fa-music"></i>}
                      </div>
                      <div className="sp-track-name-col">
                        <div className="sp-track-title">{track.title}</div>
                        <div className="sp-track-artist" style={{ color: STATUS_STYLE[section.status].color, fontSize: '12px' }}>
                          <i className={`fas ${STATUS_STYLE[section.status].icon}`} style={{ marginRight: '4px' }}></i>
                          {STATUS_STYLE[section.status].label}
                        </div>
                      </div>
                    </div>
                    <div className="sp-track-album">{track.category || '-'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
                      <span className="sp-track-duration">{track.duration || '0:00'}</span>
                      <button
                        className="sp-btn-icon"
                        title="Delete track"
                        onClick={(e) => handleDelete(track.id, e)}
                        style={{ color: 'var(--sp-text-muted)' }}
                      >
                        <i className="fas fa-trash" style={{ fontSize: '0.8rem' }}></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
