# Testing Guide - 6 Completed Phases

## 🚀 Deployment Steps

### 1. Deploy to Server

```bash
# SSH into your server
ssh root@185.250.36.33

# Navigate to project
cd /root/islamic-soundcloud

# Pull latest changes
git pull origin main

# Run migrations
docker compose exec app php artisan migrate --force

# Restart backend
docker compose restart app

# Rebuild frontend
cd frontend
npm run build

# Restart frontend
cd ..
docker compose restart frontend
```

---

## ✅ Testing Checklist

### Phase 1: Profile Fixes

**Test as regular user:**
1. [ ] Go to your profile
2. [ ] Click "Edit Profile" button
3. [ ] Change your name/bio
4. [ ] Click Save
5. [ ] Verify changes appear immediately
6. [ ] Click "Share" button (clipboard icon)
7. [ ] Verify "Link copied" toast appears
8. [ ] Click on "Followers" count
9. [ ] Verify it navigates to followers list page
10. [ ] Click on "Following" count
11. [ ] Verify it navigates to following list page
12. [ ] Click the "..." menu button
13. [ ] Verify dropdown appears with "Share Profile" option

**Expected Results:**
- ✅ Profile updates save and show immediately
- ✅ Share button copies profile link
- ✅ Followers/Following are clickable links
- ✅ "..." menu shows options

---

### Phase 2: Comments System

**Test as regular user:**
1. [ ] Go to any track detail page
2. [ ] Add a comment
3. [ ] Click "Reply" on your comment
4. [ ] Add a reply
5. [ ] Verify reply appears indented under parent comment
6. [ ] Click "Edit" on your comment
7. [ ] Change the text and click "Save"
8. [ ] Verify comment updates
9. [ ] Click "Delete" on your comment
10. [ ] Confirm deletion
11. [ ] Verify comment is removed

**Test as admin:**
12. [ ] Login as admin
13. [ ] Go to a track with comments from other users
14. [ ] Click "Edit" on someone else's comment
15. [ ] Verify you can edit it
16. [ ] Click "Delete" on someone else's comment
17. [ ] Verify you can delete it

**Expected Results:**
- ✅ Comments can be replied to (nested)
- ✅ Users can edit/delete own comments
- ✅ Admin can edit/delete ANY comment
- ✅ Edit/Delete buttons show for authorized users

---

### Phase 3: Notifications System

**Test with 2 accounts (A and B):**

**Account A actions:**
1. [ ] Like Account B's track
2. [ ] Comment on Account B's track
3. [ ] Reply to Account B's comment
4. [ ] Follow Account B
5. [ ] Repost Account B's track

**Account B verification:**
6. [ ] Login as Account B
7. [ ] Check notification bell in header
8. [ ] Verify unread count badge appears (should show 5)
9. [ ] Click notification bell
10. [ ] Verify dropdown shows all 5 notifications:
    - Like notification
    - Comment notification
    - Reply notification
    - Follow notification
    - Repost notification
11. [ ] Click on a notification
12. [ ] Verify it navigates to the relevant content
13. [ ] Verify notification is marked as read (no longer highlighted)
14. [ ] Verify unread count decreases

**Expected Results:**
- ✅ All notification types are created
- ✅ Bell shows unread count
- ✅ Notifications appear in dropdown
- ✅ Clicking marks as read and navigates
- ✅ Time ago format (e.g., "2m ago", "1h ago")

---

### Phase 4: Search Improvements

**Test search:**
1. [ ] Go to http://185.250.36.33:5173/search
2. [ ] Try searching with a typo (e.g., "Nasheedd" instead of "Nasheed")
3. [ ] Verify results still appear (fuzzy search)
4. [ ] Click "People" filter with empty search
5. [ ] Verify ALL users are shown
6. [ ] Enter a name in search with "People" filter
7. [ ] Verify filtered results
8. [ ] Click "Playlists" filter with empty search
9. [ ] Verify ALL playlists are shown
10. [ ] Search for a playlist name
11. [ ] Verify filtered results

**Expected Results:**
- ✅ Fuzzy search tolerates typos
- ✅ "People" filter shows all users when empty
- ✅ "Playlists" filter shows all playlists when empty
- ✅ Search results update in real-time

---

### Phase 5: Playlists Full Functionality

