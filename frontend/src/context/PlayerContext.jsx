import { createContext, useState, useContext, useRef, useEffect } from 'react'

const PlayerContext = createContext()

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const audioRef = useRef(new Audio())

  useEffect(() => {
    const audio = audioRef.current

    const handleTimeUpdate = () => setProgress(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => playNext()

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    audioRef.current.volume = volume
  }, [volume])

  const playTrack = (track, trackQueue = []) => {
    if (currentTrack?.id === track.id) {
      togglePlay()
      return
    }

    const audio = audioRef.current
    audio.src = track.audio_url
    audio.play()
    setCurrentTrack(track)
    setIsPlaying(true)
    
    if (trackQueue.length > 0) {
      setQueue(trackQueue)
      setCurrentIndex(trackQueue.findIndex(t => t.id === track.id))
    }
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const seek = (time) => {
    audioRef.current.currentTime = time
  }

  const playNext = () => {
    if (queue.length > 0 && currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1]
      playTrack(nextTrack, queue)
      setCurrentIndex(currentIndex + 1)
    }
  }

  const playPrevious = () => {
    if (queue.length > 0 && currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1]
      playTrack(prevTrack, queue)
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        playTrack,
        togglePlay,
        seek,
        setVolume,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider')
  }
  return context
}

