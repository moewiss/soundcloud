/**
 * Nashidify Offline Cache Service (Spotify-style)
 *
 * Uses:
 *  - Service Worker + Cache API for audio/media files (persistent, survives restarts)
 *  - IndexedDB for track metadata only (lightweight)
 *  - navigator.storage.persist() to prevent browser from evicting cache
 *
 * The SW handles the heavy lifting (fetch + stream + store).
 * This module is the app-side interface that talks to the SW via postMessage.
 */

const DB_NAME = 'nashidify_offline'
const DB_VERSION = 2
const META_STORE = 'track_meta'

// ──────────────────────────────────────────────────
//  IndexedDB — metadata only
// ──────────────────────────────────────────────────
let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      // Clean up legacy blob stores from v1
      if (db.objectStoreNames.contains('audio_blobs')) db.deleteObjectStore('audio_blobs')
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => { dbPromise = null; reject(req.error) }
  })
  return dbPromise
}

async function metaPut(track) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite')
    tx.objectStore(META_STORE).put(track)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

async function metaDelete(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite')
    tx.objectStore(META_STORE).delete(id)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

async function metaGetAll() {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction(META_STORE, 'readonly')
    const req = tx.objectStore(META_STORE).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => resolve([])
  })
}

async function metaGet(id) {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction(META_STORE, 'readonly')
    const req = tx.objectStore(META_STORE).get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => resolve(null)
  })
}

async function metaClear() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite')
    tx.objectStore(META_STORE).clear()
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

// ──────────────────────────────────────────────────
//  Service Worker communication
// ──────────────────────────────────────────────────
function getSW() {
  return navigator.serviceWorker?.controller || null
}

function postToSW(type, payload) {
  const sw = getSW()
  if (sw) sw.postMessage({ type, payload })
}

/**
 * Send a message to SW and wait for a specific reply type.
 */
function askSW(type, payload, replyType, timeout = 10000) {
  return new Promise((resolve) => {
    const sw = getSW()
    if (!sw) return resolve(null)

    const timer = setTimeout(() => { cleanup(); resolve(null) }, timeout)

    function handler(event) {
      if (event.data?.type === replyType &&
          (payload?.trackId === undefined || event.data.trackId === payload.trackId)) {
        cleanup()
        resolve(event.data)
      }
    }
    function cleanup() {
      clearTimeout(timer)
      navigator.serviceWorker.removeEventListener('message', handler)
    }

    navigator.serviceWorker.addEventListener('message', handler)
    sw.postMessage({ type, payload })
  })
}

// ──────────────────────────────────────────────────
//  Public API
// ──────────────────────────────────────────────────

/**
 * Request persistent storage so the browser won't evict our cache.
 */
export async function requestPersistentStorage() {
  if (navigator.storage?.persist) {
    const granted = await navigator.storage.persist()
    return granted
  }
  return false
}

/**
 * Cache a track for offline playback.
 * Delegates heavy work to the Service Worker.
 */
export async function cacheTrack(track, onProgress) {
  if (!track?.audio_url) throw new Error('No audio URL to cache')

  // Save metadata to IndexedDB immediately
  await metaPut({
    id: track.id,
    title: track.title,
    duration_seconds: track.duration_seconds,
    category: track.category,
    plays: track.plays_count || track.plays || 0,
    audio_url: track.audio_url,
    cover_url: track.cover_url || null,
    user: track.user ? {
      id: track.user.id,
      name: track.user.display_name || track.user.name,
      avatar_url: track.user.avatar_url,
    } : null,
    cachedAt: Date.now(),
    size: 0, // updated when SW reports back
  })

  // Ask SW to download and cache the audio
  const sw = getSW()
  if (!sw) {
    // No SW — fallback to direct Cache API from main thread
    return fallbackCacheTrack(track, onProgress)
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error('Cache timeout')) }, 120000)

    function handler(event) {
      const d = event.data
      if (d?.trackId !== track.id) return

      if (d.type === 'CACHE_PROGRESS' && onProgress) {
        onProgress(d.progress)
      }
      if (d.type === 'CACHE_COMPLETE') {
        // Update metadata with real size
        metaPut({ ...(metaGet(track.id) || {}), id: track.id, size: d.size }).catch(() => {})
        cleanup()
        resolve(true)
      }
      if (d.type === 'CACHE_ERROR') {
        metaDelete(track.id).catch(() => {})
        cleanup()
        reject(new Error(d.error))
      }
    }
    function cleanup() {
      clearTimeout(timer)
      navigator.serviceWorker.removeEventListener('message', handler)
    }

    navigator.serviceWorker.addEventListener('message', handler)
    sw.postMessage({
      type: 'CACHE_AUDIO',
      payload: {
        audioUrl: track.audio_url,
        coverUrl: track.cover_url || null,
        trackId: track.id,
      },
    })
  })
}

