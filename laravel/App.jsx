import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom"
import { Toaster, toast } from "react-hot-toast"
import { useState, useEffect, useRef } from "react"
import { PlayerProvider, usePlayer } from "./context/PlayerContext"
import { api } from "./services/api"

import Home from "./pages/Home"
import Feed from "./pages/Feed"
import Library from "./pages/Library"
import Search from "./pages/Search"
import Upload from "./pages/Upload"
import TrackDetail from "./pages/TrackDetail"
import UserProfile from "./pages/UserProfile"
import FollowersList from "./pages/FollowersList"
import Playlists from "./pages/Playlists"
import PlaylistDetail from "./pages/PlaylistDetail"
import Settings from "./pages/Settings"
import Notifications from "./pages/Notifications"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import VerifyEmail from "./pages/VerifyEmail"
import AdminPanel from "./pages/AdminPanel"
import MyTracks from "./pages/MyTracks"

// ─── Sidebar ───
function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [playlists, setPlaylists] = useState([])
  const [likedCount, setLikedCount] = useState(0)
  const user = JSON.parse(localStorage.getItem("user") || "null")

  useEffect(() => {
    if (user && localStorage.getItem("token")) {
      api.getPlaylists().then(d => setPlaylists(Array.isArray(d) ? d : d?.data || [])).catch(() => {})
      api.getLikedTracks().then(d => setLikedCount(Array.isArray(d) ? d.length : 0)).catch(() => {})
    }
  }, [location.pathname])

  const isActive = (p) => location.pathname === p

  return (
    <aside className="sp-sidebar">
      <div className="sp-sidebar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        <i className="fas fa-compact-disc"></i>
        <span>Halal Spotify</span>
      </div>

      <nav className="sp-sidebar-nav">
        <Link to="/" className={`sp-nav-item ${isActive("/") ? "active" : ""}`}>
          <i className="fas fa-home"></i> Home
        </Link>
        <Link to="/search" className={`sp-nav-item ${isActive("/search") ? "active" : ""}`}>
          <i className="fas fa-search"></i> Search
        </Link>
        <Link to="/feed" className={`sp-nav-item ${isActive("/feed") ? "active" : ""}`}>
          <i className="fas fa-podcast"></i> Feed
        </Link>
        {user && (
          <Link to="/my-tracks" className={`sp-nav-item ${isActive("/my-tracks") ? "active" : ""}`}>
            <i className="fas fa-music"></i> My Tracks
          </Link>
        )}
      </nav>

      <div className="sp-sidebar-library">
        <div className="sp-library-header">
          <div className="sp-library-header-left" onClick={() => navigate("/library")}>
            <i className="fas fa-books"></i> Your Library
          </div>
          {user && (
            <button className="sp-library-add" onClick={() => navigate("/playlists")} title="Create playlist">
              <i className="fas fa-plus"></i>
            </button>
          )}
        </div>

        <div className="sp-library-list">
          {/* Liked Songs */}
          <div className="sp-library-item" onClick={() => navigate("/library?tab=likes")}>
            <div className="sp-library-item-img" style={{ background: "linear-gradient(135deg, #450af5, #c4efd9)" }}>
              <i className="fas fa-heart" style={{ color: "#fff", fontSize: "1rem" }}></i>
            </div>
            <div className="sp-library-item-info">
              <div className="sp-library-item-name">Liked Songs</div>
              <div className="sp-library-item-meta">Playlist · {likedCount} songs</div>
            </div>
          </div>

          {/* User playlists */}
          {playlists.map(pl => (
            <div key={pl.id} className="sp-library-item" onClick={() => navigate(`/playlists/${pl.id}`)}>
              <div className="sp-library-item-img">
                {pl.cover_url ? <img src={pl.cover_url} alt="" /> : <i className="fas fa-music"></i>}
              </div>
              <div className="sp-library-item-info">
                <div className="sp-library-item-name">{pl.name}</div>
                <div className="sp-library-item-meta">Playlist · {pl.tracks_count || 0} songs</div>
              </div>
            </div>
          ))}

          {!user && (
            <div style={{ padding: "16px", textAlign: "center" }}>
              <p style={{ color: "var(--sp-text-sub)", fontSize: "0.85rem", marginBottom: "16px" }}>
                Log in to create playlists and save your favorites
              </p>
              <button className="sp-btn sp-btn-outline" onClick={() => navigate("/login")} style={{ width: "100%" }}>
                Log in
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

// ─── Top Bar ───
function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState({ tracks: [], users: [] })
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDuration, setFilterDuration] = useState('all')
  const [filterSort, setFilterSort] = useState('default')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingTracksCount, setPendingTracksCount] = useState(0)
  const menuRef = useRef(null)
  const searchRef = useRef(null)
  const { playTrack } = usePlayer()

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      setUser(JSON.parse(stored))
      fetchNotifications()
      fetchPendingCount()
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
      if (searchRef.current && !searchRef.current.contains(e.target)) {
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

  // Search
  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSearchResults({ tracks: [], users: [] })
      setShowSearchDropdown(false)
      return
    }
    const t = setTimeout(async () => {
      setShowSearchDropdown(true)
      try {
        const data = await api.search(searchQuery)
        setSearchResults({
          tracks: (data.tracks || []).slice(0, 5),
          users: (data.users || []).slice(0, 3)
        })
      } catch {}
    }, 200)
    return () => clearTimeout(t)
  }, [searchQuery])

  const buildSearchUrl = (q) => {
    const params = new URLSearchParams({ q })
    if (filterCategory !== 'all') params.set('category', filterCategory)
    if (filterDuration !== 'all') params.set('duration', filterDuration)
    if (filterSort !== 'default') params.set('sort', filterSort)
    return `/search?${params.toString()}`
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(buildSearchUrl(searchQuery))
      setShowSearchDropdown(false)
      setSearchFocused(false)
      setSearchQuery("")
    }
  }

  const applyDropdownFilters = (tracks) => {
    let t = [...tracks]
    if (filterCategory !== 'all') t = t.filter(x => x.category === filterCategory)
    if (filterDuration === 'short') t = t.filter(x => (x.duration || 0) < 300)
    else if (filterDuration === 'medium') t = t.filter(x => (x.duration || 0) >= 300 && (x.duration || 0) <= 1800)
    else if (filterDuration === 'long') t = t.filter(x => (x.duration || 0) > 1800)
    if (filterSort === 'most_played') t = t.sort((a, b) => (b.plays || 0) - (a.plays || 0))
    else if (filterSort === 'newest') t = t.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return t
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

  return (
    <div className="sp-topbar">
      <div className="sp-topbar-left">
        <button className="sp-topbar-nav-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <button className="sp-topbar-nav-btn" onClick={() => navigate(1)}>
          <i className="fas fa-chevron-right"></i>
        </button>

        {/* Search */}
        <div className="sp-topbar-search" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="What do you want to listen to?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { setSearchFocused(true); setShowSearchDropdown(true) }}
            />
            <i className="fas fa-search"></i>
          </form>

          {(showSearchDropdown || searchFocused) && (
            <div className="sp-search-dropdown">
              {/* Filters */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--sp-text-muted)', width: '54px' }}>Category</span>
                  {['all', 'Quran', 'Nasheeds', 'Lectures', 'Duas', 'Podcasts', 'Education'].map(c => (
                    <button key={c} onClick={() => setFilterCategory(c)} style={{
                      padding: '2px 10px', borderRadius: '500px', fontSize: '0.72rem', cursor: 'pointer', border: 'none',
                      background: filterCategory === c ? 'var(--sp-white)' : 'rgba(255,255,255,0.1)',
                      color: filterCategory === c ? 'var(--sp-black)' : 'var(--sp-white)',
                    }}>{c === 'all' ? 'All' : c}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--sp-text-muted)', width: '54px' }}>Duration</span>
                  {[['all','Any'],['short','< 5m'],['medium','5–30m'],['long','> 30m']].map(([v,l]) => (
                    <button key={v} onClick={() => setFilterDuration(v)} style={{
                      padding: '2px 10px', borderRadius: '500px', fontSize: '0.72rem', cursor: 'pointer', border: 'none',
                      background: filterDuration === v ? 'var(--sp-white)' : 'rgba(255,255,255,0.1)',
                      color: filterDuration === v ? 'var(--sp-black)' : 'var(--sp-white)',
                    }}>{l}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--sp-text-muted)', width: '54px' }}>Sort</span>
                  {[['default','Relevant'],['newest','Newest'],['most_played','Most Played']].map(([v,l]) => (
                    <button key={v} onClick={() => setFilterSort(v)} style={{
                      padding: '2px 10px', borderRadius: '500px', fontSize: '0.72rem', cursor: 'pointer', border: 'none',
                      background: filterSort === v ? 'var(--sp-white)' : 'rgba(255,255,255,0.1)',
                      color: filterSort === v ? 'var(--sp-black)' : 'var(--sp-white)',
                    }}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Results */}
              {(() => {
                const displayTracks = applyDropdownFilters(searchResults.tracks)
                return (
                  <>
                    {displayTracks.length > 0 && (
                      <>
                        <div className="sp-search-section-title">Songs</div>
                        {displayTracks.map(track => (
                          <div key={track.id} className="sp-search-item" onClick={() => { navigate(`/tracks/${track.id}`); setShowSearchDropdown(false); setSearchFocused(false); setSearchQuery(""); }}>
                            <div className="sp-search-item-img">
                              {track.cover_url ? <img src={track.cover_url} alt="" /> : <i className="fas fa-music"></i>}
                              <button className="sp-search-item-play" onClick={(e) => { e.stopPropagation(); playTrack(track); }}>
                                <i className="fas fa-play" style={{ fontSize: "0.7rem" }}></i>
                              </button>
                            </div>
                            <div className="sp-search-item-info">
                              <div className="sp-search-item-title">{track.title}</div>
                              <div className="sp-search-item-sub">Song · {track.user?.name || "Unknown"}</div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {searchResults.users.length > 0 && (
                      <>
                        <div className="sp-search-section-title">Artists</div>
                        {searchResults.users.map(u => (
                          <div key={u.id} className="sp-search-item" onClick={() => { navigate(`/users/${u.id}`); setShowSearchDropdown(false); setSearchFocused(false); setSearchQuery(""); }}>
                            <div className="sp-search-item-img round">
                              {u.avatar_url ? <img src={u.avatar_url} alt="" /> : <span style={{ fontWeight: 700 }}>{u.name?.charAt(0)}</span>}
                            </div>
                            <div className="sp-search-item-info">
                              <div className="sp-search-item-title">{u.name}</div>
                              <div className="sp-search-item-sub">Artist</div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {searchQuery && displayTracks.length === 0 && searchResults.users.length === 0 && (
                      <div style={{ padding: "16px", textAlign: "center", color: "var(--sp-text-muted)", fontSize: '0.85rem' }}>
                        No results for "{searchQuery}"
                      </div>
                    )}
                    {searchQuery && (displayTracks.length > 0 || searchResults.users.length > 0) && (
                      <div className="sp-search-see-all" onClick={() => { navigate(buildSearchUrl(searchQuery)); setShowSearchDropdown(false); setSearchFocused(false); setSearchQuery(""); }}>
                        <i className="fas fa-search"></i> See all results for "{searchQuery}"
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>
      </div>

      <div className="sp-topbar-right" ref={menuRef}>
        {user ? (
          <>
            {user.is_admin && (
              <Link to="/admin" className="sp-btn sp-btn-ghost" style={{ fontSize: "0.8rem", position: "relative" }}>
                <i className="fas fa-shield-halved"></i> Admin
                {pendingTracksCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    background: "#ef4444",
                    color: "white",
                    borderRadius: "50%",
                    fontSize: "11px",
                    fontWeight: "700",
                    minWidth: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    lineHeight: 1
                  }}>
                    {pendingTracksCount}
                  </span>
                )}
              </Link>
            )}
            <Link to="/upload" className="sp-btn sp-btn-ghost" style={{ fontSize: "0.8rem" }}>
              <i className="fas fa-upload"></i>
            </Link>

            <div style={{ position: "relative" }}>
              <button className="sp-icon-btn" onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }}>
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && <span className="sp-notification-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="sp-dropdown sp-notifications-dropdown">
                  <div className="sp-dropdown-header">
                    <span>Notifications</span>
                    <Link to="/notifications" onClick={() => setShowNotifications(false)}>See all</Link>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "var(--sp-text-muted)" }}>No notifications</div>
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

            <div style={{ position: "relative" }}>
              <button className="sp-user-btn" onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}>
                <div className="sp-user-avatar">{user.name?.charAt(0) || "U"}</div>
                {user.name?.split(" ")[0]}
                <i className="fas fa-caret-down" style={{ fontSize: "0.7rem", marginLeft: 2 }}></i>
              </button>

              {showUserMenu && (
                <div className="sp-dropdown">
                  <Link to={`/users/${user.id}`} className="sp-dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="fas fa-user"></i> Profile
                  </Link>
                  <Link to="/settings" className="sp-dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="fas fa-cog"></i> Settings
                  </Link>
                  <div className="sp-dropdown-divider" />
                  <button className="sp-dropdown-item" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/register" className="sp-auth-btn signup">Sign up</Link>
            <Link to="/login" className="sp-auth-btn login">Log in</Link>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Player Bar ───
function PlayerBar() {
  const {
    currentTrack, isPlaying, progress, duration, volume,
    shuffle, repeat,
    togglePlay, seek, setVolume, playNext, playPrevious,
    toggleShuffle, toggleRepeat
  } = usePlayer()
  const [liked, setLiked] = useState(false)
  const progressRef = useRef(null)
  const volumeRef = useRef(null)
  const navigate = useNavigate()

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
      <span style={{ color: "var(--sp-text-muted)", fontSize: "0.85rem" }}>Select a track to start listening</span>
    </div>
  )

  const pct = duration ? (progress / duration) * 100 : 0

  return (
    <div className="sp-player">
      {/* Left: Track Info */}
      <div className="sp-player-left">
        <div className="sp-player-artwork">
          {currentTrack.cover_url ? <img src={currentTrack.cover_url} alt="" /> : <i className="fas fa-music"></i>}
        </div>
        <div className="sp-player-track-info">
          <div className="sp-player-track-name" onClick={() => navigate(`/tracks/${currentTrack.id}`)}>
            {currentTrack.title}
          </div>
          <div className="sp-player-track-artist" onClick={() => navigate(`/users/${currentTrack.user?.id}`)}>
            {currentTrack.user?.name || "Unknown"}
          </div>
        </div>
        <button className={`sp-player-like ${liked ? "active" : ""}`} onClick={handleLike}>
          <i className={`${liked ? "fas" : "far"} fa-heart`}></i>
        </button>
      </div>

      {/* Center: Controls */}
      <div className="sp-player-center">
        <div className="sp-player-controls">
          <button className={`sp-player-ctrl-btn ${shuffle ? "active" : ""}`} onClick={toggleShuffle}>
            <i className="fas fa-shuffle"></i>
          </button>
          <button className="sp-player-ctrl-btn" onClick={playPrevious}>
            <i className="fas fa-backward-step"></i>
          </button>
          <button className="sp-player-play-btn" onClick={togglePlay}>
            <i className={`fas fa-${isPlaying ? "pause" : "play"}`} style={!isPlaying ? { marginLeft: 2 } : {}}></i>
          </button>
          <button className="sp-player-ctrl-btn" onClick={playNext}>
            <i className="fas fa-forward-step"></i>
          </button>
          <button className={`sp-player-ctrl-btn ${repeat !== "off" ? "active" : ""}`} onClick={toggleRepeat}>
            <i className={`fas fa-${repeat === "one" ? "repeat-1" : "repeat"}`}></i>
          </button>
        </div>

        <div className="sp-player-progress">
          <span className="sp-player-time">{fmt(progress)}</span>
          <div className="sp-progress-bar" ref={progressRef} onClick={handleProgressClick}>
            <div className="sp-progress-fill" style={{ width: `${pct}%` }}>
              <div className="sp-progress-thumb"></div>
            </div>
          </div>
          <span className="sp-player-time">{fmt(duration)}</span>
        </div>
      </div>

      {/* Right: Volume & Extra */}
      <div className="sp-player-right">
        <button className="sp-player-ctrl-btn" onClick={() => navigate(`/tracks/${currentTrack.id}`)}>
          <i className="fas fa-up-right-and-down-left-from-center"></i>
        </button>
        <button className="sp-player-ctrl-btn" onClick={() => navigate("/library?tab=history")}>
          <i className="fas fa-list"></i>
        </button>
        <div className="sp-volume-control">
          <button className="sp-player-ctrl-btn" onClick={() => setVolume(volume > 0 ? 0 : 0.7)}>
            <i className={`fas fa-volume-${volume > 0.5 ? "high" : volume > 0 ? "low" : "xmark"}`}></i>
          </button>
          <div className="sp-volume-bar" ref={volumeRef} onClick={handleVolumeClick}>
            <div className="sp-volume-fill" style={{ width: `${volume * 100}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── App Content ───
function AppContent() {
  const location = useLocation()
  const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password"].includes(location.pathname) || location.pathname.startsWith("/verify-email")

  if (isAuthPage) {
    return (
      <div style={{ height: "100vh", overflow: "auto" }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
        </Routes>
        <Toaster position="bottom-center" toastOptions={{ style: { background: "var(--sp-bg-highlight)", color: "var(--sp-white)", borderRadius: "8px" } }} />
      </div>
    )
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="sp-main">
        <TopBar />
        <div className="sp-main-inner">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/library" element={<Library />} />
            <Route path="/search" element={<Search />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/tracks/:id" element={<TrackDetail />} />
            <Route path="/users/:id" element={<UserProfile />} />
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="/profile/:id/followers" element={<FollowersList />} />
            <Route path="/profile/:id/following" element={<FollowersList />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlists/:id" element={<PlaylistDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/my-tracks" element={<MyTracks />} />
          </Routes>
        </div>
      </div>
      <PlayerBar />
      <Toaster position="bottom-center" toastOptions={{ style: { background: "var(--sp-bg-highlight)", color: "var(--sp-white)", borderRadius: "8px" } }} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </BrowserRouter>
  )
}
