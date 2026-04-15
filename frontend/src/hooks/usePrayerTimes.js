import { useState, useEffect, useCallback } from 'react'

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function formatCountdown(minutes) {
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function usePrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState(null)
  const [nextPrayer, setNextPrayer] = useState(null)
  const [currentPrayer, setCurrentPrayer] = useState(null) // prayer happening right now
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [locationGranted, setLocationGranted] = useState(null) // null=unknown, true, false

  const fetchPrayerTimes = useCallback(async (lat, lon) => {
    setIsLoading(true)
    setError(null)
    try {
      const today = new Date()
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
      const res = await fetch(
        `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=2`
      )
      const data = await res.json()
      if (data.code === 200) {
        const timings = data.data.timings
        const prayers = PRAYER_NAMES.map(name => ({
          name,
          time: timings[name], // "HH:MM" 24h format
        }))
        setPrayerTimes(prayers)
        // Cache for today
        localStorage.setItem('nashidify_prayer_times', JSON.stringify({
          date: today.toDateString(),
          lat, lon,
          prayers,
        }))
      } else {
        setError('Prayer time service unavailable')
      }
    } catch {
      setError('Could not fetch prayer times')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load from cache or fetch
  const initPrayerTimes = useCallback((lat, lon) => {
    const cached = localStorage.getItem('nashidify_prayer_times')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        const today = new Date().toDateString()
        // Use cache if same day and within ~0.01 degree (~1km) of same location
        if (
          parsed.date === today &&
          Math.abs(parsed.lat - lat) < 0.01 &&
          Math.abs(parsed.lon - lon) < 0.01
        ) {
          setPrayerTimes(parsed.prayers)
          return
        }
      } catch {}
    }
    fetchPrayerTimes(lat, lon)
  }, [fetchPrayerTimes])

  // Request geolocation once on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationGranted(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationGranted(true)
        initPrayerTimes(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        setLocationGranted(false)
        // Try to load from cache even without fresh location
        const cached = localStorage.getItem('nashidify_prayer_times')
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            if (parsed.date === new Date().toDateString()) {
              setPrayerTimes(parsed.prayers)
            }
          } catch {}
        }
      },
      { timeout: 10000, maximumAge: 3600000 } // cache location for 1 hour
    )
  }, [initPrayerTimes])

  // Recalculate next prayer every minute
  useEffect(() => {
    if (!prayerTimes) return

    const calcNext = () => {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      // Check if we're exactly at a prayer time (within 1 minute window)
      const active = prayerTimes.find(p => {
        const pm = timeToMinutes(p.time)
        return currentMinutes >= pm && currentMinutes < pm + 15
      })
      setCurrentPrayer(active || null)

      // Find next upcoming prayer
      for (const prayer of prayerTimes) {
        const pm = timeToMinutes(prayer.time)
        if (pm > currentMinutes) {
          setNextPrayer({
            ...prayer,
            minutesUntil: pm - currentMinutes,
            countdown: formatCountdown(pm - currentMinutes),
          })
          return
        }
      }

      // All prayers passed today — next is Fajr tomorrow
      const fajr = prayerTimes[0]
      const fajrMinutes = timeToMinutes(fajr.time) + 24 * 60
      setNextPrayer({
        ...fajr,
        minutesUntil: fajrMinutes - currentMinutes,
        countdown: formatCountdown(fajrMinutes - currentMinutes),
        tomorrow: true,
      })
    }

    calcNext()
    const interval = setInterval(calcNext, 30000) // check every 30s
    return () => clearInterval(interval)
  }, [prayerTimes])

  return {
    prayerTimes,
    nextPrayer,
    currentPrayer, // non-null when a prayer window (0–15 min) is active
    isLoading,
    error,
    locationGranted,
  }
}
