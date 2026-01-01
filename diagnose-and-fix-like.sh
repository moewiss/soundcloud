#!/bin/bash
# Diagnose and Fix Like Button 500 Error

echo "🔍 Diagnosing Like Button Error..."
echo "===================================="

# 1. Check if User model has hasLiked method
echo ""
echo "📋 Step 1: Checking User model..."
docker compose exec app grep -n "hasLiked" /var/www/html/app/Models/User.php || echo "❌ ERROR: hasLiked method NOT FOUND in User model!"

# 2. Check if likedTracks relationship exists
echo ""
echo "📋 Step 2: Checking likedTracks relationship..."
docker compose exec app grep -n "likedTracks" /var/www/html/app/Models/User.php || echo "❌ ERROR: likedTracks relationship NOT FOUND!"

# 3. Check recent Laravel errors
echo ""
echo "📋 Step 3: Recent Laravel Errors..."
echo "-----------------------------------"
docker compose logs app --tail 50 | grep -i "error\|exception" | tail -20

# 4. Copy User model again (force update)
echo ""
echo "📋 Step 4: Forcing User model update..."
docker cp laravel/models/User.php sc_app:/var/www/html/app/Models/User.php

# 5. Verify it was copied
echo ""
echo "📋 Step 5: Verifying User model..."
docker compose exec app grep -n "hasLiked" /var/www/html/app/Models/User.php

# 6. Clear Laravel cache
echo ""
echo "📋 Step 6: Clearing Laravel cache..."
docker compose exec app php artisan optimize:clear

# 7. Check if likes table exists
echo ""
echo "📋 Step 7: Checking likes table..."
docker compose exec app php artisan tinker --execute="echo DB::table('likes')->count() . ' likes in database';"

# 8. Restart app
echo ""
echo "📋 Step 8: Restarting app..."
docker compose restart app

echo ""
echo "✅ Fix Applied! Try clicking the like button again."
echo ""
echo "If still failing, run:"
echo "  docker compose logs app --tail 100"
echo ""
echo "And copy the error here!"

