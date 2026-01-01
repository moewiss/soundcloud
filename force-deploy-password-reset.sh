#!/bin/bash
set -e

echo "=== FORCE DEPLOYING PASSWORD RESET FEATURE ==="
echo ""

cd /root/islamic-soundcloud

echo "1. Stashing local changes..."
git stash

echo ""
echo "2. Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "3. Copying frontend build to proxy container..."
docker cp frontend/dist/. islamic-soundcloud-proxy-1:/var/www/frontend/

echo ""
echo "4. Running password_resets table migration..."
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
echo "✅ Password Reset Feature Deployed!"
echo ""
echo "📋 Test Instructions:"
echo "1. Go to: http://185.250.36.33:5173/login"
echo "2. Hard refresh with Ctrl+F5 (or Cmd+Shift+R)"
echo "3. Click 'Forgot password?' link (should now be visible)"
echo "4. Enter your email address"
echo "5. Copy the reset URL from the response (development mode)"
echo "6. Paste the URL in browser"
echo "7. Enter new password (min 8 characters)"
echo "8. Click 'Reset Password'"
echo "9. You should be redirected to login"
echo "10. Login with your new password"
echo ""
echo "🔗 Direct URLs:"
echo "   - Forgot Password: http://185.250.36.33:5173/forgot-password"
echo "   - Login: http://185.250.36.33:5173/login"

