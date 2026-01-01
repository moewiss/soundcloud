#!/bin/bash
set -e

echo "=== FIXING CORRUPTED APP_KEY ==="
echo ""

cd /root/islamic-soundcloud

echo "1. Backing up current .env..."
docker compose exec -T app cp /var/www/html/.env /var/www/html/.env.backup

echo ""
echo "2. Removing corrupted APP_KEY line..."
docker compose exec -T app sed -i '/^APP_KEY=/d' /var/www/html/.env

echo ""
echo "3. Adding empty APP_KEY line..."
docker compose exec -T app sh -c "echo 'APP_KEY=' >> /var/www/html/.env"

echo ""
echo "4. Generating fresh APP_KEY..."
docker compose exec -T app php artisan key:generate

echo ""
echo "5. Verifying new APP_KEY..."
docker compose exec -T app grep APP_KEY /var/www/html/.env

echo ""
echo "6. Clearing Laravel cache..."
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan cache:clear

echo ""
echo "7. Restarting app container..."
docker compose restart app

echo ""
echo "=== APP_KEY FIXED! ==="
echo "✅ Try logging in now: http://185.250.36.33:5173/login"

