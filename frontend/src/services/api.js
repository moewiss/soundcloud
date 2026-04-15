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
  login: async (data) => {
    const res = await axiosInstance.post('/login', data)
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
  
  // 2FA
  twoFactorSetup: async () => {
    const res = await axiosInstance.post('/2fa/setup')
    return res.data
  },
  twoFactorConfirm: async (code) => {
    const res = await axiosInstance.post('/2fa/confirm', { code })
    return res.data
  },
  twoFactorDisable: async (password) => {
    const res = await axiosInstance.post('/2fa/disable', { password })
    return res.data
  },
  twoFactorChallenge: async (data) => {
    const res = await axiosInstance.post('/2fa/challenge', data)
    return res.data
  },
  twoFactorRecoveryCodes: async (password) => {
    const res = await axiosInstance.post('/2fa/recovery-codes', { password })
    return res.data
  },

  getMe: async () => {
    const res = await axiosInstance.get('/me')
    return res.data
  },

  deleteAccount: async (password) => {
    const res = await axiosInstance.delete('/account', { data: { password } })
    return res.data
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const res = await axiosInstance.post('/user/change-password', {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    })
    return res.data
  },

  getNotificationPreferences: async () => {
    const res = await axiosInstance.get('/notification-preferences')
    return res.data
  },

  updateNotificationPreferences: async (prefs) => {
    const res = await axiosInstance.put('/notification-preferences', prefs)
    return res.data
  },

  guest: async () => {
    const res = await axiosInstance.post('/guest-login')
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
  
  verifyEmail: async ({ email, code }) => {
    const res = await axiosInstance.post('/verify-email', { email, code })
    return res.data
  },

  resendVerification: async (email) => {
    const res = await axiosInstance.post('/resend-verification', { email })
    return res.data
  },

  // Feed (personalized - tracks from followed artists)
  getFeed: async () => {
    const res = await axiosInstance.get('/feed')
    return res.data
  },

  // Tracks
  getTracks: async (params = {}) => {
    const res = await axiosInstance.get('/tracks', { params })
    return res.data
  },

  // Home page (single endpoint, AI-powered)
  getHomePage: async () => {
    const res = await axiosInstance.get('/home')
    return res.data
  },

  // Report listen progress
  reportListenProgress: async (trackId, durationListened) => {
    const res = await axiosInstance.post('/play-events/update', {
      track_id: trackId,
      duration_listened: durationListened,
    })
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

  importFromYoutube: async (data) => {
    const res = await axiosInstance.post('/tracks/import-youtube', data)
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

  getMyTracks: async () => {
    const res = await axiosInstance.get('/me/tracks')
    return res.data
  },

  // Users
  getUser: async (id) => {
    const res = await axiosInstance.get(`/users/${id}`)
    return res.data
  },
  
  getUserTracks: async (userId, opts = {}) => {
    const params = { user_id: userId }
    if (typeof opts === 'string') { params.sort = opts } // backward compat: getUserTracks(id, 'popular')
    else {
      if (opts.sort) params.sort = opts.sort
      if (opts.category && opts.category !== 'all') params.category = opts.category
      if (opts.page) params.page = opts.page
    }
    const res = await axiosInstance.get(`/tracks`, { params })
    if (typeof opts === 'string' || !opts.page) {
      // Flat array for simple calls
      if (Array.isArray(res.data)) return res.data
      return res.data.data || []
    }
    // Return full paginated response
    return {
      data: res.data.data || [],
      current_page: res.data.current_page || 1,
      last_page: res.data.last_page || 1,
      total: res.data.total || 0,
    }
  },
  
  updateUser: async (data) => {
    const res = await axiosInstance.put('/user', data, {
      headers: data instanceof FormData ? {
        'Content-Type': 'multipart/form-data'
      } : {}
    })
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
    // Handle paginated response
    if (res.data.data) {
      return res.data.data
    }
    return Array.isArray(res.data) ? res.data : []
  },

  getUserLikes: async (userId) => {
    const res = await axiosInstance.get(`/users/${userId}/likes`)
    // Handle paginated response
    if (res.data.data) {
      return res.data.data
    }
    return Array.isArray(res.data) ? res.data : []
  },

  // Comments
  getComments: async (trackId) => {
    const res = await axiosInstance.get(`/tracks/${trackId}/comments`)
    return res.data
  },
  
  addComment: async (trackId, body, parentId = null) => {
    const res = await axiosInstance.post(`/tracks/${trackId}/comments`, { 
      body,
      parent_id: parentId 
    })
    return res.data
  },

  updateComment: async (trackId, commentId, body) => {
    const res = await axiosInstance.put(`/tracks/${trackId}/comments/${commentId}`, { body })
    return res.data
  },
  
  deleteComment: async (trackId, commentId) => {
    const res = await axiosInstance.delete(`/tracks/${trackId}/comments/${commentId}`)
    return res.data
  },

  // Reposts
  toggleRepost: async (trackId) => {
    const res = await axiosInstance.post(`/tracks/${trackId}/repost`)
    return res.data
  },

  getRepostedTracks: async () => {
    const res = await axiosInstance.get('/user/reposts')
    // Handle paginated response
    if (res.data.data) {
      return res.data.data
    }
    return Array.isArray(res.data) ? res.data : []
  },

  getUserReposts: async (userId) => {
    const res = await axiosInstance.get(`/users/${userId}/reposts`)
    // Handle paginated response
    if (res.data.data) {
      return res.data.data
    }
    return Array.isArray(res.data) ? res.data : []
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
      const res = await axiosInstance.get(`/users/${userId}`)
      return { is_following: !!res.data.is_following }
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

  reorderPlaylistTracks: async (playlistId, trackIds) => {
    const res = await axiosInstance.put(`/playlists/${playlistId}/reorder`, { track_ids: trackIds })
    return res.data
  },

  togglePlaylistLike: async (playlistId) => {
    const res = await axiosInstance.post(`/playlists/${playlistId}/like`)
    return res.data
  },

  togglePlaylistRepost: async (playlistId) => {
    const res = await axiosInstance.post(`/playlists/${playlistId}/repost`)
    return res.data
  },

  // Search
  search: async (query, filter = 'everything', extraParams = {}) => {
    const res = await axiosInstance.get('/search', { params: { q: query, filter, ...extraParams } })
    return res.data
  },

  getSearchBrowse: async () => {
    const res = await axiosInstance.get('/search/browse')
    return res.data
  },

  getSearchSuggestions: async (q) => {
    const res = await axiosInstance.get('/search/suggestions', { params: { q } })
    return res.data
  },

  getAISearch: async (q) => {
    const res = await axiosInstance.get('/search/ai', { params: { q } })
    return res.data
  },

  clearSearchHistory: async () => {
    const res = await axiosInstance.delete('/search/history')
    return res.data
  },

  removeSearchHistoryItem: async (id) => {
    const res = await axiosInstance.delete(`/search/history/${id}`)
    return res.data
  },

  // Plans & Subscriptions
  getPlans: async () => {
    const res = await axiosInstance.get('/plans')
    return res.data
  },

  getSubscriptionStatus: async () => {
    const res = await axiosInstance.get('/subscription/status')
    return res.data
  },

  createCheckout: async (planSlug, billingCycle) => {
    const res = await axiosInstance.post('/subscription/checkout', { plan_slug: planSlug, billing_cycle: billingCycle })
    return res.data
  },

  cancelSubscription: async () => {
    const res = await axiosInstance.post('/subscription/cancel')
    return res.data
  },

  resumeSubscription: async () => {
    const res = await axiosInstance.post('/subscription/resume')
    return res.data
  },

  changePlan: async (planSlug, billingCycle) => {
    const res = await axiosInstance.post('/subscription/change-plan', { plan_slug: planSlug, billing_cycle: billingCycle })
    return res.data
  },

  getBillingHistory: async () => {
    const res = await axiosInstance.get('/subscription/billing-history')
    return res.data
  },

  // Downloads (offline caching)
  getDownloads: async () => {
    const res = await axiosInstance.get('/downloads')
    return res.data
  },

  saveForOffline: async (trackId) => {
    const res = await axiosInstance.post(`/tracks/${trackId}/download`)
    return res.data
  },

  removeDownload: async (trackId) => {
    const res = await axiosInstance.delete(`/tracks/${trackId}/download`)
    return res.data
  },

  getDownloadStatus: async (trackIds) => {
    const res = await axiosInstance.post('/downloads/status', { track_ids: trackIds })
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

  // Admin - User Management
  getAdminUsers: async (params) => {
    const res = await axiosInstance.get('/admin/users', { params })
    return res.data
  },
  
  updateAdminUser: async (userId, data) => {
    const res = await axiosInstance.put(`/admin/users/${userId}`, data)
    return res.data
  },
  
  deleteAdminUser: async (userId) => {
    const res = await axiosInstance.delete(`/admin/users/${userId}`)
    return res.data
  },
  
  banUser: async (userId) => {
    const res = await axiosInstance.post(`/admin/users/${userId}/ban`)
    return res.data
  },
  
  restoreUser: async (userId) => {
    const res = await axiosInstance.post(`/admin/users/${userId}/restore`)
    return res.data
  },
  
  resetUserPassword: async (userId, data) => {
    const res = await axiosInstance.post(`/admin/users/${userId}/reset-password`, data)
    return res.data
  },
  
  promoteToAdmin: async (email) => {
    const res = await axiosInstance.post('/admin/users/promote', { email })
    return res.data
  },
  
  // Admin - Statistics & Activity
  getAdminStats: async () => {
    const res = await axiosInstance.get('/admin/stats')
    return res.data
  },
  
  getAdminActivity: async () => {
    const res = await axiosInstance.get('/admin/activity')
    return res.data
  },
  
  // Admin - Track Management
  getAdminTracks: async (params) => {
    const res = await axiosInstance.get('/admin/tracks', { params })
    return res.data
  },
  
  getPendingTracks: async () => {
    const res = await axiosInstance.get('/admin/tracks/pending')
    return res.data
  },
  
  approveTrack: async (trackId) => {
    const res = await axiosInstance.patch(`/admin/tracks/${trackId}/approve`)
    return res.data
  },
  
  rejectTrack: async (trackId) => {
    const res = await axiosInstance.patch(`/admin/tracks/${trackId}/reject`)
    return res.data
  },

  adminDeleteTrack: async (trackId) => {
    const res = await axiosInstance.delete(`/admin/tracks/${trackId}`)
    return res.data
  },
  
  // Admin - Content Moderation
  getAdminComments: async (params) => {
    const res = await axiosInstance.get('/admin/comments', { params })
    return res.data
  },
  
  deleteAdminComment: async (commentId) => {
    const res = await axiosInstance.delete(`/admin/comments/${commentId}`)
    return res.data
  },

  getActiveUsers: async () => {
    const res = await axiosInstance.get('/admin/active-users')
    return res.data
  },

  // ── Ads ──

  getAudioAd: async () => {
    const res = await axiosInstance.get('/ads/audio')
    return res.data
  },

  getBannerAds: async (placement) => {
    const res = await axiosInstance.get('/ads/banner', { params: { placement } })
    return res.data
  },

  getSponsoredTracks: async () => {
    const res = await axiosInstance.get('/ads/sponsored-tracks')
    return res.data
  },

  recordAdImpression: async (adId, eventType) => {
    const res = await axiosInstance.post('/ads/impression', { ad_id: adId, event_type: eventType })
    return res.data
  },

  // Admin Ads
  getAdDashboard: async () => {
    const res = await axiosInstance.get('/admin/ads/dashboard')
    return res.data
  },

  getAdvertisers: async (params) => {
    const res = await axiosInstance.get('/admin/ads/advertisers', { params })
    return res.data
  },

  createAdvertiser: async (data) => {
    const res = await axiosInstance.post('/admin/ads/advertisers', data)
    return res.data
  },

  updateAdvertiser: async (id, data) => {
    const res = await axiosInstance.put(`/admin/ads/advertisers/${id}`, data)
    return res.data
  },

  deleteAdvertiser: async (id) => {
    const res = await axiosInstance.delete(`/admin/ads/advertisers/${id}`)
    return res.data
  },

  getAdCampaigns: async (params) => {
    const res = await axiosInstance.get('/admin/ads/campaigns', { params })
    return res.data
  },

  createAdCampaign: async (data) => {
    const res = await axiosInstance.post('/admin/ads/campaigns', data)
    return res.data
  },

  updateAdCampaign: async (id, data) => {
    const res = await axiosInstance.put(`/admin/ads/campaigns/${id}`, data)
    return res.data
  },

  deleteAdCampaign: async (id) => {
    const res = await axiosInstance.delete(`/admin/ads/campaigns/${id}`)
    return res.data
  },

  getAdCreatives: async (params) => {
    const res = await axiosInstance.get('/admin/ads/creatives', { params })
    return res.data
  },

  createAdCreative: async (data) => {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v != null && v !== '') fd.append(k, v) })
    const res = await axiosInstance.post('/admin/ads/creatives', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data
  },

  updateAdCreative: async (id, data) => {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v != null && v !== '') fd.append(k, v) })
    fd.append('_method', 'PUT')
    const res = await axiosInstance.post(`/admin/ads/creatives/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data
  },

  deleteAdCreative: async (id) => {
    const res = await axiosInstance.delete(`/admin/ads/creatives/${id}`)
    return res.data
  },

  // ── Track Promotions (Artist self-service) ──

  getPromotions: async () => {
    const res = await axiosInstance.get('/promotions')
    return res.data
  },

  getPromotionPricing: async () => {
    const res = await axiosInstance.get('/promotions/pricing')
    return res.data
  },

  promoteTrack: async (data) => {
    const res = await axiosInstance.post('/promotions/promote', data)
    return res.data
  },

  cancelPromotion: async (id) => {
    const res = await axiosInstance.post(`/promotions/${id}/cancel`)
    return res.data
  },

  // ── Admin Extended ──

  getAdminAnalytics: async () => {
    const res = await axiosInstance.get('/admin/analytics')
    return res.data
  },

  // Playlists
  getAdminPlaylists: async (params) => {
    const res = await axiosInstance.get('/admin/playlists', { params })
    return res.data
  },
  updateAdminPlaylist: async (id, data) => {
    const res = await axiosInstance.put(`/admin/playlists/${id}`, data)
    return res.data
  },
  deleteAdminPlaylist: async (id) => {
    const res = await axiosInstance.delete(`/admin/playlists/${id}`)
    return res.data
  },

  // Track editing & bulk
  adminUpdateTrack: async (id, data) => {
    const res = await axiosInstance.put(`/admin/tracks/${id}/edit`, data)
    return res.data
  },
  adminBulkTrackAction: async (ids, action) => {
    const res = await axiosInstance.post('/admin/tracks/bulk', { ids, action })
    return res.data
  },

  // Likes, Reposts, Follows
  getAdminLikes: async (params) => {
    const res = await axiosInstance.get('/admin/likes', { params })
    return res.data
  },
  removeAdminLike: async (userId, trackId) => {
    const res = await axiosInstance.delete('/admin/likes', { data: { user_id: userId, track_id: trackId } })
    return res.data
  },
  getAdminReposts: async (params) => {
    const res = await axiosInstance.get('/admin/reposts', { params })
    return res.data
  },
  removeAdminRepost: async (userId, trackId) => {
    const res = await axiosInstance.delete('/admin/reposts', { data: { user_id: userId, track_id: trackId } })
    return res.data
  },
  getAdminFollows: async (params) => {
    const res = await axiosInstance.get('/admin/follows', { params })
    return res.data
  },

  // Subscriptions
  getAdminSubscriptions: async () => {
    const res = await axiosInstance.get('/admin/subscriptions')
    return res.data
  },
  updateUserPlan: async (userId, planSlug) => {
    const res = await axiosInstance.put(`/admin/users/${userId}/plan`, { plan_slug: planSlug })
    return res.data
  },

  // Artist verification
  verifyArtist: async (userId) => {
    const res = await axiosInstance.post(`/admin/users/${userId}/verify-artist`)
    return res.data
  },
  unverifyArtist: async (userId) => {
    const res = await axiosInstance.post(`/admin/users/${userId}/unverify-artist`)
    return res.data
  },

  // Announcements
  getAdminAnnouncements: async () => {
    const res = await axiosInstance.get('/admin/announcements')
    return res.data
  },
  createAnnouncement: async (data) => {
    const res = await axiosInstance.post('/admin/announcements', data)
    return res.data
  },
  updateAnnouncement: async (id, data) => {
    const res = await axiosInstance.put(`/admin/announcements/${id}`, data)
    return res.data
  },
  deleteAnnouncement: async (id) => {
    const res = await axiosInstance.delete(`/admin/announcements/${id}`)
    return res.data
  },

  // Audit Logs
  getAuditLogs: async (params) => {
    const res = await axiosInstance.get('/admin/audit-logs', { params })
    return res.data
  },

  // Site Settings
  getAdminSettings: async () => {
    const res = await axiosInstance.get('/admin/settings')
    return res.data
  },
  updateAdminSettings: async (settings) => {
    const res = await axiosInstance.put('/admin/settings', { settings })
    return res.data
  },

  // Public announcements
  getAnnouncements: async () => {
    const res = await axiosInstance.get('/announcements')
    return res.data
  },

  // ── Onboarding ──

  getOnboardingState: async () => {
    const res = await axiosInstance.get('/onboarding/state')
    return res.data
  },

  saveOnboardingStep: async (step, data) => {
    const res = await axiosInstance.post('/onboarding/step', { step, ...data })
    return res.data
  },

  getCandidateArtists: async () => {
    const res = await axiosInstance.get('/onboarding/candidate-artists')
    return res.data
  },

  completeOnboarding: async () => {
    const res = await axiosInstance.post('/onboarding/complete')
    return res.data
  },

  skipOnboarding: async () => {
    const res = await axiosInstance.post('/onboarding/skip')
    return res.data
  },

  // ── User Preferences (Settings) ──

  getUserPreferences: async () => {
    const res = await axiosInstance.get('/onboarding/state')
    return res.data
  },

  updateUserPreferences: async (data) => {
    const res = await axiosInstance.post('/onboarding/step', data)
    return res.data
  }
}

export default api

