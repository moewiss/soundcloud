import { useState, useEffect, useRef } from 'react'

const PRAYERS = [
  { key: 'Fajr',    arabic: 'الفجر',   english: 'Fajr',    icon: 'fa-moon',       desc: 'Pre-dawn',  color: '#7aa8cc' },
  { key: 'Sunrise', arabic: 'الشروق',  english: 'Sunrise', icon: 'fa-sun',        desc: 'Sunrise',   color: '#C9A24D', notPrayer: true },
  { key: 'Dhuhr',   arabic: 'الظهر',   english: 'Dhuhr',   icon: 'fa-sun',        desc: 'Midday',    color: '#d4b45e' },
  { key: 'Asr',     arabic: 'العصر',   english: 'Asr',     icon: 'fa-cloud-sun',  desc: 'Afternoon', color: '#5aaa82' },
  { key: 'Maghrib', arabic: 'المغرب',  english: 'Maghrib', icon: 'fa-cloud-moon', desc: 'Sunset',    color: '#c47860' },
  { key: 'Isha',    arabic: 'العشاء',  english: 'Isha',    icon: 'fa-star',       desc: 'Night',     color: '#8a82be' },
]

const METHODS = [
  { id: 2,  name: 'ISNA',                full: 'Islamic Society of North America' },
  { id: 1,  name: 'Karachi',             full: 'University of Islamic Sciences, Karachi' },
  { id: 3,  name: 'Muslim World League', full: 'Muslim World League' },
  { id: 4,  name: 'Umm Al-Qura',         full: 'Umm Al-Qura University, Makkah' },
  { id: 5,  name: 'Egypt',               full: 'Egyptian General Authority of Survey' },
  { id: 14, name: 'Turkey',              full: 'Diyanet İşleri Başkanlığı, Turkey' },
  { id: 15, name: 'Russia',              full: 'Spiritual Administration of Muslims of Russia' },
]

const MECCA = { lat: 21.3891, lon: 39.8579 }

