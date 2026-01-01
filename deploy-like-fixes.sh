#!/bin/bash
# Complete Deployment Script for Like Button Fixes

set -e

echo "🚀 Deploying Like Button Fixes..."
echo "===================================="

# 1. Pull latest code
echo "📋 Step 1: Pulling latest code..."
git pull origin main

# 2. Fix the likes table (add updated_at column)
echo "📋 Step 2: Fixing likes table..."
docker compose exec app php artisan tinker --execute="
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Check if updated_at column exists
try {
    DB::statement('ALTER TABLE likes ADD COLUMN updated_at TIMESTAMP NULL AFTER created_at');
    echo 'Added updated_at column to likes table\n';
} catch (\Exception \$e) {
    if (str_contains(\$e->getMessage(), 'Duplicate column')) {
        echo 'Column updated_at already exists\n';
    } else {
        throw \$e;
    }
}
"

# 3. Copy backend files
echo "📋 Step 3: Copying backend files..."
docker cp laravel/controllers/TrackController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/LikeController.php sc_app:/var/www/html/app/Http/Controllers/Api/

# 4. Clear Laravel cache
echo "📋 Step 4: Clearing backend cache..."
docker compose exec app php artisan optimize:clear

# 5. Restart backend
echo "📋 Step 5: Restarting backend..."
docker compose restart app queue

# 6. Rebuild frontend
echo "📋 Step 6: Rebuilding frontend..."
docker compose restart frontend

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✅ Deployment Complete!"
echo "======================="
echo ""
echo "🧪 TEST IN BROWSER:"
echo "  1. Hard refresh: Ctrl + F5"
echo "  2. Click ❤️ like button - should turn RED"
echo "  3. Go to Library → Likes - should show liked tracks"
echo "  4. Go to profile - liked tracks should show RED heart"
echo ""
echo "💡 TIP: If still not working, clear browser cache completely:"
echo "  Ctrl + Shift + Delete → Clear all time"

