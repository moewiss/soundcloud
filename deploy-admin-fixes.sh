#!/bin/bash

echo "========================================"
echo "  Admin Panel Fixes & Features Deploy  "
echo "========================================"
echo ""

cd ~/islamic-soundcloud

# Step 1: Pull latest code
echo "📦 Step 1: Pulling latest code from GitHub..."
git pull origin main
echo "✅ Code pulled successfully"
echo ""

# Step 2: Deploy backend files
echo "📤 Step 2: Deploying backend files..."

# Deploy AdminController with fixed middleware
docker cp laravel/controllers/AdminController.php sc_app:/var/www/html/app/Http/Controllers/Api/

# Deploy TrackController with moderation
docker cp laravel/controllers/TrackController.php sc_app:/var/www/html/app/Http/Controllers/Api/

# Deploy updated API routes
docker cp laravel/routes/api.php sc_app:/var/www/html/routes/

echo "✅ Backend files deployed"
echo ""

# Step 3: Clear Laravel caches
echo "🧹 Step 3: Clearing Laravel caches..."
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan route:clear
docker compose exec -T app php artisan cache:clear
echo "✅ Caches cleared"
echo ""

# Step 4: Build frontend
echo "🎨 Step 4: Building frontend..."
docker compose exec -T frontend npm run build
echo "✅ Frontend built"
echo ""

# Step 5: Restart services
echo "🔄 Step 5: Restarting services..."
docker compose restart app
docker compose restart frontend
echo "✅ Services restarted"
echo ""

# Step 6: Verify deployment
echo "🔍 Step 6: Verifying deployment..."
echo ""
echo "Checking AdminController:"
docker compose exec -T app grep -c "checkAdmin" /var/www/html/app/Http/Controllers/Api/AdminController.php
echo ""
echo "Checking API routes:"
docker compose exec -T app grep "promoteToAdmin" /var/www/html/routes/api.php
echo ""

echo "========================================"
echo "  ✅ Deployment Complete!               "
echo "========================================"
echo ""
echo "🎉 New Features Implemented:"
echo "1. ✅ Admin panel errors fixed"
echo "2. ✅ Track moderation system:"
echo "   - Admin uploads: auto-approved"
echo "   - Non-admin uploads: require approval"
echo "3. ✅ Promote users to admin by email"
echo ""
echo "📝 Test the following:"
echo "1. Admin panel dashboard loads without errors"
echo "2. Upload a track as non-admin → should be 'pending'"
echo "3. Upload a track as admin → should be 'approved'"
echo "4. Go to Admin Panel → Users tab → Click 'Promote to Admin'"
echo "5. Enter an email → User should be promoted"
echo ""
echo "Admin Panel: http://185.250.36.33:5173/admin"
echo ""

