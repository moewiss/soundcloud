#!/bin/bash
set -e

echo "=== DEPLOYING PROFESSIONAL ADMIN PANEL ==="
echo ""

cd /root/islamic-soundcloud

echo "1. Stashing local changes..."
git stash

echo ""
echo "2. Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "3. Copying frontend build to proxy container..."
PROXY_CONTAINER=$(docker compose ps -q proxy)
docker cp frontend/dist/. $PROXY_CONTAINER:/var/www/frontend/

echo ""
echo "4. Running migrations (banned_at column)..."
docker compose exec -T app php artisan migrate --force

echo ""
echo "5. Clearing Laravel cache..."
docker compose exec -T app php artisan cache:clear
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan route:clear

echo ""
echo "6. Restarting containers..."
docker compose restart app proxy

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "✅ Professional Admin Panel Deployed!"
echo ""
echo "📋 New Features:"
echo "  ✓ Dashboard with statistics and activity feed"
echo "  ✓ User Management (view, edit, delete, ban/unban)"
echo "  ✓ Password Reset (direct reset + generate link)"
echo "  ✓ Enhanced Track Management"
echo "  ✓ Content Moderation (comments)"
echo "  ✓ Professional dashboard-style UI"
echo ""
echo "🔗 Access Admin Panel:"
echo "   http://185.250.36.33:5173/admin"
echo ""
echo "📝 Test Checklist:"
echo "  [ ] Login as admin"
echo "  [ ] View dashboard statistics"
echo "  [ ] Manage users (search, filter, ban/unban)"
echo "  [ ] Reset user password (both methods)"
echo "  [ ] Approve/reject/delete tracks"
echo "  [ ] Moderate comments"

