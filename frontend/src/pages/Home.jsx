import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import TrackMenu from '../components/TrackMenu'
import BannerAd from '../components/BannerAd'
import SponsoredTrack from '../components/SponsoredTrack'

/* ─── Islamic star polygons ─────────────────────────────────────────────────
   8-pointed: authentic inner ratio sin(22.5°)/sin(67.5°)
   12-pointed Khatam (Rub el Hizb / Star of David variant)
─────────────────────────────────────────────────────────────────────────── */
const S8  = "10,1 11.42,6.58 16.36,3.64 13.42,8.58 19,10 13.42,11.42 16.36,16.36 11.42,13.42 10,19 8.58,13.42 3.64,16.36 6.58,11.42 1,10 6.58,8.58 3.64,3.64 8.58,6.58"
const S12 = "10,1 11.04,6.14 14.5,2.21 12.83,7.17 17.79,5.5 13.86,8.97 19,10 13.86,11.04 17.79,14.5 12.83,12.83 14.5,17.79 11.04,13.86 10,19 8.97,13.86 5.5,17.79 7.17,12.83 2.21,14.5 6.14,11.04 1,10 6.14,8.97 2.21,5.5 7.17,7.17 5.5,2.21 8.97,6.14"

function Star8({ size = 18, color = '#C9A24D', filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
      <polygon points={S8} fill={filled ? color : 'none'} stroke={color} strokeWidth={filled ? 0 : 1.2} strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Owner badge (mini) for track artist names ────────────────────────── */
function OwnerBadgeMini() {
  return (
    <span className="ihm-owner-pill">
      <img src="/hero-logo.png" alt="" className="ihm-owner-pill-logo" />
    </span>
  )
}

function ArtistName({ user }) {
  const name = user?.profile?.display_name || user?.name || 'Unknown'
  const isFounder = user?.profile?.is_founder
  return (
    <span className="ihm-artist-name-wrap">
      {name}{isFounder && <OwnerBadgeMini />}
    </span>
  )
}

/* ─── Hero SVG background: authentic 8-star tiling ──────────────────────── */
function HeroPattern() {
  return (
    <svg className="ihm-hero-bg-svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <pattern id="islamic-8star" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <polygon points="50,27.5 53.56,41.45 65.91,34.09 58.55,46.44 72.5,50 58.55,53.56 65.91,65.91 53.56,58.55 50,72.5 46.44,58.55 34.09,65.91 41.45,53.56 27.5,50 41.45,46.44 34.09,34.09 46.44,41.45"
            fill="none" stroke="rgba(201,162,77,0.28)" strokeWidth="0.75" strokeLinejoin="round" />
          <polyline points="22.5,0 8.59,3.56 15.91,15.91 3.56,8.59 0,22.5" fill="none" stroke="rgba(201,162,77,0.22)" strokeWidth="0.75" />
          <polyline points="100,22.5 96.44,8.59 84.09,15.91 91.41,3.56 77.5,0" fill="none" stroke="rgba(201,162,77,0.22)" strokeWidth="0.75" />
          <polyline points="0,77.5 3.56,91.41 15.91,84.09 8.59,96.44 22.5,100" fill="none" stroke="rgba(201,162,77,0.22)" strokeWidth="0.75" />
          <polyline points="77.5,100 91.41,96.44 84.09,84.09 96.44,91.41 100,77.5" fill="none" stroke="rgba(201,162,77,0.22)" strokeWidth="0.75" />
          <line x1="50" y1="27.5" x2="50" y2="0" stroke="rgba(201,162,77,0.14)" strokeWidth="0.75" />
          <line x1="72.5" y1="50" x2="100" y2="50" stroke="rgba(201,162,77,0.14)" strokeWidth="0.75" />
          <line x1="50" y1="72.5" x2="50" y2="100" stroke="rgba(201,162,77,0.14)" strokeWidth="0.75" />
          <line x1="27.5" y1="50" x2="0" y2="50" stroke="rgba(201,162,77,0.14)" strokeWidth="0.75" />
          <line x1="34.09" y1="34.09" x2="15.91" y2="15.91" stroke="rgba(201,162,77,0.16)" strokeWidth="0.75" />
          <line x1="65.91" y1="34.09" x2="84.09" y2="15.91" stroke="rgba(201,162,77,0.16)" strokeWidth="0.75" />
          <line x1="65.91" y1="65.91" x2="84.09" y2="84.09" stroke="rgba(201,162,77,0.16)" strokeWidth="0.75" />
          <line x1="34.09" y1="65.91" x2="15.91" y2="84.09" stroke="rgba(201,162,77,0.16)" strokeWidth="0.75" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic-8star)" />
    </svg>
  )
}

/* ─── Animated 12-star rosette ───────────────────────────────────────────── */
function HeroRosette() {
  return (
    <svg className="ihm-hero-rosette" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180
        const r = 90, cx = 110 + r * Math.cos(a), cy = 110 + r * Math.sin(a)
        return <g key={i} transform={`translate(${cx - 8},${cy - 8})`}><polygon points={S8} fill="none" stroke="rgba(201,162,77,0.5)" strokeWidth="0.9" /></g>
      })}
      <g transform="translate(68,68)">
        <polygon points={S12.split(' ').map(p => { const [x,y]=p.split(',').map(Number); return `${(x-10)*3.4+42},${(y-10)*3.4+42}` }).join(' ')}
          fill="none" stroke="rgba(201,162,77,0.7)" strokeWidth="1.1" strokeLinejoin="round" />
      </g>
      <g transform="translate(84,84)">
        <polygon points={S8.split(' ').map(p => { const [x,y]=p.split(',').map(Number); return `${(x-10)*2.2+26},${(y-10)*2.2+26}` }).join(' ')}
          fill="rgba(201,162,77,0.15)" stroke="rgba(201,162,77,0.8)" strokeWidth="1" strokeLinejoin="round" />
      </g>
      <circle cx="110" cy="110" r="60" fill="none" stroke="rgba(201,162,77,0.2)" strokeWidth="0.8" strokeDasharray="3 5" />
      <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(201,162,77,0.12)" strokeWidth="0.6" />
      <circle cx="110" cy="110" r="4" fill="rgba(201,162,77,0.6)" />
    </svg>
  )
}

/* ─── Category icons ─────────────────────────────────────────────────────── */
const Icons = {
  fire:      ({ c }) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4.5 0 7-3 7-7 0-5.5-4.5-9.5-5.5-11-1 3.5-3.5 4.5-4.5 3.5 1 3-1 5.5-3 6.5A5 5 0 0012 22z"/><path d="M12 17a2.5 2.5 0 001-4.5"/></svg>,
  nasheed:   ({ c }) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="10.5" cy="16.5" rx="6" ry="4.5"/><path d="M16.5 10V4l5 1.5v6"/><path d="M16.5 10l5 1.5"/><line x1="7" y1="16.5" x2="7" y2="8"/></svg>,
  quran:     ({ c }) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="12" y1="2" x2="12" y2="22"/><path d="M8 7h3M8 10h3M8 13h3"/><path d="M13 7h3M13 10h3M13 13h3"/></svg>,
  dua:       ({ c }) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 9v3a6 6 0 01-12 0V9"/><path d="M9 9V7a3 3 0 016 0v2"/><path d="M12 18v3"/><path d="M8 21h8"/><path d="M12 3V1"/><path d="M7.5 3.5L6 2M16.5 3.5L18 2"/></svg>,
  lecture:   ({ c }) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4" r="2"/><path d="M9 8l-4 13h14L15 8"/><path d="M9 14h6"/><path d="M10 8h4"/></svg>,
  stories:   ({ c }) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/><path d="M6 8h2M6 12h2M16 8h2M16 12h2"/></svg>,
  broadcast: ({ c }) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5a7 7 0 0114 0"/><path d="M1.5 9a11 11 0 0121 0"/><path d="M8.5 16a3.5 3.5 0 017 0"/><circle cx="12" cy="19" r="1" fill={c}/></svg>,
}

/* ─── Category → icon + colour + gradient lookup ──────────────────────── */
const CATEGORY_MAP = {
  nasheeds:  { icon: 'nasheed',   color: '#1F7A5A', gradient: 'linear-gradient(135deg, #1a5c3a, #0d3d28)' },
  quran:     { icon: 'quran',     color: '#2A6B4F', gradient: 'linear-gradient(135deg, #1a4a32, #0a2a1a)' },
  duas:      { icon: 'dua',       color: '#C9A24D', gradient: 'linear-gradient(135deg, #5a4310, #2a1e08)' },
  lectures:  { icon: 'lecture',   color: '#4B7BBE', gradient: 'linear-gradient(135deg, #1a3560, #0d1e38)' },
  stories:   { icon: 'stories',   color: '#7B59B6', gradient: 'linear-gradient(135deg, #3d1a5a, #1e0d30)' },
  broadcast: { icon: 'broadcast', color: '#C05040', gradient: 'linear-gradient(135deg, #5a2020, #2a1010)' },
}
function getCategoryArt(category) {
  if (!category) return { icon: 'fire', color: '#C9A24D', gradient: 'linear-gradient(135deg, #2a1e08, #1a1206)' }
  const key = category.toLowerCase()
  return CATEGORY_MAP[key] ||
    Object.entries(CATEGORY_MAP).find(([k]) => key.startsWith(k) || k.startsWith(key))?.[1] ||
    { icon: 'fire', color: '#C9A24D', gradient: 'linear-gradient(135deg, #2a1e08, #1a1206)' }
}

