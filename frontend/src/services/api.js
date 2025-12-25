import axios from 'axios'

// Determine API URL based on environment
// In Docker, the proxy should forward /api to the Laravel backend
// If proxy doesn't work, fallback to direct backend URL
const getApiUrl = () => {
  // If environment variable is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // In production or when proxy is configured, use relative path
  // The vite proxy will forward /api to http://app:8000/api
  return '/api'
}

const API_URL = getApiUrl()

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
})

// Add auth token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await axiosInstance.post('/login', { email, password })
    return res.data
  },
  
  register: async (data) => {
    const res = await axiosInstance.post('/register', data)
    return res.data
  },
  
  logout: async () => {
    const res = await axiosInstance.post('/logout')
    return res.data
  },
  
  guestLogin: async () => {
    const res = await axiosInstance.post('/guest-login')
    return res.data
  },
  
  forgotPassword: async (email) => {
    const res = await axiosInstance.post('/forgot-password', { email })
    return res.data
  },
  
  resetPassword: async (data) => {
    const res = await axiosInstance.post('/reset-password', data)
    return res.data
  },
  
  verifyEmail: async (token) => {
    const res = await axiosInstance.get(`/verify-email/${token}`)
    return res.data
  },

  // Tracks
  getTracks: async (params = {}) => {
    const res = await axiosInstance.get('/tracks', { params })
    return res.data
  },
  
  getTrack: async (id) => {
    const res = await axiosInstance.get(`/tracks/${id}`)
    return res.data
  },
  
  uploadTrack: async (formData) => {
    const res = await axiosInstance.post('/tracks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data
  },
  
  updateTrack: async (id, data) => {
    const res = await axiosInstance.put(`/tracks/${id}`, data)
    return res.data
  },
  
  deleteTrack: async (id) => {
    const res = await axiosInstance.delete(`/tracks/${id}`)
    return res.data
  },

  // Users
  getUser: async (id) => {
    const res = await axiosInstance.get(`/users/${id}`)
    return res.data
  },
  
  getUserTracks: async (userId) => {
    // Get tracks filtered by user_id
    const res = await axiosInstance.get(`/tracks`, { params: { user_id: userId } })
    // Handle both array and paginated responses
    if (Array.isArray(res.data)) {
      return res.data
    }
    return res.data.data || []
  },
  
  updateUser: async (data) => {
    const res = await axiosInstance.put('/user', data)
    return res.data
  },
  
  getUsers: async () => {
    const res = await axiosInstance.get('/users')
    return res.data
  },

  // Likes
  toggleLike: async (trackId) => {
    const res = await axiosInstance.post(`/tracks/${trackId}/like`)
    return res.data
  },
  
  getLikedTracks: async () => {
    const res = await axiosInstance.get('/user/likes')
    return res.data
  },

  // Comments
  getComments: async (trackId) => {
    const res = await axiosInstance.get(`/tracks/${trackId}/comments`)
    return res.data
  },
  
  addComment: async (trackId, body) => {
    const res = await axiosInstance.post(`/tracks/${trackId}/comments`, { body })
    return res.data
  },
  
  deleteComment: async (trackId, commentId) => {
    const res = await axiosInstance.delete(`/tracks/${trackId}/comments/${commentId}`)
    return res.data
  },

  // Follows
  toggleFollow: async (userId) => {
    const res = await axiosInstance.post(`/users/${userId}/follow`)
    return res.data
  },
  
  follow: async (userId) => {
    const res = await axiosInstance.post(`/users/${userId}/follow`)
    return res.data
  },
  
  unfollow: async (userId) => {
    const res = await axiosInstance.delete(`/users/${userId}/follow`)
    return res.data
  },
  
  checkFollowing: async (userId) => {
    try {
      const res = await axiosInstance.get(`/users/${userId}/is-following`)
      return res.data
    } catch (e) {
      return { is_following: false }
    }
  },
  
  getFollowers: async (userId) => {
    const res = await axiosInstance.get(`/users/${userId}/followers`)
    return res.data
  },
  
  getFollowing: async (userId) => {
    const res = await axiosInstance.get(`/users/${userId}/following`)
    return res.data
  },
  
  getMyFollowing: async () => {
    const res = await axiosInstance.get('/user/following')
    return res.data
  },

  // Playlists
  getPlaylists: async () => {
    const res = await axiosInstance.get('/playlists')
    return res.data
  },
  
  getUserPlaylists: async (userId) => {
    const res = await axiosInstance.get(`/users/${userId}/playlists`)
    return res.data
  },
  
  getPlaylist: async (id) => {
    const res = await axiosInstance.get(`/playlists/${id}`)
    return res.data
  },
  
  createPlaylist: async (data) => {
    const res = await axiosInstance.post('/playlists', data)
    return res.data
  },
  
  updatePlaylist: async (id, data) => {
    const res = await axiosInstance.put(`/playlists/${id}`, data)
    return res.data
  },
  
  deletePlaylist: async (id) => {
    const res = await axiosInstance.delete(`/playlists/${id}`)
    return res.data
  },
  
  addToPlaylist: async (playlistId, trackId) => {
    const res = await axiosInstance.post(`/playlists/${playlistId}/tracks`, { track_id: trackId })
    return res.data
  },
  
  removeFromPlaylist: async (playlistId, trackId) => {
    const res = await axiosInstance.delete(`/playlists/${playlistId}/tracks/${trackId}`)
    return res.data
  },

  // Search
  search: async (query, filter = 'everything') => {
    const res = await axiosInstance.get('/search', { params: { q: query, filter } })
    return res.data
  },

  // History
  addToHistory: async (trackId) => {
    const res = await axiosInstance.post('/history', { track_id: trackId })
    return res.data
  },
  
  getRecentHistory: async () => {
    const res = await axiosInstance.get('/history')
    return res.data
  },
  
  clearHistory: async () => {
    const res = await axiosInstance.delete('/history')
    return res.data
  },

  // Notifications
  getNotifications: async () => {
    const res = await axiosInstance.get('/notifications')
    return res.data
  },
  
  markNotificationRead: async (id) => {
    const res = await axiosInstance.post(`/notifications/${id}/read`)
    return res.data
  },
  
  markAllNotificationsRead: async () => {
    const res = await axiosInstance.post('/notifications/read-all')
    return res.data
  },

  // Admin
  getAdminStats: async () => {
    const res = await axiosInstance.get('/admin/stats')
    return res.data
  },
  
  getAdminUsers: async () => {
    const res = await axiosInstance.get('/admin/users')
    return res.data
  },
  
  getAdminTracks: async () => {
    const res = await axiosInstance.get('/admin/tracks')
    return res.data
  }
}

export default api

