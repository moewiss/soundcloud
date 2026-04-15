import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ── Register Service Worker for offline audio caching ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('[SW] Registered:', reg.scope)
    }).catch((err) => {
      console.warn('[SW] Registration failed:', err)
    })
  })

  // Request persistent storage so browser doesn't evict cached audio
  if (navigator.storage?.persist) {
    navigator.storage.persist().then((granted) => {
      if (granted) console.log('[Storage] Persistent storage granted')
    })
  }
}

