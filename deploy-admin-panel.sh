#!/bin/bash

echo "=== DEPLOYING ADMIN PANEL TO SERVER ==="
echo ""

cd /root/islamic-soundcloud

echo "=== Step 1: Pull latest code from GitHub ==="
git stash
git pull origin main
echo ""

echo "=== Step 2: Run migrations ==="
docker compose exec -T app php artisan migrate --force
echo ""

echo "=== Step 3: Clear all caches ==="
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan route:clear
docker compose exec -T app php artisan cache:clear
echo ""

echo "=== Step 4: Check routes are registered ==="
echo "Checking for admin routes..."
docker compose exec -T app php artisan route:list | grep admin
echo ""

echo "=== Step 5: Restart app container ==="
docker compose restart app
echo ""

echo "=== Step 6: Wait for app to start ==="
sleep 5
echo ""

echo "=== Step 7: Test admin stats endpoint ==="
docker compose exec -T app php artisan tinker --execute="
\$user = App\Models\User::first();
if (\$user && \$user->is_admin) {
    echo 'Admin user found: ' . \$user->email . PHP_EOL;
    echo 'Testing stats calculation...' . PHP_EOL;
    echo 'Total users: ' . App\Models\User::count() . PHP_EOL;
    echo 'Total tracks: ' . App\Models\Track::count() . PHP_EOL;
} else {
    echo 'WARNING: No admin user found or user is not admin!' . PHP_EOL;
}
"
echo ""

echo "=== DEPLOYMENT COMPLETE ==="
echo "Now try accessing: http://185.250.36.33:5173/admin"
echo "Press Ctrl+F5 to hard refresh the page"
