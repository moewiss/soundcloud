import { useEffect, useCallback } from 'react'
import { usePlayer } from '../context/PlayerContext'

function MediaSessionController() {
  useMediaSession()
  return null
}

function useMediaSession() {
  const {
    currentTrack, isPlaying, duration, progress,
    togglePlay, playNext, playPrevious, seek
  } = usePlayer()

  // Update metadata when track changes
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return

    const artwork = currentTrack.cover_url
      ? [
          { src: currentTrack.cover_url, sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.cover_url, sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.cover_url, sizes: '512x512', type: 'image/jpeg' },
        ]
      : []

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title || 'Unknown',
      artist: currentTrack.user?.name || (currentTrack.isRadio ? 'Nashidify Radio' : 'Unknown'),
      album: currentTrack.isRadio ? 'Nashidify Radio' : 'Nashidify',
      artwork,
    })
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.cover_url])

  // Update playback state
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [isPlaying])

  // Update position state for lock screen seek bar
  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration || currentTrack?.isRadio) return
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(Math.max(0, progress), duration),
      })
    } catch { /* setPositionState not supported on all browsers */ }
  }, [progress, duration, currentTrack?.isRadio])

  // Stable handler refs
  const handlePlay = useCallback(() => togglePlay(), [togglePlay])
  const handleNext = useCallback(() => playNext(), [playNext])
  const handlePrev = useCallback(() => playPrevious(), [playPrevious])

  // Register action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    const handlers = {
      play: handlePlay,
      pause: handlePlay,
      previoustrack: handlePrev,
      nexttrack: handleNext,
      seekto: (details) => {
        if (details.seekTime != null) seek(details.seekTime)
      },
      seekbackward: (details) => {
        seek(Math.max(0, progress - (details.seekOffset || 10)))
      },
      seekforward: (details) => {
        seek(Math.min(duration || 0, progress + (details.seekOffset || 10)))
      },
    }

    for (const [action, handler] of Object.entries(handlers)) {
      try { navigator.mediaSession.setActionHandler(action, handler) }
      catch { /* action not supported */ }
    }

    return () => {
      for (const action of Object.keys(handlers)) {
        try { navigator.mediaSession.setActionHandler(action, null) } catch {}
      }
    }
  }, [handlePlay, handleNext, handlePrev, seek, progress, duration])
}

export { useMediaSession, MediaSessionController }