/* ─── Per-category illustrated SVG placeholder art ───────────────────────
   Every artwork has three layers:
     1. Dark gradient BG + subtle radial warmth glow
     2. 3×3 faint 8-star tessellation background
     3. Thin decorative border frame with corner 8-stars
     4. Elaborate category-specific Islamic illustration
─────────────────────────────────────────────────────────────────────────── */
function CategoryArt({ icon = 'fire', color = '#C9A24D' }) {
  const BG = {
    quran:     ['#061210', '#14362A'],
    nasheed:   ['#071510', '#11291E'],
    dua:       ['#190F01', '#382600'],
    lecture:   ['#070C1A', '#101C36'],
    stories:   ['#0C071E', '#1A1038'],
    broadcast: ['#160604', '#341008'],
    fire:      ['#140E06', '#2A1E06'],
  }
  const [bg0, bg1] = BG[icon] || BG.fire
  const c = color
  const hex = c.replace('#','')
  const cr = parseInt(hex.slice(0,2),16), cg = parseInt(hex.slice(2,4),16), cb = parseInt(hex.slice(4,6),16)
  const a = op => `rgba(${cr},${cg},${cb},${op})`

  const s8  = (cx,cy,r) => S8.split(' ').map(p=>{const[x,y]=p.split(',').map(Number);return`${(x-10)*r/10+cx},${(y-10)*r/10+cy}`}).join(' ')
  const s12 = (cx,cy,r) => S12.split(' ').map(p=>{const[x,y]=p.split(',').map(Number);return`${(x-10)*r/10+cx},${(y-10)*r/10+cy}`}).join(' ')

  const base = { viewBox:'0 0 100 100', fill:'none', xmlns:'http://www.w3.org/2000/svg', style:{position:'absolute',inset:0,width:'100%',height:'100%'} }

  // Shared decorative frame: outer border + corner 8-stars
  const frame = <>
    <rect x="3" y="3" width="94" height="94" stroke={a(0.18)} strokeWidth="0.55"/>
    {[[3.5,3.5],[96.5,3.5],[3.5,96.5],[96.5,96.5]].map(([cx,cy],i)=>(
      <polygon key={i} points={s8(cx,cy,3.8)} stroke={a(0.28)} strokeWidth="0.4" strokeLinejoin="round"/>
    ))}
  </>

  // Shared 3×3 background 8-star lattice (very faint)
  const lattice = [18,50,82].flatMap(cx=>[18,50,82].map(cy=>(
    <polygon key={`${cx}-${cy}`} points={s8(cx,cy,13)} stroke={a(0.055)} strokeWidth="0.45" strokeLinejoin="round"/>
  )))

  /* ══ QURAN: Moorish horseshoe arch + Khatam medallion + open Mushaf ══ */
  if (icon === 'quran') return (
    <svg {...base}>
      <defs>
        <linearGradient id="cq-bg" x1="0" y1="0" x2="70" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={bg0}/><stop offset="100%" stopColor={bg1}/></linearGradient>
        <radialGradient id="cq-gw" cx="50%" cy="58%" r="46%"><stop offset="0%" stopColor={c} stopOpacity="0.09"/><stop offset="100%" stopColor={c} stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#cq-bg)"/>
      <rect width="100" height="100" fill="url(#cq-gw)"/>
      {lattice}{frame}
      {/* ── Khatam medallion at top ── */}
      <polygon points={s12(50,22,11)} fill={a(0.09)} stroke={a(0.38)} strokeWidth="0.55" strokeLinejoin="round"/>
      <polygon points={s8(50,22,7.5)} fill={a(0.12)} stroke={a(0.32)} strokeWidth="0.5" strokeLinejoin="round"/>
      <circle cx="50" cy="22" r="3.2" fill={a(0.28)} stroke={a(0.48)} strokeWidth="0.4"/>
      {/* ── Horseshoe arch (Moorish) ── */}
      <path d="M 29 84 L 29 59 C 29 56 28 54 29 51 C 29 26 71 26 71 51 C 72 54 71 56 71 59 L 71 84" fill={a(0.10)} stroke={a(0.30)} strokeWidth="0.85"/>
      {/* Inner arch tracery */}
      <path d="M 34 84 L 34 61 C 34 58 33 56 34 53 C 34 30 66 30 66 53 C 67 56 66 58 66 61 L 66 84" fill="none" stroke={a(0.14)} strokeWidth="0.45"/>
      {/* Arch keystone star */}
      <polygon points={s8(50,33,5)} fill={a(0.16)} stroke={a(0.42)} strokeWidth="0.5" strokeLinejoin="round"/>
      {/* Muqarnas hanging elements */}
      <path d="M 37 56 Q 39.5 60 42 56 Q 44.5 60 47 56 Q 49.5 60 53 56 Q 55.5 60 58 56 Q 60.5 60 63 56" fill="none" stroke={a(0.28)} strokeWidth="0.7"/>
      {/* Open Mushaf pages */}
      <path d="M 21 62 Q 50 53 79 62 L 79 82 Q 50 73 21 82 Z" fill={a(0.13)} stroke={a(0.34)} strokeWidth="0.75"/>
      <rect x="48.5" y="53" width="3" height="29" fill={a(0.20)} stroke={a(0.32)} strokeWidth="0.3"/>
      {/* Left page lines */}
      <line x1="25" y1="66" x2="45.5" y2="64" stroke={a(0.28)} strokeWidth="0.6"/>
      <line x1="25" y1="70.5" x2="45.5" y2="68.5" stroke={a(0.28)} strokeWidth="0.6"/>
      <line x1="25" y1="75" x2="45.5" y2="73" stroke={a(0.20)} strokeWidth="0.6"/>
      <line x1="28" y1="78.5" x2="43" y2="77" stroke={a(0.16)} strokeWidth="0.6"/>
      {/* Right page lines */}
      <line x1="54.5" y1="64" x2="75" y2="66" stroke={a(0.28)} strokeWidth="0.6"/>
      <line x1="54.5" y1="68.5" x2="75" y2="70.5" stroke={a(0.28)} strokeWidth="0.6"/>
      <line x1="54.5" y1="73" x2="75" y2="75" stroke={a(0.20)} strokeWidth="0.6"/>
      <line x1="57" y1="77" x2="72" y2="78.5" stroke={a(0.16)} strokeWidth="0.6"/>
      {/* Crescent + star */}
      <path d="M 50 8 Q 57.5 12.5 57.5 19 Q 50 15.5 42.5 19 Q 42.5 12.5 50 8 Z" fill={a(0.72)} stroke={a(0.86)} strokeWidth="0.35"/>
      <circle cx="55" cy="11" r="2" fill={c} opacity="0.92"/>
    </svg>
  )

  /* ══ NASHEED: Daf drum with Khatam skin pattern ══ */
  if (icon === 'nasheed') return (
    <svg {...base}>
      <defs>
        <linearGradient id="cn-bg" x1="0" y1="0" x2="70" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={bg0}/><stop offset="100%" stopColor={bg1}/></linearGradient>
        <radialGradient id="cn-gw" cx="50%" cy="56%" r="44%"><stop offset="0%" stopColor={c} stopOpacity="0.09"/><stop offset="100%" stopColor={c} stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#cn-bg)"/>
      <rect width="100" height="100" fill="url(#cn-gw)"/>
      {lattice}{frame}
      {/* Daf outer ring */}
      <circle cx="50" cy="55" r="32" fill={a(0.09)} stroke={a(0.28)} strokeWidth="1.05"/>
      <circle cx="50" cy="55" r="29.5" fill="none" stroke={a(0.12)} strokeWidth="0.35"/>
      {/* Drum skin: interlaced star pattern */}
      <polygon points={s8(50,55,23)} fill={a(0.09)} stroke={a(0.38)} strokeWidth="0.65" strokeLinejoin="round"/>
      <polygon points={s8(50,55,16)} fill={a(0.09)} stroke={a(0.28)} strokeWidth="0.5" strokeLinejoin="round"/>
      {/* Radial lines from outer star to inner */}
      {[0,45,90,135,180,225,270,315].map((deg,i)=>{
        const rad=deg*Math.PI/180
        return <line key={i} x1={50+23*Math.cos(rad)} y1={55+23*Math.sin(rad)} x2={50+5*Math.cos(rad)} y2={55+5*Math.sin(rad)} stroke={a(0.10)} strokeWidth="0.4"/>
      })}
      {/* Khatam centre medallion */}
      <polygon points={s12(50,55,9)} fill={a(0.14)} stroke={a(0.52)} strokeWidth="0.55" strokeLinejoin="round"/>
      <circle cx="50" cy="55" r="3.8" fill={a(0.30)} stroke={a(0.55)} strokeWidth="0.4"/>
      <circle cx="50" cy="55" r="1.4" fill={a(0.60)}/>
      {/* Rim pegs */}
      {[0,45,90,135,180,225,270,315].map((deg,i)=>{
        const rad=deg*Math.PI/180
        return (
          <g key={i}>
            <circle cx={50+32*Math.cos(rad)} cy={55+32*Math.sin(rad)} r="2.2" fill={a(0.40)} stroke={a(0.58)} strokeWidth="0.3"/>
            <line x1={50+26*Math.cos(rad)} y1={55+26*Math.sin(rad)} x2={50+29.5*Math.cos(rad)} y2={55+29.5*Math.sin(rad)} stroke={a(0.16)} strokeWidth="0.4"/>
          </g>
        )
      })}
      {/* Music waves above */}
      <path d="M 20 19 Q 26 13 32 19 Q 38 25 44 19 Q 50 13 56 19" stroke={a(0.40)} strokeWidth="0.8" fill="none"/>
      <path d="M 24 24.5 Q 28.5 19 33 24.5 Q 37.5 30 42 24.5" stroke={a(0.24)} strokeWidth="0.55" fill="none"/>
      {/* Accent star top-right */}
      <polygon points={s8(79,18,6)} fill={a(0.12)} stroke={a(0.38)} strokeWidth="0.45" strokeLinejoin="round"/>
      <circle cx="79" cy="18" r="1.4" fill={a(0.48)}/>
    </svg>
  )

  /* ══ DUA / DHIKR: Tasbih ring + large crescent + arabesque ══ */
  if (icon === 'dua') return (
    <svg {...base}>
      <defs>
        <linearGradient id="cd-bg" x1="0" y1="0" x2="70" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={bg0}/><stop offset="100%" stopColor={bg1}/></linearGradient>
        <radialGradient id="cd-gw" cx="50%" cy="46%" r="46%"><stop offset="0%" stopColor={c} stopOpacity="0.11"/><stop offset="100%" stopColor={c} stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#cd-bg)"/>
      <rect width="100" height="100" fill="url(#cd-gw)"/>
      {lattice}{frame}
      {/* Tasbih thread (dashed ring) */}
      <circle cx="50" cy="55" r="34" stroke={a(0.12)} strokeWidth="0.4" strokeDasharray="1.2 5.2"/>
      {/* 33 beads — every 11th slightly larger */}
      {Array.from({length:33},(_,i)=>{
        const ang=(i*360/33-90)*Math.PI/180
        const bx=50+34*Math.cos(ang), by=55+34*Math.sin(ang)
        const big = i%11===0
        return <circle key={i} cx={bx} cy={by} r={big?2.8:1.9} fill={a(big?0.52:0.28)} stroke={a(big?0.70:0.44)} strokeWidth="0.3"/>
      })}
      {/* Imam bead at top */}
      <ellipse cx="50" cy="19.5" rx="4.2" ry="7" fill={a(0.44)} stroke={a(0.66)} strokeWidth="0.45"/>
      <line x1="50" y1="26.5" x2="50" y2="30" stroke={a(0.40)} strokeWidth="0.6"/>
      {/* Large crescent moon */}
      <path d="M 50 33 Q 63 40 63 55 Q 50 50 37 55 Q 37 40 50 33 Z" fill={a(0.65)} stroke={a(0.82)} strokeWidth="0.4"/>
      {/* Arabesque inside crescent (4-petal flower) */}
      <path d="M 50 38 Q 53 44.5 50 51 Q 47 44.5 50 38 Z" fill={a(0.22)} stroke="none"/>
      <path d="M 45 44.5 Q 51.5 41.5 58 44.5 Q 51.5 47.5 45 44.5 Z" fill={a(0.22)} stroke="none"/>
      {/* Companion star */}
      <polygon points={s8(63,32,5.5)} fill={a(0.62)} stroke={a(0.82)} strokeWidth="0.4" strokeLinejoin="round"/>
      <circle cx="63" cy="32" r="1.6" fill={c} opacity="0.92"/>
      {/* Scattered stars */}
      <circle cx="18" cy="22" r="1.3" fill={a(0.42)}/>
      <circle cx="29" cy="15" r="1.9" fill={a(0.56)}/>
      <circle cx="72" cy="20" r="1.2" fill={a(0.38)}/>
      <circle cx="82" cy="30" r="0.9" fill={a(0.32)}/>
      <circle cx="20" cy="36" r="0.8" fill={a(0.28)}/>
    </svg>
  )

  /* ══ LECTURES: Andalusian mosque with minarets at night ══ */
  if (icon === 'lecture') return (
    <svg {...base}>
      <defs>
        <linearGradient id="cl-bg" x1="0" y1="0" x2="70" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={bg0}/><stop offset="100%" stopColor={bg1}/></linearGradient>
        <radialGradient id="cl-gw" cx="50%" cy="62%" r="46%"><stop offset="0%" stopColor={c} stopOpacity="0.07"/><stop offset="100%" stopColor={c} stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#cl-bg)"/>
      <rect width="100" height="100" fill="url(#cl-gw)"/>
      {lattice}{frame}
      {/* Night-sky stars */}
      {[[13,18],[24,11],[39,17],[61,13],[76,19],[86,11],[91,24],[10,29],[44,10],[56,7]].map(([sx,sy],i)=>(
        <circle key={i} cx={sx} cy={sy} r={i%3===0?1.7:1.0} fill={a(i%3===0?0.55:0.32)}/>
      ))}
      {/* Ground */}
      <line x1="7" y1="89" x2="93" y2="89" stroke={a(0.20)} strokeWidth="0.6"/>
      {/* Side minarets */}
      <rect x="8"  y="51" width="11" height="38" rx="1.5" fill={a(0.12)} stroke={a(0.24)} strokeWidth="0.6"/>
      <path d="M 8 53 C 8 45 19 45 19 53" fill={a(0.18)} stroke={a(0.30)} strokeWidth="0.5"/>
      <path d="M 10 62 C 10 58.5 17 58.5 17 62 L 17 67 L 10 67 Z" fill={a(0.15)} stroke={a(0.26)} strokeWidth="0.4"/>
      <path d="M 10 72 C 10 68.5 17 68.5 17 72 L 17 77 L 10 77 Z" fill={a(0.15)} stroke={a(0.26)} strokeWidth="0.4"/>
      <circle cx="13.5" cy="45" r="1.9" fill={a(0.60)}/>
      <rect x="81" y="51" width="11" height="38" rx="1.5" fill={a(0.12)} stroke={a(0.24)} strokeWidth="0.6"/>
      <path d="M 81 53 C 81 45 92 45 92 53" fill={a(0.18)} stroke={a(0.30)} strokeWidth="0.5"/>
      <path d="M 83 62 C 83 58.5 90 58.5 90 62 L 90 67 L 83 67 Z" fill={a(0.15)} stroke={a(0.26)} strokeWidth="0.4"/>
      <path d="M 83 72 C 83 68.5 90 68.5 90 72 L 90 77 L 83 77 Z" fill={a(0.15)} stroke={a(0.26)} strokeWidth="0.4"/>
      <circle cx="86.5" cy="45" r="1.9" fill={a(0.60)}/>
      {/* Main mosque body */}
      <rect x="19" y="69" width="62" height="20" fill={a(0.12)} stroke={a(0.24)} strokeWidth="0.6"/>
      {/* Main dome (horseshoe arch) */}
      <path d="M 21 69 C 21 42 79 42 79 69" fill={a(0.14)} stroke={a(0.28)} strokeWidth="0.85"/>
      <path d="M 27 69 C 27 48 73 48 73 69" fill="none" stroke={a(0.12)} strokeWidth="0.4"/>
      {/* Side arch windows */}
      <path d="M 24 78 C 24 72.5 31 72.5 31 78 L 31 84 L 24 84 Z" fill={a(0.14)} stroke={a(0.24)} strokeWidth="0.4"/>
      <path d="M 69 78 C 69 72.5 76 72.5 76 78 L 76 84 L 69 84 Z" fill={a(0.14)} stroke={a(0.24)} strokeWidth="0.4"/>
      {/* Central arch door */}
      <path d="M 40 89 L 40 73 C 40 65 60 65 60 73 L 60 89" fill={a(0.14)} stroke={a(0.24)} strokeWidth="0.6"/>
      {/* Central minaret (tallest) */}
      <rect x="45" y="32" width="10" height="40" rx="1.5" fill={a(0.14)} stroke={a(0.26)} strokeWidth="0.65"/>
      <path d="M 45 34 C 45 26 55 26 55 34" fill={a(0.20)} stroke={a(0.30)} strokeWidth="0.5"/>
      <path d="M 46.5 26 C 46.5 20 53.5 20 53.5 26" fill={a(0.22)} stroke={a(0.34)} strokeWidth="0.5"/>
      {/* Central window */}
      <path d="M 47 48 C 47 44 53 44 53 48 L 53 54 L 47 54 Z" fill={a(0.15)} stroke={a(0.26)} strokeWidth="0.4"/>
      {/* Crescent finial */}
      <path d="M 50 13 Q 56.5 17 56.5 23.5 Q 50 20 43.5 23.5 Q 43.5 17 50 13 Z" fill={a(0.80)} stroke={a(0.92)} strokeWidth="0.3"/>
      <circle cx="54" cy="16.5" r="1.9" fill={c} opacity="0.94"/>
    </svg>
  )

  /* ══ STORIES: Illuminated manuscript with arabesque ══ */
  if (icon === 'stories') return (
    <svg {...base}>
      <defs>
        <linearGradient id="cs-bg" x1="0" y1="0" x2="70" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={bg0}/><stop offset="100%" stopColor={bg1}/></linearGradient>
        <radialGradient id="cs-gw" cx="50%" cy="50%" r="46%"><stop offset="0%" stopColor={c} stopOpacity="0.08"/><stop offset="100%" stopColor={c} stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#cs-bg)"/>
      <rect width="100" height="100" fill="url(#cs-gw)"/>
      {lattice}{frame}
      {/* Geometric interlace inner border */}
      <rect x="9" y="9" width="82" height="82" stroke={a(0.16)} strokeWidth="0.55"/>
      {[[9.5,9.5],[90.5,9.5],[9.5,90.5],[90.5,90.5]].map(([cx,cy],i)=>(
        <polygon key={i} points={s8(cx,cy,5)} fill={a(0.08)} stroke={a(0.28)} strokeWidth="0.4" strokeLinejoin="round"/>
      ))}
      {/* Scroll body */}
      <rect x="13" y="22" width="74" height="60" rx="2" fill={a(0.10)} stroke={a(0.25)} strokeWidth="0.7"/>
      {/* Scroll rolls */}
      <ellipse cx="50" cy="22" rx="37" ry="5.5" fill={a(0.18)} stroke={a(0.27)} strokeWidth="0.65"/>
      <ellipse cx="50" cy="82" rx="37" ry="5.5" fill={a(0.18)} stroke={a(0.27)} strokeWidth="0.65"/>
      {/* Shamsa (header star) */}
      <polygon points={s8(50,36,9.5)} fill={a(0.12)} stroke={a(0.48)} strokeWidth="0.65" strokeLinejoin="round"/>
      <circle cx="50" cy="36" r="3.5" fill={a(0.28)} stroke={a(0.55)} strokeWidth="0.4"/>
      <circle cx="50" cy="36" r="1.3" fill={a(0.55)}/>
      {/* Arabesque divider */}
      <path d="M 17 47 Q 26 41 35 47 Q 43 52 50 47 Q 57 42 65 47 Q 74 52 83 47" stroke={a(0.42)} strokeWidth="0.8" fill="none"/>
      <path d="M 17 48.5 Q 26 54.5 35 48.5 Q 43 43.5 50 48.5 Q 57 53.5 65 48.5 Q 74 43.5 83 48.5" stroke={a(0.18)} strokeWidth="0.4" fill="none"/>
      {/* Text lines */}
      <line x1="19" y1="57" x2="81" y2="57" stroke={a(0.26)} strokeWidth="0.6"/>
      <line x1="19" y1="63" x2="81" y2="63" stroke={a(0.26)} strokeWidth="0.6"/>
      <line x1="19" y1="69" x2="81" y2="69" stroke={a(0.26)} strokeWidth="0.6"/>
      <line x1="19" y1="75" x2="58" y2="75" stroke={a(0.18)} strokeWidth="0.6"/>
      {/* Stars outside scroll */}
      <circle cx="16" cy="13" r="1.6" fill={a(0.45)}/>
      <circle cx="50" cy="8"  r="2.3" fill={a(0.62)}/>
      <circle cx="84" cy="13" r="1.6" fill={a(0.45)}/>
    </svg>
  )

  /* ══ BROADCAST: Signal arcs + crescent focal + tower ══ */
  if (icon === 'broadcast') return (
    <svg {...base}>
      <defs>
        <linearGradient id="cb-bg" x1="0" y1="0" x2="70" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={bg0}/><stop offset="100%" stopColor={bg1}/></linearGradient>
        <radialGradient id="cb-gw" cx="50%" cy="57%" r="50%"><stop offset="0%" stopColor={c} stopOpacity="0.11"/><stop offset="100%" stopColor={c} stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#cb-bg)"/>
      <rect width="100" height="100" fill="url(#cb-gw)"/>
      {lattice}{frame}
      {/* 5 concentric signal arcs */}
      <path d="M 9 76 Q 9 18 50 18 Q 91 18 91 76" fill="none" stroke={a(0.11)} strokeWidth="0.7"/>
      <path d="M 17 79 Q 17 26 50 26 Q 83 26 83 79" fill="none" stroke={a(0.17)} strokeWidth="0.8"/>
      <path d="M 25 82 Q 25 34 50 34 Q 75 34 75 82" fill="none" stroke={a(0.26)} strokeWidth="0.9"/>
      <path d="M 33 85 Q 33 42 50 42 Q 67 42 67 85" fill="none" stroke={a(0.38)} strokeWidth="0.9"/>
      <path d="M 41 88 Q 41 51 50 51 Q 59 51 59 88" fill="none" stroke={a(0.54)} strokeWidth="0.95"/>
      {/* Dot nodes on arcs */}
      {[[50,18],[50,26],[50,34],[50,42],[50,51]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={1.1} fill={a(0.30+(i*0.1))}/>
      ))}
      {/* Tower pole */}
      <line x1="50" y1="18" x2="50" y2="50" stroke={a(0.34)} strokeWidth="0.85"/>
      {/* Cross braces */}
      <line x1="47" y1="26" x2="53" y2="31" stroke={a(0.20)} strokeWidth="0.4"/>
      <line x1="53" y1="26" x2="47" y2="31" stroke={a(0.20)} strokeWidth="0.4"/>
      <line x1="47" y1="35" x2="53" y2="40" stroke={a(0.20)} strokeWidth="0.4"/>
      <line x1="53" y1="35" x2="47" y2="40" stroke={a(0.20)} strokeWidth="0.4"/>
      {/* Antenna top */}
      <circle cx="50" cy="17" r="3.2" fill={a(0.55)} stroke={a(0.82)} strokeWidth="0.4"/>
      {/* Crescent focal point */}
      <path d="M 50 51 Q 60 57 60 67 Q 50 62 40 67 Q 40 57 50 51 Z" fill={a(0.74)} stroke={a(0.88)} strokeWidth="0.35"/>
      {/* Star */}
      <polygon points={s8(63,49,5.5)} fill={a(0.60)} stroke={a(0.78)} strokeWidth="0.4" strokeLinejoin="round"/>
      <circle cx="63" cy="49" r="1.6" fill={c} opacity="0.92"/>
    </svg>
  )

  /* ══ DEFAULT / FIRE: Full Alhambra-style Girih star lattice ══ */
  return (
    <svg {...base}>
      <defs>
        <linearGradient id="cf-bg" x1="0" y1="0" x2="70" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={bg0}/><stop offset="100%" stopColor={bg1}/></linearGradient>
        <radialGradient id="cf-gw" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={c} stopOpacity="0.11"/><stop offset="100%" stopColor={c} stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#cf-bg)"/>
      <rect width="100" height="100" fill="url(#cf-gw)"/>
      {frame}
      {/* Full Girih lattice: 9 8-stars tiling the plane */}
      {/* Cardinals at distance 50 (edge-adjacent) */}
      <polygon points={s8(50, 2,26)} fill={a(0.07)} stroke={a(0.20)} strokeWidth="0.55" strokeLinejoin="round"/>
      <polygon points={s8(50,98,26)} fill={a(0.07)} stroke={a(0.20)} strokeWidth="0.55" strokeLinejoin="round"/>
      <polygon points={s8( 2,50,26)} fill={a(0.07)} stroke={a(0.20)} strokeWidth="0.55" strokeLinejoin="round"/>
      <polygon points={s8(98,50,26)} fill={a(0.07)} stroke={a(0.20)} strokeWidth="0.55" strokeLinejoin="round"/>
      {/* Diagonals at corners */}
      <polygon points={s8( 2, 2,26)} fill={a(0.05)} stroke={a(0.15)} strokeWidth="0.5" strokeLinejoin="round"/>
      <polygon points={s8(98, 2,26)} fill={a(0.05)} stroke={a(0.15)} strokeWidth="0.5" strokeLinejoin="round"/>
      <polygon points={s8( 2,98,26)} fill={a(0.05)} stroke={a(0.15)} strokeWidth="0.5" strokeLinejoin="round"/>
      <polygon points={s8(98,98,26)} fill={a(0.05)} stroke={a(0.15)} strokeWidth="0.5" strokeLinejoin="round"/>
      {/* Centre 8-star */}
      <polygon points={s8(50,50,28)} fill={a(0.11)} stroke={a(0.34)} strokeWidth="0.75" strokeLinejoin="round"/>
      {/* Interlacing connector lines (from centre star tips to adjacent stars) */}
      {[0,45,90,135,180,225,270,315].map((deg,i)=>{
        const rad=deg*Math.PI/180
        return <line key={i} x1={50+28*Math.cos(rad)} y1={50+28*Math.sin(rad)} x2={50+48*Math.cos(rad)} y2={50+48*Math.sin(rad)} stroke={a(0.13)} strokeWidth="0.45"/>
      })}
      {/* Mid-cardinal small linking stars */}
      {[0,90,180,270].map((deg,i)=>{
        const rad=deg*Math.PI/180
        return <polygon key={i} points={s8(50+48*Math.cos(rad),50+48*Math.sin(rad),12)} fill={a(0.07)} stroke={a(0.18)} strokeWidth="0.45" strokeLinejoin="round"/>
      })}
      {/* Central Khatam + 8-star + disc */}
      <polygon points={s12(50,50,15)} fill={a(0.15)} stroke={a(0.52)} strokeWidth="0.6" strokeLinejoin="round"/>
      <polygon points={s8( 50,50,10)} fill={a(0.20)} stroke={a(0.58)} strokeWidth="0.6" strokeLinejoin="round"/>
      <circle cx="50" cy="50" r="4.5" fill={a(0.36)} stroke={a(0.62)} strokeWidth="0.4"/>
      <circle cx="50" cy="50" r="2"   fill={a(0.68)}/>
    </svg>
  )
}

