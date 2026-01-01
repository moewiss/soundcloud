#!/bin/bash
set -e

echo "=== COMPREHENSIVE DEBUG CHECK ==="
echo ""

cd /root/islamic-soundcloud

echo "1. Checking APP_KEY status..."
docker compose exec -T app php -r "echo 'APP_KEY: ' . (env('APP_KEY') ? 'SET ('.strlen(env('APP_KEY')).' chars)' : 'NOT SET') . PHP_EOL;"

echo ""
echo "2. Reading debug logs..."
docker compose exec -T app cat /var/www/html/storage/logs/debug.log 2>/dev/null || echo "No debug logs found"

echo ""
echo "3. Reading last 30 lines of Laravel logs..."
docker compose exec -T app tail -30 /var/www/html/storage/logs/laravel.log

echo ""
echo "4. Testing API endpoint directly..."
docker compose exec -T app curl -X POST http://localhost/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tarek.zaghloul@kiehsolution","password":"test123"}' \
  -v 2>&1 | tail -20

echo ""
echo "=== END OF DEBUG INFO ==="