/**
 * Fallback: cache track from main thread when SW is not available.
 */
async function fallbackCacheTrack(track, onProgress) {
  const cache = await caches.open('nashidify-audio-v1')
  const response = await fetch(track.audio_url)
  if (!response.ok) throw new Error('Fetch failed')

  const total = parseInt(response.headers.get('content-length') || '0')
  let loaded = 0
  const reader = response.body.getReader()
  const chunks = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    if (onProgress && total > 0) onProgress(Math.round((loaded / total) * 100))
  }

  const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'audio/mpeg' })
  await cache.put(new Request(track.audio_url), new Response(blob, {
    headers: { 'Content-Type': blob.type, 'Content-Length': String(blob.size) },
  }))

  // Cache cover too
  if (track.cover_url) {
    try {
      const mediaCache = await caches.open('nashidify-media-v1')
      const coverRes = await fetch(track.cover_url)
      if (coverRes.ok) await mediaCache.put(new Request(track.cover_url), coverRes)
    } catch {}
  }

  return true
}

/**
 * Get the (possibly cached) audio URL for a track.
 * If SW is active, the SW will intercept the fetch and serve from cache.
 * So we just return the original URL — the SW handles the rest.
 */
export async function getCachedAudioUrl(trackId) {
  const meta = await metaGet(trackId)
  if (!meta?.audio_url) return null

  // Verify it's actually in the cache
  try {
    const cache = await caches.open('nashidify-audio-v1')
    const match = await cache.match(new Request(meta.audio_url))
    if (match) return meta.audio_url // SW will intercept and serve from cache
  } catch {}

  return null
}

/**
 * Check if a track is cached.
 */
export async function isTrackCached(trackId) {
  const meta = await metaGet(trackId)
  if (!meta?.audio_url) return false
  try {
    const cache = await caches.open('nashidify-audio-v1')
    const match = await cache.match(new Request(meta.audio_url))
    return !!match
  } catch {
    return false
  }
}

/**
 * Remove a track from cache.
 */
export async function removeCachedTrack(trackId) {
  const meta = await metaGet(trackId)

  // Remove from Cache API
  if (meta?.audio_url) {
    try {
      const cache = await caches.open('nashidify-audio-v1')
      await cache.delete(new Request(meta.audio_url))
    } catch {}
  }
  if (meta?.cover_url) {
    try {
      const cache = await caches.open('nashidify-media-v1')
      await cache.delete(new Request(meta.cover_url))
    } catch {}
  }

  // Also tell SW to clean up
  postToSW('REMOVE_AUDIO', {
    audioUrl: meta?.audio_url,
    coverUrl: meta?.cover_url,
  })

  // Remove metadata
  await metaDelete(trackId)
  return true
}

/**
 * Get all cached track metadata.
 */
export async function getAllCachedTracks() {
  return metaGetAll()
}

/**
 * Clear all cached data.
 */
export async function clearAllCache() {
  postToSW('CLEAR_ALL_AUDIO', {})
  // Also clear from main thread in case SW is not active
  try { await caches.delete('nashidify-audio-v1') } catch {}
  try { await caches.delete('nashidify-media-v1') } catch {}
  await metaClear()
  return true
}

/**
 * Get cache stats (count + total bytes).
 */
export async function getCacheStats() {
  // Try using Storage API first (most accurate)
  if (navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate()
      const metas = await metaGetAll()
      return {
        count: metas.length,
        totalBytes: estimate.usage || 0,
        quota: estimate.quota || 0,
        persistent: await navigator.storage.persisted?.() || false,
      }
    } catch {}
  }

  // Fallback: count Cache API entries
  try {
    const cache = await caches.open('nashidify-audio-v1')
    const keys = await cache.keys()
    let totalBytes = 0
    for (const req of keys) {
      const res = await cache.match(req)
      if (res) {
        const cl = res.headers.get('content-length')
        totalBytes += cl ? parseInt(cl) : (await res.blob()).size
      }
    }
    return { count: keys.length, totalBytes, quota: 0, persistent: false }
  } catch {
    return { count: 0, totalBytes: 0, quota: 0, persistent: false }
  }
}

/**
 * Format bytes to human readable string.
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Get cached cover URL (for offline display).
 */
export async function getCachedCoverUrl(trackId) {
  const meta = await metaGet(trackId)
  if (!meta?.cover_url) return null
  try {
    const cache = await caches.open('nashidify-media-v1')
    const match = await cache.match(new Request(meta.cover_url))
    if (match) return meta.cover_url
  } catch {}
  return null
}
