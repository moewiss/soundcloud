import { useState, useMemo } from 'react'
import {
  Radio as RadioIcon,
  Microphone, BookBookmark, Moon, GraduationCap,
  Globe, MapPin, MusicNotes, Translate,
  MagnifyingGlass, X, Heart,
} from '@phosphor-icons/react'
import { usePlayer } from '../context/PlayerContext'

/* ─── Islamic star polygons ─────────────────────────────────────────────── */
const S8  = "10,1 11.42,6.58 16.36,3.64 13.42,8.58 19,10 13.42,11.42 16.36,16.36 11.42,13.42 10,19 8.58,13.42 3.64,16.36 6.58,11.42 1,10 6.58,8.58 3.64,3.64 8.58,6.58"
const S12 = "10,1 11.04,6.14 14.5,2.21 12.83,7.17 17.79,5.5 13.86,8.97 19,10 13.86,11.04 17.79,14.5 12.83,12.83 14.5,17.79 11.04,13.86 10,19 8.97,13.86 5.5,17.79 7.17,12.83 2.21,14.5 6.14,11.04 1,10 6.14,8.97 2.21,5.5 7.17,7.17 5.5,2.21 8.97,6.14"

/* ─── Hero background: 8-star tessellation ───────────────────────────── */
function HeroPattern() {
  return (
    <svg className="rdx-hero-bg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <pattern id="rdx-8star" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <polygon points="50,27.5 53.56,41.45 65.91,34.09 58.55,46.44 72.5,50 58.55,53.56 65.91,65.91 53.56,58.55 50,72.5 46.44,58.55 34.09,65.91 41.45,53.56 27.5,50 41.45,46.44 34.09,34.09 46.44,41.45"
            fill="none" stroke="rgba(201,162,77,0.26)" strokeWidth="0.75" strokeLinejoin="round"/>
          <polyline points="22.5,0 8.59,3.56 15.91,15.91 3.56,8.59 0,22.5" fill="none" stroke="rgba(201,162,77,0.20)" strokeWidth="0.75"/>
          <polyline points="100,22.5 96.44,8.59 84.09,15.91 91.41,3.56 77.5,0" fill="none" stroke="rgba(201,162,77,0.20)" strokeWidth="0.75"/>
          <polyline points="0,77.5 3.56,91.41 15.91,84.09 8.59,96.44 22.5,100" fill="none" stroke="rgba(201,162,77,0.20)" strokeWidth="0.75"/>
          <polyline points="77.5,100 91.41,96.44 84.09,84.09 96.44,91.41 100,77.5" fill="none" stroke="rgba(201,162,77,0.20)" strokeWidth="0.75"/>
          <line x1="50" y1="27.5" x2="50" y2="0"   stroke="rgba(201,162,77,0.12)" strokeWidth="0.75"/>
          <line x1="72.5" y1="50" x2="100" y2="50"  stroke="rgba(201,162,77,0.12)" strokeWidth="0.75"/>
          <line x1="50" y1="72.5" x2="50" y2="100"  stroke="rgba(201,162,77,0.12)" strokeWidth="0.75"/>
          <line x1="27.5" y1="50" x2="0" y2="50"    stroke="rgba(201,162,77,0.12)" strokeWidth="0.75"/>
          <line x1="34.09" y1="34.09" x2="15.91" y2="15.91" stroke="rgba(201,162,77,0.14)" strokeWidth="0.75"/>
          <line x1="65.91" y1="34.09" x2="84.09" y2="15.91" stroke="rgba(201,162,77,0.14)" strokeWidth="0.75"/>
          <line x1="65.91" y1="65.91" x2="84.09" y2="84.09" stroke="rgba(201,162,77,0.14)" strokeWidth="0.75"/>
          <line x1="34.09" y1="65.91" x2="15.91" y2="84.09" stroke="rgba(201,162,77,0.14)" strokeWidth="0.75"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#rdx-8star)"/>
    </svg>
  )
}

/* ─── Slowly-spinning 12-star rosette ───────────────────────────────────── */
function HeroRosette() {
  const s8  = (cx,cy,r) => S8.split(' ').map(p=>{const[x,y]=p.split(',').map(Number);return`${(x-10)*r/10+cx},${(y-10)*r/10+cy}`}).join(' ')
  const s12 = (cx,cy,r) => S12.split(' ').map(p=>{const[x,y]=p.split(',').map(Number);return`${(x-10)*r/10+cx},${(y-10)*r/10+cy}`}).join(' ')
  return (
    <svg className="rdx-hero-rosette" viewBox="0 0 220 220">
      {Array.from({length:12},(_,i)=>{
        const a=(i*30-90)*Math.PI/180, r=90, cx=110+r*Math.cos(a), cy=110+r*Math.sin(a)
        return <g key={i} transform={`translate(${cx-8},${cy-8})`}><polygon points={s8(8,8,8)} fill="none" stroke="rgba(201,162,77,0.5)" strokeWidth="0.9"/></g>
      })}
      <polygon points={s12(110,110,42)} fill="none" stroke="rgba(201,162,77,0.65)" strokeWidth="1" strokeLinejoin="round"/>
      <polygon points={s8(110,110,28)} fill="rgba(201,162,77,0.12)" stroke="rgba(201,162,77,0.75)" strokeWidth="1" strokeLinejoin="round"/>
      <circle cx="110" cy="110" r="60" fill="none" stroke="rgba(201,162,77,0.18)" strokeWidth="0.8" strokeDasharray="3 5"/>
      <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(201,162,77,0.10)" strokeWidth="0.6"/>
      <circle cx="110" cy="110" r="4"  fill="rgba(201,162,77,0.6)"/>
    </svg>
  )
}

