import { createContext, useState, useContext, useRef, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { getCachedAudioUrl } from '../services/offlineCache'

const PlayerContext = createContext()

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.7)
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off') // off, all, one
  const audioRef        = useRef(new Audio())
  const queueRef        = useRef([])
  const indexRef        = useRef(-1)
  const backupUrlRef    = useRef(null)   // for radio backup streams
  const currentTrackRef = useRef(null)  // always-current track ref

  // Audio ad state
  const [adPlaying, setAdPlaying] = useState(null) // current ad object
  const [adSkippable, setAdSkippable] = useState(false)
  const [adProgress, setAdProgress] = useState(0)
  const tracksPlayedRef = useRef(0)
  const adAudioRef = useRef(new Audio())
  const pendingTrackRef = useRef(null) // track to play after ad
  const adPlayingRef = useRef(null) // ref mirror to avoid stale closures

  const autoQueueLoadingRef = useRef(false)

  // Keep refs in sync
  useEffect(() => { adPlayingRef.current    = adPlaying    }, [adPlaying])
  useEffect(() => { queueRef.current        = queue        }, [queue])
  useEffect(() => { indexRef.current        = currentIndex }, [currentIndex])
  useEffect(() => { currentTrackRef.current = currentTrack }, [currentTrack])

  // Check if user is free (no plan or free plan)
  const isFreeUser = useCallback(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      return !u.plan_slug || u.plan_slug === 'free'
    } catch { return true }
  }, [])

  // Play an audio ad, then resume with the pending track
  const playAudioAd = useCallback((ad, onDone) => {
    setAdPlaying(ad)
    setAdSkippable(false)
    setAdProgress(0)
    const adAudio = adAudioRef.current
    adAudio.src = ad.audio_url
    adAudio.volume = audioRef.current.volume

    // Skippable after 5 seconds
    const skipTimer = setTimeout(() => setAdSkippable(true), 5000)

    const onTimeUpdate = () => setAdProgress(adAudio.currentTime)
    const onEnded = () => {
      cleanup()
      api.recordAdImpression(ad.id, 'complete').catch(() => {})
      onDone()
    }
    const onError = () => { cleanup(); onDone() }

    function cleanup() {
      clearTimeout(skipTimer)
      adAudio.removeEventListener('timeupdate', onTimeUpdate)
      adAudio.removeEventListener('ended', onEnded)
      adAudio.removeEventListener('error', onError)
      adAudio.pause()
      adAudio.src = ''
      setAdPlaying(null)
      setAdSkippable(false)
      setAdProgress(0)
    }

    adAudio.addEventListener('timeupdate', onTimeUpdate)
    adAudio.addEventListener('ended', onEnded)
    adAudio.addEventListener('error', onError)
    adAudio.play().catch(() => { cleanup(); onDone() })

    // Expose skip for the skip button
    pendingTrackRef.current = { cleanup, onDone, adId: ad.id }
  }, [])

  const skipAd = useCallback(() => {
    const pending = pendingTrackRef.current
    if (pending) {
      api.recordAdImpression(pending.adId, 'skip').catch(() => {})
      pending.cleanup()
      pending.onDone()
      pendingTrackRef.current = null
    }
  }, [])

  // Try to show ad before playing a track (every 3 tracks for free users)
  const maybeShowAd = useCallback((callback) => {
    tracksPlayedRef.current += 1
    if (!isFreeUser() || tracksPlayedRef.current % 3 !== 0) {
      callback()
      return
    }
    // Fetch and play audio ad
    api.getAudioAd().then(res => {
      if (res.ad) {
        audioRef.current.pause()
        playAudioAd(res.ad, callback)
      } else {
        callback()
      }
    }).catch(() => callback())
  }, [isFreeUser, playAudioAd])

  // Fetch related tracks when queue runs out
  const fetchAndQueueRelated = useCallback(async (track, currentQueue) => {
    if (autoQueueLoadingRef.current) return false
    if (!track || track.isRadio) return false
    autoQueueLoadingRef.current = true

    try {
      const existingIds = new Set(currentQueue.map(t => t.id))
      let related = []

      // 1. Try same artist's tracks
      if (track.user?.id) {
        try {
          const artistTracks = await api.getUserTracks(track.user.id, 'popular')
          const arr = Array.isArray(artistTracks) ? artistTracks : artistTracks.data || []
          related = arr.filter(t => !existingIds.has(t.id) && t.audio_url)
        } catch {}
      }

      // 2. If not enough, get same category
      if (related.length < 5 && track.category) {
        try {
          const catTracks = await api.getTracks({ category: track.category, sort: 'popular' })
          const arr = Array.isArray(catTracks) ? catTracks : catTracks.data || []
          const catFiltered = arr.filter(t => !existingIds.has(t.id) && !related.some(r => r.id === t.id) && t.audio_url)
          related = [...related, ...catFiltered]
        } catch {}
      }

      // 3. If still not enough, get general popular tracks
      if (related.length < 3) {
        try {
          const popular = await api.getTracks({ sort: 'popular' })
          const arr = Array.isArray(popular) ? popular : popular.data || []
          const popFiltered = arr.filter(t => !existingIds.has(t.id) && !related.some(r => r.id === t.id) && t.audio_url)
          related = [...related, ...popFiltered]
        } catch {}
      }

      // Take up to 20 tracks
      related = related.slice(0, 20)

      if (related.length > 0) {
        setQueue(prev => [...prev, ...related])
        return true
      }
      return false
    } catch {
      return false
    } finally {
      autoQueueLoadingRef.current = false
    }
  }, [])

  const playNextTrack = useCallback(() => {
    const q = queueRef.current
    const idx = indexRef.current
    if (repeat === 'one') {
      audioRef.current.currentTime = 0
      audioRef.current.play()
      return
    }

    const doPlay = (track, newIdx) => {
      setCurrentIndex(newIdx)
      setCurrentTrack(track)
      audioRef.current.src = track.audio_url
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }

    if (shuffle && q.length > 1) {
      const available = q.map((_, i) => i).filter(i => i !== idx)
      const nextIdx = available[Math.floor(Math.random() * available.length)]
      maybeShowAd(() => doPlay(q[nextIdx], nextIdx))
    } else if (q.length > 0 && idx < q.length - 1) {
      maybeShowAd(() => doPlay(q[idx + 1], idx + 1))
    } else if (repeat === 'all' && q.length > 0) {
      maybeShowAd(() => doPlay(q[0], 0))
    } else {
      // Queue exhausted — auto-fetch related tracks
      const track = currentTrackRef.current
      if (track && !track.isRadio) {
        fetchAndQueueRelated(track, q).then(found => {
          if (found) {
            // Queue was updated, play the next track
            const updatedQ = queueRef.current
            const nextIdx = idx + 1
            if (nextIdx < updatedQ.length) {
              maybeShowAd(() => doPlay(updatedQ[nextIdx], nextIdx))
            }
          } else {
            setIsPlaying(false)
          }
        })
      } else {
        setIsPlaying(false)
      }
    }
  }, [repeat, shuffle, maybeShowAd, fetchAndQueueRelated])

  useEffect(() => {
    const audio = audioRef.current
    const handleTimeUpdate = () => setProgress(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => {
      if (currentTrackRef.current?.isRadio) return // live streams don't end normally
      playNextTrack()
    }
    const handleError = () => {
      // Try backup URL for radio streams
      if (backupUrlRef.current) {
        const backup = backupUrlRef.current
        backupUrlRef.current = null
        audio.src = backup
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
        return
      }
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [playNextTrack])

  useEffect(() => {
    audioRef.current.volume = volume
  }, [volume])

  // Pre-fetch related tracks when nearing end of queue
  useEffect(() => {
    if (!currentTrack || currentTrack.isRadio) return
    const remaining = queue.length - 1 - currentIndex
    if (remaining <= 2 && queue.length > 0 && !autoQueueLoadingRef.current) {
      fetchAndQueueRelated(currentTrack, queue)
    }
  }, [currentIndex, queue.length])

  // Report listen progress every 10 seconds, on pause, and before page unload
  useEffect(() => {
    if (!currentTrack || !isPlaying || currentTrack.isRadio) return
    const report = () => {
      if (localStorage.getItem('token') && audioRef.current && audioRef.current.currentTime > 0) {
        api.reportListenProgress(currentTrack.id, Math.floor(audioRef.current.currentTime)).catch(() => {})
      }
    }
    const interval = setInterval(report, 10000)
    const onPause = () => report()
    const onBeforeUnload = () => report()
    audioRef.current?.addEventListener('pause', onPause)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      clearInterval(interval)
      audioRef.current?.removeEventListener('pause', onPause)
      window.removeEventListener('beforeunload', onBeforeUnload)
      report() // report on track change too
    }
  }, [currentTrack?.id, isPlaying])

  const playTrack = useCallback((track, trackQueue = [], { startTime } = {}) => {
    if (!track) return
    if (adPlayingRef.current) return // block while ad is playing
    if (currentTrack?.id === track.id) {
      togglePlay()
      return
    }

    const doPlay = async () => {
      const audio = audioRef.current

      // Try offline cache first, then fall back to network URL
      let audioSrc = track.audio_url
      if (track._offline && track.audio_url) {
        // Already using a cached blob URL passed from Downloads page
        audioSrc = track.audio_url
      } else {
        try {
          const cachedUrl = await getCachedAudioUrl(track.id)
          if (cachedUrl) audioSrc = cachedUrl
        } catch {}
      }

      if (!audioSrc) {
        toast.error('This track is not available for playback')
        return
      }

      audio.src = audioSrc
      // Seek to resume position once audio is ready
      if (startTime && startTime > 0) {
        const onCanPlay = () => {
          audio.currentTime = startTime
          audio.removeEventListener('canplay', onCanPlay)
        }
        audio.addEventListener('canplay', onCanPlay)
      }
      audio.play()
        .then(() => {
          setCurrentTrack(track)
          setIsPlaying(true)
          // Track history
          if (localStorage.getItem('token')) {
            api.addToHistory(track.id).catch(() => {})
          }
        })
        .catch(() => {
          setIsPlaying(false)
          toast.error('Unable to play this track')
        })

      if (trackQueue.length > 0) {
        setQueue(trackQueue)
        setCurrentIndex(trackQueue.findIndex(t => t.id === track.id))
      } else {
        setQueue([track])
        setCurrentIndex(0)
      }
    }

    maybeShowAd(doPlay)
  }, [currentTrack, maybeShowAd])

  const togglePlay = useCallback(() => {
    if (adPlayingRef.current) return
    const audio = audioRef.current
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [isPlaying])

  const pause = useCallback(() => {
    if (adPlayingRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
  }, [])

  const resume = useCallback(() => {
    if (adPlayingRef.current) return
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
  }, [])

  const seek = useCallback((time) => {
    if (adPlayingRef.current) return
    audioRef.current.currentTime = time
  }, [])

  const setVolume = useCallback((v) => {
    setVolumeState(v)
    audioRef.current.volume = v
    adAudioRef.current.volume = v
  }, [])

  const playNext = useCallback(() => {
    if (adPlayingRef.current) return
    playNextTrack()
  }, [playNextTrack])

  const playPrevious = useCallback(() => {
    if (adPlayingRef.current) return
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
      return
    }
    const q = queueRef.current
    const idx = indexRef.current
    if (q.length > 0 && idx > 0) {
      const prev = q[idx - 1]
      setCurrentIndex(idx - 1)
      setCurrentTrack(prev)
      audioRef.current.src = prev.audio_url
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }, [])

  const toggleShuffle = useCallback(() => setShuffle(s => !s), [])
  const toggleRepeat  = useCallback(() => {
    setRepeat(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')
  }, [])

  const addToQueue = useCallback((track) => {
    if (!track) return
    setQueue(prev => {
      if (prev.some(t => t.id === track.id)) return prev
      return [...prev, track]
    })
  }, [])

  const insertNext = useCallback((track) => {
    if (!track) return
    setQueue(prev => {
      // Remove if already in queue
      const filtered = prev.filter(t => t.id !== track.id)
      const idx = indexRef.current
      // Insert right after current track
      const insertAt = idx + 1
      filtered.splice(insertAt, 0, track)
      return filtered
    })
  }, [])

  const removeFromQueue = useCallback((trackId) => {
    setQueue(prev => {
      const idx = prev.findIndex(t => t.id === trackId)
      if (idx === -1) return prev
      const next = prev.filter(t => t.id !== trackId)
      // Adjust currentIndex if needed
      if (idx < indexRef.current) {
        setCurrentIndex(i => i - 1)
      }
      return next
    })
  }, [])

  const moveInQueue = useCallback((fromIdx, toIdx) => {
    setQueue(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      // Adjust currentIndex
      const cur = indexRef.current
      if (cur === fromIdx) setCurrentIndex(toIdx)
      else if (fromIdx < cur && toIdx >= cur) setCurrentIndex(cur - 1)
      else if (fromIdx > cur && toIdx <= cur) setCurrentIndex(cur + 1)
      return next
    })
  }, [])

  const clearQueue = useCallback(() => {
    const cur = currentTrackRef.current
    if (cur) {
      setQueue([cur])
      setCurrentIndex(0)
    } else {
      setQueue([])
      setCurrentIndex(-1)
    }
  }, [])

  const playFromQueue = useCallback((index) => {
    const q = queueRef.current
    if (index < 0 || index >= q.length) return
    const track = q[index]
    setCurrentIndex(index)
    setCurrentTrack(track)
    audioRef.current.src = track.audio_url
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
  }, [])

  const playRadio = useCallback((station) => {
    const audio = audioRef.current
    audio.pause()

    const radioTrack = {
      id:           `radio_${station.id}`,
      title:        station.name,
      audio_url:    station.stream,
      isRadio:      true,
      radioFreq:    station.freq,
      radioLang:    station.lang,
      radioCategory:station.category,
      user:         { name: `${station.freq} FM · ${station.lang}`, id: null },
      cover_url:    null,
    }

    backupUrlRef.current = station.backup || null
    setCurrentTrack(radioTrack)
    setProgress(0)
    setDuration(0)
    setQueue([radioTrack])
    setCurrentIndex(0)

    audio.src = station.stream
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        if (station.backup) {
          backupUrlRef.current = null
          audio.src = station.backup
          audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
        } else {
          setIsPlaying(false)
        }
      })
  }, [])

  const stopRadio = useCallback(() => {
    audioRef.current.pause()
    audioRef.current.src = ''
    backupUrlRef.current  = null
    setCurrentTrack(null)
    setIsPlaying(false)
    setQueue([])
    setCurrentIndex(-1)
  }, [])

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, progress, duration, volume,
      queue, currentIndex, shuffle, repeat,
      playTrack, togglePlay, pause, resume, seek, setVolume,
      playNext, playPrevious, toggleShuffle, toggleRepeat,
      playRadio, stopRadio,
      adPlaying, adSkippable, adProgress, skipAd,
      addToQueue, insertNext, removeFromQueue, moveInQueue, clearQueue, playFromQueue,
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer must be used within PlayerProvider')
  return context
}
