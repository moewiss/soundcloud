# TODO - Outstanding Issues for Tomorrow

**Date:** January 1, 2026  
**Status:** 4 Major Features to Implement

---

## 📋 SUMMARY OF UPDATES

After user testing, here's what actually needs to be done:

1. ✅ **Upload** - Working! Just needs Tags & Genre fields added
2. ✅ **Profile Edit** - Working! Just needs Header photo + fix avatar display in small size
3. 🆕 **Add to Playlist** - NEW FEATURE: Every track needs "Add to Playlist" button
4. ⚠️ **Admin & Delete** - Admin needs to delete ANY track, Users need to delete OWN tracks

---

## 🔴 FEATURES TO IMPLEMENT

### 1. Upload Tracks (Feature D) - ADD TAGS & GENRE
**Issue:** Upload is working! Need to add Tags and Genre fields

**What to Add:**
- **Tags field** - Allow users to add multiple tags (like "styles, moods, tempo")
- **Genre dropdown** - Add genre selection with options like SoundCloud:
  - All music genres
  - Hip-hop & Rap
  - House
  - Indie
  - Jazz & Blues
  - Latin
  - Metal
  - Piano
  - Pop
  - R&B & Soul
  - Reggae
  - Plus custom categories: Nasheeds, Quran, Duas, Stories

**Files to Update:**
- `frontend/src/pages/Upload.jsx` - Add Tags input and Genre dropdown
- `laravel/database/migrations/xxx_create_tracks_table.php` - Check if genre column exists
- `laravel/app/Http/Controllers/Api/TrackController.php` - Handle genre and tags in store()
- Backend already has tags, just need frontend UI

---

### 2. ADD TO PLAYLIST (NEW FEATURE)
**Issue:** Need to add "Add to Playlist" option for every track

**What to Add:**
- **Add button/menu on every track** - Like SoundCloud's "Add to playlist" button
- **Modal/Dropdown showing:**
  - Tab 1: "Add to playlist" - List of existing playlists with checkboxes
  - Tab 2: "Create a playlist" - Form to create new playlist with track
- **Show in these locations:**
  - Track detail page
  - Track cards on Home page
  - Track cards on Feed page
  - Track cards on Search results
  - Track cards on Profile page

**Files to Update:**
- `frontend/src/components/TrackCard.jsx` - Add "Add to Playlist" button
- `frontend/src/components/AddToPlaylistModal.jsx` - Create new modal component
- `frontend/src/pages/TrackDetail.jsx` - Already has this, use as reference
- Backend API already exists: `POST /api/playlists/{id}/tracks`

---

### 3. Admin Panel & Track Deletion (Feature I)
**Issue:** Admin and users need track deletion functionality

**What to Add:**
1. **Admin: Delete ANY track**
   - Admin should be able to delete tracks from any user
   - Add delete button in admin pending review page
   - Add delete button when viewing any track as admin

2. **User: Delete OWN tracks**
   - Users should be able to delete their own uploaded tracks
   - Add delete button on track detail page (only for track owner)
   - Add delete button in profile tracks list (only for own tracks)

**Files to Update:**
- `laravel/app/Http/Controllers/Api/TrackController.php` - Update `destroy()` method
  - Check if user is admin OR track owner
- `laravel/app/Http/Controllers/Api/AdminTrackController.php` - Add admin delete
- `frontend/src/pages/TrackDetail.jsx` - Add delete button for owner/admin
- `frontend/src/pages/UserProfile.jsx` - Add delete button on track cards
- `frontend/src/pages/Admin.jsx` - Add delete button in pending review

**Backend Route:**
```php
DELETE /api/tracks/{track} - User can delete own track
DELETE /api/admin/tracks/{track} - Admin can delete any track
```

---

### 4. Profile Improvements (Feature K) - ADD HEADER PHOTO & FIX AVATAR DISPLAY
**Issue:** Profile edit is working! Need to add header photo and fix avatar display

**What to Add:**
1. **Header Photo / Banner Image**
   - Add header image upload like SoundCloud (shown in screenshot)
   - Large banner at top of profile (like "Upload header image" button)
   - Recommended size: 2480×520 pixels, 2MB limit
   - Store in MinIO like avatar

