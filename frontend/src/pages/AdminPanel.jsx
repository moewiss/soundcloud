import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

/* ═══════════════════════════════════════════════════════════════════════════
   NASHIDIFY ADMIN DASHBOARD — Standalone
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Theme ───
const T = {
  bg: '#0f1117', bgCard: '#181a23', bgHover: '#1e2030', bgInput: '#12131b',
  border: 'rgba(255,255,255,0.07)', borderFocus: 'rgba(99,179,136,0.4)',
  text: '#e8eaed', textMuted: '#8b8fa3', textDim: '#5a5e72',
  accent: '#63b388', accentBg: 'rgba(99,179,136,0.12)',
  red: '#ef5350', redBg: 'rgba(239,83,80,0.12)',
  orange: '#ffb74d', orangeBg: 'rgba(255,183,77,0.12)',
  blue: '#64b5f6', blueBg: 'rgba(100,181,246,0.12)',
  purple: '#ce93d8', purpleBg: 'rgba(206,147,216,0.12)',
  gold: '#c9a84c', goldBg: 'rgba(201,168,76,0.12)',
}

const tabs = [
  { id: 'dashboard', icon: 'chart-pie', label: 'Dashboard' },
  { id: 'analytics', icon: 'chart-area', label: 'Analytics' },
  { id: 'users', icon: 'users', label: 'Users' },
  { id: 'tracks', icon: 'music', label: 'Tracks' },
  { id: 'playlists', icon: 'layer-group', label: 'Playlists' },
  { id: 'content', icon: 'comments', label: 'Content' },
  { id: 'engagement', icon: 'heart', label: 'Engagement' },
  { id: 'subscriptions', icon: 'crown', label: 'Subscriptions' },
  { id: 'ads', icon: 'bullhorn', label: 'Ads' },
  { id: 'announcements', icon: 'bell', label: 'Announcements' },
  { id: 'audit', icon: 'clipboard-list', label: 'Audit Logs' },
  { id: 'settings', icon: 'sliders-h', label: 'Settings' },
]

// ─── Shared Components ───
const Card = ({ children, style, ...props }) => (
  <div style={{ background: T.bgCard, borderRadius: 14, padding: 20, border: `1px solid ${T.border}`, ...style }} {...props}>{children}</div>
)
const Stat = ({ label, value, color, icon }) => (
  <Card style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: color || T.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <i className={`fas fa-${icon}`} style={{ color: color ? '#fff' : T.accent, fontSize: 16 }}></i>
    </div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: T.text, lineHeight: 1.1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={{ fontSize: '0.72rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{label}</div>
    </div>
  </Card>
)
const Badge = ({ status }) => {
  const colors = { active: T.accent, approved: T.accent, pending: T.orange, pending_review: T.orange, paused: T.textDim, rejected: T.red, draft: T.textDim, completed: T.blue, suspended: T.red, archived: T.textDim }
  const c = colors[status] || T.textDim
  return <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: `${c}20`, color: c, textTransform: 'capitalize' }}>{status?.replace(/_/g, ' ')}</span>
}
const Btn = ({ children, variant = 'primary', style, ...props }) => {
  const styles = {
    primary: { background: T.accent, color: '#111', border: 'none', fontWeight: 600 },
    danger: { background: T.redBg, color: T.red, border: `1px solid ${T.red}30` },
    ghost: { background: 'transparent', color: T.textMuted, border: `1px solid ${T.border}` },
    success: { background: T.accentBg, color: T.accent, border: `1px solid ${T.accent}30` },
    warning: { background: T.orangeBg, color: T.orange, border: `1px solid ${T.orange}30` },
  }
  return <button style={{ padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', ...styles[variant], ...style }} {...props}>{children}</button>
}
const Input = ({ label, style, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</label>}
    <input style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, fontSize: '0.85rem', outline: 'none', ...style }} {...props} />
  </div>
)
const Select = ({ label, children, style, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</label>}
    <select style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, fontSize: '0.85rem', outline: 'none', ...style }} {...props}>{children}</select>
  </div>
)
const Textarea = ({ label, style, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</label>}
    <textarea style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, fontSize: '0.85rem', outline: 'none', minHeight: 60, resize: 'vertical', ...style }} {...props} />
  </div>
)
const Modal = ({ children, onClose }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, borderRadius: 16, padding: 28, border: `1px solid ${T.border}`, width: 520, maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto' }}>{children}</div>
  </div>
)
const SubTabs = ({ tabs: t, active, onChange }) => (
  <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
    {t.map(tab => (
      <button key={tab} onClick={() => onChange(tab)} style={{
        padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
        background: active === tab ? T.accent : T.bgCard, color: active === tab ? '#111' : T.textMuted,
        fontWeight: active === tab ? 700 : 400, transition: 'all 0.15s',
      }}>{tab.charAt(0).toUpperCase() + tab.slice(1).replace(/_/g, ' ')}</button>
    ))}
  </div>
)
const Grid = ({ cols = 4, children, style }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${Math.floor(800/cols)}px, 1fr))`, gap: 14, ...style }}>{children}</div>
)
const Row = ({ children, between, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: between ? 'space-between' : 'flex-start', gap: 10, ...style }}>{children}</div>
)
const MiniChart = ({ items = [], color = T.accent, labelKey = 'date', valueKey = 'count' }) => {
  if (!items.length) return <div style={{ color: T.textDim, fontSize: '0.8rem', padding: '20px 0', textAlign: 'center' }}>No data yet</div>
  const max = Math.max(...items.map(i => Number(i[valueKey])), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 64, padding: '8px 0' }}>
      {items.map((item, i) => (
        <div key={i} title={`${item[labelKey]}: ${item[valueKey]}`} style={{
          flex: 1, minWidth: 3, maxWidth: 14, borderRadius: '3px 3px 0 0', cursor: 'default',
          height: `${Math.max(6, (Number(item[valueKey]) / max) * 100)}%`, background: color, opacity: 0.8,
        }} />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */
