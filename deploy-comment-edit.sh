#!/bin/bash
# Deploy Comment Editing Feature

set -e

echo "🚀 Deploying Comment Editing Feature..."
echo "========================================"
echo ""

# 1. Pull latest code
echo "📋 Step 1: Pulling latest code..."
git pull origin main

# 2. Copy backend files
echo "📋 Step 2: Copying backend files..."
docker cp laravel/controllers/CommentController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/routes/api.php sc_app:/var/www/html/routes/

# 3. Clear Laravel cache
echo "📋 Step 3: Clearing backend cache..."
docker compose exec app php artisan route:cache
docker compose exec app php artisan config:cache

# 4. Restart backend
echo "📋 Step 4: Restarting backend..."
docker compose restart app

# 5. Rebuild frontend
echo "📋 Step 5: Rebuilding frontend..."
docker compose exec frontend npm run build
docker compose restart frontend

# Wait for services
echo "⏳ Waiting for services to restart..."
sleep 10

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "🎯 NEW FEATURE:"
echo "  ✅ Users can now EDIT their own comments"
echo "  ✅ Edit button appears next to comments (only for owner)"
echo "  ✅ Inline edit form with Save/Cancel buttons"
echo ""
echo "🧪 TEST NOW:"
echo "  1. Hard refresh browser: Ctrl + F5"
echo "  2. Go to any track detail page"
echo "  3. Add a comment (if you haven't already)"
echo "  4. Look for 'Edit' button next to your comment"
echo "  5. Click Edit -> modify text -> click Save"
echo "     Expected: Comment updates instantly"
echo ""
echo "📝 NOTES:"
echo "  - Only comment owner sees Edit button"
echo "  - Other users cannot edit your comments"
echo "  - Cancel button discards changes"
echo ""

