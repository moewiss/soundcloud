import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom"
import ReactDOM from "react-dom"
import { Toaster, toast } from "react-hot-toast"
import { useState, useEffect, useRef, Component, lazy, Suspense } from "react"
import { PlayerProvider, usePlayer } from "./context/PlayerContext"
import { api } from "./services/api"
import { usePrayerTimes } from "./hooks/usePrayerTimes"
import {
  Home as HomeIcon, Search as SearchIcon, Radio as RadioIcon, LayoutGrid, Compass,
  SkipBack, SkipForward, Play, Pause, Shuffle, Repeat as RepeatIcon, Repeat1,
  Maximize2, List as ListIcon, Volume2, VolumeX, Heart,
  Bell, Upload as UploadIcon, Shield, ChevronDown, Settings as SettingsIcon,
  User, LogOut, LogIn, CircleUser, ArrowLeft, X, ChevronLeft, ChevronRight, Menu, Sparkles, Music, ListEnd, DownloadCloud
} from "lucide-react"

import QueuePanel from "./components/QueuePanel"

// Lazy-loaded pages for code splitting
const Home = lazy(() => import("./pages/Home"))
const Library = lazy(() => import("./pages/Library"))
const Search = lazy(() => import("./pages/Search"))
const Upload = lazy(() => import("./pages/Upload"))
const TrackDetail = lazy(() => import("./pages/TrackDetail"))
const UserProfile = lazy(() => import("./pages/UserProfile"))
const FollowersList = lazy(() => import("./pages/FollowersList"))
const Playlists = lazy(() => import("./pages/Playlists"))
const PlaylistDetail = lazy(() => import("./pages/PlaylistDetail"))
const Settings = lazy(() => import("./pages/Settings"))
const Notifications = lazy(() => import("./pages/Notifications"))
const Login = lazy(() => import("./pages/Login"))
const Register = lazy(() => import("./pages/Register"))
const TwoFactorChallenge = lazy(() => import("./pages/TwoFactorChallenge"))
const TwoFactorSetup = lazy(() => import("./pages/TwoFactorSetup"))
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"))
const ResetPassword = lazy(() => import("./pages/ResetPassword"))
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"))
const AdminPanel = lazy(() => import("./pages/AdminPanel"))
const ArtistPortal = lazy(() => import("./pages/artist/ArtistPortal"))
const MyTracks = lazy(() => import("./pages/MyTracks"))
const AdhanTimes = lazy(() => import("./pages/AdhanTimes"))
const Radio = lazy(() => import("./pages/Radio"))
const ComingSoon = lazy(() => import("./pages/ComingSoon"))
const Pricing = lazy(() => import("./pages/Pricing"))
const PromoteTrack = lazy(() => import("./pages/PromoteTrack"))
const Downloads = lazy(() => import("./pages/Downloads"))
const Onboarding = lazy(() => import("./pages/Onboarding"))
const Terms = lazy(() => import("./pages/Terms"))
const Privacy = lazy(() => import("./pages/Privacy"))

const PageLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--sp-bg, #0a0f0d)" }}>
    <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#1DB954", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  </div>
)