function t2s(t) { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 3600 + m * 60 }
function fmt12(t) {
  if (!t) return '--:--'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
function getQibla(lat, lon) {
  const r = d => d * Math.PI / 180
  const dLon = r(MECCA.lon) - r(lon)
  const y = Math.sin(dLon) * Math.cos(r(MECCA.lat))
  const x = Math.cos(r(lat)) * Math.sin(r(MECCA.lat)) - Math.sin(r(lat)) * Math.cos(r(MECCA.lat)) * Math.cos(dLon)
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360
}
function todayKey() {
  const d = new Date()
  return `prayer_done_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`
}

export default function AdhanTimes() {
  const [timings, setTimings]       = useState(null)
  const [hijri, setHijri]           = useState(null)
  const [greg, setGreg]             = useState(null)
  const [locName, setLocName]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [error, setError]           = useState(null)
  const [coords, setCoords]         = useState(null)
  const [method, setMethod]         = useState(() => Number(localStorage.getItem('nashidify_adhan_method') || 2))
  const [now, setNow]               = useState(new Date())
  const [nextP, setNextP]           = useState(null)
  const [secs, setSecs]             = useState(0)
  const [pct, setPct]               = useState(0)
  const [permState, setPermState]   = useState('unknown')
  const [city, setCity]             = useState('')
  const [showMethod, setShowMethod] = useState(false)
  const [qibla, setQibla]           = useState(null)
  const [notifPerm, setNotifPerm]   = useState('default')
  const [notifOn, setNotifOn]       = useState(() => localStorage.getItem('nashidify_notif') === 'true')
  const [done, setDone]             = useState(() => { try { return JSON.parse(localStorage.getItem(todayKey()) || '[]') } catch { return [] } })
  const [alert, setAlert]           = useState(null)
  const triggered                   = useRef(new Set())
  const methodRef                   = useRef(null)

  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i) }, [])

  useEffect(() => {
    if (!timings) return
    const s = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    const list = PRAYERS.filter(p => !p.notPrayer)
    let found = null
    for (let i = 0; i < list.length; i++) {
      const ps = t2s(timings[list[i].key])
      if (ps > s) {
        const prev = i === 0 ? 0 : t2s(timings[list[i - 1].key])
        setPct(Math.min(100, ((s - prev) / (ps - prev)) * 100))
        found = { ...list[i], time: timings[list[i].key], secsLeft: ps - s }
        break
      }
    }
    if (!found) {
      const fajrS = t2s(timings[list[0].key]) + 86400
      const ishaS = t2s(timings[list[list.length - 1].key])
      setPct(Math.min(100, ((s - ishaS) / (86400 - ishaS)) * 100))
      found = { ...list[0], time: timings[list[0].key], secsLeft: fajrS - s, tomorrow: true }
    }
    setNextP(found); setSecs(found.secsLeft)

    // Check for prayer alerts
    for (const p of list) {
      const ps = t2s(timings[p.key])
      const key = `${p.key}_${new Date().toDateString()}`
      if (s >= ps && s < ps + 30 && !triggered.current.has(key)) {
        triggered.current.add(key)
        setAlert(p); setTimeout(() => setAlert(null), 8000)
        if (notifOn && notifPerm === 'granted') {
          try { new Notification(`${p.english} — Prayer Time`, { body: `Time for ${p.english} (${p.arabic}) prayer.` }) } catch {}
        }
      }
    }
  }, [now, timings, notifOn, notifPerm])

  const getStatus = (key) => {
    if (!timings) return 'upcoming'
    const s = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    const list = PRAYERS.filter(p => !p.notPrayer)
    const ni = list.findIndex(p => t2s(timings[p.key]) > s)
    const nk = ni >= 0 ? list[ni].key : list[0].key
    if (key === nk) return 'next'
    if (t2s(timings[key]) < s) return 'past'
    return 'upcoming'
  }

  useEffect(() => { if ('Notification' in window) setNotifPerm(Notification.permission) }, [])

  useEffect(() => {
    if (!navigator.geolocation) { setPermState('denied'); return }
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(r => {
        setPermState(r.state)
        if (r.state === 'granted') doGPS()
        r.onchange = () => { setPermState(r.state); if (r.state === 'granted') doGPS() }
      }).catch(() => doGPS())
    } else doGPS()
  }, [])

  const doGPS = () => {
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPermState('granted'); setLocLoading(false)
        const { latitude: lat, longitude: lon } = pos.coords
        setCoords({ lat, lon }); setQibla(getQibla(lat, lon))
        fetchByCoords(lat, lon, method)
      },
      err => { setLocLoading(false); setPermState(err.code === 1 ? 'denied' : 'prompt') },
      { timeout: 12000, maximumAge: 600000 }
    )
  }

  const fetchByCoords = async (lat, lon, m) => {
    setLoading(true); setError(null)
    try {
      const d = new Date(), ds = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`
      const res = await fetch(`https://api.aladhan.com/v1/timings/${ds}?latitude=${lat}&longitude=${lon}&method=${m}`)
      const data = await res.json()
      if (data.code === 200) {
        setTimings(data.data.timings); setHijri(data.data.date.hijri); setGreg(data.data.date.gregorian)
        try {
          const g = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          const gd = await g.json()
          const c = gd.address?.city || gd.address?.town || gd.address?.village || ''
          setLocName(c ? `${c}, ${gd.address?.country || ''}` : gd.address?.country || '')
        } catch { setLocName(null) }
      } else setError('Could not load prayer times.')
    } catch { setError('Network error.') }
    finally { setLoading(false) }
  }

  const fetchByCity = async (c, m) => {
    setLoading(true); setError(null)
    try {
      const d = new Date(), ds = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`
      const res = await fetch(`https://api.aladhan.com/v1/timingsByCity/${ds}?city=${encodeURIComponent(c)}&country=&method=${m}`)
      const data = await res.json()
      if (data.code === 200) {
        setTimings(data.data.timings); setHijri(data.data.date.hijri); setGreg(data.data.date.gregorian)
        setLocName(c); setCoords(null); setQibla(null)
      } else setError('City not found.')
    } catch { setError('Network error.') }
    finally { setLoading(false) }
  }

  const changeMethod = (m) => {
    setMethod(m); localStorage.setItem('nashidify_adhan_method', String(m)); setShowMethod(false)
    if (coords) fetchByCoords(coords.lat, coords.lon, m)
    else if (city) fetchByCity(city, m)
  }

  const toggleNotif = async () => {
    if (notifPerm === 'default') {
      const p = await Notification.requestPermission()
      setNotifPerm(p)
      if (p === 'granted') { setNotifOn(true); localStorage.setItem('nashidify_notif', 'true') }
    } else if (notifPerm === 'granted') {
      const n = !notifOn; setNotifOn(n); localStorage.setItem('nashidify_notif', String(n))
    }
  }

  const toggleDone = (key) => {
    const next = done.includes(key) ? done.filter(k => k !== key) : [...done, key]
    setDone(next); localStorage.setItem(todayKey(), JSON.stringify(next))
  }

  useEffect(() => {
    const h = e => { if (methodRef.current && !methodRef.current.contains(e.target)) setShowMethod(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const curMethod = METHODS.find(m => m.id === method)
  const npColor   = nextP ? (PRAYERS.find(p => p.key === nextP.key)?.color || '#1A7050') : '#1A7050'
  const hh = Math.floor(secs / 3600).toString().padStart(2, '0')
  const mm = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
  const ss = (secs % 60).toString().padStart(2, '0')

  return (
    <div style={{ padding: '28px 32px 120px', fontFamily: 'inherit' }}>

      {/* ── Prayer alert toast ── */}
      {alert && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: '#0F1E1A', border: 'none',
          borderRadius: '16px', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
          minWidth: '320px', animation: 'adhan-slide 0.35s ease',
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${alert.color}20`, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`fas ${alert.icon}`} style={{ color: alert.color, fontSize: '1.1rem' }}></i>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>{alert.english} Prayer Time</div>
            <div style={{ fontFamily: 'Amiri, serif', color: alert.color, fontSize: '1.2rem', direction: 'rtl', marginTop: '2px' }}>{alert.arabic} — حان وقت الصلاة</div>
          </div>
          <button onClick={() => setAlert(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem', padding: '4px', flexShrink: 0 }}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* ══ DARK HERO CARD ══ */}
      <div style={{
        background: '#0F1E1A', borderRadius: '20px', overflow: 'hidden',
        marginBottom: '20px', position: 'relative',
        border: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
      }}>
        {/* Color glow */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', borderRadius: '50%', background: `radial-gradient(circle, ${npColor}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
        {/* Crescent decoration */}
        <svg style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05, pointerEvents: 'none' }} width="260" height="260" viewBox="0 0 260 260">
          <circle cx="130" cy="130" r="110" fill="#C9A24D" />
          <circle cx="175" cy="98" r="90" fill="#0F1E1A" />
        </svg>
        {/* Star dots */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12, pointerEvents: 'none' }}>
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={`${(i * 137.5) % 100}%`} cy={`${(i * 97.3) % 100}%`} r={i % 7 === 0 ? '1.5' : '1'} fill="#fff" />
          ))}
        </svg>

        <div style={{ position: 'relative', padding: '36px 40px 40px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <i className="fas fa-mosque" style={{ color: npColor, fontSize: '1.2rem' }}></i>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '1.4rem', letterSpacing: '-0.01em' }}>Adhan Times</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {locName
                  ? <><i className="fas fa-location-dot" style={{ color: npColor, fontSize: '0.75rem' }}></i>{locName}</>
                  : 'No location set — search a city or allow GPS'
                }
              </div>
            </div>
            {hijri && greg && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Amiri, serif', fontSize: '1.2rem', color: '#C9A24D', fontWeight: 700, direction: 'rtl', lineHeight: 1.3 }}>
                  {hijri.day} {hijri.month.ar} {hijri.year} هـ
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: '3px' }}>
                  {greg.weekday.en}, {greg.day} {greg.month.en} {greg.year}
                </div>
              </div>
            )}
          </div>

          {/* Countdown content */}
          {loading && (
            <div style={{ padding: '40px 0', display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.4)' }}>
              <i className="fas fa-spinner fa-spin" style={{ color: npColor, fontSize: '1.4rem' }}></i>
              <span style={{ fontSize: '0.95rem' }}>Fetching prayer times…</span>
            </div>
          )}

          {!loading && !timings && (
            <div style={{ padding: '20px 0 12px' }}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Allow location access or search your city to see prayer times.
              </div>
              {permState !== 'denied' && (
                <button onClick={doGPS} disabled={locLoading} style={{ padding: '12px 28px', borderRadius: '16px', background: npColor, border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <i className={`fas ${locLoading ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'}`}></i>
                  {locLoading ? 'Detecting…' : 'Use My Location'}
                </button>
              )}
            </div>
          )}

          {nextP && !loading && (
            <>
              {/* Prayer name */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  {nextP.tomorrow ? "Tomorrow's Prayer" : 'Next Prayer'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${npColor}22`, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fas ${nextP.icon}`} style={{ color: npColor, fontSize: '1.3rem' }}></i>
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: '3.2rem', lineHeight: 0.9, letterSpacing: '-0.03em' }}>{nextP.english}</div>
                    <div style={{ fontFamily: 'Amiri, serif', fontSize: '1.6rem', color: npColor, marginTop: '6px', lineHeight: 1 }}>{nextP.arabic}</div>
                  </div>
                </div>
              </div>

              {/* Countdown tiles */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {[[hh, 'Hours'], [mm, 'Min'], [ss, 'Sec']].map(([val, label], i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '14px', padding: '14px 20px', textAlign: 'center', minWidth: '80px' }}>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '3.4rem', lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 20px ${npColor}50`, letterSpacing: '-0.03em' }}>{val}</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', marginTop: '6px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
                    </div>
                    {i < 2 && <div style={{ color: `${npColor}80`, fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, paddingBottom: '18px', letterSpacing: '-0.03em' }}>:</div>}
                  </div>
                ))}
                {/* Live clock */}
                <div style={{ marginLeft: 'auto', textAlign: 'right', paddingBottom: '4px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Now</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums' }}>
                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: '2px' }}>
                    at {fmt12(nextP.time)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.25)', fontSize: '0.68rem', marginBottom: '6px' }}>
                  <span>Period progress</span><span>{Math.round(pct)}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: `linear-gradient(90deg, ${npColor}, ${npColor}70)`, width: `${pct}%`, transition: 'width 1s linear', borderRadius: '2px' }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ CONTROLS ══ */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
        {/* City search */}
        <form onSubmit={e => { e.preventDefault(); if (city.trim()) fetchByCity(city.trim(), method) }} style={{ display: 'flex', gap: '6px', flex: 1, minWidth: '160px', maxWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sp-text-muted)', fontSize: '0.75rem' }}></i>
            <input type="text" placeholder="Search city…" value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: '9px 12px 9px 30px', borderRadius: '10px', boxSizing: 'border-box', background: 'var(--sp-bg-card)', border: 'none', color: 'var(--sp-text)', fontSize: '0.83rem', outline: 'none' }} />
          </div>
          <button type="submit" style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--sp-green)', border: 'none', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>Go</button>
        </form>

        {/* GPS */}
        <button onClick={doGPS} disabled={locLoading || permState === 'denied'} style={{ padding: '9px 14px', borderRadius: '10px', cursor: permState === 'denied' ? 'not-allowed' : 'pointer', background: 'var(--sp-bg-card)', border: 'none', color: permState === 'denied' ? 'var(--sp-text-muted)' : 'var(--sp-text)', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '7px' }}>
          <i className={`fas ${locLoading ? 'fa-spinner fa-spin' : permState === 'denied' ? 'fa-location-slash' : 'fa-location-crosshairs'}`} style={{ color: permState === 'granted' ? 'var(--sp-green)' : 'inherit' }}></i>
          {locLoading ? 'Locating…' : permState === 'denied' ? 'Location Blocked' : permState === 'granted' ? 'Refresh Location' : 'Use My Location'}
        </button>

        {/* Method */}
        <div ref={methodRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowMethod(v => !v)} style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--sp-bg-card)', border: 'none', color: 'var(--sp-text-sub)', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <i className="fas fa-sliders"></i> {curMethod?.name} <i className="fas fa-chevron-down" style={{ fontSize: '0.6rem' }}></i>
          </button>
          {showMethod && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100, background: '#0F1E1A', border: 'none', borderRadius: '12px', overflow: 'hidden', minWidth: '280px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '10px 14px 6px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Calculation Method</div>
              {METHODS.map(m => (
                <div key={m.id} onClick={() => changeMethod(m.id)} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: method === m.id ? 'rgba(26,112,80,0.2)' : 'transparent' }}>
                  <i className="fas fa-check" style={{ opacity: method === m.id ? 1 : 0, fontSize: '0.7rem', color: '#5aaa82', width: '12px' }}></i>
                  <div>
                    <div style={{ color: method === m.id ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: method === m.id ? 600 : 400, fontSize: '0.83rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>{m.full}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        {'Notification' in window && (
          <button onClick={toggleNotif} title={notifPerm === 'denied' ? 'Blocked in browser settings' : ''} style={{ padding: '9px 14px', borderRadius: '10px', cursor: notifPerm === 'denied' ? 'not-allowed' : 'pointer', background: notifOn && notifPerm === 'granted' ? 'rgba(26,112,80,0.1)' : 'var(--sp-bg-card)', border: 'none', color: notifOn && notifPerm === 'granted' ? 'var(--sp-green)' : 'var(--sp-text-sub)', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '7px' }}>
            <i className={`fas ${notifPerm === 'denied' ? 'fa-bell-slash' : 'fa-bell'}`}></i>
            {notifPerm === 'denied' ? 'Alerts Blocked' : notifOn ? 'Alerts On' : 'Enable Alerts'}
          </button>
        )}
      </div>

      {/* Warnings */}
      {error && <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', background: 'rgba(217,64,64,0.08)', border: 'none', color: '#FF3B30', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.01em' }}><i className="fas fa-circle-exclamation"></i>{error}</div>}
      {permState === 'denied' && <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', background: 'rgba(229,149,42,0.08)', border: 'none', color: 'var(--sp-warning)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.01em' }}><i className="fas fa-triangle-exclamation"></i>Location blocked — browser Settings → Site Permissions → Location → Allow.</div>}

      {timings && (
        <>
          {/* ══ PRAYER TRACKER ══ */}
          <div style={{ background: 'var(--sp-bg-card)', borderRadius: '20px', padding: '24px 28px', marginBottom: '16px', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.15rem', color: 'var(--sp-text)', letterSpacing: '-0.01em' }}>Today's Prayers</div>
                <div style={{ color: 'var(--sp-text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>{done.length} of 5 completed · tap a prayer to mark done</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {PRAYERS.filter(p => !p.notPrayer).map(p => (
                  <button key={p.key} onClick={() => toggleDone(p.key)} title={p.english} style={{ width: '40px', height: '40px', borderRadius: '10px', border: 'none', background: done.includes(p.key) ? `${p.color}15` : 'rgba(142,142,147,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {done.includes(p.key)
                      ? <i className="fas fa-check" style={{ color: p.color, fontSize: '0.85rem' }}></i>
                      : <i className={`fas ${p.icon}`} style={{ color: 'var(--sp-text-muted)', fontSize: '0.8rem' }}></i>
                    }
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: '5px', background: 'var(--sp-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: `linear-gradient(90deg, var(--sp-green), var(--sp-teal))`, width: `${(done.length / 5) * 100}%`, transition: 'width 0.4s', borderRadius: '3px' }} />
            </div>
          </div>

          {/* ══ PRAYER CARDS ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {PRAYERS.map(prayer => {
              const status = prayer.notPrayer ? 'info' : getStatus(prayer.key)
              const time   = timings[prayer.key]
              const isNext = status === 'next'
              const isPast = status === 'past'
              const isDone = done.includes(prayer.key)
              const pc     = prayer.color

              return (
                <div key={prayer.key} onClick={() => !prayer.notPrayer && toggleDone(prayer.key)}
                  style={{ borderRadius: '20px', overflow: 'hidden', cursor: prayer.notPrayer ? 'default' : 'pointer', border: 'none', background: isNext ? `${pc}0a` : 'var(--sp-bg-card)', opacity: isPast && !isNext ? 0.55 : 1, transition: 'all 0.2s', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ height: '3px', background: isNext ? `linear-gradient(90deg, ${pc}, transparent)` : isDone ? `${pc}60` : 'transparent' }} />
                  <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: isNext ? `${pc}20` : 'var(--sp-bg-highlight)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isDone && !prayer.notPrayer
                        ? <i className="fas fa-check" style={{ color: pc, fontSize: '0.95rem' }}></i>
                        : <i className={`fas ${prayer.icon}`} style={{ color: isNext ? pc : 'var(--sp-text-muted)', fontSize: '1rem' }}></i>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
                        <span style={{ color: 'var(--sp-text)', fontWeight: isNext ? 600 : 600, fontSize: '1rem', letterSpacing: '-0.01em' }}>{prayer.english}</span>
                        {isNext && <span style={{ background: pc, color: '#fff', fontSize: '0.58rem', fontWeight: 600, padding: '2px 7px', borderRadius: '16px', letterSpacing: '0.06em' }}>NEXT</span>}
                        {isDone && !prayer.notPrayer && !isNext && <span style={{ color: pc, fontSize: '0.72rem', fontWeight: 600 }}>Done ✓</span>}
                      </div>
                      <div style={{ color: 'var(--sp-text-muted)', fontSize: '0.82rem', fontFamily: 'Amiri, serif' }}>{prayer.arabic} · {prayer.desc}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: isNext ? pc : 'var(--sp-text)', fontWeight: 600, fontSize: '1.05rem', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{fmt12(time)}</div>
                      <div style={{ color: 'var(--sp-text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>{time}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ══ BOTTOM ROW: Qibla + Overview ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: qibla ? '1fr 1fr' : '1fr', gap: '12px' }}>

            {qibla !== null && (
              <div style={{ background: '#0F1E1A', borderRadius: '20px', padding: '28px', textAlign: 'center', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '-0.01em' }}>
                  <i className="fas fa-compass" style={{ color: npColor }}></i> Qibla Direction
                </div>

                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginBottom: '24px' }}>Direction of Mecca from your location</div>
                <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 18px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: 'none' }}>
                  {[['N', '-50%', '-8px'], ['S', '-50%', 'auto'], ['E', '-8px', '-50%'], ['W', 'auto', '-50%']].map(([l, lx, ly], i) => (
                    <div key={l} style={{ position: 'absolute', ...(i < 2 ? { left: '50%', transform: `translateX(${lx})`, [i === 0 ? 'top' : 'bottom']: ly === '-8px' ? '4px' : '4px' } : { top: '50%', transform: `translateY(${lx})`, [l === 'E' ? 'right' : 'left']: '4px' }), color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem', fontWeight: 700 }}>{l}</div>
                  ))}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${qibla}deg)`, width: '4px', height: '80px', transformOrigin: '50% 100%' }}>
                    <div style={{ width: '4px', height: '40px', background: npColor, borderRadius: '3px 3px 0 0' }} />
                    <div style={{ width: '4px', height: '40px', background: 'rgba(255,255,255,0.15)', borderRadius: '0 0 3px 3px' }} />
                  </div>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '10px', height: '10px', borderRadius: '50%', background: npColor }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%,-50%) rotate(${qibla}deg) translateY(-46px)`, fontSize: '0.9rem' }}>🕋</div>
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.8rem', marginBottom: '4px', letterSpacing: '-0.03em' }}>{Math.round(qibla)}°</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>
                  {['N','NE','E','SE','S','SW','W','NW'][Math.round(qibla / 45) % 8]} toward Mecca
                </div>
              </div>
            )}

            <div style={{ background: 'var(--sp-bg-card)', borderRadius: '20px', padding: '28px', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--sp-text)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.01em' }}>
                <i className="fas fa-list-check" style={{ color: 'var(--sp-green)' }}></i> Schedule Overview
              </div>
              {PRAYERS.filter(p => !p.notPrayer).map(p => {
                const st = getStatus(p.key)
                return (
                  <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: done.includes(p.key) ? p.color : st === 'next' ? p.color : 'var(--sp-border)' }} />
                    <span style={{ flex: 1, color: st === 'next' ? 'var(--sp-text)' : 'var(--sp-text-sub)', fontSize: '0.88rem', fontWeight: st === 'next' ? 700 : 400 }}>{p.english}</span>
                    <span style={{ color: st === 'next' ? p.color : 'var(--sp-text-sub)', fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums', fontWeight: st === 'next' ? 700 : 400 }}>{fmt12(timings[p.key])}</span>
                    {done.includes(p.key) && <i className="fas fa-check" style={{ color: p.color, fontSize: '0.7rem' }}></i>}
                  </div>
                )
              })}
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '0.5px solid rgba(60,60,67,0.06)', color: 'var(--sp-text-muted)', fontSize: '0.72rem' }}>
                {curMethod?.full}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes adhan-slide { from { opacity:0; transform:translateX(-50%) translateY(-16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </div>
  )
}
