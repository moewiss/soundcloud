# Update All Pages with Share & Repost Buttons

## Pages to Update:
1. Home.jsx - Add share/repost to track cards
2. Feed.jsx - Add share/repost to feed items
3. UserProfile.jsx - Add share/repost to profile tracks
4. Library.jsx - Add reposts tab

## Changes Needed:

### 1. Add Handler Functions (all pages):
```javascript
const handleRepost = async (trackId, e) => {
  e?.stopPropagation()
  try {
    const result = await api.toggleRepost(trackId)
    // Update tracks state
    setTracks(prev => prev.map(t => 
      t.id === trackId 
        ? { ...t, is_reposted: result.is_reposted, reposts_count: result.reposts_count }
        : t
    ))
    // Also update trendingTracks if exists
    if (setTrendingTracks) {
      setTrendingTracks(prev => prev.map(t => 
        t.id === trackId 
          ? { ...t, is_reposted: result.is_reposted, reposts_count: result.reposts_count }
          : t
      ))
    }
    toast.success(result.is_reposted ? 'Reposted!' : 'Unreposted')
  } catch (error) {
    toast.error('Please login to repost')
  }
}

const handleShare = async (trackId, e) => {
  e?.stopPropagation()
  const trackUrl = `${window.location.origin}/tracks/${trackId}`
  try {
    await navigator.clipboard.writeText(trackUrl)
    toast.success('Link copied to clipboard!')
  } catch (error) {
    toast.error('Failed to copy link')
  }
}
```

### 2. Update Button HTML (feed-actions div):
```javascript
<div className="feed-actions">
  <button 
    className={`feed-action-btn ${track.is_liked ? 'active' : ''}`}
    onClick={(e) => handleLike(track.id, e)}
  >
    <i className="fas fa-heart"></i>
    <span>{track.likes_count || 0}</span>
  </button>
  <button 
    className={`feed-action-btn ${track.is_reposted ? 'active' : ''}`}
    onClick={(e) => handleRepost(track.id, e)}
  >
    <i className="fas fa-retweet"></i>
    <span>{track.reposts_count || 0}</span>
  </button>
  <button 
    className="feed-action-btn"
    onClick={(e) => handleShare(track.id, e)}
  >
    <i className="fas fa-share"></i>
  </button>
</div>
```

### 3. Library.jsx - Add Reposts Tab:
- Add state: `const [repostedTracks, setRepostedTracks] = useState([])`
- Add tab: `{ id: 'reposts', label: 'Reposts' }`
- Add fetch function: `const fetchReposts = async () => { ... }`
- Add case in renderContent for 'reposts'

## Status:
- ✅ TrackDetail.jsx - DONE
- ⏳ Home.jsx - TODO
- ⏳ Feed.jsx - TODO
- ⏳ UserProfile.jsx - TODO
- ⏳ Library.jsx - TODO

