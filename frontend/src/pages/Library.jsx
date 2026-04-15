import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'
import { copyToClipboard } from '../utils/clipboard'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import TrackMenu from '../components/TrackMenu'
import {
  Play, Pause, Heart, Repeat2, Plus, Share2, Music, Search, Loader2,
  Upload, Users, Clock, Trash2, LayoutGrid, X, ListMusic, History
} from 'lucide-react'

/* ── Constants ── */
const GENRES = [
  { id: 'all', label: 'All' }, { id: 'Nasheeds', label: 'Nasheeds' },
  { id: 'Quran', label: 'Quran' }, { id: 'Lectures', label: 'Lectures' },
  { id: 'Duas', label: 'Duas' }, { id: 'Broadcast', label: 'Podcasts' },
]
const STATUSES = [
  { id: 'all', label: 'All' }, { id: 'approved', label: 'Approved' },
  { id: 'pending', label: 'Pending' }, { id: 'rejected', label: 'Rejected' },
]
const fmtCount = (n) => { if (!n && n !== 0) return '0'; if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`; return String(n) }
const fmtDur = (s) => { if (!s) return '0:00'; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}` }

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  /* ── State ── */
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'playlists')
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [playlists, setPlaylists] = useState([])
  const [likedTracks, setLikedTracks] = useState([])
  const [reposts, setReposts] = useState([])
  const [myTracks, setMyTracks] = useState([])
  const [following, setFollowing] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const [likedIds, setLikedIds] = useState(new Set())
  const [repostedIds, setRepostedIds] = useState(new Set())
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null)

  /* ── Tabs ── */
  const tabs = [
    { key: 'playlists', label: 'Playlists', icon: ListMusic },
    { key: 'likes', label: 'Liked', icon: Heart },
    { key: 'reposts', label: 'Reposts', icon: Repeat2 },
    { key: 'uploads', label: 'Uploads', icon: Upload },
    { key: 'following', label: 'Following', icon: Users },
    { key: 'history', label: 'History', icon: History },
  ]

  /* ── Data Loading ── */
  useEffect(() => { loadData() }, [activeTab])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      switch (activeTab) {
        case 'playlists': {
          const r = await api.getPlaylists()
          setPlaylists(Array.isArray(r) ? r : r.data || [])
          break
        }
        case 'likes': {
          const r = await api.getLikedTracks()
          const list = Array.isArray(r) ? r : r.data || []
          setLikedTracks(list)
          setLikedIds(new Set(list.map(t => (t.track || t).id || t.id)))
          break
        }
        case 'reposts': {
          const r = await api.getRepostedTracks()
          const list = Array.isArray(r) ? r : r.data || []
          setReposts(list)
          setRepostedIds(new Set(list.map(t => (t.track || t).id || t.id)))
          break
        }
        case 'uploads': {
          const r = await api.getMyTracks()
          setMyTracks(Array.isArray(r) ? r : r.data || [])
          break
        }
        case 'following': {
          const r = await api.getMyFollowing()
          setFollowing(Array.isArray(r) ? r : r.data || [])
          break
        }
        case 'history': {
          const r = await api.getRecentHistory()
          setHistory(Array.isArray(r) ? r : r.data || [])
          break
        }
      }
    } catch {}
    finally { setLoading(false) }
  }

  const handleTab = (key) => {
    setActiveTab(key)
    setSearchParams({ tab: key })
    setQuery('')
    setGenre('all')
    setStatusFilter('all')
  }

  /* ── Actions ── */
  const handlePlay = (track, list) => {
    if (!track) return
    if (currentTrack?.id === track.id) togglePlay()
    else playTrack(track, list || [track])
  }

  const handleLike = async (trackId, e) => {
    e?.stopPropagation()
    if (!user) { toast.error('Please log in'); return }
    const was = likedIds.has(trackId)
    setLikedIds(prev => { const n = new Set(prev); was ? n.delete(trackId) : n.add(trackId); return n })
    try {
      const res = await api.toggleLike(trackId)
      if (res.is_liked !== undefined) {
        setLikedIds(prev => { const n = new Set(prev); res.is_liked ? n.add(trackId) : n.delete(trackId); return n })
        if (!res.is_liked && activeTab === 'likes') setLikedTracks(prev => prev.filter(t => t.id !== trackId))
      }
    } catch { setLikedIds(prev => { const n = new Set(prev); was ? n.add(trackId) : n.delete(trackId); return n }) }
  }

  const handleRepost = async (trackId, e) => {
    e?.stopPropagation()
    if (!user) { toast.error('Please log in'); return }
    const was = repostedIds.has(trackId)
    setRepostedIds(prev => { const n = new Set(prev); was ? n.delete(trackId) : n.add(trackId); return n })
    toast.success(was ? 'Repost removed' : 'Reposted')
    try {
      const res = await api.toggleRepost(trackId)
      if (res.is_reposted !== undefined) setRepostedIds(prev => { const n = new Set(prev); res.is_reposted ? n.add(trackId) : n.delete(trackId); return n })
    } catch { setRepostedIds(prev => { const n = new Set(prev); was ? n.add(trackId) : n.delete(trackId); return n }) }
  }

  const handleClearHistory = async () => {
    try { await api.clearHistory(); setHistory([]); toast.success('History cleared') }
    catch { toast.error('Failed to clear history') }
  }

  const isPlaying_ = (track) => currentTrack?.id === track?.id && isPlaying

  /* ── Filters ── */
  const filterByGenre = (list) => {
    let filtered = list
    if (genre !== 'all') filtered = filtered.filter(t => (t.category || '').toLowerCase() === genre.toLowerCase())
    if (query.trim()) {
      const q = query.toLowerCase()
      filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(q) || (t.user?.name || '').toLowerCase().includes(q))
    }
    return filtered
  }

  const filterByStatus = (list) => {
    let filtered = list
    if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(q))
    }
    return filtered
  }

  const filterByName = (list) => {
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter(item => ((item.name || item.title || '') + ' ' + (item.user?.name || '')).toLowerCase().includes(q))
  }

  /* ── Track Row Renderer ── */
  const renderTrackRow = (track, i, trackList, opts = {}) => {
    const playing = isPlaying_(track)
    const liked = likedIds.has(track.id)
    const reposted = repostedIds.has(track.id)
    return (
      <div key={track.id} className={`up-track${playing ? ' playing' : ''}`}
        onClick={() => opts.noNav ? null : navigate(`/tracks/${track.id}`)}>
        <div className="up-track-left">
          <span className="up-track-num" onClick={e => { e.stopPropagation(); if (!opts.disabled) handlePlay(track, trackList) }}>
            {playing ? <span className="up-track-eq"><span /><span /><span /></span> : i + 1}
          </span>
          <div className="up-track-thumb" onClick={e => { e.stopPropagation(); if (!opts.disabled) handlePlay(track, trackList) }}>
            {track.cover_url ? <img src={track.cover_url} alt="" /> : <div className="up-track-thumb-placeholder"><Music size={16} /></div>}
            {!opts.disabled && <div className="up-track-thumb-overlay">{playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 1 }} />}</div>}
          </div>
          <div className="up-track-info">
            <span className={`up-track-title${playing ? ' active' : ''}`}>{track.title}</span>
            <span className="up-track-artist">{track.user?.name || ''}</span>
            <span className="up-track-plays-sub">{fmtCount(track.plays_count || track.plays || 0)} plays</span>
          </div>
        </div>
        <div className="up-track-right" onClick={e => e.stopPropagation()}>
          {opts.statusBadge && <span className={`lib-badge lib-badge--${track.status}`}>{track.status}</span>}
          <button className={`up-act${liked ? ' up-act--on' : ''}`} onClick={e => handleLike(track.id, e)}><Heart size={15} fill={liked ? 'currentColor' : 'none'} /></button>
          <button className={`up-act${reposted ? ' up-act--on' : ''}`} onClick={e => handleRepost(track.id, e)}><Repeat2 size={15} /></button>
          <button className="up-act" onClick={e => { e.stopPropagation(); setPlaylistModalTrack(track) }}><Plus size={15} /></button>
          <button className="up-act" onClick={e => { e.stopPropagation(); copyToClipboard(`${window.location.origin}/tracks/${track.id}`); toast.success('Link copied') }}><Share2 size={15} /></button>
          <TrackMenu
            track={track}
            trackList={trackList}
            onAddToPlaylist={(t) => setPlaylistModalTrack(t)}
            onLike={(id, e) => handleLike(id, e)}
            onRepost={(id, e) => handleRepost(id, e)}
            isLiked={liked}
            isReposted={reposted}
          />
          <span className="up-track-duration">{fmtDur(track.duration_seconds || track.duration)}</span>
        </div>
      </div>
    )
  }

  /* ── Not logged in ── */
  if (!user) return (
    <div className="lib-page">
      <div className="up-empty" style={{ paddingTop: '20vh' }}>
        <Music size={48} style={{ color: 'var(--sp-text-muted)', marginBottom: 16 }} />
        <p>Log in to see your library</p>
        <button onClick={() => navigate('/login')} className="up-showmore" style={{ marginTop: 16 }}>Log In</button>
      </div>
    </div>
  )

  /* ══════════════════════════════════════
     RENDER
     ══════════════════════════════════════ */
  return (
    <div className="lib-page">
      {/* ── Header ── */}
      <div className="lib-header">
        <h1 className="lib-title">Your Library</h1>
      </div>

      {/* ── Tabs ── */}
      <div className="lib-tabs">
        {tabs.map(tab => (
          <button key={tab.key} className={`lib-tab${activeTab === tab.key ? ' active' : ''}`} onClick={() => handleTab(tab.key)}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="lib-content">

        {/* PLAYLISTS */}
        {activeTab === 'playlists' && (
          loading ? <div className="up-empty"><Loader2 size={20} className="up-spin" /> Loading...</div> :
          <div className="up-pl-grid">
            {/* Create card */}
            <div className="lib-create-card" onClick={() => navigate('/playlists')}>
              <Plus size={28} />
              <span>Create Playlist</span>
            </div>
            {filterByName(playlists).map(pl => (
              <div key={pl.id} className="up-pl-card" onClick={() => navigate(`/playlists/${pl.id}`)}>
                <div className="up-pl-cover">
                  {pl.cover_url ? <img src={pl.cover_url} alt="" className="up-pl-img" />
                    : <div className="up-pl-empty"><Music size={28} /></div>}
                  <div className="up-pl-hover">
                    <button className="up-pl-play" onClick={e => e.stopPropagation()}><Play size={18} style={{ marginLeft: 2 }} /></button>
                  </div>
                </div>
                <div className="up-pl-info">
                  <h4 className="up-pl-name">{pl.name}</h4>
                  <p className="up-pl-meta">{pl.tracks_count || 0} tracks</p>
                </div>
              </div>
            ))}
            {playlists.length === 0 && <div className="up-empty" style={{ gridColumn: '1 / -1' }}>No playlists yet</div>}
          </div>
        )}

        {/* LIKED TRACKS */}
        {activeTab === 'likes' && (
          <>
            <div className="lib-hero">
              <div className="lib-hero-icon"><Heart size={32} /></div>
              <div>
                <h2 className="lib-hero-title">Liked Tracks</h2>
                <p className="lib-hero-count">{likedTracks.length} songs</p>
              </div>
              {likedTracks.length > 0 && (
                <button className="lib-hero-play" onClick={() => handlePlay(likedTracks[0], likedTracks)}>
                  <Play size={18} style={{ marginLeft: 2 }} />
                </button>
              )}
            </div>
            <div className="brw-genres" style={{ marginBottom: 16 }}>
              {GENRES.map(g => <button key={g.id} className={`brw-genre ${genre === g.id ? 'active' : ''}`} onClick={() => setGenre(g.id)}>{g.label}</button>)}
            </div>
            {loading ? <div className="up-empty"><Loader2 size={20} className="up-spin" /> Loading...</div> :
              (() => { const list = filterByGenre(likedTracks); return list.length ?
                <div className="up-tracklist">{list.map((t, i) => renderTrackRow(t, i, list))}</div>
                : <div className="up-empty">No liked tracks{genre !== 'all' ? ' in this category' : ''}</div>
              })()
            }
          </>
        )}

        {/* REPOSTS */}
        {activeTab === 'reposts' && (
          <>
            <div className="brw-genres" style={{ marginBottom: 16 }}>
              {GENRES.map(g => <button key={g.id} className={`brw-genre ${genre === g.id ? 'active' : ''}`} onClick={() => setGenre(g.id)}>{g.label}</button>)}
            </div>
            {loading ? <div className="up-empty"><Loader2 size={20} className="up-spin" /> Loading...</div> :
              (() => { const list = filterByGenre(reposts); return list.length ?
                <div className="up-tracklist">{list.map((t, i) => renderTrackRow(t, i, list))}</div>
                : <div className="up-empty">No reposts{genre !== 'all' ? ' in this category' : ''}</div>
              })()
            }
          </>
        )}

        {/* MY UPLOADS */}
        {activeTab === 'uploads' && (
          <>
            <div className="lib-uploads-header">
              <div className="lib-status-pills">
                {STATUSES.map(s => (
                  <button key={s.id} className={`brw-genre ${statusFilter === s.id ? 'active' : ''} ${s.id === 'pending' ? 'lib-pill--orange' : ''} ${s.id === 'rejected' ? 'lib-pill--red' : ''}`}
                    onClick={() => setStatusFilter(s.id)}>{s.label}</button>
                ))}
              </div>
              <button className="up-showmore" onClick={() => navigate('/upload')}><Upload size={14} /> Upload</button>
            </div>
            {loading ? <div className="up-empty"><Loader2 size={20} className="up-spin" /> Loading...</div> :
              (() => { const list = filterByStatus(myTracks); return list.length ?
                <div className="up-tracklist">{list.map((t, i) => renderTrackRow(t, i, list, { statusBadge: true, disabled: t.status !== 'approved' }))}</div>
                : <div className="up-empty">No uploads{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}</div>
              })()
            }
          </>
        )}

        {/* FOLLOWING */}
        {activeTab === 'following' && (
          loading ? <div className="up-empty"><Loader2 size={20} className="up-spin" /> Loading...</div> :
          (() => { const list = filterByName(following); return list.length ? (
            <div className="brw-artist-grid">
              {list.map(artist => (
                <div key={artist.id} className="brw-artist-card" onClick={() => navigate(`/users/${artist.id}`)}>
                  <div className="brw-artist-avatar">
                    {(artist.profile?.avatar_url || artist.avatar_url) ? <img src={artist.profile?.avatar_url || artist.avatar_url} alt="" />
                      : <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--sp-gold)' }}>{(artist.name || '?').charAt(0)}</span>}
                  </div>
                  <div className="brw-artist-name">{artist.profile?.display_name || artist.name}</div>
                  <div className="brw-artist-genre">{artist.tracks_count || 0} tracks</div>
                </div>
              ))}
            </div>
          ) : <div className="up-empty">Not following anyone yet</div> })()
        )}

        {/* HISTORY */}
        {activeTab === 'history' && (
          <>
            {history.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button className="up-showmore" onClick={handleClearHistory}><Trash2 size={13} /> Clear History</button>
              </div>
            )}
            {loading ? <div className="up-empty"><Loader2 size={20} className="up-spin" /> Loading...</div> :
              (() => {
                const list = query.trim() ? history.filter(h => {
                  const t = h.track || h; return (t.title || '').toLowerCase().includes(query.toLowerCase())
                }) : history
                const tracks = list.map(h => h.track || h).filter(Boolean)
                return tracks.length ?
                  <div className="up-tracklist">{tracks.map((t, i) => renderTrackRow(t, i, tracks))}</div>
                  : <div className="up-empty">No listening history</div>
              })()
            }
          </>
        )}
      </div>

      {playlistModalTrack && <AddToPlaylistModal track={playlistModalTrack} onClose={() => setPlaylistModalTrack(null)} />}
    </div>
  )
}