// ─── Error Boundary ───
class ErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a1510', color: '#fff', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Something went wrong</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/home' }}
            style={{ padding: '10px 24px', borderRadius: 12, background: '#1a7050', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Go Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Navbar (replaces Sidebar + TopBar) ───
function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = (p) => location.pathname === p
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState({ tracks: [], users: [], playlists: [] })
  const [suggestions, setSuggestions] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [dropdownFilter, setDropdownFilter] = useState('all')
  const [dropdownDuration, setDropdownDuration] = useState('all')
  const [dropdownCategory, setDropdownCategory] = useState('all')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const mobileSearchOpenRef = useRef(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingTracksCount, setPendingTracksCount] = useState(0)
  const menuRef = useRef(null)
  const searchRef = useRef(null)
  const { playTrack } = usePlayer()

  // Track scroll for navbar glass effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      setUser(JSON.parse(stored))
      fetchNotifications()
      fetchPendingCount()
      // Refresh user data from API to get latest is_admin etc.
      api.getMe().then(res => {
        const fresh = res.user || res
        localStorage.setItem("user", JSON.stringify(fresh))
        setUser(fresh)
      }).catch(() => {})
    } else {
      setUser(null)
    }
    setShowUserMenu(false)
    setShowNotifications(false)
  }, [location])

  useEffect(() => {
    const interval = setInterval(fetchPendingCount, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false)
        setShowNotifications(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target) && !mobileSearchOpenRef.current) {
        setShowSearchDropdown(false)
        setSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const fetchNotifications = async () => {
    if (!localStorage.getItem("token")) return
    try {
      const data = await api.getNotifications()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch {}
  }

  const fetchPendingCount = async () => {
    if (!localStorage.getItem("token")) return
    const stored = localStorage.getItem("user")
    if (!stored || !JSON.parse(stored).is_admin) return
    try {
      const data = await api.getPendingTracks()
      const list = Array.isArray(data) ? data : (data?.data || [])
      setPendingTracksCount(list.length)
    } catch {}
  }

  // Suggestions (fast, 150ms debounce)
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const data = await api.getSearchSuggestions(searchQuery)
        setSuggestions(data.suggestions || [])
      } catch { setSuggestions([]) }
    }, 150)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Search results (300ms debounce, includes filters)
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ tracks: [], users: [], playlists: [] })
      return
    }
    const t = setTimeout(async () => {
      setShowSearchDropdown(true)
      setSearchLoading(true)
      try {
        const filterVal = dropdownFilter === 'all' ? 'everything' : dropdownFilter
        const extra = {}
        if (dropdownDuration !== 'all') extra.duration = dropdownDuration
        if (dropdownCategory !== 'all') extra.category = dropdownCategory
        const data = await api.search(searchQuery, filterVal, extra)
        setSearchResults({
          tracks: (data.tracks || data.data?.tracks || []).slice(0, 8),
          users: (data.users || data.data?.users || []).slice(0, 5),
          playlists: (data.playlists || data.data?.playlists || []).slice(0, 4)
        })
      } catch (err) {
        // search failed
        setSearchResults({ tracks: [], users: [], playlists: [] })
      }
      finally { setSearchLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, dropdownFilter, dropdownDuration, dropdownCategory])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      closeSearch()
    }
  }

  const handleSuggestionClick = (text) => {
    navigate(`/search?q=${encodeURIComponent(text)}`)
    closeSearch()
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    toast.success("Logged out")
    navigate("/")
  }

  const formatTimeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000)
    if (s < 60) return "now"
    if (s < 3600) return `${Math.floor(s / 60)}m`
    if (s < 86400) return `${Math.floor(s / 3600)}h`
    return `${Math.floor(s / 86400)}d`
  }

  const getNotifIcon = (type) => {
    switch (type) {
      case "like": return "fa-heart"
      case "comment": case "comment_reply": return "fa-comment"
      case "follow": return "fa-user-plus"
      case "repost": return "fa-retweet"
      default: return "fa-bell"
    }
  }

  const closeSearch = () => {
    setSearchQuery("")
    setSuggestions([])
    setSearchResults({ tracks: [], users: [], playlists: [] })
    setShowSearchDropdown(false)
    setSearchFocused(false)
    setMobileSearchOpen(false)
    mobileSearchOpenRef.current = false
  }

  return (
    <>
    <nav className="sp-navbar">
      <div className="sp-navbar-inner">
        {/* Logo */}
        <div className="sp-navbar-logo" onClick={() => navigate('/home')}>
          <img src="/hero-logo.png" alt="Nashidify" className="sp-navbar-logo-img" />
        </div>

        {/* Desktop Nav Links — Lucide icons */}
        <div className="sp-navbar-links">
          <Link to="/home" className={`sp-navbar-link ${isActive('/home') ? 'active' : ''}`}>
            <HomeIcon size={16} /> Home
          </Link>
          <Link to="/search" className={`sp-navbar-link ${isActive('/search') ? 'active' : ''}`}>
            <SearchIcon size={16} /> Search
          </Link>
          <Link to="/library" className={`sp-navbar-link ${isActive('/library') ? 'active' : ''}`}>
            <LayoutGrid size={16} /> Library
          </Link>
          <Link to="/downloads" className={`sp-navbar-link ${isActive('/downloads') ? 'active' : ''}`}>
            <DownloadCloud size={16} /> Downloads
          </Link>
          <Link to="/radio" className={`sp-navbar-link ${isActive('/radio') ? 'active' : ''}`}>
            <RadioIcon size={16} /> Radio
          </Link>
        </div>

      <div className="sp-topbar-left">
        {/* Mobile logo */}
        <img src="/hero-logo.png" alt="Nashidify" className="sp-mobile-topbar-logo" onClick={() => navigate('/home')} />
      </div>

      {/* Mobile burger menu button */}
      <button className="sp-mobile-burger" onClick={() => { setMobileMenuOpen(true); document.body.classList.add('menu-open') }}>
        <Menu size={22} />
        {(unreadCount > 0 || pendingTracksCount > 0) && <span className="sp-burger-badge" />}
      </button>

      <div className="sp-topbar-left sp-desktop-only">

        {/* Desktop search bar */}
        <div className="sp-topbar-search sp-desktop-search" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search nasheeds, artists, Quran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { setSearchFocused(true); setShowSearchDropdown(true) }}
            />
            <i className="fas fa-search"></i>
            {searchQuery && (
              <button type="button" className="sp-search-clear" onClick={() => { setSearchQuery(""); setSuggestions([]); setSearchResults({ tracks: [], users: [], playlists: [] }); setShowSearchDropdown(false) }}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </form>

          {(showSearchDropdown || searchFocused) && (searchQuery.length >= 2) && (
            <div className="sp-search-dropdown">
              <div className="sp-search-filters">
                <div className="sp-search-filter-row">
                  {[['all', 'All'], ['tracks', 'Tracks'], ['people', 'Artists'], ['playlists', 'Playlists']].map(([v, l]) => (
                    <button key={v} className={`sp-search-filter-chip${dropdownFilter === v ? ' active' : ''}`}
                      onClick={() => setDropdownFilter(v)}>{l}</button>
                  ))}
                  <span className="sp-search-filter-divider" />
                  {[['all', 'All'], ['Nasheeds', 'Nasheeds'], ['Quran', 'Quran'], ['Lectures', 'Lectures'], ['Duas', 'Duas'], ['Broadcast', 'Podcasts']].map(([v, l]) => (
                    <button key={v} className={`sp-search-filter-chip sp-search-filter-chip-sm${dropdownCategory === v ? ' active' : ''}`}
                      onClick={() => setDropdownCategory(v)}>{l}</button>
                  ))}
                  <span className="sp-search-filter-divider" />
                  {[['all', 'Any length'], ['short', '< 5m'], ['medium', '5–30m'], ['long', '> 30m']].map(([v, l]) => (
                    <button key={v} className={`sp-search-filter-chip sp-search-filter-chip-sm${dropdownDuration === v ? ' active' : ''}`}
                      onClick={() => setDropdownDuration(v)}>{l}</button>
                  ))}
                </div>
              </div>

              {searchLoading && (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--sp-text-muted)', fontSize: '0.8rem' }}>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>Searching...
                </div>
              )}

              {!searchLoading && searchResults.tracks.length > 0 && (dropdownFilter === 'all' || dropdownFilter === 'tracks') && (() => {
                const grouped = {}
                searchResults.tracks.forEach(track => {
                  const cat = track.category || 'Other'
                  if (!grouped[cat]) grouped[cat] = []
                  grouped[cat].push(track)
                })
                return Object.entries(grouped).map(([category, tracks]) => (
                  <div key={category}>
                    <div className="sp-search-section-title">{category}</div>
                    {tracks.map(track => (
                      <div key={track.id} className="sp-search-item" onClick={() => { navigate(`/tracks/${track.id}`); setShowSearchDropdown(false); setSearchFocused(false); setSearchQuery("") }}>
                        <div className="sp-search-item-img">
                          {track.cover_url ? <img src={track.cover_url} alt="" /> : <img src="/logo.png" alt="" style={{ width: '50%', height: '50%', objectFit: 'contain', opacity: 0.5 }} />}
                          <button className="sp-search-item-play" onClick={(e) => { e.stopPropagation(); playTrack(track) }}>
                            <i className="fas fa-play" style={{ fontSize: "0.65rem" }}></i>
                          </button>
                        </div>
                        <div className="sp-search-item-info">
                          <div className="sp-search-item-title">{track.title}</div>
                          <div className="sp-search-item-sub">{track.user?.name || "Unknown"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              })()}

              {!searchLoading && searchResults.users.length > 0 && (dropdownFilter === 'all' || dropdownFilter === 'people') && (
                <>
                  <div className="sp-search-section-title">Artists</div>
                  {searchResults.users.map(u => (
                    <div key={u.id} className="sp-search-item" onClick={() => { navigate(`/users/${u.id}`); setShowSearchDropdown(false); setSearchFocused(false); setSearchQuery("") }}>
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

              {!searchLoading && searchResults.playlists.length > 0 && (dropdownFilter === 'all' || dropdownFilter === 'playlists') && (
                <>
                  <div className="sp-search-section-title">Playlists</div>
                  {searchResults.playlists.map(pl => (
                    <div key={pl.id} className="sp-search-item" onClick={() => { navigate(`/playlists/${pl.id}`); setShowSearchDropdown(false); setSearchFocused(false); setSearchQuery("") }}>
                      <div className="sp-search-item-img">
                        {pl.cover_url ? <img src={pl.cover_url} alt="" /> : <span style={{ fontSize: '0.9rem', color: 'var(--sp-gold)', opacity: 0.5 }}>♫</span>}
                      </div>
                      <div className="sp-search-item-info">
                        <div className="sp-search-item-title">{pl.name}</div>
                        <div className="sp-search-item-sub">Playlist · {pl.tracks_count || 0} tracks</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!searchLoading && searchQuery && searchResults.tracks.length === 0 && searchResults.users.length === 0 && searchResults.playlists.length === 0 && suggestions.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--sp-text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
                  No results for "{searchQuery}"
                </div>
              )}

              {searchQuery && (searchResults.tracks.length > 0 || searchResults.users.length > 0 || searchResults.playlists.length > 0) && (
                <div className="sp-search-see-all" onClick={() => { navigate(`/search?q=${encodeURIComponent(searchQuery)}`); setShowSearchDropdown(false); setSearchFocused(false); setSearchQuery("") }}>
                  <i className="fas fa-search"></i> See all results for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="sp-topbar-right" ref={menuRef}>
        {user ? (
          <>
            <div className="sp-topbar-actions">
              {user.is_admin && (
                <Link to="/admin" className="sp-icon-btn" style={{ position: "relative" }} title="Admin Panel">
                  <i className="fas fa-shield-halved" style={{ fontSize: "0.82rem" }}></i>
                  {pendingTracksCount > 0 && (
                    <span className="sp-notification-badge has-count">{pendingTracksCount}</span>
                  )}
                </Link>
              )}
              <Link to="/upload" className="sp-icon-btn" title="Upload">
                <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: "0.82rem" }}></i>
              </Link>
              <div style={{ position: "relative" }}>
                <button className="sp-icon-btn" onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }} title="Notifications">
                  <i className="fas fa-bell" style={{ fontSize: "0.84rem" }}></i>
                  {unreadCount > 0 && <span className="sp-notification-badge has-count">{unreadCount}</span>}
                </button>

              {showNotifications && (
                <div className="sp-dropdown sp-notifications-dropdown">
                  <div className="sp-dropdown-header">
                    <span>Notifications</span>
                    <Link to="/notifications" onClick={() => setShowNotifications(false)}>See all</Link>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "28px", textAlign: "center", color: "var(--sp-text-muted)", fontSize: "0.86rem", fontWeight: 500 }}>No notifications</div>
                  ) : (
                    notifications.slice(0, 5).map(n => (
                      <div key={n.id} className={`sp-notification-item ${!n.read ? "unread" : ""}`}
                        onClick={() => {
                          if (!n.read) api.markNotificationRead(n.id).catch(() => {})
                          if (n.track_id) navigate(`/tracks/${n.track_id}`)
                          else if (n.actor_id) navigate(`/users/${n.actor_id}`)
                          setShowNotifications(false)
                        }}>
                        <div className={`sp-notification-icon ${n.type}`}>
                          <i className={`fas ${getNotifIcon(n.type)}`}></i>
                        </div>
                        <div>
                          <div className="sp-notification-text">
                            <strong>{n.actor?.name || "Someone"}</strong> {n.message?.replace(n.actor?.name || "", "") || "notification"}
                          </div>
                          <div className="sp-notification-time">{formatTimeAgo(n.created_at)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <button className="sp-user-btn" onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}>
                <div className="sp-user-avatar">{user.name?.charAt(0) || "U"}</div>
                {user.name?.split(" ")[0]}
                <i className="fas fa-chevron-down sp-desktop-only" style={{ fontSize: "0.5rem", marginLeft: 2, opacity: 0.35 }}></i>
              </button>

              {showUserMenu && (
                <div className="sp-dropdown">
                  <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'linear-gradient(135deg, var(--sp-green), var(--sp-teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.82rem', boxShadow: '0 2px 6px rgba(26,112,80,0.2)' }}>
                      {user.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--sp-text)', letterSpacing: '-0.01em' }}>{user.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--sp-text-muted)', marginTop: '1px' }}>{user.email || 'View profile'}</div>
                    </div>
                  </div>
                  <div className="sp-dropdown-divider" />
                  <Link to={`/users/${user.id}`} className="sp-dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="fas fa-user"></i> Profile
                  </Link>
                  <Link to="/settings" className="sp-dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="fas fa-gear"></i> Settings
                  </Link>
                  <Link to="/pricing" className="sp-dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="fas fa-crown" style={{ color: 'var(--sp-gold)' }}></i> Subscription
                  </Link>
                  <Link to="/promote" className="sp-dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="fas fa-rocket" style={{ color: 'var(--sp-green)' }}></i> Promote Track
                  </Link>
                  {user.is_artist && (
                    <Link to="/artist" className="sp-dropdown-item" onClick={() => setShowUserMenu(false)}>
                      <i className="fas fa-microphone" style={{ color: '#C9A24D' }}></i> Artist Portal
                    </Link>
                  )}
                  <div className="sp-dropdown-divider" />
                  <button className="sp-dropdown-item" onClick={handleLogout} style={{ color: '#FF3B30' }}>
                    <i className="fas fa-arrow-right-from-bracket" style={{ color: '#FF3B30' }}></i> Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="sp-auth-btn login">Log in</Link>
            <Link to="/register" className="sp-auth-btn signup">Get Started</Link>
          </>
        )}
      </div>
      </div>

    </nav>

    {/* Mobile menu - portaled to body */}
    <MobileMenu
      open={mobileMenuOpen}
      onClose={() => { setMobileMenuOpen(false); document.body.classList.remove('menu-open') }}
      user={user}
      isActive={isActive}
      navigate={navigate}
      unreadCount={unreadCount}
      pendingTracksCount={pendingTracksCount}
      onSearch={() => { setMobileSearchOpen(true); mobileSearchOpenRef.current = true; setTimeout(() => document.getElementById('mobile-search-input')?.focus(), 100) }}
      onLogout={handleLogout}
    />

    {/* Mobile search - portaled to body */}
    {mobileSearchOpen && ReactDOM.createPortal(
      <MobileSearchOverlay
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        searchLoading={searchLoading}
        dropdownFilter={dropdownFilter}
        setDropdownFilter={setDropdownFilter}
        dropdownCategory={dropdownCategory}
        setDropdownCategory={setDropdownCategory}
        suggestions={suggestions}
        setSuggestions={setSuggestions}
        onClose={closeSearch}
        onNavigate={(path) => { navigate(path); closeSearch() }}
        onSubmit={handleSearchSubmit}
        playTrack={playTrack}
        setSearchFocused={setSearchFocused}
        setShowSearchDropdown={setShowSearchDropdown}
      />,
      document.body
    )}
    </>
  )
}

// ─── Mobile Search Overlay (portaled) ───
function MobileSearchOverlay({ searchQuery, setSearchQuery, searchResults, setSearchResults, searchLoading, dropdownFilter, setDropdownFilter, dropdownCategory, setDropdownCategory, suggestions, setSuggestions, onClose, onNavigate, onSubmit, playTrack, setSearchFocused, setShowSearchDropdown }) {
  return (
    <div className="sp-mobile-search-fullscreen">
      <div className="sp-mobile-search-header">
        <button className="sp-mobile-search-back" onClick={onClose}>
          <ArrowLeft size={20} />
        </button>
        <form className="sp-mobile-search-form" onSubmit={onSubmit}>
          <SearchIcon size={16} className="sp-mobile-search-icon" />
          <input
            id="mobile-search-input"
            type="text"
            placeholder="Search nasheeds, artists, Quran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { setSearchFocused(true); setShowSearchDropdown(true) }}
            autoFocus
          />
          {searchQuery && (
            <button type="button" className="sp-mobile-search-clear" onClick={() => { setSearchQuery(""); setSuggestions([]); setSearchResults({ tracks: [], users: [], playlists: [] }) }}>
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      {searchQuery.length >= 2 && (
        <div className="sp-mobile-search-filters">
          <div className="sp-mobile-search-filter-scroll">
            {[['all', 'All'], ['tracks', 'Tracks'], ['people', 'Artists'], ['playlists', 'Playlists']].map(([v, l]) => (
              <button key={v} className={`sp-search-filter-chip${dropdownFilter === v ? ' active' : ''}`}
                onClick={() => setDropdownFilter(v)}>{l}</button>
            ))}
            <span className="sp-search-filter-divider" />
            {[['all', 'All'], ['Nasheeds', 'Nasheeds'], ['Quran', 'Quran'], ['Lectures', 'Lectures'], ['Duas', 'Duas'], ['Broadcast', 'Podcasts']].map(([v, l]) => (
              <button key={v} className={`sp-search-filter-chip sp-search-filter-chip-sm${dropdownCategory === v ? ' active' : ''}`}
                onClick={() => setDropdownCategory(v)}>{l}</button>
            ))}
          </div>
        </div>
      )}

      <div className="sp-mobile-search-results">
        {searchLoading && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--sp-text-muted)', fontSize: '0.84rem' }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Searching...
          </div>
        )}

        {!searchLoading && searchResults.tracks.length > 0 && (dropdownFilter === 'all' || dropdownFilter === 'tracks') && (() => {
          const grouped = {}
          searchResults.tracks.forEach(track => {
            const cat = track.category || 'Other'
            if (!grouped[cat]) grouped[cat] = []
            grouped[cat].push(track)
          })
          return Object.entries(grouped).map(([category, tracks]) => (
            <div key={category}>
              <div className="sp-search-section-title">{category}</div>
              {tracks.map(track => (
                <div key={track.id} className="sp-search-item" onClick={() => onNavigate(`/tracks/${track.id}`)}>
                  <div className="sp-search-item-img">
                    {track.cover_url ? <img src={track.cover_url} alt="" /> : <img src="/logo.png" alt="" style={{ width: '50%', height: '50%', objectFit: 'contain', opacity: 0.5 }} />}
                    <button className="sp-search-item-play" onClick={(e) => { e.stopPropagation(); playTrack(track) }}>
                      <i className="fas fa-play" style={{ fontSize: "0.65rem" }}></i>
                    </button>
                  </div>
                  <div className="sp-search-item-info">
                    <div className="sp-search-item-title">{track.title}</div>
                    <div className="sp-search-item-sub">{track.user?.name || "Unknown"}</div>
                  </div>
                </div>
              ))}
            </div>
          ))
        })()}

        {!searchLoading && searchResults.users.length > 0 && (dropdownFilter === 'all' || dropdownFilter === 'people') && (
          <>
            <div className="sp-search-section-title">Artists</div>
            {searchResults.users.map(u => (
              <div key={u.id} className="sp-search-item" onClick={() => onNavigate(`/users/${u.id}`)}>
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

        {!searchLoading && searchResults.playlists.length > 0 && (dropdownFilter === 'all' || dropdownFilter === 'playlists') && (
          <>
            <div className="sp-search-section-title">Playlists</div>
            {searchResults.playlists.map(pl => (
              <div key={pl.id} className="sp-search-item" onClick={() => onNavigate(`/playlists/${pl.id}`)}>
                <div className="sp-search-item-img">
                  {pl.cover_url ? <img src={pl.cover_url} alt="" /> : <span style={{ fontSize: '0.9rem', color: 'var(--sp-gold)', opacity: 0.5 }}>♫</span>}
                </div>
                <div className="sp-search-item-info">
                  <div className="sp-search-item-title">{pl.name}</div>
                  <div className="sp-search-item-sub">Playlist · {pl.tracks_count || 0} tracks</div>
                </div>
              </div>
            ))}
          </>
        )}

        {!searchLoading && searchQuery && searchQuery.length >= 2 && searchResults.tracks.length === 0 && searchResults.users.length === 0 && searchResults.playlists.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--sp-text-muted)', fontSize: '0.88rem', fontWeight: 500 }}>
            No results for "{searchQuery}"
          </div>
        )}

        {searchQuery && searchQuery.length >= 2 && (searchResults.tracks.length > 0 || searchResults.users.length > 0 || searchResults.playlists.length > 0) && (
          <div className="sp-search-see-all" onClick={() => onNavigate(`/search?q=${encodeURIComponent(searchQuery)}`)}>
            <SearchIcon size={14} /> See all results for "{searchQuery}"
          </div>
        )}

        {(!searchQuery || searchQuery.length < 2) && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <SearchIcon size={40} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '16px' }} />
            <p style={{ color: 'var(--sp-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Search for nasheeds, artists, Quran recitations...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Mobile Menu (rendered via portal to escape navbar stacking context) ───
function MobileMenu({ open, onClose, user, isActive, navigate, unreadCount, pendingTracksCount, onSearch, onLogout }) {
  if (!open) return null
  return ReactDOM.createPortal(
    <>
      <div className="sp-mobile-menu-backdrop" onClick={onClose} />
      <div className="sp-mobile-menu">
        <div className="sp-mobile-menu-header">
          <img src="/hero-logo.png" alt="Nashidify" style={{ height: '28px', width: 'auto' }} />
          <button className="sp-mobile-menu-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <button className="sp-mobile-menu-search" onClick={() => { onClose(); onSearch() }}>
          <SearchIcon size={16} />
          <span>Search</span>
        </button>

        <div className="sp-mobile-menu-nav">
          {[
            ['/home', 'Home', HomeIcon],
            ['/search', 'Search', SearchIcon],
            ['/library', 'Library', LayoutGrid],
            ['/downloads', 'Downloads', DownloadCloud],
            ['/radio', 'Radio', RadioIcon],
          ].map(([path, label, Icon]) => (
            <Link key={path} to={path} className={`sp-mobile-menu-link${isActive(path) ? ' active' : ''}`} onClick={onClose}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        <div className="sp-mobile-menu-divider" />

        {user ? (
          <>
            <div className="sp-mobile-menu-nav">
              <Link to="/upload" className="sp-mobile-menu-link" onClick={onClose}>
                <UploadIcon size={18} />
                <span>Upload</span>
              </Link>
              <Link to="/notifications" className="sp-mobile-menu-link" onClick={onClose}>
                <Bell size={18} />
                <span>Notifications</span>
                {unreadCount > 0 && <span className="sp-mobile-menu-badge">{unreadCount}</span>}
              </Link>
              {user.is_admin && (
                <Link to="/admin" className="sp-mobile-menu-link" onClick={onClose}>
                  <Shield size={18} />
                  <span>Admin Panel</span>
                  {pendingTracksCount > 0 && <span className="sp-mobile-menu-badge">{pendingTracksCount}</span>}
                </Link>
              )}
            </div>

            <div className="sp-mobile-menu-divider" />

            <div className="sp-mobile-menu-user">
              <div className="sp-mobile-menu-avatar">{user.name?.charAt(0) || 'U'}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--sp-text)' }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sp-text-muted)', marginTop: '2px' }}>{user.email}</div>
              </div>
            </div>

            <div className="sp-mobile-menu-nav" style={{ paddingTop: 0 }}>
              <Link to={`/users/${user.id}`} className="sp-mobile-menu-link" onClick={onClose}>
                <User size={18} />
                <span>Profile</span>
              </Link>
              <Link to="/settings" className="sp-mobile-menu-link" onClick={onClose}>
                <SettingsIcon size={18} />
                <span>Settings</span>
              </Link>
              <Link to="/pricing" className="sp-mobile-menu-link" onClick={onClose}>
                <i className="fas fa-crown" style={{ width: 18, textAlign: 'center', fontSize: '0.85rem', color: 'var(--sp-gold)' }}></i>
                <span>Subscription</span>
              </Link>
              <Link to="/promote" className="sp-mobile-menu-link" onClick={onClose}>
                <i className="fas fa-rocket" style={{ width: 18, textAlign: 'center', fontSize: '0.85rem', color: 'var(--sp-green-light)' }}></i>
                <span>Promote Track</span>
              </Link>
            </div>

            <div className="sp-mobile-menu-divider" />

            <button className="sp-mobile-menu-link sp-mobile-menu-logout" onClick={() => { onClose(); onLogout() }}>
              <LogOut size={18} />
              <span>Log out</span>
            </button>
          </>
        ) : (
          <div className="sp-mobile-menu-auth">
            <Link to="/login" className="sp-mobile-menu-auth-btn login" onClick={onClose}>Log in</Link>
            <Link to="/register" className="sp-mobile-menu-auth-btn signup" onClick={onClose}>Get Started</Link>
          </div>
        )}
      </div>
    </>,
    document.body
  )
}

// ─── Prayer-Aware Playback ───
function PrayerAwarePlayback() {
  const { isPlaying, pause, resume, currentTrack } = usePlayer()
  const { currentPrayer, nextPrayer, locationGranted } = usePrayerTimes()
  const [pausedForPrayer, setPausedForPrayer] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [autoResumeIn, setAutoResumeIn] = useState(null)
  const autoResumeRef = useRef(null)
  const triggeredRef = useRef(new Set())

  const triggerPrayerPause = (prayerName) => {
    clearInterval(autoResumeRef.current)
    setPausedForPrayer(prayerName)
    setShowBanner(true)
    if (isPlaying) {
      pause()
      const AUTO_RESUME_SECONDS = 30 // short for testing
      setAutoResumeIn(AUTO_RESUME_SECONDS)
      let remaining = AUTO_RESUME_SECONDS
      autoResumeRef.current = setInterval(() => {
        remaining -= 1
        setAutoResumeIn(remaining)
        if (remaining <= 0) {
          clearInterval(autoResumeRef.current)
          setShowBanner(false)
          setPausedForPrayer(null)
          setAutoResumeIn(null)
          resume()
        }
      }, 1000)
    }
  }

  // Expose test trigger globally for easy testing
  useEffect(() => {
    window.__testPrayerPause = () => triggerPrayerPause('Dhuhr')
    return () => { delete window.__testPrayerPause }
  }, [isPlaying])

  // Reset triggered set at midnight
  useEffect(() => {
    const now = new Date()
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now
    const timer = setTimeout(() => { triggeredRef.current = new Set() }, msUntilMidnight)
    return () => clearTimeout(timer)
  }, [])

  // Detect prayer time and pause playback
  useEffect(() => {
    if (!currentPrayer) return
    const prayerEnabled = localStorage.getItem('nashidify_prayer_pause') !== 'false'
    if (!prayerEnabled) return
    if (triggeredRef.current.has(currentPrayer.name)) return

    triggeredRef.current.add(currentPrayer.name)

    if (isPlaying) {
      pause()
      setPausedForPrayer(currentPrayer.name)
      setShowBanner(true)

      // Auto-resume after 15 minutes
      const AUTO_RESUME_SECONDS = 15 * 60
      setAutoResumeIn(AUTO_RESUME_SECONDS)

      clearInterval(autoResumeRef.current)
      let remaining = AUTO_RESUME_SECONDS
      autoResumeRef.current = setInterval(() => {
        remaining -= 1
        setAutoResumeIn(remaining)
        if (remaining <= 0) {
          clearInterval(autoResumeRef.current)
          setShowBanner(false)
          setPausedForPrayer(null)
          setAutoResumeIn(null)
          resume()
        }
      }, 1000)
    } else {
      // Music wasn't playing, still show reminder banner
      setPausedForPrayer(currentPrayer.name)
      setShowBanner(true)
    }
  }, [currentPrayer])

  const handleResume = () => {
    clearInterval(autoResumeRef.current)
    setShowBanner(false)
    setPausedForPrayer(null)
    setAutoResumeIn(null)
    if (pausedForPrayer && currentTrack) {
      resume()
    }
  }

  const handleDismiss = () => {
    clearInterval(autoResumeRef.current)
    setShowBanner(false)
    setAutoResumeIn(null)
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!showBanner) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(130px + env(safe-area-inset-bottom, 0px))',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(21,66,50,0.92)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      color: '#fff',
      borderRadius: '20px',
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(255,255,255,0.08)',
      zIndex: 9999,
      minWidth: 'min(340px, calc(100vw - 32px))',
      maxWidth: 'min(460px, calc(100vw - 32px))',
      animation: 'slideUp 0.4s cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      <div style={{ fontSize: '1.5rem' }}>🕌</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '2px', letterSpacing: '-0.01em' }}>
          {pausedForPrayer} prayer time
        </div>
        <div style={{ fontSize: '0.76rem', opacity: 0.75 }}>
          {autoResumeIn !== null
            ? `Playback paused · Resuming in ${formatTime(autoResumeIn)}`
            : 'Prayer reminder · Nothing was playing'}
        </div>
      </div>
      {autoResumeIn !== null && currentTrack && (
        <button
          onClick={handleResume}
          style={{
            background: 'rgba(255,255,255,0.18)',
            border: 'none',
            color: '#fff',
            borderRadius: '14px',
            padding: '7px 16px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(8px)',
            transition: 'background 0.2s',
            letterSpacing: '-0.01em',
          }}
        >
          Resume now
        </button>
      )}
      <button
        onClick={handleDismiss}
        style={{
          background: 'rgba(255,255,255,0.12)',
          border: 'none',
          color: 'rgba(255,255,255,0.65)',
          cursor: 'pointer',
          fontSize: '0.8rem',
          padding: '6px',
          lineHeight: 1,
          borderRadius: '50%',
          width: '26px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  )
}

// ─── Player Bar ───
function PlayerBar() {
  const {
    currentTrack, isPlaying, progress, duration, volume,
    shuffle, repeat,
    togglePlay, seek, setVolume, playNext, playPrevious,
    toggleShuffle, toggleRepeat,
    adPlaying, adSkippable, adProgress, skipAd, insertNext,
  } = usePlayer()
  const { nextPrayer, locationGranted } = usePrayerTimes()
  const [liked, setLiked] = useState(false)

  // Reset liked state when track changes
  useEffect(() => {
    if (!currentTrack) { setLiked(false); return }
    if (!localStorage.getItem('token')) { setLiked(false); return }
    setLiked(false)
    api.getLikedTracks().then(tracks => {
      const ids = (Array.isArray(tracks) ? tracks : []).map(t => (t.track || t).id)
      setLiked(ids.includes(currentTrack.id))
    }).catch(() => {})
  }, [currentTrack?.id])

  const [prayerPauseEnabled, setPrayerPauseEnabled] = useState(
    localStorage.getItem('nashidify_prayer_pause') !== 'false'
  )
  const [showPrayerTooltip, setShowPrayerTooltip] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const [scrubPct, setScrubPct] = useState(null)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const justDismissedRef = useRef(false)
  const progressRef = useRef(null)
  const expandedProgressRef = useRef(null)
  const volumeRef = useRef(null)
  const scrubbing = useRef(false)
  const scrubStart = useRef({ x: 0, time: 0 })
  const dragStartY = useRef(0)
  const dragYRef = useRef(0)
  const panelRef = useRef(null)
  const navigate = useNavigate()

  const togglePrayerPause = () => {
    const next = !prayerPauseEnabled
    setPrayerPauseEnabled(next)
    localStorage.setItem('nashidify_prayer_pause', String(next))
    toast(next ? 'Prayer-aware playback enabled' : 'Prayer-aware playback disabled', {
      icon: next ? '🕌' : '🔕',
    })
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00"
    const m = Math.floor(s / 60)
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`
  }

  const handleProgressClick = (e) => {
    if (!progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    seek(((e.clientX - rect.left) / rect.width) * duration)
  }

  const handleVolumeClick = (e) => {
    if (!volumeRef.current) return
    const rect = volumeRef.current.getBoundingClientRect()
    setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
  }

  const handleLike = async () => {
    if (!currentTrack || !localStorage.getItem("token")) return
    try {
      const res = await api.toggleLike(currentTrack.id)
      setLiked(res.is_liked)
    } catch {}
  }

  if (!currentTrack) return (
    <div className="sp-player" style={{ justifyContent: "center" }}>
      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.84rem", fontWeight: 500, letterSpacing: "-0.01em" }}>Select a track to start listening</span>
    </div>
  )

  const pct = scrubPct !== null ? scrubPct : (duration ? (progress / duration) * 100 : 0)
  const scrubTime = scrubPct !== null && duration ? (scrubPct / 100) * duration : null

  // Convert a clientX to a 0-100 percentage on the bar
  const clientXToPct = (clientX) => {
    const bar = expandedProgressRef.current
    if (!bar) return 0
    const rect = bar.getBoundingClientRect()
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
  }

  const handleExpandedProgressClick = (e) => {
    if (scrubbing.current || !duration) return
    const p = clientXToPct(e.clientX)
    seek((p / 100) * duration)
  }

  // Touch scrub — absolute position, thumb follows finger exactly
  const onScrubStart = (e) => {
    e.preventDefault()
    scrubbing.current = true
    const p = clientXToPct(e.touches[0].clientX)
    setScrubPct(p)
    seek((p / 100) * duration)

    const onMove = (ev) => {
      const np = clientXToPct(ev.touches[0].clientX)
      setScrubPct(np)
      seek((np / 100) * duration)
    }
    const onEnd = () => {
      scrubbing.current = false
      setScrubPct(null)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onEnd)
  }

  // Mouse scrub — same logic for desktop cursor drag
  const onMouseScrubStart = (e) => {
    if (!duration) return
    e.preventDefault()
    scrubbing.current = true
    const p = clientXToPct(e.clientX)
    setScrubPct(p)
    seek((p / 100) * duration)

    const onMove = (ev) => {
      const np = clientXToPct(ev.clientX)
      setScrubPct(np)
      seek((np / 100) * duration)
    }
    const onUp = () => {
      scrubbing.current = false
      setScrubPct(null)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Drag-to-close handlers for expanded player
  const onPanelDragStart = (e) => {
    if (scrubbing.current) return
    const y = e.touches ? e.touches[0].clientY : e.clientY
    dragStartY.current = y
    dragYRef.current = 0
    setDragging(true)

    const onMove = (ev) => {
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY
      const dy = Math.max(0, cy - dragStartY.current)
      dragYRef.current = dy
      setDragY(dy)
    }
    const onEnd = (ev) => {
      setDragging(false)
      if (dragYRef.current > 120) {
        ev.preventDefault()
        ev.stopPropagation()
        setExpanded(false)
        setQueueOpen(false)
        // Block mini player clicks for a moment
        justDismissedRef.current = true
        setTimeout(() => { justDismissedRef.current = false }, 400)
      }
      setDragY(0)
      dragYRef.current = 0
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
    }
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onEnd)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
  }

  // Show ad overlay if an audio ad is playing
  if (adPlaying) {
    const adDur = adPlaying.audio_duration || 30
    const adPct = adDur ? (adProgress / adDur) * 100 : 0
    const remaining = Math.max(0, Math.ceil(adDur - adProgress))
    const skipCountdown = Math.max(0, Math.ceil((adPlaying.skip_after_seconds || 5) - adProgress))
    const formatTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

    return (
      <div className="sp-ad-player">
        {/* Shimmer top border */}
        <div className="sp-ad-shimmer" />

        {/* Content */}
        <div className="sp-ad-content">
          {/* Left: artwork + info */}
          <div className="sp-ad-left">
            <div className="sp-ad-artwork">
              {adPlaying.image_url
                ? <img src={adPlaying.image_url} alt="" />
                : <div className="sp-ad-artwork-fallback"><i className="fas fa-bullhorn"></i></div>}
            </div>
            <div className="sp-ad-info">
              <div className="sp-ad-title-row">
                <span className="sp-ad-badge">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                  AD
                </span>
                <span className="sp-ad-title">{adPlaying.title}</span>
              </div>
              <div className="sp-ad-desc">{adPlaying.description || 'Sponsored'}</div>
            </div>
          </div>

          {/* Center: progress (desktop only) */}
          <div className="sp-ad-progress-section sp-desktop-only">
            <div className="sp-ad-times">
              <span>{formatTime(adProgress)}</span>
              <span>{formatTime(remaining)}</span>
            </div>
            <div className="sp-ad-bar-track">
              <div className="sp-ad-bar-fill" style={{ width: `${Math.min(adPct, 100)}%` }}>
                <div className="sp-ad-bar-dot" />
              </div>
            </div>
          </div>

          {/* Right: skip */}
          <div className="sp-ad-actions">
            {adSkippable ? (
              <button className="sp-ad-skip-btn" onClick={skipAd}>
                Skip
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
              </button>
            ) : (
              <div className="sp-ad-countdown">
                <div className="sp-ad-countdown-ring">
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(201,162,77,0.15)" strokeWidth="2.5" />
                    <circle cx="16" cy="16" r="13" fill="none" stroke="var(--sp-gold, #C9A24D)" strokeWidth="2.5"
                      strokeDasharray={`${2 * Math.PI * 13}`}
                      strokeDashoffset={`${2 * Math.PI * 13 * (1 - skipCountdown / (adPlaying.skip_after_seconds || 5))}`}
                      strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.3s linear' }} />
                  </svg>
                  <span>{skipCountdown}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile progress bar at bottom */}
        <div className="sp-ad-mobile-bar">
          <div className="sp-ad-mobile-bar-fill" style={{ width: `${Math.min(adPct, 100)}%` }} />
        </div>

        <style>{`@keyframes adShimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }`}</style>
      </div>
    )
  }

  return (
    <>
    {/* ═══ EXPANDED MOBILE PLAYER ═══ */}
    {expanded && !currentTrack.isRadio && (
      <div className="xp-overlay" onClick={() => { setExpanded(false); setQueueOpen(false) }}
        style={{ opacity: dragY > 0 ? Math.max(0.15, 1 - dragY / 250) : undefined }}>
        <div className="xp-panel" ref={panelRef} onClick={e => e.stopPropagation()}
          style={{
            transform: dragY > 0 ? `translateY(${dragY}px) scale(${Math.max(0.95, 1 - dragY / 2000)})` : undefined,
            transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}>

          {/* Ambient background layers */}
          {currentTrack.cover_url && <>
            <div className="xp-bg-glow" style={{ backgroundImage: `url(${currentTrack.cover_url})` }} />
            <div className="xp-bg-glow xp-bg-glow-2" style={{ backgroundImage: `url(${currentTrack.cover_url})` }} />
          </>}
          <div className="xp-bg-grain" />

          {/* Top bar with drag handle + nav icons */}
          <div className="xp-top" onTouchStart={onPanelDragStart} onMouseDown={onPanelDragStart}>
            <div />
            <div className="xp-handle" />
            <button className="xp-top-btn xp-top-right"
              onClick={(e) => { e.stopPropagation(); setExpanded(false); setQueueOpen(false) }}>
              <ChevronDown size={15} />
              <span>Close</span>
            </button>
          </div>

          {/* Artwork with reflection */}
          <div className="xp-cover-wrap">
            <div className={`xp-cover${isPlaying ? ' xp-cover--playing' : ''}`}>
              {currentTrack.cover_url
                ? <img src={currentTrack.cover_url} alt="" />
                : <div className="xp-cover-placeholder"><Music size={52} strokeWidth={1.2} /></div>}
            </div>
          </div>

          {/* Track info + like */}
          <div className="xp-info">
            <div className="xp-info-row">
              <div className="xp-info-text">
                <h2 className="xp-title">{currentTrack.title}</h2>
                <p className="xp-artist" onClick={() => { setExpanded(false); navigate(`/users/${currentTrack.user?.id}`) }}>
                  {currentTrack.user?.name || 'Unknown'}
                </p>
              </div>
              <button className={`xp-like ${liked ? 'xp-like--active' : ''}`} onClick={handleLike}>
                <Heart size={24} fill={liked ? 'currentColor' : 'none'} strokeWidth={liked ? 0 : 1.4} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className={`xp-progress-wrap${scrubPct !== null ? ' xp-scrubbing' : ''}`}
            onTouchStart={onScrubStart} onMouseDown={onMouseScrubStart}>
            <div className="xp-progress-bar" ref={expandedProgressRef}
              onClick={handleExpandedProgressClick}>
              <div className="xp-progress-fill" style={{ width: `${pct}%`, transition: scrubPct !== null ? 'none' : undefined }}>
                <div className="xp-progress-thumb" />
              </div>
            </div>
            <div className="xp-progress-times">
              <span>{fmt(scrubTime !== null ? scrubTime : progress)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="xp-controls">
            <button className={`xp-ctrl ${shuffle ? 'xp-ctrl--active' : ''}`} onClick={toggleShuffle}>
              <Shuffle size={18} />
            </button>
            <button className="xp-ctrl xp-ctrl-skip" onClick={playPrevious}>
              <SkipBack size={24} />
            </button>
            <button className="xp-play" onClick={togglePlay}>
              {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
            </button>
            <button className="xp-ctrl xp-ctrl-skip" onClick={playNext}>
              <SkipForward size={24} />
            </button>
            <button className={`xp-ctrl ${repeat !== 'off' ? 'xp-ctrl--active' : ''}`} onClick={toggleRepeat}>
              {repeat === 'one' ? <Repeat1 size={18} /> : <RepeatIcon size={18} />}
            </button>
          </div>

          {/* Bottom actions */}
          <div className="xp-actions">
            <button className={`xp-action${queueOpen ? ' xp-action--active' : ''}`} onClick={() => setQueueOpen(o => !o)}>
              <ListIcon size={16} />
              <span>Queue</span>
            </button>
            <button className="xp-action" onClick={() => { setExpanded(false); navigate(`/tracks/${currentTrack.id}`) }}>
              <Maximize2 size={16} />
              <span>View Track</span>
            </button>
          </div>

          {/* Mobile Queue Sheet */}
          {queueOpen && (
            <div className="xp-queue-sheet" onClick={e => e.stopPropagation()}>
              <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
            </div>
          )}
        </div>
      </div>
    )}

    <div className="sp-player">
      {/* Left: Track Info */}
      <div className="sp-player-left" onClick={() => { if (justDismissedRef.current) return; if (window.innerWidth <= 768 && !currentTrack.isRadio) setExpanded(true) }}>
        <div className={`sp-player-artwork ${currentTrack.isRadio ? 'sp-player-artwork-radio' : ''}`}>
          {currentTrack.isRadio
            ? <i className="fas fa-broadcast-tower" style={{ fontSize: '1rem', color: 'var(--sp-gold)' }}></i>
            : currentTrack.cover_url
              ? <img src={currentTrack.cover_url} alt="" />
              : <i className="fas fa-music"></i>}
        </div>
        <div className="sp-player-track-info">
          <div className="sp-player-track-name-row">
            <div className="sp-player-track-name" style={{ cursor: currentTrack.isRadio ? 'default' : 'pointer' }}
              onClick={() => { if (justDismissedRef.current) return; !currentTrack.isRadio && navigate(`/tracks/${currentTrack.id}`) }}>
              {currentTrack.isRadio && isPlaying && (
                <span className="sp-radio-live-dot"/>
              )}
              {currentTrack.title}
            </div>
            {!currentTrack.isRadio && (
              <button className={`sp-player-like ${liked ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); handleLike(); }} title={liked ? 'Unlike' : 'Like'}>
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} strokeWidth={liked ? 0 : 1.8} />
              </button>
            )}
          </div>
          <div className="sp-player-track-artist" style={{ cursor: currentTrack.isRadio ? 'default' : 'pointer' }}
            onClick={() => !currentTrack.isRadio && navigate(`/users/${currentTrack.user?.id}`)}>
            {currentTrack.user?.name || "Unknown"}
          </div>
        </div>
      </div>

      {/* Mobile play controls */}
      <div className="sp-mobile-player-controls">
        {!currentTrack.isRadio && (
          <button onClick={playPrevious}><SkipBack size={20} /></button>
        )}
        <button className="sp-mobile-play-btn" onClick={togglePlay}>
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{marginLeft:2}} />}
        </button>
        {!currentTrack.isRadio && (
          <button onClick={playNext}><SkipForward size={20} /></button>
        )}
        <button
          className={`sp-mobile-queue-btn${queueOpen ? ' active' : ''}`}
          onClick={(e) => { e.stopPropagation(); setQueueOpen(o => !o) }}
        >
          <ListIcon size={18} />
        </button>
      </div>

      {/* Center: Controls */}
      <div className="sp-player-center">
        <div className="sp-player-controls">
          {!currentTrack.isRadio && (
            <button className={`sp-player-ctrl-btn ${shuffle ? "active" : ""}`} onClick={toggleShuffle}>
              <Shuffle size={16} />
            </button>
          )}
          {!currentTrack.isRadio && (
            <button className="sp-player-ctrl-btn" onClick={playPrevious}>
              <SkipBack size={18} />
            </button>
          )}
          <button className="sp-player-play-btn" onClick={togglePlay}>
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{marginLeft:2}} />}
          </button>
          {!currentTrack.isRadio && (
            <button className="sp-player-ctrl-btn" onClick={playNext}>
              <SkipForward size={18} />
            </button>
          )}
          {!currentTrack.isRadio && (
            <button className={`sp-player-ctrl-btn ${repeat !== "off" ? "active" : ""}`} onClick={toggleRepeat}>
              {repeat === "one" ? <Repeat1 size={16} /> : <RepeatIcon size={16} />}
            </button>
          )}
        </div>

        {currentTrack.isRadio ? (
          <div className="sp-radio-live-bar">
            <span className="sp-radio-live-badge">
              <span className="sp-radio-live-pulse"/>
              LIVE
            </span>
            <div className="sp-radio-wave-bars">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={`sp-radio-wave-bar ${isPlaying ? 'sp-radio-wave-bar-on' : ''}`}
                  style={{ animationDelay: `${(i * 0.07).toFixed(2)}s` }}/>
              ))}
            </div>
            <span className="sp-radio-freq-tag">{currentTrack.radioFreq} FM</span>
          </div>
        ) : (
          <div className="sp-player-progress">
            <span className="sp-player-time">{fmt(progress)}</span>
            <div className="sp-progress-bar" ref={progressRef} onClick={handleProgressClick}>
              <div className="sp-progress-fill" style={{ width: `${pct}%` }}>
                <div className="sp-progress-thumb"></div>
              </div>
            </div>
            <span className="sp-player-time">{fmt(duration)}</span>
          </div>
        )}
      </div>

      {/* Right: Volume & Extra */}
      <div className="sp-player-right">
        {!currentTrack.isRadio && (
          <button className="sp-player-ctrl-btn sp-expand-btn" onClick={() => {
            if (window.innerWidth <= 768) setExpanded(true)
            else navigate(`/tracks/${currentTrack.id}`)
          }}>
            <Maximize2 size={15} />
          </button>
        )}
        <button className={`sp-player-ctrl-btn${queueOpen ? ' active' : ''}`} onClick={() => setQueueOpen(o => !o)}>
          <ListIcon size={15} />
        </button>

        {/* Prayer time indicator */}
        {locationGranted && nextPrayer && (
          <div style={{ position: 'relative' }}
            onMouseEnter={() => setShowPrayerTooltip(true)}
            onMouseLeave={() => setShowPrayerTooltip(false)}
          >
            <button
              className={`sp-player-ctrl-btn ${prayerPauseEnabled ? 'active' : ''}`}
              onClick={togglePrayerPause}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', fontSize: '0.6rem', height: 'auto', padding: '4px 6px' }}
            >
              <i className="fas fa-mosque" style={{ fontSize: '0.85rem' }}></i>
              <span style={{ fontSize: '0.55rem', lineHeight: 1, opacity: 0.8 }}>{nextPrayer.countdown}</span>
            </button>
            {showPrayerTooltip && (
              <div style={{
                position: 'absolute',
                bottom: '120%',
                right: 0,
                background: 'rgba(30,50,44,0.92)',
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                border: 'none',
                borderRadius: '16px',
                padding: '14px 16px',
                minWidth: '200px',
                fontSize: '0.8rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.06)',
                zIndex: 100,
                whiteSpace: 'nowrap',
              }}>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--sp-teal)', fontSize: '0.82rem', letterSpacing: '-0.01em' }}>
                  <i className="fas fa-mosque" style={{ marginRight: '8px' }}></i>Prayer Times
                </div>
                <div style={{ marginBottom: '4px', opacity: 0.9, fontSize: '0.82rem' }}>
                  Next: <strong style={{ fontWeight: 600 }}>{nextPrayer.name}</strong> in {nextPrayer.countdown}
                  {nextPrayer.tomorrow && ' (tomorrow)'}
                </div>
                <div style={{ fontSize: '0.72rem', opacity: 0.5, marginBottom: '10px' }}>
                  Prayer time at {nextPrayer.time}
                </div>
                <div style={{
                  borderTop: '0.5px solid rgba(255,255,255,0.08)',
                  paddingTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>Auto-pause</span>
                  <div
                    onClick={togglePrayerPause}
                    style={{
                      width: '42px', height: '26px',
                      borderRadius: '13px',
                      background: prayerPauseEnabled ? 'var(--sp-green)' : 'rgba(142,142,147,0.3)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.3s cubic-bezier(0.2,0.8,0.2,1)',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: prayerPauseEnabled ? '18px' : '2px',
                      width: '22px', height: '22px',
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.3s cubic-bezier(0.2,0.8,0.2,1)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="sp-volume-control">
          <button className="sp-player-ctrl-btn" onClick={() => setVolume(volume > 0 ? 0 : 0.7)}>
            {volume > 0 ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          <div className="sp-volume-bar" ref={volumeRef} onClick={handleVolumeClick}>
            <div className="sp-volume-fill" style={{ width: `${volume * 100}%` }}></div>
          </div>
        </div>
      </div>
    </div>
    <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  )
}

// ─── Mobile Bottom Navigation ───
function MobileNav() {
  const location = useLocation()
  const isActive = (p) => location.pathname === p
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  return (
    <nav className="sp-mobile-nav">
      <Link to="/home" className={`sp-mobile-nav-item ${isActive('/home') ? 'active' : ''}`}>
        <HomeIcon size={20} strokeWidth={1.8} /><span>Home</span>
      </Link>
      <Link to="/radio" className={`sp-mobile-nav-item ${isActive('/radio') ? 'active' : ''}`}>
        <RadioIcon size={20} strokeWidth={1.8} /><span>Radio</span>
      </Link>
      <Link to="/search" className={`sp-mobile-nav-item ${isActive('/search') ? 'active' : ''}`}>
        <SearchIcon size={20} strokeWidth={1.8} /><span>Search</span>
      </Link>
      <Link to="/library" className={`sp-mobile-nav-item ${isActive('/library') ? 'active' : ''}`}>
        <LayoutGrid size={20} strokeWidth={1.8} /><span>Library</span>
      </Link>
      <Link to="/pricing" className={`sp-mobile-nav-item ${isActive('/pricing') ? 'active' : ''}`}>
        <Sparkles size={20} strokeWidth={1.8} /><span>Premium</span>
      </Link>
    </nav>
  )
}

// ─── App Content ───
function AppContent() {
  const location = useLocation()

  // Handle token from social OAuth redirect (works from any page)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    const error = params.get('error')
    if (error === 'account_banned') {
      toast.error('Your account has been suspended.')
      window.history.replaceState({}, '', location.pathname)
      return
    }
    if (error) {
      toast.error('Social login failed. Please try again.')
      window.history.replaceState({}, '', location.pathname)
      return
    }
    // Social login 2FA challenge
    const twoFaToken = params.get('two_fa_token')
    if (twoFaToken) {
      window.history.replaceState({}, '', location.pathname)
      // Use navigate with state — but we need the router, so use sessionStorage as a bridge
      sessionStorage.setItem('two_fa_token', twoFaToken)
      window.location.href = '/2fa'
      return
    }

    if (token) {
      localStorage.setItem('token', token)
      localStorage.removeItem('is_guest')
      window.history.replaceState({}, '', location.pathname)
      const require2faSetup = params.get('require_2fa_setup') === '1'
      api.getMe().then(res => {
        localStorage.setItem('user', JSON.stringify(res.user))
        const state = res.onboarding_state ?? 'completed'
        localStorage.setItem('onboarding_state', state)
        toast.success('Welcome!')
        if (state === 'not_started' || state === 'in_progress') {
          window.location.href = '/onboarding'
        } else if (require2faSetup) {
          window.location.href = '/setup-2fa'
        } else {
          window.location.href = '/home'
        }
      }).catch(() => {
        localStorage.removeItem('token')
        toast.error('Login failed. Please try again.')
      })
    }
  }, [])

  const isLoggedIn = !!localStorage.getItem("token")
  const isComingSoon = location.pathname === "/" && !isLoggedIn
  const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/2fa", "/setup-2fa"].includes(location.pathname)
  const isOnboarding = location.pathname === "/onboarding"
  const isAdmin = location.pathname.startsWith("/admin")
  const isArtistPortal = location.pathname.startsWith("/artist")

  // Redirect logged-in users from / to /home
  if (location.pathname === "/" && isLoggedIn) {
    return <Navigate to="/home" replace />
  }

  // Redirect to onboarding if not completed (for logged-in, non-guest users)
  const onboardingState = localStorage.getItem('onboarding_state')
  const isGuest = localStorage.getItem('is_guest') === 'true'
  if (isLoggedIn && !isGuest && !isOnboarding && !isAuthPage && !isAdmin && !isArtistPortal && !isComingSoon
      && (onboardingState === 'not_started' || onboardingState === 'in_progress')) {
    return <Navigate to="/onboarding" replace />
  }

  // Force 2FA setup for admins and verified artists who haven't enabled it
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const needs2faSetup = isLoggedIn && !isGuest && !isAuthPage && !isAdmin && !isArtistPortal
    && (storedUser.is_admin || storedUser.artist_verified_at || storedUser.plan_slug === 'artist_pro')
    && !storedUser.two_factor_confirmed_at
  if (needs2faSetup) {
    return <Navigate to="/setup-2fa" replace />
  }

  // Admin dashboard — standalone, outside app layout
  if (isAdmin) {
    return (
      <>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
        </Suspense>
        <Toaster position="bottom-center" toastOptions={{ style: { background: "rgba(20,20,30,0.95)", backdropFilter: "blur(20px)", color: "#fff", borderRadius: "12px", fontSize: "0.86rem", fontWeight: 500, border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" } }} />
      </>
    )
  }

  // Artist portal — standalone, outside app layout
  if (isArtistPortal) {
    return (
      <>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/artist/*" element={<ArtistPortal />} />
        </Routes>
        </Suspense>
        <Toaster position="bottom-center" toastOptions={{ style: { background: "rgba(20,20,30,0.95)", backdropFilter: "blur(20px)", color: "#fff", borderRadius: "12px", fontSize: "0.86rem", fontWeight: 500, border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" } }} />
      </>
    )
  }

  if (isComingSoon) {
    return (
      <div style={{ height: "100vh", overflow: "auto" }}>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<ComingSoon />} />
        </Routes>
        </Suspense>
        <Toaster position="bottom-center" toastOptions={{ style: { background: "rgba(30,50,44,0.88)", backdropFilter: "saturate(180%) blur(20px)", color: "#fff", borderRadius: "16px", fontSize: "0.86rem", fontWeight: 500, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" } }} />
      </div>
    )
  }

  if (isOnboarding) {
    return (
      <div style={{ height: "100vh", overflow: "auto" }}>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
        </Routes>
        </Suspense>
        <Toaster position="bottom-center" toastOptions={{ style: { background: "rgba(30,50,44,0.88)", backdropFilter: "saturate(180%) blur(20px)", color: "#fff", borderRadius: "16px", fontSize: "0.86rem", fontWeight: 500, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" } }} />
      </div>
    )
  }

  if (isAuthPage) {
    return (
      <div style={{ height: "100vh", overflow: "auto" }}>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/2fa" element={<TwoFactorChallenge />} />
          <Route path="/setup-2fa" element={<TwoFactorSetup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
        </Suspense>
        <Toaster position="bottom-center" toastOptions={{ style: { background: "rgba(30,50,44,0.88)", backdropFilter: "saturate(180%) blur(20px)", color: "#fff", borderRadius: "16px", fontSize: "0.86rem", fontWeight: 500, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" } }} />
      </div>
    )
  }

  return (
    <div className="app-navbar-layout">
      <Navbar />
      <main className="sp-main-full">
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/feed" element={<Navigate to="/search" replace />} />
          <Route path="/library" element={<Library />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/search" element={<Search />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/tracks/:id" element={<TrackDetail />} />
          <Route path="/users/:id" element={<UserProfile />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/profile/:id/followers" element={<FollowersList />} />
          <Route path="/profile/:id/following" element={<FollowersList />} />
          <Route path="/users/:id/followers" element={<FollowersList />} />
          <Route path="/users/:id/following" element={<FollowersList />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/playlists/:id" element={<PlaylistDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/my-tracks" element={<MyTracks />} />
          <Route path="/adhan" element={<AdhanTimes />} />
          <Route path="/radio" element={<Radio />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/promote" element={<PromoteTrack />} />
          <Route path="/promote/:trackId" element={<PromoteTrack />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        </Suspense>
      </main>
      <PlayerBar />
      <MobileNav />
      <PrayerAwarePlayback />
      <Toaster position="bottom-center" toastOptions={{ style: { background: "rgba(30,50,44,0.88)", backdropFilter: "saturate(180%) blur(20px)", color: "#fff", borderRadius: "16px", fontSize: "0.86rem", fontWeight: 500, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" } }} />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
