import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'
import { copyToClipboard } from '../utils/clipboard'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import TrackMenu from '../components/TrackMenu'
import {
  Play, Pause, Heart, Repeat2, Plus, Share2, Music, Users, UserCheck, UserPlus,
  Settings, Loader2, ChevronLeft, ChevronRight, TrendingUp, Clock, Flame,
  BarChart3, Calendar, LayoutGrid, List as ListIcon, SlidersHorizontal, Filter
} from 'lucide-react'

/* ══════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════ */
const GENRES = [
  { id: 'all', label: 'All' },
  { id: 'Nasheeds', label: 'Nasheeds' },
  { id: 'Quran', label: 'Quran' },
  { id: 'Lectures', label: 'Lectures' },
  { id: 'Duas', label: 'Duas' },
  { id: 'Broadcast', label: 'Podcasts' },
]
const SORT_OPTIONS = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Most Played' },
]

/* ══════════════════════════════════════
   BADGES
   ══════════════════════════════════════ */
const OwnerBadge = () => (
  <span className="up-owner-badge" title="Owner">
    <img src="/owner-badge.png" alt="Owner" className="up-owner-badge-img" />
  </span>
)
const VerifiedBadge = () => (
  <span className="up-verified-badge" title="Verified Artist">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="var(--sp-gold)"/>
      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </span>
)
const getUserType = (user) => {
  if (!user) return { label: 'Listener', cls: '' }
  const plan = user.plan_slug || 'free'
  const isArtist = user.is_artist
  const isPro = plan !== 'free' && plan
  if (isArtist && isPro) return { label: 'Artist Pro', cls: 'up-type--pro' }
  if (isArtist) return { label: 'Artist', cls: 'up-type--artist' }
  if (isPro) return { label: 'Pro', cls: 'up-type--pro' }
  return { label: 'Listener', cls: '' }
}

/* ══════════════════════════════════════
   HELPERS
   ══════════════════════════════════════ */
const fmtCount = (n) => { if (!n && n !== 0) return '0'; if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`; return String(n) }
const fmtDur = (s) => { if (!s) return '0:00'; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}` }
const fmtPlays = (n) => fmtCount(n || 0)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''

