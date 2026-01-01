#!/bin/bash
# Deploy Final Like Button Fixes
# - Library liked tracks navigation
# - Home page like button instant updates

set -e

echo "🚀 Deploying Final Like Button Fixes..."
echo "========================================"
echo ""

# 1. Pull latest code
echo "📋 Step 1: Pulling latest code..."
git pull origin main

# 2. Rebuild frontend with fixes
echo "📋 Step 2: Rebuilding frontend..."
docker compose exec frontend npm run build

# 3. Restart frontend to apply changes
echo "📋 Step 3: Restarting frontend..."
docker compose restart frontend

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to restart..."
sleep 10

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "🎯 WHAT'S FIXED:"
echo "  ✅ Library → Likes: Tracks now clickable (no more 'undefined' error)"
echo "  ✅ Home page: ALL like buttons update instantly (both grid and feed)"
echo "  ✅ Trending tracks: Like buttons now update without refresh"
echo ""
echo "🧪 TEST NOW:"
echo "  1. Hard refresh browser: Ctrl + F5"
echo "  2. Go to Library → Likes → Click any track"
echo "     Expected: Opens track detail page (no error)"
echo "  3. Go to Home → Click ❤️ on trending tracks (small icons)"
echo "     Expected: Heart turns RED instantly, no refresh needed"
echo "  4. Like count updates immediately"
echo ""

