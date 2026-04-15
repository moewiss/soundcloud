import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'
import { copyToClipboard } from '../utils/clipboard'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import TrackMenu from '../components/TrackMenu'
import {
  Search as SearchIcon, TrendingUp, Flame, Clock, LayoutGrid, List,
  Play, Pause, Heart, Music, Music2, UserCheck, Sparkles, Users, BarChart3,
  Compass, Zap, Headphones, Radio, BookOpen, ChevronLeft, ChevronRight, X,
  SlidersHorizontal, Timer, ArrowUpRight, ArrowLeft, Loader, Repeat2, Plus, Share2
} from 'lucide-react'

/* ════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════ */

const fmt = (s) => {
  if (!s) return '0:00'
  const m = Math.floor(s / 60), sec = String(Math.floor(s % 60)).padStart(2, '0')
  return `${m}:${sec}`
}
const fmtPlays = (p) => {
  if (!p) return '0'
  if (p >= 1e6) return `${(p / 1e6).toFixed(1)}M`
  if (p >= 1e3) return `${(p / 1e3).toFixed(0)}K`
  return p.toString()
}

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

/* ════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════ */

const TABS = [
  { id: 'all', label: 'All', icon: Compass },
  { id: 'tracks', label: 'Nasheeds', icon: Flame },
  { id: 'playlists', label: 'Playlists', icon: Clock },
  { id: 'artists', label: 'Artists', icon: Users },
]

const GENRES = [
  { id: 'all', label: 'All' },
  { id: 'Nasheeds', label: 'Nasheeds' },
  { id: 'Quran', label: 'Quran' },
  { id: 'Lectures', label: 'Lectures' },
  { id: 'Duas', label: 'Duas' },
  { id: 'Broadcast', label: 'Podcasts' },
]

const DURATIONS = [
  { id: 'all', label: 'Any Length', icon: null },
  { id: 'short', label: '< 5 min', icon: null },
  { id: 'medium', label: '5\u201330 min', icon: null },
  { id: 'long', label: '> 30 min', icon: null },
]

const SORTS = [
  { id: 'relevant', label: 'Relevant' },
  { id: 'newest', label: 'Newest' },
  { id: 'most_played', label: 'Most Played' },
]

const SEARCH_CATEGORIES = [
  { id: 'Nasheeds', label: 'Nasheeds', Icon: Music, gradient: 'linear-gradient(135deg, #1a4a2e, #2d6b47)' },
  { id: 'Quran', label: 'Quran', Icon: BookOpen, gradient: 'linear-gradient(135deg, #0d3020, #1a5a3e)' },
  { id: 'Lectures', label: 'Lectures', Icon: Radio, gradient: 'linear-gradient(135deg, #1a2a3e, #2a4a6e)' },
  { id: 'Duas', label: 'Duas', Icon: Heart, gradient: 'linear-gradient(135deg, #2a1a2e, #4a2d4b)' },
  { id: 'Broadcast', label: 'Podcasts', Icon: Headphones, gradient: 'linear-gradient(135deg, #2a1a1a, #5a2d2d)' },
  { id: 'all', label: 'All', Icon: Compass, gradient: 'linear-gradient(135deg, #1a2a1a, #3a4a3a)' },
]

/* Section style config matching backend keys */
const SECTION_ICON = {
  continue_listening: { Icon: Headphones, color: '#c5a449' },
  recommended:        { Icon: Sparkles, color: '#c5a449' },
  because_liked:      { Icon: Heart, color: '#c5a449', fill: true },
  from_followed:      { Icon: Users, color: '#c5a449' },
  trending:           { Icon: Flame, color: '#E8653A' },
  viral:              { Icon: Zap, color: '#C05040' },
  rising_artists:     { Icon: TrendingUp, color: '#c5a449' },
  most_played:        { Icon: BarChart3, color: '#c5a449' },
  new_releases:       { Icon: Clock, color: '#c5a449' },
  popular_category:   { Icon: Flame, color: '#2A6B4F' },
  nasheeds:           { Icon: Music, color: '#1F7A5A' },
  podcasts:           { Icon: Radio, color: '#C05040' },
  lectures:           { Icon: BookOpen, color: '#4B7BBE' },
}

/* ════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ════════════════════════════════════════════════════════ */

function WaveIndicator() {
  return (
    <div className="brw-wave">
      {[0, 200, 400, 100, 300].map((d, i) => (
        <div key={i} className="brw-wave-bar" style={{ animationDelay: `${d}ms`, animationDuration: `${700 + i * 100}ms` }} />
      ))}
    </div>
  )
}

/* --- Grid card --- */
function GridCard({ track, currentTrack, isCurrentPlaying, handlePlay, handleLike, trackList, navigate }) {
  return (
    <div className="brw-card" onClick={() => navigate(`/tracks/${track.id}`)}>
      <div className="brw-card-img" style={{ background: track.cover_url ? undefined : 'linear-gradient(135deg, #1a4a2e 0%, #2d6b47 50%, #c9a84c 100%)' }}>
        {track.cover_url ? <img src={track.cover_url} alt="" /> : <Music size={32} className="brw-card-music-icon" />}
        <div className="brw-card-overlay">
          <button className="brw-card-play-btn" onClick={e => { e.stopPropagation(); handlePlay(track, trackList) }}>
            {isCurrentPlaying(track) ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
          </button>
        </div>
        {isCurrentPlaying(track) && <div className="brw-card-wave"><WaveIndicator /></div>}
      </div>
      <div className="brw-card-body">
        <div className="brw-card-body-left">
          <p className={`brw-card-title ${currentTrack?.id === track.id ? 'active' : ''}`}>{track.title}</p>
          <p className="brw-card-sub">{track.user?.name || 'Unknown'}</p>
        </div>
        <div className="brw-card-actions" onClick={e => e.stopPropagation()}>
          <button className={`brw-like-btn brw-card-like ${track.is_liked ? 'liked' : ''}`} onClick={e => handleLike(track.id, e)}>
            <Heart size={14} className={track.is_liked ? 'fill' : ''} />
          </button>
          <TrackMenu track={track} trackList={trackList} size={14} />
        </div>
      </div>
      <p className="brw-card-plays">{fmtPlays(track.plays_count || track.plays)} plays</p>
    </div>
  )
}

/* --- List row (up-track style) --- */
function ListRow({ track, idx, currentTrack, isCurrentPlaying, handlePlay, handleLike, handleRepost, trackList, navigate, setPlaylistModalTrack }) {
  const playing = isCurrentPlaying(track)
  return (
    <div className={`up-track${playing ? ' playing' : ''}`} onClick={() => navigate(`/tracks/${track.id}`)}>
      <div className="up-track-left">
        <span className="up-track-num" onClick={e => { e.stopPropagation(); handlePlay(track, trackList) }}>
          {playing ? <span className="up-track-eq"><span /><span /><span /></span> : idx + 1}
        </span>
        <div className="up-track-thumb" onClick={e => { e.stopPropagation(); handlePlay(track, trackList) }}>
          {track.cover_url ? <img src={track.cover_url} alt="" /> : <div className="up-track-thumb-placeholder"><Music size={16} /></div>}
          <div className="up-track-thumb-overlay">{playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 1 }} />}</div>
        </div>
        <div className="up-track-info">
          <span className={`up-track-title${playing ? ' active' : ''}`}>{track.title}</span>
          <span className="up-track-artist">{track.user?.name || 'Unknown'}</span>
          <span className="up-track-plays-sub">{fmtPlays(track.plays_count || track.plays)} plays</span>
        </div>
      </div>
      <div className="up-track-right" onClick={e => e.stopPropagation()}>
        <button className={`up-act${track.is_liked ? ' up-act--on' : ''}`} onClick={e => handleLike(track.id, e)}><Heart size={15} fill={track.is_liked ? 'currentColor' : 'none'} /></button>
        <button className={`up-act${track.is_reposted ? ' up-act--on' : ''}`} onClick={e => handleRepost(track.id, e)}><Repeat2 size={15} /></button>
        <button className="up-act" onClick={() => setPlaylistModalTrack(track)}><Plus size={15} /></button>
        <button className="up-act" onClick={() => { copyToClipboard(`${window.location.origin}/tracks/${track.id}`); toast.success('Link copied') }}><Share2 size={15} /></button>
        <TrackMenu
          track={track}
          trackList={trackList}
          onAddToPlaylist={(t) => setPlaylistModalTrack(t)}
          onLike={(id, e) => handleLike(id, e)}
          onRepost={(id, e) => handleRepost(id, e)}
          isLiked={track.is_liked}
          isReposted={track.is_reposted}
        />
        <span className="up-track-duration">{fmt(track.duration_seconds || track.duration)}</span>
      </div>
    </div>
  )
}

