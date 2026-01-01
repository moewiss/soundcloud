#!/bin/bash
set -e

echo "=== CHECKING APP_KEY STATUS ==="
echo ""

cd /root/islamic-soundcloud

echo "1. Checking if APP_KEY is set in .env..."
docker compose exec -T app grep APP_KEY /var/www/html/.env || echo "APP_KEY not found in .env"

echo ""
echo "2. Generating APP_KEY if missing..."
docker compose exec -T app php artisan key:generate

echo ""
echo "3. Verifying APP_KEY is now set..."
docker compose exec -T app grep APP_KEY /var/www/html/.env

echo ""
echo "4. Clearing debug logs..."
docker compose exec -T app rm -f /var/www/html/storage/logs/debug.log

echo ""
echo "5. Restarting app container..."
docker compose restart app

echo ""
echo "=== APP_KEY FIXED - TRY LOGIN NOW ==="
echo "Go to: http://185.250.36.33:5173/login"

