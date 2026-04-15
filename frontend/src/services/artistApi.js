import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const ax = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

ax.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

ax.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(err)
  }
)

const artistApi = {
  // Dashboard
  getDashboard: async () => {
    const res = await ax.get('/artist/dashboard')
    return res.data
  },

  // Analytics
  getAnalytics: async (period = '30d') => {
    const res = await ax.get('/artist/analytics', { params: { period } })
    return res.data
  },

  // Audience
  getAudience: async (period = '30d') => {
    const res = await ax.get('/artist/audience', { params: { period } })
    return res.data
  },

  // Profile
  getProfile: async () => {
    const res = await ax.get('/artist/profile')
    return res.data
  },
  updateProfile: async (data) => {
    if (data instanceof FormData) {
      data.append('_method', 'PUT')
      const res = await ax.post('/artist/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    }
    const res = await ax.put('/artist/profile', data)
    return res.data
  },
  getProfilePreview: async () => {
    const res = await ax.get('/artist/profile/preview')
    return res.data
  },

  // Content
  getTracks: async (params = {}) => {
    const res = await ax.get('/artist/tracks', { params })
    return res.data
  },
  uploadTrack: async (formData) => {
    const res = await ax.post('/artist/tracks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
  updateTrack: async (id, data) => {
    if (data instanceof FormData) {
      data.append('_method', 'PUT')
      const res = await ax.post(`/artist/tracks/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    }
    const res = await ax.put(`/artist/tracks/${id}`, data)
    return res.data
  },

  // Onboarding
  getOnboardingState: async () => {
    const res = await ax.get('/artist/onboarding/state')
    return res.data
  },
  submitCompliance: async (data) => {
    const res = await ax.post('/artist/onboarding/compliance', data)
    return res.data
  },
  saveProfileBasics: async (data) => {
    const res = await ax.post('/artist/onboarding/profile-basics', data)
    return res.data
  },
  skipStripe: async () => {
    const res = await ax.post('/artist/onboarding/skip-stripe')
    return res.data
  },
  completeOnboarding: async () => {
    const res = await ax.post('/artist/onboarding/complete')
    return res.data
  },
}

export default artistApi
