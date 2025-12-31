import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom"
import { Toaster, toast } from "react-hot-toast"
import { useState, useEffect, useRef } from "react"
import { PlayerProvider, usePlayer } from "./context/PlayerContext"
import { api } from "./services/api"

// Pages
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
import Admin from "./pages/Admin"

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState({ tracks: [], users: [] })
  const [allTracks, setAllTracks] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef(null)
  const searchRef = useRef(null)
  const { playTrack } = usePlayer()

  // Load all tracks and users on mount for instant local search
  useEffect(() => {
    const loadData = async () => {
      try {
        const tracksData = await api.getTracks()
        // Handle different response formats
        const tracks = Array.isArray(tracksData) ? tracksData : (tracksData?.data || tracksData?.tracks || [])
        setAllTracks(tracks)
        
        // Extract unique users from tracks
        const usersMap = new Map()
        tracks.forEach(track => {
          if (track.user && track.user.id) {
            usersMap.set(track.user.id, track.user)
          }
        })
        setAllUsers(Array.from(usersMap.values()))
      } catch (e) {
        console.error('Failed to load data:', e)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      fetchNotifications()
    }

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false)
        setShowNotifications(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [location])

  const fetchNotifications = async () => {
    if (!localStorage.getItem('token')) {
      return // Don't fetch if not logged in
    }
    
    try {
      const data = await api.getNotifications()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      // Don't crash the app, just log the error
    }
  }

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await api.markNotificationRead(notification.id)
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }

    // Navigate based on notification type
    if (notification.track_id) {
      navigate(`/tracks/${notification.track_id}`)
    } else if (notification.type === 'follow') {
      navigate(`/users/${notification.actor_id}`)
    }
    setShowNotifications(false)
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return 'fa-heart'
      case 'comment': return 'fa-comment'
      case 'comment_reply': return 'fa-reply'
      case 'follow': return 'fa-user-plus'
      case 'repost': return 'fa-retweet'
      default: return 'fa-bell'
    }
  }

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // Real-time search - starts with 1 character
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setSearchLoading(true)
        setShowSearchDropdown(true)
        
        const q = searchQuery.toLowerCase()
        
        // Local filtering for tracks
        const filteredTracks = allTracks.filter(t => 
          t.title?.toLowerCase().includes(q) ||
          t.user?.name?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
        )
        
        // Local filtering for users/artists
        const filteredUsers = allUsers.filter(u => 
          u.name?.toLowerCase().includes(q)
        )
        
        setSearchResults({
          tracks: filteredTracks.slice(0, 5),
          users: filteredUsers.slice(0, 5)
        })
        setSearchLoading(false)
        
        // Also try API search for more results
        try {
          const data = await api.search(searchQuery)
          if (data.tracks?.length > 0 || data.users?.length > 0) {
            setSearchResults({
              tracks: data.tracks?.slice(0, 5) || filteredTracks.slice(0, 5),
              users: data.users?.slice(0, 5) || filteredUsers.slice(0, 5)
            })
          }
        } catch (error) {
          console.log('API search unavailable, using local results')
        }
      } else {
        setSearchResults({ tracks: [], users: [] })
        setShowSearchDropdown(false)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [searchQuery, allTracks, allUsers])

  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 1 && (searchResults.tracks?.length > 0 || searchResults.users?.length > 0)) {
      setShowSearchDropdown(true)
    }
  }

  const handleTrackClick = (track) => {
    setShowSearchDropdown(false)
    setSearchQuery("")
    navigate(`/tracks/${track.id}`)
  }

  const handleUserClick = (user) => {
    setShowSearchDropdown(false)
    setSearchQuery("")
    navigate(`/users/${user.id}`)
  }

  const handlePlayTrack = (track, e) => {
    e.stopPropagation()
    playTrack(track)
    toast.success(`Playing: ${track.title}`)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setShowSearchDropdown(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    toast.success("Logged out!")
    navigate("/")
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="sc-header">
      <div className="header-content">
        <div className="header-left">
          <Link to="/" className="header-logo">
            <i className="fas fa-headphones"></i>
            <span>AudioCloud</span>
          </Link>

          <nav className="header-nav">
            <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
              Home
            </Link>
            <Link to="/feed" className={`nav-link ${isActive("/feed") ? "active" : ""}`}>
              Feed
            </Link>
            <Link to="/library" className={`nav-link ${isActive("/library") ? "active" : ""}`}>
              Library
            </Link>
          </nav>
        </div>

        <div className="header-center" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="header-search">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search for artists, tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              className="search-input"
            />
            {searchLoading && (
              <i className="fas fa-spinner fa-spin" style={{
                position: 'absolute',
                right: '12px',
                color: 'var(--primary)'
              }}></i>
            )}
          </form>

          {showSearchDropdown && (
            <div className="search-dropdown">
              {(searchResults.tracks?.length > 0 || searchResults.users?.length > 0) ? (
                <>
                  {/* Tracks Section */}
                  {searchResults.tracks?.length > 0 && (
                    <div className="search-dropdown-section">
                      <div className="search-dropdown-header">
                        <i className="fas fa-music"></i> Tracks
                      </div>
                      {searchResults.tracks.map((track, index) => (
                        <div 
                          key={`track-${track.id}-${index}`}
                          className="search-result-item"
                          onClick={() => handleTrackClick(track)}
                        >
                          <div className="search-result-artwork">
                            {track.cover_url ? (
                              <img src={track.cover_url} alt="" />
                            ) : (
                              <i className="fas fa-music"></i>
                            )}
                            <button 
                              className="search-result-play"
                              onClick={(e) => handlePlayTrack(track, e)}
                            >
                              <i className="fas fa-play"></i>
                            </button>
                          </div>
                          <div className="search-result-info">
                            <span className="search-result-title">{track.title}</span>
                            <span className="search-result-subtitle">
                              <i className="fas fa-user"></i> {track.user?.name || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* People Section */}
                  {searchResults.users?.length > 0 && (
                    <div className="search-dropdown-section">
                      <div className="search-dropdown-header">
                        <i className="fas fa-users"></i> People
                      </div>
                      {searchResults.users.map((artist, index) => (
                        <div 
                          key={`user-${artist.id}-${index}`}
                          className="search-result-item"
                          onClick={() => handleUserClick(artist)}
                        >
                          <div className="search-result-avatar">
                            {artist.name?.charAt(0) || 'U'}
                          </div>
                          <div className="search-result-info">
                            <span className="search-result-title">{artist.name}</span>
                            <span className="search-result-subtitle">
                              <i className="fas fa-user"></i> Artist
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div 
                    className="search-result-item search-see-all"
                    onClick={() => {
                      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
                      setShowSearchDropdown(false)
                    }}
                  >
                    <i className="fas fa-search"></i>
                    <span>See all results for "{searchQuery}"</span>
                  </div>
                </>
              ) : (
                <div className="search-no-results">
                  <i className="fas fa-search"></i>
                  <span>No results found for "{searchQuery}"</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="header-right" ref={menuRef}>
          {user ? (
            <>
              <Link to="/upload" className="btn-upload">
                Upload
              </Link>

              <div className="header-icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </div>

              <Link to="/messages" className="header-icon-btn">
                <i className="fas fa-envelope"></i>
              </Link>

              <div 
                className="header-user"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  {user.name?.charAt(0) || "U"}
                </div>
                <span className="user-name">{user.name?.split(" ")[0]}</span>
                <i className={`fas fa-chevron-${showUserMenu ? "up" : "down"}`}></i>
              </div>

              {showUserMenu && (
                <div className="dropdown-menu">
                  <Link to={`/users/${user.id}`} className="dropdown-item">
                    <i className="fas fa-user"></i> Profile
                  </Link>
                  <Link to="/library" className="dropdown-item">
                    <i className="fas fa-list"></i> Library
                  </Link>
                  <Link to="/playlists" className="dropdown-item">
                    <i className="fas fa-folder"></i> Playlists
                  </Link>
                  <Link to="/notifications" className="dropdown-item">
                    <i className="fas fa-bell"></i> Notifications
                  </Link>
                  {user.is_admin && (
                    <>
                      <div className="dropdown-divider"></div>
                      <Link to="/admin" className="dropdown-item" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                        <i className="fas fa-shield-halved"></i> Admin Dashboard
                      </Link>
                    </>
                  )}
                  <div className="dropdown-divider"></div>
                  <Link to="/settings" className="dropdown-item">
                    <i className="fas fa-cog"></i> Settings
                  </Link>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Sign out
                  </button>
                </div>
              )}

              {showNotifications && (
                <div className="dropdown-menu notifications-dropdown">
                  <div className="dropdown-header">
                    <span>Notifications</span>
                    <Link to="/notifications">See all</Link>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 5).map(notification => (
                      <div 
                        key={notification.id}
                        className="notification-item"
                        onClick={() => handleNotificationClick(notification)}
                        style={{ 
                          cursor: 'pointer',
                          background: notification.read ? 'transparent' : 'var(--primary-soft)',
                          opacity: notification.read ? 0.7 : 1
                        }}
                      >
                        <div className={`notification-icon ${notification.type}`}>
                          <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                        </div>
                        <div className="notification-content">
                          <span dangerouslySetInnerHTML={{ __html: notification.message.replace(notification.actor?.name || '', `<strong>${notification.actor?.name || 'Someone'}</strong>`) }}></span>
                          <span className="notification-time">{formatTimeAgo(notification.created_at)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="btn-signin">
                Sign in
              </Link>
              <Link to="/register" className="btn-signup">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function PlayerBar() {
  const { 
    currentTrack, 
    isPlaying, 
    progress, 
    duration,
    volume,
    togglePlay, 
    seek, 
    setVolume,
    playNext,
    playPrevious
  } = usePlayer()
  
  const [showVolume, setShowVolume] = useState(false)
  const progressRef = useRef(null)

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return "0:00"
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const handleProgressClick = (e) => {
    if (!progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    seek(percent * duration)
  }

  if (!currentTrack) return null

  const progressPercent = duration ? (progress / duration) * 100 : 0

  return (
    <div className="player-bar">
      <div className="player-content">
        <div 
          className="player-progress-container"
          ref={progressRef}
          onClick={handleProgressClick}
        >
          <div className="player-progress">
            <div 
              className="player-progress-fill" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="player-controls">
          <div className="player-track-info">
            <div className="player-artwork">
              {currentTrack.cover_url ? (
                <img src={currentTrack.cover_url} alt={currentTrack.title} />
              ) : (
                <i className="fas fa-music"></i>
              )}
            </div>
            <div className="player-track-details">
              <span className="player-track-artist">{currentTrack.user?.name || "Unknown"}</span>
              <span className="player-track-title">{currentTrack.title}</span>
            </div>
            <button className="player-like-btn">
              <i className="fas fa-heart"></i>
            </button>
          </div>

          <div className="player-main-controls">
            <button className="player-btn" onClick={playPrevious}>
              <i className="fas fa-step-backward"></i>
            </button>
            <button className="player-btn play-btn" onClick={togglePlay}>
              <i className={`fas fa-${isPlaying ? "pause" : "play"}`}></i>
            </button>
            <button className="player-btn" onClick={playNext}>
              <i className="fas fa-step-forward"></i>
            </button>
            <button className="player-btn">
              <i className="fas fa-random"></i>
            </button>
            <button className="player-btn">
              <i className="fas fa-redo"></i>
            </button>
          </div>

          <div className="player-right-controls">
            <span className="player-time">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
            
            <div 
              className="volume-control"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button className="player-btn">
                <i className={`fas fa-volume-${volume > 0.5 ? "up" : volume > 0 ? "down" : "mute"}`}></i>
              </button>
              {showVolume && (
                <div className="volume-slider">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                  />
                </div>
              )}
            </div>

            <button className="player-btn">
              <i className="fas fa-list"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
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
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </main>
      <PlayerBar />
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: "var(--bg-dark)",
            color: "var(--text-white)",
          }
        }}
      />
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
