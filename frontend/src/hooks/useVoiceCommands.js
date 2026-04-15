import { useState, useRef, useCallback } from 'react'

const COMMANDS = [
  { patterns: ['next', 'skip', 'next track', 'next song'], action: 'next' },
  { patterns: ['previous', 'back', 'go back', 'last', 'prev'], action: 'previous' },
  { patterns: ['pause', 'stop'], action: 'pause' },
  { patterns: ['play', 'resume', 'continue'], action: 'play' },
  { patterns: ['shuffle', 'mix', 'random'], action: 'shuffle' },
  { patterns: ['like', 'love', 'heart', 'favorite'], action: 'like' },
  { patterns: ['repeat', 'loop'], action: 'repeat' },
  { patterns: ['play trending', 'trending'], action: 'browse_trending' },
  { patterns: ['play nasheeds', 'nasheeds', 'play nasheed'], action: 'browse_nasheeds' },
  { patterns: ['play quran', 'quran', 'play qur\'an'], action: 'browse_quran' },
  { patterns: ['play lectures', 'lectures', 'islamic lectures'], action: 'browse_lectures' },
]

function processCommand(text, onCommand) {
  const lower = text.toLowerCase().trim()

  // Radio command: "radio [name]" or "play radio [name]"
  if (lower.startsWith('radio ') || lower.startsWith('play radio ')) {
    const query = lower.replace(/^(play )?radio /, '')
    onCommand({ action: 'radio', query })
    return
  }

  // Search command: "search [query]"
  if (lower.startsWith('search ') || lower.startsWith('find ') || lower.startsWith('look for ')) {
    const query = lower.replace(/^(search |find |look for )/, '')
    onCommand({ action: 'search', query })
    return
  }

  // Pattern matching
  for (const cmd of COMMANDS) {
    if (cmd.patterns.some(p => lower.includes(p))) {
      onCommand({ action: cmd.action, transcript: lower })
      return
    }
  }

  onCommand({ action: 'unknown', transcript: lower })
}

export function useVoiceCommands({ onCommand }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const startListening = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript
      setTranscript(text)
      processCommand(text, onCommand)
    }

    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isSupported, onCommand])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return { isListening, transcript, startListening, stopListening, isSupported }
}
