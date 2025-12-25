import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'

export default function TrackDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [track, setTrack] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [relatedTracks, setRelatedTracks] = useState([])
  const { playTrack, currentTrack, isPlaying, togglePlay, progress, duration } = usePlayer()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchTrack()
    fetchComments()
    fetchRelated()
  }, [id])

  const fetchTrack = async () => {
    try {
      const data = await api.getTrack(id)
      setTrack(data)
    } catch (error) {
      toast.error('Track not found')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const data = await api.getComments(id)
      setComments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
      setComments([])
    }
  }

  const fetchRelated = async () => {
    try {
      const data = await api.getTracks()
      setRelatedTracks((data.data || []).slice(0, 5))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handlePlay = () => {
    if (currentTrack?.id === track?.id) {
      togglePlay()
    } else {
      playTrack(track)
    }
  }

  const handleLike = async () => {
    try {
      await api.toggleLike(id)
      // Update track locally for instant feedback
      setTrack(prev => prev ? {
        ...prev,
        is_liked: !prev.is_liked,
        likes_count: prev.is_liked ? Math.max(0, (prev.likes_count || 1) - 1) : (prev.likes_count || 0) + 1
      } : prev)
      toast.success(track.is_liked ? 'Removed from likes' : 'Added to likes')
    } catch (error) {
      console.error('Like error:', error)
      if (error.response?.status === 401) {
        toast.error('Please login to like tracks')
      } else {
        toast.error(error.response?.data?.message || 'Failed to like track')
      }
    }
  }

  const handleFollow = async () => {
    try {
      await api.toggleFollow(track.user?.id)
      fetchTrack()
      toast.success('Updated!')
    } catch (error) {
      toast.error('Failed')
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await api.addComment(id, newComment)
      setNewComment('')
      fetchComments()
      toast.success('Comment added!')
    } catch (error) {
      toast.error('Failed to add comment')
    }
  }

  const formatTime = (sec) => {
    if (!sec) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading track...</p>
        </div>
      </div>
    )
  }

  if (!track) return null

  const isCurrentTrack = currentTrack?.id === track.id
  const progressPercent = isCurrentTrack && duration ? (progress / duration) * 100 : 0

  return (
    <div className="page">
      {/* Track Hero */}
      <div style={{
        background: `linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-dark-secondary) 100%)`,
        borderRadius: 'var(--radius-lg)',
        padding: '30px',
        marginBottom: '30px',
        display: 'flex',
        gap: '30px',
        color: 'var(--text-white)'
      }}>
        {/* Artwork */}
        <div style={{
          width: '300px',
          height: '300px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {track.cover_url ? (
            <img src={track.cover_url} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-dark-secondary)' }}>
              <i className="fas fa-music" style={{ fontSize: '80px', color: 'var(--text-muted)' }}></i>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
            <button
              onClick={handlePlay}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'var(--primary)',
                border: 'none',
                color: 'white',
                fontSize: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'transform 0.2s, background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <i className={`fas fa-${isCurrentTrack && isPlaying ? 'pause' : 'play'}`} style={{ marginLeft: isCurrentTrack && isPlaying ? '0' : '3px' }}></i>
            </button>
            <div>
              <Link to={`/users/${track.user?.id}`} style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                {track.user?.name}
              </Link>
              <h1 style={{ fontSize: '28px', marginTop: '5px', color: 'var(--text-white)' }}>{track.title}</h1>
              <p style={{ color: 'var(--text-light)', fontSize: '13px', marginTop: '5px' }}>
                {new Date(track.created_at).toLocaleDateString()}
                {track.category && <span style={{ 
                  marginLeft: '10px',
                  padding: '3px 10px',
                  background: 'var(--primary)',
                  borderRadius: '3px',
                  fontSize: '11px'
                }}>#{track.category}</span>}
              </p>
            </div>
          </div>

          {/* Waveform */}
          <div 
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-sm)',
              position: 'relative',
              cursor: 'pointer',
              minHeight: '120px'
            }}
            onClick={handlePlay}
          >
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              background: 'rgba(13, 115, 119, 0.4)',
              width: `${progressPercent}%`,
              borderRadius: 'var(--radius-sm)',
              transition: 'width 0.1s'
            }}></div>
            
            {/* Fake waveform bars */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '2px', padding: '10px' }}>
              {Array.from({ length: 80 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    height: `${20 + Math.sin(i * 0.3) * 30 + Math.random() * 20}%`,
                    background: i < (progressPercent * 0.8) ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                    borderRadius: '2px',
                    transition: 'background 0.1s'
                  }}
                />
              ))}
            </div>

            {/* Time */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.7)',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '12px',
              color: 'white'
            }}>
              {formatTime(isCurrentTrack ? progress : 0)}
            </div>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'rgba(0,0,0,0.7)',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '12px',
              color: 'white'
            }}>
              {formatTime(isCurrentTrack ? duration : track.duration || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Actions & Comments */}
      <div style={{ display: 'flex', gap: '30px' }}>
        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
            <button 
              className={`feed-action-btn ${track.is_liked ? 'active' : ''}`} 
              onClick={handleLike}
              style={{ minWidth: '80px' }}
            >
              <i className="fas fa-heart"></i> {track.likes_count || 0}
            </button>
            <button className="feed-action-btn">
              <i className="fas fa-retweet"></i> Repost
            </button>
            <button className="feed-action-btn">
              <i className="fas fa-share"></i> Share
            </button>
            <button className="feed-action-btn">
              <i className="fas fa-link"></i> Copy Link
            </button>
            <button className="feed-action-btn">
              <i className="fas fa-plus"></i> Add to playlist
            </button>
            <button className="feed-action-btn">
              <i className="fas fa-ellipsis-h"></i>
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', color: 'var(--text-muted)', fontSize: '13px', alignItems: 'center' }}>
              <span><i className="fas fa-play"></i> {track.plays_count || 0}</span>
              <span><i className="fas fa-heart"></i> {track.likes_count || 0}</span>
              <span><i className="fas fa-comment"></i> {comments.length}</span>
            </div>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleComment} style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: 'white',
              fontWeight: '600'
            }}>
              {user.name?.charAt(0) || 'U'}
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'var(--bg-white)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </form>

          {/* Comments */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-comment"></i>
                {comments.length} Comments
              </h2>
            </div>

            {comments.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '20px 0' }}>
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {comments.map(comment => (
                  <div key={comment.id} style={{ display: 'flex', gap: '15px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--primary-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'var(--primary)',
                      fontWeight: '600'
                    }}>
                      {comment.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ marginBottom: '5px' }}>
                        <Link to={`/users/${comment.user?.id}`} style={{ fontWeight: '500', marginRight: '10px', color: 'var(--text-primary)' }}>
                          {comment.user?.name}
                        </Link>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)' }}>{comment.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {track.description && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Description</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {track.description}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          {/* Artist Card */}
          <div style={{
            background: 'var(--bg-white)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '600',
                color: 'white'
              }}>
                {track.user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <Link to={`/users/${track.user?.id}`} style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  {track.user?.name}
                </Link>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  {track.user?.tracks_count || 0} tracks
                </div>
              </div>
            </div>
            <button className="btn-follow" onClick={handleFollow} style={{ width: '100%' }}>
              <i className="fas fa-user-plus"></i> Follow
            </button>
          </div>

          {/* Related Tracks */}
          <div style={{
            background: 'var(--bg-white)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--border-light)'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px', color: 'var(--text-primary)' }}>
              Related Tracks
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {relatedTracks.filter(t => t.id !== track.id).slice(0, 3).map(t => (
                <div 
                  key={t.id} 
                  style={{ display: 'flex', gap: '10px', cursor: 'pointer' }}
                  onClick={() => navigate(`/tracks/${t.id}`)}
                >
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {t.cover_url ? (
                      <img src={t.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <i className="fas fa-music" style={{ color: 'var(--text-muted)' }}></i>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {t.user?.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
