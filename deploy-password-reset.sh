#!/bin/bash
set -e

echo "=== DEPLOYING PASSWORD RESET FEATURE ==="
echo ""

cd /root/islamic-soundcloud

echo "1. Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "2. Running password_resets table migration..."
docker compose exec -T app php artisan migrate --force

echo ""
echo "3. Clearing Laravel cache..."
docker compose exec -T app php artisan cache:clear
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan route:clear

echo ""
echo "4. Verifying password_resets table exists..."
docker compose exec -T app php artisan db:show

echo ""
echo "5. Restarting app container..."
docker compose restart app

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "✅ Password Reset Feature Deployed!"
echo ""
echo "📋 Test Instructions:"
echo "1. Go to: http://185.250.36.33:5173/login"
echo "2. Click 'Forgot password?' link"
echo "3. Enter your email address"
echo "4. Copy the reset URL from the response (development mode)"
echo "5. Paste the URL in browser"
echo "6. Enter new password (min 8 characters)"
echo "7. Click 'Reset Password'"
echo "8. You should be redirected to login"
echo "9. Login with your new password"
echo ""
echo "🔗 Direct URLs:"
echo "   - Forgot Password: http://185.250.36.33:5173/forgot-password"
echo "   - Login: http://185.250.36.33:5173/login"

