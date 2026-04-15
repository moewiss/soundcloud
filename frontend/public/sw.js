/**
 * Nashidify Service Worker
 * Handles offline audio caching like Spotify.
 *
 * Strategy:
 *  - AUDIO_CACHE: stores downloaded audio files (Cache API — survives restarts)
 *  - MEDIA_CACHE: stores cover art & avatars
 *  - The app calls postMessage to tell the SW which tracks to cache / remove.
 *  - On fetch, the SW intercepts audio & image requests and serves from cache first.
 */

const AUDIO_CACHE = 'nashidify-audio-v1'
const MEDIA_CACHE = 'nashidify-media-v1'
const APP_SHELL_CACHE = 'nashidify-shell-v1'

// ── Install: pre-cache app shell ──
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// ── Activate: clean old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![AUDIO_CACHE, MEDIA_CACHE, APP_SHELL_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch: intercept audio & media requests ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Audio files — cache-first
  if (isAudioRequest(url)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached
          // Not cached — pass through to network
          return fetch(event.request).catch(() =>
            new Response('Offline - track not cached', { status: 503 })
          )
        })
      )
    )
    return
  }

  // Cover art & avatars — cache-first with network fallback
  if (isMediaRequest(url)) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached
          return fetch(event.request)
            .then((response) => {
              if (response.ok) {
                cache.put(event.request, response.clone())
              }
              return response
            })
            .catch(() => new Response('', { status: 503 }))
        })
      )
    )
    return
  }

  // Everything else — network first (SPA — let Vite/browser handle)
})

// ── Message handler: cache/remove tracks ──
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {}

  if (type === 'CACHE_AUDIO') {
    event.waitUntil(cacheAudioFile(payload, event.source))
  }

  if (type === 'REMOVE_AUDIO') {
    event.waitUntil(removeAudioFile(payload))
  }

  if (type === 'CLEAR_ALL_AUDIO') {
    event.waitUntil(clearAllAudio())
  }

  if (type === 'GET_CACHE_STATS') {
    event.waitUntil(getCacheStats(event.source))
  }

  if (type === 'IS_CACHED') {
    event.waitUntil(checkIsCached(payload, event.source))
  }
})

// ── Cache an audio file with progress ──
async function cacheAudioFile({ audioUrl, coverUrl, trackId }, client) {
  try {
    // Fetch audio with progress reporting
    const response = await fetch(audioUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength) : 0
    let loaded = 0

    const reader = response.body.getReader()
    const chunks = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      // Report progress back to the app
      if (client && total > 0) {
        client.postMessage({
          type: 'CACHE_PROGRESS',
          trackId,
          progress: Math.round((loaded / total) * 100),
        })
      }
    }

    const blob = new Blob(chunks, {
      type: response.headers.get('content-type') || 'audio/mpeg',
    })

    // Store in Cache API
    const audioCache = await caches.open(AUDIO_CACHE)
    await audioCache.put(
      new Request(audioUrl),
      new Response(blob, {
        headers: {
          'Content-Type': blob.type,
          'Content-Length': blob.size,
          'X-Nashidify-Track-Id': String(trackId),
          'X-Nashidify-Cached-At': new Date().toISOString(),
        },
      })
    )

    // Cache cover art
    if (coverUrl) {
      try {
        const mediaCache = await caches.open(MEDIA_CACHE)
        const coverRes = await fetch(coverUrl)
        if (coverRes.ok) {
          await mediaCache.put(new Request(coverUrl), coverRes)
        }
      } catch {
        // Cover caching is best-effort
      }
    }

    if (client) {
      client.postMessage({
        type: 'CACHE_COMPLETE',
        trackId,
        size: blob.size,
      })
    }
  } catch (err) {
    if (client) {
      client.postMessage({
        type: 'CACHE_ERROR',
        trackId,
        error: err.message,
      })
    }
  }
}

// ── Remove a cached audio file ──
async function removeAudioFile({ audioUrl, coverUrl }) {
  const audioCache = await caches.open(AUDIO_CACHE)
  if (audioUrl) await audioCache.delete(new Request(audioUrl))

  if (coverUrl) {
    const mediaCache = await caches.open(MEDIA_CACHE)
    await mediaCache.delete(new Request(coverUrl))
  }
}

// ── Clear all cached audio ──
async function clearAllAudio() {
  await caches.delete(AUDIO_CACHE)
  await caches.delete(MEDIA_CACHE)
}

// ── Get cache stats ──
async function getCacheStats(client) {
  try {
    const audioCache = await caches.open(AUDIO_CACHE)
    const keys = await audioCache.keys()
    let totalBytes = 0

    for (const request of keys) {
      const response = await audioCache.match(request)
      if (response) {
        const cl = response.headers.get('content-length')
        if (cl) {
          totalBytes += parseInt(cl)
        } else {
          const blob = await response.blob()
          totalBytes += blob.size
        }
      }
    }

    if (client) {
      client.postMessage({
        type: 'CACHE_STATS',
        count: keys.length,
        totalBytes,
      })
    }
  } catch {
    if (client) {
      client.postMessage({ type: 'CACHE_STATS', count: 0, totalBytes: 0 })
    }
  }
}

// ── Check if a URL is cached ──
async function checkIsCached({ audioUrl, trackId }, client) {
  try {
    const audioCache = await caches.open(AUDIO_CACHE)
    const match = await audioCache.match(new Request(audioUrl))
    if (client) {
      client.postMessage({
        type: 'IS_CACHED_RESULT',
        trackId,
        isCached: !!match,
      })
    }
  } catch {
    if (client) {
      client.postMessage({ type: 'IS_CACHED_RESULT', trackId, isCached: false })
    }
  }
}

// ── Helpers ──
function isAudioRequest(url) {
  const path = url.pathname.toLowerCase()
  return (
    path.includes('/uploads/') ||
    path.includes('/source/') ||
    path.includes('/audio/') ||
    path.endsWith('.mp3') ||
    path.endsWith('.wav') ||
    path.endsWith('.flac') ||
    path.endsWith('.ogg') ||
    path.endsWith('.m4a') ||
    path.endsWith('.aac') ||
    path.endsWith('.opus') ||
    path.endsWith('.webm')
  )
}

function isMediaRequest(url) {
  const path = url.pathname.toLowerCase()
  return (
    path.includes('/covers/') ||
    path.includes('/avatars/') ||
    path.includes('/headers/') ||
    path.endsWith('.jpg') ||
    path.endsWith('.jpeg') ||
    path.endsWith('.png') ||
    path.endsWith('.webp')
  )
}