/* ─── Ornamental inter-section divider ───────────────────────────────────── */
function IslamicDivider() {
  return (
    <div className="ihm-divider">
      <div className="ihm-divider-l" />
      <Star8 size={7} color="rgba(201,162,77,0.48)" filled />
      <div className="ihm-divider-r" />
    </div>
  )
}

/* ─── Section key → icon + colour mapping ──────────────────────────────── */
const SECTION_STYLES = {
  continue_listening: { icon: 'fire',      color: '#C9A24D' },
  trending:           { icon: 'fire',      color: '#E8653A' },
  recommended:        { icon: 'fire',      color: '#1F7A5A' },
  because_liked:      { icon: 'nasheed',   color: '#C9A24D' },
  new_releases:       { icon: 'fire',      color: '#C9A24D' },
  from_followed:      { icon: 'nasheed',   color: '#1F7A5A' },
  popular_category:   { icon: 'fire',      color: '#2A6B4F' },
  viral:              { icon: 'fire',      color: '#C05040' },
  rising_artists:     { icon: 'broadcast', color: '#7B59B6' },
  most_played:        { icon: 'fire',      color: '#4B7BBE' },
  nasheeds:           { icon: 'nasheed',   color: '#1F7A5A' },
  podcasts:           { icon: 'broadcast', color: '#C05040' },
  lectures:           { icon: 'lecture',   color: '#4B7BBE' },
}
function getSectionStyle(key) {
  return SECTION_STYLES[key] || { icon: 'fire', color: '#C9A24D' }
}