**Test playlists:**
1. [ ] Go to any track detail page
2. [ ] Click "Add to Playlist" button
3. [ ] Verify modal opens showing your playlists
4. [ ] Click "Create New Playlist"
5. [ ] Enter a name and click "Create & Add"
6. [ ] Verify success toast
7. [ ] Go to Library → Playlists
8. [ ] Verify new playlist appears
9. [ ] Click on the playlist
10. [ ] Verify the track is in the playlist
11. [ ] Try adding another track to same playlist
12. [ ] Verify it's added
13. [ ] Try adding same track again
14. [ ] Verify error message (already in playlist)

**Expected Results:**
- ✅ "Add to Playlist" button appears on tracks
- ✅ Modal shows existing playlists
- ✅ Can create new playlist inline
- ✅ Tracks are added successfully
- ✅ Duplicate detection works

---

### Phase 6: Upload Improvements

**Test multiple upload:**
1. [ ] Go to Upload page
2. [ ] Select 3 audio files at once (Ctrl+Click or Shift+Click)
3. [ ] Verify form shows "3 file(s) selected"
4. [ ] Fill in title: "My Test Upload"
5. [ ] Select category: "Nasheeds"
6. [ ] Click Upload
7. [ ] Wait for upload progress
8. [ ] Verify success message shows "3 track(s) uploaded"
9. [ ] Go to Library
10. [ ] Verify 3 tracks appear:
     - "My Test Upload - 1"
     - "My Test Upload - 2"
     - "My Test Upload - 3"
11. [ ] Verify all have category "Nasheeds"

**Test categories:**
12. [ ] Upload a new track
13. [ ] Verify category dropdown includes:
     - Nasheeds
     - Quran
     - Duas
     - Stories
     - (plus other existing categories)

**Expected Results:**
- ✅ Multiple files can be selected
- ✅ All files upload successfully
- ✅ Auto-numbering works for titles
- ✅ New categories are available

---

## 🐛 Common Issues & Solutions

### Issue: Migrations fail
**Solution:**
```bash
docker compose exec app php artisan migrate:status
docker compose exec app php artisan migrate --force
```

### Issue: Frontend not updating
**Solution:**
```bash
cd /root/islamic-soundcloud/frontend
npm run build
docker compose restart frontend
```

### Issue: Notifications not appearing
**Solution:**
```bash
# Check if notifications table exists
docker compose exec app php artisan migrate:status | grep notifications

# If missing, run migrations
docker compose exec app php artisan migrate --force
```

### Issue: 500 errors
**Solution:**
```bash
# Check Laravel logs
docker compose exec app tail -f storage/logs/laravel.log

# Check app container logs
docker compose logs app --tail 100
```

---

## 📊 Test Report Template

After testing, report back with:

```
Phase 1 (Profile): ✅ / ❌
  - Edit Profile: ✅ / ❌
  - Share Profile: ✅ / ❌
  - Clickable Followers: ✅ / ❌
  - Menu: ✅ / ❌

Phase 2 (Comments): ✅ / ❌
  - Nested replies: ✅ / ❌
  - Edit own: ✅ / ❌
  - Delete own: ✅ / ❌
  - Admin edit any: ✅ / ❌
  - Admin delete any: ✅ / ❌

Phase 3 (Notifications): ✅ / ❌
  - Bell shows count: ✅ / ❌
  - Dropdown works: ✅ / ❌
  - All types created: ✅ / ❌
  - Mark as read: ✅ / ❌

Phase 4 (Search): ✅ / ❌
  - Fuzzy search: ✅ / ❌
  - People filter: ✅ / ❌
  - Playlists filter: ✅ / ❌

Phase 5 (Playlists): ✅ / ❌
  - Add to playlist: ✅ / ❌
  - Create playlist: ✅ / ❌

Phase 6 (Upload): ✅ / ❌
  - Multiple files: ✅ / ❌
  - New categories: ✅ / ❌
```

---

## 🚀 Quick Deploy Script

Save this as `deploy-phases-1-6.sh`:

```bash
#!/bin/bash
cd /root/islamic-soundcloud
echo "Pulling latest changes..."
git pull origin main
echo "Running migrations..."
docker compose exec app php artisan migrate --force
echo "Restarting backend..."
docker compose restart app
echo "Rebuilding frontend..."
cd frontend && npm run build
echo "Restarting frontend..."
cd .. && docker compose restart frontend
echo "✅ Deployment complete! Test at http://185.250.36.33:5173"
```

Run with:
```bash
chmod +x deploy-phases-1-6.sh
./deploy-phases-1-6.sh
```

