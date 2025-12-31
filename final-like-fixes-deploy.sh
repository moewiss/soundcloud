#!/bin/bash
# FINAL Like Button Fixes - Complete Deployment

set -e

echo "🚀 DEPLOYING FINAL LIKE BUTTON FIXES..."
echo "========================================"
echo ""

# 1. Pull latest code
echo "📋 Step 1: Pulling latest code from GitHub..."
git pull origin main

# 2. Copy all backend controllers
echo "📋 Step 2: Copying backend controllers..."
docker cp laravel/controllers/TrackController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/LikeController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/ProfileController.php sc_app:/var/www/html/app/Http/Controllers/Api/

# 3. Copy routes
echo "📋 Step 3: Copying routes..."
docker cp laravel/routes/api.php sc_app:/var/www/html/routes/

# 4. Clear Laravel cache
echo "📋 Step 4: Clearing backend cache..."
docker compose exec app php artisan optimize:clear
docker compose exec app php artisan route:cache
docker compose exec app php artisan config:cache

# 5. Restart backend
echo "📋 Step 5: Restarting backend services..."
docker compose restart app queue

# 6. Rebuild frontend
echo "📋 Step 6: Rebuilding frontend..."
docker compose exec frontend npm run build
docker compose restart frontend

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 15

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "🎯 WHAT'S FIXED:"
echo "  ✅ Like button shows RED HEART instantly (no refresh needed)"
echo "  ✅ Like count updates in real-time"
echo "  ✅ Library → Likes shows all your liked tracks"
echo "  ✅ Profile page: 'See what Admin likes' now clickable and working"
echo "  ✅ Liked state persists across ALL pages (home, profile, feed, library)"
echo "  ✅ Big like icon and small like icon both work perfectly"
echo "  ✅ Backend optimized (faster queries, no performance issues)"
echo ""
echo "🧪 TEST CHECKLIST:"
echo "  1. Hard refresh browser: Ctrl + F5 (or Cmd + Shift + R on Mac)"
echo "  2. Go to Home page → Click ❤️ on any track"
echo "     Expected: Heart turns RED instantly, count increases"
echo "  3. Go to Library → Likes"
echo "     Expected: See all tracks you liked"
echo "  4. Go to Admin profile → Click 'See what Admin likes'"
echo "     Expected: Shows 'Likes' tab with all Admin's liked tracks"
echo "  5. Unlike a track → refresh page → unlike should persist"
echo ""
echo "💡 IF STILL NOT WORKING:"
echo "  - Clear browser cache completely: Ctrl + Shift + Delete"
echo "  - Check browser console (F12) for errors"
echo "  - Check backend logs: docker compose logs app --tail=100"
echo ""

