import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(query)
  const [activeFilter, setActiveFilter] = useState('all')
  const [results, setResults] = useState({ tracks: [], users: [], playlists: [] })
  const [allTracks, setAllTracks] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [likedTracks, setLikedTracks] = useState(new Set())
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const navigate = useNavigate()

  const filters = [
    { id: 'all', label: 'Everything', icon: 'fa-globe' },
    { id: 'tracks', label: 'Tracks', icon: 'fa-music' },
    { id: 'users', label: 'People', icon: 'fa-users' },
    { id: 'playlists', label: 'Playlists', icon: 'fa-list' }
  ]

  // Load all tracks on mount
  useEffect(() => {
    loadAllTracks()
  }, [])

  // Real-time search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery)
      if (searchQuery.trim()) {
        setSearchParams({ q: searchQuery })
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery, allTracks, allUsers])

  const loadAllTracks = async () => {
    setLoading(true)
    try {
      const data = await api.getTracks()
      // Handle different response formats
      const tracks = Array.isArray(data) ? data : (data?.data || data?.tracks || [])
      console.log('Loaded tracks:', tracks.length)
      setAllTracks(tracks)
      
      // Extract unique users from tracks
      const usersMap = new Map()
      tracks.forEach(track => {
        if (track.user && track.user.id) {
          usersMap.set(track.user.id, track.user)
        }
      })
      const users = Array.from(usersMap.values())
      setAllUsers(users)
      
      // Show all tracks initially
      setResults({ tracks, users: [], playlists: [] })
    } catch (error) {
      console.error('Error loading tracks:', error)
      setAllTracks([])
      setResults({ tracks: [], users: [], playlists: [] })
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async (q) => {
    if (!q.trim()) {
      setResults({ tracks: allTracks, users: [], playlists: [] })
      setHasSearched(false)
      return
    }
    
    setHasSearched(true)
    
    const searchLower = q.toLowerCase()
    
    // Local filtering for tracks
    const filteredTracks = allTracks.filter(track => 
      track.title?.toLowerCase().includes(searchLower) ||
      track.user?.name?.toLowerCase().includes(searchLower) ||
      track.category?.toLowerCase().includes(searchLower) ||
      track.description?.toLowerCase().includes(searchLower)
    )
    
    // Local filtering for users/people
    const filteredUsers = allUsers.filter(user => 
      user.name?.toLowerCase().includes(searchLower)
    )
    
    setResults({ tracks: filteredTracks, users: filteredUsers, playlists: [] })
    
    // Also try API search for more results
    try {
      const data = await api.search(q, activeFilter)
      if (data.users?.length > 0) {
        // Merge API users with local users
        const apiUsers = data.users || []
        const mergedUsers = [...filteredUsers]
        apiUsers.forEach(u => {
          if (!mergedUsers.find(mu => mu.id === u.id)) {
            mergedUsers.push(u)
          }
        })
        setResults(prev => ({ ...prev, users: mergedUsers }))
      }
      if (data.playlists?.length > 0) {
        setResults(prev => ({ ...prev, playlists: data.playlists }))
      }
    } catch (error) {
      console.log('API search unavailable, using local results')
    }
  }

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId)
  }

  const handlePlay = (track) => {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      playTrack(track)
    }
  }

  const handleLike = async (trackId, e) => {
    e.stopPropagation()
    try {
      const result = await api.toggleLike(trackId)
      
      // Update liked state
      setLikedTracks(prev => {
        const newSet = new Set(prev)
        if (newSet.has(trackId)) {
          newSet.delete(trackId)
        } else {
          newSet.add(trackId)
        }
        return newSet
      })
      
      // Update track in results
      setResults(prev => ({
        ...prev,
        tracks: prev.tracks.map(t => 
          t.id === trackId 
            ? { 
                ...t, 
                is_liked: !t.is_liked,
                likes_count: t.is_liked ? Math.max(0, (t.likes_count || 1) - 1) : (t.likes_count || 0) + 1
              }
            : t
        )
      }))
      
      // Also update allTracks
      setAllTracks(prev => prev.map(t => 
        t.id === trackId 
          ? { 
              ...t, 
              is_liked: !t.is_liked,
              likes_count: t.is_liked ? Math.max(0, (t.likes_count || 1) - 1) : (t.likes_count || 0) + 1
            }
          : t
      ))
      
      toast.success(likedTracks.has(trackId) ? 'Removed from likes' : 'Added to likes')
    } catch (error) {
      toast.error('Please login to like tracks')
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchParams({})
    setResults({ tracks: allTracks, users: [], playlists: [] })
    setHasSearched(false)
  }

  const getCounts = () => {
    return {
      all: (results.tracks?.length || 0) + (results.users?.length || 0) + (results.playlists?.length || 0),
      tracks: results.tracks?.length || 0,
      users: results.users?.length || 0,
      playlists: results.playlists?.length || 0
    }
  }

  const counts = getCounts()

  const getFilteredResults = () => {
    switch (activeFilter) {
      case 'tracks':
        return { tracks: results.tracks || [], users: [], playlists: [] }
      case 'users':
        return { tracks: [], users: results.users || [], playlists: [] }
      case 'playlists':
        return { tracks: [], users: [], playlists: results.playlists || [] }
      default:
        return results
    }
  }

  const filteredResults = getFilteredResults()

  return (
    <div className="page">
      {/* Search Header */}
      <div className="search-header-box">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for artists, tracks, playlists..."
            autoFocus
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={clearSearch}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="search-filters">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
            >
              <i className={`fas ${filter.icon}`}></i>
              {filter.label}
              {hasSearched && counts[filter.id] > 0 && (
                <span className="filter-count">{counts[filter.id]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results Info */}
      {hasSearched && searchQuery && (
        <div className="search-results-info">
          {loading ? (
            <span><i className="fas fa-spinner fa-spin"></i> Searching...</span>
          ) : (
            <span>
              Found <strong>{counts.all}</strong> results for "<strong>{searchQuery}</strong>"
            </span>
          )}
        </div>
      )}

      {loading && !hasSearched ? (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading tracks...</p>
        </div>
      ) : (
        <>
          {/* Tracks Results */}
          {(activeFilter === 'all' || activeFilter === 'tracks') && filteredResults.tracks?.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">
                  <i className="fas fa-music"></i>
                  Tracks
                </h2>
                <span className="section-count">{filteredResults.tracks.length} results</span>
              </div>

              <div className="track-grid">
                {filteredResults.tracks.map(track => (
                  <div 
                    key={track.id} 
                    className="track-card"
                    onClick={() => navigate(`/tracks/${track.id}`)}
                  >
                    <div className="track-artwork">
                      {track.cover_url ? (
                        <img src={track.cover_url} alt={track.title} />
                      ) : (
                        <i className="fas fa-music"></i>
                      )}
                      <button 
                        className="track-play-btn"
                        onClick={(e) => { e.stopPropagation(); handlePlay(track); }}
                      >
                        <i className={`fas fa-${currentTrack?.id === track.id && isPlaying ? 'pause' : 'play'}`}></i>
                      </button>
                      {/* Like button on hover */}
                      <button 
                        className={`track-like-btn ${track.is_liked || likedTracks.has(track.id) ? 'active' : ''}`}
                        onClick={(e) => handleLike(track.id, e)}
                      >
                        <i className="fas fa-heart"></i>
                      </button>
                    </div>
                    <div className="track-info">
                      <div className="track-title">{track.title}</div>
                      <div className="track-artist">{track.user?.name}</div>
                      {track.category && (
                        <span className="track-category">{track.category}</span>
                      )}
                      <div className="track-stats">
                        <span><i className="fas fa-play"></i> {track.plays_count || 0}</span>
                        <button 
                          className={`like-stat-btn ${track.is_liked || likedTracks.has(track.id) ? 'active' : ''}`}
                          onClick={(e) => handleLike(track.id, e)}
                        >
                          <i className="fas fa-heart"></i> {track.likes_count || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Results */}
          {(activeFilter === 'all' || activeFilter === 'users') && filteredResults.users?.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">
                  <i className="fas fa-users"></i>
                  Artists
                </h2>
                <span className="section-count">{filteredResults.users.length} results</span>
              </div>

              <div className="users-grid">
                {filteredResults.users.map(user => (
                  <div 
                    key={user.id} 
                    className="user-card"
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    <div className="user-avatar-large">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <h3>{user.name}</h3>
                    <p>{user.tracks_count || 0} tracks · {user.followers_count || 0} followers</p>
                    <button className="btn-follow">
                      <i className="fas fa-user-plus"></i> Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && hasSearched && counts.all === 0 && (
            <div className="empty-state">
              <i className="fas fa-search"></i>
              <h3>No results found</h3>
              <p>Try different keywords or browse all tracks</p>
              <button className="btn btn-primary" onClick={clearSearch}>
                <i className="fas fa-th"></i> Browse All
              </button>
            </div>
          )}

          {!hasSearched && !loading && filteredResults.tracks?.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-search"></i>
              <h3>Start searching</h3>
              <p>Type something to find tracks, artists, and playlists</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