/* ─── Wave bars (playing indicator) ──────────────────────────────────────── */
function WaveBars() {
  return (
    <div className="brw-wave">
      {[0, 200, 400, 100, 300].map((d, i) => (
        <div key={i} className="brw-wave-bar" style={{ animationDelay: `${d}ms`, animationDuration: `${700 + i * 100}ms` }} />
      ))}
    </div>
  )
}

/* ─── Featured Card — Replit style large playlist card ────────────────── */
function FeaturedCard({ track, label, color, icon, isCurrent, isPlaying, onPlay, onNavigate }) {
  return (
    <div className="nsh-feat-card" onClick={onNavigate} style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)` }}>
      <div className="nsh-feat-overlay" />
      <div className="nsh-feat-inner">
        <span className="nsh-feat-label">{label}</span>
        <h3 className="nsh-feat-title">{track.title}</h3>
        <p className="nsh-feat-artist"><ArtistName user={track.user} /></p>
        <div className="nsh-feat-actions">
          <button
            className="nsh-feat-play"
            onClick={e => { e.stopPropagation(); onPlay() }}
          >
            {isCurrent && isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '1px' }} />}
          </button>
          <span className="nsh-feat-meta">{track.category || label}</span>
          <div className="nsh-feat-menu" onClick={e => e.stopPropagation()}>
            <TrackMenu track={track} size={14} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Featured Section ───────────────────────────────────────────────────── */
function FeaturedSection({ sectionTracks, allTracks, currentTrack, isPlaying, onPlay, navigate }) {
  const slots = [
    { key: 'nasheed',  label: 'Nasheeds',  color: '#1F7A5A', icon: 'nasheed'  },
    { key: 'quran',    label: 'Quran',     color: '#2A6B4F', icon: 'quran'    },
    { key: 'lectures', label: 'Lectures',  color: '#4B7BBE', icon: 'lecture'  },
  ]
  const featured = slots.map(s => ({ ...s, track: sectionTracks[s.key]?.[0] })).filter(f => f.track)
  if (featured.length < 2) return null
  return (
    <div className="ihm-featured">
      {featured.map(({ key, label, color, icon, track }) => (
        <FeaturedCard
          key={track.id} track={track} label={label} color={color} icon={icon}
          isCurrent={currentTrack?.id === track.id} isPlaying={isPlaying}
          onPlay={() => onPlay(track, sectionTracks[key] || allTracks)}
          onNavigate={() => navigate(`/tracks/${track.id}`)}
        />
      ))}
    </div>
  )
}

/* ─── Default cover placeholder (logo) ──────────────────────────────────── */
function DefaultCover({ category }) {
  const { color } = getCategoryArt(category)
  return (
    <div className="ihm-default-cover" style={{ '--cover-accent': color }}>
      <img src="/logo.png" alt="" className="ihm-default-cover-logo" />
    </div>
  )
}

/* ─── Scroll Track Card — Replit style ────────────────────────────────── */
function TrackCard({ track, isPlaying, isCurrent, onPlay, onNavigate }) {
  const { gradient, color } = getCategoryArt(track.category)
  const thisPlaying = isCurrent && isPlaying
  return (
    <div className={`nsh-card${isCurrent ? ' active' : ''}`} onClick={onNavigate}
      style={{ '--cover-gradient': gradient, '--cover-tint': `${color}40` }}>
      <div className="nsh-card-cover">
        {track.cover_url
          ? <img src={track.cover_url} alt={track.title} />
          : <DefaultCover category={track.category} />}
        <div className="nsh-card-hover">
          <button className="nsh-card-play" onClick={e => { e.stopPropagation(); onPlay() }}>
            {thisPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '1px' }} />}
          </button>
        </div>
        {thisPlaying && <div className="nsh-card-wave-bars"><WaveBars /></div>}
      </div>
      <div className="nsh-card-info">
        <div className="nsh-card-info-row">
          <div>
            <div className="nsh-card-title">{track.title}</div>
            <div className="nsh-card-sub"><ArtistName user={track.user} /></div>
          </div>
          <div className="nsh-card-menu" onClick={e => e.stopPropagation()}>
            <TrackMenu track={track} size={14} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Continue Listening — completely unique section ────────────────────── */
const fmtCL = (s) => { if (!s || s <= 0) return '0:00'; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}` }

