#!/bin/bash
# Deploy Share, Repost, and Edit Comment Features

set -e

echo "🚀 Deploying ALL New Features..."
echo "=================================="
echo ""

# 1. Pull latest code
echo "📋 Step 1: Pulling latest code..."
git pull origin main

# 2. Run database migrations
echo "📋 Step 2: Running database migrations..."
docker compose exec app php artisan migrate --force

# 3. Copy backend files
echo "📋 Step 3: Copying backend files..."
docker cp laravel/migrations/2024_01_01_000009_create_reposts_table.php sc_app:/var/www/html/database/migrations/
docker cp laravel/models/Repost.php sc_app:/var/www/html/app/Models/
docker cp laravel/models/User.php sc_app:/var/www/html/app/Models/
docker cp laravel/models/Track.php sc_app:/var/www/html/app/Models/
docker cp laravel/controllers/RepostController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/CommentController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/TrackController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/ProfileController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/routes/api.php sc_app:/var/www/html/routes/

# 4. Clear Laravel cache
echo "📋 Step 4: Clearing backend cache..."
docker compose exec app php artisan optimize:clear
docker compose exec app php artisan route:cache
docker compose exec app php artisan config:cache

# 5. Restart backend
echo "📋 Step 5: Restarting backend..."
docker compose restart app queue

# 6. Rebuild frontend
echo "📋 Step 6: Rebuilding frontend..."
docker compose exec frontend npm run build
docker compose restart frontend

# Wait for services
echo "⏳ Waiting for services to restart..."
sleep 15

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "🎯 NEW FEATURES:"
echo "  ✅ Share Button - Copy track link to clipboard"
echo "  ✅ Repost Button - Repost tracks (like Twitter retweet)"
echo "  ✅ Edit Comments - Edit your own comments"
echo ""
echo "🧪 TEST NOW:"
echo "  1. Hard refresh browser: Ctrl + F5"
echo ""
echo "  2. TEST SHARE:"
echo "     - Go to any track"
echo "     - Click 'Share' button"
echo "     - Expected: 'Link copied to clipboard!' message"
echo ""
echo "  3. TEST REPOST:"
echo "     - Click repost button (🔄 icon)"
echo "     - Expected: Button turns active, count increases"
echo "     - Click again to unrepost"
echo ""
echo "  4. TEST EDIT COMMENT:"
echo "     - Go to track detail page"
echo "     - Add a comment"
echo "     - Click 'Edit' button next to your comment"
echo "     - Modify text and click 'Save'"
echo "     - Expected: Comment updates instantly"
echo ""
echo "📊 DATABASE:"
echo "  - New table: reposts"
echo "  - Tracks now have: reposts_count, is_reposted"
echo "  - Users can view: Library → Reposts"
echo "  - Profile shows: reposts_count"
echo ""

