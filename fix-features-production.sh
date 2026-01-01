#!/bin/bash
# Fix Like, Follow, and Comment Features in Production
# Run this on your server at: /root/islamic-soundcloud

set -e

echo "🔧 Fixing Like, Follow, and Comment Features..."
echo "================================================"

# 1. Copy all controllers
echo "📋 Step 1: Copying Controllers..."
docker cp laravel/controllers/LikeController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/FollowController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/CommentController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/PlaylistController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/SearchController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/HistoryController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/TrackController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/ProfileController.php sc_app:/var/www/html/app/Http/Controllers/Api/

# 2. Copy all models
echo "📋 Step 2: Copying Models..."
docker cp laravel/models/User.php sc_app:/var/www/html/app/Models/
docker cp laravel/models/Track.php sc_app:/var/www/html/app/Models/
docker cp laravel/models/Comment.php sc_app:/var/www/html/app/Models/
docker cp laravel/models/Playlist.php sc_app:/var/www/html/app/Models/
docker cp laravel/models/History.php sc_app:/var/www/html/app/Models/
docker cp laravel/models/Profile.php sc_app:/var/www/html/app/Models/

# 3. Copy routes
echo "📋 Step 3: Copying Routes..."
docker cp laravel/routes/api.php sc_app:/var/www/html/routes/api.php

# 4. Run migrations
echo "📋 Step 4: Running Migrations..."
docker compose exec app php artisan migrate --force

# 5. Clear all Laravel caches
echo "📋 Step 5: Clearing Caches..."
docker compose exec app php artisan config:clear
docker compose exec app php artisan route:clear
docker compose exec app php artisan cache:clear
docker compose exec app php artisan view:clear
docker compose exec app php artisan optimize:clear

# 6. Rebuild optimizations
echo "📋 Step 6: Rebuilding Optimizations..."
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache

# 7. Restart services
echo "📋 Step 7: Restarting Services..."
docker compose restart app queue

# 8. Verify routes
echo ""
echo "✅ Verification: Checking Routes..."
echo "-----------------------------------"
echo "Like routes:"
docker compose exec app php artisan route:list | grep like || echo "No like routes found!"
echo ""
echo "Follow routes:"
docker compose exec app php artisan route:list | grep follow || echo "No follow routes found!"
echo ""
echo "Comment routes:"
docker compose exec app php artisan route:list | grep comment || echo "No comment routes found!"

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "⚠️  IMPORTANT: Clear your browser cache or use Ctrl+F5 to refresh!"
echo ""
echo "🧪 Now test in browser:"
echo "  1. Press F12 to open Console"
echo "  2. Try to like a track ❤️"
echo "  3. Try to follow a user 👥"
echo "  4. Try to add a comment 💬"
echo ""
echo "If you still see errors, copy them here and I'll fix them!"

