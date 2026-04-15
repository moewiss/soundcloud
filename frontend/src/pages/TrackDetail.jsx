import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'
import { copyToClipboard } from '../utils/clipboard'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import ShareModal from '../components/ShareModal'
import { requireAuth } from '../utils/auth'
import { Play, Pause, ChevronLeft, Music, Pencil, Check, Heart, Repeat2, Plus, Share2, Trash2, Users, UserCheck, UserPlus, MessageCircle, Loader2, Reply, MicVocal, ListPlus, ListEnd, Download, CheckCircle } from 'lucide-react'
import { cacheTrack, isTrackCached, removeCachedTrack } from '../services/offlineCache'

/* ── Helpers ── */
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
const timeAgo = (d) => {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const dy = Math.floor(h / 24); if (dy < 30) return `${dy}d ago`
  const mo = Math.floor(dy / 30); if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}
const fmtNum = (n) => { if (!n && n !== 0) return '0'; if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`; return n.toString() }
const fmtDur = (s) => { if (!s) return '0:00'; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}` }

const CATEGORY_GRADIENTS = {
  nasheeds:  'linear-gradient(135deg, #512851 0%, #7a3d6a 50%, #9f8e73 100%)',
  quran:     'linear-gradient(135deg, #3b1d50 0%, #512851 50%, #9f8e73 100%)',
  duas:      'linear-gradient(135deg, #5c3a2e 0%, #7a5545 50%, #9f8e73 100%)',
  lectures:  'linear-gradient(135deg, #2e3a5c 0%, #455580 50%, #9f8e73 100%)',
  stories:   'linear-gradient(135deg, #512851 0%, #6b3860 50%, #9f8e73 100%)',
  broadcast: 'linear-gradient(135deg, #5c2e2e 0%, #804545 50%, #9f8e73 100%)',
  podcasts:  'linear-gradient(135deg, #5c2e2e 0%, #804545 50%, #9f8e73 100%)',
}
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #512851 0%, #7a3d6a 50%, #9f8e73 100%)'
function getGradient(t) { return t ? CATEGORY_GRADIENTS[(t.category||'').toLowerCase()] || DEFAULT_GRADIENT : DEFAULT_GRADIENT }