/* --- Track section (grid or list) --- */
function TrackSection({ tracks, viewMode, currentTrack, isCurrentPlaying, handlePlay, handleLike, handleRepost, navigate, setPlaylistModalTrack }) {
  if (!tracks?.length) return null
  if (viewMode === 'list') {
    return (
      <div className="up-tracklist">
        {tracks.map((t, i) => <ListRow key={t.id} track={t} idx={i} currentTrack={currentTrack} isCurrentPlaying={isCurrentPlaying} handlePlay={handlePlay} handleLike={handleLike} handleRepost={handleRepost} trackList={tracks} navigate={navigate} setPlaylistModalTrack={setPlaylistModalTrack} />)}
      </div>
    )
  }
  return (
    <div className="brw-card-grid">
      {tracks.map(t => <GridCard key={t.id} track={t} currentTrack={currentTrack} isCurrentPlaying={isCurrentPlaying} handlePlay={handlePlay} handleLike={handleLike} trackList={tracks} navigate={navigate} />)}
    </div>
  )
}

/* --- Horizontal scroll section --- */
function ScrollSection({ tracks, currentTrack, isCurrentPlaying, handlePlay, handleLike, navigate }) {
  const ref = useRef(null)
  const scroll = dir => ref.current?.scrollBy({ left: dir * 240, behavior: 'smooth' })
  if (!tracks?.length) return null
  return (
    <div className="brw-scroll-wrapper">
      <button className="brw-scroll-btn brw-scroll-left" onClick={() => scroll(-1)}><ChevronLeft size={14} /></button>
      <div className="brw-scroll-row" ref={ref}>
        {tracks.map(track => (
          <div key={track.id} className="brw-scroll-card" onClick={() => navigate(`/tracks/${track.id}`)}>
            <div className="brw-card-img" style={{ background: track.cover_url ? undefined : 'linear-gradient(135deg, #1a4a2e 0%, #2d6b47 50%, #c9a84c 100%)' }}>
              {track.cover_url ? <img src={track.cover_url} alt="" /> : <Music size={28} className="brw-card-music-icon" />}
              <div className="brw-card-overlay">
                <button className="brw-card-play-btn" onClick={e => { e.stopPropagation(); handlePlay(track, tracks) }}>
                  {isCurrentPlaying(track) ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                </button>
              </div>
            </div>
            <div className="brw-card-body">
              <div className="brw-card-body-left">
                <p className={`brw-card-title ${currentTrack?.id === track.id ? 'active' : ''}`}>{track.title}</p>
                <p className="brw-card-sub">{track.user?.name || 'Unknown'}</p>
              </div>
              <div onClick={e => e.stopPropagation()}>
                <TrackMenu track={track} trackList={tracks} size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="brw-scroll-btn brw-scroll-right" onClick={() => scroll(1)}><ChevronRight size={14} /></button>
    </div>
  )
}

/* --- Section header --- */
function SectionHeader({ sectionKey, label, badge, count }) {
  const cfg = SECTION_ICON[sectionKey] || { Icon: Music, color: '#C9A24D' }
  return (
    <h2 className="brw-section-title">
      <cfg.Icon size={20} style={{ color: cfg.color, marginRight: 8, display: 'inline', fill: cfg.fill ? cfg.color : 'none' }} />
      {label}
      {badge && <span className="brw-section-badge">{badge}</span>}
      {count > 0 && <span className="brw-section-count">{count}</span>}
    </h2>
  )
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════ */

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const activeCategory = searchParams.get('category') || ''

  /* -- UI state -- */
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState('all')
  const [activeGenre, setActiveGenre] = useState(activeCategory || 'all')
  const [activeDuration, setActiveDuration] = useState('all')
  const [activeSort, setActiveSort] = useState('relevant')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)

  /* -- Overlay state (consolidated) -- */
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [dropdownResults, setDropdownResults] = useState({ tracks: [], users: [], playlists: [] })
  const [dropdownLoading, setDropdownLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)

  /* -- Full results state -- */
  const [showFullResults, setShowFullResults] = useState(!!initialQuery)
  const [fullResults, setFullResults] = useState({ tracks: [], users: [], playlists: [] })
  const [fullResultsLoading, setFullResultsLoading] = useState(false)
  const [fullResultsQuery, setFullResultsQuery] = useState(initialQuery)

  /* -- Data state -- */
  const [browseData, setBrowseData] = useState(null)
  const [browseLoading, setBrowseLoading] = useState(true)
  const [homeData, setHomeData] = useState(null)
  const [feedTracks, setFeedTracks] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [genreTracks, setGenreTracks] = useState([])
  const [genreLoading, setGenreLoading] = useState(false)
  const [activeMood, setActiveMood] = useState(null)
  const [moodTracks, setMoodTracks] = useState([])
  const [moodLoading, setMoodLoading] = useState(false)
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null)
  const [recentSearches, setRecentSearches] = useState([])

  const searchBarRef = useRef(null)
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isCurrentPlaying = useCallback((track) => currentTrack?.id === track.id && isPlaying, [currentTrack, isPlaying])

  /* ════════════════════════════════════════════════════════
     DATA LOADING
     ════════════════════════════════════════════════════════ */

  // 1. Load all data on mount + hide navbar on mobile
  useEffect(() => {
    loadAllData()
    document.body.classList.add('search-page-active')
    return () => document.body.classList.remove('search-page-active')
  }, [])

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (overlayOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [overlayOpen])

  // 2. Suggestions -- 150ms debounce, fires when searchQuery.length >= 1
  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSuggestions([])
      return
    }
    const t = setTimeout(async () => {
      setSuggestionsLoading(true)
      try {
        const data = await api.getSearchSuggestions(searchQuery)
        setSuggestions(Array.isArray(data) ? data : (data?.suggestions || []))
      } catch {
        setSuggestions([])
      } finally { setSuggestionsLoading(false) }
    }, 150)
    return () => clearTimeout(t)
  }, [searchQuery])

  // 3. Dropdown search -- 300ms debounce, fires when searchQuery.length >= 2
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setDropdownResults({ tracks: [], users: [], playlists: [] })
      return
    }
    const t = setTimeout(async () => {
      setDropdownLoading(true)
      try {
        const filterVal = activeTab === 'all' ? 'everything' : activeTab === 'artists' ? 'people' : activeTab
        const extra = {}
        if (activeDuration !== 'all') extra.duration = activeDuration
        if (activeGenre !== 'all') extra.category = activeGenre
        const data = await api.search(searchQuery, filterVal, extra)
        setDropdownResults({
          tracks: (data.tracks || data.data?.tracks || []).slice(0, 8),
          users: (data.users || data.data?.users || []).slice(0, 5),
          playlists: (data.playlists || data.data?.playlists || []).slice(0, 4)
        })
      } catch {
        setDropdownResults({ tracks: [], users: [], playlists: [] })
      } finally { setDropdownLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, activeTab, activeDuration, activeGenre])

  // 4. AI search -- 800ms debounce, fires when searchQuery.length >= 5 && includes space
  useEffect(() => {
    if (searchQuery.trim().length < 5 || !searchQuery.includes(' ')) {
      setAiSuggestion(null)
      return
    }
    const t = setTimeout(async () => {
      try {
        const data = await api.getAISearch(searchQuery)
        setAiSuggestion(data.suggestion_text || data.intent?.suggestion_text || null)
      } catch {
        setAiSuggestion(null)
      }
    }, 800)
    return () => clearTimeout(t)
  }, [searchQuery])

  // 5. Full results re-trigger when filters change
  useEffect(() => {
    if (showFullResults && fullResultsQuery) {
      performFullSearch(fullResultsQuery)
    }
  }, [activeTab, activeGenre, activeDuration, activeSort])

  // 6. Initial query from URL
  useEffect(() => {
    if (initialQuery) {
      performFullSearch(initialQuery)
    }
  }, [])

  // Genre-filtered tracks
  useEffect(() => {
    if (activeGenre === 'all') { setGenreTracks([]); return }
  }, [activeGenre])

  const loadAllData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [browseRes, homeRes, feedRes] = await Promise.all([
        api.getSearchBrowse().catch(() => null),
        api.getHomePage().catch(() => null),
        token ? api.getFeed().catch(() => []) : Promise.resolve([]),
      ])
      setBrowseData(browseRes)
      setHomeData(homeRes)
      setFeedTracks(Array.isArray(feedRes) ? feedRes : (feedRes?.data || []))
      // Initialize recent searches from browse data
      if (browseRes?.recent_searches) {
        setRecentSearches(browseRes.recent_searches)
      }
    } catch { /* silent */ }
    finally { setBrowseLoading(false); setTimeout(() => setIsLoaded(true), 100) }
  }

  /* -- Actions -- */
  const handlePlay = useCallback((track, trackList) => {
    if (currentTrack?.id === track.id) togglePlay()
    else playTrack(track, trackList || [track])
  }, [currentTrack, togglePlay, playTrack])

  const handleLike = useCallback(async (trackId, e) => {
    e.stopPropagation()
    try {
      const r = await api.toggleLike(trackId)
      const updater = t => t.id === trackId ? { ...t, is_liked: r.is_liked } : t
      setFeedTracks(p => p.map(updater))
      setGenreTracks(p => p.map(updater))
      setMoodTracks(p => p.map(updater))
    } catch { toast.error('Log in to like songs') }
  }, [])

  const handleRepost = useCallback(async (trackId, e) => {
    e.stopPropagation()
    try {
      const r = await api.toggleRepost(trackId)
      toast.success(r.is_reposted ? 'Reposted' : 'Repost removed')
      const updater = t => t.id === trackId ? { ...t, is_reposted: r.is_reposted } : t
      setFeedTracks(p => p.map(updater))
      setMoodTracks(p => p.map(updater))
    } catch { toast.error('Log in to repost') }
  }, [])

  const performFullSearch = async (q) => {
    if (!q.trim()) return
    setFullResultsLoading(true)
    setFullResultsQuery(q)
    setShowFullResults(true)
    try {
      const filterVal = activeTab === 'all' ? 'everything' : activeTab === 'artists' ? 'people' : activeTab
      const extra = {}
      if (activeGenre !== 'all') extra.category = activeGenre
      if (activeDuration !== 'all') extra.duration = activeDuration
      if (activeSort !== 'relevant') extra.sort = activeSort
      const data = await api.search(q, filterVal, extra)
      setFullResults({ tracks: data.tracks || [], users: data.users || [], playlists: data.playlists || [] })
      setSearchParams({ q })
    } catch { toast.error('Search failed') }
    finally { setFullResultsLoading(false) }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      closeOverlay()
      performFullSearch(searchQuery)
    }
  }

  const handleSeeAllResults = () => {
    const q = searchQuery
    closeOverlay()
    performFullSearch(q)
  }

  const closeOverlay = () => {
    setOverlayOpen(false)
  }

  const clearFilters = () => { setActiveGenre('all'); setActiveDuration('all'); setActiveSort('relevant') }
  const hasActiveFilters = activeGenre !== 'all' || activeDuration !== 'all' || activeSort !== 'relevant'

  const handleMoodClick = async (mood) => {
    if (activeMood?.name === mood.name) { setActiveMood(null); setMoodTracks([]); return }
    setActiveMood(mood)
    setMoodLoading(true)
    try {
      const data = await api.search(mood.query, 'everything', {})
      setMoodTracks(data.tracks || [])
    } catch { setMoodTracks([]) }
    finally { setMoodLoading(false) }
  }

  /* ════════════════════════════════════════════════════════
     FILTER TRACKS -- apply genre + duration across all sections
     ════════════════════════════════════════════════════════ */

  const filterTracks = useCallback((tracks) => {
    if (!tracks?.length) return []
    let filtered = [...tracks]
    if (activeGenre !== 'all') {
      filtered = filtered.filter(t => {
        const cat = (t.category || '').toLowerCase()
        const genre = activeGenre.toLowerCase()
        return cat === genre || cat.startsWith(genre) || genre.startsWith(cat)
      })
    }
    if (activeDuration !== 'all') {
      filtered = filtered.filter(t => {
        const dur = t.duration_seconds || t.duration || 0
        if (activeDuration === 'short') return dur < 300
        if (activeDuration === 'medium') return dur >= 300 && dur <= 1800
        if (activeDuration === 'long') return dur > 1800
        return true
      })
    }
    return filtered
  }, [activeGenre, activeDuration])

  /* ════════════════════════════════════════════════════════
     BROWSE SECTIONS (extracted from home data)
     ════════════════════════════════════════════════════════ */

  const sections = useMemo(() => {
    const homeSections = homeData?.sections || []
    const getSection = (key) => homeSections.find(s => s.key === key)
    const getTracks = (key) => getSection(key)?.tracks || []

    return {
      continuePlaying:  filterTracks(getTracks('continue_listening')).slice(0, 6),
      recommended:      filterTracks(browseData?.for_you || getTracks('recommended')).slice(0, 10),
      becauseLiked:     filterTracks(getTracks('because_liked')).slice(0, 8),
      becauseLikedLabel: getSection('because_liked')?.label || 'Because You Liked',
      fromFollowed:     filterTracks(feedTracks.length > 0 ? feedTracks : getTracks('from_followed')).slice(0, 8),
      trending:         filterTracks(getTracks('trending')).slice(0, 10),
      viral:            filterTracks(getTracks('viral')).slice(0, 8),
      risingArtists:    getTracks('rising_artists').slice(0, 6),
      mostPlayed:       filterTracks(browseData?.top_charts?.most_played || getTracks('most_played')).slice(0, 8),
      newReleases:      filterTracks(getTracks('new_releases')).slice(0, 10),
      popularCategory:  filterTracks(getTracks('popular_category')).slice(0, 8),
      popularCategoryLabel: getSection('popular_category')?.label || 'Popular',
      categories:       browseData?.categories || [],
      moods:            browseData?.moods || [],
      featuredPlaylists: browseData?.featured_playlists || [],
      trendingSearches: browseData?.trending_searches || [],
      recentSearches:   browseData?.recent_searches || [],
    }
  }, [homeData, browseData, feedTracks, filterTracks])

  // Unique featured artists from rising_artists (has real track_count) + fallback from tracks
  const featuredArtists = useMemo(() => {
    const rising = sections.risingArtists || []
    if (rising.length > 0) return rising
    const all = [...(sections.trending || []), ...(sections.mostPlayed || []), ...(sections.newReleases || [])]
    const seen = new Set()
    return all.reduce((acc, t) => {
      if (t.user?.id && !seen.has(t.user.id)) { seen.add(t.user.id); acc.push(t.user) }
      return acc
    }, []).slice(0, 8)
  }, [sections])

  const commonProps = { currentTrack, isCurrentPlaying, handlePlay, handleLike, handleRepost, navigate, setPlaylistModalTrack }

  /* ════════════════════════════════════════════════════════
     COMPUTED VALUES
     ════════════════════════════════════════════════════════ */

  const filteredFullTracks = fullResults.tracks || []
  const filteredFullUsers = activeTab === 'all' || activeTab === 'artists' ? (fullResults.users || []) : []
  const filteredFullPlaylists = activeTab === 'all' || activeTab === 'playlists' ? (fullResults.playlists || []) : []

  const hasDropdownResults = dropdownResults.tracks.length > 0 || dropdownResults.users.length > 0 || dropdownResults.playlists.length > 0

  return (
    <div className="brw-page">
        {/* -- Header with greeting (only in browse mode) -- */}
        {!showFullResults && (
          <div className={`brw-header ${isLoaded ? 'brw-anim-in' : ''}`} style={{ paddingTop: 16 }}>
            <h1 className="brw-title">
              <SearchIcon size={28} style={{ marginRight: 10, opacity: 0.7 }} />
              Search
            </h1>
            {user && <p className="brw-greeting">{getGreeting()}, {user.name?.split(' ')[0] || 'there'}</p>}
            <p className="brw-subtitle">Discover nasheeds, Quran, lectures, and more</p>
          </div>
        )}

        {/* -- Search bar (below title, full width, gold border) -- */}
        <div className={`brw-search-row brw-search-row-top ${isLoaded ? 'brw-anim-in brw-delay-1' : ''}`}>
          <div className="brw-search-bar brw-search-bar-gold" onClick={() => setOverlayOpen(true)}>
            <SearchIcon size={16} className="brw-search-icon" />
            <input type="text"
              placeholder="Search nasheeds, artists, Quran..."
              value={showFullResults ? fullResultsQuery : ''}
              readOnly
              style={{ cursor: 'pointer' }}
              onFocus={() => setOverlayOpen(true)} />
            {showFullResults && fullResultsQuery && (
              <button type="button" className="brw-search-clear" onClick={(e) => { e.stopPropagation(); setShowFullResults(false); setFullResultsQuery(''); setSearchQuery(''); setSearchParams({}) }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
           FULLSCREEN SEARCH OVERLAY
           ═══════════════════════════════════════════════ */}
        {overlayOpen && (
          <div className="sp-mobile-search-fullscreen">
            <div className="sp-mobile-search-header">
              <button className="sp-mobile-search-back" onClick={() => { closeOverlay(); setSearchQuery(''); setDropdownResults({ tracks: [], users: [], playlists: [] }); setSuggestions([]); setAiSuggestion(null) }}>
                <ArrowLeft size={20} />
              </button>
              <form className="sp-mobile-search-form" onSubmit={handleSearchSubmit}>
                <SearchIcon size={16} className="sp-mobile-search-icon" />
                <input
                  type="text"
                  placeholder="Search nasheeds, artists, Quran..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button type="button" className="sp-mobile-search-clear" onClick={() => { setSearchQuery(''); setDropdownResults({ tracks: [], users: [], playlists: [] }); setSuggestions([]); setAiSuggestion(null) }}>
                    <X size={16} />
                  </button>
                )}
              </form>
            </div>

            <div className="sp-mobile-search-results">
              {/* ═══ IDLE STATE: no search query ═══ */}
              {!searchQuery.trim() && (
                <div className="srch-idle-wrap">
                  {/* Recent Searches */}
                  {user && recentSearches.length > 0 && (
                    <div className="srch-section">
                      <div className="srch-section-head">
                        <div className="srch-section-title">
                          <Clock size={15} style={{ marginRight: 6, opacity: 0.7 }} />
                          Recent
                        </div>
                        <button
                          className="srch-section-action"
                          onClick={async () => {
                            try {
                              await api.clearSearchHistory()
                              setRecentSearches([])
                            } catch { /* silent */ }
                          }}
                        >
                          Clear all
                        </button>
                      </div>
                      {recentSearches.map((item, idx) => {
                        const text = typeof item === 'string' ? item : item.query || item.text || ''
                        const id = typeof item === 'string' ? idx : item.id || idx
                        return (
                          <div
                            key={id}
                            className="srch-recent-item"
                            onClick={() => setSearchQuery(text)}
                          >
                            <Clock size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>{text}</span>
                            <button
                              className="srch-recent-remove"
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  await api.removeSearchHistoryItem(id)
                                  setRecentSearches(prev => prev.filter((_, i) => typeof item === 'string' ? i !== idx : (prev[i]?.id || i) !== id))
                                } catch { /* silent */ }
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Trending Searches */}
                  {sections.trendingSearches.length > 0 && (
                    <div className="srch-section">
                      <div className="srch-section-head">
                        <div className="srch-section-title">
                          <TrendingUp size={15} style={{ marginRight: 6, opacity: 0.7 }} />
                          Trending
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 16px' }}>
                        {sections.trendingSearches.slice(0, 8).map((q, i) => (
                          <button
                            key={i}
                            className="brw-trending-pill"
                            onClick={() => setSearchQuery(q)}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ TYPING STATE: has search query ═══ */}
              {searchQuery.trim() && (
                <>
                  {/* AI banner */}
                  {aiSuggestion && (
                    <div className="srch-ai-banner">
                      <Sparkles size={16} style={{ flexShrink: 0, color: 'var(--sp-gold, #c5a449)' }} />
                      <span className="srch-ai-text">{aiSuggestion}</span>
                    </div>
                  )}

                  {/* Filter chips (when query >= 2) */}
                  {searchQuery.trim().length >= 2 && (
                    <>
                      <div className="sp-mobile-search-filters">
                        <div className="sp-mobile-search-filter-scroll">
                          {[['all', 'All'], ['tracks', 'Tracks'], ['artists', 'Artists'], ['playlists', 'Playlists']].map(([v, l]) => (
                            <button key={v} className={`sp-search-filter-chip${activeTab === v ? ' active' : ''}`}
                              onClick={() => setActiveTab(v)}>{l}</button>
                          ))}
                        </div>
                      </div>
                      <div className="sp-mobile-search-filters">
                        <div className="sp-mobile-search-filter-scroll">
                          {[['all', 'All'], ['Nasheeds', 'Nasheeds'], ['Quran', 'Quran'], ['Lectures', 'Lectures'], ['Duas', 'Duas'], ['Broadcast', 'Podcasts']].map(([v, l]) => (
                            <button key={v} className={`sp-search-filter-chip${activeGenre === v ? ' active' : ''}`}
                              onClick={() => setActiveGenre(v)}>{l}</button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Loading indicator */}
                  {dropdownLoading && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--sp-text-muted)', fontSize: '0.84rem' }}>
                      <Loader size={14} className="brw-spin" style={{ marginRight: '8px', display: 'inline' }} /> Searching...
                    </div>
                  )}

                  {/* Live results -- grouped by category */}
                  {!dropdownLoading && dropdownResults.tracks.length > 0 && (activeTab === 'all' || activeTab === 'tracks') && (() => {
                    const grouped = {}
                    dropdownResults.tracks.forEach(track => {
                      const cat = track.category || 'Other'
                      if (!grouped[cat]) grouped[cat] = []
                      grouped[cat].push(track)
                    })
                    return Object.entries(grouped).map(([category, tracks]) => (
                      <div key={category}>
                        <div className="sp-search-section-title">{category}</div>
                        {tracks.map(track => (
                          <div key={track.id} className="sp-search-item" onClick={() => { navigate(`/tracks/${track.id}`); closeOverlay() }}>
                            <div className="sp-search-item-img">
                              {track.cover_url ? <img src={track.cover_url} alt="" /> : <img src="/logo.png" alt="" style={{ width: '50%', height: '50%', objectFit: 'contain', opacity: 0.5 }} />}
                              <button className="sp-search-item-play" onClick={(e) => { e.stopPropagation(); playTrack(track) }}>
                                <Play size={10} />
                              </button>
                            </div>
                            <div className="sp-search-item-info">
                              <div className="sp-search-item-title">{track.title}</div>
                              <div className="sp-search-item-sub">{track.user?.name || 'Unknown'}</div>
                              <div className="sp-search-item-meta">
                                <span><Play size={10} /> {fmtPlays(track.plays_count || track.plays)}</span>
                                <span><Heart size={10} /> {fmtPlays(track.likes_count || track.likes || 0)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  })()}

                  {/* Artist results in overlay */}
                  {!dropdownLoading && dropdownResults.users.length > 0 && (activeTab === 'all' || activeTab === 'artists') && (
                    <>
                      <div className="sp-search-section-title">Artists</div>
                      {dropdownResults.users.map(u => (
                        <div key={u.id} className="sp-search-item" onClick={() => { navigate(`/users/${u.id}`); closeOverlay() }}>
                          <div className="sp-search-item-img round">
                            {u.avatar_url ? <img src={u.avatar_url} alt="" /> : <span style={{ fontWeight: 700, color: 'var(--sp-gold)' }}>{(u.name || '?').charAt(0)}</span>}
                          </div>
                          <div className="sp-search-item-info">
                            <div className="sp-search-item-title">{u.name}</div>
                            <div className="sp-search-item-sub">{u.tracks_count || 0} tracks</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Playlist results in overlay */}
                  {!dropdownLoading && dropdownResults.playlists.length > 0 && (activeTab === 'all' || activeTab === 'playlists') && (
                    <>
                      <div className="sp-search-section-title">Playlists</div>
                      {dropdownResults.playlists.map(pl => (
                        <div key={pl.id} className="sp-search-item" onClick={() => { navigate(`/playlists/${pl.id}`); closeOverlay() }}>
                          <div className="sp-search-item-img">
                            {pl.cover_url ? <img src={pl.cover_url} alt="" /> : <span style={{ fontSize: '0.9rem', color: 'var(--sp-gold)', opacity: 0.5 }}>&#9835;</span>}
                          </div>
                          <div className="sp-search-item-info">
                            <div className="sp-search-item-title">{pl.name}</div>
                            <div className="sp-search-item-sub">Playlist &middot; {pl.tracks_count || 0} tracks</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* No results */}
                  {!dropdownLoading && searchQuery.trim().length >= 2 && !hasDropdownResults && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--sp-text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
                      No results for &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}

                  {/* See all results button */}
                  {searchQuery.trim().length >= 2 && hasDropdownResults && (
                    <div className="sp-search-see-all" onClick={handleSeeAllResults}>
                      <SearchIcon size={14} /> See all results for &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
           FULL SEARCH RESULTS (when "See all results" clicked)
           ═══════════════════════════════════════════════ */}
        {showFullResults && (
          <>
            {/* Back to browse */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', marginTop: '8px' }}>
              <button className="brw-back-btn" onClick={() => { setShowFullResults(false); setFullResultsQuery(''); setSearchQuery(''); setSearchParams({}) }} style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--sp-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={18} />
              </button>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--sp-text)', margin: 0 }}>Results for &ldquo;{fullResultsQuery}&rdquo;</h2>
            </div>

            {/* AI banner in full results */}
            {aiSuggestion && (
              <div className="srch-ai-banner" style={{ marginBottom: '12px' }}>
                <Sparkles size={16} style={{ flexShrink: 0, color: 'var(--sp-gold, #c5a449)' }} />
                <span className="srch-ai-text">{aiSuggestion}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="brw-tabs" style={{ marginBottom: '12px' }}>
              {TABS.map(tab => (
                <button key={tab.id} className={`brw-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                  <tab.icon size={14} />{tab.label}
                </button>
              ))}
            </div>

            {/* Category filter pills (when tracks tab) */}
            {(activeTab === 'all' || activeTab === 'tracks') && (
              <div className="brw-genres" style={{ marginBottom: '8px' }}>
                {GENRES.map(genre => (
                  <button key={genre.id}
                    className={`brw-genre ${activeGenre === genre.id ? 'active' : ''}`}
                    onClick={() => setActiveGenre(genre.id)}>
                    {genre.label}
                  </button>
                ))}
              </div>
            )}

            {/* Duration pills row */}
            {(activeTab === 'all' || activeTab === 'tracks') && (
              <div className="srch-results-filter-row" style={{ marginBottom: '8px' }}>
                {DURATIONS.map(d => (
                  <button key={d.id}
                    className={`brw-filter-chip ${activeDuration === d.id ? 'active' : ''}`}
                    onClick={() => setActiveDuration(d.id)}>
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            {/* Sort pills row */}
            {(activeTab === 'all' || activeTab === 'tracks') && (
              <div className="srch-results-filter-row" style={{ marginBottom: '16px' }}>
                {SORTS.map(s => (
                  <button key={s.id}
                    className={`brw-filter-chip ${activeSort === s.id ? 'active' : ''}`}
                    onClick={() => setActiveSort(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {fullResultsLoading && <div className="sp-loading" style={{ padding: '40px 0', textAlign: 'center', color: 'var(--sp-text-muted)', fontSize: '0.84rem' }}><Loader size={18} className="brw-spin" style={{ marginRight: 8, display: 'inline' }} /> Searching...</div>}

            {/* Empty state */}
            {!fullResultsLoading && filteredFullTracks.length === 0 && filteredFullUsers.length === 0 && filteredFullPlaylists.length === 0 && (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <SearchIcon size={40} style={{ opacity: 0.2, marginBottom: '12px', display: 'inline-block' }} />
                <h3 style={{ color: 'var(--sp-text)', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 6px' }}>No results for &ldquo;{fullResultsQuery}&rdquo;</h3>
                <p style={{ color: 'var(--sp-text-muted)', fontSize: '0.84rem', margin: 0 }}>Check your spelling or try different keywords</p>
              </div>
            )}

            {/* Track results */}
            {!fullResultsLoading && filteredFullTracks.length > 0 && (activeTab === 'all' || activeTab === 'tracks') && (
              <section className="brw-section">
                <h2 className="brw-section-title"><Music size={20} style={{ color: '#c5a449', marginRight: 8 }} /> Tracks <span className="brw-section-count">{filteredFullTracks.length}</span></h2>
                <TrackSection tracks={filteredFullTracks} viewMode="list" {...commonProps} />
              </section>
            )}

            {/* Artist results */}
            {!fullResultsLoading && filteredFullUsers.length > 0 && (activeTab === 'all' || activeTab === 'artists') && (
              <section className="brw-section">
                <h2 className="brw-section-title"><Users size={20} style={{ color: '#c5a449', marginRight: 8 }} /> Artists <span className="brw-section-count">{filteredFullUsers.length}</span></h2>
                <div className="brw-artist-grid">
                  {filteredFullUsers.map(u => (
                    <div key={u.id} className="brw-artist-card" onClick={() => navigate(`/users/${u.id}`)}>
                      <div className="brw-artist-avatar" style={{ background: u.avatar_url ? undefined : 'linear-gradient(135deg, #2a1a3a, #4a2d5b, #c9a84c)' }}>
                        {u.avatar_url ? <img src={u.avatar_url} alt="" /> : <span className="brw-artist-initial">{(u.name || '?').charAt(0)}</span>}
                      </div>
                      <h3 className="brw-artist-name">{u.name}</h3>
                      <p className="brw-artist-genre">{u.tracks_count || 0} tracks</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Playlist results */}
            {!fullResultsLoading && filteredFullPlaylists.length > 0 && (activeTab === 'all' || activeTab === 'playlists') && (
              <section className="brw-section">
                <h2 className="brw-section-title"><Music2 size={20} style={{ color: '#c5a449', marginRight: 8 }} /> Playlists <span className="brw-section-count">{filteredFullPlaylists.length}</span></h2>
                <div className="brw-playlist-grid">
                  {filteredFullPlaylists.map(pl => (
                    <div key={pl.id} className="brw-playlist-card" onClick={() => navigate(`/playlists/${pl.id}`)}>
                      <div className="brw-playlist-img">
                        <div className="brw-playlist-bg" style={{ background: pl.cover_url ? `url(${pl.cover_url}) center/cover` : 'linear-gradient(135deg, #0d2818, #1a4a2e, #c9a84c)' }} />
                        {!pl.cover_url && <Music2 size={24} style={{ color: 'rgba(255,255,255,0.3)', position: 'relative', zIndex: 1 }} />}
                      </div>
                      <div className="brw-playlist-info">
                        <p className="brw-playlist-name">{pl.name || pl.title}</p>
                        <p className="brw-playlist-count">{pl.tracks_count || 0} tracks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════
           BROWSE SECTIONS (when not showing full results)
           ═══════════════════════════════════════════════ */}
        {!showFullResults && (
          <>
        {/* -- Filter panel -- */}
        {showFilters && (
          <div className={`brw-filter-panel ${isLoaded ? 'brw-anim-in' : ''}`}>
            <div className="brw-filter-row">
              <span className="brw-filter-label">Category</span>
              <div className="brw-filter-chips">
                {GENRES.map(g => (
                  <button key={g.id} className={`brw-filter-chip ${activeGenre === g.id ? 'active' : ''}`} onClick={() => setActiveGenre(g.id)}>{g.label}</button>
                ))}
              </div>
            </div>
            <div className="brw-filter-row">
              <span className="brw-filter-label">Duration</span>
              <div className="brw-filter-chips">
                {DURATIONS.map(d => (
                  <button key={d.id} className={`brw-filter-chip ${activeDuration === d.id ? 'active' : ''}`} onClick={() => setActiveDuration(d.id)}>{d.label}</button>
                ))}
              </div>
            </div>
            <div className="brw-filter-row">
              <span className="brw-filter-label">Sort</span>
              <div className="brw-filter-chips">
                {SORTS.map(s => (
                  <button key={s.id} className={`brw-filter-chip ${activeSort === s.id ? 'active' : ''}`} onClick={() => setActiveSort(s.id)}>{s.label}</button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <button className="brw-filter-clear" onClick={clearFilters}><X size={12} /> Clear all filters</button>
            )}
          </div>
        )}

        {/* -- Tabs -- */}
        <div className={`brw-tabs ${isLoaded ? 'brw-anim-in brw-delay-2' : ''}`}>
          {TABS.map(tab => (
            <button key={tab.id} className={`brw-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <tab.icon size={14} />{tab.label}
            </button>
          ))}
        </div>

        {/* -- Category filter pills -- */}
        {(activeTab === 'all' || activeTab === 'tracks') && (
          <div className={`brw-genres ${isLoaded ? 'brw-anim-in brw-delay-3' : ''}`}>
            {GENRES.map(genre => (
              <button key={genre.id}
                className={`brw-genre ${activeGenre === genre.id ? 'active' : ''}`}
                onClick={() => setActiveGenre(genre.id)}>
                {genre.label}
              </button>
            ))}
          </div>
        )}

        {/* -- Trending searches -- */}
        {sections.trendingSearches.length > 0 && (activeTab === 'all') && (
          <div className={`brw-trending-searches ${isLoaded ? 'brw-anim-in brw-delay-3' : ''}`}>
            <span className="brw-trending-label"><TrendingUp size={13} /> Trending:</span>
            {sections.trendingSearches.slice(0, 6).map((q, i) => (
              <button key={i} className="brw-trending-pill" onClick={() => setSearchQuery(q)}>{q}</button>
            ))}
          </div>
        )}

        {/* -- Recent searches -- */}
        {sections.recentSearches.length > 0 && user && activeTab === 'all' && (
          <div className={`brw-recent-searches ${isLoaded ? 'brw-anim-in brw-delay-3' : ''}`}>
            <span className="brw-trending-label"><Clock size={13} /> Recent:</span>
            {sections.recentSearches.slice(0, 4).map((q, i) => (
              <button key={i} className="brw-trending-pill brw-trending-pill--recent" onClick={() => setSearchQuery(q)}>{q}</button>
            ))}
            <button className="brw-trending-pill brw-trending-pill--clear" onClick={() => api.clearSearchHistory().then(() => loadAllData())}>
              <X size={11} /> Clear
            </button>
          </div>
        )}

        {/* -- Skeleton -- */}
        {browseLoading && (
          <div className="brw-skeleton-wrap">
            <div className="brw-skeleton-title" />
            <div className="brw-skeleton-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="brw-skeleton-card"><div className="brw-skeleton-img" /><div className="brw-skeleton-line w75" /><div className="brw-skeleton-line w50" /></div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
           ALGORITHM SECTIONS -- filtered by category/duration
           ════════════════════════════════════════════════════ */}
        {!browseLoading && (
          <>
            {/* --- Moods --- */}
            {sections.moods.length > 0 && activeTab === 'all' && (
              <section className={`brw-section ${isLoaded ? 'brw-anim-in brw-delay-3' : ''}`}>
                <h2 className="brw-section-title"><Sparkles size={20} style={{ color: '#c5a449', marginRight: 8 }} />Discover by Mood</h2>
                <div className="brw-mood-grid">
                  {sections.moods.map(mood => (
                    <button key={mood.name} className={`brw-mood-card ${activeMood?.name === mood.name ? 'active' : ''}`} onClick={() => handleMoodClick(mood)} style={{ '--mood-color': mood.color }}>
                      <i className={`fas ${mood.icon}`} />
                      <span>{mood.name}</span>
                    </button>
                  ))}
                </div>
                {/* Mood results inline */}
                {activeMood && (
                  <div className="brw-mood-results">
                    <div className="brw-mood-results-header">
                      <span className="brw-mood-results-label">{activeMood.name}</span>
                      <button className="brw-mood-results-close" onClick={() => { setActiveMood(null); setMoodTracks([]) }}><X size={14} /></button>
                    </div>
                    {moodLoading ? (
                      <div className="brw-loading-inline"><Loader size={18} className="brw-spin" /> Loading...</div>
                    ) : moodTracks.length > 0 ? (
                      <TrackSection tracks={moodTracks.slice(0, 12)} viewMode={viewMode} {...commonProps} />
                    ) : (
                      <div className="brw-empty-inline">No tracks found for this mood</div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* --- Recommended For You (AI) --- */}
            {sections.recommended.length > 0 && user && (activeTab === 'all' || activeTab === 'tracks') && (
              <section className="brw-section">
                <SectionHeader sectionKey="recommended" label="Recommended For You" badge="AI" />
                <TrackSection tracks={sections.recommended} viewMode="grid" {...commonProps} />
              </section>
            )}

            {/* --- Because You Liked (AI, scroll) --- */}
            {sections.becauseLiked.length > 0 && user && (activeTab === 'all' || activeTab === 'tracks') && (
              <section className="brw-section">
                <SectionHeader sectionKey="because_liked" label={sections.becauseLikedLabel} badge="AI" />
                <TrackSection tracks={sections.becauseLiked} viewMode={viewMode} {...commonProps} />
              </section>
            )}

            {/* --- From Artists You Follow --- */}
            {sections.fromFollowed.length > 0 && user && (activeTab === 'all' || activeTab === 'tracks') && (
              <section className="brw-section">
                <SectionHeader sectionKey="from_followed" label="From Artists You Follow" />
                <TrackSection tracks={sections.fromFollowed} viewMode="list" {...commonProps} />
              </section>
            )}

            {/* --- Trending Now --- */}
            {sections.trending.length > 0 && (activeTab === 'all' || activeTab === 'tracks') && (
              <section className="brw-section">
                <SectionHeader sectionKey="trending" label="Trending Now" count={sections.trending.length} />
                <TrackSection tracks={sections.trending} viewMode={viewMode} {...commonProps} />
              </section>
            )}

            {/* --- Viral Hits --- */}
            {sections.viral.length > 0 && (activeTab === 'all' || activeTab === 'tracks') && (
              <section className="brw-section">
                <SectionHeader sectionKey="viral" label="Viral Hits" />
                <TrackSection tracks={sections.viral} viewMode="grid" {...commonProps} />
              </section>
            )}

            {/* --- Rising Artists --- */}
            {sections.risingArtists.length > 0 && (activeTab === 'all' || activeTab === 'artists') && (
              <section className="brw-section">
                <SectionHeader sectionKey="rising_artists" label="Rising Artists" />
                <div className="brw-artist-grid">
                  {sections.risingArtists.map(artist => (
                    <div key={artist.id} className="brw-artist-card" onClick={() => navigate(`/users/${artist.id}`)}>
                      <div className="brw-artist-avatar">
                        {artist.avatar_url
                          ? <img src={artist.avatar_url} alt={artist.name} />
                          : <span>{artist.name?.charAt(0) || '?'}</span>}
                      </div>
                      <div className="brw-artist-name">{artist.name}</div>
                      <div className="brw-artist-genre">{artist.track_count || 0} tracks</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* --- Most Played --- */}
            {sections.mostPlayed.length > 0 && (activeTab === 'all' || activeTab === 'tracks') && (
              <div className="up-section">
                <div className="up-section-header">
                  <BarChart3 size={18} style={{ color: 'var(--sp-gold)' }} />
                  <h3>Most Played</h3>
                </div>
                <div className="up-tracklist">
                  {sections.mostPlayed.map((t, i) => (
                    <ListRow key={t.id} track={t} idx={i} currentTrack={currentTrack} isCurrentPlaying={isCurrentPlaying} handlePlay={handlePlay} handleLike={handleLike} handleRepost={handleRepost} trackList={sections.mostPlayed} navigate={navigate} setPlaylistModalTrack={setPlaylistModalTrack} />
                  ))}
                </div>
              </div>
            )}

            {/* --- Popular in Favorite Category --- */}
            {sections.popularCategory.length > 0 && user && (activeTab === 'all' || activeTab === 'tracks') && (
              <section className="brw-section">
                <SectionHeader sectionKey="popular_category" label={sections.popularCategoryLabel} />
                <TrackSection tracks={sections.popularCategory} viewMode="grid" {...commonProps} />
              </section>
            )}

            {/* --- New Releases --- */}
            {sections.newReleases.length > 0 && (activeTab === 'all' || activeTab === 'tracks') && (
              <section className="brw-section">
                <SectionHeader sectionKey="new_releases" label="New Releases" />
                <TrackSection tracks={sections.newReleases} viewMode={viewMode} {...commonProps} />
              </section>
            )}

            {/* --- Featured Playlists --- */}
            {sections.featuredPlaylists.length > 0 && (activeTab === 'all' || activeTab === 'playlists') && (
              <section className="brw-section">
                <h2 className="brw-section-title"><Sparkles size={20} style={{ color: '#c5a449', marginRight: 8 }} />Featured Playlists</h2>
                <div className="brw-card-grid">
                  {sections.featuredPlaylists.map(pl => {
                    const covers = pl.preview_covers || []
                    return (
                      <div key={pl.id} className="brw-card" onClick={() => navigate(`/playlists/${pl.id}`)}>
                        <div className="brw-card-img" style={{ background: pl.cover_url ? undefined : 'linear-gradient(135deg, #1a3828 0%, #2a1a08 100%)' }}>
                          {pl.cover_url ? <img src={pl.cover_url} alt="" /> :
                            covers.length >= 4 ? <div className="brw-pl-mosaic">{covers.slice(0,4).map((c,i) => <img key={i} src={c} alt="" />)}</div> :
                            covers[0] ? <img src={covers[0]} alt="" /> :
                            <Music size={32} className="brw-card-music-icon" />}
                        </div>
                        <div className="brw-card-body">
                          <div className="brw-card-body-left">
                            <p className="brw-card-title">{pl.name}</p>
                            <p className="brw-card-sub">{pl.user?.name || 'Unknown'} &middot; {pl.tracks_count} tracks</p>
                          </div>
                        </div>
                        {pl.likes_count > 0 && <p className="brw-card-plays">{pl.likes_count} likes</p>}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* --- Browse Categories --- */}
            {sections.categories.length > 0 && (activeTab === 'all' || activeTab === 'playlists') && (
              <section className="brw-section">
                <h2 className="brw-section-title">Browse Categories</h2>
                <div className="brw-playlist-grid">
                  {sections.categories.map(cat => (
                    <div key={cat.name} className="brw-playlist-card"
                      onClick={() => { setActiveGenre(cat.category_value || cat.name); setShowFilters(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      style={{ '--pl-gradient': cat.color ? `linear-gradient(135deg, ${cat.color}, ${cat.color}88, #c9a84c)` : 'linear-gradient(135deg, #1a4a2e, #c9a84c)' }}>
                      <div className="brw-playlist-img">
                        <div className="brw-playlist-bg" />
                        <i className={`fas ${cat.icon || 'fa-music'}`} style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)' }} />
                      </div>
                      <div className="brw-playlist-info">
                        <p className="brw-playlist-name">{cat.name}</p>
                        <p className="brw-playlist-count">{cat.track_count || 0} tracks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* --- Featured Artists --- */}
            {featuredArtists.length > 0 && (activeTab === 'all' || activeTab === 'artists') && (
              <section className="brw-section">
                <h2 className="brw-section-title">Featured Artists</h2>
                <div className="brw-artist-grid">
                  {featuredArtists.map(artist => (
                    <div key={artist.id} className="brw-artist-card" onClick={() => navigate(`/users/${artist.id}`)}>
                      <div className="brw-artist-avatar" style={{ background: artist.avatar_url ? undefined : 'linear-gradient(135deg, #1a3a2a, #2d5b47, #c9a84c)' }}>
                        {artist.avatar_url ? <img src={artist.avatar_url} alt="" /> :
                          <span className="brw-artist-initial">{(artist.name || artist.display_name || '?').charAt(0)}</span>}
                      </div>
                      <h3 className="brw-artist-name">{artist.name || artist.display_name}</h3>
                      <p className="brw-artist-genre">{artist.track_count || artist.tracks_count || ''}{artist.track_count || artist.tracks_count ? ' tracks' : 'Artist'}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
          </>
        )}

        <div style={{ height: '100px' }} />
        {playlistModalTrack && <AddToPlaylistModal track={playlistModalTrack} onClose={() => setPlaylistModalTrack(null)} />}
      </div>
  )
}
