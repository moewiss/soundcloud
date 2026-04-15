import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(query)
  const [activeFilter, setActiveFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all')
  const [durationFilter, setDurationFilter] = useState(searchParams.get('duration') || 'all')
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'default')
  const [categorySearch, setCategorySearch] = useState('')
  const [results, setResults] = useState({ tracks: [], users: [], playlists: [] })
  const [allTracks, setAllTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(!!query)
  const activeCategory = searchParams.get('category') || ''
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const navigate = useNavigate()

  const categories = [
    { name: 'Quran', color: '#1e3a5f', icon: 'fa-book-quran' },
    { name: 'Nasheeds', color: '#1DB954', icon: 'fa-music' },
    { name: 'Lectures', color: '#e13300', icon: 'fa-microphone' },
    { name: 'Podcasts', color: '#8c67ab', icon: 'fa-podcast' },
    { name: 'Duas', color: '#1e8a6e', icon: 'fa-hands-praying' },
    { name: 'Stories', color: '#bc5900', icon: 'fa-book-open' },
    { name: 'Education', color: '#477d95', icon: 'fa-graduation-cap' },
    { name: 'Audiobooks', color: '#503750', icon: 'fa-headphones' },
  ]

  useEffect(() => { loadAllTracks() }, [])

  useEffect(() => {
    if (activeCategory) {
      loadByCategory(activeCategory)
      return
    }
    if (!searchQuery.trim()) { setHasSearched(false); return }
    const t = setTimeout(() => {
      performSearch(searchQuery)
      setSearchParams({ q: searchQuery })
    }, 250)
    return () => clearTimeout(t)
  }, [searchQuery, activeFilter, activeCategory])

  const loadAllTracks = async () => {
    try {
      const data = await api.getTracks()
      const t = Array.isArray(data) ? data : (data?.data || [])
      setAllTracks(t)
      if (activeCategory) loadByCategory(activeCategory)
      else if (query) performSearch(query)
    } catch { setAllTracks([]) }
  }

  const loadByCategory = async (category) => {
    setLoading(true)
    setHasSearched(true)
    try {
      const data = await api.getTracks({ category })
      const tracks = Array.isArray(data) ? data : (data?.data || [])
      setResults({ tracks, users: [], playlists: [] })
    } catch { toast.error('Failed to load category') }
    finally { setLoading(false) }
  }

  const performSearch = async (q) => {
    if (!q.trim()) return
    setLoading(true)
    setHasSearched(true)
    try {
      const data = await api.search(q, activeFilter === 'all' ? 'everything' : activeFilter)
      setResults({ tracks: data.tracks || [], users: data.users || [], playlists: data.playlists || [] })
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  const handlePlay = (track) => {
    if (currentTrack?.id === track.id) togglePlay()
    else playTrack(track, results.tracks)
  }

  const handleLike = async (trackId, e) => {
    e.stopPropagation()
    try {
      const r = await api.toggleLike(trackId)
      setResults(p => ({ ...p, tracks: p.tracks.map(t => t.id === trackId ? { ...t, is_liked: r.is_liked, likes_count: r.likes_count } : t) }))
      toast.success(r.is_liked ? 'Added to Liked Songs' : 'Removed')
    } catch { toast.error('Log in to like songs') }
  }

  // Show browse categories if no search
  if (!hasSearched && !loading) {
    return (
      <div className="sp-page">
        <h1 className="sp-section-title" style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Browse all</h1>
        <div className="sp-category-grid">
          {categories.map(cat => (
            <div key={cat.name} className="sp-category-card" style={{ background: cat.color }}
              onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setDurationFilter('all'); setSortOrder('default'); setCategorySearch(''); setSearchParams({ category: cat.name }) }}>
              <h3>{cat.name}</h3>
              <i className={`fas ${cat.icon}`}></i>
            </div>
          ))}
        </div>

        {/* Filter panel visible on browse page too */}
        <div style={{ marginTop: '32px' }}>
          <h2 className="sp-section-title" style={{ fontSize: '1rem', marginBottom: '14px' }}>Filter tracks</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 16px', background: 'var(--sp-bg-card)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--sp-text-muted)', width: '60px', flexShrink: 0 }}>Duration</span>
              {[['all', 'Any length'], ['short', '< 5 min'], ['medium', '5–30 min'], ['long', '> 30 min']].map(([val, label]) => (
                <button key={val} className={`sp-chip ${durationFilter === val ? 'active' : ''}`}
                  style={{ fontSize: '0.8rem', padding: '4px 14px' }}
                  onClick={() => setDurationFilter(val)}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--sp-text-muted)', width: '60px', flexShrink: 0 }}>Sort by</span>
              {[['default', 'Relevant'], ['newest', 'Newest'], ['most_played', 'Most Played']].map(([val, label]) => (
                <button key={val} className={`sp-chip ${sortOrder === val ? 'active' : ''}`}
                  style={{ fontSize: '0.8rem', padding: '4px 14px' }}
                  onClick={() => setSortOrder(val)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  let filteredTracks = activeFilter === 'all' || activeFilter === 'tracks' ? results.tracks : []

  if (activeCategory && categorySearch.trim()) {
    const q = categorySearch.toLowerCase()
    filteredTracks = filteredTracks.filter(t =>
      t.title?.toLowerCase().includes(q) || t.user?.name?.toLowerCase().includes(q)
    )
  }
  if (categoryFilter !== 'all') {
    filteredTracks = filteredTracks.filter(t => t.category === categoryFilter)
  }
  if (durationFilter === 'short') {
    filteredTracks = filteredTracks.filter(t => (t.duration || 0) < 300)
  } else if (durationFilter === 'medium') {
    filteredTracks = filteredTracks.filter(t => (t.duration || 0) >= 300 && (t.duration || 0) <= 1800)
  } else if (durationFilter === 'long') {
    filteredTracks = filteredTracks.filter(t => (t.duration || 0) > 1800)
  }
  if (sortOrder === 'most_played') {
    filteredTracks = [...filteredTracks].sort((a, b) => (b.plays || 0) - (a.plays || 0))
  } else if (sortOrder === 'newest') {
    filteredTracks = [...filteredTracks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  const filteredUsers = activeFilter === 'all' || activeFilter === 'people' ? results.users : []
  const filteredPlaylists = activeFilter === 'all' || activeFilter === 'playlists' ? results.playlists : []
  const totalResults = filteredTracks.length + filteredUsers.length + filteredPlaylists.length

  const trackCategories = [...new Set(results.tracks.map(t => t.category).filter(Boolean))]

  return (
    <div className="sp-page">
      {/* Category heading */}
      {activeCategory && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button className="sp-btn sp-btn-ghost" onClick={() => { setSearchParams({}); setHasSearched(false); setCategorySearch('') }}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--sp-white)' }}>{activeCategory}</h1>
          </div>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sp-text-muted)', fontSize: '0.85rem' }}></i>
            <input
              type="text"
              placeholder={`Search in ${activeCategory}...`}
              value={categorySearch}
              onChange={e => setCategorySearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                background: 'var(--sp-bg-card)',
                border: '1px solid var(--sp-divider)',
                borderRadius: '500px',
                color: 'var(--sp-white)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {categorySearch && (
              <button onClick={() => setCategorySearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--sp-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Type filter chips */}
      <div className="sp-chips" style={{ marginBottom: '10px' }}>
        {['all', 'tracks', 'people', 'playlists'].map(f => (
          <button key={f} className={`sp-chip ${activeFilter === f ? 'active' : ''}`}
            onClick={() => { setActiveFilter(f); setCategoryFilter('all'); setDurationFilter('all'); setSortOrder('default') }}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Track sub-filters */}
      {(activeFilter === 'all' || activeFilter === 'tracks') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', padding: '14px 16px', background: 'var(--sp-bg-card)', borderRadius: 'var(--radius-sm)' }}>
          {/* Duration filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--sp-text-muted)', width: '60px', flexShrink: 0 }}>Duration</span>
            {[['all', 'Any length'], ['short', '< 5 min'], ['medium', '5–30 min'], ['long', '> 30 min']].map(([val, label]) => (
              <button key={val} className={`sp-chip ${durationFilter === val ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '4px 14px' }}
                onClick={() => setDurationFilter(val)}>
                {label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          {trackCategories.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--sp-text-muted)', width: '60px', flexShrink: 0 }}>Category</span>
              {['all', ...trackCategories].map(c => (
                <button key={c} className={`sp-chip ${categoryFilter === c ? 'active' : ''}`}
                  style={{ fontSize: '0.8rem', padding: '4px 14px' }}
                  onClick={() => setCategoryFilter(c)}>
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
            </div>
          )}

          {/* Sort */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--sp-text-muted)', width: '60px', flexShrink: 0 }}>Sort by</span>
            {[['default', 'Relevant'], ['newest', 'Newest'], ['most_played', 'Most Played']].map(([val, label]) => (
              <button key={val} className={`sp-chip ${sortOrder === val ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '4px 14px' }}
                onClick={() => setSortOrder(val)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="sp-loading"><i className="fas fa-spinner fa-spin"></i><p>Searching...</p></div>}

      {!loading && totalResults === 0 && (
        <div className="sp-empty">
          <i className="fas fa-search"></i>
          <h3>No results found for "{searchQuery}"</h3>
          <p>Check your spelling or try different keywords</p>
        </div>
      )}

      {/* Top Result + Songs */}
      {!loading && filteredTracks.length > 0 && activeFilter === 'all' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
          {/* Top Result */}
          <div>
            <h2 className="sp-section-title" style={{ marginBottom: '16px' }}>{activeCategory ? activeCategory : 'Top result'}</h2>
            <div style={{ background: 'var(--sp-bg-card)', borderRadius: 'var(--radius-md)', padding: '20px', cursor: 'pointer', position: 'relative' }}
              onClick={() => navigate(`/tracks/${filteredTracks[0].id}`)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--sp-bg-highlight)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--sp-bg-card)'}>
              <div style={{ width: '92px', height: '92px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '16px', background: 'var(--sp-bg-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {filteredTracks[0].cover_url ? <img src={filteredTracks[0].cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-music" style={{ fontSize: '2rem', color: 'var(--sp-text-muted)' }}></i>}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '4px' }}>{filteredTracks[0].title}</div>
              <div style={{ color: 'var(--sp-text-sub)', fontSize: '0.9rem' }}>
                <span>Song</span> · <span>{filteredTracks[0].user?.name}</span>
              </div>
              <button className="sp-card-play" style={{ opacity: 1, position: 'absolute', bottom: '20px', right: '20px' }}
                onClick={(e) => { e.stopPropagation(); handlePlay(filteredTracks[0]) }}>
                <i className={`fas fa-${currentTrack?.id === filteredTracks[0].id && isPlaying ? 'pause' : 'play'}`}></i>
              </button>
            </div>
          </div>

          {/* Songs list */}
          <div>
            <h2 className="sp-section-title" style={{ marginBottom: '16px' }}>{activeCategory ? activeCategory : 'Songs'}</h2>
            {filteredTracks.slice(0, 4).map(track => (
              <div key={track.id} className="sp-track-row" style={{ gridTemplateColumns: '1fr auto' }} onClick={() => navigate(`/tracks/${track.id}`)}>
                <div className="sp-track-main" style={{ flex: 1 }}>
                  <div className="sp-track-cover">
                    {track.cover_url ? <img src={track.cover_url} alt="" /> : <i className="fas fa-music"></i>}
                  </div>
                  <div className="sp-track-name-col">
                    <div className={`sp-track-title ${currentTrack?.id === track.id ? 'playing' : ''}`}>{track.title}</div>
                    <div className="sp-track-artist">{track.user?.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className={`sp-btn-icon ${track.is_liked ? 'active' : ''}`} onClick={(e) => handleLike(track.id, e)}>
                    <i className={`${track.is_liked ? 'fas' : 'far'} fa-heart`} style={{ fontSize: '0.8rem' }}></i>
                  </button>
                  <span className="sp-track-duration">{formatDuration(track.duration)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All tracks (non-all filter) */}
      {!loading && filteredTracks.length > 0 && activeFilter === 'tracks' && (
        <div className="sp-section">
          <div className="sp-card-grid">
            {filteredTracks.map(track => (
              <div key={track.id} className="sp-card" onClick={() => navigate(`/tracks/${track.id}`)}>
                <div className="sp-card-img">
                  {track.cover_url ? <img src={track.cover_url} alt="" /> : <i className="fas fa-music"></i>}
                  <button className="sp-card-play" onClick={(e) => { e.stopPropagation(); handlePlay(track) }}>
                    <i className={`fas fa-${currentTrack?.id === track.id && isPlaying ? 'pause' : 'play'}`}></i>
                  </button>
                </div>
                <div className="sp-card-title">{track.title}</div>
                <div className="sp-card-sub">{track.user?.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Artists */}
      {!loading && filteredUsers.length > 0 && (
        <div className="sp-section">
          <h2 className="sp-section-title" style={{ marginBottom: '16px' }}>Artists</h2>
          <div className="sp-card-grid">
            {filteredUsers.map(u => (
              <div key={u.id} className="sp-card" onClick={() => navigate(`/users/${u.id}`)}>
                <div className="sp-card-img round">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" /> : <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{u.name?.charAt(0)}</span>}
                </div>
                <div className="sp-card-title">{u.name}</div>
                <div className="sp-card-sub">Artist</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playlists */}
      {!loading && filteredPlaylists.length > 0 && (
        <div className="sp-section">
          <h2 className="sp-section-title" style={{ marginBottom: '16px' }}>Playlists</h2>
          <div className="sp-card-grid">
            {filteredPlaylists.map(pl => (
              <div key={pl.id} className="sp-card" onClick={() => navigate(`/playlists/${pl.id}`)}>
                <div className="sp-card-img">
                  {pl.cover_url ? <img src={pl.cover_url} alt="" /> : <i className="fas fa-list" style={{ fontSize: '2rem' }}></i>}
                </div>
                <div className="sp-card-title">{pl.name}</div>
                <div className="sp-card-sub">By {pl.user?.name || 'Unknown'} · {pl.tracks_count || 0} songs</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