export default function TrackDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [track, setTrack] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [relatedTracks, setRelatedTracks] = useState([])
  const [artistTracks, setArtistTracks] = useState([])
  const [trendingInCategory, setTrendingInCategory] = useState([])
  const [likedIds, setLikedIds] = useState(new Set())
  const [repostedIds, setRepostedIds] = useState(new Set())
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editLyrics, setEditLyrics] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [lyricsExpanded, setLyricsExpanded] = useState(false)
  const [commentsExpanded, setCommentsExpanded] = useState(false)
  const [commentPosting, setCommentPosting] = useState(false)
  const [likeAnim, setLikeAnim] = useState(false)
  const [repostAnim, setRepostAnim] = useState(false)
  const [followAnim, setFollowAnim] = useState(false)
  const [queueAdded, setQueueAdded] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [planFeatures, setPlanFeatures] = useState(null)

  const { playTrack, currentTrack, isPlaying, togglePlay, progress, duration, seek, addToQueue, insertNext } = usePlayer()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  useEffect(() => {
    fetchTrack(); fetchComments()
    if (user) {
      api.getSubscriptionStatus().then(d => setPlanFeatures(d.features)).catch(() => {})
      isTrackCached(parseInt(id)).then(setIsDownloaded).catch(() => {})
    }
  }, [id])
  useEffect(() => { if (track) fetchRelated() }, [track?.id])

  const fetchTrack = async () => { try { setTrack(await api.getTrack(id)) } catch { toast.error('Track not found'); navigate('/') } finally { setLoading(false) } }
  const fetchComments = async () => { try { const d = await api.getComments(id); setComments(Array.isArray(d) ? d : []) } catch { setComments([]) } }
  const fetchRelated = async () => {
    try {
      const [artistData, categoryData, trendingData] = await Promise.all([
        track?.user?.id ? api.getTracks({ user_id: track.user.id, sort: 'popular' }) : Promise.resolve([]),
        track?.category ? api.getTracks({ category: track.category }) : Promise.resolve([]),
        track?.category ? api.getTracks({ category: track.category, sort: 'popular' }) : Promise.resolve([]),
      ])
      const artistAll = Array.isArray(artistData) ? artistData : (artistData?.data || [])
      const catAll = Array.isArray(categoryData) ? categoryData : (categoryData?.data || [])
      const trendAll = Array.isArray(trendingData) ? trendingData : (trendingData?.data || [])
      setArtistTracks(artistAll.filter(t => t.id !== parseInt(id)).slice(0, 6))
      setRelatedTracks(catAll.filter(t => t.id !== parseInt(id) && t.user?.id !== track?.user?.id).slice(0, 6))
      setTrendingInCategory(trendAll.filter(t => t.id !== parseInt(id)).slice(0, 6))
    } catch {}
    // Load user likes/reposts for action buttons
    if (user) {
      try { const lr = await api.getLikedTracks(); setLikedIds(new Set((Array.isArray(lr) ? lr : []).map(t => (t.track || t).id))) } catch {}
      try { const rr = await api.getRepostedTracks(); setRepostedIds(new Set((Array.isArray(rr) ? rr : []).map(t => (t.track || t).id))) } catch {}
    }
  }

  const handleTrackLike = async (trackId, e) => {
    e.stopPropagation()
    if (!user) { toast.error('Please log in'); return }
    const was = likedIds.has(trackId)
    setLikedIds(prev => { const n = new Set(prev); was ? n.delete(trackId) : n.add(trackId); return n })
    try { const res = await api.toggleLike(trackId); if (res.is_liked !== undefined) setLikedIds(prev => { const n = new Set(prev); res.is_liked ? n.add(trackId) : n.delete(trackId); return n }) }
    catch { setLikedIds(prev => { const n = new Set(prev); was ? n.add(trackId) : n.delete(trackId); return n }) }
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

  const isOwner = user && track && (track.user_id === user.id || track.user?.id === user.id || user.is_admin)
  const isAdmin = user?.is_admin
  const startEditing = () => { setEditTitle(track.title); setEditDesc(track.description || ''); setEditLyrics(track.lyrics || ''); setEditCategory(track.category || ''); setIsEditing(true) }
  const handleSaveEdit = async () => { try { await api.updateTrack(track.id, { title: editTitle, description: editDesc, lyrics: editLyrics, category: editCategory }); toast.success('Updated!'); setIsEditing(false); fetchTrack() } catch (e) { toast.error(e.response?.data?.message || 'Failed') } }
  const handlePlay = () => { currentTrack?.id === track?.id ? togglePlay() : playTrack(track) }

  // Optimistic like
  const handleLike = async () => {
    if (!requireAuth(navigate, 'Please login to like tracks')) return
    const was = track.is_liked, prev = track.likes_count || 0
    setTrack(p => p ? { ...p, is_liked: !was, likes_count: was ? Math.max(0, prev - 1) : prev + 1 } : p)
    setLikeAnim(true); setTimeout(() => setLikeAnim(false), 400)
    try { if (navigator.vibrate) navigator.vibrate(10) } catch {}
    try { const r = await api.toggleLike(id); setTrack(p => p ? { ...p, is_liked: r.is_liked, likes_count: r.likes_count } : p) }
    catch { setTrack(p => p ? { ...p, is_liked: was, likes_count: prev } : p); toast.error('Failed') }
  }

  // Optimistic follow with instant count
  const handleFollow = async () => {
    if (!requireAuth(navigate, 'Please login to follow')) return
    const was = track.user?.is_following, prev = track.user?.followers_count || 0
    setTrack(p => p ? { ...p, user: { ...p.user, is_following: !was, followers_count: was ? Math.max(0, prev - 1) : prev + 1 } } : p)
    setFollowAnim(true); setTimeout(() => setFollowAnim(false), 500)
    try { if (navigator.vibrate) navigator.vibrate(10) } catch {}
    try { const r = await api.toggleFollow(track.user?.id); setTrack(p => p ? { ...p, user: { ...p.user, is_following: r.is_following, followers_count: r.followers_count ?? (r.is_following ? prev + 1 : Math.max(0, prev - 1)) } } : p) }
    catch { setTrack(p => p ? { ...p, user: { ...p.user, is_following: was, followers_count: prev } } : p); toast.error('Failed') }
  }

  // Optimistic repost
  const handleRepost = async () => {
    if (!requireAuth(navigate, 'Please login to repost')) return
    const was = track.is_reposted, prev = track.reposts_count || 0
    setTrack(p => p ? { ...p, is_reposted: !was, reposts_count: was ? Math.max(0, prev - 1) : prev + 1 } : p)
    setRepostAnim(true); setTimeout(() => setRepostAnim(false), 400)
    try { const r = await api.toggleRepost(id); setTrack(p => p ? { ...p, is_reposted: r.is_reposted, reposts_count: r.reposts_count } : p) }
    catch { setTrack(p => p ? { ...p, is_reposted: was, reposts_count: prev } : p); toast.error('Failed') }
  }

  const handleDownload = async () => {
    if (!requireAuth(navigate, 'Please login to download')) return

    // If already downloaded, remove from downloads
    if (isDownloaded) {
      try {
        await removeCachedTrack(parseInt(id))
        await api.removeDownload(id).catch(() => {})
        setIsDownloaded(false)
        toast.success('Removed from downloads')
      } catch { toast.error('Failed to remove') }
      return
    }

    if (!planFeatures?.can_download) {
      toast.error('Offline downloads require a premium plan. Upgrade to save tracks.')
      navigate('/pricing')
      return
    }

    setDownloadLoading(true)
    setDownloadProgress(0)
    try {
      // Register download with server (checks plan limit)
      const res = await api.saveForOffline(id)

      // Cache audio blob locally in IndexedDB
      await cacheTrack(track, (progress) => setDownloadProgress(progress))

      setIsDownloaded(true)
      toast.success('Saved for offline listening')

      if (res.downloads_remaining !== null && res.downloads_remaining !== undefined) {
        setPlanFeatures(prev => prev ? { ...prev, downloads_remaining: res.downloads_remaining } : prev)
      }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(err.response?.data?.message || 'Download limit reached')
      } else {
        toast.error('Failed to save for offline')
      }
    } finally {
      setDownloadLoading(false)
      setDownloadProgress(0)
    }
  }

  const handleDelete = async () => { if (!user?.id) return; const own = track?.user?.id === user.id; if (!own && !isAdmin) { toast.error('No permission'); return }; if (!confirm('Delete this track?')) return; try { isAdmin && !own ? await api.adminDeleteTrack(id) : await api.deleteTrack(id); toast.success('Deleted'); navigate('/') } catch (e) { toast.error(e.response?.data?.message || 'Failed') } }

  // Optimistic comment
  const handleComment = async (e) => {
    e.preventDefault(); if (!requireAuth(navigate, 'Please login to comment')) return; if (!newComment.trim()) return
    const tempId = `temp-${Date.now()}`, body = newComment
    setComments(p => [{ id: tempId, body, user, created_at: new Date().toISOString(), replies: [] }, ...p])
    setNewComment(''); setCommentPosting(true)
    try { await api.addComment(id, body); fetchComments() } catch { setComments(p => p.filter(c => c.id !== tempId)); toast.error('Failed') } finally { setCommentPosting(false) }
  }
  const handleReply = async (e, parentId) => { e.preventDefault(); if (!requireAuth(navigate, 'Please login')) return; if (!replyText.trim()) return; const t = replyText; setReplyText(''); setReplyingTo(null); try { await api.addComment(id, t, parentId); fetchComments() } catch { toast.error('Failed'); setReplyText(t); setReplyingTo(parentId) } }
  const handleEditComment = (c) => { setEditingCommentId(c.id); setEditCommentText(c.body) }
  const handleCancelEdit = () => { setEditingCommentId(null); setEditCommentText('') }
  const handleUpdateComment = async (cid) => { if (!editCommentText.trim()) return; try { await api.updateComment(id, cid, editCommentText); setEditingCommentId(null); setEditCommentText(''); fetchComments() } catch { toast.error('Failed') } }
  const handleDeleteComment = async (cid) => { if (!confirm('Delete?')) return; setComments(p => p.filter(c => c.id !== cid).map(c => ({ ...c, replies: c.replies?.filter(r => r.id !== cid) }))); try { await api.deleteComment(id, cid) } catch { fetchComments() } }

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className="td-page">
      <div className="td-hero-wrap">
        <div className="td-ambient" style={{ background: DEFAULT_GRADIENT }} />
        <div className="td-ambient-fade" />
        <div className="td-hero-content">
          <div className="td-hero-flex">
            <div className="td-cover td-shimmer" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="td-shimmer" style={{ height: 12, width: 80, borderRadius: 6 }} />
              <div className="td-shimmer" style={{ height: 40, width: '70%', borderRadius: 8 }} />
              <div className="td-shimmer" style={{ height: 20, width: '40%', borderRadius: 6 }} />
              <div className="td-shimmer" style={{ height: 14, width: '50%', borderRadius: 6 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  if (!track) return (
    <div className="td-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <Music size={48} style={{ color: 'var(--sp-text-muted)', marginBottom: 16 }} />
        <p style={{ color: 'var(--sp-text-muted)', fontSize: '1rem', marginBottom: 16 }}>Track not available</p>
        <button onClick={() => navigate('/home')} style={{ padding: '10px 24px', borderRadius: 12, background: 'var(--sp-green)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Go Home</button>
      </div>
    </div>
  )

  const isCurrent = currentTrack?.id === track.id
  const playing = isCurrent && isPlaying
  const gradient = getGradient(track)

  /* ── Comment ── */
  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} className={`td-comment ${isReply ? 'td-comment--reply' : ''} ${String(comment.id).startsWith('temp') ? 'td-comment--temp' : ''}`}>
      <Link to={`/users/${comment.user?.id}`} className="td-comment-avatar">
        {comment.user?.avatar_url ? <img src={comment.user.avatar_url} alt="" /> : <span>{comment.user?.name?.charAt(0) || 'U'}</span>}
      </Link>
      <div className="td-comment-body">
        <div className="td-comment-header">
          <div><Link to={`/users/${comment.user?.id}`} className="td-comment-author">{comment.user?.name || 'Unknown'}</Link><span className="td-comment-time">{timeAgo(comment.created_at)}</span></div>
          {(comment.user?.id === user?.id || isAdmin) && editingCommentId !== comment.id && !String(comment.id).startsWith('temp') && (
            <div className="td-comment-actions">
              {comment.user?.id === user?.id && <button className="td-sm-btn" onClick={() => handleEditComment(comment)}><Pencil size={12} /></button>}
              <button className="td-sm-btn td-sm-btn--red" onClick={() => handleDeleteComment(comment.id)}><Trash2 size={12} /></button>
            </div>
          )}
        </div>
        {editingCommentId === comment.id ? (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={editCommentText} onChange={e => setEditCommentText(e.target.value)} className="td-input" onKeyDown={e => { if (e.key === 'Enter') handleUpdateComment(comment.id); if (e.key === 'Escape') handleCancelEdit() }} autoFocus />
            <div style={{ display: 'flex', gap: 8 }}><button className="td-pill td-pill--primary" onClick={() => handleUpdateComment(comment.id)}>Save</button><button className="td-pill td-pill--ghost" onClick={handleCancelEdit}>Cancel</button></div>
          </div>
        ) : (
          <>
            <p className="td-comment-text">{comment.body}</p>
            {!isReply && !String(comment.id).startsWith('temp') && <button className="td-comment-reply-btn" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}><Reply size={13} /> Reply</button>}
          </>
        )}
        {replyingTo === comment.id && (
          <form onSubmit={e => handleReply(e, comment.id)} style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <input value={replyText} onChange={e => setReplyText(e.target.value)} className="td-input" placeholder={`Reply to ${comment.user?.name}...`} autoFocus />
            <button type="submit" className="td-pill td-pill--primary">Reply</button>
            <button type="button" className="td-pill td-pill--ghost" onClick={() => { setReplyingTo(null); setReplyText('') }}>Cancel</button>
          </form>
        )}
      </div>
    </div>
  )

  return (
    <div className="td-page">
      {/* ═══ HERO — reference exact: ambient blur + gradient fade ═══ */}
      <div className="td-hero-wrap">
        {/* Layer 1: coverGradient, opacity-40, blur(60px), scale(1.2) */}
        <div className="td-ambient" style={{ background: gradient }} />
        {/* Layer 2: from-transparent via-background/60 to-background */}
        <div className="td-ambient-fade" />

        <div className="td-hero-content">
          {/* Back — text-sm text-muted-foreground mb-8 */}
          <button className="td-back" onClick={() => window.history.back()}>
            <ChevronLeft size={13} /> Back
          </button>

          {/* flex-col md:flex-row gap-8 items-start md:items-end */}
          <div className="td-hero-flex">
            {/* Cover — w-52 h-52 md:w-64 md:h-64 rounded-2xl shadow-2xl */}
            <div className="td-cover" style={{ background: gradient }}>
              {track.cover_url ? <img src={track.cover_url} alt={track.title} /> : (
                <>
                  <div className="td-cover-dark" />
                  <Music className="td-cover-icon" />
                  <svg className="td-cover-geo" viewBox="0 0 200 200" fill="none">
                    <polygon points="100,20 180,60 180,140 100,180 20,140 20,60" stroke="white" strokeWidth="1.5" />
                    <polygon points="100,40 160,70 160,130 100,160 40,130 40,70" stroke="white" strokeWidth="1" />
                    <circle cx="100" cy="100" r="30" stroke="white" strokeWidth="1" />
                  </svg>
                </>
              )}
              {playing && <div className="td-cover-bars"><span /><span /><span /></div>}
            </div>

            {/* Info */}
            <div className="td-info">
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="td-input td-input--big" placeholder="Title" />
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="td-input" placeholder="Description" style={{ minHeight: 60, resize: 'vertical' }} />
                  <textarea value={editLyrics} onChange={e => setEditLyrics(e.target.value)} className="td-input" placeholder="Lyrics (optional)" style={{ minHeight: 100, resize: 'vertical', fontFamily: "'Amiri', 'Cairo', serif", lineHeight: 1.8 }} />
                  <input value={editCategory} onChange={e => setEditCategory(e.target.value)} className="td-input" placeholder="Category" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="td-pill td-pill--primary" onClick={handleSaveEdit}><Check size={14} /> Save</button>
                    <button className="td-pill td-pill--ghost" onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* text-xs font-semibold uppercase tracking-widest text-primary mb-2 */}
                  {track.category && <p className="td-label">{track.category}</p>}

                  {/* text-4xl md:text-5xl font-bold font-serif mb-2 leading-tight */}
                  <h1 className="td-title">
                    {track.title}
                    {isOwner && <button className="td-edit-btn" onClick={startEditing}><Pencil size={14} /></button>}
                  </h1>

                  {/* text-xl text-muted-foreground mb-4 */}
                  <p className="td-artist"><Link to={`/users/${track.user?.id}`} className="td-artist-link">{track.user?.name || 'Unknown Artist'}</Link></p>

                  {/* text-sm text-muted-foreground mb-6 — plays · duration */}
                  <div className="td-meta">
                    <span className="td-meta-hi">{fmtNum(track.plays_count)}</span>
                    <span>plays</span>
                    <span className="td-meta-dot" />
                    <span>{fmtDur(track.duration_seconds)}</span>
                    {track.description && <><span className="td-meta-dot" /><span>{formatDate(track.created_at)}</span></>}
                  </div>

                  {track.description && <p className="td-desc">{track.description}</p>}

                  {/* Row 1: Play + Queue actions */}
                  <div className="td-btns">
                    <button className="td-play" onClick={handlePlay}>
                      {playing ? <Pause size={18} /> : <Play size={18} />}
                      {playing ? 'Playing' : 'Play'}
                    </button>

                    <button className="td-action-btn" onClick={() => { if (!track.audio_url) return; addToQueue(track); toast.success('Added to queue') }}>
                      <ListPlus size={18} />
                      <span>Queue</span>
                    </button>

                    <button className="td-action-btn" onClick={() => { if (!track.audio_url) return; insertNext(track); toast.success('Playing next') }}>
                      <ListEnd size={18} />
                      <span>Play Next</span>
                    </button>

                    {(isOwner || isAdmin) && (
                      <button className="td-circle td-circle--red" onClick={handleDelete}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Row 2: Like, Repost, Save, Share */}
                  <div className="td-btns td-btns-secondary">
                    <button className={`td-action-btn ${track.is_liked ? 'td-action-btn--liked' : ''} ${likeAnim ? 'td-bounce' : ''}`} onClick={handleLike}>
                      <Heart size={16} fill={track.is_liked ? 'currentColor' : 'none'} />
                      <span>{fmtNum(track.likes_count)}</span>
                    </button>

                    <button className={`td-action-btn ${track.is_reposted ? 'td-action-btn--reposted' : ''} ${repostAnim ? 'td-bounce' : ''}`} onClick={handleRepost}>
                      <Repeat2 size={16} />
                      <span>{fmtNum(track.reposts_count)}</span>
                    </button>

                    <button className="td-action-btn" onClick={() => { if (!requireAuth(navigate, 'Please login')) return; setShowPlaylistModal(true) }}>
                      <Plus size={16} />
                      <span>Save</span>
                    </button>

                    <button className="td-action-btn" onClick={() => setShowShareModal(true)}>
                      <Share2 size={16} />
                      <span>Share</span>
                    </button>

                    {user && (
                      <button
                        className={`td-action-btn${isDownloaded ? ' td-action-btn--liked' : ''}${!planFeatures?.can_download && !isDownloaded ? ' td-action-btn--locked' : ''}`}
                        onClick={handleDownload}
                        disabled={downloadLoading}
                        title={isDownloaded ? 'Remove from downloads' : !planFeatures?.can_download ? 'Upgrade to download' : (planFeatures?.downloads_remaining !== null ? `${planFeatures.downloads_remaining} downloads left` : 'Save offline')}
                      >
                        {downloadLoading ? (
                          <>{downloadProgress > 0 ? <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{downloadProgress}%</span> : <Loader2 size={16} className="animate-spin" />}</>
                        ) : isDownloaded ? (
                          <CheckCircle size={16} />
                        ) : (
                          <Download size={16} />
                        )}
                        <span>{downloadLoading ? 'Saving...' : isDownloaded ? 'Downloaded' : !planFeatures?.can_download ? 'Upgrade' : 'Download'}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ WAVEFORM ═══ */}
      {track.waveform?.length > 0 && (
        <div className="td-wave-wrap">
          <div className="td-wave" onClick={(e) => {
            if (!track.audio_url || !isCurrent) return
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            seek(pct * (duration || track.duration_seconds || 0))
          }}>
            {track.waveform.map((val, i) => {
              const h = Math.max(4, (val / 100) * 100)
              const progressPct = isCurrent && duration > 0 ? (progress / duration) * 100 : 0
              const barPct = (i / track.waveform.length) * 100
              const isPlayed = barPct < progressPct
              return (
                <div
                  key={i}
                  className={`td-wave-bar${isPlayed ? ' td-wave-bar--played' : ''}${playing ? ' td-wave-bar--active' : ''}`}
                  style={{ height: `${h}%` }}
                />
              )
            })}
          </div>
          {isCurrent && duration > 0 && (
            <div className="td-wave-times">
              <span>{fmtDur(progress)}</span>
              <span>{fmtDur(duration)}</span>
            </div>
          )}
        </div>
      )}

      {/* ═══ CONTENT — grid md:grid-cols-5 gap-8 ═══ */}
      <div className="td-grid">
        {/* Left col-span-3: Comments in glass card */}
        <div className="td-col3">
          <div className="td-glass">
            <h2 className="td-card-h">
              <span className="td-accent" />
              Comments <span className="td-card-count">{comments.length}</span>
            </h2>

            <form onSubmit={handleComment} className="td-comment-form">
              <div className="td-comment-form-av">
                {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{user?.name?.charAt(0) || 'U'}</span>}
              </div>
              <input value={newComment} onChange={e => setNewComment(e.target.value)} className="td-input" placeholder="Write a comment..." disabled={commentPosting} />
              {newComment.trim() && <button type="submit" className="td-pill td-pill--primary" disabled={commentPosting}>{commentPosting ? <Loader2 size={14} className="td-spin" /> : 'Post'}</button>}
            </form>

            {comments.length === 0 ? (
              <div className="td-empty"><MessageCircle size={24} /><p>No comments yet</p></div>
            ) : (
              <>
                <div className="td-comment-list">
                  {(commentsExpanded ? comments : comments.slice(0, 5)).map(c => (
                    <div key={c.id}>{renderComment(c)}{c.replies?.map(r => renderComment(r, true))}</div>
                  ))}
                </div>
                {comments.length > 5 && !commentsExpanded && (
                  <button className="td-comments-more" onClick={() => setCommentsExpanded(true)}>
                    View all {comments.length} comments
                  </button>
                )}
                {commentsExpanded && comments.length > 5 && (
                  <button className="td-comments-more" onClick={() => setCommentsExpanded(false)}>
                    Show less
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right col-span-2: Uploader card */}
        <div className="td-col2">
          <div className="td-glass">
            <h2 className="td-card-h">
              <span className="td-accent" />
              About the {track.user?.is_artist ? 'Artist' : 'Uploader'}
            </h2>
            <Link to={`/users/${track.user?.id}`} className="td-av-lg" style={{ background: (track.user?.avatar_url || track.user?.profile?.avatar_url) ? undefined : gradient }}>
              {(track.user?.avatar_url || track.user?.profile?.avatar_url)
                ? <img src={track.user.avatar_url || track.user.profile.avatar_url} alt="" />
                : <span>{track.user?.name?.charAt(0) || '?'}</span>}
            </Link>
            <Link to={`/users/${track.user?.id}`} className="td-av-name">{track.user?.name || 'Unknown'}</Link>
            {track.category && <p className="td-av-genre">{track.category}</p>}
            <div className={`td-av-followers ${followAnim ? 'td-pulse-num' : ''}`}>
              <Users size={14} /> {fmtNum(track.user?.followers_count)} followers
            </div>
            <p className="td-av-bio">{track.user?.bio || track.user?.profile?.bio || `${track.user?.name || 'This user'} shares content on Nashidify.`}</p>

            {user?.id !== track.user?.id && (
              <button className={`td-follow ${track.user?.is_following ? 'td-follow--on' : ''} ${followAnim ? 'td-bounce' : ''}`} onClick={handleFollow}>
                {track.user?.is_following ? <UserCheck size={16} /> : <UserPlus size={16} />}
                {track.user?.is_following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ LYRICS ═══ */}
      {track.lyrics && (() => {
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
        const lines = track.lyrics.split('\n')
        const textLines = lines.filter(l => l.trim())
        const arabicLines = textLines.filter(l => arabicRegex.test(l))
        const isRTL = arabicLines.length > textLines.length / 2
        return (
          <div className="td-lyrics-wrap">
            <div className={`td-lyrics-card${isRTL ? ' td-lyrics-rtl' : ''}`}>
              <div className="td-lyrics-pattern">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="lyrics-stars" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                      <polygon points="30,14 31.8,24.5 40.5,19.5 35.5,28.2 46,30 35.5,31.8 40.5,40.5 31.8,35.5 30,46 28.2,35.5 19.5,40.5 24.5,31.8 14,30 24.5,28.2 19.5,19.5 28.2,24.5"
                        fill="none" stroke="rgba(201,162,77,0.06)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#lyrics-stars)" />
                </svg>
              </div>
              <div className="td-lyrics-head">
                <div className="td-lyrics-head-left">
                  <div className="td-lyrics-icon">
                    <MicVocal size={18} strokeWidth={1.6} />
                  </div>
                  <div>
                    <h2 className="td-lyrics-title">Lyrics</h2>
                    {isRTL && <span className="td-lyrics-lang">عربي</span>}
                  </div>
                </div>
                {track.lyrics.length > 600 && (
                  <button className="td-lyrics-toggle" onClick={() => setLyricsExpanded(e => !e)}>
                    {lyricsExpanded ? 'Show less' : 'Show all'}
                  </button>
                )}
              </div>
              <div className="td-lyrics-divider">
                <span />
                <svg width="12" height="12" viewBox="0 0 20 20">
                  <polygon points="10,1 11.42,6.58 16.36,3.64 13.42,8.58 19,10 13.42,11.42 16.36,16.36 11.42,13.42 10,19 8.58,13.42 3.64,16.36 6.58,11.42 1,10 6.58,8.58 3.64,3.64 8.58,6.58" fill="none" stroke="rgba(201,162,77,0.25)" strokeWidth="0.8" />
                </svg>
                <span />
              </div>
              <div className={`td-lyrics-body${!lyricsExpanded && track.lyrics.length > 600 ? ' td-lyrics-collapsed' : ''}`}>
                {lines.map((line, i) => {
                  const lineIsArabic = arabicRegex.test(line)
                  const isEmpty = line.trim() === ''
                  return (
                    <span key={i} className={`td-lyrics-line${isEmpty ? ' td-lyrics-break' : ''}${lineIsArabic ? ' td-lyrics-line-ar' : ''}`} dir={lineIsArabic ? 'rtl' : undefined}>
                      {line || '\u00A0'}
                    </span>
                  )
                })}
              </div>
              {!lyricsExpanded && track.lyrics.length > 600 && (
                <div className="td-lyrics-fade" onClick={() => setLyricsExpanded(true)} />
              )}
            </div>
          </div>
        )
      })()}

      {/* ═══ MORE FROM ARTIST ═══ */}
      {artistTracks.length > 0 && (
        <div className="td-more">
          <div className="up-section-header"><Music size={18} style={{ color: 'var(--sp-gold)' }} /><h3>More from {track.user?.name || 'this artist'}</h3></div>
          <div className="up-tracklist">
            {artistTracks.map((t, i) => {
              const playing = currentTrack?.id === t.id && isPlaying
              const liked = likedIds.has(t.id)
              const reposted = repostedIds.has(t.id)
              return (
                <div key={t.id} className={`up-track${playing ? ' playing' : ''}`} onClick={() => navigate(`/tracks/${t.id}`)}>
                  <div className="up-track-left">
                    <span className="up-track-num" onClick={e => { e.stopPropagation(); playing ? togglePlay() : playTrack(t, artistTracks) }}>{playing ? <span className="up-track-eq"><span /><span /><span /></span> : i + 1}</span>
                    <div className="up-track-thumb" onClick={e => { e.stopPropagation(); playing ? togglePlay() : playTrack(t, artistTracks) }}>
                      {t.cover_url ? <img src={t.cover_url} alt="" /> : <div className="up-track-thumb-placeholder"><Music size={16} /></div>}
                      <div className="up-track-thumb-overlay">{playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 1 }} />}</div>
                    </div>
                    <div className="up-track-info">
                      <span className={`up-track-title${playing ? ' active' : ''}`}>{t.title}</span>
                      <span className="up-track-artist">{t.user?.name || ''}</span>
                      <span className="up-track-plays-sub">{fmtNum(t.plays_count || t.plays)} plays</span>
                    </div>
                  </div>
                  <div className="up-track-right" onClick={e => e.stopPropagation()}>
                    <button className={`up-act${liked ? ' up-act--on' : ''}`} onClick={e => handleTrackLike(t.id, e)}><Heart size={15} fill={liked ? 'currentColor' : 'none'} /></button>
                    <button className={`up-act${reposted ? ' up-act--on' : ''}`} onClick={e => handleTrackRepost(t.id, e)}><Repeat2 size={15} /></button>
                    <button className="up-act" onClick={e => { e.stopPropagation(); setShowPlaylistModal(true) }}><Plus size={15} /></button>
                    <button className="up-act" onClick={e => { e.stopPropagation(); copyToClipboard(`${window.location.origin}/tracks/${t.id}`); toast.success('Link copied') }}><Share2 size={15} /></button>
                    <span className="up-track-duration">{fmtDur(t.duration_seconds)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ POPULAR IN CATEGORY ═══ */}
      {trendingInCategory.length > 0 && track?.category && (
        <div className="td-more">
          <div className="up-section-header"><Heart size={18} style={{ color: 'var(--sp-gold)' }} /><h3>Popular in {track.category}</h3></div>
          <div className="up-tracklist">
            {trendingInCategory.map((t, i) => {
              const playing = currentTrack?.id === t.id && isPlaying
              const liked = likedIds.has(t.id)
              const reposted = repostedIds.has(t.id)
              return (
                <div key={t.id} className={`up-track${playing ? ' playing' : ''}`} onClick={() => navigate(`/tracks/${t.id}`)}>
                  <div className="up-track-left">
                    <span className="up-track-num" onClick={e => { e.stopPropagation(); playing ? togglePlay() : playTrack(t, trendingInCategory) }}>{playing ? <span className="up-track-eq"><span /><span /><span /></span> : i + 1}</span>
                    <div className="up-track-thumb" onClick={e => { e.stopPropagation(); playing ? togglePlay() : playTrack(t, trendingInCategory) }}>
                      {t.cover_url ? <img src={t.cover_url} alt="" /> : <div className="up-track-thumb-placeholder"><Music size={16} /></div>}
                      <div className="up-track-thumb-overlay">{playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 1 }} />}</div>
                    </div>
                    <div className="up-track-info">
                      <span className={`up-track-title${playing ? ' active' : ''}`}>{t.title}</span>
                      <span className="up-track-artist">{t.user?.name || ''}</span>
                      <span className="up-track-plays-sub">{fmtNum(t.plays_count || t.plays)} plays</span>
                    </div>
                  </div>
                  <div className="up-track-right" onClick={e => e.stopPropagation()}>
                    <button className={`up-act${liked ? ' up-act--on' : ''}`} onClick={e => handleTrackLike(t.id, e)}><Heart size={15} fill={liked ? 'currentColor' : 'none'} /></button>
                    <button className={`up-act${reposted ? ' up-act--on' : ''}`} onClick={e => handleTrackRepost(t.id, e)}><Repeat2 size={15} /></button>
                    <button className="up-act" onClick={e => { e.stopPropagation(); setShowPlaylistModal(true) }}><Plus size={15} /></button>
                    <button className="up-act" onClick={e => { e.stopPropagation(); copyToClipboard(`${window.location.origin}/tracks/${t.id}`); toast.success('Link copied') }}><Share2 size={15} /></button>
                    <span className="up-track-duration">{fmtDur(t.duration_seconds)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ YOU MIGHT ALSO LIKE ═══ */}
      {relatedTracks.length > 0 && (
        <div className="td-more">
          <div className="up-section-header"><Users size={18} style={{ color: 'var(--sp-gold)' }} /><h3>You Might Also Like</h3></div>
          <div className="up-tracklist">
            {relatedTracks.map((t, i) => {
              const playing = currentTrack?.id === t.id && isPlaying
              const liked = likedIds.has(t.id)
              const reposted = repostedIds.has(t.id)
              return (
                <div key={t.id} className={`up-track${playing ? ' playing' : ''}`} onClick={() => navigate(`/tracks/${t.id}`)}>
                  <div className="up-track-left">
                    <span className="up-track-num" onClick={e => { e.stopPropagation(); playing ? togglePlay() : playTrack(t, relatedTracks) }}>{playing ? <span className="up-track-eq"><span /><span /><span /></span> : i + 1}</span>
                    <div className="up-track-thumb" onClick={e => { e.stopPropagation(); playing ? togglePlay() : playTrack(t, relatedTracks) }}>
                      {t.cover_url ? <img src={t.cover_url} alt="" /> : <div className="up-track-thumb-placeholder"><Music size={16} /></div>}
                      <div className="up-track-thumb-overlay">{playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 1 }} />}</div>
                    </div>
                    <div className="up-track-info">
                      <span className={`up-track-title${playing ? ' active' : ''}`}>{t.title}</span>
                      <span className="up-track-artist">{t.user?.name || ''}</span>
                      <span className="up-track-plays-sub">{fmtNum(t.plays_count || t.plays)} plays</span>
                    </div>
                  </div>
                  <div className="up-track-right" onClick={e => e.stopPropagation()}>
                    <button className={`up-act${liked ? ' up-act--on' : ''}`} onClick={e => handleTrackLike(t.id, e)}><Heart size={15} fill={liked ? 'currentColor' : 'none'} /></button>
                    <button className={`up-act${reposted ? ' up-act--on' : ''}`} onClick={e => handleTrackRepost(t.id, e)}><Repeat2 size={15} /></button>
                    <button className="up-act" onClick={e => { e.stopPropagation(); setShowPlaylistModal(true) }}><Plus size={15} /></button>
                    <button className="up-act" onClick={e => { e.stopPropagation(); copyToClipboard(`${window.location.origin}/tracks/${t.id}`); toast.success('Link copied') }}><Share2 size={15} /></button>
                    <span className="up-track-duration">{fmtDur(t.duration_seconds)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showPlaylistModal && <AddToPlaylistModal trackId={id} onClose={() => setShowPlaylistModal(false)} />}
      {showShareModal && <ShareModal track={track} gradient={gradient} onClose={() => setShowShareModal(false)} />}
    </div>
  )
}