export default function AdminPanel() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    api.getMe().then(res => {
      const u = res.user || res
      localStorage.setItem('user', JSON.stringify(u))
      setUser(u)
      if (!u.is_admin) { toast.error('Admin access required'); navigate('/home') }
    }).catch(() => { navigate('/login') })
  }, [])

  if (!user?.is_admin) return (
    <div style={{ height: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: T.textMuted, fontSize: '0.9rem' }}><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Loading...</div>
    </div>
  )

  const sw = sidebarCollapsed ? 64 : 220

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, color: T.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: sw, height: '100vh', background: T.bgCard, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', transition: 'width 0.2s', flexShrink: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: sidebarCollapsed ? '16px 12px' : '16px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fas fa-shield-halved" style={{ color: T.accent, fontSize: 14 }}></i>
          </div>
          {!sidebarCollapsed && <span style={{ fontWeight: 700, fontSize: '0.95rem', color: T.text }}>Nashidify Admin</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 6px', overflowY: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: sidebarCollapsed ? '10px 0' : '9px 14px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 2, transition: 'all 0.15s',
              background: activeTab === tab.id ? T.accentBg : 'transparent',
              color: activeTab === tab.id ? T.accent : T.textMuted,
              fontWeight: activeTab === tab.id ? 600 : 400, fontSize: '0.82rem',
            }} title={sidebarCollapsed ? tab.label : undefined}>
              <i className={`fas fa-${tab.icon}`} style={{ width: 18, textAlign: 'center', fontSize: 13 }}></i>
              {!sidebarCollapsed && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', fontSize: 13, padding: 6 }} title="Toggle sidebar">
            <i className={`fas fa-${sidebarCollapsed ? 'angles-right' : 'angles-left'}`}></i>
          </button>
          {!sidebarCollapsed && (
            <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', fontSize: '0.75rem', padding: 6 }}>
              <i className="fas fa-arrow-left" style={{ marginRight: 4 }}></i>Back to App
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'tracks' && <TracksTab />}
          {activeTab === 'playlists' && <PlaylistsTab />}
          {activeTab === 'content' && <ContentTab />}
          {activeTab === 'engagement' && <EngagementTab />}
          {activeTab === 'subscriptions' && <SubscriptionsTab />}
          {activeTab === 'ads' && <AdsTab />}
          {activeTab === 'announcements' && <AnnouncementsTab />}
          {activeTab === 'audit' && <AuditTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </main>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Dashboard
   ═══════════════════════════════════════════════════════════════════════════ */
function DashboardTab() {
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  useEffect(() => {
    api.getAdminStats().then(setStats).catch(() => {})
    api.getAdminActivity().then(d => setActivity(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 24, color: T.text }}>Dashboard</h1>
      <Grid cols={4}>
        <Stat label="Total Users" value={stats?.total_users || 0} icon="users" />
        <Stat label="Total Tracks" value={stats?.total_tracks || 0} icon="music" />
        <Stat label="Pending Tracks" value={stats?.pending_tracks || 0} icon="clock" color={stats?.pending_tracks > 0 ? T.orangeBg : undefined} />
        <Stat label="Total Plays" value={stats?.total_plays || 0} icon="play" />
      </Grid>
      <Card style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14, color: T.text }}>Recent Activity</h3>
        {activity.length === 0 ? <div style={{ color: T.textDim, fontSize: '0.82rem' }}>No recent activity</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activity.slice(0, 15).map((a, i) => (
              <Row key={i} between style={{ padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: a.type === 'user_registration' ? T.blueBg : T.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fas fa-${a.type === 'user_registration' ? 'user-plus' : 'music'}`} style={{ fontSize: 11, color: a.type === 'user_registration' ? T.blue : T.accent }}></i>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.82rem', color: T.text }}>{a.type === 'user_registration' ? `${a.user?.name} joined` : `${a.user?.name} uploaded "${a.track?.title}"`}</span>
                    {a.track?.status === 'pending' && <Badge status="pending" />}
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', color: T.textDim }}>{new Date(a.created_at).toLocaleDateString()}</span>
              </Row>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Analytics
   ═══════════════════════════════════════════════════════════════════════════ */
function AnalyticsTab() {
  const [data, setData] = useState(null)
  useEffect(() => { api.getAdminAnalytics().then(setData).catch(() => toast.error('Failed to load analytics')) }, [])
  if (!data) return <div style={{ color: T.textMuted }}>Loading analytics...</div>

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Analytics</h1>
      <Grid cols={4}>
        <Stat label="Total Tracks" value={data.total_tracks} icon="music" />
        <Stat label="Total Duration" value={`${data.total_duration_hours}h`} icon="clock" />
        <Stat label="Active Today" value={data.active_users_today} icon="user-check" color={T.accentBg} />
        <Stat label="Active This Week" value={data.active_users_week} icon="users" />
      </Grid>
      <Grid cols={5} style={{ marginTop: 14 }}>
        {[
          { l: 'Likes', v: data.engagement?.likes, i: 'heart', c: T.red },
          { l: 'Reposts', v: data.engagement?.reposts, i: 'retweet', c: T.blue },
          { l: 'Comments', v: data.engagement?.comments, i: 'comment', c: T.orange },
          { l: 'Follows', v: data.engagement?.follows, i: 'user-plus', c: T.accent },
          { l: 'Playlists', v: data.engagement?.playlists, i: 'list', c: T.purple },
        ].map(e => (
          <Card key={e.l} style={{ textAlign: 'center', padding: 16 }}>
            <i className={`fas fa-${e.i}`} style={{ color: e.c, fontSize: 18, marginBottom: 6, display: 'block' }}></i>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{(e.v || 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: T.textMuted }}>{e.l}</div>
          </Card>
        ))}
      </Grid>
      <Grid cols={3} style={{ marginTop: 14 }}>
        <Card><h3 style={{ fontSize: '0.85rem', marginBottom: 8, color: T.textMuted }}>User Growth (30d)</h3><MiniChart items={data.user_growth} color={T.accent} /></Card>
        <Card><h3 style={{ fontSize: '0.85rem', marginBottom: 8, color: T.textMuted }}>Track Uploads (30d)</h3><MiniChart items={data.track_growth} color={T.blue} /></Card>
        <Card><h3 style={{ fontSize: '0.85rem', marginBottom: 8, color: T.textMuted }}>Plays (30d)</h3><MiniChart items={data.plays_growth} color={T.orange} /></Card>
      </Grid>
      <Grid cols={2} style={{ marginTop: 14 }}>
        <Card>
          <h3 style={{ fontSize: '0.85rem', marginBottom: 10, color: T.textMuted }}>Top Tracks</h3>
          {data.top_tracks?.map((t, i) => (
            <Row key={t.id} between style={{ padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: '0.82rem' }}>
              <span style={{ color: T.text }}>{i + 1}. {t.title}</span>
              <span style={{ color: T.textDim }}>{(t.plays_count || t.plays || 0).toLocaleString()} plays</span>
            </Row>
          ))}
        </Card>
        <Card>
          <h3 style={{ fontSize: '0.85rem', marginBottom: 10, color: T.textMuted }}>Top Uploaders</h3>
          {data.top_uploaders?.map((u, i) => (
            <Row key={u.id} between style={{ padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: '0.82rem' }}>
              <span style={{ color: T.text }}>{i + 1}. {u.name}</span>
              <span style={{ color: T.textDim }}>{u.tracks_count} tracks</span>
            </Row>
          ))}
        </Card>
      </Grid>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Users
   ═══════════════════════════════════════════════════════════════════════════ */
function UsersTab() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const load = () => { setLoading(true); api.getAdminUsers({ search, filter }).then(d => setUsers(d.data || [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [search, filter])

  const handleBan = async (id) => { try { await api.banUser(id); toast.success('Done'); load() } catch { toast.error('Failed to update user') } }
  const handleDelete = async (id) => { if (!confirm('Delete user?')) return; try { await api.deleteAdminUser(id); toast.success('Deleted'); load() } catch { toast.error('Failed to delete user') } }
  const handleVerifyArtist = async (id) => { try { await api.verifyArtist(id); toast.success('Artist verified'); load() } catch { toast.error('Failed to verify') } }
  const handleUnverifyArtist = async (id) => { try { await api.unverifyArtist(id); toast.success('Artist unverified'); load() } catch { toast.error('Failed to unverify') } }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Users</h1>
      <Row style={{ marginBottom: 16, gap: 12 }}>
        <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 300, padding: '9px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, fontSize: '0.85rem', outline: 'none' }} />
        {['all', 'active', 'banned', 'admin'].map(f => (
          <Btn key={f} variant={filter === f ? 'primary' : 'ghost'} onClick={() => setFilter(f)}>{f}</Btn>
        ))}
      </Row>
      {loading ? <div style={{ color: T.textMuted }}>Loading...</div> : users.length === 0 ? <div style={{ color: T.textDim }}>No users found</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map(u => (
            <Card key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent, fontWeight: 700, fontSize: '0.85rem' }}>
                  {u.display_name?.charAt(0) || u.name?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: T.text }}>{u.name} {u.is_admin && <span style={{ fontSize: '0.65rem', color: T.gold, marginLeft: 4 }}>ADMIN</span>}</div>
                  <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{u.email} &middot; {u.tracks_count} tracks{u.is_artist && <span style={{ color: '#C9A24D', marginLeft: 6 }}><i className="fas fa-microphone"></i> Artist</span>}{u.is_online && <span style={{ color: T.accent, marginLeft: 6 }}>● online</span>}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {u.is_artist ? (
                  <Btn variant="warning" onClick={() => handleUnverifyArtist(u.id)}><i className="fas fa-user-minus" style={{ marginRight: 4 }}></i>Unverify</Btn>
                ) : (
                  <Btn variant="success" onClick={() => handleVerifyArtist(u.id)}><i className="fas fa-microphone" style={{ marginRight: 4 }}></i>Verify Artist</Btn>
                )}
                <Btn variant={u.is_banned ? 'success' : 'warning'} onClick={() => handleBan(u.id)}>{u.is_banned ? 'Unban' : 'Ban'}</Btn>
                <Btn variant="danger" onClick={() => handleDelete(u.id)}>Delete</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Tracks
   ═══════════════════════════════════════════════════════════════════════════ */
function TracksTab() {
  const [tracks, setTracks] = useState([])
  const [filter, setFilter] = useState('pending')
  const [selected, setSelected] = useState([])
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(null)

  const load = () => { api.getAdminTracks({ status: filter === 'all' ? undefined : filter }).then(d => setTracks(d.data || [])).catch(() => {}) }
  useEffect(() => { load() }, [filter])

  const handleApprove = async (id) => { try { await api.approveTrack(id); toast.success('Approved'); load() } catch { toast.error('Failed to approve') } }
  const handleReject = async (id) => { try { await api.rejectTrack(id); toast.success('Rejected'); load() } catch { toast.error('Failed to reject') } }
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; try { await api.adminDeleteTrack(id); toast.success('Deleted'); load() } catch { toast.error('Failed to delete') } }
  const handleBulk = async (action) => {
    if (!selected.length) return; if (!confirm(`${action} ${selected.length} tracks?`)) return
    try { await api.adminBulkTrackAction(selected, action); toast.success('Done'); setSelected([]); load() } catch { toast.error('Failed') }
  }
  const handleSaveEdit = async () => {
    try { await api.adminUpdateTrack(editing.id, editData); toast.success('Updated'); setEditing(null); load() } catch { toast.error('Failed to update') }
  }
  const togglePlay = (track) => {
    if (playing === track.id) { audioRef.current?.pause(); setPlaying(null) }
    else { if (audioRef.current) { audioRef.current.src = track.audio_url; audioRef.current.play() }; setPlaying(track.id) }
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Tracks</h1>
      <audio ref={audioRef} onEnded={() => setPlaying(null)} />
      <Row style={{ marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <Btn key={f} variant={filter === f ? 'primary' : 'ghost'} onClick={() => setFilter(f)}>{f}</Btn>
        ))}
        <div style={{ flex: 1 }} />
        {selected.length > 0 && (
          <>
            <Btn variant="success" onClick={() => handleBulk('approve')}>Approve ({selected.length})</Btn>
            <Btn variant="warning" onClick={() => handleBulk('reject')}>Reject ({selected.length})</Btn>
            <Btn variant="danger" onClick={() => handleBulk('delete')}>Delete ({selected.length})</Btn>
          </>
        )}
      </Row>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tracks.map(t => (
          <Card key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: selected.includes(t.id) ? T.bgHover : T.bgCard }}>
            <input type="checkbox" checked={selected.includes(t.id)} onChange={() => setSelected(s => s.includes(t.id) ? s.filter(x => x !== t.id) : [...s, t.id])} />
            <button onClick={() => togglePlay(t)} style={{ width: 36, height: 36, borderRadius: 10, background: playing === t.id ? T.accent : T.bgHover, border: 'none', color: playing === t.id ? '#111' : T.text, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`fas fa-${playing === t.id ? 'pause' : 'play'}`} style={{ fontSize: 12 }}></i>
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
              <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{t.user?.name} &middot; {t.category || 'uncategorized'} &middot; {Math.floor((t.duration_seconds || 0) / 60)}:{String((t.duration_seconds || 0) % 60).padStart(2, '0')}</div>
            </div>
            <Badge status={t.status} />
            <div style={{ display: 'flex', gap: 4 }}>
              {t.status === 'pending' && <><Btn variant="success" onClick={() => handleApprove(t.id)} style={{ padding: '5px 12px' }}>Approve</Btn><Btn variant="warning" onClick={() => handleReject(t.id)} style={{ padding: '5px 12px' }}>Reject</Btn></>}
              <Btn variant="ghost" onClick={() => { setEditing(t); setEditData({ title: t.title, description: t.description || '', category: t.category || '', status: t.status }) }} style={{ padding: '5px 10px' }}><i className="fas fa-pen" style={{ fontSize: 11 }}></i></Btn>
              <Btn variant="danger" onClick={() => handleDelete(t.id)} style={{ padding: '5px 10px' }}><i className="fas fa-trash" style={{ fontSize: 11 }}></i></Btn>
            </div>
          </Card>
        ))}
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <h3 style={{ marginBottom: 16, color: T.text }}>Edit Track</h3>
          <Input label="Title" value={editData.title || ''} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))} />
          <Textarea label="Description" value={editData.description || ''} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} />
          <Input label="Category" value={editData.category || ''} onChange={e => setEditData(p => ({ ...p, category: e.target.value }))} />
          <Select label="Status" value={editData.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value }))}>
            <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
          </Select>
          <Row style={{ marginTop: 8 }}><Btn onClick={handleSaveEdit}>Save</Btn><Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn></Row>
        </Modal>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Playlists
   ═══════════════════════════════════════════════════════════════════════════ */
function PlaylistsTab() {
  const [playlists, setPlaylists] = useState([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})

  const load = () => { api.getAdminPlaylists({ search: search || undefined }).then(r => setPlaylists(r.playlists?.data || [])).catch(() => {}) }
  useEffect(() => { load() }, [search])

  const handleSave = async () => { try { await api.updateAdminPlaylist(editing.id, editData); toast.success('Updated'); setEditing(null); load() } catch { toast.error('Failed to update') } }
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; try { await api.deleteAdminPlaylist(id); toast.success('Deleted'); load() } catch { toast.error('Failed to delete') } }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Playlists</h1>
      <input placeholder="Search playlists..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', maxWidth: 350, padding: '9px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, fontSize: '0.85rem', outline: 'none', marginBottom: 16 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {playlists.map(p => (
          <Card key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: T.text }}>{p.name} <span style={{ fontSize: '0.7rem', color: p.is_public ? T.accent : T.textDim }}>{p.is_public ? 'Public' : 'Private'}</span></div>
              <div style={{ fontSize: '0.75rem', color: T.textMuted }}>by {p.user?.name || 'Unknown'} &middot; {p.tracks_count} tracks</div>
            </div>
            <Row>
              <Btn variant="ghost" onClick={() => { setEditing(p); setEditData({ name: p.name, description: p.description || '', is_public: p.is_public }) }}>Edit</Btn>
              <Btn variant="danger" onClick={() => handleDelete(p.id)}>Delete</Btn>
            </Row>
          </Card>
        ))}
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <h3 style={{ marginBottom: 16, color: T.text }}>Edit Playlist</h3>
          <Input label="Name" value={editData.name || ''} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} />
          <Textarea label="Description" value={editData.description || ''} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.textMuted, fontSize: '0.82rem', marginBottom: 12 }}>
            <input type="checkbox" checked={editData.is_public} onChange={e => setEditData(p => ({ ...p, is_public: e.target.checked }))} /> Public
          </label>
          <Row><Btn onClick={handleSave}>Save</Btn><Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn></Row>
        </Modal>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Content
   ═══════════════════════════════════════════════════════════════════════════ */
function ContentTab() {
  const [comments, setComments] = useState([])
  const [search, setSearch] = useState('')
  const load = () => { api.getAdminComments({ search: search || undefined }).then(d => setComments(d.data || [])).catch(() => {}) }
  useEffect(() => { load() }, [search])
  const handleDelete = async (id) => { try { await api.deleteAdminComment(id); toast.success('Deleted'); load() } catch { toast.error('Failed to delete') } }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Content Moderation</h1>
      <input placeholder="Search comments..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', maxWidth: 350, padding: '9px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, fontSize: '0.85rem', outline: 'none', marginBottom: 16 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {comments.map(c => (
          <Card key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: T.text, marginBottom: 4 }}>{c.body}</div>
              <div style={{ fontSize: '0.72rem', color: T.textMuted }}>by {c.user?.name || 'Unknown'} on "{c.track?.title || 'Unknown track'}" &middot; {new Date(c.created_at).toLocaleDateString()}</div>
            </div>
            <Btn variant="danger" onClick={() => handleDelete(c.id)} style={{ flexShrink: 0 }}><i className="fas fa-trash" style={{ fontSize: 11 }}></i></Btn>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Engagement
   ═══════════════════════════════════════════════════════════════════════════ */
function EngagementTab() {
  const [sub, setSub] = useState('likes')
  const [likes, setLikes] = useState({ likes: { data: [] }, top_liked: [], total: 0 })
  const [reposts, setReposts] = useState({ reposts: { data: [] }, total: 0 })
  const [follows, setFollows] = useState({ follows: { data: [] }, total: 0 })

  useEffect(() => {
    if (sub === 'likes') api.getAdminLikes().then(setLikes).catch(() => {})
    if (sub === 'reposts') api.getAdminReposts().then(setReposts).catch(() => {})
    if (sub === 'follows') api.getAdminFollows().then(setFollows).catch(() => {})
  }, [sub])

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Engagement</h1>
      <SubTabs tabs={['likes', 'reposts', 'follows']} active={sub} onChange={setSub} />
      {sub === 'likes' && (
        <>
          {likes.top_liked?.length > 0 && (
            <Card style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.85rem', marginBottom: 10, color: T.textMuted }}>Most Liked</h3>
              {likes.top_liked.map((t, i) => (
                <Row key={t.id} between style={{ padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: '0.82rem' }}>
                  <span style={{ color: T.text }}>{i + 1}. {t.title}</span><span style={{ color: T.red, fontWeight: 600 }}>{t.like_count}</span>
                </Row>
              ))}
            </Card>
          )}
          {(likes.likes?.data || []).map((l, i) => (
            <Card key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', marginBottom: 6 }}>
              <div style={{ fontSize: '0.82rem', color: T.text }}><strong>{l.user_name}</strong> liked <strong>{l.track_title}</strong>
                <div style={{ fontSize: '0.7rem', color: T.textDim }}>{l.user_email}</div></div>
              <Btn variant="danger" onClick={async () => { try { await api.removeAdminLike(l.user_id, l.track_id); toast.success('Removed'); api.getAdminLikes().then(setLikes).catch(() => {}) } catch { toast.error('Failed') } }} style={{ padding: '4px 10px', fontSize: '0.7rem' }}>Remove</Btn>
            </Card>
          ))}
        </>
      )}
      {sub === 'reposts' && (reposts.reposts?.data || []).map((r, i) => (
        <Card key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', marginBottom: 6 }}>
          <div style={{ fontSize: '0.82rem', color: T.text }}><strong>{r.user_name}</strong> reposted <strong>{r.track_title}</strong></div>
          <Btn variant="danger" onClick={async () => { try { await api.removeAdminRepost(r.user_id, r.track_id); toast.success('Removed'); api.getAdminReposts().then(setReposts).catch(() => {}) } catch { toast.error('Failed') } }} style={{ padding: '4px 10px', fontSize: '0.7rem' }}>Remove</Btn>
        </Card>
      ))}
      {sub === 'follows' && (follows.follows?.data || []).map((f, i) => (
        <Card key={i} style={{ padding: '10px 16px', marginBottom: 6, fontSize: '0.82rem', color: T.text }}>
          <strong>{f.follower_name}</strong> follows <strong>{f.following_name}</strong>
        </Card>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Subscriptions
   ═══════════════════════════════════════════════════════════════════════════ */
function SubscriptionsTab() {
  const [data, setData] = useState(null)
  useEffect(() => { api.getAdminSubscriptions().then(setData).catch(() => toast.error('Failed')) }, [])
  if (!data) return <div style={{ color: T.textMuted }}>Loading...</div>

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Subscriptions & Revenue</h1>
      <Grid cols={3}>
        <Stat label="Active Subs" value={data.active_subscriptions} icon="crown" color={T.goldBg} />
        <Stat label="Monthly Revenue" value={`$${(data.monthly_revenue / 100).toFixed(2)}`} icon="chart-line" />
        <Stat label="Total Revenue" value={`$${(data.total_revenue / 100).toFixed(2)}`} icon="sack-dollar" color={T.accentBg} />
      </Grid>
      <Card style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: '0.85rem', marginBottom: 12, color: T.textMuted }}>Users by Plan</h3>
        <Row style={{ gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(data.users_by_plan || {}).map(([plan, count]) => (
            <div key={plan} style={{ textAlign: 'center', padding: '12px 24px', background: T.bgHover, borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{count}</div>
              <div style={{ fontSize: '0.72rem', color: T.textMuted, textTransform: 'capitalize' }}>{plan}</div>
            </div>
          ))}
        </Row>
      </Card>
      <Card style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: '0.85rem', marginBottom: 12, color: T.textMuted }}>Recent Subscriptions</h3>
        {(data.recent_subscriptions || []).map(s => (
          <Row key={s.id} between style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <div><div style={{ fontWeight: 600, fontSize: '0.85rem', color: T.text }}>{s.user_name}</div><div style={{ fontSize: '0.72rem', color: T.textDim }}>{s.user_email}</div></div>
            <Badge status={s.stripe_status} />
          </Row>
        ))}
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Ads
   ═══════════════════════════════════════════════════════════════════════════ */
function AdsTab() {
  const [sub, setSub] = useState('dashboard')
  const [dashboard, setDashboard] = useState(null)
  const [advertisers, setAdvertisers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [creatives, setCreatives] = useState([])
  const [showForm, setShowForm] = useState(null)
  const [formData, setFormData] = useState({})
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    if (sub === 'dashboard') api.getAdDashboard().then(setDashboard).catch(() => {})
    if (sub === 'advertisers') api.getAdvertisers().then(r => setAdvertisers(r.advertisers?.data || [])).catch(() => {})
    if (sub === 'campaigns') { api.getAdCampaigns().then(r => setCampaigns(r.campaigns?.data || [])).catch(() => {}); api.getAdvertisers().then(r => setAdvertisers(r.advertisers?.data || [])).catch(() => {}) }
    if (sub === 'creatives') { api.getAdCreatives().then(r => setCreatives(r.ads?.data || [])).catch(() => {}); api.getAdCampaigns().then(r => setCampaigns(r.campaigns?.data || [])).catch(() => {}) }
  }, [sub])

  const reload = () => { setSub(s => s); /* force re-render */ const s = sub; setSub(''); setTimeout(() => setSub(s), 0) }
  const save = async (type) => {
    try {
      if (type === 'advertiser') { editId ? await api.updateAdvertiser(editId, formData) : await api.createAdvertiser(formData) }
      if (type === 'campaign') { editId ? await api.updateAdCampaign(editId, formData) : await api.createAdCampaign(formData) }
      if (type === 'creative') { editId ? await api.updateAdCreative(editId, formData) : await api.createAdCreative(formData) }
      toast.success('Saved'); setShowForm(null); setEditId(null); reload()
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Ad Management</h1>
      <SubTabs tabs={['dashboard', 'advertisers', 'campaigns', 'creatives']} active={sub} onChange={setSub} />

      {sub === 'dashboard' && dashboard && (
        <>
          <Grid cols={4}>
            <Stat label="Revenue Today" value={`$${Number(dashboard.revenue?.today || 0).toFixed(2)}`} icon="dollar-sign" color={T.goldBg} />
            <Stat label="Revenue Week" value={`$${Number(dashboard.revenue?.week || 0).toFixed(2)}`} icon="chart-line" />
            <Stat label="Active Campaigns" value={dashboard.active_campaigns} icon="bullhorn" />
            <Stat label="Impressions Today" value={dashboard.impressions_today || 0} icon="eye" />
          </Grid>
          <Grid cols={2} style={{ marginTop: 14 }}>
            <Stat label="Total Advertisers" value={dashboard.total_advertisers} icon="building" />
            <Stat label="Pending Approvals" value={dashboard.pending_approvals} icon="clock" color={dashboard.pending_approvals > 0 ? T.orangeBg : undefined} />
          </Grid>
        </>
      )}

      {sub === 'advertisers' && (
        <>
          <Row between style={{ marginBottom: 14 }}><h2 style={{ fontSize: '1rem', color: T.text }}>Advertisers</h2>
            <Btn onClick={() => { setShowForm('advertiser'); setFormData({}); setEditId(null) }}><i className="fas fa-plus" style={{ marginRight: 6 }}></i>Add</Btn></Row>
          {advertisers.map(a => (
            <Card key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600, color: T.text }}>{a.name}</div>
                <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{a.contact_name} &middot; {a.contact_email} &middot; {a.business_type?.replace(/_/g, ' ')}</div>
                <Badge status={a.status} />
              </div>
              <Row>
                {a.status === 'pending' && <><Btn variant="success" onClick={() => api.updateAdvertiser(a.id, { status: 'approved' }).then(reload).catch(() => toast.error('Failed'))}>Approve</Btn><Btn variant="danger" onClick={() => api.updateAdvertiser(a.id, { status: 'rejected' }).then(reload).catch(() => toast.error('Failed'))}>Reject</Btn></>}
                <Btn variant="ghost" onClick={() => { setShowForm('advertiser'); setFormData(a); setEditId(a.id) }}>Edit</Btn>
              </Row>
            </Card>
          ))}
          {showForm === 'advertiser' && (
            <Modal onClose={() => setShowForm(null)}>
              <h3 style={{ marginBottom: 16, color: T.text }}>{editId ? 'Edit' : 'Add'} Advertiser</h3>
              <Input label="Company Name *" value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              <Input label="Contact Name *" value={formData.contact_name || ''} onChange={e => setFormData(p => ({ ...p, contact_name: e.target.value }))} />
              <Input label="Contact Email *" type="email" value={formData.contact_email || ''} onChange={e => setFormData(p => ({ ...p, contact_email: e.target.value }))} />
              <Select label="Business Type *" value={formData.business_type || ''} onChange={e => setFormData(p => ({ ...p, business_type: e.target.value }))}>
                <option value="">Select...</option><option value="islamic_business">Islamic Business</option><option value="charity">Charity</option><option value="halal_brand">Halal Brand</option>
                <option value="mosque">Mosque</option><option value="islamic_org">Islamic Org</option><option value="educational">Educational</option>
              </Select>
              <Input label="Phone" value={formData.phone || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
              <Input label="Website" value={formData.website || ''} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} />
              {editId && <Select label="Status" value={formData.status || 'pending'} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></Select>}
              <Row style={{ marginTop: 8 }}><Btn onClick={() => save('advertiser')}>Save</Btn><Btn variant="ghost" onClick={() => setShowForm(null)}>Cancel</Btn></Row>
            </Modal>
          )}
        </>
      )}

      {sub === 'campaigns' && (
        <>
          <Row between style={{ marginBottom: 14 }}><h2 style={{ fontSize: '1rem', color: T.text }}>Campaigns</h2>
            <Btn onClick={() => { setShowForm('campaign'); setFormData({ frequency_cap: 3, priority: 5 }); setEditId(null) }}><i className="fas fa-plus" style={{ marginRight: 6 }}></i>New Campaign</Btn></Row>
          <div style={{ fontSize: '0.75rem', color: T.textDim, marginBottom: 12 }}>Pricing: Audio $25/day &middot; Banner $10-15/day &middot; Sponsored $20/week &middot; Min budget $50</div>
          {campaigns.map(c => (
            <Card key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600, color: T.text }}>{c.name}</div>
                <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{c.advertiser?.name} &middot; {c.campaign_type} &middot; ${Number(c.flat_rate || 0).toFixed(0)}/day</div>
                <Row style={{ marginTop: 4, gap: 6 }}><Badge status={c.status} /><span style={{ fontSize: '0.72rem', color: T.textDim }}>${Number(c.amount_spent || 0).toFixed(2)} / ${Number(c.total_budget || 0).toFixed(2)}</span></Row>
              </div>
              <Row>
                {c.status === 'pending_review' && <Btn variant="success" onClick={() => api.updateAdCampaign(c.id, { status: 'active' }).then(reload).catch(() => toast.error('Failed'))}>Activate</Btn>}
                {c.status === 'active' && <Btn variant="warning" onClick={() => api.updateAdCampaign(c.id, { status: 'paused' }).then(reload).catch(() => toast.error('Failed'))}>Pause</Btn>}
                {c.status === 'paused' && <Btn variant="success" onClick={() => api.updateAdCampaign(c.id, { status: 'active' }).then(reload).catch(() => toast.error('Failed'))}>Resume</Btn>}
                <Btn variant="ghost" onClick={() => { setShowForm('campaign'); setFormData(c); setEditId(c.id) }}>Edit</Btn>
              </Row>
            </Card>
          ))}
          {showForm === 'campaign' && (
            <Modal onClose={() => setShowForm(null)}>
              <h3 style={{ marginBottom: 16, color: T.text }}>{editId ? 'Edit' : 'New'} Campaign</h3>
              {!editId && <Select label="Advertiser *" value={formData.advertiser_id || ''} onChange={e => setFormData(p => ({ ...p, advertiser_id: e.target.value }))}><option value="">Select...</option>{advertisers.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}
              <Input label="Name *" value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              <Select label="Type *" value={formData.campaign_type || ''} onChange={e => setFormData(p => ({ ...p, campaign_type: e.target.value }))}><option value="">Select...</option><option value="audio">Audio</option><option value="banner">Banner</option><option value="sponsored_track">Sponsored Track</option></Select>
              {formData.campaign_type && (
                <div style={{ fontSize: '0.72rem', color: T.gold, background: T.goldBg, padding: '6px 10px', borderRadius: 8, marginBottom: 6 }}>
                  {formData.campaign_type === 'audio' && 'Audio ads play between tracks for free users. Recommended rate: $25/day'}
                  {formData.campaign_type === 'banner' && 'Banner ads appear on home & search pages. Recommended rate: $10-15/day'}
                  {formData.campaign_type === 'sponsored_track' && 'Promotes a track in the "Promoted Tracks" section. Recommended rate: $20/week'}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input label="Total Budget ($) *" type="number" min="50" value={formData.total_budget || ''} onChange={e => setFormData(p => ({ ...p, total_budget: e.target.value }))} />
                <Input label={`Flat Rate ($/${formData.campaign_type === 'sponsored_track' ? 'week' : 'day'} *`} type="number" value={formData.flat_rate || ''} onChange={e => setFormData(p => ({ ...p, flat_rate: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input label="Start Date *" type="date" value={formData.start_date || ''} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} />
                <Input label="End Date *" type="date" value={formData.end_date || ''} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} />
              </div>
              {editId && <Select label="Status" value={formData.status || 'draft'} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>{['draft','pending_review','approved','active','paused','completed','rejected'].map(s => <option key={s} value={s}>{s}</option>)}</Select>}
              <Row style={{ marginTop: 8 }}><Btn onClick={() => save('campaign')}>Save</Btn><Btn variant="ghost" onClick={() => setShowForm(null)}>Cancel</Btn></Row>
            </Modal>
          )}
        </>
      )}

      {sub === 'creatives' && (
        <>
          <Row between style={{ marginBottom: 14 }}><h2 style={{ fontSize: '1rem', color: T.text }}>Ad Creatives</h2>
            <Btn onClick={() => { setShowForm('creative'); setFormData({ status: 'active' }); setEditId(null) }}><i className="fas fa-plus" style={{ marginRight: 6 }}></i>New Creative</Btn></Row>
          {creatives.map(ad => (
            <Card key={ad.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', marginBottom: 8 }}>
              <Row style={{ gap: 12 }}>
                {ad.image_url && <img src={ad.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
                <div>
                  <div style={{ fontWeight: 600, color: T.text }}>{ad.title}</div>
                  <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{ad.ad_type} &middot; {ad.placement || 'n/a'} &middot; {ad.campaign?.name || 'N/A'}</div>
                  <Badge status={ad.status} />
                </div>
              </Row>
              <Row><Btn variant="ghost" onClick={() => { setShowForm('creative'); setFormData(ad); setEditId(ad.id) }}>Edit</Btn><Btn variant="danger" onClick={async () => { if (!confirm('Delete?')) return; try { await api.deleteAdCreative(ad.id); toast.success('Deleted'); reload() } catch { toast.error('Failed') } }}>Delete</Btn></Row>
            </Card>
          ))}
          {showForm === 'creative' && (
            <Modal onClose={() => setShowForm(null)}>
              <h3 style={{ marginBottom: 16, color: T.text }}>{editId ? 'Edit' : 'New'} Creative</h3>
              {!editId && <Select label="Campaign *" value={formData.campaign_id || ''} onChange={e => {
                const camp = campaigns.find(c => String(c.id) === e.target.value)
                setFormData(p => ({ ...p, campaign_id: e.target.value, ad_type: camp?.campaign_type || p.ad_type || '' }))
              }}><option value="">Select...</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name} ({c.campaign_type})</option>)}</Select>}
              <Input label="Title *" value={formData.title || ''} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
              <Select label="Ad Type *" value={formData.ad_type || ''} onChange={e => setFormData(p => ({ ...p, ad_type: e.target.value }))}><option value="">Select...</option><option value="audio">Audio</option><option value="banner">Banner</option><option value="sponsored_track">Sponsored Track</option></Select>

              {/* ── Banner-specific fields ── */}
              {formData.ad_type === 'banner' && (
                <>
                  <Select label="Placement *" value={formData.placement || ''} onChange={e => setFormData(p => ({ ...p, placement: e.target.value }))}><option value="">Select...</option><option value="home_top">Home Top</option><option value="home_between">Home Between</option><option value="search_top">Search Top</option><option value="search_between">Search Between</option></Select>
                  <Select label="Banner Size" value={formData.banner_size || 'leaderboard'} onChange={e => setFormData(p => ({ ...p, banner_size: e.target.value }))}><option value="leaderboard">Leaderboard (728x90)</option><option value="medium_rect">Medium Rectangle (300x250)</option><option value="small_banner">Small Banner (320x50)</option></Select>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.text, marginBottom: 4 }}>Upload Banner Image</label>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                      onChange={e => setFormData(p => ({ ...p, image_file: e.target.files[0], image_path: '' }))}
                      style={{ fontSize: '0.82rem', color: T.text }} />
                    {formData.image_path && !formData.image_file && <div style={{ fontSize: '0.7rem', color: T.textDim, marginTop: 4 }}>Current: {formData.image_path}</div>}
                    <div style={{ fontSize: '0.68rem', color: T.textDim, marginTop: 2 }}>Or paste an image URL below</div>
                  </div>
                  <Input label="Image URL (alternative)" value={formData.image_file ? '' : (formData.image_path || '')} onChange={e => setFormData(p => ({ ...p, image_path: e.target.value, image_file: null }))} placeholder="https://..." disabled={!!formData.image_file} />
                  <Input label="Click URL" value={formData.click_url || ''} onChange={e => setFormData(p => ({ ...p, click_url: e.target.value }))} placeholder="https://..." />
                  <Input label="Body Text" value={formData.body_text || ''} onChange={e => setFormData(p => ({ ...p, body_text: e.target.value }))} placeholder="Ad description shown below image" />
                </>
              )}

              {/* ── Audio-specific fields ── */}
              {formData.ad_type === 'audio' && (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.text, marginBottom: 4 }}>Upload Audio File *</label>
                    <input type="file" accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,.mp3,.wav,.ogg,.m4a"
                      onChange={e => setFormData(p => ({ ...p, audio_file: e.target.files[0], audio_path: '' }))}
                      style={{ fontSize: '0.82rem', color: T.text }} />
                    {formData.audio_path && !formData.audio_file && <div style={{ fontSize: '0.7rem', color: T.textDim, marginTop: 4 }}>Current: {formData.audio_path}</div>}
                  </div>
                  <Input label="Audio Duration (seconds)" type="number" value={formData.audio_duration || ''} onChange={e => setFormData(p => ({ ...p, audio_duration: e.target.value }))} placeholder="Auto-detected if blank" />
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.text, marginBottom: 4 }}>Cover Image (shown in player)</label>
                    <input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      onChange={e => setFormData(p => ({ ...p, image_file: e.target.files[0], image_path: '' }))}
                      style={{ fontSize: '0.82rem', color: T.text }} />
                    {formData.image_path && !formData.image_file && <div style={{ fontSize: '0.7rem', color: T.textDim, marginTop: 4 }}>Current: {formData.image_path}</div>}
                    <div style={{ fontSize: '0.68rem', color: T.textDim, marginTop: 2 }}>Or paste an image URL below</div>
                  </div>
                  <Input label="Image URL (alternative)" value={formData.image_file ? '' : (formData.image_path || '')} onChange={e => setFormData(p => ({ ...p, image_path: e.target.value, image_file: null }))} placeholder="https://..." disabled={!!formData.image_file} />
                  <Input label="Click URL" value={formData.click_url || ''} onChange={e => setFormData(p => ({ ...p, click_url: e.target.value }))} placeholder="https://..." />
                  <Input label="Body Text" value={formData.body_text || ''} onChange={e => setFormData(p => ({ ...p, body_text: e.target.value }))} placeholder="Shown as description in ad player" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Select label="Skippable" value={formData.is_skippable != null ? String(formData.is_skippable) : '1'} onChange={e => setFormData(p => ({ ...p, is_skippable: e.target.value === '1' }))}><option value="1">Yes</option><option value="0">No</option></Select>
                    <Input label="Skip After (sec)" type="number" value={formData.skip_after_seconds || 5} onChange={e => setFormData(p => ({ ...p, skip_after_seconds: e.target.value }))} />
                  </div>
                </>
              )}

              {/* ── Sponsored Track fields ── */}
              {formData.ad_type === 'sponsored_track' && (
                <>
                  <Input label="Track ID *" type="number" value={formData.sponsored_track_id || ''} onChange={e => setFormData(p => ({ ...p, sponsored_track_id: e.target.value }))} placeholder="ID of the track to promote" />
                  <div style={{ fontSize: '0.72rem', color: T.textDim, marginBottom: 6 }}>The track's cover, title, and artist will be used automatically. No image or audio needed.</div>
                </>
              )}

              <Select label="Status" value={formData.status || 'active'} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></Select>
              <Row style={{ marginTop: 8 }}><Btn onClick={() => save('creative')}>Save</Btn><Btn variant="ghost" onClick={() => setShowForm(null)}>Cancel</Btn></Row>
            </Modal>
          )}
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Announcements
   ═══════════════════════════════════════════════════════════════════════════ */
function AnnouncementsTab() {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ type: 'info', target: 'all' })
  const [editId, setEditId] = useState(null)

  const load = () => { api.getAdminAnnouncements().then(r => setItems(r.announcements?.data || [])).catch(() => {}) }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    try {
      if (editId) { await api.updateAnnouncement(editId, formData); toast.success('Updated') }
      else { const r = await api.createAnnouncement(formData); toast.success(`Sent to ${r.sent_to} users`) }
      setShowForm(false); setEditId(null); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
  }

  const typeColors = { info: T.blue, warning: T.orange, success: T.accent, promo: T.purple }

  return (
    <div>
      <Row between style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Announcements</h1>
        <Btn onClick={() => { setShowForm(true); setFormData({ type: 'info', target: 'all' }); setEditId(null) }}><i className="fas fa-plus" style={{ marginRight: 6 }}></i>New</Btn>
      </Row>
      {items.map(a => (
        <Card key={a.id} style={{ marginBottom: 8, borderLeft: `3px solid ${typeColors[a.type] || T.blue}`, opacity: a.is_active ? 1 : 0.5, padding: '14px 18px' }}>
          <Row between>
            <div>
              <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>{a.title}</div>
              <div style={{ fontSize: '0.82rem', color: T.textMuted, marginBottom: 6 }}>{a.message}</div>
              <Row style={{ gap: 8, fontSize: '0.7rem', color: T.textDim }}>
                <Badge status={a.type} /><span>Target: {a.target}</span><span>{new Date(a.created_at).toLocaleDateString()}</span>
              </Row>
            </div>
            <Row>
              <Btn variant={a.is_active ? 'warning' : 'success'} onClick={async () => { try { await api.updateAnnouncement(a.id, { is_active: !a.is_active }); load() } catch { toast.error('Failed') } }} style={{ fontSize: '0.72rem' }}>{a.is_active ? 'Deactivate' : 'Activate'}</Btn>
              <Btn variant="ghost" onClick={() => { setShowForm(true); setFormData(a); setEditId(a.id) }} style={{ fontSize: '0.72rem' }}>Edit</Btn>
              <Btn variant="danger" onClick={async () => { if (!confirm('Delete?')) return; try { await api.deleteAnnouncement(a.id); toast.success('Deleted'); load() } catch { toast.error('Failed') } }} style={{ fontSize: '0.72rem' }}>Delete</Btn>
            </Row>
          </Row>
        </Card>
      ))}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <h3 style={{ marginBottom: 16, color: T.text }}>{editId ? 'Edit' : 'New'} Announcement</h3>
          <Input label="Title *" value={formData.title || ''} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
          <Textarea label="Message *" value={formData.message || ''} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Select label="Type" value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}><option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option><option value="promo">Promo</option></Select>
            <Select label="Target" value={formData.target} onChange={e => setFormData(p => ({ ...p, target: e.target.value }))}><option value="all">All Users</option><option value="free">Free</option><option value="premium">Premium</option><option value="artists">Artists</option></Select>
          </div>
          <Input label="Expires (optional)" type="date" value={formData.expires_at ? formData.expires_at.split('T')[0] : ''} onChange={e => setFormData(p => ({ ...p, expires_at: e.target.value || null }))} />
          <Row style={{ marginTop: 8 }}><Btn onClick={handleSave}>{editId ? 'Update' : 'Send'}</Btn><Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn></Row>
        </Modal>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Audit Logs
   ═══════════════════════════════════════════════════════════════════════════ */
function AuditTab() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('')
  useEffect(() => { api.getAuditLogs({ action: filter || undefined }).then(r => setLogs(r.logs?.data || [])).catch(() => {}) }, [filter])

  const actionColors = { track: T.blue, user: T.accent, playlist: T.purple, announcement: T.orange, settings: T.textDim, like: T.red, repost: T.blue, campaign: T.gold }
  const getColor = (a) => actionColors[a.split('.')[0]] || T.textDim

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Audit Logs</h1>
      <Row style={{ gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['', 'track', 'user', 'playlist', 'announcement', 'settings'].map(f => (
          <Btn key={f} variant={filter === f ? 'primary' : 'ghost'} onClick={() => setFilter(f)}>{f || 'All'}</Btn>
        ))}
      </Row>
      {logs.length === 0 ? <div style={{ color: T.textDim }}>No audit logs yet</div> : logs.map(log => (
        <Card key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', marginBottom: 6 }}>
          <div>
            <Row style={{ gap: 8, marginBottom: 2 }}>
              <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: '0.68rem', fontWeight: 700, background: `${getColor(log.action)}20`, color: getColor(log.action) }}>{log.action}</span>
              <span style={{ fontWeight: 600, fontSize: '0.82rem', color: T.text }}>{log.admin?.name}</span>
            </Row>
            {log.details && <div style={{ fontSize: '0.72rem', color: T.textDim }}>{log.details}</div>}
          </div>
          <div style={{ fontSize: '0.7rem', color: T.textDim, textAlign: 'right' }}>{new Date(log.created_at).toLocaleString()}</div>
        </Card>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Settings
   ═══════════════════════════════════════════════════════════════════════════ */
function SettingsTab() {
  const [settings, setSettings] = useState({})
  const [changes, setChanges] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.getAdminSettings().then(r => setSettings(r.settings || {})).catch(() => {}) }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateAdminSettings(Object.entries(changes).map(([key, value]) => ({ key, value: String(value) })))
      toast.success('Settings saved'); setChanges({})
      api.getAdminSettings().then(r => setSettings(r.settings || {})).catch(() => {})
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const groupIcons = { general: 'globe', content: 'file-alt', ads: 'bullhorn' }

  return (
    <div>
      <Row between style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Site Settings</h1>
        {Object.keys(changes).length > 0 && (
          <Btn onClick={handleSave} style={{ opacity: saving ? 0.6 : 1 }}>
            <i className="fas fa-save" style={{ marginRight: 6 }}></i>{saving ? 'Saving...' : `Save (${Object.keys(changes).length})`}
          </Btn>
        )}
      </Row>
      {Object.entries(settings).map(([group, items]) => (
        <Card key={group} style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: 16, color: T.textMuted, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className={`fas fa-${groupIcons[group] || 'cog'}`}></i>{group}
          </h3>
          {items.map(s => {
            const val = changes[s.key] !== undefined ? changes[s.key] : s.value
            const changed = changes[s.key] !== undefined
            return (
              <Row key={s.key} between style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: changed ? T.accent : T.text }}>{s.label || s.key}{changed && <span style={{ marginLeft: 6, fontSize: '0.68rem', color: T.accent }}>(modified)</span>}</div>
                  <div style={{ fontSize: '0.7rem', color: T.textDim }}>{s.key}</div>
                </div>
                <div style={{ minWidth: 180 }}>
                  {s.type === 'boolean' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', justifyContent: 'flex-end', color: val === 'true' ? T.accent : T.red, fontSize: '0.82rem' }}>
                      {val === 'true' ? 'Enabled' : 'Disabled'}
                      <input type="checkbox" checked={val === 'true'} onChange={e => setChanges(p => ({ ...p, [s.key]: e.target.checked ? 'true' : 'false' }))} />
                    </label>
                  ) : (
                    <input type={s.type === 'integer' ? 'number' : 'text'} value={val}
                      onChange={e => setChanges(p => ({ ...p, [s.key]: e.target.value }))}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, fontSize: '0.85rem', textAlign: s.type === 'integer' ? 'right' : 'left', outline: 'none' }} />
                  )}
                </div>
              </Row>
            )
          })}
        </Card>
      ))}
    </div>
  )
}
