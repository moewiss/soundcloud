import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { usePlayer } from '../context/PlayerContext'
import { copyToClipboard } from '../utils/clipboard'
import { Play, Pause, Share2, Trash2, Music, Loader2, X, Heart, Plus, Search, Clock, GripVertical, Repeat2 } from 'lucide-react'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import TrackMenu from '../components/TrackMenu'

const fmtDur = (d) => { if (!d) return '0:00'; if (typeof d === 'string' && d.includes(':')) return d; return `${Math.floor(d/60)}:${String(Math.floor(d%60)).padStart(2,'0')}` }
const fmtCount = (n) => { if (!n && n !== 0) return '0'; if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`; return String(n) }

export default function PlaylistDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const [playlist, setPlaylist] = useState(null)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [likedIds, setLikedIds] = useState(new Set())
  const [plLiked, setPlLiked] = useState(false)
  const [plReposted, setPlReposted] = useState(false)
  const [plLikesCount, setPlLikesCount] = useState(0)
  const [plRepostsCount, setPlRepostsCount] = useState(0)
  const [repostedIds, setRepostedIds] = useState(new Set())
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null)
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isOwner = user && playlist && user.id === playlist.user_id

  useEffect(() => { fetchPlaylist() }, [id])
  useEffect(() => {
    if (user) {
      api.getLikedTracks().then(t => setLikedIds(new Set((Array.isArray(t) ? t : []).map(x => (x.track || x).id)))).catch(() => {})
    }
  }, [])

  const fetchPlaylist = async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.getPlaylist(id)
      setPlaylist(data); setTracks(data.tracks || [])
      setPlLiked(data.is_liked || false)
      setPlReposted(data.is_reposted || false)
      setPlLikesCount(data.likes_count || 0)
      setPlRepostsCount(data.reposts_count || 0)
    } catch { setError('Failed to load playlist') }
    finally { setLoading(false) }
  }

  const handlePlaylistLike = async () => {
    if (!user) { toast.error('Please log in'); return }
    const was = plLiked
    setPlLiked(!was); setPlLikesCount(p => was ? p - 1 : p + 1)
    try {
      const res = await api.togglePlaylistLike(id)
      setPlLiked(res.is_liked); setPlLikesCount(res.likes_count)
    } catch { setPlLiked(was); setPlLikesCount(p => was ? p + 1 : p - 1); toast.error('Failed') }
  }

  const handlePlaylistRepost = async () => {
    if (!user) { toast.error('Please log in'); return }
    const was = plReposted
    setPlReposted(!was); setPlRepostsCount(p => was ? p - 1 : p + 1)
    toast.success(was ? 'Repost removed' : 'Reposted')
    try {
      const res = await api.togglePlaylistRepost(id)
      setPlReposted(res.is_reposted); setPlRepostsCount(res.reposts_count)
    } catch { setPlReposted(was); setPlRepostsCount(p => was ? p + 1 : p - 1); toast.error('Failed') }
  }

  const handleTrackRepost = async (trackId, e) => {
    e.stopPropagation()
    if (!user) { toast.error('Please log in'); return }
    const was = repostedIds.has(trackId)
    setRepostedIds(prev => { const n = new Set(prev); was ? n.delete(trackId) : n.add(trackId); return n })
    toast.success(was ? 'Repost removed' : 'Reposted')
    try { const res = await api.toggleRepost(trackId); if (res.is_reposted !== undefined) setRepostedIds(prev => { const n = new Set(prev); res.is_reposted ? n.add(trackId) : n.delete(trackId); return n }) }
    catch { setRepostedIds(prev => { const n = new Set(prev); was ? n.add(trackId) : n.delete(trackId); return n }) }
  }

  const handleTrackShare = (trackId, e) => {
    e.stopPropagation()
    copyToClipboard(`${window.location.origin}/tracks/${trackId}`)
    toast.success('Link copied')
  }

  const handlePlay = (track, e) => {
    e?.stopPropagation()
    if (!track) return
    if (currentTrack?.id === track.id) togglePlay()
    else playTrack(track, tracks)
  }

  const handlePlayAll = () => { if (tracks.length > 0) handlePlay(tracks[0]) }

  const handleRemoveTrack = async (trackId, e) => {
    e?.stopPropagation()
    if (!isOwner) return
    try { await api.removeFromPlaylist(id, trackId); setTracks(prev => prev.filter(t => t.id !== trackId)); toast.success('Track removed') }
    catch { toast.error('Failed to remove track') }
  }

  const handleDeletePlaylist = async () => {
    try { await api.deletePlaylist(id); toast.success('Playlist deleted'); navigate('/library') }
    catch { toast.error('Failed to delete playlist') }
  }

  const handleLike = async (trackId, e) => {
    e.stopPropagation()
    if (!user) { toast.error('Please log in'); return }
    const was = likedIds.has(trackId)
    setLikedIds(prev => { const n = new Set(prev); was ? n.delete(trackId) : n.add(trackId); return n })
    try { const res = await api.toggleLike(trackId); if (res.is_liked !== undefined) setLikedIds(prev => { const n = new Set(prev); res.is_liked ? n.add(trackId) : n.delete(trackId); return n }) }
    catch { setLikedIds(prev => { const n = new Set(prev); was ? n.add(trackId) : n.delete(trackId); return n }) }
  }

  const handleShare = () => { copyToClipboard(`${window.location.origin}/playlists/${id}`); toast.success('Link copied!') }

  /* ── Drag & Drop reorder ── */
  const handleDragStart = (i) => { setDragIdx(i) }
  const handleDragOver = (e, i) => { e.preventDefault(); if (i !== overIdx) setOverIdx(i) }
  const handleDragEnd = () => {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const reordered = [...tracks]
      const [moved] = reordered.splice(dragIdx, 1)
      reordered.splice(overIdx, 0, moved)
      setTracks(reordered)
      // Save to backend
      api.reorderPlaylistTracks(id, reordered.map(t => t.id)).catch(() => toast.error('Failed to save order'))
    }
    setDragIdx(null)
    setOverIdx(null)
  }

  // Touch drag support
  const touchState = useRef({ idx: null, startY: 0, el: null })
  const listRef = useRef(null)

  const handleTouchStart = (e, i) => {
    const touch = e.touches[0]
    touchState.current = { idx: i, startY: touch.clientY, el: e.currentTarget }
    setDragIdx(i)
  }
  const handleTouchMove = useCallback((e) => {
    if (dragIdx === null || !listRef.current) return
    const touch = e.touches[0]
    const rows = listRef.current.querySelectorAll('.pld-row')
    for (let j = 0; j < rows.length; j++) {
      const rect = rows[j].getBoundingClientRect()
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        setOverIdx(j)
        break
      }
    }
  }, [dragIdx])
  const handleTouchEnd = useCallback(() => { handleDragEnd() }, [dragIdx, overIdx, tracks])

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration_seconds || t.duration || 0), 0)
  const isThisPlaying = currentTrack && tracks.some(t => t.id === currentTrack.id) && isPlaying

  /* ── Loading ── */
  if (loading) return (
    <div className="pld-page"><div className="pld-loading"><Loader2 size={24} className="up-spin" /><span>Loading playlist...</span></div></div>
  )

  if (error || !playlist) return (
    <div className="pld-page">
      <div className="pld-empty">
        <Music size={48} style={{ color: 'var(--sp-text-muted)', marginBottom: 16 }} />
        <p>{error || 'Playlist not found'}</p>
        <button className="up-showmore" onClick={() => navigate('/library')} style={{ marginTop: 16 }}>Back to Library</button>
      </div>
    </div>
  )

  return (
    <div className="pld-page">
      {/* ── Hero ── */}
      <div className="pld-hero">
        <div className="pld-hero-bg" />
        <div className="pld-hero-content">
          <div className="pld-cover">
            {playlist.cover_url ? (
              <img src={playlist.cover_url} alt="" />
            ) : tracks.length >= 4 ? (
              <div className="pld-mosaic">
                {tracks.slice(0, 4).map((t, i) => (
                  <div key={i}>{t.cover_url ? <img src={t.cover_url} alt="" /> : <div className="pld-mosaic-empty"><Music size={16} /></div>}</div>
                ))}
              </div>
            ) : (
              <div className="pld-cover-empty"><Music size={48} /></div>
            )}
          </div>
          <div className="pld-info">
            <span className="pld-label">Playlist</span>
            <h1 className="pld-title">{playlist.name}</h1>
            {playlist.description && <p className="pld-desc">{playlist.description}</p>}
            <div className="pld-meta">
              <Link to={`/users/${playlist.user_id}`} className="pld-meta-author">{playlist.user?.name || 'Unknown'}</Link>
              <span className="pld-meta-dot" />
              <span>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</span>
              {totalDuration > 0 && <><span className="pld-meta-dot" /><span>{Math.floor(totalDuration / 60)} min</span></>}
              {plLikesCount > 0 && <><span className="pld-meta-dot" /><span>{fmtCount(plLikesCount)} likes</span></>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="pld-actions">
        {tracks.length > 0 && (
          <button className="pld-play-btn" onClick={handlePlayAll}>
            {isThisPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
          </button>
        )}
        <button className={`pld-action pld-action--toggle ${plLiked ? 'active' : ''}`} onClick={handlePlaylistLike} title={plLiked ? 'Unlike' : 'Like'}>
          <Heart size={16} fill={plLiked ? 'currentColor' : 'none'} />
          {plLikesCount > 0 && <span className="pld-action-count">{fmtCount(plLikesCount)}</span>}
        </button>
        <button className={`pld-action pld-action--toggle ${plReposted ? 'active' : ''}`} onClick={handlePlaylistRepost} title={plReposted ? 'Remove repost' : 'Repost'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
          {plRepostsCount > 0 && <span className="pld-action-count">{fmtCount(plRepostsCount)}</span>}
        </button>
        <button className="pld-action" onClick={handleShare} title="Share"><Share2 size={16} /></button>
        {isOwner && <button className="pld-action pld-action--danger" onClick={() => setShowDeleteConfirm(true)} title="Delete"><Trash2 size={16} /></button>}
      </div>

      {/* ── Track List ── */}
      <div className="pld-content">
        {tracks.length === 0 ? (
          <div className="pld-empty">
            <Music size={32} style={{ color: 'var(--sp-text-muted)', marginBottom: 8 }} />
            <p>No tracks in this playlist</p>
            {isOwner && <button className="up-showmore" onClick={() => navigate('/search')} style={{ marginTop: 16 }}><Search size={14} /> Find tracks</button>}
          </div>
        ) : (
          <>
            {/* Tracks */}
            <div className="up-tracklist" ref={listRef} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
              {tracks.map((track, i) => {
                const playing = currentTrack?.id === track.id && isPlaying
                const isCurrent = currentTrack?.id === track.id
                const liked = likedIds.has(track.id)
                const reposted = repostedIds.has(track.id)
                const isDragging = dragIdx === i
                const isOver = overIdx === i && dragIdx !== null && dragIdx !== i
                return (
                  <div key={track.id}
                    className={`up-track${playing ? ' playing' : ''}${isDragging ? ' pld-dragging' : ''}${isOver ? ' pld-drag-over' : ''}`}
                    draggable={isOwner}
                    onDragStart={() => isOwner && handleDragStart(i)}
                    onDragOver={e => isOwner && handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    onClick={() => navigate(`/tracks/${track.id}`)}>
                    <div className="up-track-left">
                      {isOwner && (
                        <div className="pld-col-grip" onTouchStart={e => handleTouchStart(e, i)} onClick={e => e.stopPropagation()}>
                          <GripVertical size={14} />
                        </div>
                      )}
                      <span className="up-track-num" onClick={e => handlePlay(track, e)}>
                        {playing ? <span className="up-track-eq"><span /><span /><span /></span> : i + 1}
                      </span>
                      <div className="up-track-thumb" onClick={e => handlePlay(track, e)}>
                        {track.cover_url ? <img src={track.cover_url} alt="" /> : <div className="up-track-thumb-placeholder"><Music size={16} /></div>}
                        <div className="up-track-thumb-overlay">{playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 1 }} />}</div>
                      </div>
                      <div className="up-track-info">
                        <span className={`up-track-title${isCurrent ? ' active' : ''}`}>{track.title}</span>
                        <Link to={`/users/${track.user_id || track.user?.id}`} className="up-track-artist" onClick={e => e.stopPropagation()} style={{ textDecoration: 'none' }}>{track.user?.name || 'Unknown'}</Link>
                        <span className="up-track-plays-sub">{fmtCount(track.plays_count || track.plays || 0)} plays</span>
                      </div>
                    </div>
                    <div className="up-track-right" onClick={e => e.stopPropagation()}>
                      <button className={`up-act${liked ? ' up-act--on' : ''}`} onClick={e => handleLike(track.id, e)} title={liked ? 'Unlike' : 'Like'}><Heart size={15} fill={liked ? 'currentColor' : 'none'} /></button>
                      <button className={`up-act${reposted ? ' up-act--on' : ''}`} onClick={e => handleTrackRepost(track.id, e)} title="Repost"><Repeat2 size={15} /></button>
                      <button className="up-act" onClick={e => { e.stopPropagation(); setPlaylistModalTrack(track) }} title="Save"><Plus size={15} /></button>
                      <button className="up-act" onClick={e => handleTrackShare(track.id, e)} title="Share"><Share2 size={15} /></button>
                      {isOwner && <button className="up-act" style={{ color: 'var(--sp-text-muted)' }} onClick={e => handleRemoveTrack(track.id, e)} title="Remove"><X size={15} /></button>}
                      <TrackMenu
                        track={track}
                        trackList={tracks}
                        onAddToPlaylist={(t) => setPlaylistModalTrack(t)}
                        onLike={(id, e) => handleLike(id, e)}
                        onRepost={(id, e) => handleTrackRepost(id, e)}
                        isLiked={liked}
                        isReposted={reposted}
                      />
                      <span className="up-track-duration">{fmtDur(track.duration || track.duration_seconds)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Delete Modal ── */}
      {showDeleteConfirm && (
        <div className="pld-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="pld-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Playlist?</h3>
            <p>Delete <strong>"{playlist.name}"</strong>? This can't be undone.</p>
            <div className="pld-modal-btns">
              <button className="pld-modal-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="pld-modal-delete" onClick={handleDeletePlaylist}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {playlistModalTrack && <AddToPlaylistModal track={playlistModalTrack} onClose={() => setPlaylistModalTrack(null)} />}
    </div>
  )
}