/* ══════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════ */
export default function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

  /* ── Core state ── */
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('popular')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [tracksCount, setTracksCount] = useState(0)

  /* ── Tab data ── */
  const [popularTracks, setPopularTracks] = useState([])
  const [latestReleases, setLatestReleases] = useState([])
  const [fansAlsoLike, setFansAlsoLike] = useState([])
  const [tracks, setTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [likes, setLikes] = useState([])
  const [reposts, setReposts] = useState([])
  const [tabLoading, setTabLoading] = useState(false)

  /* ── Tracks tab filters ── */
  const [trackGenre, setTrackGenre] = useState('all')
  const [trackSort, setTrackSort] = useState('latest')
  const [tracksPage, setTracksPage] = useState(1)
  const [tracksLastPage, setTracksLastPage] = useState(1)
  const [tracksTotal, setTracksTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  /* ── Interaction state ── */
  const [likedTrackIds, setLikedTrackIds] = useState(new Set())
  const [repostedTrackIds, setRepostedTrackIds] = useState(new Set())
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null)

  /* ── Likes/Reposts client-side filter ── */
  const [likesGenre, setLikesGenre] = useState('all')
  const [repostsGenre, setRepostsGenre] = useState('all')

  const isOwnProfile = currentUser && (currentUser.id === parseInt(id) || currentUser._id === id)
  const scrollRef = useRef(null)

  /* ══════════════════════════════════════
     DATA FETCHING
     ══════════════════════════════════════ */

  useEffect(() => { fetchUserData() }, [id])
  useEffect(() => { if (activeTab !== 'tracks') fetchTabData() }, [activeTab, id])

  // Tracks tab: re-fetch on genre/sort change
  useEffect(() => {
    if (activeTab === 'tracks') fetchTracksTab(1)
  }, [activeTab, id, trackGenre, trackSort])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const res = await api.getUser(id)
      const u = res.data || res
      setUser(u)
      setFollowersCount(u.followers_count || u.followersCount || 0)
      setFollowingCount(u.following_count || u.followingCount || 0)
      setTracksCount(u.tracks_count || u.tracksCount || 0)
      if (u.is_followed !== undefined) setIsFollowing(u.is_followed)
      else if (u.is_following !== undefined) setIsFollowing(u.is_following)
      else if (currentUser) {
        try { const f = await api.getFollowers(id); const list = f.data || f || []; setIsFollowing(list.some(x => (x.id || x._id) === (currentUser.id || currentUser._id))) } catch { setIsFollowing(false) }
      }
      if (currentUser) {
        try { const lr = await api.getUserLikes(currentUser.id); setLikedTrackIds(new Set((Array.isArray(lr) ? lr : lr.data || []).map(t => t.id || t._id))) } catch {}
        try { const rr = await api.getUserReposts(currentUser.id); setRepostedTrackIds(new Set((Array.isArray(rr) ? rr : rr.data || []).map(t => t.id || t._id))) } catch {}
      }
    } catch { toast.error('Failed to load profile') }
    finally { setLoading(false) }
  }

  const fetchTabData = async () => {
    setTabLoading(true)
    try {
      switch (activeTab) {
        case 'popular': {
          // Load top tracks, latest releases, fans also like in parallel
          const [popRes, latestRes, homeRes] = await Promise.all([
            api.getUserTracks(id, 'popular'),
            api.getUserTracks(id, 'latest'),
            api.getHomePage().catch(() => null),
          ])
          const pop = Array.isArray(popRes) ? popRes : []
          setPopularTracks(pop.slice(0, 10))
          const latest = Array.isArray(latestRes) ? latestRes : []
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
          setLatestReleases(latest.filter(t => new Date(t.created_at) > thirtyDaysAgo).slice(0, 6))
          // Fans also like from rising artists
          const risingSection = homeRes?.sections?.find(s => s.key === 'rising_artists')
          const artists = (risingSection?.tracks || []).filter(a => a.id !== parseInt(id)).slice(0, 6)
          setFansAlsoLike(artists)
          break
        }
        case 'playlists': { const r = await api.getUserPlaylists(id); setPlaylists(r.data || r || []); break }
        case 'likes': { const r = await api.getUserLikes(id); setLikes(Array.isArray(r) ? r : r.data || []); break }
        case 'reposts': { const r = await api.getUserReposts(id); setReposts(Array.isArray(r) ? r : r.data || []); break }
      }
    } catch {}
    finally { setTabLoading(false) }
  }

  const fetchTracksTab = async (page = 1) => {
    if (page === 1) setTabLoading(true)
    else setLoadingMore(true)
    try {
      const res = await api.getUserTracks(id, {
        sort: trackSort,
        category: trackGenre,
        page,
      })
      if (page === 1) {
        setTracks(res.data || [])
      } else {
        setTracks(prev => [...prev, ...(res.data || [])])
      }
      setTracksPage(res.current_page || 1)
      setTracksLastPage(res.last_page || 1)
      setTracksTotal(res.total || 0)
    } catch {}
    finally { setTabLoading(false); setLoadingMore(false) }
  }

  const handleShowMore = () => {
    if (tracksPage < tracksLastPage && !loadingMore) {
      fetchTracksTab(tracksPage + 1)
    }
  }

  /* ══════════════════════════════════════
     ACTIONS
     ══════════════════════════════════════ */

  const handleToggleFollow = async () => {
    if (!currentUser) { toast.error('Please log in to follow'); return }
    try { await api.toggleFollow(id); setIsFollowing(p => !p); setFollowersCount(p => isFollowing ? p - 1 : p + 1); toast.success(isFollowing ? 'Unfollowed' : 'Following') } catch { toast.error('Failed') }
  }

  const handlePlayTrack = (track, list) => {
    const tid = track.id || track._id, cid = currentTrack?.id || currentTrack?._id
    if (cid === tid) togglePlay(); else playTrack(track, list || [track])
  }

  const handlePlayAll = () => {
    const list = activeTab === 'popular' ? popularTracks : activeTab === 'likes' ? likes : activeTab === 'reposts' ? reposts : tracks
    if (list.length > 0) handlePlayTrack(list[0], list)
  }

  const handleToggleLike = async (trackId, e) => {
    e.stopPropagation()
    if (!currentUser) { toast.error('Please log in'); return }
    const wasLiked = likedTrackIds.has(trackId)
    setLikedTrackIds(prev => { const n = new Set(prev); wasLiked ? n.delete(trackId) : n.add(trackId); return n })
    try { const res = await api.toggleLike(trackId); if (res.is_liked !== undefined) setLikedTrackIds(prev => { const n = new Set(prev); res.is_liked ? n.add(trackId) : n.delete(trackId); return n }) }
    catch { setLikedTrackIds(prev => { const n = new Set(prev); wasLiked ? n.add(trackId) : n.delete(trackId); return n }); toast.error('Failed') }
  }

  const handleToggleRepost = async (trackId, e) => {
    e.stopPropagation()
    if (!currentUser) { toast.error('Please log in'); return }
    const was = repostedTrackIds.has(trackId)
    setRepostedTrackIds(prev => { const n = new Set(prev); was ? n.delete(trackId) : n.add(trackId); return n })
    toast.success(was ? 'Repost removed' : 'Reposted')
    try { const res = await api.toggleRepost(trackId); if (res.is_reposted !== undefined) setRepostedTrackIds(prev => { const n = new Set(prev); res.is_reposted ? n.add(trackId) : n.delete(trackId); return n }) }
    catch { setRepostedTrackIds(prev => { const n = new Set(prev); was ? n.add(trackId) : n.delete(trackId); return n }); toast.error('Failed') }
  }

  const isTrackPlaying = (track) => (currentTrack?.id || currentTrack?._id) === (track.id || track._id) && isPlaying

  const tabs = [
    { key: 'popular', label: 'Overview' },
    { key: 'tracks', label: 'Tracks' },
    { key: 'playlists', label: 'Playlists' },
    { key: 'likes', label: 'Likes' },
    { key: 'reposts', label: 'Reposts' },
  ]

  /* ══════════════════════════════════════
     RENDERERS
     ══════════════════════════════════════ */

  const renderTrackRow = (track, i, trackList) => {
    const tid = track.id || track._id
    const playing = isTrackPlaying(track)
    const liked = likedTrackIds.has(tid)
    const reposted = repostedTrackIds.has(tid)
    return (
      <div key={tid || i} className={`up-track${playing ? ' playing' : ''}`} onClick={() => navigate(`/tracks/${tid}`)}>
        <div className="up-track-left">
          <span className="up-track-num" onClick={e => { e.stopPropagation(); handlePlayTrack(track, trackList) }}>
            {playing ? <span className="up-track-eq"><span /><span /><span /></span> : i + 1}
          </span>
          <div className="up-track-thumb" onClick={e => { e.stopPropagation(); handlePlayTrack(track, trackList) }}>
            {track.cover_url ? <img src={track.cover_url} alt="" /> : <div className="up-track-thumb-placeholder"><Music size={16} /></div>}
            <div className="up-track-thumb-overlay">{playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 1 }} />}</div>
          </div>
          <div className="up-track-info">
            <span className={`up-track-title${playing ? ' active' : ''}`}>{track.title}</span>
            <span className="up-track-artist">{track.user?.name || ''}</span>
            <span className="up-track-plays-sub">{fmtPlays(track.plays_count || track.plays)} plays</span>
          </div>
        </div>
        <div className="up-track-right" onClick={e => e.stopPropagation()}>
          <button className={`up-act${liked ? ' up-act--on' : ''}`} onClick={e => handleToggleLike(tid, e)}><Heart size={15} fill={liked ? 'currentColor' : 'none'} /></button>
          <button className={`up-act${reposted ? ' up-act--on' : ''}`} onClick={e => handleToggleRepost(tid, e)}><Repeat2 size={15} /></button>
          <button className="up-act" onClick={e => { e.stopPropagation(); setPlaylistModalTrack(track) }}><Plus size={15} /></button>
          <button className="up-act" onClick={e => { e.stopPropagation(); copyToClipboard(`${window.location.origin}/tracks/${tid}`); toast.success('Link copied') }}><Share2 size={15} /></button>
          <TrackMenu
            track={track}
            trackList={trackList}
            onAddToPlaylist={(t) => setPlaylistModalTrack(t)}
            onLike={(id, e) => handleToggleLike(id, e)}
            onRepost={(id, e) => handleToggleRepost(id, e)}
            isLiked={liked}
            isReposted={reposted}
          />
          <span className="up-track-duration">{fmtDur(track.duration_seconds || track.duration)}</span>
        </div>
      </div>
    )
  }

  const renderTrackList = (trackList) => {
    if (tabLoading) return <div className="up-empty"><Loader2 size={20} className="up-spin" /> Loading...</div>
    if (!trackList?.length) return <div className="up-empty">Nothing here yet</div>
    return <div className="up-tracklist">{trackList.map((t, i) => renderTrackRow(t, i, trackList))}</div>
  }

  /* ── Genre pills (reusable) ── */
  const renderGenrePills = (active, setActive) => (
    <div className="brw-genres" style={{ marginBottom: 16 }}>
      {GENRES.map(g => (
        <button key={g.id} className={`brw-genre ${active === g.id ? 'active' : ''}`} onClick={() => setActive(g.id)}>
          {g.label}
        </button>
      ))}
    </div>
  )

  /* ── Client-side genre filter ── */
  const filterByGenre = (list, genre) => {
    if (genre === 'all') return list
    return list.filter(t => {
      const cat = (t.category || '').toLowerCase()
      const g = genre.toLowerCase()
      return cat === g || cat.startsWith(g) || g.startsWith(cat)
    })
  }

  /* ══════════════════════════════════════
     POPULAR / OVERVIEW TAB
     ══════════════════════════════════════ */
  const renderPopularTab = () => {
    if (tabLoading && !popularTracks.length) return <div className="up-empty"><Loader2 size={20} className="up-spin" /> Loading...</div>

    return (
      <>
        {/* Top Tracks */}
        {popularTracks.length > 0 && (
          <div className="up-section">
            <div className="up-section-header">
              <Flame size={18} style={{ color: 'var(--sp-gold)' }} />
              <h3>Top Tracks</h3>
            </div>
            <div className="up-tracklist">
              {popularTracks.map((t, i) => renderTrackRow(t, i, popularTracks))}
            </div>
          </div>
        )}

        {/* Latest Releases */}
        {latestReleases.length > 0 && (
          <div className="up-section">
            <div className="up-section-header">
              <Clock size={18} style={{ color: 'var(--sp-gold)' }} />
              <h3>Latest Releases</h3>
            </div>
            <div className="up-scroll-wrapper">
              <button className="up-scroll-btn" onClick={() => scrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}><ChevronLeft size={14} /></button>
              <div className="up-scroll-row" ref={scrollRef}>
                {latestReleases.map(track => {
                  const playing = isTrackPlaying(track)
                  return (
                    <div key={track.id} className="brw-card up-release-card" onClick={() => navigate(`/tracks/${track.id}`)}>
                      <div className="brw-card-img" style={{ background: track.cover_url ? undefined : 'linear-gradient(135deg, #1a4a2e 0%, #2d6b47 50%, #c9a84c 100%)' }}>
                        {track.cover_url ? <img src={track.cover_url} alt="" /> : <Music size={28} className="brw-card-music-icon" />}
                        <div className="brw-card-overlay">
                          <button className="brw-card-play-btn" onClick={e => { e.stopPropagation(); handlePlayTrack(track, latestReleases) }}>
                            {playing ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                          </button>
                        </div>
                        {playing && <div className="brw-card-wave"><div className="brw-wave">{[0,200,400,100,300].map((d,i) => <div key={i} className="brw-wave-bar" style={{ animationDelay: `${d}ms`, animationDuration: `${700+i*100}ms` }} />)}</div></div>}
                      </div>
                      <div className="brw-card-body">
                        <div className="brw-card-body-left">
                          <p className={`brw-card-title ${playing ? 'active' : ''}`}>{track.title}</p>
                          <p className="brw-card-sub">{track.user?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      <p className="brw-card-plays">{fmtPlays(track.plays_count || track.plays)} plays</p>
                    </div>
                  )
                })}
              </div>
              <button className="up-scroll-btn" onClick={() => scrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}

        {/* Fans Also Like */}
        {fansAlsoLike.length > 0 && (
          <div className="up-section">
            <div className="up-section-header">
              <Users size={18} style={{ color: 'var(--sp-gold)' }} />
              <h3>Fans Also Like</h3>
            </div>
            <div className="brw-artist-grid">
              {fansAlsoLike.map(artist => (
                <div key={artist.id} className="brw-artist-card" onClick={() => navigate(`/users/${artist.id}`)}>
                  <div className="brw-artist-avatar">
                    {artist.avatar_url ? <img src={artist.avatar_url} alt={artist.name} /> : <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--sp-gold)' }}>{artist.name?.charAt(0)}</span>}
                  </div>
                  <div className="brw-artist-name">{artist.name}</div>
                  <div className="brw-artist-genre">{artist.track_count || 0} tracks</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About */}
        <div className="up-section">
          <div className="up-section-header">
            <BarChart3 size={18} style={{ color: 'var(--sp-gold)' }} />
            <h3>About</h3>
          </div>
          <div className="up-about">
            <div className="up-about-stat"><span className="up-about-val">{fmtCount(tracksCount)}</span><span className="up-about-label">Tracks</span></div>
            <div className="up-about-stat"><span className="up-about-val">{fmtCount(followersCount)}</span><span className="up-about-label">Followers</span></div>
            <div className="up-about-stat"><span className="up-about-val">{fmtCount(followingCount)}</span><span className="up-about-label">Following</span></div>
            {user?.created_at && <div className="up-about-stat"><span className="up-about-val"><Calendar size={14} style={{ marginRight: 4 }} />{fmtDate(user.created_at)}</span><span className="up-about-label">Joined</span></div>}
          </div>
        </div>
      </>
    )
  }

  /* ══════════════════════════════════════
     TRACKS TAB
     ══════════════════════════════════════ */
  const renderTracksTab = () => (
    <>
      {/* Filter bar */}
      <div className="up-filter-bar">
        <div className="up-filter-pills">
          {GENRES.map(g => (
            <button key={g.id} className={`brw-genre ${trackGenre === g.id ? 'active' : ''}`} onClick={() => { setTrackGenre(g.id); setTracksPage(1) }}>
              {g.label}
            </button>
          ))}
        </div>
        <div className="up-filter-right">
          <div className="up-sort-pills">
            {SORT_OPTIONS.map(s => (
              <button key={s.id} className={`brw-genre ${trackSort === s.id ? 'active' : ''}`} onClick={() => { setTrackSort(s.id); setTracksPage(1) }}>
                {s.label}
              </button>
            ))}
          </div>
          {tracksTotal > 0 && <span className="up-track-count">{tracksTotal} tracks</span>}
        </div>
      </div>

      {/* Track list */}
      {tabLoading && !tracks.length ? (
        <div className="up-empty"><Loader2 size={20} className="up-spin" /> Loading...</div>
      ) : !tracks.length ? (
        <div className="up-empty">No tracks found</div>
      ) : (
        <div className="up-tracklist">
          {tracks.map((t, i) => renderTrackRow(t, i, tracks))}
        </div>
      )}

      {/* Show More */}
      {tracksPage < tracksLastPage && (
        <div className="up-showmore-wrap">
          <button className="up-showmore" onClick={handleShowMore} disabled={loadingMore}>
            {loadingMore ? <><Loader2 size={14} className="up-spin" /> Loading...</> : 'Show More'}
          </button>
        </div>
      )}
    </>
  )

  /* ══════════════════════════════════════
     PLAYLISTS TAB
     ══════════════════════════════════════ */
  const renderPlaylistsTab = () => {
    if (tabLoading) return <div className="up-empty"><Loader2 size={20} className="up-spin" /> Loading...</div>
    if (!playlists?.length) return (
      <div className="up-empty">
        <Music size={32} style={{ color: 'var(--sp-text-muted)', marginBottom: 8 }} />
        <p>No playlists yet</p>
        {isOwnProfile && <button onClick={() => navigate('/playlists')} className="up-showmore" style={{ marginTop: 16 }}><Plus size={14} /> Create Playlist</button>}
      </div>
    )
    return (
      <div className="up-pl-grid">
        {playlists.map(pl => {
          const covers = pl.preview_covers || []
          const hasCover = !!pl.cover_url
          const hasMosaic = !hasCover && covers.length >= 4
          const hasSingle = !hasCover && !hasMosaic && covers.length > 0

          return (
            <div key={pl.id} className="up-pl-card" onClick={() => navigate(`/playlists/${pl.id}`)}>
              <div className="up-pl-cover">
                {hasCover ? (
                  <img src={pl.cover_url} alt="" className="up-pl-img" />
                ) : covers.length >= 4 ? (
                  <div className="up-pl-mosaic">
                    {covers.slice(0, 4).map((c, i) => <img key={i} src={c} alt="" />)}
                  </div>
                ) : covers[0] ? (
                  <img src={covers[0]} alt="" className="up-pl-img" />
                ) : (
                  <div className="up-pl-empty"><Music size={28} /></div>
                )}
                <div className="up-pl-hover">
                  <button className="up-pl-play" onClick={e => e.stopPropagation()}>
                    <Play size={18} style={{ marginLeft: 2 }} />
                  </button>
                </div>
              </div>
              <div className="up-pl-info">
                <h4 className="up-pl-name">{pl.title || pl.name}</h4>
                {pl.description && <p className="up-pl-desc">{pl.description}</p>}
                <p className="up-pl-meta">{pl.tracks_count || 0} tracks</p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  /* ══════════════════════════════════════
     LIKES / REPOSTS TABS (with client-side genre filter)
     ══════════════════════════════════════ */
  const renderFilteredListTab = (list, genre, setGenre) => {
    if (tabLoading) return <div className="up-empty"><Loader2 size={20} className="up-spin" /> Loading...</div>
    const filtered = filterByGenre(list, genre)
    return (
      <>
        {renderGenrePills(genre, setGenre)}
        {filtered.length === 0
          ? <div className="up-empty">Nothing here yet</div>
          : <div className="up-tracklist">{filtered.map((t, i) => renderTrackRow(t, i, filtered))}</div>
        }
      </>
    )
  }

  /* ══════════════════════════════════════
     TAB ROUTER
     ══════════════════════════════════════ */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'popular': return renderPopularTab()
      case 'tracks': return renderTracksTab()
      case 'playlists': return renderPlaylistsTab()
      case 'likes': return renderFilteredListTab(likes, likesGenre, setLikesGenre)
      case 'reposts': return renderFilteredListTab(reposts, repostsGenre, setRepostsGenre)
      default: return null
    }
  }

  /* ══════════════════════════════════════
     LOADING / ERROR STATES
     ══════════════════════════════════════ */
  if (loading) return <div className="up-page"><div className="up-loading"><Loader2 size={24} className="up-spin" /><span>Loading profile...</span></div></div>

  if (!user) return (
    <div className="up-page">
      <div className="up-empty" style={{ paddingTop: '20vh' }}>
        <Music size={48} style={{ color: 'var(--sp-text-muted)', marginBottom: 16 }} />
        <p>User not found</p>
        <button onClick={() => navigate('/home')} className="up-showmore" style={{ marginTop: 16 }}>Go Home</button>
      </div>
    </div>
  )

  // Privacy enforcement: show limited view for private profiles
  const isPrivate = user.is_private && !isOwnProfile

  if (isPrivate) {
    const privAvatar = user.avatar_url || user.avatarUrl || user.profile_image
    const privName = user.display_name || user.displayName || user.username || user.name || 'User'
    return (
      <div className="up-page">
        <div className="up-banner">
          <div className="up-banner-overlay" />
          <div className="up-banner-content">
            <div className="up-avatar-wrap">
              {privAvatar ? <img className="up-avatar" src={privAvatar} alt={privName} /> : <div className="up-avatar up-avatar-placeholder">{privName.charAt(0).toUpperCase()}</div>}
            </div>
            <div className="up-header-info">
              {(() => { const t = getUserType(user); return <span className={`up-type ${t.cls}`}>{t.label}</span> })()}
              <h1 className="up-name">
                {privName}
                {user.is_founder && <OwnerBadge />}
                {(user.is_verified || user.artist_verified_at) && !user.is_founder && <VerifiedBadge />}
              </h1>
            </div>
            <div className="up-stats">
              <div className="up-stat"><span className="up-stat-num">{fmtCount(followersCount)}</span><span className="up-stat-label">Followers</span></div>
              <div className="up-stat"><span className="up-stat-num">{fmtCount(followingCount)}</span><span className="up-stat-label">Following</span></div>
            </div>
            {!isOwnProfile && currentUser && (
              <div className="up-actions">
                <button className={`up-follow-btn${isFollowing ? ' following' : ''}`} onClick={handleToggleFollow}>
                  {isFollowing ? <><UserCheck size={15}/> Following</> : <><UserPlus size={15}/> Follow</>}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="up-empty" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--sp-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <p style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--sp-text)', marginBottom: 6 }}>This account is private</p>
          <p style={{ color: 'var(--sp-text-muted)', fontSize: '0.88rem' }}>Follow this user to see their tracks, likes, and playlists.</p>
        </div>
      </div>
    )
  }

  const avatarUrl = user.avatar_url || user.avatarUrl || user.profile_image
  const headerUrl = user.is_founder ? null : (user.header_url || user.headerUrl || user.banner_url)
  const displayName = user.display_name || user.displayName || user.username || user.name || 'User'
  const bio = user.bio || user.description || ''

  /* ══════════════════════════════════════
     RENDER
     ══════════════════════════════════════ */
  return (
    <div className="up-page">
      {/* ── Banner ── */}
      <div className="up-banner" style={headerUrl ? { backgroundImage: `url(${headerUrl})` } : undefined}>
        <div className="up-banner-overlay" />
        <div className="up-banner-content">
          <div className="up-avatar-wrap">
            {avatarUrl ? <img className="up-avatar" src={avatarUrl} alt={displayName} /> : <div className="up-avatar up-avatar-placeholder">{displayName.charAt(0).toUpperCase()}</div>}
          </div>
          <div className="up-header-info">
            {(() => { const t = getUserType(user); return <span className={`up-type ${t.cls}`}>{t.label}</span> })()}
            <h1 className="up-name">
              {displayName}
              {user.is_founder && <OwnerBadge />}
              {(user.is_verified || user.artist_verified_at) && !user.is_founder && <VerifiedBadge />}
            </h1>
            {bio && <p className="up-bio">{bio}</p>}
            {user.social_links && Object.values(user.social_links).some(v => v) && (
              <div className="up-social-links">
                {user.social_links.instagram && (
                  <a href={user.social_links.instagram.startsWith('http') ? user.social_links.instagram : `https://instagram.com/${user.social_links.instagram}`} target="_blank" rel="noopener noreferrer" className="up-social-link" title="Instagram">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
                  </a>
                )}
                {user.social_links.youtube && (
                  <a href={user.social_links.youtube.startsWith('http') ? user.social_links.youtube : `https://youtube.com/${user.social_links.youtube}`} target="_blank" rel="noopener noreferrer" className="up-social-link" title="YouTube">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 00-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>
                  </a>
                )}
                {user.social_links.twitter && (
                  <a href={user.social_links.twitter.startsWith('http') ? user.social_links.twitter : `https://x.com/${user.social_links.twitter}`} target="_blank" rel="noopener noreferrer" className="up-social-link" title="X / Twitter">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
                {user.social_links.tiktok && (
                  <a href={user.social_links.tiktok.startsWith('http') ? user.social_links.tiktok : `https://tiktok.com/@${user.social_links.tiktok}`} target="_blank" rel="noopener noreferrer" className="up-social-link" title="TikTok">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.4a8.16 8.16 0 004.77 1.53V7.48a4.85 4.85 0 01-1-.79z"/></svg>
                  </a>
                )}
                {user.social_links.website && (
                  <a href={user.social_links.website.startsWith('http') ? user.social_links.website : `https://${user.social_links.website}`} target="_blank" rel="noopener noreferrer" className="up-social-link" title="Website">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                  </a>
                )}
              </div>
            )}
            <div className="up-stats">
              <Link to={`/users/${id}/followers`} className="up-stat"><span className="up-stat-value">{fmtCount(followersCount)}</span><span className="up-stat-label">Followers</span></Link>
              <div className="up-stat-divider" />
              <Link to={`/users/${id}/following`} className="up-stat"><span className="up-stat-value">{fmtCount(followingCount)}</span><span className="up-stat-label">Following</span></Link>
              <div className="up-stat-divider" />
              <div className="up-stat"><span className="up-stat-value">{fmtCount(tracksCount)}</span><span className="up-stat-label">Tracks</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Bar ── */}
      <div className="up-actions">
        <button className="up-play-btn" onClick={handlePlayAll} title="Play all"><Play size={20} style={{ marginLeft: 2 }} /></button>
        {!isOwnProfile ? (
          <button className={`up-follow-btn${isFollowing ? ' following' : ''}`} onClick={handleToggleFollow}>
            {isFollowing ? <><UserCheck size={15} /> Following</> : <><UserPlus size={15} /> Follow</>}
          </button>
        ) : (
          <button className="up-follow-btn" onClick={() => navigate('/settings')}><Settings size={15} /> Edit Profile</button>
        )}
        <button className="up-share-btn" onClick={() => { copyToClipboard(window.location.href); toast.success('Profile link copied') }}><Share2 size={15} /></button>
      </div>

      {/* ── Tabs ── */}
      <div className="up-tabs">
        {tabs.map(tab => (
          <button key={tab.key} className={`up-tab${activeTab === tab.key ? ' active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="up-content">{renderTabContent()}</div>

      {playlistModalTrack && <AddToPlaylistModal track={playlistModalTrack} onClose={() => setPlaylistModalTrack(null)} />}
    </div>
  )
}