2. **Fix Avatar Display Outside Profile**
   - Avatar not showing when profile appears in small size
   - Check avatar URL in: comments, track listings, notifications, etc.
   - May be issue with `avatar_url` not being included in API responses

**Files to Update:**
- `laravel/database/migrations/xxx_create_profiles_table.php` - Add `header_path` column
- `laravel/app/Models/Profile.php` - Add `getHeaderUrlAttribute()` accessor
- `laravel/app/Http/Controllers/Api/ProfileController.php` - Handle header upload in `update()`
- `frontend/src/pages/Settings.jsx` - Add header image upload section
- `frontend/src/pages/UserProfile.jsx` - Display header image
- `frontend/src/components/TrackCard.jsx` - Ensure avatar_url is displayed
- `frontend/src/components/Comment.jsx` - Ensure avatar_url is displayed

**Database Migration:**
```sql
ALTER TABLE profiles ADD COLUMN header_path VARCHAR(255) AFTER avatar_path;
```

---

## ✅ FEATURES WORKING (Today's Fixes)

- ✅ Login/Authentication - CORS fixed, working now
- ✅ Like button - Updates instantly, shows red when liked
- ✅ Follow button - Working
- ✅ Comments - Post, reply, edit, delete working
- ✅ Notifications - Page loads, shows notifications
- ✅ Playlists - Can create and view (detail page added)
- ✅ Reposts - Working
- ✅ Audio playback - Working through Nginx proxy
- ✅ Track duration - Showing correctly

---

## 📝 FEATURES STILL PENDING (Not Started)

1. **@mention User Tagging** - Tag users in comments with notifications
2. **Albums** - Full album feature implementation
3. **Admin Control Panel** - Full admin controls (delete accounts, edit users, etc.)
4. **Login Page Redesign** - Improve UI/UX of login page

---

## 🔧 DEBUGGING COMMANDS (Server Access)

```bash
# SSH to server
ssh root@185.250.36.33

# Go to project
cd /root/islamic-soundcloud

# Check running containers
docker compose ps

# View Laravel logs
docker compose exec app tail -f /var/www/html/storage/logs/laravel.log

# View Nginx logs
docker compose logs proxy --tail 100

# View app logs
docker compose logs app --tail 100

# Restart specific service
docker compose restart app
docker compose restart proxy

# Clear Laravel cache
docker compose exec app php artisan cache:clear
docker compose exec app php artisan config:clear
```

---

## 📊 TESTING CHECKLIST FOR TOMORROW

### Upload - Add Tags & Genre (D)
- [ ] Upload track and see new Tags input field
- [ ] Upload track and see new Genre dropdown
- [ ] Add multiple tags (comma separated)
- [ ] Select genre from dropdown
- [ ] Verify tags and genre are saved and displayed on track
- [ ] Test with custom categories: Nasheeds, Quran, Duas, Stories

### Add to Playlist (NEW)
- [ ] See "Add to Playlist" button on track cards (Home, Feed, Search)
- [ ] Click "Add to Playlist" button
- [ ] See modal with 2 tabs: "Add to playlist" and "Create a playlist"
- [ ] Select existing playlist and add track
- [ ] Create new playlist with track included
- [ ] Verify track appears in playlist
- [ ] Try adding same track again (should show already added)

### Admin & Track Deletion (I)
- [ ] **As Admin:** Login as admin user
- [ ] **As Admin:** View any user's track
- [ ] **As Admin:** See delete button and delete track
- [ ] **As Admin:** Go to Pending Review, delete pending track
- [ ] **As User:** Login as regular user
- [ ] **As User:** View own track
- [ ] **As User:** See delete button and delete own track
- [ ] **As User:** Try to view another user's track
- [ ] **As User:** Verify NO delete button on other user's tracks

### Profile - Header Photo & Avatar Fix (K)
- [ ] Go to Edit Profile / Settings
- [ ] See new "Upload header image" button/section
- [ ] Upload header image (PNG/JPG, 2480×520 recommended)
- [ ] Verify header displays on profile page
- [ ] Upload new avatar
- [ ] **Check avatar displays in:** track cards, comments, notifications, search results
- [ ] **Fix:** Avatar should show in small size everywhere (not just profile page)

---

**END OF TODO LIST**