function ContinueListeningSection({ label, arabicLabel, tracks, currentTrack, isPlaying, onPlay, navigate }) {
  if (!tracks?.length) return null
  const items = tracks.slice(0, 2)
  return (
    <div className="cl-section">
      <div className="cl-header">
        <h2 className="nsh-section-title">{label || 'Continue Listening'}</h2>
        {arabicLabel && <p className="nsh-section-sub">{arabicLabel}</p>}
      </div>
      <div className="cl-grid">
        {items.map(track => {
          const { gradient } = getCategoryArt(track.category)
          const isCurrent = currentTrack?.id === track.id
          const thisPlaying = isCurrent && isPlaying
          const progress = track.progress_seconds || 0
          const duration = track.duration_seconds || track.duration || 0
          const pct = duration > 0 ? Math.min((progress / duration) * 100, 100) : 0
          const remaining = Math.max(0, duration - progress)

          return (
            <div key={track.id} className={`cl-box${isCurrent ? ' cl-box--active' : ''}`}
              onClick={() => navigate(`/tracks/${track.id}`)}>
              <div className="cl-box-top">
                <div className="cl-cover" style={{ background: track.cover_url ? undefined : gradient }}>
                  {track.cover_url
                    ? <img src={track.cover_url} alt="" />
                    : <DefaultCover category={track.category} />}
                  {thisPlaying && <div className="cl-cover-bars"><WaveBars /></div>}
                </div>
                <div className="cl-info">
                  <span className="cl-track-title">{track.title}</span>
                  <span className="cl-track-artist"><ArtistName user={track.user} /></span>
                </div>
                <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                  <TrackMenu track={track} size={14} />
                </div>
                <button className={`cl-play${thisPlaying ? ' cl-play--active' : ''}`}
                  onClick={e => { e.stopPropagation(); onPlay(track, items, { startTime: progress }) }}>
                  {thisPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                </button>
              </div>
              <div className="cl-progress">
                <div className="cl-progress-track">
                  <div className="cl-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="cl-progress-time">
                  {remaining > 0 ? `${fmtCL(remaining)} left` : fmtCL(duration)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Grid Card — Replit style ────────────────────────────────────────── */
function GridCard({ track, isCurrent, isPlaying, onPlay, onNavigate }) {
  const { gradient, color } = getCategoryArt(track.category)
  const thisPlaying = isCurrent && isPlaying
  return (
    <div className={`nsh-card nsh-card-grid${isCurrent ? ' active' : ''}`} onClick={onNavigate}
      style={{ '--cover-gradient': gradient, '--cover-tint': `${color}40` }}>
      <div className="nsh-card-cover">
        {track.cover_url
          ? <img src={track.cover_url} alt={track.title} />
          : <DefaultCover category={track.category} />}
        <div className="nsh-card-hover">
          <button className="nsh-card-play" onClick={e => { e.stopPropagation(); onPlay() }}>
            {thisPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '1px' }} />}
          </button>
        </div>
        {thisPlaying && <div className="nsh-card-wave-bars"><WaveBars /></div>}
      </div>
      <div className="nsh-card-info">
        <div className="nsh-card-info-row">
          <div>
            <div className="nsh-card-title">{track.title}</div>
            <div className="nsh-card-sub"><ArtistName user={track.user} /></div>
          </div>
          <div className="nsh-card-menu" onClick={e => e.stopPropagation()}>
            <TrackMenu track={track} size={14} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── List Row — Replit style ─────────────────────────────────────────── */
function ListRow({ track, isCurrent, isPlaying, onPlay, onNavigate, index, sectionColor }) {
  const plays = track.plays_count || track.plays || 0
  const { gradient } = getCategoryArt(track.category)
  return (
    <div className={`nsh-list-row${isCurrent ? ' active' : ''}`} onClick={onPlay}>
      <span className="nsh-list-num">{index + 1}</span>
      <div className="nsh-list-cover" style={{ background: gradient }}>
        {track.cover_url
          ? <img src={track.cover_url} alt="" />
          : <DefaultCover category={track.category} />}
      </div>
      <div className="nsh-list-info">
        <span className="nsh-list-title">{track.title}</span>
        <span className="nsh-list-artist"><ArtistName user={track.user} /></span>
      </div>
      {plays > 0 && <span className="nsh-list-plays">{plays.toLocaleString()}</span>}
      <span className="nsh-list-dur">{track.duration ? `${Math.floor(track.duration/60)}:${String(Math.floor(track.duration%60)).padStart(2,'0')}` : ''}</span>
      <div onClick={e => e.stopPropagation()}>
        <TrackMenu track={track} size={15} />
      </div>
    </div>
  )
}

/* ─── Section header — Replit style ─────────────────────────────────────── */
function SectionHead({ label, arabicLabel, icon, color, category, navigate }) {
  return (
    <div className="nsh-section-head">
      <div>
        <h2 className="nsh-section-title">{label}</h2>
        {arabicLabel && <p className="nsh-section-sub">{arabicLabel}</p>}
      </div>
      <button className="nsh-section-seeall" onClick={() => navigate(category ? `/search?category=${category}` : '/search')}>
        See all <i className="fas fa-chevron-right" />
      </button>
    </div>
  )
}

function SectionHeadLeft({ label, arabicLabel, icon, color, category, navigate }) {
  return (
    <div className="nsh-section-head">
      <div>
        <h2 className="nsh-section-title">{label}</h2>
        {arabicLabel && <p className="nsh-section-sub">{arabicLabel}</p>}
      </div>
      <button className="nsh-section-seeall" onClick={() => navigate(category ? `/search?category=${category}` : '/search')}>
        See all <i className="fas fa-chevron-right" />
      </button>
    </div>
  )
}

/* ─── Horizontal Scroll Section ──────────────────────────────────────────── */
function HorizontalSection({ label, arabicLabel, icon, color, tracks, currentTrack, isPlaying, onPlay, navigate, category }) {
  const scrollRef = useRef(null)
  const scroll = dir => scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' })
  if (!tracks?.length) return null
  return (
    <div className="ihm-section">
      <SectionHead label={label} arabicLabel={arabicLabel} icon={icon} color={color} category={category} navigate={navigate} />
      <div className="ihm-scroll-wrapper">
        <button className="ihm-scroll-btn ihm-scroll-left" onClick={() => scroll(-1)} aria-label="Scroll left">
          <svg viewBox="0 0 16 16" fill="none" width="11" height="11"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="ihm-scroll-row" ref={scrollRef}>
          {tracks.map(track => (
            <TrackCard key={track.id} track={track} isCurrent={currentTrack?.id === track.id} isPlaying={isPlaying}
              onPlay={() => onPlay(track, tracks)} onNavigate={() => navigate(`/tracks/${track.id}`)} />
          ))}
        </div>
        <button className="ihm-scroll-btn ihm-scroll-right" onClick={() => scroll(1)} aria-label="Scroll right">
          <svg viewBox="0 0 16 16" fill="none" width="11" height="11"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ─── Grid Section ───────────────────────────────────────────────────────── */
function GridSection({ label, arabicLabel, icon, color, tracks, currentTrack, isPlaying, onPlay, navigate, category }) {
  if (!tracks?.length) return null
  return (
    <div className="ihm-section">
      <SectionHeadLeft label={label} arabicLabel={arabicLabel} icon={icon} color={color} category={category} navigate={navigate} />
      <div className="ihm-grid">
        {tracks.slice(0, 10).map(track => (
          <GridCard key={track.id} track={track} isCurrent={currentTrack?.id === track.id} isPlaying={isPlaying}
            onPlay={() => onPlay(track, tracks)} onNavigate={() => navigate(`/tracks/${track.id}`)} />
        ))}
      </div>
    </div>
  )
}

/* ─── List Section ───────────────────────────────────────────────────────── */
function ListSection({ label, arabicLabel, icon, color, tracks, currentTrack, isPlaying, onPlay, navigate, category }) {
  if (!tracks?.length) return null
  return (
    <div className="ihm-section">
      <SectionHeadLeft label={label} arabicLabel={arabicLabel} icon={icon} color={color} category={category} navigate={navigate} />
      <div className="ihm-list">
        {tracks.slice(0, 8).map((track, i) => (
          <ListRow key={track.id} track={track} index={i} sectionColor={color}
            isCurrent={currentTrack?.id === track.id} isPlaying={isPlaying}
            onPlay={() => onPlay(track, tracks)} onNavigate={() => navigate(`/tracks/${track.id}`)} />
        ))}
      </div>
    </div>
  )
}

/* ─── Artist Card — Replit style ──────────────────────────────────────── */
function ArtistCard({ artist, navigate }) {
  return (
    <div className="nsh-card nsh-card-grid" onClick={() => navigate(`/users/${artist.id}`)}>
      <div className="nsh-card-cover nsh-card-cover-round">
        {artist.avatar_url
          ? <img src={artist.avatar_url} alt={artist.name} />
          : <div className="nsh-artist-fallback">{artist.name?.charAt(0) || '?'}</div>}
      </div>
      <div className="nsh-card-info" style={{ textAlign: 'center' }}>
        <div className="nsh-card-title">{artist.name}</div>
        <div className="nsh-card-sub">{artist.track_count} tracks</div>
      </div>
    </div>
  )
}

/* ─── Playlist Card — for home sections ──────────────────────────────── */
function PlaylistCard({ playlist, navigate }) {
  const covers = playlist.preview_covers || []
  const hasCover = !!playlist.cover_url
  const hasMosaic = !hasCover && covers.length >= 4
  return (
    <div className="nsh-card nsh-card-grid" onClick={() => navigate(`/playlists/${playlist.id}`)} style={{ cursor: 'pointer' }}>
      <div className="nsh-card-cover">
        {hasCover ? (
          <img src={playlist.cover_url} alt={playlist.name} />
        ) : hasMosaic ? (
          <div className="nsh-pl-mosaic">
            {covers.slice(0, 4).map((c, i) => <img key={i} src={c} alt="" />)}
          </div>
        ) : covers[0] ? (
          <img src={covers[0]} alt={playlist.name} />
        ) : (
          <DefaultCover category="playlist" />
        )}
      </div>
      <div className="nsh-card-info">
        <div className="nsh-card-title">{playlist.name}</div>
        <div className="nsh-card-sub">{playlist.user?.name || 'Unknown'} · {playlist.tracks_count} tracks</div>
      </div>
    </div>
  )
}

function PlaylistGridSection({ label, arabicLabel, playlists, navigate }) {
  if (!playlists?.length) return null
  return (
    <div className="ihm-section">
      <SectionHeadLeft label={label} arabicLabel={arabicLabel} icon="fire" color="#C9A24D" category={null} navigate={navigate} />
      <div className="ihm-grid">
        {playlists.map(pl => <PlaylistCard key={pl.id} playlist={pl} navigate={navigate} />)}
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function Home() {
  const [sections, setSections]             = useState([])
  const [hero, setHero]                     = useState(null)
  const [loading, setLoading]               = useState(true)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [selectedTrack, setSelectedTrack]   = useState(null)
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  useEffect(() => { fetchHome() }, [])

  const fetchHome = async () => {
    try {
      const data = await api.getHomePage()
      setHero(data.hero || null)
      setSections(data.sections || [])
    } catch (e) {
      // Home fetch failed, try fallback
      // Fallback: try old endpoint
      try {
        const allData = await api.getTracks()
        const all = Array.isArray(allData) ? allData : (allData?.data || [])
        setSections([{
          key: 'new_releases', label: 'Recently Added', arabic_label: 'أَحْدَث المَقَاطِع',
          type: 'horizontal_scroll', tracks: all.slice(0, 12),
        }])
      } catch {}
    }
    finally { setLoading(false) }
  }

  const handlePlay = (track, list, opts) => {
    if (currentTrack?.id === track.id) togglePlay()
    else playTrack(track, list || sections.flatMap(s => s.tracks || []), opts)
  }

  const greeting = hero?.greeting || (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 18) return 'Welcome Back'
    return 'Good Evening'
  })()

  const userName = hero?.user_name || user?.name?.split(' ')[0] || null

  // Build featured from first tracks of trending, nasheeds, lectures
  const featuredSections = sections.filter(s => ['trending', 'nasheeds', 'lectures'].includes(s.key))
  const featuredSlots = [
    { key: 'trending',  label: 'Trending',  color: '#E8653A', icon: 'fire'    },
    { key: 'nasheeds',  label: 'Nasheeds',  color: '#1F7A5A', icon: 'nasheed' },
    { key: 'lectures',  label: 'Lectures',  color: '#4B7BBE', icon: 'lecture' },
  ]
  const featured = featuredSlots
    .map(s => {
      const sec = sections.find(x => x.key === s.key)
      return { ...s, track: sec?.tracks?.[0] }
    })
    .filter(f => f.track)

  if (loading) return (
    <div className="ihm-loading">
      <div className="ihm-loading-logo-wrap">
        {/* Rotating ring */}
        <svg className="ihm-loading-ring" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(201,162,77,0.1)" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="46" fill="none" stroke="url(#loadGrad)" strokeWidth="2"
            strokeLinecap="round" strokeDasharray="80 210" />
          <defs>
            <linearGradient id="loadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--sp-green, #1A7050)" />
              <stop offset="50%" stopColor="var(--sp-gold, #C9A24D)" />
              <stop offset="100%" stopColor="var(--sp-teal, #4FB3A2)" />
            </linearGradient>
          </defs>
        </svg>
        {/* Logo */}
        <img src="/logo.png" alt="Nashidify" className="ihm-loading-logo" />
      </div>
      <div className="ihm-loading-text">
        <span className="ihm-loading-brand">Nashidify</span>
      </div>
      <div className="ihm-loading-dots">
        <span className="ihm-dot" /><span className="ihm-dot" /><span className="ihm-dot" />
      </div>
    </div>
  )

  return (
    <div className="ihm-page page-enter">

      {/* ── Hero ── */}
      <section className="nsh-hero">
        {/* Background layers */}
        <div className="nsh-hero-bg" />
        <div className="nsh-hero-pattern">
          <div className="nsh-stars-small" />
          <div className="nsh-stars-medium" />
          <div className="nsh-stars-large" />
        </div>

        {/* Removed floating cards */}

        {/* Rosette */}
        <div className="ihm-hero-rosette-bg" aria-hidden="true"><HeroRosette /></div>

        {/* Content */}
        <div className="nsh-hero-content">
          {/* Badge */}
          <div className="nsh-hero-badge">
            <span className="nsh-hero-badge-dot soft-pulse" />
            <span>Sound That Reminds</span>
          </div>

          {/* Main headline */}
          <h1 className="nsh-hero-title">
            What you hear,{' '}
            <span className="gold-text">you carry</span>
          </h1>

          {/* Subtitle */}
          <p className="nsh-hero-subtitle">
            {userName
              ? <>Welcome back, <strong>{userName}</strong>. Your nasheeds, Quran recitations, and Islamic lectures — all in one place.</>
              : <>Discover nasheeds, Quran recitations, lectures, and Islamic audio content — all in one beautiful place.</>
            }
          </p>

          {/* Arabic verse */}
          <p className="nsh-hero-verse">
            أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ
            <span>Verily, in the remembrance of Allah do hearts find rest — 13:28</span>
          </p>

          {/* Quick category pills */}
          <div className="nsh-hero-pills">
            {[
              ['Nasheeds', 'fa-music', '/search?category=Nasheeds'],
              ['Quran', 'fa-book-quran', '/search?category=Quran'],
              ['Lectures', 'fa-microphone', '/search?category=Lectures'],
              ['Duas', 'fa-hands-praying', '/search?category=Duas'],
              ['Radio', 'fa-broadcast-tower', '/radio'],
            ].map(([label, icon, path]) => (
              <button key={label} className="nsh-hero-pill" onClick={() => navigate(path)}>
                <i className={`fas ${icon}`} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="nsh-hero-scroll">
          <div className="nsh-hero-scroll-mouse">
            <div className="nsh-hero-scroll-dot" />
          </div>
        </div>
      </section>

      {/* ── Recommended Categories ── */}
      <section className="nsh-categories-section">
        <div className="nsh-section-head" style={{ padding: '0 40px' }}>
          <div>
            <h2 className="nsh-section-title">Recommended for You</h2>
            <p className="nsh-section-sub-text">Based on your listening history</p>
          </div>
        </div>
        <div className="nsh-categories-row">
          <div className="nsh-feat-card nsh-feat-illustrated" onClick={() => navigate('/search?category=Quran')}>
            {/* Illustrated mosque + moon scene */}
            <div className="nsh-feat-scene nsh-feat-scene-quran">
              <svg viewBox="0 0 400 280" fill="none" className="nsh-feat-illustration" preserveAspectRatio="xMidYMax slice">
                {/* Sky gradient */}
                <defs>
                  <linearGradient id="sky-q" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a2a1e"/><stop offset="100%" stopColor="#0d4030"/></linearGradient>
                  <radialGradient id="moon-glow" cx="0.75" cy="0.25" r="0.4"><stop offset="0%" stopColor="#C9A84C" stopOpacity="0.15"/><stop offset="100%" stopColor="#C9A84C" stopOpacity="0"/></radialGradient>
                </defs>
                <rect width="400" height="280" fill="url(#sky-q)"/>
                <rect width="400" height="280" fill="url(#moon-glow)"/>
                {/* Stars */}
                <circle cx="50" cy="40" r="1.5" fill="#fff" opacity="0.5"/><circle cx="120" cy="25" r="1" fill="#fff" opacity="0.4"/><circle cx="200" cy="50" r="1.2" fill="#fff" opacity="0.3"/><circle cx="320" cy="35" r="1.5" fill="#fff" opacity="0.45"/><circle cx="370" cy="60" r="1" fill="#fff" opacity="0.35"/><circle cx="80" cy="80" r="0.8" fill="#fff" opacity="0.25"/><circle cx="260" cy="30" r="1.3" fill="#fff" opacity="0.4"/>
                {/* Crescent moon */}
                <path d="M300 55Q325 65 325 90Q310 82 295 90Q295 65 300 55Z" fill="#C9A84C" opacity="0.8"/><circle cx="322" cy="60" r="3" fill="#C9A84C" opacity="0.6"/>
                {/* Mosque silhouette */}
                <path d="M100 280V200C100 170 140 145 160 145S220 170 220 200V280Z" fill="#0f3828" stroke="#1a5c3a" strokeWidth="1.5"/>
                <rect x="150" y="120" width="20" height="25" rx="3" fill="#0f3828" stroke="#1a5c3a" strokeWidth="1"/>
                <circle cx="160" cy="118" r="6" fill="#C9A84C" opacity="0.5"/>
                {/* Minaret left */}
                <rect x="85" y="160" width="16" height="120" fill="#0f3828" stroke="#1a5c3a" strokeWidth="1"/>
                <path d="M82 160L93 140L104 160Z" fill="#0f3828" stroke="#1a5c3a" strokeWidth="1"/>
                <circle cx="93" cy="138" r="3" fill="#C9A84C" opacity="0.4"/>
                {/* Minaret right */}
                <rect x="219" y="160" width="16" height="120" fill="#0f3828" stroke="#1a5c3a" strokeWidth="1"/>
                <path d="M216 160L227 140L238 160Z" fill="#0f3828" stroke="#1a5c3a" strokeWidth="1"/>
                <circle cx="227" cy="138" r="3" fill="#C9A84C" opacity="0.4"/>
                {/* Windows */}
                <path d="M140 230C140 220 150 212 160 212S180 220 180 230V260H140Z" fill="#1a5c3a" opacity="0.5"/>
                <path d="M145 240C145 233 152 228 160 228S175 233 175 240V255H145Z" fill="#C9A84C" opacity="0.08"/>
              </svg>
            </div>
            <div className="nsh-feat-overlay" />
            <div className="nsh-feat-inner">
              <span className="nsh-feat-label">Curated for you</span>
              <h3 className="nsh-feat-title">Quran Recitations</h3>
              <p className="nsh-feat-artist">Beautiful tilawah from the world's most beloved Qaris</p>
              <div className="nsh-feat-actions">
                <button className="nsh-feat-play" onClick={e => { e.stopPropagation(); navigate('/search?category=Quran') }}>
                  <i className="fas fa-play" style={{ fontSize: '0.7rem', marginLeft: 2 }} />
                </button>
                <span className="nsh-feat-browse">Browse collection <i className="fas fa-arrow-right" /></span>
              </div>
            </div>
          </div>
          <div className="nsh-feat-card nsh-feat-illustrated" onClick={() => navigate('/search?category=Nasheeds')}>
            {/* Illustrated music + lanterns scene */}
            <div className="nsh-feat-scene nsh-feat-scene-nasheeds">
              <svg viewBox="0 0 400 280" fill="none" className="nsh-feat-illustration" preserveAspectRatio="xMidYMax slice">
                <defs>
                  <linearGradient id="sky-n" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2a1a0a"/><stop offset="100%" stopColor="#3d2510"/></linearGradient>
                  <radialGradient id="warm-glow" cx="0.5" cy="0.4" r="0.5"><stop offset="0%" stopColor="#C9A84C" stopOpacity="0.12"/><stop offset="100%" stopColor="#C9A84C" stopOpacity="0"/></radialGradient>
                </defs>
                <rect width="400" height="280" fill="url(#sky-n)"/>
                <rect width="400" height="280" fill="url(#warm-glow)"/>
                {/* Stars */}
                <circle cx="40" cy="30" r="1.2" fill="#fff" opacity="0.4"/><circle cx="150" cy="45" r="1" fill="#fff" opacity="0.3"/><circle cx="280" cy="25" r="1.5" fill="#fff" opacity="0.45"/><circle cx="350" cy="55" r="0.8" fill="#fff" opacity="0.3"/><circle cx="100" cy="60" r="1" fill="#fff" opacity="0.25"/>
                {/* Hanging lanterns */}
                <line x1="80" y1="0" x2="80" y2="70" stroke="#C9A84C" strokeWidth="0.8" opacity="0.3"/>
                <path d="M70 70Q70 60 80 55Q90 60 90 70Q90 85 80 90Q70 85 70 70Z" fill="#C9A84C" stroke="#C9A84C" strokeWidth="0.8" opacity="0.4"/>
                <circle cx="80" cy="72" r="3" fill="#C9A84C" opacity="0.25"/>
                <line x1="200" y1="0" x2="200" y2="50" stroke="#C9A84C" strokeWidth="0.8" opacity="0.3"/>
                <path d="M190 50Q190 40 200 35Q210 40 210 50Q210 65 200 70Q190 65 190 50Z" fill="#C9A84C" stroke="#C9A84C" strokeWidth="0.8" opacity="0.35"/>
                <circle cx="200" cy="52" r="3" fill="#C9A84C" opacity="0.2"/>
                <line x1="330" y1="0" x2="330" y2="80" stroke="#C9A84C" strokeWidth="0.8" opacity="0.3"/>
                <path d="M320 80Q320 70 330 65Q340 70 340 80Q340 95 330 100Q320 95 320 80Z" fill="#C9A84C" stroke="#C9A84C" strokeWidth="0.8" opacity="0.4"/>
                <circle cx="330" cy="82" r="3" fill="#C9A84C" opacity="0.25"/>
                {/* Sound waves / music */}
                <path d="M140 180Q170 150 200 180Q230 210 260 180" stroke="#C9A84C" strokeWidth="1.5" opacity="0.2" strokeLinecap="round"/>
                <path d="M120 200Q160 170 200 200Q240 230 280 200" stroke="#C9A84C" strokeWidth="1" opacity="0.12" strokeLinecap="round"/>
                <path d="M160 160Q180 145 200 160Q220 175 240 160" stroke="#C9A84C" strokeWidth="1" opacity="0.15" strokeLinecap="round"/>
                {/* Daf drum */}
                <circle cx="200" cy="210" r="35" fill="#3d2510" stroke="#C9A84C" strokeWidth="1" opacity="0.3"/>
                <circle cx="200" cy="210" r="25" stroke="#C9A84C" strokeWidth="0.6" opacity="0.2" strokeDasharray="3 4"/>
                <circle cx="200" cy="210" r="8" fill="#C9A84C" stroke="#C9A84C" strokeWidth="0.6" opacity="0.25"/>
              </svg>
            </div>
            <div className="nsh-feat-overlay" />
            <div className="nsh-feat-inner">
              <span className="nsh-feat-label">Trending now</span>
              <h3 className="nsh-feat-title">Nasheeds</h3>
              <p className="nsh-feat-artist">Islamic vocals and spiritual melodies that move the soul</p>
              <div className="nsh-feat-actions">
                <button className="nsh-feat-play" onClick={e => { e.stopPropagation(); navigate('/search?category=Nasheeds') }}>
                  <i className="fas fa-play" style={{ fontSize: '0.7rem', marginLeft: 2 }} />
                </button>
                <span className="nsh-feat-browse">Browse collection <i className="fas fa-arrow-right" /></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Top banner ad for free users ── */}
      {(() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return !u.plan_slug || u.plan_slug === 'free' } catch { return true } })() && (
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <BannerAd placement="home_top" />
        </div>
      )}

      {/* ── Sponsored tracks for free users ── */}
      {(() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return !u.plan_slug || u.plan_slug === 'free' } catch { return true } })() && (
        <>
          <SponsoredTrack onPlay={handlePlay} currentTrack={currentTrack} isPlaying={isPlaying} navigate={navigate} />
          <IslamicDivider />
        </>
      )}

      {/* ── Curated Home Sections (6 algorithm sections) ── */}
      {(() => {
        const getSection = (key) => sections.find(s => s.key === key)
        const isFree = (() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return !u.plan_slug || u.plan_slug === 'free' } catch { return true } })()

        /* Define the 6 home sections with their desired layout */
        const homeSections = [
          { key: 'continue_listening', limit: 2, type: 'continue' },
          { key: 'recommended',        limit: 10, type: 'grid' },
          { key: 'because_liked',      limit: 8, type: 'horizontal_scroll' },
          { key: 'featured_playlists', limit: 6, type: 'playlist_grid' },
          { key: 'viral',              limit: 10, type: 'horizontal_scroll' },
          { key: 'rising_artists',     limit: 6, type: 'artist_grid' },
          { key: 'trending',           limit: 12, type: 'horizontal_scroll' },
          { key: 'new_playlists',      limit: 8, type: 'playlist_scroll' },
        ]

        let rendered = 0
        return homeSections.map(cfg => {
          const section = getSection(cfg.key)
          if (!section) return null
          const tracks = (section.tracks || []).slice(0, cfg.limit)
          const playlists = section.playlists || []
          if (!tracks.length && !playlists.length && cfg.type !== 'artist_grid') return null

          const { icon, color } = getSectionStyle(cfg.key)
          const commonProps = {
            key: cfg.key,
            label: section.label,
            arabicLabel: section.arabic_label,
            icon, color,
            category: null,
            tracks,
            currentTrack, isPlaying,
            onPlay: handlePlay,
            navigate,
          }

          rendered++
          return (
            <div key={cfg.key}>
              {rendered > 1 && <IslamicDivider />}
              {/* Banner ad after every 3rd section for free users */}
              {isFree && rendered > 1 && rendered % 3 === 0 && (
                <div style={{ padding: '0 20px', marginBottom: 16 }}>
                  <BannerAd placement="home_between" />
                </div>
              )}
              {cfg.type === 'continue' && <ContinueListeningSection {...commonProps} />}
              {cfg.type === 'horizontal_scroll' && <HorizontalSection {...commonProps} />}
              {cfg.type === 'grid' && <GridSection {...commonProps} />}
              {cfg.type === 'list' && <ListSection {...commonProps} />}
              {cfg.type === 'artist_grid' && (
                <div className="ihm-section">
                  <SectionHeadLeft label={section.label} arabicLabel={section.arabic_label} icon={icon} color={color} category={null} navigate={navigate} />
                  <div className="ihm-grid">
                    {tracks.map(artist => (
                      <ArtistCard key={artist.id} artist={artist} navigate={navigate} />
                    ))}
                  </div>
                </div>
              )}
              {(cfg.type === 'playlist_grid' || cfg.type === 'playlist_scroll') && playlists.length > 0 && (
                <PlaylistGridSection label={section.label} arabicLabel={section.arabic_label} playlists={playlists} navigate={navigate} />
              )}

              {/* Everything You Need — after first section */}
              {rendered === 1 && (
                <section className="nsh-features-section">
                  <div className="nsh-features-header">
                    <h2 className="nsh-features-heading">Everything You Need</h2>
                    <p className="nsh-features-sub">A complete Islamic audio experience built with care for the Muslim community</p>
                  </div>
                  <div className="nsh-features-grid">
                    {[
                      { icon: 'fa-users', title: 'Community', desc: 'Connect with fellow Muslims, follow your favorite reciters and nasheed artists', gradient: 'from-emerald', color: '#2D9B6E' },
                      { icon: 'fa-microphone-lines', title: 'Lectures & Talks', desc: 'Learn from scholars worldwide with curated Islamic lectures and reminders', gradient: 'from-amber', color: '#C9A84C' },
                      { icon: 'fa-mobile-screen', title: 'Listen Anywhere', desc: 'Seamless experience across all your devices — phone, tablet, or desktop', gradient: 'from-sky', color: '#4A90D9' },
                      { icon: 'fa-podcast', title: 'Islamic Podcasts', desc: 'Discover podcasts on faith, spirituality, history, and personal development', gradient: 'from-purple', color: '#9B59B6' },
                      { icon: 'fa-book-open', title: 'Quran & Recitations', desc: 'Beautiful Quran recitations from the world\'s most beloved Qaris', gradient: 'from-rose', color: '#C0544E' },
                      { icon: 'fa-clock', title: 'Prayer Aware', desc: 'Auto-pauses during prayer times and reminds you of Adhan — built for your deen', gradient: 'from-indigo', color: '#5B6ABF' },
                    ].map((f, i) => (
                      <div key={i} className={`nsh-feature-card nsh-feature-${f.gradient}`}>
                        <div className="nsh-feature-icon" style={{ background: `${f.color}25` }}>
                          <i className={`fas ${f.icon}`} style={{ color: f.color }} />
                        </div>
                        <h3 className="nsh-feature-title">{f.title}</h3>
                        <p className="nsh-feature-desc">{f.desc}</p>
                        <svg className="nsh-feature-star" width="30" height="30" viewBox="0 0 30 30" fill="none">
                          <polygon points="15,2 17.5,10 26,10 19.5,15.5 22,24 15,19.5 8,24 10.5,15.5 4,10 12.5,10" stroke="#C9A84C" strokeWidth="0.8" opacity="0.2" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )
        })
      })()}

      {sections.length === 0 && !loading && (
        <div className="ihm-empty">
          <svg viewBox="0 0 80 80" fill="none" className="ihm-empty-icon-svg">
            <polygon points={S12.split(' ').map(p=>{const[x,y]=p.split(',').map(Number);return`${(x-10)*3.5+40},${(y-10)*3.5+40}`}).join(' ')}
              fill="rgba(201,162,77,0.12)" stroke="rgba(201,162,77,0.45)" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          <h3>No tracks yet</h3>
          <p>Be the first to share Islamic content</p>
          <button className="ihm-btn-gold" onClick={() => navigate('/upload')}>Upload a Track</button>
        </div>
      )}

      {showPlaylistModal && selectedTrack && (
        <AddToPlaylistModal trackId={selectedTrack} onClose={() => { setShowPlaylistModal(false); setSelectedTrack(null) }} />
      )}

      {/* ── CTA Section ── */}
      <section className="nsh-cta">
        <div className="nsh-cta-glow nsh-cta-glow-1" />
        <div className="nsh-cta-glow nsh-cta-glow-2" />
        <div className="nsh-cta-pattern" />
        <div className="nsh-cta-inner">
          <div className="nsh-cta-badge">
            <span className="nsh-cta-badge-dot" />
            Sound that reminds
          </div>
          <h2 className="nsh-cta-title">Your ears deserve<br /><span className="gold-text">something pure</span></h2>
          <p className="nsh-cta-sub">Join thousands of Muslims who use Nashidify to fill their days with Quran, nasheeds, and reminders that bring peace to the heart</p>
          <div className="nsh-cta-actions">
            <button className="nsh-cta-btn-primary" onClick={() => navigate(localStorage.getItem('token') ? '/search' : '/register')}>
              {localStorage.getItem('token') ? 'Explore Now' : 'Get Started Free'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button className="nsh-cta-btn-ghost" onClick={() => navigate('/pricing')}>
              View Plans
            </button>
          </div>
          <div className="nsh-cta-stats">
            <div className="nsh-cta-stat"><strong>1,000+</strong><span>Tracks</span></div>
            <div className="nsh-cta-stat-divider" />
            <div className="nsh-cta-stat"><strong>50+</strong><span>Artists</span></div>
            <div className="nsh-cta-stat-divider" />
            <div className="nsh-cta-stat"><strong>24/7</strong><span>Live Radio</span></div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="nsh-footer">
        <div className="nsh-footer-top">
          <div className="nsh-footer-brand">
            <div className="nsh-footer-logo-row">
              <img src="/hero-logo.png" alt="Nashidify" className="nsh-footer-logo" />
              <p className="nsh-footer-tagline">Sound that reminds</p>
            </div>
            <p className="nsh-footer-desc">A halal audio platform for the Muslim community. Listen to Quran, nasheeds, lectures, and more.</p>
            <div className="nsh-footer-social">
              <a href="#" className="nsh-social-btn" title="Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
              <a href="#" className="nsh-social-btn" title="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg></a>
              <a href="#" className="nsh-social-btn" title="YouTube"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 00-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg></a>
            </div>
          </div>
          <div className="nsh-footer-links">
            <div className="nsh-footer-col">
              <h4>Browse</h4>
              <a onClick={() => navigate('/search?category=Quran')}>Quran</a>
              <a onClick={() => navigate('/search?category=Nasheeds')}>Nasheeds</a>
              <a onClick={() => navigate('/search?category=Lectures')}>Lectures</a>
              <a onClick={() => navigate('/search?category=Duas')}>Duas</a>
              <a onClick={() => navigate('/radio')}>Live Radio</a>
            </div>
            <div className="nsh-footer-col">
              <h4>Account</h4>
              <a onClick={() => navigate('/library')}>My Library</a>
              <a onClick={() => navigate('/playlists')}>Playlists</a>
              <a onClick={() => navigate('/settings')}>Settings</a>
              <a onClick={() => navigate('/pricing')}>Upgrade</a>
              <a onClick={() => navigate('/upload')}>Upload</a>
            </div>
            <div className="nsh-footer-col">
              <h4>More</h4>
              <a onClick={() => navigate('/feed')}>Community</a>
              <a onClick={() => navigate('/adhan')}>Prayer Times</a>
              <a onClick={() => navigate('/search')}>Discover</a>
              <a onClick={() => navigate('/terms')}>Terms of Service</a>
              <a onClick={() => navigate('/privacy')}>Privacy Policy</a>
            </div>
          </div>
        </div>
        <div className="nsh-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Nashidify. All rights reserved.</span>
          <a href="https://rkiehproductions.com" target="_blank" rel="noopener noreferrer" className="nsh-footer-powered">
            Powered by <strong>rkiehproductions.com</strong>
          </a>
        </div>
      </footer>
    </div>
  )
}