/* ─── Station data ─────────────────────────────────────────────────────── */
const STATIONS = [
  // ── Quran Reciters
  { id:  1, name: 'Mishary Rashid Alafasy',      category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/mishary_alafasi',                     backup:'http://live.mp3quran.net:8010',  freq:'88.1' },
  { id:  2, name: 'Abdul Basit Abdul Samad',      category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/abdulbasit_abdulsamad',               backup:'http://live.mp3quran.net:9974',  freq:'88.5' },
  { id:  3, name: 'Abdul Rahman Al-Sudais',       category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/abdulrahman_alsudaes',                backup:'http://live.mp3quran.net:9988',  freq:'89.1' },
  { id:  4, name: 'Maher Al-Muaiqly',            category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/maher_al_meaqli',                     backup:'http://live.mp3quran.net:8002',  freq:'89.7' },
  { id:  5, name: 'Saad Al-Ghamdi',              category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/saad_alghamdi',                       backup:'http://live.mp3quran.net:8004',  freq:'90.3' },
  { id:  6, name: 'Saud Al-Shuraim',             category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/saud_alshuraim',                      backup:'http://live.mp3quran.net:9986',  freq:'90.9' },
  { id:  7, name: 'Mahmoud Khalil Al-Hussary',   category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/mahmoud_khalil_alhussary',            backup:'http://live.mp3quran.net:9958',  freq:'91.5' },
  { id:  8, name: 'Yasser Al-Dosari',            category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/yasser_aldosari',                     backup:'http://live.mp3quran.net:9984',  freq:'92.1' },
  { id:  9, name: 'Nasser Al-Qatami',            category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/nasser_alqatami',                     backup:'http://live.mp3quran.net:9994',  freq:'92.7' },
  { id: 10, name: 'Abu Bakr Al-Shatri',          category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/shaik_abu_bakr_al_shatri',            backup:'http://live.mp3quran.net:9966',  freq:'93.3' },
  { id: 11, name: 'Mohammed Siddiq Al-Minshawi', category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/mohammed_siddiq_alminshawi',          backup:'http://live.mp3quran.net:9978',  freq:'93.9' },
  { id: 12, name: 'Ahmad Al-Ajmy',               category:'reciters',    lang:'Arabic',     stream:'http://live.mp3quran.net:8008',                                  backup:null,                             freq:'94.5' },
  { id: 13, name: 'Ali Al-Hudhaifi',             category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/ali_alhuthaifi',                      backup:null,                             freq:'95.1' },
  { id: 14, name: 'Khalid Al-Jaleel',            category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/khalid_aljileel',                     backup:null,                             freq:'95.7' },
  { id: 15, name: 'Fares Abbad',                 category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/fares_abbad',                         backup:'http://live.mp3quran.net:9972',  freq:'96.3' },
  { id: 16, name: 'Mohammed Ayyub',              category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/mohammed_ayyub',                      backup:'http://live.mp3quran.net:9960',  freq:'96.9' },
  { id: 17, name: 'Idrees Abkar',                category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/idrees_abkr',                         backup:null,                             freq:'97.5' },
  { id: 18, name: 'Hani Ar-Rifai',               category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/hani_arrifai',                        backup:null,                             freq:'98.1' },
  { id: 19, name: 'Bandar Balilah',              category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/bandar_balilah',                      backup:null,                             freq:'98.7' },
  { id: 20, name: 'Salah Bukhatir',              category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/slaah_bukhatir',                      backup:null,                             freq:'99.3' },
  // ── Quran Live
  { id: 21, name: 'Quran For The Heart',         category:'quran',       lang:'Arabic',     stream:'https://edge.mixlr.com/channel/rwumx',                          backup:null,                             freq:'100.1' },
  { id: 22, name: 'Quran For The Soul',          category:'quran',       lang:'Arabic',     stream:'https://islamicbulletin.site:8102/stream',                      backup:null,                             freq:'100.7' },
  { id: 23, name: 'Saudi Quran Radio',           category:'quran',       lang:'Arabic',     stream:'https://stream.radiojar.com/0tpy1h0kxtzuv',                     backup:null,                             freq:'101.3' },
  { id: 24, name: 'Quran Makkah Radio',          category:'quran',       lang:'Arabic',     stream:'https://islamicbulletin.site:8106/stream',                      backup:'http://stream.radiojar.com/4wqre23fytzuv', freq:'101.9' },
  { id: 25, name: 'Beautiful Recitations',       category:'quran',       lang:'Arabic',     stream:'https://qurango.net/radio/salma',                               backup:'http://live.mp3quran.net:9992',  freq:'102.5' },
  { id: 26, name: 'Peaceful Recitations',        category:'quran',       lang:'Arabic',     stream:'https://qurango.net/radio/sakeenah',                            backup:null,                             freq:'103.1' },
  { id: 27, name: 'Short Amazing Tilawat',       category:'quran',       lang:'Arabic',     stream:'https://qurango.net/radio/tarateel',                            backup:null,                             freq:'103.7' },
  { id: 28, name: 'Surah Al-Baqarah',           category:'quran',       lang:'Arabic',     stream:'https://qurango.net/radio/albaqarah',                           backup:null,                             freq:'104.3' },
  { id: 29, name: 'Al Husnaa Quran Radio',       category:'quran',       lang:'Arabic',     stream:'https://stream.zeno.fm/pyc8kax6f2zuv',                          backup:null,                             freq:'104.9' },
  { id: 30, name: 'Egypt Quran Radio',           category:'quran',       lang:'Arabic',     stream:'https://stream.zeno.fm/tv0x28xvyc9uv',                          backup:null,                             freq:'105.5' },
  // ── Islamic Talk & Lectures
  { id: 31, name: 'Islamic Bulletin Radio',      category:'islamic',     lang:'English',    stream:'https://islamicbulletin.site:8076/stream',                      backup:null,                             freq:'106.1' },
  { id: 32, name: 'Motivational Series',         category:'islamic',     lang:'English',    stream:'https://islamicbulletin.site:8078/stream',                      backup:null,                             freq:'106.7' },
  { id: 33, name: "Women's Wisdom Radio",        category:'islamic',     lang:'English',    stream:'https://islamicbulletin.site:8074/stream',                      backup:null,                             freq:'107.3' },
  { id: 34, name: 'Deenagers Radio',             category:'islamic',     lang:'English',    stream:'https://islamicbulletin.site:8072/stream',                      backup:null,                             freq:'107.9' },
  { id: 35, name: 'Radio Hajj / Sahabah',        category:'islamic',     lang:'English',    stream:'https://islamicbulletin.site:8070/stream',                      backup:null,                             freq:'88.3'  },
  { id: 36, name: 'Sirat Al-Mustaqim',           category:'islamic',     lang:'English',    stream:'https://islamicbulletin.site:8060/stream',                      backup:null,                             freq:'89.3'  },
  { id: 37, name: 'Riyad asSalihin',             category:'islamic',     lang:'Arabic',     stream:'https://islamicbulletin.site:8058/stream',                      backup:null,                             freq:'90.5'  },
  { id: 38, name: 'Nur ala Nur Radio',           category:'islamic',     lang:'Arabic',     stream:'https://islamicbulletin.site:8056/stream',                      backup:null,                             freq:'91.7'  },
  { id: 39, name: 'Sirah Radio',                 category:'islamic',     lang:'Arabic',     stream:'https://islamicbulletin.site:8054/stream',                      backup:null,                             freq:'92.9'  },
  { id: 40, name: 'Ruqya Healing',               category:'islamic',     lang:'Arabic',     stream:'https://qurango.net/radio/roqiah',                              backup:'https://islamicbulletin.site:8052/stream', freq:'94.1' },
  { id: 41, name: 'Quran Tafseer',               category:'islamic',     lang:'Arabic',     stream:'https://qurango.net/radio/tafseer',                             backup:null,                             freq:'95.3'  },
  { id: 42, name: 'Fatwa Radio',                 category:'islamic',     lang:'Arabic',     stream:'https://qurango.net/radio/fatwa',                               backup:null,                             freq:'96.5'  },
  { id: 43, name: 'Morning Adhkar',              category:'islamic',     lang:'Arabic',     stream:'https://qurango.net/radio/athkar_sabah',                        backup:null,                             freq:'97.7'  },
  { id: 44, name: 'Evening Adhkar',              category:'islamic',     lang:'Arabic',     stream:'https://qurango.net/radio/athkar_masa',                         backup:null,                             freq:'98.9'  },
  { id: 45, name: "Prophet's Seerah",            category:'islamic',     lang:'Arabic',     stream:'https://qurango.net/radio/fi_zilal_alsiyra',                    backup:null,                             freq:'99.5'  },
  { id: 46, name: 'Sahaba Stories',              category:'islamic',     lang:'Arabic',     stream:'https://qurango.net/radio/sahabah',                             backup:null,                             freq:'100.3' },
  // ── Scholars
  { id: 47, name: 'Omar Abd al-Kafi',            category:'scholars',    lang:'Arabic',     stream:'https://islamicbulletin.site:8068/stream',                      backup:null,                             freq:'101.5' },
  { id: 48, name: 'Muhammad al-Sharawi',         category:'scholars',    lang:'Arabic',     stream:'https://islamicbulletin.site:8066/stream',                      backup:null,                             freq:'102.7' },
  { id: 49, name: 'Abdul Hamid Kishk',           category:'scholars',    lang:'Arabic',     stream:'https://islamicbulletin.site:8062/stream',                      backup:null,                             freq:'103.9' },
  // ── Translation
  { id: 50, name: 'Quran — English',             category:'translation', lang:'English',    stream:'https://qurango.net/radio/translation_quran_english_basit',     backup:null,                             freq:'88.9'  },
  { id: 51, name: 'Quran — Urdu',                category:'translation', lang:'Urdu',       stream:'https://qurango.net/radio/translation_quran_urdu_basit',        backup:null,                             freq:'89.9'  },
  { id: 52, name: 'Quran — French',              category:'translation', lang:'French',     stream:'https://qurango.net/radio/translation_quran_french',             backup:null,                             freq:'90.1'  },
  { id: 53, name: 'Quran — Turkish',             category:'translation', lang:'Turkish',    stream:'https://qurango.net/radio/translation_quran_turkish',            backup:null,                             freq:'91.1'  },
  { id: 54, name: 'Quran — Spanish',             category:'translation', lang:'Spanish',    stream:'https://qurango.net/radio/translation_quran_spanish_afs',       backup:null,                             freq:'92.3'  },
  { id: 55, name: 'Quran — German',              category:'translation', lang:'German',     stream:'https://qurango.net/radio/translation_quran_german',             backup:null,                             freq:'93.5'  },
  { id: 56, name: 'Quran — Persian',             category:'translation', lang:'Persian',    stream:'https://qurango.net/radio/translation_quran_farsi',              backup:null,                             freq:'94.7'  },
  { id: 57, name: 'Quran — Chinese',             category:'translation', lang:'Chinese',    stream:'https://qurango.net/radio/translation_quran_chinese',            backup:null,                             freq:'95.9'  },
  { id: 58, name: 'Quran — Portuguese',          category:'translation', lang:'Portuguese', stream:'https://qurango.net/radio/translation_quran_portuguese',         backup:null,                             freq:'97.1'  },
  { id: 59, name: 'Quran — Kurdish',             category:'translation', lang:'Kurdish',    stream:'https://qurango.net/radio/translation_quran_kurdish',            backup:null,                             freq:'98.3'  },
  // ── Regional
  { id: 60, name: 'Radio Islam South Africa',    category:'regional',    lang:'English',    stream:'https://islamicbulletin.site:8114/stream',                      backup:'http://listen.radioislam.co.za:8080/radioislam.mp3', freq:'99.1' },
  { id: 61, name: 'Radio Egypt',                 category:'regional',    lang:'Arabic',     stream:'https://islamicbulletin.site:8104/stream',                      backup:null,                             freq:'100.5' },
  { id: 62, name: 'River Nile Radio',            category:'regional',    lang:'Arabic',     stream:'https://islamicbulletin.site:8064/stream',                      backup:null,                             freq:'101.7' },
  { id: 63, name: 'Radio Islam Palestine',       category:'regional',    lang:'Arabic',     stream:'http://www.quran-radio.org:8002/;stream/1',                      backup:null,                             freq:'102.9' },
  { id: 64, name: 'Al-Ansaar Radio SA',          category:'regional',    lang:'English',    stream:'https://al-ansaar.simplestreaming.co.za/listen/al-ansaar_radio/radio.mp3', backup:null,               freq:'104.1' },
  { id: 65, name: 'Noor al-Iman FM Libya',       category:'regional',    lang:'Arabic',     stream:'https://stream.zeno.fm/r6eprdta6nhvv',                          backup:null,                             freq:'105.7' },
  { id: 66, name: 'Darusalam Radio Iraq',        category:'regional',    lang:'Arabic',     stream:'https://streams.radio.co/s0975ec186/listen',                    backup:null,                             freq:'106.3' },
  { id: 67, name: 'Peace Radio India',           category:'regional',    lang:'English',    stream:'http://stream.peaceradio.com:8000/high',                         backup:null,                             freq:'107.5' },
  // ── World Languages
  { id: 68, name: 'Radio Islam Urdu',            category:'world',       lang:'Urdu',       stream:'https://islamicbulletin.site:8050/stream',                      backup:null,                             freq:'88.7'  },
  { id: 69, name: 'Radio Islam Spanish',         category:'world',       lang:'Spanish',    stream:'https://islamicbulletin.site:8048/stream',                      backup:null,                             freq:'89.5'  },
  { id: 70, name: 'Francophone Radio',           category:'world',       lang:'French',     stream:'https://islamicbulletin.site:8046/stream',                      backup:null,                             freq:'90.7'  },
  { id: 71, name: 'Radio Islam Deutsch',         category:'world',       lang:'German',     stream:'https://islamicbulletin.site:8044/stream',                      backup:null,                             freq:'91.9'  },
  { id: 72, name: 'Radio Islam Italian',         category:'world',       lang:'Italian',    stream:'https://islamicbulletin.site:8042/stream',                      backup:null,                             freq:'93.1'  },
  { id: 73, name: 'Radio Islam Portuguese',      category:'world',       lang:'Portuguese', stream:'https://islamicbulletin.site:8040/stream',                      backup:null,                             freq:'94.3'  },
  { id: 74, name: 'Radio Islam Tigrinya',        category:'world',       lang:'Tigrinya',   stream:'https://islamicbulletin.site:8038/stream',                      backup:null,                             freq:'95.5'  },
  { id: 75, name: 'Radio Islam Amharic',         category:'world',       lang:'Amharic',    stream:'https://islamicbulletin.site:8032/stream',                      backup:null,                             freq:'96.7'  },
  { id: 76, name: 'Radio Islam Chinese',         category:'world',       lang:'Chinese',    stream:'https://islamicbulletin.site:8036/stream',                      backup:null,                             freq:'97.9'  },
  { id: 77, name: 'Radio Islam Melayu',          category:'world',       lang:'Malay',      stream:'https://islamicbulletin.site:8024/stream',                      backup:null,                             freq:'99.7'  },
  { id: 78, name: 'Islamic Radio Filipino',      category:'world',       lang:'Filipino',   stream:'https://islamicbulletin.site:8030/stream',                      backup:null,                             freq:'100.9' },
  // ── Nasheed
  { id: 79, name: 'Nasheed Radio',               category:'nasheed',     lang:'Multi',      stream:'https://stream.zeno.fm/fukomobrbxbtv',                          backup:null,                             freq:'102.1' },
  { id: 80, name: 'Eid Takbirat',                category:'nasheed',     lang:'Arabic',     stream:'https://qurango.net/radio/eid',                                 backup:null,                             freq:'103.3' },

  // ── More Reciters
  { id: 81,  name: 'Abdullah Basfar',            category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/abdullahbasfar',                      backup:'http://live.mp3quran.net:9968',  freq:'88.2'  },
  { id: 82,  name: 'Tawfeeq As-Sayegh',          category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/tawfiq_assayegh',                     backup:'http://live.mp3quran.net:9998',  freq:'88.6'  },
  { id: 83,  name: 'Abdullahi Al-Johani',         category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/abdullahaljohani',                    backup:'http://live.mp3quran.net:9970',  freq:'89.0'  },
  { id: 84,  name: 'Raad Mohammad Al-Kurdi',      category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/raad_alkurdi',                        backup:'http://live.mp3quran.net:9982',  freq:'89.4'  },
  { id: 85,  name: 'Ahmed Saud',                  category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/ahmed_saud',                          backup:'http://live.mp3quran.net:9976',  freq:'89.8'  },
  { id: 86,  name: 'Abdulaziz Al-Ahmad',          category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/abdulaziz_alahmad',                   backup:'http://live.mp3quran.net:9996',  freq:'90.2'  },
  { id: 87,  name: 'Wadee Hammadi Al-Yamani',     category:'reciters',    lang:'Arabic',     stream:'http://live.mp3quran.net:9980',                                  backup:null,                             freq:'90.6'  },
  { id: 88,  name: 'Yasser Salamah',              category:'reciters',    lang:'Arabic',     stream:'http://live.mp3quran.net:9980',                                  backup:null,                             freq:'91.0'  },
  { id: 89,  name: 'Fahad Al-Kandari',            category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/fahad_alkandari',                     backup:null,                             freq:'91.4'  },
  { id: 90,  name: 'Ibrahim Al-Akhdar',           category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/ibrahim_alakhdar',                    backup:null,                             freq:'91.8'  },
  { id: 91,  name: 'Maher Shakhashiro',           category:'reciters',    lang:'Arabic',     stream:'http://live.mp3quran.net:9964',                                  backup:null,                             freq:'92.2'  },
  { id: 92,  name: 'Khalifa Al-Tunaiji',          category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/khalefa_altnaiji',                    backup:null,                             freq:'92.6'  },
  { id: 93,  name: 'Salah Al-Hashim',             category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/salah_alhashim',                      backup:null,                             freq:'93.0'  },
  { id: 94,  name: 'Nabil Al-Rifai',              category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/nabil_arrifai',                       backup:null,                             freq:'93.4'  },
  { id: 95,  name: 'Mohammed Al-Lohaidan',        category:'reciters',    lang:'Arabic',     stream:'https://qurango.net/radio/mohammed_allohaidan',                 backup:null,                             freq:'93.8'  },

  // ── More Quran Live
  { id: 96,  name: 'Quran Radio Makkah Live',     category:'quran',       lang:'Arabic',     stream:'https://stream.radiojar.com/4wqre23fytzuv',                     backup:null,                             freq:'106.5' },
  { id: 97,  name: 'Al-Quran Al-Kareem Radio',    category:'quran',       lang:'Arabic',     stream:'https://stream.zeno.fm/q3uw4kxkp7zuv',                          backup:null,                             freq:'107.1' },
  { id: 98,  name: 'Quran Radio Sudan',           category:'quran',       lang:'Arabic',     stream:'https://stream.zeno.fm/0r0qa791zs8uv',                          backup:null,                             freq:'107.7' },
  { id: 99,  name: 'Holy Quran Pakistan',         category:'quran',       lang:'Urdu',       stream:'https://stream.zeno.fm/ts4p1m3uyrhvv',                          backup:null,                             freq:'88.4'  },
  { id: 100, name: 'Voice of Quran',              category:'quran',       lang:'Arabic',     stream:'https://stream.zeno.fm/yn65hkfklp0uv',                          backup:null,                             freq:'89.2'  },

  // ── More Islamic Talks
  { id: 101, name: 'Al-Quran Recitation Mix',     category:'islamic',     lang:'Arabic',     stream:'https://qurango.net/radio/mix',                                 backup:null,                             freq:'100.8' },
  { id: 102, name: 'Children Quran Radio',        category:'islamic',     lang:'Arabic',     stream:'https://qurango.net/radio/atfal',                               backup:null,                             freq:'101.2' },
  { id: 103, name: 'Islamic Reminders',           category:'islamic',     lang:'English',    stream:'https://islamicbulletin.site:8080/stream',                      backup:null,                             freq:'101.6' },
  { id: 104, name: 'Bayyinah TV Audio',           category:'islamic',     lang:'English',    stream:'https://stream.zeno.fm/qvkh1gsfhbhvv',                          backup:null,                             freq:'102.0' },
  { id: 105, name: 'Muslim Central',              category:'islamic',     lang:'English',    stream:'https://stream.zeno.fm/fa4p61mcmf8uv',                          backup:null,                             freq:'102.4' },
  { id: 106, name: 'Islamic Guidance Radio',      category:'islamic',     lang:'English',    stream:'https://stream.zeno.fm/9b3ufkz55s8uv',                          backup:null,                             freq:'102.8' },
  { id: 107, name: 'Huda TV Radio',               category:'islamic',     lang:'English',    stream:'https://stream.zeno.fm/f3wvkgb1p7zuv',                          backup:null,                             freq:'103.2' },
  { id: 108, name: 'Dua & Dhikr Radio',           category:'islamic',     lang:'Arabic',     stream:'https://qurango.net/radio/dua',                                 backup:null,                             freq:'103.6' },

  // ── More Scholars
  { id: 109, name: 'Ibn Al-Uthaymeen Radio',      category:'scholars',    lang:'Arabic',     stream:'https://islamicbulletin.site:8064/stream',                      backup:null,                             freq:'104.0' },
  { id: 110, name: 'Sheikh Al-Albani Radio',      category:'scholars',    lang:'Arabic',     stream:'https://stream.zeno.fm/4b5ksmgvxs8uv',                          backup:null,                             freq:'104.4' },
  { id: 111, name: 'Bilal Assad Radio',           category:'scholars',    lang:'English',    stream:'https://stream.zeno.fm/xvkh9gzfhbhvv',                          backup:null,                             freq:'104.8' },
  { id: 112, name: 'Nouman Ali Khan Radio',       category:'scholars',    lang:'English',    stream:'https://stream.zeno.fm/wkh9gzf3hbhvv',                          backup:null,                             freq:'105.2' },
  { id: 113, name: 'Mufti Menk Radio',            category:'scholars',    lang:'English',    stream:'https://stream.zeno.fm/r0z0yjkx3s8uv',                          backup:null,                             freq:'105.6' },

  // ── More Regional
  { id: 114, name: 'Radio Islam Nigeria',         category:'regional',    lang:'Hausa',      stream:'https://stream.zeno.fm/09sxpqhuxs8uv',                          backup:null,                             freq:'88.8'  },
  { id: 115, name: 'Radio Islam Indonesia',       category:'regional',    lang:'Indonesian', stream:'https://stream.zeno.fm/m8twunpe2b0uv',                          backup:null,                             freq:'89.6'  },
  { id: 116, name: 'Idaacada Islaamiga Somalia',  category:'regional',    lang:'Somali',     stream:'https://stream.zeno.fm/3q5v9uzlp7zuv',                          backup:null,                             freq:'90.4'  },
  { id: 117, name: 'Radio Islam Bangladesh',      category:'regional',    lang:'Bengali',    stream:'https://stream.zeno.fm/k9p3uwxlp7zuv',                          backup:null,                             freq:'91.2'  },
  { id: 118, name: 'Radio Islam Turkey',          category:'regional',    lang:'Turkish',    stream:'https://stream.zeno.fm/w0tw4kz3p7zuv',                          backup:null,                             freq:'92.0'  },
  { id: 119, name: 'Radio Islam Morocco',         category:'regional',    lang:'Arabic',     stream:'https://stream.zeno.fm/4q5v9u0lp7zuv',                          backup:null,                             freq:'92.8'  },
  { id: 120, name: 'Radio Islam Malaysia',        category:'regional',    lang:'Malay',      stream:'https://stream.zeno.fm/b4twunpe2b0uv',                          backup:null,                             freq:'93.6'  },

  // ── More World Languages
  { id: 121, name: 'Radio Islam Swahili',         category:'world',       lang:'Swahili',    stream:'https://islamicbulletin.site:8026/stream',                      backup:null,                             freq:'94.6'  },
  { id: 122, name: 'Radio Islam Bengali',         category:'world',       lang:'Bengali',    stream:'https://islamicbulletin.site:8028/stream',                      backup:null,                             freq:'95.4'  },
  { id: 123, name: 'Radio Islam Russian',         category:'world',       lang:'Russian',    stream:'https://islamicbulletin.site:8034/stream',                      backup:null,                             freq:'96.2'  },
  { id: 124, name: 'Radio Islam Hausa',           category:'world',       lang:'Hausa',      stream:'https://islamicbulletin.site:8020/stream',                      backup:null,                             freq:'97.0'  },
  { id: 125, name: 'Radio Islam Albanian',        category:'world',       lang:'Albanian',   stream:'https://islamicbulletin.site:8016/stream',                      backup:null,                             freq:'97.8'  },
  { id: 126, name: 'Radio Islam Bosnian',         category:'world',       lang:'Bosnian',    stream:'https://islamicbulletin.site:8018/stream',                      backup:null,                             freq:'98.6'  },
  { id: 127, name: 'Radio Islam Indonesian',      category:'world',       lang:'Indonesian', stream:'https://islamicbulletin.site:8022/stream',                      backup:null,                             freq:'99.4'  },
  { id: 128, name: 'Radio Islam Somali',          category:'world',       lang:'Somali',     stream:'https://islamicbulletin.site:8012/stream',                      backup:null,                             freq:'99.8'  },
  { id: 129, name: 'Radio Islam Swahili 2',       category:'world',       lang:'Swahili',    stream:'https://islamicbulletin.site:8014/stream',                      backup:null,                             freq:'100.2' },
  { id: 130, name: 'Radio Islam Dutch',           category:'world',       lang:'Dutch',      stream:'https://islamicbulletin.site:8008/stream',                      backup:null,                             freq:'100.6' },

  // ── More Nasheed
  { id: 131, name: 'Anasheed Al-Islam',           category:'nasheed',     lang:'Arabic',     stream:'https://stream.zeno.fm/2k5v9u8lp7zuv',                          backup:null,                             freq:'101.0' },
  { id: 132, name: 'Children Nasheeds',           category:'nasheed',     lang:'Arabic',     stream:'https://qurango.net/radio/nasheed_children',                    backup:null,                             freq:'101.4' },
  { id: 133, name: 'Islamic Songs Radio',         category:'nasheed',     lang:'Multi',      stream:'https://stream.zeno.fm/vkh9gz3fhbhvv',                          backup:null,                             freq:'101.8' },
  { id: 134, name: 'Sout Al-Islam Nasheed',       category:'nasheed',     lang:'Arabic',     stream:'https://stream.zeno.fm/p3uw4kxkp7zuv',                          backup:null,                             freq:'102.6' },

  // ── More Translation
  { id: 135, name: 'Quran — Indonesian',          category:'translation', lang:'Indonesian', stream:'https://qurango.net/radio/translation_quran_indonesian',        backup:null,                             freq:'103.0' },
  { id: 136, name: 'Quran — Swahili',             category:'translation', lang:'Swahili',    stream:'https://qurango.net/radio/translation_quran_swahili',           backup:null,                             freq:'103.4' },
  { id: 137, name: 'Quran — Russian',             category:'translation', lang:'Russian',    stream:'https://qurango.net/radio/translation_quran_russian',           backup:null,                             freq:'103.8' },
  { id: 138, name: 'Quran — Hausa',               category:'translation', lang:'Hausa',      stream:'https://qurango.net/radio/translation_quran_hausa',             backup:null,                             freq:'104.2' },
  { id: 139, name: 'Quran — Bengali',             category:'translation', lang:'Bengali',    stream:'https://qurango.net/radio/translation_quran_bengali',           backup:null,                             freq:'104.6' },
  { id: 140, name: 'Quran — Malay',               category:'translation', lang:'Malay',      stream:'https://qurango.net/radio/translation_quran_malay',             backup:null,                             freq:'105.0' },
  { id: 141, name: 'Quran — Somali',              category:'translation', lang:'Somali',     stream:'https://qurango.net/radio/translation_quran_somali',            backup:null,                             freq:'105.4' },
  { id: 142, name: 'Quran — Albanian',            category:'translation', lang:'Albanian',   stream:'https://qurango.net/radio/translation_quran_albanian',          backup:null,                             freq:'105.8' },

  // ── Batch 3: More Reciters ───────────────────────────────────────────────
  { id: 143, name: 'Adel Al-Kalbani',            category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/adel_alkalbani',                      backup:null,                             freq:'88.3' },
  { id: 144, name: 'Khaled Al-Qahtani',          category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/khaled_alqahtani',                    backup:null,                             freq:'88.7' },
  { id: 145, name: 'Mostafa Ismail',             category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/mostafa_ismail',                      backup:null,                             freq:'89.1' },
  { id: 146, name: 'Mohammed Al-Tablawi',        category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/mohammed_altablawi',                  backup:null,                             freq:'89.5' },
  { id: 147, name: 'Abdul-Basit Mujawwad',       category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/abdulbasit_mujawwad',                 backup:null,                             freq:'89.9' },
  { id: 148, name: 'Mohammed Jibreel',           category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/mohammed_jibreel',                    backup:null,                             freq:'90.3' },
  { id: 149, name: 'Mahmoud Shahat',             category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/mahmoud_shahat',                      backup:null,                             freq:'90.7' },
  { id: 150, name: 'Mishary — Warsh',            category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/mishary_warsh',                       backup:null,                             freq:'91.1' },
  { id: 151, name: 'Nasser Al-Qatami',           category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/nasser_alqatami',                     backup:null,                             freq:'91.5' },
  { id: 152, name: 'Salah Bukhatir',             category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/salah_bukhatir',                      backup:null,                             freq:'91.9' },
  { id: 153, name: 'Fares Abbad',                category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/fares_abbad',                         backup:null,                             freq:'92.3' },
  { id: 154, name: 'Hani Al-Rifai',              category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/hani_alrifai',                        backup:null,                             freq:'92.7' },
  { id: 155, name: 'Ali Hudaifi',                category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/ali_hudaifi',                         backup:null,                             freq:'93.1' },
  { id: 156, name: 'Ibrahim Al-Akhdar',          category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/ibrahim_alakhdar',                    backup:null,                             freq:'93.5' },
  { id: 157, name: 'Khalifa Al-Tunaiji',         category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/khalifa_altunaiji',                   backup:null,                             freq:'93.9' },
  { id: 158, name: 'Yasser Al-Dosari',           category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/yasser_aldosari',                     backup:null,                             freq:'94.3' },
  { id: 159, name: 'Ahmed Al-Ajmi',              category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/ahmed_alajmi',                        backup:null,                             freq:'94.7' },
  { id: 160, name: 'Raad Al-Kurdi',              category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/raad_alkurdi',                        backup:null,                             freq:'95.1' },
  { id: 161, name: 'Tawfeeq As-Sayegh',         category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/tawfeeq_assayegh',                    backup:null,                             freq:'95.5' },
  { id: 162, name: 'Wadee\' Hammadi Al-Yamani', category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/wadee_hammadi',                       backup:null,                             freq:'95.9' },
  { id: 163, name: 'Abdullah Awwad Al-Juhani',  category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/abdullah_aljuhani',                   backup:null,                             freq:'96.3' },
  { id: 164, name: 'Bandar Baleela',             category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/bandar_baleela',                      backup:null,                             freq:'96.7' },
  { id: 165, name: 'Maher Al-Muaiqly — Rewaya', category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/maher_rewaya',                        backup:null,                             freq:'97.1' },
  { id: 166, name: 'Saad Al-Ghamdi — Rewaya',   category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/saad_rewaya',                         backup:null,                             freq:'97.5' },
  { id: 167, name: 'Saud Al-Shuraim',            category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/saud_alshuraim',                      backup:null,                             freq:'97.9' },
  { id: 168, name: 'Abdullah Al-Basfar',         category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/abdullah_albasfar',                   backup:null,                             freq:'98.3' },
  { id: 169, name: 'Abdulrahman Al-Ossi',        category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/abdulrahman_alossi',                  backup:null,                             freq:'98.7' },
  { id: 170, name: 'Majed Al-Zamil',             category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/majed_alzamil',                       backup:null,                             freq:'99.1' },
  { id: 171, name: 'Hatem Farid Al-Weishaly',   category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/hatem_alweishaly',                    backup:null,                             freq:'99.5' },
  { id: 172, name: 'Ahmad Saud',                 category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/ahmad_saud',                          backup:null,                             freq:'99.9' },
  { id: 173, name: 'Ismail Al-Nouri',            category:'reciters',    lang:'Arabic',     stream:'https://Qurango.net/radio/ismail_alnouri',                      backup:null,                             freq:'100.3' },

  // ── More Quran Live ──────────────────────────────────────────────────────
  { id: 174, name: 'Quran Radio — Sudan',        category:'quran',       lang:'Arabic',     stream:'http://stream.radiojarvis.com/listen/quran_fm_sudan/stream',   backup:null,                             freq:'100.7' },
  { id: 175, name: 'Quran Radio — Libya',        category:'quran',       lang:'Arabic',     stream:'http://stream.radiojarvis.com/listen/quran_fm_libya/stream',   backup:null,                             freq:'101.1' },
  { id: 176, name: 'Quran Radio — Iraq',         category:'quran',       lang:'Arabic',     stream:'http://stream.radiojarvis.com/listen/holy_quran_iraq/stream',  backup:null,                             freq:'101.5' },
  { id: 177, name: 'Holy Quran — Pakistan',      category:'quran',       lang:'Arabic',     stream:'https://radio.saudiairlines.com.sa/radio/quran',                backup:null,                             freq:'101.9' },
  { id: 178, name: 'Quran Kareem — Iran',        category:'quran',       lang:'Persian',    stream:'https://cdn.qurankarem.com/live',                               backup:null,                             freq:'102.3' },
  { id: 179, name: 'Voice of Quran — Malaysia',  category:'quran',       lang:'Malay',      stream:'https://stream.ikim.gov.my/radio/IKIM.FM/icecast.audio',       backup:null,                             freq:'102.7' },
  { id: 180, name: 'Quran Radio — Morocco',      category:'quran',       lang:'Arabic',     stream:'https://sndup.net/2r2v/stream',                                 backup:null,                             freq:'103.1' },
  { id: 181, name: 'Al-Azhar Quran Radio',       category:'quran',       lang:'Arabic',     stream:'https://media.azhar.eg:8000/stream',                            backup:null,                             freq:'103.5' },

  // ── More Islamic Talks ───────────────────────────────────────────────────
  { id: 182, name: 'Huda TV Radio',              category:'islamic',     lang:'English',    stream:'https://streamer.hudatv.com:7000/stream',                       backup:null,                             freq:'103.9' },
  { id: 183, name: 'Islam Channel Radio',        category:'islamic',     lang:'English',    stream:'https://stream.radioislam.org.za/radio_islam_audio',            backup:null,                             freq:'104.3' },
  { id: 184, name: 'Muslim Central',             category:'islamic',     lang:'English',    stream:'https://podcast.muslimcentral.com/stream',                      backup:null,                             freq:'104.7' },
  { id: 185, name: 'Green Lane Masjid Radio',    category:'islamic',     lang:'English',    stream:'https://s4.voscast.com:10642/stream',                           backup:null,                             freq:'105.1' },
  { id: 186, name: 'Noor Sunnah Radio',          category:'islamic',     lang:'Arabic',     stream:'https://noor-sunnah.net:9000/stream',                           backup:null,                             freq:'105.5' },
  { id: 187, name: 'Saut Al-Islam Tunisia',      category:'islamic',     lang:'Arabic',     stream:'https://n11.radiojar.com/w5r5e6q3q7uv',                        backup:null,                             freq:'105.9' },
  { id: 188, name: 'Radio Tawhid — France',      category:'islamic',     lang:'French',     stream:'https://listen.radiotawhid.com/stream',                         backup:null,                             freq:'106.3' },
  { id: 189, name: 'Radio Islam — Germany',      category:'islamic',     lang:'German',     stream:'https://stream.radioislam.de/stream',                           backup:null,                             freq:'106.7' },
  { id: 190, name: 'Voice of Islam — UK',        category:'islamic',     lang:'English',    stream:'https://radio.voiceofislam.co.uk/stream',                       backup:null,                             freq:'107.1' },
  { id: 191, name: 'Radio Salaam — Finland',     category:'islamic',     lang:'Somali',     stream:'https://stream.radiosalaam.fi/stream',                          backup:null,                             freq:'107.5' },
  { id: 192, name: 'Radio Ummat — Netherlands',  category:'islamic',     lang:'Dutch',      stream:'https://stream.radiozuid.nl/radiozuid',                         backup:null,                             freq:'107.9' },
  { id: 193, name: 'Al-Furqan Radio — Belgium',  category:'islamic',     lang:'Arabic',     stream:'https://stream.alfurqan.be/radio',                              backup:null,                             freq:'108.0' },

  // ── More Scholars ────────────────────────────────────────────────────────
  { id: 194, name: 'Hamza Yusuf — Lectures',    category:'scholars',    lang:'English',    stream:'https://podcast.zaytuna.edu/stream',                            backup:null,                             freq:'88.1' },
  { id: 195, name: 'Omar Suleiman Radio',        category:'scholars',    lang:'English',    stream:'https://stream.yaqeen.institute/radio',                         backup:null,                             freq:'88.5' },
  { id: 196, name: 'Yasir Qadhi — Al-Maghrib',  category:'scholars',    lang:'English',    stream:'https://stream.almaghrib.org/radio',                            backup:null,                             freq:'88.9' },
  { id: 197, name: 'Zakir Naik — Peace TV',     category:'scholars',    lang:'English',    stream:'https://peacetv.tv/radio/stream',                               backup:null,                             freq:'89.3' },
  { id: 198, name: 'Mufti Menk Radio',           category:'scholars',    lang:'English',    stream:'https://stream.muftimenov.com/radio',                           backup:null,                             freq:'89.7' },
  { id: 199, name: 'Sheikh Shuraim — Lectures', category:'scholars',    lang:'Arabic',     stream:'https://Qurango.net/radio/shuraim_lectures',                    backup:null,                             freq:'90.1' },
  { id: 200, name: 'Al-Bayyinah — Nouman Ali',  category:'scholars',    lang:'English',    stream:'https://stream.bayyinah.tv/radio',                              backup:null,                             freq:'90.5' },

  // ── More Nasheed ─────────────────────────────────────────────────────────
  { id: 201, name: 'Maher Zain Radio',           category:'nasheed',     lang:'Multi',      stream:'https://stream.maherzain.com/radio',                            backup:null,                             freq:'90.9' },
  { id: 202, name: 'Sami Yusuf Radio',           category:'nasheed',     lang:'Multi',      stream:'https://stream.samiyusuf.com/radio',                            backup:null,                             freq:'91.3' },
  { id: 203, name: 'Native Deen Radio',          category:'nasheed',     lang:'English',    stream:'https://stream.nativedeen.com/radio',                           backup:null,                             freq:'91.7' },
  { id: 204, name: 'Turkish Ilahi Radio',        category:'nasheed',     lang:'Turkish',    stream:'https://playerservices.streamtheworld.com/api/livestream-redirect/TURK_ILAHI.mp3', backup:null,          freq:'92.1' },
  { id: 205, name: 'Nasyid Indonesia',           category:'nasheed',     lang:'Indonesian', stream:'https://stream.radionasyid.com/stream',                         backup:null,                             freq:'92.5' },
  { id: 206, name: 'Qasida — Morocco',           category:'nasheed',     lang:'Arabic',     stream:'https://stream.radioqasida.ma/stream',                          backup:null,                             freq:'92.9' },
  { id: 207, name: 'Anasheed Al-Aqsa',           category:'nasheed',     lang:'Arabic',     stream:'https://stream.anasheedpalestine.ps/radio',                     backup:null,                             freq:'93.3' },
  { id: 208, name: 'Sufi Music Radio',           category:'nasheed',     lang:'Multi',      stream:'https://stream.sufimusic.net/radio',                            backup:null,                             freq:'93.7' },

  // ── Qassam & Palestinian Nasheeds ──────────────────────────────────────────
  { id: 248, name: 'Anasheed Islamic',            category:'nasheed',     lang:'Arabic',     stream:'https://stream.zeno.fm/y84fyjtguiwtv',                          backup:null,                             freq:'94.0' },
  { id: 249, name: 'World Nasheed Radio',         category:'nasheed',     lang:'Arabic',     stream:'https://stream.zeno.fm/s7xy0sxat68uv',                          backup:null,                             freq:'94.2' },
  { id: 250, name: 'Shurooq Islamic Mix',         category:'nasheed',     lang:'Arabic',     stream:'https://stream.zeno.fm/738zzn3syc9uv',                          backup:null,                             freq:'94.4' },
  { id: 251, name: 'Islamic Tune Radio',          category:'nasheed',     lang:'Arabic',     stream:'https://stream.zeno.fm/ichfja4hj4tuv',                          backup:null,                             freq:'94.6' },
  { id: 252, name: 'Arabic Nasheed — Palestine',  category:'nasheed',     lang:'Arabic',     stream:'https://stream.zeno.fm/dsqgy1epva0uv',                          backup:null,                             freq:'94.8' },
  { id: 253, name: 'Voice of Palestine',          category:'nasheed',     lang:'Arabic',     stream:'https://pbc.furrera.ps/voiceofpalestine/tracks-a1/mono.m3u8',   backup:null,                             freq:'95.0' },
  { id: 254, name: 'Quran Radio — Nablus',        category:'nasheed',     lang:'Arabic',     stream:'http://www.quran-radio.org:8002/',                               backup:null,                             freq:'95.2' },
  { id: 255, name: 'Athan Radio — Palestine',     category:'nasheed',     lang:'Arabic',     stream:'http://streamer.mada.ps:8016/athan',                             backup:null,                             freq:'95.4' },
  { id: 256, name: 'Radio Al-Nas — Palestine',    category:'nasheed',     lang:'Arabic',     stream:'https://cdna.streamgates.net/RadioNas/Live-Audio/icecast.audio', backup:null,                             freq:'95.6' },
  { id: 257, name: 'Radio AlHara — Palestine',    category:'nasheed',     lang:'Arabic',     stream:'http://n02.radiojar.com/78cxy6wkxtzuv',                          backup:null,                             freq:'95.8' },
  { id: 258, name: 'Quran Radio — Palestine',     category:'nasheed',     lang:'Arabic',     stream:'https://n0a.radiojar.com/0tpy1h0kxtzuv',                         backup:null,                             freq:'96.0' },
  { id: 259, name: 'Nasheed FM — Malaysia',       category:'nasheed',     lang:'Malay',      stream:'http://stereo.nasyidfm.com:8000/',                               backup:null,                             freq:'96.2' },
  { id: 260, name: 'Radio Ikhlas — UK',           category:'nasheed',     lang:'English',    stream:'https://radio.canstream.co.uk:8050/live.mp3',                    backup:null,                             freq:'96.4' },
  { id: 261, name: 'Al-Ansaar Radio — SA',        category:'nasheed',     lang:'English',    stream:'https://al-ansaar.simplestreaming.co.za/listen/al-ansaar_radio/radio.mp3', backup:null,                    freq:'96.6' },

  // ── More Regional ────────────────────────────────────────────────────────
  { id: 209, name: 'Radio Islam — Kenya',        category:'regional',    lang:'Swahili',    stream:'https://radioislam.or.ke:8000/stream',                          backup:null,                             freq:'94.1' },
  { id: 210, name: 'Radio Pakistan — Quran',     category:'regional',    lang:'Urdu',       stream:'https://stream.radio.gov.pk/quran',                             backup:null,                             freq:'94.5' },
  { id: 211, name: 'Radio Fana — Ethiopia',      category:'regional',    lang:'Amharic',    stream:'https://stream.fanabc.com/radio',                               backup:null,                             freq:'94.9' },
  { id: 212, name: 'Saudi Quran — Backup',       category:'regional',    lang:'Arabic',     stream:'https://backup.aloula.fm.sa/quranfm',                           backup:null,                             freq:'95.3' },
  { id: 213, name: 'UAE Holy Quran',             category:'regional',    lang:'Arabic',     stream:'https://streaming.admc.ae/holyquran',                           backup:null,                             freq:'95.7' },
  { id: 214, name: 'Qatar Quran Radio',          category:'regional',    lang:'Arabic',     stream:'https://stream.qatarradio.qa/holyquran',                        backup:null,                             freq:'96.1' },
  { id: 215, name: 'Kuwait Quran FM',            category:'regional',    lang:'Arabic',     stream:'https://stream.media.gov.kw/quran',                             backup:null,                             freq:'96.5' },
  { id: 216, name: 'Jordan Quran Radio',         category:'regional',    lang:'Arabic',     stream:'https://stream.jrtv.jo/quran',                                  backup:null,                             freq:'96.9' },
  { id: 217, name: 'Radio Algérie — Quran',      category:'regional',    lang:'Arabic',     stream:'https://stream.radioalgerie.dz/quran',                          backup:null,                             freq:'97.3' },
  { id: 218, name: 'Radio Tunisie — Zitouna',    category:'regional',    lang:'Arabic',     stream:'https://n07.radiojar.com/8s5u5tpdtwzuv',                        backup:null,                             freq:'97.7' },
  { id: 219, name: 'Ghana Muslim Radio',         category:'regional',    lang:'English',    stream:'https://stream.ghanamuslimradio.com/stream',                    backup:null,                             freq:'98.1' },
  { id: 220, name: 'Radio Imaan — Tanzania',     category:'regional',    lang:'Swahili',    stream:'https://stream.radioimaan.co.tz/stream',                        backup:null,                             freq:'98.5' },

  // ── More World Languages ─────────────────────────────────────────────────
  { id: 221, name: 'Quran — Pashto',             category:'translation', lang:'Pashto',     stream:'https://qurango.net/radio/translation_quran_pashto',            backup:null,                             freq:'98.9' },
  { id: 222, name: 'Quran — Dari',               category:'translation', lang:'Dari',       stream:'https://qurango.net/radio/translation_quran_dari',              backup:null,                             freq:'99.3' },
  { id: 223, name: 'Quran — Kurdish',            category:'translation', lang:'Kurdish',    stream:'https://qurango.net/radio/translation_quran_kurdish',           backup:null,                             freq:'99.7' },
  { id: 224, name: 'Quran — Tamil',              category:'translation', lang:'Tamil',      stream:'https://qurango.net/radio/translation_quran_tamil',             backup:null,                             freq:'100.1' },
  { id: 225, name: 'Quran — Sindhi',             category:'translation', lang:'Sindhi',     stream:'https://qurango.net/radio/translation_quran_sindhi',            backup:null,                             freq:'100.5' },
  { id: 226, name: 'Quran — Hindi',              category:'translation', lang:'Hindi',      stream:'https://qurango.net/radio/translation_quran_hindi',             backup:null,                             freq:'100.9' },
  { id: 227, name: 'Quran — Gujarati',           category:'translation', lang:'Gujarati',   stream:'https://qurango.net/radio/translation_quran_gujarati',          backup:null,                             freq:'101.3' },
  { id: 228, name: 'Quran — Thai',               category:'translation', lang:'Thai',       stream:'https://qurango.net/radio/translation_quran_thai',              backup:null,                             freq:'101.7' },
  { id: 229, name: 'Quran — Vietnamese',         category:'translation', lang:'Vietnamese', stream:'https://qurango.net/radio/translation_quran_vietnamese',        backup:null,                             freq:'102.1' },
  { id: 230, name: 'Quran — Korean',             category:'translation', lang:'Korean',     stream:'https://qurango.net/radio/translation_quran_korean',            backup:null,                             freq:'102.5' },
  { id: 231, name: 'Quran — Japanese',           category:'translation', lang:'Japanese',   stream:'https://qurango.net/radio/translation_quran_japanese',          backup:null,                             freq:'102.9' },
  { id: 232, name: 'Quran — Polish',             category:'translation', lang:'Polish',     stream:'https://qurango.net/radio/translation_quran_polish',            backup:null,                             freq:'103.3' },
  { id: 233, name: 'Quran — Swedish',            category:'translation', lang:'Swedish',    stream:'https://qurango.net/radio/translation_quran_swedish',           backup:null,                             freq:'103.7' },
  { id: 234, name: 'Quran — Norwegian',          category:'translation', lang:'Norwegian',  stream:'https://qurango.net/radio/translation_quran_norwegian',         backup:null,                             freq:'104.1' },
  { id: 235, name: 'Quran — Danish',             category:'translation', lang:'Danish',     stream:'https://qurango.net/radio/translation_quran_danish',            backup:null,                             freq:'104.5' },

  // ── More Translations (Abdul-Basit style) ────────────────────────────────
  { id: 236, name: 'Quran — Hindi (Recited)',    category:'translation', lang:'Hindi',      stream:'https://qurango.net/radio/translation_quran_hindi_recited',     backup:null,                             freq:'104.9' },
  { id: 237, name: 'Quran — Sindhi (Recited)',   category:'translation', lang:'Sindhi',     stream:'https://qurango.net/radio/translation_quran_sindhi_recited',    backup:null,                             freq:'105.3' },
  { id: 238, name: 'Quran — Amharic',            category:'translation', lang:'Amharic',    stream:'https://qurango.net/radio/translation_quran_amharic',           backup:null,                             freq:'105.7' },
  { id: 239, name: 'Quran — Azerbaijani',        category:'translation', lang:'Azerbaijani',stream:'https://qurango.net/radio/translation_quran_azerbaijani',       backup:null,                             freq:'106.1' },
  { id: 240, name: 'Quran — Kazakh',             category:'translation', lang:'Kazakh',     stream:'https://qurango.net/radio/translation_quran_kazakh',            backup:null,                             freq:'106.5' },
  { id: 241, name: 'Quran — Uyghur',             category:'translation', lang:'Uyghur',     stream:'https://qurango.net/radio/translation_quran_uyghur',            backup:null,                             freq:'106.9' },
  { id: 242, name: 'Quran — Pashto (Recited)',   category:'translation', lang:'Pashto',     stream:'https://qurango.net/radio/translation_quran_pashto_recited',    backup:null,                             freq:'107.3' },
  { id: 243, name: 'Quran — Tagalog',            category:'translation', lang:'Tagalog',    stream:'https://qurango.net/radio/translation_quran_tagalog',           backup:null,                             freq:'107.7' },
  { id: 244, name: 'Quran — Bosnian',            category:'translation', lang:'Bosnian',    stream:'https://qurango.net/radio/translation_quran_bosnian',           backup:null,                             freq:'108.0' },
  { id: 245, name: 'Quran — Dutch',              category:'translation', lang:'Dutch',      stream:'https://qurango.net/radio/translation_quran_dutch',             backup:null,                             freq:'87.6' },
  { id: 246, name: 'Quran — Somali (Basit)',     category:'translation', lang:'Somali',     stream:'https://qurango.net/radio/abdulbasit_somali',                   backup:null,                             freq:'87.9' },
  { id: 247, name: 'Quran — Hausa',              category:'translation', lang:'Hausa',      stream:'https://qurango.net/radio/translation_quran_hausa',             backup:null,                             freq:'88.2' },
]

const CATEGORIES = [
  { key:'all',         label:'All',         Icon: RadioIcon      },
  { key:'reciters',   label:'Reciters',    Icon: Microphone     },
  { key:'quran',      label:'Quran',       Icon: BookBookmark   },
  { key:'islamic',    label:'Islamic',     Icon: Moon           },
  { key:'scholars',   label:'Scholars',    Icon: GraduationCap  },
  { key:'translation',label:'Translation', Icon: Translate      },
  { key:'nasheed',    label:'Nasheed',     Icon: MusicNotes     },
  { key:'regional',   label:'Regional',    Icon: MapPin         },
  { key:'world',      label:'World',       Icon: Globe          },
]

const CAT_GRADIENT = {
  reciters:    ['#B8892A','#7A5A14'],
  quran:       ['#1A7050','#0d4a34'],
  islamic:     ['#2A7A65','#175040'],
  scholars:    ['#5E4D9A','#3d306e'],
  translation: ['#2E7FA0','#1a5470'],
  nasheed:     ['#A05A3C','#6e3c28'],
  regional:    ['#3D8C6A','#275a44'],
  world:       ['#3A9090','#236060'],
}

const [FAVORITES_KEY] = ['radio_favorites']
const loadFavs = () => { try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { return [] } }

export default function Radio() {
  const { playRadio, stopRadio, currentTrack, isPlaying, togglePlay } = usePlayer()

  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch]     = useState('')
  const [favorites, setFavorites] = useState(loadFavs)

  const isRadioActive = currentTrack?.isRadio === true
  const activeId = isRadioActive ? parseInt(currentTrack.id.replace('radio_', '')) : null
  const activeStation = STATIONS.find(s => s.id === activeId)

  const filtered = useMemo(() => STATIONS.filter(s => {
    const matchCat    = activeCategory === 'all' || s.category === activeCategory
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.lang.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }), [activeCategory, search])

  const handleStation = (station) => {
    if (activeId === station.id) {
      // Same station — toggle play/pause
      togglePlay()
    } else {
      playRadio(station)
    }
  }

  const toggleFav = (id, e) => {
    e.stopPropagation()
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="rdx-page">

      {/* ── Hero — full bleed ── */}
      <div className="rdx-hero">
        <HeroPattern />
        <div className="rdx-hero-rosette-wrap" aria-hidden="true"><HeroRosette /></div>

        <div className="rdx-hero-content">
          {/* Bismillah ornament row */}
          <div className="rdx-bismillah">
            <div className="rdx-bismillah-rule"/>
            <svg viewBox="0 0 20 20" width="9" height="9" style={{flexShrink:0}}>
              <polygon points={S8} fill="rgba(201,162,77,0.7)"/>
            </svg>
            <span className="rdx-bismillah-text">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</span>
            <svg viewBox="0 0 20 20" width="9" height="9" style={{flexShrink:0}}>
              <polygon points={S8} fill="rgba(201,162,77,0.7)"/>
            </svg>
            <div className="rdx-bismillah-rule rdx-bismillah-rule-r"/>
          </div>

          {/* Arabic title */}
          <p className="rdx-hero-arabic">الإِذَاعَة</p>
          <h1 className="rdx-hero-title">Islamic Radio</h1>

          {/* Thin divider */}
          <div className="rdx-hero-divider">
            <span/>
            <svg viewBox="0 0 20 20" width="8" height="8">
              <polygon points={S8} fill="rgba(201,162,77,0.5)"/>
            </svg>
            <span/>
          </div>

          <p className="rdx-hero-sub">
            261 live stations · Quran · Lectures · Nasheed · World Languages
          </p>
        </div>
      </div>

      {/* ── Padded content wrapper ── */}
      <div className="rdx-content">

      {/* ── Now tuning strip (only when a radio station is active) ── */}
      {activeStation && (
        <div className="rdx-now-strip" style={{
          '--sc1': CAT_GRADIENT[activeStation.category]?.[0] ?? '#1A5C3A',
          '--sc2': CAT_GRADIENT[activeStation.category]?.[1] ?? '#0B3D26',
        }}>
          <div className="rdx-now-strip-bg"/>
          <div className="rdx-now-strip-inner">
            <div className="rdx-now-eq-wrap">
              {isPlaying && isRadioActive ? (
                <div className="rdx-now-eq">
                  <span/><span/><span/><span/>
                </div>
              ) : (
                <RadioIcon size={14} weight="fill" color="rgba(201,162,77,0.8)"/>
              )}
            </div>
            <div className="rdx-now-strip-info">
              <span className="rdx-now-live-badge">
                <span className="rdx-now-live-dot"/>
                LIVE
              </span>
              <span className="rdx-now-strip-name">{activeStation.name}</span>
              <span className="rdx-now-strip-meta">{activeStation.freq} FM · {activeStation.lang}</span>
            </div>
            <button className="rdx-now-stop" onClick={stopRadio}>
              <X size={12} weight="bold"/>
            </button>
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="rdx-search-wrap">
        <div className="rdx-search-box">
          <MagnifyingGlass size={14} weight="bold" className="rdx-search-icon"/>
          <input
            className="rdx-search-input"
            placeholder="Search stations, reciters, language…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search
            ? <button className="rdx-search-clear" onClick={() => setSearch('')}><X size={12} weight="bold"/></button>
            : <span className="rdx-search-count">{filtered.length}</span>
          }
        </div>
      </div>

      {/* ── Category tab bar ── */}
      <div className="rdx-tabs">
        {CATEGORIES.map(({ key, label, Icon }) => {
          const active = activeCategory === key
          return (
            <button
              key={key}
              className={`rdx-tab ${active ? 'rdx-tab-active' : ''}`}
              onClick={() => setActiveCategory(key)}
            >
              <span className="rdx-tab-icon">
                <Icon size={16} weight={active ? 'fill' : 'regular'}/>
              </span>
              <span className="rdx-tab-label">{label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Station list rows ── */}
      <div className="rdx-list">
        {filtered.map((station, idx) => {
          const isOn    = activeId === station.id
          const isFav   = favorites.includes(station.id)
          const [c1,c2] = CAT_GRADIENT[station.category] || ['#1A7050','#0d4a34']
          const CatIcon = CATEGORIES.find(c => c.key === station.category)?.Icon || RadioIcon

          return (
            <div
              key={station.id}
              className={`rdx-row ${isOn ? 'rdx-row-on' : ''}`}
              onClick={() => handleStation(station)}
            >
              {/* Row number */}
              <span className="rdx-row-num">{idx + 1}</span>

              {/* Station logo — colored square with geometric tile + icon */}
              <div className="rdx-row-logo" style={{ background:`linear-gradient(145deg,${c1},${c2})` }}>
                <svg className="rdx-row-tile" viewBox="0 0 40 40" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <pattern id={`rt${station.id}`} width="16" height="16" patternUnits="userSpaceOnUse">
                      <polygon points="8,0.8 8.9,5.6 13.2,3.2 10.4,7.2 15.2,8 10.4,8.8 13.2,12.8 8.9,10.4 8,15.2 7.1,10.4 2.8,12.8 5.6,8.8 0.8,8 5.6,7.2 2.8,3.2 7.1,5.6"
                        fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="40" height="40" fill={`url(#rt${station.id})`}/>
                </svg>
                <span className="rdx-row-logo-icon">
                  {isOn && isPlaying
                    ? <div className="rdx-row-eq"><span/><span/><span/></div>
                    : <CatIcon size={17} weight="duotone" color="rgba(255,255,255,0.92)"/>
                  }
                </span>
              </div>

              {/* Station info */}
              <div className="rdx-row-info">
                <div className="rdx-row-name">{station.name}</div>
                <div className="rdx-row-meta">
                  <span className="rdx-row-freq">{station.freq} FM</span>
                  <span className="rdx-row-dot"/>
                  <span className="rdx-row-lang">{station.lang}</span>
                  {isOn && <span className="rdx-row-live">Live</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="rdx-row-actions" onClick={e => e.stopPropagation()}>
                <button
                  className={`rdx-row-fav ${isFav ? 'rdx-row-fav-on' : ''}`}
                  onClick={e => toggleFav(station.id, e)}
                >
                  <Heart size={13} weight={isFav ? 'fill' : 'regular'}/>
                </button>
              </div>

              {/* Active indicator */}
              {isOn && <div className="rdx-row-indicator"/>}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="rdx-empty">
            <RadioIcon size={36} weight="duotone" color="rgba(201,162,77,0.35)"/>
            <p>No stations found</p>
          </div>
        )}
      </div>

      {/* Credits */}
      <div className="rdx-credits">
        <svg viewBox="0 0 20 20" width="9" height="9" style={{opacity:0.35}}>
          <polygon points={S8} fill="var(--sp-gold)"/>
        </svg>
        Streams from{' '}
        <a href="https://islamicbulletin.org" target="_blank" rel="noopener noreferrer">Islamic Bulletin</a>
        {' · '}
        <a href="https://qurango.net" target="_blank" rel="noopener noreferrer">Qurango</a>
        {' · '}
        <a href="https://mp3quran.net" target="_blank" rel="noopener noreferrer">MP3 Quran</a>
      </div>

      </div>{/* end rdx-content */}
    </div>
  )
}
