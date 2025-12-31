import { toast } from 'react-hot-toast'

/**
 * Check if user is authenticated and redirect to login if not
 * @param {Function} navigate - React Router navigate function
 * @param {string} message - Optional custom message to show
 * @returns {boolean} - true if authenticated, false otherwise
 */
export const requireAuth = (navigate, message = 'Please login to continue') => {
  const token = localStorage.getItem('token')
  
  if (!token) {
    toast.error(message)
    // Save current location to redirect back after login
    const currentPath = window.location.pathname
    localStorage.setItem('redirectAfterLogin', currentPath)
    navigate('/login')
    return false
  }
  
  return true
}

/**
 * Check if user is authenticated (without redirect)
 * @returns {boolean} - true if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

/**
 * Get current user
 * @returns {object|null} - User object or null
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * Check if current user is admin
 * @returns {boolean} - true if admin, false otherwise
 */
export const isAdmin = () => {
  const user = getCurrentUser()
  return user?.is_admin === true
}

